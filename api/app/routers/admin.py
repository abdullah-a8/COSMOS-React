from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.session import get_db
from ..models.auth import InviteCode
from ..core.auth_service import validate_session, is_admin_session
from sqlalchemy import select
import logging
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

# Admin authorization check
async def admin_required(request: Request, db: AsyncSession = Depends(get_db)):
    """Verify the user is an admin"""
    session_token = request.cookies.get("cosmos_beta_session")
    if not await validate_session(db, session_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Check if the user is an admin
    if not await is_admin_session(db, session_token):
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