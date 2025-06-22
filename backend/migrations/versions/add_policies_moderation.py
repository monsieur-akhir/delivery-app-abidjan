
"""add policies and moderation

Revision ID: 4d5e6f7g8h9i
Revises: 3c4d5e6f7g8h
Create Date: 2024-01-20 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4d5e6f7g8h9i'
down_revision = '3c4d5e6f7g8h'
branch_labels = None
depends_on = None

def upgrade():
    # Create policies table
    op.create_table('policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('config', postgresql.JSON(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('effective_date', sa.DateTime(), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_policies_id'), 'policies', ['id'], unique=False)
    op.create_index(op.f('ix_policies_category'), 'policies', ['category'], unique=False)
    op.create_index(op.f('ix_policies_status'), 'policies', ['status'], unique=False)

    # Create policy_history table
    op.create_table('policy_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('policy_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('config', postgresql.JSON(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('changed_by_id', sa.Integer(), nullable=False),
        sa.Column('change_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['policy_id'], ['policies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_policy_history_id'), 'policy_history', ['id'], unique=False)

    # Create moderation_rules table
    op.create_table('moderation_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rule_type', sa.String(100), nullable=False),
        sa.Column('conditions', postgresql.JSON(), nullable=False),
        sa.Column('actions', postgresql.JSON(), nullable=False),
        sa.Column('severity_level', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_moderation_rules_id'), 'moderation_rules', ['id'], unique=False)
    op.create_index(op.f('ix_moderation_rules_rule_type'), 'moderation_rules', ['rule_type'], unique=False)

    # Create moderation_actions table
    op.create_table('moderation_actions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.Integer(), nullable=False),
        sa.Column('target_user_id', sa.Integer(), nullable=False),
        sa.Column('target_content_id', sa.Integer(), nullable=True),
        sa.Column('target_content_type', sa.String(100), nullable=True),
        sa.Column('action_type', sa.String(100), nullable=False),
        sa.Column('action_data', postgresql.JSON(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('performed_by_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['rule_id'], ['moderation_rules.id'], ),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['performed_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_moderation_actions_id'), 'moderation_actions', ['id'], unique=False)
    op.create_index(op.f('ix_moderation_actions_target_user_id'), 'moderation_actions', ['target_user_id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_moderation_actions_target_user_id'), table_name='moderation_actions')
    op.drop_index(op.f('ix_moderation_actions_id'), table_name='moderation_actions')
    op.drop_table('moderation_actions')
    op.drop_index(op.f('ix_moderation_rules_rule_type'), table_name='moderation_rules')
    op.drop_index(op.f('ix_moderation_rules_id'), table_name='moderation_rules')
    op.drop_table('moderation_rules')
    op.drop_index(op.f('ix_policy_history_id'), table_name='policy_history')
    op.drop_table('policy_history')
    op.drop_index(op.f('ix_policies_status'), table_name='policies')
    op.drop_index(op.f('ix_policies_category'), table_name='policies')
    op.drop_index(op.f('ix_policies_id'), table_name='policies')
    op.drop_table('policies')
