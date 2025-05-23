import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"

// Types
export interface LoginResponse {
  token: string
  user: any
}

export interface RegisterUserData {
  full_name: string
  phone: string
  email?: string
  password: string
  role: string
  commune?: string
  language_preference?: string
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
}

export interface PriceEstimateData {
  distance: number
  package_size: string
  is_fragile: boolean
  is_urgent: boolean
  weather_condition?: number
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
  data?: any
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
  vehicle_id: string
  recommended: boolean
}

export interface VehicleRecommendationData {
  cargo_category: string
  custom_category?: string
  distance: number
  weight?: number
  volume?: number
  is_fragile?: boolean
  is_urgent?: boolean
  weather_condition?: number
}

export type VehicleType = "car" | "motorcycle" | "truck"
export type CargoCategory = "small" | "medium" | "large"

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
    const token = await AsyncStorage.getItem("authToken")
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
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Essayer de rafraîchir le token
        const refreshToken = await AsyncStorage.getItem("refreshToken")
        if (!refreshToken) {
          // Si pas de refresh token, rediriger vers la connexion
          await AsyncStorage.removeItem("authToken")
          return Promise.reject(error)
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data

        // Sauvegarder les nouveaux tokens
        await AsyncStorage.setItem("authToken", access_token)
        await AsyncStorage.setItem("refreshToken", refresh_token)

        // Réessayer la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Si le rafraîchissement échoue, déconnecter l'utilisateur
        await AsyncStorage.removeItem("authToken")
        await AsyncStorage.removeItem("refreshToken")
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// API d'authentification
export const login = async (phone: string, password: string): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", { phone, password })
  return response.data
}

// Inscription
export const register = async (userData: RegisterUserData): Promise<void> => {
  const response = await api.post("/auth/register", userData)
  return response.data
}

// Vérification du token
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    const response = await api.post("/auth/verify", { token })
    return response.ok
  } catch (error) {
    console.error("Token verification error:", error)
    return false
  }
}

// Vérification OTP
export const verifyOTP = async (phone: string, otp: string): Promise<void> => {
  const response = await api.post("/auth/verify-otp", { phone, otp })
  return response.data
}

// Renvoyer OTP
export const resendOTP = async (phone: string): Promise<void> => {
  const response = await api.post("/auth/resend-otp", { phone })
  return response.data
}

// Réinitialisation du mot de passe
export const resetPassword = async (phone: string): Promise<void> => {
  const response = await api.post("/auth/reset-password", { phone })
  return response.data
}

// Profil utilisateur
export const getUserProfile = async (): Promise<any> => {
  const response = await api.get("/users/profile")
  return response.data
}

// Mise à jour du profil
export const updateUserProfile = async (userData: any): Promise<any> => {
  const response = await api.put("/users/profile", userData)
  return response.data
}

