from fastapi import FastAPI, HTTPException
from fastapi import status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import logging
import os
from fastapi import Request
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import datetime

from .core.config import settings
from .core.auth import BetaAuthMiddleware
from .core.db_middleware import DatabaseSessionMiddleware
from .core.csrf import CSRFProtectionMiddleware
from .routers import rag, youtube, gmail, admin
from .dependencies import get_vector_store_singleton, get_embeddings_singleton
from .db.session import init_models, engine
from .workers.cleanup import run_cleanup

# Set up logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Initialize scheduler
scheduler = AsyncIOScheduler()

# Configure middleware
allow_all = False
if settings.CORS_ORIGINS and "*" in settings.CORS_ORIGINS:
    logger.warning("CORS configured to allow all origins. This should only be used in development.")
    allow_all = True

# Define default development origins if using wildcard
dev_origins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=dev_origins if allow_all else settings.CORS_ORIGINS,
    allow_credentials=True,  # Always enable credentials
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
    expose_headers=["Content-Type", "X-CSRF-Token"],
)

# Add CSRF Protection middleware
app.add_middleware(CSRFProtectionMiddleware)

# Add Beta Authentication middleware
app.add_middleware(BetaAuthMiddleware)

# Add Database middleware first to ensure session is available
app.add_middleware(DatabaseSessionMiddleware)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    logger.info("Initializing application...")
    
    # Initialize database models
    try:
        await init_models()
        logger.info("Database models initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database models: {e}")
    
    # Set up scheduled tasks
    cleanup_hours = getattr(settings, "AUTH_CLEANUP_INTERVAL_HOURS", 12)
    scheduler.add_job(
        run_cleanup,
        trigger=IntervalTrigger(hours=cleanup_hours),
        id="auth_cleanup",
        name="Cleanup expired sessions and invite codes",
        replace_existing=True
    )
    logger.info(f"Scheduled auth cleanup job to run every {cleanup_hours} hours")
    
    # Start the scheduler
    scheduler.start()
    logger.info("Background scheduler started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down application...")
    
    # Shutdown the scheduler
    scheduler.shutdown()
    logger.info("Background scheduler shut down")
    
    # Close database connection pool
    if engine:
        logger.info("Closing database connection pool")
        await engine.dispose()
        logger.info("Database connection pool closed successfully")

# Include routers
app.include_router(rag.router, prefix=f"{settings.API_V1_STR}/rag", tags=["rag"])
app.include_router(youtube.router, prefix=f"{settings.API_V1_STR}/youtube", tags=["youtube"])
app.include_router(gmail.router, prefix=f"{settings.API_V1_STR}/gmail", tags=["gmail"])
app.include_router(
    admin.router,
    prefix=f"{settings.API_V1_STR}/admin",
    tags=["admin"]
)

# Add a route to handle the login form submission
@app.post("/cosmos-auth")
async def handle_auth_form(request: Request):
    """This route handles the login form submission"""
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse("Authentication handled by middleware. If you see this message, something went wrong.", status_code=500)

# --- Serve React Frontend Static Files ---
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
FRONTEND_DIST_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")

# Add specific route for favicon
@app.get("/favicon.ico")
async def get_favicon():
    """Serve favicon.ico from the frontend dist directory."""
    favicon_path = os.path.join(FRONTEND_DIST_DIR, "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(
            favicon_path, 
            media_type="image/x-icon",
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "Pragma": "public"
            }
        )
    
    # Fall back to cosmos_app.png if favicon.ico doesn't exist
    favicon_path = os.path.join(FRONTEND_DIST_DIR, "cosmos_app.png")
    if os.path.exists(favicon_path):
        return FileResponse(
            favicon_path, 
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "Pragma": "public"
            }
        )
    
    raise HTTPException(status_code=404, detail="Favicon not found")

