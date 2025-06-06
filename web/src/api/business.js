import authApi from "./auth"

/**
 * Récupérer les données du tableau de bord pour une entreprise
 * @param {string} period - Période (week, month, year)
 * @returns {Promise<Object>} - Données du tableau de bord
 */
export const fetchBusinessDashboard = async (period = "week") => {
  try {
    const response = await authApi.get(`/business/dashboard?period=${period}`)
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
    const response = await authApi.get("/business/deliveries", { params })
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
export const fetchBusinessDeliveryDetails = async (deliveryId) => {
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
 * @returns {Promise<Object>} - Livraison créée
 */
export const createBusinessDelivery = async (deliveryData) => {
  try {
    const response = await authApi.post("/business/deliveries", deliveryData)
    return response.data
  } catch (error) {
    handleApiError(error)
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
export const cancelBusinessDelivery = async (deliveryId) => {
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
    const response = await authApi.get("/business/deliveries/export", {
      params,
      responseType: "blob",
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
    const response = await authApi.get("/business/couriers", { params })
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
export const fetchBusinessCourierDetails = async (courierId) => {
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
export const inviteBusinessCourier = async (inviteData) => {
  try {
    const response = await authApi.post("/business/couriers/invite", inviteData)
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
    const response = await authApi.post(`/business/couriers/${courierId}/favorite`, { is_favorite: isFavorite })
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
    const response = await authApi.get("/business/couriers/export", {
      params,
      responseType: "blob",
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
    const response = await authApi.get("/business/finances", { params })
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
export const markTransactionAsPaid = async (transactionId) => {
  try {
    const response = await authApi.post(`/business/finances/transactions/${transactionId}/mark-paid`)
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
export const downloadInvoice = async (invoiceId) => {
  try {
    const response = await authApi.get(`/business/finances/invoices/${invoiceId}/download`, {
      responseType: "blob",
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
    const response = await authApi.get("/business/finances/export", {
      params,
      responseType: "blob",
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
    const response = await authApi.get("/business/ratings", { params })
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
export const updateBusinessProfile = async (businessData) => {
  try {
    const response = await authApi.put("/business/profile", businessData)
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
export const updateBusinessSettings = async (settings) => {
  try {
    const response = await authApi.put("/business/settings", settings)
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
    const response = await authApi.get("/business/settings")
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
export const changeBusinessPassword = async (passwordData) => {
  try {
    const response = await authApi.post("/business/change-password", passwordData)
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
    formData.append("file", file)
    formData.append("type", type)

    const response = await authApi.post("/business/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
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
export const uploadBusinessLogo = async (file) => {
  try {
    const formData = new FormData()
    formData.append("logo", file)

    const response = await authApi.post("/business/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
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
