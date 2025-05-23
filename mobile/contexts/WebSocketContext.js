"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { useAuth } from "./AuthContext"
import { useNetwork } from "./NetworkContext"

const WebSocketContext = createContext()

export const useWebSocket = () => useContext(WebSocketContext)

export const WebSocketProvider = ({ children }) => {
  const { userToken, user } = useAuth()
  const { isConnected } = useNetwork()

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  const socket = useRef(null)
  const reconnectTimeout = useRef(null)
  const subscriptions = useRef({})

  // Établir la connexion WebSocket
  const connect = () => {
    if (!userToken || !isConnected || isConnecting || socket.current) return

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
        if (isConnected) {
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
  const disconnect = () => {
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
  const send = (data) => {
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
  const subscribe = (channel, callback) => {
    if (!subscriptions.current[channel]) {
      subscriptions.current[channel] = []

      // Envoyer une demande d'abonnement au serveur
      if (isConnected) {
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
  const unsubscribe = (subscription) => {
    if (!subscription || !subscription.channel || !subscriptions.current[subscription.channel]) {
      return false
    }

    // Supprimer le callback de la liste des abonnés
    subscriptions.current[subscription.channel].splice(subscription.index, 1)

    // Si plus aucun abonné, envoyer une demande de désabonnement au serveur
    if (subscriptions.current[subscription.channel].length === 0) {
      delete subscriptions.current[subscription.channel]

      if (isConnected) {
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
    if (userToken && isConnected && !socket.current) {
      connect()
    } else if ((!userToken || !isConnected) && socket.current) {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [userToken, isConnected])

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
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
