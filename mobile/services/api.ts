/* eslint-disable prefer-const */
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"
import type { Delivery, User, DeliveryStatus, Weather, VehicleType, CargoCategory } from "../types/models"

// API Response Interfaces
export interface ApiError {
  detail?: string
  message?: string
  error?: string
}

export interface CollaborativeDeliveryDetails {
  id: string
  delivery_id: string
  participants: Array<{
    courier_id: string
    courier_name: string
    role: string
    status: string
  }>
  status: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  delivery_id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

export interface MessageResponse {
  id: string
  message: string
  sender_id: string
  created_at: string
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  address: string
  commune?: string
  confidence: number
}

export interface CourierInfo {
  id: string
  full_name: string
  phone: string
  rating?: number
  vehicle_type?: string
  profile_picture?: string
}

export interface BidWithCourier {
  id: string
  delivery_id: string
  courier_id: string
  amount: number
  note?: string
  estimated_time?: number
  status: string
  created_at: string
  courier: CourierInfo
}

export interface BidResponse {
  id: string
  delivery_id: string
  courier_id: string
  amount: number
  note?: string
  estimated_time?: number
  status: string
  created_at: string
}

export interface CourierLocation {
  lat: number
  lng: number
  last_updated: string
  courier_id: string
}

export interface RatingResponse {
  id: string
  delivery_id: string
  courier_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface PaymentResponse {
  id: string
  delivery_id: string
  amount: number
  status: string
  payment_method: string
  reference?: string
  created_at: string
}

export interface PaymentVerificationResponse {
  success: boolean
  payment_id: string
  status: string
  message?: string
}

export interface MerchantInfo {
  id: string
  name: string
  description?: string
  address: string
  commune: string
  category: string
  rating?: number
  phone?: string
  lat?: number
  lng?: number
  is_open: boolean
  opening_hours?: string
}

export interface Product {
  id: string
  merchant_id: string
  name: string
  description?: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
}

export interface CourierProfile {
  id: string
  full_name: string
  phone: string
  email?: string
  rating: number
  total_deliveries: number
  vehicle_type?: string
  license_plate?: string
  is_online: boolean
  earnings_total?: number
  profile_picture?: string
}

export interface ProfileUpdateResponse {
  success: boolean
  message: string
  profile?: CourierProfile
}

export interface OnlineStatusData {
  is_online: boolean
  location?: {
    lat: number
    lng: number
  }
}

export interface TrackingPoint {
  lat: number
  lng: number
  timestamp: string
  speed?: number
  heading?: number
}

export interface DeliveryNotification {
  type: string
  title: string
  body: string
  message: string
  data?: Record<string, unknown>
}

export interface WeatherAlert {
  id: string
  type: string
  severity: string
  title: string
  description: string
  area: string
  start_time: string
  end_time?: string
}

export interface GamificationProfile {
  user_id: string
  level: number
  experience_points: number
  badges: Array<{
    id: string
    name: string
    description: string
    earned_at: string
  }>
  achievements: Array<{
    id: string
    name: string
    description: string
    progress: number
    target: number
  }>
  ranking: {
    position: number
    commune_position?: number
  }
}

export interface Ranking {
  position: number
  courier_id: string
  courier_name: string
  points: number
  level: number
  commune?: string
}

export interface Reward {
  id: string
  name: string
  description: string
  points_required: number
  type: string
  value?: number
  is_available: boolean
}

export interface RewardClaimResponse {
  success: boolean
  message: string
  reward_id: string
  claimed_at: string
}

export interface WalletBalance {
  balance: number
  currency: string
  pending_balance?: number
  last_updated: string
}

export interface WalletTransaction {
  id: string
  type: string
  amount: number
  description: string
  reference?: string
  status: string
  created_at: string
}

export interface LoanRequest {
  amount: number
  reason: string
  monthly_income?: number
  employment_status?: string
}

export interface LoanResponse {
  id: string
  amount: number
  status: string
  interest_rate: number
  monthly_payment: number
  due_date: string
  created_at: string
}

export interface ActiveLoan {
  id: string
  amount: number
  remaining_balance: number
  monthly_payment: number
  next_payment_date: string
  status: string
  interest_rate: number
}

export interface SupportTicket {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
  last_message?: string
}

export interface TicketResponse {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
}

export interface TicketMessage {
  id: string
  ticket_id: string
  message: string
  sender_type: string
  created_at: string
}

export interface UploadResponse {
  success: boolean
  file_url: string
  image_url: string
  message?: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order?: number
}

// Types pour les réponses de l'API
export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterUserData {
  full_name: string
  phone: string
  email?: string
  password: string
  role: string
  commune?: string
  language_preference?: string
  vehicle_type?: string
  license_plate?: string
}

export interface DeliveryData {
  pickup_address: string
  pickup_commune: string
  pickup_lat?: number
  pickup_lng?: number
  delivery_address: string
  delivery_commune: string
  delivery_lat?: number
  delivery_lng?: number
  description: string
  package_size: string
  package_type?: string
  is_fragile: boolean
  is_urgent: boolean
  proposed_price: number
  notes?: string
  estimated_distance?: number
  estimated_duration?: number
  cargo_category?: string
  required_vehicle_type?: string
}

// Helper function for error handling
// const handleApiError = (error: unknown): never => {
//   if (axios.isAxiosError(error) && error.response?.data) {
//     const apiError = error.response.data as ApiError
//     if (apiError.detail) {
//       throw new Error(apiError.detail)
//     }
//     if (apiError.message) {
//       throw new Error(apiError.message)
//     }
//     if (apiError.error) {
//       throw new Error(apiError.error)
//     }
//   }
//   throw new Error('Une erreur inattendue s\'est produite')
// }

export const getCollaborativeDeliveryDetails = async (deliveryId: string): Promise<CollaborativeDeliveryDetails> => {
  const response = await api.get(`/api/courier/collaborative-deliveries/${deliveryId}`)
  return response.data
}

export const getCollaborativeDeliveryChatHistory = async (deliveryId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/api/courier/collaborative-deliveries/${deliveryId}/messages`)
  return response.data
}

export const sendCollaborativeDeliveryMessage = async (deliveryId: string, message: string): Promise<MessageResponse> => {
  const response = await api.post(`/api/courier/collaborative-deliveries/${deliveryId}/message`, { message })
  return response.data
}

export interface PriceEstimateData {
  distance: number
  package_size: string
  is_fragile: boolean
  is_urgent: boolean
  weather_condition?: string | number // Modifié pour accepter chaîne ou nombre
  pickup_commune?: string
  delivery_commune?: string
}

export interface BidData {
  delivery_id: string
  amount: number
  note?: string
  estimated_time?: number
}

export interface RatingData {
  delivery_id: string
  courier_id: string
  rating: number
  comment?: string
  voice_comment?: string
  aspects?: Record<string, number>
}

export interface PaymentData {
  delivery_id: string
  amount: number
  payment_method: string
  phone_number: string
}

export interface PaymentVerificationData {
  reference: string
  otp: string
}

export interface VoiceCommandData {
  audio: string
  language?: string
}

export interface VoiceCommandResponse {
  transcript: string
  response: string
  action?: string
  data?: Record<string, unknown> // Replaced `any` with a more specific type
}

// Types pour les véhicules
export interface VehicleData {
  name: string
  type: string
  custom_type?: string
  license_plate: string
  brand?: string
  model?: string
  year?: number
  color?: string
  max_weight?: number
  max_volume?: number
  max_distance?: number
  is_electric: boolean
}

export interface CourierVehicle {
  vehicle_id: string
  is_primary: boolean
}

export interface TransportRuleData {
  vehicle_id: string
  cargo_category: string
  custom_category?: string
  min_distance?: number
  max_distance?: number
  min_weight?: number
  max_weight?: number
  min_volume?: number
  max_volume?: number
  priority?: number
  price_multiplier?: number
  is_active?: boolean
}

export interface VehicleRecommendation {
  recommended_vehicle: {
    type: VehicleType
    name: string
  }
  reason: string
  price_multiplier: number
}

export interface VehicleRecommendationData {
  cargo_category: CargoCategory
  custom_category?: string
  distance: number
  weight?: number
  volume?: number
  is_fragile?: boolean
  is_urgent?: boolean
  weather_condition?: number
}

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Si l'erreur est 401 (non autorisé) et que nous n'avons pas déjà essayé de rafraîchir le token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Essayer de rafraîchir le token
        const refreshToken = await AsyncStorage.getItem("refreshToken")
        if (!refreshToken) {
          // Si pas de refresh token, rediriger vers la connexion
          await AsyncStorage.removeItem("token")
          await AsyncStorage.removeItem("user")
          return Promise.reject(error)
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data

        // Sauvegarder les nouveaux tokens
        await AsyncStorage.setItem("token", access_token)
        await AsyncStorage.setItem("refreshToken", refresh_token)

        // Réessayer la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Si le rafraîchissement échoue, déconnecter l'utilisateur
        await AsyncStorage.removeItem("token")
        await AsyncStorage.removeItem("refreshToken")
        await AsyncStorage.removeItem("user")
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// API d'authentification

// Nouvelle fonction de connexion par OTP uniquement
export const loginWithOTP = async (phone: string, otp: string): Promise<{ token: string; user: User }> => {
  try {
    // Utiliser l'endpoint correct pour vérifier l'OTP de login
    const response = await api.post("/api/auth/verify-otp", { 
      phone: phone,
      code: otp,
      otp_type: "login"
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data.success && response.data.token) {
      // Token directement disponible dans la réponse
      const access_token = response.data.token;
      
      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return {
        token: access_token,
        user: response.data.user
      };
    } else {
      throw new Error("Échec de la vérification OTP");
    }
  } catch (error: unknown) {
    console.error("OTP Login error:", error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Code OTP invalide ou expiré");
    }
    throw new Error("Erreur de connexion avec OTP");
  }
}

export const login = async (phone: string, password: string): Promise<{ token: string; user: User }> => {
  try {
    // Utiliser l'endpoint de login correct, pas send-otp
    const response = await api.post("/api/auth/login", { 
      phone: phone,      // Utiliser le bon nom de champ
      password: password 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const access_token = response.data.access_token;
    
    // Get user profile with the token
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    const userResponse = await api.get("/api/users/me");
    
    return {
      token: access_token,
      user: userResponse.data
    };
  } catch (error: unknown) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Identifiants invalides");
    }
    throw new Error("Erreur de connexion");
  }
}

// Inscription
export const register = async (userData: RegisterUserData): Promise<void> => {
  try {
    const response = await api.post("/api/auth/register", userData)
    return response.data
  } catch (error: unknown) {
    console.error("Registration error:", error);
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error("Erreur d'inscription");
  }
}

// Vérification du token
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await api.post("/auth/verify-token", { token })
    return response.status === 200
  } catch (error: unknown) {
    console.error("Token verification error:", error)
    return false
  }
}

// Vérification OTP
export const verifyOTP = async (phone: string, otp: string): Promise<{ success: boolean; token?: string; user?: User }> => {
  try {
    const response = await api.post("/api/auth/verify-otp", { 
      phone, 
      code: otp,  // Backend expects 'code', not 'otp'
      otp_type: "login"  // Required parameter
    })
    return response.data
  } catch (error: unknown) {
    console.error("OTP verification error:", error);
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error("Erreur de vérification OTP");
  }
}

// Envoyer OTP
export const sendOTP = async (phone: string, otpType: 'registration' | 'login' | 'password_reset' = 'login'): Promise<{message: string, success: boolean}> => {
  try {
    const response = await api.post("/api/auth/send-otp", { 
      phone: phone,
      otp_type: otpType
    })
    return response.data
  } catch (error: unknown) {
    console.error("OTP send error:", error);
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error("Erreur d'envoi OTP");
  }
}

// Renvoyer OTP
export const resendOTP = async (phone: string, otpType: 'login' | 'registration' | 'password_reset' = 'login'): Promise<void> => {
  try {
    const response = await api.post("/api/auth/resend-otp", { 
      phone,
      otp_type: otpType  // Backend requires otp_type parameter
    })
    return response.data
  } catch (error: unknown) {
    console.error("OTP resend error:", error);
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error("Erreur d'envoi OTP");
  }
}

// Réinitialisation du mot de passe
export const resetPassword = async (phone: string): Promise<void> => {
  const response = await api.post("/api/auth/reset-password", { phone })
  return response.data
}

// Profil utilisateur
export const getUserProfile = async (): Promise<User> => {
  const response = await api.get("/api/users/me")
  return response.data
}

// Mise à jour du profil
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.put("/api/users/me", userData)
  return response.data
}

// Upload de photo de profil
export const uploadProfilePicture = async (formData: FormData): Promise<UploadResponse> => {
  const token = await AsyncStorage.getItem("authToken")
  const response = await api.post("/api/users/me/profile-picture", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

export const uploadProfileImage = uploadProfilePicture

// Enregistrement du token push
export const registerPushToken = async (token: string, userId: string): Promise<void> => {
  const response = await api.post("/api/users/push-token", { token, user_id: userId })
  return response.data
}

// Géocodage d'adresse
export const geocodeAddress = async (address: string): Promise<GeocodeResult[]> => {
  const response = await api.get(`/api/traffic/geocode?address=${encodeURIComponent(address)}`)
  return response.data
}

// Obtenir le prix recommandé
export const getRecommendedPrice = async (data: PriceEstimateData): Promise<number> => {
  const payload = { ...data }
  if (typeof payload.weather_condition === "string") {
    // Mappage des conditions météo en codes (à ajuster selon votre API)
    const conditionMap: Record<string, number> = {
      sunny: 1000,
      rainy: 1003,
      cloudy: 1006,
      partly_cloudy: 1009,
      // Ajoutez d'autres conditions selon les données de votre API météo
    }
    payload.weather_condition = conditionMap[payload.weather_condition.toLowerCase()] || 1000
  }
  const response = await api.post("/api/deliveries/price-estimate", payload)
  return response.data
}

// Créer une livraison
export const createDelivery = async (deliveryData: DeliveryData): Promise<Delivery> => {
  const response = await api.post("/api/deliveries", deliveryData)
  return response.data
}

// Obtenir les détails d'une livraison
export const fetchDeliveryDetails = async (deliveryId: string): Promise<Delivery> => {
  const response = await api.get(`/api/deliveries/${deliveryId}`)
  return response.data
}

// Obtenir les enchères pour une livraison
export const getBidsForDelivery = async (deliveryId: string): Promise<BidResponse[]> => {
  const response = await api.get(`/api/deliveries/${deliveryId}/bids`)
  return response.data
}

// Accepter une enchère
export const acceptBid = async (bidId: string, deliveryId?: string): Promise<void> => {
  let targetDeliveryId = deliveryId
  if (!targetDeliveryId) {
    const bidDetails = await api.get(`/api/deliveries/bids/${bidId}`)
    targetDeliveryId = bidDetails.data.delivery_id
  }
  const response = await api.post(`/api/deliveries/${targetDeliveryId}/bids/${bidId}/accept`)
  return response.data
}

// Rejeter une enchère
export const rejectBid = async (bidId: string, deliveryId?: string): Promise<void> => {
  let targetDeliveryId = deliveryId
  if (!targetDeliveryId) {
    const bidDetails = await api.get(`/api/deliveries/bids/${bidId}`)
    targetDeliveryId = bidDetails.data.delivery_id
  }
  const response = await api.post(`/api/deliveries/${targetDeliveryId}/bids/${bidId}/reject`)
  return response.data
}

// Obtenir les offres pour une livraison
export const fetchDeliveryBids = async (deliveryId: string): Promise<BidWithCourier[]> => {
  const response = await api.get(`/api/deliveries/${deliveryId}/bids`)
  const bidsWithCourierPromises = response.data.map(async (bid: BidResponse) => {
    try {
      const courierResponse = await api.get(`/api/users/${bid.courier_id}`)
      return {
        ...bid,
        courier: courierResponse.data,
      }
    } catch (error: unknown) {
      console.error(`Erreur lors de la récupération du coursier pour l'offre ${bid.id}:`, error)
      return {
        ...bid,
        courier: {
          id: bid.courier_id,
          full_name: "Unknown",
          phone: "",
          rating: 0,
        },
      }
    }
  })
  const bidsWithCourier = await Promise.all(bidsWithCourierPromises)
  return bidsWithCourier
}

