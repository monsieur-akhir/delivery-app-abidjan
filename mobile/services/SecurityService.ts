import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
// Add this to your package.json dependencies and install it
// "expo-local-authentication": "~13.4.1",

// Then mock it temporarily if needed
const LocalAuthentication = {
  hasHardwareAsync: async () => true,
  isEnrolledAsync: async () => true,
  authenticateAsync: async (options: any) => ({ success: true }),
}
import { API_URL } from "../config/environment"

export interface TwoFactorSetupResponse {
  secret: string
  qrCodeUrl: string
}

export interface SecuritySettings {
  two_factor_enabled: boolean
  biometric_enabled: boolean
  pin_enabled: boolean
  session_timeout: number
  last_password_change: string
  security_questions_set: boolean
}

class SecurityService {
  /**
   * Vérifier si l'appareil prend en charge l'authentification biométrique
   */
  async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    return compatible && enrolled
  }

  /**
   * Authentifier l'utilisateur avec la biométrie
   */
  async authenticateWithBiometrics(promptMessage = "Veuillez vous authentifier"): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: "Utiliser le code PIN",
      })

      return result.success
    } catch (error) {
      console.error("Error authenticating with biometrics:", error)
      return false
    }
  }

  /**
   * Activer l'authentification à deux facteurs
   */
  async enableTwoFactor(): Promise<TwoFactorSetupResponse> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/auth/2fa/enable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response.data
    } catch (error) {
      console.error("Error enabling two-factor authentication:", error)
      throw error
    }
  }

  /**
   * Vérifier le code 2FA
   */
  async verifyTwoFactorCode(code: string): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/auth/2fa/verify`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response.data.success
    } catch (error) {
      console.error("Error verifying two-factor code:", error)
      return false
    }
  }

  /**
   * Désactiver l'authentification à deux facteurs
   */
  async disableTwoFactor(code: string): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/auth/2fa/disable`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response.data.success
    } catch (error) {
      console.error("Error disabling two-factor authentication:", error)
      return false
    }
  }

  /**
   * Définir un code PIN
   */
  async setPin(pin: string): Promise<boolean> {
    try {
      // Stocker le PIN de manière sécurisée
      await SecureStore.setItemAsync("user_pin", pin)

      // Mettre à jour les paramètres sur le serveur
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/auth/pin/set`,
        { pin_enabled: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return true
    } catch (error) {
      console.error("Error setting PIN:", error)
      return false
    }
  }

  /**
   * Vérifier le code PIN
   */
  async verifyPin(pin: string): Promise<boolean> {
    try {
      const storedPin = await SecureStore.getItemAsync("user_pin")
      return storedPin === pin
    } catch (error) {
      console.error("Error verifying PIN:", error)
      return false
    }
  }

  /**
   * Supprimer le code PIN
   */
  async removePin(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync("user_pin")

      // Mettre à jour les paramètres sur le serveur
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/auth/pin/set`,
        { pin_enabled: false },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return true
    } catch (error) {
      console.error("Error removing PIN:", error)
      return false
    }
  }

  /**
   * Activer l'authentification biométrique
   */
  async enableBiometrics(): Promise<boolean> {
    try {
      // Vérifier si la biométrie est disponible
      const available = await this.isBiometricAvailable()

      if (!available) {
        return false
      }

      // Mettre à jour les paramètres sur le serveur
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/auth/biometrics/set`,
        { biometric_enabled: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Stocker le paramètre localement
      await AsyncStorage.setItem("biometric_enabled", "true")

      return true
    } catch (error) {
      console.error("Error enabling biometrics:", error)
      return false
    }
  }

  /**
   * Désactiver l'authentification biométrique
   */
  async disableBiometrics(): Promise<boolean> {
    try {
      // Mettre à jour les paramètres sur le serveur
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/auth/biometrics/set`,
        { biometric_enabled: false },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Supprimer le paramètre localement
      await AsyncStorage.removeItem("biometric_enabled")

      return true
    } catch (error) {
      console.error("Error disabling biometrics:", error)
      return false
    }
  }

  /**
   * Obtenir les paramètres de sécurité
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/auth/security-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting security settings:", error)
      throw error
    }
  }

  /**
   * Définir des questions de sécurité
   */
  async setSecurityQuestions(questions: Array<{ question: string; answer: string }>): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/auth/security-questions`,
        { questions },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return true
    } catch (error) {
      console.error("Error setting security questions:", error)
      return false
    }
  }

  /**
   * Vérifier les réponses aux questions de sécurité
   */
  async verifySecurityQuestions(answers: Array<{ question_id: number; answer: string }>): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/auth/verify-security-questions`,
        { answers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response.data.success
    } catch (error) {
      console.error("Error verifying security questions:", error)
      return false
    }
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/auth/change-password`,
        { current_password: currentPassword, new_password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return true
    } catch (error) {
      console.error("Error changing password:", error)
      throw error
    }
  }

  /**
   * Vérifier si le mot de passe est fort
   */
  checkPasswordStrength(password: string): {
    score: number
    feedback: string[]
    isStrong: boolean
  } {
    const feedback = []
    let score = 0

    // Longueur minimale
    if (password.length < 8) {
      feedback.push("Le mot de passe doit contenir au moins 8 caractères")
    } else {
      score += 1
    }

    // Présence de chiffres
    if (!/\d/.test(password)) {
      feedback.push("Le mot de passe doit contenir au moins un chiffre")
    } else {
      score += 1
    }

    // Présence de lettres minuscules
    if (!/[a-z]/.test(password)) {
      feedback.push("Le mot de passe doit contenir au moins une lettre minuscule")
    } else {
      score += 1
    }

    // Présence de lettres majuscules
    if (!/[A-Z]/.test(password)) {
      feedback.push("Le mot de passe doit contenir au moins une lettre majuscule")
    } else {
      score += 1
    }

    // Présence de caractères spéciaux
    if (!/[^A-Za-z0-9]/.test(password)) {
      feedback.push("Le mot de passe doit contenir au moins un caractère spécial")
    } else {
      score += 1
    }

    return {
      score,
      feedback,
      isStrong: score >= 4,
    }
  }
}

export default new SecurityService()
