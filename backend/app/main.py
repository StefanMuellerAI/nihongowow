from contextlib import asynccontextmanager
from datetime import datetime
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import SessionLocal
from app.models import User, MFACode, EmailVerificationToken, Invitation
from app.routers import auth, vocabulary, quiz, kana, scores, admin, user_preferences
from app.routers import settings as settings_router
from app.rate_limiter import limiter, rate_limit_exceeded_handler
from app.security_headers import SecurityHeadersMiddleware

settings = get_settings()
logger = logging.getLogger(__name__)


def sync_admin_emails():
    """Sync admin status for users matching ADMIN_EMAILS env variable."""
    if not settings.admin_emails:
        return
    
    admin_emails = [e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()]
    if not admin_emails:
        return
    
    db = SessionLocal()
    try:
        # Update users whose email is in admin_emails but is_admin is False
        updated = db.query(User).filter(
            User.email.in_(admin_emails),
            User.is_admin == False
        ).update({User.is_admin: True}, synchronize_session=False)
        
        if updated > 0:
            db.commit()
            logger.info(f"Updated {updated} user(s) to admin status")
    except Exception as e:
        logger.warning(f"Could not sync admin emails: {e}")
        db.rollback()
    finally:
        db.close()


def cleanup_expired_tokens():
    """Remove expired MFA codes, verification tokens, and invitations from the database."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Delete expired MFA codes
        deleted_mfa = db.query(MFACode).filter(
            MFACode.expires_at < now
        ).delete(synchronize_session=False)
        
        # Delete expired verification tokens
        deleted_tokens = db.query(EmailVerificationToken).filter(
            EmailVerificationToken.expires_at < now
        ).delete(synchronize_session=False)
        
        # Delete expired invitations that haven't been accepted
        deleted_invitations = db.query(Invitation).filter(
            Invitation.expires_at < now,
            Invitation.accepted == False
        ).delete(synchronize_session=False)
        
        if deleted_mfa > 0 or deleted_tokens > 0 or deleted_invitations > 0:
            db.commit()
            logger.info(f"Cleaned up {deleted_mfa} expired MFA codes, {deleted_tokens} expired verification tokens, and {deleted_invitations} expired invitations")
    except Exception as e:
        logger.warning(f"Could not cleanup expired tokens: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    sync_admin_emails()
    cleanup_expired_tokens()
    yield
    # Shutdown: nothing to do


app = FastAPI(
    title="NihongoWOW API",
    description="Japanese Vocabulary Trainer API",
    version="1.0.0",
    lifespan=lifespan,
    # Disable docs in production
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Security headers middleware (must be added before CORS to execute after CORS)
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration - explicit methods and headers for security
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Include routers
app.include_router(auth.router)
app.include_router(vocabulary.router)
app.include_router(quiz.router)
app.include_router(settings_router.router)
app.include_router(kana.router)
app.include_router(scores.router)
app.include_router(admin.router)
app.include_router(user_preferences.router)


@app.get("/")
async def root():
    return {"message": "Welcome to NihongoWOW API", "docs": "/docs" if settings.debug else None}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

