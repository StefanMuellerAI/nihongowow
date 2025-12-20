"""
Rate limiting configuration for the NihongoWOW API.
Protects against brute-force attacks on authentication endpoints.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def get_client_ip(request: Request) -> str:
    """
    Get client IP address, considering X-Forwarded-For header for proxied requests.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain (original client)
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Create the limiter instance
limiter = Limiter(key_func=get_client_ip)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors.
    Returns a JSON response with appropriate error message.
    """
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please wait before trying again.",
            "retry_after": exc.detail
        }
    )


# Rate limit strings for different endpoints
RATE_LIMITS = {
    # Authentication - strict limits
    "login": "5/minute",           # 5 login attempts per minute per IP
    "register": "3/minute",        # 3 registration attempts per minute per IP
    "mfa_verify": "5/minute",      # 5 MFA verification attempts per minute per IP
    "mfa_resend": "2/minute",      # 2 MFA resend requests per minute per IP
    "password_reset": "3/minute",  # 3 password reset requests per minute per IP
    
    # Email verification
    "resend_verification": "2/minute",  # 2 verification email resends per minute
    
    # General API - more lenient
    "api_default": "60/minute",    # 60 requests per minute for general API
    "quiz": "120/minute",          # 120 quiz requests per minute (gameplay)
    "tts": "30/minute",            # 30 TTS requests per minute (expensive)
    "hint": "20/minute",           # 20 AI hint requests per minute (expensive)
}



