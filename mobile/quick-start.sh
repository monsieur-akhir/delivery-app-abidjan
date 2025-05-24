#!/bin/bash

echo "⚡ Démarrage Rapide - Livraison Abidjan"
echo "======================================"

# Vérifications rapides
echo "🔍 Vérification de l'environnement..."

# Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js requis. Installez depuis https://nodejs.org/"
    exit 1
fi

# Expo CLI
if ! command -v expo &> /dev/null; then
    echo "📦 Installation d'Expo CLI..."
    npm install -g @expo/cli
fi

# Installation des dépendances
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Configuration .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Configurez vos variables dans .env avant de continuer"
    echo "📝 Éditez le fichier .env avec vos clés d'API"
    read -p "Appuyez sur Entrée quand c'est fait..."
fi

echo ""
echo "🚀 Démarrage de l'application..."
echo "📱 Scannez le QR code avec Expo Go sur votre téléphone"
echo ""

expo start
