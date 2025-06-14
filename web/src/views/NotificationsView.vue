<template>
  <div class="notifications-view">
    <div class="page-header">
      <h1>Notifications</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="markAllAsRead" :disabled="loading || !hasUnread">
          <font-awesome-icon icon="check-double" class="mr-1" />
          Tout marquer comme lu
        </button>
        <button
          class="btn btn-outline"
          @click="clearAllNotifications"
          :disabled="loading || notifications.length === 0"
        >
          <font-awesome-icon icon="trash" class="mr-1" />
          Effacer tout
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <font-awesome-icon icon="circle-notch" spin size="2x" />
      <p>Chargement des notifications...</p>
    </div>

    <div v-else>
      <div v-if="notifications.length === 0" class="empty-state">
        <font-awesome-icon icon="bell-slash" size="3x" />
        <h3>Aucune notification</h3>
        <p>Vous n'avez pas de notifications pour le moment.</p>
      </div>

      <div v-else class="notifications-container">
        <div class="notifications-filters">
          <div class="filter-group">
            <label>Filtrer par type:</label>
            <div class="filter-options">
              <button
                class="filter-btn"
                :class="{ active: selectedType === null }"
                @click="filterByType(null)"
              >
                Tous
              </button>
              <button
                v-for="type in notificationTypes"
                :key="type.value"
                class="filter-btn"
                :class="{ active: selectedType === type.value }"
                @click="filterByType(type.value)"
              >
                <font-awesome-icon :icon="type.icon" class="mr-1" />
                {{ type.label }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label>Statut:</label>
            <div class="filter-options">
              <button
                class="filter-btn"
                :class="{ active: readFilter === 'all' }"
                @click="filterByRead('all')"
              >
                Tous
              </button>
              <button
                class="filter-btn"
                :class="{ active: readFilter === 'unread' }"
                @click="filterByRead('unread')"
              >
                Non lus
              </button>
              <button
                class="filter-btn"
                :class="{ active: readFilter === 'read' }"
                @click="filterByRead('read')"
              >
                Lus
              </button>
            </div>
          </div>
        </div>

        <div class="notifications-list">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <div class="notification-icon" :class="getNotificationTypeClass(notification.type)">
              <font-awesome-icon :icon="getNotificationIcon(notification.type)" />
            </div>
            <div class="notification-content">
              <div class="notification-header">
                <h3 class="notification-title">{{ notification.title }}</h3>
                <span class="notification-time">{{
                  formatRelativeTime(notification.created_at)
                }}</span>
              </div>
              <p class="notification-message">{{ notification.message }}</p>

              <div v-if="notification.data" class="notification-data">
                <template v-if="notification.type === 'delivery_status'">
                  <router-link
                    :to="`/${userRole}/deliveries/${notification.data.delivery_id}`"
                    class="notification-link"
                  >
                    Voir la livraison
                  </router-link>
                </template>

                <template v-else-if="notification.type === 'new_bid'">
                  <router-link
                    :to="`/${userRole}/deliveries/${notification.data.delivery_id}`"
                    class="notification-link"
                  >
                    Voir les enchères
                  </router-link>
                </template>

                <template v-else-if="notification.type === 'rating_received'">
                  <div class="rating-preview">
                    <div class="stars">
                      <font-awesome-icon
                        v-for="i in 5"
                        :key="i"
                        icon="star"
                        :class="i <= notification.data.score ? 'star-filled' : 'star-empty'"
                      />
                    </div>
                    <span>{{ notification.data.score }}/5</span>
                  </div>
                </template>

                <template v-else-if="notification.type === 'payment'">
                  <div class="payment-preview">
                    <span class="payment-amount"
                      >{{ formatPrice(notification.data.amount) }} FCFA</span
                    >
                    <router-link :to="`/${userRole}/finances`" class="notification-link">
                      Voir les détails
                    </router-link>
                  </div>
                </template>
              </div>
            </div>
            <div class="notification-actions">
              <button class="action-btn" @click.stop="deleteNotification(notification.id)">
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasMoreNotifications" class="load-more">
          <button class="btn btn-outline" @click="loadMoreNotifications" :disabled="loadingMore">
            <font-awesome-icon v-if="loadingMore" icon="circle-notch" spin class="mr-1" />
            <span v-else>Charger plus</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as apiDeleteNotification,
} from '@/api/notifications'
import { formatRelativeTime, formatPrice } from '@/utils/formatters'

