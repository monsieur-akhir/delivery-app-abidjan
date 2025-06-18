import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { useNetwork } from "../contexts/NetworkContext"

// Types
export interface SyncStatus {
  lastSyncTime: string | null
  pendingUploads: number
  pendingDownloads: number
  syncInProgress: boolean
}

export interface CacheConfig {
  enabled: boolean
  maxAge: number // en millisecondes
  maxSize: number // en octets
}

class OfflineService {
  private cacheConfig: CacheConfig = {
    enabled: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures par défaut
    maxSize: 50 * 1024 * 1024, // 50 MB par défaut
  }

  constructor() {
    this.loadCacheConfig()
  }

  // Charger la configuration du cache
  private async loadCacheConfig() {
    try {
      const configString = await AsyncStorage.getItem("cacheConfig")
      if (configString) {
        this.cacheConfig = { ...this.cacheConfig, ...JSON.parse(configString) }
      }
    } catch (error) {
      console.error("Error loading cache config:", error)
    }
  }

  // Mettre à jour la configuration du cache
  async updateCacheConfig(config: Partial<CacheConfig>): Promise<void> {
    try {
      this.cacheConfig = { ...this.cacheConfig, ...config }
      await AsyncStorage.setItem("cacheConfig", JSON.stringify(this.cacheConfig))
    } catch (error) {
      console.error("Error updating cache config:", error)
    }
  }

  // Vérifier si une URL est mise en cache
  async isCached(url: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(url)
      const cachedData = await AsyncStorage.getItem(cacheKey)

      if (!cachedData) return false

      const { timestamp } = JSON.parse(cachedData)
      const now = Date.now()

      // Vérifier si le cache est expiré
      if (now - timestamp > this.cacheConfig.maxAge) {
        await AsyncStorage.removeItem(cacheKey)
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking cache:", error)
      return false
    }
  }

  // Récupérer des données du cache
  async getFromCache<T>(url: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(url)
      const cachedData = await AsyncStorage.getItem(cacheKey)

      if (!cachedData) return null

      const { data, timestamp } = JSON.parse(cachedData)
      const now = Date.now()

      // Vérifier si le cache est expiré
      if (now - timestamp > this.cacheConfig.maxAge) {
        await AsyncStorage.removeItem(cacheKey)
        return null
      }

      return data as T
    } catch (error) {
      console.error("Error getting from cache:", error)
      return null
    }
  }

  // Mettre en cache des données
  async saveToCache(url: string, data: any): Promise<boolean> {
    if (!this.cacheConfig.enabled) return false

    try {
      const cacheKey = this.getCacheKey(url)
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData))

      // Gérer la taille du cache
      await this.manageCacheSize()

      return true
    } catch (error) {
      console.error("Error saving to cache:", error)
      return false
    }
  }

  // Effacer le cache
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"))
      await AsyncStorage.multiRemove(cacheKeys)
    } catch (error) {
      console.error("Error clearing cache:", error)
      throw error
    }
  }

  // Synchroniser les données
  async synchronizeData(): Promise<boolean> {
    // Utiliser la fonction de synchronisation du contexte réseau
    const { synchronizeData } = useNetwork()

    // Vérifier la connexion
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      return false
    }

    return await synchronizeData()
  }

  // Obtenir le statut de synchronisation
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const lastSyncTime = await AsyncStorage.getItem("lastSyncTime")
      const pendingUploads = await AsyncStorage.getItem("pendingUploads")
      const pendingDownloads = await AsyncStorage.getItem("pendingDownloads")

      return {
        lastSyncTime,
        pendingUploads: pendingUploads ? JSON.parse(pendingUploads).length : 0,
        pendingDownloads: pendingDownloads ? JSON.parse(pendingDownloads).length : 0,
        syncInProgress: false,
      }
    } catch (error) {
      console.error("Error getting sync status:", error)
      return {
        lastSyncTime: null,
        pendingUploads: 0,
        pendingDownloads: 0,
        syncInProgress: false,
      }
    }
  }

  // Précharger des données pour une utilisation hors ligne
  async preloadData(endpoints: string[]): Promise<number> {
    let successCount = 0

    for (const endpoint of endpoints) {
      try {
        // Simulate preloading data
        await new Promise((resolve) => setTimeout(resolve, 100))
        successCount++
      } catch (error) {
        console.error(`Error preloading ${endpoint}:`, error)
      }
    }

    return successCount
  }

  // Méthodes utilitaires
  private getCacheKey(url: string): string {
    return `cache_${url.replace(/[^a-zA-Z0-9]/g, "_")}`
  }

  private async manageCacheSize(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith("cache_"))

      if (cacheKeys.length <= 10) return // Pas besoin de gérer si peu d'éléments

      // Récupérer les informations de cache
      const cacheItems: { key: string; timestamp: number; size: number }[] = []
      let totalSize = 0

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key)
        if (item) {
          const { timestamp } = JSON.parse(item)
          const size = item.length

          cacheItems.push({ key, timestamp, size })
          totalSize += size
        }
      }

      // Vérifier si la taille dépasse la limite
      if (totalSize > this.cacheConfig.maxSize) {
        // Trier par timestamp (plus ancien d'abord)
        cacheItems.sort((a, b) => a.timestamp - b.timestamp)

        // Supprimer les éléments les plus anciens jusqu'à ce que la taille soit acceptable
        let currentSize = totalSize
        const keysToRemove: string[] = []

        for (const item of cacheItems) {
          if (currentSize <= this.cacheConfig.maxSize * 0.8) break // Garder 80% de la taille max

          keysToRemove.push(item.key)
          currentSize -= item.size
        }

        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove)
        }
      }
    } catch (error) {
      console.error("Error managing cache size:", error)
    }
  }
}

export default new OfflineService()
