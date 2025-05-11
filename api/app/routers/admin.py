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
    max_redemptions: int = 1

class InviteCodeResponse(BaseModel):
    id: int
    code: str  # Plain code, only returned once when created
    email: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    redemption_count: int
    max_redemptions: int

class InviteCodeListResponse(BaseModel):
    id: int
    email: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool
    redemption_count: int
    max_redemptions: int

# Routes
@router.post("/invite-codes", response_model=InviteCodeResponse)
async def create_invite_code(
    data: InviteCodeCreate,
    _: bool = Depends(admin_required),
    db: AsyncSession = Depends(get_db)
):
    """Create a new invite code"""
    invite_obj, plain_code = InviteCode.generate(
        email=data.email,
        expires_days=data.expires_days,
        max_redemptions=data.max_redemptions
    )
    
    db.add(invite_obj)
    await db.commit()
    await db.refresh(invite_obj)
    
    # Return the plain code in the response - this is the only time it's available
    return {
        "id": invite_obj.id,
        "code": plain_code,  # Plain code only returned at creation
        "email": invite_obj.email,
        "created_at": invite_obj.created_at,
        "expires_at": invite_obj.expires_at,
        "is_active": invite_obj.is_active,
        "redemption_count": invite_obj.redemption_count,
        "max_redemptions": invite_obj.max_redemptions
    }

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