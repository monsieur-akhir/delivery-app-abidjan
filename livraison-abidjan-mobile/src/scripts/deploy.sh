#!/bin/bash

# Script de déploiement pour l'application mobile
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

# Vérifier les arguments
if [ $# -eq 0 ]; then
  echo "Usage: ./deploy.sh [environment]"
  echo "Environments: development, staging, production"
  exit 1
fi

# Définir l'environnement
ENVIRONMENT=$1

# Vérifier que l'environnement est valide
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo "Invalid environment: $ENVIRONMENT"
  echo "Valid environments: development, staging, production"
  exit 1
fi

# Aller dans le répertoire mobile
cd "$(dirname "$0")/.." || exit

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  yarn install
fi

# Copier le fichier .env approprié
echo "Setting up environment variables for $ENVIRONMENT..."
cp ".env.$ENVIRONMENT" .env

# Exécuter les tests
echo "Running tests..."
yarn test

# Vérifier si les tests ont réussi
if [ $? -ne 0 ]; then
  echo "Tests failed. Aborting deployment."
  exit 1
fi

# Construire l'application
echo "Building app for $ENVIRONMENT..."
eas build --platform all --profile "$ENVIRONMENT" --non-interactive

# Vérifier si la construction a réussi
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

# Déployer les mises à jour OTA
echo "Deploying OTA updates..."
eas update --branch "$ENVIRONMENT" --message "Update $(date +%Y-%m-%d_%H-%M-%S)"

# Si c'est la production, soumettre aux app stores
if [ "$ENVIRONMENT" = "production" ]; then
  echo "Submitting to app stores..."
  eas submit --platform all --profile production --non-interactive
fi

echo "Deployment completed successfully!"
