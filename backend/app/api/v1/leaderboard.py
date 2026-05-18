from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_approved_user, get_db
from app.models.user import User
from app.schemas.leaderboard import LeaderboardResponse
from app.services.leaderboard_service import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardResponse)
def leaderboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_approved_user),
):
    return get_leaderboard(db)


@router.get("/public", response_model=LeaderboardResponse)
def leaderboard_public(db: Session = Depends(get_db)):
    """Public leaderboard — top 3 for the landing page. No auth required."""
    return get_leaderboard(db)
