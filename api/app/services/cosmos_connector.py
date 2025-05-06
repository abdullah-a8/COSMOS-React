import sys
from pathlib import Path
from typing import Dict, Optional, Any
import importlib.util
import logging
import importlib
import io
import asyncio
import hashlib
import json
import base64
import requests
from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool
from mistralai import Mistral, SDKError
from ..core.config import settings
from ..utils.timeout import run_with_timeout
from googleapiclient.errors import HttpError as GoogleHttpError

logger = logging.getLogger(__name__)

# Simple in-memory cache for query results with TTL
class QueryCache:
    def __init__(self, max_size=100, ttl_seconds=300):
        self.cache = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.access_times = {}
        
    def _generate_key(self, query, model_name, temperature, filter_sources):
        """Generate a unique key for the query parameters"""
        # Convert filter_sources to a stable string representation
        filter_str = json.dumps(filter_sources, sort_keys=True) if filter_sources else "{}"
        # Combine all parameters in a string and hash
        combined = f"{query}|{model_name}|{temperature}|{filter_str}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get(self, query, model_name, temperature, filter_sources):
        """Retrieve a cached response or None if not found/expired"""
        import time
        current_time = time.time()
        
        key = self._generate_key(query, model_name, temperature, filter_sources)
        if key in self.cache:
            entry_time, response = self.cache[key]
            # Check if entry is still valid
            if current_time - entry_time <= self.ttl_seconds:
                # Update access time
                self.access_times[key] = current_time
                logger.info(f"Cache hit for query: {query[:50]}...")
                return response
            else:
                # Entry expired, remove it
                logger.debug(f"Cache entry expired for key: {key}")
                self._remove_entry(key)
        return None
    
    def set(self, query, model_name, temperature, filter_sources, response):
        """Store a response in the cache"""
        import time
        current_time = time.time()
        
        key = self._generate_key(query, model_name, temperature, filter_sources)
        self.cache[key] = (current_time, response)
        self.access_times[key] = current_time
        
        # Check if we need to evict entries
        if len(self.cache) > self.max_size:
            self._evict_oldest()
        
        logger.info(f"Cached response for query: {query[:50]}...")
        
    def _remove_entry(self, key):
        """Remove an entry from the cache"""
        if key in self.cache:
            del self.cache[key]
        if key in self.access_times:
            del self.access_times[key]
            
    def _evict_oldest(self):
        """Evict the least recently accessed entries to make room"""
        # Sort by access time, oldest first
        sorted_keys = sorted(self.access_times.items(), key=lambda x: x[1])
        # Remove oldest 10% or at least 1 entry
        entries_to_remove = max(1, int(len(self.cache) * 0.1))
        for i in range(entries_to_remove):
            if i < len(sorted_keys):
                self._remove_entry(sorted_keys[i][0])
                
    def clear(self):
        """Clear the entire cache"""
        self.cache.clear()
        self.access_times.clear()
        logger.info("Query cache cleared")

