"""merge_heads

Revision ID: 251709e76da3
Revises: 5b4ad1ee1534, 5ab642752a6f
Create Date: 2025-06-16 11:27:38.330878

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '251709e76da3'
down_revision = ('5b4ad1ee1534', '5ab642752a6f')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
