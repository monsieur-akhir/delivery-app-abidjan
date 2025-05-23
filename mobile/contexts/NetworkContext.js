"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import NetInfo from "@react-native-community/netinfo"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"

const NetworkContext = createContext()

export const useNetwork = () => useContext(NetworkContext)

export const NetworkProvider = ({ children }) => {
  const { t } = useTranslation()

  const [isConnected, setIsConnected] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [pendingUploads, setPendingUploads] = useState([])
  const [pendingDownloads, setPendingDownloads] = useState([])
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)

  const netInfoUnsubscribe = useRef(null)
  const syncInterval = useRef(null)

  // Initialiser le contexte
  useEffect(() => {
    // Charger les données en attente depuis le stockage local
    loadPendingData()

    // S'abonner aux changements de connectivité
    netInfoUnsubscribe.current = NetInfo.addEventListener(handleConnectivityChange)

    // Vérifier l'état initial de la connexion
    checkInitialConnection()

    // Configurer un intervalle pour tenter la synchronisation périodiquement
    syncInterval.current = setInterval(() => {
      if (isConnected && (pendingUploads.length > 0 || pendingDownloads.length > 0)) {
        synchronizeData()
      }
    }, 60000) // Tenter la synchronisation toutes les minutes

    return () => {
      // Nettoyer les abonnements et intervalles
      if (netInfoUnsubscribe.current) {
        netInfoUnsubscribe.current()
      }

      if (syncInterval.current) {
        clearInterval(syncInterval.current)
      }
    }
  }, [isConnected, pendingUploads, pendingDownloads])

  // Vérifier l'état initial de la connexion
  const checkInitialConnection = async () => {
    try {
      const state = await NetInfo.fetch()
      setIsConnected(state.isConnected && state.isInternetReachable)

      // Charger le paramètre du mode hors ligne
      const offlineMode = await AsyncStorage.getItem("offlineMode")
      setIsOfflineMode(offlineMode === "true")
    } catch (error) {
      console.error("Error checking initial connection:", error)
    }
  }

  // Gérer les changements de connectivité
  const handleConnectivityChange = (state) => {
    const connected = state.isConnected && state.isInternetReachable
    setIsConnected(connected)

    // Si la connexion est rétablie, tenter de synchroniser les données en attente
    if (connected && (pendingUploads.length > 0 || pendingDownloads.length > 0)) {
      synchronizeData()
    }
  }

  // Charger les données en attente depuis le stockage local
  const loadPendingData = async () => {
    try {
      const uploadsData = await AsyncStorage.getItem("pendingUploads")
      const downloadsData = await AsyncStorage.getItem("pendingDownloads")
      const lastSync = await AsyncStorage.getItem("lastSyncTime")

      if (uploadsData) {
        setPendingUploads(JSON.parse(uploadsData))
      }

      if (downloadsData) {
        setPendingDownloads(JSON.parse(downloadsData))
      }

      if (lastSync) {
        setLastSyncTime(new Date(JSON.parse(lastSync)))
      }
    } catch (error) {
      console.error("Error loading pending data:", error)
    }
  }

  // Sauvegarder les données en attente dans le stockage local
  const savePendingData = async () => {
    try {
      await AsyncStorage.setItem("pendingUploads", JSON.stringify(pendingUploads))
      await AsyncStorage.setItem("pendingDownloads", JSON.stringify(pendingDownloads))

      if (lastSyncTime) {
        await AsyncStorage.setItem("lastSyncTime", JSON.stringify(lastSyncTime))
      }
    } catch (error) {
      console.error("Error saving pending data:", error)
    }
  }

  // Ajouter un élément à la file d'attente des téléversements
  const addPendingUpload = (item) => {
    const newUploads = [...pendingUploads, { ...item, id: Date.now().toString() }]
    setPendingUploads(newUploads)

    // Sauvegarder immédiatement
    AsyncStorage.setItem("pendingUploads", JSON.stringify(newUploads))

    // Tenter de synchroniser si connecté
    if (isConnected) {
      synchronizeData()
    }

    return true
  }

  // Ajouter un élément à la file d'attente des téléchargements
  const addPendingDownload = (item) => {
    const newDownloads = [...pendingDownloads, { ...item, id: Date.now().toString() }]
    setPendingDownloads(newDownloads)

    // Sauvegarder immédiatement
    AsyncStorage.setItem("pendingDownloads", JSON.stringify(newDownloads))

    // Tenter de synchroniser si connecté
    if (isConnected) {
      synchronizeData()
    }

    return true
  }

  // Supprimer un élément de la file d'attente des téléversements
  const removePendingUpload = (id) => {
    const newUploads = pendingUploads.filter((item) => item.id !== id)
    setPendingUploads(newUploads)

    // Sauvegarder immédiatement
    AsyncStorage.setItem("pendingUploads", JSON.stringify(newUploads))

    return true
  }

  // Supprimer un élément de la file d'attente des téléchargements
  const removePendingDownload = (id) => {
    const newDownloads = pendingDownloads.filter((item) => item.id !== id)
    setPendingDownloads(newDownloads)

    // Sauvegarder immédiatement
    AsyncStorage.setItem("pendingDownloads", JSON.stringify(newDownloads))

    return true
  }

  // Activer/désactiver le mode hors ligne
  const toggleOfflineMode = async (value) => {
    const newValue = value !== undefined ? value : !isOfflineMode
    setIsOfflineMode(newValue)

    // Sauvegarder le paramètre
    await AsyncStorage.setItem("offlineMode", newValue.toString())

    return newValue
  }

  // Synchroniser les données en attente avec le serveur
  const synchronizeData = async () => {
    if (!isConnected || syncInProgress) return false

    try {
      setSyncInProgress(true)

      // Traiter les téléversements en attente
      if (pendingUploads.length > 0) {
        const uploadResults = await processUploads()

        // Mettre à jour la liste des téléversements en attente
        if (uploadResults.success.length > 0) {
          const remainingUploads = pendingUploads.filter((item) => !uploadResults.success.includes(item.id))
          setPendingUploads(remainingUploads)
          await AsyncStorage.setItem("pendingUploads", JSON.stringify(remainingUploads))
        }
      }

      // Traiter les téléchargements en attente
      if (pendingDownloads.length > 0) {
        const downloadResults = await processDownloads()

        // Mettre à jour la liste des téléchargements en attente
        if (downloadResults.success.length > 0) {
          const remainingDownloads = pendingDownloads.filter((item) => !downloadResults.success.includes(item.id))
          setPendingDownloads(remainingDownloads)
          await AsyncStorage.setItem("pendingDownloads", JSON.stringify(remainingDownloads))
        }
      }

      // Mettre à jour l'heure de la dernière synchronisation
      const now = new Date()
      setLastSyncTime(now)
      await AsyncStorage.setItem("lastSyncTime", JSON.stringify(now))

      return true
    } catch (error) {
      console.error("Error synchronizing data:", error)
      return false
    } finally {
      setSyncInProgress(false)
    }
  }

  // Traiter les téléversements en attente
  const processUploads = async () => {
    const results = {
      success: [],
      failed: [],
    }

    // Traiter chaque téléversement en attente
    for (const item of pendingUploads) {
      try {
        let success = false

        // Traiter différents types de téléversements
        switch (item.type) {
          case "delivery":
            // Logique pour créer une livraison
            // success = await createDelivery(item.data)
            success = true // Simuler le succès pour l'exemple
            break

          case "rating":
            // Logique pour soumettre une évaluation
            // success = await submitRating(item.data)
            success = true // Simuler le succès pour l'exemple
            break

          case "payment":
            // Logique pour traiter un paiement
            // success = await processPayment(item.data)
            success = true // Simuler le succès pour l'exemple
            break

          default:
            console.warn(`Unknown upload type: ${item.type}`)
            break
        }

        if (success) {
          results.success.push(item.id)
        } else {
          results.failed.push(item.id)
        }
      } catch (error) {
        console.error(`Error processing upload item ${item.id}:`, error)
        results.failed.push(item.id)
      }
    }

    return results
  }

  // Traiter les téléchargements en attente
  const processDownloads = async () => {
    const results = {
      success: [],
      failed: [],
    }

    // Traiter chaque téléchargement en attente
    for (const item of pendingDownloads) {
      try {
        let success = false

        // Traiter différents types de téléchargements
        switch (item.type) {
          case "delivery_details":
            // Logique pour télécharger les détails d'une livraison
            // success = await fetchAndStoreDeliveryDetails(item.data)
            success = true // Simuler le succès pour l'exemple
            break

          case "marketplace":
            // Logique pour télécharger les données du marché
            // success = await fetchAndStoreMarketplaceData(item.data)
            success = true // Simuler le succès pour l'exemple
            break

          default:
            console.warn(`Unknown download type: ${item.type}`)
            break
        }

        if (success) {
          results.success.push(item.id)
        } else {
          results.failed.push(item.id)
        }
      } catch (error) {
        console.error(`Error processing download item ${item.id}:`, error)
        results.failed.push(item.id)
      }
    }

    return results
  }

  // Effacer toutes les données en attente
  const clearPendingData = async () => {
    setPendingUploads([])
    setPendingDownloads([])

    await AsyncStorage.removeItem("pendingUploads")
    await AsyncStorage.removeItem("pendingDownloads")

    return true
  }

  // Sauvegarder les modifications des données en attente
  useEffect(() => {
    savePendingData()
  }, [pendingUploads, pendingDownloads, lastSyncTime])

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isOfflineMode,
        pendingUploads,
        pendingDownloads,
        syncInProgress,
        lastSyncTime,
        toggleOfflineMode,
        addPendingUpload,
        addPendingDownload,
        removePendingUpload,
        removePendingDownload,
        synchronizeData,
        clearPendingData,
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}
