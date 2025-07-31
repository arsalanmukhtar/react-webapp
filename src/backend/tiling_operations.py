# app/db_operations.py

import os
import shutil # Used for clearing cache in example usage, remove if not needed in production
import time   # Used for os.utime and time.sleep in mock/demo

from sqlalchemy import create_engine, text, inspect, MetaData, Table, select, and_, func, distinct, column
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine
from .config import settings
import mercantile
from typing import Dict, List, Optional, Tuple
from .database import engine, get_db_connection, SessionLocal
from .models import LayerFilter

"""
MVT Tiling Operations with Optimized Point Clustering

This module provides MVT (Mapbox Vector Tile) generation with intelligent handling of different geometry types:

1. **Polygon/LineString Data**: Uses pre-simplified geometries at different zoom levels for performance
   - Zoom 0-3: Heavily simplified (geom_z_0_3) 
   - Zoom 4-6: Medium simplified (geom_z_3_6)
   - Zoom 7-9: Lightly simplified (geom_z_6_10)
   - Zoom 10+: Original geometry

2. **Point Data**: Uses intelligent clustering to reduce visual clutter and improve performance
   - Zoom 0-6: Heavy clustering (64px grid, ~100m tolerance)
   - Zoom 7-12: Medium clustering (32px grid, ~50m tolerance)  
   - Zoom 13+: Individual points (no clustering)

Point clustering uses ST_SnapToGrid to group nearby points and ST_Centroid to create cluster representatives.
Each cluster includes a 'point_count' attribute showing how many original points it represents.

**Note**: All geometry tables are expected to be in EPSG:3857 (Web Mercator) projection for optimal performance.
No coordinate transformations are performed during tile generation.
"""

# --- LOCAL FILE SYSTEM CACHE CONFIGURATION ---
CACHE_DIR = "local_tile_cache"
CACHE_LIMIT_GB = 10
CACHE_LIMIT_BYTES = CACHE_LIMIT_GB * 1024 * 1024 * 1024 # 10 GB in bytes
CLEAN_THRESHOLD_PERCENT = 0.90 # When cache exceeds limit, clean down to 90% of the limit

# Ensure the base cache directory exists on module import
os.makedirs(CACHE_DIR, exist_ok=True)

# --- CACHE HELPER FUNCTIONS ---

def _get_dir_size(path: str) -> int:
    """Calculates the total size of files within a directory recursively."""
    total_size = 0
    if not os.path.exists(path):
        return 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            # Skip if it's a symbolic link or if access is denied
            if not os.path.islink(fp) and os.path.exists(fp):
                try:
                    total_size += os.path.getsize(fp)
                except OSError as e:
                    print(f"Warning: Could not get size of {fp}: {e}") # Consider using logging
    return total_size

def _get_all_files(directory: str) -> List[str]:
    """Gets a list of all file paths in a directory recursively."""
    file_paths = []
    if not os.path.exists(directory):
        return []
    for dirpath, dirnames, filenames in os.walk(directory):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp): # Ignore symlinks for eviction
                file_paths.append(fp)
    return file_paths

