import { useState, useCallback } from 'react'
import type {
  Delivery,
  DeliveryCreateRequest,
  DeliveryFilters,
  DeliveryEstimate,
  Bid,
  BidCreateRequest,
  TrackingPoint,
  ExpressDelivery,
  CollaborativeDelivery,
  Coordinates,
  Promotion,
  Zone,
  DeliveryStatus
} from '../types/models'
import DeliveryService from '../services/DeliveryService'
import { useAuth } from '../contexts/AuthContext'

interface DeliveryState {
  deliveries: Delivery[]
  currentDelivery: Delivery | null
  bids: Bid[]
  tracking: TrackingPoint[] | null
  estimate: DeliveryEstimate | null
  isLoading: boolean
  error: string | null
}

interface UseDeliveryReturn {
  // State
  deliveries: Delivery[]
  currentDelivery: Delivery | null
  bids: Bid[]
  tracking: TrackingPoint[] | null
  estimate: DeliveryEstimate | null
  isLoading: boolean
  error: string | null

  // Actions
  createDelivery: (data: DeliveryCreateRequest) => Promise<Delivery>
  getUserDeliveries: (filters?: DeliveryFilters) => Promise<void>
  getDeliveryById: (id: string) => Promise<void>
  updateDelivery: (id: string, data: Partial<DeliveryCreateRequest>) => Promise<void>
  cancelDelivery: (id: string, reason?: string) => Promise<void>
  getDeliveryBids: (deliveryId: string) => Promise<void>
  createBid: (bidData: BidCreateRequest) => Promise<void>
  acceptBid: (deliveryId: string, bidId: number) => Promise<void>
  rejectBid: (deliveryId: string, bidId: number, reason?: string) => Promise<void>
  getDeliveryTracking: (id: string) => Promise<void>
  getCourierLocation: (deliveryId: string) => Promise<Coordinates>
  updateDeliveryStatus: (id: string, status: string) => Promise<void>
  getExpressDelivery: (id: string) => Promise<ExpressDelivery>
  getExpressDeliveries: (filters?: DeliveryFilters) => Promise<ExpressDelivery[]>
  assignCourierToExpress: (deliveryId: string, courierId: string) => Promise<void>
  completeExpressDelivery: (deliveryId: string) => Promise<void>
  getCollaborativeDelivery: (id: string) => Promise<CollaborativeDelivery>
  getCollaborativeDeliveries: (filters?: DeliveryFilters) => Promise<CollaborativeDelivery[]>
  joinCollaborativeDelivery: (id: string, message?: string) => Promise<void>
  leaveCollaborativeDelivery: (id: string) => Promise<void>
  getAvailableDeliveries: (params?: { commune?: string }) => Promise<Delivery[]>
  getPriceEstimate: (data: Omit<DeliveryCreateRequest, 'weather_conditions'>) => Promise<void>
  getDeliveryZones: (lat: number, lng: number) => Promise<Zone[]>
  calculateZonePricing: (zoneId: string, distance: number, packageType: string) => Promise<number>
  acceptDelivery: (deliveryId: string) => Promise<void>
  startDelivery: (deliveryId: string) => Promise<void>
  getClientDeliveryHistory: (filters?: DeliveryFilters) => Promise<void>
  clearError: () => void
  refreshDelivery: (id: string) => Promise<void>
}

