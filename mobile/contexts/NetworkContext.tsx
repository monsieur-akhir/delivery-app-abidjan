"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"
import { useTranslation } from "react-i18next"

interface PendingOperation {
  type: string
  data: any
  timestamp: string
}

interface NetworkContextType {
  isConnected: boolean
  isOfflineMode: boolean
  toggleOfflineMode: (value?: boolean) => void
  pendingUploads: PendingOperation[]
  pendingDownloads: PendingOperation[]
  addPendingUpload: (operation: Omit<PendingOperation, "timestamp">) => void
  addPendingDownload: (operation: Omit<PendingOperation, "timestamp">) => void
  synchronizeData: () => Promise<boolean>
  clearPendingData: () => Promise<boolean>
}

interface NetworkProviderProps {
  children: ReactNode
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider")
  }
  return context
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const { t } = useTranslation()
  const [isConnected, setIsConnected] = useState<boolean>(true)
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false)
  const [pendingUploads, setPendingUploads] = useState<PendingOperation[]>([])
  const [pendingDownloads, setPendingDownloads] = useState<PendingOperation[]>([])

  const netInfoUnsubscribe = useRef<(() => void) | null>(null)

  // Charger l'état du mode hors ligne et les opérations en attente au démarrage
  useEffect(() => {
    const loadOfflineState = async () => {
      try {
        const offlineMode = await AsyncStorage.getItem("offlineMode")
        if (offlineMode === "true") {
          setIsOfflineMode(true)
        }

        const uploads = await AsyncStorage.getItem("pendingUploads")
        if (uploads) {
          setPendingUploads(JSON.parse(uploads))
        }

        const downloads = await AsyncStorage.getItem("pendingDownloads")
        if (downloads) {
          setPendingDownloads(JSON.parse(downloads))
        }
      } catch (error) {
        console.error("Error loading offline state:", error)
      }
    }

    loadOfflineState()
  }, [])

  // Surveiller l'état de la connexion
  useEffect(() => {
    netInfoUnsubscribe.current = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected !== null ? state.isConnected : false
      setIsConnected(connected)

      // Proposer la synchronisation si la connexion est rétablie et qu'il y a des données en attente
      if (connected && !isOfflineMode && (pendingUploads.length > 0 || pendingDownloads.length > 0)) {
        Alert.alert(t("network.connectionRestored"), t("network.syncData"), [
          {
            text: t("common.later"),
            style: "cancel",
          },
          {
            text: t("common.sync"),
            onPress: synchronizeData,
          },
        ])
      }
    })

    return () => {
      if (netInfoUnsubscribe.current) {
        netInfoUnsubscribe.current()
      }
    }
  }, [isOfflineMode, pendingUploads.length, pendingDownloads.length, t])

  // Activer/désactiver le mode hors ligne
  const toggleOfflineMode = (value?: boolean): void => {
    const newValue = value !== undefined ? value : !isOfflineMode
    setIsOfflineMode(newValue)
    AsyncStorage.setItem("offlineMode", newValue.toString()).catch((error) =>
      console.error("Error saving offline mode:", error),
    )
  }

  // Ajouter une opération en attente d'upload
  const addPendingUpload = (operation: Omit<PendingOperation, "timestamp">): void => {
    const newOperation: PendingOperation = {
      ...operation,
      timestamp: new Date().toISOString(),
    }

    setPendingUploads((prev) => {
      const updated = [...prev, newOperation]
      AsyncStorage.setItem("pendingUploads", JSON.stringify(updated)).catch((error) =>
        console.error("Error saving pending uploads:", error),
      )
      return updated
    })
  }

  // Ajouter une opération en attente de download
  const addPendingDownload = (operation: Omit<PendingOperation, "timestamp">): void => {
    const newOperation: PendingOperation = {
      ...operation,
      timestamp: new Date().toISOString(),
    }

    setPendingDownloads((prev) => {
      const updated = [...prev, newOperation]
      AsyncStorage.setItem("pendingDownloads", JSON.stringify(updated)).catch((error) =>
        console.error("Error saving pending downloads:", error),
      )
      return updated
    })
  }

  // Synchroniser les données en attente
  const synchronizeData = async (): Promise<boolean> => {
    if (!isConnected) {
      Alert.alert(t("network.error"), t("network.noConnection"))
      return false
    }

    try {
      // Implémenter la logique de synchronisation ici
      // Par exemple, envoyer les uploads en attente au serveur

      // Simuler une synchronisation réussie
      setPendingUploads([])
      setPendingDownloads([])

      await AsyncStorage.removeItem("pendingUploads")
      await AsyncStorage.removeItem("pendingDownloads")

      return true
    } catch (error) {
      console.error("Error synchronizing data:", error)
      return false
    }
  }

  // Effacer les données en attente
  const clearPendingData = async (): Promise<boolean> => {
    try {
      setPendingUploads([])
      setPendingDownloads([])

      await AsyncStorage.removeItem("pendingUploads")
      await AsyncStorage.removeItem("pendingDownloads")

      return true
    } catch (error) {
      console.error("Error clearing pending data:", error)
      return false
    }
  }

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isOfflineMode,
        toggleOfflineMode,
        pendingUploads,
        pendingDownloads,
        addPendingUpload,
        addPendingDownload,
        synchronizeData,
        clearPendingData,
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}
