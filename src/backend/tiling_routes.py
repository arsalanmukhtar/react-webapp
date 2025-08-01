from fastapi import APIRouter, HTTPException, Response, Request, Query, Depends
from typing import Dict, List
from . import tiling_operations as tile_ops
from .auth import get_current_user
from .database import SessionLocal
from sqlalchemy import text
import re

router = APIRouter(
    prefix="/tiling",
    tags=["Tiling"]
)

@router.get("/layer-state")
async def get_layer_state(request: Request, user=Depends(get_current_user)):
    """Update and return the current layer state (for backend logging/display)"""

    # Get the current browser URL from the query parameter (sent by frontend)
    browser_url = request.query_params.get("browser_url", "")

    query = text("SELECT original_name FROM map_layers WHERE user_id = :user_id")
    db = SessionLocal()
    try:
        result = db.execute(query, {"user_id": user.id})
        layer_names = [row[0] for row in result.fetchall()]
    finally:
        db.close()

    def extract_zxy(url):
        # Expect hash like #z/x/y
        match = re.search(r'#(\d+)/(\d+)/(\d+)', url)
        if match:
            return match.group(1), match.group(2), match.group(3)
        return 'z', 'x', 'y'

    z, x, y = extract_zxy(browser_url)
    # Use request.base_url to get the backend's origin (e.g., http://localhost:8000/)
    origin = str(request.base_url).rstrip('/')
    layers = [
        {
            "name": name,
            "url": f"{origin}/api/tiling/mvt/{name}/{{z}}/{{lat}}/{{lon}}.pbf"
        }
        for name in layer_names
    ]
    return {"layers": layers}


# Route to convert lat/lon/zoom to tile z/x/y
@router.get("/tile-coords")
async def latlon_to_tile(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    zoom: int = Query(..., description="Zoom level"),
):
    """
    Convert latitude, longitude, and zoom to tile z, x, y numbers.
    """
    return tile_ops.latlon_to_tile_coords(lat, lon, zoom)


@router.get("/mvt/{table}/{z}/{x}/{y}.pbf")
async def get_mvt_tile(
    table: str, 
    z: int,  # Tile zoom level
    x: int,  # Tile X coordinate 
    y: int   # Tile Y coordinate
):
    try:
        # z, x, y are already tile coordinates from the URL path
        tile_z = z
        tile_x = x
        tile_y = y
        
        print(f"Server debug: Generating MVT for {table} at tile coordinates z={tile_z}, x={tile_x}, y={tile_y}")
        
        # Add validation
        if tile_z < 0 or tile_z > 22:
            raise HTTPException(400, detail=f"Invalid zoom level: {tile_z}. Must be between 0 and 22.")
        
        max_coord = 2 ** tile_z - 1
        if tile_x < 0 or tile_x > max_coord or tile_y < 0 or tile_y > max_coord:
            raise HTTPException(400, detail=f"Invalid tile coordinates: x={tile_x}, y={tile_y}. Must be between 0 and {max_coord} for zoom {tile_z}.")

        # Check if table exists first
        print(f"Server debug: Calling get_mvt_tile_from_db with parameters: table={table}, z={tile_z}, x={tile_x}, y={tile_y}")
        
        tile_data = tile_ops.get_mvt_tile_from_db(table, tile_z, tile_x, tile_y)
        
        if not tile_data:
            print(f"Server debug: No MVT data generated for layers.{table} tile {tile_z}/{tile_x}/{tile_y}")
            return Response(b'', media_type="application/x-protobuf")
        
        print(f"Server debug: Successfully generated MVT tile for {table}, size: {len(tile_data)} bytes")
        return Response(
            content=bytes(tile_data),
            media_type="application/x-protobuf",
            headers={
                "X-MVT-Layers": "features",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch and log any other exception with full details
        import traceback
        error_details = traceback.format_exc()
        print(f"Server error: Detailed traceback for {table} tile {z}/{x}/{y}:")
        print(error_details)
        raise HTTPException(500, detail=f"Failed to generate MVT tile for {table}: {str(e)}")
    except RuntimeError as e:
        print(f"Server error: RuntimeError for {table} tile {z}/{x}/{y}: {str(e)}")
        raise HTTPException(500, detail=f"Failed to generate MVT tile: {str(e)}")
    except Exception as e:
        raise HTTPException(500, detail=f"An unexpected error occurred during tile generation: {str(e)}")

@router.get("/geometry-type/{table}")
async def get_table_geometry_type(table: str):
    """Get the geometry type for a table"""
    try:
        geom_type = tile_ops.get_geometry_type_from_db(table)
        if not geom_type:
            raise HTTPException(status_code=400, detail="No valid geometry found or table is empty")
        return {"geometryType": geom_type}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Error getting geometry type: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/extent/{table}")
async def get_table_extent(table: str):
    """Get the bounding box of a table's geometry"""
    try:
        bounds = tile_ops.get_table_extent_from_db(table)
        if not bounds:
            raise HTTPException(status_code=404, detail="No geometry data found or extent is null.")
        return {"bounds": bounds}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Error getting table extent: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/check-srid/{table}")
async def check_srid(table: str):
    """Check if the geometry column has a valid SRID and is 4326."""
    try:
        srid_check_result = tile_ops.check_srid_from_db(table)
        return srid_check_result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"SRID check failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/fields/{table}")
async def get_table_fields(table: str):
    """
    Retrieve all column names from a specific table in the 'layers' schema.
    Returns a list of field names suitable for labeling.
    """
    try:
        fields = tile_ops.get_table_fields_from_db(table)
        if not fields:
            raise HTTPException(status_code=404, detail="No non-geometry fields found in table.")
        return {"fields": fields}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch table fields: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/layers/filter/{layer_name}")
async def get_layer_filter(layer_name: str):
    """
    Retrieve filter configuration for a specific layer from the layer_filters table.
    Returns the filter configuration that can be applied to map layers.
    """
    try:
        filter_config = tile_ops.get_layer_filter_config(layer_name)
        if not filter_config:
            return {"filter_config": None, "message": f"No filter configuration found for layer: {layer_name}"}
        return {"filter_config": filter_config}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch layer filter: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
