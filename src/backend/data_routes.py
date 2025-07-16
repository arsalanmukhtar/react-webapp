from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Security,
)  # Import Security
from sqlalchemy.orm import Session
from typing import Dict

from .database import get_db
from .models import User
from .schemas import UserResponse
from .auth import (
    get_current_user,
)  # This will still be used for actual token validation

# Initialize FastAPI Router for data routes
router = APIRouter(
    prefix="/data", tags=["Data"]  # All routes in this file will start with /data
)


# Apply the custom security scheme to protected routes
# `security_scheme` is defined in main.py's openapi_extra
# We use get_current_user for the actual validation
@router.get(
    "/users/me", response_model=UserResponse, dependencies=[Depends(get_current_user)]
)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves the currently authenticated user's information.
    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.get("/public", response_model=Dict[str, str])
async def get_public_data():
    """
    A simple public endpoint to demonstrate data fetching without authentication.
    """
    return {"message": "This is public data, accessible to anyone!"}


# Apply the custom security scheme to protected routes
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
