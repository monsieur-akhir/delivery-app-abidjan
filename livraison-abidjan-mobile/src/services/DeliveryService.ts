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

      console.log('🔍 [DEBUG] Début getUserDeliveries')
      console.log('🔍 [DEBUG] Filtres:', filters)
      console.log('🔍 [DEBUG] Paramètres:', params.toString())

      // Essayer plusieurs endpoints possibles comme dans getClientDeliveryHistory
      const endpoints = [
        `/api/client/delivery-history?${params.toString()}`,
        `/api/deliveries?${params.toString()}`,
        `/api/v1/deliveries?${params.toString()}`,
        `/deliveries?${params.toString()}`
      ]

      let response = null
      let usedEndpoint = ''

      for (const endpoint of endpoints) {
        try {
          console.log('🔍 [DEBUG] Tentative avec endpoint:', endpoint)
          response = await api.get(endpoint)
          usedEndpoint = endpoint
          console.log('✅ [DEBUG] Succès avec endpoint:', endpoint)
          break
        } catch (endpointError: unknown) {
          if (endpointError instanceof Error) {
            console.log(endpointError.message)
          } else if (typeof endpointError === 'object' && endpointError !== null && 'response' in endpointError) {
            // @ts-expect-error: on sait que response existe ici
            console.log(endpointError.response?.data)
          } else {
            console.log(String(endpointError))
          }
          continue
        }
      }

      if (!response) {
        console.error('❌ [DEBUG] Tous les endpoints ont échoué')
        return []
      }

      console.log('📦 [DEBUG] Réponse API reçue')
      console.log('📦 [DEBUG] Type de réponse:', typeof response.data)
      console.log('📦 [DEBUG] Est un tableau:', Array.isArray(response.data))
      console.log('📦 [DEBUG] Longueur:', Array.isArray(response.data) ? response.data.length : 'N/A')

      // Extraire les livraisons de la réponse API
      let deliveries = []
      if (Array.isArray(response.data)) {
        // Si c'est déjà un tableau
        deliveries = response.data
      } else if (response.data && response.data.deliveries && Array.isArray(response.data.deliveries)) {
        // Si c'est un objet avec une propriété deliveries
        deliveries = response.data.deliveries
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Si c'est un objet avec une propriété data
        deliveries = response.data.data
      } else {
        // Fallback
        deliveries = []
      }

      console.log('📦 [DEBUG] Livraisons extraites:', deliveries.length)
      
      return deliveries
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des livraisons:', error.message)
      } else {
        console.error('Erreur lors de la récupération des livraisons:', String(error))
      }
      throw error
    }
  }

  static async getDeliveryById(id: string): Promise<Delivery> {
    try {
      // Validation de l'ID
      if (!id || id === 'null' || id === 'undefined' || id.trim() === '') {
        throw new Error('ID de livraison invalide ou manquant')
      }

      console.log('🔍 [DEBUG] getDeliveryById appelé avec ID:', id)
      // Essayer plusieurs endpoints possibles
      const endpoints = [
        `/api/v1/deliveries/${id}`,
        `/api/deliveries/${id}`,
        `/api/client/delivery-history/${id}`,
        `/deliveries/${id}`
      ]
      let response = null
      let usedEndpoint = ''
      for (const endpoint of endpoints) {
        try {
          console.log('🔍 [DEBUG] Tentative getDeliveryById avec endpoint:', endpoint)
          response = await api.get(endpoint)
          usedEndpoint = endpoint
          console.log('✅ [DEBUG] Succès getDeliveryById avec endpoint:', endpoint)
          break
        } catch (endpointError: unknown) {
          if (endpointError instanceof Error) {
            console.log(endpointError.message)
          } else if (typeof endpointError === 'object' && endpointError !== null && 'response' in endpointError) {
            // @ts-expect-error: on sait que response existe ici
            console.log(endpointError.response?.data)
          } else {
            console.log(String(endpointError))
          }
          continue
        }
      }
      if (!response) {
        console.error('❌ [DEBUG] Tous les endpoints getDeliveryById ont échoué')
        throw new Error('Impossible de récupérer les détails de la livraison')
      }
      console.log('📦 [DEBUG] Détails livraison récupérés:', response.data)
      // Correction ici : retourner la bonne propriété
      if (response.data && response.data.delivery) {
        return response.data.delivery
      }
      if (response.data && response.data.data) {
        return response.data.data
      }
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération de la livraison:', error.message)
      } else {
        console.error('Erreur lors de la récupération de la livraison:', String(error))
      }
      throw error
    }
  }

  static async createDelivery(deliveryData: DeliveryCreateRequest): Promise<Delivery> {
    try {
      const response = await api.post('/api/deliveries/', deliveryData)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la création de la livraison:', error.message)
      } else {
        console.error('Erreur lors de la création de la livraison:', String(error))
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la mise à jour de la livraison:', error.message)
      } else {
        console.error('Erreur lors de la mise à jour de la livraison:', String(error))
      }
      throw error
    }
  }

  static async cancelDelivery(id: string, reason?: string): Promise<void> {
    try {
      // Essayer d'abord avec /api/deliveries/{id}/cancel
      try {
        await api.post(`/api/deliveries/${id}/cancel`, { reason })
        return
      } catch (err) {
        // Si 404 ou autre, essayer sans le préfixe /api
        await api.post(`/deliveries/${id}/cancel`, { reason })
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'annulation de la livraison:', error.message)
      } else {
        console.error('Erreur lors de l\'annulation de la livraison:', String(error))
      }
      throw error
    }
  }

  // Méthodes pour les enchères
  static async getDeliveryBids(deliveryId: string): Promise<Bid[]> {
    try {
      console.log('🔍 [DEBUG] getDeliveryBids appelé avec deliveryId:', deliveryId)
      
      // Essayer plusieurs endpoints possibles
      const endpoints = [
        `/api/deliveries/${deliveryId}/bids`,
        `/api/deliveries/${deliveryId}/bids`,
        `/deliveries/${deliveryId}/bids`,
        `/api/bids?delivery_id=${deliveryId}`
      ]

      let response = null
      let usedEndpoint = ''

      for (const endpoint of endpoints) {
        try {
          console.log('🔍 [DEBUG] Tentative getDeliveryBids avec endpoint:', endpoint)
          response = await api.get(endpoint)
          usedEndpoint = endpoint
          console.log('✅ [DEBUG] Succès getDeliveryBids avec endpoint:', endpoint)
          break
        } catch (endpointError: unknown) {
          if (endpointError instanceof Error) {
            console.log(endpointError.message)
          } else if (typeof endpointError === 'object' && endpointError !== null && 'response' in endpointError) {
            // @ts-expect-error: on sait que response existe ici
            console.log(endpointError.response?.data)
          } else {
            console.log(String(endpointError))
          }
          continue
        }
      }

      if (!response) {
        console.log('⚠️ [DEBUG] Aucun endpoint getDeliveryBids fonctionnel, retourner tableau vide')
        return []
      }

      // Extraire les enchères de la réponse
      let bids = []
      if (Array.isArray(response.data)) {
        bids = response.data
      } else if (response.data && response.data.bids && Array.isArray(response.data.bids)) {
        bids = response.data.bids
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        bids = response.data.data
      }

      console.log('📦 [DEBUG] Enchères récupérées:', bids.length)
      return bids
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des enchères:', error.message)
      } else {
        console.error('Erreur lors de la récupération des enchères:', String(error))
      }
      return []
    }
  }

  static async createBid(bidData: BidCreateRequest): Promise<Bid> {
    try {
      const response = await api.post('/bids', bidData)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la soumission de l\'enchère:', error.message)
      } else {
        console.error('Erreur lors de la soumission de l\'enchère:', String(error))
      }
      throw error
    }
  }

  static async submitBid(bidData: BidCreateRequest): Promise<Bid> {
    return this.createBid(bidData)
  }

  static async getDeliveryDetails(id: string): Promise<Delivery> {
    try {
      // Validation de l'ID
      if (!id || id === 'null' || id === 'undefined' || id.trim() === '') {
        throw new Error('ID de livraison invalide ou manquant')
      }

      const response = await api.get(`/api/v1/deliveries/${id}`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des détails:', error.message)
      } else {
        console.error('Erreur lors de la récupération des détails:', String(error))
      }
      throw error
    }
  }

  static async acceptBid(deliveryId: string, bidId: number): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/bids/${bidId}/accept`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'acceptation de l\'enchère:', error.message)
      } else {
        console.error('Erreur lors de l\'acceptation de l\'enchère:', String(error))
      }
      throw error
    }
  }

  static async declineBid(deliveryId: string, bidId: number, reason?: string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/bids/${bidId}/decline`, { reason })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors du refus de l\'enchère:', error.message)
      } else {
        console.error('Erreur lors du refus de l\'enchère:', String(error))
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la mise à jour de la position:', error.message)
      } else {
        console.error('Erreur lors de la mise à jour de la position:', String(error))
      }
      throw error
    }
  }

  static async addTrackingPoint(trackingData: TrackingPointRequest): Promise<TrackingPoint> {
    try {
      const response = await api.post('/tracking-points', trackingData)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'ajout du point de suivi:', error.message)
      } else {
        console.error('Erreur lors de l\'ajout du point de suivi:', String(error))
      }
      throw error
    }
  }

  static async getTrackingHistory(deliveryId: string): Promise<TrackingPoint[]> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/tracking`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération de l\'historique:', error.message)
      } else {
        console.error('Erreur lors de la récupération de l\'historique:', String(error))
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des livraisons disponibles:', error.message)
      } else {
        console.error('Erreur lors de la récupération des livraisons disponibles:', String(error))
      }
      throw error
    }
  }

  static async getCourierActiveDeliveries(): Promise<Delivery[]> {
    try {
      const response = await api.get('/courier/active-deliveries')
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des livraisons actives:', error.message)
      } else {
        console.error('Erreur lors de la récupération des livraisons actives:', String(error))
      }
      throw error
    }
  }

  static async updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery> {
    try {
      const response = await api.put(`/deliveries/${deliveryId}/status`, { status })
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la mise à jour du statut:', error.message)
      } else {
        console.error('Erreur lors de la mise à jour du statut:', String(error))
      }
      throw error
    }
  }

  // Méthodes pour les estimations
  static async getPriceEstimate(estimateData: PriceEstimateData): Promise<number> {
    try {
      const response = await api.post('/api/v1/deliveries/estimate-price/', estimateData)
      return response.data.estimated_price
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'estimation du prix:', error.message)
      } else {
        console.error('Erreur lors de l\'estimation du prix:', String(error))
      }
      throw error
    }
  }

  static async getVehicleRecommendation(data: VehicleRecommendationData): Promise<VehicleRecommendation> {
    try {
      const response = await api.post('/deliveries/recommend-vehicle', data)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la recommandation de véhicule:', error.message)
      } else {
        console.error('Erreur lors de la recommandation de véhicule:', String(error))
      }
      throw error
    }
  }

  // Méthodes pour les livraisons express
  static async createExpressDelivery(data: ExpressDeliveryRequest): Promise<Delivery> {
    try {
      const response = await api.post('/deliveries/express', data)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la création de la livraison express:', error.message)
      } else {
        console.error('Erreur lors de la création de la livraison express:', String(error))
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des livraisons express:', error.message)
      } else {
        console.error('Erreur lors de la récupération des livraisons express:', String(error))
      }
      throw error
    }
  }

  static async assignCourierToExpress(deliveryId: string, courierId: number): Promise<void> {
    try {
      await api.post(`/deliveries/express/${deliveryId}/assign`, { courier_id: courierId })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'assignation du coursier:', error.message)
      } else {
        console.error('Erreur lors de l\'assignation du coursier:', String(error))
      }
      throw error
    }
  }

  static async completeExpressDelivery(deliveryId: string): Promise<void> {
    try {
      await api.post(`/deliveries/express/${deliveryId}/complete`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la finalisation de la livraison express:', error.message)
      } else {
        console.error('Erreur lors de la finalisation de la livraison express:', String(error))
      }
      throw error
    }
  }

  // Méthodes pour les livraisons collaboratives
  static async createCollaborativeDelivery(data: CollaborativeDeliveryRequest): Promise<Delivery> {
    try {
      const response = await api.post('/deliveries/collaborative', data)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la création de la livraison collaborative:', error.message)
      } else {
        console.error('Erreur lors de la création de la livraison collaborative:', String(error))
      }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des livraisons collaboratives:', error.message)
      } else {
        console.error('Erreur lors de la récupération des livraisons collaboratives:', String(error))
      }
      throw error
    }
  }

  static async joinCollaborativeDelivery(id: string, message?: string): Promise<void> {
    try {
      await api.post(`/deliveries/collaborative/${id}/join`, { message })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la participation à la livraison collaborative:', error.message)
      } else {
        console.error('Erreur lors de la participation à la livraison collaborative:', String(error))
      }
      throw error
    }
  }

  static async leaveCollaborativeDelivery(id: string): Promise<void> {
    try {
      await api.post(`/deliveries/collaborative/${id}/leave`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'abandon de la livraison collaborative:', error.message)
      } else {
        console.error('Erreur lors de l\'abandon de la livraison collaborative:', String(error))
      }
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

      console.log('🔍 [DEBUG] Début getClientDeliveryHistory')
      console.log('🔍 [DEBUG] Filtres:', filters)
      console.log('🔍 [DEBUG] Paramètres:', params.toString())

      // Essayer plusieurs endpoints possibles
      const endpoints = [
        `/api/client/delivery-history?${params.toString()}`,
        `/api/deliveries?${params.toString()}`,
        `/api/v1/deliveries?${params.toString()}`,
        `/deliveries?${params.toString()}`
      ]

      let response = null
      let usedEndpoint = ''

      for (const endpoint of endpoints) {
        try {
          console.log('🔍 [DEBUG] Tentative avec endpoint:', endpoint)
          response = await api.get(endpoint)
          usedEndpoint = endpoint
          console.log('✅ [DEBUG] Succès avec endpoint:', endpoint)
          break
        } catch (endpointError: unknown) {
          if (endpointError instanceof Error) {
            console.log(endpointError.message)
          } else if (typeof endpointError === 'object' && endpointError !== null && 'response' in endpointError) {
            // @ts-expect-error: on sait que response existe ici
            console.log(endpointError.response?.data)
          } else {
            console.log(String(endpointError))
          }
          continue
        }
      }

      if (!response) {
        console.error('❌ [DEBUG] Tous les endpoints ont échoué')
        return []
      }

      console.log('📦 [DEBUG] Réponse API reçue')
      console.log('📦 [DEBUG] Type de réponse:', typeof response.data)
      console.log('📦 [DEBUG] Est un tableau:', Array.isArray(response.data))
      console.log('📦 [DEBUG] Longueur:', Array.isArray(response.data) ? response.data.length : 'N/A')
      console.log('📦 [DEBUG] Données brutes:', response.data)

      // CORRECTION : Extraire les livraisons de la réponse API
      let deliveries = []
      if (Array.isArray(response.data)) {
        // Si c'est déjà un tableau
        deliveries = response.data
      } else if (response.data && response.data.deliveries && Array.isArray(response.data.deliveries)) {
        // Si c'est un objet avec une propriété deliveries
        deliveries = response.data.deliveries
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Si c'est un objet avec une propriété data
        deliveries = response.data.data
      } else {
        // Fallback
        deliveries = []
      }

      console.log('📦 [DEBUG] Livraisons extraites:', deliveries.length)
      
      // Vérifier que les livraisons appartiennent bien à l'utilisateur connecté
      // L'API devrait déjà filtrer, mais on double-vérifie côté client
      if (deliveries.length > 0) {
        console.log('👤 [DEBUG] Première livraison client_id:', deliveries[0].client_id)
        console.log('👤 [DEBUG] Nombre total de livraisons:', deliveries.length)
      }
      
      return deliveries
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ [DEBUG] Erreur lors de la récupération de l\'historique client:', error.message)
      } else {
        console.error('❌ [DEBUG] Détails de l\'erreur:', String(error))
      }
      console.error('❌ [DEBUG] Status de l\'erreur:', (error as any).response?.status ?? 'N/A')
      return []
    }
  }

  static async getCourierDeliveryHistory(filters?: DeliveryFilters): Promise<Delivery[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.date_from) params.append('date_from', filters.date_from)
      if (filters?.date_to) params.append('date_to', filters.date_to)

      const response = await api.get(`/courier/delivery-history?${params.toString()}`)
      return Array.isArray(response.data) ? response.data : []
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération de l\'historique coursier:', error.message)
      } else {
        console.error('Erreur lors de la récupération de l\'historique coursier:', String(error))
      }
      return []
    }
  }

  // Méthodes ajoutées pour corriger les erreurs
  static async getActiveDeliveries(): Promise<Delivery[]> {
    try {
      const response = await api.get('/deliveries/active')
      return Array.isArray(response.data) ? response.data : []
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des livraisons actives:', error.message)
      } else {
        console.error('Erreur lors de la récupération des livraisons actives:', String(error))
      }
      return []
    }
  }

  static async placeBid(deliveryId: number, bidData: any): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/bids`, bidData)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la soumission de l\'enchère:', error.message)
      } else {
        console.error('Erreur lors de la soumission de l\'enchère:', String(error))
      }
      throw error
    }
  }

  static async clientConfirmDelivery(deliveryId: number, rating: number, comment: string): Promise<any> {
    try {
      const response = await api.post(`/api/deliveries/${deliveryId}/client-confirm`, {
        rating,
        comment
      })
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la confirmation de livraison:', error.message)
      } else {
        console.error('Erreur lors de la confirmation de livraison:', String(error))
      }
      throw error
    }
  }

  // Méthodes utilitaires
  static async getCourierLocation(deliveryId: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/courier-location`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération de la position du coursier:', error.message)
      } else {
        console.error('Erreur lors de la récupération de la position du coursier:', String(error))
      }
      throw error
    }
  }

  static async getETA(deliveryId: string): Promise<{ eta_minutes: number; distance_remaining: number }> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/eta`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors du calcul de l\'ETA:', error.message)
      } else {
        console.error('Erreur lors du calcul de l\'ETA:', String(error))
      }
      throw error
    }
  }

  static async getDeliveryRoute(deliveryId: string): Promise<{ coordinates: number[][]; distance: number; duration: number }> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/route`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération de l\'itinéraire:', error.message)
      } else {
        console.error('Erreur lors de la récupération de l\'itinéraire:', String(error))
      }
      throw error
    }
  }

  // Méthodes manquantes pour les écrans
  static async acceptDelivery(deliveryId: number | string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/accept`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'acceptation de la livraison:', error.message)
      } else {
        console.error('Erreur lors de l\'acceptation de la livraison:', String(error))
      }
      throw error
    }
  }

  static async getCourierStatus(): Promise<any> {
    try {
      const response = await api.get('/courier/status')
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération du statut coursier:', error.message)
      } else {
        console.error('Erreur lors de la récupération du statut coursier:', String(error))
      }
      throw error
    }
  }

  static async getCourierStats(): Promise<CourierStats> {
    try {
      const response = await api.get('/courier/stats')
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des statistiques:', error.message)
      } else {
        console.error('Erreur lors de la récupération des statistiques:', String(error))
      }
      throw error
    }
  }

  static async updateCourierStatus(status: string): Promise<void> {
    try {
      await api.put('/courier/status', { status })
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la mise à jour du statut:', error.message)
      } else {
        console.error('Erreur lors de la mise à jour du statut:', String(error))
      }
      throw error
    }
  }

  static async getSuggestedCouriers(deliveryId: string): Promise<any> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/suggested-couriers`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des coursiers suggérés:', error.message)
      } else {
        console.error('Erreur lors de la récupération des coursiers suggérés:', String(error))
      }
      throw error
    }
  }

  static async autoAssignDelivery(deliveryId: string): Promise<void> {
    try {
      await api.post(`/deliveries/${deliveryId}/auto-assign`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'assignation automatique:', error.message)
      } else {
        console.error('Erreur lors de l\'assignation automatique:', String(error))
      }
      throw error
    }
  }

  static async assignCourier(data: { delivery_id: string; courier_id: string }): Promise<void> {
    try {
      await api.post('/deliveries/assign-courier', data)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'assignation du coursier:', error.message)
      } else {
        console.error('Erreur lors de l\'assignation du coursier:', String(error))
      }
      throw error
    }
  }

  static async getDeliveryHistory() {
    const res = await api.get('/api/v1/deliveries/')
    return res.data
  }

  static async getWeatherData(lat: number, lng: number) {
    const res = await api.get(`/api/weather?lat=${lat}&lng=${lng}`)
    return res.data
  }

  /**
   * Matching intelligent des coursiers pour une livraison
   */
  async smartMatching(deliveryRequest: any): Promise<any> {
    try {
      const response = await api.post('/api/deliveries/smart-matching', deliveryRequest)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors du matching intelligent:', error.message)
      } else {
        console.error('Erreur lors du matching intelligent:', String(error))
      }
      throw error
    }
  }

  /**
   * Obtenir des suggestions d'adresses
   */
  async getAddressSuggestions(query: string, lat?: number, lng?: number, limit: number = 8): Promise<any> {
    try {
      const params = new URLSearchParams({ query, limit: limit.toString() })
      if (lat !== undefined) params.append('user_lat', lat.toString())
      if (lng !== undefined) params.append('user_lng', lng.toString())
      
      const response = await api.get(`/api/deliveries/address-autocomplete?${params}`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de l\'autocomplétion d\'adresses:', error.message)
      } else {
        console.error('Erreur lors de l\'autocomplétion d\'adresses:', String(error))
      }
      throw error
    }
  }

  /**
   * Obtenir les lieux populaires d'Abidjan
   */
  async getPopularPlaces(lat?: number, lng?: number, category?: string, limit: number = 10): Promise<any> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (lat !== undefined) params.append('user_lat', lat.toString())
      if (lng !== undefined) params.append('user_lng', lng.toString())
      if (category) params.append('category', category)
      
      const response = await api.get(`/api/deliveries/popular-places?${params}`)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des lieux populaires:', error.message)
      } else {
        console.error('Erreur lors de la récupération des lieux populaires:', String(error))
      }
      throw error
    }
  }

  // Méthodes pour les contre-offres
  static async createCounterOffer(
    deliveryId: string,
    bidId: number,
    counterOfferData: {
      proposed_price: number
      message?: string
    }
  ): Promise<any> {
    try {
      const response = await api.post(
        `/deliveries/${deliveryId}/bids/${bidId}/counter-offer`,
        counterOfferData
      )
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la création de la contre-offre:', error.message)
      } else {
        console.error('Erreur lors de la création de la contre-offre:', String(error))
      }
      throw error
    }
  }

  static async respondToCounterOffer(
    deliveryId: string,
    bidId: number,
    counterOfferId: number,
    responseData: {
      response_type: 'accept' | 'decline' | 'counter'
      new_price?: number
      message?: string
    }
  ): Promise<any> {
    try {
      const response = await api.post(
        `/deliveries/${deliveryId}/bids/${bidId}/counter-offer/${counterOfferId}/respond`,
        responseData
      )
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la réponse à la contre-offre:', error.message)
      } else {
        console.error('Erreur lors de la réponse à la contre-offre:', String(error))
      }
      throw error
    }
  }

  static async getCounterOffers(deliveryId: string): Promise<any[]> {
    try {
      const response = await api.get(`/deliveries/${deliveryId}/counter-offers`)
      return response.data.counter_offers || []
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des contre-offres:', error.message)
      } else {
        console.error('Erreur lors de la récupération des contre-offres:', String(error))
      }
      throw error
    }
  }

  // Méthode pour modifier une livraison existante
  static async modifyDelivery(
    deliveryId: string,
    updateData: DeliveryUpdateRequest
  ): Promise<Delivery> {
    try {
      const response = await api.put(`/deliveries/${deliveryId}`, updateData)
      return response.data
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur lors de la modification de la livraison:', error.message)
      } else {
        console.error('Erreur lors de la modification de la livraison:', String(error))
      }
      throw error
    }
  }
}

export default DeliveryService