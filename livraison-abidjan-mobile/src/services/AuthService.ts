import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config/environment'
import type { User, UserRole } from '../types/models'

// Types d'authentification
export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  phone: string
  email?: string
  password: string
  role: UserRole
  commune?: string
  language_preference?: string
  vehicle_type?: string
  license_plate?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface OTPRequest {
  phone: string
  otp_type: 'login' | 'registration' | 'password_reset'
}

export interface OTPVerification {
  phone: string
  code: string
  otp_type: 'login' | 'registration' | 'password_reset'
}

export interface OTPResponse {
  success: boolean
  message: string
  expires_at?: string
}

export interface PasswordResetRequest {
  phone: string
}

export interface PasswordResetConfirm {
  phone: string
  reset_code: string
  new_password: string
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
}

class AuthService {
  private api: AxiosInstance
  private tokenKey = '@livraison_abidjan:auth_token'
  private refreshTokenKey = '@livraison_abidjan:refresh_token'
  private userKey = '@livraison_abidjan:user_data'
  
  // Callbacks pour notifier les contexts
  public notifyTokenExpired?: () => void
  public notifyTokenRefresh?: (newToken: string) => void

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Intercepteur de requête pour ajouter le token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Intercepteur de réponse pour gérer le refresh automatique
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = await this.getRefreshToken()
            if (refreshToken) {
              const response = await this.refreshAccessToken(refreshToken)
              await this.saveTokens(response.access_token, response.refresh_token)
              
              // Notifier les autres composants du nouveau token
              this.notifyTokenRefresh?.(response.access_token);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.access_token}`
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            // Notifier les autres composants de l'expiration
            this.notifyTokenExpired?.();
            await this.logout()
            throw refreshError
          }
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await this.api.post('/register', userData)
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/login', credentials)
      const authData: AuthResponse = response.data

      // Sauvegarder les tokens et les données utilisateur
      await this.saveTokens(authData.access_token, authData.refresh_token)
      await this.saveUser(authData.user)

      return authData
    } catch (error) {
      console.error('Login error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      // Appel API pour invalider le token côté serveur
      await this.api.post('/logout')
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Nettoyer le stockage local
      await this.clearStorage()
    }
  }

  /**
   * Envoi d'un code OTP
   */
  async sendOTP(request: OTPRequest): Promise<OTPResponse> {
    try {
      const response = await this.api.post('/send-otp', request)
      return response.data
    } catch (error) {
      console.error('Send OTP error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Vérification d'un code OTP
   */
  async verifyOTP(verification: OTPVerification): Promise<OTPResponse> {
    try {
      const response = await this.api.post('/verify-otp', verification)
      return response.data
    } catch (error) {
      console.error('Verify OTP error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Renvoi d'un code OTP
   */
  async resendOTP(phone: string, otpType: 'login' | 'registration' | 'password_reset'): Promise<OTPResponse> {
    try {
      const response = await this.api.post('/resend-otp', { 
        phone, 
        otp_type: otpType 
      })
      return response.data
    } catch (error) {
      console.error('Resend OTP error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<OTPResponse> {
    try {
      const response = await this.api.post('/password-reset', request)
      return response.data
    } catch (error) {
      console.error('Password reset request error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Confirmation de réinitialisation de mot de passe
   */
  async confirmPasswordReset(request: PasswordResetConfirm): Promise<void> {
    try {
      await this.api.post('/password-reset/confirm', request)
    } catch (error) {
      console.error('Password reset confirm error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Changement de mot de passe
   */
  async changePassword(request: PasswordChangeRequest): Promise<void> {
    try {
      await this.api.post('/change-password', request)
    } catch (error) {
      console.error('Change password error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Vérification de la validité du token
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await this.api.post('/verify-token')
      return response.status === 200
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  /**
   * Rafraîchissement du token d'accès
   */
  private async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refresh_token: refreshToken
      })
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Activation de l'authentification à deux facteurs
   */
  async enableTwoFactor(): Promise<{ qr_code: string; backup_codes: string[] }> {
    try {
      const response = await this.api.post('/2fa/enable')
      return response.data
    } catch (error) {
      console.error('Enable 2FA error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Désactivation de l'authentification à deux facteurs
   */
  async disableTwoFactor(code: string): Promise<void> {
    try {
      await this.api.post('/2fa/disable', { code })
    } catch (error) {
      console.error('Disable 2FA error:', error)
      throw this.handleError(error)
    }
  }

  // Méthodes utilitaires pour la gestion du stockage

  /**
   * Récupération du token d'accès
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.tokenKey)
    } catch (error) {
      console.error('Get token error:', error)
      return null
    }
  }

  /**
   * Récupération du token de rafraîchissement
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.refreshTokenKey)
    } catch (error) {
      console.error('Get refresh token error:', error)
      return null
    }
  }

  /**
   * Récupération des données utilisateur
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.userKey)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  /**
   * Sauvegarde des tokens
   */
  private async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.tokenKey, accessToken),
        AsyncStorage.setItem(this.refreshTokenKey, refreshToken)
      ])
    } catch (error) {
      console.error('Save tokens error:', error)
      throw error
    }
  }

  /**
   * Sauvegarde des données utilisateur
   */
  private async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.userKey, JSON.stringify(user))
    } catch (error) {
      console.error('Save user error:', error)
      throw error
    }
  }

  /**
   * Nettoyage du stockage
   */
  private async clearStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.tokenKey),
        AsyncStorage.removeItem(this.refreshTokenKey),
        AsyncStorage.removeItem(this.userKey)
      ])
    } catch (error) {
      console.error('Clear storage error:', error)
    }
  }

  /**
   * Vérification si l'utilisateur est connecté
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken()
      if (!token) return false

      // Vérifier la validité du token
      return await this.verifyToken()
    } catch (error) {
      console.error('Authentication check error:', error)
      return false
    }
  }

  /**
   * Configuration des callbacks de notification
   */
  setTokenCallbacks(onTokenExpired: () => void, onTokenRefresh: (token: string) => void) {
    this.notifyTokenExpired = onTokenExpired;
    this.notifyTokenRefresh = onTokenRefresh;
  }

  /**
   * Vérification si le token est expiré
   */
  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      if (!decoded.exp) return true;
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): Error {
    let message = 'Une erreur est survenue'

    if (error.response?.data?.detail) {
      message = error.response.data.detail
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    return new Error(message)
  }
}

export default new AuthService()
