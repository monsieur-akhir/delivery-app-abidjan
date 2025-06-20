import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
}

const DeliveryMapView: React.FC<DeliveryMapProps> = ({
  pickupLocation,
  deliveryLocation,
}) => {
  const initialRegion = {
    latitude: (pickupLocation.latitude + deliveryLocation.latitude) / 2,
    longitude: (pickupLocation.longitude + deliveryLocation.longitude) / 2,
    latitudeDelta: Math.abs(pickupLocation.latitude - deliveryLocation.latitude) * 1.5,
    longitudeDelta: Math.abs(pickupLocation.longitude - deliveryLocation.longitude) * 1.5,
  };

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