
import React from 'react'
import { View, StyleSheet } from 'react-native'
import MapView, { Marker, Polyline, Region } from 'react-native-maps'
import type { Delivery, TrackingPoint } from '../types'

export interface MapRoute {
  coordinates: Array<{
    latitude: number
    longitude: number
  }>
  distance: number
  duration: number
}

interface CustomMapViewProps {
  initialRegion?: Region
  deliveries?: Delivery[]
  trackingPoints?: TrackingPoint[]
  route?: MapRoute
  onRegionChange?: (region: Region) => void
  style?: any
}

const CustomMapView: React.FC<CustomMapViewProps> = ({
  initialRegion,
  deliveries = [],
  trackingPoints = [],
  route,
  onRegionChange,
  style
}) => {
  const defaultRegion: Region = {
    latitude: 5.316667,
    longitude: -4.033333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion || defaultRegion}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton
      >
        {deliveries.map((delivery) => (
          <React.Fragment key={delivery.id}>
            <Marker
              coordinate={{
                latitude: delivery.pickup_lat,
                longitude: delivery.pickup_lng,
              }}
              title="Point de collecte"
              description={delivery.pickup_address}
              pinColor="green"
            />
            <Marker
              coordinate={{
                latitude: delivery.delivery_lat,
                longitude: delivery.delivery_lng,
              }}
              title="Point de livraison"
              description={delivery.delivery_address}
              pinColor="red"
            />
          </React.Fragment>
        ))}

        {trackingPoints.map((point, index) => (
          <Marker
            key={`${point.id}-${index}`}
            coordinate={{
              latitude: point.lat,
              longitude: point.lng,
            }}
            title={`Point ${index + 1}`}
            description={point.notes || ''}
          />
        ))}

        {route && route.coordinates.length > 0 && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#007AFF"
            strokeWidth={3}
          />
        )}
      </MapView>
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
})

export default CustomMapView
export { CustomMapView }
export type { MapRoute }
