import axios from "axios"
import { API_URL } from "@/config"

const api = axios.create({
  baseURL: API_URL,
})

/**
 * Récupère la liste des véhicules
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise<Object>} - Liste des véhicules
 */
export const fetchVehicles = async (params = {}) => {
  try {
    const response = await api.get("/transport/vehicles", { params })
    return {
      items: response.data,
      total: Number.parseInt(response.headers["x-total-count"] || response.data.length),
    }
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    throw error
  }
}

/**
 * Récupère les détails d'un véhicule
 * @param {string|number} id - ID du véhicule
 * @returns {Promise<Object>} - Détails du véhicule
 */
export const fetchVehicleDetails = async (id) => {
  try {
    const response = await api.get(`/transport/vehicles/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching vehicle details for ID ${id}:`, error)
    throw error
  }
}

/**
 * Crée un nouveau véhicule
 * @param {Object} vehicleData - Données du véhicule
 * @returns {Promise<Object>} - Véhicule créé
 */
export const createVehicle = async (vehicleData) => {
  try {
    const response = await api.post("/transport/vehicles", vehicleData)
    return response.data
  } catch (error) {
    console.error("Error creating vehicle:", error)
    throw error
  }
}

/**
 * Met à jour un véhicule existant
 * @param {string|number} id - ID du véhicule
 * @param {Object} vehicleData - Données du véhicule
 * @returns {Promise<Object>} - Véhicule mis à jour
 */
export const updateVehicle = async (id, vehicleData) => {
  try {
    const response = await api.put(`/transport/vehicles/${id}`, vehicleData)
    return response.data
  } catch (error) {
    console.error(`Error updating vehicle with ID ${id}:`, error)
    throw error
  }
}

/**
 * Supprime un véhicule
 * @param {string|number} id - ID du véhicule
 * @returns {Promise<void>}
 */
export const deleteVehicle = async (id) => {
  try {
    await api.delete(`/transport/vehicles/${id}`)
  } catch (error) {
    console.error(`Error deleting vehicle with ID ${id}:`, error)
    throw error
  }
}

/**
 * Télécharge un document pour un véhicule
 * @param {string|number} id - ID du véhicule
 * @param {FormData} formData - Données du formulaire contenant le fichier
 * @returns {Promise<Object>} - Véhicule mis à jour
 */
