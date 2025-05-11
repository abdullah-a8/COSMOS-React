from ..models.auth import InviteCode, Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, update, func
from datetime import datetime
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

# Constants
SESSION_TOKEN_NAME = "cosmos_beta_session"

async def validate_access_code(db: AsyncSession, code: str) -> tuple[bool, str]:
    """Validate an access code against the database
    
    Returns:
        tuple[bool, str]: A tuple containing (is_valid, error_code)
            where error_code is one of:
            - "" (empty string): Valid code
            - "empty": Empty code provided
            - "invalid": Code doesn't match any known code
            - "expired": Code exists but has expired
            - "used": Code exists but has reached max redemptions
            - "system": System error occurred
    """
    # Input validation
    if not code:
        logger.warning("Empty access code provided in validation attempt")
        return False, "empty"
        
    # Find all active, non-expired codes
    stmt = select(InviteCode).where(
        and_(
            InviteCode.is_active == True,
            or_(
                InviteCode.expires_at == None,
                InviteCode.expires_at > datetime.utcnow()
            ),
            or_(
                InviteCode.max_redemptions == 0,  # Unlimited
                InviteCode.redemption_count < InviteCode.max_redemptions
            )
        )
    )
    
    try:
        result = await db.execute(stmt)
        codes = result.scalars().all()
        
        if not codes:
            logger.warning("No active invite codes found in database during validation")
            return False, "system"
        
        logger.debug(f"Checking access code against {len(codes)} active invite codes")
        
        # Check each code - this is necessary since we're using hashed codes
        for invite_code in codes:
            if InviteCode.verify_code(code, invite_code.code_hash):
                # Update redemption count
                invite_code.redemption_count += 1
                
                # Log successful validation with details
                email_info = f" for {invite_code.email}" if invite_code.email else ""
                logger.info(f"Valid access code used{email_info}. Redemption count: {invite_code.redemption_count}/{invite_code.max_redemptions or 'unlimited'}")
                
                await db.commit()
                return True, ""
        
        # No match in active codes - check if it's an expired or used-up code
        # Check for expired codes
        expired_stmt = select(InviteCode).where(
            and_(
                InviteCode.is_active == True,
                InviteCode.expires_at != None,
                InviteCode.expires_at <= datetime.utcnow()
            )
        )
        
        result = await db.execute(expired_stmt)
        expired_codes = result.scalars().all()
        
        for expired_code in expired_codes:
            if InviteCode.verify_code(code, expired_code.code_hash):
                logger.warning(f"Expired access code used. Expired at: {expired_code.expires_at}")
                return False, "expired"
        
        # Check for maxed-out codes
        used_stmt = select(InviteCode).where(
            and_(
                InviteCode.is_active == True,
                InviteCode.max_redemptions > 0,
                InviteCode.redemption_count >= InviteCode.max_redemptions
            )
        )
        
        result = await db.execute(used_stmt)
        used_codes = result.scalars().all()
        
        for used_code in used_codes:
            if InviteCode.verify_code(code, used_code.code_hash):
                logger.warning(f"Used up access code. Max redemptions: {used_code.max_redemptions}")
                return False, "used"
        
        # No matching code found at all
        logger.warning(f"Invalid access code provided in authentication attempt")
        return False, "invalid"
    except Exception as e:
        logger.error(f"Error validating access code: {str(e)}")
        return False, "system"

async def create_session(db: AsyncSession, user_identifier=None, expires_minutes=60, is_admin=False) -> str:
    """Create a new session and save to database"""
    try:
        session = Session.create(
            user_identifier=user_identifier, 
            expires_minutes=expires_minutes
        )
        
        # Set session metadata with admin status
        session.session_metadata = {"is_admin": bool(is_admin)}
        
        db.add(session)
        await db.commit()
        
        # Log session creation with partial ID for privacy
        session_id_prefix = session.id[:8] if session.id else "unknown"
        logger.info(f"New session created: {session_id_prefix}... expires at {session.expires_at}, admin: {is_admin}")
        return session.id
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        return ""

async def validate_session(db: AsyncSession, session_id: str) -> bool:
    """Validate a session exists and is not expired"""
    if not session_id:
        logger.debug("Empty session ID provided for validation")
        return False
    
    try:
        stmt = select(Session).where(
            and_(
                Session.id == session_id,
                Session.expires_at > datetime.utcnow()
            )
        )
        
        result = await db.execute(stmt)
        session = result.scalars().first()
        
        if session:
            # Check if session is about to expire soon (< 10 minutes)
            time_remaining = (session.expires_at - datetime.utcnow()).total_seconds()
            if time_remaining < 600:  # Less than 10 minutes
                session_id_prefix = session_id[:8] if session_id else "unknown"
                logger.info(f"Session {session_id_prefix}... is about to expire in {int(time_remaining)} seconds")
            return True
        else:
            session_id_prefix = session_id[:8] if session_id else "unknown"
            logger.debug(f"Invalid or expired session: {session_id_prefix}...")
            return False
    except Exception as e:
        logger.error(f"Error validating session: {str(e)}")
        return False

