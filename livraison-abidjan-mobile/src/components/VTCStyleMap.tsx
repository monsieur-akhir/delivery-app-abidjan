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

// Type corrigé pour VTCDeliveryStatus
export interface VTCDeliveryStatus {
  status: 'pending' | 'searching' | 'assigned' | 'transit' | 'delivered' | 'cancelled'
  message?: string
  eta?: string
  progress?: number
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

  // Animations d'état de livraison
  useEffect(() => {
    if (deliveryStatus.status === 'searching') {
      // Animation de pulsation pour la recherche
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
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
    } else {
      pulseAnimation.setValue(1)
    }
  }, [deliveryStatus.status, pulseAnimation])

  // Fonctions utilitaires pour les statuts
  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'searching':
        return ['#FF6B6B', '#FF8E53']
      case 'assigned':
        return ['#4ECDC4', '#44A08D']
      case 'transit':
        return ['#45B7D1', '#96C93D']
      case 'delivered':
        return ['#96C93D', '#02AAB0']
      case 'cancelled':
        return ['#FF6B6B', '#C44569']
      default:
        return ['#BDC3C7', '#95A5A6']
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'searching':
        return 'search'
      case 'assigned':
        return 'person-pin'
      case 'transit':
        return 'directions-car'
      case 'delivered':
        return 'check-circle'
      case 'cancelled':
        return 'cancel'
      default:
        return 'help'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching':
        return 'Recherche en cours...'
      case 'assigned':
        return 'Coursier assigné'
      case 'transit':
        return 'En transit'
      case 'delivered':
        return 'Livré'
      case 'cancelled':
        return 'Annulé'
      default:
        return 'En attente'
    }
  }

  // Fonction pour obtenir la région initiale
  const getInitialRegion = useCallback(() => {
    if (pickupLocation && deliveryLocation) {
      const minLat = Math.min(pickupLocation.latitude, deliveryLocation.latitude)
      const maxLat = Math.max(pickupLocation.latitude, deliveryLocation.latitude)
      const minLng = Math.min(pickupLocation.longitude, deliveryLocation.longitude)
      const maxLng = Math.max(pickupLocation.longitude, deliveryLocation.longitude)

      const centerLat = (minLat + maxLat) / 2
      const centerLng = (minLng + maxLng) / 2
      const deltaLat = (maxLat - minLat) * 1.5
      const deltaLng = (maxLng - minLng) * 1.5

      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(deltaLat, 0.01),
        longitudeDelta: Math.max(deltaLng, 0.01),
      }
    } else if (pickupLocation) {
      return {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    } else {
      return mapRegion
    }
  }, [pickupLocation, deliveryLocation, mapRegion])

  // Mise à jour de la région de la carte
  useEffect(() => {
    if (isMapReady) {
      const region = getInitialRegion()
      mapRef.current?.animateToRegion(region, 1000)
    }
  }, [isMapReady, getInitialRegion])

  // Animation d'apparition des éléments UI
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnimation, slideAnimation])

  return (
    <View style={[styles.container, style]}>
      {/* Carte principale */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsTraffic={showTraffic}
        onMapReady={() => {
          setIsMapReady(true)
          onMapReady?.()
        }}
        mapType="standard"
        customMapStyle={theme === 'dark' ? darkMapStyle : undefined}
      >
        {/* Marqueur de ramassage */}
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            onPress={onPickupPress}
            anchor={{ x: 0.5, y: 1 }}
          >
            <Animated.View
              style={[
                styles.markerContainer,
                { transform: [{ scale: deliveryStatus.status === 'searching' ? pulseAnimation : 1 }] }
              ]}
            >
              <LinearGradient
                colors={Array.isArray(getStatusGradient(deliveryStatus.status)) ? getStatusGradient(deliveryStatus.status) : [getStatusGradient(deliveryStatus.status)] as [string]}
                style={styles.pickupMarker}
              >
                <MaterialIcons name="location-on" size={20} color="white" />
              </LinearGradient>
            </Animated.View>
          </Marker>
        )}

        {/* Marqueur de livraison */}
        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            onPress={onDeliveryPress}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <LinearGradient
                colors={Array.isArray(getStatusGradient(deliveryStatus.status)) ? getStatusGradient(deliveryStatus.status) : [getStatusGradient(deliveryStatus.status)] as [string]}
                style={styles.deliveryMarker}
              >
                <MaterialIcons name="flag" size={20} color="white" />
              </LinearGradient>
            </View>
          </Marker>
        )}

        {/* Marqueur du coursier */}
        {courier && (
          <Marker
            coordinate={courier.location}
            onPress={onCourierPress}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={courier.heading || 0}
          >
            <View style={styles.courierMarker}>
              <MaterialIcons 
                name={courier.vehicle.type === 'car' ? 'directions-car' : 'motorcycle'} 
                size={24} 
                color="#2196F3" 
              />
            </View>
          </Marker>
        )}

        {/* Tracé de la route */}
        {route && route.coordinates.length > 0 && (
          <Polyline
            coordinates={route.coordinates}
            strokeWidth={4}
            strokeColor="#2196F3"
            lineDashPattern={[5, 5]}
            onPress={onRoutePress}
          />
        )}
      </MapView>

      {/* Interface utilisateur superposée */}
      <Animated.View 
        style={[
          styles.statusContainer,
          { opacity: fadeAnimation, transform: [{ translateY: slideAnimation }] }
        ]}
      >
        <Surface style={styles.statusCard} elevation={4}>
          <LinearGradient
            colors={Array.isArray(getStatusGradient(deliveryStatus.status)) ? getStatusGradient(deliveryStatus.status) : [getStatusGradient(deliveryStatus.status)] as [string]}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <MaterialIcons 
                name={getStatusIcon(deliveryStatus.status)} 
                size={24} 
                color="white" 
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusText}>
                  {getStatusText(deliveryStatus.status)}
                </Text>
                {deliveryStatus.message && (
                  <Text style={styles.statusSubText}>
                    {deliveryStatus.message}
                  </Text>
                )}
                {showETA && deliveryStatus.eta && (
                  <Text style={styles.etaText}>
                    Arrivée prévue: {deliveryStatus.eta}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Barre de progression */}
          {showProgress && deliveryStatus.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${deliveryStatus.progress}%`,
                    backgroundColor: Array.isArray(getStatusGradient(deliveryStatus.status)) ? getStatusGradient(deliveryStatus.status)[0] : getStatusGradient(deliveryStatus.status)
                  }
                ]} 
              />
            </View>
          )}
        </Surface>
      </Animated.View>

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

// Style de carte sombre
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
]

// Styles modernes
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
  },

  // Marqueurs
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  deliveryMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  courierMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Interface utilisateur superposée
  statusContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
  },
  statusCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statusSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  etaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },

  // Barre de progression
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
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