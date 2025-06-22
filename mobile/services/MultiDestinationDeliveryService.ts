
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/environment'

export interface MultiDestinationStop {
  id?: number
  delivery_address: string
  delivery_commune: string
  delivery_lat?: number
  delivery_lng?: number
  delivery_contact_name?: string
  delivery_contact_phone?: string
  package_description?: string
  package_size?: string
  package_weight?: number
  recipient_name: string
  recipient_phone?: string
  special_instructions?: string
  original_order?: number
  optimized_order?: number
  status?: string
  estimated_arrival_time?: string
  actual_arrival_time?: string
  delivered_at?: string
  estimated_distance_from_previous?: number
  estimated_duration_from_previous?: number
  proof_of_delivery_url?: string
  delivery_notes?: string
}

export interface MultiDestinationDelivery {
  id?: number
  client_id?: number
  courier_id?: number
  pickup_address: string
  pickup_commune: string
  pickup_lat?: number
  pickup_lng?: number
  pickup_contact_name?: string
  pickup_contact_phone?: string
  pickup_instructions?: string
  total_destinations: number
  optimized_route?: number[]
  estimated_total_distance?: number
  estimated_total_duration?: number
  actual_total_duration?: number
  total_proposed_price: number
  total_final_price?: number
  status: string
  created_at?: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  special_instructions?: string
  vehicle_type_required?: string
  is_fragile: boolean
  is_urgent: boolean
  destinations: MultiDestinationStop[]
  client?: any
  courier?: any
}

export interface MultiDestinationBid {
  id?: number
  delivery_id: number
  courier_id?: number
  proposed_price: number
  estimated_duration?: number
  message?: string
  alternative_route?: number[]
  status?: string
  created_at?: string
  updated_at?: string
  courier?: any
}

class MultiDestinationDeliveryService {
  private getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Créer une livraison multi-destinataires
  async createDelivery(deliveryData: Omit<MultiDestinationDelivery, 'id' | 'total_destinations'>): Promise<MultiDestinationDelivery> {
    try {
      const headers = await this.getAuthHeaders()
      const payload = {
        ...deliveryData,
        total_destinations: deliveryData.destinations.length
      }

      const response = await fetch(`${API_URL}/api/multi-destination-deliveries`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors de la création de la livraison')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur création livraison multi-destinataires:', error)
      throw error
    }
  }

  // Récupérer les livraisons de l'utilisateur
  async getUserDeliveries(status?: string): Promise<MultiDestinationDelivery[]> {
    try {
      const headers = await this.getAuthHeaders()
      const url = new URL(`${API_URL}/api/multi-destination-deliveries`)
      
      if (status) {
        url.searchParams.append('status', status)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des livraisons')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur récupération livraisons:', error)
      throw error
    }
  }

  // Récupérer une livraison par ID
  async getDelivery(deliveryId: number): Promise<MultiDestinationDelivery> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_URL}/api/multi-destination-deliveries/${deliveryId}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la livraison')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur récupération livraison:', error)
      throw error
    }
  }

  // Récupérer les livraisons disponibles (pour coursiers)
  async getAvailableDeliveries(commune?: string): Promise<MultiDestinationDelivery[]> {
    try {
      const headers = await this.getAuthHeaders()
      const url = new URL(`${API_URL}/api/multi-destination-deliveries/available`)
      
      if (commune) {
        url.searchParams.append('commune', commune)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des livraisons disponibles')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur récupération livraisons disponibles:', error)
      throw error
    }
  }

  // Créer une enchère
  async createBid(deliveryId: number, bidData: Omit<MultiDestinationBid, 'id' | 'delivery_id'>): Promise<MultiDestinationBid> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_URL}/api/multi-destination-deliveries/${deliveryId}/bids`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bidData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors de la création de l\'enchère')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur création enchère:', error)
      throw error
    }
  }

  // Accepter une enchère
  async acceptBid(deliveryId: number, bidId: number): Promise<{ message: string, delivery_id: number }> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_URL}/api/multi-destination-deliveries/${deliveryId}/bids/${bidId}/accept`, {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors de l\'acceptation de l\'enchère')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur acceptation enchère:', error)
      throw error
    }
  }

  // Démarrer une livraison
  async startDelivery(deliveryId: number): Promise<{ message: string, delivery_id: number }> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_URL}/api/multi-destination-deliveries/${deliveryId}/start`, {
        method: 'POST',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors du démarrage de la livraison')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur démarrage livraison:', error)
      throw error
    }
  }

  // Mettre à jour le statut d'un arrêt
  async updateStopStatus(
    deliveryId: number, 
    stopId: number, 
    status: string, 
    notes?: string, 
    proofUrl?: string
  ): Promise<{ message: string, stop_id: number, status: string }> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_URL}/api/multi-destination-deliveries/${deliveryId}/stops/${stopId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status,
          notes,
          proof_of_delivery_url: proofUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors de la mise à jour du statut')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      throw error
    }
  }

  // Télécharger une preuve de livraison
  async uploadProofOfDelivery(
    deliveryId: number, 
    stopId: number, 
    imageUri: string
  ): Promise<{ message: string, proof_url: string }> {
    try {
      const headers = await this.getAuthHeaders()
      delete headers['Content-Type'] // Pour FormData

      const formData = new FormData()
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `proof_${deliveryId}_${stopId}.jpg`
      } as any)

      const response = await fetch(`${API_URL}/api/multi-destination-deliveries/${deliveryId}/stops/${stopId}/proof`, {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors du téléchargement de la preuve')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur téléchargement preuve:', error)
      throw error
    }
  }

  // Calculer le prix suggéré basé sur la distance et le nombre de destinations
  calculateSuggestedPrice(totalDistance: number, numberOfDestinations: number): number {
    const basePrice = 2000 // Prix de base
    const pricePerKm = 200 // Prix par kilomètre
    const pricePerDestination = 500 // Prix par destination supplémentaire
    
    const distancePrice = totalDistance * pricePerKm
    const destinationPrice = (numberOfDestinations - 1) * pricePerDestination
    
    return Math.round(basePrice + distancePrice + destinationPrice)
  }

  // Valider les données de livraison
  validateDeliveryData(delivery: Partial<MultiDestinationDelivery>): string[] {
    const errors: string[] = []

    if (!delivery.pickup_address?.trim()) {
      errors.push('L\'adresse de ramassage est requise')
    }

    if (!delivery.pickup_commune?.trim()) {
      errors.push('La commune de ramassage est requise')
    }

    if (!delivery.destinations || delivery.destinations.length < 2) {
      errors.push('Au moins 2 destinations sont requises')
    }

    if (delivery.destinations && delivery.destinations.length > 10) {
      errors.push('Maximum 10 destinations autorisées')
    }

    delivery.destinations?.forEach((dest, index) => {
      if (!dest.delivery_address?.trim()) {
        errors.push(`L'adresse de la destination ${index + 1} est requise`)
      }
      if (!dest.recipient_name?.trim()) {
        errors.push(`Le nom du destinataire ${index + 1} est requis`)
      }
    })

    if (!delivery.total_proposed_price || delivery.total_proposed_price <= 0) {
      errors.push('Le prix proposé doit être supérieur à 0')
    }

    return errors
  }
}

export default new MultiDestinationDeliveryService()
