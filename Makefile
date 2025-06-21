# Makefile pour Livraison Abidjan
# Commandes pour le développement et le déploiement

.PHONY: help install start stop clean test build deploy

# Variables
BACKEND_DIR = backend
WEB_DIR = web
MOBILE_DIR = mobile
DOCKER_COMPOSE = docker-compose

# Couleurs pour les messages
BLUE = \033[0;34m
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Affiche l'aide
	@echo "$(BLUE)Livraison Abidjan - Commandes disponibles :$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Installe toutes les dépendances
	@echo "$(BLUE)Installation des dépendances...$(NC)"
	@echo "$(YELLOW)Backend...$(NC)"
	cd $(BACKEND_DIR) && python3 -m venv venv && python3 -m pip install -r requirements.txt
	@echo "$(YELLOW)Web...$(NC)"
	cd $(WEB_DIR) && npm install
	@echo "$(YELLOW)Mobile...$(NC)"
	cd $(MOBILE_DIR) && npm install
	@echo "$(GREEN)✓ Installation terminée$(NC)"

setup: ## Configuration initiale du projet
	@echo "$(BLUE)Configuration initiale...$(NC)"
	@if [ ! -f "$(BACKEND_DIR)/.env" ]; then \
		echo "$(YELLOW)Copie de .env.example vers .env$(NC)"; \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
	fi
	@if [ ! -f "$(WEB_DIR)/.env.local" ]; then \
		echo "$(YELLOW)Création de web/.env.local$(NC)"; \
		echo "VITE_API_URL=http://localhost:8000" > $(WEB_DIR)/.env.local; \
		echo "VITE_WS_URL=ws://localhost:8000/ws" >> $(WEB_DIR)/.env.local; \
		echo "VITE_ENVIRONMENT=development" >> $(WEB_DIR)/.env.local; \
	fi
	@if [ ! -f "$(MOBILE_DIR)/.env" ]; then \
		echo "$(YELLOW)Copie de mobile/.env.development vers mobile/.env$(NC)"; \
		cp $(MOBILE_DIR)/.env.development $(MOBILE_DIR)/.env; \
	fi
	@echo "$(GREEN)✓ Configuration terminée$(NC)"

start-services: ## Démarre les services Docker (DB, Redis, Keycloak)
	@echo "$(BLUE)Démarrage des services Docker...$(NC)"
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d db redis keycloak
	@echo "$(GREEN)✓ Services démarrés$(NC)"

start-backend: start-services ## Démarre le backend
	@echo "$(BLUE)Démarrage du backend...$(NC)"
	cd $(BACKEND_DIR) && source venv/bin/activate && alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

start-web: ## Démarre l'application web
	@echo "$(BLUE)Démarrage de l'application web...$(NC)"
	cd $(WEB_DIR) && npm run dev

start-mobile: ## Démarre l'application mobile
	@echo "$(BLUE)Démarrage de l'application mobile...$(NC)"
	cd $(MOBILE_DIR) && npx expo start

start: start-services ## Démarre tous les services
	@echo "$(BLUE)Démarrage de tous les services...$(NC)"
	@echo "$(YELLOW)Utilisez 'make start-backend', 'make start-web', et 'make start-mobile' dans des terminaux séparés$(NC)"

stop: ## Arrête tous les services
	@echo "$(BLUE)Arrêt des services...$(NC)"
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down
	@pkill -f "uvicorn" || true
	@pkill -f "vite" || true
	@pkill -f "expo" || true
	@echo "$(GREEN)✓ Services arrêtés$(NC)"

clean: ## Nettoie les fichiers temporaires
	@echo "$(BLUE)Nettoyage...$(NC)"
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down -v
	cd $(WEB_DIR) && rm -rf node_modules dist
	cd $(MOBILE_DIR) && rm -rf node_modules .expo
	cd $(BACKEND_DIR) && rm -rf __pycache__ .pytest_cache
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

test-backend: ## Lance les tests backend
	@echo "$(BLUE)Tests backend...$(NC)"
	cd $(BACKEND_DIR) && source venv/bin/activate && python -m pytest

test-web: ## Lance les tests web
	@echo "$(BLUE)Tests web...$(NC)"
	cd $(WEB_DIR) && npm run test

test-mobile: ## Lance les tests mobile
	@echo "$(BLUE)Tests mobile...$(NC)"
	cd $(MOBILE_DIR) && npm test

test: test-backend test-web test-mobile ## Lance tous les tests

build-backend: ## Build l'image Docker backend
	@echo "$(BLUE)Build backend...$(NC)"
	cd $(BACKEND_DIR) && docker build -t livraison-abidjan-backend .

build-web: ## Build l'application web
	@echo "$(BLUE)Build web...$(NC)"
	cd $(WEB_DIR) && npm run build

build-mobile: ## Build l'application mobile
	@echo "$(BLUE)Build mobile...$(NC)"
	cd $(MOBILE_DIR) && npx expo build

build: build-backend build-web build-mobile ## Build toutes les applications

logs-backend: ## Affiche les logs backend
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f api

logs-db: ## Affiche les logs de la base de données
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f db

logs-redis: ## Affiche les logs Redis
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f redis

logs-keycloak: ## Affiche les logs Keycloak
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) logs -f keycloak

migrate: ## Exécute les migrations de base de données
	@echo "$(BLUE)Exécution des migrations...$(NC)"
	cd $(BACKEND_DIR) && source venv/bin/activate && alembic upgrade head
	@echo "$(GREEN)✓ Migrations terminées$(NC)"

seed: ## Charge les données de test
	@echo "$(BLUE)Chargement des données de test...$(NC)"
	cd $(BACKEND_DIR) && source venv/bin/activate && python scripts/seed_data.py
	@echo "$(GREEN)✓ Données chargées$(NC)"

reset-db: ## Remet à zéro la base de données
	@echo "$(BLUE)Remise à zéro de la base de données...$(NC)"
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) down -v
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) up -d db
	@sleep 5
	@make migrate
	@make seed
	@echo "$(GREEN)✓ Base de données réinitialisée$(NC)"

status: ## Affiche le statut des services
	@echo "$(BLUE)Statut des services :$(NC)"
	cd $(BACKEND_DIR) && $(DOCKER_COMPOSE) ps

lint-backend: ## Vérifie le code backend
	@echo "$(BLUE)Vérification du code backend...$(NC)"
	cd $(BACKEND_DIR) && source venv/bin/activate && black . && flake8 .

lint-web: ## Vérifie le code web
	@echo "$(BLUE)Vérification du code web...$(NC)"
	cd $(WEB_DIR) && npm run lint

lint-mobile: ## Vérifie le code mobile
	@echo "$(BLUE)Vérification du code mobile...$(NC)"
	cd $(MOBILE_DIR) && npm run lint

lint: lint-backend lint-web lint-mobile ## Vérifie tout le code

dev: setup install start-services ## Configuration complète pour le développement
	@echo "$(GREEN)✓ Environnement de développement prêt !$(NC)"
	@echo "$(YELLOW)Lancez maintenant :$(NC)"
	@echo "  - $(BLUE)make start-backend$(NC) (dans un terminal)"
	@echo "  - $(BLUE)make start-web$(NC) (dans un autre terminal)"
	@echo "  - $(BLUE)make start-mobile$(NC) (dans un troisième terminal)"