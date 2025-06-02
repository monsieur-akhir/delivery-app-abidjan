import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Platform, Animated } from 'react-native'
import { Text, Card } from 'react-native-paper'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'

// Simplified VTC interfaces
export interface VTCCoordinates {
  latitude: number
  longitude: number
}

export interface VTCVehicle {
  type: string
  model: string
  plate: string
}

export interface VTCCourier {
  id: string
  name: string
  rating: number
  photo?: string
  vehicle: VTCVehicle
  location: VTCCoordinates
  heading?: number
}

export interface VTCRoute {
  coordinates: VTCCoordinates[]
  distance: number
  duration: number
}

export interface VTCDeliveryStatus {
  status: 'searching' | 'assigned' | 'pickup' | 'transit' | 'delivered' | 'cancelled'
  eta?: string
  progress: number
}

export interface VTCStyleMapProps {
  pickupLocation?: VTCCoordinates
  deliveryLocation?: VTCCoordinates
  courier?: VTCCourier
  route?: VTCRoute
  deliveryStatus: VTCDeliveryStatus
  onMapReady?: () => void
  onCourierPress?: () => void
  onRoutePress?: () => void
}

export const VTCStyleMap: React.FC<VTCStyleMapProps> = ({
  pickupLocation,
  deliveryLocation,
  courier,
  route,
  deliveryStatus,
  onMapReady,
  onCourierPress,
  onRoutePress
}) => {
  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const pulseAnimation = useRef(new Animated.Value(1)).current

  // Simplified animation effect
  useEffect(() => {
    if (deliveryStatus.status === 'searching') {
      const startPulse = () => {
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
      }
      startPulse()
    }
  }, [deliveryStatus.status, pulseAnimation])

  // Initial region calculation
  const getInitialRegion = () => {
    if (pickupLocation && deliveryLocation) {
      const midLat = (pickupLocation.latitude + deliveryLocation.latitude) / 2
      const midLng = (pickupLocation.longitude + deliveryLocation.longitude) / 2
      const latDelta = Math.abs(pickupLocation.latitude - deliveryLocation.latitude) * 1.5
      const lngDelta = Math.abs(pickupLocation.longitude - deliveryLocation.longitude) * 1.5
      
      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      }
    }
    
    if (pickupLocation) {
      return {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }
    
    // Default to Abidjan
    return {
      latitude: 5.3599517,
      longitude: -4.0082563,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }
  }

  // Status information
  const getStatusInfo = () => {
    switch (deliveryStatus.status) {
      case 'searching':
        return {
          title: t('vtcMap.searching'),
          subtitle: t('vtcMap.searchingSubtitle'),
          color: '#FF6B00',
          icon: 'search' as keyof typeof MaterialIcons.glyphMap
        }
      case 'assigned':
        return {
          title: t('vtcMap.courierAssigned'),
          subtitle: courier?.name || t('vtcMap.courierOnWay'),
          color: '#2196F3',
          icon: 'person' as keyof typeof MaterialIcons.glyphMap
        }
      case 'pickup':
        return {
          title: t('vtcMap.courierArrived'),
          subtitle: t('vtcMap.pickupInProgress'),
          color: '#FF9800',
          icon: 'local-shipping' as keyof typeof MaterialIcons.glyphMap
        }
      case 'transit':
        return {
          title: t('vtcMap.inTransit'),
          subtitle: deliveryStatus.eta ? `${t('vtcMap.estimatedArrival')}: ${deliveryStatus.eta}` : t('vtcMap.onTheWay'),
          color: '#4CAF50',
          icon: 'navigation' as keyof typeof MaterialIcons.glyphMap
        }
      case 'delivered':
        return {
          title: t('vtcMap.delivered'),
          subtitle: t('vtcMap.deliveryCompleted'),
          color: '#4CAF50',
          icon: 'check-circle' as keyof typeof MaterialIcons.glyphMap
        }
      case 'cancelled':
        return {
          title: t('vtcMap.cancelled'),
          subtitle: t('vtcMap.deliveryCancelled'),
          color: '#F44336',
          icon: 'cancel' as keyof typeof MaterialIcons.glyphMap
        }
      default:
        return {
          title: t('vtcMap.searching'),
          subtitle: t('vtcMap.searchingSubtitle'),
          color: '#FF6B00',
          icon: 'search' as keyof typeof MaterialIcons.glyphMap
        }
    }
  }

  const statusInfo = getStatusInfo()

  // Custom marker components
  const renderPickupMarker = () => (
    <Marker coordinate={pickupLocation!} anchor={{ x: 0.5, y: 0.5 }}>
      <Animated.View style={[
        styles.markerContainer,
        { transform: [{ scale: deliveryStatus.status === 'searching' ? pulseAnimation : 1 }] }
      ]}>
        <View style={[styles.marker, { backgroundColor: '#FF6B00' }]}>
          <Ionicons name="location" size={20} color="white" />
        </View>
        <View style={styles.markerShadow} />
      </Animated.View>
    </Marker>
  )

  const renderDeliveryMarker = () => (
    <Marker coordinate={deliveryLocation!} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.markerContainer}>
        <View style={[styles.marker, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="flag" size={20} color="white" />
        </View>
        <View style={styles.markerShadow} />
      </View>
    </Marker>
  )

  const renderCourierMarker = () => {
    if (!courier) return null

    return (
      <Marker
        coordinate={courier.location}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={courier.heading || 0}
        flat={Platform.OS === 'ios'}
        onPress={onCourierPress}
      >
        <View style={styles.courierMarkerContainer}>
          <View style={[styles.courierMarker, { backgroundColor: statusInfo.color }]}>
            <MaterialIcons name="motorcycle" size={24} color="white" />
          </View>
          <View style={styles.courierMarkerShadow} />
        </View>
      </Marker>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={true}
        loadingEnabled={true}
        onMapReady={onMapReady}
        customMapStyle={[]}
      >
        {pickupLocation && renderPickupMarker()}
        {deliveryLocation && renderDeliveryMarker()}
        {courier && renderCourierMarker()}
        
        {route && route.coordinates && route.coordinates.length > 1 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor={statusInfo.color}
            strokeWidth={4}
            lineDashPattern={[1]}
            onPress={onRoutePress}
          />
        )}
      </MapView>

      {/* Status Card */}
      <View style={styles.statusCardContainer}>
        <Card style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
          <Card.Content style={styles.statusCardContent}>
            <View style={styles.statusIconContainer}>
              <MaterialIcons 
                name={statusInfo.icon} 
                size={24} 
                color={statusInfo.color} 
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text variant="titleMedium" style={styles.statusTitle}>
                {statusInfo.title}
              </Text>
              <Text variant="bodyMedium" style={styles.statusSubtitle}>
                {statusInfo.subtitle}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${deliveryStatus.progress}%`,
                backgroundColor: statusInfo.color 
              }
            ]} 
          />
        </View>
      </View>
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
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  markerShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: -1,
  },
  courierMarkerContainer: {
    alignItems: 'center',
  },
  courierMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  courierMarkerShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: -1,
  },
  statusCardContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusIconContainer: {
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    opacity: 0.7,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
})
