# Variables d'Environnement - Documentation

## 📋 Vue d'ensemble

Ce document liste toutes les variables d'environnement nécessaires pour faire fonctionner l'application de livraison.

## 🚀 Configuration rapide

1. Copiez le fichier `.env.example` vers `.env` dans chaque dossier du projet
2. Remplissez les valeurs selon votre environnement
3. Redémarrez les services

## 📁 Structure des fichiers .env

```
delivery-app-abidjan/
├── .env.example                    # Variables globales
├── backend/
│   ├── .env.example               # Variables backend
│   └── .env                       # Variables backend (local)
├── livraison-abidjan-mobile/
│   ├── .env.example               # Variables mobile
│   └── .env                       # Variables mobile (local)
├── mobile/
│   ├── .env.example               # Variables mobile (ancien)
│   └── .env                       # Variables mobile (local)
└── web/
    ├── .env.example               # Variables web
    └── .env                       # Variables web (local)
```

## 🔧 Variables par composant

### Backend (Python/FastAPI)

```bash
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/delivery_db
DATABASE_TEST_URL=postgresql://user:password@localhost:5432/delivery_test_db

# Sécurité
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key
WEATHER_API_KEY=your-weather-api-key

# Services externes
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret
PAYMENT_API_KEY=your-payment-api-key
PAYMENT_API_SECRET=your-payment-api-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password

# Redis
REDIS_URL=redis://localhost:6379
```

### Mobile (React Native/Expo)

```bash
# API Configuration
API_BASE_URL=http://localhost:8000
API_TIMEOUT=30000

# Google Services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key

# Push Notifications
EXPO_PUSH_TOKEN=your-expo-push-token
FIREBASE_SERVER_KEY=your-firebase-server-key

# Analytics
SENTRY_DSN=your-sentry-dsn
MIXPANEL_TOKEN=your-mixpanel-token
```

### Web (Vue.js)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Google Services
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_GOOGLE_PLACES_API_KEY=your-google-places-api-key

# Analytics
VITE_GA_TRACKING_ID=your-ga-tracking-id
VITE_SENTRY_DSN=your-sentry-dsn
```

## 🌍 Environnements

### Development
```bash
NODE_ENV=development
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG
```

### Staging
```bash
NODE_ENV=staging
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=INFO
```

### Production
```bash
NODE_ENV=production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARN
```

## 🔐 Sécurité

### Variables sensibles à ne jamais commiter :
- `SECRET_KEY`
- `DATABASE_URL` (avec mots de passe)
- `API_KEYS`
- `SMTP_PASSWORD`
- `PAYMENT_API_SECRET`

### Variables publiques (peuvent être commitées) :
- `NODE_ENV`
- `DEBUG`
- `LOG_LEVEL`
- URLs publiques

## 🚨 Important

1. **Ne jamais commiter** les fichiers `.env` contenant des vraies valeurs
2. **Toujours commiter** les fichiers `.env.example` comme documentation
3. **Utiliser des secrets** pour les variables sensibles en production
4. **Valider** les variables d'environnement au démarrage de l'application

## 🔍 Vérification

Pour vérifier que toutes les variables sont définies :

```bash
# Backend
python -c "from app.core.config import settings; print('Backend config OK')"

# Mobile
npx expo start --clear

# Web
npm run dev
```

## 📞 Support

En cas de problème avec les variables d'environnement :
1. Vérifiez que tous les fichiers `.env` sont présents
2. Vérifiez que les valeurs sont correctes
3. Redémarrez les services
4. Consultez les logs d'erreur 