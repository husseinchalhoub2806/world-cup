"""Seed the admin user on first startup. Idempotent — safe to run multiple times."""
from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
import app.db.base  # noqa: F401 — ensures all models are registered before any query
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus


def seed_admin(db: Session) -> None:
    existing = db.query(User).filter(User.nickname == settings.ADMIN_NICKNAME).first()
    if existing:
        logger.info("Admin user '{}' already exists — skipping seed.", settings.ADMIN_NICKNAME)
        return

    admin = User(
        nickname=settings.ADMIN_NICKNAME,
        real_name=settings.ADMIN_REAL_NAME,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.admin,
        status=UserStatus.approved,
    )
    db.add(admin)
    db.commit()
    logger.info(
        "Admin user '{}' created. CHANGE THE DEFAULT PASSWORD IMMEDIATELY.",
        settings.ADMIN_NICKNAME,
    )


def main() -> None:
    logger.info("Running database initialisation...")
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()
    logger.info("Database initialisation complete.")


if __name__ == "__main__":
    main()
