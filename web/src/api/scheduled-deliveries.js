
import apiClient from './apiService'

// API pour les livraisons planifiées
export const scheduledDeliveriesAPI = {
  // Créer une livraison planifiée
  create: async (data) => {
    try {
      const response = await apiClient.post('/scheduled-deliveries', data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de la livraison planifiée:', error)
      throw error
    }
  },

  // Récupérer les livraisons planifiées
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/scheduled-deliveries', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons planifiées:', error)
      throw error
    }
  },

  // Récupérer une livraison planifiée par ID
  getById: async (scheduleId) => {
    try {
      const response = await apiClient.get(`/scheduled-deliveries/${scheduleId}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la livraison planifiée:', error)
      throw error
    }
  },

  // Mettre à jour une livraison planifiée
  update: async (scheduleId, data) => {
    try {
      const response = await apiClient.put(`/scheduled-deliveries/${scheduleId}`, data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la livraison planifiée:', error)
      throw error
    }
  },

  // Supprimer une livraison planifiée
  delete: async (scheduleId) => {
    try {
      const response = await apiClient.delete(`/scheduled-deliveries/${scheduleId}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la suppression de la livraison planifiée:', error)
      throw error
    }
  },

  // Récupérer les événements du calendrier
  getCalendarEvents: async (startDate, endDate) => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate
      }
      const response = await apiClient.get('/scheduled-deliveries/calendar/events', { params })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error)
      throw error
    }
  },

  // Mettre en pause une livraison planifiée
  pause: async (scheduleId) => {
    try {
      const response = await apiClient.post(`/scheduled-deliveries/${scheduleId}/pause`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise en pause:', error)
      throw error
    }
  },

  // Reprendre une livraison planifiée
  resume: async (scheduleId) => {
    try {
      const response = await apiClient.post(`/scheduled-deliveries/${scheduleId}/resume`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la reprise:', error)
      throw error
    }
  },

  // Exécuter manuellement une livraison planifiée
  execute: async (scheduleId) => {
    try {
      const response = await apiClient.post(`/scheduled-deliveries/${scheduleId}/execute`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error)
      throw error
    }
  },

  // Créer plusieurs livraisons planifiées
  bulkCreate: async (data) => {
    try {
      const response = await apiClient.post('/scheduled-deliveries/bulk-create', data)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création en lot:', error)
      throw error
    }
  },

  // Récupérer les statistiques
  getStats: async () => {
    try {
      const response = await apiClient.get('/scheduled-deliveries/stats/summary')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  },

  // Envoyer les notifications (admin)
  sendNotifications: async () => {
    try {
      const response = await apiClient.post('/scheduled-deliveries/send-notifications')
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error)
      throw error
    }
  },

  // Auto-exécuter les livraisons (admin)
  autoExecute: async () => {
    try {
      const response = await apiClient.post('/scheduled-deliveries/auto-execute')
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'auto-exécution:', error)
      throw error
    }
  }
}

export default scheduledDeliveriesAPI
