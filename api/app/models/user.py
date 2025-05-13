from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import expression
from passlib.hash import pbkdf2_sha256
from .auth import Base, get_utc_now
from typing import Optional

class User(Base):
    """User account model."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=True)
    access_key = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, onupdate=func.now())
    last_login = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, server_default=expression.true(), nullable=False)
    
    # Relationship to invite code
    invite_code_id = Column(Integer, ForeignKey("invite_codes.id"), nullable=True)
    
    @classmethod
    def create_user(cls, email: str, password: str, display_name: Optional[str] = None) -> "User":
        """Create a new user with securely hashed password and generated access_key."""
        import uuid
        
        # Hash the password
        password_hash = pbkdf2_sha256.hash(password)
        
        # Generate a unique access key (UUID4)
        access_key = str(uuid.uuid4())
        
        return cls(
            email=email.lower(),
            display_name=display_name,
            access_key=access_key,
            password_hash=password_hash
        )
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the stored hash."""
        return pbkdf2_sha256.verify(password, self.password_hash)
    
    def update_password(self, new_password: str) -> None:
        """Update user's password with a new one."""
        self.password_hash = pbkdf2_sha256.hash(new_password) 