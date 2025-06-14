<template>
  <div class="real-time-notifications">
    <div class="notifications-container" v-if="notifications.length > 0">
      <transition-group name="notification">
        <div
          v-for="notification in visibleNotifications"
          :key="notification.id"
          class="notification-item"
          :class="getTypeClass(notification.type)"
        >
          <div class="notification-icon">
            <i :class="getTypeIcon(notification.type)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button class="notification-close" @click="dismissNotification(notification.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getCurrentInstance } from 'vue'

export default {
  name: 'RealTimeNotifications',
  props: {
    maxVisible: {
      type: Number,
      default: 3,
    },
    autoDismiss: {
      type: Boolean,
      default: true,
    },
    dismissTime: {
      type: Number,
      default: 5000,
    },
  },
  setup(props, { emit }) {
    const notifications = ref([])
    const dismissTimers = ref({})
    let socket = null

    // Notifications visibles (limitées par maxVisible)
    const visibleNotifications = computed(() => {
      return notifications.value.slice(0, props.maxVisible)
    })

    // Ajouter une notification
    const addNotification = notification => {
      // Générer un ID unique si non fourni
      if (!notification.id) {
        notification.id = Date.now()
      }

      // Ajouter la notification au début de la liste
      notifications.value.unshift(notification)

      // Configurer le timer de suppression automatique si activé
      if (props.autoDismiss) {
        dismissTimers.value[notification.id] = setTimeout(() => {
          dismissNotification(notification.id)
        }, props.dismissTime)
      }

      // Émettre l'événement d'ajout
      emit('notification-added', notification)
    }

    // Supprimer une notification
    const dismissNotification = id => {
      // Trouver l'index de la notification
      const index = notifications.value.findIndex(n => n.id === id)

      if (index !== -1) {
        // Supprimer la notification
        const notification = notifications.value[index]
        notifications.value.splice(index, 1)

        // Supprimer le timer associé
        if (dismissTimers.value[id]) {
          clearTimeout(dismissTimers.value[id])
          delete dismissTimers.value[id]
        }

        // Émettre l'événement de suppression
        emit('notification-dismissed', notification)
      }
    }

    // Supprimer toutes les notifications
    const clearAllNotifications = () => {
      // Supprimer tous les timers
      Object.values(dismissTimers.value).forEach(timer => {
        clearTimeout(timer)
      })

      // Réinitialiser les collections
      notifications.value = []
      dismissTimers.value = {}

      // Émettre l'événement de suppression de toutes les notifications
      emit('all-notifications-cleared')
    }

    // Obtenir la classe CSS pour un type
    const getTypeClass = type => {
      switch (type) {
        case 'info':
          return 'notification-info'
        case 'success':
          return 'notification-success'
        case 'warning':
          return 'notification-warning'
        case 'error':
          return 'notification-error'
        default:
          return ''
      }
    }

    // Obtenir l'icône pour un type
    const getTypeIcon = type => {
      switch (type) {
        case 'info':
          return 'fas fa-info-circle'
        case 'success':
          return 'fas fa-check-circle'
        case 'warning':
          return 'fas fa-exclamation-triangle'
        case 'error':
          return 'fas fa-times-circle'
        default:
          return 'fas fa-bell'
      }
    }

    // Initialiser la connexion WebSocket
    const initWebSocket = () => {
      // Dans un environnement réel, cette fonction se connecterait à un serveur WebSocket
      // Pour la démonstration, nous simulons la réception de notifications

      // Simuler la réception de notifications toutes les 10 secondes
      const interval = setInterval(() => {
        // Générer une notification aléatoire
        const types = ['info', 'success', 'warning', 'error']
        const type = types[Math.floor(Math.random() * types.length)]

        const titles = {
          info: 'Nouvelle livraison disponible',
          success: 'Livraison complétée',
          warning: 'Retard de livraison',
          error: 'Problème de paiement',
        }

        const messages = {
          info: 'Une nouvelle livraison est disponible dans votre zone.',
          success: 'La livraison #123 a été livrée avec succès.',
          warning: 'La livraison #456 est retardée de 15 minutes.',
          error: 'Le paiement pour la livraison #789 a échoué.',
        }

        addNotification({
          id: Date.now(),
          type,
          title: titles[type],
          message: messages[type],
          timestamp: new Date(),
        })
      }, 10000)

      // Stocker l'intervalle pour le nettoyage
      return interval
    }

    // Exposer les méthodes pour une utilisation externe
    const showNotification = (title, message, type = 'info') => {
      addNotification({
        id: Date.now(),
        type,
        title,
        message,
        timestamp: new Date(),
      })
    }

    // Initialiser au montage du composant
    onMounted(() => {
      // Initialiser la connexion WebSocket
      socket = initWebSocket()

      // Exposer les méthodes au parent via $refs
      const instance = getCurrentInstance()
      if (instance) {
        instance.exposed = {
          showNotification,
          dismissNotification,
          clearAllNotifications,
        }
      }
    })

    // Nettoyer les ressources au démontage du composant
    onUnmounted(() => {
      // Supprimer tous les timers
      Object.values(dismissTimers.value).forEach(timer => {
        clearTimeout(timer)
      })

      // Arrêter la simulation
      if (socket) {
        clearInterval(socket)
      }
    })

    return {
      notifications,
      visibleNotifications,
      dismissNotification,
      getTypeClass,
      getTypeIcon,
    }
  },
}
</script>

<style scoped>
.real-time-notifications {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  width: 350px;
  max-width: calc(100vw - 2rem);
}

.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  animation: slide-in 0.3s ease;
}

.notification-info {
  border-left: 4px solid #3b82f6;
}

.notification-success {
  border-left: 4px solid #10b981;
}

.notification-warning {
  border-left: 4px solid #f59e0b;
}

.notification-error {
  border-left: 4px solid #ef4444;
}

.notification-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
}

.notification-info .notification-icon {
  color: #3b82f6;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-warning .notification-icon {
  color: #f59e0b;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.875rem;
  color: #4b5563;
}

.notification-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  font-size: 0.875rem;
}

.notification-close:hover {
  color: #4b5563;
}

/* Animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .real-time-notifications {
    width: calc(100vw - 2rem);
  }
}
</style>
