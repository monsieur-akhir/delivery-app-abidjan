// Hook pour la gestion des utilisateurs
import { useState, useCallback } from 'react';
import UserService from '../services/UserService';
import NotificationService, { NotificationSettings as ServiceNotificationSettings } from '../services/NotificationService';
import type { 
  User,
  KYCDocument,
  KYCStatus,
  UserPreferences,
  UserStats,
  Notification,
  NotificationSettings,
  CourierEarningsData,
  WalletTransaction,
  PayoutRequest,
  Weather
} from '../types/models';

interface UserState {
  profile: User | null;
  kycStatus: { status: KYCStatus; documents: KYCDocument[] } | null;
  kycDocuments: KYCDocument[];
  notifications: Notification[] | null;
  preferences: UserPreferences | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  // Additional state for courier functionality
  courierEarnings: CourierEarningsData | null;
  walletTransactions: WalletTransaction[];
  weather: Weather | null;
}

interface UseUserReturn extends UserState {
  // Gestion du profil
  getProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadProfilePhoto: (imageUri: string) => Promise<void>;
  
  // Gestion KYC
  getKYCStatus: () => Promise<void>;
  uploadKYCDocument: (type: string, imageUri: string) => Promise<void>;
  deleteKYCDocument: (documentId: number) => Promise<void>;
  submitKYCForVerification: () => Promise<void>;
  
  // Notifications
  getNotifications: (page?: number, limit?: number) => Promise<void>;
  markNotificationAsRead: (notificationId: number) => Promise<void>;
  registerPushToken: (token: string, platform: 'ios' | 'android') => Promise<void>;
  unregisterPushToken: () => Promise<void>;
  
  // Préférences
  getPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
    // Alias pour la compatibilité
  getUserPreferences: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  
  // Notification settings (uses NotificationService)
  getNotificationSettings: () => Promise<NotificationSettings>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;

  // Localisation
  updateLocation: (locationData: { latitude: number; longitude: number; accuracy?: number }) => Promise<void>;
    // Courier-specific methods
  getCourierProfile: () => Promise<User | null>;
  updateCourierStatus: (isOnline: boolean, lat?: number, lng?: number) => Promise<void>;
  getCourierEarnings: (period?: string) => Promise<CourierEarningsData>;
  getWeatherForecast: (lat?: number, lng?: number) => Promise<Weather | null>;
  
  // Wallet and transactions
  getUserProfile: () => Promise<User | null>;
  getWalletTransactions: (page?: number, limit?: number) => Promise<WalletTransaction[]>;
  withdrawFunds: (amount: number, paymentMethod: string) => Promise<void>;
  requestPayout: (request: PayoutRequest) => Promise<void>;
  
  // Additional properties for compatibility
  userProfile: User | null;
  loading: boolean;
  
