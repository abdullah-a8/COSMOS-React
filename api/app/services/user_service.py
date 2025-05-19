from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from ..models.user import User
from ..models.auth import InviteCode, get_utc_now
from typing import Optional, Tuple
import logging
import hashlib
import aiohttp

logger = logging.getLogger(__name__)

class UserService:
    """Service for user-related operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user_with_invite(
        self, 
        email: str, 
        password: str, 
        invite_code: str, 
        display_name: str
    ) -> Tuple[Optional[User], str]:
        """
        Create a new user account with an invite code.
        
        Returns:
            Tuple containing (User, error_message)
            If successful, User will be populated and error_message will be empty
            If failed, User will be None and error_message will contain the reason
        """
        try:
            # First, check if email already exists
            email_check = await self.get_user_by_email(email)
            if email_check:
                logger.warning(f"Attempt to create user with existing email: {email}")
                return None, "email_exists"
            
            # Next, validate the invite code
            invite = await self._validate_invite_code(invite_code, email)
            if not invite:
                logger.warning(f"Invalid invite code used in registration attempt for email: {email}")
                return None, "invalid_invite"
            
            # Check if password has been compromised
            is_compromised = await self.check_password_compromised(password)
            if is_compromised:
                logger.warning(f"Compromised password detected during registration for email: {email}")
                return None, "compromised_password"
            
            # Create the user
            user = User.create_user(email, password, display_name)
            user.invite_code_id = invite.id
            
            # Update invite code usage
            invite.redemption_count += 1
            
            # Save both
            self.db.add(user)
            await self.db.flush()  # This gets the ID without committing the transaction
            
            # Commit the transaction
            await self.db.commit()
            
            logger.info(f"Created new user account for email: {email}")
            return user, ""
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            return None, "system_error"
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by their email address."""
        try:
            stmt = select(User).where(
                and_(
                    User.email == email.lower(),
                    User.is_active == True
                )
            )
            result = await self.db.execute(stmt)
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Error retrieving user by email: {str(e)}")
            return None
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by their ID."""
        try:
            stmt = select(User).where(
                and_(
                    User.id == user_id,
                    User.is_active == True
                )
            )
            result = await self.db.execute(stmt)
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Error retrieving user by ID: {str(e)}")
            return None
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = await self.get_user_by_email(email)
        
        if not user:
            logger.debug(f"Authentication attempt for non-existent user: {email}")
            return None
        
        if not user.verify_password(password):
            logger.warning(f"Failed password verification for user: {email}")
            return None
        
        # Check if the invite code used to create this account is still valid
        if user.invite_code_id:
            try:
                # Query the invite code
                stmt = select(InviteCode).where(InviteCode.id == user.invite_code_id)
                result = await self.db.execute(stmt)
                invite_code = result.scalars().first()
                
                # Check if the invite code is still active and not expired
                if invite_code and (not invite_code.is_active or 
                                   (invite_code.expires_at and invite_code.expires_at <= get_utc_now())):
                    logger.warning(f"User login attempt with deactivated or expired invite code. User: {email}")
                    return None
            except Exception as e:
                # Log the error but don't block the login - this is a secondary check
                logger.error(f"Error checking invite code validity: {str(e)}")
        
        # Update last login time
        user.last_login = get_utc_now()
        await self.db.commit()
        
        logger.info(f"User authenticated successfully: {email}")
        return user
    
    async def update_display_name(self, user_id: int, new_display_name: str) -> Optional[User]:
        """Update a user's display name."""
        try:
            user = await self.get_user_by_id(user_id)
            
            if not user:
                logger.warning(f"Attempt to update non-existent user ID: {user_id}")
                return None
            
            user.display_name = new_display_name
            await self.db.commit()
            
            logger.info(f"Updated display name for user ID: {user_id}")
            return user
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating display name: {str(e)}")
            return None
    
    async def _validate_invite_code(self, code: str, email: str) -> Optional[InviteCode]:
        """
        Validate an invite code against the database.
        The invite code must be active, not expired, and match the email.
        """
        if not code:
            return None
            
        # Find all active, non-expired codes for this email
        stmt = select(InviteCode).where(
            and_(
                InviteCode.is_active == True,
                InviteCode.email == email.lower(),
                or_(
                    InviteCode.expires_at == None,
                    InviteCode.expires_at > get_utc_now()
                )
            )
        )
        
        try:
            result = await self.db.execute(stmt)
            invite_codes = result.scalars().all()
            
            # Check each code (since codes are hashed)
            for invite_code in invite_codes:
                if InviteCode.verify_code(code, invite_code.code_hash):
                    return invite_code
            
            return None
        except Exception as e:
            logger.error(f"Error validating invite code: {str(e)}")
            return None
    
    async def check_password_compromised(self, password: str) -> bool:
        """
        Check if a password has been compromised using the HIBP API.
        Only the first 5 characters of the SHA-1 hash are sent to the API.
        
        Returns:
            bool: True if the password has been compromised, False otherwise
        """
        try:
            # Generate SHA-1 hash of the password
            password_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
            
            # Split the hash into prefix and suffix
            prefix = password_hash[:5]
            suffix = password_hash[5:]
            
            # Query the HIBP API with only the prefix
            url = f"https://api.pwnedpasswords.com/range/{prefix}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, 
                    headers={"User-Agent": "COSMOS-Auth-Service"}
                ) as response:
                    if response.status != 200:
                        logger.error(f"HIBP API error: HTTP {response.status}")
                        return False  # Fail open - don't block registration if the API is down
                    
                    # Check if our suffix is in the response
                    data = await response.text()
                    for line in data.splitlines():
                        # Each line is in format: HASH_SUFFIX:COUNT
                        if line.split(':')[0] == suffix:
                            return True  # Password has been compromised
            
            return False  # Password not found in HIBP database
            
        except Exception as e:
            logger.error(f"Error checking compromised password: {str(e)}")
            return False  # Fail open on error 