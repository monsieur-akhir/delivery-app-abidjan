import Constants from 'expo-constants';

// Configuration des variables d'environnement pour Expo SDK 48
export const config = {
  API_URL: Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  WS_URL: Constants.expoConfig?.extra?.wsUrl || process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  WEATHER_API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY || '',
  CINETPAY_API_KEY: process.env.EXPO_PUBLIC_CINETPAY_API_KEY || '',
  CINETPAY_SITE_ID: process.env.EXPO_PUBLIC_CINETPAY_SITE_ID || '',
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  ENVIRONMENT: Constants.expoConfig?.extra?.environment || process.env.NODE_ENV || 'development',
};

// Types pour TypeScript
export interface Environment {
  API_URL: string;
  WS_URL: string;
  GOOGLE_MAPS_API_KEY: string;
  WEATHER_API_KEY: string;
  CINETPAY_API_KEY: string;
  CINETPAY_SITE_ID: string;
  OPENAI_API_KEY: string;
  SENTRY_DSN: string;
  ENVIRONMENT: string;
}

// Validation des variables requises
const validateConfig = () => {
  const requiredVars = ['API_URL', 'WS_URL'];
  const missing = requiredVars.filter(key => !config[key as keyof typeof config]);

  if (missing.length > 0) {
    console.warn(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }
};

// Exécuter la validation
validateConfig();

export default config;