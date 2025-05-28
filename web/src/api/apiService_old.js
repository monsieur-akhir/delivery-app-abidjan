import axios from "axios"
import { API_URL, API_TIMEOUT, TOKEN_KEY } from "@/config"
import { useAuthStore } from "@/stores/auth"

// Créer une instance axios avec une configuration de base
const apiService = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Intercepteur pour ajouter le token d'authentification à chaque requête
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Variable pour suivre si un rafraîchissement de token est en cours
let isRefreshingToken = false
// File d'attente pour les requêtes en attente durant le rafraîchissement du token
let refreshSubscribers = []

// Fonction pour ajouter des requêtes à la file d'attente
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

// Fonction pour exécuter les requêtes en file d'attente avec le nouveau token
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// Intercepteur pour gérer les erreurs d'authentification
apiService.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Si le token est expiré (401) et ce n'est pas déjà une tentative de rafraîchissement
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url.includes("auth/refresh") &&
      !originalRequest.url.includes("auth/login")
    ) {
      if (!isRefreshingToken) {
        isRefreshingToken = true
        originalRequest._retry = true

        try {
          // Utiliser pinia en dehors d'un composant Vue nécessite cette approche
          const authStore = useAuthStore()
          const refreshSuccess = await authStore.refreshUserToken()

          if (refreshSuccess) {
            const newToken = authStore.token
            // Informer les requêtes en attente que le token a été rafraîchi
            onTokenRefreshed(newToken)
            
            // Reconfigurer et relancer la requête originale
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`
            return apiService(originalRequest)
          } else {
            // Si le rafraîchissement échoue, rediriger vers la page de login
            window.location.href = "/login?session_expired=true"
            return Promise.reject(error)
          }
        } catch (refreshError) {
          // En cas d'erreur, rediriger vers la page de login
          window.location.href = "/login?session_expired=true"
          return Promise.reject(refreshError)
        } finally {
          isRefreshingToken = false
        }
      } else {
        // Si un rafraîchissement est déjà en cours, ajouter cette requête à la file d'attente
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`
            resolve(apiService(originalRequest))
          })
        })
      }
    }

    return Promise.reject(error)
  },
)

export default apiService

/**
 * Helper pour récupérer les en-têtes d'authentification
 * @returns {Object} - En-têtes d'authentification
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  }
}

/**
 * Gérer les erreurs API
 * @param {Error} error - Erreur axios
 * @throws {Error} - Erreur formatée
 */
export const handleApiError = (error) => {
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'état
    // qui n'est pas dans la plage 2xx
    const errorMessage =
      error.response.data.detail || 
      error.response.data.message || 
      "Une erreur est survenue lors de la communication avec le serveur"
    throw new Error(errorMessage)
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    throw new Error("Aucune réponse du serveur. Vérifiez votre connexion Internet.")
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    throw new Error(error.message || "Une erreur est survenue")
  }
}
