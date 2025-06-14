import axios from 'axios'
import { API_URL } from '@/config'

/**
 * Récupérer la liste des plaintes
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les données des plaintes
 */
export const getComplaints = (params = {}) => {
  return axios.get(`${API_URL}/complaints`, { params })
}

/**
 * Récupérer les détails d'une plainte
 * @param {Number} id - ID de la plainte
 * @returns {Promise} - Promesse avec les détails de la plainte
 */
export const getComplaintDetails = id => {
  return axios.get(`${API_URL}/complaints/${id}`)
}

/**
 * Créer une nouvelle plainte
 * @param {Object} data - Données de la plainte
 * @returns {Promise} - Promesse avec la plainte créée
 */
export const createComplaint = data => {
  return axios.post(`${API_URL}/complaints`, data)
}

/**
 * Annuler une plainte
 * @param {Number} id - ID de la plainte
 * @returns {Promise} - Promesse avec le résultat de l'annulation
 */
export const cancelComplaint = id => {
  return axios.put(`${API_URL}/complaints/${id}/cancel`)
}

/**
 * Ajouter une réponse à une plainte
 * @param {Number} id - ID de la plainte
 * @param {Object} data - Données de la réponse
 * @returns {Promise} - Promesse avec la réponse ajoutée
 */
export const addComplaintResponse = (id, data) => {
  return axios.post(`${API_URL}/complaints/${id}/responses`, data)
}

/**
 * Mettre à jour le statut d'une plainte (pour les gestionnaires)
 * @param {Number} id - ID de la plainte
 * @param {Object} data - Données de mise à jour
 * @returns {Promise} - Promesse avec la plainte mise à jour
 */
export const updateComplaintStatus = (id, data) => {
  return axios.put(`${API_URL}/complaints/${id}/status`, data)
}

/**
 * Récupérer les statistiques des plaintes (pour les gestionnaires)
 * @returns {Promise} - Promesse avec les statistiques
 */
export const getComplaintsStats = () => {
  return axios.get(`${API_URL}/complaints/stats`)
}
