"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { login, register, verifyToken, getUserProfile } from "../services/api"

interface User {
  id: string
  full_name: string
  phone: string
  email?: string
  role: string
  profile_picture?: string
  commune?: string
  language_preference?: string
  rating?: number
  deliveries_completed?: number
  vehicle_type?: string
}

interface AuthContextType {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  userToken: string | null
  signIn: (phone: string, password: string) => Promise<void>
  signUp: (userData: RegisterUserData) => Promise<void>
  signOut: () => Promise<void>
  completeRegistration: () => Promise<void>
  updateUserData: (userData: Partial<User>) => void
}

interface AuthProviderProps {
  children: ReactNode
}

interface RegisterUserData {
  full_name: string
  phone: string
  email?: string
  password: string
  role: string
  commune?: string
  language_preference?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Charger le token depuis le stockage
        const token = await AsyncStorage.getItem("userToken")

        if (token) {
          // Vérifier si le token est valide
          const isValid = await verifyToken(token)

          if (isValid) {
            setUserToken(token)

            // Charger les données de l'utilisateur
            const userData = await getUserProfile()
            setUser(userData)
          } else {
            // Token invalide, supprimer
            await AsyncStorage.removeItem("userToken")
            await AsyncStorage.removeItem("userData")
          }
        }
      } catch (error) {
        console.error("Error bootstrapping auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAsync()
  }, [])

  // Connexion
  const signIn = async (phone: string, password: string): Promise<void> => {
    try {
      const response = await login(phone, password)

      // Sauvegarder le token
      await AsyncStorage.setItem("userToken", response.token)
      setUserToken(response.token)

      // Sauvegarder les données utilisateur
      await AsyncStorage.setItem("userData", JSON.stringify(response.user))
      setUser(response.user)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  // Inscription
  const signUp = async (userData: RegisterUserData): Promise<void> => {
    try {
      await register(userData)
      // L'utilisateur devra vérifier son numéro de téléphone avant de pouvoir se connecter
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  // Finaliser l'inscription après vérification OTP
  const completeRegistration = async (): Promise<void> => {
    try {
      // Récupérer les données utilisateur après vérification OTP
      const userData = await getUserProfile()

      // Sauvegarder les données utilisateur
      await AsyncStorage.setItem("userData", JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error("Complete registration error:", error)
      throw error
    }
  }

  // Déconnexion
  const signOut = async (): Promise<void> => {
    try {
      // Supprimer le token et les données utilisateur
      await AsyncStorage.removeItem("userToken")
      await AsyncStorage.removeItem("userData")

      setUserToken(null)
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  // Mettre à jour les données utilisateur
  const updateUserData = (userData: Partial<User>): void => {
    setUser((prevUser) => {
      if (!prevUser) return userData as User
      const updatedUser = { ...prevUser, ...userData }

      // Sauvegarder les données mises à jour
      AsyncStorage.setItem("userData", JSON.stringify(updatedUser)).catch((error) =>
        console.error("Error saving updated user data:", error),
      )

      return updatedUser
    })
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: !!userToken,
        user,
        userToken,
        signIn,
        signUp,
        signOut,
        completeRegistration,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
