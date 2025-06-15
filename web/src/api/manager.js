import axios from 'axios'
import { API_URL } from '@/config'
import authApi from './auth'
import { handleApiError } from '../services/errorHandler'

// Configuration de l'instance axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gestion des erreurs
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Gérer les erreurs d'authentification
    if (error.response && error.response.status === 401) {
      // Rediriger vers la page de connexion ou rafraîchir le token
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_data')

      // Rediriger vers la page de connexion
      window.location.href = '/login?session_expired=true'
    }
    return Promise.reject(error)
  }
)

// API pour les zones de livraison
export const fetchZones = async (params = {}) => {
  const response = await apiClient.get('/zones', { params })
  return response.data
}

export const fetchZoneDetails = async zoneId => {
  const response = await apiClient.get(`/zones/${zoneId}`)
  return response.data
}

export const createZone = async zoneData => {
  const response = await apiClient.post('/zones', zoneData)
  return response.data
}

export const updateZone = async (zoneId, zoneData) => {
  const response = await apiClient.put(`/zones/${zoneId}`, zoneData)
  return response.data
}

export const deleteZone = async zoneId => {
  const response = await apiClient.delete(`/zones/${zoneId}`)
  return response.data
}

export const activateZone = async zoneId => {
  const response = await apiClient.post(`/zones/${zoneId}/activate`)
  return response.data
}

export const deactivateZone = async zoneId => {
  const response = await apiClient.post(`/zones/${zoneId}/deactivate`)
  return response.data
}

// API pour les coursiers
export const fetchCouriers = async (params = {}) => {
  const response = await apiClient.get('/couriers', { params })
  return response.data
}

export const fetchCourierDetails = async courierId => {
  const response = await apiClient.get(`/couriers/${courierId}`)
  return response.data
}

export const fetchCourierDeliveries = async (courierId, params = {}) => {
  const response = await apiClient.get(`/couriers/${courierId}/deliveries`, { params })
  return response.data
}

export const fetchCourierPayments = async (courierId, params = {}) => {
  const response = await apiClient.get(`/couriers/${courierId}/payments`, { params })
  return response.data
}

export const addCourier = async courierData => {
  const response = await apiClient.post('/couriers', courierData)
  return response.data
}

export const updateCourier = async (courierId, courierData) => {
  const response = await apiClient.put(`/couriers/${courierId}`, courierData)
  return response.data
}

export const updateCourierStatus = async (courierId, status) => {
  const response = await apiClient.patch(`/couriers/${courierId}/status`, { status })
  return response.data
}

export const verifyCourierDocument = async (courierId, documentType) => {
  const response = await apiClient.post(`/couriers/${courierId}/verify-document`, {
    document_type: documentType,
  })
  return response.data
}

export const rejectCourierDocument = async (courierId, documentType) => {
  const response = await apiClient.post(`/couriers/${courierId}/reject-document`, {
    document_type: documentType,
  })
  return response.data
}

export const verifyCourierKyc = async courierId => {
  const response = await apiClient.post(`/couriers/${courierId}/verify-kyc`)
  return response.data
}

export const rejectCourierKyc = async (courierId, reason) => {
  const response = await apiClient.post(`/couriers/${courierId}/reject-kyc`, { reason })
  return response.data
}

export const sendCourierNotification = async (courierId, notificationData) => {
  const response = await apiClient.post(
    `/couriers/${courierId}/send-notification`,
    notificationData
  )
  return response.data
}

// API pour les notifications
export const fetchNotifications = async (params = {}) => {
  const response = await apiClient.get('/notifications', { params })
  return response.data
}

export const fetchNotificationDetails = async notificationId => {
  const response = await apiClient.get(`/notifications/${notificationId}`)
  return response.data
}

export const fetchNotificationStats = async () => {
  const response = await apiClient.get('/notifications/stats')
  return response.data
}

export const createNotification = async notificationData => {
  const response = await apiClient.post('/notifications', notificationData)
  return response.data
}

export const updateNotification = async (notificationId, notificationData) => {
  const response = await apiClient.put(`/notifications/${notificationId}`, notificationData)
  return response.data
}

