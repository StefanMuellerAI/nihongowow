"""
Audit logging module for security-relevant events.
Provides structured logging for authentication and admin actions.
"""
import logging
from datetime import datetime
from typing import Optional
from fastapi import Request

# Configure audit logger
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Create console handler with specific format for audit logs
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    '%(asctime)s - AUDIT - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
handler.setFormatter(formatter)
audit_logger.addHandler(handler)


def get_client_ip(request: Optional[Request] = None) -> str:
    """Extract client IP address from request."""
    if request is None:
        return "unknown"
    
    # Check for X-Forwarded-For header (for proxied requests)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Fall back to direct client IP
    if request.client:
        return request.client.host
    return "unknown"


class AuditEvent:
    """Enumeration of audit event types."""
    # Authentication events
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    MFA_SENT = "MFA_SENT"
    MFA_VERIFIED = "MFA_VERIFIED"
    MFA_FAILED = "MFA_FAILED"
    LOGOUT = "LOGOUT"
    REGISTRATION = "REGISTRATION"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    
    # Admin events
    ADMIN_LOGIN = "ADMIN_LOGIN"
    SETTINGS_CHANGED = "SETTINGS_CHANGED"
    VOCABULARY_CREATED = "VOCABULARY_CREATED"
    VOCABULARY_UPDATED = "VOCABULARY_UPDATED"
    VOCABULARY_DELETED = "VOCABULARY_DELETED"
    CSV_IMPORTED = "CSV_IMPORTED"
    
    # Security events
    RATE_LIMITED = "RATE_LIMITED"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"


def log_audit_event(
    event: str,
    user_email: Optional[str] = None,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[str] = None,
    success: bool = True,
    request: Optional[Request] = None
):
    """
    Log a security audit event.
    
    Args:
        event: The type of event (from AuditEvent)
        user_email: Email of the user involved (if applicable)
        user_id: ID of the user involved (if applicable)
        ip_address: Client IP address
        details: Additional details about the event
        success: Whether the action was successful
        request: FastAPI request object for IP extraction
    """
    # Get IP from request if not provided
    if ip_address is None and request is not None:
        ip_address = get_client_ip(request)
    
    # Build log message
    status = "SUCCESS" if success else "FAILED"
    parts = [
        f"event={event}",
        f"status={status}",
    ]
    
    if user_email:
        # Mask email for privacy in logs
        parts.append(f"user={_mask_email(user_email)}")
    
    if user_id:
        parts.append(f"user_id={user_id}")
    
    if ip_address:
        parts.append(f"ip={ip_address}")
    
    if details:
        parts.append(f"details={details}")
    
    message = " | ".join(parts)
    
    if success:
        audit_logger.info(message)
    else:
        audit_logger.warning(message)


def _mask_email(email: str) -> str:
    """Mask an email address for privacy in logs."""
    if not email or "@" not in email:
        return "***"
    
    local, domain = email.rsplit("@", 1)
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    
    return f"{masked_local}@{domain}"


# Convenience functions for common events
def log_login_success(email: str, request: Optional[Request] = None, is_admin: bool = False):
    """Log successful login."""
    event = AuditEvent.ADMIN_LOGIN if is_admin else AuditEvent.LOGIN_SUCCESS
    log_audit_event(event, user_email=email, request=request, success=True)


def log_login_failed(email: str, request: Optional[Request] = None, reason: str = "Invalid credentials"):
    """Log failed login attempt."""
    log_audit_event(
        AuditEvent.LOGIN_FAILED,
        user_email=email,
        request=request,
        success=False,
        details=reason
    )


def log_account_locked(email: str, request: Optional[Request] = None):
    """Log account lockout due to too many failed attempts."""
    log_audit_event(
        AuditEvent.ACCOUNT_LOCKED,
        user_email=email,
        request=request,
        success=False,
        details="Too many failed login attempts"
    )


def log_mfa_event(email: str, event_type: str, request: Optional[Request] = None, success: bool = True):
    """Log MFA-related events."""
    event = {
        "sent": AuditEvent.MFA_SENT,
        "verified": AuditEvent.MFA_VERIFIED,
        "failed": AuditEvent.MFA_FAILED,
    }.get(event_type, AuditEvent.MFA_SENT)
    
    log_audit_event(event, user_email=email, request=request, success=success)


def log_registration(email: str, request: Optional[Request] = None):
    """Log new user registration."""
    log_audit_event(AuditEvent.REGISTRATION, user_email=email, request=request, success=True)


def log_admin_action(
    action: str,
    admin_email: str,
    details: str,
    request: Optional[Request] = None
):
    """Log admin actions."""
    event = {
        "settings_changed": AuditEvent.SETTINGS_CHANGED,
        "vocab_created": AuditEvent.VOCABULARY_CREATED,
        "vocab_updated": AuditEvent.VOCABULARY_UPDATED,
        "vocab_deleted": AuditEvent.VOCABULARY_DELETED,
        "csv_imported": AuditEvent.CSV_IMPORTED,
    }.get(action, AuditEvent.SETTINGS_CHANGED)
    
    log_audit_event(event, user_email=admin_email, request=request, details=details, success=True)

