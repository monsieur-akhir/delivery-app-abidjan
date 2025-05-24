# Guide Docker Complet - Livraison Abidjan

Ce guide explique en détail comment configurer, déployer et gérer l'application Livraison Abidjan avec Docker. Il est conçu pour tous les environnements : développement, test, staging et production.

## Table des matières

1. [Prérequis](#prérequis)
2. [Structure du projet Docker](#structure-du-projet-docker)
3. [Configuration rapide](#configuration-rapide)
4. [Architecture des services](#architecture-des-services)
5. [Personnalisation de la configuration](#personnalisation-de-la-configuration)
6. [Démarrage et arrêt des services](#démarrage-et-arrêt-des-services)
7. [Gestion des données](#gestion-des-données)
8. [Mise à jour des services](#mise-à-jour-des-services)
9. [Surveillance et logs](#surveillance-et-logs)
10. [Sécurité](#sécurité)
11. [Déploiement en production](#déploiement-en-production)
12. [Résolution des problèmes](#résolution-des-problèmes)
13. [Annexes](#annexes)

## Prérequis

### Logiciels requis

- **Docker** version 20.10.0 ou supérieure
- **Docker Compose** version 2.0.0 ou supérieure
- **Git** (pour cloner le dépôt)
- Minimum 4 Go de RAM disponible
- 20 Go d'espace disque libre

### Vérification de l'installation

\`\`\`bash
docker --version
docker-compose --version
git --version
\`\`\`

## Structure du projet Docker

Le projet est organisé avec la structure suivante pour Docker :

\`\`\`
livraison-abidjan/
├── docker-compose.yml       # Configuration principale
├── docker-compose.dev.yml   # Configuration de développement
├── .env                     # Variables d'environnement
├── backend/
│   ├── Dockerfile           # Image API
│   ├── Dockerfile.websocket # Image WebSocket
│   └── Dockerfile.worker    # Image Worker
├── web/
│   └── Dockerfile           # Image frontend Vue.js
├── mobile/
│   └── Dockerfile           # Image build Expo (CI/CD)
├── nginx/
│   ├── nginx.conf           # Configuration globale
│   ├── conf.d/              # Configurations des sites
│   └── ssl/                 # Certificats SSL
├── keycloak/
│   ├── themes/              # Thèmes personnalisés
│   └── import/              # Configuration à importer
└── scripts/
    └── docker-setup.sh      # Script de configuration
\`\`\`

## Configuration rapide

### 1. Installation automatique

Le moyen le plus simple de démarrer est d'utiliser notre script de configuration :

\`\`\`bash
# Cloner le dépôt
git clone https://github.com/votre-organisation/livraison-abidjan.git
cd livraison-abidjan

# Rendre le script exécutable
chmod +x scripts/docker-setup.sh

# Lancer la configuration
./scripts/docker-setup.sh
\`\`\`

Le script vous guidera à travers les étapes suivantes :
- Création des fichiers de configuration
- Génération des certificats SSL auto-signés
- Création des répertoires nécessaires
- Options pour démarrer, arrêter et gérer les services

### 2. Configuration manuelle

Si vous préférez configurer manuellement :

\`\`\`bash
# Créer le fichier .env à partir de l'exemple
cp .env.example .env

# Éditer le fichier .env selon vos besoins
nano .env

# Démarrer les services
docker-compose up -d
\`\`\`

## Architecture des services

L'application Livraison Abidjan utilise une architecture microservices avec les composants suivants :

### Infrastructure

- **postgres** : Base de données PostgreSQL
- **redis** : Cache et file de messages
- **keycloak** : Système d'authentification et de gestion des identités

### Backend

- **api** : API principale FastAPI
- **websocket** : Service de WebSockets pour les communications en temps réel
- **worker** : Workers Celery pour le traitement asynchrone

### Frontend

- **web** : Application web Vue.js
- **nginx** : Reverse proxy et serveur de fichiers statiques

### Dépendances entre services

\`\`\`mermaid
graph TD
    client[Client] --> nginx
    nginx --> web
    nginx --> api
    nginx --> websocket
    api --> postgres
    api --> redis
    api --> keycloak
    websocket --> redis
    worker --> postgres
    worker --> redis
    web --> api
    web --> websocket
\`\`\`

## Personnalisation de la configuration

### Variables d'environnement

Toutes les configurations sont contrôlées par des variables d'environnement dans le fichier `.env`. Voici les principales catégories :

#### Ports

\`\`\`
API_PORT=8000
WS_PORT=8001
WEB_PORT=5173
HTTP_PORT=80
HTTPS_PORT=443
POSTGRES_PORT=5432
REDIS_PORT=6379
KEYCLOAK_PORT=8080
\`\`\`

#### Bases de données

\`\`\`
POSTGRES_DB=livraison_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_PASSWORD=redispass
\`\`\`

#### Sécurité

\`\`\`
SECRET_KEY=supersecretkey
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
\`\`\`

#### Environnement

\`\`\`
DEBUG=false
ENVIRONMENT=production
BUILD_ENV=production
TAG=latest
\`\`\`

### Configuration Nginx

Pour personnaliser la configuration Nginx :

1. Modifiez les fichiers dans `nginx/conf.d/`
2. Pour les paramètres globaux, modifiez `nginx/nginx.conf`
3. Les certificats SSL doivent être placés dans `nginx/ssl/`

### Configuration de Keycloak

Pour personnaliser Keycloak :

1. Placez les thèmes personnalisés dans `keycloak/themes/`
2. Les fichiers de configuration à importer dans `keycloak/import/`

## Démarrage et arrêt des services

### Commandes principales

\`\`\`bash
# Démarrer tous les services en arrière-plan
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d api

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (attention : perte de données)
docker-compose down -v

# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f api
\`\`\`

### Ordre de démarrage recommandé

Pour un démarrage manuel par étapes :

\`\`\`bash
# 1. Démarrer d'abord l'infrastructure
docker-compose up -d postgres redis keycloak

# 2. Attendre que l'infrastructure soit prête (30 secondes)
sleep 30

# 3. Démarrer le backend
docker-compose up -d api websocket worker

# 4. Démarrer le frontend
docker-compose up -d web nginx
\`\`\`

## Gestion des données

### Volumes Docker

Les données sont persistées dans des volumes Docker :

- **postgres_data** : Données PostgreSQL
- **redis_data** : Données Redis
- **keycloak_data** : Configuration Keycloak
- **api_uploads** : Fichiers uploadés
- **api_logs** : Logs de l'API
- **nginx_logs** : Logs Nginx

### Sauvegarde des données

\`\`\`bash
# Sauvegarde de la base de données
docker-compose exec -T postgres pg_dump -U postgres livraison_db > backup_$(date +%Y%m%d).sql

# Sauvegarde des volumes
docker run --rm -v livraison_postgres_data:/source -v $(pwd)/backups:/backup alpine tar -czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /source .
\`\`\`

### Restauration des données

\`\`\`bash
# Restauration de la base de données
cat backup_20230101.sql | docker-compose exec -T postgres psql -U postgres livraison_db

# Restauration d'un volume
docker run --rm -v livraison_postgres_data:/target -v $(pwd)/backups:/backup alpine sh -c "rm -rf /target/* && tar -xzf /backup/postgres_data_20230101.tar.gz -C /target"
\`\`\`

## Mise à jour des services

### Mettre à jour les images

\`\`\`bash
# Reconstruire toutes les images
docker-compose build --no-cache

# Reconstruire une image spécifique
docker-compose build --no-cache api

# Mettre à jour avec les nouvelles images
docker-compose up -d --force-recreate
\`\`\`

### Mise à jour sans temps d'arrêt

Pour une mise à jour sans interruption de service :

\`\`\`bash
# 1. Mettre à jour l'API avec des instances multiples
docker-compose up -d --scale api=2 --no-recreate api

# 2. Reconstruire l'image
docker-compose build api

# 3. Redémarrer avec la nouvelle image
docker-compose up -d --force-recreate api
\`\`\`

## Surveillance et logs

### Accès aux logs

\`\`\`bash
# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f api

# Logs avec un nombre limité de lignes
docker-compose logs --tail=100 api
\`\`\`

### Surveillance des ressources

\`\`\`bash
# Voir l'utilisation des ressources
docker stats $(docker-compose ps -q)
\`\`\`

### Healthchecks

Tous les services principaux ont des healthchecks configurés. Pour vérifier leur état :

\`\`\`bash
docker ps --format "table {{.Names}}\t{{.Status}}"
\`\`\`

## Sécurité

### Meilleures pratiques

1. **Changez toutes les valeurs par défaut** dans le fichier `.env`
2. **Utilisez des mots de passe forts** pour PostgreSQL, Redis et Keycloak
3. **Configurez des certificats SSL valides** pour la production
4. **Limitez l'accès réseau** aux conteneurs qui n'ont pas besoin d'être exposés

### Mise à jour des certificats SSL

Pour utiliser des certificats Let's Encrypt en production :

\`\`\`bash
# Copiez les certificats dans le répertoire nginx/ssl
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem nginx/ssl/key.pem

# Redémarrez Nginx
docker-compose restart nginx
\`\`\`

## Déploiement en production

### Préparation

1. Utilisez une machine avec au moins 4 Go de RAM et 2 CPU
2. Installez Docker et Docker Compose
3. Configurez un nom de domaine avec des enregistrements DNS
4. Obtenez des certificats SSL valides (Let's Encrypt)

### Configuration

\`\`\`bash
# Copiez le fichier .env.production
cp .env.production .env

# Modifiez les variables pour la production
nano .env
\`\`\`

Modifications importantes pour la production :
- Changez tous les mots de passe
- Définissez `DEBUG=false` et `ENVIRONMENT=production`
- Configurez `ALLOWED_ORIGINS` avec votre domaine
- Activez Sentry avec `SENTRY_DSN`

### Déploiement

\`\`\`bash
# Construire les images pour la production
docker-compose build

# Démarrer les services
docker-compose up -d
\`\`\`

### Mise à l'échelle

Pour gérer plus de trafic :

\`\`\`bash
# Augmenter le nombre de workers
docker-compose up -d --scale worker=4

# Configurer plus de workers API
# Modifiez MAX_WORKERS dans .env
\`\`\`

## Résolution des problèmes

### Problèmes courants

#### Les conteneurs redémarrent en boucle

Vérifiez les logs pour identifier le problème :
\`\`\`bash
docker-compose logs -f api
\`\`\`

#### Problèmes de connexion à la base de données

Vérifiez que PostgreSQL est en cours d'exécution et accessible :
\`\`\`bash
docker-compose ps postgres
docker-compose exec api python -c "import psycopg2; psycopg2.connect('postgresql://postgres:postgres@postgres:5432/livraison_db')"
\`\`\`

#### Problèmes d'espace disque

Nettoyez les ressources Docker inutilisées :
\`\`\`bash
docker system prune -af --volumes
\`\`\`

#### Problèmes de mémoire

Vérifiez l'utilisation de la mémoire et augmentez les limites si nécessaire :
\`\`\`bash
docker stats
\`\`\`

### Comment obtenir de l'aide

1. Consultez les logs pour identifier le problème
2. Vérifiez la documentation dans le répertoire `docs/`
3. Ouvrez une issue sur le dépôt GitHub
4. Contactez l'équipe de support à support@livraison-abidjan.com

## Annexes

### Exemples de configurations supplémentaires

#### Configuration pour un serveur de production haute disponibilité

\`\`\`yaml
version: '3.8'

services:
  api:
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '2'
          memory: 4G
      restart_policy:
        condition: any
        max_attempts: 3
        window: 120s
      update_config:
        parallelism: 2
        delay: 10s
        order: start-first

  worker:
    deploy:
      replicas: 6
      resources:
        limits:
          cpus: '2'
          memory: 4G
\`\`\`

#### Configuration pour un cluster PostgreSQL avec réplication

\`\`\`yaml
version: '3.8'

services:
  postgres_master:
    image: postgres:15
    environment:
      POSTGRES_DB: livraison_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_MULTIPLE_DATABASES: keycloak
    volumes:
      - postgres_master_data:/var/lib/postgresql/data
    networks:
      - livraison_network
    command: postgres -c wal_level=replica -c max_wal_senders=5 -c max_replication_slots=5

  postgres_replica:
    image: postgres:15
    environment:
      POSTGRES_DB: livraison_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_MASTER_HOST: postgres_master
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    networks:
      - livraison_network
    depends_on:
      - postgres_master
    command: sh -c "until pg_isready -h postgres_master -p 5432; do sleep 1; done; pg_basebackup -h postgres_master -D /var/lib/postgresql/data -U postgres -P -v -R -X stream -C -S replica_1"
\`\`\`

### Script de déploiement automatisé

\`\`\`bash
#!/bin/bash
# deploy.sh - Script de déploiement automatisé

set -e

# Variables
REPO_URL="git@github.com:votre-organisation/livraison-abidjan.git"
DEPLOY_DIR="/opt/livraison-abidjan"
BACKUP_DIR="/opt/backups"

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
echo "Sauvegarde de la base de données..."
docker-compose exec -T postgres pg_dump -U postgres livraison_db > $BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Mise à jour du code
echo "Mise à jour du code..."
if [ -d "$DEPLOY_DIR" ]; then
  cd $DEPLOY_DIR
  git pull
else
  git clone $REPO_URL $DEPLOY_DIR
  cd $DEPLOY_DIR
fi

# Mise à jour des images
echo "Mise à jour des images Docker..."
docker-compose build

# Mise à jour des services sans temps d'arrêt
echo "Mise à jour des services..."
docker-compose up -d --no-deps --force-recreate api
docker-compose up -d --no-deps --force-recreate websocket
docker-compose up -d --no-deps --force-recreate worker
docker-compose up -d --no-deps --force-recreate web
docker-compose up -d --force-recreate nginx

echo "Déploiement terminé avec succès!"
\`\`\`

---

## Support

Pour toute question ou assistance supplémentaire, contactez l'équipe technique :

- **Email** : support@livraison-abidjan.com
- **Téléphone** : +225 XX XX XX XX
- **GitHub** : https://github.com/votre-organisation/livraison-abidjan
