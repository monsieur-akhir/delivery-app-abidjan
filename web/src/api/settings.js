
import axios from 'axios'
import { API_URL } from '@/config'

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

// API pour les paramètres système
export const fetchSystemSettings = async () => {
  const response = await apiClient.get('/settings/system')
  return response.data
}

export const updateSystemSettings = async (settingsData) => {
  const response = await apiClient.put('/settings/system', settingsData)
  return response.data
}

// API pour les paramètres de langue
export const getLanguageSettings = async () => {
  try {
    const response = await apiClient.get('/settings/language')
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de langue:', error)
    throw error
  }
}

export const updateLanguageSettings = async (languageData) => {
  try {
    const response = await apiClient.put('/settings/language', languageData)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de langue:', error)
    throw error
  }
}

// API pour les paramètres de notification
export const getNotificationSettings = async () => {
  const response = await apiClient.get('/settings/notifications')
  return response.data
}

export const updateNotificationSettings = async (notificationData) => {
  const response = await apiClient.put('/settings/notifications', notificationData)
  return response.data
}

// API pour les paramètres de paiement
export const getPaymentSettings = async () => {
  const response = await apiClient.get('/settings/payment')
  return response.data
}

export const updatePaymentSettings = async (paymentData) => {
  const response = await apiClient.put('/settings/payment', paymentData)
  return response.data
}

// API pour les paramètres de sécurité
export const getSecuritySettings = async () => {
  const response = await apiClient.get('/settings/security')
  return response.data
}

export const updateSecuritySettings = async (securityData) => {
  const response = await apiClient.put('/settings/security', securityData)
  return response.data
}

// API pour les paramètres d'entreprise
export const getBusinessSettings = async () => {
  const response = await apiClient.get('/settings/business')
  return response.data
}

export const updateBusinessSettings = async (businessData) => {
  const response = await apiClient.put('/settings/business', businessData)
  return response.data
}

// API pour les paramètres de courrier
export const getCourierSettings = async () => {
  const response = await apiClient.get('/settings/courier')
  return response.data
}

export const updateCourierSettings = async (courierData) => {
  const response = await apiClient.put('/settings/courier', courierData)
  return response.data
}

// API pour les paramètres généraux
export const getGeneralSettings = async () => {
  const response = await apiClient.get('/settings/general')
  return response.data
}

export const updateGeneralSettings = async (generalData) => {
  const response = await apiClient.put('/settings/general', generalData)
  return response.data
}

// API pour les paramètres d'API
export const getApiSettings = async () => {
  const response = await apiClient.get('/settings/api')
  return response.data
}

export const updateApiSettings = async (apiData) => {
  const response = await apiClient.put('/settings/api', apiData)
  return response.data
}

// Export par défaut
const settingsApi = {
  fetchSystemSettings,
  updateSystemSettings,
  getLanguageSettings,
  updateLanguageSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getPaymentSettings,
  updatePaymentSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getBusinessSettings,
  updateBusinessSettings,
  getCourierSettings,
  updateCourierSettings,
  getGeneralSettings,
  updateGeneralSettings,
  getApiSettings,
  updateApiSettings,
}

export default settingsApi

// Export des principales fonctions pour l'importation nommée
export { 
  fetchSystemSettings,
  updateSystemSettings,
  getLanguageSettings,
  updateLanguageSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getPaymentSettings,
  updatePaymentSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getBusinessSettings,
  updateBusinessSettings,
  getCourierSettings,
  updateCourierSettings,
  getGeneralSettings,
  updateGeneralSettings,
  getApiSettings,
  updateApiSettings
}
