// VTCStyleMap.tsx - Carte moderne style VTC (Uber/Bolt/etc.)
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { Text, Surface, Badge } from 'react-native-paper'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import LocationService, { VTCLocation } from '../services/LocationService'

// Interfaces VTC modernes
export interface VTCCoordinates {
  latitude: number
  longitude: number
}

export interface VTCVehicle {
  type: 'car' | 'motorcycle' | 'bicycle' | 'truck' | 'van'
  model: string
  plate: string
  color?: string
}

export interface VTCCourier {
  id: string
  name: string
  rating: number
  photo?: string
  vehicle: VTCVehicle
  location: VTCCoordinates
  heading?: number
  speed?: number
  isOnline?: boolean
  eta?: string
}

export interface VTCRoute {
  coordinates: VTCCoordinates[]
  distance: number
  duration: number
  traffic?: 'light' | 'moderate' | 'heavy'
  estimatedPrice?: number
}

export interface VTCDeliveryStatus {
  status: 'searching' | 'assigned' | 'pickup' | 'transit' | 'delivered' | 'cancelled'
  eta?: string
  progress: number
  message?: string
}

export interface VTCStyleMapProps {
  pickupLocation?: VTCCoordinates
  deliveryLocation?: VTCCoordinates
  courier?: VTCCourier
  route?: VTCRoute
  deliveryStatus: VTCDeliveryStatus
  userLocation?: VTCCoordinates
  showUserLocation?: boolean
  followUser?: boolean
  followCourier?: boolean
  onMapReady?: () => void
  onCourierPress?: () => void
  onRoutePress?: () => void
  onPickupPress?: () => void
  onDeliveryPress?: () => void
  onUserLocationPress?: () => void
  theme?: 'light' | 'dark' | 'auto'
  showTraffic?: boolean
  showETA?: boolean
  showProgress?: boolean
  style?: object
}

// Styles de carte modernes (comme Uber)
const mapStyles = {
  light: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#dadada' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }]
    }
  ],
  dark: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#212121' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2c2c2c' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    }
  ]
}

