"""enhance deliveries fields

Revision ID: 6f7g8h9i0j1k
Revises: 5e6f7g8h9i0j
Create Date: 2024-01-20 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from migrations.alembic_utils import safe_add_column

# revision identifiers, used by Alembic.
revision = '6f7g8h9i0j1k'
down_revision = '5e6f7g8h9i0j'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing fields to deliveries table
    try:
        safe_add_column(op, 'deliveries', sa.Column('recipient_name', sa.String(255), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('recipient_phone', sa.String(20), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('package_value', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('package_weight', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('package_dimensions', sa.String(100), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('delivery_latitude', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('delivery_longitude', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('pickup_latitude', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('pickup_longitude', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('distance_km', sa.Float(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('estimated_duration_minutes', sa.Integer(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('actual_duration_minutes', sa.Integer(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('priority_level', sa.String(20), nullable=False, server_default='normal'))
        safe_add_column(op, 'deliveries', sa.Column('delivery_type', sa.String(50), nullable=False, server_default='standard'))
        safe_add_column(op, 'deliveries', sa.Column('payment_status', sa.String(50), nullable=False, server_default='pending'))
        safe_add_column(op, 'deliveries', sa.Column('proof_of_delivery', sa.Text(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('delivery_notes', sa.Text(), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('tracking_number', sa.String(100), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('is_fragile', sa.Boolean(), nullable=False, server_default='false'))
        safe_add_column(op, 'deliveries', sa.Column('requires_signature', sa.Boolean(), nullable=False, server_default='false'))
        safe_add_column(op, 'deliveries', sa.Column('weather_conditions', sa.String(100), nullable=True))
        safe_add_column(op, 'deliveries', sa.Column('traffic_conditions', sa.String(100), nullable=True))
    except Exception as e:
        print(f"Some columns might already exist: {e}")

    # Create delivery_tracking table
    try:
        op.create_table('delivery_tracking',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('delivery_id', sa.Integer(), nullable=False),
            sa.Column('latitude', sa.Float(), nullable=False),
            sa.Column('longitude', sa.Float(), nullable=False),
            sa.Column('accuracy', sa.Float(), nullable=True),
            sa.Column('speed', sa.Float(), nullable=True),
            sa.Column('heading', sa.Float(), nullable=True),
            sa.Column('altitude', sa.Float(), nullable=True),
            sa.Column('battery_level', sa.Integer(), nullable=True),
            sa.Column('is_moving', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_delivery_tracking_id'), 'delivery_tracking', ['id'], unique=False)
        op.create_index(op.f('ix_delivery_tracking_delivery_id'), 'delivery_tracking', ['delivery_id'], unique=False)
    except Exception:
        pass

    # Create delivery_photos table
    try:
        op.create_table('delivery_photos',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('delivery_id', sa.Integer(), nullable=False),
            sa.Column('photo_type', sa.String(50), nullable=False),
            sa.Column('photo_url', sa.String(500), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('taken_by_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['delivery_id'], ['deliveries.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['taken_by_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_delivery_photos_id'), 'delivery_photos', ['id'], unique=False)
    except Exception:
        pass

def downgrade():
    try:
        op.drop_index(op.f('ix_delivery_photos_id'), table_name='delivery_photos')
        op.drop_table('delivery_photos')
    except Exception:
        pass
    
    try:
        op.drop_index(op.f('ix_delivery_tracking_delivery_id'), table_name='delivery_tracking')
        op.drop_index(op.f('ix_delivery_tracking_id'), table_name='delivery_tracking')
        op.drop_table('delivery_tracking')
    except Exception:
        pass
    
    try:
        op.drop_column('deliveries', 'traffic_conditions')
        op.drop_column('deliveries', 'weather_conditions')
        op.drop_column('deliveries', 'requires_signature')
        op.drop_column('deliveries', 'is_fragile')
        op.drop_column('deliveries', 'tracking_number')
        op.drop_column('deliveries', 'delivery_notes')
        op.drop_column('deliveries', 'proof_of_delivery')
        op.drop_column('deliveries', 'payment_status')
        op.drop_column('deliveries', 'delivery_type')
        op.drop_column('deliveries', 'priority_level')
        op.drop_column('deliveries', 'actual_duration_minutes')
        op.drop_column('deliveries', 'estimated_duration_minutes')
        op.drop_column('deliveries', 'distance_km')
        op.drop_column('deliveries', 'pickup_longitude')
        op.drop_column('deliveries', 'pickup_latitude')
        op.drop_column('deliveries', 'delivery_longitude')
        op.drop_column('deliveries', 'delivery_latitude')
        op.drop_column('deliveries', 'package_dimensions')
        op.drop_column('deliveries', 'package_weight')
        op.drop_column('deliveries', 'package_value')
        op.drop_column('deliveries', 'recipient_phone')
        op.drop_column('deliveries', 'recipient_name')
    except Exception:
        pass
