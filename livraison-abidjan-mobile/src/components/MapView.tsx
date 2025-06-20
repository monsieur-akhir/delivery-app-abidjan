import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator
} from 'react-native'
import MapView, { 
  Marker, 
  Polyline, 
  PROVIDER_DEFAULT,
  LatLng,
  Region,
  MarkerDragStartEndEvent
} from 'react-native-maps'
import { MaterialIcons } from '@expo/vector-icons'
import { getDirections, getTrafficInfo } from '../services/api'
import { Feather } from '@expo/vector-icons'
import { colors } from '../styles/colors'

const { width, height } = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0922
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

// Interface pour les coordonnées
export interface Coordinates {
  latitude: number
  longitude: number
}

// Interface pour les points d'intérêt
export interface MapPoint {
  id: string
  coordinate: Coordinates
  title: string
  description?: string
  type: 'pickup' | 'delivery' | 'courier' | 'poi'
}

// Interface pour les routes
export interface Route {
  coordinates: LatLng[]
  distance: number
  duration: number
  instructions: string[]
}

// Interface pour les informations de trafic
export interface TrafficInfo {
  level: 'low' | 'moderate' | 'high' | 'severe'
  delay: number
  description: string
}

// Props du composant
export interface MapViewProps {
  initialRegion?: Region
  pickupPoint?: Coordinates & { title: string; description: string }
  deliveryPoint?: Coordinates & { title: string; description: string }
  pickupLocation?: Coordinates
  deliveryLocation?: Coordinates
  courierLocation?: Coordinates
  onPickupPointSelected?: (coordinate: Coordinates) => void
  onDeliveryPointSelected?: (coordinate: Coordinates) => void
  onPickupLocationChange?: (location: Coordinates) => void
  onDeliveryLocationChange?: (location: Coordinates) => void
  onRegionChange?: (region: Region) => void
  onRouteCalculated?: (route: Route) => void
  onTrafficUpdate?: (traffic: TrafficInfo) => void
  showUserLocation?: boolean
  showsUserLocation?: boolean
  showTraffic?: boolean
  showsTraffic?: boolean
  isInteractive?: boolean
  route?: Route
  markers?: MapPoint[]
  style?: object
}

