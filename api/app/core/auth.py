import os
import time
import secrets
import logging
import hashlib
from typing import Dict, Tuple
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
# Active sessions store: { token: (timestamp, ip_hash) }
ACTIVE_SESSIONS: Dict[str, Tuple[float, str]] = {}
# Periodic cleanup interval (10 minutes)
CLEANUP_INTERVAL = 600
LAST_CLEANUP = time.time()
# Maximum failed attempts before temporary ban (per IP)
MAX_FAILED_ATTEMPTS = 5
# Failed attempts tracking: { ip_hash: (count, last_attempt_time) }
FAILED_ATTEMPTS: Dict[str, Tuple[int, float]] = {}
# Lockout period in seconds (10 minutes)
LOCKOUT_PERIOD = 600

# Path exclusions - be specific to prevent bypassing auth
EXCLUDED_PATHS = [
    "/api/v1/docs",
    "/api/v1/redoc",
    "/api/v1/openapi.json",
    "/api/v1/health",
    "/favicon.ico",
    "/cosmos_app.png",
    "/auth",  # Auth page only
    "/cosmos-auth",  # Auth submission endpoint
]

# Static files that should always be accessible
STATIC_PATH_PREFIXES = [
    "/assets/",
]

# Static file extensions that don't need auth
STATIC_FILE_EXTENSIONS = [
    ".js",
    ".css",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".webp",
    ".map"
]

def hash_ip(ip: str) -> str:
    """Hash IP address for privacy while still allowing tracking"""
    # Salt to make it harder to reverse
    salt = getattr(settings, "IP_HASH_SALT", "cosmos_ip_salt")
    return hashlib.sha256(f"{ip}{salt}".encode()).hexdigest()

def clean_expired_sessions():
    """Remove expired sessions from memory"""
    global LAST_CLEANUP
    current_time = time.time()
    
    # Only clean up periodically to avoid doing this operation too frequently
    if current_time - LAST_CLEANUP < CLEANUP_INTERVAL:
        return
        
    expired_tokens = []
    for token, (timestamp, _) in ACTIVE_SESSIONS.items():
        if current_time - timestamp > SESSION_TIMEOUT:
            expired_tokens.append(token)
            
    for token in expired_tokens:
        ACTIVE_SESSIONS.pop(token, None)
    
    # Also clean up expired failed attempts
    expired_ips = []
    for ip_hash, (_, last_attempt) in FAILED_ATTEMPTS.items():
        if current_time - last_attempt > LOCKOUT_PERIOD:
            expired_ips.append(ip_hash)
            
    for ip_hash in expired_ips:
        FAILED_ATTEMPTS.pop(ip_hash, None)
        
    LAST_CLEANUP = current_time
    
    if expired_tokens or expired_ips:
        logger.info(f"Cleaned {len(expired_tokens)} expired sessions and {len(expired_ips)} expired failed attempts")

def create_session_token() -> str:
    """Create a new random session token"""
    return secrets.token_urlsafe(32)

def is_path_excluded(path: str) -> bool:
    """Check if the path should be excluded from auth protection"""
    if path in EXCLUDED_PATHS:
        return True
        
    # Allow static assets by prefix
    for prefix in STATIC_PATH_PREFIXES:
        if path.startswith(prefix):
            return True
    
    # Allow static files by extension
    for ext in STATIC_FILE_EXTENSIONS:
        if path.endswith(ext):
            return True
            
    return False

def is_ip_allowed(ip_hash: str) -> bool:
    """Check if IP is allowed to make auth attempts"""
    if ip_hash not in FAILED_ATTEMPTS:
        return True
        
    attempts, last_attempt = FAILED_ATTEMPTS[ip_hash]
    # Reset attempts if lockout period has passed
    if time.time() - last_attempt > LOCKOUT_PERIOD:
        FAILED_ATTEMPTS.pop(ip_hash)
        return True
        
    # Block if too many attempts
    return attempts < MAX_FAILED_ATTEMPTS

def record_failed_attempt(ip_hash: str):
    """Record a failed login attempt"""
    current_time = time.time()
    
    if ip_hash in FAILED_ATTEMPTS:
        attempts, _ = FAILED_ATTEMPTS[ip_hash]
        FAILED_ATTEMPTS[ip_hash] = (attempts + 1, current_time)
    else:
        FAILED_ATTEMPTS[ip_hash] = (1, current_time)

