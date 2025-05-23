"use client"

import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { login, register, getUserProfile } from "../services/api"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [userToken, setUserToken] = useState(null)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  // Charger le token et les informations utilisateur au démarrage
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken")
        if (token) {
          setUserToken(token)

          // Charger les informations de l'utilisateur
          const userData = await getUserProfile(token)
          setUser(userData)
          setUserRole(userData.role)
        }
      } catch (error) {
        console.error("Error loading auth state:", error)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAsync()
  }, [])

  // Fonction de connexion
  const signIn = async (phone, password) => {
    try {
      const response = await login(phone, password)
      const { access_token, token_type } = response

      // Stocker le token
      await AsyncStorage.setItem("userToken", access_token)
      setUserToken(access_token)

      // Charger les informations de l'utilisateur
      const userData = await getUserProfile(access_token)
      setUser(userData)
      setUserRole(userData.role)

      return userData
    } catch (error) {
      console.error("Login error:", error)
      throw new Error(error.message || "Erreur de connexion")
    }
  }

  // Fonction d'inscription
  const signUp = async (userData) => {
    try {
      const response = await register(userData)
      return response
    } catch (error) {
      console.error("Registration error:", error)
      throw new Error(error.message || "Erreur d'inscription")
    }
  }

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("userToken")
      setUserToken(null)
      setUser(null)
      setUserRole(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Fonction de mise à jour du profil
  const updateUserProfile = async (updatedData) => {
    try {
      // Implémenter la mise à jour du profil
      setUser({ ...user, ...updatedData })
      return user
    } catch (error) {
      console.error("Update profile error:", error)
      throw new Error(error.message || "Erreur de mise à jour du profil")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        user,
        userRole,
        signIn,
        signUp,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