export const deleteNotification = async notificationId => {
  const response = await apiClient.delete(`/notifications/${notificationId}`)
  return response.data
}

export const sendNotificationNow = async notificationId => {
  const response = await apiClient.post(`/notifications/${notificationId}/send`)
  return response.data
}

export const cancelScheduledNotification = async notificationId => {
  const response = await apiClient.post(`/notifications/${notificationId}/cancel`)
  return response.data
}

export const resendNotificationToRecipients = async notificationId => {
  const response = await apiClient.post(`/notifications/${notificationId}/resend`)
  return response.data
}

// API pour les analyses
export const fetchAnalytics = async (params = {}) => {
  const response = await apiClient.get('/analytics', { params })
  return response.data
}

export const fetchCourierPerformanceAnalytics = async (params = {}) => {
  const response = await apiClient.get('/analytics/courier-performance', { params })
  return response.data
}

export const fetchTimeAnalytics = async (params = {}) => {
  const response = await apiClient.get('/analytics/time', { params })
  return response.data
}

export const fetchRevenueAnalytics = async (params = {}) => {
  const response = await apiClient.get('/analytics/revenue', { params })
  return response.data
}

export const fetchUserAnalytics = async (params = {}) => {
  const response = await apiClient.get('/analytics/users', { params })
  return response.data
}

export const exportAnalyticsData = async (params = {}) => {
  const response = await apiClient.post('/analytics/export', params, {
    responseType: 'blob',
  })

  // Créer un lien de téléchargement pour le fichier
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url

  // Déterminer le nom du fichier et l'extension
  const contentDisposition = response.headers['content-disposition']
  let filename = 'export'

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/)
    if (filenameMatch.length === 2) {
      filename = filenameMatch[1]
    }
  } else {
    // Utiliser le nom fourni dans les paramètres ou un nom par défaut avec l'extension appropriée
    filename = `${params.filename || 'analytics-export'}.${params.format}`
  }

  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()

  return true
}

// API pour les analyses manager
export const getAnalyticsData = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()

    if (params.dateRange) {
      queryParams.append('dateRange', params.dateRange)
    }

    if (params.startDate) {
      queryParams.append('startDate', params.startDate)
    }

    if (params.endDate) {
      queryParams.append('endDate', params.endDate)
    }

    if (params.commune) {
      queryParams.append('commune', params.commune)
    }

    const response = await apiClient.get(`/manager/stats/chart?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des données analytiques:', error)
    throw error
  }
}

export const getCourierPerformance = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams()

    if (params.dateRange) {
      queryParams.append('dateRange', params.dateRange)
    }

    if (params.startDate) {
      queryParams.append('startDate', params.startDate)
    }

    if (params.endDate) {
      queryParams.append('endDate', params.endDate)
    }

    if (params.commune) {
      queryParams.append('commune', params.commune)
    }

    const response = await apiClient.get(`/manager/couriers/performance?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des performances des coursiers:', error)
    throw error
  }
}

export const getBusinessAnalytics = async (params = {}) => {
  try {
    const response = await apiClient.get('/manager/analytics/business', { params })
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics business:', error)
    throw error
  }
}

export const exportAnalyticsReport = async (params = {}) => {
  try {
    const response = await apiClient.post('/manager/analytics/export', params, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    const contentDisposition = response.headers['content-disposition']
    let filename = 'analytics-export.csv'

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1]
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()

    return true
  } catch (error) {
    console.error('Erreur lors de l\'export du rapport analytics:', error)
    throw error
  }
}

// API pour les utilisateurs
export const fetchUsers = async (params = {}) => {
  const response = await apiClient.get('/api/users', { params })
  return response.data
}

export const fetchUser = async userId => {
  const response = await apiClient.get(`/api/users/${userId}`)
  return response.data
}

export const fetchUserDetails = async userId => {
  const response = await apiClient.get(`/api/users/${userId}`)
  return response.data
}

export const createUser = async userData => {
  const response = await apiClient.post('/api/users', userData)
  return response.data
}

