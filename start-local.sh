#!/bin/bash

# Script de démarrage pour l'environnement de développement local
# Livraison Abidjan - Configuration complète

set -e

echo "🚀 Démarrage de l'environnement de développement Livraison Abidjan"
echo "=================================================================="

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

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer les fichiers .env s'ils n'existent pas
log_info "Vérification des fichiers de configuration..."

if [ ! -f "backend/.env" ]; then
    log_warning "Fichier backend/.env manquant. Copie depuis .env.example..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "web/.env.local" ]; then
    log_warning "Fichier web/.env.local manquant. Création..."
    cat > web/.env.local << EOF
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_ENVIRONMENT=development
EOF
fi

if [ ! -f "mobile/.env" ]; then
    log_warning "Fichier mobile/.env manquant. Copie depuis .env.development..."
    cp mobile/.env.development mobile/.env
fi

# Fonction pour démarrer les services backend
start_backend() {
    log_info "Démarrage des services backend (PostgreSQL, Redis, Keycloak)..."
    cd backend
    docker-compose up -d db redis keycloak

    log_info "Attente du démarrage des services..."
    sleep 10

    log_info "Installation des dépendances Python..."
    # The below line has been modified to address deployment compatibility
    cd backend && python3 -m pip install -r requirements.txt

    log_info "Exécution des migrations de base de données..."
    alembic upgrade head

    log_info "Création des données de test..."
    python scripts/seed_data.py

    log_info "Démarrage de l'API FastAPI..."
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

    cd ..
    log_success "Backend démarré sur http://localhost:8000"
}

# Fonction pour démarrer l'application web
start_web() {
    log_info "Démarrage de l'application web Vue.js..."
    cd web

    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances npm..."
        npm install
    fi

    log_info "Démarrage du serveur de développement..."
    npm run dev &

    cd ..
    log_success "Application web démarrée sur http://localhost:5173"
}

# Fonction pour démarrer l'application mobile
start_mobile() {
    log_info "Préparation de l'application mobile Expo..."
    cd mobile

    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances npm..."
        npm install
    fi

    log_info "Démarrage d'Expo..."
    npx expo start &

    cd ..
    log_success "Application mobile démarrée. Scannez le QR code avec Expo Go."
}

# Menu principal
show_menu() {
    echo ""
    echo "Que souhaitez-vous démarrer ?"
    echo "1) Tout démarrer (Backend + Web + Mobile)"
    echo "2) Backend seulement"
    echo "3) Web seulement"
    echo "4) Mobile seulement"
    echo "5) Backend + Web"
    echo "6) Arrêter tous les services"
    echo "7) Voir les logs"
    echo "8) Quitter"
    echo ""
}

# Fonction pour arrêter les services
stop_services() {
    log_info "Arrêt de tous les services..."

    # Arrêter les processus Node.js et Python
    pkill -f "uvicorn" || true
    pkill -f "vite" || true
    pkill -f "expo" || true

    # Arrêter les conteneurs Docker
    cd backend
    docker-compose down
    cd ..

    log_success "Tous les services ont été arrêtés."
}

# Fonction pour afficher les logs
show_logs() {
    echo ""
    echo "Logs disponibles :"
    echo "1) Logs Backend (API)"
    echo "2) Logs Base de données"
    echo "3) Logs Redis"
    echo "4) Logs Keycloak"
    echo "5) Retour au menu principal"
    echo ""

    read -p "Votre choix : " log_choice

    case $log_choice in
        1)
            cd backend && docker-compose logs -f api
            ;;
        2)
            cd backend && docker-compose logs -f db
            ;;
        3)
            cd backend && docker-compose logs -f redis
            ;;
        4)
            cd backend && docker-compose logs -f keycloak
            ;;
        5)
            return
            ;;
        *)
            log_error "Choix invalide"
            ;;
    esac
}

# Boucle principale
while true; do
    show_menu
    read -p "Votre choix : " choice

    case $choice in
        1)
            start_backend
            start_web
            start_mobile
            ;;
        2)
            start_backend
            ;;
        3)
            start_web
            ;;
        4)
            start_mobile
            ;;
        5)
            start_backend
            start_web
            ;;
        6)
            stop_services
            ;;
        7)
            show_logs
            ;;
        8)
            log_info "Au revoir !"
            exit 0
            ;;
        *)
            log_error "Choix invalide. Veuillez réessayer."
            ;;
    esac

    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
done