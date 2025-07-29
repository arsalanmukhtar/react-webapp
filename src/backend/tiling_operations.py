# app/db_operations.py


from sqlalchemy import create_engine, text, inspect, MetaData, Table, select, and_, func, distinct, column
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine
from .config import settings
import mercantile
from typing import Dict, List, Optional, Tuple
from .database import engine, get_db_connection

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
            WHERE f_table_schema = 'layers' AND srid = 4326
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


def get_mvt_tile_from_db(table: str, z: int, x: int, y: int) -> Optional[bytes]:
    geom_column = get_geometry_column(table)
    if not geom_column:
        raise ValueError("Geometry column not found.")
    with engine.connect() as conn:
        attributes = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'layers' AND table_name = :table AND column_name != :geom_column
        """), {"table": table, "geom_column": geom_column}).fetchall()
        attributes_list = [row[0] for row in attributes]
        attributes_sql = ', '.join(f'"{attr}"' for attr in attributes_list) if attributes_list else "NULL"
        # *** SECTION 4: UPDATED MVT TILING QUERY (PYTHON F-STRING) ***

        query = f"""
            WITH bounds AS (SELECT ST_TileEnvelope(:z, :x, :y) AS geom),
                features_data AS (
                    SELECT
                        ST_AsMVTGeom(
                            -- Select the appropriate pre-simplified geometry based on zoom level
                            CASE
                                WHEN :z <= 3 THEN tbl.geom_z_0_3
                                WHEN :z BETWEEN 4 AND 6 THEN tbl.geom_z_3_6
                                WHEN :z BETWEEN 7 AND 9 THEN tbl.geom_z_6_10
                                ELSE ST_Transform(tbl.geom, 3857) -- Use original (high-res) geometry for zoom 10 and above
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
                                WHEN :z BETWEEN 4 AND 6 THEN tbl.geom_z_3_6
                                WHEN :z BETWEEN 7 AND 9 THEN tbl.geom_z_6_10
                                ELSE ST_Transform(tbl.geom, 3857) -- Use original (high-res) geometry for zoom 10 and above
                            END,
                            bounds.geom
                        )
                )
            SELECT ST_AsMVT(features_data.*, 'features') FROM features_data
        """
        
        result = conn.execute(text(query), {"z": z, "x": x, "y": y}).fetchone()
        return result[0] if result else None

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
        if srid != 4326:
            return {"valid": False, "error": f"Table must use SRID 4326. Found: {srid}"}
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
