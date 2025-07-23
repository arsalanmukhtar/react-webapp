from fastapi import Query# app/routes.py
from fastapi import APIRouter, HTTPException, Response
from typing import Dict, List
from . import tiling_operations as tile_ops
from .schemas import MapLayerState

router = APIRouter(
    prefix="/tiling",
    tags=["Tiling"]
)


@router.post("/layer-state")
async def update_layer_state(state: MapLayerState):
    """Update and return the current layer state (for backend logging/display)"""
    print(f"Backend received layer state: Table={state.table}, Tile={state.z}/{state.x}/{state.y}")
    return {
        "table": state.table,
        "tile": {
            "z": state.z,
            "x": state.x,
            "y": state.y,
            "url": f"/tiling/mvt/{state.table}/{state.z}/{state.x}/{state.y}.pbf"
        },
        "message": "Layer state received and logged."
    }


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
