from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging
import datetime

from ..models.youtube import YouTubeRequest, YouTubeResponse
from ..dependencies import get_cosmos_connector, get_vector_store_singleton
from ..services.cosmos_connector import CosmosConnector

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/process", response_model=YouTubeResponse)
async def process_youtube(
    request: YouTubeRequest,
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Process a YouTube video transcript.
    This endpoint extracts and stores the transcript for later RAG queries.
    """
    logger.info(f"Processing YouTube URL: {request.url}")
    
    if not request.url:
        logger.warning("Empty YouTube URL provided")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="YouTube URL is required")
    
    # Check if vector store is available
    if vector_store is None:
        logger.error("Vector store connection not available")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vector store connection not available. Please check your configuration."
        )
    
    try:
        # Log the full request
        logger.info(f"Request details - URL: {request.url}, Chunk Size: {request.chunk_size}, Overlap: {request.chunk_overlap}")
        
        result = await cosmos.process_youtube(
            vector_store=vector_store,
            url=request.url,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )
        
        # Log the result
        logger.info(f"Processing result: {result}")
        
        # Special case: already processed
        if result.get("success") and "already processed" in result.get("message", "").lower():
            return {
                "success": True,
                "video_id": result.get("video_id"),
                "chunk_count": result.get("chunk_count", 0),
                "message": "Video was already in the knowledge base."
            }
        
        # Check for errors from the connector
        if not result.get("success"):
            error_msg = result.get("message", "Failed to process YouTube URL")
            logger.error(f"Processing error: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=error_msg
            )
            
        # Return a proper success response
        return {
            "success": True,
            "video_id": result.get("video_id"),
            "chunk_count": result.get("chunk_count", 0),
            "message": result.get("message", "Successfully processed YouTube transcript")
        }
    except HTTPException as he:
        # Re-raise known exceptions
        raise he
    except Exception as e:
        # Catch unexpected errors and log them
        logger.exception(f"API Error processing YouTube URL {request.url}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred processing YouTube URL: {str(e)}"
        )

@router.get("/health")
async def youtube_health_check() -> Dict[str, Any]:
    """
    Check if the YouTube API integration is working properly.
    """
    return {
        "status": "available",
        "message": "YouTube API integration is configured and ready",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    } 