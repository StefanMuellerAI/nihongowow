from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
import re


# User schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    website: Optional[str] = None  # Honeypot field
    invitation_token: Optional[str] = None  # Optional invitation token
    
    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """
        Validate password complexity:
        - At least 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        """
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username contains only allowed characters."""
        # Allow letters, numbers, underscores, hyphens, dots, and @ (for email-style usernames)
        if not re.match(r'^[a-zA-Z0-9_\-\.@]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, hyphens, dots, and @')
        # Prevent dangerous patterns
        if '..' in v or v.startswith('.') or v.endswith('.'):
            raise ValueError('Username cannot start/end with a dot or contain consecutive dots')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    website: Optional[str] = None  # Honeypot field


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    is_email_verified: bool
    mfa_enabled: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# MFA schemas
class MFARequired(BaseModel):
    mfa_required: bool = True
    email: str
    message: str = "Verification code sent to your email"


class MFAVerify(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class MFAResend(BaseModel):
    email: EmailStr


class MFAResendResponse(BaseModel):
    success: bool
    message: str


# Email verification schemas
class EmailConfirm(BaseModel):
    token: str


class EmailConfirmResponse(BaseModel):
    success: bool
    message: str


class ResendVerification(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    success: bool
    message: str


class RegisterResponse(BaseModel):
    success: bool
    message: str
    email: str


# Highscore schemas
class ScoreUpdate(BaseModel):
    game_type: str = Field(..., pattern="^(quiz|salad|lines)$")
    score: int = Field(..., ge=0)


class ScoreResponse(BaseModel):
    id: UUID
    game_type: str
    date: date
    score: int
    updated_at: datetime

    class Config:
        from_attributes = True


class TodayScoresResponse(BaseModel):
    quiz: int = 0
    salad: int = 0
    lines: int = 0


class ScoreHistoryResponse(BaseModel):
    scores: List[ScoreResponse]


# Vocabulary schemas
class VocabularyBase(BaseModel):
    expression: str = Field(..., min_length=1, max_length=255)
    reading: str = Field(..., min_length=1, max_length=255)
    meaning: str = Field(..., min_length=1, max_length=1000)
    tags: Optional[str] = ""


class VocabularyCreate(VocabularyBase):
    pass


class VocabularyUpdate(BaseModel):
    expression: Optional[str] = Field(None, min_length=1, max_length=255)
    reading: Optional[str] = Field(None, min_length=1, max_length=255)
    meaning: Optional[str] = Field(None, min_length=1, max_length=1000)
    tags: Optional[str] = None


class VocabularyResponse(VocabularyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VocabularyListResponse(BaseModel):
    items: List[VocabularyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Quiz schemas
class QuizQuestion(BaseModel):
    vocabulary_id: UUID
    question: str
    mode: str  # "to_japanese", "to_english", or "fill_in_blank"
    question_type: str  # "text" or "multiple_choice"
    options: Optional[List[str]] = None
    # Fields for fill_in_blank mode:
    display_text: Optional[str] = None  # e.g. "た＿る" with gaps shown
    gap_indices: Optional[List[int]] = None  # indices of the gaps in the original word
    gap_count: Optional[int] = None  # number of gaps to fill
    tts_text: Optional[str] = None  # full word for TTS audio hint (fill_in_blank mode)


class QuizAnswer(BaseModel):
    vocabulary_id: UUID
    answer: str
    mode: str


class QuizResult(BaseModel):
    correct: bool
    correct_answer: str
    user_answer: str


# CSV Import
class CSVImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


# AI Hint schemas
class HintRequest(BaseModel):
    vocabulary_id: UUID
    mode: str  # "to_japanese" or "to_english"


class HintResponse(BaseModel):
    hint: str
    available: bool = True


# TTS schemas
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


# Settings schemas
class SettingResponse(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    value: str


class SettingsListResponse(BaseModel):
    settings: dict[str, str]


# Kana schemas
class KanaItem(BaseModel):
    romaji: str
    kana: str


class KanaListResponse(BaseModel):
    hiragana: List[KanaItem]
    katakana: List[KanaItem]


# Admin schemas - Invitation
class InvitationCreate(BaseModel):
    email: EmailStr


class InvitationResponse(BaseModel):
    id: UUID
    email: str
    accepted: bool
    accepted_at: Optional[datetime] = None
    expires_at: datetime
    created_at: datetime
    invited_by_username: str

    class Config:
        from_attributes = True


class InvitationListResponse(BaseModel):
    items: List[InvitationResponse]
    total: int


# Admin schemas - User Management
class UserAdminResponse(BaseModel):
    id: UUID
    username: str
    email: str
    is_email_verified: bool
    mfa_enabled: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    items: List[UserAdminResponse]
    total: int


# Admin schemas - AI Cache
class HintCacheResponse(BaseModel):
    id: UUID
    vocabulary_id: UUID
    expression: str  # From vocabulary
    reading: str  # From vocabulary
    meaning: str  # From vocabulary
    mode: str
    hint: str
    created_at: datetime

    class Config:
        from_attributes = True


class HintCacheListResponse(BaseModel):
    items: List[HintCacheResponse]
    total: int


class HintCacheUpdate(BaseModel):
    hint: str = Field(..., min_length=1)


class TTSCacheResponse(BaseModel):
    id: UUID
    text: str
    created_at: datetime
    # audio_data is not included to avoid large responses

    class Config:
        from_attributes = True


class TTSCacheListResponse(BaseModel):
    items: List[TTSCacheResponse]
    total: int


class CacheStatsResponse(BaseModel):
    hint_count: int
    tts_count: int
