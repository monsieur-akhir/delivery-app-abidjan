"""merge_all_heads

Revision ID: merge_all_heads_001
Revises: 251709e76da3, 2b84e36b1f70
Create Date: 2024-06-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_all_heads_001'
down_revision = ('251709e76da3', '2b84e36b1f70')
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass 