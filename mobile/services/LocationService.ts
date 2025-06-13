// services/LocationService.ts - Service avancé de géolocalisation pour applications VTC
import * as Location from 'expo-location'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface LocationCoords {
  latitude: number
  longitude: number
}

export interface AddressSuggestion {
  id: string
  address: string
  coords: LocationCoords
  commune: string
  type?: string
  distance?: number
}

export interface PlaceDetails {
  id: string
  name: string
  address: string
  coords: LocationCoords
  commune: string
  type: string
  rating?: number
  isOpen?: boolean
}

export interface VTCLocation {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface LocationSettings {
  accuracy: Location.Accuracy
  distanceInterval: number
  timeInterval: number
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
}

export interface GeofenceRegion {
  identifier: string
  latitude: number
  longitude: number
  radius: number
  notifyOnEntry: boolean
  notifyOnExit: boolean
}

class LocationService {
  private static instance: LocationService
  private watchId: Location.LocationSubscription | null = null
  private isTracking = false
  private lastKnownLocation: VTCLocation | null = null
  private locationCallbacks: ((location: VTCLocation) => void)[] = []
  private geofences: GeofenceRegion[] = []
  private cachedSuggestions: Map<string, AddressSuggestion[]> = new Map()
  private recentSearches: AddressSuggestion[] = []

