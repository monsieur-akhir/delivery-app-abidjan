import { useState, useCallback } from 'react'
import DeliveryService from '../services/DeliveryService'
import type {
  Delivery,
  DeliveryStatus,
  Bid,
  TrackingPoint,
  DeliveryEstimate,
  ExpressDelivery,
  CollaborativeDelivery,
  Notification
} from '../types'

// Types pour les filtres et requêtes
export interface DeliveryFilters {
  status?: DeliveryStatus
  date_from?: string
  date_to?: string
  commune?: string
}

export interface DeliverySearchParams {
  commune?: string
  max_distance?: number
  min_price?: number
  max_price?: number
  vehicle_type?: string
}

export interface AvailableDelivery extends Omit<Delivery, 'distance'> {
  distance: number
  score?: number
  eta_minutes?: number
}

export interface DeliveryCreateRequest {
  pickup_address: string
  pickup_commune: string
  pickup_lat?: number
  pickup_lng?: number
  pickup_contact_name?: string
  pickup_contact_phone?: string
  delivery_address: string
  delivery_commune: string
  delivery_lat?: number
  delivery_lng?: number
  delivery_contact_name?: string
  delivery_contact_phone?: string
  package_description?: string
  package_size?: string
  package_weight?: number
  is_fragile?: boolean
  proposed_price: number
  delivery_type?: string
}

export interface DeliveryUpdateRequest {
  pickup_address?: string
  pickup_commune?: string
  delivery_address?: string
  delivery_commune?: string
  package_description?: string
  proposed_price?: number
}

export interface BidCreateRequest {
  delivery_id: number
  proposed_price: number
  estimated_duration?: number
  message?: string
}

export interface TrackingPointRequest {
  delivery_id: number
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
}

export interface PriceEstimateData {
  pickup_address: string
  delivery_address: string
  package_weight?: number
  vehicle_type?: string
  delivery_type?: string
}

export interface VehicleRecommendationData {
  package_weight: number
  package_size: string
  is_fragile: boolean
  distance: number
  pickup_lat?: number
  pickup_lng?: number
  delivery_lat?: number
  delivery_lng?: number
}

export interface VehicleRecommendation {
  recommended_type: string
  reasoning: string
  alternatives: string[]
}

export interface ExpressDeliveryRequest extends DeliveryCreateRequest {
  is_priority: boolean
  guaranteed_delivery_time?: string
}

export interface CollaborativeDeliveryRequest extends DeliveryCreateRequest {
  max_participants: number
  contribution_amount: number
  description: string
}

// Interface pour ActiveDelivery
export interface ActiveDelivery extends Delivery {
  client_name: string
}

// Interface pour AvailableDelivery étendue
export interface AvailableDeliveryExtended extends Omit<Delivery, 'distance'> {
  distance: number
  score?: number
  eta_minutes?: number
  estimated_price?: number
  commune?: string
  bids_count?: number
  urgency_level?: string
}

// Interface unifiée pour le retour du hook
export interface UseDeliveryReturn {
  // État
  deliveries: Delivery[]
  currentDelivery: Delivery | null
  bids: Bid[]
  tracking: TrackingPoint[]
  estimate: DeliveryEstimate | null
  isLoading: boolean
  error: string | null

  // Actions de base
  createDelivery: (data: DeliveryCreateRequest) => Promise<Delivery>
  updateDelivery: (id: string, data: DeliveryUpdateRequest) => Promise<Delivery>
  cancelDelivery: (id: string, reason?: string) => Promise<void>

  // Gestion des enchères
  submitBid: (data: BidCreateRequest) => Promise<Bid>
  acceptBid: (deliveryId: string, bidId: number) => Promise<void>
  declineBid: (deliveryId: string, bidId: number, reason?: string) => Promise<void>

  // Suivi
  addTrackingPoint: (data: TrackingPointRequest) => Promise<TrackingPoint>
  updateCourierLocation: (deliveryId: string, lat: number, lng: number) => Promise<void>
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => Promise<void>

  // Récupération de données
  getDeliveries: (filters?: DeliveryFilters) => Promise<void>
  getAvailableDeliveries: (params?: DeliverySearchParams) => Promise<void>
  getActiveDeliveries: () => Promise<void>
  getCourierActiveDeliveries: () => Promise<void>
  getClientDeliveryHistory: (filters?: DeliveryFilters) => Promise<void>
  getCourierDeliveryHistory: (filters?: DeliveryFilters) => Promise<void>
  getDeliveryDetails: (id: string) => Promise<Delivery>

