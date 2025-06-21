"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { WS_URL } from "../config/environment"
import { useAuth } from "./AuthContext"
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

  // Fonction pour rafraîchir le token si besoin
  const refreshTokenIfNeeded = async (token: string | null): Promise<string | null> => {
    if (!token || isTokenExpired(token)) {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) return null;
      try {
        const response = await axios.post(`${getApiUrl()}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = response.data;
        await AsyncStorage.setItem("token", access_token);
        await AsyncStorage.setItem("refreshToken", refresh_token);
        return access_token;
      } catch (e) {
        return null;
      }
    }
    return token;
  };

  const getWsUrl = (validToken: string) => {
    return `${WS_URL}/${user?.id}?token=${validToken}`
  }

  const connectWebSocket = useCallback(async () => {
    const validToken = await refreshTokenIfNeeded(token);
    if (!validToken || !user) return;

    const ws = new WebSocket(getWsUrl(validToken))

    ws.onopen = () => {
      console.log("WebSocket connected")
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setLastMessage(message)

        // Notify subscribers about the new message
        if (message.type && subscriptions[message.type]) {
          subscriptions[message.type](message.data)
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
      setConnected(false)
      // Try to reconnect after a delay
      setTimeout(() => {
        if (token && user) {
          connectWebSocket()
        }
      }, 5000)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      ws.close()
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [token, user, subscriptions])

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      if (token && user) {
        cleanup = await connectWebSocket();
      } else {
        setConnected(false);
      }
    })();
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
    </WebSocketContext.Provider>
  )
}