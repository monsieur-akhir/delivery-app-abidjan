import axios from "axios"
import { API_URL } from "@/config"

/**
 * Télécharger une image
 * @param {FormData} formData - Données du formulaire avec le fichier
 * @returns {Promise} - Promesse avec l'URL de l'image téléchargée
 */
export const uploadImage = (formData) => {
  return axios.post(`${API_URL}/storage/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

/**
 * Télécharger un fichier (document, etc.)
 * @param {FormData} formData - Données du formulaire avec le fichier
 * @returns {Promise} - Promesse avec l'URL du fichier téléchargé
 */
export const uploadFile = (formData) => {
  return axios.post(`${API_URL}/storage/files`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

/**
 * Supprimer un fichier
 * @param {String} fileUrl - URL du fichier à supprimer
 * @returns {Promise} - Promesse avec le résultat de la suppression
 */
export const deleteFile = (fileUrl) => {
  return axios.delete(`${API_URL}/storage/files`, {
    params: { url: fileUrl },
  })
}

/**
 * Optimiser une image
 * @param {String} imageUrl - URL de l'image à optimiser
 * @param {Object} options - Options d'optimisation (largeur, hauteur, qualité)
 * @returns {Promise} - Promesse avec l'URL de l'image optimisée
 */
export const optimizeImage = (imageUrl, options = {}) => {
  return axios.post(`${API_URL}/storage/images/optimize`, {
    url: imageUrl,
    ...options,
  })
}
