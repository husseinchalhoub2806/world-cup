"""add is_knockout to matches

Revision ID: 005
Revises: 004
Create Date: 2026-06-28 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("matches", sa.Column("is_knockout", sa.Boolean, nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("matches", "is_knockout")
