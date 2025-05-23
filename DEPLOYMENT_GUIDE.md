# Guide de Déploiement Local - Livraison Abidjan

## 📋 Prérequis

### Logiciels requis
- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Node.js** (version 18+)
- **Python** (version 3.11+)
- **Git**

### Vérification des prérequis
\`\`\`bash
docker --version
docker-compose --version
node --version
python3 --version
git --version
\`\`\`

## 🚀 Installation Rapide

### 1. Cloner le projet
\`\`\`bash
git clone <repository-url>
cd livraison-abidjan
\`\`\`

### 2. Configuration automatique
\`\`\`bash
# Rendre le script exécutable
chmod +x start-local.sh

# Lancer la configuration
./start-local.sh
\`\`\`

### 3. Ou utiliser Make
\`\`\`bash
# Configuration complète
make dev

# Démarrer les services (dans des terminaux séparés)
make start-backend
make start-web
make start-mobile
\`\`\`

## 🔧 Configuration Manuelle

### 1. Configuration Backend

\`\`\`bash
cd backend

# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Copier la configuration
cp .env.example .env

# Démarrer les services Docker
docker-compose up -d db redis keycloak

# Attendre le démarrage des services (30 secondes)
sleep 30

# Exécuter les migrations
alembic upgrade head

# Charger les données de test
python scripts/seed_data.py

# Démarrer l'API
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

### 2. Configuration Web

\`\`\`bash
cd web

# Installer les dépendances
npm install

# Créer la configuration
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_ENVIRONMENT=development
EOF

# Démarrer l'application
npm run dev
\`\`\`

### 3. Configuration Mobile

\`\`\`bash
cd mobile

# Installer les dépendances
npm install

# Copier la configuration
cp .env.development .env

# Démarrer Expo
npx expo start
\`\`\`

## 🌐 URLs d'accès

- **API Backend**: http://localhost:8000
- **Documentation API**: http://localhost:8000/docs
- **Application Web**: http://localhost:5173
- **Application Mobile**: Scanner le QR code Expo
- **Base de données**: localhost:5432
- **Redis**: localhost:6379
- **Keycloak**: http://localhost:8080

## 👥 Comptes de test

### Administrateur
- **Email**: admin@livraison-abidjan.com
- **Mot de passe**: admin123

### Client
- **Téléphone**: +225 01 02 03 04 05
- **Mot de passe**: client123

### Coursier
- **Téléphone**: +225 05 04 03 02 01
- **Mot de passe**: courier123

### Entreprise
- **Email**: business@example.com
- **Mot de passe**: business123

## 🛠️ Commandes Utiles

### Gestion des services
\`\`\`bash
# Voir le statut
make status

# Arrêter tous les services
make stop

# Nettoyer complètement
make clean

# Redémarrer la base de données
make reset-db
\`\`\`

### Développement
\`\`\`bash
# Tests
make test

# Vérification du code
make lint

# Logs
make logs-backend
make logs-db
make logs-redis
\`\`\`

### Base de données
\`\`\`bash
# Migrations
make migrate

# Données de test
make seed

# Connexion à la DB
docker exec -it livraison_postgres psql -U postgres -d livraison_abidjan
\`\`\`

## 🐛 Dépannage

### Problèmes courants

#### Port déjà utilisé
\`\`\`bash
# Vérifier les ports utilisés
netstat -tulpn | grep :8000
netstat -tulpn | grep :5173

# Arrêter les processus
sudo kill -9 <PID>
\`\`\`

#### Problèmes Docker
\`\`\`bash
# Nettoyer Docker
docker system prune -a

# Reconstruire les images
docker-compose build --no-cache
\`\`\`

#### Problèmes de permissions
\`\`\`bash
# Donner les permissions
chmod +x start-local.sh
chmod +x backend/scripts/start-dev.sh
\`\`\`

#### Base de données corrompue
\`\`\`bash
# Réinitialiser complètement
make clean
make dev
\`\`\`

### Logs de débogage

\`\`\`bash
# Logs API
docker-compose -f backend/docker-compose.yml logs -f api

# Logs base de données
docker-compose -f backend/docker-compose.yml logs -f db

# Logs application
tail -f backend/logs/app.log
\`\`\`

## 📱 Configuration Mobile Avancée

### Android
\`\`\`bash
# Installer Android Studio
# Configurer les variables d'environnement
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Démarrer l'émulateur
npx expo run:android
\`\`\`

### iOS (macOS uniquement)
\`\`\`bash
# Installer Xcode
# Installer les outils de ligne de commande
xcode-select --install

# Démarrer le simulateur
npx expo run:ios
\`\`\`

## 🔒 Configuration de Sécurité

### Variables d'environnement sensibles
\`\`\`bash
# Backend
SECRET_KEY=your-super-secret-key-here
CINETPAY_API_KEY=your-cinetpay-key
TWILIO_AUTH_TOKEN=your-twilio-token

# Mobile
GOOGLE_MAPS_API_KEY=your-google-maps-key
SENTRY_DSN=your-sentry-dsn
\`\`\`

### Certificats SSL (pour HTTPS local)
\`\`\`bash
# Générer des certificats auto-signés
openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes
\`\`\`

## 📊 Monitoring

### Métriques disponibles
- **API**: http://localhost:8000/metrics
- **Santé**: http://localhost:8000/health
- **Base de données**: Connexions, requêtes lentes
- **Redis**: Utilisation mémoire, hit rate

### Logs structurés
\`\`\`bash
# Format JSON pour les logs
tail -f backend/logs/app.log | jq '.'
\`\`\`

## 🚀 Déploiement en Production

Voir le fichier `PRODUCTION_DEPLOYMENT.md` pour les instructions de déploiement en production.

## 📞 Support

En cas de problème :
1. Vérifier les logs
2. Consulter la documentation
3. Ouvrir une issue sur GitHub
4. Contacter l'équipe de développement

---

**Bonne utilisation de Livraison Abidjan ! 🚚📱**
