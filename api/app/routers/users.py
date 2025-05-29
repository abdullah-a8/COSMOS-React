from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete
from typing import Optional, Dict, Any, Tuple, List
import logging
from pydantic import ValidationError

# Setup logger
logger = logging.getLogger(__name__)

from ..db.session import get_db
from ..services.user_service import UserService
from ..schemas.user import UserCreate, UserLogin, UserResponse, UpdateDisplayName, CreateInviteCode
from ..models.auth import InviteCode, Session
from ..core.auth_service import (
    create_session, 
    validate_session, 
    SESSION_TOKEN_NAME,
    is_admin_session,
    get_utc_now
)
from ..core.config import settings
from ..core.csrf import CSRF_TOKEN_NAME
from ..utils.input_validator import LoginForm, RegisterForm, UpdateProfileForm
from ..utils.error_handlers import format_validation_error

router = APIRouter()

async def get_current_user_from_session(
    session_id: str,
    db: AsyncSession
) -> Tuple[Session, UserResponse]:
    """Get the current user from a session ID."""
    # Get session data
    stmt = select(Session).where(Session.id == session_id)
    result = await db.execute(stmt)
    session = result.scalars().first()
    
    if not session or not session.user_identifier:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    # Get user by email
    user_service = UserService(db)
    user = await user_service.get_user_by_email(session.user_identifier)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return session, user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Register a new user with an invite code."""
    # First, validate the incoming data using our validation model
    try:
        valid_data = RegisterForm(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.display_name,
            invite_code=user_data.invite_code,
            terms_accepted=user_data.terms_accepted
        )
    except ValidationError as e:
        error_response = format_validation_error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    
    user_service = UserService(db)
    
    # Log terms acceptance
    logger = logging.getLogger(__name__)
    logger.info(f"User registration with terms accepted: {valid_data.email}")
    
    # Create user with invite code
    user, error = await user_service.create_user_with_invite(
        email=valid_data.email,
        password=valid_data.password,
        invite_code=valid_data.invite_code,
        display_name=valid_data.display_name,
        terms_accepted=valid_data.terms_accepted
    )
    
    if not user:
        if error == "email_exists":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        elif error == "invalid_invite":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invite code"
            )
        elif error == "compromised_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This password has appeared in a data breach. Please choose a different password for security."
            )
        elif error == "terms_not_accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must accept the Terms of Service and Privacy Policy"
            )
        elif error == "invalid_email":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid email address"
            )
        elif error == "invalid_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password does not meet security requirements"
            )
        elif error == "invalid_display_name":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Display name contains invalid characters"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while creating the account"
            )
    
    return user

@router.post("/login")
async def login_user(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login a user and return a session token."""
    # First, validate the incoming data using our validation model
    try:
        valid_data = LoginForm(
            email=login_data.email,
            password=login_data.password
        )
    except ValidationError as e:
        error_response = format_validation_error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    
    user_service = UserService(db)
    
    # Authenticate the user
    user = await user_service.authenticate_user(valid_data.email, valid_data.password)
    
    if not user:
        # More user-friendly authentication error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "The email or password you entered is incorrect. Please try again.",
                "fields": {
                    "email": "The email or password you entered is incorrect.",
                    "password": "The email or password you entered is incorrect."
                }
            }
        )
    
    # Properly check if user is admin based on email
    admin_emails = getattr(settings, "ADMIN_EMAILS", "")
    admin_emails_list = []
    
    if isinstance(admin_emails, list):
        admin_emails_list = admin_emails
    elif isinstance(admin_emails, str) and admin_emails:
        admin_emails_list = [email.strip() for email in admin_emails.split(",") if email.strip()]
    
    is_admin = user.email.lower() in [email.lower() for email in admin_emails_list]
    
    # Create a session with the correct admin status
    session_id = await create_session(
        db=db,
        user_identifier=user.email,
        expires_minutes=60 * 24,  # 24 hours
        is_admin=is_admin
    )
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session"
        )
    
    # Create response with cookie
    response = JSONResponse(
        content={"status": "success", "message": "Login successful", "is_admin": is_admin}
    )
    
    # Set cookie with production-appropriate settings
    secure_cookie = settings.ENVIRONMENT.lower() == "production"
    response.set_cookie(
        key=SESSION_TOKEN_NAME,
        value=session_id,
        httponly=True,
        max_age=60 * 60 * 24,  # 24 hours in seconds
        secure=secure_cookie,  # Only use secure in production
        samesite="lax"
    )
    
    return response

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    session_id: Optional[str] = Cookie(default=None, alias=SESSION_TOKEN_NAME),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Get the current logged-in user."""
    if not session_id or not await validate_session(db, session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    _, user = await get_current_user_from_session(session_id, db)
    return user

@router.put("/me/display-name", response_model=UserResponse)
async def update_display_name(
    display_name_data: UpdateDisplayName,
    session_id: Optional[str] = Cookie(default=None, alias=SESSION_TOKEN_NAME),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Update the current user's display name."""
    if not session_id or not await validate_session(db, session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Validate the display name
    try:
        valid_data = UpdateProfileForm(
            display_name=display_name_data.display_name
        )
    except ValidationError as e:
        error_response = format_validation_error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_response
        )
    
    _, user = await get_current_user_from_session(session_id, db)
    
    # Update display name
    updated_user = await UserService(db).update_display_name(user.id, valid_data.display_name)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update display name"
        )
    
    return updated_user

