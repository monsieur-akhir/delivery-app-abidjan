import axios from "axios"
import { API_URL } from "@/config"

/**
 * Récupérer les logs d'audit
 * @param {Object} params - Paramètres de filtrage
 * @returns {Promise} - Promesse avec les données des logs d'audit
 */
export const fetchAuditLogs = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/manager/audit/logs`, { params })
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des logs d'audit:", error)
    throw error
  }
}
