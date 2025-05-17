import secrets
from typing import List, Optional, Union, Dict, Any
import json
import logging
import os

from pydantic import AnyHttpUrl, field_validator, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

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
        # Check for APP_URL (common in platforms like Heroku, Render, etc.)
        app_url = os.environ.get("APP_URL")
        if app_url:
            logger.info(f"Using APP_URL for CORS: {app_url}")
            return [app_url]
        
        logger.warning(f"Could not parse CORS_ORIGINS '{v}'. Using default localhost values.")
        return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Security - generate a secure key if not provided
    SECRET_KEY: str = os.environ.get("SECRET_KEY", secrets.token_urlsafe(32) if os.environ.get("ENVIRONMENT") == "production" else "PLEASE_CHANGE_ME_IN_PRODUCTION_ENV")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # External API Keys
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None
    
    # Path to the core COSMOS functionality
    COSMOS_CORE_PATH: str = "../"  # Default for local, overridden by env in Docker
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Environment
    ENVIRONMENT: str = os.environ.get("ENVIRONMENT", "development")
    
    # Logging
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
    
    # Pinecone timeout settings
    PINECONE_QUERY_TIMEOUT: float = float(os.environ.get("PINECONE_QUERY_TIMEOUT", "30.0"))  # 30 seconds default
    PINECONE_UPSERT_TIMEOUT: float = float(os.environ.get("PINECONE_UPSERT_TIMEOUT", "60.0"))  # 60 seconds default
    PINECONE_INDEX_STATS_TIMEOUT: float = float(os.environ.get("PINECONE_INDEX_STATS_TIMEOUT", "15.0"))  # 15 seconds default
    
    # Query cache settings
    QUERY_CACHE_SIZE: int = int(os.environ.get("QUERY_CACHE_SIZE", "100"))  # 100 entries default
    QUERY_CACHE_TTL: int = int(os.environ.get("QUERY_CACHE_TTL", "300"))  # 5 minutes TTL default
    
    # Chat memory settings
    MEMORY_WINDOW: int = int(os.environ.get("MEMORY_WINDOW", "20"))  # Increased from 10 to 20 for better conversation recall
    
    # Beta Authentication Settings
    BETA_ENABLED: bool = os.environ.get("BETA_ENABLED", "true").lower() == "true"
    BETA_PASSWORD: str = os.environ.get("COSMOS_BETA_PASSWORD", "")
    BETA_SESSION_TIMEOUT: int = int(os.environ.get("BETA_SESSION_TIMEOUT", "3600"))  # 60 minutes in seconds
    AUTH_CLEANUP_INTERVAL_HOURS: int = int(os.environ.get("AUTH_CLEANUP_INTERVAL_HOURS", "12"))  # Run cleanup job every 12 hours
    
    # Admin settings
    ADMIN_EMAILS: str = os.environ.get("ADMIN_EMAILS", "")
    
    @field_validator("ADMIN_EMAILS", mode="after")
    @classmethod
    def parse_admin_emails(cls, v: str) -> List[str]:
        """Parse admin emails from string to list"""
        if not v:
            return []
            
        if isinstance(v, list):
            # If it's already a list, normalize each email
            return [email.strip().lower() for email in v if email and isinstance(email, str)]
            
        if isinstance(v, str):
            # If it's a string, split by comma and normalize
            return [email.strip().lower() for email in v.split(",") if email.strip()]
            
        # Fallback to empty list for any other type
        return []

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

    @field_validator('SECRET_KEY', mode='before')
    @classmethod
    def check_secret_key_production(cls, v, info):
        # Check environment
        try:
            env = info.data.get('ENVIRONMENT', 'development')
        except AttributeError:
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