
import apiService from './apiService'

export const walletApi = {
  // Solde et informations
  async getWalletBalance() {
    const response = await apiService.get('/api/v1/wallet/balance')
    return response.data
  },

  async getWalletInfo() {
    const response = await apiService.get('/api/v1/wallet/info')
    return response.data
  },

  // Transactions
  async getTransactions(filters = {}) {
    const response = await apiService.get('/api/v1/wallet/transactions', { params: filters })
    return response.data
  },

  async addFunds(amount, paymentMethod) {
    const response = await apiService.post('/api/v1/wallet/add-funds', {
      amount,
      payment_method: paymentMethod
    })
    return response.data
  },

  async withdrawFunds(amount, withdrawalMethod, details) {
    const response = await apiService.post('/api/v1/wallet/withdraw', {
      amount,
      withdrawal_method: withdrawalMethod,
      account_details: details
    })
    return response.data
  },

  async transferFunds(recipientId, amount, note) {
    const response = await apiService.post('/api/v1/wallet/transfer', {
      recipient_id: recipientId,
      amount,
      note
    })
    return response.data
  },

  // Méthodes de paiement
  async getPaymentMethods() {
    const response = await apiService.get('/api/v1/wallet/payment-methods')
    return response.data
  },

  async addPaymentMethod(method) {
    const response = await apiService.post('/api/v1/wallet/payment-methods', method)
    return response.data
  },

  async removePaymentMethod(methodId) {
    const response = await apiService.delete(`/api/v1/wallet/payment-methods/${methodId}`)
    return response.data
  },

  async setDefaultPaymentMethod(methodId) {
    const response = await apiService.patch(`/api/v1/wallet/payment-methods/${methodId}/default`)
    return response.data
  },

  // Portefeuille communautaire
  async getCommunityWalletInfo() {
    const response = await apiService.get('/api/v1/wallet/community')
    return response.data
  },

  async contributeToCommunity(amount, cause) {
    const response = await apiService.post('/api/v1/wallet/community/contribute', {
      amount,
      cause
    })
    return response.data
  },

  async getCommunityContributions(filters = {}) {
    const response = await apiService.get('/api/v1/wallet/community/contributions', { params: filters })
    return response.data
  },

  // Statistiques
  async getWalletStats(period = 'month') {
    const response = await apiService.get('/api/v1/wallet/stats', { params: { period } })
    return response.data
  },

  async getSpendingAnalytics(period = 'month') {
    const response = await apiService.get('/api/v1/wallet/analytics/spending', { params: { period } })
    return response.data
  },

  // Remboursements
  async requestRefund(transactionId, reason, amount) {
    const response = await apiService.post('/api/v1/wallet/refund', {
      transaction_id: transactionId,
      reason,
      amount
    })
    return response.data
  },

  async getRefundRequests(filters = {}) {
    const response = await apiService.get('/api/v1/wallet/refunds', { params: filters })
    return response.data
  },

  // Limites et sécurité
  async getWalletLimits() {
    const response = await apiService.get('/api/v1/wallet/limits')
    return response.data
  },

  async updateWalletLimits(limits) {
    const response = await apiService.patch('/api/v1/wallet/limits', limits)
    return response.data
  },

  async enableTwoFactor() {
    const response = await apiService.post('/api/v1/wallet/2fa/enable')
    return response.data
  },

  async disableTwoFactor(code) {
    const response = await apiService.post('/api/v1/wallet/2fa/disable', { code })
    return response.data
  }
}

export default walletApi
