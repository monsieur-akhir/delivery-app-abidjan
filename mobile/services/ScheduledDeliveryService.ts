
import apiClient from './api';
import { API_ENDPOINTS } from '../config/development';

export interface ScheduledDeliveryCreate {
  title: string;
  description?: string;
  pickup_address: string;
  pickup_commune: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_instructions?: string;
  delivery_address: string;
  delivery_commune: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;
  package_description?: string;
  package_size?: string;
  package_weight?: number;
  is_fragile?: boolean;
  cargo_category?: string;
  required_vehicle_type?: string;
  proposed_price?: number;
  delivery_type?: string;
  special_instructions?: string;
  scheduled_date: string;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_interval?: number;
  recurrence_days?: number[];
  end_date?: string;
  max_occurrences?: number;
  notification_advance_hours?: number;
  auto_create_delivery?: boolean;
}

export interface ScheduledDeliveryUpdate {
  title?: string;
  description?: string;
  pickup_address?: string;
  pickup_commune?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_instructions?: string;
  delivery_address?: string;
  delivery_commune?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;
  package_description?: string;
  package_size?: string;
  package_weight?: number;
  is_fragile?: boolean;
  cargo_category?: string;
  required_vehicle_type?: string;
  proposed_price?: number;
  delivery_type?: string;
  special_instructions?: string;
  scheduled_date?: string;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_interval?: number;
  recurrence_days?: number[];
  end_date?: string;
  max_occurrences?: number;
  notification_advance_hours?: number;
  auto_create_delivery?: boolean;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface ScheduledDelivery {
  id: number;
  client_id: number;
  title: string;
  description?: string;
  pickup_address: string;
  pickup_commune: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  pickup_instructions?: string;
  delivery_address: string;
  delivery_commune: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;
  package_description?: string;
  package_size?: string;
  package_weight?: number;
  is_fragile?: boolean;
  cargo_category?: string;
  required_vehicle_type?: string;
  proposed_price?: number;
  delivery_type?: string;
  special_instructions?: string;
  scheduled_date: string;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_interval?: number;
  recurrence_days?: number[];
  end_date?: string;
  max_occurrences?: number;
  notification_advance_hours?: number;
  auto_create_delivery?: boolean;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  next_execution_at?: string;
  total_executions: number;
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  status: string;
  client_name: string;
  pickup_address: string;
  delivery_address: string;
  recurrence_type: string;
}

export interface ScheduledDeliveryStats {
  total_scheduled: number;
  active_schedules: number;
  paused_schedules: number;
  total_executions_this_month: number;
  upcoming_executions_today: number;
  upcoming_executions_this_week: number;
  success_rate: number;
  most_common_recurrence: string;
}

export interface BulkScheduleCreate {
  schedules: ScheduledDeliveryCreate[];
  apply_to_all?: Record<string, any>;
}

class ScheduledDeliveryService {
  private baseURL = '/scheduled-deliveries';

  /**
   * Créer une nouvelle livraison planifiée
   */
  async createScheduledDelivery(data: ScheduledDeliveryCreate): Promise<ScheduledDelivery> {
    try {
      const response = await apiClient.post(this.baseURL, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création de la livraison planifiée:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  }

  /**
   * Récupérer les livraisons planifiées
   */
  async getScheduledDeliveries(
    status?: string,
    skip: number = 0,
    limit: number = 20
  ): Promise<{
    success: boolean;
    schedules: ScheduledDelivery[];
    total: number;
    skip: number;
    limit: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());

      const response = await apiClient.get(`${this.baseURL}?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des livraisons planifiées:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération');
    }
  }

  /**
   * Récupérer une livraison planifiée par ID
   */
  async getScheduledDelivery(scheduleId: number): Promise<{
    success: boolean;
    schedule: ScheduledDelivery;
  }> {
    try {
      const response = await apiClient.get(`${this.baseURL}/${scheduleId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la livraison planifiée:', error);
      throw new Error(error.response?.data?.detail || 'Livraison planifiée non trouvée');
    }
  }

  /**
   * Mettre à jour une livraison planifiée
   */
  async updateScheduledDelivery(
    scheduleId: number,
    data: ScheduledDeliveryUpdate
  ): Promise<{
    success: boolean;
    schedule: ScheduledDelivery;
  }> {
    try {
      const response = await apiClient.put(`${this.baseURL}/${scheduleId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la livraison planifiée:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  }

  /**
   * Supprimer une livraison planifiée
   */
  async deleteScheduledDelivery(scheduleId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.delete(`${this.baseURL}/${scheduleId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la livraison planifiée:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  }

  /**
   * Récupérer les événements du calendrier
   */
  async getCalendarEvents(
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    events: CalendarEvent[];
  }> {
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);

      const response = await apiClient.get(`${this.baseURL}/calendar/events?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération');
    }
  }

  /**
   * Mettre en pause une livraison planifiée
   */
  async pauseScheduledDelivery(scheduleId: number): Promise<{
    success: boolean;
    schedule: ScheduledDelivery;
  }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/${scheduleId}/pause`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise en pause:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la mise en pause');
    }
  }

  /**
   * Reprendre une livraison planifiée
   */
  async resumeScheduledDelivery(scheduleId: number): Promise<{
    success: boolean;
    schedule: ScheduledDelivery;
  }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/${scheduleId}/resume`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la reprise:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la reprise');
    }
  }

  /**
   * Exécuter manuellement une livraison planifiée
   */
  async executeScheduledDelivery(scheduleId: number): Promise<{
    success: boolean;
    delivery_id: number;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/${scheduleId}/execute`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'exécution:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de l\'exécution');
    }
  }

  /**
   * Créer plusieurs livraisons planifiées en une fois
   */
  async bulkCreateScheduledDeliveries(data: BulkScheduleCreate): Promise<{
    success: boolean;
    created_count: number;
    schedules: ScheduledDelivery[];
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/bulk-create`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création en lot:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la création en lot');
    }
  }

  /**
   * Récupérer les statistiques des livraisons planifiées
   */
  async getScheduledDeliveryStats(): Promise<{
    success: boolean;
    stats: ScheduledDeliveryStats;
  }> {
    try {
      const response = await apiClient.get(`${this.baseURL}/stats/summary`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération');
    }
  }

  /**
   * Envoyer les notifications pour les livraisons planifiées (admin)
   */
  async sendScheduledNotifications(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/send-notifications`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    }
  }

  /**
   * Auto-exécuter les livraisons planifiées (admin)
   */
  async autoExecuteScheduledDeliveries(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/auto-execute`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'auto-exécution:', error);
      throw new Error(error.response?.data?.detail || 'Erreur lors de l\'auto-exécution');
    }
  }
}

export default new ScheduledDeliveryService();
