"""
Scoring rules (finals mode):
  - Correct winner:                          +1 point
  - Correct winner AND exact score:          +3 points total (+2 bonus)
  - Wrong winner:                             0 points

Winner resolution order:
  1. match.actual_winner if explicitly set (supports penalty shootouts)
  2. Derived from score (team1 > team2 → team1, etc.)
"""
from typing import Optional

from loguru import logger
from sqlalchemy.orm import Session

from app.crud.crud_prediction import get_match_predictions
from app.models.match import Match
from app.models.prediction import Prediction, PredictedWinner


def _derive_winner(score_team1: int, score_team2: int) -> PredictedWinner:
    if score_team1 > score_team2:
        return PredictedWinner.team1
    if score_team1 < score_team2:
        return PredictedWinner.team2
    return PredictedWinner.tie


def _resolve_actual_winner(
    actual_score_team1: int,
    actual_score_team2: int,
    actual_winner: Optional[str],
) -> PredictedWinner:
    if actual_winner == "team1":
        return PredictedWinner.team1
    if actual_winner == "team2":
        return PredictedWinner.team2
    return _derive_winner(actual_score_team1, actual_score_team2)


def calculate_prediction_points(
    prediction: Prediction,
    actual_score_team1: int,
    actual_score_team2: int,
    actual_winner: Optional[str] = None,
) -> int:
    resolved_winner = _resolve_actual_winner(actual_score_team1, actual_score_team2, actual_winner)

    if prediction.predicted_winner != resolved_winner:
        return 0

    if (
        prediction.predicted_score_team1 == actual_score_team1
        and prediction.predicted_score_team2 == actual_score_team2
    ):
        return 3  # 1 (winner) + 2 (exact score)

    return 1  # Correct winner only


def score_match(db: Session, match: Match) -> int:
    """
    Calculate and persist points for all predictions on a finished match.
    Returns the number of predictions scored.
    """
    if match.score_team1 is None or match.score_team2 is None:
        raise ValueError(f"Match {match.id} does not have a final score set")

    predictions = get_match_predictions(db, match.id)
    if not predictions:
        logger.info("Match {}: no predictions to score.", match.id)
        return 0

    for prediction in predictions:
        points = calculate_prediction_points(
            prediction,
            match.score_team1,
            match.score_team2,
            match.actual_winner,
        )
        if prediction.joker_applied:
            points *= 2
        prediction.points_earned = points
        logger.debug(
            "Match {} | User {} | Predicted {}-{} ({}) | Actual {}-{} (winner={}) | Points: {}",
            match.id,
            prediction.user_id,
            prediction.predicted_score_team1,
            prediction.predicted_score_team2,
            prediction.predicted_winner,
            match.score_team1,
            match.score_team2,
            match.actual_winner,
            points,
        )

    db.commit()
    logger.info(
        "Match {} scored: {} predictions processed. Result: {}-{} (winner={}).",
        match.id,
        len(predictions),
        match.score_team1,
        match.score_team2,
        match.actual_winner,
    )
    return len(predictions)
