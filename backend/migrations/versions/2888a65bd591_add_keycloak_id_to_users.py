"""add_keycloak_id_to_users

Revision ID: 2888a65bd591
Revises: a06659c5694e
Create Date: 2025-05-29 16:13:59.583006

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2888a65bd591'
down_revision = 'a06659c5694e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add keycloak_id column to the users table
    op.add_column('users', sa.Column('keycloak_id', sa.String(), nullable=True))
    # Create an index on keycloak_id for better lookup performance
    op.create_index(op.f('ix_users_keycloak_id'), 'users', ['keycloak_id'], unique=False)


def downgrade() -> None:
    # Remove the index first
    op.drop_index(op.f('ix_users_keycloak_id'), table_name='users')
    # Then remove the column
    op.drop_column('users', 'keycloak_id')
