from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy.orm import Session

from app.api.deps import get_current_approved_user, get_db
from app.crud.crud_match import get_match_by_id
from app.crud.crud_prediction import get_match_predictions, get_prediction, get_user_predictions, upsert_prediction
from app.models.match import MatchStatus
from app.models.user import User
from app.schemas.prediction import MatchPredictionPublicResponse, PredictionCreate, PredictionResponse, PredictionWithMatchResponse

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("", response_model=list[PredictionWithMatchResponse])
def get_my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_approved_user),
):
    """Returns the current user's predictions enriched with match data."""
    predictions = get_user_predictions(db, current_user.id)
    result = []
    for p in predictions:
        result.append(
            PredictionWithMatchResponse(
                id=p.id,
                user_id=p.user_id,
                match_id=p.match_id,
                predicted_winner=p.predicted_winner,
                predicted_score_team1=p.predicted_score_team1,
                predicted_score_team2=p.predicted_score_team2,
                joker_applied=p.joker_applied,
                points_earned=p.points_earned,
                created_at=p.created_at,
                match_team1=p.match.team1,
                match_team2=p.match.team2,
                match_datetime=p.match.match_datetime,
                match_status=p.match.status.value,
            )
        )
    return result


@router.get("/match/{match_id}", response_model=list[MatchPredictionPublicResponse])
def get_match_predictions_public(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_approved_user),
):
    """Returns all predictions for a match. Only available after kickoff."""
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if now < match.match_datetime and match.status not in (MatchStatus.live, MatchStatus.finished):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Predictions are hidden until the match starts",
        )

    predictions = get_match_predictions(db, match_id)
    return [
        MatchPredictionPublicResponse(
            nickname=p.user.nickname,
            predicted_score_team1=p.predicted_score_team1,
            predicted_score_team2=p.predicted_score_team2,
            predicted_winner=p.predicted_winner,
        )
        for p in predictions
    ]


@router.post("/{match_id}", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def submit_prediction(
    match_id: int,
    data: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_approved_user),
):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    if match.status in (MatchStatus.finished, MatchStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Predictions are closed for this match",
        )

    # Lock at kickoff — compare UTC naive datetimes
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if now >= match.match_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prediction window has closed — match has already started",
        )

    existing = get_prediction(db, current_user.id, match_id)
    was_joker = existing.joker_applied if existing else False

    if data.joker_applied and not was_joker and current_user.joker_balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have no jokers available",
        )

    prediction = upsert_prediction(db, current_user, match_id, data)
    logger.info(
        "User '{}' submitted prediction for match {} ({} vs {}): {} {}-{}",
        current_user.nickname,
        match_id,
        match.team1,
        match.team2,
        data.predicted_winner,
        data.predicted_score_team1,
        data.predicted_score_team2,
    )
    return prediction
