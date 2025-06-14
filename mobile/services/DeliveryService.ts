import api from './api'
import type {
  Delivery,
  DeliveryStatus,
  Bid,
  TrackingPoint,
  AvailableDelivery,
  DeliveryFilters,
  DeliverySearchParams,
  DeliveryCreateRequest,
  DeliveryUpdateRequest,
  BidCreateRequest,
  TrackingPointRequest,
  PriceEstimateData,
  VehicleRecommendationData,
  VehicleRecommendation,
  ExpressDeliveryRequest,
  CollaborativeDeliveryRequest,
  CourierStats
} from '../types'

interface VehicleType {
  bicycle: 'bicycle'
  motorcycle: 'motorcycle'
  scooter: 'scooter'
  car: 'car'
  van: 'van'
  truck: 'truck'
}

class DeliveryService {
  // Méthodes de base pour les livraisons
  static async getUserDeliveries(
    userId?: number,
    filters?: DeliveryFilters
  ): Promise<Delivery[]> {
    try {
      const params = new URLSearchParams()
      if (userId) params.append('user_id', userId.toString())
      if (filters?.status) params.append('status', filters.status)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)
      if (filters?.commune) params.append('commune', filters.commune)

      const response = await api.get(`/deliveries?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons:', error)
      throw error
    }
  }

  static async getDeliveryById(id: string): Promise<Delivery> {
    try {
      const response = await api.get(`/deliveries/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la livraison:', error)
      throw error
    }
  }

