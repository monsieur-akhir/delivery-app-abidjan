"use client"

import { createContext, useContext, useState, useEffect } from "react"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"
import { useAuth } from "./AuthContext"
import { registerPushToken } from "../services/api"

const NotificationContext = createContext()

export const useNotification = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const { userToken, user } = useAuth()
  const [expoPushToken, setExpoPushToken] = useState("")
  const [notification, setNotification] = useState(null)
  const [notifications, setNotifications] = useState([])

  // Configurer les notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token))

    // Gestionnaire de notification reçue
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification)

      // Ajouter la notification à la liste
      const newNotification = {
        id: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
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
    if (userToken && expoPushToken && user) {
      registerPushToken(expoPushToken, user.id)
    }
  }, [userToken, expoPushToken, user])

  // Enregistrer pour les notifications push
  const registerForPushNotificationsAsync = async () => {
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
  const loadSavedNotifications = async () => {
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
  const saveNotifications = async (notificationsList) => {
    try {
      await AsyncStorage.setItem("notifications", JSON.stringify(notificationsList))
    } catch (error) {
      console.error("Error saving notifications:", error)
    }
  }

  // Ajouter une notification
  const addNotification = (newNotification) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [newNotification, ...prevNotifications]
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Marquer une notification comme lue
  const markNotificationAsRead = (notificationId) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      )
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = () => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.map((item) => ({ ...item, read: true }))
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Supprimer une notification
  const deleteNotification = (notificationId) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = prevNotifications.filter((item) => item.id !== notificationId)
      saveNotifications(updatedNotifications)
      return updatedNotifications
    })
  }

  // Vider toutes les notifications
  const clearAllNotifications = () => {
    setNotifications([])
    saveNotifications([])
  }

  // Traiter l'action associée à une notification
  const handleNotificationAction = (data) => {
    // Implémenter le traitement des actions de notification
    // Par exemple, naviguer vers un écran spécifique en fonction du type de notification
    console.log("Notification action data:", data)
  }

  // Envoyer une notification locale
  const sendLocalNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Immédiatement
    })
  }

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        sendLocalNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
