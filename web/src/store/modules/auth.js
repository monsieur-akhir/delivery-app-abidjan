import { login, logout, getUser } from "@/api/auth"

const state = {
  token: localStorage.getItem("auth_token") || "",
  user: JSON.parse(localStorage.getItem("user_data")) || null,
  role: localStorage.getItem("user_role") || null,
  loading: false,
  error: null,
}

const getters = {
  isLoggedIn: (state) => !!state.token,
  currentUser: (state) => state.user,
  currentRole: (state) => state.role,
  isLoading: (state) => state.loading,
  authError: (state) => state.error,
}

const mutations = {
  setToken(state, token) {
    state.token = token
    localStorage.setItem("auth_token", token)
  },
  setUser(state, user) {
    state.user = user
    localStorage.setItem("user_data", JSON.stringify(user))
  },
  setRole(state, role) {
    state.role = role
    localStorage.setItem("user_role", role)
  },
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, error) {
    state.error = error
  },
  clearAuth(state) {
    state.token = ""
    state.user = null
    state.role = null
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    localStorage.removeItem("user_role")
  },
}

const actions = {
  async login({ commit }, credentials) {
    commit("setLoading", true)
    try {
      const response = await login(credentials)
      const token = response.access_token
      const user = response.user
      const role = response.user.role

      commit("setToken", token)
      commit("setUser", user)
      commit("setRole", role)
      commit("setError", null)
    } catch (error) {
      commit("setError", error.message)
      throw error
    } finally {
      commit("setLoading", false)
    }
  },

  async logout({ commit }) {
    try {
      await logout()
      commit("clearAuth")
    } catch (error) {
      console.error("Logout error:", error)
    }
  },

  async fetchUser({ commit }) {
    try {
      const response = await getUser()
      commit("setUser", response)
    } catch (error) {
      console.error("Fetch user error:", error)
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
