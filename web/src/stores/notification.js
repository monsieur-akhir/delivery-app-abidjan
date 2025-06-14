import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // État
  const notifications = ref([])
  const isLoading = ref(false)

  // Getters
  const unreadCount = computed(() => {
    return notifications.value.filter(notification => !notification.read).length
  })

  // Actions
  function fetchNotifications() {
    isLoading.value = true

    // Simuler une requête API
    setTimeout(() => {
      // Données de test
      notifications.value = [
        {
          id: 1,
          title: 'Nouvelle livraison',
          message: 'Une nouvelle livraison a été créée',
          type: 'delivery',
          read: false,
          date: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          link: '/business/deliveries/1',
        },
        {
          id: 2,
          title: 'Paiement reçu',
          message: 'Vous avez reçu un paiement de 5000 FCFA',
          type: 'payment',
          read: true,
          date: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          link: '/business/finances',
        },
        {
          id: 3,
          title: 'Nouvelle évaluation',
          message: 'Vous avez reçu une nouvelle évaluation 5 étoiles',
          type: 'rating',
          read: false,
          date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          link: '/business/profile',
        },
        {
          id: 4,
          title: 'Mise à jour système',
          message: 'Le système a été mis à jour vers la version 1.2.0',
          type: 'system',
          read: true,
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ]

      isLoading.value = false
    }, 500)
  }

  function markAsRead(id) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  function deleteNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function clearAllNotifications() {
    notifications.value = []
  }

  // Initialiser les notifications
  fetchNotifications()

  return {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  }
})
