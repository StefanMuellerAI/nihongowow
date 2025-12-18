from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from uuid import UUID
import logging

from app.database import get_db
from app.models import User, Invitation, EmailVerificationToken, VocabularyHintCache, VocabularyTTSCache, Vocabulary
from app.schemas import (
    InvitationCreate, InvitationResponse, InvitationListResponse,
    UserAdminResponse, UserListResponse,
    HintCacheResponse, HintCacheListResponse, HintCacheUpdate,
    TTSCacheResponse, TTSCacheListResponse, CacheStatsResponse
)
from app.auth import require_admin
from app.email_service import (
    generate_invitation_token, get_invitation_token_expiry, send_invitation_email,
    generate_verification_token, get_verification_token_expiry, send_verification_email
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


# ============== INVITATION ENDPOINTS ==============

@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invitation_data: InvitationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new invitation and send email to the invitee."""
    email = invitation_data.email.lower()
    
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered"
        )
    
    # Check if there's already a pending invitation for this email
    existing_invitation = db.query(Invitation).filter(
        Invitation.email == email,
        Invitation.accepted == False,
        Invitation.expires_at > datetime.utcnow()
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active invitation already exists for this email"
        )
    
    # Create the invitation
    token = generate_invitation_token()
    invitation = Invitation(
        email=email,
        token=token,
        invited_by=admin.id,
        expires_at=get_invitation_token_expiry()
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    # Send invitation email in background
    background_tasks.add_task(send_invitation_email, email, token, admin.username)
    
    logger.info(f"Admin {admin.username} created invitation for {email}")
    
    return InvitationResponse(
        id=invitation.id,
        email=invitation.email,
        accepted=invitation.accepted,
        accepted_at=invitation.accepted_at,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        invited_by_username=admin.username
    )


@router.get("/invitations", response_model=InvitationListResponse)
async def list_invitations(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all invitations."""
    invitations = db.query(Invitation).order_by(Invitation.created_at.desc()).all()
    
    # Get inviter usernames
    result = []
    for inv in invitations:
        inviter = db.query(User).filter(User.id == inv.invited_by).first()
        inviter_username = inviter.username if inviter else "Unknown"
        
        result.append(InvitationResponse(
            id=inv.id,
            email=inv.email,
            accepted=inv.accepted,
            accepted_at=inv.accepted_at,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
            invited_by_username=inviter_username
        ))
    
    return InvitationListResponse(
        items=result,
        total=len(result)
    )


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invitation(
    invitation_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete an invitation."""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    db.delete(invitation)
    db.commit()
    
    logger.info(f"Admin {admin.username} deleted invitation for {invitation.email}")


@router.post("/invitations/{invitation_id}/resend", response_model=InvitationResponse)
async def resend_invitation(
    invitation_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Resend an invitation email with a new token."""
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    if invitation.accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been accepted"
        )
    
    # Generate new token and extend expiry
    invitation.token = generate_invitation_token()
    invitation.expires_at = get_invitation_token_expiry()
    
    db.commit()
    db.refresh(invitation)
    
    # Send new invitation email
    background_tasks.add_task(send_invitation_email, invitation.email, invitation.token, admin.username)
    
    logger.info(f"Admin {admin.username} resent invitation to {invitation.email}")
    
    return InvitationResponse(
        id=invitation.id,
        email=invitation.email,
        accepted=invitation.accepted,
        accepted_at=invitation.accepted_at,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        invited_by_username=admin.username
    )


# ============== USER MANAGEMENT ENDPOINTS ==============

@router.get("/users", response_model=UserListResponse)
async def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    
    result = [
        UserAdminResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_email_verified=user.is_email_verified,
            mfa_enabled=user.mfa_enabled,
            is_admin=user.is_admin,
            created_at=user.created_at
        )
        for user in users
    ]
    
    return UserListResponse(
        items=result,
        total=len(result)
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a user and all their data."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admins from deleting themselves
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    logger.info(f"Admin {admin.username} deleted user {user.username} ({user.email})")
    
    db.delete(user)
    db.commit()


@router.post("/users/{user_id}/resend-verification", response_model=UserAdminResponse)
async def resend_user_verification(
    user_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Resend verification email for a user who hasn't verified their email yet."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified"
        )
    
    # Delete any existing verification tokens for this user
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id
    ).delete()
    
    # Create new verification token
    token = generate_verification_token()
    verification_token = EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=get_verification_token_expiry()
    )
    db.add(verification_token)
    db.commit()
    
    # Send verification email in background
    background_tasks.add_task(send_verification_email, user.email, token, user.username)
    
    logger.info(f"Admin {admin.username} resent verification email to {user.email}")
    
    return UserAdminResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        is_email_verified=user.is_email_verified,
        mfa_enabled=user.mfa_enabled,
        is_admin=user.is_admin,
        created_at=user.created_at
    )


