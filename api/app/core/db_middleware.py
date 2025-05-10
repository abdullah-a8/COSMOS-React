from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from ..db.session import async_session

class DatabaseSessionMiddleware(BaseHTTPMiddleware):
    """Middleware to attach database session to request"""
    
    async def dispatch(self, request: Request, call_next):
        async with async_session() as session:
            request.state.db = session
            response = await call_next(request)
            return response 