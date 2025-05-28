// Liste des communes d'Abidjan
export const COMMUNES = [
  { id: 'abobo', name: 'Abobo' },
  { id: 'adjame', name: 'Adjamé' },
  { id: 'anyama', name: 'Anyama' },
  { id: 'attecoube', name: 'Attécoubé' },
  { id: 'bingerville', name: 'Bingerville' },
  { id: 'cocody', name: 'Cocody' },
  { id: 'koumassi', name: 'Koumassi' },
  { id: 'marcory', name: 'Marcory' },
  { id: 'plateau', name: 'Plateau' },
  { id: 'port_bouet', name: 'Port-Bouët' },
  { id: 'treichville', name: 'Treichville' },
  { id: 'yopougon', name: 'Yopougon' }
];

// Statuts des commandes
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Rôles des utilisateurs
export const USER_ROLES = {
  ADMIN: 'admin',
  BUSINESS: 'business',
  CUSTOMER: 'customer',
  COURIER: 'courier'
};

// Types de paiement
export const PAYMENT_METHODS = {
  CASH: 'cash',
  ORANGE_MONEY: 'orange_money',
  MTN_MOMO: 'mtn_momo',
  WAVE: 'wave'
};

// Constantes de l'API
export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
};
