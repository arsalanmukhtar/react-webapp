from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.openapi.utils import get_openapi  # Import get_openapi

from .database import create_db_tables
from .auth_routes import router as auth_router
from .data_routes import router as data_router
from .tiling_routes import router as tiling_router


# Define the lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Event handler that runs when the FastAPI application starts up and shuts down.
    It creates all database tables if they don't already exist on startup.
    In a production environment, you would typically use Alembic for migrations.
    """
    print("Creating database tables if they don't exist...")
    create_db_tables()
    print("Database tables creation complete.")
    yield  # Application starts here
    # Code after yield runs on shutdown (optional for this example)
    print("FastAPI application is shutting down.")


# Initialize FastAPI app, passing the lifespan context manager
app = FastAPI(
    title="Backend APIs for User Authentication and Map Data",
    description="A simple FastAPI application with user authentication features and map data visualization.",
    version="0.1.0",
    lifespan=lifespan,  # Use the new lifespan context manager
)


# Custom OpenAPI schema generation to define BearerAuth
def custom_openapi():
    """
    Overrides the default OpenAPI schema to add a custom BearerAuth security scheme.
    This ensures Swagger UI presents a simple token input for authorization.
    """
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # Define the BearerAuth security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token in the format **Bearer <token>**",
        }
    }
    # Apply this security scheme globally to all endpoints by default
    # Individual endpoints can override this with their own `security` parameter
    openapi_schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Apply the custom OpenAPI function to the FastAPI app
app.openapi = custom_openapi

# Configure CORS middleware
# Adjust `allow_origins` to your frontend's URL in a production environment.
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",  # Your React app's development port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
# Include the authentication routes under the /auth prefix
app.include_router(auth_router, prefix="/api")
# Include the data routes under the /data prefix
app.include_router(data_router, prefix="/api")
# Include the tiling routes under the /tiling prefix
app.include_router(tiling_router, prefix="/api")


# You can add a simple root endpoint if desired
@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI backend!"}
