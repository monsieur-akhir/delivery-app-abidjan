// Hook pour la gestion des livraisons
import { useState, useCallback } from 'react'
import DeliveryService from '../services/DeliveryService'
import type { 
  Delivery,
  DeliveryStatus,
  Bid,
  TrackingPoint,
  CollaborativeDelivery,
  ExpressDelivery,
  DeliveryEstimate,
  Coordinates
} from '../types/models'
import type { 
  DeliveryCreateRequest,
  DeliveryUpdateRequest,
  DeliveryFilters,
  PriceEstimateRequest,
  BidCreateRequest,
  ExpressDeliveryRequest,
  CollaborativeDeliveryRequest,
  TrackingPointRequest
} from '../services/DeliveryService'

interface DeliveryState {
  deliveries: Delivery[]
  currentDelivery: Delivery | null
  bids: Bid[]
  tracking: TrackingPoint[] | null
  estimate: DeliveryEstimate | null
  isLoading: boolean
  error: string | null
}

interface UseDeliveryReturn extends DeliveryState {
  // Alias for compatibility
  loading: boolean;
    // CRUD livraisons standard
  createDelivery: (data: DeliveryCreateRequest) => Promise<Delivery>;
  getDeliveries: (filters?: DeliveryFilters) => Promise<void>;
  getDelivery: (id: number) => Promise<void>;
  getDeliveryDetails: (id: number) => Promise<Delivery | null>; // Returns delivery data
  updateDelivery: (id: number, data: DeliveryUpdateRequest) => Promise<void>;
  cancelDelivery: (id: number, reason?: string) => Promise<void>;
    // Gestion des enchères
  getDeliveryBids: (deliveryId: number) => Promise<Bid[]>;
  createBid: (bidData: BidCreateRequest) => Promise<void>;
  placeBid: (bidData: BidCreateRequest) => Promise<void>; // Alias for createBid
  acceptBid: (deliveryId: number, bidId: number) => Promise<void>;
  rejectBid: (deliveryId: number, bidId: number, reason?: string) => Promise<void>;
  
  // Suivi et statut
  getTrackingPoints: (id: number) => Promise<void>;
  addTrackingPoint: (trackingData: TrackingPointRequest) => Promise<void>;
  getCourierLocation: (deliveryId: number) => Promise<Coordinates | null>;
  updateDeliveryStatus: (id: number, status: DeliveryStatus) => Promise<void>;
  trackDelivery: (id: number) => Promise<void>; // Alias for getTrackingPoints
    // Livraisons express
  createExpressDelivery: (data: ExpressDeliveryRequest) => Promise<ExpressDelivery>;
  getExpressDeliveries: (filters?: DeliveryFilters) => Promise<ExpressDelivery[]>;
  acceptDelivery: (deliveryId: number) => Promise<void>; // Accept delivery
  startDelivery: (deliveryId: number) => Promise<void>; // Start delivery
  assignCourierToExpress: (deliveryId: number, courierId?: number) => Promise<void>;
  completeExpressDelivery: (deliveryId: number) => Promise<void>;
  
  // Livraisons collaboratives
  createCollaborativeDelivery: (data: CollaborativeDeliveryRequest) => Promise<CollaborativeDelivery>;
  getCollaborativeDeliveries: (filters?: DeliveryFilters) => Promise<CollaborativeDelivery[]>;
  joinCollaborativeDelivery: (id: number, message?: string) => Promise<void>;
  leaveCollaborativeDelivery: (id: number) => Promise<void>;
  
  // Méthodes pour les écrans
  getAvailableDeliveries: (commune?: string) => Promise<Delivery[]>;
  getClientDeliveryHistory: (filters?: DeliveryFilters) => Promise<Delivery[]>;
  getCourierDeliveryHistory: (filters?: DeliveryFilters) => Promise<Delivery[]>;
  
  // Estimation et pricing
  getPriceEstimate: (estimateData: PriceEstimateRequest) => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  clearCurrentDelivery: () => void;
  refreshDeliveries: () => Promise<void>;
}

