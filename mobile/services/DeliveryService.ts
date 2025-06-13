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

  // Confirmer la livraison côté client avec notation
  static async clientConfirmDelivery(
    deliveryId: number,
    rating: number,
    comment?: string
  ): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/client-confirm`, {
        rating,
        comment
      })
      return response.data
    } catch (error) {
      console.error('Error confirming delivery:', error)
      throw error
    }
  }

  // Obtenir les coursiers suggérés pour une livraison
  static async getSuggestedCouriers(
    deliveryId: number,
    maxDistance: number = 10,
    limit: number = 5
  ): Promise<any> {
    try {
      const response = await api.get(`/api/v1/deliveries/${deliveryId}/suggested-couriers`, {
        params: { max_distance: maxDistance, limit }
      })
      return response.data
    } catch (error) {
      console.error('Error getting suggested couriers:', error)
      throw error
    }
  }

  // Assignment automatique de livraison
  static async autoAssignDelivery(deliveryId: number): Promise<any> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/auto-assign`)
      return response.data
    } catch (error) {
      console.error('Error auto-assigning delivery:', error)
      throw error
    }
  }

  // Récupérer la timeline des statuts
  static async getDeliveryStatusTimeline(deliveryId: number): Promise<any> {
    try {
      const response = await api.get(`/api/v1/deliveries/${deliveryId}/status-timeline`)
      return response.data
    } catch (error) {
      console.error('Error fetching status timeline:', error)
      throw error
    }
  }

  // Placer une enchère sur une livraison
  static async placeBid(bidData: {
    delivery_id: number
    proposed_price: number
    estimated_duration?: number
  }): Promise<any> {
    try {
      const response = await api.post(`/api/v1/deliveries/${bidData.delivery_id}/bid`, {
        amount: bidData.proposed_price,
        estimated_time: bidData.estimated_duration
      })
      return response.data
    } catch (error) {
      console.error('Error placing bid:', error)
      throw error
    }
  }

  // Récupérer les enchères pour une livraison
  static async getDeliveryBids(deliveryId: number): Promise<any[]> {
    try {
      const response = await api.get(`/api/v1/deliveries/${deliveryId}/bids`)
      return response.data
    } catch (error) {
      console.error('Error fetching delivery bids:', error)
      throw error
    }
  }

  // Accepter une enchère
  static async acceptBid(deliveryId: number, bidId: number): Promise<Delivery> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/accept-bid/${bidId}`)
      return response.data
    } catch (error) {
      console.error('Error accepting bid:', error)
      throw error
    }
  }

  // Récupérer les promotions applicables
  static async getApplicablePromotions(orderValue: number, zoneId?: number): Promise<any[]> {
    try {
      const params = { order_value: orderValue }
      if (zoneId) params.zone_id = zoneId
      const response = await api.get('/api/v1/promotions/applicable', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching applicable promotions:', error)
      throw error
    }
  }

  // Appliquer un code promo
  static async applyPromotionCode(deliveryId: number, promoCode: string): Promise<any> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/apply-promotion`, {
        promotion_code: promoCode
      })
      return response.data
    } catch (error) {
      console.error('Error applying promotion code:', error)
      throw error
    }
  }

  // Valider un code promo
  static async validatePromotionCode(promoCode: string, orderValue: number): Promise<any> {
    try {
      const response = await api.post('/api/v1/promotions/validate-code', {
        code: promoCode,
        order_value: orderValue
      })
      return response.data
    } catch (error) {
      console.error('Error validating promotion code:', error)
      throw error
    }
  }

  // Obtenir les zones de livraison
  static async getDeliveryZones(lat: number, lng: number): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/zones/locate', {
        params: { lat, lng }
      })
      return response.data.zones
    } catch (error) {
      console.error('Error fetching delivery zones:', error)
      throw error
    }
  }

  // Calculer le prix avec zones et promotions
  static async calculateZonePricing(
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number,
    packageWeight?: number,
    isExpress: boolean = false
  ): Promise<any> {
    try {
      const response = await api.post('/api/v1/zones/calculate-price', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        package_weight: packageWeight,
        is_express: isExpress
      })
      return response.data
    } catch (error) {
      console.error('Error calculating zone pricing:', error)
      throw error
    }
  }

  // Récupérer les livraisons actives d'un coursier
  static async getCourierActiveDeliveries(): Promise<Delivery[]> {
    try {
      const response = await api.get('/api/v1/courier/active-deliveries')
      return response.data
    } catch (error) {
      console.error('Error fetching courier active deliveries:', error)
      throw error
    }
  }

  // Récupérer le statut d'un coursier
  static async getCourierStatus(): Promise<{ is_online: boolean }> {
    try {
      const response = await api.get('/api/v1/courier/status')
      return response.data
    } catch (error) {
      console.error('Error fetching courier status:', error)
      throw error
    }
  }

  // Mettre à jour le statut d'un coursier
  static async updateCourierStatus(isOnline: boolean): Promise<{ is_online: boolean }> {
    try {
      const response = await api.put('/api/v1/courier/status', { is_online: isOnline })
      return response.data
    } catch (error) {
      console.error('Error updating courier status:', error)
      throw error
    }
  }

  // Récupérer les statistiques d'un coursier
  static async getCourierStats(): Promise<{
    total_deliveries: number
    completed_today: number
    earnings_today: number
    average_rating: number
    current_earnings: number
  }> {
    try {
      const response = await api.get('/api/v1/courier/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching courier stats:', error)
      throw error
    }
  }
}

export default DeliveryService