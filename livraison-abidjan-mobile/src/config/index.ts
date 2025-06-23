// Configuration de l'API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Configuration de l'environnement
export const ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';

// Configuration des WebSockets
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000';

// Configuration des timeouts
export const API_TIMEOUT = 30000; // 30 secondes
export const WS_TIMEOUT = 5000; // 5 secondes

// Configuration des retry
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 seconde 