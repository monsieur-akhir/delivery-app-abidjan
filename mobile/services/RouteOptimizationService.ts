import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"
import type { Coordinates } from "../types/models"

export interface OptimizedRoute {
  distance: number
  duration: number
  coordinates: Coordinates[]
  instructions: RouteInstruction[]
}

export interface RouteInstruction {
  text: string
  distance: number
  duration: number
  type: string
  index: number
}

export interface OptimizationParams {
  origin: Coordinates
  destination: Coordinates
  waypoints?: Coordinates[]
  avoid_tolls?: boolean
  avoid_highways?: boolean
  traffic?: boolean
  departure_time?: number // timestamp
}

class RouteOptimizationService {
  /**
   * Obtenir un itinéraire optimisé entre deux points
   */
  async getOptimizedRoute(params: OptimizationParams): Promise<OptimizedRoute> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/routes/optimize`, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting optimized route:", error)
      throw error
    }
  }

  /**
   * Obtenir plusieurs itinéraires alternatifs
   */
  async getAlternativeRoutes(params: OptimizationParams): Promise<OptimizedRoute[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/routes/alternatives`, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting alternative routes:", error)
      throw error
    }
  }

  /**
   * Obtenir un itinéraire optimisé pour plusieurs arrêts
   */
  async getMultiStopRoute(params: OptimizationParams): Promise<OptimizedRoute> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/routes/multi-stop`, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting multi-stop route:", error)
      throw error
    }
  }

  /**
   * Obtenir une estimation du temps de trajet en tenant compte du trafic
   */
  async getETA(params: OptimizationParams): Promise<{ eta: number; traffic_delay: number }> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/routes/eta`, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting ETA:", error)
      throw error
    }
  }

  /**
   * Obtenir les zones de trafic dense à éviter
   */
  async getTrafficHotspots(): Promise<{ coordinates: Coordinates; intensity: number }[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/traffic/hotspots`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting traffic hotspots:", error)
      throw error
    }
  }

  /**
   * Signaler un incident de trafic
   */
  async reportTrafficIncident(
    coordinates: Coordinates,
    type: "accident" | "construction" | "closure" | "congestion",
    description?: string,
  ): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/traffic/report`,
        { coordinates, type, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )

      return true
    } catch (error) {
      console.error("Error reporting traffic incident:", error)
      return false
    }
  }

  /**
   * Obtenir les statistiques de trafic pour une zone
   */
  async getTrafficStats(
    coordinates: Coordinates,
    radius: number,
  ): Promise<{ congestion_level: number; average_speed: number; incidents: number }> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/traffic/stats`, {
        params: {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          radius,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error getting traffic stats:", error)
      throw error
    }
  }
}

export default new RouteOptimizationService()
