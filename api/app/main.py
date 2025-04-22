from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

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

# Use a simpler CORS configuration that's more robust
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

app.include_router(rag.router, prefix=f"{settings.API_V1_STR}/rag", tags=["rag"])
app.include_router(youtube.router, prefix=f"{settings.API_V1_STR}/youtube", tags=["youtube"])
app.include_router(gmail.router, prefix=f"{settings.API_V1_STR}/gmail", tags=["gmail"])

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Welcome to COSMOS API - use /api/v1/docs for documentation"}

@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"} 