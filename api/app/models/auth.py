from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON, Text, ARRAY, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import expression
import datetime
import secrets
from passlib.hash import pbkdf2_sha256

Base = declarative_base()

class InviteCode(Base):
    __tablename__ = "invite_codes"
    
    id = Column(Integer, primary_key=True)
    code_hash = Column(Text, nullable=False)
    email = Column(String, nullable=True, index=True)
    created_by = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    expires_at = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, server_default=expression.true(), nullable=False)
    redemption_count = Column(Integer, server_default='0', nullable=False)
    max_redemptions = Column(Integer, server_default='1', nullable=False)
    
    @classmethod
    def generate(cls, email=None, expires_days=30, max_redemptions=1):
        """Generate a new invite code with secure hashing"""
        # Generate random code
        plain_code = secrets.token_urlsafe(16)
        
        # Hash the code with passlib (will use in Python where pgcrypto isn't available)
        # This creates a secure hash with salt automatically included
        code_hash = pbkdf2_sha256.hash(plain_code)
        
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=expires_days) if expires_days else None
        
        return cls(
            code_hash=code_hash,
            email=email,
            expires_at=expires_at,
            max_redemptions=max_redemptions
        ), plain_code
    
    @classmethod
    def verify_code(cls, code, hashed_code):
        """Verify a code against its hash"""
        return pbkdf2_sha256.verify(code, hashed_code)

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    user_identifier = Column(String, nullable=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    expires_at = Column(TIMESTAMP, nullable=False)
    session_metadata = Column(JSON, nullable=True)
    
    @classmethod
    def create(cls, user_identifier=None, expires_minutes=60):
        """Create a new session"""
        session_id = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_minutes)
        return cls(
            id=session_id,
            user_identifier=user_identifier,
            expires_at=expires_at
        ) 