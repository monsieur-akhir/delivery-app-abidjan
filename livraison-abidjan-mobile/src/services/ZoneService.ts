
import { api } from './api'

export interface Zone {
  id: string
  name: string
  zone_type: string
  coordinates?: number[][]
  center_lat: number
  center_lng: number
  radius?: number
  base_price: number
  price_per_km: number
  max_delivery_time?: number
  is_active: boolean
}

export interface PriceCalculation {
  pickup_zone: string
  delivery_zone: string
  distance_km: number
  base_price: number
  distance_price: number
  total_price: number
  estimated_time_minutes: number
  pricing_breakdown: any
}

export class ZoneService {
  // Trouver les zones à partir d'une position
  static async findZones(lat: number, lng: number): Promise<Zone[]> {
    try {
      const response = await api.get('/api/v1/zones/locate', {
        params: { lat, lng }
      })
      return response.data.zones
    } catch (error) {
      console.error('Error finding zones:', error)
      throw error
    }
  }

  // Calculer le prix basé sur les zones
  static async calculatePrice(
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number,
    packageWeight?: number,
    isExpress: boolean = false
  ): Promise<PriceCalculation> {
    try {
      const response = await api.post('/api/v1/zones/calculate-price', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        package_weight: packageWeight,
        is_express: isExpress
      })
      return response.data
    } catch (error) {
      console.error('Error calculating zone price:', error)
      throw error
    }
  }

  // Récupérer toutes les zones
  static async getAllZones(): Promise<Zone[]> {
    try {
      const response = await api.get('/api/v1/zones')
      return response.data
    } catch (error) {
      console.error('Error fetching zones:', error)
      throw error
    }
  }

  // Récupérer les promotions d'une zone
  static async getZonePromotions(zoneId: string): Promise<any[]> {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}/promotions`)
      return response.data
    } catch (error) {
      console.error('Error fetching zone promotions:', error)
      throw error
    }
  }
}

export default ZoneService