export const uploadVehicleDocument = async (id, formData) => {
  try {
    const response = await api.post(`/transport/vehicles/${id}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (error) {
    console.error(`Error uploading document for vehicle with ID ${id}:`, error)
    throw error
  }
}

/**
 * Récupère la liste des véhicules d'un coursier
 * @param {string|number} courierId - ID du coursier
 * @returns {Promise<Array>} - Liste des véhicules du coursier
 */
export const fetchCourierVehicles = async (courierId) => {
  try {
    const response = await api.get(`/transport/courier/${courierId}/vehicles`)
    return response.data
  } catch (error) {
    console.error(`Error fetching vehicles for courier with ID ${courierId}:`, error)
    throw error
  }
}

/**
 * Assigne un véhicule à un coursier
 * @param {string|number} courierId - ID du coursier
 * @param {Object} vehicleData - Données du véhicule
 * @returns {Promise<Object>} - Association coursier-véhicule créée
 */
export const assignVehicleToCourier = async (courierId, vehicleData) => {
  try {
    const response = await api.post(`/transport/courier/${courierId}/vehicles`, vehicleData)
    return response.data
  } catch (error) {
    console.error(`Error assigning vehicle to courier with ID ${courierId}:`, error)
    throw error
  }
}

/**
 * Met à jour un véhicule de coursier
 * @param {string|number} courierVehicleId - ID de l'association coursier-véhicule
 * @param {Object} updateData - Données de mise à jour
 * @returns {Promise<Object>} - Association coursier-véhicule mise à jour
 */
export const updateCourierVehicle = async (courierVehicleId, updateData) => {
  try {
    const response = await api.put(`/transport/courier/vehicles/${courierVehicleId}`, updateData)
    return response.data
  } catch (error) {
    console.error(`Error updating courier vehicle with ID ${courierVehicleId}:`, error)
    throw error
  }
}

/**
 * Supprime un véhicule de coursier
 * @param {string|number} courierVehicleId - ID de l'association coursier-véhicule
 * @returns {Promise<void>}
 */
export const removeCourierVehicle = async (courierVehicleId) => {
  try {
    await api.delete(`/transport/courier/vehicles/${courierVehicleId}`)
  } catch (error) {
    console.error(`Error removing courier vehicle with ID ${courierVehicleId}:`, error)
    throw error
  }
}

/**
 * Définit un véhicule comme principal pour un coursier
 * @param {string|number} courierVehicleId - ID de l'association coursier-véhicule
 * @returns {Promise<Object>} - Association coursier-véhicule mise à jour
 */
export const setPrimaryVehicle = async (courierVehicleId) => {
  try {
    const response = await api.put(`/transport/courier/vehicles/${courierVehicleId}/primary`)
    return response.data
  } catch (error) {
    console.error(`Error setting primary vehicle with ID ${courierVehicleId}:`, error)
    throw error
  }
}

/**
 * Récupère la liste des règles de transport
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise<Object>} - Liste des règles de transport
 */
export const fetchTransportRules = async (params = {}) => {
  try {
    const response = await api.get("/transport/rules", { params })
    return {
      items: response.data,
      total: Number.parseInt(response.headers["x-total-count"] || response.data.length),
    }
  } catch (error) {
    console.error("Error fetching transport rules:", error)
    throw error
  }
}

/**
 * Récupère les détails d'une règle de transport
 * @param {string|number} id - ID de la règle
 * @returns {Promise<Object>} - Détails de la règle
 */
export const fetchTransportRuleDetails = async (id) => {
  try {
    const response = await api.get(`/transport/rules/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching transport rule details for ID ${id}:`, error)
    throw error
  }
}

/**
 * Crée une nouvelle règle de transport
 * @param {Object} ruleData - Données de la règle
 * @returns {Promise<Object>} - Règle créée
 */
export const createTransportRule = async (ruleData) => {
  try {
    const response = await api.post("/transport/rules", ruleData)
    return response.data
  } catch (error) {
    console.error("Error creating transport rule:", error)
    throw error
  }
}

/**
 * Met à jour une règle de transport existante
 * @param {string|number} id - ID de la règle
 * @param {Object} ruleData - Données de la règle
 * @returns {Promise<Object>} - Règle mise à jour
 */
export const updateTransportRule = async (id, ruleData) => {
  try {
    const response = await api.put(`/transport/rules/${id}`, ruleData)
    return response.data
  } catch (error) {
    console.error(`Error updating transport rule with ID ${id}:`, error)
    throw error
  }
}

/**
 * Supprime une règle de transport
 * @param {string|number} id - ID de la règle
 * @returns {Promise<void>}
 */
export const deleteTransportRule = async (id) => {
  try {
    await api.delete(`/transport/rules/${id}`)
  } catch (error) {
    console.error(`Error deleting transport rule with ID ${id}:`, error)
    throw error
  }
}

/**
 * Obtient une recommandation de véhicule pour une livraison
 * @param {Object} deliveryData - Données de la livraison
 * @returns {Promise<Object>} - Recommandation de véhicule
 */
export const getVehicleRecommendation = async (deliveryData) => {
  try {
    const response = await api.post("/transport/recommend", deliveryData)
    return response.data
  } catch (error) {
    console.error("Error getting vehicle recommendation:", error)
    throw error
  }
}

/**
 * Récupère les statistiques d'utilisation des véhicules
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise<Object>} - Statistiques d'utilisation
 */
export const fetchVehicleUsageStats = async (params = {}) => {
  try {
    const response = await api.get("/transport/stats/usage", { params })
    return response.data
  } catch (error) {
    console.error("Error fetching vehicle usage stats:", error)
    throw error
  }
}

/**
 * Récupère les statistiques de performance des véhicules
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise<Object>} - Statistiques de performance
 */
export const fetchVehiclePerformanceStats = async (params = {}) => {
  try {
    const response = await api.get("/transport/stats/performance", { params })
    return response.data
  } catch (error) {
    console.error("Error fetching vehicle performance stats:", error)
    throw error
  }
}

/**
 * Récupère les statistiques environnementales des véhicules
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise<Object>} - Statistiques environnementales
 */
export const fetchVehicleEnvironmentalStats = async (params = {}) => {
  try {
    const response = await api.get("/transport/stats/environmental", { params })
    return response.data
  } catch (error) {
    console.error("Error fetching vehicle environmental stats:", error)
    throw error
  }
}

/**
 * Get vehicle types
 * @returns {Promise} - Promise with response data
 */
export const getVehicleTypes = async () => {
  try {
    const response = await api.get("/transport/vehicle-types")
    return response.data
  } catch (error) {
    console.error("Error fetching vehicle types:", error)
    throw error
  }
}

/**
 * Get cargo categories
 * @returns {Promise} - Promise with response data
 */
export const getCargoCategories = async () => {
  try {
    const response = await api.get("/transport/cargo-categories")
    return response.data
  } catch (error) {
    console.error("Error fetching cargo categories:", error)
    throw error
  }
}

/**
 * Get transport statistics
 * @returns {Promise} - Promise with response data
 */
export const getTransportStats = async () => {
  try {
    const response = await api.get("/transport/stats")
    return response.data
  } catch (error) {
    console.error("Error fetching transport statistics:", error)
    throw error
  }
}

export default {
  fetchVehicles,
  fetchVehicleDetails,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleDocument,
  fetchCourierVehicles,
  assignVehicleToCourier,
  updateCourierVehicle,
  removeCourierVehicle,
  setPrimaryVehicle,
  fetchTransportRules,
  fetchTransportRuleDetails,
  createTransportRule,
  updateTransportRule,
  deleteTransportRule,
  getVehicleRecommendation,
  fetchVehicleUsageStats,
  fetchVehiclePerformanceStats,
  fetchVehicleEnvironmentalStats,
  getVehicleTypes,
  getCargoCategories,
  getTransportStats
}
