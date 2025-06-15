import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:8000'

const settingsApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/settings`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
settingsApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

export default {
  // Récupérer tous les paramètres
  async getSettings() {
    const response = await settingsApi.get('/')
    return response.data
  },

  // Mettre à jour les paramètres
  async updateSettings(settings) {
    const response = await settingsApi.put('/', settings)
    return response.data
  },

  // Réinitialiser aux paramètres par défaut
  async resetSettings() {
    const response = await settingsApi.post('/reset')
    return response.data
  },

  // Récupérer l'historique des modifications
  async getSettingsHistory() {
    const response = await settingsApi.get('/history')
    return response.data
  },

  // Exporter la configuration
  async exportSettings() {
    const response = await settingsApi.get('/export', {
      responseType: 'blob',
    })
    return response
  },

  // Importer la configuration
  async importSettings(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await settingsApi.post('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Valider la configuration
  async validateSettings(settings) {
    const response = await settingsApi.post('/validate', settings)
    return response.data
  },

  // Tester la connectivité des services externes
  async testConnections() {
    const response = await settingsApi.post('/test-connections')
    return response.data
  },
  //Added language settings functions based on the intention
  async getLanguageSettings() {
    try {
      const response = await settingsApi.get('/language')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de langue:', error)
      throw error
    }
  },

  async updateLanguageSettings(settings) {
    try {
      const response = await settingsApi.put('/language', settings)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres de langue:', error)
      throw error
    }
  },
}