import axios from "axios"
import { API_URL, API_TIMEOUT } from "@/config"

// Créer une instance axios avec une configuration de base
const authApi = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Intercepteur pour ajouter le token d'authentification à chaque requête
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Intercepteur pour gérer les erreurs d'authentification
authApi.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Si le token est expiré ou invalide (401)
    if (error.response && error.response.status === 401) {
      // Vérifier si l'erreur ne vient pas de la route de login
      const isLoginRequest = error.config.url.includes("/auth/login")

      if (!isLoginRequest) {
        // Supprimer le token et rediriger vers la page de login
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user_role")
        localStorage.removeItem("user_data")

        // Rediriger vers la page de login
        window.location.href = "/login?session_expired=true"
      }
    }

    return Promise.reject(error)
  },
)

export default authApi

/**
 * Authentifier un utilisateur
 * @param {Object} credentials - Identifiants de l'utilisateur
 * @param {string} credentials.email - Email de l'utilisateur
 * @param {string} credentials.password - Mot de passe de l'utilisateur
 * @returns {Promise<Object>} - Données d'authentification
 */
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Inscrire un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Promise<Object>} - Données d'inscription
 */
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Demander la réinitialisation du mot de passe
 * @param {Object} data - Données de réinitialisation
 * @param {string} data.email - Email de l'utilisateur
 * @returns {Promise<Object>} - Résultat de la demande
 */
export const forgotPassword = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, data)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Réinitialiser le mot de passe
 * @param {Object} data - Données de réinitialisation
 * @param {string} data.token - Token de réinitialisation
 * @param {string} data.password - Nouveau mot de passe
 * @param {string} data.password_confirmation - Confirmation du nouveau mot de passe
 * @returns {Promise<Object>} - Résultat de la réinitialisation
 */
export const resetPassword = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, data)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Vérifier un token de réinitialisation
 * @param {string} token - Token de réinitialisation
 * @returns {Promise<Object>} - Résultat de la vérification
 */
export const verifyResetToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/verify-reset-token/${token}`)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Déconnecter l'utilisateur
 * @returns {Promise<Object>} - Résultat de la déconnexion
 */
export const logout = async () => {
  try {
    const response = await authApi.post(`${API_URL}/auth/logout`)

    // Supprimer les données de session
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")
    localStorage.removeItem("user_data")

    return response.data
  } catch (error) {
    // Même en cas d'erreur, supprimer les données de session
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")
    localStorage.removeItem("user_data")

    handleAuthError(error)
  }
}

/**
 * Récupérer les informations de l'utilisateur connecté
 * @returns {Promise<Object>} - Informations de l'utilisateur
 */
export const getUser = async () => {
  try {
    const response = await authApi.get(`${API_URL}/auth/user`)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Vérifier un code OTP
 * @param {Object} data - Données de vérification
 * @param {string} data.email - Email de l'utilisateur
 * @param {string} data.otp - Code OTP
 * @returns {Promise<Object>} - Résultat de la vérification
 */
export const verifyOTP = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-otp`, data)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Renvoyer un code OTP
 * @param {Object} data - Données de renvoi
 * @param {string} data.email - Email de l'utilisateur
 * @returns {Promise<Object>} - Résultat du renvoi
 */
export const resendOTP = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-otp`, data)
    return response.data
  } catch (error) {
    handleAuthError(error)
  }
}

/**
 * Gérer les erreurs d'authentification
 * @param {Error} error - Erreur axios
 * @throws {Error} - Erreur formatée
 */
const handleAuthError = (error) => {
  if (error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'état
    // qui n'est pas dans la plage 2xx
    const errorMessage =
      error.response.data.detail || error.response.data.message || "Une erreur d'authentification est survenue"
    throw new Error(errorMessage)
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    throw new Error("Aucune réponse du serveur. Vérifiez votre connexion Internet.")
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    throw new Error(error.message || "Une erreur est survenue")
  }
}