def _clean_cache():
    """
    Cleans the cache by deleting the least recently accessed files
    until the total cache size is below the target cleanup threshold.
    """
    current_size = _get_dir_size(CACHE_DIR)
    print(f"Current cache size: {current_size / (1024*1024):.2f} MB / {CACHE_LIMIT_GB} GB")

    if current_size <= CACHE_LIMIT_BYTES:
        return # No cleaning needed if under the hard limit

    print(f"Cache size exceeds {CACHE_LIMIT_GB} GB. Starting cleanup...")

    # Get all files with their access times
    files_with_atime = []
    all_files = _get_all_files(CACHE_DIR)
    for f_path in all_files:
        try:
            # os.path.getatime() gets the last access time
            # For LRU, access time is usually more appropriate.
            atime = os.path.getatime(f_path)
            files_with_atime.append((f_path, atime))
        except OSError as e:
            print(f"Warning: Could not get access time for {f_path}: {e}") # Consider using logging
            continue

    # Sort files by access time (oldest first)
    files_with_atime.sort(key=lambda x: x[1])

    bytes_removed = 0
    # Clean until we are below the target size (e.g., 90% of the limit)
    cleanup_target = CACHE_LIMIT_BYTES * CLEAN_THRESHOLD_PERCENT

    for f_path, _ in files_with_atime:
        if current_size <= cleanup_target:
            break # Stop cleaning once we are below the target

        try:
            file_size = os.path.getsize(f_path)
            os.remove(f_path)
            current_size -= file_size
            bytes_removed += file_size
            print(f"  Deleted: {f_path} (Size: {file_size / (1024*1024):.2f} MB)") # Consider using logging
        except OSError as e:
            print(f"Error deleting file {f_path}: {e}") # Consider using logging
            pass # Keep going, try next file

    print(f"Cleanup finished. Removed {bytes_removed / (1024*1024):.2f} MB.") # Consider using logging
    print(f"New cache size: {current_size / (1024*1024):.2f} MB / {CACHE_LIMIT_GB} GB") # Consider using logging


# --- ORIGINAL DB HELPER FUNCTIONS (UNCHANGED) ---

def get_geometry_column(table: str) -> Optional[str]:
    with get_db_connection() as conn:
        result = conn.execute(
            text("""
                SELECT f_geometry_column
                FROM geometry_columns
                WHERE f_table_schema = 'layers' AND f_table_name = :table
            """),
            {"table": table}
        ).fetchone()
        return result[0] if result else None

def get_tables() -> List[str]:
    with engine.connect() as conn:
        tables = conn.execute(text("""
            SELECT DISTINCT f_table_name
            FROM public.geometry_columns
            WHERE f_table_schema = 'layers' AND srid = 3857
        """)).fetchall()
        return [row[0] for row in tables]

def get_tile_bounds(z: int, x: int, y: int) -> Tuple[float, float, float, float]:
    tile = mercantile.Tile(x, y, z)
    bounds = mercantile.bounds(tile)
    return bounds.west, bounds.south, bounds.east, bounds.north

