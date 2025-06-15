const config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  DEBUG: __DEV__,
  VERSION: '1.0.0',
}

export const API_URL = config.API_URL
export const WS_URL = config.WS_URL
export const getApiUrl = () => config.API_URL
export const getWsUrl = () => config.WS_URL

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

const validateConfig = () => {
  const requiredVars = ['API_URL', 'WS_URL'];
  const missing = requiredVars.filter(key => !config[key as keyof typeof config]);

  if (missing.length > 0) {
    console.warn(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }
};

validateConfig();

export { config }
export default config