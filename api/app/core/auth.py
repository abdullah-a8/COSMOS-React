import logging
from typing import Dict, Optional, List, Union
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .auth_service import (
    validate_access_code, 
    create_session, 
    validate_session,
    SESSION_TOKEN_NAME
)

logger = logging.getLogger(__name__)

# Path exclusions
EXCLUDED_PATHS = [
    # Documentation endpoints
    "/api/v1/docs",
    "/api/v1/redoc",
    "/api/v1/openapi.json",
    
    # Health and status endpoints
    "/api/v1/health",
    "/api/v1/auth-status",
    "/api/v1/auth/refresh-session",
    "/api/v1/csrf-token",
    
    # Asset paths
    "/favicon.ico",
    "/cosmos_app.png",
    "/auth", 
    
    # New auth endpoints
    "/login",
    "/register",
    "/api/v1/users/register",  # Allow user registration without authentication
    "/api/v1/users/login",     # Allow user login without authentication
    
    # API endpoints
    "/api/v1/rag/query/stream",  # RAG streaming endpoint
    "/api/v1/rag/url",          # URL processor endpoint
    "/api/v1/youtube/process",   # YouTube processing endpoint
    "/api/v1/gmail/auth/url",    # Gmail auth URL endpoint
    "/api/v1/gmail/auth/callback", # Gmail auth callback endpoint
]

# Important: Do not exclude the cosmos-auth form handler

# Additional static resource paths
STATIC_PATH_PREFIXES = [
    "/assets/",
]

def is_path_excluded(path: str) -> bool:
    """Check if the path should be excluded from auth protection"""
    if path in EXCLUDED_PATHS:
        return True
        
    for prefix in STATIC_PATH_PREFIXES:
        if path.startswith(prefix):
            return True
            
    return False

class BetaAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for handling closed beta authentication"""
    
    async def dispatch(self, request: Request, call_next):
        # Get database session - safely handle missing DB
        try:
            db = request.state.db
        except AttributeError:
            # If DB middleware hasn't run, handle gracefully
            logger.error("Database session not available in auth middleware")
            
            # For auth-status endpoint, return unauthenticated response
            if request.url.path == "/api/v1/auth-status":
                return JSONResponse(content={
                    "authenticated": False,
                    "is_admin": False,
                    "error": "Database connection unavailable"
                })
                
            # For cosmos-auth endpoint, redirect to error page
            if request.url.path == "/cosmos-auth" and request.method == "POST":
                return RedirectResponse(
                    url="/auth?error=system",
                    status_code=status.HTTP_303_SEE_OTHER
                )
                
            # For other requests, just pass them through
            return await call_next(request)
        
        # Only apply auth if BETA_ENABLED is True
        if not getattr(settings, "BETA_ENABLED", True):
            return await call_next(request)
        
        path = request.url.path
        
        # Allow access to excluded paths without authentication
        if is_path_excluded(path):
            # Special case for auth-status endpoint
            if path == "/api/v1/auth-status":
                session_token = request.cookies.get(SESSION_TOKEN_NAME)
                is_authenticated = await validate_session(db, session_token)
                
                # Check admin status if authenticated
                is_admin = False
                if is_authenticated:
                    from .auth_service import is_admin_session
                    is_admin = await is_admin_session(db, session_token)
                    logger.info(f"Auth status middleware - User is authenticated, admin status: {is_admin}")
                
                # Always include is_admin in the response
                return JSONResponse(content={
                    "authenticated": is_authenticated,
                    "is_admin": is_admin
                })
            
            return await call_next(request)
        
        # Allow OPTIONS requests for all API endpoints to support CORS preflight
        if request.method == "OPTIONS" and path.startswith("/api/"):
            return await call_next(request)
        
        # Check for authentication
        session_token = request.cookies.get(SESSION_TOKEN_NAME)
        is_authenticated = await validate_session(db, session_token)
        
        # If authenticated, let the request through
        if is_authenticated:
            response = await call_next(request)
            return response
            
        # Handle login form submission
        if path == "/cosmos-auth" and request.method == "POST":
            try:
                form_data = await request.form()
                password = form_data.get("password", "")
                
                # Check CSRF token if provided (for enhanced security)
                csrf_token = form_data.get("csrf_token")
                if csrf_token:
                    from .csrf import CSRF_TOKEN_NAME
                    cookie_token = request.cookies.get(CSRF_TOKEN_NAME)
                    
                    # If a token was provided but doesn't match, reject the request
                    if cookie_token and csrf_token != cookie_token:
                        logger.warning("CSRF token mismatch in authentication attempt")
                        return RedirectResponse(
                            url="/auth?error=security",
                            status_code=status.HTTP_303_SEE_OTHER
                        )
                
                # Log authentication attempt (without the password)
                request_ip = request.client.host if request.client else "unknown"
                logger.info(f"Authentication attempt from {request_ip}")
                
                # Use updated validation function that returns (is_valid, error_code)
                is_valid, error_code = await validate_access_code(db, password)
                
                if is_valid:
                    # Authentication successful, create session
                    
                    # Check if this is an admin access
                    # You can add your admin identification logic here
                    # For example, you could have a specific admin invite code pattern,
                    # check against an admin email list, etc.
                    
                    # For now, we'll check if the invite code is associated with an admin email
                    from ..models.auth import InviteCode
                    from sqlalchemy import select
                    
                    is_admin = False
                    
                    # Check if this is a developer/admin based on email pattern
                    admin_emails_setting = getattr(settings, "ADMIN_EMAILS", "")
                    
                    # Ensure admin_emails is a list by using the settings parser
                    admin_emails = []
                    if isinstance(admin_emails_setting, list):
                        admin_emails = admin_emails_setting
                    elif isinstance(admin_emails_setting, str):
                        admin_emails = [email.strip().lower() for email in admin_emails_setting.split(",") if email.strip()]
                    
                    # Log admin emails setting and its type
                    logger.info(f"Admin emails from settings: {admin_emails!r} (type: {type(admin_emails).__name__})")
                    
                    # Find the invite code used for authentication
                    stmt = select(InviteCode).where(InviteCode.is_active == True)
                    result = await db.execute(stmt)
                    invite_codes = result.scalars().all()
                    
                    for invite_code in invite_codes:
                        if invite_code.email and InviteCode.verify_code(password, invite_code.code_hash):
                            # Normalize email for comparison (lowercase, strip)
                            invite_email = invite_code.email.strip().lower() if invite_code.email else ""
                            
                            # Log the email comparison
                            logger.info(f"Checking if '{invite_email}' is in admin list: {admin_emails}")
                            
                            if invite_email in admin_emails:
                                is_admin = True
                                logger.info(f"Admin authentication from {request_ip}, admin email: {invite_email}")
                            break
                    
                    session_token = await create_session(
                        db, 
                        expires_minutes=getattr(settings, "BETA_SESSION_TIMEOUT", 60),
                        is_admin=is_admin
                    )
                    
                    # Log successful authentication
                    logger.info(f"Successful authentication from {request_ip}")
                    
                    # Create redirect response
                    response = Response(
                        status_code=status.HTTP_303_SEE_OTHER,
                        headers={"Location": "/"}
                    )
                    
                    # Set the session cookie
                    timeout = getattr(settings, "BETA_SESSION_TIMEOUT", 60*60)
                    response.set_cookie(
                        key=SESSION_TOKEN_NAME,
                        value=session_token,
                        max_age=timeout,
                        httponly=True,
                        samesite="lax",
                        secure=settings.ENVIRONMENT.lower() == "production"
                    )
                    
                    return response
                else:
                    # Log failed authentication with specific error code
                    logger.warning(f"Failed authentication attempt from {request_ip}: {error_code}")
                    
                    # Failed authentication - redirect to auth page with specific error code
                    return RedirectResponse(
                        url=f"/auth?error={error_code}",
                        status_code=status.HTTP_303_SEE_OTHER
                    )
            except Exception as e:
                logger.error(f"Error processing authentication: {str(e)}")
                return RedirectResponse(
                    url="/auth?error=system",
                    status_code=status.HTTP_303_SEE_OTHER
                )
                
        # For API requests, return JSON 401 response
        if path.startswith("/api/"):
            return JSONResponse(
                content={"detail": "Authentication required"},
                status_code=status.HTTP_401_UNAUTHORIZED
            )
        
        # Redirect to the React auth page for unauthenticated requests
        return RedirectResponse(
            url="/auth",
            status_code=status.HTTP_303_SEE_OTHER
        ) 