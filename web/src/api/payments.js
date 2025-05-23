import axios from "axios"
import { API_URL } from "@/config"

/**
 * Récupérer les paramètres de paiement
 * @returns {Promise} - Promesse avec les paramètres de paiement
 */
export const getPaymentSettings = () => {
  return axios.get(`${API_URL}/payments/settings`)
}

/**
 * Mettre à jour les paramètres de paiement
 * @param {Object} settings - Paramètres de paiement
 * @returns {Promise} - Promesse avec les paramètres mis à jour
 */
export const updatePaymentSettings = (settings) => {
  return axios.put(`${API_URL}/payments/settings`, settings)
}

/**
 * Tester la connexion à un service de paiement
 * @param {String} provider - Fournisseur de paiement (cinetpay, orange_money, mtn_money)
 * @param {Object} credentials - Identifiants de connexion
 * @returns {Promise} - Promesse avec le résultat du test
 */
export const testPaymentConnection = (provider, credentials) => {
  return axios.post(`${API_URL}/payments/test-connection`, {
    provider,
    credentials,
  })
}

/**
 * Initier un paiement
 * @param {Object} paymentData - Données du paiement
 * @returns {Promise} - Promesse avec les détails du paiement
 */
export const initiatePayment = (paymentData) => {
  return axios.post(`${API_URL}/payments/initiate`, paymentData)
}

/**
 * Vérifier le statut d'un paiement
 * @param {String} paymentId - ID du paiement
 * @returns {Promise} - Promesse avec le statut du paiement
 */
export const checkPaymentStatus = (paymentId) => {
  return axios.get(`${API_URL}/payments/${paymentId}/status`)
}

/**
 * Récupérer l'historique des paiements
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec l'historique des paiements
 */
export const getPaymentHistory = (params = {}) => {
  return axios.get(`${API_URL}/payments/history`, { params })
}

/**
 * Récupérer les détails d'un paiement
 * @param {String} paymentId - ID du paiement
 * @returns {Promise} - Promesse avec les détails du paiement
 */
export const getPaymentDetails = (paymentId) => {
  return axios.get(`${API_URL}/payments/${paymentId}`)
}

/**
 * Rembourser un paiement
 * @param {String} paymentId - ID du paiement
 * @param {Object} refundData - Données du remboursement
 * @returns {Promise} - Promesse avec les détails du remboursement
 */
export const refundPayment = (paymentId, refundData) => {
  return axios.post(`${API_URL}/payments/${paymentId}/refund`, refundData)
}

/**
 * Générer une facture pour un paiement
 * @param {String} paymentId - ID du paiement
 * @returns {Promise} - Promesse avec l'URL de la facture
 */
export const generateInvoice = (paymentId) => {
  return axios.post(`${API_URL}/payments/${paymentId}/invoice`)
}

/**
 * Télécharger une facture
 * @param {String} invoiceId - ID de la facture
 * @returns {Promise} - Promesse avec le fichier de la facture
 */
export const downloadInvoice = (invoiceId) => {
  return axios.get(`${API_URL}/invoices/${invoiceId}/download`, {
    responseType: "blob",
  })
}
