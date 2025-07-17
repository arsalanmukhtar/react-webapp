from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone

from .database import get_db
from .models import User
from .schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    send_password_reset_email,
    generate_reset_token,
    authenticate_user
)
from .config import settings

# Initialize FastAPI Router for authentication routes
router = APIRouter(
    prefix="/auth",  # All routes in this file will start with /auth
    tags=["Authentication"],
)


@router.post(
    "/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user.
    - Hashes the password before storing it.
    - Checks for existing email or username to prevent duplicate registrations.
    """
    # Check if a user with the given email already exists
    db_user_by_email = db.query(User).filter(User.email == user.email).first()
    if db_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    # Check if a user with the given username already exists
    db_user_by_username = db.query(User).filter(User.username == user.username).first()
    if db_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already taken"
        )

    # Hash the user's password
    hashed_password = get_password_hash(user.password)

    # Create a new User object, including the username
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=False,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user due to a database error.",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}",
        )


@router.post("/login", response_model=Token)
async def login_for_access_token(
    user_login: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticates a user and returns an access token upon successful login.
    - Accepts username and password in the request body.
    - Verifies username and password.
    - Generates a JWT token.
    """
    user = authenticate_user(db, user_login.username, user_login.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    """
    Handles the 'forgot password' request.
    - Generates a unique reset token.
    - Stores the token and its expiry in the database for the user.
    - Sends an email with the reset link to the user.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        # Generate a unique reset token
        reset_token = generate_reset_token()
        # Set token expiry (e.g., 1 hour from now)
        reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        user.reset_token = reset_token
        user.reset_token_expires_at = reset_token_expires_at
        db.commit()
        db.refresh(user)

        # Send the password reset email
        await send_password_reset_email(user.email, reset_token)
        # Return success message for existing email
        return {"message": "Password reset email has been sent."}
    else:
        # Return a specific message for non-existent email
        print(f"Attempted password reset for non-existent email: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found."
        )


@router.post(
    "/reset-password", response_model=UserResponse, status_code=status.HTTP_200_OK
)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Resets the user's password using a valid reset token.
    - Validates the token and its expiry.
    - Updates the user's password and clears the reset token.
    """
    user = db.query(User).filter(User.reset_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token."
        )

    if user.reset_token_expires_at and user.reset_token_expires_at < datetime.now(
        timezone.utc
    ):
        user.reset_token = None
        user.reset_token_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token."
        )

    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None

    db.commit()
    db.refresh(user)

    return user
