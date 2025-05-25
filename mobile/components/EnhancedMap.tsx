"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { View, StyleSheet, TouchableOpacity, Platform, type StyleProp, type ViewStyle } from "react-native"
import { Text, ActivityIndicator } from "react-native-paper"
import MapView, { Polyline, PROVIDER_GOOGLE, type Region, Marker, Callout } from "react-native-maps"

import * as Location from "expo-location"
import { useTranslation } from "react-i18next"
import RouteOptimizationService from "../services/RouteOptimizationService"
import FeatherIcon, { FeatherIconName } from "./FeatherIcon"
import type { Coordinates } from "../types/models"

interface EnhancedMapProps {
  initialRegion?: {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }
  markers?: Array<{
    id: string | number
    coordinate: Coordinates
    title?: string
    description?: string
    color?: string
    icon?: string
  }>
  showUserLocation?: boolean
  showTraffic?: boolean
  routeCoordinates?: Coordinates[]
  onRegionChange?: (region: Region) => void
  onMarkerPress?: (markerId: string | number) => void
  onMapPress?: (coordinate: Coordinates) => void
  style?: StyleProp<ViewStyle> // Style spécifique avec type correct
  zoomEnabled?: boolean
  rotateEnabled?: boolean
  scrollEnabled?: boolean
  pitchEnabled?: boolean
  toolbarEnabled?: boolean
  showCompass?: boolean
  showScale?: boolean
  loadingRoute?: boolean
  children?: React.ReactNode
}

interface TrafficHotspot {
  coordinates: Coordinates
  intensity: number
}

const EnhancedMap: React.FC<EnhancedMapProps> = ({
  initialRegion = {
    latitude: 5.3599517,
    longitude: -4.0082563,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  markers = [],
  showUserLocation = true,
  showTraffic = false,
  routeCoordinates,
  onRegionChange,
  onMarkerPress,
  onMapPress,
  style,
  zoomEnabled = true,
  rotateEnabled = true,
  scrollEnabled = true,
  pitchEnabled = true,
  toolbarEnabled = true,
  showCompass = true,
  showScale = false,
  loadingRoute = false,
  children,
}) => {
  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)

  const [region, setRegion] = useState(initialRegion)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [trafficHotspots, setTrafficHotspots] = useState<TrafficHotspot[]>([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const getUserLocation = useCallback(async () => {
    try {
      setIsLoadingLocation(true)

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        // Permission denied, handle silently or show user feedback
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const userCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      setUserLocation(userCoordinates)

      // Centrer la carte sur la position de l'utilisateur si aucune région initiale n'est fournie
      if (!initialRegion.latitude && !initialRegion.longitude) {
        setRegion({
          ...userCoordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })

        mapRef.current?.animateToRegion({
          ...userCoordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        })
      }
    } catch (error) {
      console.error("Error getting user location:", error)
    } finally {
      setIsLoadingLocation(false)
    }
  }, [initialRegion])

  const loadTrafficData = useCallback(async () => {
    try {
      const hotspots = await RouteOptimizationService.getTrafficHotspots()
      setTrafficHotspots(hotspots)
    } catch (error) {
      console.error("Error loading traffic data:", error)
    }
  }, [])

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion)
    if (onRegionChange) {
      onRegionChange(newRegion)
    }
  }

  const handleMapPress = (event: { nativeEvent: { coordinate: Coordinates } }) => {
    if (onMapPress) {
      onMapPress(event.nativeEvent.coordinate)
    }
  }

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    } else {
      getUserLocation()
    }
  }

  const fitToMarkers = () => {
    if (markers.length > 0 && mapRef.current) {
      const coordinates = markers.map((marker) => marker.coordinate)

      if (routeCoordinates && routeCoordinates.length > 0) {
        coordinates.push(...routeCoordinates)
      }

      if (userLocation) {
        coordinates.push(userLocation)
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
    }
  }

  const getTrafficColor = (intensity: number) => {
    if (intensity > 0.7) return "rgba(244, 67, 54, 0.8)" // Rouge
    if (intensity > 0.4) return "rgba(255, 152, 0, 0.8)" // Orange
    return "rgba(255, 193, 7, 0.8)" // Jaune
  }

  const getTrafficLevel = (intensity: number) => {
    if (intensity > 0.7) return t("map.heavy")
    if (intensity > 0.4) return t("map.moderate")
    return t("map.light")
  }

  // Rendu des hotspots de trafic
  const renderTrafficHotspots = () => (
    trafficHotspots.map((hotspot, index) => (
      <Marker key={`hotspot-${index}`} coordinate={hotspot.coordinates} tracksViewChanges={false}>
        <View style={[styles.trafficHotspot, { backgroundColor: getTrafficColor(hotspot.intensity) }]}>
          <FeatherIcon name="alert-triangle" size={16} color="#FFFFFF" />
        </View>
        <Callout tooltip>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{t("map.trafficAlert")}</Text>
            <Text style={styles.calloutText}>
              {t("map.congestionLevel")}: {getTrafficLevel(hotspot.intensity)}
            </Text>
          </View>
        </Callout>
      </Marker>
    ))
  )

  useEffect(() => {
    getUserLocation()
    loadTrafficData()
  }, [getUserLocation, loadTrafficData])

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsTraffic={showTraffic}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        scrollEnabled={scrollEnabled}
        pitchEnabled={pitchEnabled}
        toolbarEnabled={toolbarEnabled}
        showsCompass={showCompass}
        showsScale={showScale}
        loadingEnabled={true}
        {...{} /* Cast to enforce type compatibility */}
      >
        {markers.map((marker) => (
          <Marker key={marker.id} coordinate={marker.coordinate} title={marker.title} description={marker.description} onPress={() => onMarkerPress?.(marker.id)}>
            {marker.icon && (
              <View style={[styles.customMarker, { backgroundColor: marker.color || "#FF6B00" }]}>
                <FeatherIcon name={marker.icon as FeatherIconName} size={20} color="#FFFFFF" />
              </View>
            )}
          </Marker>
        ))}

        {renderTrafficHotspots()}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#FF6B00" lineDashPattern={[1]} />
        )}

        {children}
      </MapView>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapButton} onPress={centerOnUserLocation} disabled={isLoadingLocation}>
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FeatherIcon name="crosshair" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {markers.length > 0 && (
          <TouchableOpacity style={styles.mapButton} onPress={fitToMarkers}>
            <FeatherIcon name="maximize" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {loadingRoute && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#FF6B00" />
            <Text style={styles.loadingText}>{t("map.calculatingRoute")}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "center",
  },
  mapButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 30,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  customMarker: {
    borderRadius: 20,
    padding: 4,
  },
  trafficHotspot: {
    borderRadius: 20,
    padding: 4,
  },
  callout: {
    width: 150,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
  },
  loadingContainer: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#212121",
  },
})

export default EnhancedMap