# Also handle direct requests to cosmos_app.png
@app.get("/cosmos_app.png")
async def get_app_icon():
    """Serve cosmos_app.png from the frontend dist directory."""
    icon_path = os.path.join(FRONTEND_DIST_DIR, "cosmos_app.png")
    if os.path.exists(icon_path):
        return FileResponse(
            icon_path, 
            media_type="image/png",
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "Pragma": "public"
            }
        )
    raise HTTPException(status_code=404, detail="App icon not found")

app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets"), html=False), name="assets")

# Serve index.html for the root path
@app.get("/")
async def serve_root_react_app():
    index_html_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_html_path):
        return FileResponse(index_html_path)
    raise HTTPException(status_code=404, detail="Frontend index.html not found.")

# Serve index.html for all other paths (client-side routing)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Check if requesting a static file first
    if full_path.endswith(('.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot')):
        static_file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.exists(static_file_path):
            # Determine MIME type based on file extension
            media_type = None
            if full_path.endswith('.js'):
                media_type = 'application/javascript'
            elif full_path.endswith('.css'):
                media_type = 'text/css'
            elif full_path.endswith('.png'):
                media_type = 'image/png'
            elif full_path.endswith('.jpg') or full_path.endswith('.jpeg'):
                media_type = 'image/jpeg'
            elif full_path.endswith('.gif'):
                media_type = 'image/gif'
            elif full_path.endswith('.svg'):
                media_type = 'image/svg+xml'
            elif full_path.endswith('.ico'):
                media_type = 'image/x-icon'
            elif full_path.endswith('.woff'):
                media_type = 'font/woff'
            elif full_path.endswith('.woff2'):
                media_type = 'font/woff2'
            elif full_path.endswith('.ttf'):
                media_type = 'font/ttf'
            elif full_path.endswith('.eot'):
                media_type = 'application/vnd.ms-fontobject'
                
            # Return file with appropriate cache headers for static assets
            return FileResponse(
                static_file_path,
                media_type=media_type,
                headers={
                    "Cache-Control": "public, max-age=31536000, immutable",
                    "Pragma": "public"
                }
            )
    
    # Otherwise serve index.html for client-side routing
    index_html_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_html_path):
        return FileResponse(index_html_path)
    raise HTTPException(status_code=404, detail="Frontend index.html not found.")

@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get(f"{settings.API_V1_STR}/auth-status", tags=["auth"])
async def auth_status(request: Request):
    """Check authentication status"""
    from .core.auth_service import validate_session, is_admin_session, SESSION_TOKEN_NAME
    
    db = request.state.db
    session_token = request.cookies.get(SESSION_TOKEN_NAME)
    
    # Log both the check and the result for debugging
    session_id_prefix = session_token[:8] if session_token else "none"
    logger.info(f"Auth status check - Session: {session_id_prefix}...")
    
    is_authenticated = await validate_session(db, session_token)
    is_admin = False
    
    if is_authenticated:
        is_admin = await is_admin_session(db, session_token)
        logger.info(f"Auth status check - User is authenticated, admin status: {is_admin}")
    else:
        logger.info(f"Auth status check - User is not authenticated")
    
    # Include admin email configuration in debug mode
    admin_emails = getattr(settings, "ADMIN_EMAILS", "")
    admin_emails_list = []
    if isinstance(admin_emails, list):
        admin_emails_list = admin_emails
    elif isinstance(admin_emails, str) and admin_emails:
        admin_emails_list = [email.strip() for email in admin_emails.split(",") if email.strip()]
        
    if settings.DEBUG:
        logger.debug(f"Configured admin emails: {admin_emails_list}")
    
    # IMPORTANT: Always include is_admin in the response, regardless of authentication status
    response = {
        "authenticated": is_authenticated,
        "is_admin": is_admin
    }
    
    if settings.DEBUG:
        response["beta_enabled"] = getattr(settings, "BETA_ENABLED", True)
        response["debug_info"] = {
            "admin_emails_configured": bool(admin_emails_list),
            "admin_email_count": len(admin_emails_list) if admin_emails_list else 0
        }
    
    return response

