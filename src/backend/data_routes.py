from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Security,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import inspect, text # Import text for raw SQL queries
from typing import Dict, Optional, List, Any

from .database import get_db, engine
from .models import User
from .schemas import UserResponse, UserSettingsUpdate, MapSettingsUpdate, TableSchema, ColumnSchema
from .auth import (
    get_current_user,
    get_password_hash
)

# Initialize FastAPI Router for data routes
router = APIRouter(
    prefix="/data", tags=["Data"]
)


@router.get(
    "/users/me", response_model=UserResponse, dependencies=[Depends(get_current_user)]
)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves the currently authenticated user's information, including profile and map settings.
    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.put(
    "/users/me/settings/account",
    response_model=UserResponse,
    dependencies=[Depends(get_current_user)],
)
async def update_user_account_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's account settings (full name, password, profile picture).
    Requires a valid JWT token.
    """
    update_fields = {
        "full_name": settings_update.full_name,
        "password": settings_update.password,
        "profile_pic": settings_update.profile_pic,
    }

    updates = {k: v for k, v in update_fields.items() if v is not None}

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update."
        )

    if "password" in updates:
        current_user.hashed_password = get_password_hash(updates["password"])
        del updates["password"]

    for key, value in updates.items():
        setattr(current_user, key, value)

    try:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return current_user
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Database integrity error: {e.orig.pgerror if hasattr(e.orig, 'pgerror') else e}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating account settings: {e}"
        )


@router.put(
    "/users/me/settings/map",
    response_model=UserResponse,
    dependencies=[Depends(get_current_user)],
)
async def update_user_map_settings(
    settings_update: MapSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's map settings (center latitude, longitude, zoom, theme).
    Requires a valid JWT token.
    """
    if settings_update.map_center_lat is not None:
        current_user.map_center_lat = settings_update.map_center_lat
    if settings_update.map_center_lon is not None:
        current_user.map_center_lon = settings_update.map_center_lon
    if settings_update.map_zoom is not None:
        current_user.map_zoom = settings_update.map_zoom
    if settings_update.map_theme is not None:
        current_user.map_theme = settings_update.map_theme

    try:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return current_user
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Database integrity error: {e.orig.pgerror if hasattr(e.orig, 'pgerror') else e}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating map settings: {e}"
        )


@router.get("/public", response_model=Dict[str, str])
async def get_public_data():
    """
    A simple public endpoint to demonstrate data fetching without authentication.
    """
    return {"message": "This is public data, accessible to anyone!"}


@router.get(
    "/protected",
    response_model=Dict[str, str],
    dependencies=[Depends(get_current_user)],
)
async def get_protected_data(current_user: User = Depends(get_current_user)):
    """
    A protected endpoint to demonstrate data fetching with authentication.
    """
    return {"message": f"Hello {current_user.username}, this is protected data!"}


@router.get("/layers/tables", response_model=List[TableSchema])
async def get_layers_tables():
    """
    Returns a list of all table names within the 'layers' schema, along with their column properties and geometry type.
    This is a public route.
    """
    inspector = inspect(engine)
    try:
        table_names = inspector.get_table_names(schema='layers')
        
        tables_data = []
        with engine.connect() as connection:
            for table_name in table_names:
                columns_data = []
                table_geometry_type = None
                
                # Query geometry_columns for the table's geometry type
                # This assumes a PostGIS database with the geometry_columns view
                geometry_query = text(f"""
                    SELECT type
                    FROM geometry_columns
                    WHERE f_table_schema = 'layers' AND f_table_name = :table_name
                    LIMIT 1;
                """)
                result = connection.execute(geometry_query, {"table_name": table_name}).fetchone()
                if result:
                    table_geometry_type = result[0] # The 'type' column from geometry_columns

                columns = inspector.get_columns(table_name, schema='layers')
                for col in columns:
                    columns_data.append(ColumnSchema(
                        name=col['name'],
                        type=str(col['type']),
                        nullable=col['nullable'],
                        default=col.get('default'),
                        primary_key=col.get('primary_key', False),
                        autoincrement=col.get('autoincrement', False),
                        comment=col.get('comment')
                    ))
                
                tables_data.append(TableSchema(name=table_name, columns=columns_data, geometry_type=table_geometry_type))
        
        return tables_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve tables from 'layers' schema: {e}"
        )

