import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  SETTINGS: 'app_settings',
  LANGUAGE: 'app_language',
  THEME: 'app_theme',
} as const;

// Fonction pour obtenir le token d'authentification
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

// Fonction pour sauvegarder le token d'authentification
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token:', error);
  }
};

// Fonction pour supprimer le token d'authentification
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la suppression du token:', error);
  }
};

// Fonction pour obtenir le refresh token
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la récupération du refresh token:', error);
    return null;
  }
};

// Fonction pour sauvegarder le refresh token
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du refresh token:', error);
  }
};

// Fonction pour supprimer le refresh token
export const removeRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la suppression du refresh token:', error);
  }
};

// Fonction pour sauvegarder les données utilisateur
export const saveUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
  }
};

// Fonction pour obtenir les données utilisateur
export const getUserData = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
};

// Fonction pour supprimer les données utilisateur
export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Erreur lors de la suppression des données utilisateur:', error);
  }
};

// Fonction pour nettoyer tout le stockage d'authentification
export const clearAuthStorage = async (): Promise<void> => {
  try {
    await Promise.all([
      removeToken(),
      removeRefreshToken(),
      removeUserData(),
    ]);
  } catch (error) {
    console.error('Erreur lors du nettoyage du stockage d\'authentification:', error);
  }
};

// Fonction pour sauvegarder les paramètres de l'application
export const saveSettings = async (settings: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
  }
};

// Fonction pour obtenir les paramètres de l'application
export const getSettings = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return null;
  }
}; 