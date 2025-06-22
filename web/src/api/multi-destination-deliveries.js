
import axios from './apiService'

const API_BASE = '/api/multi-destination-deliveries'

export default {
  // Récupérer les livraisons avec filtres et pagination
  async getDeliveries(params = {}) {
    try {
      const response = await axios.get(API_BASE, { params })
      
      // Transformer la réponse pour inclure la pagination
      const data = response.data
      return {
        data: Array.isArray(data) ? data : [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 12,
          total: Array.isArray(data) ? data.length : 0,
          pages: Math.ceil((Array.isArray(data) ? data.length : 0) / (params.limit || 12))
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons:', error)
      throw this.handleError(error)
    }
  },

  // Récupérer une livraison par ID
  async getDelivery(deliveryId) {
    try {
      const response = await axios.get(`${API_BASE}/${deliveryId}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la livraison:', error)
      throw this.handleError(error)
    }
  },

  // Créer une nouvelle livraison multi-destinataires
  async createDelivery(deliveryData) {
    try {
      // Validation des données
      this.validateDeliveryData(deliveryData)
      
      const response = await axios.post(API_BASE, deliveryData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de la livraison:', error)
      throw this.handleError(error)
    }
  },

  // Mettre à jour une livraison
  async updateDelivery(deliveryId, updateData) {
    try {
      const response = await axios.put(`${API_BASE}/${deliveryId}`, updateData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la livraison:', error)
      throw this.handleError(error)
    }
  },

  // Annuler une livraison
  async cancelDelivery(deliveryId, reason = '') {
    try {
      const response = await axios.post(`${API_BASE}/${deliveryId}/cancel`, { reason })
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la livraison:', error)
      throw this.handleError(error)
    }
  },

  // Récupérer les enchères pour une livraison
  async getDeliveryBids(deliveryId) {
    try {
      const response = await axios.get(`${API_BASE}/${deliveryId}/bids`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des enchères:', error)
      throw this.handleError(error)
    }
  },

  // Accepter une enchère
  async acceptBid(deliveryId, bidId) {
    try {
      const response = await axios.post(`${API_BASE}/${deliveryId}/bids/${bidId}/accept`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'enchère:', error)
      throw this.handleError(error)
    }
  },

  // Rejeter une enchère
  async rejectBid(deliveryId, bidId, reason = '') {
    try {
      const response = await axios.post(`${API_BASE}/${deliveryId}/bids/${bidId}/reject`, { reason })
      return response.data
    } catch (error) {
      console.error('Erreur lors du rejet de l\'enchère:', error)
      throw this.handleError(error)
    }
  },

  // Calculer le prix optimisé
  async calculateOptimizedPrice(deliveryData) {
    try {
      const response = await axios.post(`${API_BASE}/calculate-price`, deliveryData)
      return response.data
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error)
      throw this.handleError(error)
    }
  },

  // Optimiser la route
  async optimizeRoute(deliveryId) {
    try {
      const response = await axios.post(`${API_BASE}/${deliveryId}/optimize-route`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'optimisation de la route:', error)
      throw this.handleError(error)
    }
  },

  // Obtenir les statistiques
  async getStatistics(period = 'month') {
    try {
      const response = await axios.get(`${API_BASE}/statistics`, {
        params: { period }
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw this.handleError(error)
    }
  },

  // Exporter les données
  async exportDeliveries(format = 'csv', filters = {}) {
    try {
      const response = await axios.get(`${API_BASE}/export`, {
        params: { format, ...filters },
        responseType: 'blob'
      })
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `livraisons-multi-destinataires-${new Date().toISOString().split('T')[0]}.${format}`
      link.click()
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      throw this.handleError(error)
    }
  },

  // Valider les données de livraison
  validateDeliveryData(deliveryData) {
    const errors = []

    // Validation adresse de ramassage
    if (!deliveryData.pickup_address?.trim()) {
      errors.push('L\'adresse de ramassage est requise')
    }

    if (!deliveryData.pickup_commune?.trim()) {
      errors.push('La commune de ramassage est requise')
    }

    // Validation destinations
    if (!deliveryData.destinations || !Array.isArray(deliveryData.destinations)) {
      errors.push('Les destinations sont requises')
    } else {
      if (deliveryData.destinations.length < 2) {
        errors.push('Au moins 2 destinations sont requises')
      }

      if (deliveryData.destinations.length > 10) {
        errors.push('Maximum 10 destinations autorisées')
      }

      deliveryData.destinations.forEach((dest, index) => {
        if (!dest.delivery_address?.trim()) {
          errors.push(`L'adresse de la destination ${index + 1} est requise`)
        }
        if (!dest.recipient_name?.trim()) {
          errors.push(`Le nom du destinataire ${index + 1} est requis`)
        }
        if (!dest.delivery_commune?.trim()) {
          errors.push(`La commune de la destination ${index + 1} est requise`)
        }
      })
    }

    // Validation prix
    if (!deliveryData.total_proposed_price || deliveryData.total_proposed_price <= 0) {
      errors.push('Le prix proposé doit être supérieur à 0')
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    return true
  },

  // Calculer le prix suggéré
  calculateSuggestedPrice(totalDistance, numberOfDestinations, options = {}) {
    const basePrice = options.basePrice || 2000 // Prix de base
    const pricePerKm = options.pricePerKm || 200 // Prix par kilomètre
    const pricePerDestination = options.pricePerDestination || 500 // Prix par destination supplémentaire
    const urgentMultiplier = options.isUrgent ? 1.5 : 1
    const fragileMultiplier = options.isFragile ? 1.2 : 1
    
    const distancePrice = totalDistance * pricePerKm
    const destinationPrice = Math.max(0, numberOfDestinations - 1) * pricePerDestination
    
    const subtotal = basePrice + distancePrice + destinationPrice
    const total = subtotal * urgentMultiplier * fragileMultiplier
    
    return Math.round(total)
  },

  // Gestion des erreurs
  handleError(error) {
    if (error.response) {
      // Erreur de réponse du serveur
      const status = error.response.status
      const message = error.response.data?.detail || error.response.data?.message || 'Erreur serveur'
      
      switch (status) {
        case 400:
          return new Error(`Données invalides: ${message}`)
        case 401:
          return new Error('Vous devez être connecté pour effectuer cette action')
        case 403:
          return new Error('Vous n\'avez pas l\'autorisation pour effectuer cette action')
        case 404:
          return new Error('Livraison non trouvée')
        case 422:
          return new Error(`Erreur de validation: ${message}`)
        case 500:
          return new Error('Erreur interne du serveur')
        default:
          return new Error(`Erreur ${status}: ${message}`)
      }
    } else if (error.request) {
      // Erreur de réseau
      return new Error('Erreur de connexion. Vérifiez votre connexion internet.')
    } else {
      // Autre erreur
      return new Error(error.message || 'Une erreur inattendue s\'est produite')
    }
  }
}