export const VTCStyleMap: React.FC<VTCStyleMapProps> = ({
  pickupLocation,
  deliveryLocation,
  courier,
  route,
  deliveryStatus,
  userLocation: propUserLocation,
  showUserLocation = true,
  followUser = false,
  followCourier = true,
  onMapReady,
  onCourierPress,
  onRoutePress,
  onPickupPress,
  onDeliveryPress,
  onUserLocationPress,
  theme = 'light',
  showTraffic = false,
  showETA = true,
  showProgress = true,
  style
}) => {  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)
  // Removed courierMarkerRef as it's not essential and causing type issues
  
  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const slideAnimation = useRef(new Animated.Value(-100)).current
  // State
  const [userLocation, setUserLocation] = useState<VTCLocation | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [courierAnimatedLocation, setCourierAnimatedLocation] = useState<AnimatedRegion | null>(null)
  const [lastCourierUpdate, setLastCourierUpdate] = useState<number>(0)
  const [mapRegion, setMapRegion] = useState({
    latitude: 5.3599517,
    longitude: -4.0082563,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  // Service de localisation
  const locationService = LocationService.getInstance()

  // Define functions before they are used in useEffect hooks
  const initializeUserLocation = useCallback(async () => {
    try {
      if (propUserLocation) {
        setUserLocation({
          latitude: propUserLocation.latitude,
          longitude: propUserLocation.longitude,
          timestamp: Date.now()
        })
        return
      }

      const location = await locationService.getCurrentPosition()
      setUserLocation(location)

      // Démarrer le suivi si nécessaire
      if (followUser) {
        locationService.startTracking((newLocation) => {
          setUserLocation(newLocation)
          if (isMapReady && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000)
          }
        })
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la localisation:', error)
    }
  }, [propUserLocation, followUser, isMapReady, locationService])

  const animateCourierMovement = useCallback((newLocation: VTCCoordinates) => {
    if (courierAnimatedLocation) {
      courierAnimatedLocation.timing({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        duration: 2000,
        useNativeDriver: false,
        toValue: 0
      }).start()

      if (followCourier && isMapReady && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 2000)
      }
    }
  }, [courierAnimatedLocation, followCourier, isMapReady])

  // Animation du marqueur de recherche
  useEffect(() => {
    if (deliveryStatus.status === 'searching') {
      const startPulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1.5,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),          ])
        ).start()
      }
      
      startPulse()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryStatus.status])

  // Animation d'entrée de la carte
  useEffect(() => {
    if (isMapReady) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),      ]).start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady])
  // Gestion de la localisation utilisateur
  useEffect(() => {
    if (showUserLocation) {
      initializeUserLocation()
    }
  }, [showUserLocation, initializeUserLocation])

  // Animation du coursier
  useEffect(() => {
    if (courier?.location && courierAnimatedLocation) {
      const now = Date.now()
      if (now - lastCourierUpdate > 2000) { // Limite les mises à jour à 2 secondes
        animateCourierMovement(courier.location)
        setLastCourierUpdate(now)
      }
    } else if (courier?.location) {
      setCourierAnimatedLocation(new AnimatedRegion({
        latitude: courier.location.latitude,
        longitude: courier.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }))
    }
  }, [courier?.location, courierAnimatedLocation, animateCourierMovement, lastCourierUpdate])

  // Calcul de la région initiale
  const getInitialRegion = useCallback(() => {
    const locations = [
      pickupLocation,
      deliveryLocation,
      courier?.location,
      userLocation
    ].filter(Boolean) as VTCCoordinates[]

    if (locations.length === 0) {
      return mapRegion
    }

    if (locations.length === 1) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }

    // Calcul de la région englobante
    const minLat = Math.min(...locations.map(l => l.latitude))
    const maxLat = Math.max(...locations.map(l => l.latitude))
    const minLng = Math.min(...locations.map(l => l.longitude))
    const maxLng = Math.max(...locations.map(l => l.longitude))
    
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    const deltaLat = Math.max((maxLat - minLat) * 1.5, 0.01)
    const deltaLng = Math.max((maxLng - minLng) * 1.5, 0.01)
      return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    }
  }, [pickupLocation, deliveryLocation, courier?.location, userLocation, mapRegion])

  const onMapReadyHandler = useCallback(() => {
    setIsMapReady(true)
    onMapReady?.()
    
    // Centrer sur tous les points
    setTimeout(() => {
      if (mapRef.current) {
        const region = getInitialRegion()
        mapRef.current.animateToRegion(region, 1000)
      }
    }, 500)
  }, [onMapReady, getInitialRegion])

  // Rendu des marqueurs VTC modernes
  const renderPickupMarker = () => {
    if (!pickupLocation) return null
    
    return (
      <Marker
        coordinate={pickupLocation}
        onPress={onPickupPress}
        anchor={{ x: 0.5, y: 1 }}
      >
        <Animated.View style={[
          styles.modernMarker,
          { transform: [{ scale: deliveryStatus.status === 'searching' ? pulseAnimation : 1 }] }
        ]}>
          <View style={[styles.markerContainer, styles.pickupMarker]}>
            <MaterialIcons name="location-on" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.markerArrow} />
        </Animated.View>
      </Marker>
    )
  }

  const renderDeliveryMarker = () => {
    if (!deliveryLocation) return null
    
    return (
      <Marker
        coordinate={deliveryLocation}
        onPress={onDeliveryPress}
        anchor={{ x: 0.5, y: 1 }}
      >
        <View style={styles.modernMarker}>
          <View style={[styles.markerContainer, styles.deliveryMarker]}>
            <MaterialIcons name="flag" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.markerArrow} />
        </View>
      </Marker>
    )
  }

  const renderUserLocationMarker = () => {
    if (!showUserLocation || !userLocation) return null
    
    return (
      <Marker
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }}
        onPress={onUserLocationPress}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.userLocationMarker}>
          <View style={styles.userLocationDot} />
          <View style={styles.userLocationPulse} />
        </View>      </Marker>
    )
  }

  const renderCourierMarker = () => {
    if (!courier) return null

    const vehicleIcon = getVehicleIcon(courier.vehicle.type)
    
    return (
      <Marker
        coordinate={courier.location}
        onPress={onCourierPress}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={courier.heading || 0}
        flat={true}
      >
        <View style={styles.courierMarkerContainer}>
          {courier.isOnline && (
            <View style={styles.onlineIndicator}>
              <Badge style={styles.onlineBadge} />
            </View>
          )}
          <View style={[styles.courierMarker, { backgroundColor: getVehicleColor(courier.vehicle.type) }]}>
            <MaterialCommunityIcons name={vehicleIcon} size={20} color="#FFFFFF" />
          </View>
          {courier.speed && courier.speed > 0 && (
            <View style={styles.speedIndicator}>
              <Text style={styles.speedText}>{Math.round(courier.speed)}km/h</Text>
            </View>
          )}
        </View>
      </Marker>
    )
  }

  const renderRoute = () => {
    if (!route || route.coordinates.length < 2) return null

    const routeColor = getRouteColor(route.traffic)
    
    return (
      <Polyline
        coordinates={route.coordinates}
        strokeWidth={6}
        strokeColor={routeColor}
        lineDashPattern={[1, 0]}
        onPress={onRoutePress}
      />
    )
  }

  const renderStatusCard = () => {
    if (!showProgress) return null

    return (
      <Animated.View style={[
        styles.statusContainer,
        {
          opacity: fadeAnimation,
          transform: [{ translateY: slideAnimation }]
        }
      ]}>
        <Surface style={styles.statusCard} elevation={4}>
          <LinearGradient
            colors={getStatusGradient(deliveryStatus.status)}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusIcon}>
                <MaterialIcons 
                  name={getStatusIcon(deliveryStatus.status)} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {t(`deliveryStatus.${deliveryStatus.status}`)}
                </Text>
                {deliveryStatus.message && (
                  <Text style={styles.statusMessage}>
                    {deliveryStatus.message}
                  </Text>
                )}
                {showETA && deliveryStatus.eta && (
                  <Text style={styles.statusETA}>
                    {t('common.eta')}: {deliveryStatus.eta}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${deliveryStatus.progress}%`,
                      backgroundColor: '#FFFFFF'
                    }
                  ]} 
                />
              </View>
            </View>
          </LinearGradient>
        </Surface>
      </Animated.View>
    )
  }
  // Utilitaires
  const getVehicleIcon = (type: string) => {
    const icons = {
      car: 'car' as const,
      motorcycle: 'truck' as const, // Utiliser "truck" au lieu de "motorbike"
      bicycle: 'bicycle' as const,
      truck: 'truck' as const,
      van: 'van-utility' as const
    }
    return icons[type as keyof typeof icons] || 'car'
  }

  const getVehicleColor = (type: string) => {
    const colors = {
      car: '#2196F3',
      motorcycle: '#FF6B00',
      bicycle: '#4CAF50',
      truck: '#9C27B0',
      van: '#FF5722'
    }
    return colors[type as keyof typeof colors] || '#2196F3'
  }

  const getRouteColor = (traffic?: string) => {
    const colors = {
      light: '#4CAF50',
      moderate: '#FF9800',
      heavy: '#F44336'
    }
    return colors[traffic as keyof typeof colors] || '#2196F3'
  }
  const getStatusGradient = (status: string): [string, string] => {
    const gradients = {
      searching: ['#FF6B00', '#FF8F00'] as [string, string],
      assigned: ['#2196F3', '#1976D2'] as [string, string],
      pickup: ['#9C27B0', '#7B1FA2'] as [string, string],
      transit: ['#4CAF50', '#388E3C'] as [string, string],
      delivered: ['#4CAF50', '#2E7D32'] as [string, string],
      cancelled: ['#F44336', '#D32F2F'] as [string, string]
    }
    return gradients[status as keyof typeof gradients] || gradients.searching
  }
  const getStatusIcon = (status: string) => {
    const icons = {
      searching: 'search' as const,
      assigned: 'person' as const,
      pickup: 'local-shipping' as const,
      transit: 'navigation' as const,
      delivered: 'check-circle' as const,
      cancelled: 'cancel' as const
    }
    return icons[status as keyof typeof icons] || ('info' as const)
  }
  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyles[theme === 'auto' ? 'light' : theme]}
        initialRegion={getInitialRegion()}
        onMapReady={onMapReadyHandler}
        showsUserLocation={false} // On gère nous-mêmes
        showsMyLocationButton={false}
        showsTraffic={showTraffic}
        showsBuildings={true}
        showsIndoors={true}
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onRegionChangeComplete={setMapRegion}
      >
        {renderPickupMarker()}
        {renderDeliveryMarker()}
        {renderUserLocationMarker()}
        {renderCourierMarker()}
        {renderRoute()}
      </MapView>

      {renderStatusCard()}

      {/* Contrôles de la carte */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 1000)
            }
          }}
        >
          <MaterialIcons name="my-location" size={24} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (mapRef.current) {
              const region = getInitialRegion()
              mapRef.current.animateToRegion(region, 1000)
            }
          }}
        >
          <MaterialIcons name="center-focus-strong" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Styles modernes style VTC
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  
  // Marqueurs modernes
  modernMarker: {
    alignItems: 'center',
  },
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickupMarker: {
    backgroundColor: '#FF6B00',
  },
  deliveryMarker: {
    backgroundColor: '#4CAF50',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF6B00',
    marginTop: -2,
  },
  
  // Marqueur utilisateur
  userLocationMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
  },
  
  // Marqueur coursier
  courierMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 1,
  },
  onlineBadge: {
    backgroundColor: '#4CAF50',
    width: 12,
    height: 12,
  },
  speedIndicator: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Carte de statut
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  statusCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  statusETA: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Contrôles de carte
  mapControls: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    flexDirection: 'column',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
})

export default VTCStyleMap
