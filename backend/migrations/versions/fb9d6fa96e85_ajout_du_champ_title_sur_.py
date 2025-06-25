"""Ajout du champ title sur MultiDestinationDelivery

Revision ID: fb9d6fa96e85
Revises: 19a5320c0be6
Create Date: 2025-06-24 18:26:13.949775

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fb9d6fa96e85'
down_revision = '19a5320c0be6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('multi_destination_deliveries', sa.Column('title', sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column('multi_destination_deliveries', 'title')
