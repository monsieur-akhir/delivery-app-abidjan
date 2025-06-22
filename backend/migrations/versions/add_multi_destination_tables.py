
"""add multi destination tables

Revision ID: 1a2b3c4d5e6f
Revises: add_otp_to_deliveries
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = 'add_otp_to_deliveries'
branch_labels = None
depends_on = None

def upgrade():
    # Create multi_destination_deliveries table
    op.create_table('multi_destination_deliveries',
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
    op.create_index(op.f('ix_multi_destination_deliveries_id'), 'multi_destination_deliveries', ['id'], unique=False)
    op.create_index(op.f('ix_multi_destination_deliveries_status'), 'multi_destination_deliveries', ['status'], unique=False)

    # Create delivery_destinations table
    op.create_table('delivery_destinations',
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
    op.create_index(op.f('ix_delivery_destinations_id'), 'delivery_destinations', ['id'], unique=False)
    op.create_index(op.f('ix_delivery_destinations_status'), 'delivery_destinations', ['status'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_delivery_destinations_status'), table_name='delivery_destinations')
    op.drop_index(op.f('ix_delivery_destinations_id'), table_name='delivery_destinations')
    op.drop_table('delivery_destinations')
    op.drop_index(op.f('ix_multi_destination_deliveries_status'), table_name='multi_destination_deliveries')
    op.drop_index(op.f('ix_multi_destination_deliveries_id'), table_name='multi_destination_deliveries')
    op.drop_table('multi_destination_deliveries')