// Créer une enchère
export const createBid = async (bidData: BidData): Promise<BidResponse> => {
  const response = await api.post("/api/bids", bidData)
  return response.data
}

// Enchérir pour une livraison
export const bidForDelivery = async (deliveryId: string, amount: number): Promise<BidResponse> => {
  const response = await api.post(`/api/deliveries/${deliveryId}/bid`, { amount })
  return response.data
}

// Obtenir la position du coursier
export const getCourierLocation = async (deliveryId: string): Promise<CourierLocation> => {
  const response = await api.get(`/api/deliveries/${deliveryId}/courier-location`)
  return response.data
}

// Mettre à jour le statut de la livraison
export const updateDeliveryStatus = async (deliveryId: string, status: DeliveryStatus): Promise<void> => {
  const response = await api.put(`/api/deliveries/${deliveryId}/status`, { status })
  return response.data
}

// Annuler une livraison
export const cancelDelivery = async (deliveryId: string): Promise<void> => {
  const response = await api.post(`/api/deliveries/${deliveryId}/cancel`)
  return response.data
}

// Obtenir les informations de trafic
export const getTrafficInfo = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<{ distance: number; duration: number; route: Array<{ lat: number; lng: number }> }> => {
  const response = await api.get(
    `/api/geo/traffic?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`,
  )
  return response.data
}

