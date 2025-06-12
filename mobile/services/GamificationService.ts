
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/environment';
import type { GamificationProfile, Ranking, Reward, Badge, Achievement } from '../types/models';

interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
  };
  message?: string;
}

export class GamificationService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Récupération du profil gamification
   */
  async getProfile(): Promise<GamificationProfile> {
    try {
      const response = await this.api.get('/gamification/profile');
      return response.data;
    } catch (error) {
      console.error('Get gamification profile error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération des classements
   */
  async getRankings(commune?: string): Promise<Ranking[]> {
    try {
      const params = commune ? { commune } : undefined;
      const response = await this.api.get('/gamification/rankings', { params });
      return response.data;
    } catch (error) {
      console.error('Get rankings error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération des récompenses disponibles
   */
  async getAvailableRewards(): Promise<Reward[]> {
    try {
      const response = await this.api.get('/gamification/rewards');
      return response.data;
    } catch (error) {
      console.error('Get available rewards error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Réclamation d'une récompense
   */
  async claimReward(rewardId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post(`/gamification/rewards/${rewardId}/claim`);
      return response.data;
    } catch (error) {
      console.error('Claim reward error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération des badges utilisateur
   */
  async getUserBadges(): Promise<Badge[]> {
    try {
      const response = await this.api.get('/gamification/badges');
      return response.data;
    } catch (error) {
      console.error('Get user badges error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération des objectifs/achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await this.api.get('/gamification/achievements');
      return response.data;
    } catch (error) {
      console.error('Get achievements error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Attribution de points pour une action
   */
  async awardPoints(action: string, deliveryId?: string): Promise<{ points: number; newLevel?: number }> {
    try {
      const data = { action };
      if (deliveryId) {
        data.delivery_id = deliveryId;
      }
      const response = await this.api.post('/gamification/award-points', data);
      return response.data;
    } catch (error) {
      console.error('Award points error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération des statistiques détaillées
   */
  async getDetailedStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    total_deliveries: number;
    total_points: number;
    average_rating: number;
    badges_count: number;
    rank_position: number;
    level_progress: {
      current_level: number;
      current_xp: number;
      next_level_xp: number;
      progress_percentage: number;
    };
  }> {
    try {
      const response = await this.api.get(`/gamification/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Get detailed stats error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération du leaderboard par commune
   */
  async getCommuneLeaderboard(commune: string): Promise<Ranking[]> {
    try {
      const response = await this.api.get(`/gamification/rankings/commune/${commune}`);
      return response.data;
    } catch (error) {
      console.error('Get commune leaderboard error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Participation à un défi
   */
  async joinChallenge(challengeId: string): Promise<{ success: boolean; challenge: any }> {
    try {
      const response = await this.api.post(`/gamification/challenges/${challengeId}/join`);
      return response.data;
    } catch (error) {
      console.error('Join challenge error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Récupération des défis actifs
   */
  async getActiveChallenges(): Promise<any[]> {
    try {
      const response = await this.api.get('/gamification/challenges/active');
      return response.data;
    } catch (error) {
      console.error('Get active challenges error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Partage d'un badge sur les réseaux sociaux
   */
  async shareBadge(badgeId: string, platform: 'facebook' | 'twitter' | 'whatsapp'): Promise<{ share_url: string }> {
    try {
      const response = await this.api.post(`/gamification/badges/${badgeId}/share`, { platform });
      return response.data;
    } catch (error) {
      console.error('Share badge error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: unknown): Error {
    let message = 'Une erreur est survenue';

    if (error && typeof error === 'object') {
      const errorObj = error as ApiError;
      if (errorObj.response?.data?.detail) {
        message = errorObj.response.data.detail;
      } else if (errorObj.response?.data?.message) {
        message = errorObj.response.data.message;
      } else if (errorObj.message) {
        message = errorObj.message;
      }
    }

    return new Error(message);
  }
}

export default GamificationService;
