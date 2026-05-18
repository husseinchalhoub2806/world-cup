from typing import Optional

from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    nickname: str
    real_name: str
    total_points: int
    prediction_count: int
    title: Optional[str] = None  # "El Magnifico" or "Abou sha7ata"


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    total_users: int