export default {
  name: 'NotificationsView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const notificationStore = useNotificationStore()

    const notifications = ref([])
    const loading = ref(true)
    const loadingMore = ref(false)
    const page = ref(1)
    const limit = ref(20)
    const hasMoreNotifications = ref(false)
    const selectedType = ref(null)
    const readFilter = ref('all')

    // WebSocket pour les notifications en temps réel
    let notificationSocket = null

    const userRole = computed(() => {
      return authStore.user ? authStore.user.role : 'client'
    })

    const notificationTypes = [
      { value: 'delivery_status', label: 'Livraisons', icon: 'truck' },
      { value: 'new_bid', label: 'Enchères', icon: 'gavel' },
      { value: 'rating_received', label: 'Évaluations', icon: 'star' },
      { value: 'payment', label: 'Paiements', icon: 'money-bill' },
      { value: 'system', label: 'Système', icon: 'cog' },
    ]

    const hasUnread = computed(() => {
      return notifications.value.some(notification => !notification.read)
    })

    const filteredNotifications = computed(() => {
      let filtered = [...notifications.value]

      // Filtrer par type
      if (selectedType.value) {
        filtered = filtered.filter(notification => notification.type === selectedType.value)
      }

      // Filtrer par statut de lecture
      if (readFilter.value === 'read') {
        filtered = filtered.filter(notification => notification.read)
      } else if (readFilter.value === 'unread') {
        filtered = filtered.filter(notification => !notification.read)
      }

      return filtered
    })

    // Charger les notifications
    const loadNotifications = async (reset = true) => {
      try {
        loading.value = true

        if (reset) {
          page.value = 1
          notifications.value = []
        }

        const response = await fetchNotifications({
          page: page.value,
          limit: limit.value,
        })

        if (reset) {
          notifications.value = response.data
        } else {
          notifications.value = [...notifications.value, ...response.data]
        }

        hasMoreNotifications.value = response.data.length === limit.value

        // Mettre à jour le compteur de notifications non lues dans le store
        const unreadCount = notifications.value.filter(n => !n.read).length
        notificationStore.setUnreadCount(unreadCount)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        loading.value = false
        loadingMore.value = false
      }
    }

    // Charger plus de notifications
    const loadMoreNotifications = async () => {
      if (loadingMore.value || !hasMoreNotifications.value) return

      loadingMore.value = true
      page.value++
      await loadNotifications(false)
    }

    // Marquer une notification comme lue
    const markAsRead = async id => {
      try {
        const notification = notifications.value.find(n => n.id === id)
        if (notification && !notification.read) {
          await markNotificationAsRead(id)

          // Mettre à jour localement
          notification.read = true

          // Mettre à jour le compteur de notifications non lues dans le store
          const unreadCount = notifications.value.filter(n => !n.read).length
          notificationStore.setUnreadCount(unreadCount)

          // Rediriger vers la page appropriée en fonction du type de notification
          handleNotificationClick(notification)
        } else {
          // Si déjà lue, juste rediriger
          handleNotificationClick(notification)
        }
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Marquer toutes les notifications comme lues
    const markAllAsRead = async () => {
      if (!hasUnread.value) return

      try {
        await markAllNotificationsAsRead()

        // Mettre à jour localement
        notifications.value.forEach(notification => {
          notification.read = true
        })

        // Mettre à jour le compteur de notifications non lues dans le store
        notificationStore.setUnreadCount(0)
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    }

    // Supprimer une notification
    const deleteNotification = async id => {
      try {
        await apiDeleteNotification(id)

        // Mettre à jour localement
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
          const wasUnread = !notifications.value[index].read
          notifications.value.splice(index, 1)

          // Mettre à jour le compteur de notifications non lues dans le store si nécessaire
          if (wasUnread) {
            const unreadCount = notifications.value.filter(n => !n.read).length
            notificationStore.setUnreadCount(unreadCount)
          }
        }
      } catch (error) {
        console.error('Error deleting notification:', error)
      }
    }

    // Effacer toutes les notifications
    const clearAllNotifications = async () => {
      if (notifications.value.length === 0) return

      if (confirm('Êtes-vous sûr de vouloir supprimer toutes vos notifications ?')) {
        try {
          await apiDeleteNotification('all')

          // Mettre à jour localement
          notifications.value = []

          // Mettre à jour le compteur de notifications non lues dans le store
          notificationStore.setUnreadCount(0)
        } catch (error) {
          console.error('Error clearing all notifications:', error)
        }
      }
    }

    // Filtrer par type de notification
    const filterByType = type => {
      selectedType.value = type
    }

    // Filtrer par statut de lecture
    const filterByRead = status => {
      readFilter.value = status
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

    // Gérer le clic sur une notification
    const handleNotificationClick = notification => {
      if (!notification.data) return

      switch (notification.type) {
        case 'delivery_status':
          router.push(`/${userRole.value}/deliveries/${notification.data.delivery_id}`)
          break
        case 'new_bid':
          router.push(`/${userRole.value}/deliveries/${notification.data.delivery_id}`)
          break
        case 'bid_accepted':
          router.push(`/${userRole.value}/deliveries/${notification.data.delivery_id}`)
          break
        case 'rating_received':
          router.push(`/${userRole.value}/profile`)
          break
        case 'payment':
          router.push(`/${userRole.value}/finances`)
          break
        default:
          // Aucune action spécifique
          break
      }
    }

    // Initialiser la connexion WebSocket pour les notifications en temps réel
    const initWebSocket = () => {
      const token = authStore.token
      if (!token) return

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/notifications?token=${token}`

      notificationSocket = new WebSocket(wsUrl)

      notificationSocket.onopen = () => {
        console.log('WebSocket connection established for notifications')
      }

      notificationSocket.onmessage = event => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'notification') {
            // Ajouter la nouvelle notification au début de la liste
            notifications.value.unshift(data.notification)

            // Mettre à jour le compteur de notifications non lues dans le store
            const unreadCount = notifications.value.filter(n => !n.read).length
            notificationStore.setUnreadCount(unreadCount)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      notificationSocket.onerror = error => {
        console.error('WebSocket error:', error)
      }

      notificationSocket.onclose = () => {
        console.log('WebSocket connection closed for notifications')
      }
    }

    // Fermer la connexion WebSocket
    const closeWebSocket = () => {
      if (notificationSocket) {
        notificationSocket.close()
        notificationSocket = null
      }
    }

    onMounted(() => {
      loadNotifications()
      initWebSocket()
    })

    onUnmounted(() => {
      closeWebSocket()
    })

    return {
      notifications,
      loading,
      loadingMore,
      hasMoreNotifications,
      selectedType,
      readFilter,
      notificationTypes,
      userRole,
      hasUnread,
      filteredNotifications,
      loadNotifications,
      loadMoreNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      filterByType,
      filterByRead,
      getNotificationIcon,
      getNotificationTypeClass,
      formatRelativeTime,
      formatPrice,
    }
  },
}
</script>

<style scoped>
.notifications-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.loading-state svg {
  margin-bottom: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.notifications-filters {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  background-color: var(--background-secondary);
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: var(--border-color);
}

.filter-btn.active {
  background-color: var(--primary-color);
  color: white;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-item {
  display: flex;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.notification-item.unread {
  border-left: 4px solid var(--primary-color);
}

.notification-item.unread::after {
  content: '';
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  color: white;
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
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  margin-left: 1rem;
}

.notification-message {
  font-size: 0.875rem;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}

.notification-data {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.notification-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.notification-link:hover {
  text-decoration: underline;
}

.rating-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.25rem;
}

.star-filled {
  color: #ffc107;
}

.star-empty {
  color: #e0e0e0;
}

.payment-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.payment-amount {
  font-weight: 600;
  color: #4caf50;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 1rem;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--background-secondary);
  color: var(--text-color);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }

  .notifications-filters {
    flex-direction: column;
  }

  .notification-header {
    flex-direction: column;
  }

  .notification-time {
    margin-left: 0;
    margin-top: 0.25rem;
  }
}
</style>
