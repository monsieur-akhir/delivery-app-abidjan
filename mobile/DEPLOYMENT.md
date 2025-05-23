# Guide de Déploiement de l'Application Mobile

Ce document décrit les procédures de déploiement de l'application mobile pour les différents environnements.

## Prérequis

- Node.js 18 ou supérieur
- Yarn
- Compte Expo (pour EAS)
- Expo CLI et EAS CLI installés globalement
- Accès aux comptes développeur Apple et Google Play

## Configuration des Environnements

L'application prend en charge trois environnements :

1. **Development** : Pour le développement local
2. **Staging** : Pour les tests avant production
3. **Production** : Pour la version finale destinée aux utilisateurs

Chaque environnement a son propre fichier de configuration :

- `.env.development`
- `.env.staging`
- `.env.production`

## Secrets et Variables d'Environnement

Les secrets sont gérés de manière sécurisée et ne sont jamais inclus dans le code source. Pour configurer les secrets :

1. Pour le développement local, créez un fichier `.env.local` basé sur `.env.development`
2. Pour les environnements CI/CD, les secrets sont stockés dans les variables d'environnement GitHub Actions

### Secrets Requis

- `API_URL` : URL de l'API backend
- `SOCKET_URL` : URL du serveur WebSocket
- `SENTRY_DSN` : DSN pour la surveillance Sentry (staging et production uniquement)
- `GOOGLE_MAPS_API_KEY` : Clé API Google Maps
- `CINETPAY_API_KEY` : Clé API CinetPay
- `CINETPAY_SITE_ID` : ID du site CinetPay
- `WEATHER_API_KEY` : Clé API pour les services météo
- `OPENAI_API_KEY` : Clé API OpenAI pour l'assistant vocal

## Déploiement Manuel

### Développement Local

Pour exécuter l'application en mode développement :

\`\`\`bash
# Installer les dépendances
yarn install

# Démarrer l'application
yarn start
\`\`\`

### Déploiement sur les Appareils de Test

Pour déployer sur des appareils de test :

\`\`\`bash
# Construire pour le développement
yarn build:development

# OU utiliser EAS
eas build --profile development --platform all
\`\`\`

### Déploiement en Staging

Pour déployer en environnement de staging :

\`\`\`bash
# Utiliser le script de déploiement
./scripts/deploy.sh staging

# OU manuellement
eas build --profile staging --platform all
eas update --branch staging --message "Update staging"
\`\`\`

### Déploiement en Production

Pour déployer en production :

\`\`\`bash
# Utiliser le script de déploiement
./scripts/deploy.sh production

# OU manuellement
eas build --profile production --platform all
eas submit --platform all --profile production
eas update --branch production --message "Release v1.x.x"
\`\`\`

## Déploiement Automatisé (CI/CD)

Le déploiement automatisé est configuré via GitHub Actions :

1. Les pull requests déclenchent des tests automatiques
2. Les push sur la branche `develop` déclenchent un déploiement en staging
3. Les push sur la branche `main` déclenchent un déploiement en production

### Workflow CI/CD

Le workflow CI/CD comprend les étapes suivantes :

1. **Test** : Exécution des tests unitaires et d'intégration
2. **Build** : Construction des applications Android et iOS
3. **Deploy** : Déploiement des mises à jour OTA et soumission aux app stores (production uniquement)

## Mises à Jour Over-the-Air (OTA)

Les mises à jour OTA permettent de déployer des modifications sans passer par les app stores :

\`\`\`bash
# Déployer une mise à jour OTA
eas update --branch [environment] --message "Description de la mise à jour"
\`\`\`

## Résolution des Problèmes

### Problèmes Courants

1. **Erreur de construction EAS** : Vérifiez les journaux EAS et assurez-vous que tous les secrets sont correctement configurés
2. **Échec des tests** : Exécutez les tests localement pour identifier le problème
3. **Problèmes de soumission aux app stores** : Vérifiez les informations d'identification et les métadonnées de l'application

### Support

Pour toute assistance supplémentaire, contactez l'équipe DevOps à devops@livraison-abidjan.com
