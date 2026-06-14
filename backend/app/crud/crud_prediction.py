from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import PredictionCreate


def get_prediction(db: Session, user_id: int, match_id: int) -> Optional[Prediction]:
    return (
        db.query(Prediction)
        .filter(Prediction.user_id == user_id, Prediction.match_id == match_id)
        .first()
    )


def get_prediction_by_id(db: Session, prediction_id: int) -> Optional[Prediction]:
    return db.query(Prediction).filter(Prediction.id == prediction_id).first()


def get_user_predictions(db: Session, user_id: int) -> list[Prediction]:
    return (
        db.query(Prediction)
        .options(joinedload(Prediction.match))
        .filter(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )


def get_match_predictions(db: Session, match_id: int) -> list[Prediction]:
    """All predictions for a given match — used by admin and scoring service."""
    return (
        db.query(Prediction)
        .options(joinedload(Prediction.user))
        .filter(Prediction.match_id == match_id)
        .all()
    )


def get_all_predictions(db: Session, skip: int = 0, limit: int = 500) -> list[Prediction]:
    return (
        db.query(Prediction)
        .options(joinedload(Prediction.user), joinedload(Prediction.match))
        .order_by(Prediction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def reset_match_prediction_scores(db: Session, match_id: int) -> None:
    """Null out points for all predictions on a match — used when a match reverts from finished to live."""
    db.query(Prediction).filter(Prediction.match_id == match_id).update(
        {Prediction.points_earned: None}, synchronize_session=False
    )
    db.commit()


def upsert_prediction(db: Session, user: User, match_id: int, data: PredictionCreate) -> Prediction:
    """Create or update a prediction. Only allowed before match kickoff (enforced at API layer).
    Handles joker balance: decrement on apply, refund on removal. Balance validation is the caller's responsibility."""
    prediction = get_prediction(db, user.id, match_id)
    was_joker = prediction.joker_applied if prediction else False
    new_joker = data.joker_applied

    if new_joker and not was_joker:
        user.joker_balance -= 1
    elif not new_joker and was_joker:
        user.joker_balance += 1

    if prediction:
        prediction.predicted_winner = data.predicted_winner
        prediction.predicted_score_team1 = data.predicted_score_team1
        prediction.predicted_score_team2 = data.predicted_score_team2
        prediction.joker_applied = new_joker
        prediction.points_earned = None
    else:
        prediction = Prediction(
            user_id=user.id,
            match_id=match_id,
            predicted_winner=data.predicted_winner,
            predicted_score_team1=data.predicted_score_team1,
            predicted_score_team2=data.predicted_score_team2,
            joker_applied=new_joker,
        )
        db.add(prediction)

    db.commit()
    db.refresh(prediction)
    return prediction
