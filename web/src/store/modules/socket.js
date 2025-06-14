import io from 'socket.io-client'
import config from '@/config'

const state = {
  socket: null,
  connected: false,
  error: null,
}

const getters = {
  instance: state => state.socket,
  isConnected: state => state.connected,
  error: state => state.error,
}

const mutations = {
  SET_SOCKET(state, socket) {
    state.socket = socket
  },
  SET_CONNECTED(state, status) {
    state.connected = status
  },
  SET_ERROR(state, error) {
    state.error = error
  },
}

const actions = {
  // Initialiser la connexion WebSocket
  initSocket({ commit, rootGetters }) {
    // Récupérer le token d'authentification
    const token = rootGetters['auth/token']

    if (!token) {
      commit('SET_ERROR', 'Authentification requise pour établir une connexion WebSocket')
      return
    }

    // Fermer la connexion existante si elle existe
    if (state.socket) {
      state.socket.disconnect()
    }

    // Créer une nouvelle connexion
    const socket = io(config.WEBSOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Configurer les écouteurs d'événements
    socket.on('connect', () => {
      commit('SET_CONNECTED', true)
      commit('SET_ERROR', null)
      console.log('WebSocket connected')
    })

    socket.on('disconnect', reason => {
      commit('SET_CONNECTED', false)
      console.log(`WebSocket disconnected: ${reason}`)
    })

    socket.on('connect_error', error => {
      commit('SET_CONNECTED', false)
      commit('SET_ERROR', `Erreur de connexion WebSocket: ${error.message}`)
      console.error('WebSocket connection error:', error)
    })

    // Stocker l'instance de socket
    commit('SET_SOCKET', socket)
  },

  // Déconnecter le WebSocket
  disconnect({ commit, state }) {
    if (state.socket) {
      state.socket.disconnect()
      commit('SET_SOCKET', null)
      commit('SET_CONNECTED', false)
    }
  },

  // S'abonner à un canal spécifique
  subscribe({ state }, { channel, callback }) {
    if (state.socket && state.connected) {
      state.socket.on(channel, callback)
    }
  },

  // Se désabonner d'un canal
  unsubscribe({ state }, { channel, callback }) {
    if (state.socket) {
      if (callback) {
        state.socket.off(channel, callback)
      } else {
        state.socket.off(channel)
      }
    }
  },

  // Émettre un événement
  emit({ state }, { event, data }) {
    if (state.socket && state.connected) {
      state.socket.emit(event, data)
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
