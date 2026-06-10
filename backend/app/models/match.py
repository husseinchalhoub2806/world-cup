import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Enum, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MatchStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    live = "live"
    finished = "finished"
    cancelled = "cancelled"


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    team1: Mapped[str] = mapped_column(String(100), nullable=False)
    team2: Mapped[str] = mapped_column(String(100), nullable=False)
    external_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Stored as UTC naive datetime
    match_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus), default=MatchStatus.scheduled, nullable=False, index=True
    )

    # Set by admin when entering final result
    score_team1: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    score_team2: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    predictions: Mapped[list["Prediction"]] = relationship(  # type: ignore[name-defined]
        "Prediction", back_populates="match", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_matches_datetime_status", "match_datetime", "status"),)

    def __repr__(self) -> str:
        return f"<Match id={self.id} {self.team1} vs {self.team2} @ {self.match_datetime} [{self.status}]>"
