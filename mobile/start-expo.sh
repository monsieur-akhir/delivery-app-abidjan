#!/bin/bash

echo "🚀 Démarrage de l'application Livraison Abidjan"
echo "=============================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

# Vérifier si Expo CLI est installé
if ! command -v expo &> /dev/null; then
    echo "📦 Installation d'Expo CLI..."
    npm install -g @expo/cli
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier les variables d'environnement
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env manquant. Copie du fichier d'exemple..."
    cp .env.example .env
    echo "✏️  Veuillez configurer vos variables d'environnement dans .env"
fi

echo ""
echo "🎯 Options de démarrage :"
echo "1. Démarrage normal (QR Code)"
echo "2. Démarrage avec tunnel (pour réseaux restrictifs)"
echo "3. Émulateur Android"
echo "4. Simulateur iOS"
echo "5. Version Web"
echo ""

read -p "Choisissez une option (1-5): " choice

case $choice in
    1)
        echo "🚀 Démarrage normal..."
        expo start
        ;;
    2)
        echo "🌐 Démarrage avec tunnel..."
        expo start --tunnel
        ;;
    3)
        echo "🤖 Démarrage sur Android..."
        expo start --android
        ;;
    4)
        echo "🍎 Démarrage sur iOS..."
        expo start --ios
        ;;
    5)
        echo "🌐 Démarrage version Web..."
        expo start --web
        ;;
    *)
        echo "❌ Option invalide. Démarrage normal..."
        expo start
        ;;
esac
