// Configuration pour le développement
export const DEV_CONFIG = {
  // Activer les mocks pour éviter les erreurs 404
  ENABLE_MOCKS: true,
  
  // URLs de base pour les différents environnements
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Timeout pour les requêtes API
  API_TIMEOUT: 10000,
  
  // Retry configuration
  API_RETRY_ATTEMPTS: 3,
  API_RETRY_DELAY: 1000,
  
  // Mock data configuration
  MOCK_DELAY: 500, // Délai simulé pour les mocks
  
  // Feature flags
  FEATURES: {
    WEATHER_ENABLED: true,
    PRICE_ESTIMATION_ENABLED: true,
    VEHICLE_RECOMMENDATION_ENABLED: true,
    REAL_TIME_TRACKING_ENABLED: false, // Désactivé en dev
  },
  
  // Logging
  LOG_LEVEL: 'debug',
  LOG_API_CALLS: true,
  LOG_ERRORS: true,
  
  // Debug options
  DEBUG: {
    SHOW_DEV_MENU: true,
    SHOW_PERFORMANCE_MONITOR: false,
    SHOW_NETWORK_LOGS: true,
  }
}

// Fonction utilitaire pour simuler un délai
export const mockDelay = (ms: number = DEV_CONFIG.MOCK_DELAY) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Fonction pour vérifier si on est en mode développement
export const isDevelopment = () => {
  return __DEV__ || process.env.NODE_ENV === 'development'
}

// Fonction pour obtenir la configuration selon l'environnement
export const getConfig = () => {
  if (isDevelopment()) {
    return DEV_CONFIG
  }
  
  // Configuration de production
  return {
    ...DEV_CONFIG,
    ENABLE_MOCKS: false,
    LOG_LEVEL: 'error',
    LOG_API_CALLS: false,
    DEBUG: {
      SHOW_DEV_MENU: false,
      SHOW_PERFORMANCE_MONITOR: false,
      SHOW_NETWORK_LOGS: false,
    }
  }
} 