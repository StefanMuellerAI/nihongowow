from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Union
import logging

from app.database import get_db
from app.models import User, MFACode, EmailVerificationToken, Invitation
from app.schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    MFARequired, MFAVerify, MFAResend, MFAResendResponse,
    EmailConfirm, EmailConfirmResponse, ResendVerification, ResendVerificationResponse,
    RegisterResponse
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.config import get_settings
from app.email_service import (
    generate_mfa_code, get_mfa_expiry, send_mfa_code,
    generate_verification_token, get_verification_token_expiry, send_verification_email
)
from app.rate_limiter import limiter, RATE_LIMITS
from app.audit_logger import (
    log_login_success, log_login_failed, log_account_locked,
    log_mfa_event, log_registration, AuditEvent, log_audit_event
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()
logger = logging.getLogger(__name__)

# Account lockout settings
MAX_FAILED_ATTEMPTS = 10
LOCKOUT_DURATION_MINUTES = 15


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(RATE_LIMITS["register"])
async def register(
    request: Request,
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user with email. Sends verification email."""
    # Honeypot check - if filled, it's a bot
    if user_data.website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if invitation token is provided and validate it
    invitation = None
    if user_data.invitation_token:
        invitation = db.query(Invitation).filter(
            Invitation.token == user_data.invitation_token,
            Invitation.accepted == False,
            Invitation.expires_at > datetime.utcnow()
        ).first()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invitation"
            )
        
        # Verify that the email matches the invitation
        if invitation.email.lower() != user_data.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email does not match invitation"
            )
    
    # Check if email should be admin
    admin_emails = [e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()]
    is_admin = user_data.email.lower() in admin_emails
    
    # Create new user (not verified yet)
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        is_email_verified=False,
        mfa_enabled=True,
        is_admin=is_admin
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Mark invitation as accepted if present
    if invitation:
        invitation.accepted = True
        invitation.accepted_at = datetime.utcnow()
        db.commit()
        logger.info(f"Invitation for {invitation.email} marked as accepted")
    
    # Create verification token
    token = generate_verification_token()
    verification_token = EmailVerificationToken(
        user_id=new_user.id,
        token=token,
        expires_at=get_verification_token_expiry()
    )
    db.add(verification_token)
    db.commit()
    
    # Send verification email in background
    background_tasks.add_task(send_verification_email, new_user.email, token, new_user.username)
    
    # Audit log the registration
    log_registration(new_user.email, request)
    
    return RegisterResponse(
        success=True,
        message="Registration successful. Please check your email to verify your account.",
        email=new_user.email
    )


@router.post("/login", response_model=Union[Token, MFARequired])
@limiter.limit(RATE_LIMITS["login"])
async def login(
    request: Request,
    user_data: UserLogin,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    If MFA is enabled, sends verification code and returns mfa_required: true.
    Requires email to be verified first (Double Opt-In).
    Implements account lockout after multiple failed attempts.
    """
    # Honeypot check - if filled, it's a bot
    if user_data.website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    
    user = db.query(User).filter(User.email == user_data.email).first()
    
    # Generic error message to prevent user enumeration
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if user exists
    if not user:
        log_login_failed(user_data.email, request, "User not found")
        raise credentials_error
    
    # Check if account is locked
    if user.is_locked():
        remaining_time = (user.locked_until - datetime.utcnow()).seconds // 60
        log_login_failed(user.email, request, "Account locked")
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account temporarily locked. Try again in {remaining_time + 1} minutes."
        )
    
    # Check if password is correct
    if not verify_password(user_data.password, user.password_hash):
        # Increment failed attempts
        user.failed_login_attempts += 1
        
        # Check if we should lock the account
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            log_account_locked(user.email, request)
        else:
            log_login_failed(user.email, request, "Invalid password")
        
        db.commit()
        raise credentials_error
    
    # Check if email is verified (Double Opt-In)
    if not user.is_email_verified:
        log_login_failed(user.email, request, "Email not verified")
        raise credentials_error
    
    # Successful authentication - reset failed attempts
    user.reset_failed_attempts()
    db.commit()
    
    # If MFA is enabled, send code and return MFA required response
    if user.mfa_enabled:
        # Delete any existing MFA codes for this user
        db.query(MFACode).filter(MFACode.user_id == user.id).delete()
        
        # Generate new MFA code
        code = generate_mfa_code()
        mfa_code = MFACode(
            user_id=user.id,
            code=code,
            expires_at=get_mfa_expiry()
        )
        db.add(mfa_code)
        db.commit()
        
        # Send email in background
        background_tasks.add_task(send_mfa_code, user.email, code, user.username)
        
        # Audit log MFA code sent
        log_mfa_event(user.email, "sent", request)
        
        return MFARequired(
            mfa_required=True,
            email=user.email,
            message="Verification code sent to your email"
        )
    
    # MFA not enabled - return token directly
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.jwt_expire_minutes)
    )
    
    # Audit log successful login
    log_login_success(user.email, request, is_admin=user.is_admin)
    return Token(access_token=access_token)


