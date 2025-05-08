import os
import time
import secrets
import logging
import json
from typing import Dict, Optional, List, Union
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings

logger = logging.getLogger(__name__)

# Load password from environment or use default
BETA_PASSWORD = os.getenv("COSMOS_BETA_PASSWORD", "CosmosClosedBeta2025")
# Session timeout in seconds (60 minutes)
SESSION_TIMEOUT = 60 * 60  
# Session token name
SESSION_TOKEN_NAME = "cosmos_beta_session"
# Active sessions store
ACTIVE_SESSIONS: Dict[str, float] = {}
# Periodic cleanup interval (10 minutes)
CLEANUP_INTERVAL = 600
LAST_CLEANUP = time.time()

# Path exclusions
EXCLUDED_PATHS = [
    "/api/v1/docs",
    "/api/v1/redoc",
    "/api/v1/openapi.json",
    "/api/v1/health",
    "/api/v1/auth-status",
    "/favicon.ico",
    "/cosmos_app.png",
    "/auth"
]

# Additional static resource paths
STATIC_PATH_PREFIXES = [
    "/assets/",
]

def clean_expired_sessions():
    """Remove expired sessions from memory"""
    global LAST_CLEANUP
    current_time = time.time()
    
    # Only clean up periodically to avoid doing this operation too frequently
    if current_time - LAST_CLEANUP < CLEANUP_INTERVAL:
        return
        
    expired = []
    for token, timestamp in ACTIVE_SESSIONS.items():
        if current_time - timestamp > SESSION_TIMEOUT:
            expired.append(token)
            
    for token in expired:
        ACTIVE_SESSIONS.pop(token, None)
        
    LAST_CLEANUP = current_time
    
    if expired:
        logger.info(f"Cleaned {len(expired)} expired sessions")

def create_session_token() -> str:
    """Create a new random session token"""
    return secrets.token_urlsafe(32)

def is_path_excluded(path: str) -> bool:
    """Check if the path should be excluded from auth protection"""
    if path in EXCLUDED_PATHS:
        return True
        
    for prefix in STATIC_PATH_PREFIXES:
        if path.startswith(prefix):
            return True
            
    return False

def check_auth(request: Request) -> bool:
    """Check if the request is authenticated.
    
    Returns:
        bool: True if authenticated, False otherwise
    """
    session_token = request.cookies.get(SESSION_TOKEN_NAME)
    
    # If token exists and is valid, user is authenticated
    if session_token and session_token in ACTIVE_SESSIONS:
        # Refresh the session timestamp
        ACTIVE_SESSIONS[session_token] = time.time()
        return True
    
    return False

class BetaAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for handling closed beta authentication"""
    
    async def dispatch(self, request: Request, call_next):
        # Only apply auth if BETA_ENABLED is True
        if not getattr(settings, "BETA_ENABLED", True):
            return await call_next(request)
        
        path = request.url.path
        
        # Allow access to excluded paths without authentication
        if is_path_excluded(path):
            # Special case for auth-status endpoint
            if path == "/api/v1/auth-status":
                is_authenticated = check_auth(request)
                return JSONResponse(content={"authenticated": is_authenticated})
            
            return await call_next(request)
        
        # Check for authentication
        is_authenticated = check_auth(request)
        
        # Clean expired sessions periodically
        clean_expired_sessions()
        
        # If authenticated, let the request through
        if is_authenticated:
            response = await call_next(request)
            return response
            
        # Handle login form submission
        if path == "/cosmos-auth" and request.method == "POST":
            try:
                form_data = await request.form()
                password = form_data.get("password", "")
                
                # Get the required password
                required_password = getattr(settings, "BETA_PASSWORD", BETA_PASSWORD)
                
                if password == required_password:
                    # Authentication successful, create session
                    session_token = create_session_token()
                    ACTIVE_SESSIONS[session_token] = time.time()
                    
                    # Create redirect response
                    response = Response(
                        status_code=status.HTTP_303_SEE_OTHER,
                        headers={"Location": "/"}
                    )
                    
                    # Set the session cookie
                    timeout = getattr(settings, "BETA_SESSION_TIMEOUT", SESSION_TIMEOUT)
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
                    # Failed authentication - redirect to auth page with error
                    return RedirectResponse(
                        url="/auth?error=invalid",
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