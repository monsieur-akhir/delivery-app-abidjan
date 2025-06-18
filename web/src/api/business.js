import authApi from './auth'
import { handleApiError } from '../services/errorHandler'
import axios from 'axios'
import { BASE_URL, getAuthHeaders } from '../config'
/**
 * @typedef {Object} Delivery
 * @property {number} id - ID de la livraison
 * @property {string} status - Statut de la livraison
 * @property {Object} pickup - Point de départ
 * @property {Object} dropoff - Point d'arrivée
 * @property {number} price - Prix de la livraison
 */

/**
 * @typedef {Object} BusinessDashboard
 * @property {number} totalDeliveries - Nombre total de livraisons
 * @property {number} activeDeliveries - Livraisons en cours
 * @property {number} completedDeliveries - Livraisons terminées
 * @property {number} totalRevenue - Revenu total
 */

/**
 * Récupérer les données du tableau de bord pour une entreprise
 * @param {string} period - Période (week, month, year)
 * @returns {Promise<BusinessDashboard>} - Données du tableau de bord
 */
export const fetchBusinessDashboard = async (period = 'week') => {
  try {
    const response = await authApi.get(`/business/dashboard?period=${period}`)
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Récupérer les livraisons récentes pour une entreprise
 * @param {number} limit - Nombre de livraisons à récupérer
 * @returns {Promise<Object>} - Liste des livraisons récentes
 */
export const getRecentDeliveries = async (limit = 5) => {
  try {
    const response = await authApi.get(`/business/deliveries/recent?limit=${limit}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer la liste des livraisons pour une entreprise
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.status - Statut des livraisons
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @param {string} params.sort - Champ de tri
 * @param {string} params.order - Ordre de tri (asc, desc)
 * @returns {Promise<Object>} - Liste des livraisons
 */
export const fetchBusinessDeliveries = async (params = {}) => {
  try {
    const response = await authApi.get('/business/deliveries', { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les détails d'une livraison
 * @param {number} deliveryId - ID de la livraison
 * @returns {Promise<Object>} - Détails de la livraison
 */
export const fetchBusinessDeliveryDetails = async deliveryId => {
  try {
    const response = await authApi.get(`/business/deliveries/${deliveryId}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Créer une nouvelle livraison
 * @param {Object} deliveryData - Données de la livraison
 * @param {Object} deliveryData.pickup - Point de départ
 * @param {Object} deliveryData.dropoff - Point d'arrivée
 * @param {string} deliveryData.description - Description de la livraison
 * @param {number} deliveryData.price - Prix de la livraison
 * @returns {Promise<Delivery>} - Livraison créée
 */
export const createBusinessDelivery = async deliveryData => {
  try {
    const response = await authApi.post('/business/deliveries', deliveryData)
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Mettre à jour une livraison
 * @param {number} deliveryId - ID de la livraison
 * @param {Object} deliveryData - Données de la livraison
 * @returns {Promise<Object>} - Livraison mise à jour
 */
export const updateBusinessDelivery = async (deliveryId, deliveryData) => {
  try {
    const response = await authApi.put(`/business/deliveries/${deliveryId}`, deliveryData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Annuler une livraison
 * @param {number} deliveryId - ID de la livraison
 * @returns {Promise<Object>} - Résultat de l'annulation
 */
export const cancelBusinessDelivery = async deliveryId => {
  try {
    const response = await authApi.post(`/business/deliveries/${deliveryId}/cancel`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Accepter une offre pour une livraison
 * @param {number} deliveryId - ID de la livraison
 * @param {number} bidId - ID de l'offre
 * @returns {Promise<Object>} - Résultat de l'acceptation
 */
export const acceptBusinessDeliveryBid = async (deliveryId, bidId) => {
  try {
    const response = await authApi.post(`/business/deliveries/${deliveryId}/bids/${bidId}/accept`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Exporter les livraisons au format CSV ou Excel
 * @param {Object} params - Paramètres d'exportation
 * @param {string} params.format - Format d'exportation (csv, excel)
 * @param {string} params.status - Statut des livraisons
 * @param {string} params.start_date - Date de début
 * @param {string} params.end_date - Date de fin
 * @returns {Promise<Blob>} - Fichier d'exportation
 */
export const exportBusinessDeliveries = async (params = {}) => {
  try {
    const response = await authApi.get('/business/deliveries/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer la liste des coursiers pour une entreprise
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.status - Statut des coursiers
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Liste des coursiers
 */
export const fetchBusinessCouriers = async (params = {}) => {
  try {
    const response = await authApi.get('/business/couriers', { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les détails d'un coursier
 * @param {number} courierId - ID du coursier
 * @returns {Promise<Object>} - Détails du coursier
 */
export const fetchBusinessCourierDetails = async courierId => {
  try {
    const response = await authApi.get(`/business/couriers/${courierId}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Inviter un coursier
 * @param {Object} inviteData - Données d'invitation
 * @returns {Promise<Object>} - Résultat de l'invitation
 */
export const inviteBusinessCourier = async inviteData => {
  try {
    const response = await authApi.post('/business/couriers/invite', inviteData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Ajouter/retirer un coursier des favoris
 * @param {number} courierId - ID du coursier
 * @param {boolean} isFavorite - Statut favori
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const toggleBusinessCourierFavorite = async (courierId, isFavorite) => {
  try {
    const response = await authApi.post(`/business/couriers/${courierId}/favorite`, {
      is_favorite: isFavorite,
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Exporter les coursiers au format CSV ou Excel
 * @param {Object} params - Paramètres d'exportation
 * @param {string} params.format - Format d'exportation (csv, excel)
 * @param {string} params.status - Statut des coursiers
 * @returns {Promise<Blob>} - Fichier d'exportation
 */
export const exportBusinessCouriers = async (params = {}) => {
  try {
    const response = await authApi.get('/business/couriers/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les données financières pour une entreprise
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.period - Période (week, month, year)
 * @param {string} params.start_date - Date de début
 * @param {string} params.end_date - Date de fin
 * @returns {Promise<Object>} - Données financières
 */
export const fetchBusinessFinances = async (params = {}) => {
  try {
    const response = await authApi.get('/business/finances', { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Marquer une transaction comme payée
 * @param {number} transactionId - ID de la transaction
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const markTransactionAsPaid = async transactionId => {
  try {
    const response = await authApi.post(
      `/business/finances/transactions/${transactionId}/mark-paid`
    )
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Télécharger une facture
 * @param {number} invoiceId - ID de la facture
 * @returns {Promise<Blob>} - Fichier de facture
 */
export const downloadInvoice = async invoiceId => {
  try {
    const response = await authApi.get(`/business/finances/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Exporter les données financières
 * @param {Object} params - Paramètres d'exportation
 * @param {string} params.format - Format d'exportation (csv, excel, pdf)
 * @param {string} params.start_date - Date de début
 * @param {string} params.end_date - Date de fin
 * @param {string} params.type - Type de données (transactions, revenue, expenses)
 * @returns {Promise<Blob>} - Fichier d'exportation
 */
export const exportBusinessFinances = async (params = {}) => {
  try {
    const response = await authApi.get('/business/finances/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les évaluations pour une entreprise
 * @param {Object} params - Paramètres de filtrage
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Liste des évaluations
 */
export const fetchBusinessRatings = async (params = {}) => {
  try {
    const response = await authApi.get('/business/ratings', { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Mettre à jour les informations de l'entreprise
 * @param {Object} businessData - Données de l'entreprise
 * @returns {Promise<Object>} - Entreprise mise à jour
 */
export const updateBusinessProfile = async businessData => {
  try {
    const response = await authApi.put('/business/profile', businessData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Mettre à jour les paramètres de l'entreprise
 * @param {Object} settings - Paramètres à mettre à jour
 * @returns {Promise<Object>} - Paramètres mis à jour
 */
export const updateBusinessSettings = async settings => {
  try {
    const response = await authApi.put('/business/settings', settings)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les paramètres de l'entreprise
 * @returns {Promise<Object>} - Paramètres de l'entreprise
 */
export const fetchBusinessSettings = async () => {
  try {
    const response = await authApi.get('/business/settings')
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Changer le mot de passe d'une entreprise
 * @param {Object} passwordData - Données du mot de passe
 * @param {string} passwordData.current_password - Mot de passe actuel
 * @param {string} passwordData.new_password - Nouveau mot de passe
 * @param {string} passwordData.confirm_password - Confirmation du nouveau mot de passe
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const changeBusinessPassword = async passwordData => {
  try {
    const response = await authApi.post('/business/change-password', passwordData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Télécharger un document d'entreprise
 * @param {string} type - Type de document (siret, kbis, id)
 * @param {File} file - Fichier à télécharger
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const uploadBusinessDocument = async (type, file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await authApi.post('/business/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Télécharger un logo d'entreprise
 * @param {File} file - Fichier image du logo
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const uploadBusinessLogo = async file => {
  try {
    const formData = new FormData()
    formData.append('logo', file)

    const response = await authApi.post('/business/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupère la liste des entreprises
 * @param {Object} params - Paramètres de filtrage et pagination
 * @returns {Promise<Object>} - Liste des entreprises
 */
export async function fetchBusinesses(params = {}) {
  try {
    const response = await axios.get(`${BASE_URL}/businesses`, {
      params,
      headers: getAuthHeaders(),
    })
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error)
    throw error
  }
}

// Using imported handleApiError from auth.js
