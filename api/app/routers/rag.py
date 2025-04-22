from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.concurrency import run_in_threadpool
from typing import Optional, Dict, List, Any
import logging
from concurrent.futures import ThreadPoolExecutor

from ..models.rag import (
    QueryRequest,
    QueryResponse,
    ProcessDocumentRequest,
    ProcessDocumentResponse,
    URLRequest,
    URLProcessResponse,
    SourceInfoResponse,
)
from ..services.cosmos_connector import CosmosConnector
from ..dependencies import get_cosmos_connector, get_vector_store_singleton
from ..utils.timeout import run_with_timeout
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Query documents using the RAG system.
    This endpoint accepts a question and returns an answer based on the stored documents.
    """
    try:
        # Check if vector store is available
        if vector_store is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vector store connection not available. Please check your configuration."
            )
            
        result = await cosmos.query_documents(
            vector_store=vector_store,
            query=request.query,
            model_name=request.model_name,
            temperature=request.temperature,
            filter_sources=request.filter_sources
        )
        if not result.get("success"):
            # Propagate error message from connector if available
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("answer", "Failed to process query")
            )
        return result
    except Exception as e:
        logger.exception(f"API Error during /query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during query processing: {str(e)}"
        )

@router.post("/query/stream")
async def stream_query_documents(
    request: QueryRequest,
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
):
    """
    Stream query results from the RAG system.
    This endpoint accepts a question and returns a streaming response with chunks of the answer.
    """
    try:
        # Check if vector store is available
        if vector_store is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vector store connection not available. Please check your configuration."
            )
            
        # Create an async generator function to handle the streaming
        async def response_generator():
            async for text_chunk in cosmos.stream_query_documents(
                vector_store=vector_store,
                query=request.query,
                model_name=request.model_name,
                temperature=request.temperature,
                filter_sources=request.filter_sources
            ):
                # Yield each text chunk as it comes
                yield f"{text_chunk}"
        
        # Return a streaming response using the generator
        return StreamingResponse(
            response_generator(),
            media_type="text/plain"
        )
    except Exception as e:
        logger.exception(f"API Error during /query/stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during streaming query: {str(e)}"
        )

@router.post("/document", response_model=ProcessDocumentResponse)
async def process_document(
    file: UploadFile = File(...),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(50),
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Process and store a document in the vector database.
    This endpoint accepts a file upload (e.g., PDF) and processes it for RAG.
    """
    try:
        # Check if vector store is available
        if vector_store is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vector store connection not available. Please check your configuration."
            )
            
        content = await file.read()
        if not content:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Received empty file.")

        result = await cosmos.process_document(
            vector_store=vector_store,
            content=content,
            filename=file.filename,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, # Or 500 depending on error type
                detail=result.get("message", "Failed to process document")
            )
        return result
    except HTTPException as he:
        # Re-raise known HTTP exceptions
        raise he
    except Exception as e:
        logger.exception(f"API Error during /document processing for {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred processing document: {str(e)}"
        )
    finally:
        # Ensure file handle is closed if necessary (FastAPI usually handles this)
        if file and hasattr(file, 'close') and callable(file.close):
            await file.close()

@router.post("/url", response_model=URLProcessResponse)
async def process_url(
    request: URLRequest,
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Process and store content from a URL.
    Delegates directly to the cosmos connector.
    """
    try:
        # Check if vector store is available
        if vector_store is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vector store connection not available. Please check your configuration."
            )
            
        # Call the connector's process_url method
        result = await cosmos.process_url(
            vector_store=vector_store,
            url=request.url,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )

        if not result.get("success"):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, # Or 500 if appropriate for specific connector errors
                detail=result.get("message", "Failed to process URL")
            )
        return result # Matches ProcessDocumentResponse structure
    except HTTPException as he:
        # Re-raise HTTPExceptions directly
        raise he
    except Exception as e:
        logger.exception(f"API Error during /url processing for {request.url}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred processing URL: {str(e)}"
        )

@router.get("/sources", response_model=SourceInfoResponse)
async def get_source_info(
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Get information about the available sources in the vector database.
    Retrieves counts of documents/vectors associated with each source type.
    """
    try:
        logger.info("Attempting to retrieve source information from vector store.")
        # Use the injected vector store singleton instead of getting it from cosmos
        vector_store_instance = vector_store
        
        if not vector_store_instance or not hasattr(vector_store_instance, 'client') or not hasattr(vector_store_instance.client, 'describe_index_stats') or not hasattr(vector_store_instance.client, 'query'):
             logger.error("Vector store instance or required Pinecone methods not available.")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Vector store connection or methods unavailable.")

        # --- Get total document count from Pinecone --- 
        document_count = 0
        try:
            # Use the underlying Pinecone index object for stats
            index_obj = vector_store_instance.client
            index_stats = await run_in_threadpool(index_obj.describe_index_stats)
            # Extract total count if available
            document_count = index_stats.get('total_vector_count', index_stats.get('total_record_count', 0))
            logger.info(f"Total documents/vectors from index stats: {document_count}")
        except Exception as stats_error:
            logger.warning(f"Could not get Pinecone index stats: {stats_error}")
            document_count = 0
        
        # Define expected source types without attempting to count them individually
        defined_source_types = ["pdf", "url", "youtube", "gmail"]
        
        # Create source counts dictionary with zeros since we're not implementing individual counting
        source_counts = {source_type: 0 for source_type in defined_source_types}
        
        # Return the basic stats
        return {
            "source_types": defined_source_types,
            "document_count": document_count,
            "source_counts": source_counts
        }
    except Exception as e:
        logger.exception(f"API Error during /sources lookup: {e}")
        raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail=f"Failed to retrieve source information: {str(e)}"
        )

@router.get("/health")
async def health_check(
    vector_store = Depends(get_vector_store_singleton)
) -> Dict[str, Any]:
    """Health check endpoint for the RAG router.
    Verifies that the vector store is accessible.
    """
    result = {
        "status": "healthy",
        "vector_store": "ok" if vector_store else "unavailable"
    }
    
    # Only test vector store if it's available
    if vector_store:
        try:
            # Check if we can access Pinecone stats with timeout
            index_stats = await run_with_timeout(
                run_in_threadpool,
                settings.PINECONE_INDEX_STATS_TIMEOUT,
                vector_store.client.describe_index_stats
            )
            # Add count to health
            result["vector_count"] = index_stats.get('total_vector_count', 0)
        except Exception as e:
            logger.error(f"Health check - Vector store error: {e}")
            result["vector_store"] = "error"
            result["status"] = "degraded"
    else:
        result["status"] = "degraded"
        
    return result

@router.post("/cache/clear")
async def clear_cache(
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Clear the query response cache.
    This is an administrative endpoint to use when content is updated or for troubleshooting.
    """
    try:
        cosmos.query_cache.clear()
        logger.info("Query cache cleared via API request")
        return {
            "success": True, 
            "message": "Query cache has been successfully cleared"
        }
    except Exception as e:
        logger.exception(f"Error clearing query cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while clearing the cache: {str(e)}"
        ) 