  static async createDelivery(deliveryData: DeliveryCreateRequest): Promise<Delivery> {
    try {
      const response = await api.post('/deliveries', deliveryData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de la livraison:', error)
      throw error
    }
  }

  static async updateDelivery(
    id: string,
    updateData: DeliveryUpdateRequest
  ): Promise<Delivery> {
    try {
      const response = await api.put(`/deliveries/${id}`, updateData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la livraison:', error)
      throw error
    }
  }

  static async cancelDelivery(id: string, reason?: string): Promise<void> {
    try {
      await api.post(`/deliveries/${id}/cancel`, { reason })
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la livraison:', error)
      throw error
    }
  }

  // Méthodes pour les enchères
  static async getDeliveryBids(deliveryId: string): Promise<Bid[]> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/bids`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des enchères:', error)
      throw error
    }
  }

  static async createBid(bidData: BidCreateRequest): Promise<Bid> {
    try {
      const response = await api.post('/bids', bidData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'enchère:', error)
      throw error
    }
  }

  static async submitBid(bidData: BidCreateRequest): Promise<Bid> {
    return this.createBid(bidData)
  }

  static async getDeliveryDetails(id: string): Promise<Delivery> {
    try {
      const response = await api.get(`/deliveries/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error)
      throw error
    }
  }

  static async acceptBid(deliveryId: string, bidId: number): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/bids/${bidId}/accept`)
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'enchère:', error)
      throw error
    }
  }

  static async declineBid(deliveryId: string, bidId: number, reason?: string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/bids/${bidId}/decline`, { reason })
    } catch (error) {
      console.error('Erreur lors du refus de l\'enchère:', error)
      throw error
    }
  }

  // Méthodes de suivi
  static async updateCourierLocation(
    deliveryId: string,
    lat: number,
    lng: number
  ): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/location`, { lat, lng })
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position:', error)
      throw error
    }
  }

  static async addTrackingPoint(trackingData: TrackingPointRequest): Promise<TrackingPoint> {
    try {
      const response = await api.post('/tracking-points', trackingData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'ajout du point de suivi:', error)
      throw error
    }
  }

  static async getTrackingHistory(deliveryId: string): Promise<TrackingPoint[]> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/tracking`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }
  }

  // Méthodes pour les coursiers
  static async getAvailableDeliveries(searchParams?: DeliverySearchParams): Promise<AvailableDelivery[]> {
    try {
      const params = new URLSearchParams()
      if (searchParams?.commune) params.append('commune', searchParams.commune)
      if (searchParams?.max_distance) params.append('max_distance', searchParams.max_distance.toString())
      if (searchParams?.min_price) params.append('min_price', searchParams.min_price.toString())
      if (searchParams?.max_price) params.append('max_price', searchParams.max_price.toString())
      if (searchParams?.vehicle_type) params.append('vehicle_type', searchParams.vehicle_type)

      const response = await api.get(`/courier/available-deliveries?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons disponibles:', error)
      throw error
    }
  }

  static async getCourierActiveDeliveries(): Promise<Delivery[]> {
    try {
      const response = await api.get('/courier/active-deliveries')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons actives:', error)
      throw error
    }
  }

  static async updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery> {
    try {
      const response = await api.put(`/deliveries/${deliveryId}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      throw error
    }
  }

  // Méthodes pour les estimations
  static async getPriceEstimate(estimateData: PriceEstimateData): Promise<number> {
    try {
      const response = await api.post('/deliveries/estimate-price', estimateData)
      return response.data.estimated_price
    } catch (error) {
      console.error('Erreur lors de l\'estimation du prix:', error)
      throw error
    }
  }

  static async getVehicleRecommendation(data: VehicleRecommendationData): Promise<VehicleRecommendation> {
    try {
      const response = await api.post('/deliveries/recommend-vehicle', data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la recommandation de véhicule:', error)
      throw error
    }
  }

  // Méthodes pour les livraisons express
  static async createExpressDelivery(data: ExpressDeliveryRequest): Promise<Delivery> {
    try {
      const response = await api.post('/deliveries/express', data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de la livraison express:', error)
      throw error
    }
  }

  static async getExpressDeliveries(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.commune) params.append('commune', filters.commune)

      const response = await api.get(`/deliveries/express?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons express:', error)
      throw error
    }
  }

  static async assignCourierToExpress(deliveryId: string, courierId: number): Promise<void> {
    try {
      await api.post(`/deliveries/express/${deliveryId}/assign`, { courier_id: courierId })
    } catch (error) {
      console.error('Erreur lors de l\'assignation du coursier:', error)
      throw error
    }
  }

  static async completeExpressDelivery(deliveryId: string): Promise<void> {
    try {
      await api.post(`/deliveries/express/${deliveryId}/complete`)
    } catch (error) {
      console.error('Erreur lors de la finalisation de la livraison express:', error)
      throw error
    }
  }

  // Méthodes pour les livraisons collaboratives
  static async createCollaborativeDelivery(data: CollaborativeDeliveryRequest): Promise<Delivery> {
    try {
      const response = await api.post('/deliveries/collaborative', data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de la livraison collaborative:', error)
      throw error
    }
  }

  static async getCollaborativeDeliveries(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.commune) params.append('commune', filters.commune)

      const response = await api.get(`/deliveries/collaborative?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons collaboratives:', error)
      throw error
    }
  }

  static async joinCollaborativeDelivery(id: string, message?: string): Promise<void> {
    try {
      await api.post(`/deliveries/collaborative/${id}/join`, { message })
    } catch (error) {
      console.error('Erreur lors de la participation à la livraison collaborative:', error)
      throw error
    }
  }

  static async leaveCollaborativeDelivery(id: string): Promise<void> {
    try {
      await api.post(`/deliveries/collaborative/${id}/leave`)
    } catch (error) {
      console.error('Erreur lors de l\'abandon de la livraison collaborative:', error)
      throw error
    }
  }

  // Méthodes pour l'historique
  static async getClientDeliveryHistory(filters?: any): Promise<Delivery[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)

      const response = await api.get(`/client/delivery-history?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique client:', error)
      throw error
    }
  }

  static async getCourierDeliveryHistory(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)

      const response = await api.get(`/courier/delivery-history?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique coursier:', error)
      throw error
    }
  }

  // Méthodes ajoutées pour corriger les erreurs
  static async getActiveDeliveries(): Promise<Delivery[]> {
    try {
      const response = await api.get('/deliveries/active')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons actives:', error)
      throw error
    }
  }

  static async placeBid(deliveryId: number, bidData: any): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/bids`, bidData)
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'enchère:', error)
      throw error
    }
  }

  static async clientConfirmDelivery(deliveryId: number, rating: number, comment?: string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/confirm`, {
        rating,
        comment
      })
    } catch (error) {
      console.error('Erreur lors de la confirmation de livraison:', error)
      throw error
    }
  }

  // Méthodes utilitaires
  static async getCourierLocation(deliveryId: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/courier-location`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la position du coursier:', error)
      throw error
    }
  }

  static async getETA(deliveryId: string): Promise<{ eta_minutes: number; distance_remaining: number }> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/eta`)
      return response.data
    } catch (error) {
      console.error('Erreur lors du calcul de l\'ETA:', error)
      throw error
    }
  }

  static async getDeliveryRoute(deliveryId: string): Promise<{ coordinates: number[][]; distance: number; duration: number }> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/route`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'itinéraire:', error)
      throw error
    }
  }

  // Méthodes manquantes pour les écrans
  static async acceptDelivery(deliveryId: number | string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/accept`)
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la livraison:', error)
      throw error
    }
  }

  static async getCourierStatus(): Promise<any> {
    try {
      const response = await api.get('/courier/status')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du statut coursier:', error)
      throw error
    }
  }

  static async getCourierStats(): Promise<CourierStats> {
    try {
      const response = await api.get('/courier/stats')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }

  static async updateCourierStatus(status: string): Promise<void> {
    try {
      await api.put('/courier/status', { status })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      throw error
    }
  }

  static async getSuggestedCouriers(deliveryId: string): Promise<any> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/suggested-couriers`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des coursiers suggérés:', error)
      throw error
    }
  }

  static async autoAssignDelivery(deliveryId: string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/auto-assign`)
    } catch (error) {
      console.error('Erreur lors de l\'assignation automatique:', error)
      throw error
    }
  }

  static async assignCourier(data: { delivery_id: string; courier_id: string }): Promise<void> {
    try {
      await api.post('/deliveries/assign-courier', data)
    } catch (error) {
      console.error('Erreur lors de l\'assignation du coursier:', error)
      throw error
    }
  }
}

export default DeliveryService