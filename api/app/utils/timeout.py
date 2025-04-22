import asyncio
import logging
from typing import Any, Callable, TypeVar, Awaitable
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')

async def run_with_timeout(func: Callable[..., Awaitable[T]], timeout_seconds: float, *args, **kwargs) -> T:
    """
    Execute an async function with a timeout.
    
    Args:
        func: The async function to execute
        timeout_seconds: Maximum execution time in seconds
        *args, **kwargs: Arguments to pass to the function
        
    Returns:
        The result of the function
        
    Raises:
        asyncio.TimeoutError: If the function execution exceeds the timeout
    """
    try:
        return await asyncio.wait_for(func(*args, **kwargs), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        logger.error(f"Operation timed out after {timeout_seconds} seconds")
        raise

def with_timeout(timeout_seconds: float):
    """
    Decorator to add timeout to an async function.
    
    Args:
        timeout_seconds: Maximum execution time in seconds
        
    Returns:
        Decorated function that will raise asyncio.TimeoutError if execution exceeds timeout
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await run_with_timeout(func, timeout_seconds, *args, **kwargs)
        return wrapper
    return decorator 