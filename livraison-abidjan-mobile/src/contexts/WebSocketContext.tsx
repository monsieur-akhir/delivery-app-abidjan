"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { WS_URL } from "../config/environment"
import { useAuth } from "./AuthContext"
import { Snackbar } from 'react-native-paper'
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import jwtDecode from "jwt-decode"
import { getApiUrl } from "../config/environment"

export interface WebSocketMessage {
  type: string
  data?: Record<string, unknown>
}

export interface WebSocketContextType {
  connected: boolean
  sendMessage: (message: WebSocketMessage) => void
  lastMessage: WebSocketMessage | null
  subscribe: (channel: string, callback: (data: Record<string, unknown>) => void) => () => void
  unsubscribe: (channel: string) => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  lastMessage: null,
  subscribe: () => () => {},
  unsubscribe: () => {},
})

export const useWebSocket = () => useContext(WebSocketContext)

// Fonction utilitaire pour vérifier l'expiration du token
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return true;
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch {
    return true;
  }
}

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, checkTokenValidity, sessionExpired } = useAuth()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [subscriptions, setSubscriptions] = useState<{
    [key: string]: (data: any) => void
  }>({})
  const [showWsError, setShowWsError] = useState(false)

  const getWsUrl = () => {
    const url = `${WS_URL}/${user?.id}?token=${token}`
    if (__DEV__) {
      console.log('[WebSocket] URL:', url, 'user:', user, 'token:', token?.slice(0, 10) + '...')
    }
    return url
  }

  const connectWebSocket = useCallback(async () => {
    // Vérifier la validité du token avant de se connecter
    const isTokenStillValid = await checkTokenValidity();
    if (!isTokenStillValid || !token || !user || !user.id) {
      if (__DEV__) {
        console.log('[WebSocket] Connexion refusée : token invalide ou user manquant', { 
          tokenValid: isTokenStillValid,
          hasUser: !!user, 
          hasToken: !!token 
        })
      }
      setConnected(false)
      return
    }

    // Fermer la connexion existante si elle existe
    if (socket) {
      socket.close()
      setSocket(null)
    }

    const ws = new WebSocket(getWsUrl())

    ws.onopen = () => {
      if (__DEV__) console.log('[WebSocket] Connecté avec token valide')
      setConnected(true)
      setShowWsError(false)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setLastMessage(message)
        if (message.type && subscriptions[message.type]) {
          subscriptions[message.type](message.data)
        }
      } catch (error) {
        console.error('[WebSocket] Erreur parsing message:', error)
      }
    }

    ws.onclose = (event) => {
      if (__DEV__) console.log('[WebSocket] Déconnecté, code:', event.code, 'raison:', event.reason)
      setConnected(false)
      
      // Ne pas reconnecter si l'utilisateur est déconnecté ou le token expiré
      if (sessionExpired) {
        if (__DEV__) console.log('[WebSocket] Session expirée, pas de reconnexion')
        return
      }
      
      // Reconnexion automatique avec vérification du token
      setTimeout(async () => {
        const stillValid = await checkTokenValidity();
        if (stillValid && token && user && user.id) {
          if (__DEV__) console.log('[WebSocket] Tentative de reconnexion...')
          connectWebSocket()
        } else {
          if (__DEV__) console.log('[WebSocket] Token invalide, pas de reconnexion')
        }
      }, 5000)
    }

    ws.onerror = (error: any) => {
      if (__DEV__) console.error('[WebSocket] Erreur :', error)
      setShowWsError(true)
      ws.close()
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [token, user, subscriptions, checkTokenValidity, sessionExpired])

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Si la session a expiré, fermer le WebSocket
    if (sessionExpired) {
      if (socket) {
        socket.close()
        setSocket(null)
      }
      setConnected(false)
      return
    }
    
    if (token && user && user.id) {
      cleanup = connectWebSocket();
    } else {
      setConnected(false);
      if (socket) {
        socket.close()
        setSocket(null)
      }
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [token, user, connectWebSocket, sessionExpired]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket && connected) {
        socket.send(JSON.stringify(message))
      }
    },
    [socket, connected],
  )

  const subscribe = useCallback(
    (channel: string, callback: (data: any) => void) => {
      setSubscriptions((prev) => ({ ...prev, [channel]: callback }))
      return () => {
        unsubscribe(channel)
      }
    },
    [],
  )

  const unsubscribe = useCallback(
    (channel: string) => {
      setSubscriptions((prev) => {
        const newSubscriptions = { ...prev }
        delete newSubscriptions[channel]
        return newSubscriptions
      })
    },
    [],
  )

  return (
    <WebSocketContext.Provider
      value={{ connected, sendMessage, lastMessage, subscribe, unsubscribe }}
    >
      {children}
      <Snackbar
        visible={showWsError && !sessionExpired}
        onDismiss={() => setShowWsError(false)}
        duration={4000}
        style={{ backgroundColor: '#FF6B00', borderRadius: 8 }}
      >
        {sessionExpired 
          ? "Session expirée, veuillez vous reconnecter." 
          : "Connexion temps réel perdue, tentative de reconnexion..."}
      </Snackbar>
    </WebSocketContext.Provider>
  )
}