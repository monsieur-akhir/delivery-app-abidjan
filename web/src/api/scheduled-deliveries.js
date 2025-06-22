
import apiService from './apiService'

/**
 * Service pour les livraisons planifiées côté web
 */
class ScheduledDeliveryService {
  constructor() {
    this.baseURL = '/scheduled-deliveries'
  }

  /**
   * Créer une nouvelle livraison planifiée
   */
  async createScheduledDelivery(data) {
    try {
      const response = await apiService.post(this.baseURL, data)
      return response
    } catch (error) {
      console.error('Erreur lors de la création de la livraison planifiée:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la création')
    }
  }

  /**
   * Récupérer les livraisons planifiées
   */
  async getScheduledDeliveries(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.status) queryParams.append('status', params.status)
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString())
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
      if (params.client_id) queryParams.append('client_id', params.client_id.toString())
      if (params.start_date) queryParams.append('start_date', params.start_date)
      if (params.end_date) queryParams.append('end_date', params.end_date)

      const url = queryParams.toString() ? `${this.baseURL}?${queryParams}` : this.baseURL
      const response = await apiService.get(url)
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons planifiées:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération')
    }
  }

  /**
   * Récupérer une livraison planifiée par ID
   */
  async getScheduledDelivery(scheduleId) {
    try {
      const response = await apiService.get(`${this.baseURL}/${scheduleId}`)
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération de la livraison planifiée:', error)
      throw new Error(error.response?.data?.detail || 'Livraison planifiée non trouvée')
    }
  }

  /**
   * Mettre à jour une livraison planifiée
   */
  async updateScheduledDelivery(scheduleId, data) {
    try {
      const response = await apiService.put(`${this.baseURL}/${scheduleId}`, data)
      return response
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la livraison planifiée:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la mise à jour')
    }
  }

  /**
   * Supprimer une livraison planifiée
   */
  async deleteScheduledDelivery(scheduleId) {
    try {
      const response = await apiService.delete(`${this.baseURL}/${scheduleId}`)
      return response
    } catch (error) {
      console.error('Erreur lors de la suppression de la livraison planifiée:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la suppression')
    }
  }

  /**
   * Mettre en pause une livraison planifiée
   */
  async pauseScheduledDelivery(scheduleId) {
    try {
      const response = await apiService.post(`${this.baseURL}/${scheduleId}/pause`)
      return response
    } catch (error) {
      console.error('Erreur lors de la mise en pause:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la mise en pause')
    }
  }

  /**
   * Reprendre une livraison planifiée
   */
  async resumeScheduledDelivery(scheduleId) {
    try {
      const response = await apiService.post(`${this.baseURL}/${scheduleId}/resume`)
      return response
    } catch (error) {
      console.error('Erreur lors de la reprise:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la reprise')
    }
  }

  /**
   * Exécuter manuellement une livraison planifiée
   */
  async executeScheduledDelivery(scheduleId) {
    try {
      const response = await apiService.post(`${this.baseURL}/${scheduleId}/execute`)
      return response
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de l\'exécution')
    }
  }

  /**
   * Récupérer les événements du calendrier
   */
  async getCalendarEvents(startDate, endDate) {
    try {
      const params = new URLSearchParams()
      params.append('start_date', startDate)
      params.append('end_date', endDate)

      const response = await apiService.get(`${this.baseURL}/calendar/events?${params}`)
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération')
    }
  }

  /**
   * Créer plusieurs livraisons planifiées en une fois
   */
  async bulkCreateScheduledDeliveries(data) {
    try {
      const response = await apiService.post(`${this.baseURL}/bulk-create`, data)
      return response
    } catch (error) {
      console.error('Erreur lors de la création en lot:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la création en lot')
    }
  }

  /**
   * Récupérer les statistiques des livraisons planifiées
   */
  async getScheduledDeliveryStats() {
    try {
      const response = await apiService.get(`${this.baseURL}/stats/summary`)
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération')
    }
  }

  /**
   * Coordonner une livraison planifiée (J-1)
   */
  async coordinateScheduledDelivery(executionId, coordinationData) {
    try {
      const response = await apiService.post(`${this.baseURL}/${executionId}/coordinate`, coordinationData)
      return response
    } catch (error) {
      console.error('Erreur lors de la coordination:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la coordination')
    }
  }

  /**
   * Récupérer le statut de coordination
   */
  async getCoordinationStatus(executionId) {
    try {
      const response = await apiService.get(`${this.baseURL}/${executionId}/coordination-status`)
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération')
    }
  }

  /**
   * Récupérer les négociations en attente
   */
  async getPendingNegotiations() {
    try {
      const response = await apiService.get('/negotiations/pending')
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération des négociations:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération')
    }
  }

  /**
   * Répondre à une négociation
   */
  async respondToNegotiation(negotiationId, accept, message) {
    try {
      const response = await apiService.post(`/negotiations/${negotiationId}/respond`, {
        accept: accept,
        message: message
      })
      return response
    } catch (error) {
      console.error('Erreur lors de la réponse à la négociation:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la réponse')
    }
  }

  /**
   * Faire une contre-offre
   */
  async createCounterOffer(negotiationId, proposedPrice, message) {
    try {
      const response = await apiService.post(`/negotiations/${negotiationId}/counter-offer`, {
        proposed_price: proposedPrice,
        message: message
      })
      return response
    } catch (error) {
      console.error('Erreur lors de la contre-offre:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la contre-offre')
    }
  }

  /**
   * Récupérer l'historique des négociations
   */
  async getNegotiationHistory(scheduleId) {
    try {
      const response = await apiService.get(`/negotiations/history/${scheduleId}`)
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw new Error(error.response?.data?.detail || 'Erreur lors de la récupération')
    }
  }

  /**
   * Valider les données avant envoi
   */
  validateScheduleData(data) {
    const errors = []

    if (!data.title || data.title.trim() === '') {
      errors.push('Le titre est obligatoire')
    }

    if (!data.pickup_address || data.pickup_address.trim() === '') {
      errors.push('L\'adresse de ramassage est obligatoire')
    }

    if (!data.delivery_address || data.delivery_address.trim() === '') {
      errors.push('L\'adresse de livraison est obligatoire')
    }

    if (!data.scheduled_date) {
      errors.push('La date de planification est obligatoire')
    }

    if (data.proposed_price && (isNaN(data.proposed_price) || data.proposed_price <= 0)) {
      errors.push('Le prix proposé doit être un nombre positif')
    }

    if (data.recurrence_type && !['none', 'daily', 'weekly', 'monthly'].includes(data.recurrence_type)) {
      errors.push('Type de récurrence invalide')
    }

    return errors
  }

  /**
   * Formatter les données pour l'API
   */
  formatScheduleDataForAPI(formData) {
    const apiData = {
      title: formData.title,
      description: formData.description || '',
      pickup_address: formData.pickup_address,
      pickup_commune: formData.pickup_commune || '',
      pickup_lat: formData.pickup_lat || null,
      pickup_lng: formData.pickup_lng || null,
      pickup_contact_name: formData.pickup_contact_name || '',
      pickup_contact_phone: formData.pickup_contact_phone || '',
      pickup_instructions: formData.pickup_instructions || '',
      delivery_address: formData.delivery_address,
      delivery_commune: formData.delivery_commune || '',
      delivery_lat: formData.delivery_lat || null,
      delivery_lng: formData.delivery_lng || null,
      delivery_contact_name: formData.delivery_contact_name || '',
      delivery_contact_phone: formData.delivery_contact_phone || '',
      delivery_instructions: formData.delivery_instructions || '',
      package_description: formData.package_description || '',
      package_size: formData.package_size || 'medium',
      package_weight: formData.package_weight ? parseFloat(formData.package_weight) : null,
      is_fragile: Boolean(formData.is_fragile),
      cargo_category: formData.cargo_category || '',
      required_vehicle_type: formData.required_vehicle_type || '',
      proposed_price: formData.proposed_price ? parseFloat(formData.proposed_price) : null,
      delivery_type: formData.delivery_type || 'standard',
      special_instructions: formData.special_instructions || '',
      scheduled_date: formData.scheduled_date,
      recurrence_type: formData.recurrence_type || 'none',
      recurrence_interval: formData.recurrence_interval ? parseInt(formData.recurrence_interval) : null,
      recurrence_days: formData.recurrence_days || [],
      end_date: formData.end_date || null,
      max_occurrences: formData.max_occurrences ? parseInt(formData.max_occurrences) : null,
      notification_advance_hours: formData.notification_advance_hours ? parseInt(formData.notification_advance_hours) : 24,
      auto_create_delivery: Boolean(formData.auto_create_delivery)
    }

    return apiData
  }
}

export default new ScheduledDeliveryService()
