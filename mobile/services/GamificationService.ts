import AsyncStorage from "@react-native-async-storage/async-storage"
import api from "./api"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at?: string
}

interface Achievement {
  id: string
  name: string
  description: string
  progress: number
  max_progress: number
  completed: boolean
  completed_at?: string
}

interface Reward {
  id: string
  name: string
  description: string
  points_cost: number
  available: boolean
  claimed: boolean
  claimed_at?: string
  expires_at?: string
}

interface RankingUser {
  id: string
  full_name: string
  profile_picture?: string
  level: number
  points: number
  rank: number
}

interface GamificationProfile {
  user_id: string
  level: number
  points: number
  points_to_next_level: number
  badges: Badge[]
  achievements: Achievement[]
  rewards: Reward[]
  daily_streak: number
  daily_bonus_claimed: boolean
  last_active: string
}

class GamificationService {
  // Clé pour le cache
  private CACHE_KEY = "gamification_cache"
  private CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  /**
   * Récupère le profil de gamification de l'utilisateur
   */
  async getProfile(): Promise<GamificationProfile | null> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedData = await this.getCachedProfile()
      if (cachedData) {
        return cachedData
      }

      // Récupérer les données depuis l'API
      const response = await api.get("/gamification/profile")
      const profile = response.data

      // Mettre en cache les données
      await this.cacheProfile(profile)

      return profile
    } catch (error) {
      console.error("Error fetching gamification profile:", error)
      return null
    }
  }

  /**
   * Récupère le classement des utilisateurs
   */
  async getRankings(commune?: string): Promise<RankingUser[]> {
    try {
      let url = "/gamification/rankings"
      if (commune) {
        url += `?commune=${encodeURIComponent(commune)}`
      }

      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error("Error fetching rankings:", error)
      return []
    }
  }

  /**
   * Réclame une récompense
   */
  async claimReward(rewardId: string): Promise<boolean> {
    try {
      const response = await api.post(`/gamification/rewards/${rewardId}/claim`)

      // Invalider le cache
      await this.invalidateCache()

      return response.data.success
    } catch (error) {
      console.error("Error claiming reward:", error)
      return false
    }
  }

  /**
   * Réclame le bonus quotidien
   */
  async claimDailyBonus(): Promise<boolean> {
    try {
      const response = await api.post("/gamification/daily-bonus/claim")

      // Invalider le cache
      await this.invalidateCache()

      return response.data.success
    } catch (error) {
      console.error("Error claiming daily bonus:", error)
      return false
    }
  }

  /**
   * Enregistre un événement de gamification
   */
  async trackEvent(eventType: string, metadata?: any): Promise<boolean> {
    try {
      const response = await api.post("/gamification/events", {
        event_type: eventType,
        metadata,
      })

      // Invalider le cache
      await this.invalidateCache()

      return response.data.success
    } catch (error) {
      console.error("Error tracking gamification event:", error)
      return false
    }
  }

  /**
   * Récupère les données en cache
   */
  private async getCachedProfile(): Promise<GamificationProfile | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_KEY)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < this.CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached gamification profile:", error)
      return null
    }
  }

  /**
   * Met en cache les données
   */
  private async cacheProfile(data: GamificationProfile): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching gamification profile:", error)
    }
  }

  /**
   * Invalide le cache
   */
  private async invalidateCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY)
    } catch (error) {
      console.error("Error invalidating gamification cache:", error)
    }
  }

  /**
   * Vide le cache
   */
  async clearCache(): Promise<void> {
    await this.invalidateCache()
  }
}

export default new GamificationService()
