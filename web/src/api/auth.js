/* eslint-disable prettier/prettier */
import axios from 'axios'
import apiService, { handleApiError } from './apiService'
import { API_URL } from '@/config'

// Export the apiService as default for backward compatibility
export default apiService

/**
 * Authentifier un utilisateur
 * @param {Object} credentials - Identifiants de l'utilisateur
 * @param {string} credentials.email - Email de l'utilisateur
 * @param {string} credentials.password - Mot de passe de l'utilisateur
 * @returns {Promise<Object>} - Données d'authentification
 */
export const login = async credentials => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Inscrire un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Promise<Object>} - Données d'inscription
 */
export const register = async userData => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Demander la réinitialisation du mot de passe
 * @param {Object} data - Données de réinitialisation
 * @param {string} data.email - Email de l'utilisateur
 * @returns {Promise<Object>} - Résultat de la demande
 */
export const forgotPassword = async data => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, data)
    return response.data
  } catch (error) {
    handleApiError(error)
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
export const resetPassword = async data => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, data)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Vérifier un token de réinitialisation
 * @param {string} token - Token de réinitialisation
 * @returns {Promise<Object>} - Résultat de la vérification
 */
export const verifyResetToken = async token => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-reset-token`, { token })
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Déconnecter l'utilisateur
 * @returns {Promise<Object>} - Résultat de la déconnexion
 */
export const logout = async () => {
  try {
    const response = await apiService.post(`/auth/logout`)
    return response.data
  } catch (error) {
    // Même en cas d'erreur, on considère l'utilisateur comme déconnecté
    console.error('Erreur lors de la déconnexion:', error)
    return { success: true }
  }
}

/**
 * Rafraîchir le token d'authentification
 * @returns {Promise<Object>} - Nouveau token
 */
export const refreshToken = async () => {
  try {
    const response = await apiService.post(`/auth/refresh`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer les informations de l'utilisateur connecté
 * @returns {Promise<Object>} - Informations de l'utilisateur
 */
export const getUser = async () => {
  try {
    const response = await apiService.get(`/auth/user`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupérer le profil complet de l'utilisateur connecté
 * @returns {Promise<Object>} - Profil de l'utilisateur
 */
export const getUserProfile = async () => {
  try {
    const response = await apiService.get(`/auth/profile`)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Vérifier un code OTP
 * @param {Object} data - Données de vérification
 * @param {string} data.phone - Numéro de téléphone de l'utilisateur
 * @param {string} data.otp - Code OTP
 * @param {string} data.user_id - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} - Résultat de la vérification avec token d'accès
 */
export const verifyOTP = async data => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-otp`, data)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Envoyer un code OTP
 * @param {Object} data - Données pour envoyer l'OTP
 * @param {string} data.phone - Numéro de téléphone de l'utilisateur
 * @param {string} data.email - Email de l'utilisateur (optionnel)
 * @param {string} data.otp_type - Type d'OTP ('registration', 'login', 'password_reset')
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
export const sendOTP = async data => {
  try {
    const response = await axios.post(`${API_URL}/auth/send-otp`, data)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Renvoyer un code OTP
 * @param {Object} data - Données pour renvoyer l'OTP
 * @param {string} data.phone - Numéro de téléphone de l'utilisateur
 * @param {string} data.email - Email de l'utilisateur (optionnel)
 * @param {string} data.user_id - ID de l'utilisateur (optionnel)
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
export const resendOTP = async data => {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-otp`, data)
    return response.data
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Récupère le token d'authentification depuis le localStorage
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem('auth_token')
}

/**
 * Retourne les headers d'authentification pour les requêtes API
 * @returns {Object} - Headers avec Authorization si le token existe
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Met à jour les informations du profil utilisateur
 * @param {Object} profileData - Données du profil
 * @returns {Promise<Object>} - Profil mis à jour
 */
export async function updateProfile(profileData) {
  try {
    const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
      headers: getAuthHeaders(),
    })
    return response.data
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error)
    throw error
  }
}

/**
 * Change le mot de passe de l'utilisateur
 * @param {Object} passwordData - Données du mot de passe
 * @param {string} passwordData.current_password - Mot de passe actuel
 * @param {string} passwordData.new_password - Nouveau mot de passe
 * @param {string} passwordData.confirm_password - Confirmation du nouveau mot de passe
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export async function changePassword(passwordData) {
  try {
    const response = await axios.post(`${API_URL}/auth/change-password`, passwordData, {
      headers: getAuthHeaders(),
    })
    return response.data
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error)
    throw error
  }
}
