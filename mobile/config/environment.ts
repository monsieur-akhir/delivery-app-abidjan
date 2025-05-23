// Importer les variables d'environnement
import Constants from "expo-constants"

// Définir les environnements disponibles
type Environment = "development" | "staging" | "production"

// Obtenir l'environnement actuel
const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.extra?.EXPO_RELEASE_CHANNEL || "development"

  if (releaseChannel.indexOf("prod") !== -1) return "production"
  if (releaseChannel.indexOf("staging") !== -1) return "staging"
  return "development"
}

// Configuration par environnement
const ENV = {
  development: {
    API_URL: "https://dev-api.livraison-abidjan.com/v1",
    WEBSOCKET_URL: "wss://dev-api.livraison-abidjan.com/ws",
    MAPS_API_KEY: "AIzaSyDev123456789",
    SENTRY_DSN: "",
    ENABLE_LOGS: true,
  },
  staging: {
    API_URL: "https://staging-api.livraison-abidjan.com/v1",
    WEBSOCKET_URL: "wss://staging-api.livraison-abidjan.com/ws",
    MAPS_API_KEY: "AIzaSyStaging123456789",
    SENTRY_DSN: "https://staging123456789@o123456.ingest.sentry.io/123456",
    ENABLE_LOGS: true,
  },
  production: {
    API_URL: "https://api.livraison-abidjan.com/v1",
    WEBSOCKET_URL: "wss://api.livraison-abidjan.com/ws",
    MAPS_API_KEY: "AIzaSyProd123456789",
    SENTRY_DSN: "https://prod123456789@o123456.ingest.sentry.io/123456",
    ENABLE_LOGS: false,
  },
}

// Environnement actuel
const currentEnv = getEnvironment()

// Exporter les variables d'environnement
export const API_URL = ENV[currentEnv].API_URL
export const WEBSOCKET_URL = ENV[currentEnv].WEBSOCKET_URL
export const MAPS_API_KEY = ENV[currentEnv].MAPS_API_KEY
export const SENTRY_DSN = ENV[currentEnv].SENTRY_DSN
export const ENABLE_LOGS = ENV[currentEnv].ENABLE_LOGS
export const ENVIRONMENT = currentEnv

// Fonction pour logger uniquement en développement et staging
export const devLog = (...args: any[]): void => {
  if (ENABLE_LOGS) {
    console.log(`[${currentEnv.toUpperCase()}]`, ...args)
  }
}
