import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/environment'
import type { 
  User, 
  UserRole, 
  KYCStatus,
  CourierProfile,
  BusinessProfile,
  UserPreferences,
  KYCDocument,
  Notification
} from '../types/models'

// Additional types for UserService
export interface OpeningHours {
  [dayOfWeek: string]: {
    open: boolean
    start?: string
    end?: string
  }
}

export interface UserStats {
  deliveries_completed: number
  total_earnings: number
  average_rating: number
  total_distance: number
  active_days: number
  [key: string]: any
}

export interface ActivityHistoryItem {
  id: number
  type: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ApiError {
  response?: {
    data?: {
      detail?: string
      message?: string
    }
  }
  message?: string
}

export interface DataExportResponse {
  export_id: string
}

export interface DataExportStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  download_url?: string
}

// Types pour les requêtes utilisateur
export interface UserUpdateRequest {
  full_name?: string
  email?: string
  commune?: string
  language_preference?: string
  profile_picture_url?: string
  is_available?: boolean
  is_online?: boolean
  bio?: string
}

export interface CourierProfileUpdateRequest {
  vehicle_type?: string
  license_plate?: string
  id_card_number?: string
  bio?: string
  is_available?: boolean
  current_location_lat?: number
  current_location_lng?: number
}

export interface BusinessProfileUpdateRequest {
  business_name?: string
  business_type?: string
  business_address?: string
  business_phone?: string
  business_email?: string
  business_description?: string
  opening_hours?: OpeningHours
  delivery_zones?: string[]
}

export interface KYCDocumentUpload {
  document_type: 'id_card' | 'driving_license' | 'vehicle_registration' | 'insurance' | 'business_license'
  file: FormData
}

export interface PushTokenRequest {
  token: string
  platform: 'ios' | 'android'
}

export interface UserPreferencesUpdate {
  language?: string
  currency?: string
  notifications_enabled?: boolean
  email_notifications?: boolean
  sms_notifications?: boolean
  push_notifications?: boolean
  marketing_emails?: boolean
  location_sharing?: boolean
  theme?: 'light' | 'dark' | 'auto'
}

export interface LocationUpdateRequest {
  latitude: number
  longitude: number
  accuracy?: number
  heading?: number
  speed?: number
  is_available?: boolean
}

