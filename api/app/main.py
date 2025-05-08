from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import logging
import os
from fastapi import Request

from .core.config import settings
from .core.auth import BetaAuthMiddleware
from .routers import rag, youtube, gmail
from .dependencies import get_vector_store_singleton, get_embeddings_singleton

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

# Configure middleware
allow_all = False
if settings.CORS_ORIGINS and "*" in settings.CORS_ORIGINS:
    logger.warning("CORS configured to allow all origins. This should only be used in development.")
    allow_all = True

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else settings.CORS_ORIGINS,
    allow_credentials=not allow_all,  # Must be False if allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Beta Authentication middleware
app.add_middleware(BetaAuthMiddleware)

# Warm up connections at startup
@app.on_event("startup")
async def warm_up_connections():
    """Initialize vector store and embedding connections at startup for better performance."""
    logger.info("Warming up vector store and embedding connections...")
    
    # Initialize embeddings first
    embeddings = get_embeddings_singleton()
    if embeddings:
        logger.info("Embeddings singleton initialized successfully")
    else:
        logger.warning("Failed to initialize embeddings singleton")
    
    # Then initialize vector store which depends on embeddings
    vector_store = get_vector_store_singleton()
    if vector_store:
        logger.info("Vector store singleton initialized and ready for queries")
    else:
        logger.warning("Failed to initialize vector store singleton")

# Include routers
app.include_router(rag.router, prefix=f"{settings.API_V1_STR}/rag", tags=["rag"])
app.include_router(youtube.router, prefix=f"{settings.API_V1_STR}/youtube", tags=["youtube"])
app.include_router(gmail.router, prefix=f"{settings.API_V1_STR}/gmail", tags=["gmail"])

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
    from .core.auth import SESSION_TOKEN_NAME, ACTIVE_SESSIONS
    
    session_token = request.cookies.get(SESSION_TOKEN_NAME)
    is_authenticated = bool(session_token and session_token in ACTIVE_SESSIONS)
    
    response = {
        "authenticated": is_authenticated,
        "session_active": bool(session_token in ACTIVE_SESSIONS) if session_token else False
    }
    
    if settings.DEBUG:
        response["beta_enabled"] = getattr(settings, "BETA_ENABLED", True)
    
    return response