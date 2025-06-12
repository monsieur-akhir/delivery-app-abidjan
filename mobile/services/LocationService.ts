// services/LocationService.ts - Service avancé de géolocalisation pour applications VTC
import * as Location from 'expo-location'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
}

export default LocationService
