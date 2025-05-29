from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from fastapi import Request
from ..core.config import settings
import os
import logging
from typing import AsyncGenerator
import urllib.parse
import re

logger = logging.getLogger(__name__)

# Get DATABASE_URL from environment (used by various cloud platforms)
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Handle different URL formats across platforms
# Heroku and some other platforms use postgres://, SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

# Fallback to local config if DATABASE_URL not set
if not DATABASE_URL:
    # Database credentials from environment or config
    DB_USER = os.environ.get("DB_USER", "postgres")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_NAME = os.environ.get("DB_NAME", "auth_system")
    DB_PORT = os.environ.get("DB_PORT", "5432")

    # URL encode the password to handle special characters
    encoded_password = urllib.parse.quote_plus(DB_PASSWORD)

    # Create database URL
    DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Log connection attempt without exposing credentials
connection_info = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "database"
logger.info(f"Connecting to database at {connection_info}")

# Configure connection pool settings based on environment
is_production = os.environ.get("ENVIRONMENT", "").lower() == "production"
pool_size = int(os.environ.get("DB_POOL_SIZE", "20" if is_production else "5"))
max_overflow = int(os.environ.get("DB_MAX_OVERFLOW", "10" if is_production else "10"))
pool_timeout = int(os.environ.get("DB_POOL_TIMEOUT", "30"))
pool_recycle = int(os.environ.get("DB_POOL_RECYCLE", "1800"))  # 30 minutes

# Configure connection pool for better performance 
engine = create_async_engine(
    DATABASE_URL, 
    echo=getattr(settings, "SQL_ECHO", False),
    pool_size=pool_size,  # Maximum number of connections in the pool
    max_overflow=max_overflow,  # Maximum number of connections that can be created beyond pool_size
    pool_timeout=pool_timeout,  # Seconds to wait before timing out on getting a connection from the pool
    pool_recycle=pool_recycle,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Enable connection health checks
)

# Create session factory
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

def get_db_connection_string() -> str:
    """
    Returns a standard PostgreSQL connection string for use with PostgresChatMessageHistory.
    This function converts the SQLAlchemy connection string to a standard PostgreSQL
    connection string suitable for use with langchain_postgres.
    """
    # Convert from SQLAlchemy format to standard psycopg format
    conn_string = DATABASE_URL
    
    # Convert from SQLAlchemy asyncpg format
    if conn_string.startswith("postgresql+asyncpg://"):
        conn_string = conn_string.replace("postgresql+asyncpg://", "postgresql://", 1)
    
    # Convert from SQLAlchemy psycopg format
    elif conn_string.startswith("postgresql+psycopg://"):
        conn_string = conn_string.replace("postgresql+psycopg://", "postgresql://", 1)
    
    return conn_string

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async db session"""
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_models():
    """Initialize database models"""
    from ..models.auth import Base
    logger.info("Creating database tables if they don't exist")
    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")

# SQL Injection protection utilities

# Common SQL reserved keywords
RESERVED_KEYWORDS = {
    'ALL', 'ALTER', 'AND', 'ANY', 'AS', 'ASC', 'BETWEEN', 'BY', 'CASE', 'CHECK', 
    'COLUMN', 'COMMIT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT', 'DATABASE', 
    'DEFAULT', 'DELETE', 'DESC', 'DISTINCT', 'DROP', 'ELSE', 'EXCEPT', 'EXISTS', 
    'FOREIGN', 'FROM', 'FULL', 'GRANT', 'GROUP', 'HAVING', 'IN', 'INDEX', 'INNER', 
    'INSERT', 'INTERSECT', 'INTO', 'IS', 'JOIN', 'KEY', 'LEFT', 'LIKE', 'LIMIT', 
    'NOT', 'NULL', 'ON', 'OR', 'ORDER', 'OUTER', 'PRIMARY', 'REFERENCES', 'RIGHT', 
    'ROLLBACK', 'SELECT', 'SET', 'TABLE', 'THEN', 'TO', 'TRANSACTION', 'UNION', 
    'UNIQUE', 'UPDATE', 'USER', 'VALUES', 'VIEW', 'WHEN', 'WHERE', 'WITH'
}

def is_safe_table_name(table_name: str) -> bool:
    """
    Check if a table name is safe to use in SQL queries.
    Prevents SQL injection through table names.
    
    Args:
        table_name: The table name to check
        
    Returns:
        bool: True if the table name is safe
    """
    # Table names should start with a letter followed by alphanumeric chars or underscores
    # Total length should be 1-63 chars
    pattern = r'^[a-zA-Z][a-zA-Z0-9_]{0,62}$'
    if not re.match(pattern, table_name):
        return False
    
    # Check if the name is a reserved keyword
    return table_name.upper() not in RESERVED_KEYWORDS

def is_safe_column_name(column_name: str) -> bool:
    """
    Check if a column name is safe to use in SQL queries.
    Prevents SQL injection through column names.
    
    Args:
        column_name: The column name to check
        
    Returns:
        bool: True if the column name is safe
    """
    # Column names should start with a letter followed by alphanumeric chars or underscores
    pattern = r'^[a-zA-Z][a-zA-Z0-9_]{0,62}$'
    if not re.match(pattern, column_name):
        return False
    
    # Check if the name is a reserved keyword
    return column_name.upper() not in RESERVED_KEYWORDS

def is_safe_schema_name(schema_name: str) -> bool:
    """
    Check if a schema name is safe to use in SQL queries.
    Prevents SQL injection through schema names.
    
    Args:
        schema_name: The schema name to check
        
    Returns:
        bool: True if the schema name is safe
    """
    # Schema names should start with a letter followed by alphanumeric chars or underscores
    pattern = r'^[a-zA-Z][a-zA-Z0-9_]{0,62}$'
    if not re.match(pattern, schema_name):
        return False
    
    # Check if the name is a reserved keyword
    return schema_name.upper() not in RESERVED_KEYWORDS 