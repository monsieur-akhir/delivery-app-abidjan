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
  const { user, token } = useAuth()
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

  const connectWebSocket = useCallback(() => {
    if (!token || !user || !user.id) {
      if (__DEV__) {
        console.log('[WebSocket] Connexion refusée : user ou token manquant', { user, token })
      }
      setShowWsError(true)
      setConnected(false)
      return
    }

    const ws = new WebSocket(getWsUrl())

    ws.onopen = () => {
      if (__DEV__) console.log('[WebSocket] Connecté')
      setConnected(true)
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

    ws.onclose = () => {
      if (__DEV__) console.log('[WebSocket] Déconnecté')
      setConnected(false)
      setTimeout(() => {
        if (token && user && user.id) {
          connectWebSocket()
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
  }, [token, user, subscriptions])

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (token && user && user.id) {
      cleanup = connectWebSocket();
    } else {
      setConnected(false);
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [token, user, connectWebSocket]);

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
        visible={showWsError}
        onDismiss={() => setShowWsError(false)}
        duration={4000}
        style={{ backgroundColor: '#FF6B00', borderRadius: 8 }}
      >
        Connexion temps réel perdue, veuillez vous reconnecter.
      </Snackbar>
    </WebSocketContext.Provider>
  )
}