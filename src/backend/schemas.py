from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    """Base schema for user data."""

    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""

    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Schema for user login using username and password."""
    username: str
    password: str


class UserResponse(UserBase):
    """Schema for user response (data returned after creation/login)."""

    id: int
    username: str
    is_active: bool
    is_verified: bool
    full_name: Optional[str] = None
    profile_pic: Optional[str] = None
    map_center_lat: Optional[float] = None
    map_center_lon: Optional[float] = None
    map_zoom: Optional[float] = None
    map_theme: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration for ORM mode."""

        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for data contained within a JWT token."""

    username: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    """Schema for requesting a password reset."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for resetting password with a token."""

    token: str
    new_password: str = Field(..., min_length=8)


# New Schemas for User Settings Updates
class UserSettingsUpdate(BaseModel):
    """Schema for updating user account settings."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=8)
    profile_pic: Optional[str] = None


class MapSettingsUpdate(BaseModel):
    """Schema for updating user map settings."""
    map_center_lat: Optional[float] = Field(None, ge=-90, le=90)
    map_center_lon: Optional[float] = Field(None, ge=-180, le=180)
    map_zoom: Optional[float] = Field(None, ge=0, le=22)
    map_theme: Optional[str] = None


# New Schemas for Data Explorer
class ColumnSchema(BaseModel):
    """Schema for a database table column."""
    name: str
    type: str
    nullable: bool
    default: Optional[Any] = None
    primary_key: bool
    autoincrement: bool
    comment: Optional[str] = None

class TableSchema(BaseModel):
    """Schema for a database table, including its columns and geometry type."""
    name: str
    columns: List[ColumnSchema]
    geometry_type: Optional[str] = None # Added geometry_type field

