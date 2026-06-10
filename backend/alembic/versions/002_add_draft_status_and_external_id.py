"""add draft status and external_id to matches

Revision ID: 002
Revises: 001
Create Date: 2026-06-10 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # MySQL requires a full MODIFY COLUMN to add a value to an ENUM
    op.execute(
        "ALTER TABLE matches MODIFY COLUMN status "
        "ENUM('scheduled', 'live', 'finished', 'cancelled', 'draft') "
        "NOT NULL DEFAULT 'scheduled'"
    )
    op.add_column("matches", sa.Column("external_id", sa.String(64), nullable=True))
    op.create_index("ix_matches_external_id", "matches", ["external_id"])


def downgrade() -> None:
    op.drop_index("ix_matches_external_id", table_name="matches")
    op.drop_column("matches", "external_id")
    # Convert any draft matches to cancelled before removing the enum value
    op.execute("UPDATE matches SET status = 'cancelled' WHERE status = 'draft'")
    op.execute(
        "ALTER TABLE matches MODIFY COLUMN status "
        "ENUM('scheduled', 'live', 'finished', 'cancelled') "
        "NOT NULL DEFAULT 'scheduled'"
    )
