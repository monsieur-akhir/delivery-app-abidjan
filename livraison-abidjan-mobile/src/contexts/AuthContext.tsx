"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types/models';
import type { RegisterUserData } from '../services/api';
import { login, register, verifyOTP, sendOTP as sendOTPRequest } from '../services/api';
import { API_BASE_URL } from '../config';
import AuthService from '../services/AuthService';

// Fonction utilitaire pour vérifier la validité des objets
const isValidObject = (obj: any): boolean => {
  return obj !== null && obj !== undefined && typeof obj === 'object';
};

// Fonction utilitaire pour vérifier l'expiration du token
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return true;
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch {
    return true;
  }
};

export interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  sessionExpired: boolean
  setSessionExpired: (expired: boolean) => void
  signIn: (phone: string, password: string) => Promise<void>
  signUp: (userData: RegisterUserData) => Promise<void>
  sendOTP: (phone: string, otpType: 'registration' | 'login' | 'password_reset') => Promise<void>
  verify: (phone: string, otp: string) => Promise<void>
  signOut: (expired?: boolean) => Promise<void>
  updateUserData: (data: Partial<User>) => void
  setAuthData: (user: User, token: string, refreshToken?: string) => Promise<void>
  checkTokenValidity: () => Promise<boolean>
  isTokenValid: () => boolean
  refreshAccessToken: () => Promise<boolean>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  sessionExpired: false,
  setSessionExpired: () => {},
  signIn: async () => {},
  signUp: async () => {},
  sendOTP: async () => {},
  verify: async () => {},
  signOut: async () => {},
  updateUserData: () => {},
  setAuthData: async () => {},
  checkTokenValidity: async () => false,
  isTokenValid: () => false,
  refreshAccessToken: async () => false,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Vérifier si le token est valide
  const isTokenValid = (): boolean => {
    return !isTokenExpired(token);
  };

  // Rafraîchit le token d'accès si expiré
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      const { access_token, refresh_token } = await AuthService["refreshAccessToken"](refreshToken);
      setToken(access_token);
      await AsyncStorage.setItem('token', access_token);
      if (refresh_token) {
        await AsyncStorage.setItem('refreshToken', refresh_token);
      }
      return true;
    } catch (e) {
      console.error('[Auth] Erreur lors du refresh token:', e);
      await signOut(true);
      return false;
    }
  };

  // Vérifier la validité du token et tenter un refresh si expiré
  const checkTokenValidity = async (): Promise<boolean> => {
    if (!token || isTokenExpired(token)) {
      console.log('[Auth] Token expiré, tentative de refresh...');
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        console.log('[Auth] Refresh token échoué, déconnexion.');
        await signOut(true);
        return false;
      }
      return true;
    }
    return true;
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user")
        const storedToken = await AsyncStorage.getItem("token")
        console.log('[AUTH][LOAD] storedUser:', storedUser)
        console.log('[AUTH][LOAD] storedToken:', storedToken)
        if (storedUser && storedToken) {
          if (isTokenExpired(storedToken)) {
            console.log('[Auth] Token stocké expiré, nettoyage');
            await signOut(true);
          } else {
            setUser(JSON.parse(storedUser))
            setToken(storedToken)
            console.log('[AUTH][LOAD] setUser & setToken effectués');
          }
        }
      } catch (e) {
        console.error("Error loading user data:", e)
        await signOut();
      } finally {
        setLoading(false)
        console.log('[AUTH][LOAD] loading terminé');
      }
    }
    loadUserData()
  }, [])

  // Ajout de logs lors de la mise à jour du token
  useEffect(() => {
    console.log('[AUTH][CTX] user:', user)
    console.log('[AUTH][CTX] token:', token)
  }, [user, token])

  // Vérification périodique du token toutes les 30 secondes
  useEffect(() => {
    if (!token || !user) return;

    const interval = setInterval(async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        console.log('[Auth] Token invalide détecté lors de la vérification périodique');
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(interval);
  }, [token, user])

  const fetchUserFromAPI = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération du profil utilisateur');
    return await response.json();
  };

  const signIn = async (phone: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const loginResult = await login(phone, password)
      const authToken = loginResult.token
      const userData = await fetchUserFromAPI(authToken)
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
    // Ne pas changer l'état loading global pour éviter le démontage du composant
    // setLoading(true)
    setError(null)
    try {
      await register(userData)
      // After registration, user needs to verify OTP
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred during sign up")
      throw e
    } finally {
      // Ne pas changer l'état loading global
      // setLoading(false)
    }
  }

  const sendOTP = async (phone: string, otpType: 'registration' | 'login' | 'password_reset' = 'login') => {
    // Ne pas changer l'état loading global pour éviter le démontage du composant
    // setLoading(true)
    setError(null)
    try {
      await sendOTPRequest(phone, otpType)
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred while sending OTP")
      throw e
    } finally {
      // Ne pas changer l'état loading global
      // setLoading(false)
    }
  }

  const verify = async (phone: string, otp: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await verifyOTP(phone, otp)
      if (result.success && result.token && result.user) {
        setUser(result.user)
        setToken(result.token)
        await AsyncStorage.setItem("user", JSON.stringify(result.user))
        await AsyncStorage.setItem("token", result.token)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred during verification")
      throw e
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (expired?: boolean) => {
    setUser(null)
    setToken(null)
    await AsyncStorage.removeItem("user")
    await AsyncStorage.removeItem("token")
    await AsyncStorage.removeItem("refreshToken")
    if (expired) setSessionExpired(true)
    // La redirection est gérée par la navigation conditionnelle dans AppNavigator
  }

  const updateUserData = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data }
      setUser(updatedUser)
      AsyncStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const setAuthData = async (user: User, token: string, refreshToken?: string) => {
    try {
      setUser(user)
      setToken(token)
      await AsyncStorage.setItem("user", JSON.stringify(user))
      await AsyncStorage.setItem("token", token)
      if (refreshToken) {
        await AsyncStorage.setItem("refreshToken", refreshToken)
      }
    } catch (error) {
      console.error("Failed to save auth data to storage", error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      error, 
      sessionExpired, 
      setSessionExpired, 
      signIn, 
      signUp, 
      sendOTP,
      verify, 
      signOut, 
      updateUserData, 
      setAuthData,
      checkTokenValidity,
      isTokenValid,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}