import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  login as apiLogin,
  register as apiRegister,
  getUserProfile as apiGetUserProfile,
  refreshToken as apiRefreshToken,
  logout as apiLogout,
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // État
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.full_name || '')
  const userInitials = computed(() => {
    if (!user.value?.full_name) return ''
    return user.value.full_name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
  })

  // Actions
  const login = (userData, userToken) => {
    user.value = userData
    token.value = userToken
    localStorage.setItem('token', userToken)
  }

  const logout = () => {
    apiLogout()
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  const updateUser = userData => {
    user.value = { ...user.value, ...userData }
  }

  async function initAuth() {
    if (token.value) {
      await fetchUserProfile()
    }
  }

  async function loginUser(credentials) {
    try {
      loading.value = true
      error.value = null

      const response = await apiLogin(credentials)
      login(response.user, response.access_token)

      await fetchUserProfile()

      return true
    } catch (err) {
      error.value = err.message || 'Erreur de connexion'
      return false
    } finally {
      loading.value = false
    }
  }

  async function registerUser(userData) {
    try {
      loading.value = true
      error.value = null

      await apiRegister(userData)

      return true
    } catch (err) {
      error.value = err.message || "Erreur d'inscription"
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUserProfile() {
    try {
      loading.value = true
      error.value = null

      const userData = await apiGetUserProfile()
      updateUser(userData)

      return userData
    } catch (err) {
      error.value = err.message || 'Erreur de chargement du profil'
      logout()
      return null
    } finally {
      loading.value = false
    }
  }

  async function refreshUserToken() {
    try {
      loading.value = true
      error.value = null

      const response = await apiRefreshToken()
      login(user.value, response.access_token)

      return true
    } catch (err) {
      error.value = err.message || 'Erreur de rafraîchissement du token'
      logout()
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // État
    user,
    token,
    loading,
    error,

    // Getters
    isAuthenticated,
    userRole,
    userName,
    userInitials,

    // Actions
    initAuth,
    loginUser,
    registerUser,
    fetchUserProfile,
    refreshUserToken,
    login,
    logout,
    updateUser,
  }
})