// Créer une évaluation
export const submitRating = async (ratingData: RatingData): Promise<RatingResponse> => {
  const response = await api.post("/api/ratings", ratingData)
  return response.data
}

// Initier un paiement
export const initiatePayment = async (paymentData: PaymentData): Promise<PaymentResponse> => {
  const response = await api.post("/api/payments/initiate", paymentData)
  return response.data
}

// Vérifier un paiement
export const verifyPayment = async (verificationData: PaymentVerificationData): Promise<PaymentVerificationResponse> => {
  const response = await api.post("/api/payments/verify", verificationData)
  return response.data
}

// Obtenir les commerçants à proximité
export const fetchNearbyMerchants = async (commune?: string, category?: string): Promise<MerchantInfo[]> => {
  let url = "/merchants/nearby"
  const params = []
  if (commune) params.push(`commune=${encodeURIComponent(commune)}`)
  if (category) params.push(`category=${encodeURIComponent(category)}`)
  if (params.length > 0) {
    url += `?${params.join("&")}`
  }
  const response = await api.get(url)
  return response.data
}

// Obtenir les détails d'un commerçant
export const fetchMerchantDetails = async (merchantId: string): Promise<MerchantInfo> => {
  const response = await api.get(`/api/market/merchants/${merchantId}`)
  return response.data
}