export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/api/users/${userId}`, userData)
  return response.data
}

export const deleteUser = async userId => {
  const response = await apiClient.delete(`/api/users/${userId}`)
  return response.data
}

export const updateUserStatus = async (userId, status) => {
  const response = await apiClient.patch(`/api/users/${userId}/status`, { status })
  return response.data
}

export const bulkUpdateUsers = async usersData => {
  const response = await apiClient.put('/api/users/bulk', usersData)
  return response.data
}

export const fetchUserActivity = async userId => {
  const response = await apiClient.get(`/api/users/${userId}/activity`)
  return response.data
}

export const fetchUserDeliveries = async userId => {
  const response = await apiClient.get(`/api/users/${userId}/deliveries`)
  return response.data
}

export const fetchUserPayments = async userId => {
  const response = await apiClient.get(`/api/users/${userId}/payments`)
  return response.data
}

export const addUser = async userData => {
  const response = await apiClient.post('/api/users', userData)
  return response.data
}

export const verifyUserDocument = async (userId, documentType) => {
  const response = await apiClient.post(`/api/users/${userId}/verify-document`, {
    document_type: documentType,
  })
  return response.data
}

export const rejectUserDocument = async (userId, documentType) => {
  const response = await apiClient.post(`/api/users/${userId}/reject-document`, {
    document_type: documentType,
  })
  return response.data
}

export const verifyUserKyc = async userId => {
  const response = await apiClient.post(`/api/users/${userId}/verify-kyc`)
  return response.data
}

export const rejectUserKyc = async (userId, reason) => {
  const response = await apiClient.post(`/api/users/${userId}/reject-kyc`, { reason })
  return response.data
}

// API pour les entreprises
export const fetchBusinesses = async (params = {}) => {
  const response = await apiClient.get('/businesses', { params })
  return response.data
}

export const fetchBusiness = async businessId => {
  const response = await apiClient.get(`/businesses/${businessId}`)
  return response.data
}

export const updateBusiness = async (businessId, businessData) => {
  const response = await apiClient.put(`/businesses/${businessId}`, businessData)
  return response.data
}

export const updateBusinessStatus = async (businessId, status) => {
  const response = await apiClient.patch(`/businesses/${businessId}/status`, { status })
  return response.data
}

// API pour les livraisons
export const fetchDeliveries = async (params = {}) => {
  const response = await apiClient.get('/deliveries', { params })
  return response.data
}

export const fetchDelivery = async deliveryId => {
  const response = await apiClient.get(`/deliveries/${deliveryId}`)
  return response.data
}

export const fetchDeliveryDetails = async deliveryId => {
  const response = await apiClient.get(`/deliveries/${deliveryId}`)
  return response.data
}

export const updateDeliveryStatus = async (deliveryId, status) => {
  const response = await apiClient.patch(`/deliveries/${deliveryId}/status`, { status })
  return response.data
}

export const cancelDelivery = async deliveryId => {
  const response = await apiClient.post(`/deliveries/${deliveryId}/cancel`)
  return response.data
}

export const assignCourier = async (deliveryId, courierId) => {
  const response = await apiClient.post(`/deliveries/${deliveryId}/assign`, { courier_id: courierId })
  return response.data
}

export const resolveDeliveryDispute = async (deliveryId, resolutionData) => {
  const response = await apiClient.post(`/deliveries/${deliveryId}/resolve-dispute`, resolutionData)
  return response.data
}

// API pour les finances
export const fetchFinancialReports = async (params = {}) => {
  const response = await apiClient.get('/finances/reports', { params })
  return response.data
}

export const createTransaction = async transactionData => {
  const response = await apiClient.post('/finances/transactions', transactionData)
  return response.data
}

export const approveTransaction = async transactionId => {
  const response = await apiClient.post(`/finances/transactions/${transactionId}/approve`)
  return response.data
}

export const rejectTransaction = async (transactionId, reason) => {
  const response = await apiClient.post(`/finances/transactions/${transactionId}/reject`, {
    reason,
  })
  return response.data
}

export const resolveTransactionDispute = async (transactionId, resolutionData) => {
  const response = await apiClient.post(
    `/finances/transactions/${transactionId}/resolve-dispute`,
    resolutionData
  )
  return response.data
}

export const getFinancialSummary = async (params = {}) => {
  const response = await apiClient.get('/finances/summary', { params })
  return response.data
}

export const getTransactions = async (params = {}) => {
  const response = await apiClient.get('/finances/transactions', { params })
  return response.data
}

export const getPayouts = async (params = {}) => {
  const response = await apiClient.get('/finances/payouts', { params })
  return response.data
}

export const processPayout = async payoutData => {
  const response = await apiClient.post('/finances/payouts', payoutData)
  return response.data
}

// API pour les rapports
export const fetchReports = async (params = {}) => {
  const response = await apiClient.get('/reports', { params })
  return response.data
}

export const fetchReportDetails = async reportId => {
  const response = await apiClient.get(`/reports/${reportId}`)
  return response.data
}

export const generateReport = async reportData => {
  const response = await apiClient.post('/reports/generate', reportData)
  return response.data
}

export const downloadReport = async (reportId, format = 'pdf') => {
  try {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob',
    })

    // Créer un lien de téléchargement pour le fichier
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    // Déterminer le nom du fichier
    const contentDisposition = response.headers['content-disposition']
    let filename = `report-${reportId}.${format}`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1]
      }
    }
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()

    return true
  } catch (error) {
    console.error('Erreur lors du téléchargement du rapport:', error)
    throw error
  }
}

export const exportReport = async (reportId, format = 'pdf') => {
  try {
    const response = await apiClient.get(`/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    const contentDisposition = response.headers['content-disposition']
    let filename = `report-${reportId}.${format}`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1]
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()

    return true
  } catch (error) {
    console.error('Erreur lors de l\'export du rapport:', error)
    throw error
  }
}

