
import apiService from './apiService'

export const deliveriesApi = {
  // CRUD livraisons
  async getAllDeliveries(filters = {}) {
    const response = await apiService.get('/api/v1/deliveries', { params: filters })
    return response.data
  },

  async getDeliveryById(id) {
    const response = await apiService.get(`/api/v1/deliveries/${id}`)
    return response.data
  },

  async createDelivery(data) {
    const response = await apiService.post('/api/v1/deliveries', data)
    return response.data
  },

  async updateDelivery(id, data) {
    const response = await apiService.put(`/api/v1/deliveries/${id}`, data)
    return response.data
  },

  async deleteDelivery(id) {
    const response = await apiService.delete(`/api/v1/deliveries/${id}`)
    return response.data
  },

  // Gestion des statuts
  async updateDeliveryStatus(id, status) {
    const response = await apiService.patch(`/api/v1/deliveries/${id}/status`, { status })
    return response.data
  },

  async assignCourier(deliveryId, courierId) {
    const response = await apiService.post(`/api/v1/deliveries/${deliveryId}/assign`, { courier_id: courierId })
    return response.data
  },

  // Suivi en temps réel
  async getTrackingUpdates(id) {
    const response = await apiService.get(`/api/v1/deliveries/${id}/tracking`)
    return response.data
  },

  async updateLocation(id, location) {
    const response = await apiService.post(`/api/v1/deliveries/${id}/location`, location)
    return response.data
  },

  // Enchères
  async getDeliveryBids(id) {
    const response = await apiService.get(`/api/v1/deliveries/${id}/bids`)
    return response.data
  },

  async acceptBid(deliveryId, bidId) {
    const response = await apiService.post(`/api/v1/deliveries/${deliveryId}/accept-bid/${bidId}`)
    return response.data
  },

  async rejectBid(deliveryId, bidId, reason) {
    const response = await apiService.post(`/api/v1/deliveries/${deliveryId}/reject-bid/${bidId}`, { reason })
    return response.data
  },

  // Statistiques et analyses
  async getDeliveryStats(filters = {}) {
    const response = await apiService.get('/api/v1/deliveries/stats', { params: filters })
    return response.data
  },

  async getDeliveryAnalytics(period = 'week') {
    const response = await apiService.get('/api/v1/deliveries/analytics', { params: { period } })
    return response.data
  },

  // Estimation de prix
  async estimatePrice(data) {
    const response = await apiService.post('/api/v1/deliveries/estimate-price', data)
    return response.data
  },

  // Livraisons express
  async createExpressDelivery(data) {
    const response = await apiService.post('/api/v1/deliveries/express', data)
    return response.data
  },

  async getExpressDeliveries(filters = {}) {
    const response = await apiService.get('/api/v1/deliveries/express', { params: filters })
    return response.data
  },

  // Livraisons collaboratives
  async getCollaborativeDeliveries(filters = {}) {
    const response = await apiService.get('/api/v1/deliveries/collaborative', { params: filters })
    return response.data
  },

  async joinCollaborativeDelivery(id, message) {
    const response = await apiService.post(`/api/v1/deliveries/collaborative/${id}/join`, { message })
    return response.data
  },

  // Rapports et problèmes
  async reportIssue(id, issue) {
    const response = await apiService.post(`/api/v1/deliveries/${id}/report`, issue)
    return response.data
  },

  async getDeliveryReports(filters = {}) {
    const response = await apiService.get('/api/v1/deliveries/reports', { params: filters })
    return response.data
  },

  // Notifications
  async sendDeliveryNotification(id, notification) {
    const response = await apiService.post(`/api/v1/deliveries/${id}/notify`, notification)
    return response.data
  }
}

export default deliveriesApi
