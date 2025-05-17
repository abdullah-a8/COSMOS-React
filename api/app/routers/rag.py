from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.concurrency import run_in_threadpool
from typing import Optional, Dict, List, Any
import logging
from concurrent.futures import ThreadPoolExecutor
import uuid
import psycopg
from langchain.schema.messages import SystemMessage
from langchain_postgres import PostgresChatMessageHistory

from ..models.rag import (
    QueryRequest,
    QueryResponse,
    ProcessDocumentRequest,
    ProcessDocumentResponse,
    URLRequest,
    URLProcessResponse,
    SourceInfoResponse,
    ImageProcessResponse,
)
from ..services.cosmos_connector import CosmosConnector
from ..dependencies import get_cosmos_connector, get_vector_store_singleton
from ..utils.timeout import run_with_timeout
from ..core.config import settings
from ..utils.memory import ChatMemoryManager
from ..db.session import get_db, get_db_connection_string
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Query documents using the RAG system.
    This endpoint accepts a question and returns an answer based on the stored documents.
    
    If session_id is provided, chat history from PostgreSQL will be used to enhance the context.
    """
    try:
        # Use provided session_id if available, otherwise generate a new one
        session_id = request.session_id if request.session_id else str(uuid.uuid4())
        logger.info(f"Processing query with session_id: {session_id}")
        
        # Handle system messages differently - these are for topic reset or other system operations
        if request.is_system_message:
            logger.info(f"Received system message: '{request.query}'")
            
            # For system messages (like conversation reset), we just store them and return a simple response
            if session_id:
                try:
                    # Use a special SystemMessage to mark this in chat history
                    connection_string = get_db_connection_string()
                    connection = psycopg.connect(connection_string)
                    
                    # Create a proper SystemMessage instead of a dictionary
                    system_message = SystemMessage(
                        content=request.query,
                        additional_kwargs={"is_topic_reset": True}
                    )
                    
                    # Initialize the history object
                    history = PostgresChatMessageHistory(
                        "chat_message_history",
                        session_id,
                        sync_connection=connection
                    )
                    
                    # Add directly to history
                    history.add_message(system_message)
                    logger.info(f"Stored system message in chat history for session: {session_id}")
                    
                    # Close connection
                    if connection:
                        connection.close()
                except Exception as e:
                    logger.error(f"Error storing system message: {str(e)}")
            
            # Return a simple success response for system messages
            return {
                "answer": "System message processed successfully",
                "success": True,
                "session_id": session_id
            }
        
        # Regular query processing (non-system messages) continues below:
        # Check if vector store is available
        if vector_store is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vector store connection not available. Please check your configuration."
            )
            
        # Get chat history if session_id provided
        chat_history = []
        if session_id:
            try:
                chat_history = await ChatMemoryManager.get_memory(db, session_id)
                if chat_history:
                    logger.info(f"Found {len(chat_history)} messages in chat history for session {session_id}")
            except Exception as e:
                logger.error(f"Error retrieving chat history: {e}")
                # Continue without chat history if retrieval fails
        
        # Format chat history for the RAG query if needed
        # For now, we'll add historical context to the query itself if needed
        augmented_query = request.query
        if chat_history and len(chat_history) > 0:
            # Better conversation formatting with query analysis
            query_lower = request.query.lower()
            
            # Check if the query is asking about something from a previous conversation
            is_reference_query = any(ref_term in query_lower for ref_term in [
                "what we just talked about", "what did we discuss", "our discussion", 
                "previous topic", "earlier conversation", "you mentioned", "tell me more", 
                "as you said", "continue", "expand on", "earlier you said"
            ])
            
            # Format conversation context
            if is_reference_query:
                logger.info(f"Detected reference query: '{request.query}', providing extended conversation context")
                # Use all available messages for maximum context in reference queries
                context = "\n\n".join([f"{'User' if msg.type == 'human' else 'Assistant'}: {msg.content}" 
                                     for msg in chat_history])
            else:
                # Use memory window for regular queries
                context = "\n\n".join([f"{'User' if msg.type == 'human' else 'Assistant'}: {msg.content}" 
                                     for msg in chat_history[-settings.MEMORY_WINDOW:]])
            
            # Improved prompt for better context handling
            augmented_query = f"""Previous conversation:
{context}

