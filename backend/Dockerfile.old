# Dockerfile pour l'API backend de Livraison Abidjan
# Multi-stage build pour optimiser la taille et la sécurité

# Stage 1: Construction
FROM python:3.11-slim AS builder

# Définir des variables de construction
ARG BUILD_ENV=production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Installer les dépendances de construction
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Créer et activer l'environnement virtuel
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copier et installer les dépendances
WORKDIR /app
COPY requirements.txt .
COPY requirements-dev.txt .

# Installer les dépendances selon l'environnement de build
RUN if [ "$BUILD_ENV" = "development" ] ; then \
        pip install -r requirements-dev.txt ; \
    else \
        pip install -r requirements.txt ; \
    fi

# Stage 2: Image finale
FROM python:3.11-slim

# Métadonnées de l'image
LABEL maintainer="Team Livraison Abidjan <tech@livraison-abidjan.com>"
LABEL description="API Backend pour l'application Livraison Abidjan"
LABEL version="1.0"

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    MODULE_NAME="main" \
    VARIABLE_NAME="app" \
    WORKERS=4 \
    TIMEOUT=120

# Créer un utilisateur non-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Installer les dépendances runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier l'environnement virtuel depuis le builder
COPY --from=builder /opt/venv /opt/venv

# Créer les répertoires nécessaires et définir les permissions
RUN mkdir -p /app/uploads /app/logs \
    && chown -R appuser:appuser /app

# Définir le répertoire de travail
WORKDIR /app

# Copier le code source
COPY --chown=appuser:appuser . .

# Ajouter un point de montage pour les uploads et les logs
VOLUME ["/app/uploads", "/app/logs"]

# Exposer le port
EXPOSE $PORT

# Changer l'utilisateur
USER appuser

# Script de démarrage pour les migrations et le lancement
COPY --chown=appuser:appuser ./scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Commande de démarrage
ENTRYPOINT ["/app/entrypoint.sh"]
