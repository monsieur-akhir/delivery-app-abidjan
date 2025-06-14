import React, { useEffect, useRef, useState, useCallback } from 'react'
import { View, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native'
import { Text, Surface, Badge, IconButton } from 'react-native-paper'
import MapView, { 
  Marker, 
  Polyline, 
  PROVIDER_GOOGLE, 
  AnimatedRegion, 
  Camera 
} from 'react-native-maps'
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

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

export type VTCDeliveryStatus = 'pending' | 'en_route' | 'delivered' | 'cancelled'

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
    },
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'all',
      stylers: [{ visibility: 'off' }]
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
    },
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [{ visibility: 'off' }]
    }
  ]
}

export const VTCStyleMap: React.FC<VTCStyleMapProps> = ({
  pickupLocation,
  deliveryLocation,
  courier,
  route,
  deliveryStatus,
  userLocation,
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
}) => {
  const mapRef = useRef<MapView>(null)

  // Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current
  const fadeAnimation = useRef(new Animated.Value(0)).current
  const slideAnimation = useRef(new Animated.Value(-100)).current

  // State
  const [isMapReady, setIsMapReady] = useState(false)
  const [courierAnimatedLocation, setCourierAnimatedLocation] = useState<AnimatedRegion | null>(null)
  const [lastCourierUpdate, setLastCourierUpdate] = useState<number>(0)
  const [mapRegion, setMapRegion] = useState({
    latitude: 5.3599517,
    longitude: -4.0082563,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  // Animation du marqueur de recherche
  useEffect(() => {
    if (deliveryStatus.status === 'searching') {
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
          }),
        ])
      ).start()
    }
  }, [deliveryStatus.status, pulseAnimation])

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
        }),
      ]).start()
    }
  }, [isMapReady, fadeAnimation, slideAnimation])

  // Animation du coursier
  useEffect(() => {
    if (courier?.location && courierAnimatedLocation) {
      const now = Date.now()
      if (now - lastCourierUpdate > 2000) {
        courierAnimatedLocation.timing({
          latitude: courier.location.latitude,
          longitude: courier.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
          duration: 2000,
          useNativeDriver: false,
          toValue: 0
        }).start()

        if (followCourier && isMapReady && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: courier.location.latitude,
            longitude: courier.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 2000)
        }
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
  }, [courier?.location, courierAnimatedLocation, followCourier, isMapReady, lastCourierUpdate])

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
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={styles.markerContainer}
          >
            <MaterialIcons name="location-on" size={20} color="#FFFFFF" />
          </LinearGradient>
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
          <LinearGradient
            colors={['#f44336', '#d32f2f']}
            style={styles.markerContainer}
          >
            <MaterialIcons name="flag" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={[styles.markerArrow, { borderTopColor: '#f44336' }]} />
        </View>
      </Marker>
    )
  }

  const renderUserLocationMarker = () => {
    if (!showUserLocation || !userLocation) return null

    return (
      <Marker
        coordinate={userLocation}
        onPress={onUserLocationPress}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <Animated.View style={styles.userLocationMarker}>
          <View style={styles.userLocationDot} />
          <Animated.View 
            style={[
              styles.userLocationPulse,
              { transform: [{ scale: pulseAnimation }] }
            ]} 
          />
        </Animated.View>
      </Marker>
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
              <View style={styles.onlineBadge} />
            </View>
          )}
          <LinearGradient
            colors={[getVehicleColor(courier.vehicle.type), getVehicleColorDark(courier.vehicle.type)]}
            style={styles.courierMarker}
          >
            <MaterialCommunityIcons name={vehicleIcon} size={18} color="#FFFFFF" />
          </LinearGradient>
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
        lineCap="round"
        lineJoin="round"
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
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {getStatusText(deliveryStatus.status)}
                </Text>
                {deliveryStatus.message && (
                  <Text style={styles.statusMessage}>
                    {deliveryStatus.message}
                  </Text>
                )}
                {showETA && deliveryStatus.eta && (
                  <Text style={styles.statusETA}>
                    Arrivée prévue: {deliveryStatus.eta}
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
      motorcycle: 'motorbike' as const,
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

  const getVehicleColorDark = (type: string) => {
    const colors = {
      car: '#1976D2',
      motorcycle: '#E65100',
      bicycle: '#388E3C',
      truck: '#7B1FA2',
      van: '#D84315'
    }
    return colors[type as keyof typeof colors] || '#1976D2'
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

  const getStatusText = (status: string) => {
    const texts = {
      searching: 'Recherche en cours...',
      assigned: 'Coursier assigné',
      pickup: 'Récupération',
      transit: 'En livraison',
      delivered: 'Livré',
      cancelled: 'Annulé'
    }
    return texts[status as keyof typeof texts] || 'En cours'
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
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsTraffic={showTraffic}
        showsBuildings={true}
        showsIndoors={false}
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onRegionChangeComplete={setMapRegion}
        toolbarEnabled={false}
        loadingEnabled={true}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
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
          <MaterialIcons name="my-location" size={20} color="#2196F3" />
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
          <MaterialIcons name="center-focus-strong" size={20} color="#2196F3" />
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4CAF50',
    marginTop: -1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  speedIndicator: {
    position: 'absolute',
    bottom: -18,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Carte de statut
  statusContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  statusCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  statusETA: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },

  // Contrôles de carte
  mapControls: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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