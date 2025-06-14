import apiService from './apiService'

export const promotionsAPI = {
  async getPromotions(params = {}) {
    return await apiService.get('/promotions', { params })
  },

  async getPromotion(id) {
    return await apiService.get(`/promotions/${id}`)
  },

  async createPromotion(promotionData) {
    return await apiService.post('/promotions', promotionData)
  },

  async updatePromotion(id, updateData) {
    return await apiService.put(`/promotions/${id}`, updateData)
  },

  async deletePromotion(id) {
    return await apiService.delete(`/promotions/${id}`)
  },

  async activatePromotion(id) {
    return await apiService.post(`/promotions/${id}/activate`)
  },

  async pausePromotion(id) {
    return await apiService.put(`/promotions/${id}`, { status: 'paused' })
  },

  async getPromotionUsage(id) {
    return await apiService.get(`/promotions/${id}/usage`)
  },

  async getAnalytics(period = 'month') {
    return await apiService.get('/promotions/analytics/overview', {
      params: { period },
    })
  },

  // Codes promo
  async validatePromoCode(code, orderValue = 0) {
    return await apiService.post('/promotions/validate-code', {
      code,
      order_value: orderValue,
    })
  },

  async applyPromotion(promotionId, orderId) {
    return await apiService.post(`/promotions/${promotionId}/apply`, {
      order_id: orderId,
    })
  },

  // Parrainage
  async createReferralProgram(referralData) {
    return await apiService.post('/promotions/referrals', referralData)
  },

  async getReferralStats(userId) {
    return await apiService.get(`/promotions/referrals/stats/${userId}`)
  },

  async generateReferralCode(userId) {
    return await apiService.post('/promotions/referrals/generate-code', {
      user_id: userId,
    })
  },
}

export default promotionsAPI
