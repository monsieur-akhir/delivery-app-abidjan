import authApi from "./auth"

/**
 * Récupérer les données de gains du coursier
 * @param {string} period - Période (week, month, year)
 * @returns {Promise<Object>} - Données de gains
 */
export const fetchCourierEarnings = async (period = "week") => {
  try {
    const response = await authApi.get(`/courier/earnings?period=${period}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les transactions du coursier
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.type - Type de transaction
 * @param {string} params.status - Statut de la transaction
 * @param {string} params.start_date - Date de début
 * @param {string} params.end_date - Date de fin
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Liste des transactions
 */
export const fetchTransactions = async (params = {}) => {
  try {
    const response = await authApi.get("/courier/transactions", { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les récompenses disponibles
 * @returns {Promise<Object[]>} - Liste des récompenses
 */
export const fetchAvailableRewards = async () => {
  try {
    const response = await authApi.get("/courier/rewards/available")
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer l'historique des récompenses
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.status - Statut de la récompense
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Historique des récompenses
 */
export const fetchRewardsHistory = async (params = {}) => {
  try {
    const response = await authApi.get("/courier/rewards/history", { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Échanger une récompense
 * @param {number} rewardId - ID de la récompense
 * @returns {Promise<Object>} - Récompense échangée
 */
export const redeemReward = async (rewardId) => {
  try {
    const response = await authApi.post(`/courier/rewards/redeem/${rewardId}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Retirer des fonds
 * @param {Object} withdrawalData - Données du retrait
 * @param {number} withdrawalData.amount - Montant à retirer
 * @param {string} withdrawalData.method - Méthode de retrait
 * @param {string} withdrawalData.phone_number - Numéro de téléphone (pour Mobile Money)
 * @param {string} withdrawalData.bank_account - Numéro de compte bancaire (pour virement)
 * @param {string} withdrawalData.note - Note
 * @returns {Promise<Object>} - Résultat du retrait
 */
export const withdrawFunds = async (withdrawalData) => {
  try {
    const response = await authApi.post("/courier/withdraw", withdrawalData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les statistiques du coursier
 * @param {string} period - Période (week, month, year)
 * @returns {Promise<Object>} - Statistiques
 */
export const fetchCourierStats = async (period = "month") => {
  try {
    const response = await authApi.get(`/courier/stats?period=${period}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Mettre à jour le statut du coursier
 * @param {Object} statusData - Données du statut
 * @param {boolean} statusData.is_online - Statut en ligne
 * @param {number} statusData.latitude - Latitude
 * @param {number} statusData.longitude - Longitude
 * @returns {Promise<Object>} - Statut mis à jour
 */
export const updateCourierStatus = async (statusData) => {
  try {
    const response = await authApi.post("/courier/status", statusData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les livraisons disponibles
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.commune - Commune
 * @param {number} params.max_distance - Distance maximale
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Liste des livraisons
 */
export const fetchAvailableDeliveries = async (params = {}) => {
  try {
    const response = await authApi.get("/courier/deliveries/available", { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Créer une enchère pour une livraison
 * @param {Object} bidData - Données de l'enchère
 * @param {number} bidData.delivery_id - ID de la livraison
 * @param {number} bidData.amount - Montant de l'enchère
 * @param {string} bidData.note - Note
 * @param {number} bidData.estimated_time - Temps estimé (en minutes)
 * @returns {Promise<Object>} - Enchère créée
 */
export const createBid = async (bidData) => {
  try {
    const response = await authApi.post("/courier/bids", bidData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les enchères du coursier
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.status - Statut de l'enchère
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Liste des enchères
 */
export const fetchCourierBids = async (params = {}) => {
  try {
    const response = await authApi.get("/courier/bids", { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les livraisons actives du coursier
 * @returns {Promise<Object[]>} - Liste des livraisons
 */
export const fetchActiveDeliveries = async () => {
  try {
    const response = await authApi.get("/courier/deliveries/active")
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer l'historique des livraisons du coursier
 * @param {Object} params - Paramètres de filtrage
 * @param {string} params.status - Statut de la livraison
 * @param {string} params.start_date - Date de début
 * @param {string} params.end_date - Date de fin
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @returns {Promise<Object>} - Historique des livraisons
 */
export const fetchDeliveryHistory = async (params = {}) => {
  try {
    const response = await authApi.get("/courier/deliveries/history", { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Mettre à jour le statut d'une livraison
 * @param {number} deliveryId - ID de la livraison
 * @param {string} status - Nouveau statut
 * @returns {Promise<Object>} - Livraison mise à jour
 */
export const updateDeliveryStatus = async (deliveryId, status) => {
  try {
    const response = await authApi.put(`/courier/deliveries/${deliveryId}/status`, { status })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Envoyer la position du coursier
 * @param {Object} positionData - Données de position
 * @param {number} positionData.delivery_id - ID de la livraison
 * @param {number} positionData.latitude - Latitude
 * @param {number} positionData.longitude - Longitude
 * @returns {Promise<Object>} - Résultat
 */
export const sendCourierPosition = async (positionData) => {
  try {
    const response = await authApi.post("/courier/position", positionData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Gérer les erreurs d'API
 * @param {Error} error - Erreur axios
 * @throws {Error} - Erreur formatée
 */
const handleApiError = (error) => {
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'état
    // qui n'est pas dans la plage 2xx
    const errorMessage = error.response.data.detail || error.response.data.message || "Une erreur est survenue"
    throw new Error(errorMessage)
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    throw new Error("Aucune réponse du serveur. Vérifiez votre connexion Internet.")
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    throw new Error(error.message || "Une erreur est survenue")
  }
}
