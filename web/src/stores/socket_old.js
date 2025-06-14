import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import io from 'socket.io-client'
import { WEBSOCKET_URL } from '@/config'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('socket', () => {
  // État
  const socket = ref(null)
  const connected = ref(false)
  const error = ref(null)

  // Getters
  const instance = computed(() => socket.value)
  const isConnected = computed(() => connected.value)

  // Actions
  function initSocket() {
    const authStore = useAuthStore()

    // Vérifier l'authentification
    if (!authStore.token) {
      error.value = 'Authentification requise pour établir une connexion WebSocket'
      return
    }

    // Fermer la connexion existante si elle existe
    if (socket.value) {
      socket.value.disconnect()
    }

    // Créer une nouvelle connexion
    const socketInstance = io(WEBSOCKET_URL, {
      auth: {
        token: authStore.token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Configurer les événements de connexion
    socketInstance.on('connect', () => {
      connected.value = true
      error.value = null
      console.log('WebSocket connecté')
    })

    socketInstance.on('connect_error', err => {
      connected.value = false
      error.value = `Erreur de connexion WebSocket: ${err.message}`
      console.error('WebSocket connect_error:', err)
    })

    socketInstance.on('disconnect', reason => {
      connected.value = false
      console.log('WebSocket déconnecté:', reason)
    })

    // Stocker l'instance
    socket.value = socketInstance

    return socketInstance
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  function reconnect() {
    disconnect()
    return initSocket()
  }

  return {
    // État
    socket,
    connected,
    error,

    // Getters
    instance,
    isConnected,

    // Actions
    initSocket,
    disconnect,
    reconnect,
  }
})
