"""
Leaderboard ranking rules:
  1. Total points (DESC)
  2. Earliest prediction submitted (ASC) — tiebreaker
  3. Nickname alphabetically (ASC) — final tiebreaker

Special titles:
  - Rank #1: "El Magnifico"
  - Last place (when ≥2 players): "Abou sha7ata"
"""
import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.models.user import User, UserStatus
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse


def get_leaderboard(db: Session) -> LeaderboardResponse:
    stmt = (
        select(
            User.id,
            User.nickname,
            User.real_name,
            func.coalesce(func.sum(Prediction.points_earned), 0).label("total_points"),
            func.min(Prediction.created_at).label("earliest_prediction"),
            func.count(Prediction.id).label("prediction_count"),
        )
        .outerjoin(Prediction, Prediction.user_id == User.id)
        .where(User.status == UserStatus.approved)
        .group_by(User.id, User.nickname, User.real_name)
    )

    rows = db.execute(stmt).all()

    # Sort in Python for reliable multi-key tiebreaking
    def sort_key(row: tuple) -> tuple:
        ep: Optional[datetime.datetime] = row.earliest_prediction
        # Users with no predictions sort after those with predictions (at tiebreaker level)
        ep_sort = ep if ep is not None else datetime.datetime.max
        return (-row.total_points, ep_sort, row.nickname.lower())

    sorted_rows = sorted(rows, key=sort_key)
    total = len(sorted_rows)

    entries: list[LeaderboardEntry] = []
    for rank, row in enumerate(sorted_rows, start=1):
        title: Optional[str] = None
        if rank == 1:
            title = "El Magnifico"
        elif rank == total and total > 1:
            title = "Abou sha7ata"

        entries.append(
            LeaderboardEntry(
                rank=rank,
                user_id=row.id,
                nickname=row.nickname,
                real_name=row.real_name,
                total_points=int(row.total_points),
                prediction_count=int(row.prediction_count),
                title=title,
            )
        )

    return LeaderboardResponse(entries=entries, total_users=total)
