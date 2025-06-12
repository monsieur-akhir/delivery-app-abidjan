
import apiService from './apiService'

export const analyticsApi = {
  // Tableau de bord global
  async getDashboardStats(period = 'week') {
    const response = await apiService.get('/api/v1/analytics/dashboard', { params: { period } })
    return response.data
  },

  async getKPIs(startDate, endDate) {
    const response = await apiService.get('/api/v1/analytics/kpis', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  // Analyses des livraisons
  async getDeliveryAnalytics(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/deliveries', { params: filters })
    return response.data
  },

  async getDeliveryTrends(period = 'month') {
    const response = await apiService.get('/api/v1/analytics/deliveries/trends', { params: { period } })
    return response.data
  },

  async getPerformanceMetrics(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/performance', { params: filters })
    return response.data
  },

  // Analyses géographiques
  async getGeographicAnalytics(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/geographic', { params: filters })
    return response.data
  },

  async getCommuneStats(commune) {
    const response = await apiService.get(`/api/v1/analytics/communes/${commune}`)
    return response.data
  },

  async getHeatmapData(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/heatmap', { params: filters })
    return response.data
  },

  // Analyses financières
  async getRevenueAnalytics(period = 'month') {
    const response = await apiService.get('/api/v1/analytics/revenue', { params: { period } })
    return response.data
  },

  async getProfitabilityAnalysis(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/profitability', { params: filters })
    return response.data
  },

  async getCostAnalysis(period = 'month') {
    const response = await apiService.get('/api/v1/analytics/costs', { params: { period } })
    return response.data
  },

  // Analyses des utilisateurs
  async getUserAnalytics(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/users', { params: filters })
    return response.data
  },

  async getClientBehavior(period = 'month') {
    const response = await apiService.get('/api/v1/analytics/clients/behavior', { params: { period } })
    return response.data
  },

  async getCourierPerformance(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/couriers/performance', { params: filters })
    return response.data
  },

  // Analyses prédictives
  async getDemandForecast(period = 'week') {
    const response = await apiService.get('/api/v1/analytics/forecast/demand', { params: { period } })
    return response.data
  },

  async getOptimalPricing(route) {
    const response = await apiService.post('/api/v1/analytics/pricing/optimal', route)
    return response.data
  },

  async getResourceOptimization(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/optimization/resources', { params: filters })
    return response.data
  },

  // Rapports personnalisés
  async generateCustomReport(config) {
    const response = await apiService.post('/api/v1/analytics/reports/custom', config)
    return response.data
  },

  async getReportTemplates() {
    const response = await apiService.get('/api/v1/analytics/reports/templates')
    return response.data
  },

  async exportReport(reportId, format = 'excel') {
    const response = await apiService.get(`/api/v1/analytics/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // Analyses de trafic
  async getTrafficAnalytics(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/traffic', { params: filters })
    return response.data
  },

  async getPeakHours(period = 'week') {
    const response = await apiService.get('/api/v1/analytics/traffic/peak-hours', { params: { period } })
    return response.data
  },

  async getRouteOptimization(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/routes/optimization', { params: filters })
    return response.data
  },

  // Analyses de satisfaction
  async getSatisfactionMetrics(period = 'month') {
    const response = await apiService.get('/api/v1/analytics/satisfaction', { params: { period } })
    return response.data
  },

  async getRatingAnalysis(filters = {}) {
    const response = await apiService.get('/api/v1/analytics/ratings', { params: filters })
    return response.data
  },

  async getComplaintAnalysis(period = 'month') {
    const response = await apiService.get('/api/v1/analytics/complaints', { params: { period } })
    return response.data
  }
}

export default analyticsApi
