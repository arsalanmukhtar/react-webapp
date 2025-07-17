from sqlalchemy import Column, Integer, String, Boolean, Float, Text # Import Text for XML/large string
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
from .database import Base


class User(Base):
    """
    SQLAlchemy model for the 'users' table.
    Represents a user in the database with their authentication details and settings.
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(
        String, unique=True, index=True, nullable=False
    )
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Token for password reset, expires after a certain time
    reset_token = Column(String, nullable=True)
    reset_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # New fields for User Profile and Settings
    full_name = Column(String, nullable=True) # New: For user's full name
    profile_pic = Column(Text, nullable=True) # New: To store XML representation of image

    # New fields for Map Settings
    map_center_lat = Column(Float, default=0.0) # Default to 0,0
    map_center_lon = Column(Float, default=0.0)
    map_zoom = Column(Float, default=2.0) # Default zoom level
    map_theme = Column(String, default="mapbox://styles/mapbox/streets-v11") # Default Mapbox theme

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        """
        String representation of the User object, useful for debugging.
        """
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