const CustomMapView: React.FC<MapViewProps> = ({
  initialRegion,
  pickupPoint,
  deliveryPoint,
  pickupLocation,
  deliveryLocation,
  courierLocation,
  onPickupPointSelected,
  onDeliveryPointSelected,
  onPickupLocationChange,
  onDeliveryLocationChange,
  onRegionChange,
  onRouteCalculated,
  onTrafficUpdate,
  showUserLocation = true,
  showsUserLocation = true,
  showTraffic = false,
  showsTraffic = false,
  isInteractive = true,
  route,
  markers = [],
  style
}) => {
  // States
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 5.3599517,
      longitude: -4.0082563,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }
  )
  const [calculatedRoute, setCalculatedRoute] = useState<Route | null>(null)
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [directions, setDirections] = useState(null)
  const [traffic, setTraffic] = useState([])
  // Refs
  const mapRef = useRef<MapView>(null)

  const getInitialRegion = () => {
    if (pickupLocation && deliveryLocation) {
      const midLat = (pickupLocation.latitude + deliveryLocation.latitude) / 2
      const midLng = (pickupLocation.longitude + deliveryLocation.longitude) / 2
      const latDelta = Math.abs(pickupLocation.latitude - deliveryLocation.latitude) * 1.5
      const lngDelta = Math.abs(pickupLocation.longitude - deliveryLocation.longitude) * 1.5
      return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }
    }
    const location = pickupLocation || deliveryLocation
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    }
    return {
      latitude: 5.36, // Abidjan
      longitude: -4.0,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }
  }

  // Effect pour calculer la route
  useEffect(() => {
    const fetchDirectionsAndTraffic = async () => {
      const pickup = pickupLocation || pickupPoint
      const delivery = deliveryLocation || deliveryPoint
      
      if (!pickup || !delivery) return

      try {
        setLoading(true)
        const directions = await getDirections(
          pickup.latitude,
          pickup.longitude,
          delivery.latitude,
          delivery.longitude
        )

        if (directions && directions.coordinates) {
          const routeData: Route = {
            coordinates: directions.coordinates,
            distance: directions.distance || 0,
            duration: directions.duration || 0,
            instructions: directions.instructions || [],
          }
          setCalculatedRoute(routeData)
          
          if (onRouteCalculated) {
            onRouteCalculated(routeData)
          }

          // Obtenir les infos de trafic
          if (showTraffic || showsTraffic) {            const traffic = await getTrafficInfo(
              pickup.latitude,
              pickup.longitude,
              delivery.latitude,
              delivery.longitude
            )

            if (traffic) {
              // Transform API response to TrafficInfo format
              const durationMinutes = Math.round(traffic.duration / 60)
              let level: 'low' | 'moderate' | 'high' | 'severe' = 'low'
              
              // Determine traffic level based on duration and distance
              const speedKmh = (traffic.distance / 1000) / (traffic.duration / 3600)
              if (speedKmh < 10) {
                level = 'severe'
              } else if (speedKmh < 20) {
                level = 'high'
              } else if (speedKmh < 30) {
                level = 'moderate'
              }
              
              const trafficData: TrafficInfo = {
                level,
                delay: Math.max(0, durationMinutes - (traffic.distance / 1000) * 2), // Estimate delay based on normal travel time
                description: `Route de ${(traffic.distance / 1000).toFixed(1)} km, durée estimée ${durationMinutes} min`,
              }
              setTrafficInfo(trafficData)
              
              if (onTrafficUpdate) {
                onTrafficUpdate(trafficData)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error calculating route:', error)
      } finally {
        setLoading(false)
      }
    }

    if (pickupLocation && deliveryLocation) {
      fetchDirectionsAndTraffic()
    }
  }, [pickupLocation, deliveryLocation])

  // Gestionnaire de changement de région
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion)
    if (onRegionChange) {
      onRegionChange(newRegion)
    }
  }

  // Gestionnaire de drag des marqueurs
  const handlePickupDrag = (e: MarkerDragStartEndEvent) => {
    const coordinate = e.nativeEvent.coordinate
    if (onPickupLocationChange) {
      onPickupLocationChange(coordinate)
    }
    if (onPickupPointSelected) {
      onPickupPointSelected(coordinate)
    }
  }

  const handleDeliveryDrag = (e: MarkerDragStartEndEvent) => {
    const coordinate = e.nativeEvent.coordinate
    if (onDeliveryLocationChange) {
      onDeliveryLocationChange(coordinate)
    }
    if (onDeliveryPointSelected) {
      onDeliveryPointSelected(coordinate)
    }
  }

  // Fonction pour centrer la carte sur tous les points
  const fitToCoordinates = () => {
    const pickup = pickupLocation || pickupPoint
    const delivery = deliveryLocation || deliveryPoint
    
    if (mapRef.current && pickup && delivery) {
      const coordinates = [pickup, delivery]
      if (courierLocation) {
        coordinates.push(courierLocation)
      }
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
    }
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region || getInitialRegion()}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={showUserLocation || showsUserLocation}
        showsTraffic={showTraffic || showsTraffic}
        scrollEnabled={isInteractive}
        zoomEnabled={isInteractive}
        rotateEnabled={isInteractive}
        pitchEnabled={isInteractive}
      >
        {/* Marqueur de ramassage */}
        {(pickupLocation || pickupPoint) && (
          <Marker
            coordinate={pickupLocation || pickupPoint!}
            title={pickupPoint?.title || "Point de ramassage"}
            description={pickupPoint?.description || ""}
            pinColor="#FF6B00"
            draggable={isInteractive}
            onDragEnd={handlePickupDrag}
          >
            <View style={[styles.markerContainer, styles.pickupMarker]}>
              <Feather name="map-pin" size={24} color={colors.primary} />
            </View>
          </Marker>
        )}

        {/* Marqueur de livraison */}
        {(deliveryLocation || deliveryPoint) && (
          <Marker
            coordinate={deliveryLocation || deliveryPoint!}
            title={deliveryPoint?.title || "Point de livraison"}
            description={deliveryPoint?.description || ""}
            pinColor="#4CAF50"
            draggable={isInteractive}
            onDragEnd={handleDeliveryDrag}
          >
            <View style={[styles.markerContainer, styles.deliveryMarker]}>
              <Feather name="flag" size={24} color={colors.primary} />
            </View>
          </Marker>
        )}

        {/* Marqueur du coursier */}
        {courierLocation && (
          <Marker
            coordinate={courierLocation}
            title="Coursier"
            pinColor="#2196F3"
          />
        )}

        {/* Marqueurs personnalisés */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={
              marker.type === 'pickup' ? '#FF6B00' :
              marker.type === 'delivery' ? '#4CAF50' :
              marker.type === 'courier' ? '#2196F3' : '#9C27B0'
            }
          />
        ))}

        {/* Route calculée */}
        {(calculatedRoute || route) && (
          <Polyline
            coordinates={(route?.coordinates || calculatedRoute?.coordinates) || []}
            strokeColor={
              trafficInfo?.level === 'severe' ? '#FF0000' :
              trafficInfo?.level === 'high' ? '#FF4500' :
              trafficInfo?.level === 'moderate' ? '#FFA500' : '#0000FF'
            }
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Contrôles de la carte */}
      <View style={styles.controls}>
        {loading && (
          <TouchableOpacity style={styles.loadingButton} disabled>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>Calcul...</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.centerButton} onPress={fitToCoordinates}>
          <MaterialIcons name="center-focus-strong" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Informations de trafic */}
      {trafficInfo && (
        <View style={styles.trafficInfo}>
          <Text style={styles.trafficText}>
            Trafic: {trafficInfo.level} - Délai: {trafficInfo.delay} min
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  centerButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingButton: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trafficInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,    borderRadius: 8,
  },  trafficText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickupMarker: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  deliveryMarker: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
})

export default CustomMapView
