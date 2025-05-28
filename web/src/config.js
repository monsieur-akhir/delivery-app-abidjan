// Configuration de l'API
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"
export const API_TIMEOUT = 30000 // 30 secondes
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000/ws"

// Configuration des tokens
export const TOKEN_KEY = "auth_token"
export const REFRESH_TOKEN_KEY = "refresh_token"
export const TOKEN_EXPIRY_KEY = "token_expiry"

// Configuration des rôles utilisateur
export const USER_ROLES = {
  admin: {
    label: "Administrateur",
    color: "#dc3545",
    icon: "user-shield",
  },
  manager: {
    label: "Gestionnaire",
    color: "#6f42c1",
    icon: "user-tie",
  },
  driver: {
    label: "Livreur",
    color: "#007bff",
    icon: "truck",
  },
  customer: {
    label: "Client",
    color: "#28a745",
    icon: "user",
  },
}

// Configuration des statuts utilisateur
export const USER_STATUSES = {
  active: {
    label: "Actif",
    color: "#28a745",
    icon: "check-circle",
  },
  inactive: {
    label: "Inactif",
    color: "#6c757d",
    icon: "times-circle",
  },
  suspended: {
    label: "Suspendu",
    color: "#ffc107",
    icon: "exclamation-circle",
  },
  blocked: {
    label: "Bloqué",
    color: "#dc3545",
    icon: "ban",
  },
}

// Configuration de la pagination
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20

// Configuration des statuts de livraison
export const DELIVERY_STATUSES = {
  pending: {
    label: "En attente",
    color: "#ffc107",
    icon: "clock",
  },
  bidding: {
    label: "Enchères en cours",
    color: "#17a2b8",
    icon: "gavel",
  },
  accepted: {
    label: "Acceptée",
    color: "#6f42c1",
    icon: "check-circle",
  },
  in_progress: {
    label: "En cours",
    color: "#007bff",
    icon: "truck",
  },
  delivered: {
    label: "Livrée",
    color: "#28a745",
    icon: "box",
  },
  completed: {
    label: "Terminée",
    color: "#28a745",
    icon: "check-double",
  },
  cancelled: {
    label: "Annulée",
    color: "#dc3545",
    icon: "times-circle",
  },
}

// Configuration des types de livraison
export const DELIVERY_TYPES = {
  standard: {
    label: "Standard",
    color: "#6c757d",
  },
  express: {
    label: "Express",
    color: "#fd7e14",
  },
  collaborative: {
    label: "Collaborative",
    color: "#20c997",
  },
}

// Configuration des tailles de colis
export const PACKAGE_SIZES = [
  { value: "small", label: "Petit (< 5kg)", icon: "box" },
  { value: "medium", label: "Moyen (5-15kg)", icon: "box" },
  { value: "large", label: "Grand (> 15kg)", icon: "box" },
]

// Configuration des types de véhicules
export const VEHICLE_TYPES = [
  { value: "moto", label: "Moto", icon: "motorcycle" },
  { value: "car", label: "Voiture", icon: "car" },
  { value: "van", label: "Camionnette", icon: "truck" },
  { value: "bicycle", label: "Vélo", icon: "bicycle" },
]

// Configuration des communes d'Abidjan
export const COMMUNES = [
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Treichville",
  "Yopougon",
  "Bingerville",
  "Songon",
  "Anyama",
]

// Configuration des catégories de produits
export const categories = [
  { value: "food", label: "Alimentation" },
  { value: "clothing", label: "Vêtements" },
  { value: "electronics", label: "Électronique" },
  { value: "household", label: "Maison" },
  { value: "beauty", label: "Beauté" },
  { value: "other", label: "Autre" },
]

// Configuration des thèmes
export const THEMES = {
  light: {
    primary: "#007bff",
    secondary: "#6c757d",
    success: "#28a745",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
    light: "#f8f9fa",
    dark: "#343a40",
    background: "#ffffff",
    text: "#212529",
  },
  dark: {
    primary: "#0d6efd",
    secondary: "#6c757d",
    success: "#198754",
    danger: "#dc3545",
    warning: "#ffc107",
    info: "#0dcaf0",
    light: "#f8f9fa",
    dark: "#212529",
    background: "#121212",
    text: "#f8f9fa",
  },
}

// Configuration des notifications
export const NOTIFICATION_TYPES = {
  delivery: {
    icon: "truck",
    color: "#007bff",
  },
  payment: {
    icon: "credit-card",
    color: "#28a745",
  },
  system: {
    icon: "bell",
    color: "#6c757d",
  },
  alert: {
    icon: "exclamation-triangle",
    color: "#dc3545",
  },
}

// Configuration des options d'exportation
export const EXPORT_OPTIONS = {
  csv: {
    label: "CSV",
    icon: "file-csv",
  },
  excel: {
    label: "Excel",
    icon: "file-excel",
  },
  pdf: {
    label: "PDF",
    icon: "file-pdf",
  },
}

// Configuration des méthodes de paiement
export const PAYMENT_METHODS = [
  { value: "orange_money", label: "Orange Money", icon: "mobile-alt" },
  { value: "mtn_money", label: "MTN Mobile Money", icon: "mobile-alt" },
  { value: "moov_money", label: "Moov Money", icon: "mobile-alt" },
  { value: "wave", label: "Wave", icon: "credit-card" },
  { value: "cash", label: "Espèces", icon: "money-bill-wave" },
]

// Configuration des options de carte
export const MAP_OPTIONS = {
  center: [5.3364, -4.0267], // Abidjan
  zoom: 12,
  maxZoom: 18,
  minZoom: 8,
}

// Configuration des options de graphiques
export const CHART_COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14", "#20c997", "#17a2b8"]

// Configuration des options de pagination
export const PAGINATION_OPTIONS = [10, 25, 50, 100]

// Configuration des options de tri
export const SORT_OPTIONS = [
  { value: "created_at", label: "Date (récent à ancien)" },
  { value: "-created_at", label: "Date (ancien à récent)" },
  { value: "price", label: "Prix (croissant)" },
  { value: "-price", label: "Prix (décroissant)" },
  { value: "distance", label: "Distance (croissant)" },
  { value: "-distance", label: "Distance (décroissant)" },
]
