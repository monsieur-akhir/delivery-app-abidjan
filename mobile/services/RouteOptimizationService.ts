import axios from "axios"
import { getApiUrl } from "../config/environment"
import type { Coordinates } from "../types/models"

interface TrafficHotspot {
  coordinates: Coordinates
  intensity: number
}

interface RouteResponse {
  route: Coordinates[]
  distance: number
  duration: number
  trafficDelay: number
}

class RouteOptimizationService {
  /**
   * Récupère les points chauds de trafic dans la zone d'Abidjan
   */
  static async getTrafficHotspots(): Promise<TrafficHotspot[]> {
    try {
      const response = await axios.get(`${getApiUrl()}/api/traffic/hotspots`)
      return response.data
    } catch (error) {
      console.error("Error fetching traffic hotspots:", error)
      return []
    }
  }

  /**
   * Calcule l'itinéraire optimal entre deux points en tenant compte du trafic
   */
  static async getOptimalRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[],
  ): Promise<RouteResponse> {
    try {
      const response = await axios.post(`${getApiUrl()}/api/routes/optimize`, {
        origin,
        destination,
        waypoints: waypoints || [],
      })
      return response.data
    } catch (error) {
      console.error("Error calculating optimal route:", error)
      throw new Error("Impossible de calculer l'itinéraire optimal")
    }
  }

  /**
   * Estime le temps de livraison en fonction de l'heure de la journée et du trafic
   */
  static async estimateDeliveryTime(
    origin: Coordinates,
    destination: Coordinates,
    scheduledTime?: Date,
  ): Promise<{ duration: number; trafficDelay: number }> {
    try {
      const response = await axios.post(`${getApiUrl()}/api/routes/estimate-time`, {
        origin,
        destination,
        scheduledTime: scheduledTime ? scheduledTime.toISOString() : new Date().toISOString(),
      })
      return response.data
    } catch (error) {
      console.error("Error estimating delivery time:", error)
      throw new Error("Impossible d'estimer le temps de livraison")
    }
  }

  /**
   * Suggère le meilleur moment pour effectuer une livraison
   */
  static async suggestDeliveryTime(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<{ suggestedTime: string; estimatedDuration: number }> {
    try {
      const response = await axios.post(`${getApiUrl()}/api/routes/suggest-time`, {
        origin,
        destination,
      })
      return response.data
    } catch (error) {
      console.error("Error suggesting delivery time:", error)
      throw new Error("Impossible de suggérer un horaire de livraison")
    }
  }

  /**
   * Optimise l'ordre des livraisons pour un coursier
   */
  static async optimizeDeliveryOrder(
    startPoint: Coordinates,
    deliveryPoints: Array<{ id: string; coordinates: Coordinates }>,
  ): Promise<{ order: string[]; route: Coordinates[]; totalDistance: number; totalDuration: number }> {
    try {
      const response = await axios.post(`${getApiUrl()}/api/routes/optimize-order`, {
        startPoint,
        deliveryPoints,
      })
      return response.data
    } catch (error) {
      console.error("Error optimizing delivery order:", error)
      throw new Error("Impossible d'optimiser l'ordre des livraisons")
    }
  }
}

export default RouteOptimizationService