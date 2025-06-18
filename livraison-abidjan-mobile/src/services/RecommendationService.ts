import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"

// Types
export interface CourierRecommendation {
  id: number
  full_name: string
  rating: number
  profile_image: string
  specialties: string[]
  success_rate: number
  match_score: number // 0-100
  reason: string
}

export interface DeliveryRecommendation {
  id: number
  pickup_address: string
  delivery_address: string
  proposed_price: number
  match_score: number // 0-100
  estimated_earnings: number
  distance: number
  reason: string
}

export interface ProductRecommendation {
  id: number
  name: string
  image: string
  price: number
  merchant: {
    id: number
    name: string
    rating: number
  }
  match_score: number // 0-100
}

class RecommendationService {
  // Recommander des coursiers pour une livraison
  async getRecommendedCouriers(deliveryId: number): Promise<CourierRecommendation[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/recommendations/couriers?delivery_id=${deliveryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching recommended couriers:", error)
      // Retourner des recommandations par défaut en cas d'erreur
      return this.getDefaultCourierRecommendations()
    }
  }

  // Recommander des livraisons pour un coursier
  async getRecommendedDeliveries(page = 1, limit = 10): Promise<DeliveryRecommendation[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/recommendations/deliveries?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching recommended deliveries:", error)
      // Retourner des recommandations par défaut en cas d'erreur
      return this.getDefaultDeliveryRecommendations()
    }
  }

  // Recommander des produits pour un client
  async getRecommendedProducts(page = 1, limit = 10): Promise<ProductRecommendation[]> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/recommendations/products?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching recommended products:", error)
      // Retourner des recommandations par défaut en cas d'erreur
      return this.getDefaultProductRecommendations()
    }
  }

  // Fournir un feedback sur une recommandation
  async provideFeedback(
    recommendationType: "courier" | "delivery" | "product",
    itemId: number,
    action: "accepted" | "rejected" | "viewed",
  ): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/recommendations/feedback`,
        {
          recommendation_type: recommendationType,
          item_id: itemId,
          action,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      return true
    } catch (error) {
      console.error("Error providing recommendation feedback:", error)
      return false
    }
  }

  // Méthodes pour générer des recommandations par défaut
  private getDefaultCourierRecommendations(): CourierRecommendation[] {
    return [
      {
        id: 1,
        full_name: "Amadou Koné",
        rating: 4.8,
        profile_image: "https://randomuser.me/api/portraits/men/1.jpg",
        specialties: ["Express", "Fragile"],
        success_rate: 98,
        match_score: 95,
        reason: "Excellente réputation dans votre zone",
      },
      {
        id: 2,
        full_name: "Fatou Diallo",
        rating: 4.7,
        profile_image: "https://randomuser.me/api/portraits/women/2.jpg",
        specialties: ["Alimentaire", "Express"],
        success_rate: 96,
        match_score: 90,
        reason: "Livraisons similaires réussies",
      },
      {
        id: 3,
        full_name: "Ibrahim Touré",
        rating: 4.6,
        profile_image: "https://randomuser.me/api/portraits/men/3.jpg",
        specialties: ["Volumineux", "Longue distance"],
        success_rate: 94,
        match_score: 85,
        reason: "Disponible immédiatement dans votre zone",
      },
    ]
  }

  private getDefaultDeliveryRecommendations(): DeliveryRecommendation[] {
    return [
      {
        id: 101,
        pickup_address: "Marcory, Abidjan",
        delivery_address: "Cocody, Abidjan",
        proposed_price: 3000,
        match_score: 92,
        estimated_earnings: 2700,
        distance: 8.5,
        reason: "Proche de votre position actuelle",
      },
      {
        id: 102,
        pickup_address: "Treichville, Abidjan",
        delivery_address: "Plateau, Abidjan",
        proposed_price: 2500,
        match_score: 88,
        estimated_earnings: 2250,
        distance: 5.2,
        reason: "Correspond à vos horaires habituels",
      },
      {
        id: 103,
        pickup_address: "Yopougon, Abidjan",
        delivery_address: "Adjamé, Abidjan",
        proposed_price: 3500,
        match_score: 85,
        estimated_earnings: 3150,
        distance: 10.1,
        reason: "Type de colis que vous livrez souvent",
      },
    ]
  }

  private getDefaultProductRecommendations(): ProductRecommendation[] {
    return [
      {
        id: 201,
        name: "Poulet Braisé",
        image: "https://example.com/poulet.jpg",
        price: 5000,
        merchant: {
          id: 301,
          name: "Restaurant Chez Maman",
          rating: 4.7,
        },
        match_score: 94,
      },
      {
        id: 202,
        name: "Attieké Poisson",
        image: "https://example.com/attieke.jpg",
        price: 3000,
        merchant: {
          id: 302,
          name: "Maquis du Bonheur",
          rating: 4.5,
        },
        match_score: 90,
      },
      {
        id: 203,
        name: "Jus de Gingembre",
        image: "https://example.com/gingembre.jpg",
        price: 1000,
        merchant: {
          id: 303,
          name: "Délices Naturels",
          rating: 4.8,
        },
        match_score: 88,
      },
    ]
  }
}

export default new RecommendationService()
