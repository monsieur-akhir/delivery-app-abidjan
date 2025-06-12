#!/bin/bash

# Script de configuration Docker pour Livraison Abidjan
# Ce script permet de configurer et démarrer l'environnement Docker

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs colorés
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Définir le répertoire du projet
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Créer le fichier .env s'il n'existe pas
if [ ! -f ".env" ]; then
    log_warning "Fichier .env manquant. Création d'un fichier .env par défaut..."
    cat > .env << EOF
# Configuration Docker pour Livraison Abidjan
# Environnement de production

# Ports
API_PORT=8000
WS_PORT=8001
WEB_PORT=5173
HTTP_PORT=80
HTTPS_PORT=443
POSTGRES_PORT=5432
REDIS_PORT=6379
KEYCLOAK_PORT=8080

# Base de données
POSTGRES_DB=livraison_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_PASSWORD=redispass

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# API
SECRET_KEY=supersecretkey
DEBUG=false
ENVIRONMENT=production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost
SENTRY_DSN=
STORAGE_TYPE=local
SMS_PROVIDER=console
SMS_API_KEY=
PAYMENT_PROVIDER=cinetpay
PAYMENT_API_KEY=
CORS_ORIGINS=*
MAX_WORKERS=4

# Frontend
API_URL=http://localhost:8000
WS_URL=ws://localhost:8001
MAPS_API_KEY=

# Workers
WORKER_REPLICAS=2

# Build
TAG=latest
BUILD_ENV=production
EOF
    log_success "Fichier .env créé avec succès."
fi

# Créer les répertoires nécessaires
log_info "Création des répertoires nécessaires..."
mkdir -p nginx/ssl nginx/conf.d keycloak/themes keycloak/import

# Générer un certificat SSL auto-signé si nécessaire
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    log_info "Génération d'un certificat SSL auto-signé..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
        -subj "/C=CI/ST=Abidjan/L=Abidjan/O=Livraison Abidjan/CN=localhost"
    log_success "Certificat SSL généré avec succès."
fi

# Créer la configuration Nginx par défaut
if [ ! -f "nginx/conf.d/default.conf" ]; then
    log_info "Création de la configuration Nginx par défaut..."
    cat > nginx/conf.d/default.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name localhost;

    # Redirection vers HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name localhost;

    # Certificats SSL
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Paramètres SSL optimisés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # HSTS (15768000 secondes = 6 mois)
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Frontend
    location / {
        root /usr/share/nginx/html/web;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public";
    }

    # API
    location /api {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        client_max_body_size 100M;
    }

    # WebSockets
    location /ws {
        proxy_pass http://websocket:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Fichiers uploadés
    location /uploads {
        alias /usr/share/nginx/html/uploads;
        expires 7d;
        add_header Cache-Control "public";
    }
}
EOF
    log_success "Configuration Nginx créée avec succès."
fi

# Créer la configuration Nginx globale
if [ ! -f "nginx/nginx.conf" ]; then
    log_info "Création de la configuration Nginx globale..."
    cat > nginx/nginx.conf << EOF
