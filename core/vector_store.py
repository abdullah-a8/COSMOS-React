from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import Pinecone
import os
import logging

# Set up logging
logger = logging.getLogger(__name__)

def check_document_exists(vector_store, source_id):
    """
    Check if documents with the given source_id already exist in the vector store.
    
    Args:
        vector_store: A Pinecone vector store instance
        source_id: The source ID to check for
        
    Returns:
        bool: True if documents exist, False otherwise
    """
    if not vector_store:
        logger.error("Vector store object is None, cannot check for existing documents.")
        return False
    
    try:
        filter_query = {"source_id": source_id}
        # Try to get one document matching the filter
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"filter": filter_query, "k": 1}
        )
        # Use a generic query - we only care about the filter
        docs = retriever.invoke("test")
        # Return True if any docs were found
        return len(docs) > 0
    except Exception as e:
        logger.error(f"Error checking existing documents in Pinecone: {e}")
        return False

def add_chunks_to_vector_store(vector_store, chunks, chunk_ids):
    """
    Add document chunks to the vector store.
    
    Args:
        vector_store: A Pinecone vector store instance
        chunks: List of document chunks to add
        chunk_ids: List of IDs corresponding to the chunks
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not chunks or not chunk_ids:
        logger.error("No chunks or IDs provided to add_chunks_to_vector_store.")
        return False
    if not vector_store:
        logger.error("Vector store object is None, cannot add chunks.")
        return False

    try:
        source_info = chunks[0].metadata.get('source_id', 'N/A') if chunks else 'N/A'
        logger.info(f"Adding/updating {len(chunks)} chunks in Pinecone for source ID associated with first chunk: {source_info}")
        
        # Add the documents to the vector store
        vector_store.add_documents(documents=chunks, ids=chunk_ids)
        logger.info("Successfully added/updated chunks in Pinecone.")
        return True
    except Exception as e:
        logger.error(f"Error adding documents to Pinecone: {e}")
        return False

def get_pinecone_vector_store():
    """
    Get a connection to the Pinecone vector store.
    
    Note: This function is kept for compatibility with existing code.
    For the API layer, prefer using the singleton pattern implemented in
    api/app/dependencies.py to avoid redundant connections.
    
    Returns:
        Pinecone: A Pinecone vector store instance, or None if connection fails
    """
    index_name = os.getenv("PINECONE_INDEX_NAME")
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY") 

    if not index_name:
        logger.error("PINECONE_INDEX_NAME environment variable not set.")
        return None
    if not pinecone_api_key:
        logger.error("PINECONE_API_KEY environment variable not set.")
        return None
    if not openai_api_key:
        logger.error("OPENAI_API_KEY environment variable not set (needed for embeddings).")
        return None

    try:
        # Initialize OpenAI Embeddings - 3072 for text-embedding-3-large
        embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
        
        logger.info(f"Initializing Pinecone connection for index: {index_name}")
        # Connect to existing index for retrieval/adding
        vector_store = Pinecone.from_existing_index(index_name=index_name, embedding=embeddings)
        logger.info("Pinecone connection initialized.")
        return vector_store
    except Exception as e:
        logger.error(f"Error initializing Pinecone connection: {e}")
        return None 