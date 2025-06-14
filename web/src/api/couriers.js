import axios from 'axios'
import { API_URL } from '@/config'

/**
 * Récupérer la liste des coursiers récents
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les données des coursiers
 */
export const getRecentCouriers = (params = {}) => {
  return axios.get(`${API_URL}/couriers/recent`, { params })
}

/**
 * Récupérer les détails d'un coursier
 * @param {Number} id - ID du coursier
 * @returns {Promise} - Promesse avec les détails du coursier
 */
export const getCourierDetails = id => {
  return axios.get(`${API_URL}/couriers/${id}`)
}

/**
 * Récupérer les performances d'un coursier
 * @param {Number} id - ID du coursier
 * @returns {Promise} - Promesse avec les performances du coursier
 */
export const getCourierPerformance = id => {
  return axios.get(`${API_URL}/couriers/${id}/performance`)
}

/**
 * Récupérer les livraisons d'un coursier
 * @param {Number} id - ID du coursier
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les livraisons du coursier
 */
export const getCourierDeliveries = (id, params = {}) => {
  return axios.get(`${API_URL}/couriers/${id}/deliveries`, { params })
}

/**
 * Évaluer un coursier
 * @param {Number} id - ID du coursier
 * @param {Object} data - Données d'évaluation
 * @returns {Promise} - Promesse avec l'évaluation créée
 */
export const rateCourier = (id, data) => {
  return axios.post(`${API_URL}/couriers/${id}/ratings`, data)
}

/**
 * Récupérer les coursiers disponibles par commune
 * @param {String} commune - Nom de la commune
 * @param {Object} params - Paramètres supplémentaires
 * @returns {Promise} - Promesse avec les coursiers disponibles
 */
export const getAvailableCouriersByCommune = (commune, params = {}) => {
  return axios.get(`${API_URL}/couriers/available`, {
    params: {
      commune,
      ...params,
    },
  })
}

/**
 * Récupérer les coursiers par distance
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @param {Number} radius - Rayon en kilomètres
 * @returns {Promise} - Promesse avec les coursiers à proximité
 */
export const getCouriersByDistance = (lat, lng, radius = 5) => {
  return axios.get(`${API_URL}/couriers/nearby`, {
    params: {
      lat,
      lng,
      radius,
    },
  })
}
