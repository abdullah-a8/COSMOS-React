from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import secrets
import time
import logging
import hashlib
from .config import settings

logger = logging.getLogger(__name__)

# Constants
CSRF_TOKEN_NAME = "cosmos_csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_FORM_FIELD = "csrf_token"
CSRF_COOKIE_MAX_AGE = 86400  # 24 hours

# Safe HTTP methods that don't require CSRF protection
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Paths that should be excluded from CSRF protection
EXCLUDED_PATHS = {
    "/api/v1/auth-status",
    "/api/v1/auth/refresh-session",
    "/cosmos-auth",  # Auth form submission needs to be excluded since it's using cookies for auth
}

# Export constants for use in other modules
__all__ = ["CSRFProtectionMiddleware", "CSRF_TOKEN_NAME", "CSRF_HEADER_NAME", "CSRF_FORM_FIELD", "get_csrf_token"]

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Middleware for CSRF protection"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF for excluded paths and safe methods
        if request.method in SAFE_METHODS or request.url.path in EXCLUDED_PATHS:
            response = await call_next(request)
            
            # If it's a safe method, ensure the CSRF token exists in the response
            if request.method in SAFE_METHODS and request.url.path not in EXCLUDED_PATHS:
                response = self._ensure_csrf_cookie(request, response)
                
            return response
        
        # For unsafe methods, validate the CSRF token
        valid = await self._validate_csrf(request)
        if not valid:
            logger.warning(f"CSRF validation failed for {request.method} {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing or invalid"
            )
        
        # If token is valid, proceed with the request
        response = await call_next(request)
        return response
    
    def _ensure_csrf_cookie(self, request: Request, response: Response) -> Response:
        """Ensure a CSRF token cookie exists in the response"""
        # If the token already exists in cookies, don't reset it
        if request.cookies.get(CSRF_TOKEN_NAME):
            return response
        
        # Generate a new token
        token = self._generate_token()
        
        # Set the token as a cookie
        response.set_cookie(
            key=CSRF_TOKEN_NAME,
            value=token,
            max_age=CSRF_COOKIE_MAX_AGE,
            httponly=False,  # Must be accessible from JavaScript
            samesite="lax",
            secure=settings.ENVIRONMENT.lower() == "production"
        )
        
        return response
    
    async def _validate_csrf(self, request: Request) -> bool:
        """Validate the CSRF token in the request"""
        # Get the token from cookies
        cookie_token = request.cookies.get(CSRF_TOKEN_NAME)
        if not cookie_token:
            return False
        
        # Get the token from header or form data
        request_token = None
        
        # Check headers first
        if CSRF_HEADER_NAME.lower() in request.headers:
            request_token = request.headers.get(CSRF_HEADER_NAME)
        
        # If not in headers, check form data
        if not request_token:
            try:
                form = await request.form()
                request_token = form.get(CSRF_FORM_FIELD)
            except:
                pass  # Silently continue if form parsing fails
        
        # If not in form, check JSON body
        if not request_token:
            try:
                json_body = await request.json()
                request_token = json_body.get(CSRF_FORM_FIELD)
            except:
                pass  # Silently continue if JSON parsing fails
        
        # No token found anywhere in the request
        if not request_token:
            return False
        
        # Compare tokens (constant time comparison)
        return secrets.compare_digest(cookie_token, request_token)
    
    def _generate_token(self) -> str:
        """Generate a secure CSRF token"""
        # Combine random bytes with timestamp for uniqueness
        random_part = secrets.token_hex(16)
        timestamp = str(int(time.time()))
        
        # Create a hash of the combined value
        combined = f"{random_part}:{timestamp}"
        return hashlib.sha256(combined.encode()).hexdigest()

def get_csrf_token(request: Request) -> str:
    """Utility function to get the current CSRF token from cookies"""
    return request.cookies.get(CSRF_TOKEN_NAME, "") 