// API pour les promotions
export const fetchPromotions = async (params = {}) => {
  const response = await apiClient.get('/promotions', { params })
  return response.data
}

export const createPromotion = async promotionData => {
  const response = await apiClient.post('/promotions', promotionData)
  return response.data
}

export const updatePromotion = async (promotionId, promotionData) => {
  const response = await apiClient.put(`/promotions/${promotionId}`, promotionData)
  return response.data
}

export const deletePromotion = async promotionId => {
  const response = await apiClient.delete(`/promotions/${promotionId}`)
  return response.data
}

export const activatePromotion = async promotionId => {
  const response = await apiClient.post(`/promotions/${promotionId}/activate`)
  return response.data
}

export const deactivatePromotion = async promotionId => {
  const response = await apiClient.post(`/promotions/${promotionId}/deactivate`)
  return response.data
}

// API pour les paramètres
export const fetchSystemSettingsManager = async () => {
  const response = await apiClient.get('/manager/settings')
  return response.data
}

export const updateSystemSettingsManager = async settingsData => {
  const response = await apiClient.put('/manager/settings', settingsData)
  return response.data
}

export const getManagerSettings = async () => {
  const response = await apiClient.get('/manager/settings')
  return response.data
}

export const updateManagerSettings = async settingsData => {
  const response = await apiClient.put('/manager/settings', settingsData)
  return response.data
}

// API pour le tableau de bord
export const fetchDashboardData = async () => {
  const response = await apiClient.get('/dashboard')
  return response.data
}

// Fonctions manquantes ajoutées
export const sendNotification = async (notificationData) => {
  const response = await apiClient.post('/notifications/send', notificationData)
  return response.data
}

export const sendBulkNotification = async (notificationData) => {
  const response = await apiClient.post('/notifications/bulk-send', notificationData)
  return response.data
}

export const fetchKycDocuments = async (params = {}) => {
  const response = await apiClient.get('/kyc/documents', { params })
  return response.data
}

export const verifyKycDocument = async (documentId) => {
  const response = await apiClient.post(`/kyc/documents/${documentId}/verify`)
  return response.data
}

export const rejectKycDocument = async (documentId, reason) => {
  const response = await apiClient.post(`/kyc/documents/${documentId}/reject`, { reason })
  return response.data
}

