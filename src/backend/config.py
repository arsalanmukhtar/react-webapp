import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path='.env.local')


class Settings:
    """
    Application settings loaded from environment variables.
    """

    DATABASE_URL: str = os.getenv("DATABASE_URL")
    DOCKER_DATABASE_URL: str = os.getenv("DOCKER_DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    SMTP_SERVER: str = os.getenv("SMTP_SERVER")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD")


settings = Settings()