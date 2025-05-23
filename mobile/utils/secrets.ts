import * as SecureStore from "expo-secure-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

// Vérifier si SecureStore est disponible (pas disponible sur le web)
const isSecureStoreAvailable = Platform.OS !== "web"

// Sauvegarder une valeur de manière sécurisée
export const saveSecureValue = async (key: string, value: string): Promise<void> => {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(key, value)
    } else {
      // Fallback pour le web
      await AsyncStorage.setItem(`secure_${key}`, value)
    }
  } catch (error) {
    console.error(`Error saving secure value for ${key}:`, error)
    throw error
  }
}

// Récupérer une valeur sécurisée
export const getSecureValue = async (key: string): Promise<string | null> => {
  try {
    if (isSecureStoreAvailable) {
      return await SecureStore.getItemAsync(key)
    } else {
      // Fallback pour le web
      return await AsyncStorage.getItem(`secure_${key}`)
    }
  } catch (error) {
    console.error(`Error getting secure value for ${key}:`, error)
    return null
  }
}

// Supprimer une valeur sécurisée
export const deleteSecureValue = async (key: string): Promise<void> => {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(key)
    } else {
      // Fallback pour le web
      await AsyncStorage.removeItem(`secure_${key}`)
    }
  } catch (error) {
    console.error(`Error deleting secure value for ${key}:`, error)
    throw error
  }
}

// Vérifier si une valeur sécurisée existe
export const hasSecureValue = async (key: string): Promise<boolean> => {
  const value = await getSecureValue(key)
  return value !== null
}

// Sauvegarder un objet de manière sécurisée
export const saveSecureObject = async (key: string, object: any): Promise<void> => {
  const jsonValue = JSON.stringify(object)
  await saveSecureValue(key, jsonValue)
}

// Récupérer un objet sécurisé
export const getSecureObject = async (key: string): Promise<any | null> => {
  const jsonValue = await getSecureValue(key)
  if (jsonValue === null) return null
  return JSON.parse(jsonValue)
}
