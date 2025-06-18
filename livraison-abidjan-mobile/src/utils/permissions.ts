import * as Permissions from "expo-permissions"
import { Platform } from "react-native"

/**
 * Types de permissions supportés
 */
export type PermissionType = "camera" | "microphone" | "location" | "notifications" | "storage"

/**
 * Demande une permission spécifique
 * @param type Type de permission à demander
 * @returns true si la permission est accordée, false sinon
 */
export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  if (Platform.OS === "web") {
    return true
  }

  let permission: Permissions.PermissionType

  switch (type) {
    case "camera":
      permission = Permissions.CAMERA
      break
    case "microphone":
      permission = Permissions.AUDIO_RECORDING
      break
    case "location":
      permission = Permissions.LOCATION
      break
    case "notifications":
      permission = Permissions.NOTIFICATIONS
      break
    case "storage":
      permission = Permissions.MEDIA_LIBRARY
      break
    default:
      throw new Error(`Permission type ${type} not supported`)
  }

  const { status } = await Permissions.askAsync(permission)
  return status === "granted"
}

/**
 * Vérifie si une permission est déjà accordée
 * @param type Type de permission à vérifier
 * @returns true si la permission est accordée, false sinon
 */
export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  if (Platform.OS === "web") {
    return true
  }

  let permission: Permissions.PermissionType

  switch (type) {
    case "camera":
      permission = Permissions.CAMERA
      break
    case "microphone":
      permission = Permissions.AUDIO_RECORDING
      break
    case "location":
      permission = Permissions.LOCATION
      break
    case "notifications":
      permission = Permissions.NOTIFICATIONS
      break
    case "storage":
      permission = Permissions.MEDIA_LIBRARY
      break
    default:
      throw new Error(`Permission type ${type} not supported`)
  }

  const { status } = await Permissions.getAsync(permission)
  return status === "granted"
}
