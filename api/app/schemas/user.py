from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr
    password: str = Field(..., min_length=10)
    confirm_password: str
    display_name: str = Field(..., min_length=3, max_length=100)
    invite_code: str
    terms_accepted: bool = Field(...)
    
    @field_validator('terms_accepted')
    @classmethod
    def terms_must_be_accepted(cls, v):
        """Validate that terms and privacy policy have been accepted."""
        if not v:
            raise ValueError('You must accept the Terms of Service and Privacy Policy')
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        """Validate that passwords match."""
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        """Validate password strength according to NIST SP 800-63B guidelines."""
        if len(v) < 10:
            raise ValueError('Password must be at least 10 characters')
            
        # Check for uppercase letters
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must include at least one uppercase letter')
            
        # Check for lowercase letters
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must include at least one lowercase letter')
            
        # Check for numbers
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must include at least one number')
            
        # Check for special characters
        if not re.search(r'[!@#$%^&*(),.?":{}|<>~\-_=+\[\]]', v):
            raise ValueError('Password must include at least one special character')
            
        # Check for common patterns to avoid
        if re.search(r'12345|qwerty|password|admin|letmein', v.lower()):
            raise ValueError('Password contains a common pattern. Please choose a stronger password')
            
        # Check for repetitive or sequential characters
        if re.search(r'(.)\1{2,}', v):  # Same character repeated 3+ times
            raise ValueError('Password contains too many repeated characters')
            
        # Check for keyboard sequences
        keyboard_sequences = ['qwerty', 'asdfgh', 'zxcvbn', '123456']
        for seq in keyboard_sequences:
            if seq in v.lower():
                raise ValueError('Password contains a keyboard sequence. Please choose a stronger password')
        
        return v

class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    email: EmailStr
    display_name: Optional[str] = None
    access_key: str
    
    model_config = {"from_attributes": True}

class UpdateDisplayName(BaseModel):
    """Schema for updating display name."""
    display_name: str = Field(..., min_length=3, max_length=100)

class CreateInviteCode(BaseModel):
    """Schema for creating an invite code."""
    email: EmailStr
    expires_at: Optional[str] = None 