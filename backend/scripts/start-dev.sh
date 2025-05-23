#!/bin/bash

# Script de démarrage pour le développement
set -e

echo "🚀 Démarrage de l'API en mode développement..."

# Activer l'environnement virtuel
source venv/bin/activate

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
while ! pg_isready -h postgres -p 5432 -U postgres; do
  sleep 1
done

echo "✅ Base de données prête"

# Exécuter les migrations
echo "🔄 Exécution des migrations..."
alembic upgrade head

# Charger les données de test si nécessaire
if [ "$LOAD_SAMPLE_DATA" = "true" ]; then
  echo "📊 Chargement des données de test..."
  python scripts/seed_data.py
fi

# Démarrer l'API
echo "🎯 Démarrage de l'API FastAPI..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
