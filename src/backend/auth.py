from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from email_validator import validate_email, EmailNotValidError # type: ignore[import-untyped]
import aiosmtplib # type: ignore[import-untyped]
from uuid import uuid4

from .config import settings
from .database import get_db
from .models import User
from .schemas import TokenData

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer for token extraction from headers
# Explicitly define tokenUrl to the *absolute* path of your token endpoint
# and scheme_name for better display in Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login", scheme_name="Bearer Token Login"
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if a plain password matches a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hashes a plain password.
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticates a user by username and password.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from a JWT token.
    Raises HTTPException if the token is invalid or user not found/inactive.
    """
    print("--- Entering get_current_user (Manual Header Extraction) ---")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if authorization is None:
        print("Authorization header is missing.")
        raise credentials_exception

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            print(f"Authorization scheme is not 'Bearer': {scheme}")
            raise credentials_exception
    except ValueError:
        print(f"Authorization header malformed: {authorization}")
        raise credentials_exception

    try:
        print(f"Received token in get_current_user: {token}")

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            print("JWT payload 'sub' (username) is None.")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        print(f"JWT Error during token decoding: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error in get_current_user: {e}")
        raise credentials_exception


    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        print(f"User with username '{token_data.username}' not found in DB.")
        raise credentials_exception
    if not user.is_active:
        print(f"User '{token_data.username}' is inactive.")
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def send_password_reset_email(email: str, reset_token: str):
    """
    Sends a password reset email to the user.
    """
    try:
        validate_email(email)
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Updated base URL for the reset link
    reset_link = f"http://rahmeassociates.au/auth/reset-password?token={reset_token}"

    # Updated sender name and email address for the 'From' header
    sender_email_address = "noreply@rahmeassociates.com"
    sender_display_name = "Rahme & Associates"

    message = f"""\
From: "{sender_display_name}" <{sender_email_address}>
Subject: Password Reset Request

Hi,

You have requested to reset your password.
Please click on the following link to reset your password:
{reset_link}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email.

Thanks,
{sender_display_name}
"""

    try:
        async with aiosmtplib.SMTP(
            hostname=settings.SMTP_SERVER, port=settings.SMTP_PORT, start_tls=True
        ) as client:
            await client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            await client.sendmail(sender_email_address, email, message)
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send password reset email. Please try again later.",
        )


def generate_reset_token() -> str:
    """
    Generates a unique reset token.
    """
    return str(uuid4())