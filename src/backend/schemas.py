from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base schema for user data."""

    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""

    username: str = Field(..., min_length=3, max_length=50)  # Added username field
    password: str = Field(..., min_length=8)  # Ensure password has a minimum length


class UserLogin(BaseModel): # Changed to inherit directly from BaseModel
    """Schema for user login using username and password."""
    username: str # Added username field
    password: str


class UserResponse(UserBase):
    """Schema for user response (data returned after creation/login)."""

    id: int
    username: str  # Added username to response schema
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration for ORM mode."""

        from_attributes = True  # Changed from orm_mode = True for Pydantic v2+


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for data contained within a JWT token."""

    username: Optional[str] = None # Changed from email to username


class ForgotPasswordRequest(BaseModel):
    """Schema for requesting a password reset."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for resetting password with a token."""

    token: str
    new_password: str = Field(..., min_length=8)

