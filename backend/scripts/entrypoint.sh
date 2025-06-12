#!/bin/bash

# Script de démarrage pour l'API Livraison Abidjan

set -e

# Attendre que la base de données soit prête
echo "Attente de la base de données..."
until python -c "import psycopg2; psycopg2.connect('postgresql://postgres:postgres@postgres:5432/livraison_db')" 2>/dev/null; do
  echo "Base de données indisponible - attente..."
  sleep 2
done
echo "Base de données prête !"

# Exécuter les migrations
echo "Exécution des migrations..."
alembic upgrade head

# Démarrer l'application
echo "Démarrage de l'API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --timeout 120
