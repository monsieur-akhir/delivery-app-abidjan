"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { useNetwork } from "./NetworkContext"

interface Subscription {
  channel: string
  index: number
}

interface WebSocketContextType {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => void
  disconnect: () => void
  send: (data: any) => boolean
  subscribe: (channel: string, callback: (data: any) => void) => Subscription
  unsubscribe: (subscription: Subscription) => boolean
}

interface WebSocketProviderProps {
  children: ReactNode
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { userToken, user } = useAuth()
  const { isConnected: isNetworkConnected } = useNetwork()

  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const socket = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const subscriptions = useRef<Record<string, ((data: any) => void)[]>>({})

  // Établir la connexion WebSocket
  const connect = (): void => {
    if (!userToken || !isNetworkConnected || isConnecting || socket.current) return

    try {
      setIsConnecting(true)

      // Créer une nouvelle connexion WebSocket
      const wsUrl = `wss://api.livraison-abidjan.com/ws?token=${userToken}`
      socket.current = new WebSocket(wsUrl)

      // Gestionnaire d'ouverture de connexion
      socket.current.onopen = () => {
        console.log("WebSocket connection established")
        setIsConnecting(false)
        setError(null)
      }

      // Gestionnaire de messages
      socket.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Traiter les messages en fonction de leur type
          if (data.type === "ping") {
            // Répondre au ping pour maintenir la connexion active
            send({ type: "pong" })
          } else if (data.channel && subscriptions.current[data.channel]) {
            // Distribuer le message aux abonnés du canal
            subscriptions.current[data.channel].forEach((callback) => {
              callback(data)
            })
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      // Gestionnaire d'erreur
      socket.current.onerror = (event) => {
        console.error("WebSocket error:", event)
        setError("WebSocket connection error")
      }

      // Gestionnaire de fermeture
      socket.current.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason)
        socket.current = null

        // Tenter de se reconnecter après un délai
        if (isNetworkConnected) {
          reconnectTimeout.current = setTimeout(() => {
            connect()
          }, 5000) // Reconnecter après 5 secondes
        }
      }
    } catch (error) {
      console.error("Error establishing WebSocket connection:", error)
      setError("Failed to establish WebSocket connection")
      setIsConnecting(false)
    }
  }

  // Fermer la connexion WebSocket
  const disconnect = (): void => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }

    if (socket.current) {
      socket.current.close()
      socket.current = null
    }

    subscriptions.current = {}
  }

  // Envoyer un message via WebSocket
  const send = (data: any): boolean => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected")
      return false
    }

    try {
      socket.current.send(JSON.stringify(data))
      return true
    } catch (error) {
      console.error("Error sending WebSocket message:", error)
      return false
    }
  }

  // S'abonner à un canal
  const subscribe = (channel: string, callback: (data: any) => void): Subscription => {
    if (!subscriptions.current[channel]) {
      subscriptions.current[channel] = []

      // Envoyer une demande d'abonnement au serveur
      if (isNetworkConnected) {
        send({
          type: "subscribe",
          channel,
          user_id: user?.id,
        })
      }
    }

    // Ajouter le callback à la liste des abonnés
    subscriptions.current[channel].push(callback)

    // Retourner un identifiant d'abonnement pour permettre la désinscription
    return {
      channel,
      index: subscriptions.current[channel].length - 1,
    }
  }

  // Se désabonner d'un canal
  const unsubscribe = (subscription: Subscription): boolean => {
    if (!subscription || !subscription.channel || !subscriptions.current[subscription.channel]) {
      return false
    }

    // Supprimer le callback de la liste des abonnés
    subscriptions.current[subscription.channel].splice(subscription.index, 1)

    // Si plus aucun abonné, envoyer une demande de désabonnement au serveur
    if (subscriptions.current[subscription.channel].length === 0) {
      delete subscriptions.current[subscription.channel]

      if (isNetworkConnected) {
        send({
          type: "unsubscribe",
          channel: subscription.channel,
          user_id: user?.id,
        })
      }
    }

    return true
  }

  // Connecter/déconnecter en fonction de l'état de l'authentification et de la connexion réseau
  useEffect(() => {
    if (userToken && isNetworkConnected && !socket.current) {
      connect()
    } else if ((!userToken || !isNetworkConnected) && socket.current) {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [userToken, isNetworkConnected])

  return (
    <WebSocketContext.Provider
      value={{
        isConnected: !!socket.current && socket.current.readyState === WebSocket.OPEN,
        isConnecting,
        error,
        connect,
        disconnect,
        send,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
