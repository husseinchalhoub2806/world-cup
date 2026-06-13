import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PredictedWinner(str, enum.Enum):
    team1 = "team1"
    team2 = "team2"
    tie = "tie"


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)

    predicted_winner: Mapped[PredictedWinner] = mapped_column(Enum(PredictedWinner), nullable=False)
    predicted_score_team1: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_score_team2: Mapped[int] = mapped_column(Integer, nullable=False)

    joker_applied: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")

    # NULL = match not yet scored; 0/1/3 = scored result (doubled if joker applied)
    points_earned: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="predictions")  # type: ignore[name-defined]
    match: Mapped["Match"] = relationship("Match", back_populates="predictions")  # type: ignore[name-defined]

    __table_args__ = (
        UniqueConstraint("user_id", "match_id", name="uq_prediction_user_match"),
        Index("ix_predictions_user_match", "user_id", "match_id"),
        Index("ix_predictions_match_id", "match_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<Prediction id={self.id} user={self.user_id} match={self.match_id} "
            f"winner={self.predicted_winner} score={self.predicted_score_team1}-{self.predicted_score_team2} "
            f"points={self.points_earned}>"
        )
