# 🚀 Guide de Démarrage Expo - Livraison Abidjan

## 📋 Prérequis

### 1. Installation de Node.js
\`\`\`bash
# Téléchargez et installez Node.js depuis https://nodejs.org/
# Version recommandée : 18.x ou supérieure
node --version
npm --version
\`\`\`

### 2. Installation d'Expo CLI
\`\`\`bash
npm install -g @expo/cli
\`\`\`

### 3. Installation de l'application Expo Go
- **Android** : [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS** : [App Store](https://apps.apple.com/app/expo-go/id982107779)

## 🛠️ Configuration du Projet

### 1. Cloner et configurer
\`\`\`bash
# Naviguer vers le dossier mobile
cd mobile

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
\`\`\`

### 2. Configurer les variables d'environnement
Éditez le fichier `.env` avec vos clés d'API :

\`\`\`env
API_URL=http://votre-ip-locale:8000
GOOGLE_MAPS_API_KEY_ANDROID=votre_clé_android
GOOGLE_MAPS_API_KEY_IOS=votre_clé_ios
\`\`\`

## 🚀 Démarrage de l'Application

### Méthode 1 : Script automatique
\`\`\`bash
chmod +x start-expo.sh
./start-expo.sh
\`\`\`

### Méthode 2 : Commandes manuelles

#### Démarrage normal
\`\`\`bash
expo start
\`\`\`

#### Avec tunnel (réseaux restrictifs)
\`\`\`bash
expo start --tunnel
\`\`\`

#### Directement sur émulateur
\`\`\`bash
# Android
expo start --android

# iOS
expo start --ios

# Web
expo start --web
\`\`\`

## 📱 Connexion de votre Appareil

### 1. Même réseau WiFi
- Assurez-vous que votre téléphone et ordinateur sont sur le même réseau
- Scannez le QR code avec Expo Go

### 2. Réseau différent/restrictif
\`\`\`bash
expo start --tunnel
\`\`\`

### 3. Émulateurs

#### Android Studio
\`\`\`bash
# Installer Android Studio
# Créer un AVD (Android Virtual Device)
# Démarrer l'émulateur
expo start --android
\`\`\`

#### Xcode (macOS uniquement)
\`\`\`bash
# Installer Xcode depuis l'App Store
# Ouvrir le simulateur iOS
expo start --ios
\`\`\`

## 🔧 Commandes Utiles

### Développement
\`\`\`bash
# Nettoyer le cache
expo r -c

# Vérifier la configuration
expo doctor

# Voir les logs détaillés
expo start --dev-client

# Mode debug
expo start --dev-client --clear
\`\`\`

### Build et Déploiement
\`\`\`bash
# Build pour Android
eas build --platform android

# Build pour iOS
eas build --platform ios

# Build pour les deux plateformes
eas build --platform all
\`\`\`

### Tests
\`\`\`bash
# Lancer les tests
npm test

# Tests en mode watch
npm run test:watch

# Vérification TypeScript
npm run type-check

# Linting
npm run lint
npm run lint:fix
\`\`\`

## 🐛 Résolution de Problèmes

### Problème : Metro bundler ne démarre pas
\`\`\`bash
expo r -c
expo start
\`\`\`

### Problème : Erreur de réseau
\`\`\`bash
# Utiliser le tunnel
expo start --tunnel

# Ou changer l'URL dans .env
API_URL=http://votre-ip-publique:8000
\`\`\`

### Problème : Erreur de dépendances
\`\`\`bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Ou utiliser yarn
yarn install
\`\`\`

### Problème : Erreur de permissions
\`\`\`bash
# Sur macOS/Linux
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.expo
\`\`\`

## 📊 Monitoring et Debug

### 1. Expo DevTools
- Ouvrez http://localhost:19002 dans votre navigateur
- Accédez aux logs, performances, et outils de debug

### 2. React Native Debugger
\`\`\`bash
# Installer React Native Debugger
# Activer le debug dans l'app (secouer l'appareil)
# Sélectionner "Debug with Chrome"
\`\`\`

### 3. Flipper (optionnel)
\`\`\`bash
# Installer Flipper depuis https://fbflipper.com/
# Configurer pour React Native
\`\`\`

## 🚀 Déploiement

### 1. Build de développement
\`\`\`bash
eas build --profile development --platform android
\`\`\`

### 2. Build de production
\`\`\`bash
eas build --profile production --platform all
\`\`\`

### 3. Publication sur les stores
\`\`\`bash
# Google Play Store
eas submit --platform android

# Apple App Store
eas submit --platform ios
\`\`\`

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console Expo
2. Consultez la documentation Expo : https://docs.expo.dev/
3. Vérifiez les issues GitHub du projet
4. Contactez l'équipe de développement

## 🎯 Fonctionnalités Testables

Une fois l'app démarrée, vous pouvez tester :

- ✅ Authentification (inscription/connexion)
- ✅ Création de livraisons
- ✅ Navigation entre les écrans
- ✅ Géolocalisation (avec permissions)
- ✅ Notifications push
- ✅ Mode hors ligne
- ✅ Assistant vocal
- ✅ Paiements (mode test)

Bon développement ! 🚀
