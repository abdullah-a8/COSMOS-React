"""
API dependency injection module.
Contains singletons and dependency functions for FastAPI dependency injection.
"""
from .services.cosmos_connector import CosmosConnector
import logging
from typing import Optional, AsyncGenerator
from langchain_pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

# Singletons
_singleton_cosmos_connector_instance = CosmosConnector()
_vector_store_instance = None
_embeddings_instance = None

# Create cached embeddings getter
@lru_cache(maxsize=1)
def get_embeddings_singleton():
    """Returns a singleton instance of OpenAIEmbeddings."""
    global _embeddings_instance
    if _embeddings_instance is None:
        try:
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                logger.error("OPENAI_API_KEY environment variable not set")
                return None
                
            logger.info("Initializing OpenAI Embeddings singleton")
            _embeddings_instance = OpenAIEmbeddings(model="text-embedding-3-large")
            logger.info("OpenAI Embeddings singleton initialized successfully")
        except Exception as e:
            logger.exception(f"Failed to initialize OpenAI Embeddings: {e}")
            return None
    return _embeddings_instance

def get_vector_store_singleton() -> Optional[Pinecone]:
    """Returns a singleton instance of the Pinecone vector store."""
    global _vector_store_instance
    if _vector_store_instance is None:
        try:
            # Get configuration
            index_name = os.getenv("PINECONE_INDEX_NAME")
            pinecone_api_key = os.getenv("PINECONE_API_KEY")
            
            # Validate configuration
            if not index_name:
                logger.error("PINECONE_INDEX_NAME environment variable not set")
                return None
            if not pinecone_api_key:
                logger.error("PINECONE_API_KEY environment variable not set")
                return None
                
            # Get the embeddings instance
            embeddings = get_embeddings_singleton()
            if not embeddings:
                logger.error("Failed to get embeddings instance")
                return None
                
            # Initialize Pinecone connection
            logger.info(f"Initializing Pinecone vector store singleton for index: {index_name}")
            _vector_store_instance = Pinecone.from_existing_index(
                index_name=index_name, 
                embedding=embeddings
            )
            logger.info("Pinecone vector store singleton initialized successfully")
        except Exception as e:
            logger.exception(f"Failed to initialize Pinecone vector store: {e}")
            return None
    return _vector_store_instance

async def get_cosmos_connector() -> AsyncGenerator[CosmosConnector, None]:
    """Dependency function that yields the singleton CosmosConnector instance."""
    # Yield the instance created within this module
    yield _singleton_cosmos_connector_instance 