def get_geometry_type_from_db(table: str) -> Optional[str]:
    geom_column = get_geometry_column(table)
    if not geom_column:
        return None
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT DISTINCT ST_GeometryType({geom_column}) AS geom_type
            FROM layers.{table}
            WHERE {geom_column} IS NOT NULL
            LIMIT 1
        """)).fetchone()
        return result[0] if result else None

def latlon_to_tile_coords(lat: float, lon: float, zoom: int):
    """
    Given latitude, longitude, and zoom, return the corresponding tile z, x, y.
    """
    tile = mercantile.tile(lon, lat, zoom)
    return {"z": tile.z, "x": tile.x, "y": tile.y}

def _build_point_clustering_query(table: str, geom_column: str, attributes_list: List[str], z: int) -> str:
    """
    Build a PostGIS query for point clustering based on zoom level.
    
    Clustering strategy:
    - Zoom 0-6: Heavy clustering (large grid)
    - Zoom 7-12: Medium clustering (smaller grid) 
    - Zoom 13+: Individual points (no clustering)
    """
    
    # Define clustering grid size based on zoom level (in pixels)
    if z <= 6:
        # Heavy clustering for low zoom levels
        cluster_grid_size = 64  # 64x64 pixel grid
        cluster_tolerance = 0.001  # ~100m tolerance for clustering
    elif z <= 12:
        # Medium clustering for medium zoom levels
        cluster_grid_size = 32  # 32x32 pixel grid
        cluster_tolerance = 0.0005  # ~50m tolerance for clustering
    else:
        # No clustering for high zoom levels - show individual points
        cluster_grid_size = None
        cluster_tolerance = None
    
    # Build attributes SQL - for clustering, we'll aggregate some attributes
    if attributes_list:
        # For clustered points, we'll take the first value of each attribute
        # and add a count field
        if cluster_grid_size is not None:
            attributes_sql = ', '.join([
                f'(array_agg("{attr}" ORDER BY "{attr}"))[1] AS "{attr}"' 
                for attr in attributes_list if attr not in ['id', 'gid', 'fid']  # Skip ID fields
            ])
            if attributes_sql:
                attributes_sql += ', COUNT(*) AS point_count'
            else:
                attributes_sql = 'COUNT(*) AS point_count'
        else:
            # Individual points - use all attributes
            attributes_sql = ', '.join(f'"{attr}"' for attr in attributes_list)
    else:
        attributes_sql = 'COUNT(*) AS point_count' if cluster_grid_size is not None else 'NULL'
    
    if cluster_grid_size is not None:
        # Clustering query using ST_SnapToGrid for spatial clustering
        # Tables are already in 3857 projection, no ST_Transform needed
        query = f"""
            WITH bounds AS (SELECT ST_TileEnvelope(:z, :x, :y) AS geom),
                clustered_points AS (
                    SELECT
                        ST_Centroid(
                            ST_Collect(tbl.{geom_column})
                        ) AS cluster_geom,
                        {attributes_sql}
                    FROM layers.{table} tbl, bounds
                    WHERE ST_Intersects(tbl.{geom_column}, bounds.geom)
                      AND tbl.{geom_column} IS NOT NULL
                    GROUP BY ST_SnapToGrid(tbl.{geom_column}, {cluster_tolerance})
                    HAVING COUNT(*) > 0
                ),
                features_data AS (
                    SELECT
                        ST_AsMVTGeom(
                            cp.cluster_geom,
                            bounds.geom,
                            4096,
                            {cluster_grid_size},
                            true
                        ) AS geom,
                        cp.*
                    FROM clustered_points cp
                    CROSS JOIN bounds
                    WHERE cp.cluster_geom IS NOT NULL
                      AND ST_Intersects(cp.cluster_geom, bounds.geom)
                )
            SELECT ST_AsMVT(features_data.*, 'features') FROM features_data
        """
    else:
        # Individual points query (no clustering)
        # Tables are already in 3857 projection, no ST_Transform needed
        query = f"""
            WITH bounds AS (SELECT ST_TileEnvelope(:z, :x, :y) AS geom),
                features_data AS (
                    SELECT
                        ST_AsMVTGeom(
                            tbl.{geom_column},
                            bounds.geom,
                            4096,
                            256,
                            true
                        ) AS geom,
                        {attributes_sql}
                    FROM layers.{table} tbl, bounds
                    WHERE ST_Intersects(tbl.{geom_column}, bounds.geom)
                      AND tbl.{geom_column} IS NOT NULL
                )
            SELECT ST_AsMVT(features_data.*, 'features') FROM features_data
        """
    
    return query

# --- ACTUAL DB FETCH FUNCTION (RENAMED TO BE PRIVATE) ---
def _get_mvt_tile_from_db_actual(table: str, z: int, x: int, y: int) -> Optional[bytes]:
    """
    Internal function to fetch and generate an MVT tile directly from the database.
    Handles both polygon/line geometries (with simplification) and point geometries (with clustering).
    """
    geom_column = get_geometry_column(table)
    if not geom_column:
        raise ValueError("Geometry column not found.")
    
    # Check if this is point data
    geom_type = get_geometry_type_from_db(table)
    is_point_data = geom_type and 'POINT' in geom_type.upper()
    
    with engine.connect() as conn:
        attributes = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'layers' AND table_name = :table AND column_name != :geom_column
        """), {"table": table, "geom_column": geom_column}).fetchall()
        attributes_list = [row[0] for row in attributes]
        
        if is_point_data:
            # Point clustering query
            query = _build_point_clustering_query(table, geom_column, attributes_list, z)
        else:
            # Polygon/Line simplification query
            # Tables are already in 3857 projection, no ST_Transform needed
            attributes_sql = ', '.join(f'"{attr}"' for attr in attributes_list) if attributes_list else "NULL"
            query = f"""
                WITH bounds AS (SELECT ST_TileEnvelope(:z, :x, :y) AS geom),
                    features_data AS (
                        SELECT
                            ST_AsMVTGeom(
                                -- Select the appropriate pre-simplified geometry based on zoom level
                                CASE
                                    WHEN :z <= 3 THEN tbl.geom_z_0_3    -- 1000m tolerance
                                    WHEN :z > 3 AND :z <= 6 THEN tbl.geom_z_3_6   -- 500m tolerance
                                    WHEN :z > 6 AND :z <= 10 THEN tbl.geom_z_6_10  -- 250m tolerance
                                    ELSE tbl.geom -- Use original (high-res) geometry for zoom 11 and above
                                END,
                                bounds.geom,
                                4096,
                                256,
                                true
                            ) AS geom,
                            {attributes_sql}
                        FROM layers.{table} tbl, bounds
                        WHERE ST_Intersects(
                                -- Ensure the WHERE clause also uses the appropriate pre-simplified geometry
                                CASE
                                    WHEN :z <= 3 THEN tbl.geom_z_0_3
                                    WHEN :z > 3 AND :z <= 6 THEN tbl.geom_z_3_6
                                    WHEN :z > 6 AND :z <= 10 THEN tbl.geom_z_6_10
                                    ELSE tbl.geom -- Use original (high-res) geometry for zoom 11 and above
                                END,
                                bounds.geom
                            )
                    )
                SELECT ST_AsMVT(features_data.*, 'features') FROM features_data
            """
        
        result = conn.execute(text(query), {"z": z, "x": x, "y": y}).fetchone()
        return result[0] if result else None

