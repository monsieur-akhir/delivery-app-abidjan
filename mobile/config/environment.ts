// Configuration des environnements

// Déclaration de la variable __DEV__
declare const __DEV__: boolean | undefined;
const isDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : false

// URL de base de l'API
export const API_URL = isDev
  ? "http://localhost:8000" // URL de développement local
  : "https://api.livraison-abidjan.com" // URL de production

// URL pour WebSocket
export const WS_URL = isDev
  ? "ws://localhost:8001/ws" // WebSocket URL for development
  : "wss://api.livraison-abidjan.com/ws" // WebSocket URL for production

// Clés d'API
export const GOOGLE_MAPS_API_KEY = "AIzaSyBVwFk8UNhKmn2yQ7KLrJzQ5YKlJZMZvHg" // Remplacez par votre vraie clé
export const WEATHER_API_KEY = "0123456789abcdef0123456789abcdef" // Remplacez par votre vraie clé

// Configuration Sentry
export const SENTRY_DSN = isDev ? "" : "YOUR_SENTRY_DSN"
export const ENVIRONMENT = isDev ? "development" : "production"

// Configuration des timeouts
export const API_TIMEOUT = 30000 // 30 secondes

// Configuration des notifications
export const NOTIFICATION_CHANNEL_ID = "livraison-abidjan-notifications"
export const NOTIFICATION_CHANNEL_NAME = "Notifications Livraison Abidjan"

// Configuration du cache
export const CACHE_TTL = 3600 // 1 heure en secondes

// Paramètres de l'application
export const APP_SETTINGS = {
  defaultLanguage: "fr",
  supportedLanguages: ["fr", "en"],
  defaultTheme: "light",
  defaultCurrency: "XOF",
  defaultDistanceUnit: "km",
  minPasswordLength: 8,
  maxPasswordLength: 32,
  otpExpirationMinutes: 10,
  bidExpirationMinutes: 30,
  maxBidAmount: 50000,
  minBidAmount: 500,
  defaultRadius: 5000, // 5km en mètres
  maxDeliveryDistance: 50000, // 50km en mètres
  maxImageSize: 5 * 1024 * 1024, // 5MB en octets
  maxImageDimension: 2048, // pixels
  maxUploadRetries: 3,
  offlineDataExpirationDays: 7,
}

// Endpoints de l'API
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verifyOtp: "/auth/verify-otp",
    refreshToken: "/auth/refresh-token",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  user: {
    profile: "/api/users/profile",
    updateProfile: "/api/users/profile",
    changePassword: "/api/users/change-password",
    uploadAvatar: "/api/users/avatar",
  },
  deliveries: {
    create: "/api/deliveries",
    list: "/api/deliveries",
    details: (id: string) => `/api/deliveries/${id}`,
    update: (id: string) => `/api/deliveries/${id}`,
    cancel: (id: string) => `/api/deliveries/${id}/cancel`,
    rate: (id: string) => `/api/deliveries/${id}/rate`,
  },
  bids: {
    create: "/api/bids",
    list: (deliveryId: string) => `/api/deliveries/${deliveryId}/bids`,
    accept: (id: string) => `/api/bids/${id}/accept`,
    reject: (id: string) => `/api/bids/${id}/reject`,
  },
  courier: {
    available: "/api/courier/available",
    unavailable: "/api/courier/unavailable",
    earnings: "/api/courier/earnings",
    stats: "/api/courier/stats",
    deliveries: "/api/courier/deliveries",
  },
  payments: {
    create: "/api/payments",
    verify: (id: string) => `/api/payments/${id}/verify`,
    methods: "/api/payments/methods",
  },
  notifications: {
    list: "/api/notifications",
    markAsRead: (id: string) => `/api/notifications/${id}/read`,
    markAllAsRead: "/api/notifications/read-all",
    settings: "/api/notifications/settings",
  },
  marketplace: {
    merchants: "/api/marketplace/merchants",
    merchant: (id: string) => `/api/marketplace/merchants/${id}`,
    categories: "/api/marketplace/categories",
    products: (merchantId: string) => `/api/marketplace/merchants/${merchantId}/products`,
  },
  vehicles: {
    list: "/api/vehicles",
    create: "/api/vehicles",
    update: (id: string) => `/api/vehicles/${id}`,
    delete: (id: string) => `/api/vehicles/${id}`,
    setActive: (id: string) => `/api/vehicles/${id}/active`,
  },
  collaborative: {
    list: "/api/collaborative",
    create: "/api/collaborative",
    join: (id: string) => `/api/collaborative/${id}/join`,
    leave: (id: string) => `/api/collaborative/${id}/leave`,
    messages: (id: string) => `/api/collaborative/${id}/messages`,
  },
  gamification: {
    badges: "/api/gamification/badges",
    leaderboard: "/api/gamification/leaderboard",
    profile: "/api/gamification/profile",
  },
  wallet: {
    balance: "/api/wallet/balance",
    transactions: "/api/wallet/transactions",
    deposit: "/api/wallet/deposit",
    withdraw: "/api/wallet/withdraw",
  },
  weather: {
    current: "/api/weather/current",
    forecast: "/api/weather/forecast",
  },
  support: {
    tickets: "/api/support/tickets",
    createTicket: "/api/support/tickets",
    ticket: (id: string) => `/api/support/tickets/${id}`,
    addMessage: (id: string) => `/api/support/tickets/${id}/messages`,
  },
  settings: {
    get: "/api/settings",
    update: "/api/settings",
  },
}
