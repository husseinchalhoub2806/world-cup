import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    regular_user = "regular_user"


class UserStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nickname: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    real_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.regular_user, nullable=False
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus), default=UserStatus.pending, nullable=False, index=True
    )
    joker_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    predictions: Mapped[list["Prediction"]] = relationship(  # type: ignore[name-defined]
        "Prediction", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_users_role_status", "role", "status"),)

    def __repr__(self) -> str:
        return f"<User id={self.id} nickname={self.nickname!r} role={self.role} status={self.status}>"