# --- PUBLIC MVT TILE FETCH FUNCTION WITH CACHING ---
def get_mvt_tile_from_db(table: str, z: int, x: int, y: int) -> Optional[bytes]:
    """
    Fetches an MVT tile, using a local file system cache with a size limit.
    If the tile is not in cache, it generates it from the database and stores it.
    """
    # Define the cache path for this tile
    tile_dir = os.path.join(CACHE_DIR, table, str(z), str(x))
    tile_path = os.path.join(tile_dir, f"{y}.mvt")

    # 1. Try to fetch from local disk cache
    if os.path.exists(tile_path):
        try:
            # Update access time to make it "recently used" for LRU eviction
            os.utime(tile_path, None) 
            print(f"✅ Served tile {table}/{z}/{x}/{y} from local disk cache.")
            with open(tile_path, "rb") as f:
                return f.read()
        except OSError as e:
            print(f"Error accessing cached tile {tile_path}: {e}. Regenerating...")
            # Fall through to regeneration if cached tile is inaccessible

    # 2. Cache miss: Generate from database
    print(f"Cache miss for tile {table}/{z}/{x}/{y}. Generating from DB...")
    
    # Ensure the directory structure for this tile exists
    os.makedirs(tile_dir, exist_ok=True)

    # Call the actual DB fetching function (renamed private function)
    tile_data = _get_mvt_tile_from_db_actual(table, z, x, y)

    # 3. If generated successfully, store in local disk cache and then clean
    if tile_data:
        try:
            with open(tile_path, "wb") as f:
                f.write(tile_data)
            print(f"💾 Stored tile {table}/{z}/{x}/{y} to local disk cache.")
            
            # After writing, check and clean cache if needed
            _clean_cache() 
        except OSError as e:
            print(f"Error writing tile {tile_path} to cache: {e}") # Consider logging
            # Do not return None, still return the generated tile even if caching failed
    
    return tile_data

# --- REMAINING ORIGINAL DB HELPER FUNCTIONS (UNCHANGED) ---

