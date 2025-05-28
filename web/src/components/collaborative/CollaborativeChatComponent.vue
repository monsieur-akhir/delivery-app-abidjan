<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>Chat de livraison #{{ deliveryIdShort }}</h3>
      <div class="delivery-info" v-if="delivery">
        <span>{{ delivery.pickupCommune }} → {{ delivery.deliveryCommune }}</span>
      </div>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement des messages...</p>
      </div>

      <template v-else>
        <div v-for="(group, date) in groupedMessages" :key="date" class="message-group">
          <div class="date-header">
            <span>{{ formatDateHeader(date) }}</span>
          </div>
          <div
            v-for="message in group"
            :key="message.id"
            :class="['message', message.userId === currentUserId ? 'current-user' : 'other-user']"
          >
            <div v-if="message.userId !== currentUserId" class="avatar">
              <img v-if="message.userAvatar" :src="message.userAvatar" alt="Avatar" />
              <div v-else class="avatar-fallback">
                {{ message.userName.charAt(0) }}
              </div>
            </div>

            <div class="message-bubble">
              <div v-if="message.userId !== currentUserId" class="user-name">
                {{ message.userName }} ({{ formatUserRole(message.userRole) }})
              </div>
              <div class="message-text">{{ message.message }}</div>
              <div class="message-time">{{ formatTime(message.createdAt) }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="input-container">
      <textarea
        v-model="newMessage"
        placeholder="Tapez votre message..."
        @keydown.enter.prevent="sendMessage"
        :disabled="sending"
      ></textarea>
      <button @click="sendMessage" :disabled="sending || !newMessage.trim()">
        <span v-if="sending" class="spinner small"></span>
        <i v-else class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import collaborativeApi from '@/api/collaborative'

export default {
  name: 'CollaborativeChatComponent',

  props: {
    deliveryId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const socketStore = useSocketStore()
    const authStore = useAuthStore()

    const messages = ref([])
    const newMessage = ref('')
    const loading = ref(true)
    const sending = ref(false)
    const error = ref(null)
    const delivery = ref(null)
    const messagesContainer = ref(null)

    const currentUserId = computed(() => authStore.user?.id || '')

    const deliveryIdShort = computed(() => {
      return props.deliveryId.substring(0, 8)
    })

    // Grouper les messages par date
    const groupedMessages = computed(() => {
      const groups = {}

      messages.value.forEach(message => {
        const date = new Date(message.createdAt).toDateString()
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(message)
      })

      return groups
    })

    const fetchData = async () => {
      try {
        error.value = null
        loading.value = true

        // Récupérer les détails de la livraison
        const deliveryData = await collaborativeApi.getCollaborativeDelivery(props.deliveryId)
        delivery.value = deliveryData

        // Récupérer les messages du chat
        const messagesData = await collaborativeApi.getChatMessages(props.deliveryId)
        messages.value = messagesData
      } catch (err) {
        console.error('Erreur lors du chargement des données du chat:', err)
        error.value = 'Impossible de charger les messages. Veuillez réessayer.'
      } finally {
        loading.value = false
        scrollToBottom()
      }
    }

    const sendMessage = async () => {
      if (!newMessage.value.trim() || sending.value) return

      try {
        sending.value = true
        await collaborativeApi.sendChatMessage(props.deliveryId, newMessage.value.trim())
        newMessage.value = ''
      } catch (err) {
        console.error("Erreur lors de l'envoi du message:", err)
        error.value = "Impossible d'envoyer le message. Veuillez réessayer."
      } finally {
        sending.value = false
      }
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }

    const formatTime = dateString => {
      const date = new Date(dateString)
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const formatDateHeader = dateString => {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) {
        return "Aujourd'hui"
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Hier'
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      }
    }

    const formatUserRole = role => {
      switch (role) {
        case 'primary':
          return 'Principal'
        case 'secondary':
          return 'Secondaire'
        case 'support':
          return 'Support'
        default:
          return role
      }
    }

    // Configurer le WebSocket pour les messages en temps réel
    const setupWebSocket = () => {
      const socket = socketStore.instance

      if (socket) {
        socket.on(`chat_message_${props.deliveryId}`, message => {
          messages.value.push(message)
          scrollToBottom()
        })
      }
    }

    onMounted(() => {
      fetchData()
      // S'assurer que la connexion WebSocket est initialisée
      if (!socketStore.isConnected) {
        socketStore.initSocket()
      }
      setupWebSocket()
    })

    // Nettoyer les écouteurs WebSocket lors de la destruction du composant
    const cleanupWebSocket = () => {
      const socket = socketStore.instance

      if (socket) {
        socket.off(`chat_message_${props.deliveryId}`)
      }
    }

    // Appeler le nettoyage lors de la destruction du composant
    onUnmounted(() => {
      cleanupWebSocket()
    })

    // Surveiller les changements de messages pour faire défiler vers le bas
    watch(messages, () => {
      scrollToBottom()
    })

    return {
      messages,
      newMessage,
      loading,
      sending,
      error,
      delivery,
      messagesContainer,
      currentUserId,
      deliveryIdShort,
      groupedMessages,
      sendMessage,
      formatTime,
      formatDateHeader,
      formatUserRole,
    }
  },
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.delivery-info {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f9fafb;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

.spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.date-header {
  text-align: center;
  margin: 16px 0;
}

.date-header span {
  display: inline-block;
  padding: 4px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.message.current-user {
  flex-direction: row-reverse;
}

.avatar {
  margin-right: 8px;
}

.message.current-user .avatar {
  margin-right: 0;
  margin-left: 8px;
}

.avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.message-bubble {
  max-width: 70%;
  padding: 12px;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message.current-user .message-bubble {
  background-color: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.other-user .message-bubble {
  background-color: white;
  border-bottom-left-radius: 4px;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 4px;
}

.message-text {
  font-size: 16px;
  line-height: 1.4;
}

.message-time {
  font-size: 10px;
  text-align: right;
  margin-top: 4px;
  opacity: 0.7;
}

.input-container {
  display: flex;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background-color: white;
}

textarea {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 8px 16px;
  resize: none;
  max-height: 100px;
  font-family: inherit;
  font-size: 16px;
  outline: none;
}

textarea:focus {
  border-color: #3b82f6;
}

button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>
