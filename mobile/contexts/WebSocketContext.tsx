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
    // Vérifier si le token expire dans les 5 prochaines minutes
    return decoded.exp < (now + 300);
  } catch {
    return true;
  }
}

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, logout } = useAuth()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [subscriptions, setSubscriptions] = useState<{
    [key: string]: (data: any) => void
  }>({})
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Fonction pour rafraîchir le token si besoin
  const refreshTokenIfNeeded = async (currentToken: string | null): Promise<string | null> => {
    if (isRefreshing) return currentToken;

    if (!currentToken || isTokenExpired(currentToken)) {
      setIsRefreshing(true);
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.log('[WebSocket] Pas de refresh token, déconnexion nécessaire');
          await logout();
          return null;
        }
        
        const response = await axios.post(`${getApiUrl()}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token: newRefreshToken } = response.data;
        await AsyncStorage.setItem("token", access_token);
        await AsyncStorage.setItem("refreshToken", newRefreshToken);
        console.log('[WebSocket] Token rafraîchi avec succès');
        return access_token;
      } catch (e) {
        console.log('[WebSocket] Échec du rafraîchissement du token, déconnexion');
        await logout();
        return null;
      } finally {
        setIsRefreshing(false);
      }
    }
    return currentToken;
  };

  const getWsUrl = (validToken: string) => {
    return `${WS_URL}/${user?.id}?token=${validToken}`
  }

  const connectWebSocket = useCallback(async () => {
    if (isRefreshing) return;

    const validToken = await refreshTokenIfNeeded(token);
    if (!validToken || !user) {
      console.log('[WebSocket] Token invalide ou utilisateur absent, arrêt de la connexion');
      setConnected(false);
      return;
    }

    console.log('[WebSocket] Tentative de connexion avec token valide');
    const ws = new WebSocket(getWsUrl(validToken))

    ws.onopen = () => {
      console.log("[WebSocket] Connexion établie avec succès")
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
        console.error("[WebSocket] Erreur parsing message:", error)
      }
    }

    ws.onclose = (event) => {
      console.log(`[WebSocket] Connexion fermée - Code: ${event.code}, Raison: ${event.reason}`)
      setConnected(false)
      
      // Si c'est une erreur 403 (token expiré), ne pas reconnecter automatiquement
      if (event.code === 1008 || event.reason?.includes('Authentication')) {
        console.log('[WebSocket] Erreur d\'authentification, déconnexion de l\'utilisateur');
        logout();
        return;
      }
      
      // Essayer de reconnecter après un délai seulement si l'utilisateur est toujours connecté
      setTimeout(async () => {
        const currentToken = await AsyncStorage.getItem("token");
        if (currentToken && user && !isTokenExpired(currentToken)) {
          console.log('[WebSocket] Tentative de reconnexion...');
          connectWebSocket();
        }
      }, 5000)
    }

    ws.onerror = (error) => {
      console.error("[WebSocket] Erreur de connexion:", error)
      setConnected(false)
      ws.close()
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [token, user, subscriptions, isRefreshing, logout])

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let tokenCheckInterval: NodeJS.Timeout;

    (async () => {
      if (token && user) {
        cleanup = await connectWebSocket();
        
        // Vérifier le token toutes les 5 minutes
        tokenCheckInterval = setInterval(async () => {
          const currentToken = await AsyncStorage.getItem("token");
          if (currentToken && isTokenExpired(currentToken)) {
            console.log('[WebSocket] Token expiré détecté, tentative de rafraîchissement...');
            const newToken = await refreshTokenIfNeeded(currentToken);
            if (!newToken) {
              console.log('[WebSocket] Impossible de rafraîchir le token, fermeture WebSocket');
              if (socket) {
                socket.close();
              }
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        setConnected(false);
      }
    })();

    return () => {
      if (cleanup) cleanup();
      if (tokenCheckInterval) clearInterval(tokenCheckInterval);
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