// Upload de photo de profil
export const uploadProfilePicture = async (formData: FormData): Promise<any> => {
  const token = await AsyncStorage.getItem("authToken")
  const response = await api.post("/users/profile-picture", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

// Enregistrement du token push
export const registerPushToken = async (token: string, userId: string): Promise<void> => {
  const response = await api.post("/users/push-token", { token, user_id: userId })
  return response.data
}

// Géocodage d'adresse
export const geocodeAddress = async (address: string): Promise<any[]> => {
  const response = await api.get(`/geo/geocode?address=${encodeURIComponent(address)}`)
  return response.data
}

// Obtenir le prix recommandé
export const getRecommendedPrice = async (data: PriceEstimateData): Promise<number> => {
  const response = await api.post("/deliveries/price-estimate", data)
  return response.data
}

// Créer une livraison
export const createDelivery = async (deliveryData: DeliveryData): Promise<any> => {
  const response = await api.post("/deliveries", deliveryData)
  return response.data
}

// Obtenir les détails d'une livraison
export const fetchDeliveryDetails = async (deliveryId: string): Promise<any> => {
  const response = await api.get(`/deliveries/${deliveryId}`)
  return response.data
}

// Obtenir les enchères pour une livraison
export const getBidsForDelivery = async (deliveryId: string): Promise<any[]> => {
  const response = await api.get(`/deliveries/${deliveryId}/bids`)
  return response.data
}

// Accepter une enchère
export const acceptBid = async (deliveryId: string, bidId: string): Promise<void> => {
  const response = await api.post(`/deliveries/${deliveryId}/bids/${bidId}/accept`)
  return response.data
}

// Créer une enchère
export const createBid = async (bidData: BidData): Promise<any> => {
  const response = await api.post("/bids", bidData)
  return response.data
}

// Obtenir la position du coursier
export const getCourierLocation = async (deliveryId: string): Promise<any> => {
  const response = await api.get(`/deliveries/${deliveryId}/courier-location`)
  return response.data
}

// Mettre à jour le statut de la livraison
export const updateDeliveryStatus = async (deliveryId: string, status: string): Promise<void> => {
  const response = await api.put(`/deliveries/${deliveryId}/status`, { status })
  return response.data
}

// Obtenir les informations de trafic
export const getTrafficInfo = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<any> => {
  const response = await api.get(
    `/geo/traffic?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`,
  )
  return response.data
}

// Créer une évaluation
export const submitRating = async (ratingData: RatingData): Promise<any> => {
  const response = await api.post("/ratings", ratingData)
  return response.data
}

// Initier un paiement
export const initiatePayment = async (paymentData: PaymentData): Promise<any> => {
  const response = await api.post("/payments/initiate", paymentData)
  return response.data
}

// Vérifier un paiement
export const verifyPayment = async (verificationData: PaymentVerificationData): Promise<any> => {
  const response = await api.post("/payments/verify", verificationData)
  return response.data
}

// Obtenir les commerçants à proximité
export const fetchNearbyMerchants = async (commune?: string, category?: string): Promise<any[]> => {
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
export const fetchMerchantDetails = async (merchantId: string): Promise<any> => {
  const response = await api.get(`/merchants/${merchantId}`)
  return response.data
}

// Obtenir les produits d'un commerçant
export const fetchMerchantProducts = async (merchantId: string): Promise<any[]> => {
  const response = await api.get(`/merchants/${merchantId}/products`)
  return response.data
}

// Fonctions d'API pour les coursiers
export const fetchCourierEarnings = async (period = "month") => {
  const response = await api.get(`/courier/earnings?period=${period}`)
  return response.data
}

export const withdrawFunds = async (amount) => {
  const response = await api.post("/courier/withdraw", { amount })
  return response.data
}

export const fetchCourierProfile = async () => {
  const response = await api.get("/courier/profile")
  return response.data
}

export const updateCourierStatus = async (isOnline, lat = null, lng = null) => {
  const data = { is_online: isOnline }
  if (lat !== null && lng !== null) {
    data.latitude = lat
    data.longitude = lng
  }
  const response = await api.post("/courier/status", data)
  return response.data
}

export const fetchCourierStats = async (period = "month") => {
  const response = await api.get(`/courier/stats?period=${period}`)
  return response.data
}

export const fetchCourierRatings = async (period = "month") => {
  const response = await api.get(`/courier/ratings?period=${period}`)
  return response.data
}

export const fetchCollaborativeDeliveries = async () => {
  const response = await api.get("/courier/collaborative-deliveries")
  return response.data
}

export const joinCollaborativeDelivery = async (deliveryId, data) => {
  const response = await api.post(`/courier/collaborative-deliveries/${deliveryId}/join`, data)
  return response.data
}

export const sendTrackingPoint = async (data) => {
  const response = await api.post("/tracking/point", data)
  return response.data
}

export const getDirections = async (startLat, startLng, endLat, endLng) => {
  const response = await api.get(
    `/directions?start_lat=${startLat}&start_lng=${startLng}&end_lat=${endLat}&end_lng=${endLng}`,
  )
  return response.data
}

export const sendDeliveryNotification = async (userId, notification) => {
  const response = await api.post(`/notifications/user/${userId}`, notification)
  return response.data
}

// Récupérer l'historique des livraisons pour un client
export const fetchClientDeliveryHistory = async (filter?: string): Promise<any[]> => {
  let url = "/client/deliveries/history"
  if (filter) {
    url += `?status=${filter}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer l'historique des livraisons pour un coursier
export const fetchCourierDeliveryHistory = async (filter?: string): Promise<any[]> => {
  let url = "/courier/deliveries/history"
  if (filter) {
    url += `?status=${filter}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer les livraisons disponibles pour un coursier
export const fetchAvailableDeliveries = async (commune?: string): Promise<any[]> => {
  let url = "/courier/deliveries/available"
  if (commune) {
    url += `?commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer les livraisons actives pour un client
export const fetchActiveDeliveries = async (): Promise<any[]> => {
  const response = await api.get("/client/deliveries/active")
  return response.data
}

// Récupérer les prévisions météo
export const fetchWeatherForecast = async (latitude: number, longitude: number, commune?: string): Promise<any> => {
  let url = `/weather?lat=${latitude}&lng=${longitude}`
  if (commune) {
    url += `&commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

// Récupérer les alertes météo
export const fetchWeatherAlerts = async (latitude: number, longitude: number, commune?: string): Promise<any[]> => {
  let url = `/weather/alerts?lat=${latitude}&lng=${longitude}`
  if (commune) {
    url += `&commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

// Transcription audio pour évaluation
export const transcribeVoiceRating = async (audioBase64: string): Promise<{ text: string }> => {
  const response = await api.post("/ratings/transcribe", { audio: audioBase64 })
  return response.data
}

// Traitement des commandes vocales
export const processVoiceCommand = async (audioBase64: string): Promise<VoiceCommandResponse> => {
  const response = await api.post("/assistant/voice", { audio: audioBase64 })
  return response.data
}

// Obtenir une réponse du chatbot
export const getChatbotResponse = async (message: string): Promise<{ message: string; action?: string }> => {
  const response = await api.post("/assistant/chat", { message })
  return response.data
}

// Fonctions pour la gamification
export const fetchGamificationProfile = async (): Promise<any> => {
  const response = await api.get("/gamification/profile")
  return response.data
}

export const fetchRankings = async (commune?: string): Promise<any[]> => {
  let url = "/gamification/rankings"
  if (commune) {
    url += `?commune=${encodeURIComponent(commune)}`
  }
  const response = await api.get(url)
  return response.data
}

export const claimReward = async (rewardId: string): Promise<any> => {
  const response = await api.post(`/gamification/rewards/${rewardId}/claim`)
  return response.data
}

// Fonctions pour le portefeuille communautaire
export const fetchWalletBalance = async (): Promise<any> => {
  const response = await api.get("/community-wallet/balance")
  return response.data
}

export const fetchWalletTransactions = async (type?: string): Promise<any[]> => {
  let url = "/community-wallet/transactions"
  if (type) {
    url += `?type=${type}`
  }
  const response = await api.get(url)
  return response.data
}

export const requestLoan = async (amount: number, reason: string): Promise<any> => {
  const response = await api.post("/community-wallet/loans/request", { amount, reason })
  return response.data
}

export const repayLoan = async (loanId: string): Promise<any> => {
  const response = await api.post(`/community-wallet/loans/${loanId}/repay`)
  return response.data
}

export const fetchActiveLoan = async (): Promise<any> => {
  const response = await api.get("/community-wallet/loans/active")
  return response.data
}

export const fetchLoanHistory = async (): Promise<any[]> => {
  const response = await api.get("/community-wallet/loans/history")
  return response.data
}

// Fonctions pour le support
export const fetchSupportTickets = async (): Promise<any[]> => {
  const response = await api.get("/support/tickets")
  return response.data
}

export const createSupportTicket = async (subject: string, message: string): Promise<any> => {
  const response = await api.post("/support/tickets", { subject, message })
  return response.data
}

export const addMessageToTicket = async (ticketId: string, message: string): Promise<any> => {
  const response = await api.post(`/support/tickets/${ticketId}/messages`, { message })
  return response.data
}

export const uploadTicketImage = async (ticketId: string, imageUri: string): Promise<any> => {
  const formData = new FormData()
  const filename = imageUri.split("/").pop()
  const match = /\.(\w+)$/.exec(filename || "")
  const type = match ? `image/${match[1]}` : "image"

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type,
  } as any)

  const response = await api.post(`/support/tickets/${ticketId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

export const fetchFAQs = async (): Promise<any[]> => {
  const response = await api.get("/support/faqs")
  return response.data
}

// Fonctions pour les livraisons collaboratives
export const fetchCollaborativeDeliveryDetails = async (deliveryId: string): Promise<any> => {
  const response = await api.get(`/collaborative-deliveries/${deliveryId}`)
  return response.data
}

export const fetchCollaborativeChat = async (deliveryId: string): Promise<any[]> => {
  const response = await api.get(`/collaborative-deliveries/${deliveryId}/chat`)
  return response.data
}

export const sendCollaborativeMessage = async (deliveryId: string, message: string): Promise<any> => {
  const response = await api.post(`/collaborative-deliveries/${deliveryId}/chat`, { message })
  return response.data
}

// Fonction pour vider le cache API
export const clearApiCache = async (): Promise<boolean> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const cacheKeys = keys.filter((key) => key.startsWith("api_cache_"))
    await AsyncStorage.multiRemove(cacheKeys)
    return true
  } catch (error) {
    console.error("Error clearing API cache:", error)
    return false
  }
}

// Fonctions pour les véhicules
export const fetchVehicles = async (businessId?: string, vehicleType?: string, status?: string): Promise<any[]> => {
  let url = "/transport/vehicles"
  const params = []

  if (businessId) params.push(`business_id=${businessId}`)
  if (vehicleType) params.push(`vehicle_type=${vehicleType}`)
  if (status) params.push(`status=${status}`)

  if (params.length > 0) {
    url += `?${params.join("&")}`
  }

  const response = await api.get(url)
  return response.data
}

export const fetchVehicleDetails = async (vehicleId: string): Promise<any> => {
  const response = await api.get(`/transport/vehicles/${vehicleId}`)
  return response.data
}

export const createVehicle = async (vehicleData: VehicleData): Promise<any> => {
  const response = await api.post("/transport/vehicles", vehicleData)
  return response.data
}

export const updateVehicle = async (vehicleId: string, vehicleData: Partial<VehicleData>): Promise<any> => {
  const response = await api.put(`/transport/vehicles/${vehicleId}`, vehicleData)
  return response.data
}

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  await api.delete(`/transport/vehicles/${vehicleId}`)
}

// Fonctions pour les véhicules des coursiers
/**
 * Récupère la liste des véhicules d'un coursier
 * @param courierId ID du coursier
 * @returns Liste des véhicules du coursier
 */
export const fetchCourierVehiclesList = async (courierId: number): Promise<CourierVehicle[]> => {
  try {
    const response = await api.get(`/transport/courier/${courierId}/vehicles`)
    return response.data
  } catch (error) {
    console.error("Error fetching courier vehicles:", error)
    throw error
  }
}

/**
 * Assigne un véhicule à un coursier
 * @param courierId ID du coursier
 * @param vehicleData Données du véhicule
 * @returns Véhicule assigné
 */
export const assignCourierVehicle = async (
  courierId: number,
  vehicleData: {
    vehicle_type: VehicleType
    license_plate: string
    brand?: string
    model?: string
    is_electric: boolean
  },
): Promise<CourierVehicle> => {
  try {
    const response = await api.post(`/transport/courier/${courierId}/vehicles`, vehicleData)
    return response.data
  } catch (error) {
    console.error("Error assigning vehicle to courier:", error)
    throw error
  }
}

/**
 * Met à jour un véhicule de coursier
 * @param courierVehicleId ID de l'association coursier-véhicule
 * @param updateData Données de mise à jour
 * @returns Véhicule mis à jour
 */
export const updateCourierVehicleDetails = async (
  courierVehicleId: number,
  updateData: {
    license_plate?: string
    brand?: string
    model?: string
    is_electric?: boolean
  },
): Promise<CourierVehicle> => {
  try {
    const response = await api.put(`/transport/courier/vehicles/${courierVehicleId}`, updateData)
    return response.data
  } catch (error) {
    console.error("Error updating courier vehicle:", error)
    throw error
  }
}

/**
 * Supprime un véhicule de coursier
 * @param courierVehicleId ID de l'association coursier-véhicule
 */
export const removeCourierVehicleAssociation = async (courierVehicleId: number): Promise<void> => {
  try {
    await api.delete(`/transport/courier/vehicles/${courierVehicleId}`)
  } catch (error) {
    console.error("Error removing courier vehicle:", error)
    throw error
  }
}

/**
 * Définit un véhicule comme principal pour un coursier
 * @param courierVehicleId ID de l'association coursier-véhicule
 * @returns Véhicule mis à jour
 */
export const setCourierVehicleAsPrimary = async (courierVehicleId: number): Promise<CourierVehicle> => {
  try {
    const response = await api.put(`/transport/courier/vehicles/${courierVehicleId}/primary`)
    return response.data
  } catch (error) {
    console.error("Error setting primary vehicle:", error)
    throw error
  }
}

/**
 * Télécharge un document pour un véhicule
 * @param courierVehicleId ID de l'association coursier-véhicule
 * @param formData Données du formulaire contenant le fichier
 * @returns Véhicule mis à jour
 */
export const uploadCourierVehicleDocument = async (
  courierVehicleId: number,
  formData: FormData,
): Promise<CourierVehicle> => {
  try {
    const response = await api.post(`/transport/courier/vehicles/${courierVehicleId}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error("Error uploading vehicle document:", error)
    throw error
  }
}

// Fonctions pour les règles de transport
export const fetchTransportRulesList = async (
  businessId?: string,
  vehicleId?: string,
  cargoCategory?: string,
  isActive?: boolean,
): Promise<any[]> => {
  let url = "/transport/rules"
  const params = []

  if (businessId) params.push(`business_id=${businessId}`)
  if (vehicleId) params.push(`vehicle_id=${vehicleId}`)
  if (cargoCategory) params.push(`cargo_category=${cargoCategory}`)
  if (isActive !== undefined) params.push(`is_active=${isActive}`)

  if (params.length > 0) {
    url += `?${params.join("&")}`
  }

  const response = await api.get(url)
  return response.data
}

export const createTransportRuleEntry = async (ruleData: TransportRuleData): Promise<any> => {
  const response = await api.post("/transport/rules", ruleData)
  return response.data
}

export const updateTransportRuleEntry = async (ruleId: string, ruleData: Partial<TransportRuleData>): Promise<any> => {
  const response = await api.put(`/transport/rules/${ruleId}`, ruleData)
  return response.data
}

export const deleteTransportRuleEntry = async (ruleId: string): Promise<void> => {
  await api.delete(`/transport/rules/${ruleId}`)
}

// Fonction pour la recommandation de véhicule
/**
 * Obtient une recommandation de véhicule pour une livraison
 * @param deliveryData Données de la livraison
 * @returns Recommandation de véhicule
 */
export const getVehicleRecommendationForDelivery = async (deliveryData: {
  cargo_category: CargoCategory
  distance: number
  weight?: number
  volume?: number
  is_fragile?: boolean
  is_urgent?: boolean
  weather_condition?: number
}): Promise<VehicleRecommendation> => {
  try {
    const response = await api.post("/transport/recommend", deliveryData)
    return response.data
  } catch (error) {
    console.error("Error getting vehicle recommendation:", error)
    throw error
  }
}

// Exporter d'autres fonctions d'API au besoin
export default api
