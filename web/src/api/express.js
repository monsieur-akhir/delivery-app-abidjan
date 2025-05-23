import axios from "axios"
import { getToken } from "./auth"
import { API_URL } from "@/config"

const API_ENDPOINT = `${API_URL}/express`

// Configuration de l'en-tête d'autorisation
const getAuthHeader = () => {
  const token = getToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

// Récupération des livraisons express
export const getExpressDeliveries = async (
  status = null,
  commune = null,
  search = null,
  startDate = null,
  endDate = null,
  skip = 0,
  limit = 100,
) => {
  try {
    let url = `${API_ENDPOINT}/`
    const params = []

    if (status) {
      params.push(`status=${status}`)
    }

    if (commune) {
      params.push(`commune=${commune}`)
    }

    if (search) {
      params.push(`search=${search}`)
    }

    if (startDate) {
      params.push(`start_date=${startDate.toISOString()}`)
    }

    if (endDate) {
      params.push(`end_date=${endDate.toISOString()}`)
    }

    params.push(`skip=${skip}`)
    params.push(`limit=${limit}`)

    if (params.length > 0) {
      url += `?${params.join("&")}`
    }

    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des livraisons express:", error)
    throw error
  }
}

// Création d'une nouvelle livraison express
export const createExpressDelivery = async (deliveryData) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}/`, deliveryData, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la création d'une livraison express:", error)
    throw error
  }
}

// Récupération des détails d'une livraison express
export const getExpressDelivery = async (deliveryId) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/${deliveryId}`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la livraison express ${deliveryId}:`, error)
    throw error
  }
}

// Mise à jour des détails d'une livraison express
export const updateExpressDelivery = async (deliveryId, deliveryData) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/${deliveryId}`, deliveryData, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la livraison express ${deliveryId}:`, error)
    throw error
  }
}

// Assignation d'un coursier à une livraison express
export const assignCourierToExpressDelivery = async (deliveryId, courierId, sendNotification = true) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/${deliveryId}/assign/${courierId}?send_notification=${sendNotification}`,
      {},
      getAuthHeader(),
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de l'assignation du coursier ${courierId} à la livraison express ${deliveryId}:`, error)
    throw error
  }
}

// Annulation d'une livraison express
export const cancelExpressDelivery = async (deliveryId, reason) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/${deliveryId}/cancel`, { reason }, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de l'annulation de la livraison express ${deliveryId}:`, error)
    throw error
  }
}

// Marquer une livraison express comme terminée
export const completeExpressDelivery = async (deliveryId) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/${deliveryId}/complete`, {}, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors du marquage de la livraison express ${deliveryId} comme terminée:`, error)
    throw error
  }
}

// Récupération des statistiques des livraisons express
export const getExpressStats = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/stats`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques des livraisons express:", error)
    throw error
  }
}

// Récupération des analyses des livraisons express
export const getExpressAnalytics = async (startDate = null, endDate = null) => {
  try {
    let url = `${API_ENDPOINT}/analytics`
    const params = []

    if (startDate) {
      params.push(`start_date=${startDate.toISOString()}`)
    }

    if (endDate) {
      params.push(`end_date=${endDate.toISOString()}`)
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`
    }

    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des analyses des livraisons express:", error)
    throw error
  }
}

// Récupération des organisations caritatives
export const getCharityOrganizations = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/donations/organizations`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des organisations caritatives:", error)
    throw error
  }
}

// Récupération des statistiques des dons
export const getDonationStats = async (startDate = null, endDate = null) => {
  try {
    let url = `${API_ENDPOINT}/donations/stats`
    const params = []

    if (startDate) {
      params.push(`start_date=${startDate.toISOString()}`)
    }

    if (endDate) {
      params.push(`end_date=${endDate.toISOString()}`)
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`
    }

    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques des dons:", error)
    throw error
  }
}

// Récupération de la liste des dons
export const getDonations = async (organization = null, startDate = null, endDate = null, skip = 0, limit = 100) => {
  try {
    let url = `${API_ENDPOINT}/donations`
    const params = []

    if (organization) {
      params.push(`organization=${organization}`)
    }

    if (startDate) {
      params.push(`start_date=${startDate.toISOString()}`)
    }

    if (endDate) {
      params.push(`end_date=${endDate.toISOString()}`)
    }

    params.push(`skip=${skip}`)
    params.push(`limit=${limit}`)

    if (params.length > 0) {
      url += `?${params.join("&")}`
    }

    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération de la liste des dons:", error)
    throw error
  }
}

// Export des données au format CSV
export const exportExpressData = async (data, filename = "express-delivery-data.csv") => {
  try {
    // Convertir les données en CSV
    let csv = ""

    // Ajouter les en-têtes
    const headers = Object.keys(data[0])
    csv += headers.join(",") + "\n"

    // Ajouter les lignes
    data.forEach((item) => {
      const values = headers.map((header) => {
        const value = item[header]
        // Échapper les virgules et les guillemets
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csv += values.join(",") + "\n"
    })

    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error)
    throw error
  }
}
