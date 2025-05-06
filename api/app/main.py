from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import pathlib  # 👈 NEW: to signal Heroku NGINX readiness

from .core.config import settings
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

# Handle permissive CORS
allow_all = False
if settings.CORS_ORIGINS and "*" in settings.CORS_ORIGINS:
    logger.warning("CORS configured to allow all origins. This should only be used in development.")
    allow_all = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else settings.CORS_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Warm up on startup
@app.on_event("startup")
async def warm_up_connections():
    """Initialize vector store and embedding connections at startup for better performance."""
    logger.info("Warming up vector store and embedding connections...")

    embeddings = get_embeddings_singleton()
    if embeddings:
        logger.info("Embeddings singleton initialized successfully")
    else:
        logger.warning("Failed to initialize embeddings singleton")

    vector_store = get_vector_store_singleton()
    if vector_store:
        logger.info("Vector store singleton initialized and ready for queries")
    else:
        logger.warning("Failed to initialize vector store singleton")

    # ✅ SIGNAL TO NGINX BUILD PACK THAT APP IS READY
    try:
        pathlib.Path("/tmp/app-initialized").write_text("ready")
        logger.info("Signaled readiness to Nginx via /tmp/app-initialized")
    except Exception as e:
        logger.error(f"Failed to signal readiness to Nginx: {e}")

# Routers
app.include_router(rag.router, prefix=f"{settings.API_V1_STR}/rag", tags=["rag"])
app.include_router(youtube.router, prefix=f"{settings.API_V1_STR}/youtube", tags=["youtube"])
app.include_router(gmail.router, prefix=f"{settings.API_V1_STR}/gmail", tags=["gmail"])

@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}