class BetaAuthMiddleware(BaseHTTPMiddleware):
    """Middleware for handling closed beta authentication"""
    
    async def dispatch(self, request: Request, call_next):
        # Only apply auth if BETA_ENABLED is True
        if not getattr(settings, "BETA_ENABLED", True):
            return await call_next(request)
        
        path = request.url.path
        
        # Allow access to excluded paths without authentication
        if is_path_excluded(path):
            return await call_next(request)
            
        # Hash the client IP for tracking
        ip_hash = hash_ip(request.client.host)
        
        # Check for authentication
        session_token = request.cookies.get(SESSION_TOKEN_NAME)
        
        # Clean expired sessions periodically
        clean_expired_sessions()
        
        # Verify the token and check IP match for session binding
        valid_session = False
        if session_token and session_token in ACTIVE_SESSIONS:
            timestamp, session_ip_hash = ACTIVE_SESSIONS[session_token]
            
            # Session is valid if time is good and IP matches
            if time.time() - timestamp <= SESSION_TIMEOUT:
                if session_ip_hash == ip_hash or getattr(settings, "STRICT_IP_CHECK", False) is False:
                    # Refresh the session timestamp
                    ACTIVE_SESSIONS[session_token] = (time.time(), ip_hash)
                    valid_session = True
                else:
                    # IP mismatch could indicate session hijacking
                    logger.warning(f"Session IP mismatch: {ip_hash} vs {session_ip_hash}")
                    # Invalidate the session
                    ACTIVE_SESSIONS.pop(session_token, None)
        
        if valid_session:
            response = await call_next(request)
            return response
            
        # Handle login form submission
        if path == "/cosmos-auth" and request.method == "POST":
            # Check if IP is allowed to make auth attempts
            if not is_ip_allowed(ip_hash):
                logger.warning(f"Too many failed attempts from {request.client.host}")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"error": "Too many failed attempts. Please try again later."}
                )
                
            try:
                form_data = await request.form()
                password = form_data.get("password", "")
                
                # Get the required password
                required_password = getattr(settings, "BETA_PASSWORD", BETA_PASSWORD)
                
                if password == required_password:
                    # Authentication successful, create session
                    session_token = create_session_token()
                    ACTIVE_SESSIONS[session_token] = (time.time(), ip_hash)
                    
                    # Reset failed attempts for this IP
                    if ip_hash in FAILED_ATTEMPTS:
                        FAILED_ATTEMPTS.pop(ip_hash)
                    
                    # Create redirect response
                    response = Response(
                        status_code=status.HTTP_303_SEE_OTHER,
                        headers={"Location": "/"}
                    )
                    
                    # Set the session cookie with secure attributes
                    timeout = getattr(settings, "BETA_SESSION_TIMEOUT", SESSION_TIMEOUT)
                    response.set_cookie(
                        key=SESSION_TOKEN_NAME,
                        value=session_token,
                        max_age=timeout,
                        httponly=True,
                        samesite="strict", # Stronger protection against CSRF
                        secure=settings.ENVIRONMENT.lower() == "production" # Secure in production
                    )
                    
                    # Log successful authentication (without sensitive details)
                    logger.info(f"Successful authentication from {request.client.host}")
                    
                    return response
                else:
                    # Failed authentication - return 401 for the frontend to handle
                    # Log failed attempt (without exposing the entered password)
                    logger.warning(f"Failed authentication attempt from {request.client.host}")
                    record_failed_attempt(ip_hash)
                    
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"error": "Invalid access key. Please try again."}
                    )
            except Exception as e:
                logger.error(f"Error processing authentication: {str(e)}")
                return JSONResponse(
                    content={"error": "An unexpected error occurred."},
                    status_code=500
                )
        
        # For API routes, return 401 JSON response
        if path.startswith("/api/"):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Authentication required"}
            )
            
        # For frontend routes, redirect to auth page
        # This ensures ALL routes not explicitly excluded
        # will be redirected to authentication
        return RedirectResponse(
            url="/auth",
            status_code=status.HTTP_302_FOUND
        ) 