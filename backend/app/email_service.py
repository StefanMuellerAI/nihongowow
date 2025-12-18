import smtplib
import random
import string
import secrets
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def generate_mfa_code(length: int = 6) -> str:
    """Generate a cryptographically secure random numeric MFA code."""
    # Use secrets module for cryptographically secure random numbers
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def generate_verification_token(length: int = 32) -> str:
    """Generate a cryptographically secure random verification token for email confirmation.
    
    Note: secrets.token_urlsafe(n) returns ~4/3*n characters (Base64 encoding).
    32 bytes = 256 bits of entropy = ~43 characters, which fits in VARCHAR(64).
    """
    return secrets.token_urlsafe(length)


def get_verification_token_expiry() -> datetime:
    """Get the expiry time for a verification token (24 hours)."""
    return datetime.utcnow() + timedelta(hours=24)


def get_mfa_expiry() -> datetime:
    """Get the expiry time for an MFA code."""
    return datetime.utcnow() + timedelta(minutes=settings.mfa_code_expire_minutes)


def create_mfa_email_html(code: str, username: str) -> str:
    """Create HTML email template for MFA code."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Login Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #1a1a2e; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                                <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                                    日本語WOW
                                </h1>
                                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                    NihongoWOW
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #e2e8f0; font-size: 24px; text-align: center;">
                                    Your Login Verification Code
                                </h2>
                                
                                <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6; text-align: center;">
                                    Hello <strong style="color: #e2e8f0;">{username}</strong>,<br>
                                    Use the following code to complete your login:
                                </p>
                                
                                <!-- Code Box -->
                                <div style="background-color: #0f0f23; border: 2px solid #6366f1; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px;">
                                    <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #6366f1; font-family: 'Courier New', monospace;">
                                        {code}
                                    </span>
                                </div>
                                
                                <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px; text-align: center;">
                                    This code will expire in <strong style="color: #f59e0b;">{settings.mfa_code_expire_minutes} minutes</strong>.
                                </p>
                                
                                <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; border-top: 1px solid #2d2d44; padding-top: 20px;">
                                    If you didn't request this code, please ignore this email.<br>
                                    Someone may have entered your email address by mistake.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #0f0f23; text-align: center;">
                                <p style="margin: 0; color: #64748b; font-size: 12px;">
                                    &copy; 2024 NihongoWOW. Learn Japanese the fun way!
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def create_mfa_email_text(code: str, username: str) -> str:
    """Create plain text email for MFA code."""
    return f"""
NihongoWOW - Login Verification Code

Hello {username},

Your login verification code is: {code}

This code will expire in {settings.mfa_code_expire_minutes} minutes.

If you didn't request this code, please ignore this email.

---
NihongoWOW - Learn Japanese the fun way!
"""


def create_verification_email_html(verification_url: str, username: str) -> str:
    """Create HTML email template for email verification."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #1a1a2e; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                                <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                                    日本語WOW
                                </h1>
                                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                    NihongoWOW
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #e2e8f0; font-size: 24px; text-align: center;">
                                    Confirm Your Email Address
                                </h2>
                                
                                <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6; text-align: center;">
                                    Hello <strong style="color: #e2e8f0;">{username}</strong>,<br>
                                    Thank you for registering at NihongoWOW!<br>
                                    Please click the button below to verify your email address.
                                </p>
                                
                                <!-- Button -->
                                <div style="text-align: center; margin: 0 0 30px;">
                                    <a href="{verification_url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                                        Confirm Email
                                    </a>
                                </div>
                                
                                <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px; text-align: center;">
                                    This link will expire in <strong style="color: #f59e0b;">24 hours</strong>.
                                </p>
                                
                                <p style="margin: 0 0 20px; color: #64748b; font-size: 13px; text-align: center;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0 0 20px; color: #6366f1; font-size: 12px; text-align: center; word-break: break-all;">
                                    {verification_url}
                                </p>
                                
                                <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; border-top: 1px solid #2d2d44; padding-top: 20px;">
                                    If you didn't create an account at NihongoWOW, please ignore this email.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #0f0f23; text-align: center;">
                                <p style="margin: 0; color: #64748b; font-size: 12px;">
                                    &copy; 2024 NihongoWOW. Learn Japanese the fun way!
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def create_verification_email_text(verification_url: str, username: str) -> str:
    """Create plain text email for email verification."""
    return f"""
NihongoWOW - Confirm Your Email Address

Hello {username},

Thank you for registering at NihongoWOW!

Please click the following link to verify your email address:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account at NihongoWOW, please ignore this email.

---
NihongoWOW - Learn Japanese the fun way!
"""