  // Estimations
  getPriceEstimate: (data: PriceEstimateData) => Promise<number>
  getVehicleRecommendation: (data: VehicleRecommendationData) => Promise<VehicleRecommendation>

  // Livraisons express
  createExpressDelivery: (data: ExpressDeliveryRequest) => Promise<Delivery>
  getExpressDeliveries: (filters?: DeliveryFilters) => Promise<void>
  assignCourierToExpress: (deliveryId: string, courierId: string) => Promise<void>
  completeExpressDelivery: (deliveryId: string) => Promise<void>

  // Livraisons collaboratives
  createCollaborativeDelivery: (data: CollaborativeDeliveryRequest) => Promise<Delivery>
  getCollaborativeDeliveries: (filters?: DeliveryFilters) => Promise<void>
  joinCollaborativeDelivery: (id: string, message?: string) => Promise<void>
  leaveCollaborativeDelivery: (id: string) => Promise<void>

  // Méthodes supplémentaires
  placeBid: (deliveryId: number, bidData: any) => Promise<void>
  clientConfirmDelivery: (deliveryId: number, rating: number, comment?: string) => Promise<void>
}

interface DeliveryState {
  deliveries: Delivery[]
  currentDelivery: Delivery | null
  bids: Bid[]
  tracking: TrackingPoint[]
  estimate: DeliveryEstimate | null
  isLoading: boolean
  error: string | null
}

const initialState: DeliveryState = {
  deliveries: [],
  currentDelivery: null,
  bids: [],
  tracking: [],
  estimate: null,
  isLoading: false,
  error: null
}

