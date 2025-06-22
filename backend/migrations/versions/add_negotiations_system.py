
"""add negotiations system

Revision ID: 3c4d5e6f7g8h
Revises: 2b3c4d5e6f7g
Create Date: 2024-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3c4d5e6f7g8h'
down_revision = '2b3c4d5e6f7g'
branch_labels = None
depends_on = None

def upgrade():
    # Create negotiations table
    op.create_table('negotiations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('delivery_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('courier_id', sa.Integer(), nullable=False),
        sa.Column('initial_price', sa.Float(), nullable=False),
        sa.Column('proposed_price', sa.Float(), nullable=False),
        sa.Column('counter_price', sa.Float(), nullable=True),
        sa.Column('final_price', sa.Float(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('client_message', sa.Text(), nullable=True),
        sa.Column('courier_message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['courier_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_negotiations_id'), 'negotiations', ['id'], unique=False)
    op.create_index(op.f('ix_negotiations_status'), 'negotiations', ['status'], unique=False)

    # Create counter_offers table
    op.create_table('counter_offers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('delivery_id', sa.Integer(), nullable=False),
        sa.Column('courier_id', sa.Integer(), nullable=False),
        sa.Column('original_price', sa.Float(), nullable=False),
        sa.Column('proposed_price', sa.Float(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('estimated_time', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['courier_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_counter_offers_id'), 'counter_offers', ['id'], unique=False)
    op.create_index(op.f('ix_counter_offers_status'), 'counter_offers', ['status'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_counter_offers_status'), table_name='counter_offers')
    op.drop_index(op.f('ix_counter_offers_id'), table_name='counter_offers')
    op.drop_table('counter_offers')
    op.drop_index(op.f('ix_negotiations_status'), table_name='negotiations')
    op.drop_index(op.f('ix_negotiations_id'), table_name='negotiations')
    op.drop_table('negotiations')
