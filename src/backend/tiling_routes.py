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
            "url": f"{origin}/api/tiling/mvt/layers/{name}/{z}/{x}/{y}.pbf"
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
async def get_mvt_tile(table: str, z: int, x: int, y: int):
    try:
        tile_data = tile_ops.get_mvt_tile_from_db(table, z, x, y)
        if not tile_data:
            print(f"Server debug: No MVT data generated for layers.{table} tile {z}/{x}/{y}.")
            return Response(b'', media_type="application/x-protobuf")
        return Response(
            content=bytes(tile_data),
            media_type="application/x-protobuf",
            headers={
                "X-MVT-Layers": "features",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except RuntimeError as e:
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
