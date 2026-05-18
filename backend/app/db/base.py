# Import all models here so Alembic's autogenerate can detect them.
# This file is imported by alembic/env.py

from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.match import Match  # noqa: F401
from app.models.prediction import Prediction  # noqa: F401
