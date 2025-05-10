#!/usr/bin/env python
"""
Script to set up and configure the COSMOS authentication system.
This script helps create the initial invite code in any environment.

Usage:
1. Local: python scripts/setup_auth.py
2. Heroku: heroku run python scripts/setup_auth.py
3. Other clouds: Follow platform-specific instructions to run Python scripts
"""
import asyncio
import sys
import os
import logging
import getpass
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import urllib.parse

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Add the parent directory to the path so we can import modules
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(script_dir, ".."))
sys.path.insert(0, parent_dir)

# Import models after path setup
from app.models.auth import InviteCode, Base

def detect_platform():
    """Detect which platform we're running on"""
    if "DYNO" in os.environ:
        return "heroku"
    elif "RAILWAY_PROJECT_ID" in os.environ:
        return "railway"
    elif "RENDER" in os.environ:
        return "render"
    else:
        return "local"

async def setup_auth():
    """Set up authentication system in any environment"""
    try:
        platform = detect_platform()
        logger.info(f"Detected platform: {platform}")
        
        # Get database connection info
        database_url = os.environ.get("DATABASE_URL")
        
        if not database_url:
            logger.info("No DATABASE_URL found, using local connection parameters")
            
            # For local development, we'll ask for database credentials
            if platform == "local":
                db_user = input("Database username [postgres]: ").strip() or "postgres"
                db_password = getpass.getpass("Database password (leave empty if using local auth): ")
                db_host = input("Database host [localhost]: ").strip() or "localhost"
                db_name = input("Database name [auth_system]: ").strip() or "auth_system"
                db_port = input("Database port [5432]: ").strip() or "5432"
            else:
                # Use sensible defaults for cloud environments without DATABASE_URL
                logger.warning("No DATABASE_URL found in cloud environment!")
                db_user = os.environ.get("DB_USER", "postgres")
                db_password = os.environ.get("DB_PASSWORD", "")
                db_host = os.environ.get("DB_HOST", "localhost")
                db_name = os.environ.get("DB_NAME", "auth_system")
                db_port = os.environ.get("DB_PORT", "5432")
                
            # URL encode the password to handle special characters
            encoded_password = urllib.parse.quote_plus(db_password)
            
            # Create database URL
            database_url = f"postgresql+asyncpg://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
            
        # Handle URL format conversion
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
            
        connection_info = database_url.split("@")[-1] if "@" in database_url else "database"
        logger.info(f"Connecting to database at {connection_info}")
        
        # Create engine and session
        engine = create_async_engine(database_url)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # Create tables if they don't exist
        async with engine.begin() as conn:
            # Create tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified")
        
        # Get user input for creating the initial admin invite
        print("\n== COSMOS AUTH SYSTEM SETUP ==\n")
        print("This will create your initial admin invite code.")
        email = input("Admin email address: ").strip()
        days_input = input("Expiration days (0 for no expiration) [30]: ").strip() or "30"
        max_uses_input = input("Maximum number of uses (0 for unlimited) [1]: ").strip() or "1"
        
        try:
            days = int(days_input)
            max_uses = int(max_uses_input)
        except ValueError:
            logger.error("Invalid input: days and max uses must be numbers")
            return False
        
        async with async_session() as session:
            # Generate invite code
            invite, plain_code = InviteCode.generate(
                email=email, 
                expires_days=days if days > 0 else None,
                max_redemptions=max_uses
            )
            
            session.add(invite)
            await session.commit()
            
            print("\n==================================")
            print(f"Created invite code: {plain_code}")
            print("==================================\n")
            print("IMPORTANT: Save this code! It will not be shown again.")
            
            if max_uses > 0:
                print(f"This code can be used {max_uses} time(s)")
            else:
                print("This code has unlimited uses")
                
            if days > 0:
                print(f"This code will expire in {days} days")
            else:
                print("This code does not expire")
                
            logger.info(f"Successfully created admin invite code for {email}")
            
            # Explain how to set the admin email
            print("\n== NEXT STEPS ==")
            
            if platform == "heroku":
                print("Set the ADMIN_EMAILS environment variable on Heroku with:")
                print(f"   heroku config:set ADMIN_EMAILS=\"{email}\"")
            elif platform == "railway":
                print("Add the ADMIN_EMAILS environment variable in your Railway project settings:")
                print(f"   ADMIN_EMAILS=\"{email}\"")
            elif platform == "render":
                print("Add the ADMIN_EMAILS environment variable in your Render dashboard:")
                print(f"   ADMIN_EMAILS=\"{email}\"")
            else:
                print("Add the following to your .env file or environment variables:")
                print(f"   ADMIN_EMAILS=\"{email}\"")
                
            print("\nMake sure your other environment variables are set (check AUTH_README.md)")
            print("Visit your app URL and use the access code above to log in\n")
            
            return True
    except Exception as e:
        logger.error(f"Error setting up authentication: {e}")
        print(f"\nError: {str(e)}")
        print("Failed to set up authentication. Please check logs for more information.")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(setup_auth())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"\nUnexpected error: {str(e)}")
        sys.exit(1) 