from api.app.models.auth import InviteCode
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import asyncio
import os
import sys

# Add project root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

async def create_invite():
    # Get database URL from environment
    db_url = os.environ.get('DATABASE_URL', '')
    
    # Handle URL format conversion - try multiple drivers
    if db_url.startswith('postgres://'):
        try:
            # Try asyncpg driver first (most reliable for async)
            db_url = db_url.replace('postgres://', 'postgresql+asyncpg://')
            print(f"Using asyncpg driver")
        except ImportError:
            try:
                # Try psycopg3
                db_url = db_url.replace('postgres://', 'postgresql+psycopg://')
                print(f"Using psycopg driver")
            except ImportError:
                # Fallback to psycopg2
                db_url = db_url.replace('postgres://', 'postgresql+psycopg2://')
                print(f"Using psycopg2 driver")
    
    print(f"Connecting to database with URL scheme: {db_url.split('://')[0]}")
    
    # Create engine with more explicit error handling
    try:
        engine = create_async_engine(db_url)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    except ImportError as e:
        print(f"Error importing database driver: {e}")
        print("Available drivers in sys.path:")
        for path in sys.path:
            print(f"  - {path}")
        raise
    
    async with async_session() as session:
        # Get admin email, defaulting to empty string if not set
        admin_email = os.environ.get('ADMIN_EMAILS', '').split(',')[0].strip()
        if not admin_email:
            admin_email = input("Enter admin email: ")
            
        # Generate invite code
        invite, plain_code = InviteCode.generate(email=admin_email, expires_days=None, max_redemptions=5)
        session.add(invite)
        await session.commit()
        print(f'Created admin invite code: {plain_code} for {admin_email}')

if __name__ == "__main__":
    asyncio.run(create_invite())