# Dockerfile pour le build Expo de l'application mobile Livraison Abidjan
# Ce fichier est utilisé pour générer les binaires EAS en environnement CI/CD

FROM node:18-alpine

# Métadonnées de l'image
LABEL maintainer="Team Livraison Abidjan <tech@livraison-abidjan.com>"
LABEL description="Build environment for Livraison Abidjan mobile app"
LABEL version="1.0"

# Variables d'environnement
ENV EXPO_TOKEN=$EXPO_TOKEN \
    GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY \
    SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    SENTRY_DSN=$SENTRY_DSN \
    NODE_ENV=production

# Installer les dépendances globales
RUN npm install -g eas-cli expo-cli

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci --quiet

# Copier le reste du code source
COPY . .

# Commande par défaut - peut être remplacée lors de l'exécution
CMD ["npx", "eas-cli", "build", "--platform", "all", "--non-interactive"]
