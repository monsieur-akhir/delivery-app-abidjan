import axios from 'axios'
import { API_URL } from '@/config'

/**
 * Récupérer la liste des produits
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les données des produits
 */
export const getProducts = (params = {}) => {
  return axios.get(`${API_URL}/market/products`, { params })
}

/**
 * Récupérer un produit par son ID
 * @param {Number} id - ID du produit
 * @returns {Promise} - Promesse avec les détails du produit
 */
export const getProduct = id => {
  return axios.get(`${API_URL}/market/products/${id}`)
}

/**
 * Créer un nouveau produit
 * @param {Object} data - Données du produit
 * @returns {Promise} - Promesse avec le produit créé
 */
export const createProduct = data => {
  return axios.post(`${API_URL}/market/products`, data)
}

/**
 * Mettre à jour un produit
 * @param {Number} id - ID du produit
 * @param {Object} data - Données de mise à jour
 * @returns {Promise} - Promesse avec le produit mis à jour
 */
export const updateProduct = (id, data) => {
  return axios.put(`${API_URL}/market/products/${id}`, data)
}

/**
 * Supprimer un produit
 * @param {Number} id - ID du produit
 * @returns {Promise} - Promesse avec le résultat de la suppression
 */
export const deleteProduct = id => {
  return axios.delete(`${API_URL}/market/products/${id}`)
}

/**
 * Récupérer les catégories de produits
 * @returns {Promise} - Promesse avec les catégories
 */
export const getProductCategories = () => {
  return axios.get(`${API_URL}/market/categories`)
}

/**
 * Récupérer les produits d'une entreprise
 * @param {Number} businessId - ID de l'entreprise
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les produits de l'entreprise
 */
export const getBusinessProducts = (businessId, params = {}) => {
  return axios.get(`${API_URL}/market/business/${businessId}/products`, { params })
}

/**
 * Récupérer les produits par commune
 * @param {String} commune - Nom de la commune
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les produits de la commune
 */
export const getProductsByCommune = (commune, params = {}) => {
  return axios.get(`${API_URL}/market/commune/${commune}/products`, { params })
}

/**
 * Rechercher des produits
 * @param {String} query - Terme de recherche
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les résultats de recherche
 */
export const searchProducts = (query, params = {}) => {
  return axios.get(`${API_URL}/market/search`, {
    params: {
      q: query,
      ...params,
    },
  })
}
