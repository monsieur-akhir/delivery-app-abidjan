
import { api } from './api'

export interface PaymentMethod {
  id: string
  type: 'mobile_money' | 'card' | 'bank_account'
  provider: string
  masked_number: string
  is_default: boolean
  is_active: boolean
  expires_at?: string
}

export interface PaymentRequest {
  delivery_id: number
  amount: number
  payment_method: string
  phone_number?: string
  description?: string
}

export interface WalletTransaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund'
  amount: number
  description: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export class PaymentService {
  // Récupérer les méthodes de paiement de l'utilisateur
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get('/api/v1/payments/methods')
      return response.data
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw error
    }
  }

  // Ajouter une nouvelle méthode de paiement
  static async addPaymentMethod(methodData: {
    type: string
    provider: string
    phone_number?: string
    card_number?: string
    expiry_date?: string
  }): Promise<PaymentMethod> {
    try {
      const response = await api.post('/api/v1/payments/methods', methodData)
      return response.data
    } catch (error) {
      console.error('Error adding payment method:', error)
      throw error
    }
  }

  // Supprimer une méthode de paiement
  static async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      await api.delete(`/api/v1/payments/methods/${methodId}`)
    } catch (error) {
      console.error('Error deleting payment method:', error)
      throw error
    }
  }

  // Définir une méthode comme par défaut
  static async setDefaultPaymentMethod(methodId: string): Promise<void> {
    try {
      await api.put(`/api/v1/payments/methods/${methodId}/set-default`)
    } catch (error) {
      console.error('Error setting default payment method:', error)
      throw error
    }
  }

  // Traiter un paiement
  static async processPayment(paymentData: PaymentRequest): Promise<any> {
    try {
      const response = await api.post('/api/v1/payments/process', paymentData)
      return response.data
    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  }

  // Récupérer le solde du portefeuille
  static async getWalletBalance(): Promise<number> {
    try {
      const response = await api.get('/api/v1/wallet/balance')
      return response.data.balance
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      throw error
    }
  }

  // Ajouter des fonds au portefeuille
  static async addFunds(amount: number, paymentMethod: string): Promise<any> {
    try {
      const response = await api.post('/api/v1/wallet/add-funds', {
        amount,
        payment_method: paymentMethod
      })
      return response.data
    } catch (error) {
      console.error('Error adding funds:', error)
      throw error
    }
  }

  // Récupérer l'historique des transactions du portefeuille
  static async getWalletTransactions(
    skip: number = 0,
    limit: number = 20
  ): Promise<WalletTransaction[]> {
    try {
      const response = await api.get('/api/v1/wallet/transactions', {
        params: { skip, limit }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching wallet transactions:', error)
      throw error
    }
  }

  // Effectuer un retrait
  static async withdrawFunds(
    amount: number,
    withdrawalMethod: string,
    accountDetails: any
  ): Promise<any> {
    try {
      const response = await api.post('/api/v1/wallet/withdraw', {
        amount,
        withdrawal_method: withdrawalMethod,
        account_details: accountDetails
      })
      return response.data
    } catch (error) {
      console.error('Error withdrawing funds:', error)
      throw error
    }
  }

  // Vérifier le statut d'un paiement
  static async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await api.get(`/api/v1/payments/${paymentId}/status`)
      return response.data
    } catch (error) {
      console.error('Error checking payment status:', error)
      throw error
    }
  }

  // Demander un remboursement
  static async requestRefund(
    paymentId: string,
    reason: string,
    amount?: number
  ): Promise<any> {
    try {
      const response = await api.post(`/api/v1/payments/${paymentId}/refund`, {
        reason,
        amount
      })
      return response.data
    } catch (error) {
      console.error('Error requesting refund:', error)
      throw error
    }
  }

  // Récupérer l'historique des paiements
  static async getPaymentHistory(
    skip: number = 0,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/payments/history', {
        params: { skip, limit, start_date: startDate, end_date: endDate }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching payment history:', error)
      throw error
    }
  }

  // Valider une méthode de paiement (pour Mobile Money)
  static async validatePaymentMethod(
    methodId: string,
    validationCode: string
  ): Promise<any> {
    try {
      const response = await api.post(`/api/v1/payments/methods/${methodId}/validate`, {
        validation_code: validationCode
      })
      return response.data
    } catch (error) {
      console.error('Error validating payment method:', error)
      throw error
    }
  }

  // Calculer les frais de transaction
  static async calculateTransactionFees(
    amount: number,
    paymentMethod: string
  ): Promise<any> {
    try {
      const response = await api.post('/api/v1/payments/calculate-fees', {
        amount,
        payment_method: paymentMethod
      })
      return response.data
    } catch (error) {
      console.error('Error calculating transaction fees:', error)
      throw error
    }
  }
}

export default PaymentService
