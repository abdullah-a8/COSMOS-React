import os
import time
import secrets
import logging
from typing import Dict
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import FileResponse, HTMLResponse
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
    "/favicon.ico",
    "/cosmos_app.png"
]

# Static files that should always be accessible
STATIC_PATH_PREFIXES = [
    "/assets/",
]

# HTML template for the password protection page
LOGIN_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>COSMOS - Closed Beta</title>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <style>
        :root {
            --background: #000000;
            --foreground: #ffffff;
            --accent: #7c3aed;
            --error: #ef4444;
            --border-radius: 0.5rem;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        }
        
        body {
            background-color: var(--background);
            color: var(--foreground);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            position: relative;
            overflow: hidden;
        }
        
        .sparkles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.5;
            background-image: radial-gradient(var(--foreground) 1px, transparent 1px);
            background-size: 50px 50px;
        }
        
        .container {
            max-width: 400px;
            width: 100%;
            background-color: rgba(15, 15, 15, 0.95);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .logo {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            letter-spacing: -0.025em;
            text-align: center;
            background: linear-gradient(to right, #7c3aed, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .description {
            margin-bottom: 2rem;
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
        }
        
        form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        label {
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        input {
            padding: 0.75rem 1rem;
            border-radius: var(--border-radius);
            border: 1px solid rgba(255, 255, 255, 0.1);
            background-color: rgba(255, 255, 255, 0.05);
            color: var(--foreground);
            font-size: 1rem;
            transition: all 0.2s;
        }
        
        input:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
        }
        
        button {
            padding: 0.75rem 1.5rem;
            border-radius: var(--border-radius);
            border: none;
            background-color: var(--accent);
            color: white;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        button:hover {
            background-color: #6d28d9;
        }
        
        .closed-beta-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background-color: var(--accent);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .error {
            color: var(--error);
            margin-top: 1rem;
            text-align: center;
            font-size: 0.9rem;
        }
        
        footer {
            margin-top: 2rem;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
        }
        
        @media (max-width: 500px) {
            .container {
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="sparkles"></div>
    <div class="closed-beta-badge">Closed Beta</div>
    
    <div class="container">
        <h1 class="logo">COSMOS</h1>
        <p class="description">This site is currently in closed beta. Please enter the access key to continue.</p>
        
        <form method="post" action="/cosmos-auth">
            <div class="form-group">
                <label for="password">Access Key</label>
                <input type="password" id="password" name="password" placeholder="Enter your access key" required autofocus>
            </div>
            
            <button type="submit">Enter</button>
            
            {% if error %}
            <div class="error">{{ error }}</div>
            {% endif %}
        </form>
        
        <footer>
            &copy; 2025 COSMOS AI. All rights reserved.
        </footer>
    </div>
</body>
</html>
"""

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
            
        # Check for authentication
        session_token = request.cookies.get(SESSION_TOKEN_NAME)
        
        # Clean expired sessions periodically
        clean_expired_sessions()
        
        # If token exists and is valid, let the request through
        if session_token and session_token in ACTIVE_SESSIONS:
            # Refresh the session timestamp
            ACTIVE_SESSIONS[session_token] = time.time()
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
                    # Failed authentication
                    error_page = LOGIN_HTML.replace("{% if error %}", "").replace("{% endif %}", "")
                    error_page = error_page.replace("<div class=\"error\">{{ error }}</div>", 
                                                   "<div class=\"error\">Invalid access key. Please try again.</div>")
                    return HTMLResponse(content=error_page)
            except Exception as e:
                logger.error(f"Error processing authentication: {str(e)}")
                return HTMLResponse(
                    content=f"<html><body><h1>Authentication Error</h1><p>An unexpected error occurred.</p></body></html>",
                    status_code=500
                )
        
        # Show login page for unauthenticated requests
        login_page = LOGIN_HTML.replace("{% if error %}", "").replace("{% endif %}", "").replace("<div class=\"error\">{{ error }}</div>", "")
        return HTMLResponse(content=login_page, status_code=status.HTTP_401_UNAUTHORIZED) 