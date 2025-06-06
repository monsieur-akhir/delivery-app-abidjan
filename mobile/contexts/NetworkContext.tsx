"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import NetInfo from "@react-native-community/netinfo"
import type { PendingOperation } from "../types/models"

interface NetworkContextType {
  isConnected: boolean
  isOfflineMode: boolean
  pendingUploads: PendingOperation[]
  pendingDownloads: PendingOperation[]
  addPendingUpload: (operation: Omit<PendingOperation, "timestamp" | "id">) => void
  synchronizeData: () => Promise<boolean>
  toggleOfflineMode: (enabled: boolean) => void
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

interface NetworkProviderProps {
  children: ReactNode
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<PendingOperation[]>([])
  const [pendingDownloads] = useState<PendingOperation[]>([])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false)
    })

    return () => unsubscribe()
  }, [])

  const addPendingUpload = (operation: Omit<PendingOperation, "timestamp" | "id">) => {
    const newOperation: PendingOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setPendingUploads((prev) => [...prev, newOperation])
  }

  const synchronizeData = async (): Promise<boolean> => {
    try {
      // Implement synchronization logic here
      return true
    } catch (error) {
      console.error("Synchronization failed:", error)
      return false
    }
  }

  const toggleOfflineMode = (enabled: boolean) => {
    setIsOfflineMode(enabled)
  }

  const value: NetworkContextType = {
    isConnected,
    isOfflineMode,
    pendingUploads,
    pendingDownloads,
    addPendingUpload,
    synchronizeData,
    toggleOfflineMode,
  }

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider")
  }
  return context
}

export const useNetworkContext = useNetwork
