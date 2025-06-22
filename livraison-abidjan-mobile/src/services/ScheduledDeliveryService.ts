
import { API_BASE_URL } from '../config'
import { getToken } from '../utils/storage'

export interface ScheduledDelivery {
  id: number
  title: string
  description?: string
  pickup_address: string
  pickup_commune: string
  delivery_address: string
  delivery_commune: string
  scheduled_date: string
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly'
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  proposed_price: number
}

export interface CreateScheduledDeliveryRequest {
  title: string
  description?: string
  pickup_address: string
  pickup_commune: string
  delivery_address: string
  delivery_commune: string
  package_description?: string
  proposed_price: number
  scheduled_date: string
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly'
  recurrence_interval?: number
  notification_advance_hours?: number
}

class ScheduledDeliveryService {
  private baseURL = `${API_BASE_URL}/scheduled-deliveries`

  private async getHeaders() {
    const token = await getToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  async getScheduledDeliveries(filters?: any): Promise<ScheduledDelivery[]> {
    try {
      const headers = await this.getHeaders()
      const queryParams = new URLSearchParams()
      
      if (filters?.status) queryParams.append('status', filters.status)
      if (filters?.recurrence_type) queryParams.append('recurrence_type', filters.recurrence_type)
      
      const url = `${this.baseURL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons planifiées:', error)
      throw error
    }
  }

  async createScheduledDelivery(data: CreateScheduledDeliveryRequest): Promise<ScheduledDelivery> {
    try {
      const headers = await this.getHeaders()
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la création de la livraison planifiée:', error)
      throw error
    }
  }

  async updateScheduledDelivery(id: number, data: Partial<CreateScheduledDeliveryRequest>): Promise<ScheduledDelivery> {
    try {
      const headers = await this.getHeaders()
      
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la livraison planifiée:', error)
      throw error
    }
  }

  async deleteScheduledDelivery(id: number): Promise<void> {
    try {
      const headers = await this.getHeaders()
      
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la livraison planifiée:', error)
      throw error
    }
  }

  async pauseScheduledDelivery(id: number): Promise<ScheduledDelivery> {
    try {
      const headers = await this.getHeaders()
      
      const response = await fetch(`${this.baseURL}/${id}/pause`, {
        method: 'POST',
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la pause de la livraison planifiée:', error)
      throw error
    }
  }

  async resumeScheduledDelivery(id: number): Promise<ScheduledDelivery> {
    try {
      const headers = await this.getHeaders()
      
      const response = await fetch(`${this.baseURL}/${id}/resume`, {
        method: 'POST',
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la reprise de la livraison planifiée:', error)
      throw error
    }
  }
}

export default new ScheduledDeliveryService()