# ============== AI CACHE MANAGEMENT ENDPOINTS ==============

@router.get("/cache/stats", response_model=CacheStatsResponse)
async def get_cache_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get cache statistics."""
    hint_count = db.query(VocabularyHintCache).count()
    tts_count = db.query(VocabularyTTSCache).count()
    
    return CacheStatsResponse(
        hint_count=hint_count,
        tts_count=tts_count
    )


@router.get("/cache/hints", response_model=HintCacheListResponse)
async def list_hint_cache(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all cached hints."""
    cached_hints = db.query(VocabularyHintCache).order_by(VocabularyHintCache.created_at.desc()).all()
    
    result = []
    for hint in cached_hints:
        vocab = db.query(Vocabulary).filter(Vocabulary.id == hint.vocabulary_id).first()
        if vocab:
            result.append(HintCacheResponse(
                id=hint.id,
                vocabulary_id=hint.vocabulary_id,
                expression=vocab.expression,
                reading=vocab.reading,
                meaning=vocab.meaning,
                mode=hint.mode,
                hint=hint.hint,
                created_at=hint.created_at
            ))
    
    return HintCacheListResponse(
        items=result,
        total=len(result)
    )


@router.put("/cache/hints/{hint_id}", response_model=HintCacheResponse)
async def update_hint_cache(
    hint_id: UUID,
    update_data: HintCacheUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Update a cached hint."""
    cached_hint = db.query(VocabularyHintCache).filter(VocabularyHintCache.id == hint_id).first()
    
    if not cached_hint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cached hint not found"
        )
    
    cached_hint.hint = update_data.hint
    db.commit()
    db.refresh(cached_hint)
    
    vocab = db.query(Vocabulary).filter(Vocabulary.id == cached_hint.vocabulary_id).first()
    
    logger.info(f"Admin {admin.username} updated hint cache for vocabulary {cached_hint.vocabulary_id}")
    
    return HintCacheResponse(
        id=cached_hint.id,
        vocabulary_id=cached_hint.vocabulary_id,
        expression=vocab.expression if vocab else "",
        reading=vocab.reading if vocab else "",
        meaning=vocab.meaning if vocab else "",
        mode=cached_hint.mode,
        hint=cached_hint.hint,
        created_at=cached_hint.created_at
    )


@router.delete("/cache/hints/{hint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hint_cache(
    hint_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a cached hint."""
    cached_hint = db.query(VocabularyHintCache).filter(VocabularyHintCache.id == hint_id).first()
    
    if not cached_hint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cached hint not found"
        )
    
    db.delete(cached_hint)
    db.commit()
    
    logger.info(f"Admin {admin.username} deleted hint cache {hint_id}")


@router.delete("/cache/hints", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_hints_cache(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Clear all cached hints."""
    count = db.query(VocabularyHintCache).delete()
    db.commit()
    
    logger.info(f"Admin {admin.username} cleared all hint cache ({count} entries)")


@router.get("/cache/tts", response_model=TTSCacheListResponse)
async def list_tts_cache(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """List all cached TTS entries (without audio data)."""
    cached_tts = db.query(VocabularyTTSCache).order_by(VocabularyTTSCache.created_at.desc()).all()
    
    result = [
        TTSCacheResponse(
            id=tts.id,
            text=tts.text,
            created_at=tts.created_at
        )
        for tts in cached_tts
    ]
    
    return TTSCacheListResponse(
        items=result,
        total=len(result)
    )


@router.get("/cache/tts/{tts_id}/audio")
async def get_tts_audio(
    tts_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get the audio data for a cached TTS entry."""
    cached_tts = db.query(VocabularyTTSCache).filter(VocabularyTTSCache.id == tts_id).first()
    
    if not cached_tts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cached TTS not found"
        )
    
    return Response(
        content=cached_tts.audio_data,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f"inline; filename=tts_{tts_id}.mp3"}
    )


@router.delete("/cache/tts/{tts_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tts_cache(
    tts_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a cached TTS entry."""
    cached_tts = db.query(VocabularyTTSCache).filter(VocabularyTTSCache.id == tts_id).first()
    
    if not cached_tts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cached TTS not found"
        )
    
    db.delete(cached_tts)
    db.commit()
    
    logger.info(f"Admin {admin.username} deleted TTS cache {tts_id}")


@router.delete("/cache/tts", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_tts_cache(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Clear all cached TTS entries."""
    count = db.query(VocabularyTTSCache).delete()
    db.commit()
    
    logger.info(f"Admin {admin.username} cleared all TTS cache ({count} entries)")
