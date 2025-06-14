import axios from 'axios'
import { getToken } from './auth'
import { API_URL } from '@/config'

const API_ENDPOINT = `${API_URL}/policies`

// Configuration de l'en-tête d'autorisation
const getAuthHeader = () => {
  const token = getToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

// Fonctions pour les politiques générales
export const getAllPolicies = async () => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des politiques:', error)
    throw error
  }
}

// Fonctions pour les règles de modération
export const getModerationRules = async (active = null) => {
  try {
    const url =
      active !== null
        ? `${API_ENDPOINT}/moderation-rules?active=${active}`
        : `${API_ENDPOINT}/moderation-rules`
    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des règles de modération:', error)
    throw error
  }
}

export const getModerationRule = async ruleId => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/moderation-rules/${ruleId}`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération de la règle de modération ${ruleId}:`, error)
    throw error
  }
}

export const createModerationRule = async ruleData => {
  try {
    const response = await axios.post(`${API_ENDPOINT}/moderation-rules`, ruleData, getAuthHeader())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création de la règle de modération:', error)
    throw error
  }
}

export const updateModerationRule = async (ruleId, ruleData) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/moderation-rules/${ruleId}`,
      ruleData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la règle de modération ${ruleId}:`, error)
    throw error
  }
}

export const deleteModerationRule = async ruleId => {
  try {
    await axios.delete(`${API_ENDPOINT}/moderation-rules/${ruleId}`, getAuthHeader())
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression de la règle de modération ${ruleId}:`, error)
    throw error
  }
}

// Fonctions pour les critères de remboursement
export const getRefundCriteria = async (active = null) => {
  try {
    const url =
      active !== null
        ? `${API_ENDPOINT}/refund-criteria?active=${active}`
        : `${API_ENDPOINT}/refund-criteria`
    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des critères de remboursement:', error)
    throw error
  }
}

export const getRefundCriterion = async criteriaId => {
  try {
    const response = await axios.get(
      `${API_ENDPOINT}/refund-criteria/${criteriaId}`,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error(
      `Erreur lors de la récupération du critère de remboursement ${criteriaId}:`,
      error
    )
    throw error
  }
}

export const createRefundCriteria = async criteriaData => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}/refund-criteria`,
      criteriaData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création du critère de remboursement:', error)
    throw error
  }
}

export const updateRefundCriteria = async (criteriaId, criteriaData) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/refund-criteria/${criteriaId}`,
      criteriaData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du critère de remboursement ${criteriaId}:`, error)
    throw error
  }
}

export const deleteRefundCriteria = async criteriaId => {
  try {
    await axios.delete(`${API_ENDPOINT}/refund-criteria/${criteriaId}`, getAuthHeader())
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression du critère de remboursement ${criteriaId}:`, error)
    throw error
  }
}

// Fonctions pour les paramètres de sanction
export const getSanctionParameters = async (active = null) => {
  try {
    const url =
      active !== null
        ? `${API_ENDPOINT}/sanction-parameters?active=${active}`
        : `${API_ENDPOINT}/sanction-parameters`
    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de sanction:', error)
    throw error
  }
}

export const getSanctionParameter = async parameterId => {
  try {
    const response = await axios.get(
      `${API_ENDPOINT}/sanction-parameters/${parameterId}`,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération du paramètre de sanction ${parameterId}:`, error)
    throw error
  }
}

export const createSanctionParameter = async parameterData => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}/sanction-parameters`,
      parameterData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création du paramètre de sanction:', error)
    throw error
  }
}

export const updateSanctionParameter = async (parameterId, parameterData) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/sanction-parameters/${parameterId}`,
      parameterData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du paramètre de sanction ${parameterId}:`, error)
    throw error
  }
}

export const deleteSanctionParameter = async parameterId => {
  try {
    await axios.delete(`${API_ENDPOINT}/sanction-parameters/${parameterId}`, getAuthHeader())
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression du paramètre de sanction ${parameterId}:`, error)
    throw error
  }
}

// Fonctions pour les modèles SMS
export const getSmsTemplates = async (active = null, eventType = null) => {
  try {
    let url = `${API_ENDPOINT}/sms-templates`
    const params = []

    if (active !== null) {
      params.push(`active=${active}`)
    }

    if (eventType) {
      params.push(`event_type=${eventType}`)
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`
    }

    const response = await axios.get(url, getAuthHeader())
    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles SMS:', error)
    throw error
  }
}

export const getSmsTemplate = async templateId => {
  try {
    const response = await axios.get(`${API_ENDPOINT}/sms-templates/${templateId}`, getAuthHeader())
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la récupération du modèle SMS ${templateId}:`, error)
    throw error
  }
}

export const createSmsTemplate = async templateData => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}/sms-templates`,
      templateData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Erreur lors de la création du modèle SMS:', error)
    throw error
  }
}

export const updateSmsTemplate = async (templateId, templateData) => {
  try {
    const response = await axios.put(
      `${API_ENDPOINT}/sms-templates/${templateId}`,
      templateData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du modèle SMS ${templateId}:`, error)
    throw error
  }
}

export const deleteSmsTemplate = async templateId => {
  try {
    await axios.delete(`${API_ENDPOINT}/sms-templates/${templateId}`, getAuthHeader())
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression du modèle SMS ${templateId}:`, error)
    throw error
  }
}

export const testSmsTemplate = async testData => {
  try {
    const response = await axios.post(
      `${API_ENDPOINT}/sms-templates/test`,
      testData,
      getAuthHeader()
    )
    return response.data
  } catch (error) {
    console.error('Erreur lors du test du modèle SMS:', error)
    throw error
  }
}
