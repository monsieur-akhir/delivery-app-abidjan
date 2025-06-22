
"""enhance collaborative deliveries

Revision ID: 5e6f7g8h9i0j
Revises: 4d5e6f7g8h9i
Create Date: 2024-01-20 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '5e6f7g8h9i0j'
down_revision = '4d5e6f7g8h9i'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to collaborative_deliveries if they don't exist
    try:
        op.add_column('collaborative_deliveries', sa.Column('coordination_fee', sa.Float(), nullable=True))
        op.add_column('collaborative_deliveries', sa.Column('completion_bonus', sa.Float(), nullable=True))
        op.add_column('collaborative_deliveries', sa.Column('route_optimization_enabled', sa.Boolean(), nullable=False, server_default='true'))
        op.add_column('collaborative_deliveries', sa.Column('real_time_tracking', sa.Boolean(), nullable=False, server_default='true'))
        op.add_column('collaborative_deliveries', sa.Column('estimated_duration_minutes', sa.Integer(), nullable=True))
        op.add_column('collaborative_deliveries', sa.Column('actual_duration_minutes', sa.Integer(), nullable=True))
    except Exception:
        pass  # Columns might already exist

    # Create collaborative_delivery_participants table if not exists
    try:
        op.create_table('collaborative_delivery_participants',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('collaborative_delivery_id', sa.Integer(), nullable=False),
            sa.Column('courier_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(50), nullable=False, server_default='participant'),
            sa.Column('assignment_order', sa.Integer(), nullable=False),
            sa.Column('assigned_deliveries', postgresql.JSON(), nullable=True),
            sa.Column('earnings_share_percentage', sa.Float(), nullable=False, server_default='0'),
            sa.Column('performance_rating', sa.Float(), nullable=True),
            sa.Column('status', sa.String(50), nullable=False, server_default='invited'),
            sa.Column('joined_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['collaborative_delivery_id'], ['collaborative_deliveries.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['courier_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_collaborative_delivery_participants_id'), 'collaborative_delivery_participants', ['id'], unique=False)
    except Exception:
        pass  # Table might already exist

    # Create collaborative_delivery_chat table
    try:
        op.create_table('collaborative_delivery_chat',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('collaborative_delivery_id', sa.Integer(), nullable=False),
            sa.Column('sender_id', sa.Integer(), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('message_type', sa.String(50), nullable=False, server_default='text'),
            sa.Column('is_system_message', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('read_by', postgresql.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['collaborative_delivery_id'], ['collaborative_deliveries.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_collaborative_delivery_chat_id'), 'collaborative_delivery_chat', ['id'], unique=False)
    except Exception:
        pass

def downgrade():
    try:
        op.drop_index(op.f('ix_collaborative_delivery_chat_id'), table_name='collaborative_delivery_chat')
        op.drop_table('collaborative_delivery_chat')
    except Exception:
        pass
    
    try:
        op.drop_index(op.f('ix_collaborative_delivery_participants_id'), table_name='collaborative_delivery_participants')
        op.drop_table('collaborative_delivery_participants')
    except Exception:
        pass
    
    try:
        op.drop_column('collaborative_deliveries', 'actual_duration_minutes')
        op.drop_column('collaborative_deliveries', 'estimated_duration_minutes')
        op.drop_column('collaborative_deliveries', 'real_time_tracking')
        op.drop_column('collaborative_deliveries', 'route_optimization_enabled')
        op.drop_column('collaborative_deliveries', 'completion_bonus')
        op.drop_column('collaborative_deliveries', 'coordination_fee')
    except Exception:
        pass