// Obtenir les produits d'un commerçant
export const fetchMerchantProducts = async (merchantId: string): Promise<Product[]> => {
  const response = await api.get(`/api/market/merchants/${merchantId}/products`)
  return response.data
}

// Fonctions d'API pour les coursiers
export const fetchCourierEarnings = async (period = "month") => {
  const response = await api.get(`/api/courier/earnings?period=${period}`)
  return response.data
}

export const withdrawFunds = async (amount: number) => {
  const response = await api.post("/api/courier/withdraw", { amount })
  return response.data
}

export const fetchCourierProfile = async (): Promise<CourierProfile> => {
  const response = await api.get("/api/courier/profile")
  return response.data
}

export const updateCourierStatus = async (
  isOnline: boolean,
  lat?: number | null,
  lng?: number | null,
): Promise<ProfileUpdateResponse> => {
  const data: OnlineStatusData = { is_online: isOnline }
  if (lat !== null && lng !== null && lat !== undefined && lng !== undefined) {
    data.location = {
      lat: lat,
      lng: lng
    }
  }
  const response = await api.post("/api/courier/status", data)
  return response.data
}

export const fetchCourierStats = async (period = "month") => {
  const response = await api.get(`/api/courier/stats?period=${period}`)
  return response.data
}

export const fetchCourierRatings = async (period = "month") => {
  const response = await api.get(`/api/courier/ratings?period=${period}`)
  return response.data
}

