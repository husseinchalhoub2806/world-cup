from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, field_validator

from app.models.match import MatchStatus


class MatchCreate(BaseModel):
    team1: str
    team2: str
    match_datetime: datetime  # Caller provides UTC datetime
    is_knockout: bool = False

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
    is_knockout: Optional[bool] = None


class MatchResultInput(BaseModel):
    score_team1: int
    score_team2: int
    actual_winner: Optional[Literal["team1", "team2"]] = None

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
    is_knockout: bool
    score_team1: Optional[int]
    score_team2: Optional[int]
    actual_winner: Optional[str] = None
    external_id: Optional[str] = None
    created_at: datetime


class MatchImportResponse(BaseModel):
    imported: int
    skipped: int


class MatchScoreImportResponse(BaseModel):
    updated: int   # matches scored for the first time
    skipped: int   # already finished or no result available
    not_found: int # result exists on TheSportsDB but match not in our DB
