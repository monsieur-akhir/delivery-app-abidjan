"""merge_heads

Revision ID: 251709e76da3
Revises: 2888a65bd591, 2b84e36b1f70
Create Date: 2025-06-16 11:27:38.330878

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '251709e76da3'
down_revision = ('2888a65bd591', '2b84e36b1f70')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
