-- Script d'initialisation de la base de données
-- Création des bases de données nécessaires

-- Base de données principale
CREATE DATABASE livraison_abidjan;

-- Base de données pour Keycloak
CREATE DATABASE keycloak;

-- Utilisateur pour l'application
CREATE USER livraison_user WITH PASSWORD 'livraison_password';
GRANT ALL PRIVILEGES ON DATABASE livraison_abidjan TO livraison_user;

-- Extensions nécessaires
\c livraison_abidjan;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