class CosmosConnector:
    """
    Service to connect the API with the underlying COSMOS functionality.
    This acts as a bridge between the FastAPI endpoints and the core COSMOS code.
    """
    
    def __init__(self):
        """Initialize the connector by adding COSMOS to system path"""
        # Add the COSMOS core path to system path to enable imports
        cosmos_path = Path(settings.COSMOS_CORE_PATH).resolve()
        if str(cosmos_path) not in sys.path:
            sys.path.append(str(cosmos_path))
        
        logger.info(f"Initialized COSMOS connector with path: {cosmos_path}")
        
        # Import and initialize core modules dynamically
        self.data_extraction = self._import_module("core.data_extraction")
        self.processing = self._import_module("core.processing")
        self.vector_store = self._import_module("core.vector_store")
        self.chain = self._import_module("core.chain")
        
        # Initialize response cache
        self.query_cache = QueryCache(
            max_size=settings.QUERY_CACHE_SIZE if hasattr(settings, 'QUERY_CACHE_SIZE') else 100,
            ttl_seconds=settings.QUERY_CACHE_TTL if hasattr(settings, 'QUERY_CACHE_TTL') else 300
        )
        
        # Import Gmail agent if available
        try:
            self.gmail_logic = self._import_module("core.agents.gmail_logic")
            self.has_gmail = True
            logger.info("Gmail agent module loaded successfully.")
        except ImportError:
            logger.warning("Gmail agent module (core.agents.gmail_logic) not found or import failed.")
            self.has_gmail = False
            self.gmail_logic = None
        
        # Check for C++ hash generator availability
        try:
            self.hash_generator_cpp = self._import_module("core.cpp_modules.hash_generator")
            self.use_cpp_hash = True
            logger.info("Using C++ hash generator for improved performance in connector.")
        except (ImportError, ModuleNotFoundError):
            self.use_cpp_hash = False
            logger.info("C++ hash generator not available in connector, using Python implementation.")
    
    def _import_module(self, module_name: str) -> Any:
        """Dynamically import a module from COSMOS"""
        try:
            # Ensure relative imports within COSMOS work correctly
            # Since we added the COSMOS root to sys.path, direct import should work
            return importlib.import_module(module_name)
        except ImportError as e:
            logger.error(f"Failed to import module {module_name} from {settings.COSMOS_CORE_PATH}: {e}")
            raise # Re-raise to indicate a critical setup error
    
    # RAG Chatbot Functions
    async def query_documents(self, vector_store, query: str, model_name: str, temperature: float,
                             filter_sources: Optional[Dict[str, bool]] = None) -> Dict[str, Any]:
        """Perform a RAG query using the core COSMOS functionality"""
        try:
            import time
            start_time = time.time()
            
            # Check for cached response first
            cached_response = self.query_cache.get(query, model_name, temperature, filter_sources)
            if cached_response:
                logger.info(f"Returning cached response for query: {query[:50]}...")
                return cached_response
            
            # Use the provided vector_store instead of initializing one
            if not vector_store:
                logger.error("Vector store is not available.")
                return {"answer": "Error: Vector store is not available.", "success": False}
            
            # Prepare source filter
            source_filter = {}
            if filter_sources:
                allowed_types = [stype for stype, include in filter_sources.items() if include]
                if allowed_types:
                     # Revert to simpler filter syntax, assuming source_type is top-level metadata
                     source_filter = {"source_type": {"$in": allowed_types}}
            
            # Retrieve relevant documents
            retriever = vector_store.as_retriever(
                search_type="similarity",
                # Ensure filter is passed correctly
                search_kwargs={"filter": source_filter} if source_filter else {}
            )
            
            # Initialize chain
            chain_start = time.time()
            chain = self.chain.get_chain(model_name=model_name, temperature=temperature)
            chain_time = time.time() - chain_start
            logger.info(f"Chain initialization took {chain_time:.2f}s")
            
            # --- Perform Retrieval Step FIRST ---
            logger.info(f"Query: '{query}'")
            logger.info(f"Retriever search_kwargs: {retriever.search_kwargs}") # Log the filter being used
            logger.info(f"Retriever search_type: {retriever.search_type}")
            logger.info(f"Attempting to retrieve documents...")
            
            # Start retrieval timing
            retrieval_start = time.time()
            
            # Run synchronous retriever.invoke in threadpool with timeout
            try:
                # Apply timeout to the Pinecone query operation
                relevant_docs = await run_with_timeout(
                    run_in_threadpool,
                    settings.PINECONE_QUERY_TIMEOUT,
                    retriever.invoke, 
                    query
                )
                retrieval_time = time.time() - retrieval_start
                logger.info(f"Retrieved {len(relevant_docs)} documents in {retrieval_time:.2f}s")
            except asyncio.TimeoutError:
                # Handle timeout gracefully
                logger.error(f"Pinecone query timed out after {settings.PINECONE_QUERY_TIMEOUT}s")
                error_response = {
                    "answer": f"I'm sorry, but the search operation timed out. This might be due to temporary service issues. Please try again in a moment.",
                    "success": False,
                    "timing": {
                        "chain_init": chain_time,
                        "retrieval": settings.PINECONE_QUERY_TIMEOUT,
                        "context_formatting": 0,
                        "llm_generation": 0,
                        "total": time.time() - start_time
                    }
                }
                return error_response
            
            # Log retrieved docs content (or just metadata if too long)
            if relevant_docs:
                for i, doc in enumerate(relevant_docs):
                     logger.debug(f"  Doc {i} Metadata: {doc.metadata}")
                     # logger.debug(f"  Doc {i} Content: {doc.page_content[:100]}...") # Uncomment if needed
            
            # Start context formatting timing
            context_start = time.time()
            # --- Format documents into context string WITH SOURCE CITATION ---
            if relevant_docs:
                formatted_context = ""
                for i, doc in enumerate(relevant_docs):
                    # Extract source metadata
                    metadata = doc.metadata
                    source_type = metadata.get("source_type", "unknown")
                    display_name = metadata.get("display_name", "Unknown source")
                    source_id = metadata.get("source_id", "N/A") # Get the base source ID

                    # Get additional details based on source type for richer citation
                    source_details = ""
                    if source_type == "url":
                        domain = metadata.get("domain", "")
                        url = metadata.get("url", "")
                        source_details = f"DOMAIN: {domain}\nURL: {url}"
                    elif source_type == "youtube":
                        # Assuming source_id is like "youtube_VIDEOID"
                        video_id = source_id.replace("youtube_", "") if source_id.startswith("youtube_") else source_id
                        url = metadata.get("url", "") # URL might also be in metadata
                        source_details = f"VIDEO_ID: {video_id}\nURL: {url}"
                    elif source_type == "pdf":
                        source_details = f"DOC_ID: {source_id}"
                    elif source_type == "image":
                        # Add specific handling for image sources
                        source_details = f"IMAGE_ID: {source_id}"
                        if "content_type" in metadata:
                            source_details += f"\nFORMAT: {metadata.get('content_type')}"
                        if "ocr_processed" in metadata and metadata.get("ocr_processed"):
                            source_details += "\nEXTRACTION: OCR"
                    else:
                        source_details = f"SOURCE_ID: {source_id}"

                    # Format each document chunk with structured source info
                    formatted_context += f"\n--- BEGIN EXTRACT #{i+1} ---\n"
                    formatted_context += doc.page_content
                    formatted_context += f"\n--- END EXTRACT #{i+1} ---\n"
                    formatted_context += f"SOURCE INFO FOR EXTRACT #{i+1}:\n"
                    formatted_context += f"TYPE: {source_type}\n"
                    formatted_context += f"NAME: {display_name}\n"
                    formatted_context += source_details + "\n"

                context = formatted_context.strip() # Remove leading/trailing whitespace

            else:
                logger.warning("No relevant documents found to generate context.")
                context = "No relevant context found." # Provide neutral context if no docs
            
            context_time = time.time() - context_start
            logger.info(f"Context formatting took {context_time:.2f}s")

            # --- Invoke Chain with CORRECT Input --- 
            # Start LLM generation timing
            llm_start = time.time()
            
            # Add LaTeX support instruction to the question
            latex_enhanced_query = query
            if any(keyword in query.lower() for keyword in ["math", "equation", "formula", "recurrence", "time complexity", "big o", "complexity"]):
                latex_enhanced_query = query + " Please format any mathematical expressions or equations using LaTeX syntax with $ for inline math and $$ for display math."
            
            # Run synchronous chain.invoke in threadpool
            response_dict = await run_in_threadpool(chain.invoke, {"question": latex_enhanced_query, "context": context})
            llm_time = time.time() - llm_start
            logger.info(f"LLM generation took {llm_time:.2f}s")
            
            # Extract relevant parts (adjust based on actual chain output)
            # The actual response from the chain might be just the string, or a dict
            if isinstance(response_dict, str):
                answer = response_dict
            else:
                 answer = response_dict.get("answer", response_dict.get("result", str(response_dict)))
            
            # Calculate total time
            total_time = time.time() - start_time
            logger.info(f"Total query processing took {total_time:.2f}s")
            
            # Create response with timing information
            response = {
                "answer": answer,
                "success": True,
                "timing": {
                    "chain_init": chain_time,
                    "retrieval": retrieval_time,
                    "context_formatting": context_time,
                    "llm_generation": llm_time,
                    "total": total_time
                }
            }
            
            # Cache the successful response
            self.query_cache.set(query, model_name, temperature, filter_sources, response)
            
            return response
            
        except Exception as e:
            logger.exception(f"Error during query_documents: {e}")
            return {
                "answer": f"I'm sorry, but an error occurred while processing your query: {str(e)}",
                "success": False
            }
    
    # Streaming version of query_documents
    async def stream_query_documents(self, vector_store, query: str, model_name: str, temperature: float,
                             filter_sources: Optional[Dict[str, bool]] = None):
        """
        Perform a RAG query with streaming response.
        Returns an async generator that yields response chunks as they're generated.
        """
        try:
            import time
            start_time = time.time()
            
            # Use the provided vector_store instead of initializing one
            if not vector_store:
                logger.error("Vector store is not available.")
                yield "Error: Vector store is not available."
                return
            
            # Prepare source filter
            source_filter = {}
            if filter_sources:
                allowed_types = [stype for stype, include in filter_sources.items() if include]
                if allowed_types:
                     # Revert to simpler filter syntax, assuming source_type is top-level metadata
                     source_filter = {"source_type": {"$in": allowed_types}}
            
            # Retrieve relevant documents
            retriever = vector_store.as_retriever(
                search_type="similarity",
                # Ensure filter is passed correctly
                search_kwargs={"filter": source_filter} if source_filter else {}
            )
            
            # Initialize streaming chain
            chain_start = time.time()
            streaming_chain = self.chain.get_streaming_chain(model_name=model_name, temperature=temperature)
            chain_time = time.time() - chain_start
            logger.info(f"Streaming chain initialization took {chain_time:.2f}s")
            
            if not streaming_chain:
                yield "Error: Could not initialize streaming chain."
                return
            
            # --- Perform Retrieval Step FIRST ---
            logger.info(f"Stream Query: '{query}'")
            logger.info(f"Retriever search_kwargs: {retriever.search_kwargs}")
            logger.info(f"Retriever search_type: {retriever.search_type}")
            logger.info(f"Attempting to retrieve documents...")
            
            # Start retrieval timing
            retrieval_start = time.time()
            
            # Run synchronous retriever.invoke in threadpool with timeout
            try:
                # Apply timeout to the Pinecone query operation
                relevant_docs = await run_with_timeout(
                    run_in_threadpool,
                    settings.PINECONE_QUERY_TIMEOUT,
                    retriever.invoke, 
                    query
                )
                retrieval_time = time.time() - retrieval_start
                logger.info(f"Retrieved {len(relevant_docs)} documents in {retrieval_time:.2f}s")
            except asyncio.TimeoutError:
                # Handle timeout gracefully
                logger.error(f"Pinecone query timed out after {settings.PINECONE_QUERY_TIMEOUT}s")
                yield f"I'm sorry, but the search operation timed out. This might be due to temporary service issues. Please try again in a moment."
                return
            
            # Format context the same way as in query_documents
            context_start = time.time()
            if relevant_docs:
                formatted_context = ""
                for i, doc in enumerate(relevant_docs):
                    # Extract source metadata
                    metadata = doc.metadata
                    source_type = metadata.get("source_type", "unknown")
                    display_name = metadata.get("display_name", "Unknown source")
                    source_id = metadata.get("source_id", "N/A")

                    # Get additional details based on source type
                    source_details = ""
                    if source_type == "url":
                        domain = metadata.get("domain", "")
                        url = metadata.get("url", "")
                        source_details = f"DOMAIN: {domain}\nURL: {url}"
                    elif source_type == "youtube":
                        video_id = source_id.replace("youtube_", "") if source_id.startswith("youtube_") else source_id
                        url = metadata.get("url", "")
                        source_details = f"VIDEO_ID: {video_id}\nURL: {url}"
                    elif source_type == "pdf":
                        source_details = f"DOC_ID: {source_id}"
                    elif source_type == "image":
                        # Add specific handling for image sources
                        source_details = f"IMAGE_ID: {source_id}"
                        if "content_type" in metadata:
                            source_details += f"\nFORMAT: {metadata.get('content_type')}"
                        if "ocr_processed" in metadata and metadata.get("ocr_processed"):
                            source_details += "\nEXTRACTION: OCR"
                    else:
                        source_details = f"SOURCE_ID: {source_id}"

                    # Format each document chunk
                    formatted_context += f"\n--- BEGIN EXTRACT #{i+1} ---\n"
                    formatted_context += doc.page_content
                    formatted_context += f"\n--- END EXTRACT #{i+1} ---\n"
                    formatted_context += f"SOURCE INFO FOR EXTRACT #{i+1}:\n"
                    formatted_context += f"TYPE: {source_type}\n"
                    formatted_context += f"NAME: {display_name}\n"
                    formatted_context += source_details + "\n"

                context = formatted_context.strip()
            else:
                logger.warning("No relevant documents found to generate context.")
                context = "No relevant context found."
            
            context_time = time.time() - context_start
            logger.info(f"Context formatting took {context_time:.2f}s")

            # --- Stream Response ---
            logger.info("Starting streaming response generation...")
            llm_start = time.time()
            
            # Add LaTeX support instruction to the question
            latex_enhanced_query = query
            if any(keyword in query.lower() for keyword in ["math", "equation", "formula", "recurrence", "time complexity", "big o", "complexity"]):
                latex_enhanced_query = query + " Please format any mathematical expressions or equations using LaTeX syntax with $ for inline math and $$ for display math."
            
            async for chunk in streaming_chain.astream({"question": latex_enhanced_query, "context": context}):
                # Process the chunk based on its format
                # With ChatGroq, the chunks are typically dict-like objects with content
                if hasattr(chunk, 'content'):
                    content = chunk.content
                elif isinstance(chunk, dict) and 'content' in chunk:
                    content = chunk['content']
                elif isinstance(chunk, str):
                    content = chunk
                else:
                    # Try to extract content from other structures or just convert to string
                    content = str(chunk)
                
                if content:
                    yield content
            
            llm_time = time.time() - llm_start
            logger.info(f"Streaming LLM generation completed in {llm_time:.2f}s")
            
            # Calculate and log total time
            total_time = time.time() - start_time
            logger.info(f"Total streaming query processing took {total_time:.2f}s")
            
        except Exception as e:
            logger.exception(f"Error during stream_query_documents: {e}")
            yield f"I'm sorry, but an error occurred while processing your query: {str(e)}"
    
    async def process_document(self, vector_store, content: bytes, filename: str, chunk_size: int, 
                              chunk_overlap: int) -> Dict[str, Any]:
        """Process and store a document in the vector database"""
        try:
            # Use the provided vector_store instead of initializing one
            if not vector_store:
                logger.error("Vector store is not available.")
                return {"success": False, "message": "Error: Vector store is not available."}
                
            source_type = ""
            doc_id = None
            text = None

            # Extract based on filename extension
            lower_filename = filename.lower()
            if lower_filename.endswith(".pdf"):
                # Handle PDF
                text, doc_id = await run_in_threadpool(self.data_extraction.extract_text_from_pdf, io.BytesIO(content))
                source_type = "pdf"
            elif lower_filename.endswith((".txt", ".md")):
                 try:
                     text = content.decode('utf-8') # Simple text decode
                 except UnicodeDecodeError:
                     text = content.decode('latin-1', errors='ignore') # Fallback encoding
                 doc_id = self.data_extraction.hash_generator.compute_sha256(content) # Use hash as ID
                 source_type = "text"
            # Add other file types (e.g., .docx, .pptx) if needed in core.data_extraction
            else:
                 return {"success": False, "message": f"Unsupported file type: {filename}"}
            
            if not text or (isinstance(text, str) and text.startswith("Error")):
                error_message = text if (isinstance(text, str) and text.startswith("Error")) else "Failed to extract text"
                return {"success": False, "message": f"{error_message} from document: {filename}"}
                
            # Process the document - Call correct function name
            chunks, chunk_ids = await run_in_threadpool(
                self.processing.process_content, # Use process_content
                content=text,
                source_id=str(doc_id),
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                # source_type and source_metadata are handled within process_content
                # source_type=source_type, 
                # source_metadata={"filename": filename}
            )
            
            if not chunks:
                 return {"success": False, "message": f"Document processing resulted in no chunks for {filename}."}

            # Use the provided vector_store with timeout
            try:
                # Apply timeout to the Pinecone upsert operation
                await run_with_timeout(
                    run_in_threadpool, 
                    settings.PINECONE_UPSERT_TIMEOUT,
                    vector_store.add_documents, 
                    chunks, 
                    ids=chunk_ids
                )
                logger.info(f"Successfully added {len(chunks)} chunks to vector store")
            except asyncio.TimeoutError:
                logger.error(f"Vector store update timed out after {settings.PINECONE_UPSERT_TIMEOUT}s")
                return {"success": False, "message": "Document was processed but could not be stored due to a timeout in the vector database. Please try again."}
            
            return {
                "success": True,
                "document_id": str(doc_id),
                "chunk_count": len(chunks)
            }
        except Exception as e:
            logger.exception(f"Error in process_document for {filename}: {e}")
            return {"success": False, "message": str(e)}
    
    # YouTube Functions
    async def process_youtube(self, vector_store, url: str, chunk_size: int, 
                             chunk_overlap: int) -> Dict[str, Any]:
        """Process a YouTube transcript and store in vector database"""
        try:
            # Use the provided vector_store instead of initializing one
            if not vector_store:
                logger.error("Vector store is not available.")
                return {"success": False, "message": "Error: Vector store is not available."}
                
            # Extract video_id first to check if it's already processed
            video_id = None
            if "v=" in url:
                video_id = url.split("v=")[1].split("&")[0]
            elif "youtu.be/" in url:
                video_id = url.split("youtu.be/")[1].split("?")[0]
            
            if not video_id:
                return {"success": False, "message": "Invalid YouTube URL format."}
                
            # Create the search filter to check for existing video
            youtube_source_id = f"youtube_{video_id}"
            filter_query = {"source_id": youtube_source_id}
            
            # Use retriever to check if any documents exist for this video
            retriever = vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"filter": filter_query, "k": 1}  # Just need to check if any exist
            )
            
            # Check if video already exists in database
            try:
                existing_docs = await run_in_threadpool(retriever.invoke, "test query")
                if existing_docs and len(existing_docs) > 0:
                    logger.info(f"Video {video_id} already exists in the database with {len(existing_docs)} chunks")
                    return {
                        "success": True,
                        "video_id": youtube_source_id,
                        "chunk_count": len(existing_docs),
                        "message": "Video already processed. Skipping."
                    }
            except Exception as e:
                # If there's an error checking, log it but continue processing
                logger.warning(f"Error checking for existing video {video_id}: {e}")
                
            # Extract transcript
            transcript, video_id = await run_in_threadpool(self.data_extraction.extract_transcript_details, url)
            
            if not transcript or transcript.startswith("Error"):
                return {"success": False, "message": transcript}
            
            # Process the transcript
            chunks, chunk_ids = await run_in_threadpool(
                self.processing.process_content,
                content=transcript,
                source_id=str(video_id),
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            
            if not chunks:
                return {"success": False, "message": "YouTube processing resulted in no chunks."}

            # Add the chunks to the vector store
            await run_in_threadpool(vector_store.add_documents, chunks, ids=chunk_ids)
            
            return {
                "success": True,
                "video_id": str(video_id),
                "chunk_count": len(chunks)
            }
        except Exception as e:
            logger.exception(f"Error in process_youtube for {url}: {e}")
            return {"success": False, "message": str(e)}
    
    # --- Gmail Agent Functions ---
    
    async def _get_gmail_service_wrapper(self) -> Optional[Any]:
        """Internal helper to get the Gmail service using threadpool."""
        if not self.has_gmail:
            logger.error("Attempted to get Gmail service, but module is not loaded.")
            return None
        try:
            # get_gmail_service handles caching, token loading/refreshing internally
            service = await run_in_threadpool(self.gmail_logic.get_gmail_service)
            if not service:
                 logger.warning("get_gmail_service returned None. Authentication might be required.")
            return service
        except Exception as e:
            # Catch potential exceptions during service retrieval/refresh
            logger.exception(f"Error getting Gmail service: {e}")
            return None

    async def gmail_auth_url(self) -> Dict[str, str]:
        """Calls the core logic to get the OAuth authorization URL."""
        if not self.has_gmail:
            raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Gmail agent not available.")
            
        try:
            # Read credentials file in threadpool
            auth_url, state = await run_in_threadpool(self.gmail_logic.get_authorization_url)
            
            if not auth_url:
                logger.error("Failed to generate Gmail authorization URL. Check credentials file.")
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                    detail="Failed to generate Gmail authorization URL. Ensure credentials file exists and is valid.")
            
            # state can be stored in user session for validation later
            return {"auth_url": auth_url}
        except FileNotFoundError as e:
            logger.error(f"Gmail credentials file not found by core logic: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Configuration error: {e}")
        except Exception as e:
            logger.exception("Unexpected error generating Gmail auth URL")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error generating auth URL: {str(e)}")

    async def gmail_auth_callback(self, code: str) -> Dict[str, Any]:
        """Handles the OAuth callback code by calling the core logic."""
        if not self.has_gmail:
            raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Gmail agent not available.")
            
        try:
            # This involves network I/O (fetching token) and file I/O (saving token)
            success = await run_in_threadpool(self.gmail_logic.handle_oauth_callback, code)
            
            if success:
                logger.info("Gmail OAuth callback handled successfully by core logic.")
                return {"success": True, "message": "Gmail authentication successful."}
            else:
                logger.error("Core logic failed to handle Gmail OAuth callback.")
                # Consider more specific error based on core logs
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                                    detail="Failed to exchange authorization code for token. The code might be invalid, expired, or there could be a configuration issue.")
        except FileNotFoundError as e:
            logger.error(f"Gmail credentials file not found during callback: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Configuration error: {e}")
        except Exception as e:
            logger.exception("Unexpected error handling Gmail auth callback")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error during callback: {str(e)}")

    async def fetch_emails(self, query: Optional[str], max_results: int) -> Dict[str, Any]:
        """Fetches emails using the core Gmail logic."""
        service = await self._get_gmail_service_wrapper()
        if not service:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
                                 detail="Gmail service not available. Please authenticate.")
        
        try:
            # Call Gmail API in threadpool
            emails = await run_in_threadpool(self.gmail_logic.get_emails, service, max_results, query)
            return {"success": True, "emails": emails}
        except GoogleHttpError as e:
            logger.error(f"Google API error fetching emails: {e}")
            detail = f"Google API error: {e.resp.status} - {e.reason}"
            status_code = status.HTTP_502_BAD_GATEWAY # Error from upstream service
            if e.resp.status == 401:
                 status_code = status.HTTP_401_UNAUTHORIZED
                 detail = "Gmail authentication error. Please re-authenticate."
            elif e.resp.status == 403:
                 status_code = status.HTTP_403_FORBIDDEN
                 detail = "Permission denied. Check API scopes or user permissions."
            raise HTTPException(status_code=status_code, detail=detail)
        except ValueError as e:
             logger.error(f"Value error fetching emails: {e}") # Likely service not init
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except Exception as e:
            logger.exception("Unexpected error fetching emails")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error fetching emails: {str(e)}")

    async def get_email_details(self, email_id: str) -> Dict[str, Any]:
        """Gets details for a single email using core logic."""
        service = await self._get_gmail_service_wrapper()
        if not service:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
                                 detail="Gmail service not available. Please authenticate.")

        try:
            # Call Gmail API in threadpool
            details = await run_in_threadpool(self.gmail_logic.get_email_details, service, email_id)
            if details is None:
                # Core logic returns None for 404
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Email with ID {email_id} not found.")
            return {"success": True, "details": details}
        except GoogleHttpError as e:
            logger.error(f"Google API error getting email details for {email_id}: {e}")
            detail = f"Google API error: {e.resp.status} - {e.reason}"
            status_code = status.HTTP_502_BAD_GATEWAY
            if e.resp.status == 401:
                 status_code = status.HTTP_401_UNAUTHORIZED
                 detail = "Gmail authentication error. Please re-authenticate."
            elif e.resp.status == 403:
                 status_code = status.HTTP_403_FORBIDDEN
                 detail = "Permission denied."
            elif e.resp.status == 404:
                 # Should be caught by the 'details is None' check above, but handle defensively
                 status_code = status.HTTP_404_NOT_FOUND
                 detail = f"Email with ID {email_id} not found."
            raise HTTPException(status_code=status_code, detail=detail)
        except ValueError as e:
             logger.error(f"Value error getting email details: {e}")
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error getting email details for {email_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error retrieving email: {str(e)}")

    async def classify_email(self, email_id: str) -> Dict[str, Any]:
        """Classifies an email using core logic (fetches details first)."""
        # First, get email details (including body and subject)
        email_data = await self.get_email_details(email_id) # This handles auth check & errors
        details = email_data.get('details', {})
        email_body = details.get('body', '')
        email_subject = details.get('subject', '')

        if not email_body and not email_subject:
            logger.warning(f"No body or subject found for email {email_id} to classify.")
            # Return neutral result for empty content
            return {"success": True, "classification": "Unknown (empty content)"}
        
        try:
            # Call OpenAI API via core logic in threadpool
            classification = await run_in_threadpool(
                self.gmail_logic.classify_email, 
                email_body, 
                email_subject
            )
            if classification.startswith("Error:"):
                 logger.error(f"Core logic failed to classify email {email_id}: {classification}")
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=classification)
                 
            return {"success": True, "classification": classification}
        except ValueError as e: # Catch config errors from core logic (e.g., API key)
             logger.error(f"Configuration error during email classification: {e}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error classifying email {email_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error classifying email: {str(e)}")

    async def summarize_email(self, email_id: str) -> Dict[str, Any]:
        """Summarizes an email using core logic (fetches details first)."""
        email_data = await self.get_email_details(email_id) # Handles auth & errors
        details = email_data.get('details', {})
        email_body = details.get('body', '')

        # Improved check for empty or whitespace-only body
        if not email_body or not email_body.strip():
            logger.warning(f"[Email ID: {email_id}] No usable body found for email to summarize.")
            return {"success": True, "summary": "(Email body is empty or could not be extracted)"}

        # Add check for minimum length before calling OpenAI
        MIN_BODY_LENGTH_FOR_SUMMARY = 30 
        if len(email_body) < MIN_BODY_LENGTH_FOR_SUMMARY:
            logger.warning(f"[Email ID: {email_id}] Email body is too short ({len(email_body)} chars) to summarize meaningfully.")
            return {"success": True, "summary": "(Email content too short to summarize)"}
            
        try:
            # Log the exact body being sent to the core summarization function
            logger.info(f"[Email ID: {email_id}] Sending body to core summarization (length: {len(email_body)}): '{email_body[:200]}...'")
            
            # Call OpenAI API via core logic in threadpool
            summary = await run_in_threadpool(self.gmail_logic.summarize_email, email_body)
            
            # Log the exact summary received from the core function
            logger.info(f"[Email ID: {email_id}] Received summary from core logic (length: {len(summary)}): '{summary}'")
            
            if summary.startswith("Error:"):
                 logger.error(f"[Email ID: {email_id}] Core logic failed to summarize email: {summary}")
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=summary)
                 
            return {"success": True, "summary": summary}
        except ValueError as e:
             logger.error(f"Configuration error during email summarization: {e}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error summarizing email {email_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error summarizing email: {str(e)}")

    async def generate_email_reply(self, email_id: str, tone: str, style: str, 
                                  length: str, context: str) -> Dict[str, Any]:
        """Generates an email reply using core logic (fetches details first)."""
        email_data = await self.get_email_details(email_id) # Handles auth & errors
        details = email_data.get('details', {})
        email_body = details.get('body', '')
        email_subject = details.get('subject', '')
        # Extract sender name (might need parsing from 'From' header)
        sender_header = details.get('from', '')
        sender_name = sender_header.split('<')[0].strip() if '<' in sender_header else sender_header.strip()

        try:
            # Call OpenAI API via core logic in threadpool
            reply_text = await run_in_threadpool(
                self.gmail_logic.generate_reply,
                email_body, email_subject, sender_name, 
                tone, style, length, context
            )
            if reply_text.startswith("Error:"):
                 logger.error(f"Core logic failed to generate reply for email {email_id}: {reply_text}")
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=reply_text)
                 
            # Return the reply under the key expected by EmailReplyResponse model
            return {"success": True, "reply": reply_text}
        except ValueError as e:
             logger.error(f"Configuration error during reply generation: {e}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error generating reply for email {email_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error generating reply: {str(e)}")

    async def send_email_reply(self, email_id: str, reply_text: str) -> Dict[str, Any]:
        """Sends a reply to an email, ensuring proper threading."""
        service = await self._get_gmail_service_wrapper()
        if not service:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
                                 detail="Gmail service not available. Please authenticate.")
        
        # 1. Get original email details for threading headers
        original_email_data = await self.get_email_details(email_id)
        original_details = original_email_data.get('details', {})

        # Extract necessary info for sending
        to_address = original_details.get('from') # Reply to the original sender
        original_subject = original_details.get('subject', '')
        thread_id = original_details.get('thread_id')
        message_id_header = original_details.get('message_id_header') # <xxx@mail.gmail.com>
        references_header = original_details.get('references_header') # <yyy@mail.gmail.com> <zzz@mail.gmail.com>

        if not to_address:
             logger.error(f"Could not determine recipient ('From' header) for reply to {email_id}")
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not determine reply recipient.")

        # Prepare subject (common pattern: Re: Original Subject)
        reply_subject = f"Re: {original_subject}" if not original_subject.lower().startswith("re:") else original_subject
        
        # 2. Send the email using core logic
        try:
            # Call Gmail API in threadpool
            sent_message_info = await run_in_threadpool(
                self.gmail_logic.send_email,
                service=service,
                to=to_address,
                subject=reply_subject,
                body=reply_text,
                thread_id=thread_id,
                in_reply_to=message_id_header, # Pass the <id>
                references=references_header   # Pass the <id1> <id2> ...
            )
            
            if sent_message_info and 'id' in sent_message_info:
                 logger.info(f"Successfully sent reply for email {email_id}. New message ID: {sent_message_info['id']}")
                 # Mark original email as read? Optional.
                 # await run_in_threadpool(self.gmail_logic.modify_email_labels, service, email_id, labels_to_remove=['UNREAD'])
                 return {"success": True, "sent_message_id": sent_message_info['id']}
            else:
                 # Defensive check
                 logger.error(f"Core send_email function did not return expected info for reply to {email_id}")
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send reply, core function returned unexpected result.")

        except GoogleHttpError as e:
            logger.error(f"Google API error sending reply for {email_id}: {e}")
            detail = f"Google API error: {e.resp.status} - {e.reason}"
            status_code = status.HTTP_502_BAD_GATEWAY
            if e.resp.status == 401:
                 status_code = status.HTTP_401_UNAUTHORIZED
                 detail = "Gmail authentication error. Please re-authenticate."
            elif e.resp.status == 403:
                 status_code = status.HTTP_403_FORBIDDEN
                 detail = "Permission denied."
            raise HTTPException(status_code=status_code, detail=detail)
        except ValueError as e:
             logger.error(f"Value error sending reply: {e}")
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error sending reply for {email_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error sending reply: {str(e)}")

    async def mark_email_read(self, email_id: str) -> Dict[str, Any]:
        """Marks a specific email as read by removing the UNREAD label."""
        service = await self._get_gmail_service_wrapper()
        if not service:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, 
                                 detail="Gmail service not available. Please authenticate.")
        
        try:
            # Call core logic in threadpool
            success = await run_in_threadpool(
                self.gmail_logic.modify_email_labels, 
                service=service,
                message_id=email_id, 
                labels_to_remove=['UNREAD']
            )
            
            if success:
                 logger.info(f"Successfully marked email {email_id} as read.")
                 return {"success": True, "message": f"Email {email_id} marked as read."}
            else:
                 # Core logic logs warnings on non-critical failures (e.g., 404)
                 logger.error(f"Failed to mark email {email_id} as read (core function returned False).")
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                     detail=f"Failed to mark email {email_id} as read. Check logs for details.")
        except GoogleHttpError as e:
            logger.error(f"Google API error marking email {email_id} as read: {e}")
            detail = f"Google API error: {e.resp.status} - {e.reason}"
            status_code = status.HTTP_502_BAD_GATEWAY
            if e.resp.status == 401:
                 status_code = status.HTTP_401_UNAUTHORIZED
                 detail = "Gmail authentication error. Please re-authenticate."
            elif e.resp.status == 403:
                 status_code = status.HTTP_403_FORBIDDEN
                 detail = "Permission denied."
            elif e.resp.status == 404: # Handle 404 explicitly if core logic raises it instead of returning False
                 status_code = status.HTTP_404_NOT_FOUND
                 detail = f"Email with ID {email_id} not found."
            raise HTTPException(status_code=status_code, detail=detail)
        except ValueError as e: # e.g., service not initialized
             logger.error(f"Value error marking email {email_id} as read: {e}")
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except Exception as e:
            logger.exception(f"Unexpected error marking email {email_id} as read")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error marking email as read: {str(e)}")

    # Add after process_document method
    async def process_url(self, vector_store, url: str, chunk_size: int, 
                         chunk_overlap: int) -> Dict[str, Any]:
        """Process and store content from a URL in the vector database"""
        try:
            # Use the provided vector_store instead of initializing one
            if not vector_store:
                logger.error("Vector store is not available.")
                return {"success": False, "message": "Error: Vector store is not available."}
                
            # Extract text from URL
            text, url_id = await run_in_threadpool(self.data_extraction.extract_text_from_url, url)
            
            if not text or text.startswith("Error"):
                return {"success": False, "message": text}
            
            # Process the text - Call correct function name
            chunks, chunk_ids = await run_in_threadpool(
                self.processing.process_content, # Use process_content
                content=text,
                source_id=str(url_id),
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                # source_type and source_metadata handled internally by process_content
            )
            
            if not chunks:
                return {"success": False, "message": "URL processing resulted in no chunks."}

            # Use the provided vector_store
            await run_in_threadpool(vector_store.add_documents, chunks, ids=chunk_ids) # Pass chunk_ids
            
            return {
                "success": True,
                "document_id": str(url_id),
                "chunk_count": len(chunks)
            }
        except Exception as e:
            logger.exception(f"Error in process_url for {url}: {e}")
            return {"success": False, "message": str(e)}
    
    async def process_image(self, vector_store, content: bytes, filename: str, content_type: str,
                          chunk_size: int, chunk_overlap: int) -> Dict[str, Any]:
        """Process and store an image in the vector database using Mistral OCR"""
        try:
            # Use the provided vector_store instead of initializing one
            if not vector_store:
                logger.error("Vector store is not available.")
                return {"success": False, "message": "Error: Vector store is not available."}
            
            # Generate a hash for the image content to use as the document ID
            doc_id = None
            if self.use_cpp_hash:
                # Use C++ implementation for hashing if available
                try:
                    doc_id = self.hash_generator_cpp.compute_sha256(content)
                except Exception as e:
                    logger.error(f"Error using C++ hash generator: {e}")
                    doc_id = hashlib.sha256(content).hexdigest()
            else:
                # Use Python implementation
                doc_id = hashlib.sha256(content).hexdigest()
            
            source_type = "image"
            logger.info(f"Processing {filename} of type {content_type}")
            
            # Process the image with Mistral OCR
            extracted_text = await run_in_threadpool(
                self._process_with_mistral_ocr,
                content,
                content_type
            )
            
            # Better error handling for OCR results
            if not extracted_text:
                logger.error(f"Empty text returned from OCR for {filename}")
                return {"success": False, "message": f"No text extracted from image: {filename}"}
                
            if isinstance(extracted_text, str) and extracted_text.startswith("Error"):
                logger.error(f"OCR error for {filename}: {extracted_text}")
                return {"success": False, "message": f"{extracted_text} from image: {filename}"}
                
            # Log the length of extracted text for debugging
            logger.info(f"Successfully extracted {len(extracted_text)} characters from {filename}")
            
            # First, prepare text with metadata prefix to ensure it's processed correctly
            metadata_prefix = f"IMAGE SOURCE: {filename}\n\n"
            content_with_metadata = metadata_prefix + extracted_text
            
            # Process the extracted text
            chunks, chunk_ids = await run_in_threadpool(
                self.processing.process_content,
                content=content_with_metadata,
                source_id=str(doc_id),
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            
            # Manually update the metadata for each chunk to ensure source_type is set correctly
            for chunk in chunks:
                if hasattr(chunk, 'metadata'):
                    chunk.metadata['source_type'] = 'image'
                    chunk.metadata['display_name'] = filename
                    # Keep these for debugging and provenance tracking
                    chunk.metadata['ocr_processed'] = True
                    chunk.metadata['content_type'] = content_type
            
            if not chunks:
                logger.warning(f"No chunks created from extracted text for {filename}")
                return {"success": False, "message": f"Image processing resulted in no chunks for {filename}."}
                
            logger.info(f"Created {len(chunks)} chunks from image OCR text")
            
            # Use the provided vector_store with timeout
            try:
                # Apply timeout to the vector store upsert operation
                await run_with_timeout(
                    run_in_threadpool, 
                    settings.PINECONE_UPSERT_TIMEOUT,
                    vector_store.add_documents, 
                    chunks, 
                    ids=chunk_ids
                )
                logger.info(f"Successfully added {len(chunks)} chunks to vector store from image")
            except asyncio.TimeoutError:
                logger.error(f"Vector store update timed out after {settings.PINECONE_UPSERT_TIMEOUT}s")
                return {"success": False, "message": "Image was processed but could not be stored due to a timeout in the vector database. Please try again."}
            
            return {
                "success": True,
                "document_id": str(doc_id),
                "chunk_count": len(chunks),
                "ocr_status": "Completed successfully"
            }
        except Exception as e:
            logger.exception(f"Error in process_image for {filename}: {e}")
            return {"success": False, "message": str(e)}
    
    def _process_with_mistral_ocr(self, document_content: bytes, content_type: str) -> str:
        """Process an image or PDF with Mistral OCR using the mistralai SDK"""
        try:
            # Check if API key is configured
            if not settings.MISTRAL_API_KEY:
                logger.error("Mistral API key is not configured")
                return "Error: Mistral API key is not configured. Please set MISTRAL_API_KEY in your environment."
            
            # Initialize Mistral client
            client = Mistral(api_key=settings.MISTRAL_API_KEY)
            
            # Encode the document content as base64
            encoded_content = base64.b64encode(document_content).decode('utf-8')
            
            # Construct the data URI
            data_uri = f"data:{content_type};base64,{encoded_content}"
            
            # Determine document type for the API call
            doc_type_param = "document_url" if content_type == "application/pdf" else "image_url"
            
            # Prepare the document dictionary for the API call
            document_payload = {
                "type": doc_type_param,
                doc_type_param: data_uri
            }
            
            logger.info(f"Calling Mistral OCR API for content type: {content_type}")
            
            # Make the API request using the SDK
            # Note: The SDK itself might handle retries/timeouts internally, 
            # but we add a general exception handling layer.
            ocr_response = client.ocr.process(
                model="mistral-ocr-latest",
                document=document_payload,
                # include_image_base64=False # Default is False, we only need text
            )
            
            # Combine markdown text from all pages
            full_markdown_text = "\n\n".join([page.markdown for page in ocr_response.pages])
            
            if not full_markdown_text or not full_markdown_text.strip():
                logger.warning(f"SDK OCR processing returned empty text for content type {content_type}. Will attempt REST fallback.")
                # Let execution continue to fallback without returning success
            else:
                # Only return success if text was actually extracted
                logger.info(f"SDK: Successfully extracted {len(full_markdown_text)} characters via OCR.")
                return full_markdown_text # Success using SDK
            
        except SDKError as e:
            # Handle specific Mistral API errors (e.g., auth, rate limits, invalid input)
            logger.error(f"Mistral OCR SDK API error ({e.status_code}): {e.message} - Will attempt REST fallback.")
            pass # Continue to fallback section
        except Exception as e:
            # Catch any other unexpected SDK errors including connection errors
            logger.warning(f"Unexpected error during Mistral OCR SDK processing: {e} - Will attempt REST fallback.")
            pass # Continue to fallback section
            
        # --- Attempt 2: Use REST API with requests as fallback ---    
        logger.warning("SDK processing failed. Attempting Mistral OCR processing using REST API fallback...")
        try:
            # Encode the document content as base64 (might be redundant, but safe)
            encoded_content = base64.b64encode(document_content).decode('utf-8')
            
            headers = {
                "Authorization": f"Bearer {settings.MISTRAL_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            
            # Use the /v1/ocr endpoint for the fallback, as used by the SDK
            endpoint_url = "https://api.mistral.ai/v1/ocr"
            
            # Determine document type for the API call
            doc_type_param = "document_url" if content_type == "application/pdf" else "image_url"
            data_uri = f"data:{content_type};base64,{encoded_content}"
            document_payload = {
                "type": doc_type_param,
                doc_type_param: data_uri
            }
            
            payload = {
                "model": "mistral-ocr-latest",
                "document": document_payload
            }
            
            logger.info(f"Calling Mistral OCR REST endpoint: {endpoint_url}")
            
            # Make the API request using requests
            response = requests.post(
                endpoint_url,
                headers=headers,
                json=payload,
                timeout=60  # Use a reasonable timeout
            )
            
            # Check response status
            response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
            
            result = response.json()
            
            # Combine markdown text from all pages (assuming same structure as SDK)
            full_markdown_text = "\n\n".join([page["markdown"] for page in result.get("pages", [])])
            
            if not full_markdown_text or not full_markdown_text.strip():
                logger.error(f"REST fallback OCR processing returned empty text for content type {content_type}. The document might be empty or unreadable.")
                return "Error: OCR processing (fallback) returned empty text. The document might not contain readable text."
                
            logger.info(f"REST Fallback: Successfully extracted {len(full_markdown_text)} characters via OCR.")
            return full_markdown_text # Success using REST fallback
            
        except requests.exceptions.Timeout:
            logger.error("Mistral OCR REST API request timed out")
            return "Error: OCR processing (fallback) timed out."
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Mistral OCR REST API connection error: {e}")
            return "Error: OCR processing (fallback) failed: Could not connect to the OCR service."
        except requests.exceptions.HTTPError as e:
             # Handle HTTP errors from raise_for_status()
             status_code = e.response.status_code
             try: # Try to get JSON error detail
                 error_detail = e.response.json().get("message", e.response.text)
             except ValueError:
                 error_detail = e.response.text
             error_message = f"HTTP error {status_code}: {error_detail}"
             logger.error(f"Mistral OCR REST API error: {error_message}")
             if status_code == 401:
                 return "Error: OCR processing (fallback) failed: Authentication error (invalid Mistral API key)"
             elif status_code == 429:
                 return "Error: OCR processing (fallback) failed: Rate limit exceeded."
             else:
                 return f"Error: OCR processing (fallback) failed: {error_message}"
        except Exception as e:
            # Catch any other unexpected errors during fallback
            logger.exception(f"Unexpected error during Mistral OCR REST fallback processing: {e}")
            return f"Error: An unexpected error occurred during OCR processing (fallback): {str(e)}"