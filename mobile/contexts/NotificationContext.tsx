"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import { useAuth } from "./AuthContext"
import { registerPushToken } from "../services/api"
import type { Notification } from "../types/models"

interface NotificationContextType {
  expoPushToken: string
  notification: Notifications.Notification | null
  notifications: Notification[]
  unreadCount: number
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  deleteNotification: (id: string) => void
  clearAllNotifications: () => void
}

interface NotificationProviderProps {
  children: ReactNode
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

export const useNotifications = useNotification

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { token, user } = useAuth()
  const [expoPushToken, setExpoPushToken] = useState<string>("")
  const [notification, setNotification] = useState<Notifications.Notification | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Configurer les notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => token && setExpoPushToken(token))

    // Gestionnaire de notification reçue
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification)

      // Ajouter la notification à la liste
      const newNotification: Notification = {
        user_id: user?.id || 0,
        id: parseInt(notification.request.identifier) || Date.now(),
        title: notification.request.content.title,
        message: notification.request.content.body,
        data: notification.request.content.data,
        date: new Date().toISOString(),
        read: false,
      }

      addNotification(newNotification)
    })

    // Gestionnaire de notification cliquée
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response

      // Marquer la notification comme lue
      markNotificationAsRead(notification.request.identifier)

      // Traiter l'action associée à la notification
      handleNotificationAction(notification.request.content.data)
    })

    // Charger les notifications sauvegardées
    loadSavedNotifications()

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }, [])

  // Enregistrer le token sur le serveur lorsque l'utilisateur est connecté
  useEffect(() => {
    if (token && expoPushToken && user) {
      registerPushToken(expoPushToken, user.id.toString())
    }
  }, [token, expoPushToken, user])

  // Enregistrer pour les notifications push
  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    let token

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

      token = (await Notifications.getExpoPushTokenAsync()).data
    } else {
      console.log("Must use physical device for Push Notifications")
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B00",
      })
    }

    return token
  }

  // Charger les notifications sauvegardées
  const loadSavedNotifications = async (): Promise<void> => {
    try {
      const savedNotifications = await AsyncStorage.getItem("notifications")
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications))
      }
    } catch (error) {
      console.error("Error loading saved notifications:", error)
    }
  }

  // Sauvegarder les notifications
  const saveNotifications = async (notificationsList: Notification[]): Promise<void> => {
    try {
      await AsyncStorage.setItem("notifications", JSON.stringify(notificationsList))
    } catch (error) {
      console.error("Error saving notifications:", error)
    }
  }

  // Ajouter une notification
  const addNotification = (newNotification: Notification): void => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [newNotification, ...prevNotifications]
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Marquer une notification comme lue
  const markNotificationAsRead = (id: string): void => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.map((item) => (item.id.toString() === id ? { ...item, read: true } : item))
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = (): void => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.map((item) => ({ ...item, read: true }))
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Supprimer une notification
  const deleteNotification = (id: string): void => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.filter((item) => item.id.toString() !== id)
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Vider toutes les notifications
  const clearAllNotifications = (): void => {
    setNotifications([])
    saveNotifications([])
  }

  // Traiter l'action associée à une notification
  const handleNotificationAction = (data: any): void => {
    // Implémenter le traitement des actions de notification
    // Par exemple, naviguer vers un écran spécifique en fonction du type de notification
    console.log("Notification action data:", data)
  }

  // Envoyer une notification locale
  const sendLocalNotification = async (title: string, body: string, data: any = {}): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Immédiatement
    })
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    notifications,
    unreadCount,
    sendLocalNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}