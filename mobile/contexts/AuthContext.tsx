"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { login, register, verifyOTP } from "../services/api"
import axios from "axios"
import { API_URL } from "../config/environment"
import type { User } from "../types/models"
import type { RegisterUserData } from "../services/api"

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  signIn: (phone: string, password: string) => Promise<void>
  signUp: (userData: RegisterUserData) => Promise<void>
  verify: (phone: string, otp: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserData: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  verify: async () => {},
  signOut: async () => {},
  updateUserData: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user")
        const storedToken = await AsyncStorage.getItem("token")

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser))
          setToken(storedToken)

          // Refresh token if needed
          try {
            const refreshedToken = await tryRefreshToken()
            if (refreshedToken) {
              setToken(refreshedToken)
              await AsyncStorage.setItem("token", refreshedToken)
            }
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError)
            // If refresh fails, we'll keep using the old token
          }
        }
      } catch (e) {
        console.error("Error loading user data:", e)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Fonction utilitaire locale pour rafraîchir le token
  const tryRefreshToken = async (): Promise<string | null> => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: await AsyncStorage.getItem("refreshToken"),
      })
      const { access_token, refresh_token } = response.data
      await AsyncStorage.setItem("authToken", access_token)
      await AsyncStorage.setItem("refreshToken", refresh_token)
      return access_token
    } catch (error) {
      console.error("Error refreshing token:", error)
      return null
    }
  }

  const signIn = async (phone: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { user: userData, token: authToken } = await login(phone, password)
      setUser(userData)
      setToken(authToken)
      await AsyncStorage.setItem("user", JSON.stringify(userData))
      await AsyncStorage.setItem("token", authToken)
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred during sign in")
      throw e
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (userData: RegisterUserData) => {
    setLoading(true)
    setError(null)
    try {
      await register(userData)
      // After registration, user needs to verify OTP
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred during sign up")
      throw e
    } finally {
      setLoading(false)
    }
  }

  const verify = async (phone: string, otp: string) => {
    setLoading(true)
    setError(null)
    try {
      await verifyOTP(phone, otp)
      // Après vérification OTP, il faut recharger l'utilisateur et le token depuis le backend ou le storage
      // Ici, on suppose que l'utilisateur doit se reconnecter ou que l'API met à jour le storage
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred during verification")
      throw e
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    setToken(null)
    await AsyncStorage.removeItem("user")
    await AsyncStorage.removeItem("token")
  }

  const updateUserData = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      AsyncStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, signIn, signUp, verify, signOut, updateUserData }}>
      {children}
    </AuthContext.Provider>
  )
}
