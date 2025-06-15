
import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApiUrl } from '../config/environment'

export interface Achievement {
  id: number
  title: string
  description: string
  type: string
  points: number
  unlocked_at?: string
  progress?: number
  required_value?: number
  name?: string
  icon?: string
}

export interface CourierStats {
  total_points: number
  total_deliveries: number
  average_rating?: number
  completion_rate?: number
  average_delivery_time?: string
  daily_deliveries: number
  daily_rating?: number
  level: number
  rank_position?: number
  distance_traveled?: number
  total_earnings?: number
  experience?: number
  badges_count?: number
  weekly_deliveries?: number
  monthly_deliveries?: number
  weekly_earnings?: number
  monthly_earnings?: number
}

export interface Leaderboard {
  courier_id: number
  name: string
  profile_picture?: string
  points: number
  deliveries_count: number
  rank: number
}

export interface Challenge {
  id: number
  title: string
  description: string
  type: string
  target_value: number
  current_progress: number
  reward_points: number
  expires_at: string
  is_completed: boolean
}

class GamificationService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiUrl()}/gamification`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('@livraison_abidjan:auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  /**
   * Récupération des statistiques du coursier
   */
  async getCourierStats(): Promise<CourierStats> {
    try {
      const response = await this.api.get('/stats')
      return response.data
    } catch (error) {
      console.error('Get courier stats error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des succès/achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await this.api.get('/achievements')
      return response.data
    } catch (error) {
      console.error('Get achievements error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération du classement
   */
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<Leaderboard[]> {
    try {
      const response = await this.api.get('/leaderboard', { 
        params: { period } 
      })
      return response.data
    } catch (error) {
      console.error('Get leaderboard error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des défis actifs
   */
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const response = await this.api.get('/challenges/active')
      return response.data
    } catch (error) {
      console.error('Get active challenges error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour du progrès d'un défi
   */
  async updateChallengeProgress(challengeId: number, progress: number): Promise<Challenge> {
    try {
      const response = await this.api.put(`/challenges/${challengeId}/progress`, {
        progress
      })
      return response.data
    } catch (error) {
      console.error('Update challenge progress error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération de l'historique des points
   */
  async getPointsHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.api.get('/points/history', {
        params: { limit }
      })
      return response.data
    } catch (error) {
      console.error('Get points history error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Attribution de points pour une action
   */
  async awardPoints(action: string, value: number, deliveryId?: number): Promise<void> {
    try {
      await this.api.post('/points/award', {
        action,
        value,
        delivery_id: deliveryId
      })
    } catch (error) {
      console.error('Award points error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Déblocage d'un succès
   */
  async unlockAchievement(achievementId: number): Promise<Achievement> {
    try {
      const response = await this.api.post(`/achievements/${achievementId}/unlock`)
      return response.data
    } catch (error) {
      console.error('Unlock achievement error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération du niveau actuel
   */
  async getCurrentLevel(): Promise<{ level: number; name: string; points: number; next_level_points: number }> {
    try {
      const response = await this.api.get('/level')
      return response.data
    } catch (error) {
      console.error('Get current level error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des badges disponibles
   */
  async getAvailableBadges(): Promise<any[]> {
    try {
      const response = await this.api.get('/badges')
      return response.data
    } catch (error) {
      console.error('Get available badges error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des récompenses disponibles
   */
  async getRewards(): Promise<any[]> {
    try {
      const response = await this.api.get('/rewards')
      return response.data
    } catch (error) {
      console.error('Get rewards error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Réclamation d'une récompense
   */
  async claimReward(rewardId: number): Promise<void> {
    try {
      await this.api.post(`/rewards/${rewardId}/claim`)
    } catch (error) {
      console.error('Claim reward error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): Error {
    let message = 'Une erreur est survenue'

    if (error.response?.data?.detail) {
      message = error.response.data.detail
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    } else if (error.message) {
      message = error.message
    }

    return new Error(message)
  }
}

export default new GamificationService()
