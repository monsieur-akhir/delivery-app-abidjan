import * as Location from 'expo-location'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Configuration Google Places API - Utilisez votre vraie clé Google Maps API
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBOti4mM-6x9WDnZIjIeyPU21O1u3VAdpw'
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place'
const GOOGLE_GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode'

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
  placeId?: string
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
  formatted_address?: string
  international_phone_number?: string
  website?: string
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
    distanceInterval: 5,
    timeInterval: 2000,
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  /**
   * Demande les permissions de localisation
   */
  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      const foregroundPermission = await Location.requestForegroundPermissionsAsync()

      if (foregroundPermission.status !== 'granted') {
        return { granted: false, status: foregroundPermission.status }
      }

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
   * Obtient la position actuelle avec haute précision
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
      const lastPosition = await this.getLastKnownLocation()
      if (lastPosition) {
        return lastPosition
      }
      throw error
    }
  }

  /**
   * Démarre le suivi de localisation en temps réel
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

          this.locationCallbacks.forEach(cb => cb(vtcLocation))
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
   * Recherche d'adresses avec Google Places API réelle
   */
  async searchAddresses(query: string, userLocation?: LocationCoords): Promise<AddressSuggestion[]> {
    if (query.length < 2) {
      return this.getRecentSearches()
    }

    // Vérifier le cache
    const cacheKey = query.toLowerCase()
    if (this.cachedSuggestions.has(cacheKey)) {
      return this.cachedSuggestions.get(cacheKey)!
    }

    try {
      const suggestions: AddressSuggestion[] = []

      // 1. Recherche avec Google Places Autocomplete API
      const googleSuggestions = await this.searchGooglePlacesReal(query, userLocation)
      suggestions.push(...googleSuggestions)

      // 2. Recherche dans les adresses récentes
      const recentMatches = this.recentSearches.filter(addr =>
        addr.address.toLowerCase().includes(query.toLowerCase())
      )
      suggestions.push(...recentMatches)

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

        // Trier par pertinence et distance
        suggestions.sort((a, b) => {
          if (a.type === 'recent' && b.type !== 'recent') return -1
          if (b.type === 'recent' && a.type !== 'recent') return 1
          return (a.distance || 0) - (b.distance || 0)
        })
      }

      // Limiter et dédupliquer
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions).slice(0, 10)

      // Mettre en cache
      this.cachedSuggestions.set(cacheKey, uniqueSuggestions)

      return uniqueSuggestions
    } catch (error) {
      console.error("Error searching addresses with Google API:", error)
      return []
    }
  }

  /**
   * Recherche avec l'API Google Places réelle
   */
  private async searchGooglePlacesReal(query: string, userLocation?: LocationCoords): Promise<AddressSuggestion[]> {
    try {
      const baseParams = new URLSearchParams({
        input: query,
        key: GOOGLE_PLACES_API_KEY,
        language: 'fr',
        components: 'country:ci', // Limitée à la Côte d'Ivoire
      })

      // Si on a la position de l'utilisateur, on privilégie les résultats proches
      if (userLocation) {
        baseParams.append('location', `${userLocation.latitude},${userLocation.longitude}`)
        baseParams.append('radius', '50000') // 50km autour d'Abidjan
      }

      const response = await fetch(
        `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?${baseParams.toString()}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API Error:', data.status, data.error_message)
        return []
      }

      if (!data.predictions || data.predictions.length === 0) {
        return []
      }

      // Traiter les prédictions
      const suggestions: AddressSuggestion[] = []

      for (const prediction of data.predictions.slice(0, 8)) {
        try {
          // Obtenir les détails de la place pour avoir les coordonnées
          const placeDetails = await this.getPlaceDetails(prediction.place_id)

          if (placeDetails) {
            suggestions.push({
              id: prediction.place_id,
              address: prediction.description,
              coords: placeDetails.coords,
              commune: this.extractCommune(prediction.description),
              type: 'google_place',
              placeId: prediction.place_id
            })
          }
        } catch (error) {
          console.warn('Error getting place details for:', prediction.place_id, error)
          // En cas d'erreur, on peut utiliser le geocoding comme fallback
          try {
            const geocodedPlace = await this.geocodeAddress(prediction.description)
            if (geocodedPlace) {
              suggestions.push(geocodedPlace)
            }
          } catch (geocodeError) {
            console.warn('Geocoding fallback failed:', geocodeError)
          }
        }
      }

      return suggestions
    } catch (error) {
      console.error('Error with Google Places API:', error)
      return []
    }
  }

  /**
   * Obtient les détails d'une place via Google Places Details API
   */
  private async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: GOOGLE_PLACES_API_KEY,
        fields: 'geometry,name,formatted_address,rating,opening_hours,international_phone_number,website',
        language: 'fr'
      })

      const response = await fetch(
        `${GOOGLE_PLACES_BASE_URL}/details/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK') {
        console.error('Google Places Details API Error:', data.status)
        return null
      }

      const place = data.result

      return {
        id: placeId,
        name: place.name || '',
        address: place.formatted_address || '',
        coords: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        commune: this.extractCommune(place.formatted_address || ''),
        type: 'google_place',
        rating: place.rating,
        isOpen: place.opening_hours?.open_now,
        formatted_address: place.formatted_address,
        international_phone_number: place.international_phone_number,
        website: place.website
      }
    } catch (error) {
      console.error('Error getting place details:', error)
      return null
    }
  }

  /**
   * Géocode une adresse via Google Geocoding API
   */
  private async geocodeAddress(address: string): Promise<AddressSuggestion | null> {
    try {
      const params = new URLSearchParams({
        address: address,
        key: GOOGLE_PLACES_API_KEY,
        language: 'fr',
        components: 'country:ci'
      })

      const response = await fetch(
        `${GOOGLE_GEOCODING_BASE_URL}/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null
      }

      const result = data.results[0]

      return {
        id: `geocoded_${Date.now()}`,
        address: result.formatted_address,
        coords: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        },
        commune: this.extractCommune(result.formatted_address),
        type: 'geocoded'
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  /**
   * Géocodage inverse pour obtenir l'adresse à partir des coordonnées
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<AddressSuggestion | null> {
    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_PLACES_API_KEY,
        language: 'fr'
      })

      const response = await fetch(
        `${GOOGLE_GEOCODING_BASE_URL}/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null
      }

      const result = data.results[0]

      return {
        id: 'current_location',
        address: result.formatted_address,
        coords: { latitude, longitude },
        commune: this.extractCommune(result.formatted_address),
        type: 'current_location'
      }
    } catch (error) {
      console.error('Error with reverse geocoding:', error)
      return null
    }
  }

  /**
   * Extrait la commune à partir d'une adresse formatée
   */
  private extractCommune(address: string): string {
    const communes = [
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
    ]

    for (const commune of communes) {
      if (address.toLowerCase().includes(commune.toLowerCase())) {
        return commune
      }
    }

    return 'Abidjan'
  }

  /**
   * Calcule la distance entre deux points (en mètres)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3
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
   * Calcule le cap entre deux points
   */
  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  }

  /**
   * Ajoute/supprime des geofences
   */
  addGeofence(geofence: GeofenceRegion): void {
    this.geofences.push(geofence)
  }

  removeGeofence(identifier: string): void {
    this.geofences = this.geofences.filter(g => g.identifier !== identifier)
  }

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
      }
    })
  }

  /**
   * Gestion du cache et du stockage
   */
  private async saveLastKnownLocation(location: VTCLocation): Promise<void> {
    try {
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(location))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la position:', error)
    }
  }

  async getLastKnownLocation(): Promise<VTCLocation | null> {
    try {
      const stored = await AsyncStorage.getItem('lastKnownLocation')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error)
      return null
    }
  }

  async addToRecentSearches(suggestion: AddressSuggestion): Promise<void> {
    this.recentSearches = this.recentSearches.filter(addr => addr.id !== suggestion.id)
    this.recentSearches.unshift({ ...suggestion, type: "recent" })
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

  private async saveRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.setItem("recentAddressSearches", JSON.stringify(this.recentSearches))
    } catch (error) {
      console.error("Error saving recent searches:", error)
    }
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

  /**
   * Méthodes utilitaires
   */
  async isLocationEnabled(): Promise<boolean> {
    return await Location.hasServicesEnabledAsync()
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  getLastLocation(): VTCLocation | null {
    return this.lastKnownLocation
  }

  addLocationCallback(callback: (location: VTCLocation) => void): void {
    this.locationCallbacks.push(callback)
  }

  removeLocationCallback(callback: (location: VTCLocation) => void): void {
    this.locationCallbacks = this.locationCallbacks.filter(cb => cb !== callback)
  }

  setBatteryOptimizedMode(enabled: boolean): void {
    if (enabled) {
      this.VTC_SETTINGS.accuracy = Location.Accuracy.Balanced
      this.VTC_SETTINGS.timeInterval = 5000
      this.VTC_SETTINGS.distanceInterval = 10
    } else {
      this.VTC_SETTINGS.accuracy = Location.Accuracy.BestForNavigation
      this.VTC_SETTINGS.timeInterval = 2000
      this.VTC_SETTINGS.distanceInterval = 5
    }
  }
}

export default LocationService