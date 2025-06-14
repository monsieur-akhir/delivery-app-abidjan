<template>
  <div class="notification-bell">
    <button class="bell-button" @click="toggleDropdown" ref="bellButton">
      <font-awesome-icon icon="bell" />
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <div v-if="showDropdown" class="notification-dropdown" ref="dropdown">
      <div class="dropdown-header">
        <h3>Notifications</h3>
        <div class="dropdown-actions">
          <button v-if="hasUnread" class="action-btn" @click="markAllAsRead">
            <font-awesome-icon icon="check-double" />
            <span class="action-text">Tout marquer comme lu</span>
          </button>
          <router-link to="/notifications" class="action-btn">
            <font-awesome-icon icon="external-link-alt" />
            <span class="action-text">Voir tout</span>
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="dropdown-loading">
        <font-awesome-icon icon="circle-notch" spin />
        <span>Chargement...</span>
      </div>

      <div v-else-if="notifications.length === 0" class="dropdown-empty">
        <font-awesome-icon icon="bell-slash" />
        <span>Aucune notification</span>
      </div>

      <div v-else class="notification-list">
        <div
          v-for="notification in notifications.slice(0, 5)"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="viewNotification(notification)"
        >
          <div class="notification-icon" :class="getNotificationTypeClass(notification.type)">
            <font-awesome-icon :icon="getNotificationIcon(notification.type)" />
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <span class="notification-time">{{
                formatRelativeTime(notification.created_at)
              }}</span>
            </div>
            <p class="notification-message">{{ notification.message }}</p>
          </div>
        </div>
      </div>

      <div class="dropdown-footer">
        <router-link to="/notifications" class="view-all-btn">
          Voir toutes les notifications
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { formatRelativeTime } from '@/utils/formatters'

