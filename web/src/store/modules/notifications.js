import { defineStore } from "pinia"
import { ref } from "vue"

export const useNotificationStore = defineStore("notification", () => {
  const unreadCount = ref(0)
  const notifications = ref([])

  const setUnreadCount = (count) => {
    unreadCount.value = count
  }

  const addNotification = (notification) => {
    notifications.value.unshift(notification)
    if (!notification.read) {
      unreadCount.value++
    }
  }

  const markAsRead = (notificationId) => {
    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value--
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach((n) => (n.read = true))
    unreadCount.value = 0
  }

  return {
    unreadCount,
    notifications,
    setUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
  }
})
