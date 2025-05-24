# Dockerfile pour l'application web Vue.js de Livraison Abidjan
# Multi-stage build pour optimiser la taille et la sécurité

# Stage 1: Construction (build) de l'application
FROM node:18-alpine AS builder

# Arguments de build pour les variables d'environnement
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_ENV
ARG VITE_SENTRY_DSN
ARG VITE_MAPS_API_KEY

# Variables d'environnement pour la construction
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_ENV=$VITE_ENV \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_MAPS_API_KEY=$VITE_MAPS_API_KEY \
    NODE_ENV=production

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances avec le cache npm
RUN npm ci --quiet

# Copier le code source
COPY . .

# Construire l'application pour la production
RUN npm run build

# Stage 2: Image finale Nginx
FROM nginx:alpine

# Métadonnées de l'image
LABEL maintainer="Team Livraison Abidjan <tech@livraison-abidjan.com>"
LABEL description="Application Web pour Livraison Abidjan"
LABEL version="1.0"

# Copier la configuration Nginx personnalisée
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers de build depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration pour le routing SPA
RUN echo "location / { try_files \$uri \$uri/ /index.html; }" > /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Vérification de la santé de Nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

# La commande par défaut pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
