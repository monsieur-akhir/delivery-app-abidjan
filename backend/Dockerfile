# Base image Python
FROM python:3.12-slim

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances système + Python
RUN apt-get update && \
    apt-get install -y gcc libpq-dev && \
    pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get purge -y --auto-remove gcc && \
    rm -rf /var/lib/apt/lists/*

# Copier tout le projet
COPY . .

# Définir le port exposé
EXPOSE 8000

# Commande de lancement
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
