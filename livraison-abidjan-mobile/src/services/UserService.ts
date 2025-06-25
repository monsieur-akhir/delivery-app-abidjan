import api from './api';
import { getToken } from '../utils/storage';

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  commune?: string;
  profile_picture?: string;
  verified: boolean;
  created_at: string;
  stats?: {
    total_deliveries: number;
    completed_deliveries: number;
    rating: number;
    total_spent: number;
  };
}

class UserService {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  static async getCurrentUser(): Promise<UserProfile> {
    try {
      const token = await getToken();
      const response = await api.get('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const token = await getToken();
      const response = await api.put('/api/users/me', profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la photo de profil
   */
  static async updateProfilePicture(imageUri: string): Promise<string> {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('profile_picture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await api.post('/api/users/profile-picture', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.profile_picture_url;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo de profil:', error);
      throw error;
    }
  }

  /**
   * Supprimer le compte utilisateur
   */
  static async deleteAccount(): Promise<void> {
    try {
      const token = await getToken();
      await api.delete('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw error;
    }
  }

  /**
   * Changer le mot de passe
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const token = await getToken();
      await api.post('/api/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques de l'utilisateur
   */
  static async getUserStats(): Promise<UserProfile['stats']> {
    try {
      const token = await getToken();
      const response = await api.get('/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

export default UserService;