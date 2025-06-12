import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/environment'
import type { 
  Delivery, 
  DeliveryStatus, 
  Bid, 
  TrackingPoint, 
  CollaborativeDelivery,
  ExpressDelivery,
  DeliveryEstimate,
  Weather,
  Coordinates
} from '../types/models'

// Types pour les requêtes de livraison
export interface DeliveryCreateRequest {
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

export interface DeliveryUpdateRequest {
  pickup_address?: string
  pickup_commune?: string
  pickup_lat?: number
  pickup_lng?: number
  delivery_address?: string
  delivery_commune?: string
  delivery_lat?: number
  delivery_lng?: number
  description?: string
  package_size?: string
  package_type?: string
  is_fragile?: boolean
  is_urgent?: boolean
  proposed_price?: number
  notes?: string
  cargo_category?: string
  required_vehicle_type?: string
}

export interface BidCreateRequest {
  delivery_id: number
  proposed_price: number
  estimated_duration?: number
  message?: string
}

export interface TrackingPointRequest {
  delivery_id: number
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  timestamp?: string
}

export interface DeliveryFilters {
  status?: DeliveryStatus
  commune?: string
  search?: string
  start_date?: string
  end_date?: string
  skip?: number
  limit?: number
}

export interface PriceEstimateRequest {
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number
  delivery_lng: number
  package_size: string
  package_type?: string
  is_urgent?: boolean
  is_fragile?: boolean
  vehicle_type?: string
  weather_condition?: string | number
}

export interface ExpressDeliveryRequest {
  pickup_address: string
  pickup_commune: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_commune: string
  delivery_lat: number
  delivery_lng: number
  description: string
  recipient_name: string
  recipient_phone: string
  package_size: string
  is_fragile: boolean
  special_instructions?: string
}

export interface CollaborativeDeliveryRequest {
  title: string
  description: string
  pickup_address: string
  pickup_commune: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_commune: string
  delivery_lat: number
  delivery_lng: number
  max_participants: number
  proposed_price_per_person: number
  deadline: string
  package_size: string
  special_requirements?: string
}

class DeliveryService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('@livraison_abidjan:auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  // === LIVRAISONS STANDARD ===

  /**
   * Création d'une nouvelle livraison
   */
  async createDelivery(deliveryData: DeliveryCreateRequest): Promise<Delivery> {
    try {
      const response = await this.api.post('/deliveries/', deliveryData)
      return response.data
    } catch (error) {
      console.error('Create delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des livraisons avec filtres
   */
  async getDeliveries(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      const response = await this.api.get('/deliveries/', { params: filters })
      return response.data
    } catch (error) {
      console.error('Get deliveries error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération d'une livraison par ID
   */
  async getDelivery(deliveryId: number): Promise<Delivery> {
    try {
      const response = await this.api.get(`/deliveries/${deliveryId}`)
      return response.data
    } catch (error) {
      console.error('Get delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour d'une livraison
   */
  async updateDelivery(deliveryId: number, updateData: DeliveryUpdateRequest): Promise<Delivery> {
    try {
      const response = await this.api.put(`/deliveries/${deliveryId}`, updateData)
      return response.data
    } catch (error) {
      console.error('Update delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'une livraison
   */
  async deleteDelivery(deliveryId: number): Promise<void> {
    try {
      await this.api.delete(`/deliveries/${deliveryId}`)
    } catch (error) {
      console.error('Delete delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour du statut d'une livraison
   */
  async updateDeliveryStatus(deliveryId: number, status: DeliveryStatus): Promise<Delivery> {
    try {
      const response = await this.api.put(`/deliveries/${deliveryId}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Update delivery status error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Annulation d'une livraison
   */
  async cancelDelivery(deliveryId: number, reason?: string): Promise<void> {
    try {
      await this.api.post(`/deliveries/${deliveryId}/cancel`, { reason })
    } catch (error) {
      console.error('Cancel delivery error:', error)
      throw this.handleError(error)
    }
  }

  // === ESTIMATION DE PRIX ===

  /**
   * Estimation du prix d'une livraison
   */
  async getPriceEstimate(estimateData: PriceEstimateRequest): Promise<DeliveryEstimate> {
    try {
      const response = await this.api.post('/deliveries/price-estimate', estimateData)
      return response.data
    } catch (error) {
      console.error('Get price estimate error:', error)
      throw this.handleError(error)
    }
  }

  // === ENCHÈRES ===

  /**
   * Création d'une enchère
   */
  async createBid(bidData: BidCreateRequest): Promise<Bid> {
    try {
      const response = await this.api.post('/deliveries/bids', bidData)
      return response.data
    } catch (error) {
      console.error('Create bid error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des enchères pour une livraison
   */
  async getDeliveryBids(deliveryId: number): Promise<Bid[]> {
    try {
      const response = await this.api.get(`/deliveries/${deliveryId}/bids`)
      return response.data
    } catch (error) {
      console.error('Get delivery bids error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Acceptation d'une enchère
   */
  async acceptBid(deliveryId: number, bidId: number): Promise<void> {
    try {
      await this.api.post(`/deliveries/${deliveryId}/bids/${bidId}/accept`)
    } catch (error) {
      console.error('Accept bid error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Rejet d'une enchère
   */
  async rejectBid(deliveryId: number, bidId: number, reason?: string): Promise<void> {
    try {
      await this.api.post(`/deliveries/${deliveryId}/bids/${bidId}/reject`, { reason })
    } catch (error) {
      console.error('Reject bid error:', error)
      throw this.handleError(error)
    }
  }

  // === SUIVI EN TEMPS RÉEL ===

  /**
   * Ajout d'un point de suivi
   */
  async addTrackingPoint(trackingData: TrackingPointRequest): Promise<TrackingPoint> {
    try {
      const response = await this.api.post('/deliveries/tracking', trackingData)
      return response.data
    } catch (error) {
      console.error('Add tracking point error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des points de suivi d'une livraison
   */
  async getTrackingPoints(deliveryId: number): Promise<TrackingPoint[]> {
    try {
      const response = await this.api.get(`/deliveries/${deliveryId}/tracking`)
      return response.data
    } catch (error) {
      console.error('Get tracking points error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération de la position actuelle du coursier
   */
  async getCourierLocation(deliveryId: number): Promise<Coordinates> {
    try {
      const response = await this.api.get(`/deliveries/${deliveryId}/courier-location`)
      return response.data
    } catch (error) {
      console.error('Get courier location error:', error)
      throw this.handleError(error)
    }
  }

  // === LIVRAISONS EXPRESS ===

  /**
   * Création d'une livraison express
   */
  async createExpressDelivery(deliveryData: ExpressDeliveryRequest): Promise<ExpressDelivery> {
    try {
      const response = await this.api.post('/express/', deliveryData)
      return response.data
    } catch (error) {
      console.error('Create express delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des livraisons express
   */
  async getExpressDeliveries(filters?: DeliveryFilters): Promise<ExpressDelivery[]> {
    try {
      const response = await this.api.get('/express/', { params: filters })
      return response.data
    } catch (error) {
      console.error('Get express deliveries error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Attribution d'un coursier à une livraison express
   */
  async assignCourierToExpress(deliveryId: number, courierId?: number): Promise<ExpressDelivery> {
    try {
      const response = await this.api.post(`/express/${deliveryId}/assign`, { courier_id: courierId })
      return response.data
    } catch (error) {
      console.error('Assign courier to express error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Finalisation d'une livraison express
   */
  async completeExpressDelivery(deliveryId: number): Promise<ExpressDelivery> {
    try {
      const response = await this.api.put(`/express/${deliveryId}/complete`)
      return response.data
    } catch (error) {
      console.error('Complete express delivery error:', error)
      throw this.handleError(error)
    }
  }

  // === LIVRAISONS COLLABORATIVES ===

  /**
   * Création d'une livraison collaborative
   */
  async createCollaborativeDelivery(deliveryData: CollaborativeDeliveryRequest): Promise<CollaborativeDelivery> {
    try {
      const response = await this.api.post('/collaborative/', deliveryData)
      return response.data
    } catch (error) {
      console.error('Create collaborative delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des livraisons collaboratives
   */
  async getCollaborativeDeliveries(filters?: DeliveryFilters): Promise<CollaborativeDelivery[]> {
    try {
      const response = await this.api.get('/collaborative/', { params: filters })
      return response.data
    } catch (error) {
      console.error('Get collaborative deliveries error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Participation à une livraison collaborative
   */
  async joinCollaborativeDelivery(deliveryId: number, message?: string): Promise<void> {
    try {
      await this.api.post(`/collaborative/${deliveryId}/join`, { message })
    } catch (error) {
      console.error('Join collaborative delivery error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Annulation de participation à une livraison collaborative
   */
  async leaveCollaborativeDelivery(deliveryId: number): Promise<void> {
    try {
      await this.api.post(`/collaborative/${deliveryId}/leave`)
    } catch (error) {
      console.error('Leave collaborative delivery error:', error)
      throw this.handleError(error)
    }
  }

  // === HISTORIQUE ET STATISTIQUES ===

  /**
   * Récupération de l'historique des livraisons pour un client
   */  async getClientDeliveryHistory(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      // Use the general deliveries endpoint with user_role filter
      const params = { ...filters, user_role: 'client' };
      const response = await this.api.get('/deliveries', { params })
      return response.data
    } catch (error) {
      console.error('Get client delivery history error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération de l'historique des livraisons pour un coursier
   */  async getCourierDeliveryHistory(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      // Use the general deliveries endpoint with user_role filter
      const params = { ...filters, user_role: 'courier' };
      const response = await this.api.get('/deliveries', { params })
      return response.data
    } catch (error) {
      console.error('Get courier delivery history error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des livraisons disponibles pour un coursier
   */
  async getAvailableDeliveries(commune?: string): Promise<Delivery[]> {
    try {
      const params = commune ? { commune } : undefined
      const response = await this.api.get('/courier/deliveries/available', { params })
      return response.data
    } catch (error) {
      console.error('Get available deliveries error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des livraisons actives pour un client
   */
  async getActiveDeliveries(): Promise<Delivery[]> {
    try {
      const response = await this.api.get('/client/deliveries/active')
      return response.data
    } catch (error) {
      console.error('Get active deliveries error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des statistiques de livraison
   */
  async getDeliveryStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await this.api.get(`/deliveries/stats`, { params: { period } })
      return response.data
    } catch (error) {
      console.error('Get delivery stats error:', error)
      throw this.handleError(error)
    }
  }

  // === SERVICES GÉOGRAPHIQUES ===

  /**
   * Géocodage d'une adresse
   */
  async geocodeAddress(address: string): Promise<Coordinates[]> {
    try {
      const response = await this.api.get('/geo/geocode', { 
        params: { address: encodeURIComponent(address) }
      })
      return response.data
    } catch (error) {
      console.error('Geocode address error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Calcul d'itinéraire
   */
  async getDirections(startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> {
    try {
      const response = await this.api.get('/directions', {
        params: { start_lat: startLat, start_lng: startLng, end_lat: endLat, end_lng: endLng }
      })
      return response.data
    } catch (error) {
      console.error('Get directions error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des informations de trafic
   */
  async getTrafficInfo(startLat: number, startLng: number, endLat: number, endLng: number): Promise<any> {
    try {
      const response = await this.api.get('/geo/traffic', {
        params: { startLat, startLng, endLat, endLng }
      })
      return response.data
    } catch (error) {
      console.error('Get traffic info error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des données météo
   */
  async getWeatherData(latitude: number, longitude: number, commune?: string): Promise<Weather> {
    try {
      const params: any = { lat: latitude, lng: longitude }
      if (commune) params.commune = commune
      
      const response = await this.api.get('/weather', { params })
      return response.data
    } catch (error) {
      console.error('Get weather data error:', error)
      throw this.handleError(error)
    }
  }

  // === MÉTHODES UTILITAIRES ===

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): Error {
    let message = 'Une erreur est survenue'

    if (error.response?.data?.detail) {
      message = error.response.data.detail
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    return new Error(message)
  }
}

export default new DeliveryService()