Current question: {request.query}

Instructions for answering:
1. Remember to answer the current question in the context of the previous conversation.
2. If the current question references something from the previous conversation, directly address it.
3. If the current question is about a new topic, you can acknowledge the topic shift and focus on the new question.
4. If the question asks about "what we talked about" or similar, provide a comprehensive summary of the conversation topics.
5. Always prioritize accurate information from reliable sources."""
            
            logger.debug(f"Created enhanced query with conversation context (preview): {augmented_query[:100]}...")
        else:
            logger.debug("No conversation history found, using original query.")
        
        # Process the query with the RAG system
        result = await cosmos.query_documents(
            vector_store=vector_store,
            query=augmented_query,  # Use augmented query with history context
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
        
        # Store the conversation in memory if successful
        if session_id and result.get("success", False):
            try:
                await ChatMemoryManager.add_messages(
                    db=db,
                    session_id=session_id,
                    query=request.query,  # Store original query, not augmented
                    response=result.get("answer", "")
                )
            except Exception as e:
                logger.error(f"Error storing chat memory: {e}")
                # Continue even if memory storage fails
        
        # Add session ID to the response
        result["session_id"] = session_id
        
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
    cosmos: CosmosConnector = Depends(get_cosmos_connector),
    db: AsyncSession = Depends(get_db)
):
    """
    Stream query results from the RAG system.
    This endpoint accepts a question and returns a streaming response with chunks of the answer.
    
    If session_id is provided, chat history from PostgreSQL will be used to enhance the context.
    """
    try:
        # Use provided session_id if available, otherwise generate a new one
        session_id = request.session_id if request.session_id else str(uuid.uuid4())
        logger.debug(f"Processing streaming query with session_id: {session_id}")
        
        # Check if vector store is available
        if vector_store is None:
            logger.error("Vector store is not available, cannot process query")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vector store connection not available. Please check your configuration."
            )
            
        # Get chat history if session_id provided
        chat_history = []
        if session_id:
            try:
                chat_history = await ChatMemoryManager.get_memory(db, session_id)
                chat_msg_count = len(chat_history) if chat_history else 0
                logger.info(f"Found {chat_msg_count} messages in chat history for session {session_id}")
                
                # Log the first few chars of the most recent messages for debugging
                if chat_msg_count > 0:
                    for i, msg in enumerate(chat_history[-min(3, chat_msg_count):]):
                        msg_preview = msg.content[:50] + "..." if len(msg.content) > 50 else msg.content
                        logger.debug(f"Recent message {i+1}: {msg.type} - {msg_preview}")
            except Exception as e:
                logger.error(f"Error retrieving chat history: {e}")
                # Continue without chat history if retrieval fails
        
        # Format chat history for the RAG query
        # We'll use the original query in the cosmos query but provide context about the chat history
        query_with_context = request.query
        
        # Always add conversation context if there's any history, even just one message
        if chat_history and len(chat_history) > 0:
            # Format the conversation history nicely for the LLM
            conversation = []
            
            # Better conversation formatting with query analysis
            query_lower = request.query.lower()
            
            # Check if the query is asking about something from a previous conversation
            is_reference_query = any(ref_term in query_lower for ref_term in [
                "what we just talked about", "what did we discuss", "our discussion", 
                "previous topic", "earlier conversation", "you mentioned", "tell me more", 
                "as you said", "continue", "expand on", "earlier you said"
            ])
            
            # Add more context if the query seems to reference previous conversation
            if is_reference_query:
                logger.info(f"Detected reference query: '{request.query}', providing extended conversation context")
                # Use all available messages for maximum context
                for msg in chat_history:
                    role = "User" if msg.type == "human" else "Assistant"
                    conversation.append(f"{role}: {msg.content}")
            else:
                # Use normal context window for non-reference queries
                for msg in chat_history[-settings.MEMORY_WINDOW:]:
                    role = "User" if msg.type == "human" else "Assistant"
                    conversation.append(f"{role}: {msg.content}")
            
            conversation_text = "\n\n".join(conversation)
            
            # Improved prompt for better context handling and topic switching
            query_with_context = f"""I want you to consider the conversation history below when answering the user's current question.

