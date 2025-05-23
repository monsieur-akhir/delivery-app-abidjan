// État initial
const state = {
  unreadCount: 0,
  notifications: [],
  loading: false,
}

// Getters
const getters = {
  unreadCount: (state) => state.unreadCount,
  hasUnread: (state) => state.unreadCount > 0,
  notifications: (state) => state.notifications,
  isLoading: (state) => state.loading,
}

// Mutations
const mutations = {
  setUnreadCount(state, count) {
    state.unreadCount = count
  },
  incrementUnreadCount(state) {
    state.unreadCount++
  },
  decrementUnreadCount(state) {
    if (state.unreadCount > 0) {
      state.unreadCount--
    }
  },
  resetUnreadCount(state) {
    state.unreadCount = 0
  },
  setNotifications(state, notifications) {
    state.notifications = notifications
  },
  addNotification(state, notification) {
    state.notifications.unshift(notification)
  },
  updateNotification(state, { id, updates }) {
    const index = state.notifications.findIndex((n) => n.id === id)
    if (index !== -1) {
      state.notifications[index] = { ...state.notifications[index], ...updates }
    }
  },
  removeNotification(state, id) {
    state.notifications = state.notifications.filter((n) => n.id !== id)
  },
  clearNotifications(state) {
    state.notifications = []
  },
  setLoading(state, loading) {
    state.loading = loading
  },
}

// Actions
const actions = {
  async fetchUnreadCount({ commit }) {
    try {
      const { fetchUnreadCount } = await import("@/api/notifications")
      const count = await fetchUnreadCount()
      commit("setUnreadCount", count)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  },

  async fetchNotifications({ commit }, params) {
    try {
      commit("setLoading", true)
      const { fetchNotifications } = await import("@/api/notifications")
      const response = await fetchNotifications(params)
      commit("setNotifications", response.data)

      // Mettre à jour le compteur de notifications non lues
      const unreadCount = response.data.filter((n) => !n.read).length
      commit("setUnreadCount", unreadCount)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      commit("setLoading", false)
    }
  },

  async markAsRead({ commit, state }, id) {
    try {
      const { markNotificationAsRead } = await import("@/api/notifications")
      await markNotificationAsRead(id)

      // Mettre à jour localement
      commit("updateNotification", { id, updates: { read: true } })

      // Décrémenter le compteur si la notification était non lue
      const notification = state.notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        commit("decrementUnreadCount")
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  },

  async markAllAsRead({ commit }) {
    try {
      const { markAllNotificationsAsRead } = await import("@/api/notifications")
      await markAllNotificationsAsRead()

      // Mettre à jour localement
      commit("resetUnreadCount")

      // Marquer toutes les notifications comme lues
      state.notifications.forEach((notification) => {
        commit("updateNotification", { id: notification.id, updates: { read: true } })
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  },

  async deleteNotification({ commit, state }, id) {
    try {
      const { deleteNotification } = await import("@/api/notifications")
      await deleteNotification(id)

      // Mettre à jour localement
      const notification = state.notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        commit("decrementUnreadCount")
      }

      commit("removeNotification", id)
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  },

  async clearAllNotifications({ commit }) {
    try {
      const { deleteNotification } = await import("@/api/notifications")
      await deleteNotification("all")

      // Mettre à jour localement
      commit("clearNotifications")
      commit("resetUnreadCount")
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  },

  receiveNotification({ commit }, notification) {
    commit("addNotification", notification)

    if (!notification.read) {
      commit("incrementUnreadCount")
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