@router.post("/logout")
async def logout_user(
    request: Request,
    session_id: Optional[str] = Cookie(default=None, alias=SESSION_TOKEN_NAME),
    db: AsyncSession = Depends(get_db)
) -> JSONResponse:
    """Logout the current user by invalidating their session."""
    if not session_id:
        return JSONResponse(
            content={"status": "success", "message": "Already logged out"},
            status_code=status.HTTP_200_OK
        )
    
    try:
        # Delete the session if it exists
        delete_stmt = delete(Session).where(Session.id == session_id)
        await db.execute(delete_stmt)
        await db.commit()
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        # Continue with logout even if DB delete fails
    
    # Create a response with cleared cookie
    response = JSONResponse(
        content={"status": "success", "message": "Logged out successfully"},
        status_code=status.HTTP_200_OK
    )
    
    # Clear the session cookie
    response.delete_cookie(
        key=SESSION_TOKEN_NAME,
        path="/",
        secure=settings.ENVIRONMENT.lower() == "production",
        httponly=True
    )
    
    # Clear CSRF cookie if it exists
    response.delete_cookie(
        key=CSRF_TOKEN_NAME,
        path="/",
        secure=settings.ENVIRONMENT.lower() == "production",
        httponly=True
    )
    
    return response

@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def create_invite_code(
    invite_data: CreateInviteCode,
    session_id: Optional[str] = Cookie(default=None, alias=SESSION_TOKEN_NAME),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Create an invite code for a specific email (admin only)."""
    if not session_id or not await validate_session(db, session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Check if user is admin
    if not await is_admin_session(db, session_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Check if email already has an active invite code
    stmt = select(InviteCode).where(
        and_(
            InviteCode.email == invite_data.email.lower(),
            InviteCode.is_active == True,
            or_(
                InviteCode.expires_at == None,
                InviteCode.expires_at > get_utc_now()
            )
        )
    )
    
    result = await db.execute(stmt)
    existing_invite = result.scalars().first()
    
    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active invite code already exists for this email"
        )
    
    # Get admin email from session
    admin_stmt = select(Session).where(Session.id == session_id)
    admin_result = await db.execute(admin_stmt)
    admin_session = admin_result.scalars().first()
    admin_email = admin_session.user_identifier if admin_session else "system"
    
    # Create new invite code
    invite_code, plain_code = InviteCode.generate(
        email=invite_data.email.lower(),
        expires_days=invite_data.expires_days
    )
    
    invite_code.created_by = admin_email
    
    db.add(invite_code)
    await db.commit()
    
    return {
        "email": invite_data.email,
        "invite_code": plain_code,
        "expires_at": invite_code.expires_at,
        "created_by": admin_email
    }

@router.get("/invite")
async def get_invite_codes(
    active_only: bool = Query(False),
    session_id: Optional[str] = Cookie(default=None, alias=SESSION_TOKEN_NAME),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get all invite codes (admin only)."""
    # Authentication and authorization checks similar to create_invite_code
    # Return list of invite codes
    pass 