user nginx;
worker_processes auto;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Optimisations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Compression gzip
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Logs
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Inclure les configurations des sites
    include /etc/nginx/conf.d/*.conf;
}
EOF
    log_success "Configuration Nginx globale créée avec succès."
fi

# Créer le script d'entrypoint pour l'API
if [ ! -f "backend/scripts/entrypoint.sh" ]; then
    log_info "Création du script d'entrypoint pour l'API..."
    mkdir -p backend/scripts
    cat > backend/scripts/entrypoint.sh << EOF
#!/bin/bash

# Script de démarrage pour l'API Livraison Abidjan

set -e

# Attendre que la base de données soit prête
echo "Attente de la base de données..."
until python -c "import psycopg2; psycopg2.connect('${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/livraison_db}')" 2>/dev/null; do
  echo "Base de données indisponible - attente..."
  sleep 2
done
echo "Base de données prête !"

# Exécuter les migrations
echo "Exécution des migrations..."
alembic upgrade head

# Démarrer l'application
echo "Démarrage de l'API..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WORKERS:-4} --timeout ${TIMEOUT:-120}
EOF
    chmod +x backend/scripts/entrypoint.sh
    log_success "Script d'entrypoint créé avec succès."
fi

# Menu de configuration
show_menu() {
    echo ""
    echo "====== Configuration Docker Livraison Abidjan ======"
    echo "1) Démarrer tous les services"
    echo "2) Arrêter tous les services"
    echo "3) Reconstruire les images"
    echo "4) Voir les logs"
    echo "5) Vérifier l'état des services"
    echo "6) Exécuter les migrations de base de données"
    echo "7) Charger les données de test"
    echo "8) Exécuter les tests"
    echo "9) Nettoyage complet (attention: supprime les données)"
    echo "0) Quitter"
    echo "=================================================="
    echo ""
}

# Fonction pour démarrer les services
start_services() {
    log_info "Démarrage des services Docker..."
    docker-compose up -d
    log_success "Services démarrés avec succès."
}

# Fonction pour arrêter les services
stop_services() {
    log_info "Arrêt des services Docker..."
    docker-compose down
    log_success "Services arrêtés avec succès."
}

# Fonction pour reconstruire les images
rebuild_images() {
    log_info "Reconstruction des images Docker..."
    docker-compose build --no-cache
    log_success "Images reconstruites avec succès."
}

# Fonction pour afficher les logs
show_logs() {
    echo ""
    echo "====== Logs des services ======"
    echo "1) API"
    echo "2) WebSocket"
    echo "3) Worker"
    echo "4) Web"
    echo "5) Base de données"
    echo "6) Redis"
    echo "7) Keycloak"
    echo "8) Nginx"
    echo "9) Tous les services"
    echo "0) Retour"
    echo "=============================="
    echo ""
    
    read -p "Votre choix : " log_choice
    
    case $log_choice in
        1) docker-compose logs -f api ;;
        2) docker-compose logs -f websocket ;;
        3) docker-compose logs -f worker ;;
        4) docker-compose logs -f web ;;
        5) docker-compose logs -f postgres ;;
        6) docker-compose logs -f redis ;;
        7) docker-compose logs -f keycloak ;;
        8) docker-compose logs -f nginx ;;
        9) docker-compose logs -f ;;
        0) return ;;
        *) log_error "Choix invalide" ;;
    esac
}

# Fonction pour vérifier l'état des services
check_status() {
    log_info "État des services Docker..."
    docker-compose ps
}

# Fonction pour exécuter les migrations
run_migrations() {
    log_info "Exécution des migrations de base de données..."
    docker-compose exec api alembic upgrade head
    log_success "Migrations exécutées avec succès."
}

# Fonction pour charger les données de test
load_test_data() {
    log_info "Chargement des données de test..."
    docker-compose exec api python scripts/seed_data.py
    log_success "Données de test chargées avec succès."
}

# Fonction pour exécuter les tests
run_tests() {
    log_info "Exécution des tests..."
    docker-compose exec api pytest
    log_success "Tests exécutés avec succès."
}

# Fonction pour le nettoyage complet
clean_all() {
    log_warning "Cette opération va supprimer toutes les données. Êtes-vous sûr ? (y/n)"
    read -p "" confirm
    if [ "$confirm" == "y" ]; then
        log_info "Nettoyage complet en cours..."
        docker-compose down -v
        docker system prune -af --volumes
        log_success "Nettoyage terminé avec succès."
    else
        log_info "Opération annulée."
    fi
}

# Boucle principale
while true; do
    show_menu
    read -p "Votre choix : " choice
    
    case $choice in
        1) start_services ;;
        2) stop_services ;;
        3) rebuild_images ;;
        4) show_logs ;;
        5) check_status ;;
        6) run_migrations ;;
        7) load_test_data ;;
        8) run_tests ;;
        9) clean_all ;;
        0) 
            log_info "Au revoir !"
            exit 0
            ;;
        *) log_error "Choix invalide. Veuillez réessayer." ;;
    esac
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
done