export const fetchTickets = async (params = {}) => {
  const response = await apiClient.get('/support/tickets', { params })
  return response.data
}

export const updateTicketStatus = async (ticketId, status) => {
  const response = await apiClient.patch(`/support/tickets/${ticketId}/status`, { status })
  return response.data
}

export const assignTicket = async (ticketId, assigneeId) => {
  const response = await apiClient.post(`/support/tickets/${ticketId}/assign`, { assignee_id: assigneeId })
  return response.data
}

export const fetchVehicles = async (params = {}) => {
  const response = await apiClient.get('/vehicles', { params })
  return response.data
}

export const verifyVehicle = async (vehicleId) => {
  const response = await apiClient.post(`/vehicles/${vehicleId}/verify`)
  return response.data
}

export const rejectVehicle = async (vehicleId, reason) => {
  const response = await apiClient.post(`/vehicles/${vehicleId}/reject`, { reason })
  return response.data
}

export const fetchPolicies = async (params = {}) => {
  const response = await apiClient.get('/policies', { params })
  return response.data
}

export const createPolicy = async (policyData) => {
  const response = await apiClient.post('/policies', policyData)
  return response.data
}

export const updatePolicy = async (policyId, policyData) => {
  const response = await apiClient.put(`/policies/${policyId}`, policyData)
  return response.data
}

export const deletePolicy = async (policyId) => {
  const response = await apiClient.delete(`/policies/${policyId}`)
  return response.data
}

export const exportAuditLogs = async (params = {}) => {
  const response = await apiClient.post('/audit/export', params, {
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url

  const contentDisposition = response.headers['content-disposition']
  let filename = 'audit-logs.csv'

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/)
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1]
    }
  }

  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()

  return true
}

export const getSystemHealth = async () => {
  const response = await apiClient.get('/system/health')
  return response.data
}

export const getSystemMetrics = async () => {
  const response = await apiClient.get('/system/metrics')
  return response.data
}

export const subscribeToUpdates = (callback) => {
  console.log('Subscribe to updates:', callback)
}

export const unsubscribeFromUpdates = () => {
  console.log('Unsubscribe from updates')
}

