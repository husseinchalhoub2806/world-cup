from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserRegister


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_nickname(db: Session, nickname: str) -> Optional[User]:
    return db.query(User).filter(User.nickname == nickname).first()


def create_user(db: Session, data: UserRegister) -> User:
    user = User(
        nickname=data.nickname,
        real_name=data.real_name,
        hashed_password=hash_password(data.password),
        role=UserRole.regular_user,
        status=UserStatus.pending,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session, skip: int = 0, limit: int = 200) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()


def get_pending_users(db: Session) -> list[User]:
    return db.query(User).filter(User.status == UserStatus.pending).all()


def update_user_status(db: Session, user: User, status: UserStatus) -> User:
    user.status = status
    db.commit()
    db.refresh(user)
    return user


def update_user_role(db: Session, user: User, role: UserRole) -> User:
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
