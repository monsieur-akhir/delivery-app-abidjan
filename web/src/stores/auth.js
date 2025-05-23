import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { login, register, getUserProfile, refreshToken, logout } from "@/api/auth"

export const useAuthStore = defineStore("auth", () => {
  // État
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.full_name || "")
  const userInitials = computed(() => {
    if (!user.value?.full_name) return ""
    return user.value.full_name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
  })

  // Actions
  async function initAuth() {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      token.value = storedToken
      await fetchUserProfile()
    }
  }

  async function loginUser(credentials) {
    try {
      loading.value = true
      error.value = null

      const response = await login(credentials)
      token.value = response.access_token
      localStorage.setItem("token", response.access_token)

      await fetchUserProfile()

      return true
    } catch (err) {
      error.value = err.message || "Erreur de connexion"
      return false
    } finally {
      loading.value = false
    }
  }

  async function registerUser(userData) {
    try {
      loading.value = true
      error.value = null

      await register(userData)

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

      const userData = await getUserProfile()
      user.value = userData

      return userData
    } catch (err) {
      error.value = err.message || "Erreur de chargement du profil"
      logoutUser()
      return null
    } finally {
      loading.value = false
    }
  }

  async function refreshUserToken() {
    try {
      loading.value = true
      error.value = null

      const response = await refreshToken()
      token.value = response.access_token
      localStorage.setItem("token", response.access_token)

      return true
    } catch (err) {
      error.value = err.message || "Erreur de rafraîchissement du token"
      logoutUser()
      return false
    } finally {
      loading.value = false
    }
  }

  function logoutUser() {
    // Appeler l'API de déconnexion si nécessaire
    logout()

    // Nettoyer l'état local
    user.value = null
    token.value = null
    localStorage.removeItem("token")
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
    logoutUser,
  }
})
