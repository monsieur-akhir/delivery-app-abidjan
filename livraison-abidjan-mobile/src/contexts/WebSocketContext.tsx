"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { WS_URL } from "../config/environment"
import { useAuth } from "./AuthContext"
import { useNotification } from "./NotificationContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { jwtDecode } from 'jwt-decode'
// Correction du type WebSocketMessage
type WebSocketMessage = {
  type: string
  data?: Record<string, unknown>
}

export interface WebSocketContextType {
  connected: boolean
  sendMessage: (message: WebSocketMessage) => void
  lastMessage: WebSocketMessage | null
  subscribe: (channel: string, callback: (data: Record<string, unknown>) => void) => () => void
  unsubscribe: (channel: string) => void
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  lastMessage: null,
  subscribe: () => () => {},
  unsubscribe: () => {},
  connect: () => {},
  disconnect: () => {},
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
  const { sendLocalNotification } = useNotification()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [connected, setConnected] = useState<boolean>(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [subscriptions, setSubscriptions] = useState<{ [key: string]: (data: any) => void }>({})

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.close(1000, "Déconnexion manuelle")
      socketRef.current = null
    }
    setConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!token || !user || sessionExpired || socketRef.current) {
      return
    }

    const wsUrl = `${WS_URL}/${user.id}?token=${token}`
    console.log("[WebSocket] Tentative de connexion à", wsUrl)
    
    const ws = new WebSocket(wsUrl)
    socketRef.current = ws

    ws.onopen = () => {
      console.log("[WebSocket] Connexion établie.")
      setConnected(true)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
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

    ws.onerror = (error) => {
      console.error("[WebSocket] Erreur:", error)
      sendLocalNotification("Erreur de Connexion", "La connexion temps réel a été perdue. Tentative de reconnexion...")
    }

    ws.onclose = (event) => {
      console.log(`[WebSocket] Connexion fermée (code: ${event.code}).`)
      setConnected(false)
      socketRef.current = null
      
      if (!sessionExpired && event.code !== 1000) {
        sendLocalNotification("Connexion Perdue", "Tentative de reconnexion en cours...")
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
    }
  }, [token, user, sessionExpired, sendLocalNotification])

  useEffect(() => {
    // À chaque changement de token ou d'utilisateur, on ferme et on rouvre la connexion WebSocket
    disconnect();
    if (token && user && !sessionExpired) {
      connect();
    }
    return () => {
      disconnect();
    }
  }, [token, user, sessionExpired]);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socketRef.current && connected) {
        socketRef.current.send(JSON.stringify(message))
      }
    },
    [connected],
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

  const contextValue: WebSocketContextType = {
    connected,
    sendMessage,
    lastMessage,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}