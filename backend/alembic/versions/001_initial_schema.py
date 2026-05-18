"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nickname", sa.String(50), nullable=False),
        sa.Column("real_name", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "regular_user", name="userrole"),
            nullable=False,
            server_default="regular_user",
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="userstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_nickname", "users", ["nickname"], unique=True)
    op.create_index("ix_users_status", "users", ["status"])
    op.create_index("ix_users_role_status", "users", ["role", "status"])

    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("team1", sa.String(100), nullable=False),
        sa.Column("team2", sa.String(100), nullable=False),
        sa.Column("match_datetime", sa.DateTime(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("scheduled", "live", "finished", "cancelled", name="matchstatus"),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column("score_team1", sa.Integer(), nullable=True),
        sa.Column("score_team2", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_matches_id", "matches", ["id"])
    op.create_index("ix_matches_match_datetime", "matches", ["match_datetime"])
    op.create_index("ix_matches_status", "matches", ["status"])
    op.create_index("ix_matches_datetime_status", "matches", ["match_datetime", "status"])

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column(
            "predicted_winner",
            sa.Enum("team1", "team2", "tie", name="predictedwinner"),
            nullable=False,
        ),
        sa.Column("predicted_score_team1", sa.Integer(), nullable=False),
        sa.Column("predicted_score_team2", sa.Integer(), nullable=False),
        sa.Column("points_earned", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["match_id"], ["matches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "match_id", name="uq_prediction_user_match"),
    )
    op.create_index("ix_predictions_id", "predictions", ["id"])
    op.create_index("ix_predictions_user_id", "predictions", ["user_id"])
    op.create_index("ix_predictions_match_id", "predictions", ["match_id"])
    op.create_index("ix_predictions_user_match", "predictions", ["user_id", "match_id"])


def downgrade() -> None:
    op.drop_table("predictions")
    op.drop_table("matches")
    op.drop_table("users")
