from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Setting, User
from app.schemas import SettingResponse, SettingUpdate, SettingsListResponse
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/settings", tags=["Settings"])

# Default settings
DEFAULT_SETTINGS = {
    "salad_time_limit": "120",  # seconds
    "salad_kana_per_round": "20",
}


def init_default_settings(db: Session):
    """Initialize default settings if they don't exist."""
    for key, value in DEFAULT_SETTINGS.items():
        existing = db.query(Setting).filter(Setting.key == key).first()
        if not existing:
            new_setting = Setting(key=key, value=value)
            db.add(new_setting)
    db.commit()


@router.get("", response_model=SettingsListResponse)
async def get_all_settings(db: Session = Depends(get_db)):
    """Get all settings as a dictionary."""
    # Ensure defaults exist
    init_default_settings(db)
    
    settings = db.query(Setting).all()
    settings_dict = {s.key: s.value for s in settings}
    
    return SettingsListResponse(settings=settings_dict)


@router.get("/{key}", response_model=SettingResponse)
async def get_setting(key: str, db: Session = Depends(get_db)):
    """Get a specific setting by key."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    
    if not setting:
        # Check if it's a default setting
        if key in DEFAULT_SETTINGS:
            # Create it
            new_setting = Setting(key=key, value=DEFAULT_SETTINGS[key])
            db.add(new_setting)
            db.commit()
            db.refresh(new_setting)
            return new_setting
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found"
        )
    
    return setting


@router.put("/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    update_data: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a setting (requires admin privileges)."""
    setting = db.query(Setting).filter(Setting.key == key).first()
    
    if not setting:
        # Create new setting if it doesn't exist
        setting = Setting(key=key, value=update_data.value)
        db.add(setting)
    else:
        setting.value = update_data.value
    
    db.commit()
    db.refresh(setting)
    
    return setting

