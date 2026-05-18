import sys
from pathlib import Path
from loguru import logger

LOG_DIR = Path("/app/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)


def setup_logging() -> None:
    """Configure loguru with console + rotating file handlers."""
    logger.remove()  # Remove default handler

    # Console: human-readable with color
    logger.add(
        sys.stdout,
        level="DEBUG",
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    # File: structured JSON, rotating daily, keep 30 days
    logger.add(
        LOG_DIR / "app.log",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        rotation="00:00",       # Rotate at midnight
        retention="30 days",
        compression="zip",
    )

    # Separate error log
    logger.add(
        LOG_DIR / "error.log",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        rotation="1 week",
        retention="90 days",
        compression="zip",
    )

    logger.info("Logging configured. Log directory: {}", LOG_DIR)
