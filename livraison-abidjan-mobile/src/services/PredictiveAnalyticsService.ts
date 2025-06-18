import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"

// Types
export interface DeliveryPrediction {
  estimated_duration: number // en minutes
  estimated_arrival_time: string // format ISO
  confidence_level: number // 0-1
  factors: {
    traffic: number // impact du trafic (0-1)
    weather: number // impact de la météo (0-1)
    distance: number // distance en km
    time_of_day: number // impact de l'heure (0-1)
  }
}

export interface TrafficPrediction {
  level: "low" | "medium" | "high" | "severe"
  description: string
  estimated_delay: number // en minutes
  alternative_routes: boolean
}

export interface OptimalTimeSlot {
  start_time: string // format ISO
  end_time: string // format ISO
  estimated_duration: number // en minutes
  traffic_level: "low" | "medium" | "high"
  confidence: number // 0-1
}

class PredictiveAnalyticsService {
  // Prédire le temps de livraison
  async predictDeliveryTime(
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number,
    packageSize = "medium",
    vehicleType = "motorcycle",
  ): Promise<DeliveryPrediction> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/analytics/predict-delivery-time`,
        {
          pickup_coordinates: { lat: pickupLat, lng: pickupLng },
          delivery_coordinates: { lat: deliveryLat, lng: deliveryLng },
          package_size: packageSize,
          vehicle_type: vehicleType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error predicting delivery time:", error)
      // Retourner une prédiction par défaut en cas d'erreur
      return {
        estimated_duration: this.calculateDefaultDuration(pickupLat, pickupLng, deliveryLat, deliveryLng),
        estimated_arrival_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        confidence_level: 0.7,
        factors: {
          traffic: 0.3,
          weather: 0.1,
          distance: this.calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng),
          time_of_day: 0.2,
        },
      }
    }
  }

  // Prédire les conditions de trafic
  async predictTraffic(
    lat: number,
    lng: number,
    destinationLat: number,
    destinationLng: number,
  ): Promise<TrafficPrediction> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/analytics/predict-traffic`,
        {
          current_coordinates: { lat, lng },
          destination_coordinates: { lat: destinationLat, lng: destinationLng },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error predicting traffic:", error)
      // Retourner une prédiction par défaut en cas d'erreur
      const distance = this.calculateDistance(lat, lng, destinationLat, destinationLng)
      const hour = new Date().getHours()

      // Déterminer le niveau de trafic en fonction de l'heure
      let level: "low" | "medium" | "high" | "severe" = "medium"
      if (hour >= 7 && hour <= 9)
        level = "high" // Heure de pointe du matin
      else if (hour >= 16 && hour <= 19)
        level = "high" // Heure de pointe du soir
      else if (hour >= 22 || hour <= 5) level = "low" // Nuit

      return {
        level,
        description: `Trafic ${level === "low" ? "fluide" : level === "medium" ? "modéré" : "dense"}`,
        estimated_delay: level === "low" ? 0 : level === "medium" ? 5 : 15,
        alternative_routes: level === "high",
      }
    }
  }

  // Suggérer les meilleurs créneaux horaires pour une livraison
  async suggestOptimalTimeSlots(
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number,
    date: string, // format YYYY-MM-DD
  ): Promise<OptimalTimeSlot[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/analytics/optimal-time-slots`,
        {
          pickup_coordinates: { lat: pickupLat, lng: pickupLng },
          delivery_coordinates: { lat: deliveryLat, lng: deliveryLng },
          date,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error suggesting optimal time slots:", error)
      // Retourner des créneaux par défaut en cas d'erreur
      const baseDate = new Date(date)
      const slots: OptimalTimeSlot[] = []

      // Créneaux du matin (10h-12h)
      slots.push({
        start_time: new Date(baseDate.setHours(10, 0, 0, 0)).toISOString(),
        end_time: new Date(baseDate.setHours(12, 0, 0, 0)).toISOString(),
        estimated_duration: 25,
        traffic_level: "medium",
        confidence: 0.8,
      })

      // Créneaux de l'après-midi (14h-16h)
      slots.push({
        start_time: new Date(baseDate.setHours(14, 0, 0, 0)).toISOString(),
        end_time: new Date(baseDate.setHours(16, 0, 0, 0)).toISOString(),
        estimated_duration: 20,
        traffic_level: "low",
        confidence: 0.9,
      })

      // Créneaux du soir (19h-21h)
      slots.push({
        start_time: new Date(baseDate.setHours(19, 0, 0, 0)).toISOString(),
        end_time: new Date(baseDate.setHours(21, 0, 0, 0)).toISOString(),
        estimated_duration: 30,
        traffic_level: "medium",
        confidence: 0.75,
      })

      return slots
    }
  }

  // Optimiser l'itinéraire pour plusieurs livraisons
  async optimizeRoute(deliveryIds: number[]): Promise<any> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(
        `${API_URL}/analytics/optimize-route`,
        { delivery_ids: deliveryIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error optimizing route:", error)
      throw error
    }
  }

  // Méthodes utilitaires
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance en km
    return Number.parseFloat(distance.toFixed(2))
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  private calculateDefaultDuration(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2)
    // Vitesse moyenne de 20 km/h en ville
    const durationHours = distance / 20
    // Convertir en minutes et ajouter un tampon de 5 minutes
    return Math.round(durationHours * 60) + 5
  }
}

export default new PredictiveAnalyticsService()
