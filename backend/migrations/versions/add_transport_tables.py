"""Add transport tables

Revision ID: add_transport_tables
Revises: initial_migration
Create Date: 2023-11-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_transport_tables'
down_revision = 'initial_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Créer les types enum
    op.execute("CREATE TYPE vehicletype AS ENUM ('scooter', 'bicycle', 'motorcycle', 'van', 'pickup', 'kia_truck', 'moving_truck', 'custom')")
    op.execute("CREATE TYPE vehiclestatus AS ENUM ('active', 'maintenance', 'inactive', 'pending_verification')")
    op.execute("CREATE TYPE cargocategory AS ENUM ('documents', 'small_packages', 'medium_packages', 'large_packages', 'fragile', 'food', 'electronics', 'furniture', 'appliances', 'construction', 'custom')")
    
    # Créer la table vehicles
    op.create_table(
        'vehicles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('scooter', 'bicycle', 'motorcycle', 'van', 'pickup', 'kia_truck', 'moving_truck', 'custom', name='vehicletype'), nullable=False),
        sa.Column('custom_type', sa.String(), nullable=True),
        sa.Column('license_plate', sa.String(), nullable=False),
        sa.Column('brand', sa.String(), nullable=True),
        sa.Column('model', sa.String(), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('color', sa.String(), nullable=True),
        sa.Column('max_weight', sa.Float(), nullable=True),
        sa.Column('max_volume', sa.Float(), nullable=True),
        sa.Column('max_distance', sa.Float(), nullable=True),
        sa.Column('photo_url', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('active', 'maintenance', 'inactive', 'pending_verification', name='vehiclestatus'), nullable=False, server_default='pending_verification'),
        sa.Column('is_electric', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('registration_document_url', sa.String(), nullable=True),
        sa.Column('insurance_document_url', sa.String(), nullable=True),
        sa.Column('technical_inspection_url', sa.String(), nullable=True),
        sa.Column('technical_inspection_expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('insurance_expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_id'], ['business_profiles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_vehicles_id'), 'vehicles', ['id'], unique=False)
    
    # Créer la table courier_vehicles
    op.create_table(
        'courier_vehicles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('courier_id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['courier_id'], ['courier_profiles.id'], ),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_courier_vehicles_id'), 'courier_vehicles', ['id'], unique=False)
    
    # Créer la table transport_rules
    op.create_table(
        'transport_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=True),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('cargo_category', sa.Enum('documents', 'small_packages', 'medium_packages', 'large_packages', 'fragile', 'food', 'electronics', 'furniture', 'appliances', 'construction', 'custom', name='cargocategory'), nullable=False),
        sa.Column('custom_category', sa.String(), nullable=True),
        sa.Column('min_distance', sa.Float(), nullable=True),
        sa.Column('max_distance', sa.Float(), nullable=True),
        sa.Column('min_weight', sa.Float(), nullable=True),
        sa.Column('max_weight', sa.Float(), nullable=True),
        sa.Column('min_volume', sa.Float(), nullable=True),
        sa.Column('max_volume', sa.Float(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('price_multiplier', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_id'], ['business_profiles.id'], ),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_transport_rules_id'), 'transport_rules', ['id'], unique=False)
    
    # Créer la table vehicle_maintenance_records
    op.create_table(
        'vehicle_maintenance_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), nullable=False),
        sa.Column('maintenance_type', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('performed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('performed_by', sa.String(), nullable=True),
        sa.Column('next_maintenance_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_vehicle_maintenance_records_id'), 'vehicle_maintenance_records', ['id'], unique=False)
    
    # Ajouter des colonnes à la table deliveries
    op.add_column('deliveries', sa.Column('cargo_category', sa.String(), nullable=True))
    op.add_column('deliveries', sa.Column('required_vehicle_type', sa.Enum('scooter', 'bicycle', 'motorcycle', 'van', 'pickup', 'kia_truck', 'moving_truck', 'custom', name='vehicletype'), nullable=True))
    op.add_column('deliveries', sa.Column('vehicle_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'deliveries', 'vehicles', ['vehicle_id'], ['id'])
    
    # Mettre à jour la table courier_profiles pour utiliser le nouvel enum
    op.execute("ALTER TABLE courier_profiles ALTER COLUMN vehicle_type TYPE vehicletype USING vehicle_type::text::vehicletype")


def downgrade() -> None:
    # Supprimer les contraintes de clé étrangère
    op.drop_constraint(None, 'deliveries', type_='foreignkey')
    
    # Supprimer les colonnes ajoutées à la table deliveries
    op.drop_column('deliveries', 'vehicle_id')
    op.drop_column('deliveries', 'required_vehicle_type')
    op.drop_column('deliveries', 'cargo_category')
    
    # Supprimer les tables
    op.drop_table('vehicle_maintenance_records')
    op.drop_table('transport_rules')
    op.drop_table('courier_vehicles')
    op.drop_table('vehicles')
    
    # Supprimer les types enum
    op.execute("DROP TYPE IF EXISTS cargocategory")
    op.execute("DROP TYPE IF EXISTS vehiclestatus")
    op.execute("DROP TYPE IF EXISTS vehicletype")
