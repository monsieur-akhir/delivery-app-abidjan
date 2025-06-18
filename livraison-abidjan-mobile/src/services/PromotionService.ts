import { api } from './api'

export interface Promotion {
  id: string
  name: string
  description?: string
  promotion_type: string
  discount_value: number
  max_discount?: number
  min_order_value?: number
  start_date: string
  end_date: string
  is_active: boolean
  max_uses_per_user?: number
  usage_count: number
}

export interface PromotionValidation {
  valid: boolean
  promotion?: Promotion
  discount_amount?: number
  final_amount?: number
  error_message?: string
}

export class PromotionService {
  // Récupérer toutes les promotions actives
  static async getActivePromotions(): Promise<Promotion[]> {
    try {
      const response = await api.get('/api/v1/promotions/active')
      return response.data
    } catch (error) {
      console.error('Error fetching active promotions:', error)
      throw error
    }
  }

  // Récupérer les promotions applicable pour un utilisateur
  static async getApplicablePromotions(
    orderValue: number,
    zoneId?: number
  ): Promise<Promotion[]> {
    try {
      const params: { order_value: number; zone_id?: number } = { order_value: orderValue }
      if (zoneId) params.zone_id = zoneId

      const response = await api.get('/api/v1/promotions/applicable', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching applicable promotions:', error)
      throw error
    }
  }

  // Valider un code promo
  static async validateCode(
    code: string,
    orderValue: number
  ): Promise<PromotionValidation> {
    try {
      const response = await api.post('/api/v1/promotions/validate-code', {
        code,
        order_value: orderValue
      })
      return response.data
    } catch (error) {
      console.error('Error validating promotion code:', error)
      throw error
    }
  }

  // Appliquer une promotion à une commande
  static async applyPromotion(
    deliveryId: number,
    promotionId: string
  ): Promise<any> {
    try {
      const response = await api.post(`/api/v1/deliveries/${deliveryId}/apply-promotion`, {
        promotion_id: promotionId
      })
      return response.data
    } catch (error) {
      console.error('Error applying promotion:', error)
      throw error
    }
  }

  // Récupérer l'historique d'utilisation des promotions
  static async getPromotionHistory(): Promise<any[]> {
    try {
      const response = await api.get('/api/v1/promotions/history')
      return response.data
    } catch (error) {
      console.error('Error fetching promotion history:', error)
      throw error
    }
  }
}

export default PromotionService