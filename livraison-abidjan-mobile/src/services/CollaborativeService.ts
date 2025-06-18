import api from "./api"
import type { CollaborativeDelivery, Collaborator, ChatMessage, EarningsDistribution } from "../types/models"

class CollaborativeService {
  // Collaborative Delivery endpoints
  async getCollaborativeDeliveries(params?: {
    status?: string
    skip?: number
    limit?: number
  }): Promise<CollaborativeDelivery[]> {
    try {
      const response = await api.get("/collaborative-deliveries", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching collaborative deliveries:", error)
      throw error
    }
  }

  async getCollaborativeDelivery(id: string): Promise<CollaborativeDelivery> {
    try {
      const response = await api.get(`/collaborative-deliveries/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async createCollaborativeDelivery(deliveryData: Partial<CollaborativeDelivery>): Promise<CollaborativeDelivery> {
    try {
      const response = await api.post("/collaborative-deliveries", deliveryData)
      return response.data
    } catch (error) {
      console.error("Error creating collaborative delivery:", error)
      throw error
    }
  }

  async updateCollaborativeDelivery(
    id: string,
    deliveryData: Partial<CollaborativeDelivery>,
  ): Promise<CollaborativeDelivery> {
    try {
      const response = await api.put(`/collaborative-deliveries/${id}`, deliveryData)
      return response.data
    } catch (error) {
      console.error(`Error updating collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async cancelCollaborativeDelivery(id: string): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${id}/cancel`)
    } catch (error) {
      console.error(`Error canceling collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async getDeliveryById(id: string): Promise<CollaborativeDelivery> {
    try {
      const response = await api.get(`/collaborative-deliveries/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async startDelivery(id: string): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${id}/start`)
    } catch (error) {
      console.error(`Error starting collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async completeDelivery(id: string): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${id}/complete`)
    } catch (error) {
      console.error(`Error completing collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async cancelDelivery(id: string): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${id}/cancel`)
    } catch (error) {
      console.error(`Error canceling collaborative delivery ${id}:`, error)
      throw error
    }
  }

  async reportIssue(id: string, issue: { type: string; description: string; photos?: string[] }): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${id}/issues`, issue)
    } catch (error) {
      console.error(`Error reporting issue for delivery ${id}:`, error)
      throw error
    }
  }

  async updateLocation(id: string, location: { lat: number; lng: number }): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${id}/location`, location)
    } catch (error) {
      console.error(`Error updating location for delivery ${id}:`, error)
      throw error
    }
  }

  // Collaborator endpoints
  async joinCollaborativeDelivery(deliveryId: string, collaboratorData: Partial<Collaborator>): Promise<Collaborator> {
    try {
      const response = await api.post(`/collaborative-deliveries/${deliveryId}/join`, collaboratorData)
      return response.data
    } catch (error) {
      console.error(`Error joining collaborative delivery ${deliveryId}:`, error)
      throw error
    }
  }

  async leaveCollaborativeDelivery(deliveryId: string): Promise<void> {
    try {
      await api.post(`/collaborative-deliveries/${deliveryId}/leave`)
    } catch (error) {
      console.error(`Error leaving collaborative delivery ${deliveryId}:`, error)
      throw error
    }
  }

  async updateCollaboratorStatus(deliveryId: string, collaboratorId: string, status: string): Promise<Collaborator> {
    try {
      const response = await api.put(`/collaborative-deliveries/${deliveryId}/collaborators/${collaboratorId}`, {
        status,
      })
      return response.data
    } catch (error) {
      console.error(`Error updating collaborator status for delivery ${deliveryId}:`, error)
      throw error
    }
  }

  // Chat endpoints
  async getChatMessages(deliveryId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/collaborative-deliveries/${deliveryId}/chat`)
      return response.data
    } catch (error) {
      console.error(`Error fetching chat messages for delivery ${deliveryId}:`, error)
      throw error
    }
  }

  async sendChatMessage(deliveryId: string, message: string): Promise<ChatMessage> {
    try {
      const response = await api.post(`/collaborative-deliveries/${deliveryId}/chat`, { message })
      return response.data
    } catch (error) {
      console.error(`Error sending chat message for delivery ${deliveryId}:`, error)
      throw error
    }
  }

  // Earnings endpoints
  async getEarningsDistribution(deliveryId: string): Promise<EarningsDistribution> {
    try {
      const response = await api.get(`/collaborative-deliveries/${deliveryId}/earnings`)
      return response.data
    } catch (error) {
      console.error(`Error fetching earnings distribution for delivery ${deliveryId}:`, error)
      throw error
    }
  }

  async getAvailableCollaborativeDeliveries(params?: {
    commune?: string
    maxDistance?: number
    skip?: number
    limit?: number
  }): Promise<CollaborativeDelivery[]> {
    try {
      const response = await api.get("/collaborative-deliveries/available", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching available collaborative deliveries:", error)
      throw error
    }
  }

  async getMyCourierCollaborativeDeliveries(status?: string): Promise<CollaborativeDelivery[]> {
    try {
      const params = status ? { status } : undefined
      const response = await api.get("/collaborative-deliveries/courier", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching courier collaborative deliveries:", error)
      throw error
    }
  }

  async getMyClientCollaborativeDeliveries(status?: string): Promise<CollaborativeDelivery[]> {
    try {
      const params = status ? { status } : undefined
      const response = await api.get("/collaborative-deliveries/client", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching client collaborative deliveries:", error)
      throw error
    }
  }
}

export default new CollaborativeService()