export const useDelivery = (): UseDeliveryReturn => {
  const [state, setState] = useState<DeliveryState>({
    deliveries: [],
    currentDelivery: null,
    bids: [],
    tracking: null,
    estimate: null,
    isLoading: false,
    error: null,
  });

  // Création d'une nouvelle livraison
  const createDelivery = useCallback(async (data: DeliveryCreateRequest): Promise<Delivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const delivery = await DeliveryService.createDelivery(data);
      
      setState(prev => ({
        ...prev,
        deliveries: [delivery, ...prev.deliveries],
        currentDelivery: delivery,
        isLoading: false,
      }));
      
      return delivery;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create delivery';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  // Récupération des livraisons
  const getDeliveries = useCallback(async (filters?: DeliveryFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const deliveries = await DeliveryService.getDeliveries(filters);
      
      setState(prev => ({
        ...prev,
        deliveries: filters?.skip ? [...prev.deliveries, ...deliveries] : deliveries,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deliveries';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);
  // Récupération d'une livraison spécifique
  const getDelivery = useCallback(async (id: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const delivery = await DeliveryService.getDelivery(id);
      
      setState(prev => ({
        ...prev,
        currentDelivery: delivery,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch delivery';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  // Mise à jour d'une livraison
  const updateDelivery = useCallback(async (id: number, data: DeliveryUpdateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedDelivery = await DeliveryService.updateDelivery(id, data);
      
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => Number(d.id) === id ? updatedDelivery : d),
        currentDelivery: prev.currentDelivery && Number(prev.currentDelivery.id) === id ? updatedDelivery : prev.currentDelivery,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Annulation d'une livraison
  const cancelDelivery = useCallback(async (id: number, reason?: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await DeliveryService.cancelDelivery(id, reason);
      
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => 
          Number(d.id) === id ? { ...d, status: 'cancelled' as DeliveryStatus } : d
        ),
        currentDelivery: prev.currentDelivery && Number(prev.currentDelivery.id) === id 
          ? { ...prev.currentDelivery, status: 'cancelled' as DeliveryStatus }
          : prev.currentDelivery,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);
  // Récupération des enchères pour une livraison
  const getDeliveryBids = useCallback(async (deliveryId: number): Promise<Bid[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const bids = await DeliveryService.getDeliveryBids(deliveryId);
      
      setState(prev => ({ ...prev, bids }));
      return bids;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bids';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Création d'une enchère
  const createBid = useCallback(async (bidData: BidCreateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const bid = await DeliveryService.createBid(bidData);
      
      setState(prev => ({
        ...prev,
        bids: [...prev.bids, bid],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bid';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Acceptation d'une enchère
  const acceptBid = useCallback(async (deliveryId: number, bidId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await DeliveryService.acceptBid(deliveryId, bidId);
      
      // Mise à jour des enchères et de la livraison
      setState(prev => ({
        ...prev,
        bids: prev.bids.map(bid => 
          bid.id === bidId 
            ? { ...bid, status: 'accepted' as const }
            : { ...bid, status: 'rejected' as const }
        ),
      }));
      
      // Recharger la livraison pour obtenir le statut mis à jour
      await getDelivery(deliveryId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept bid';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [getDelivery]);

  // Rejet d'une enchère
  const rejectBid = useCallback(async (deliveryId: number, bidId: number, reason?: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await DeliveryService.rejectBid(deliveryId, bidId, reason);
      
      setState(prev => ({
        ...prev,
        bids: prev.bids.map(bid => 
          bid.id === bidId ? { ...bid, status: 'rejected' as const } : bid
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject bid';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des points de suivi
  const getTrackingPoints = useCallback(async (id: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const tracking = await DeliveryService.getTrackingPoints(id);
      
      setState(prev => ({ ...prev, tracking }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get tracking points';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Ajout d'un point de suivi
  const addTrackingPoint = useCallback(async (trackingData: TrackingPointRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const newPoint = await DeliveryService.addTrackingPoint(trackingData);
      
      setState(prev => ({
        ...prev,
        tracking: prev.tracking ? [...prev.tracking, newPoint] : [newPoint],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add tracking point';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération de la position du coursier
  const getCourierLocation = useCallback(async (deliveryId: number): Promise<Coordinates | null> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await DeliveryService.getCourierLocation(deliveryId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get courier location';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  // Mise à jour du statut de livraison
  const updateDeliveryStatus = useCallback(async (id: number, status: DeliveryStatus) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedDelivery = await DeliveryService.updateDeliveryStatus(id, status);
      
      // Mise à jour locale
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => d.id === id ? updatedDelivery : d),
        currentDelivery: prev.currentDelivery?.id === id ? updatedDelivery : prev.currentDelivery,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update delivery status';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Livraisons express
  const createExpressDelivery = useCallback(async (data: ExpressDeliveryRequest): Promise<ExpressDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const delivery = await DeliveryService.createExpressDelivery(data);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return delivery;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create express delivery';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  const getExpressDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<ExpressDelivery[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await DeliveryService.getExpressDeliveries(filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch express deliveries';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const assignCourierToExpress = useCallback(async (deliveryId: number, courierId?: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await DeliveryService.assignCourierToExpress(deliveryId, courierId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign courier to express delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const completeExpressDelivery = useCallback(async (deliveryId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await DeliveryService.completeExpressDelivery(deliveryId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete express delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Livraisons collaboratives
  const createCollaborativeDelivery = useCallback(async (data: CollaborativeDeliveryRequest): Promise<CollaborativeDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const delivery = await DeliveryService.createCollaborativeDelivery(data);
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      return delivery;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create collaborative delivery';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  const getCollaborativeDeliveries = useCallback(async (filters?: DeliveryFilters): Promise<CollaborativeDelivery[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await DeliveryService.getCollaborativeDeliveries(filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch collaborative deliveries';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const joinCollaborativeDelivery = useCallback(async (id: number, message?: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await DeliveryService.joinCollaborativeDelivery(id, message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join collaborative delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const leaveCollaborativeDelivery = useCallback(async (id: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await DeliveryService.leaveCollaborativeDelivery(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave collaborative delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Méthodes pour les écrans
  const getAvailableDeliveries = useCallback(async (commune?: string): Promise<Delivery[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await DeliveryService.getAvailableDeliveries(commune);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available deliveries';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const getClientDeliveryHistory = useCallback(async (filters?: DeliveryFilters): Promise<Delivery[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await DeliveryService.getClientDeliveryHistory(filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch client delivery history';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const getCourierDeliveryHistory = useCallback(async (filters?: DeliveryFilters): Promise<Delivery[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await DeliveryService.getCourierDeliveryHistory(filters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courier delivery history';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Estimation de prix
  const getPriceEstimate = useCallback(async (estimateData: PriceEstimateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const estimate = await DeliveryService.getPriceEstimate(estimateData);
      
      setState(prev => ({ ...prev, estimate, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get price estimate';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);  // Missing methods implementation
  const placeBid = useCallback(async (bidData: BidCreateRequest) => {
    return createBid(bidData);
  }, [createBid]);

  const acceptDelivery = useCallback(async (deliveryId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await DeliveryService.updateDeliveryStatus(deliveryId, 'accepted');
      
      // Update delivery status in state
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => 
          Number(d.id) === deliveryId ? { ...d, status: 'accepted' as DeliveryStatus } : d
        ),
        currentDelivery: prev.currentDelivery && Number(prev.currentDelivery.id) === deliveryId 
          ? { ...prev.currentDelivery, status: 'accepted' as DeliveryStatus }
          : prev.currentDelivery,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const startDelivery = useCallback(async (deliveryId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await DeliveryService.updateDeliveryStatus(deliveryId, 'in_progress');
      
      // Update delivery status in state
      setState(prev => ({
        ...prev,
        deliveries: prev.deliveries.map(d => 
          Number(d.id) === deliveryId ? { ...d, status: 'in_progress' as DeliveryStatus } : d
        ),
        currentDelivery: prev.currentDelivery && Number(prev.currentDelivery.id) === deliveryId 
          ? { ...prev.currentDelivery, status: 'in_progress' as DeliveryStatus }
          : prev.currentDelivery,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start delivery';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Actualisation des livraisons
  const refreshDeliveries = useCallback(async () => {
    await getDeliveries();
  }, [getDeliveries]);

  // Effacement des erreurs
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  // Effacement de la livraison actuelle
  const clearCurrentDelivery = useCallback(() => {
    setState(prev => ({ ...prev, currentDelivery: null }));
  }, []);
  // Alias methods for backward compatibility
  const getDeliveryDetails = useCallback(async (id: number): Promise<Delivery | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const delivery = await DeliveryService.getDelivery(id);
      
      setState(prev => ({
        ...prev,
        currentDelivery: delivery,
        isLoading: false,
      }));
      
      return delivery;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch delivery';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  const trackDelivery = useCallback(async (id: number) => {
    return getTrackingPoints(id);
  }, [getTrackingPoints]);
  return {
    ...state,
    loading: state.isLoading, // Alias for compatibility
    createDelivery,
    getDeliveries,
    getDelivery,
    getDeliveryDetails,
    updateDelivery,
    cancelDelivery,
    getDeliveryBids,
    createBid,
    placeBid,
    acceptBid,
    rejectBid,
    getTrackingPoints,
    addTrackingPoint,
    getCourierLocation,
    updateDeliveryStatus,
    trackDelivery,
    createExpressDelivery,
    getExpressDeliveries,
    assignCourierToExpress,
    completeExpressDelivery,
    acceptDelivery,
    startDelivery,
    createCollaborativeDelivery,
    getCollaborativeDeliveries,
    joinCollaborativeDelivery,
    leaveCollaborativeDelivery,
    getAvailableDeliveries,
    getClientDeliveryHistory,
    getCourierDeliveryHistory,
    getPriceEstimate,
    clearError,
    clearCurrentDelivery,
    refreshDeliveries,
  };
};

export default useDelivery;