class UserService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  // === GESTION DU PROFIL ===

  /**
   * Récupération du profil utilisateur actuel
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get('/users/me')
      return response.data
    } catch (error) {
      console.error('Get current user error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(updateData: UserUpdateRequest): Promise<User> {
    try {
      const response = await this.api.put('/users/profile', updateData)
      return response.data
    } catch (error) {
      console.error('Update profile error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Upload de photo de profil
   */  async uploadProfilePicture(imageUri: string): Promise<{ profile_picture_url: string }> {
    try {
      const formData = new FormData()
      const filename = imageUri.split('/').pop()
      const match = /\.(\w+)$/.exec(filename || '')
      const type = match ? `image/${match[1]}` : 'image'

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as unknown as Blob)

      const response = await this.api.post('/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Upload profile picture error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression de la photo de profil
   */
  async deleteProfilePicture(): Promise<void> {
    try {
      await this.api.delete('/users/profile-picture')
    } catch (error) {
      console.error('Delete profile picture error:', error)
      throw this.handleError(error)
    }
  }

  // === GESTION DU PROFIL COURSIER ===

  /**
   * Récupération du profil coursier
   */
  async getCourierProfile(): Promise<CourierProfile> {
    try {
      const response = await this.api.get('/users/courier-profile')
      return response.data
    } catch (error) {
      console.error('Get courier profile error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour du profil coursier
   */
  async updateCourierProfile(updateData: CourierProfileUpdateRequest): Promise<CourierProfile> {
    try {
      const response = await this.api.put('/users/courier-profile', updateData)
      return response.data
    } catch (error) {
      console.error('Update courier profile error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour du statut de disponibilité du coursier
   */  async updateCourierStatus(isOnline: boolean, location?: { lat: number; lng: number }): Promise<void> {
    try {
      const data: { is_online: boolean; latitude?: number; longitude?: number } = { is_online: isOnline }
      if (location) {
        data.latitude = location.lat
        data.longitude = location.lng
      }
      await this.api.post('/courier/status', data)
    } catch (error) {
      console.error('Update courier status error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour de la localisation du coursier
   */
  async updateLocation(locationData: LocationUpdateRequest): Promise<void> {
    try {
      await this.api.post('/users/location', locationData)
    } catch (error) {
      console.error('Update location error:', error)
      throw this.handleError(error)
    }
  }

  // === GESTION DU PROFIL BUSINESS ===

  /**
   * Récupération du profil business
   */
  async getBusinessProfile(): Promise<BusinessProfile> {
    try {
      const response = await this.api.get('/users/business-profile')
      return response.data
    } catch (error) {
      console.error('Get business profile error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour du profil business
   */
  async updateBusinessProfile(updateData: BusinessProfileUpdateRequest): Promise<BusinessProfile> {
    try {
      const response = await this.api.put('/users/business-profile', updateData)
      return response.data
    } catch (error) {
      console.error('Update business profile error:', error)
      throw this.handleError(error)
    }
  }

  // === GESTION KYC (VÉRIFICATION D'IDENTITÉ) ===

  /**
   * Récupération du statut KYC
   */  async getKYCStatus(): Promise<{ status: KYCStatus; documents: KYCDocument[] }> {
    try {
      const response = await this.api.get('/users/kyc-status')
      return response.data
    } catch (error) {
      console.error('Get KYC status error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Upload d'un document KYC
   */  async uploadKYCDocument(documentType: string, imageUri: string): Promise<void> {
    try {
      const formData = new FormData()
      const filename = imageUri.split('/').pop()
      const match = /\.(\w+)$/.exec(filename || '')
      const type = match ? `image/${match[1]}` : 'image'

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as unknown as Blob)
      formData.append('document_type', documentType)

      await this.api.post('/users/kyc-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error) {
      console.error('Upload KYC document error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'un document KYC
   */
  async deleteKYCDocument(documentId: number): Promise<void> {
    try {
      await this.api.delete(`/users/kyc-documents/${documentId}`)
    } catch (error) {
      console.error('Delete KYC document error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Soumission du dossier KYC pour vérification
   */
  async submitKYCForVerification(): Promise<void> {
    try {
      await this.api.post('/users/kyc-submit')
    } catch (error) {
      console.error('Submit KYC error:', error)
      throw this.handleError(error)
    }
  }

  // === PRÉFÉRENCES UTILISATEUR ===

  /**
   * Récupération des préférences utilisateur
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await this.api.get('/users/preferences')
      return response.data
    } catch (error) {
      console.error('Get preferences error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour des préférences utilisateur
   */
  async updatePreferences(preferences: UserPreferencesUpdate): Promise<UserPreferences> {
    try {
      const response = await this.api.put('/users/preferences', preferences)
      return response.data
    } catch (error) {
      console.error('Update preferences error:', error)
      throw this.handleError(error)
    }
  }

  // === NOTIFICATIONS PUSH ===

  /**
   * Enregistrement du token push
   */
  async registerPushToken(tokenData: PushTokenRequest): Promise<void> {
    try {
      await this.api.post('/users/push-token', tokenData)
    } catch (error) {
      console.error('Register push token error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression du token push
   */
  async unregisterPushToken(): Promise<void> {
    try {
      await this.api.delete('/users/push-token')
    } catch (error) {
      console.error('Unregister push token error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des notifications
   */  async getNotifications(page: number = 1, limit: number = 20): Promise<Notification[]> {
    try {
      const response = await this.api.get('/users/notifications', {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Get notifications error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Marquage d'une notification comme lue
   */
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await this.api.put(`/users/notifications/${notificationId}/read`)
    } catch (error) {
      console.error('Mark notification as read error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Marquage de toutes les notifications comme lues
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.api.put('/users/notifications/read-all')
    } catch (error) {
      console.error('Mark all notifications as read error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'une notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await this.api.delete(`/users/notifications/${notificationId}`)
    } catch (error) {
      console.error('Delete notification error:', error)
      throw this.handleError(error)
    }
  }

  // === STATISTIQUES ET HISTORIQUE ===

  /**
   * Récupération des statistiques utilisateur
   */  async getUserStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<UserStats> {
    try {
      const response = await this.api.get('/users/stats', { params: { period } })
      return response.data
    } catch (error) {
      console.error('Get user stats error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération de l'historique des activités
   */  async getActivityHistory(page: number = 1, limit: number = 20): Promise<ActivityHistoryItem[]> {
    try {
      const response = await this.api.get('/users/activity-history', {
        params: { page, limit }
      })
      return response.data
    } catch (error) {
      console.error('Get activity history error:', error)
      throw this.handleError(error)
    }
  }

  // === GESTION DU COMPTE ===

  /**
   * Désactivation temporaire du compte
   */
  async deactivateAccount(reason?: string): Promise<void> {
    try {
      await this.api.post('/users/deactivate', { reason })
    } catch (error) {
      console.error('Deactivate account error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Réactivation du compte
   */
  async reactivateAccount(): Promise<void> {
    try {
      await this.api.post('/users/reactivate')
    } catch (error) {
      console.error('Reactivate account error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression définitive du compte
   */
  async deleteAccount(password: string, reason?: string): Promise<void> {
    try {
      await this.api.delete('/users/account', { 
        data: { password, reason }
      })
    } catch (error) {
      console.error('Delete account error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Demande d'export des données utilisateur (RGPD)
   */
  async requestDataExport(): Promise<{ export_id: string }> {
    try {
      const response = await this.api.post('/users/export-data')
      return response.data
    } catch (error) {
      console.error('Request data export error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Vérification du statut d'export des données
   */
  async getDataExportStatus(exportId: string): Promise<{ status: string; download_url?: string }> {
    try {
      const response = await this.api.get(`/users/export-data/${exportId}`)
      return response.data
    } catch (error) {
      console.error('Get data export status error:', error)
      throw this.handleError(error)
    }
  }

  // === MÉTHODES UTILITAIRES ===

  /**
   * Recherche d'utilisateurs
   */  async searchUsers(query: string, userType?: UserRole): Promise<User[]> {
    try {
      const params: { q: string; type?: UserRole } = { q: query }
      if (userType) params.type = userType

      const response = await this.api.get('/users/search', { params })
      return response.data
    } catch (error) {
      console.error('Search users error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération d'un profil public d'utilisateur
   */
  async getPublicProfile(userId: number): Promise<User> {
    try {
      const response = await this.api.get(`/users/${userId}/public`)
      return response.data
    } catch (error) {
      console.error('Get public profile error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Signalement d'un utilisateur
   */
  async reportUser(userId: number, reason: string, description?: string): Promise<void> {
    try {
      await this.api.post(`/users/${userId}/report`, { reason, description })
    } catch (error) {
      console.error('Report user error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Blocage d'un utilisateur
   */
  async blockUser(userId: number): Promise<void> {
    try {
      await this.api.post(`/users/${userId}/block`)
    } catch (error) {
      console.error('Block user error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Déblocage d'un utilisateur
   */
  async unblockUser(userId: number): Promise<void> {
    try {
      await this.api.post(`/users/${userId}/unblock`)
    } catch (error) {
      console.error('Unblock user error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération de la liste des utilisateurs bloqués
   */
  async getBlockedUsers(): Promise<User[]> {
    try {
      const response = await this.api.get('/users/blocked')
      return response.data
    } catch (error) {
      console.error('Get blocked users error:', error)
      throw this.handleError(error)
    }
  }  /**
   * Récupération des gains du coursier
   */
  async getCourierEarnings(period = 'month'): Promise<import('../types/models').CourierEarningsData> {
    try {
      const response = await this.api.get(`/users/courier/earnings?period=${period}`)
      return response.data
    } catch (error) {
      console.error('Get courier earnings error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des transactions du portefeuille
   */
  async getWalletTransactions(page = 1, limit = 20): Promise<import('../types/models').WalletTransaction[]> {
    try {
      const response = await this.api.get(`/users/wallet/transactions?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.error('Get wallet transactions error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Demande de retrait de fonds
   */
  async withdrawFunds(amount: number, paymentMethod: string): Promise<void> {
    try {
      await this.api.post('/users/wallet/withdraw', {
        amount,
        payment_method: paymentMethod
      })
    } catch (error) {
      console.error('Withdraw funds error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Demande de paiement
   */
  async requestPayout(request: import('../types/models').PayoutRequest): Promise<void> {
    try {
      await this.api.post('/users/wallet/payout', request)
    } catch (error) {
      console.error('Request payout error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: unknown): Error {
    let message = 'Une erreur est survenue'

    if (error && typeof error === 'object') {
      const errorObj = error as ApiError
      if (errorObj.response?.data?.detail) {
        message = errorObj.response.data.detail
      } else if (errorObj.response?.data?.message) {
        message = errorObj.response.data.message
      } else if (errorObj.message) {
        message = errorObj.message
      }
    }

    return new Error(message)
  }
}

export default new UserService()