export const fetchCollaborativeDeliveries = async () => {
  const response = await api.get("/api/courier/collaborative-deliveries")
  return response.data
}

export const joinCollaborativeDelivery = async (deliveryId: string, data: { role?: string; message?: string }) => {
  const response = await api.post(`/api/courier/collaborative-deliveries/${deliveryId}/join`, data)
  return response.data
}

export const sendTrackingPoint = async (data: TrackingPoint) => {
  const response = await api.post("/api/tracking/point", data)
  return response.data
}

export const getDirections = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
  const response = await api.get(
    `/api/directions?start_lat=${startLat}&start_lng=${startLng}&end_lat=${endLat}&end_lng=${endLng}`,
  )
  return response.data
}

export const sendDeliveryNotification = async (userId: string, notification: DeliveryNotification) => {
  const response = await api.post(`/api/notifications/user/${userId}`, notification)
  return response.data
}

// Récupérer l'historique des livraisons pour un client
export const fetchClientDeliveryHistory = async (filter?: string): Promise<Delivery[]> => {
  let url = "/api/client/deliveries/history"
  if (filter) {
    url += `?status=${filter}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer l'historique des livraisons pour un coursier
export const fetchCourierDeliveryHistory = async (filter?: string): Promise<Delivery[]> => {
  let url = "/api/courier/deliveries/history"
  if (filter) {
    url += `?status=${filter}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer les livraisons disponibles pour un coursier
export const fetchAvailableDeliveries = async (commune?: string): Promise<Delivery[]> => {
  let url = "/api/courier/deliveries/available"
  if (commune) {
    url += `?commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer les livraisons actives pour un client
export const fetchActiveDeliveries = async (): Promise<Delivery[]> => {
  const response = await api.get("/api/client/deliveries/active")
  return response.data
}

// Récupérer les prévisions météo
export const fetchWeatherForecast = async (latitude: number, longitude: number, commune?: string): Promise<Weather> => {
  let url = `/api/weather?lat=${latitude}&lng=${longitude}`
  if (commune) {
    url += `&commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  const data = response.data
  // Transformer condition si nécessaire
  if (data.current && data.current.condition && typeof data.current.condition === "object") {
    data.current.condition = data.current.condition.text || "unknown"
  }
  return data
}

// Récupérer les alertes météo
export const fetchWeatherAlerts = async (latitude: number, longitude: number, commune?: string): Promise<WeatherAlert[]> => {
  let url = `/api/weather/alerts?lat=${latitude}&lng=${longitude}`
  if (commune) {
    url += `&commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

// Transcription audio pour évaluation
export const transcribeVoiceRating = async (audioBase64: string): Promise<{ text: string }> => {
  const response = await api.post("/api/ratings/transcribe", { audio: audioBase64 })
  return response.data
}

// Traitement des commandes vocales
export const processVoiceCommand = async (audioBase64: string): Promise<VoiceCommandResponse> => {
  const response = await api.post("/api/assistant/voice", { audio: audioBase64 })
  return response.data
}

// Obtenir une réponse du chatbot
export const getChatbotResponse = async (message: string): Promise<{ message: string; action?: string }> => {
  const response = await api.post("/api/assistant/chat", { message })
  return response.data
}

// Obtenir une recommandation de véhicule
export const getVehicleRecommendation = async (data: VehicleRecommendationData): Promise<VehicleRecommendation> => {
  const response = await api.post("/api/transport/recommend", data)
  return response.data
}

// Fonctions pour la gamification
export const fetchGamificationProfile = async (): Promise<GamificationProfile> => {
  const response = await api.get("/api/gamification/profile")
  return response.data
}

export const fetchRankings = async (commune?: string): Promise<Ranking[]> => {
  let url = "/api/gamification/rankings"
  if (commune) {
    url += `?commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

export const claimReward = async (rewardId: string): Promise<RewardClaimResponse> => {
  const response = await api.post(`/api/gamification/rewards/${rewardId}/claim`)
  return response.data
}

// Fonctions pour le portefeuille communautaire
export const fetchWalletBalance = async (): Promise<WalletBalance> => {
  const response = await api.get("/api/community-wallet/balance")
  return response.data
}

export const fetchWalletTransactions = async (type?: string): Promise<WalletTransaction[]> => {
  let url = "/api/community-wallet/transactions"
  if (type) {
    url += `?type=${type}`
  }
  const response = await api.get(url)
  return response.data
}

export const requestLoan = async (amount: number, reason: string): Promise<LoanResponse> => {
  const response = await api.post("/api/community-wallet/loans/request", { amount, reason })
  return response.data
}

export const repayLoan = async (loanId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/api/community-wallet/loans/${loanId}/repay`)
  return response.data
}

export const fetchActiveLoan = async (): Promise<ActiveLoan> => {
  const response = await api.get("/api/community-wallet/loans/active")
  return response.data
}

export const fetchLoanHistory = async (): Promise<LoanResponse[]> => {
  const response = await api.get("/api/community-wallet/loans/history")
  return response.data
}

// Fonctions pour le support
export const fetchSupportTickets = async (): Promise<SupportTicket[]> => {
  const response = await api.get("/api/support/tickets")
  return response.data
}

export const createSupportTicket = async (subject: string, message: string): Promise<TicketResponse> => {
  const response = await api.post("/api/support/tickets", { subject, message })
  return response.data
}

export const addMessageToTicket = async (ticketId: string, message: string): Promise<TicketMessage> => {
  const response = await api.post(`/api/support/tickets/${ticketId}/messages`, { message })
  return response.data
}

export const uploadTicketImage = async (ticketId: string, imageUri: string): Promise<UploadResponse> => {
  const formData = new FormData()
  const filename = imageUri.split("/").pop()
  const match = /\.(\w+)$/.exec(filename || "")
  const type = match ? `image/${match[1]}` : "image"

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob)

  const response = await api.post(`/api/support/tickets/${ticketId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

export const fetchFAQs = async (): Promise<FAQ[]> => {
  const response = await api.get("/api/support/faqs")
  return response.data
}

// Nouvelle fonction pour remplacer fetchWeatherForecast
export const getWeatherData = async (latitude: number, longitude: number, commune?: string): Promise<Weather> => {
  try {
    // Générer une clé unique pour le cache
    const cacheKey = `weather_${latitude}_${longitude}${commune ? `_${commune}` : ""}`
    const cachedData = await AsyncStorage.getItem(cacheKey)
    const cacheTimestamp = await AsyncStorage.getItem(`${cacheKey}_timestamp`)

    // Vérifier si les données en cache sont récentes (moins de 10 minutes)
    const cacheDuration = 10 * 60 * 1000 // 10 minutes en millisecondes
    if (cachedData && cacheTimestamp && Date.now() - Number.parseInt(cacheTimestamp) < cacheDuration) {
      return JSON.parse(cachedData) as Weather
    }

    // Construire l'URL de la requête
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
    })
    if (commune) {
      params.append("commune", commune)
    }
    const url = `/api/weather?${params.toString()}`

    // Effectuer la requête API
    const response = await api.get(url)
    let weatherData = response.data

    // Transformer condition si nécessaire
    if (weatherData.current && weatherData.current.condition && typeof weatherData.current.condition === "object") {
      weatherData.current.condition = weatherData.current.condition.text || "unknown"
    }

    // Valider la structure des données
    if (!weatherData.current || typeof weatherData.current.temperature !== "number" || typeof weatherData.current.condition !== "string") {
      throw new Error("Invalid weather data format")
    }

    // Mettre en cache les données
    await AsyncStorage.setItem(cacheKey, JSON.stringify(weatherData))
    await AsyncStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())

    return weatherData as Weather
  } catch (error: unknown) {
    // Gestion des erreurs
    console.error("Error fetching weather data:", error) // eslint-disable-next-line no-console
    const cachedData = await AsyncStorage.getItem(`weather_${latitude}_${longitude}${commune ? `_${commune}` : ""}`)
    if (cachedData) {
      return JSON.parse(cachedData) as Weather
    }
    throw new Error("Failed to fetch weather data and no cached data available")
  }
}


// Fonction pour vider le cache API
export const clearApiCache = async (): Promise<boolean> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const cacheKeys = keys.filter((key) => key.startsWith("api_cache_"))
    await AsyncStorage.multiRemove(cacheKeys)
    return true
  } catch (error: unknown) {
    console.error("Error clearing API cache:", error)
    return false
  }
}

// Fonctions pour les promotions
export const getActivePromotions = async (): Promise<any[]> => {
  const response = await api.get("/api/v1/promotions/active")
  return response.data
}

export const getApplicablePromotions = async (orderValue: number, zoneId?: number): Promise<any[]> => {
  const params = { order_value: orderValue }
  if (zoneId) params.zone_id = zoneId
  
  const response = await api.get("/api/v1/promotions/applicable", { params })
  return response.data
}

export const validatePromotionCode = async (code: string, orderValue: number): Promise<any> => {
  const response = await api.post("/api/v1/promotions/validate-code", {
    code,
    order_value: orderValue
  })
  return response.data
}

export const applyPromotionToDelivery = async (deliveryId: number, promotionId: string): Promise<any> => {
  const response = await api.post(`/api/v1/deliveries/${deliveryId}/apply-promotion`, {
    promotion_id: promotionId
  })
  return response.data
}

// Fonctions pour les zones
export const getDeliveryZones = async (lat: number, lng: number): Promise<any> => {
  const response = await api.get("/api/v1/zones/locate", {
    params: { lat, lng }
  })
  return response.data
}

export const calculateZonePrice = async (
  pickupLat: number,
  pickupLng: number,
  deliveryLat: number,
  deliveryLng: number,
  packageWeight?: number,
  isExpress: boolean = false
): Promise<any> => {
  const response = await api.post("/api/v1/zones/calculate-price", {
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    delivery_lat: deliveryLat,
    delivery_lng: deliveryLng,
    package_weight: packageWeight,
    is_express: isExpress
  })
  return response.data
}

// Exporter d'autres fonctions d'API au besoin
export default api