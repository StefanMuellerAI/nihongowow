import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Date, ForeignKey, UniqueConstraint, Text, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    mfa_enabled = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Account lockout fields for brute-force protection
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)

    # Relationships
    mfa_codes = relationship("MFACode", back_populates="user", cascade="all, delete-orphan")
    highscores = relationship("DailyHighscore", back_populates="user", cascade="all, delete-orphan")
    verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    sent_invitations = relationship("Invitation", back_populates="inviter", cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def is_locked(self) -> bool:
        """Check if the account is currently locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def reset_failed_attempts(self):
        """Reset failed login attempts after successful login."""
        self.failed_login_attempts = 0
        self.locked_until = None


class MFACode(Base):
    __tablename__ = "mfa_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="mfa_codes")


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="verification_tokens")


class DailyHighscore(Base):
    __tablename__ = "daily_highscores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_type = Column(String(20), nullable=False)  # "quiz", "salad", "lines"
    date = Column(Date, nullable=False, default=date.today)
    score = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Unique constraint: one score per user per game per day
    __table_args__ = (
        UniqueConstraint('user_id', 'game_type', 'date', name='uix_user_game_date'),
    )

    # Relationship
    user = relationship("User", back_populates="highscores")


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expression = Column(String(255), nullable=False, index=True)
    reading = Column(String(255), nullable=False)
    meaning = Column(String(1000), nullable=False)
    tags = Column(String(500), nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hint_cache = relationship("VocabularyHintCache", back_populates="vocabulary", cascade="all, delete-orphan")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(String(500), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    accepted = Column(Boolean, default=False, nullable=False)
    accepted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    inviter = relationship("User", back_populates="sent_invitations")


class VocabularyHintCache(Base):
    """Cache for AI-generated hints to avoid repeated OpenAI API calls."""
    __tablename__ = "vocabulary_hint_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vocabulary_id = Column(UUID(as_uuid=True), ForeignKey("vocabulary.id", ondelete="CASCADE"), nullable=False, index=True)
    mode = Column(String(20), nullable=False)  # "to_japanese" or "to_english"
    hint = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Unique constraint: one hint per vocabulary per mode
    __table_args__ = (
        UniqueConstraint('vocabulary_id', 'mode', name='uix_vocab_hint_mode'),
    )

    # Relationship
    vocabulary = relationship("Vocabulary", back_populates="hint_cache")


class VocabularyTTSCache(Base):
    """Cache for TTS audio to avoid repeated OpenAI API calls."""
    __tablename__ = "vocabulary_tts_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(String(500), unique=True, nullable=False, index=True)  # The spoken text
    audio_data = Column(LargeBinary, nullable=False)  # MP3 bytes
    created_at = Column(DateTime, default=datetime.utcnow)


class UserPreferences(Base):
    """User preferences for game settings like selected vocabulary tags."""
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    selected_tags = Column(Text, nullable=False, default="")  # Comma-separated tags or empty for all
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="preferences")
