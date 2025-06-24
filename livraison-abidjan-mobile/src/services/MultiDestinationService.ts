
import api from './api'
import { getToken } from '../utils'

interface MultiDestinationStop {
  id?: number;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  recipient_name: string;
  recipient_phone: string;
  delivery_notes?: string;
  special_instructions?: string;
  delivery_order: number;
  original_order: number;
  status: 'pending' | 'in_progress' | 'delivered' | 'failed';
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  proof_of_delivery_url?: string;
}

interface MultiDestinationDelivery {
  id: number;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  package_type: string;
  package_description: string;
  estimated_total_distance?: number;
  estimated_total_duration?: number;
  total_proposed_price?: number;
  total_final_price?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  special_instructions?: string;
  vehicle_type_required?: string;
  is_fragile?: boolean;
  is_urgent?: boolean;
  destinations: MultiDestinationStop[];
  client?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  courier?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    rating: number;
  };
}

interface MultiDestinationDeliveryCreate {
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  destinations: Array<{
    address: string;
    latitude?: number;
    longitude?: number;
    recipient_name: string;
    recipient_phone: string;
    delivery_notes?: string;
    order: number;
  }>;
  package_type: string;
  package_description: string;
  is_fragile?: boolean;
  is_urgent?: boolean;
  special_instructions?: string;
  vehicle_type_required?: string;
}

interface MultiDestinationBid {
  id: number;
  courier_id: number;
  delivery_id: number;
  proposed_price: number;
  estimated_total_time: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  courier: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    rating: number;
  };
}

class MultiDestinationService {
  /**
   * Créer une livraison multi-destinations
   */
  static async createDelivery(deliveryData: MultiDestinationDeliveryCreate): Promise<MultiDestinationDelivery> {
    try {
      const token = await getToken();
      const response = await api.post('/api/multi-destination-deliveries', deliveryData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la livraison multi-destinations:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les livraisons multi-destinations de l'utilisateur
   */
  static async getUserDeliveries(status?: string): Promise<MultiDestinationDelivery[]> {
    try {
      const token = await getToken();
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/api/multi-destination-deliveries${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons multi-destinations:', error);
      return [];
    }
  }

  /**
   * Récupérer une livraison multi-destinations par ID
   */
  static async getDeliveryById(id: number): Promise<MultiDestinationDelivery> {
    try {
      const token = await getToken();
      const response = await api.get(`/api/multi-destination-deliveries/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la livraison multi-destinations:', error);
      throw error;
    }
  }

  /**
   * Récupérer les livraisons multi-destinations disponibles (pour les coursiers)
   */
  static async getAvailableDeliveries(commune?: string): Promise<MultiDestinationDelivery[]> {
    try {
      const token = await getToken();
      const params = commune ? `?commune=${commune}` : '';
      const response = await api.get(`/api/multi-destination-deliveries/available${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons disponibles:', error);
      return [];
    }
  }

  /**
   * Créer une enchère pour une livraison multi-destinations
   */
  static async createBid(deliveryId: number, bidData: {
    proposed_price: number;
    estimated_total_time: number;
    message?: string;
  }): Promise<MultiDestinationBid> {
    try {
      const token = await getToken();
      const response = await api.post(`/api/multi-destination-deliveries/${deliveryId}/bids`, bidData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'enchère:', error);
      throw error;
    }
  }

  /**
   * Accepter une enchère
   */
  static async acceptBid(deliveryId: number, bidId: number): Promise<void> {
    try {
      const token = await getToken();
      await api.post(`/api/multi-destination-deliveries/${deliveryId}/bids/${bidId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'enchère:', error);
      throw error;
    }
  }

  /**
   * Démarrer une livraison multi-destinations
   */
  static async startDelivery(deliveryId: number): Promise<void> {
    try {
      const token = await getToken();
      await api.post(`/api/multi-destination-deliveries/${deliveryId}/start`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors du démarrage de la livraison:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un arrêt
   */
  static async updateStopStatus(
    deliveryId: number, 
    stopId: number, 
    status: 'in_progress' | 'delivered' | 'failed',
    proofOfDeliveryUrl?: string
  ): Promise<void> {
    try {
      const token = await getToken();
      const updateData: any = { status };
      if (proofOfDeliveryUrl) {
        updateData.proof_of_delivery_url = proofOfDeliveryUrl;
      }
      
      await api.put(`/api/multi-destination-deliveries/${deliveryId}/stops/${stopId}/status`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  /**
   * Télécharger une preuve de livraison
   */
  static async uploadProofOfDelivery(
    deliveryId: number,
    stopId: number,
    file: any
  ): Promise<{ proof_url: string }> {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/api/multi-destination-deliveries/${deliveryId}/stops/${stopId}/proof`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du téléchargement de la preuve:', error);
      throw error;
    }
  }

  /**
   * Récupérer les enchères d'une livraison
   */
  static async getDeliveryBids(deliveryId: number): Promise<MultiDestinationBid[]> {
    try {
      const token = await getToken();
      const response = await api.get(`/api/multi-destination-deliveries/${deliveryId}/bids`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des enchères:', error);
      return [];
    }
  }

  /**
   * Modifier une livraison multi-destinations
   */
  static async updateDelivery(deliveryId: number, updateData: Partial<MultiDestinationDeliveryCreate>): Promise<MultiDestinationDelivery> {
    try {
      const token = await getToken();
      const response = await api.put(`/api/multi-destination-deliveries/${deliveryId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification de la livraison:', error);
      throw error;
    }
  }

  /**
   * Annuler une livraison multi-destinations
   */
  static async cancelDelivery(deliveryId: number, reason?: string): Promise<void> {
    try {
      const token = await getToken();
      await api.post(`/api/multi-destination-deliveries/${deliveryId}/cancel`, 
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la livraison:', error);
      throw error;
    }
  }

  /**
   * Faire une contre-offre sur une enchère
   */
  static async createCounterOffer(
    deliveryId: number, 
    bidId: number, 
    counterOfferData: {
      proposed_price: number;
      message?: string;
    }
  ): Promise<void> {
    try {
      const token = await getToken();
      await api.post(
        `/api/multi-destination-deliveries/${deliveryId}/bids/${bidId}/counter-offer`,
        counterOfferData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors de la création de la contre-offre:', error);
      throw error;
    }
  }

  /**
   * Rejeter une enchère
   */
  static async rejectBid(deliveryId: number, bidId: number, reason?: string): Promise<void> {
    try {
      const token = await getToken();
      await api.post(`/api/multi-destination-deliveries/${deliveryId}/bids/${bidId}/reject`, 
        { reason },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors du rejet de l\'enchère:', error);
      throw error;
    }
  }
}

export default MultiDestinationService;
export type {
  MultiDestinationDelivery,
  MultiDestinationStop,
  MultiDestinationDeliveryCreate,
  MultiDestinationBid
};
