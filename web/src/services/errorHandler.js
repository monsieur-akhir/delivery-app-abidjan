import { useToast } from 'vue-toastification'
import router from '../router'

const toast = useToast()

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        toast.error(data.message || 'Requête invalide')
        break
      case 401:
        toast.error('Session expirée. Veuillez vous reconnecter.')
        router.push('/login')
        break
      case 403:
        toast.error('Accès non autorisé')
        break
      case 404:
        toast.error('Ressource non trouvée')
        break
      case 500:
        toast.error('Erreur serveur. Veuillez réessayer plus tard.')
        break
      default:
        toast.error('Une erreur est survenue')
    }
    
    throw new ApiError(data.message, status, data.code)
  }
  
  if (error.request) {
    toast.error('Impossible de contacter le serveur')
    throw new ApiError('Erreur réseau', 0, 'NETWORK_ERROR')
  }
  
  toast.error('Une erreur inattendue est survenue')
  throw error
} 