  // Configuration VTC optimisée
  private readonly VTC_SETTINGS: LocationSettings = {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 5, // 5 mètres - très précis pour VTC
    timeInterval: 2000, // 2 secondes - mise à jour fréquente
    enableHighAccuracy: true,
    timeout: 15000, // 15 secondes
    maximumAge: 5000, // 5 secondes - données récentes
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  /**
   * Demande les permissions de localisation avec gestion complète
   */
  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      // Demander permission de base
      const foregroundPermission = await Location.requestForegroundPermissionsAsync()

      if (foregroundPermission.status !== 'granted') {
        return { granted: false, status: foregroundPermission.status }
      }

      // Pour les applications VTC, demander aussi la permission en arrière-plan
      if (Platform.OS === 'ios') {
        const backgroundPermission = await Location.requestBackgroundPermissionsAsync()
        return { 
          granted: backgroundPermission.status === 'granted', 
          status: backgroundPermission.status 
        }
      }

      return { granted: true, status: 'granted' }
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error)
      return { granted: false, status: 'error' }
    }
  }

  /**
   * Obtient la position actuelle avec haute précision (style VTC)
   */
  async getCurrentPosition(): Promise<VTCLocation> {
    try {
      const { granted } = await this.requestPermissions()
      if (!granted) {
        throw new Error('Permission de localisation refusée')
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: this.VTC_SETTINGS.accuracy,
        mayShowUserSettingsDialog: true,
      })

      const vtcLocation: VTCLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp,
      }

      this.lastKnownLocation = vtcLocation
      await this.saveLastKnownLocation(vtcLocation)

      return vtcLocation
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la position:', error)

      // Fallback vers la dernière position connue
      const lastPosition = await this.getLastKnownLocation()
      if (lastPosition) {
        return lastPosition
      }

      throw error
    }
  }

  /**
   * Démarre le suivi de localisation en temps réel (style VTC)
   */
  async startTracking(callback?: (location: VTCLocation) => void): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.warn('Le suivi est déjà actif')
        return true
      }

      const { granted } = await this.requestPermissions()
      if (!granted) {
        throw new Error('Permission de localisation refusée')
      }

      if (callback) {
        this.locationCallbacks.push(callback)
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: this.VTC_SETTINGS.accuracy,
          timeInterval: this.VTC_SETTINGS.timeInterval,
          distanceInterval: this.VTC_SETTINGS.distanceInterval,
          mayShowUserSettingsDialog: true,
        },
        (position) => {
          const vtcLocation: VTCLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          }

          this.lastKnownLocation = vtcLocation
          this.saveLastKnownLocation(vtcLocation)

          // Notifier tous les callbacks
          this.locationCallbacks.forEach(cb => cb(vtcLocation))

          // Vérifier les geofences
          this.checkGeofences(vtcLocation)
        }
      )

      this.isTracking = true
      console.log('Suivi de localisation VTC démarré')
      return true
    } catch (error) {
      console.error('Erreur lors du démarrage du suivi:', error)
      return false
    }
  }

  /**
   * Arrête le suivi de localisation
   */
  async stopTracking(): Promise<void> {
    if (this.watchId) {
      this.watchId.remove()
      this.watchId = null
    }
    this.isTracking = false
    this.locationCallbacks = []
    console.log('Suivi de localisation arrêté')
  }

  /**
   * Ajoute un callback pour recevoir les mises à jour de localisation
   */
  addLocationCallback(callback: (location: VTCLocation) => void): void {
    this.locationCallbacks.push(callback)
  }

  /**
   * Supprime un callback
   */
  removeLocationCallback(callback: (location: VTCLocation) => void): void {
    this.locationCallbacks = this.locationCallbacks.filter(cb => cb !== callback)
  }

  /**
   * Calcule la distance entre deux points (en mètres)
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3 // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  /**
   * Calcule le cap/direction entre deux points
   */
  calculateBearing(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  }

  /**
   * Ajoute une geofence
   */
  addGeofence(geofence: GeofenceRegion): void {
    this.geofences.push(geofence)
  }

  /**
   * Supprime une geofence
   */
  removeGeofence(identifier: string): void {
    this.geofences = this.geofences.filter(g => g.identifier !== identifier)
  }

  /**
   * Vérifie si la position actuelle est dans une geofence
   */
  private checkGeofences(location: VTCLocation): void {
    this.geofences.forEach(geofence => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.latitude,
        geofence.longitude
      )

      if (distance <= geofence.radius) {
        console.log(`Entrée dans la geofence: ${geofence.identifier}`)
        // Ici on pourrait émettre un événement
      }
    })
  }

  /**
   * Sauvegarde la dernière position connue
   */
  private async saveLastKnownLocation(location: VTCLocation): Promise<void> {
    try {
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(location))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la position:', error)
    }
  }

  /**
   * Récupère la dernière position connue
   */
  async getLastKnownLocation(): Promise<VTCLocation | null> {
    try {
      const stored = await AsyncStorage.getItem('lastKnownLocation')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error)
      return null
    }
  }

  /**
   * Vérifie si les services de localisation sont activés
   */
  async isLocationEnabled(): Promise<boolean> {
    return await Location.hasServicesEnabledAsync()
  }

  /**
   * Obtient l'état actuel du suivi
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  /**
   * Obtient la dernière position en mémoire
   */
  getLastLocation(): VTCLocation | null {
    return this.lastKnownLocation
  }

  /**
   * Configure la précision pour économiser la batterie
   */
  setBatteryOptimizedMode(enabled: boolean): void {
    if (enabled) {
      this.VTC_SETTINGS.accuracy = Location.Accuracy.Balanced
      this.VTC_SETTINGS.timeInterval = 5000 // 5 secondes
      this.VTC_SETTINGS.distanceInterval = 10 // 10 mètres
    } else {
      this.VTC_SETTINGS.accuracy = Location.Accuracy.BestForNavigation
      this.VTC_SETTINGS.timeInterval = 2000 // 2 secondes
      this.VTC_SETTINGS.distanceInterval = 5 // 5 mètres
    }
  }

  async searchAddresses(query: string, userLocation?: LocationCoords): Promise<AddressSuggestion[]> {
    if (query.length < 2) {
      return this.getPopularAddresses(userLocation)
    }

    // Vérifier le cache
    const cacheKey = query.toLowerCase()
    if (this.cachedSuggestions.has(cacheKey)) {
      return this.cachedSuggestions.get(cacheKey)!
    }

    try {
      const suggestions: AddressSuggestion[] = []

      // Rechercher dans les lieux populaires
      const popularPlaces = await this.getPopularPlaces(query)
      suggestions.push(...popularPlaces)

      // Rechercher dans les communes
      const communeSuggestions = await this.searchInCommunes(query)
      suggestions.push(...communeSuggestions)

      // Rechercher dans les adresses récentes
      const recentMatches = this.recentSearches.filter(addr =>
        addr.address.toLowerCase().includes(query.toLowerCase())
      )
      suggestions.push(...recentMatches.map(addr => ({ ...addr, type: "recent" })))

      // Calculer la distance si la position de l'utilisateur est disponible
      if (userLocation) {
        suggestions.forEach(suggestion => {
          suggestion.distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            suggestion.coords.latitude,
            suggestion.coords.longitude
          )
        })
        // Trier par distance
        suggestions.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      }

      // Limiter et dédupliquer
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions).slice(0, 8)

      // Mettre en cache
      this.cachedSuggestions.set(cacheKey, uniqueSuggestions)

      return uniqueSuggestions
    } catch (error) {
      console.error("Error searching addresses:", error)
      return []
    }
  }

  private async getPopularPlaces(query?: string): Promise<AddressSuggestion[]> {
    const popularPlaces = [
      {
        id: "airport",
        address: "Aéroport Félix Houphouët-Boigny",
        coords: { latitude: 5.2539, longitude: -3.9263 },
        commune: "Port-Bouët",
        type: "airport"
      },
      {
        id: "university",
        address: "Université Félix Houphouët-Boigny",
        coords: { latitude: 5.3847, longitude: -3.9883 },
        commune: "Cocody",
        type: "university"
      },
      {
        id: "treichville_market",
        address: "Marché de Treichville",
        coords: { latitude: 5.2833, longitude: -4.0000 },
        commune: "Treichville",
        type: "market"
      },
      {
        id: "playce_marcory",
        address: "Centre Commercial PlaYce Marcory",
        coords: { latitude: 5.2956, longitude: -3.9750 },
        commune: "Marcory",
        type: "mall"
      },
      {
        id: "bassam_station",
        address: "Gare de Bassam",
        coords: { latitude: 5.3200, longitude: -4.0200 },
        commune: "Plateau",
        type: "transport"
      },
      {
        id: "adjame_market",
        address: "Marché d'Adjamé",
        coords: { latitude: 5.3667, longitude: -4.0167 },
        commune: "Adjamé",
        type: "market"
      },
      {
        id: "cocody_riviera",
        address: "Riviera Golf, Cocody",
        coords: { latitude: 5.3789, longitude: -3.9956 },
        commune: "Cocody",
        type: "entertainment"
      },
      {
        id: "yop_Kennedy",
        address: "Carrefour Kennedy, Yopougon",
        coords: { latitude: 5.3289, longitude: -4.0756 },
        commune: "Yopougon",
        type: "intersection"
      }
    ]

    if (query) {
      return popularPlaces.filter(place =>
        place.address.toLowerCase().includes(query.toLowerCase())
      )
    }

    return popularPlaces
  }

  private async searchInCommunes(query: string): Promise<AddressSuggestion[]> {
    const communes = [
      "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi",
      "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon"
    ]

    const suggestions: AddressSuggestion[] = []

    communes.forEach((commune, index) => {
      suggestions.push({
        id: `${commune}-${index}-${Date.now()}`,
        address: `${query}, ${commune}, Abidjan`,
        coords: this.getCommuneCoords(commune),
        commune: commune,
        type: "commune"
      })
    })

    return suggestions
  }

  private deduplicateSuggestions(suggestions: AddressSuggestion[]): AddressSuggestion[] {
    const seen = new Set<string>()
    return suggestions.filter(suggestion => {
      const key = suggestion.address.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  async addToRecentSearches(suggestion: AddressSuggestion): Promise<void> {
    // Supprimer l'adresse existante si elle existe
    this.recentSearches = this.recentSearches.filter(addr => addr.id !== suggestion.id)

    // Ajouter au début
    this.recentSearches.unshift({
      ...suggestion,
      type: "recent"
    })

    // Limiter à 5 adresses récentes
    this.recentSearches = this.recentSearches.slice(0, 5)

    await this.saveRecentSearches()
  }

  getRecentSearches(): AddressSuggestion[] {
    return this.recentSearches
  }

  async clearRecentSearches(): Promise<void> {
    this.recentSearches = []
    await this.saveRecentSearches()
  }

   private toRad = (Value: number) => {
      return Value * Math.PI / 180;
   }

  private calculateDistance(from: LocationCoords, to: LocationCoords): number {
    const R = 6371 // Rayon de la Terre en km
    const dLat = this.toRad(to.latitude - from.latitude)
    const dLon = this.toRad(to.longitude - from.longitude)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.latitude)) *
        Math.cos(this.toRad(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private async loadRecentSearches(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem("recentAddressSearches")
      if (stored) {
        this.recentSearches = JSON.parse(stored)
      }
    } catch (error) {
      console.error("Error loading recent searches:", error)
    }
  }

  private async saveRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.setItem("recentAddressSearches", JSON.stringify(this.recentSearches))
    } catch (error) {
      console.error("Error saving recent searches:", error)
    }
  }

  private getPopularAddresses(userLocation?: LocationCoords): AddressSuggestion[] {
    const popularAddresses = this.getPopularPlaces()

    if (userLocation) {
      return popularAddresses.then(addresses => {
        return addresses.map(address => {
          return {
            ...address,
            distance: this.calculateDistance(userLocation, address.coords.latitude, address.coords.longitude)
          }
        }).sort((a, b) => (a.distance || 0) - (b.distance || 0))
      }) as any
    }
    return popularAddresses as any
  }

  private getCommuneCoords(commune: string): LocationCoords {
    switch (commune) {
      case "Abobo":
        return { latitude: 5.4500, longitude: -4.0200 }
      case "Adjamé":
        return { latitude: 5.3667, longitude: -4.0167 }
      case "Attécoubé":
        return { latitude: 5.3333, longitude: -4.0500 }
      case "Cocody":
        return { latitude: 5.3381, longitude: -3.9344 }
      case "Koumassi":
        return { latitude: 5.2833, longitude: -3.9500 }
      case "Marcory":
        return { latitude: 5.2917, longitude: -3.9667 }
      case "Plateau":
        return { latitude: 5.3200, longitude: -4.0200 }
      case "Port-Bouët":
        return { latitude: 5.2583, longitude: -3.9333 }
      case "Treichville":
        return { latitude: 5.2833, longitude: -4.0000 }
      case "Yopougon":
        return { latitude: 5.3250, longitude: -4.0833 }
      default:
        return { latitude: 5.3500, longitude: -4.0000 }
    }
  }
}

export default LocationService