def get_table_extent_from_db(table: str) -> Optional[Dict[str, float]]:
    geom_column = get_geometry_column(table)
    if not geom_column:
        return None
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT ST_XMin(ST_Extent({geom_column})) as minx,
                   ST_YMin(ST_Extent({geom_column})) as miny,
                   ST_XMax(ST_Extent({geom_column})) as maxx,
                   ST_YMax(ST_Extent({geom_column})) as maxy
            FROM layers.{table}
            WHERE {geom_column} IS NOT NULL
        """)).fetchone()
        if not result or None in result:
            return None
        return {
            "west": float(result[0]),
            "south": float(result[1]),
            "east": float(result[2]),
            "north": float(result[3])
        }

def check_srid_from_db(table: str) -> Dict[str, any]:
    geom_column = get_geometry_column(table)
    if not geom_column:
        return {"valid": False, "error": "No geometry column found."}
    with engine.connect() as conn:
        result = conn.execute(text(f"""
            SELECT ST_SRID({geom_column}) AS srid
            FROM layers.{table}
            WHERE {geom_column} IS NOT NULL
            LIMIT 1
        """)).fetchone()
        if not result or result[0] is None:
            return {"valid": False, "error": "SRID not found or no geometries."}
        srid = result[0]
        if srid == 0:
            return {"valid": False, "error": "Invalid SRID (0). Please set a valid SRID."}
        if srid != 3857:
            return {"valid": False, "error": f"Table must use SRID 3857 (Web Mercator). Found: {srid}"}
        return {"valid": True, "srid": srid}

def get_table_fields_from_db(table: str) -> List[Dict[str, str]]:
    geom_column = get_geometry_column(table)
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'layers' AND table_name = :table AND column_name != :geom_column
            ORDER BY column_name
        """), {"table": table, "geom_column": geom_column or 'geom'}).fetchall()
        return [{"name": row[0]} for row in result]

# --- LAYER FILTER FUNCTIONS ---

def get_layer_filter_from_db(layer_name: str) -> Optional[Dict]:
    """
    Get the filter configuration for a specific layer from the layers_filters table.
    Returns the filter dictionary that should be applied to the layer.
    """
    db = SessionLocal()
    try:
        print(f"🔍 Looking for filter for layer: '{layer_name}'")
        layer_filter = db.query(LayerFilter).filter(LayerFilter.layer_name == layer_name).first()
        
        if layer_filter:
            print(f"✅ Found filter record for layer: '{layer_name}'")
            if layer_filter.layer_filter:
                print(f"✅ Filter data exists: {type(layer_filter.layer_filter)}")
                # The layer_filter is stored directly as the filter array
                # Return it in the expected format with a "filter" key
                return {"filter": layer_filter.layer_filter}
            else:
                print(f"⚠️ Filter record found but layer_filter is null/empty")
        else:
            print(f"❌ No filter record found for layer: '{layer_name}'")
            # Let's check what layer names exist in the database
            all_filters = db.query(LayerFilter).all()
            print(f"📋 Available layer names in database: {[f.layer_name for f in all_filters]}")
        
        return None
    except Exception as e:
        print(f"❌ Error fetching filter for layer {layer_name}: {e}")
        return None
    finally:
        db.close()

def apply_layer_filter(layer_name: str, zoom: int = None) -> Optional[Dict]:
    """
    Apply appropriate filters to a layer based on its name.
    Simply retrieves filter from the layers_filters table based on layer_name match.
    
    Args:
        layer_name: Name of the layer to get filters for
        zoom: Current map zoom level (not used, kept for compatibility)
    
    Returns:
        Dictionary containing the filter configuration or None if no filter needed
    """
    print(f"🎯 apply_layer_filter called for layer: '{layer_name}'")
    
    # Get filter from database based on layer name
    db_filter = get_layer_filter_from_db(layer_name)
    
    if db_filter:
        print(f"✅ Using database filter for layer: '{layer_name}'")
        return db_filter
    
    print(f"� No filter found for layer: '{layer_name}'")
    return None