@router.post("/verify-mfa", response_model=Token)
@limiter.limit(RATE_LIMITS["mfa_verify"])
async def verify_mfa(request: Request, mfa_data: MFAVerify, db: Session = Depends(get_db)):
    """Verify MFA code and return JWT token."""
    # Find user by email
    user = db.query(User).filter(User.email == mfa_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Check if account is locked
    if user.is_locked():
        remaining_time = (user.locked_until - datetime.utcnow()).seconds // 60
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account temporarily locked. Try again in {remaining_time + 1} minutes."
        )
    
    # Find valid MFA code
    mfa_code = db.query(MFACode).filter(
        MFACode.user_id == user.id,
        MFACode.code == mfa_data.code,
        MFACode.expires_at > datetime.utcnow()
    ).first()
    
    if not mfa_code:
        # Increment failed attempts for MFA too
        user.failed_login_attempts += 1
        
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            log_account_locked(user.email, request)
        else:
            log_mfa_event(user.email, "failed", request, success=False)
        
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Delete the used MFA code
    db.delete(mfa_code)
    
    # Mark email as verified if first successful login
    if not user.is_email_verified:
        user.is_email_verified = True
        log_audit_event(AuditEvent.EMAIL_VERIFIED, user_email=user.email, request=request)
    
    # Reset failed attempts on successful MFA
    user.reset_failed_attempts()
    db.commit()
    
    # Generate access token
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.jwt_expire_minutes)
    )
    
    # Audit log successful MFA verification
    log_mfa_event(user.email, "verified", request)
    log_login_success(user.email, request, is_admin=user.is_admin)
    return Token(access_token=access_token)


@router.post("/resend-mfa", response_model=MFAResendResponse)
@limiter.limit(RATE_LIMITS["mfa_resend"])
async def resend_mfa(
    request: Request,
    mfa_data: MFAResend,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Resend MFA verification code."""
    user = db.query(User).filter(User.email == mfa_data.email).first()
    
    if not user:
        # Don't reveal if email exists or not
        return MFAResendResponse(
            success=True,
            message="If the email exists, a new code has been sent"
        )
    
    # Delete existing codes
    db.query(MFACode).filter(MFACode.user_id == user.id).delete()
    
    # Generate new code
    code = generate_mfa_code()
    mfa_code = MFACode(
        user_id=user.id,
        code=code,
        expires_at=get_mfa_expiry()
    )
    db.add(mfa_code)
    db.commit()
    
    # Send email in background
    background_tasks.add_task(send_mfa_code, user.email, code, user.username)
    
    return MFAResendResponse(
        success=True,
        message="Verification code sent to your email"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return current_user


@router.post("/confirm-email", response_model=EmailConfirmResponse)
@limiter.limit(RATE_LIMITS["mfa_verify"])
async def confirm_email(request: Request, data: EmailConfirm, db: Session = Depends(get_db)):
    """Confirm email address using verification token."""
    # Find the verification token
    verification_token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == data.token,
        EmailVerificationToken.expires_at > datetime.utcnow()
    ).first()
    
    if not verification_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link"
        )
    
    # Get the user
    user = db.query(User).filter(User.id == verification_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Mark email as verified
    user.is_email_verified = True
    
    # Delete the verification token
    db.delete(verification_token)
    db.commit()
    
    return EmailConfirmResponse(
        success=True,
        message="Email successfully verified. You can now log in."
    )


@router.post("/resend-verification", response_model=ResendVerificationResponse)
@limiter.limit(RATE_LIMITS["resend_verification"])
async def resend_verification(
    request: Request,
    data: ResendVerification,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Resend verification email."""
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return ResendVerificationResponse(
            success=True,
            message="If an account with this email exists, a verification email has been sent."
        )
    
    # If already verified, still return generic success
    if user.is_email_verified:
        return ResendVerificationResponse(
            success=True,
            message="If an account with this email exists, a verification email has been sent."
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
    
    return ResendVerificationResponse(
        success=True,
        message="If an account with this email exists, a verification email has been sent."
    )
