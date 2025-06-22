"""add_gamification_tables

Revision ID: 5b4ad1ee1534
Revises: 2888a65bd591
Create Date: 2024-03-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5b4ad1ee1534'
down_revision: Union[str, None] = '2888a65bd591'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter la colonne cashback_earned à la table deliveries si elle n'existe pas
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'deliveries' 
                AND column_name = 'cashback_earned'
            ) THEN
                ALTER TABLE deliveries ADD COLUMN cashback_earned FLOAT DEFAULT 0.0;
            END IF;
        END $$;
    """)

    # Créer les types ENUM s'ils n'existent pas
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievementtype') THEN
                CREATE TYPE achievementtype AS ENUM ('delivery', 'rating', 'special', 'milestone');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badgetype') THEN
                CREATE TYPE badgetype AS ENUM ('delivery', 'rating', 'special', 'milestone');
            END IF;
        END $$;
    """)

    # Créer les tables si elles n'existent pas
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
                CREATE TABLE achievements (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    type achievementtype NOT NULL,
                    icon_url VARCHAR,
                    points_reward INTEGER,
                    requirement_value INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
                CREATE INDEX ix_achievements_id ON achievements (id);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
                CREATE TABLE badges (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    type badgetype NOT NULL,
                    icon_url VARCHAR,
                    points_required INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
                CREATE INDEX ix_badges_id ON badges (id);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
                CREATE TABLE user_achievements (
                    id SERIAL PRIMARY KEY,
                    courier_points_id INTEGER REFERENCES courier_points(id),
                    achievement_id INTEGER REFERENCES achievements(id),
                    progress INTEGER,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
                CREATE INDEX ix_user_achievements_id ON user_achievements (id);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
                CREATE TABLE user_badges (
                    id SERIAL PRIMARY KEY,
                    courier_points_id INTEGER REFERENCES courier_points(id),
                    badge_id INTEGER REFERENCES badges(id),
                    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
                CREATE INDEX ix_user_badges_id ON user_badges (id);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Supprimer les tables dans l'ordre inverse de leur création
    op.execute("DROP TABLE IF EXISTS user_badges CASCADE;")
    op.execute("DROP TABLE IF EXISTS user_achievements CASCADE;")
    op.execute("DROP TABLE IF EXISTS badges CASCADE;")
    op.execute("DROP TABLE IF EXISTS achievements CASCADE;")
    
    # Supprimer les types ENUM
    op.execute("DROP TYPE IF EXISTS badgetype CASCADE;")
    op.execute("DROP TYPE IF EXISTS achievementtype CASCADE;")
    
    # Supprimer la colonne cashback_earned
    op.execute("ALTER TABLE deliveries DROP COLUMN IF EXISTS cashback_earned;")
