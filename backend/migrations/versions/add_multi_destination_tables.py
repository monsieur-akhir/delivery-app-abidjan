"""add multi destination tables

Revision ID: 1a2b3c4d5e6f
Revises: otp_delivery_001
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect
from migrations.alembic_utils import safe_create_table, safe_create_index, safe_add_column

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = 'otp_delivery_001'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    if 'multi_destination_deliveries' not in tables:
        safe_create_table(op, 'multi_destination_deliveries',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('client_id', sa.Integer(), nullable=False),
            sa.Column('courier_id', sa.Integer(), nullable=True),
            sa.Column('pickup_address', sa.String(500), nullable=False),
            sa.Column('pickup_commune', sa.String(100), nullable=False),
            sa.Column('pickup_latitude', sa.Float(), nullable=True),
            sa.Column('pickup_longitude', sa.Float(), nullable=True),
            sa.Column('total_amount', sa.Float(), nullable=False),
            sa.Column('total_distance', sa.Float(), nullable=True),
            sa.Column('estimated_duration', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
            sa.Column('special_instructions', sa.Text(), nullable=True),
            sa.Column('payment_method', sa.String(50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['client_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['courier_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        safe_create_index(op, 'multi_destination_deliveries_id_idx', 'multi_destination_deliveries', ['id'], unique=False)
        safe_create_index(op, 'multi_destination_deliveries_status_idx', 'multi_destination_deliveries', ['status'], unique=False)

    # Create delivery_destinations table
    safe_create_table(op, 'delivery_destinations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('multi_delivery_id', sa.Integer(), nullable=False),
        sa.Column('recipient_name', sa.String(255), nullable=False),
        sa.Column('recipient_phone', sa.String(20), nullable=False),
        sa.Column('delivery_address', sa.String(500), nullable=False),
        sa.Column('delivery_commune', sa.String(100), nullable=False),
        sa.Column('delivery_latitude', sa.Float(), nullable=True),
        sa.Column('delivery_longitude', sa.Float(), nullable=True),
        sa.Column('package_description', sa.Text(), nullable=True),
        sa.Column('package_value', sa.Float(), nullable=True),
        sa.Column('delivery_fee', sa.Float(), nullable=False),
        sa.Column('order_sequence', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('delivery_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['multi_delivery_id'], ['multi_destination_deliveries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    safe_create_index(op, 'delivery_destinations_id_idx', 'delivery_destinations', ['id'], unique=False)
    safe_create_index(op, 'delivery_destinations_status_idx', 'delivery_destinations', ['status'], unique=False)

def downgrade():
    safe_create_table(op, 'delivery_destinations')
    safe_create_index(op, 'delivery_destinations_status_idx', 'delivery_destinations', ['status'])
    safe_create_index(op, 'delivery_destinations_id_idx', 'delivery_destinations', ['id'])
    safe_create_table(op, 'multi_destination_deliveries')
    safe_create_index(op, 'multi_destination_deliveries_status_idx', 'multi_destination_deliveries', ['status'])
    safe_create_index(op, 'multi_destination_deliveries_id_idx', 'multi_destination_deliveries', ['id'])
