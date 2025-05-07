import secrets
from typing import List, Optional, Union, Dict, Any
import json
import logging # Import logging
import os

from pydantic import AnyHttpUrl, field_validator, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__) # Add logger

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "COSMOS API"
    PROJECT_DESCRIPTION: str = "API for Collaborative Organized System for Multiple Operating Specialists"
    PROJECT_VERSION: str = "0.1.0"
    
    # CORS settings - default to allow common development URLs if not set in .env
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Robust validator for CORS_ORIGINS that handles various input formats."""
        # Already a list, nothing to do
        if isinstance(v, list):
            logger.info(f"CORS_ORIGINS is already a list: {v}")
            return v
            
        # Handle string input
        if isinstance(v, str):
            # Try parsing as JSON first (for proper ["*"] format)
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    logger.info(f"CORS_ORIGINS parsed from JSON string: {parsed}")
                    return parsed
            except json.JSONDecodeError:
                pass  # Not JSON, continue with other parsing methods
                
            # Direct wildcard case
            if v == "*":
                logger.warning("CORS is set to wildcard '*'. This should only be used in development.")
                return ["*"]
                
            # Comma separated string (no JSON)
            if "," in v:
                result = [i.strip() for i in v.split(",") if i.strip()]
                logger.info(f"CORS_ORIGINS parsed from comma-separated string: {result}")
                return result
                
            # Single value (not a wildcard)
            if v:
                logger.info(f"CORS_ORIGINS set to single value: {v}")
                return [v]
        
        # Fallback to default if nothing else worked
        logger.warning(f"Could not parse CORS_ORIGINS '{v}'. Using default localhost values.")
        return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Security
    SECRET_KEY: str = "PLEASE_CHANGE_ME_IN_PRODUCTION_ENV"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # External API Keys
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    
    # Path to the core COSMOS functionality
    COSMOS_CORE_PATH: str = "../"  # Default for local, overridden by env in Docker
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Pinecone timeout settings
    PINECONE_QUERY_TIMEOUT: float = float(os.getenv("PINECONE_QUERY_TIMEOUT", "30.0"))  # 30 seconds default
    PINECONE_UPSERT_TIMEOUT: float = float(os.getenv("PINECONE_UPSERT_TIMEOUT", "60.0"))  # 60 seconds default
    PINECONE_INDEX_STATS_TIMEOUT: float = float(os.getenv("PINECONE_INDEX_STATS_TIMEOUT", "15.0"))  # 15 seconds default
    
    # Query cache settings
    QUERY_CACHE_SIZE: int = int(os.getenv("QUERY_CACHE_SIZE", "100"))  # 100 entries default
    QUERY_CACHE_TTL: int = int(os.getenv("QUERY_CACHE_TTL", "300"))  # 5 minutes TTL default
    
    # Beta Authentication Settings
    BETA_ENABLED: bool = True
    BETA_PASSWORD: str = os.getenv("COSMOS_BETA_PASSWORD", "CosmosClosedBeta2025")
    BETA_SESSION_TIMEOUT: int = 60 * 60  # 60 minutes in seconds
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

    @field_validator('SECRET_KEY', mode='before')
    @classmethod # Needs to be classmethod for field_validator
    def check_secret_key_production(cls, v, info): # Pydantic v2 validator signature
        # Pydantic v2: Access validation context or model data via 'info'
        # Assuming model_dump() gives the data being validated if info.data isn't directly available
        # Or rely on accessing environment directly if needed, though using model data is cleaner
        # Let's assume info.data works as intended by pydantic-settings
        try:
            env = info.data.get('ENVIRONMENT', 'development') # Access other fields via info.data
        except AttributeError:
             # Fallback if info.data is not available (might happen depending on exact pydantic version/usage)
             # This is less ideal as it re-reads the env var
             env = os.getenv('ENVIRONMENT', 'development')

        default_key = "PLEASE_CHANGE_ME_IN_PRODUCTION_ENV"
        if env.lower() == 'production' and v == default_key:
            msg = "CRITICAL: SECRET_KEY is not set for production environment! Please set it in .env or environment variables."
            logger.error(msg)
            raise ValueError(msg)
        elif v == default_key:
             logger.warning("Security Risk: SECRET_KEY is using the default placeholder. Set a strong secret key in .env or environment variables.")
        return v

# Initialize settings
settings = Settings() 