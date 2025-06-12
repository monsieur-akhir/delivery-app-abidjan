import { api } from './api'
import { 
  Delivery, 
  DeliveryCreateRequest, 
  DeliveryUpdateRequest,
  DeliveryStatus,
  DeliveryEstimate,
  TrackingUpdate 
} from '../types/models'

export interface DeliverySearchParams {
  status?: DeliveryStatus
  skip?: number
  limit?: number
  start_date?: string
  end_date?: string
}

export interface PriceEstimateRequest {
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number
  delivery_lng: number
  package_weight?: number
  cargo_category?: string
  is_fragile?: boolean
  is_express?: boolean
}

export interface CourierAssignmentRequest {
  delivery_id: number
  courier_id: number
  estimated_pickup_time?: string
  estimated_delivery_time?: string
}

export class DeliveryService {
  // Récupérer les livraisons d'un utilisateur
  static async getUserDeliveries(
    userId: number, 
    params?: DeliverySearchParams
  ): Promise<Delivery[]> {
    try {
      const response = await api.get(`/api/v1/deliveries/user/${userId}`, { params })
      return response.data
    } catch (error) {
      console.error('Error fetching user deliveries:', error)
      throw error
    }
  }

  // Récupérer toutes les livraisons (pour les coursiers)
  static async getAvailableDeliveries(params?: DeliverySearchParams): Promise<Delivery[]> {
    try {
      const response = await api.get('/api/v1/deliveries/available', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching available deliveries:', error)
      throw error
    }
  }

  // Récupérer une livraison par ID
  static async getDeliveryById(deliveryId: number): Promise<Delivery> {
    try {
      const response = await api.get(`/api/v1/deliveries/${deliveryId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching delivery:', error)
      throw error
    }
  }

  // Créer une nouvelle livraison
  static async createDelivery(deliveryData: DeliveryCreateRequest): Promise<Delivery> {
    try {
      const response = await api.post('/api/v1/deliveries', deliveryData)
      return response.data
    } catch (error) {
      console.error('Error creating delivery:', error)
      throw error
    }
  }

  // Mettre à jour une livraison
  static async updateDelivery(
    deliveryId: number, 
    updateData: DeliveryUpdateRequest
  ): Promise<Delivery> {
    try {
      const response = await api.put(`/api/v1/deliveries/${deliveryId}`, updateData)
      return response.data
    } catch (error) {
      console.error('Error updating delivery:', error)
      throw error
    }
  }

  // Estimer le prix d'une livraison
  static async estimatePrice(request: PriceEstimateRequest): Promise<DeliveryEstimate> {
    try {
      const response = await api.post('/api/v1/deliveries/price-estimate', request)
      return response.data
    } catch (error) {
      console.error('Error estimating price:', error)
      throw error
    }
  }

  // Accepter une livraison (pour les coursiers)
  static async acceptDelivery(deliveryId: number): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/accept`)
      return response.data
    } catch (error) {
      console.error('Error accepting delivery:', error)
      throw error
    }
  }

  // Rejeter une livraison (pour les coursiers)
  static async rejectDelivery(deliveryId: number, reason?: string): Promise<void> {
    try {
      await api.post(`/api/v1/deliveries/${deliveryId}/reject`, { reason })
    } catch (error) {
      console.error('Error rejecting delivery:', error)
      throw error
    }
  }

  // Commencer la collecte
  static async startPickup(deliveryId: number): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/start-pickup`)
      return response.data
    } catch (error) {
      console.error('Error starting pickup:', error)
      throw error
    }
  }

  // Confirmer la collecte
  static async confirmPickup(deliveryId: number): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/confirm-pickup`)
      return response.data
    } catch (error) {
      console.error('Error confirming pickup:', error)
      throw error
    }
  }

  // Commencer la livraison
  static async startDelivery(deliveryId: number): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/start-delivery`)
      return response.data
    } catch (error) {
      console.error('Error starting delivery:', error)
      throw error
    }
  }

  // Confirmer la livraison
  static async confirmDelivery(
    deliveryId: number, 
    confirmationCode?: string,
    photo?: string
  ): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/confirm-delivery`, {
        confirmation_code: confirmationCode,
        delivery_photo: photo
      })
      return response.data
    } catch (error) {
      console.error('Error confirming delivery:', error)
      throw error
    }
  }

  // Annuler une livraison
  static async cancelDelivery(deliveryId: number, reason: string): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/cancel`, { reason })
      return response.data
    } catch (error) {
      console.error('Error cancelling delivery:', error)
      throw error
    }
  }

  // Récupérer le suivi en temps réel
  static async getTrackingUpdates(deliveryId: number): Promise<TrackingUpdate[]> {
    try {
      const response = await api.get(`/api/v1/deliveries/${deliveryId}/tracking`)
      return response.data
    } catch (error) {
      console.error('Error fetching tracking updates:', error)
      throw error
    }
  }

  // Mettre à jour la position du coursier
  static async updateCourierLocation(
    deliveryId: number, 
    latitude: number, 
    longitude: number
  ): Promise<void> {
    try {
      await api.post(`/api/v1/deliveries/${deliveryId}/location`, {
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating courier location:', error)
      throw error
    }
  }

  // Assigner un coursier à une livraison
  static async assignCourier(assignmentData: CourierAssignmentRequest): Promise<Delivery> {
    try {
      const response = await api.post('/api/v1/deliveries/assign-courier', assignmentData)
      return response.data
    } catch (error) {
      console.error('Error assigning courier:', error)
      throw error
    }
  }

  // Récupérer les livraisons actives du client
  static async getActiveClientDeliveries(clientId: number): Promise<Delivery[]> {
    try {
      const response = await api.get(`/api/v1/client/deliveries/active?client_id=${clientId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching active client deliveries:', error)
      throw error
    }
  }

  // Récupérer les livraisons actives du coursier
  static async getActiveCourierDeliveries(courierId: number): Promise<Delivery[]> {
    try {
      const response = await api.get(`/api/v1/courier/deliveries/active?courier_id=${courierId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching active courier deliveries:', error)
      throw error
    }
  }

  // Rechercher des livraisons
  static async searchDeliveries(query: string, filters?: DeliverySearchParams): Promise<Delivery[]> {
    try {
      const params = { q: query, ...filters }
      const response = await api.get('/api/v1/deliveries/search', { params })
      return response.data
    } catch (error) {
      console.error('Error searching deliveries:', error)
      throw error
    }
  }

  // Récupérer les statistiques de livraison
  static async getDeliveryStats(
    userId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<any> {
    try {
      const params = { 
        user_id: userId, 
        start_date: startDate, 
        end_date: endDate 
      }
      const response = await api.get('/api/v1/deliveries/stats', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching delivery stats:', error)
      throw error
    }
  }

  // Obtenir les directions pour une livraison
  static async getDeliveryDirections(
    deliveryId: number,
    currentLat: number,
    currentLng: number
  ): Promise<any> {
    try {
      const response = await api.get(`/api/v1/deliveries/${deliveryId}/directions`, {
        params: { current_lat: currentLat, current_lng: currentLng }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching delivery directions:', error)
      throw error
    }
  }

  // Envoyer un message concernant une livraison
  static async sendDeliveryMessage(
    deliveryId: number,
    message: string,
    recipientType: 'client' | 'courier'
  ): Promise<void> {
    try {
      await api.post(`/api/v1/deliveries/${deliveryId}/message`, {
        message,
        recipient_type: recipientType
      })
    } catch (error) {
      console.error('Error sending delivery message:', error)
      throw error
    }
  }

  // Signaler un problème avec une livraison
  static async reportDeliveryIssue(
    deliveryId: number,
    issueType: string,
    description: string,
    photos?: string[]
  ): Promise<void> {
    try {
      await api.post(`/api/v1/deliveries/${deliveryId}/report-issue`, {
        issue_type: issueType,
        description,
        photos
      })
    } catch (error) {
      console.error('Error reporting delivery issue:', error)
      throw error
    }
  }
}

export default DeliveryService