async def send_verification_email(email: str, token: str, username: str, frontend_url: str = "http://localhost:3000") -> bool:
    """
    Send email verification link.
    Returns True if email was sent successfully, False otherwise.
    """
    verification_url = f"{frontend_url}/confirm-email?token={token}"
    
    if not settings.smtp_host:
        # SMTP not configured - log for development (without sensitive data in production)
        if settings.debug:
            logger.info(f"[DEV MODE] Verification email would be sent to {email}")
        return True
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "NihongoWOW - Confirm Your Email Address"
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = email
        
        # Add plain text and HTML versions
        text_part = MIMEText(create_verification_email_text(verification_url, username), "plain")
        html_part = MIMEText(create_verification_email_html(verification_url, username), "html")
        
        message.attach(text_part)
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, email, message.as_string())
        
        logger.info(f"Verification email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        return False


async def send_mfa_code(email: str, code: str, username: str) -> bool:
    """
    Send MFA code via email.
    Returns True if email was sent successfully, False otherwise.
    """
    if not settings.smtp_host:
        # SMTP not configured - log for development (only in debug mode)
        if settings.debug:
            logger.info(f"[DEV MODE] MFA code generated for {email}")
        return True
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        # SECURITY: Don't include the code in the subject line (visible in logs, previews)
        message["Subject"] = "NihongoWOW - Your Login Verification Code"
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = email
        
        # Add plain text and HTML versions
        text_part = MIMEText(create_mfa_email_text(code, username), "plain")
        html_part = MIMEText(create_mfa_email_html(code, username), "html")
        
        message.attach(text_part)
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, email, message.as_string())
        
        logger.info(f"MFA code email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send MFA email: {e}")
        return False


def generate_invitation_token(length: int = 32) -> str:
    """Generate a cryptographically secure random invitation token."""
    return secrets.token_urlsafe(length)


def get_invitation_token_expiry(days: int = 7) -> datetime:
    """Get the expiry time for an invitation token (default: 7 days)."""
    return datetime.utcnow() + timedelta(days=days)


def create_invitation_email_html(invitation_url: str, inviter_name: str) -> str:
    """Create HTML email template for invitation."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to NihongoWOW!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #1a1a2e; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                                <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                                    日本語WOW
                                </h1>
                                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                    NihongoWOW
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 20px; color: #e2e8f0; font-size: 24px; text-align: center;">
                                    You're Invited! 🎉
                                </h2>
                                
                                <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6; text-align: center;">
                                    <strong style="color: #e2e8f0;">{inviter_name}</strong> has invited you to join NihongoWOW,<br>
                                    a fun and interactive way to learn Japanese vocabulary!
                                </p>
                                
                                <!-- Features -->
                                <div style="background-color: #0f0f23; border-radius: 12px; padding: 20px; margin: 0 0 30px;">
                                    <p style="margin: 0 0 10px; color: #e2e8f0; font-size: 14px;">✨ Interactive vocabulary quizzes</p>
                                    <p style="margin: 0 0 10px; color: #e2e8f0; font-size: 14px;">🎮 Fun learning games (Salad, Lines)</p>
                                    <p style="margin: 0 0 10px; color: #e2e8f0; font-size: 14px;">📊 Track your progress</p>
                                    <p style="margin: 0; color: #e2e8f0; font-size: 14px;">🏆 Daily highscores</p>
                                </div>
                                
                                <!-- Button -->
                                <div style="text-align: center; margin: 0 0 30px;">
                                    <a href="{invitation_url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                                        Accept Invitation
                                    </a>
                                </div>
                                
                                <p style="margin: 0 0 20px; color: #94a3b8; font-size: 14px; text-align: center;">
                                    This invitation will expire in <strong style="color: #f59e0b;">7 days</strong>.
                                </p>
                                
                                <p style="margin: 0 0 20px; color: #64748b; font-size: 13px; text-align: center;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0 0 20px; color: #6366f1; font-size: 12px; text-align: center; word-break: break-all;">
                                    {invitation_url}
                                </p>
                                
                                <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; border-top: 1px solid #2d2d44; padding-top: 20px;">
                                    If you didn't expect this invitation, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #0f0f23; text-align: center;">
                                <p style="margin: 0; color: #64748b; font-size: 12px;">
                                    &copy; 2024 NihongoWOW. Learn Japanese the fun way!
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def create_invitation_email_text(invitation_url: str, inviter_name: str) -> str:
    """Create plain text email for invitation."""
    return f"""
NihongoWOW - You're Invited!

{inviter_name} has invited you to join NihongoWOW, a fun and interactive way to learn Japanese vocabulary!

What you'll get:
- Interactive vocabulary quizzes
- Fun learning games (Salad, Lines)
- Track your progress
- Daily highscores

Click the following link to accept the invitation and create your account:
{invitation_url}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
NihongoWOW - Learn Japanese the fun way!
"""


async def send_invitation_email(email: str, token: str, inviter_name: str, frontend_url: str = "http://localhost:3000") -> bool:
    """
    Send invitation email with registration link.
    Returns True if email was sent successfully, False otherwise.
    """
    # URL includes email and token for pre-filling the registration form
    invitation_url = f"{frontend_url}/register?email={email}&invitation_token={token}"
    
    if not settings.smtp_host:
        # SMTP not configured - log for development
        if settings.debug:
            logger.info(f"[DEV MODE] Invitation email would be sent to {email}")
            logger.info(f"[DEV MODE] Invitation URL: {invitation_url}")
        return True
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "NihongoWOW - You're Invited!"
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = email
        
        # Add plain text and HTML versions
        text_part = MIMEText(create_invitation_email_text(invitation_url, inviter_name), "plain")
        html_part = MIMEText(create_invitation_email_html(invitation_url, inviter_name), "html")
        
        message.attach(text_part)
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, email, message.as_string())
        
        logger.info(f"Invitation email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send invitation email: {e}")
        return False

