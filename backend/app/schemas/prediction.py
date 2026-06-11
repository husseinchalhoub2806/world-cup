from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

from app.models.prediction import PredictedWinner


class PredictionCreate(BaseModel):
    predicted_winner: PredictedWinner
    predicted_score_team1: int
    predicted_score_team2: int

    @field_validator("predicted_score_team1", "predicted_score_team2")
    @classmethod
    def score_valid(cls, v: int) -> int:
        if v < 0 or v > 30:
            raise ValueError("Predicted score must be between 0 and 30")
        return v

    @model_validator(mode="after")
    def winner_consistent_with_score(self) -> "PredictionCreate":
        s1 = self.predicted_score_team1
        s2 = self.predicted_score_team2
        w = self.predicted_winner

        if w == PredictedWinner.team1 and s1 <= s2:
            raise ValueError("If predicting team1 wins, score must have team1 scoring more goals")
        if w == PredictedWinner.team2 and s2 <= s1:
            raise ValueError("If predicting team2 wins, score must have team2 scoring more goals")
        if w == PredictedWinner.tie and s1 != s2:
            raise ValueError("If predicting a tie, both teams must have the same score")
        return self


class PredictionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    match_id: int
    predicted_winner: PredictedWinner
    predicted_score_team1: int
    predicted_score_team2: int
    points_earned: Optional[int]
    created_at: datetime


class PredictionWithMatchResponse(PredictionResponse):
    """Prediction enriched with match data. User fields only populated in admin context."""
    match_team1: str
    match_team2: str
    match_datetime: datetime
    match_status: str
    user_nickname: Optional[str] = None
    user_real_name: Optional[str] = None


class MatchPredictionPublicResponse(BaseModel):
    """Public view of a prediction — nickname and scores only, revealed after kickoff."""
    nickname: str
    predicted_score_team1: int
    predicted_score_team2: int
    predicted_winner: PredictedWinner
