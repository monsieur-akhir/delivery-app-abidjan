import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import api from './api'
import type { Notification, NotificationType } from '../types/models'

export interface NotificationSettings {
  delivery_updates: boolean
  delivery_notifications: boolean
  bid_notifications: boolean
  payment_notifications: boolean
  push_notifications: boolean
  email_notifications: boolean
  sms_notifications: boolean
  promotional_offers: boolean
  security_alerts: boolean
  whatsapp_enabled?: boolean
  sound_enabled?: boolean
  vibration_enabled?: boolean
}

class NotificationService {
  static async initialize(): Promise<void> {
    try {
      // Configuration des notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      })

      // Demander les permissions
      await this.requestPermissions()

      // Obtenir le token push
      const token = await this.getPushToken()
      if (token) {
        await this.registerPushToken(token)
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error)
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync()
      return status === 'granted'
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error)
      return false
    }
  }

  static async getPushToken(): Promise<string | null> {
    try {
      if (!Constants.isDevice) {
        console.warn('Les notifications push ne fonctionnent que sur un appareil physique')
        return null
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })

      return token.data
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token push:', error)
      return null
    }
  }

  static async registerPushToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
      })
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error)
    }
  }

  static async sendLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Envoyer immédiatement
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification locale:', error)
    }
  }

  static async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/notifications')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
      return []
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`)
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  static async markAllAsRead(): Promise<void> {
    try {
      await api.put('/notifications/mark-all-read')
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error)
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`)
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error)
    }
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await api.get('/notifications/settings')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error)
      return {
        delivery_updates: true,
        delivery_notifications: true,
        bid_notifications: true,
        payment_notifications: true,
        push_notifications: true,
        email_notifications: true,
        sms_notifications: true,
        promotional_offers: true,
        security_alerts: true,
        whatsapp_enabled: false,
        sound_enabled: true,
        vibration_enabled: true,
      }
    }
  }

  static async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      await api.put('/notifications/settings', settings)
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
      return false
    }
  }

  static async subscribeToTopic(topic: string): Promise<void> {
    try {
      await api.post('/notifications/subscribe', { topic })
    } catch (error) {
      console.error('Erreur lors de l\'abonnement au topic:', error)
    }
  }

  static async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await api.post('/notifications/unsubscribe', { topic })
    } catch (error) {
      console.error('Erreur lors du désabonnement du topic:', error)
    }
  }

  static async sendDeliveryNotification(
    deliveryId: number,
    status: string,
    message: string
  ): Promise<void> {
    try {
      await api.post('/notifications/delivery', {
        delivery_id: deliveryId,
        status,
        message,
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de livraison:', error)
    }
  }

  static async sendPaymentNotification(
    amount: number,
    status: string,
    transactionId?: string
  ): Promise<void> {
    try {
      await api.post('/notifications/payment', {
        amount,
        status,
        transaction_id: transactionId,
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de paiement:', error)
    }
  }

  static async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count')
      return response.data.count
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de non lus:', error)
      return 0
    }
  }

  static async scheduleDeliveryReminder(
    deliveryId: number,
    scheduledTime: Date
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel de livraison',
          body: `N'oubliez pas votre livraison #${deliveryId}`,
          data: { deliveryId, type: 'delivery_reminder' },
        },
        trigger: scheduledTime,
      })
    } catch (error) {
      console.error('Erreur lors de la programmation du rappel:', error)
    }
  }

  static async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier)
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification programmée:', error)
    }
  }

  static getNotificationTypeColor(type: NotificationType): string {
    switch (type) {
      case 'delivery':
        return '#4CAF50'
      case 'payment':
        return '#2196F3'
      case 'system':
        return '#FF9800'
      case 'promotion':
        return '#9C27B0'
      default:
        return '#757575'
    }
  }

  static getNotificationTypeIcon(type: NotificationType): string {
    switch (type) {
      case 'delivery':
        return 'package'
      case 'payment':
        return 'credit-card'
      case 'system':
        return 'settings'
      case 'promotion':
        return 'tag'
      default:
        return 'bell'
    }
  }
}

export default NotificationService
export type { NotificationSettings }