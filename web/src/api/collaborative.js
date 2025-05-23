import axios from "axios"
import { getAuthHeaders } from "./auth"
import config from "@/config"

const BASE_URL = config.API_URL

export default {
  // Récupérer toutes les livraisons collaboratives
  async getCollaborativeDeliveries(params = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries`, {
        params,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching collaborative deliveries:", error)
      throw error
    }
  },

  // Récupérer une livraison collaborative spécifique
  async getCollaborativeDelivery(id) {
    try {
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries/${id}`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Créer une nouvelle livraison collaborative
  async createCollaborativeDelivery(deliveryData) {
    try {
      const response = await axios.post(`${BASE_URL}/collaborative-deliveries`, deliveryData, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error creating collaborative delivery:", error)
      throw error
    }
  },

  // Mettre à jour une livraison collaborative
  async updateCollaborativeDelivery(id, deliveryData) {
    try {
      const response = await axios.put(`${BASE_URL}/collaborative-deliveries/${id}`, deliveryData, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error updating collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Annuler une livraison collaborative
  async cancelCollaborativeDelivery(id) {
    try {
      const response = await axios.post(
        `${BASE_URL}/collaborative-deliveries/${id}/cancel`,
        {},
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(`Error canceling collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Rejoindre une livraison collaborative
  async joinCollaborativeDelivery(id, collaboratorData) {
    try {
      const response = await axios.post(`${BASE_URL}/collaborative-deliveries/${id}/join`, collaboratorData, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error joining collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Quitter une livraison collaborative
  async leaveCollaborativeDelivery(id) {
    try {
      const response = await axios.post(
        `${BASE_URL}/collaborative-deliveries/${id}/leave`,
        {},
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(`Error leaving collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Mettre à jour le statut d'un collaborateur
  async updateCollaboratorStatus(deliveryId, collaboratorId, status) {
    try {
      const response = await axios.put(
        `${BASE_URL}/collaborative-deliveries/${deliveryId}/collaborators/${collaboratorId}`,
        {
          status,
        },
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(`Error updating collaborator status for delivery ${deliveryId}:`, error)
      throw error
    }
  },

  // Récupérer les messages du chat
  async getChatMessages(deliveryId) {
    try {
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries/${deliveryId}/chat`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching chat messages for delivery ${deliveryId}:`, error)
      throw error
    }
  },

  // Envoyer un message dans le chat
  async sendChatMessage(deliveryId, message) {
    try {
      const response = await axios.post(
        `${BASE_URL}/collaborative-deliveries/${deliveryId}/chat`,
        {
          message,
        },
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(`Error sending chat message for delivery ${deliveryId}:`, error)
      throw error
    }
  },

  // Récupérer la distribution des gains
  async getEarningsDistribution(deliveryId) {
    try {
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries/${deliveryId}/earnings`, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching earnings distribution for delivery ${deliveryId}:`, error)
      throw error
    }
  },

  // Récupérer les livraisons collaboratives disponibles
  async getAvailableCollaborativeDeliveries(params = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries/available`, {
        params,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching available collaborative deliveries:", error)
      throw error
    }
  },

  // Récupérer les livraisons collaboratives d'un coursier
  async getCourierCollaborativeDeliveries(status) {
    try {
      const params = status ? { status } : {}
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries/courier`, {
        params,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching courier collaborative deliveries:", error)
      throw error
    }
  },

  // Récupérer les livraisons collaboratives d'un client
  async getClientCollaborativeDeliveries(status) {
    try {
      const params = status ? { status } : {}
      const response = await axios.get(`${BASE_URL}/collaborative-deliveries/client`, {
        params,
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching client collaborative deliveries:", error)
      throw error
    }
  },

  // Démarrer une livraison collaborative
  async startCollaborativeDelivery(id) {
    try {
      const response = await axios.post(
        `${BASE_URL}/collaborative-deliveries/${id}/start`,
        {},
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(`Error starting collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Terminer une livraison collaborative
  async completeCollaborativeDelivery(id) {
    try {
      const response = await axios.post(
        `${BASE_URL}/collaborative-deliveries/${id}/complete`,
        {},
        {
          headers: getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(`Error completing collaborative delivery ${id}:`, error)
      throw error
    }
  },

  // Signaler un problème sur une livraison collaborative
  async reportIssue(id, issueData) {
    try {
      const response = await axios.post(`${BASE_URL}/collaborative-deliveries/${id}/issues`, issueData, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error reporting issue for delivery ${id}:`, error)
      throw error
    }
  },

  // Mettre à jour la position pour une livraison collaborative
  async updateLocation(id, location) {
    try {
      const response = await axios.post(`${BASE_URL}/collaborative-deliveries/${id}/location`, location, {
        headers: getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error(`Error updating location for delivery ${id}:`, error)
      throw error
    }
  },
}
