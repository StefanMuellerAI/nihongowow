from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional

from app.database import get_db
from app.models import User, DailyHighscore
from app.schemas import ScoreUpdate, ScoreResponse, TodayScoresResponse, ScoreHistoryResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/scores", tags=["Scores"])


@router.post("/update", response_model=ScoreResponse)
async def update_score(
    score_data: ScoreUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update score for a game type.
    Only updates if the new score is higher than the existing one.
    """
    today = date.today()
    
    # Find existing score for today
    existing_score = db.query(DailyHighscore).filter(
        DailyHighscore.user_id == current_user.id,
        DailyHighscore.game_type == score_data.game_type,
        DailyHighscore.date == today
    ).first()
    
    if existing_score:
        # Only update if new score is higher
        if score_data.score > existing_score.score:
            existing_score.score = score_data.score
            existing_score.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_score)
        return existing_score
    else:
        # Create new score entry
        new_score = DailyHighscore(
            user_id=current_user.id,
            game_type=score_data.game_type,
            date=today,
            score=score_data.score
        )
        db.add(new_score)
        db.commit()
        db.refresh(new_score)
        return new_score


@router.get("/today", response_model=TodayScoresResponse)
async def get_today_scores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's scores for all games."""
    today = date.today()
    
    scores = db.query(DailyHighscore).filter(
        DailyHighscore.user_id == current_user.id,
        DailyHighscore.date == today
    ).all()
    
    result = TodayScoresResponse()
    for score in scores:
        if score.game_type == "quiz":
            result.quiz = score.score
        elif score.game_type == "salad":
            result.salad = score.score
        elif score.game_type == "lines":
            result.lines = score.score
        elif score.game_type == "memory":
            result.memory = score.score
    
    return result


@router.get("/me", response_model=ScoreHistoryResponse)
async def get_my_scores(
    game_type: Optional[str] = None,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's score history."""
    query = db.query(DailyHighscore).filter(
        DailyHighscore.user_id == current_user.id
    )
    
    if game_type:
        query = query.filter(DailyHighscore.game_type == game_type)
    
    scores = query.order_by(DailyHighscore.date.desc()).limit(limit).all()
    
    return ScoreHistoryResponse(scores=scores)


@router.get("/best", response_model=TodayScoresResponse)
async def get_best_scores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's all-time best scores for each game."""
    from sqlalchemy import func
    
    result = TodayScoresResponse()
    
    for game_type in ["quiz", "salad", "lines", "memory"]:
        best = db.query(func.max(DailyHighscore.score)).filter(
            DailyHighscore.user_id == current_user.id,
            DailyHighscore.game_type == game_type
        ).scalar()
        
        if best:
            setattr(result, game_type, best)
    
    return result

