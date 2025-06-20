import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { formatDistance, formatDuration } from '../utils/formatters';

const { width, height } = Dimensions.get('window');

interface Address {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  commune?: string;
  type?: string;
}

interface MapViewProps {
  pickupLocation?: Address | null;
  deliveryLocation?: Address | null;
  style?: any;
  showRoute?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

const CustomMapView: React.FC<MapViewProps> = ({
  pickupLocation,
  deliveryLocation,
  style,
  showRoute = false,
  onLocationUpdate
}) => {
  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultRegion: Region = {
    latitude: pickupLocation?.latitude || 5.316667,
    longitude: pickupLocation?.longitude || -4.033333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    if (pickupLocation && deliveryLocation && showRoute) {
      fetchRoute();
    }
  }, [pickupLocation, deliveryLocation, showRoute]);

  const fetchRoute = async () => {
    if (!pickupLocation || !deliveryLocation) return;
    
    setLoading(true);
    try {
      // Simuler une route simple entre les deux points
      const coordinates = [
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
      ];
      setRouteCoordinates(coordinates);
    } catch (error) {
      console.error('Erreur lors de la récupération de la route:', error);
    } finally {
      setLoading(false);
    }
  };

  const fitToCoordinates = () => {
    if (!pickupLocation || !deliveryLocation || !mapRef.current) return;

    const coordinates = [
      { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
      { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
    ];

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      setTimeout(fitToCoordinates, 1000);
    }
  }, [pickupLocation, deliveryLocation]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsTraffic={false}
      >
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Point de collecte"
            description={pickupLocation.description}
            pinColor="green"
          />
        )}

        {deliveryLocation && (
          <Marker
            coordinate={{
              latitude: deliveryLocation.latitude,
              longitude: deliveryLocation.longitude,
            }}
            title="Point de livraison"
            description={deliveryLocation.description}
            pinColor="red"
          />
        )}

        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#FF6B00"
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Calcul de l'itinéraire...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default CustomMapView;