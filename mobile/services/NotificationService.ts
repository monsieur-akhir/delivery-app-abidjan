import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { API_URL } from "../config/environment"

// Types
export interface Notification {
  id: number
  title: string
  message: string
  type: string
  data?: any
  read: boolean
  created_at: string
}

export interface NotificationSettings {
  push_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  email_enabled: boolean
  delivery_updates: boolean
  marketing: boolean
  system_updates: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
}

class NotificationService {
  // Configurer les notifications push
  async configurePushNotifications() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!")
        return
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      })

      // Enregistrer le token sur le serveur
      this.registerPushToken(token.data)

      // Configuration pour Android
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF6B00",
        })
      }
    } else {
      console.log("Must use physical device for Push Notifications")
    }
  }

  // Enregistrer le token de notification push sur le serveur
  async registerPushToken(token: string) {
    try {
      const authToken = await AsyncStorage.getItem("token")
      await axios.post(
        `${API_URL}/notifications/register-device`,
        { token, device_type: Platform.OS },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      )
    } catch (error) {
      console.error("Error registering push token:", error)
    }
  }

  // Récupérer les notifications de l'utilisateur
  async getNotifications(page = 1, limit = 20): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/notifications?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching notifications:", error)
      throw error
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.put(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      return true
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return false
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.put(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      return true
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return true
    } catch (error) {
      console.error("Error deleting notification:", error)
      return false
    }
  }

  // Récupérer les paramètres de notification
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.get(`${API_URL}/notifications/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching notification settings:", error)
      // Retourner des paramètres par défaut en cas d'erreur
      return {
        push_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false,
        email_enabled: true,
        delivery_updates: true,
        marketing: false,
        system_updates: true,
        sound_enabled: true,
        vibration_enabled: true,
      }
    }
  }

  // Mettre à jour les paramètres de notification
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("token")
      await axios.put(`${API_URL}/notifications/settings`, settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      return true
    } catch (error) {
      console.error("Error updating notification settings:", error)
      return false
    }
  }

  // Envoyer une notification locale
  async sendLocalNotification(title: string, body: string, data: any = {}): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    })
  }

  // Gérer les notifications en arrière-plan
  setupBackgroundNotifications() {
    // Gestionnaire de notification reçue
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })

    // Gestionnaire de notification ouverte
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response
      const data = notification.request.content.data

      // Stocker la notification pour traitement ultérieur
      this.handleNotificationNavigation(data)
    })

    return subscription
  }

  // Gérer la navigation basée sur la notification
  async handleNotificationNavigation(data: any) {
    // Stocker les données de notification pour que l'application puisse les traiter au démarrage
    await AsyncStorage.setItem("lastNotificationData", JSON.stringify(data))
  }

  // Vérifier s'il y a une notification en attente au démarrage
  async checkPendingNotifications() {
    const notificationData = await AsyncStorage.getItem("lastNotificationData")
    if (notificationData) {
      // Effacer les données après récupération
      await AsyncStorage.removeItem("lastNotificationData")
      return JSON.parse(notificationData)
    }
    return null
  }
}

export default NotificationService
export { NotificationService }