from app.models.auth import InviteCode
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import asyncio
import os

async def create_invite():
    db_url = os.environ.get('DATABASE_URL').replace('postgres://', 'postgresql+psycopg://')
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        admin_email = os.environ.get('ADMIN_EMAILS', '').split(',')[0].strip()
        invite, plain_code = InviteCode.generate(email=admin_email, expires_days=None, max_redemptions=5)
        session.add(invite)
        await session.commit()
        print(f'Created admin invite code: {plain_code} for {admin_email}')

if __name__ == "__main__":
    asyncio.run(create_invite())