Previous conversation:
{conversation_text}

Current question: {request.query}

Instructions for answering:
1. Remember to answer the current question in the context of the previous conversation.
2. If the current question references something from the previous conversation, directly address it.
3. If the current question is about a new topic, you can acknowledge the topic shift and focus on the new question.
4. If the question asks about "what we talked about" or similar, provide a comprehensive summary of the conversation topics.
5. Always prioritize accurate information from reliable sources.
"""
            logger.debug(f"Created enhanced query with conversation context (preview): {query_with_context[:100]}...")
        else:
            logger.debug("No conversation history found, using original query.")
        
        # Capture full response for memory storage
        full_response = []
            
        # Create an async generator function to handle the streaming
        async def response_generator():
            nonlocal full_response
            async for text_chunk in cosmos.stream_query_documents(
                vector_store=vector_store,
                query=query_with_context,  # Use query with conversation context
                model_name=request.model_name,
                temperature=request.temperature,
                filter_sources=request.filter_sources
            ):
                # Collect chunks for the complete response
                full_response.append(text_chunk)
                # Yield each text chunk as it comes
                yield f"{text_chunk}"
            
            # Store the conversation in memory after full response is generated
            if len(full_response) > 0:
                try:
                    complete_response = "".join(full_response)
                    # Skip storing if response is empty or error message
                    if len(complete_response.strip()) > 0 and not complete_response.startswith("Error:"):
                        logger.debug(f"Storing conversation in memory: User query: {request.query[:50]}... | Response: {complete_response[:50]}...")
                        await ChatMemoryManager.add_messages(
                            db=db,
                            session_id=session_id,
                            query=request.query,  # Store original query, not augmented
                            response=complete_response
                        )
                    else:
                        logger.warning(f"Not storing response in memory as it appears to be empty or an error: {complete_response[:100]}")
                except Exception as e:
                    logger.error(f"Error storing streaming chat memory: {e}")
                    # Continue even if memory storage fails
            else:
                logger.warning("No response chunks collected, nothing to store in memory")
        
        # Return a streaming response using the generator
        return StreamingResponse(
            response_generator(),
            media_type="text/plain",
            headers={"X-Session-ID": session_id}  # Include session ID in headers
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
        defined_source_types = ["pdf", "url", "youtube", "gmail", "image"]
        
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

@router.post("/image", response_model=ImageProcessResponse)
async def process_image(
    file: UploadFile = File(...),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(50),
    vector_store = Depends(get_vector_store_singleton),
    cosmos: CosmosConnector = Depends(get_cosmos_connector)
) -> Dict[str, Any]:
    """
    Process and store an image in the vector database using OCR.
    This endpoint accepts an image file, processes it with Mistral OCR,
    and stores the extracted text in the vector database.
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

        # Validate the content type
        if not file.content_type.startswith("image/") and file.content_type != "application/pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is not an image or PDF. Please upload a valid image or PDF file."
            )

        result = await cosmos.process_image(
            vector_store=vector_store,
            content=content,
            filename=file.filename,
            content_type=file.content_type,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to process image")
            )
        return result
    except HTTPException as he:
        # Re-raise known HTTP exceptions
        raise he
    except Exception as e:
        logger.exception(f"API Error during /image processing for {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred processing image: {str(e)}"
        )
    finally:
        # Ensure file handle is closed if necessary (FastAPI usually handles this)
        if file and hasattr(file, 'close') and callable(file.close):
            await file.close() 