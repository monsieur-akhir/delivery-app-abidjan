# Livraison Abidjan - Backend API

API backend pour l'application de livraison à Abidjan, développée avec FastAPI, PostgreSQL et Redis.

## Fonctionnalités

- Gestion des utilisateurs (clients, coursiers, entreprises, gestionnaires)
- Système d'enchères pour les livraisons
- Tracking en temps réel des coursiers
- Gamification avec points et récompenses
- Notation bilatérale
- Portefeuille communautaire
- Marché intégré
- Analyse des embouteillages
- Prévisions météo
- Et bien plus...

## Prérequis

- Python 3.9+
- PostgreSQL 13+
- Redis 6+
- Keycloak (optionnel pour l'authentification avancée)

## Installation

1. Cloner le dépôt :
\`\`\`bash
git clone https://github.com/votre-organisation/livraison-abidjan.git
cd livraison-abidjan/backend
\`\`\`

2. Créer un environnement virtuel :
\`\`\`bash
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\Scripts\activate
\`\`\`

3. Installer les dépendances :
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Configurer les variables d'environnement :
\`\`\`bash
cp .env.example .env
# Modifier les valeurs dans le fichier .env
\`\`\`

5. Créer la base de données PostgreSQL :
\`\`\`bash
createdb livraison_abidjan
\`\`\`

6. Exécuter les migrations :
\`\`\`bash
alembic upgrade head
\`\`\`

7. Démarrer le serveur :
\`\`\`bash
python run.py
\`\`\`

## Structure du projet

\`\`\`
backend/
├── alembic/              # Migrations de base de données
├── app/                  # Code source principal
│   ├── api/              # Routes API
│   ├── core/             # Configuration et dépendances
│   ├── db/               # Configuration de la base de données
│   ├── models/           # Modèles SQLAlchemy
│   ├── schemas/          # Schémas Pydantic
│   ├── services/         # Services métier
│   ├── websockets/       # Endpoints WebSocket
│   └── main.py           # Point d'entrée de l'application
├── migrations/           # Scripts de migration
├── scripts/              # Scripts utilitaires
├── tests/                # Tests unitaires et d'intégration
├── uploads/              # Fichiers téléchargés
├── .env.example          # Exemple de fichier de configuration
├── requirements.txt      # Dépendances Python
├── run.py                # Script de démarrage
└── README.md             # Documentation
\`\`\`

## API Documentation

La documentation de l'API est disponible aux endpoints suivants :

- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

## Déploiement

### Docker

1. Construire l'image Docker :
\`\`\`bash
docker build -t livraison-abidjan-backend .
\`\`\`

2. Exécuter le conteneur :
\`\`\`bash
docker run -p 8000:8000 --env-file .env livraison-abidjan-backend
\`\`\`

### Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

## Tests

Exécuter les tests unitaires :
\`\`\`bash
pytest
\`\`\`

## Licence

Ce projet est sous licence [MIT](LICENSE).
\`\`\`

## Fichier requirements.txt

```plaintext file="backend/requirements.txt"
# FastAPI et dépendances
fastapi==0.103.1
uvicorn==0.23.2
pydantic==2.3.0
pydantic-settings==2.0.3
email-validator==2.0.0.post2
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Base de données
sqlalchemy==2.0.20
alembic==1.12.0
psycopg2-binary==2.9.7
redis==4.6.0

# Gestion des fichiers
aiofiles==23.2.1
boto3==1.28.40

# HTTP et WebSockets
httpx==0.24.1
websockets==11.0.3
requests==2.31.0

# Utilitaires
python-dotenv==1.0.0
tenacity==8.2.3
jinja2==3.1.2
pillow==10.0.0
pytz==2023.3

# Tests
pytest==7.4.0
pytest-asyncio==0.21.1
