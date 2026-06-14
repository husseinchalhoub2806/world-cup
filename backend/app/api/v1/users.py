from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_approved_user, get_db
from app.crud.crud_prediction import get_user_predictions
from app.crud.crud_user import get_user_by_id
from app.models.prediction import PredictedWinner
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


class UserPredictionPublicResponse(BaseModel):
    match_id: int
    match_team1: str
    match_team2: str
    match_datetime: datetime
    match_status: str
    match_score_team1: int | None
    match_score_team2: int | None
    predicted_score_team1: int
    predicted_score_team2: int
    predicted_winner: PredictedWinner
    joker_applied: bool
    points_earned: int | None


@router.get("/{user_id}/predictions", response_model=list[UserPredictionPublicResponse])
def get_user_predictions_public(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_approved_user),
):
    """Return a player's predictions for matches that have already kicked off."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    predictions = get_user_predictions(db, user_id)

    result = []
    for p in predictions:
        if p.match.match_datetime > now:
            continue  # hide predictions for matches not yet kicked off
        result.append(
            UserPredictionPublicResponse(
                match_id=p.match_id,
                match_team1=p.match.team1,
                match_team2=p.match.team2,
                match_datetime=p.match.match_datetime,
                match_status=p.match.status.value,
                match_score_team1=p.match.score_team1,
                match_score_team2=p.match.score_team2,
                predicted_score_team1=p.predicted_score_team1,
                predicted_score_team2=p.predicted_score_team2,
                predicted_winner=p.predicted_winner,
                joker_applied=p.joker_applied,
                points_earned=p.points_earned,
            )
        )

    return result