export const getGlobalStats = async (params = {}) => {
  try {
    const response = await apiClient.get('/manager/stats', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching global stats:', error)
    throw error
  }
}

export const getChartData = async (chartType, startDate, endDate, commune) => {
  try {
    const params = {
      chart_type: chartType,
      start_date: startDate,
      end_date: endDate,
    }

    if (commune) {
      params.commune = commune
    }

    const response = await apiClient.get('/manager/stats/chart', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching chart data:', error)
    throw error
  }
}

export const getRevenueStats = async (startDate, endDate) => {
  try {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate

    const response = await apiClient.get('/manager/finances/revenues', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching revenue stats:', error)
    throw error
  }
}

export const getExpenseStats = async (startDate, endDate) => {
  try {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate

    const response = await apiClient.get('/manager/finances/expenses', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching expense stats:', error)
    throw error
  }
}

export const generateFinancialReport = async (reportType, startDate, endDate, format = 'csv') => {
  try {
    const response = await apiClient.post(
      '/manager/finances/reports',
      {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        format,
      },
      {
        responseType: 'blob',
      }
    )

    return response.data
  } catch (error) {
    console.error('Error generating financial report:', error)
    throw error
  }
}

export const getActiveCouriers = async () => {
  try {
    const response = await apiClient.get('/manager/couriers/active')
    return response.data
  } catch (error) {
    console.error('Error fetching active couriers:', error)
    throw error
  }
}

export const getTrafficReports = async (params = {}) => {
  try {
    const response = await apiClient.get('/manager/traffic/reports', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching traffic reports:', error)
    throw error
  }
}

export const deleteTrafficReport = async reportId => {
  try {
    const response = await apiClient.delete(`/manager/traffic/reports/${reportId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting traffic report:', error)
    throw error
  }
}

export const getWeatherAlerts = async (params = {}) => {
  try {
    const response = await apiClient.get('/manager/weather/alerts', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching weather alerts:', error)
    throw error
  }
}

export const addWeatherAlert = async alertData => {
  try {
    const response = await apiClient.post('/manager/weather/alerts', alertData)
    return response.data
  } catch (error) {
    console.error('Error adding weather alert:', error)
    throw error
  }
}

export const deleteWeatherAlert = async alertId => {
  try {
    const response = await apiClient.delete(`/manager/weather/alerts/${alertId}`)
    return response.data
  } catch (error) {
    console.error('Error deleting weather alert:', error)
    throw error
  }
}

export const fetchManagerDashboard = async (period = 'week') => {
  try {
    const response = await authApi.get(`/manager/dashboard?period=${period}`)
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const fetchFinances = async (params = {}) => {
  try {
    const response = await authApi.get('/manager/finances', { params })
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const fetchTransactions = async (params = {}) => {
  try {
    const response = await authApi.get('/manager/transactions', { params })
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const fetchTransactionDetails = async transactionId => {
  try {
    const response = await authApi.get(`/manager/transactions/${transactionId}`)
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const processTransaction = async (transactionId, data) => {
  try {
    const response = await authApi.post(`/manager/transactions/${transactionId}/process`, data)
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const deleteReport = async reportId => {
  try {
    const response = await authApi.delete(`/manager/reports/${reportId}`)
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export const fetchAuditLogs = async (params = {}) => {
  try {
    const response = await authApi.get('/manager/audit-logs', { params })
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

export async function addZone(zoneData) {
  try {
    const response = await apiClient.post('/manager/zones', zoneData)
    return response.data
  } catch (error) {
    console.error("Erreur lors de l'ajout de la zone:", error)
    throw error
  }
}

// Export par défaut
const managerApi = {
  // Analytics
  getAnalyticsData,
  getCourierPerformance,
  getBusinessAnalytics,
  exportAnalyticsReport,

  // Users Management
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  bulkUpdateUsers,

  // Couriers Management
  fetchCouriers,
  fetchCourierDetails,
  fetchCourierDeliveries,
  fetchCourierPayments,
  addCourier,
  updateCourier,
  updateCourierStatus,
  verifyCourierKyc,
  rejectCourierKyc,
  verifyCourierDocument,
  rejectCourierDocument,
  sendCourierNotification,

  // Deliveries Management
  fetchDeliveries,
  fetchDelivery,
  updateDeliveryStatus,
  cancelDelivery,
  assignCourier,

  // Businesses Management
  fetchBusinesses,
  fetchBusiness,
  updateBusiness,
  updateBusinessStatus,

  // Financial Management
  getFinancialSummary,
  getTransactions,
  getPayouts,
  processPayout,

  // Reports
  generateReport,
  exportReport,

  // Settings
  getManagerSettings,
  updateManagerSettings,

  // Notifications
  sendNotification,
  sendBulkNotification,

  // KYC Management
  fetchKycDocuments,
  verifyKycDocument,
  rejectKycDocument,

  // Support Management
  fetchTickets,
  updateTicketStatus,
  assignTicket,

  // Zone Management
  fetchZones,
  createZone,
  updateZone,
  deleteZone,
  addZone,

  // Vehicle Management
  fetchVehicles,
  verifyVehicle,
  rejectVehicle,

  // Promotion Management
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,

  // Policy Management
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,

  // Audit Logs
  fetchAuditLogs,
  exportAuditLogs,

  // System Health
  getSystemHealth,
  getSystemMetrics,

  // Real-time updates
  subscribeToUpdates,
  unsubscribeFromUpdates,

  // Additional Manager Functions
  fetchManagerDashboard,
  fetchFinances,
  fetchTransactions,
  fetchTransactionDetails,
  processTransaction,
  deleteReport,
  getGlobalStats,
  getChartData,
  getRevenueStats,
  getExpenseStats,
  generateFinancialReport,
  getActiveCouriers,
  getTrafficReports,
  deleteTrafficReport,
  getWeatherAlerts,
  addWeatherAlert,
  deleteWeatherAlert,
}

export default managerApi