@app.post(f"{settings.API_V1_STR}/auth/refresh-session", tags=["auth"])
async def refresh_session(request: Request):
    """Refresh an existing valid session"""
    from .core.auth_service import refresh_existing_session, validate_session, is_admin_session, SESSION_TOKEN_NAME
    from fastapi.responses import JSONResponse
    
    db = request.state.db
    session_token = request.cookies.get(SESSION_TOKEN_NAME)
    
    # First check if the current session is valid
    is_authenticated = await validate_session(db, session_token)
    
    if not is_authenticated:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired session"}
        )
    
    # Refresh the session
    new_session_token = await refresh_existing_session(db, session_token)
    
    # Check if admin
    is_admin = await is_admin_session(db, new_session_token)
    
    # Create response
    response = JSONResponse(
        content={
            "success": True, 
            "message": "Session refreshed successfully",
            "is_admin": is_admin
        }
    )
    
    # Set the new session cookie
    timeout = getattr(settings, "BETA_SESSION_TIMEOUT", 60*60)
    response.set_cookie(
        key=SESSION_TOKEN_NAME,
        value=new_session_token,
        max_age=timeout,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT.lower() == "production"
    )
    
    return response

@app.get(f"{settings.API_V1_STR}/csrf-token", tags=["auth"])
async def get_csrf_token(request: Request):
    """Get the CSRF token for the current session.
    This endpoint makes sure a CSRF cookie is set and returns the token value."""
    from .core.csrf import get_csrf_token, CSRF_TOKEN_NAME
    from fastapi.responses import JSONResponse
    
    # Get the current token or generate a new one
    csrf_token = get_csrf_token(request)
    
    # Create a new response
    response = JSONResponse(content={"csrf_token": csrf_token})
    
    # If there's no token, we need to ensure a cookie is set in the response
    if not csrf_token:
        # Import the middleware class to use its method
        from .core.csrf import CSRFProtectionMiddleware
        csrf_middleware = CSRFProtectionMiddleware()
        response = csrf_middleware._ensure_csrf_cookie(request, response)
        
        # Now get the token from the cookie that was just set
        csrf_token = response.raw_headers[-1][1].decode('utf-8').split('=')[1].split(';')[0]
    
    # Return the response with the token value
    return {"csrf_token": csrf_token}

@app.get(f"{settings.API_V1_STR}/admin-check", tags=["admin"])
async def admin_check(request: Request):
    """Check admin status explicitly - for debugging"""
    from .core.auth_service import validate_session, is_admin_session, SESSION_TOKEN_NAME
    
    db = request.state.db
    session_token = request.cookies.get(SESSION_TOKEN_NAME)
    
    # Log the check
    session_id_prefix = session_token[:8] if session_token else "none"
    logger.info(f"Admin check - Session: {session_id_prefix}...")
    
    is_authenticated = await validate_session(db, session_token)
    is_admin = False
    
    if is_authenticated:
        is_admin = await is_admin_session(db, session_token)
        logger.info(f"Admin check - User is authenticated, admin status: {is_admin}")
        
        # Get session details for debugging
        from sqlalchemy import select
        from .models.auth import Session
        stmt = select(Session).where(Session.id == session_token)
        result = await db.execute(stmt)
        session = result.scalars().first()
        
        session_metadata = None
        if session:
            session_metadata = session.session_metadata
            
        return {
            "authenticated": True,
            "is_admin": is_admin,
            "session_id": session_token,
            "session_metadata": session_metadata,
            "message": "Admin check completed",
            "timestamp": datetime.datetime.now().isoformat()
        }
    else:
        logger.info(f"Admin check - User is not authenticated")
        return {
            "authenticated": False,
            "is_admin": False,
            "message": "Not authenticated",
            "timestamp": datetime.datetime.now().isoformat()
        }