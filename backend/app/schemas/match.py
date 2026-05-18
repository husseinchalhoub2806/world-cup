from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.match import MatchStatus


class MatchCreate(BaseModel):
    team1: str
    team2: str
    match_datetime: datetime  # Caller provides UTC datetime

    @field_validator("team1", "team2")
    @classmethod
    def team_name_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Team name cannot be empty")
        if len(v) > 100:
            raise ValueError("Team name too long (max 100 chars)")
        return v

    @field_validator("match_datetime")
    @classmethod
    def datetime_not_in_past(cls, v: datetime) -> datetime:
        from datetime import timezone
        # Strip timezone info and treat as UTC if naive
        if v.tzinfo is not None:
            v = v.replace(tzinfo=None)
        return v


class MatchUpdate(BaseModel):
    team1: Optional[str] = None
    team2: Optional[str] = None
    match_datetime: Optional[datetime] = None
    status: Optional[MatchStatus] = None


class MatchResultInput(BaseModel):
    score_team1: int
    score_team2: int

    @field_validator("score_team1", "score_team2")
    @classmethod
    def score_valid(cls, v: int) -> int:
        if v < 0 or v > 30:
            raise ValueError("Score must be between 0 and 30")
        return v


class MatchResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    team1: str
    team2: str
    match_datetime: datetime
    status: MatchStatus
    score_team1: Optional[int]
    score_team2: Optional[int]
    created_at: datetime
