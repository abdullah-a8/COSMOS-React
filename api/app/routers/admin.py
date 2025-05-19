from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.session import get_db
from ..models.auth import InviteCode, Session
from ..core.auth_service import SESSION_TOKEN_NAME
from sqlalchemy import select, and_
import logging
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

# Admin authorization check
async def admin_required(request: Request, db: AsyncSession = Depends(get_db)):
    """Verify the user is an admin with a single database query"""
    session_token = request.cookies.get(SESSION_TOKEN_NAME)
    
    if not session_token:
        logger.debug("No session token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Perform single query that checks both authentication and admin status
    stmt = select(Session).where(
        and_(
            Session.id == session_token,
            Session.expires_at > datetime.utcnow()
        )
    )
    
    result = await db.execute(stmt)
    session = result.scalars().first()
    
    if not session:
        logger.debug(f"Invalid or expired session: {session_token[:8] if session_token else 'none'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Check admin status from session metadata
    is_admin = False
    if session.session_metadata and isinstance(session.session_metadata, dict):
        is_admin = bool(session.session_metadata.get("is_admin", False))
    
    if not is_admin:
        logger.debug(f"Non-admin access attempt: {session_token[:8]}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return True

# Pydantic models
class InviteCodeCreate(BaseModel):
    email: Optional[EmailStr] = None
    expires_days: Optional[int] = 30

class InviteCodeResponse(BaseModel):
    id: int
    code: str  # Plain code, only returned once when created
    email: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    redemption_count: int

class InviteCodeListResponse(BaseModel):
    id: int
    email: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    redemption_count: int

# Routes
@router.post("/invite-codes", response_model=InviteCodeResponse)
async def create_invite_code(
    data: InviteCodeCreate,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Create a new invite code"""
    try:
        # Validate expiration days - make sure it's None or a positive number
        if data.expires_days is not None and data.expires_days < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expiration days must be a positive number or null for no expiration"
            )
            
        logger.info(f"Generating invite code with parameters: email={data.email}, expires_days={data.expires_days}")
        
        invite_obj, plain_code = InviteCode.generate(
            email=data.email,
            expires_days=data.expires_days
        )
        
        logger.debug(f"Invite code object created, adding to database")
        db.add(invite_obj)
        
        try:
            await db.commit()
            await db.refresh(invite_obj)
            logger.info(f"Invite code successfully committed to database with ID: {invite_obj.id}")
        except Exception as db_error:
            logger.error(f"Database error while saving invite code: {str(db_error)}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while creating invite code"
            )
        
        # Send email if email address is provided
        if data.email:
            try:
                from ..services.email_service import send_invite_code_email
                from ..email_templates.invite_code_email import calculate_days_remaining, format_date
                
                # Calculate values for the template
                days_remaining = calculate_days_remaining(invite_obj.expires_at)
                formatted_expiry = format_date(invite_obj.expires_at)

                # Send the email using Resend SDK
                await send_invite_code_email(
                    to_email=data.email,
                    invite_code=plain_code,
                    expires_at=invite_obj.expires_at,
                    redemption_count=invite_obj.redemption_count
                )
                
                logger.info(f"Invite code email sent to {data.email}")
            except Exception as e:
                logger.error(f"Failed to send invite code email: {str(e)}")
                # Continue even if email sending fails
        
        # Return the plain code in the response - this is the only time it's available
        return {
            "id": invite_obj.id,
            "code": plain_code,  # Plain code only returned at creation
            "email": invite_obj.email,
            "created_at": invite_obj.created_at,
            "expires_at": invite_obj.expires_at,
            "is_active": invite_obj.is_active,
            "redemption_count": invite_obj.redemption_count
        }
    except HTTPException:
        # Re-raise HTTP exceptions as they're already properly formatted
        raise
    except Exception as e:
        # Log the detailed error for server-side diagnosis
        logger.exception(f"Unexpected error creating invite code: {str(e)}")
        # Return a friendly error message to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating invite code. Please try again."
        )

@router.get("/invite-codes", response_model=List[InviteCodeListResponse])
async def list_invite_codes(
    active_only: bool = True,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """List invite codes"""
    query = select(InviteCode)
    if active_only:
        query = query.where(InviteCode.is_active == True)
    
    result = await db.execute(query)
    codes = result.scalars().all()
    
    return codes

@router.delete("/invite-codes/{code_id}")
async def deactivate_invite_code(
    code_id: int,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate an invite code"""
    result = await db.execute(select(InviteCode).where(InviteCode.id == code_id))
    code = result.scalars().first()
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite code not found"
        )
    
    code.is_active = False
    await db.commit()
    
    return {"message": "Invite code deactivated successfully"} 