export const useDelivery = (): UseDeliveryReturn => {
  const { user } = useAuth()
  const [state, setState] = useState<DeliveryState>({
    deliveries: [],
    currentDelivery: null,
    bids: [],
    tracking: null,
    estimate: null,
    isLoading: false,
    error: null
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const createDelivery = useCallback(async (data: DeliveryCreateRequest): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.createDelivery(data)
      setState(prev => ({ 
        ...prev, 
        deliveries: [delivery, ...prev.deliveries],
        currentDelivery: delivery,
        isLoading: false 
      }))
      return delivery
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [])

  const getUserDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getUserDeliveries(
        filters?.skip || 0,
        (typeof filters === 'object' && filters?.limit) || 20
      )
      setState(prev => ({ 
        ...prev, 
        deliveries,
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const getDeliveryById = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const delivery = await DeliveryService.getDeliveryById(id)
      setState(prev => ({ 
        ...prev, 
        currentDelivery: delivery,
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const updateDelivery = useCallback(async (id: string, data: Partial<DeliveryCreateRequest>): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const updatedDelivery = await DeliveryService.updateDelivery(id, data)
      setState(prev => ({ 
        ...prev, 
        currentDelivery: updatedDelivery,
        deliveries: prev.deliveries.map(d => d.id.toString() === id ? updatedDelivery : d),
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const cancelDelivery = useCallback(async (id: string, reason?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.cancelDelivery(id, reason)
      setState(prev => ({ 
        ...prev, 
        deliveries: prev.deliveries.map(d => 
          d.id.toString() === id ? { ...d, status: 'cancelled' } : d
        ),
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'annulation'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const getDeliveryBids = useCallback(async (deliveryId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await DeliveryService.getDeliveryBids(deliveryId)
      setState(prev => ({
        ...prev,
        bids: response as Bid[],
        isLoading: false
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des enchères'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const createBid = useCallback(async (bidData: BidCreateRequest): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const bid = await DeliveryService.createBid(bidData)
      setState(prev => ({ 
        ...prev, 
        bids: [...prev.bids, bid],
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de l\'enchère'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const acceptBid = useCallback(async (deliveryId: string, bidId: number): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.acceptBid(deliveryId, bidId)
      setState(prev => ({ 
        ...prev, 
        bids: prev.bids.map(b => 
          b.id === bidId ? { ...b, status: 'accepted' } : b
        ),
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'acceptation'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const rejectBid = useCallback(async (deliveryId: string, bidId: number, reason?: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      // Note: rejectBid method needs to be implemented in DeliveryService
      console.log('Rejecting bid:', deliveryId, bidId, reason)
      setState(prev => ({
        ...prev,
        bids: prev.bids.map(b =>
          b.id === Number(bidId) ? { ...b, status: 'rejected' } : b
        ),
        isLoading: false
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du rejet'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const getDeliveryTracking = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const tracking = await DeliveryService.getDeliveryDetails(id)
      setState(prev => ({ ...prev, tracking, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement du suivi'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const getCourierLocation = useCallback(async (deliveryId: string): Promise<Coordinates> => {
    try {
      const location = await DeliveryService.getCourierLocation(deliveryId)
      return {
        latitude: location.lat,
        longitude: location.lng
      }
    } catch (error) {
      throw error
    }
  }, [])

  const updateDeliveryStatus = useCallback(async (id: string, status: DeliveryStatus): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const updatedDelivery = await DeliveryService.updateDeliveryStatus(id, status)
      setState(prev => ({ 
        ...prev, 
        currentDelivery: updatedDelivery,
        deliveries: prev.deliveries.map(d => d.id.toString() === id ? updatedDelivery : d),
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const getExpressDelivery = useCallback(async (id: string): Promise<ExpressDelivery> => {
    try {
      const delivery = await DeliveryService.getDeliveryById(id)
      return {
        ...delivery,
        express_priority: 'standard',
        estimated_pickup_time: new Date().toISOString(),
        guaranteed_delivery_time: new Date().toISOString(),
        express_fee: 0,
        auto_assignment: false
      }
    } catch (error) {
      throw error
    }
  }, [])

  const getExpressDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<ExpressDelivery[]> => {
    try {
      const deliveries = await DeliveryService.getExpressDeliveries(filters)
      return deliveries.map(delivery => ({
        ...delivery,
        express_priority: 'standard' as const,
        estimated_pickup_time: new Date().toISOString(),
        guaranteed_delivery_time: new Date().toISOString(),
        express_fee: 0,
        auto_assignment: false
      }))
    } catch (error) {
      throw error
    }
  }, [])

  const assignCourierToExpress = useCallback(async (deliveryId: string, courierId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      await DeliveryService.assignCourierToExpress(deliveryId, courierId)
    } catch (error) {
      throw error
    }
  }, [])

  const completeExpressDelivery = useCallback(async (deliveryId: string): Promise<void> => {
    try {
      await DeliveryService.completeExpressDelivery(deliveryId)
    } catch (error) {
      throw error
    }
  }, [])

  const getCollaborativeDelivery = useCallback(async (id: string): Promise<CollaborativeDelivery> => {
    try {
      const delivery = await DeliveryService.getDeliveryById(id)
      return {
        id: delivery.id,
        title: `Livraison ${delivery.id}`,
        description: delivery.package_description || '',
        status: delivery.status,
        pickupAddress: delivery.pickup_address,
        deliveryAddress: delivery.delivery_address,
        estimatedDistance: `${delivery.distance} km`,
        estimatedDuration: `${delivery.estimated_duration} min`,
        packageDescription: delivery.package_description || '',
        packageWeight: '',
        packageSize: '',
        isFragile: false,
        createdBy: delivery.client?.id?.toString() || delivery.id.toString(),
        deliveryId: delivery.id,
        deliveryStatus: delivery.status,
        deliveryType: 'collaborative',
        createdAt: delivery.created_at,
        updatedAt: delivery.updated_at,
        deliveryPrice: delivery.proposed_price,
        pickupCommune: '',
        deliveryCommune: '',
        collaborators: [],
        clientName: delivery.client?.full_name || ''
      }
    } catch (error) {
      throw error
    }
  }, [])

  const getCollaborativeDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<CollaborativeDelivery[]> => {
    try {
      const deliveries = await DeliveryService.getCollaborativeDeliveries(filters)
      return deliveries.map(delivery => ({
        id: delivery.id,
        title: `Livraison ${delivery.id}`,
        description: delivery.package_description || '',
        status: delivery.status,
        pickupAddress: delivery.pickup_address,
        deliveryAddress: delivery.delivery_address,
        estimatedDistance: `${delivery.distance} km`,
        estimatedDuration: `${delivery.estimated_duration} min`,
        packageDescription: delivery.package_description || '',
        packageWeight: '',
        packageSize: '',
        isFragile: false,
        createdBy: delivery.client?.id?.toString() || delivery.id.toString(),
        deliveryId: delivery.id,
        deliveryStatus: delivery.status,
        deliveryType: 'collaborative',
        createdAt: delivery.created_at,
        updatedAt: delivery.updated_at,
        deliveryPrice: delivery.proposed_price,
        pickupCommune: '',
        deliveryCommune: '',
        collaborators: [],
        clientName: delivery.client?.full_name || ''
      }))
    } catch (error) {
      throw error
    }
  }, [])

  const joinCollaborativeDelivery = useCallback(async (id: string, message?: string): Promise<void> => {
    try {
      await DeliveryService.joinCollaborativeDelivery(id, message)
    } catch (error) {
      throw error
    }
  }, [])

  const leaveCollaborativeDelivery = useCallback(async (id: string): Promise<void> => {
    try {
      await DeliveryService.leaveCollaborativeDelivery(id)
    } catch (error) {
      throw error
    }
  }, [])

  const getAvailableDeliveries = useCallback(async (searchParams?: any): Promise<any[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      return await DeliveryService.getAvailableDeliveries(searchParams)
    } catch (error) {
      throw error
    }
  }, [])

  const getPriceEstimate = useCallback(async (data: any): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const estimateData = {
        ...data,
        distance: data.distance || 0
      }

      const estimateResult = await DeliveryService.getPriceEstimate(estimateData)
      const estimate: DeliveryEstimate = {
        estimated_price: estimateResult,
        estimated_duration: 30,
        estimated_distance: 5,
        pricing_breakdown: {
          base_price: estimateResult * 0.6,
          distance_fee: estimateResult * 0.2,
          time_fee: estimateResult * 0.1,
          size_fee: estimateResult * 0.05,
          urgency_fee: estimateResult * 0.05,
          total: estimateResult
        },
        vehicle_recommendations: []
      }
      setState(prev => ({ ...prev, estimate, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'estimation'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const getDeliveryZones = useCallback(async (lat: number, lng: number): Promise<Zone[]> => {
    try {
      return []
    } catch (error) {
      throw error
    }
  }, [])

  const calculateZonePricing = useCallback(async (zoneId: string, distance: number, packageType: string): Promise<number> => {
    try {
      const basePrice = 1000
      const distanceMultiplier = distance * 100
      const typeMultiplier = packageType === 'fragile' ? 1.5 : 1
      return basePrice + distanceMultiplier * typeMultiplier
    } catch (error) {
      throw error
    }
  }, [])

  const acceptDelivery = useCallback(async (deliveryId: string): Promise<void> => {
    try {
      await DeliveryService.updateDeliveryStatus(deliveryId, 'accepted')
      setState(prev => ({ 
        ...prev, 
        deliveries: prev.deliveries.map(d => 
          d.id.toString() === deliveryId ? { ...d, status: 'accepted' } : d
        )
      }))
    } catch (error) {
      throw error
    }
  }, [])

  const startDelivery = useCallback(async (deliveryId: string): Promise<void> => {
    try {
      await DeliveryService.updateDeliveryStatus(deliveryId, 'in_progress')
      setState(prev => ({ 
        ...prev, 
        deliveries: prev.deliveries.map(d => 
          d.id.toString() === deliveryId ? { ...d, status: 'in_progress' } : d
        )
      }))
    } catch (error) {
      throw error
    }
  }, [])

  const getClientDeliveryHistory = useCallback(async (filters?: DeliveryFilters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const deliveries = await DeliveryService.getUserDeliveries(
        filters?.skip || 0,
        (typeof filters === 'object' && filters?.limit) || 20
      )
      setState(prev => ({ 
        ...prev, 
        deliveries,
        isLoading: false 
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'historique'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }, [])

  const refreshDelivery = useCallback(async (id: string): Promise<void> => {
    try {
      const delivery = await DeliveryService.getDeliveryById(id)
      setState(prev => ({ 
        ...prev, 
        currentDelivery: delivery,
        deliveries: prev.deliveries.map(d => d.id.toString() === id ? delivery : d)
      }))
    } catch (error) {
      throw error
    }
  }, [])

  return {
    ...state,
    createDelivery,
    getUserDeliveries,
    getDeliveryById,
    updateDelivery,
    cancelDelivery,
    getDeliveryBids,
    createBid,
    acceptBid,
    rejectBid,
    getDeliveryTracking,
    getCourierLocation,
    updateDeliveryStatus,
    getExpressDelivery,
    getExpressDeliveries,
    assignCourierToExpress,
    completeExpressDelivery,
    getCollaborativeDelivery,
    getCollaborativeDeliveries,
    joinCollaborativeDelivery,
    leaveCollaborativeDelivery,
    getAvailableDeliveries,
    getPriceEstimate,
    getDeliveryZones,
    calculateZonePricing,
    acceptDelivery,
    startDelivery,
    getClientDeliveryHistory,
    clearError,
    refreshDelivery
  }
}

export default useDelivery