export default {
  name: 'NotificationBell',
  setup() {
    const store = useStore()
    const router = useRouter()

    const showDropdown = ref(false)
    const bellButton = ref(null)
    const dropdown = ref(null)
    const loading = ref(false)

    const unreadCount = computed(() => store.getters['notifications/unreadCount'])
    const hasUnread = computed(() => unreadCount.value > 0)
    const notifications = computed(() => store.state.notifications.notifications)

    // Charger les notifications récentes
    const loadNotifications = async () => {
      if (notifications.value.length === 0) {
        loading.value = true
        await store.dispatch('notifications/fetchNotifications', { limit: 5 })
        loading.value = false
      }
    }

    // Charger le compteur de notifications non lues
    const loadUnreadCount = async () => {
      await store.dispatch('notifications/fetchUnreadCount')
    }

    // Afficher/masquer le dropdown
    const toggleDropdown = async () => {
      showDropdown.value = !showDropdown.value

      if (showDropdown.value) {
        await loadNotifications()
      }
    }

    // Fermer le dropdown si on clique en dehors
    const handleClickOutside = event => {
      if (
        showDropdown.value &&
        bellButton.value &&
        dropdown.value &&
        !bellButton.value.contains(event.target) &&
        !dropdown.value.contains(event.target)
      ) {
        showDropdown.value = false
      }
    }

    // Marquer toutes les notifications comme lues
    const markAllAsRead = async () => {
      await store.dispatch('notifications/markAllAsRead')
    }

    // Voir une notification
    const viewNotification = async notification => {
      // Marquer comme lue
      if (!notification.read) {
        await store.dispatch('notifications/markAsRead', notification.id)
      }

      // Fermer le dropdown
      showDropdown.value = false

      // Rediriger vers la page appropriée en fonction du type de notification
      if (notification.data) {
        const userRole = store.state.auth.user?.role || 'client'

        switch (notification.type) {
          case 'delivery_status':
            router.push(`/${userRole}/deliveries/${notification.data.delivery_id}`)
            break
          case 'new_bid':
            router.push(`/${userRole}/deliveries/${notification.data.delivery_id}`)
            break
          case 'bid_accepted':
            router.push(`/${userRole}/deliveries/${notification.data.delivery_id}`)
            break
          case 'rating_received':
            router.push(`/${userRole}/profile`)
            break
          case 'payment':
            router.push(`/${userRole}/finances`)
            break
          default:
            router.push('/notifications')
            break
        }
      } else {
        router.push('/notifications')
      }
    }

    // Obtenir l'icône pour un type de notification
    const getNotificationIcon = type => {
      switch (type) {
        case 'delivery_status':
          return 'truck'
        case 'new_bid':
          return 'gavel'
        case 'bid_accepted':
          return 'check-circle'
        case 'rating_received':
          return 'star'
        case 'reward_earned':
          return 'gift'
        case 'payment':
          return 'money-bill'
        case 'system':
          return 'cog'
        case 'weather_alert':
          return 'cloud-rain'
        default:
          return 'bell'
      }
    }

    // Obtenir la classe CSS pour un type de notification
    const getNotificationTypeClass = type => {
      switch (type) {
        case 'delivery_status':
          return 'delivery'
        case 'new_bid':
        case 'bid_accepted':
          return 'bid'
        case 'rating_received':
          return 'rating'
        case 'reward_earned':
          return 'reward'
        case 'payment':
          return 'payment'
        case 'system':
          return 'system'
        case 'weather_alert':
          return 'weather'
        default:
          return 'default'
      }
    }

    // Initialiser la connexion WebSocket pour les notifications en temps réel
    const initWebSocket = () => {
      const token = store.state.auth.token
      if (!token) return

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/notifications?token=${token}`

      const socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        console.log('WebSocket connection established for notification bell')
      }

      socket.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'notification') {
            // Ajouter la nouvelle notification
            store.dispatch('notifications/receiveNotification', data.notification)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      socket.onerror = error => {
        console.error('WebSocket error:', error)
      }

      socket.onclose = () => {
        console.log('WebSocket connection closed for notification bell')

        // Tenter de se reconnecter après un délai
        setTimeout(() => {
          initWebSocket()
        }, 5000)
      }

      return socket
    }

    let socket = null

    onMounted(() => {
      loadUnreadCount()
      document.addEventListener('click', handleClickOutside)
      socket = initWebSocket()
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      if (socket) {
        socket.close()
      }
    })

    // Fermer le dropdown si on change de route
    watch(
      () => router.currentRoute.value,
      () => {
        showDropdown.value = false
      }
    )

    return {
      showDropdown,
      bellButton,
      dropdown,
      loading,
      unreadCount,
      hasUnread,
      notifications,
      toggleDropdown,
      markAllAsRead,
      viewNotification,
      getNotificationIcon,
      getNotificationTypeClass,
      formatRelativeTime,
    }
  },
}
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-button {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 1.25rem;
  cursor: pointer;
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.bell-button:hover {
  background-color: var(--background-secondary);
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.dropdown-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  text-decoration: none;
}

.action-btn:hover {
  background-color: var(--background-secondary);
  color: var(--text-color);
}

.dropdown-loading,
.dropdown-empty {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 0.5rem;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  background-color: var(--background-secondary);
}

.notification-item.unread {
  background-color: rgba(255, 107, 0, 0.05);
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
  color: white;
  font-size: 0.875rem;
}

.notification-icon.delivery {
  background-color: #4caf50;
}

.notification-icon.bid {
  background-color: #2196f3;
}

.notification-icon.rating {
  background-color: #ffc107;
}

.notification-icon.reward {
  background-color: #9c27b0;
}

.notification-icon.payment {
  background-color: #ff9800;
}

.notification-icon.system {
  background-color: #607d8b;
}

.notification-icon.weather {
  background-color: #00bcd4;
}

.notification-icon.default {
  background-color: #9e9e9e;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.25rem;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  margin-left: 0.5rem;
}

.notification-message {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dropdown-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.view-all-btn {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.view-all-btn:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .notification-dropdown {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 0;
    max-height: calc(100vh - 60px);
    display: flex;
    flex-direction: column;
  }

  .notification-list {
    flex: 1;
    max-height: none;
  }

  .action-text {
    display: none;
  }
}
</style>