async def cleanup_expired_sessions(db: AsyncSession) -> int:
    """Clean up expired sessions. Returns count of deleted sessions."""
    try:
        stmt = select(Session).where(Session.expires_at <= datetime.utcnow())
        result = await db.execute(stmt)
        expired = result.scalars().all()
        
        if not expired:
            logger.debug("No expired sessions found during cleanup")
            return 0
            
        logger.info(f"Found {len(expired)} expired sessions to clean up")
        
        for session in expired:
            session_id_prefix = session.id[:8] if session.id else "unknown"
            logger.debug(f"Deleting expired session: {session_id_prefix}... (expired at {session.expires_at})")
            await db.delete(session)
        
        await db.commit()
        return len(expired)
    except Exception as e:
        logger.error(f"Error cleaning up expired sessions: {str(e)}")
        await db.rollback()
        return 0

async def cleanup_expired_invite_codes(db: AsyncSession) -> int:
    """Clean up expired invite codes. Returns count of deactivated codes."""
    try:
        stmt = select(InviteCode).where(
            and_(
                InviteCode.expires_at != None,
                InviteCode.expires_at <= datetime.utcnow(),
                InviteCode.is_active == True
            )
        )
        
        result = await db.execute(stmt)
        expired = result.scalars().all()
        
        if not expired:
            logger.debug("No expired invite codes found during cleanup")
            return 0
            
        logger.info(f"Found {len(expired)} expired invite codes to deactivate")
        
        for code in expired:
            email_info = f" for {code.email}" if code.email else ""
            logger.debug(f"Deactivating expired invite code (ID: {code.id}){email_info}")
            code.is_active = False
        
        await db.commit()
        return len(expired)
    except Exception as e:
        logger.error(f"Error cleaning up expired invite codes: {str(e)}")
        await db.rollback()
        return 0

async def is_admin_session(db: AsyncSession, session_id: str) -> bool:
    """Check if a session belongs to an admin user"""
    if not session_id:
        logger.debug("Empty session_id in is_admin_session check")
        return False
    
    try:
        stmt = select(Session).where(
            and_(
                Session.id == session_id,
                Session.expires_at > datetime.utcnow()
            )
        )
        
        result = await db.execute(stmt)
        session = result.scalars().first()
        
        if not session:
            logger.debug(f"Session not found: {session_id[:8]}...")
            return False
            
        is_admin = False
        if session.session_metadata and isinstance(session.session_metadata, dict):
            is_admin = bool(session.session_metadata.get("is_admin", False))
            
        logger.debug(f"Admin check for session {session_id[:8]}...: {is_admin}")
        return is_admin
    except Exception as e:
        logger.error(f"Error checking admin session: {str(e)}")
        return False

async def refresh_existing_session(db: AsyncSession, session_id: str) -> str:
    """Refresh an existing session by creating a new one and deleting the old one.
    Returns the new session ID."""
    if not session_id:
        logger.warning("Attempted to refresh session with empty session ID")
        return ""
    
    try:
        # Find current session
        stmt = select(Session).where(Session.id == session_id)
        result = await db.execute(stmt)
        current_session = result.scalars().first()
        
        if not current_session:
            session_id_prefix = session_id[:8] if session_id else "unknown"
            logger.warning(f"Attempted to refresh non-existent session: {session_id_prefix}...")
            return ""
        
        # Check if it's an admin session
        is_admin = False
        if current_session.session_metadata:
            is_admin = current_session.session_metadata.get("is_admin", False)
        
        # Create new session with same details, but new expiration
        new_session = Session.create(
            user_identifier=current_session.user_identifier,
            expires_minutes=getattr(settings, "BETA_SESSION_TIMEOUT", 60)
        )
        
        # Copy metadata and ensure admin status is preserved
        new_session.session_metadata = current_session.session_metadata or {}
        new_session.session_metadata["is_admin"] = is_admin
        
        # Save the new session
        db.add(new_session)
        
        # Delete the old session
        await db.delete(current_session)
        
        # Commit both operations
        await db.commit()
        
        old_session_id_prefix = session_id[:8] if session_id else "unknown"
        new_session_id_prefix = new_session.id[:8] if new_session.id else "unknown"
        logger.info(f"Refreshed session: {old_session_id_prefix}... → {new_session_id_prefix}... (expires at {new_session.expires_at})")
        
        return new_session.id
    except Exception as e:
        logger.error(f"Error refreshing session: {str(e)}")
        await db.rollback()
        return "" 