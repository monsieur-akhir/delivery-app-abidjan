import axios from "axios"
import { API_URL } from "@/config"

/**
 * Récupérer les paramètres généraux
 * @returns {Promise} - Promesse avec les paramètres généraux
 */
export const getGeneralSettings = () => {
  return axios.get(`${API_URL}/settings/general`)
}

/**
 * Mettre à jour les paramètres généraux
 * @param {Object} settings - Paramètres généraux
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateGeneralSettings = (settings) => {
  return axios.put(`${API_URL}/settings/general`, settings)
}

/**
 * Récupérer les paramètres de notification
 * @returns {Promise} - Promesse avec les paramètres de notification
 */
export const getNotificationSettings = () => {
  return axios.get(`${API_URL}/settings/notifications`)
}

/**
 * Mettre à jour les paramètres de notification
 * @param {Object} settings - Paramètres de notification
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateNotificationSettings = (settings) => {
  return axios.put(`${API_URL}/settings/notifications`, settings)
}

/**
 * Récupérer les paramètres linguistiques
 * @returns {Promise} - Promesse avec les paramètres linguistiques
 */
export const getLanguageSettings = () => {
  return axios.get(`${API_URL}/settings/language`)
}

/**
 * Mettre à jour les paramètres linguistiques
 * @param {Object} settings - Paramètres linguistiques
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateLanguageSettings = (settings) => {
  return axios.put(`${API_URL}/settings/language`, settings)
}

/**
 * Récupérer les paramètres de sécurité
 * @returns {Promise} - Promesse avec les paramètres de sécurité
 */
export const getSecuritySettings = () => {
  return axios.get(`${API_URL}/settings/security`)
}

/**
 * Mettre à jour les paramètres de sécurité
 * @param {Object} settings - Paramètres de sécurité
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateSecuritySettings = (settings) => {
  return axios.put(`${API_URL}/settings/security`, settings)
}

/**
 * Récupérer les paramètres d'intégration
 * @returns {Promise} - Promesse avec les paramètres d'intégration
 */
export const getIntegrationSettings = () => {
  return axios.get(`${API_URL}/settings/integrations`)
}

/**
 * Mettre à jour les paramètres d'intégration
 * @param {Object} settings - Paramètres d'intégration
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateIntegrationSettings = (settings) => {
  return axios.put(`${API_URL}/settings/integrations`, settings)
}

/**
 * Tester une intégration
 * @param {String} integration - Nom de l'intégration
 * @param {Object} credentials - Identifiants de l'intégration
 * @returns {Promise} - Promesse avec le résultat du test
 */
export const testIntegration = (integration, credentials) => {
  return axios.post(`${API_URL}/settings/integrations/test`, {
    integration,
    credentials,
  })
}

/**
 * Récupérer les paramètres de livraison
 * @returns {Promise} - Promesse avec les paramètres de livraison
 */
export const getDeliverySettings = () => {
  return axios.get(`${API_URL}/settings/delivery`)
}

/**
 * Mettre à jour les paramètres de livraison
 * @param {Object} settings - Paramètres de livraison
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateDeliverySettings = (settings) => {
  return axios.put(`${API_URL}/settings/delivery`, settings)
}

/**
 * Récupérer les paramètres de l'entreprise
 * @returns {Promise} - Promesse avec les paramètres de l'entreprise
 */
export const getBusinessSettings = () => {
  return axios.get(`${API_URL}/settings/business`)
}

/**
 * Mettre à jour les paramètres de l'entreprise
 * @param {Object} settings - Paramètres de l'entreprise
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updateBusinessSettings = (settings) => {
  return axios.put(`${API_URL}/settings/business`, settings)
}
