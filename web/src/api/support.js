
import apiService from './apiService'

export const supportAPI = {
  // Tickets
  async getTickets(params = {}) {
    return await apiService.get('/support/tickets', { params })
  },

  async getTicket(ticketId) {
    return await apiService.get(`/support/tickets/${ticketId}`)
  },

  async createTicket(ticketData) {
    return await apiService.post('/support/tickets', ticketData)
  },

  async updateTicket(ticketId, updateData) {
    return await apiService.put(`/support/tickets/${ticketId}`, updateData)
  },

  // Messages
  async getTicketMessages(ticketId, includeInternal = false) {
    return await apiService.get(`/support/tickets/${ticketId}/messages`, {
      params: { include_internal: includeInternal }
    })
  },

  async addMessage(ticketId, messageData) {
    return await apiService.post(`/support/tickets/${ticketId}/messages`, messageData)
  },

  // Pièces jointes
  async addAttachment(ticketId, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return await apiService.post(`/support/tickets/${ticketId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Base de connaissances
  async getKnowledgeBase(params = {}) {
    return await apiService.get('/support/knowledge-base', { params })
  },

  async createKnowledgeArticle(articleData) {
    return await apiService.post('/support/knowledge-base', articleData)
  },

  async updateKnowledgeArticle(articleId, updateData) {
    return await apiService.put(`/support/knowledge-base/${articleId}`, updateData)
  },

  async deleteKnowledgeArticle(articleId) {
    return await apiService.delete(`/support/knowledge-base/${articleId}`)
  },

  // Dashboard
  async getDashboard() {
    return await apiService.get('/support/dashboard')
  },

  // Agents (pour l'assignation)
  async getAgents() {
    return await apiService.get('/users', {
      params: { role: 'manager' }
    })
  },

  // Statistiques avancées
  async getTicketStatistics(period = 'month') {
    return await apiService.get('/support/statistics', {
      params: { period }
    })
  },

  async getSatisfactionReports(period = 'month') {
    return await apiService.get('/support/satisfaction', {
      params: { period }
    })
  },

  async getPerformanceMetrics() {
    return await apiService.get('/support/performance')
  }
}

export default supportAPI