  // Utilitaires
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

export const useUser = (): UseUserReturn => {  const [state, setState] = useState<UserState>({
    profile: null,
    kycStatus: null,
    kycDocuments: [],
    notifications: null,
    preferences: null,
    stats: null,
    isLoading: false,
    error: null,
    courierEarnings: null,
    walletTransactions: [],
    weather: null,
  });

  // Récupération du profil
  const getProfile = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const profile = await UserService.getCurrentUser();
      
      setState(prev => ({
        ...prev,
        profile,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  // Mise à jour du profil
  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedProfile = await UserService.updateProfile(data);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Upload de photo de profil
  const uploadProfilePhoto = useCallback(async (imageUri: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.uploadProfilePicture(imageUri);
      
      // Rafraîchir le profil après l'upload
      await getProfile();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload profile photo';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [getProfile]);

  // Récupération du statut KYC
  const getKYCStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const kycStatus = await UserService.getKYCStatus();
      
      setState(prev => ({
        ...prev,
        kycStatus,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch KYC status';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Upload de document KYC
  const uploadKYCDocument = useCallback(async (type: string, imageUri: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.uploadKYCDocument(type, imageUri);
      
      // Rafraîchir le statut KYC après l'upload
      await getKYCStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload KYC document';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [getKYCStatus]);

  // Suppression de document KYC
  const deleteKYCDocument = useCallback(async (documentId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.deleteKYCDocument(documentId);
      
      // Rafraîchir le statut KYC après la suppression
      await getKYCStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete KYC document';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [getKYCStatus]);

  // Soumission KYC pour vérification
  const submitKYCForVerification = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.submitKYCForVerification();
      
      // Rafraîchir le statut KYC après la soumission
      await getKYCStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit KYC for verification';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [getKYCStatus]);

  // Récupération des notifications
  const getNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const notifications = await UserService.getNotifications(page, limit);
      
      setState(prev => ({
        ...prev,
        notifications,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Marquer une notification comme lue
  const markNotificationAsRead = useCallback(async (notificationId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.markNotificationAsRead(notificationId);
      
      // Optionnel: rafraîchir les notifications
      // await getNotifications();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Enregistrement du token push
  const registerPushToken = useCallback(async (token: string, platform: 'ios' | 'android') => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.registerPushToken({ token, platform });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register push token';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Désenregistrement du token push
  const unregisterPushToken = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.unregisterPushToken();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unregister push token';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des préférences
  const getPreferences = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const preferences = await UserService.getPreferences();
      
      setState(prev => ({
        ...prev,
        preferences,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch preferences';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Mise à jour des préférences
  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedPreferences = await UserService.updatePreferences(preferences);
      
      setState(prev => ({
        ...prev,
        preferences: updatedPreferences,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Mise à jour de la localisation
  const updateLocation = useCallback(async (locationData: { latitude: number; longitude: number; accuracy?: number }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await UserService.updateLocation(locationData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des paramètres de notification
  // Récupération des paramètres de notification avec conversion de type
  const getNotificationSettings = useCallback(async (): Promise<NotificationSettings> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const serviceSettings = await NotificationService.getNotificationSettings();
      
      // Convert service format to models format
      const notificationSettings: NotificationSettings = {
        push_notifications: serviceSettings.push_enabled,
        email_notifications: serviceSettings.email_enabled,
        sms_notifications: serviceSettings.sms_enabled,
        marketing_emails: serviceSettings.marketing,
        delivery_updates: serviceSettings.delivery_updates,
        delivery_notifications: serviceSettings.delivery_updates,
        promotional_notifications: serviceSettings.marketing,
        bid_notifications: serviceSettings.delivery_updates,
        promotion_alerts: serviceSettings.marketing,
        security_alerts: serviceSettings.system_updates,
      };
      
      return notificationSettings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notification settings';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);
  
  // Mise à jour des paramètres de notification avec conversion de type
  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Convert models format to service format
      const serviceSettings: Partial<ServiceNotificationSettings> = {
        push_enabled: settings.push_notifications,
        email_enabled: settings.email_notifications,
        sms_enabled: settings.sms_notifications,
        marketing: settings.marketing_emails || settings.promotional_notifications || settings.promotion_alerts,
        delivery_updates: settings.delivery_updates || settings.delivery_notifications || settings.bid_notifications,
        system_updates: settings.security_alerts,
      };
      
      const success = await NotificationService.updateNotificationSettings(serviceSettings);
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Actualisation du profil
  const refreshProfile = useCallback(async () => {
    await getProfile();
  }, [getProfile]);
  // Effacement des erreurs
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // === NOUVELLES MÉTHODES COURIER ===
    // Récupération du profil coursier
  const getCourierProfile = useCallback(async (): Promise<User | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const profile = await UserService.getCurrentUser();
      setState(prev => ({
        ...prev,
        profile,
        isLoading: false,
      }));
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courier profile';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return null;
    }
  }, []);
  // Mise à jour du statut du coursier
  const updateCourierStatus = useCallback(async (isOnline: boolean, _lat?: number, _lng?: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await UserService.updateProfile({ is_online: isOnline });
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, is_online: isOnline } : null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update courier status';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);
  // Récupération des gains du coursier
  const getCourierEarnings = useCallback(async (_period = 'month'): Promise<CourierEarningsData> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // This would need to be implemented in UserService
      // For now, we'll create a mock structure
      const earnings: CourierEarningsData = {
        summary: {
          total_earnings: 0,
          available_balance: 0,
          pending_balance: 0,
          total_deliveries: 0,
          total_distance: 0,
          average_rating: 0,
        },
        history: [],
        transactions: [],
      };
      setState(prev => ({
        ...prev,
        courierEarnings: earnings,
        isLoading: false,
      }));
      return earnings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courier earnings';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);
  // Récupération des prévisions météo
  const getWeatherForecast = useCallback(async (_lat?: number, _lng?: number): Promise<Weather | null> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      // This would need to be implemented in a WeatherService
      // For now, we'll create a mock structure
      const weather: Weather = {
        location: 'Abidjan',
        current: {
          temperature: 28,
          condition: 'sunny',
          humidity: 65,
          wind_speed: 10,
          icon: 'sun',
        },
        last_updated_epoch: Date.now(),
        last_updated: new Date().toISOString(),
        feelslike: 30,
        is_day: 1,
        wind_mph: 6,
        wind_kph: 10,
        wind_degree: 180,
        wind_dir: 'S',
        pressure_mb: 1013,
        pressure_in: 30,
        precip_mm: 0,
        precip_in: 0,
        cloud: 20,
        vis_km: 10,
        vis_miles: 6,
      };
      setState(prev => ({
        ...prev,
        weather,
      }));
      return weather;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather forecast';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  // === MÉTHODES WALLET ET TRANSACTIONS ===
    // Alias pour getUserProfile
  const getUserProfile = useCallback(async (): Promise<User | null> => {
    await getProfile();
    return state.profile;
  }, [getProfile, state.profile]);
  // Récupération des transactions du portefeuille
  const getWalletTransactions = useCallback(async (_page = 1, _limit = 20): Promise<WalletTransaction[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // This would need to be implemented in UserService
      // For now, we'll create an empty array
      const transactions: WalletTransaction[] = [];
      setState(prev => ({
        ...prev,
        walletTransactions: transactions,
        isLoading: false,
      }));
      return transactions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallet transactions';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return [];
    }
  }, []);  // Retrait de fonds
  const withdrawFunds = useCallback(async (_amount: number, _paymentMethod: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      // This would need to be implemented in UserService
      // For now, we'll simulate the operation
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw funds';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);
  // Demande de paiement
  const requestPayout = useCallback(async (_request: PayoutRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      // This would need to be implemented in UserService
      // For now, we'll simulate the operation
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request payout';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);
  
  // Alias pour la compatibilité
  const getUserPreferences = getPreferences;
  const updateUserPreferences = updatePreferences;
  return {
    ...state,
    // Propriétés compatibles
    userProfile: state.profile,
    loading: state.isLoading,
    // Méthodes existantes
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    getKYCStatus,
    uploadKYCDocument,
    deleteKYCDocument,
    submitKYCForVerification,
    getNotifications,
    markNotificationAsRead,
    registerPushToken,
    unregisterPushToken,
    getPreferences,
    updatePreferences,
    updateLocation,
    clearError,
    refreshProfile,
    getUserPreferences,
    updateUserPreferences,
    getNotificationSettings,
    updateNotificationSettings,
    // Nouvelles méthodes courier
    getCourierProfile,
    updateCourierStatus,
    getCourierEarnings,
    getWeatherForecast,
    // Méthodes wallet
    getUserProfile,
    getWalletTransactions,
    withdrawFunds,
    requestPayout,
  };
};

export default useUser;
