import authApi from "./auth"

/**
 * Récupérer les notifications
 * @param {Object} params - Paramètres de filtrage
 * @param {number} params.page - Numéro de page
 * @param {number} params.limit - Nombre d'éléments par page
 * @param {string} params.type - Type de notification
 * @param {boolean} params.read - Statut de lecture
 * @returns {Promise<Object>} - Liste des notifications
 */
export const fetchNotifications = async (params = {}) => {
  try {
    const response = await authApi.get("/notifications", { params })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer le nombre de notifications non lues
 * @returns {Promise<number>} - Nombre de notifications non lues
 */
export const fetchUnreadCount = async () => {
  try {
    const response = await authApi.get("/notifications/unread-count")
    return response.data.count
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Marquer une notification comme lue
 * @param {number} id - ID de la notification
 * @returns {Promise<Object>} - Notification mise à jour
 */
export const markNotificationAsRead = async (id) => {
  try {
    const response = await authApi.put(`/notifications/${id}/read`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Marquer toutes les notifications comme lues
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await authApi.put("/notifications/read-all")
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Supprimer une notification
 * @param {number|string} id - ID de la notification ou 'all' pour toutes
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export const deleteNotification = async (id) => {
  try {
    const response = await authApi.delete(`/notifications/${id}`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Envoyer une notification
 * @param {Object} notification - Données de la notification
 * @param {string} notification.title - Titre de la notification
 * @param {string} notification.message - Message de la notification
 * @param {string} notification.type - Type de notification
 * @param {Object} notification.data - Données supplémentaires
 * @param {number[]} notification.user_ids - IDs des utilisateurs destinataires
 * @returns {Promise<Object>} - Notification créée
 */
export const sendNotification = async (notification) => {
  try {
    const response = await authApi.post("/notifications/send", notification)
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
