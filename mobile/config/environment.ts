// Configuration des environnements

// Déclaration de la variable __DEV__
const __DEV__ = process.env.NODE_ENV === "development"

// URL de base de l'API
export const API_URL = __DEV__
  ? "http://192.168.1.100:8000" // URL de développement local
  : "https://api.livraison-abidjan.com" // URL de production

// Clés d'API
export const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"
export const WEATHER_API_KEY = "YOUR_WEATHER_API_KEY"

// Configuration Sentry
export const SENTRY_DSN = __DEV__ ? "" : "YOUR_SENTRY_DSN"
export const ENVIRONMENT = __DEV__ ? "development" : "production"

// Configuration des timeouts
export const API_TIMEOUT = 30000 // 30 secondes

// Configuration des websockets
export const WEBSOCKET_URL = __DEV__ ? "ws://192.168.1.100:8000/ws" : "wss://api.livraison-abidjan.com/ws"

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
export const WS_URL = __DEV__
  ? "ws://192.168.1.100:8000/ws"
  : "wss://api.livraison-abidjan.com/ws"

// Endpoints de l'API
export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    verifyOtp: "/api/auth/verify-otp",
    refreshToken: "/api/auth/refresh-token",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
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
