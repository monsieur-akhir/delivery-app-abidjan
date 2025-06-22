"""add scheduled deliveries

Revision ID: 2b3c4d5e6f7g
Revises: 1a2b3c4d5e6f
Create Date: 2024-01-20 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect, text
from migrations.alembic_utils import safe_create_table, safe_create_index, safe_add_column

# revision identifiers, used by Alembic.
revision = '2b3c4d5e6f7g'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    if 'scheduled_deliveries' not in tables:
        safe_create_table(op, 'scheduled_deliveries',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('client_id', sa.Integer(), nullable=False),
            sa.Column('courier_id', sa.Integer(), nullable=True),
            sa.Column('pickup_address', sa.String(500), nullable=False),
            sa.Column('pickup_commune', sa.String(100), nullable=False),
            sa.Column('delivery_address', sa.String(500), nullable=False),
            sa.Column('delivery_commune', sa.String(100), nullable=False),
            sa.Column('package_description', sa.Text(), nullable=True),
            sa.Column('delivery_fee', sa.Float(), nullable=False),
            sa.Column('scheduled_date', sa.DateTime(), nullable=False),
            sa.Column('scheduled_time_slot', sa.String(20), nullable=False),
            sa.Column('recurrence_type', sa.String(20), nullable=True),
            sa.Column('recurrence_end_date', sa.DateTime(), nullable=True),
            sa.Column('recurrence_interval', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(50), nullable=False, server_default='scheduled'),
            sa.Column('special_instructions', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('executed_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['client_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['courier_id'], ['users.id'], )
        )
    # Création d'index idempotente
    index_exists = conn.execute(text("""
        SELECT 1 FROM pg_indexes WHERE tablename = 'scheduled_deliveries' AND indexname = 'ix_scheduled_deliveries_id'
    """)).fetchone()
    if not index_exists:
        safe_create_index(op, 'ix_scheduled_deliveries_id', 'scheduled_deliveries', ['id'], unique=False)
    safe_create_index(op, 'ix_scheduled_deliveries_scheduled_date', 'scheduled_deliveries', ['scheduled_date'], unique=False)
    safe_create_index(op, 'ix_scheduled_deliveries_status', 'scheduled_deliveries', ['status'], unique=False)

    # Create scheduled_delivery_instances table
    safe_create_table(op, 'scheduled_delivery_instances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scheduled_delivery_id', sa.Integer(), nullable=False),
        sa.Column('delivery_id', sa.Integer(), nullable=True),
        sa.Column('instance_date', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('executed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['scheduled_delivery_id'], ['scheduled_deliveries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    safe_create_index(op, 'ix_scheduled_delivery_instances_id', 'scheduled_delivery_instances', ['id'], unique=False)
    safe_create_index(op, 'ix_scheduled_delivery_instances_instance_date', 'scheduled_delivery_instances', ['instance_date'], unique=False)

def downgrade():
    safe_create_table(op, 'scheduled_delivery_instances')
    safe_create_index(op, 'ix_scheduled_delivery_instances_instance_date', 'scheduled_delivery_instances', ['instance_date'])
    safe_create_index(op, 'ix_scheduled_delivery_instances_id', 'scheduled_delivery_instances', ['id'])
    safe_create_index(op, 'ix_scheduled_deliveries_status', 'scheduled_deliveries', ['status'])
    safe_create_index(op, 'ix_scheduled_deliveries_scheduled_date', 'scheduled_deliveries', ['scheduled_date'])
    safe_create_index(op, 'ix_scheduled_deliveries_id', 'scheduled_deliveries', ['id'])
    safe_create_table(op, 'scheduled_deliveries')
