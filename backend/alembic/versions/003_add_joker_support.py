"""add joker_balance to users and joker_applied to predictions

Revision ID: 003
Revises: 002
Create Date: 2026-06-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("joker_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("predictions", sa.Column("joker_applied", sa.Boolean(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("predictions", "joker_applied")
    op.drop_column("users", "joker_balance")
