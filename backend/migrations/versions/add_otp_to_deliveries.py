
"""add_otp_to_deliveries

Revision ID: otp_delivery_001
Revises: a06659c5694e
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'otp_delivery_001'
down_revision = 'a06659c5694e'
branch_labels = None
depends_on = None


def upgrade():
    # Add OTP fields to deliveries table
    op.add_column('deliveries', sa.Column('requires_otp', sa.Boolean(), default=False))
    op.add_column('deliveries', sa.Column('otp_code', sa.String(6), nullable=True))
    op.add_column('deliveries', sa.Column('otp_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('deliveries', sa.Column('otp_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('deliveries', sa.Column('otp_attempts', sa.Integer(), default=0))
    op.add_column('deliveries', sa.Column('otp_validation_type', sa.Enum('sms', 'whatsapp', 'signature', 'photo', name='otpvalidationtype'), nullable=True))
    op.add_column('deliveries', sa.Column('fallback_validation_data', sa.JSON(), nullable=True))


def downgrade():
    # Remove OTP fields from deliveries table
    op.drop_column('deliveries', 'fallback_validation_data')
    op.drop_column('deliveries', 'otp_validation_type')
    op.drop_column('deliveries', 'otp_attempts')
    op.drop_column('deliveries', 'otp_verified_at')
    op.drop_column('deliveries', 'otp_sent_at')
    op.drop_column('deliveries', 'otp_code')
    op.drop_column('deliveries', 'requires_otp')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS otpvalidationtype')