export const useDelivery = (): UseDeliveryReturn => {
  const [state, setState] = useState<DeliveryState>(initialState)

  // Actions de base
  const createDelivery = useCallback(async (data: DeliveryCreateRequest): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.createDelivery(data)
      setState(prev => ({ 
        ...prev, 
        deliveries: [...prev.deliveries, delivery], 
        isLoading: false 
      }))
      return delivery
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la création',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const updateDelivery = useCallback(async (id: string, data: DeliveryUpdateRequest): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.updateDelivery(id, data)
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => d.id.toString() === id ? delivery : d),
        currentDelivery: prev.currentDelivery?.id.toString() === id ? delivery : prev.currentDelivery,
        isLoading: false
      }))
      return delivery
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const cancelDelivery = useCallback(async (id: string, reason?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.cancelDelivery(id, reason)
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => 
          d.id.toString() === id ? { ...d, status: 'cancelled' as DeliveryStatus } : d
        ),
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  // Gestion des enchères
  const submitBid = useCallback(async (data: BidCreateRequest): Promise<Bid> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const bid = await DeliveryService.createBid(data)
      setState(prev => ({ 
        ...prev, 
        bids: [...prev.bids, bid], 
        isLoading: false 
      }))
      return bid
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la soumission',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const acceptBid = useCallback(async (deliveryId: string, bidId: number): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.acceptBid(deliveryId, bidId)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'acceptation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const declineBid = useCallback(async (deliveryId: string, bidId: number, reason?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.declineBid(deliveryId, bidId, reason)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors du refus',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  // Suivi
  const addTrackingPoint = useCallback(async (data: TrackingPointRequest): Promise<TrackingPoint> => {
    try {
      const tracking = await DeliveryService.addTrackingPoint(data)
      setState(prev => ({ ...prev, tracking: [tracking], isLoading: false }))
      return tracking
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du point',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const updateCourierLocation = useCallback(async (deliveryId: string, lat: number, lng: number): Promise<void> => {
    try {
      await DeliveryService.updateCourierLocation(deliveryId, lat, lng)
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de position'
      }))
      throw error
    }
  }, [])

  const updateDeliveryStatus = useCallback(async (id: string, status: DeliveryStatus): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.updateDeliveryStatus(id, status)
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => d.id.toString() === id ? delivery : d),
        currentDelivery: prev.currentDelivery?.id.toString() === id ? delivery : prev.currentDelivery,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  // Récupération de données
  const getDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getUserDeliveries(undefined, filters)
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getAvailableDeliveries = useCallback(async (params?: DeliverySearchParams): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getAvailableDeliveries(params)
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getActiveDeliveries = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getCourierActiveDeliveries()
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getCourierActiveDeliveries = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getCourierActiveDeliveries()
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getClientDeliveryHistory = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getClientDeliveryHistory(filters)
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getCourierDeliveryHistory = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getCourierDeliveryHistory(filters)
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getDeliveryDetails = useCallback(async (id: string): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.getDeliveryById(id)
      setState(prev => ({ ...prev, currentDelivery: delivery, isLoading: false }))
      return delivery
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  // Estimations
  const getPriceEstimate = useCallback(async (data: PriceEstimateData): Promise<number> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const price = await DeliveryService.getPriceEstimate(data)
      setState(prev => ({ ...prev, isLoading: false }))
      return price
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'estimation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

const getVehicleRecommendation = useCallback(async (data: VehicleRecommendationData): Promise<VehicleRecommendation> => {
    try {
      if (!data.pickup_lat || !data.pickup_lng || !data.delivery_lat || !data.delivery_lng) {
        throw new Error('Coordonnées manquantes')
      }

      const recommendation = await DeliveryService.getVehicleRecommendation(data)
      if (!recommendation) {
        throw new Error('Aucune recommandation disponible')
      }
      return recommendation
    } catch (error) {
      console.error('Erreur lors de la recommandation de véhicule:', error)
      throw error
    }
  }, [])

  // Livraisons express
  const createExpressDelivery = useCallback(async (data: ExpressDeliveryRequest): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.createExpressDelivery(data)
      setState(prev => ({ 
        ...prev, 
        deliveries: [...prev.deliveries, delivery], 
        isLoading: false 
      }))
      return delivery
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la création express',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getExpressDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getExpressDeliveries(filters)
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération express',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const assignCourierToExpress = useCallback(async (deliveryId: string, courierId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.assignCourierToExpress(deliveryId, Number(courierId))
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'assignation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const completeExpressDelivery = useCallback(async (deliveryId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.completeExpressDelivery(deliveryId)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la finalisation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  // Livraisons collaboratives
  const createCollaborativeDelivery = useCallback(async (data: CollaborativeDeliveryRequest): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.createCollaborativeDelivery(data)
      setState(prev => ({ 
        ...prev, 
        deliveries: [...prev.deliveries, delivery], 
        isLoading: false 
      }))
      return delivery
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la création collaborative',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const getCollaborativeDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getCollaborativeDeliveries(filters)
      setState(prev => ({ ...prev, deliveries, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération collaborative',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const joinCollaborativeDelivery = useCallback(async (id: string, message?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.joinCollaborativeDelivery(id, message)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la participation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const leaveCollaborativeDelivery = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.leaveCollaborativeDelivery(id)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'abandon',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  // Méthodes supplémentaires
  const placeBid = useCallback(async (deliveryId: number, bidData: any): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.placeBid(deliveryId, bidData)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'enchère',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  const clientConfirmDelivery = useCallback(async (deliveryId: number, rating: number, comment?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.clientConfirmDelivery(deliveryId, rating, comment)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur lors de la confirmation',
        isLoading: false 
      }))
      throw error
    }
  }, [])

  return {
    // État
    deliveries: state.deliveries,
    currentDelivery: state.currentDelivery,
    bids: state.bids,
    tracking: state.tracking,
    estimate: state.estimate,
    isLoading: state.isLoading,
    error: state.error,

    // Actions de base
    createDelivery,
    updateDelivery,
    cancelDelivery,

    // Gestion des enchères
    submitBid,
    acceptBid,
    declineBid,

    // Suivi
    addTrackingPoint,
    updateCourierLocation,
    updateDeliveryStatus,

    // Récupération de données
    getDeliveries,
    getAvailableDeliveries,
    getActiveDeliveries,
    getCourierActiveDeliveries,
    getClientDeliveryHistory,
    getCourierDeliveryHistory,
    getDeliveryDetails,

    // Estimations
    getPriceEstimate,
    getVehicleRecommendation,

    // Livraisons express
    createExpressDelivery,
    getExpressDeliveries,
    assignCourierToExpress,
    completeExpressDelivery,

    // Livraisons collaboratives
    createCollaborativeDelivery,
    getCollaborativeDeliveries,
    joinCollaborativeDelivery,
    leaveCollaborativeDelivery,

    // Méthodes supplémentaires
    placeBid,
    clientConfirmDelivery
  }
}

export default useDelivery