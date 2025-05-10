import asyncio
import logging
import sys
import time
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.session import async_session
from ..core.auth_service import cleanup_expired_sessions, cleanup_expired_invite_codes

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

async def run_cleanup():
    """Run all cleanup tasks"""
    start_time = time.time()
    logger.info("Starting cleanup of expired sessions and invite codes")
    
    try:
        async with async_session() as session:
            try:
                # Clean up expired sessions
                sessions_cleaned = await cleanup_expired_sessions(session)
                logger.info(f"Cleaned up {sessions_cleaned} expired sessions")
                
                # Clean up expired invite codes
                codes_cleaned = await cleanup_expired_invite_codes(session)
                logger.info(f"Deactivated {codes_cleaned} expired invite codes")
                
                # Calculate execution time
                execution_time = time.time() - start_time
                logger.info(f"Cleanup completed in {execution_time:.2f} seconds")
                
            except Exception as e:
                logger.error(f"Error during cleanup: {str(e)}")
                # Ensure the session is rolled back on error
                await session.rollback()
                raise
    except Exception as e:
        logger.error(f"Failed to create database session: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(run_cleanup())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("Cleanup interrupted by user")
        sys.exit(130)  # Standard exit code for SIGINT
    except Exception as e:
        logger.critical(f"Unexpected error in cleanup job: {str(e)}")
        sys.exit(1) 