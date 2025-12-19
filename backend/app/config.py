from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from typing import Optional
import secrets


class Settings(BaseSettings):
    # REQUIRED - No defaults for security-critical settings
    database_url: str  # Must be set via environment variable
    jwt_secret: str  # Must be set via environment variable
    
    # JWT Settings
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 1 day (reduced from 7 days)
    
    # CORS Settings
    cors_origins: str = "http://localhost:3000"
    
    # Frontend URL for email links
    frontend_url: str = "http://localhost:3000"
    
    # OpenAI Settings (optional)
    openai_api_key: str = ""
    
    # SMTP Settings for MFA emails
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@nihongowow.com"
    smtp_from_name: str = "NihongoWOW"
    
    # MFA Settings
    mfa_code_expire_minutes: int = 10
    
    # Admin Settings - comma-separated list of email addresses that become admin on registration
    admin_emails: str = ""
    
    # Debug mode (controls API docs visibility)
    debug: bool = False

    @field_validator('jwt_secret')
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError('JWT_SECRET must be at least 32 characters long')
        return v
    
    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v or v.startswith('postgresql://user:password'):
            raise ValueError('DATABASE_URL must be properly configured')
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def generate_secret_key(length: int = 64) -> str:
    """Generate a secure random secret key for JWT."""
    return secrets.token_urlsafe(length)
