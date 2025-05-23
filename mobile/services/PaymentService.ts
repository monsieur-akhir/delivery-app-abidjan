import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"
import { useNetwork } from "../contexts/NetworkContext"

// Types
export interface PaymentMethod {
  id: string
  name: string
  icon: string
  enabled: boolean
}

export interface PaymentInitiationResponse {
  status: string
  payment_url?: string
  payment_token?: string
  transaction_id: string
  message?: string
}

export interface PaymentVerificationResponse {
  status: string
  transaction_id: string
  payment_status?: string
  amount?: number
  currency?: string
  payment_method?: string
  message?: string
}

export interface TopUpRequest {
  amount: number
  payment_method: string
  phone?: string
}

export interface PaymentRequest {
  delivery_id: number
  amount: number
  payment_method: string
  phone?: string
}

class PaymentService {
  // Récupérer les méthodes de paiement disponibles
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/payments/methods`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      // Retourner des méthodes par défaut en cas d'erreur
      return [
        {
          id: "cash",
          name: "Paiement en espèces",
          icon: "cash",
          enabled: true,
        },
        {
          id: "orange_money",
          name: "Orange Money",
          icon: "phone",
          enabled: true,
        },
        {
          id: "mtn_money",
          name: "MTN Mobile Money",
          icon: "phone",
          enabled: true,
        },
        {
          id: "moov_money",
          name: "Moov Money",
          icon: "phone",
          enabled: true,
        },
      ]
    }
  }

  // Initier un paiement
  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentInitiationResponse> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/payments/initiate`, paymentRequest, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error initiating payment:", error)
      throw error
    }
  }

  // Vérifier le statut d'un paiement
  async verifyPayment(transactionId: string): Promise<PaymentVerificationResponse> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/payments/verify/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error verifying payment:", error)
      throw error
    }
  }

  // Recharger le portefeuille
  async topUpWallet(topUpRequest: TopUpRequest): Promise<PaymentInitiationResponse> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/wallet/topup`, topUpRequest, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error topping up wallet:", error)
      throw error
    }
  }

  // Payer une livraison en mode hors ligne
  async payOffline(paymentRequest: PaymentRequest): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      const responseNetwork = await axios.get(`${API_URL}/network/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const isConnected = responseNetwork.data.isConnected
      const { addPendingUpload } = useNetwork()

      // Si connecté, utiliser l'API normale
      if (isConnected) {
        await this.initiatePayment(paymentRequest)
        return true
      }

      // Sinon, stocker pour synchronisation ultérieure
      addPendingUpload({
        type: "payment",
        data: paymentRequest,
      })

      // Stocker localement le statut de paiement
      const pendingPaymentsString = await AsyncStorage.getItem("pendingPayments")
      const pendingPayments = pendingPaymentsString ? JSON.parse(pendingPaymentsString) : []

      pendingPayments.push({
        ...paymentRequest,
        status: "pending",
        timestamp: new Date().toISOString(),
      })

      await AsyncStorage.setItem("pendingPayments", JSON.stringify(pendingPayments))

      return true
    } catch (error) {
      console.error("Error in offline payment:", error)
      return false
    }
  }

  // Générer un reçu de paiement
  async generateReceipt(transactionId: string): Promise<string> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/payments/receipt/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      })

      // Convertir le blob en URL de données
      const blob = new Blob([response.data], { type: "application/pdf" })
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error("Error generating receipt:", error)
      throw error
    }
  }

  // Obtenir l'historique des paiements
  async getPaymentHistory(page = 1, limit = 10): Promise<any> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/payments/history?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching payment history:", error)
      throw error
    }
  }
}

export default new PaymentService()
