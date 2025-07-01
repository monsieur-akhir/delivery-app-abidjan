import * as ImagePicker from 'expo-image-picker'
import { Alert, Linking, Platform } from 'react-native'

/**
 * Demande la permission caméra avec gestion d'erreur améliorée
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    // Vérifier d'abord si la permission est déjà accordée
    const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync()
    
    if (existingStatus === 'granted') {
      return true
    }

    // Demander la permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status === 'granted') {
      return true
    }

    // Si la permission est refusée, afficher une alerte avec option d'aller dans les paramètres
    if (status === 'denied') {
      Alert.alert(
        'Permission caméra requise',
        'Cette fonctionnalité nécessite l\'accès à votre caméra. Veuillez autoriser l\'accès dans les paramètres de votre appareil.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Paramètres', 
            onPress: () => openAppSettings() 
          }
        ]
      )
      return false
    }

    // Si la permission est bloquée définitivement
    if (status === 'undetermined') {
      Alert.alert(
        'Permission caméra requise',
        'Veuillez autoriser l\'accès à la caméra pour utiliser cette fonctionnalité.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Réessayer', 
            onPress: () => requestCameraPermission() 
          }
        ]
      )
      return false
    }

    return false
  } catch (error) {
    console.error('Erreur lors de la demande de permission caméra:', error)
    Alert.alert(
      'Erreur',
      'Impossible d\'accéder à la caméra. Veuillez vérifier les permissions de l\'application.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Paramètres', 
          onPress: () => openAppSettings() 
        }
      ]
    )
    return false
  }
}

/**
 * Vérifie si la permission caméra est accordée
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    console.error('Erreur lors de la vérification de la permission caméra:', error)
    return false
  }
}

/**
 * Ouvre les paramètres de l'application
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:')
    } else {
      await Linking.openSettings()
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture des paramètres:', error)
    Alert.alert(
      'Erreur',
      'Impossible d\'ouvrir les paramètres. Veuillez y aller manuellement.',
      [{ text: 'OK' }]
    )
  }
}

/**
 * Lance la caméra avec gestion d'erreur
 */
export const launchCamera = async (options: ImagePicker.ImagePickerOptions = {}): Promise<ImagePicker.ImagePickerResult> => {
  const hasPermission = await requestCameraPermission()
  
  if (!hasPermission) {
    return { canceled: true }
  }

  try {
    return await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaType.IMAGE,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...options
    })
  } catch (error) {
    console.error('Erreur lors du lancement de la caméra:', error)
    Alert.alert(
      'Erreur',
      'Impossible d\'ouvrir la caméra. Veuillez réessayer.',
      [{ text: 'OK' }]
    )
    return { canceled: true }
  }
}

/**
 * Lance la galerie d'images avec gestion d'erreur
 */
export const launchImageLibrary = async (options: ImagePicker.ImagePickerOptions = {}): Promise<ImagePicker.ImagePickerResult> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission galerie requise',
        'Cette fonctionnalité nécessite l\'accès à votre galerie photos.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Paramètres', 
            onPress: () => openAppSettings() 
          }
        ]
      )
      return { canceled: true }
    }

    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.IMAGE,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...options
    })
  } catch (error) {
    console.error('Erreur lors du lancement de la galerie:', error)
    Alert.alert(
      'Erreur',
      'Impossible d\'ouvrir la galerie. Veuillez réessayer.',
      [{ text: 'OK' }]
    )
    return { canceled: true }
  }
} 