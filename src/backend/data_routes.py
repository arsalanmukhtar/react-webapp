from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Security,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError # Import IntegrityError
from typing import Dict, Optional

from .database import get_db
from .models import User
from .schemas import UserResponse, UserSettingsUpdate, MapSettingsUpdate
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
        "profile_pic": settings_update.profile_pic
    }
    if not any(v is not None for v in update_fields.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field (full_name, password, or profile_pic) must be provided for update.",
        )

    if settings_update.full_name is not None:
        current_user.full_name = settings_update.full_name

    if settings_update.password is not None:
        current_user.hashed_password = get_password_hash(settings_update.password)

    if settings_update.profile_pic is not None:
        current_user.profile_pic = settings_update.profile_pic

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
    Updates the authenticated user's map settings (center, zoom, theme).
    Requires a valid JWT token.
    """
    update_fields = {
        "map_center_lat": settings_update.map_center_lat,
        "map_center_lon": settings_update.map_center_lon,
        "map_zoom": settings_update.map_zoom,
        "map_theme": settings_update.map_theme
    }
    if not any(v is not None for v in update_fields.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field (map_center_lat, map_center_lon, map_zoom, or map_theme) must be provided for update.",
        )

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
    A protected endpoint to demonstrate data fetching that requires authentication.
    """
    return {"message": f"Hello {current_user.email}, this is protected data!"}
