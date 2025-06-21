import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { theme } from '../styles/colors';

interface Location {
  latitude: number;
  longitude: number;
  description?: string;
}

interface DeliveryMapProps {
  pickupLocation: Location;
  deliveryLocation: Location;
  routePolyline?: string;
}

const decodePolyline = (t: string): { latitude: number; longitude: number }[] => {
  let points = [];
  let index = 0, len = t.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
};

const DeliveryMapView: React.FC<DeliveryMapProps> = ({
  pickupLocation,
  deliveryLocation,
  routePolyline,
}) => {
  const initialRegion = {
    latitude: (pickupLocation.latitude + deliveryLocation.latitude) / 2,
    longitude: (pickupLocation.longitude + deliveryLocation.longitude) / 2,
    latitudeDelta: Math.abs(pickupLocation.latitude - deliveryLocation.latitude) * 1.5,
    longitudeDelta: Math.abs(pickupLocation.longitude - deliveryLocation.longitude) * 1.5,
  };

  const polylineCoords = routePolyline ? decodePolyline(routePolyline) : undefined;

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={{
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          }}
          title="Point de ramassage"
          description={pickupLocation.description}
        >
          <View style={[styles.markerContainer, styles.pickupMarker]}>
            <Feather name="map-pin" size={24} color={theme.colors.primary} />
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: deliveryLocation.latitude,
            longitude: deliveryLocation.longitude,
          }}
          title="Point de livraison"
          description={deliveryLocation.description}
        >
          <View style={[styles.markerContainer, styles.deliveryMarker]}>
            <Feather name="flag" size={24} color={theme.colors.primary} />
          </View>
        </Marker>

        {polylineCoords && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickupMarker: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  deliveryMarker: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
});

export default DeliveryMapView;