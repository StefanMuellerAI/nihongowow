from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserPreferences
from app.schemas import UserPreferencesResponse, UserPreferencesUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["User Preferences"])


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's preferences (selected tags)."""
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Return empty list if no preferences set
        return UserPreferencesResponse(selected_tags=[])
    
    # Parse comma-separated tags
    if prefs.selected_tags:
        tags = [t.strip() for t in prefs.selected_tags.split(",") if t.strip()]
    else:
        tags = []
    
    return UserPreferencesResponse(selected_tags=tags)


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    update_data: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's preferences (selected tags)."""
    prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    
    # Convert list to comma-separated string
    tags_str = ",".join(update_data.selected_tags)
    
    if not prefs:
        # Create new preferences
        prefs = UserPreferences(
            user_id=current_user.id,
            selected_tags=tags_str
        )
        db.add(prefs)
    else:
        prefs.selected_tags = tags_str
    
    db.commit()
    db.refresh(prefs)
    
    return UserPreferencesResponse(selected_tags=update_data.selected_tags)
