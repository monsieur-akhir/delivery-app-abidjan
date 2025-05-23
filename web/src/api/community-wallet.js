import axios from "axios"
import { getToken } from "./auth"
import { API_URL } from "@/config"

const API_ENDPOINT = `${API_URL}/wallet/community`

// Configuration de l'en-tête d'autorisation
const getAuthHeader = () => {
  const token = getToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

// Statistiques du portefeuille communautaire
export const getCommunityStats = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/stats`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du portefeuille communautaire:", error)
    throw error
  }
}

// Ajout de fonds au portefeuille communautaire
export const addCommunityFunds = async (amount, source, description = "") => {
  try {
    const response = await axios.post(`${API_ENDPOINT}/funds`, { amount, source, description }, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de l'ajout de fonds au portefeuille communautaire:", error)
    throw error
  }
}

// Récupération des demandes de prêt en attente
export const getPendingLoans = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/loans/pending`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes de prêt en attente:", error)
    throw error
  }
}

// Récupération des prêts actifs
export const getActiveLoans = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/loans/active`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error("Erreur lors de la récupération des prêts actifs:", error)
    throw error
  }
}

// Récupération de l'historique des prêts
export const getLoanHistory = async (status = null, startDate = null, endDate = null) => {
  try {
    let url = `${API_ENDPOINT}/loans/history`
    const params = []

    if (status) {
      params.push(`status=${status}`)
    }

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
    console.error("Erreur lors de la récupération de l'historique des prêts:", error)
    throw error
  }
}

// Récupération des détails d'un prêt
export const getLoanDetails = async (loanId) => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/loans/${loanId}`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du prêt ${loanId}:`, error)
    throw error
  }
}

// Approbation d'un prêt
export const approveLoan = async (loanId, repaymentDeadline = null) => {
  try {
    const data = {}
    if (repaymentDeadline) {
      data.repayment_deadline = repaymentDeadline.toISOString()
    }

    const response = await axios.put(`${API_ENDPOINT}/loans/${loanId}/approve`, data, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de l'approbation du prêt ${loanId}:`, error)
    throw error
  }
}

// Rejet d'un prêt
export const rejectLoan = async (loanId, reason) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/loans/${loanId}/reject`, { reason }, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors du rejet du prêt ${loanId}:`, error)
    throw error
  }
}

// Prolongation d'un prêt
export const extendLoan = async (loanId, extensionDays, reason) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/loans/${loanId}/extend`,
      { extension_days: extensionDays, reason },
      getAuthHeader(),
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la prolongation du prêt ${loanId}:`, error)
    throw error
  }
}

// Marquer un prêt comme remboursé
export const markLoanAsRepaid = async (loanId) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/loans/${loanId}/repay`, {}, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors du marquage du prêt ${loanId} comme remboursé:`, error)
    throw error
  }
}

// Passer un prêt en perte
export const writeOffLoan = async (loanId, reason) => {
  try {
    const response = await axios.put(`${API_ENDPOINT}/loans/${loanId}/write-off`, { reason }, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors du passage en perte du prêt ${loanId}:`, error)
    throw error
  }
}

// Envoyer un rappel pour un prêt
export const sendLoanReminder = async (loanId, message = null) => {
  try {
    const data = {}
    if (message) {
      data.message = message
    }

    const response = await axios.post(`${API_ENDPOINT}/loans/${loanId}/send-reminder`, data, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de l'envoi d'un rappel pour le prêt ${loanId}:`, error)
    throw error
  }
}

// Récupération des analyses du portefeuille communautaire
export const getCommunityAnalytics = async (startDate = null, endDate = null) => {
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
    console.error("Erreur lors de la récupération des analyses du portefeuille communautaire:", error)
    throw error
  }
}

// Export des données au format CSV
export const exportCommunityData = async (data, filename = "community-wallet-data.csv") => {
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
