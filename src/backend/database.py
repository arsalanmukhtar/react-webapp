from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings  # Changed to relative import

# Create the SQLAlchemy engine
# The `echo=True` argument logs all SQL statements to the console, useful for debugging.

# engine = create_engine(settings.DATABASE_URL, echo=False)
engine = create_engine(settings.DOCKER_DATABASE_URL, echo=False)

# Create a SessionLocal class
# This class will be used to create database sessions.
# `autocommit=False` means changes are not committed automatically.
# `autoflush=False` means changes are not flushed to the database automatically.
# `bind=engine` links the session to our database engine.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declare a Base for our declarative models
# All SQLAlchemy models will inherit from this Base.
Base = declarative_base()


def get_db():
    """
    Dependency to get a database session.
    This function will be used with FastAPI's Depends system to manage database sessions.
    It ensures that the session is closed after the request is processed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# This function is for creating all defined tables in the database.
# It's useful for initial setup but for production, consider using Alembic for migrations.
def get_db_connection():
    """
    Get a raw database connection for executing SQL queries.
    Use this for raw SQL operations like in tiling_operations.
    """
    return engine.connect()


def create_db_tables():
    """
    Creates all tables defined in the Base metadata.
    Call this function once, for example, when the application starts,
    to ensure your database schema is up-to-date.
    """
    Base.metadata.create_all(bind=engine)
