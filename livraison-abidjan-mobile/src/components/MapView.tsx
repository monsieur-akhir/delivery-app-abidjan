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

interface MapViewProps {
  pickupLocation?: Address | null;
  deliveryLocation?: Address | null;
  courierLocation?: { latitude: number; longitude: number } | null;
  showCourierLocation?: boolean;
  onMapReady?: () => void;
  style?: any;
}

const COLORS = {
  primary: '#FF4D4D',
  success: '#34C759',
  warning: '#FF9500',
  background: '#F8F9FA',
  text: '#1A1A1A',
  textSecondary: '#8E8E93',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

const { width, height } = Dimensions.get('window');

const CustomMapView: React.FC<MapViewProps> = ({
  pickupLocation,
  deliveryLocation,
  courierLocation,
  showCourierLocation = false,
  onMapReady,
  style,
  showRoute
}) => {
  const mapRef = useRef<MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

  // Calculer la distance entre deux points
  const calculateDistance = (coord1: any, coord2: any): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculer et afficher la route
  useEffect(() => {
    if (pickupLocation && deliveryLocation && mapReady) {
      calculateRoute();
    }
  }, [pickupLocation, deliveryLocation, mapReady]);

  const calculateRoute = async () => {
    if (!pickupLocation || !deliveryLocation) return;

    setLoading(true);
    try {
      // Simulation d'une route simple (ligne droite avec quelques points intermédiaires)
      const dist = calculateDistance(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
      );

      setDistance(dist);
      setDuration(dist * 2.5); // Estimation: 2.5 minutes par km

      // Créer une route simple avec des points intermédiaires
      const coords = [];
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const lat = pickupLocation.latitude + 
          (deliveryLocation.latitude - pickupLocation.latitude) * (i / steps);
        const lng = pickupLocation.longitude + 
          (deliveryLocation.longitude - pickupLocation.longitude) * (i / steps);
        coords.push({ latitude: lat, longitude: lng });
      }

      setRouteCoordinates(coords);

      // Ajuster la vue de la carte
      if (mapRef.current) {
        mapRef.current.fitToCoordinates([
          { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
        ], {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Erreur lors du calcul de route:', error);
    } finally {
      setLoading(false);
    }
  };

   // Obtenir la position actuelle de l'utilisateur
   useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // Demander les permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission de localisation refusée');
        setLoadingLocation(false);
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.warn('Erreur lors de la récupération de la position:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Région par défaut (Abidjan ou position utilisateur)
  const initialRegion = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return {
      latitude: 5.3599,
      longitude: -3.9569,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [userLocation]);

  // Calculer la région optimale pour afficher tous les points
  const getOptimalRegion = useMemo(() => {
    // Si on a les deux lieux, centrer sur eux
    if (pickupLocation && deliveryLocation) {
      const minLat = Math.min(pickupLocation.latitude, deliveryLocation.latitude);
      const maxLat = Math.max(pickupLocation.latitude, deliveryLocation.latitude);
      const minLng = Math.min(pickupLocation.longitude, deliveryLocation.longitude);
      const maxLng = Math.max(pickupLocation.longitude, deliveryLocation.longitude);

      const latDelta = (maxLat - minLat) * 1.5;
      const lngDelta = (maxLng - minLng) * 1.5;

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };
    }

    // Si on a un seul lieu, centrer sur lui
    if (pickupLocation) {
      return {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    if (deliveryLocation) {
      return {
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Sinon utiliser la région par défaut (position utilisateur ou Abidjan)
    return initialRegion;
  }, [pickupLocation, deliveryLocation, initialRegion]);

  const handleMapReady = () => {
    setMapReady(true);
    onMapReady?.();
  };

  return (
    <View style={[styles.container, style]}>
      {loadingLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF4D4D" />
          <Text style={styles.loadingText}>Localisation en cours...</Text>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        loadingEnabled={true}
        mapType="standard"
        region={getOptimalRegion}
      >
        {/* Marqueur de la position actuelle par défaut */}
        {userLocation && !pickupLocation && !deliveryLocation && (
          <Marker
            coordinate={userLocation}
            title="Votre position"
            description="Position actuelle"
          >
            <View style={[styles.markerContainer, styles.currentLocationMarker]}>
              <MaterialCommunityIcons name="motorbike" size={28} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Marker de prise en charge */}
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Prise en charge"
            description={pickupLocation.description}
            pinColor={COLORS.primary}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.pickupMarker]}>
                <Ionicons name="location" size={20} color={COLORS.white} />
              </View>
            </View>
          </Marker>
        )}

        {/* Marker de livraison */}
        {deliveryLocation && (
          <Marker
            coordinate={{
              latitude: deliveryLocation.latitude,
              longitude: deliveryLocation.longitude,
            }}
            title="Livraison"
            description={deliveryLocation.description}
            pinColor={COLORS.success}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.deliveryMarker]}>
                <Ionicons name="flag" size={20} color={COLORS.white} />
              </View>
            </View>
          </Marker>
        )}

        {/* Marker du coursier avec icône moto */}
        {showCourierLocation && courierLocation && (
          <Marker
            coordinate={courierLocation}
            title="Coursier"
            description="Position du coursier"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.courierMarker]}>
                <MaterialCommunityIcons name="motorbike" size={24} color={COLORS.white} />
              </View>
            </View>
          </Marker>
        )}

        {/* Route */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Informations de route */}
      {distance > 0 && (
        <View style={styles.routeInfo}>
          <View style={styles.routeInfoCard}>
            <View style={styles.routeInfoRow}>
              <View style={styles.routeInfoItem}>
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                <Text style={styles.routeInfoText}>{formatDistance(distance)}</Text>
              </View>
              <View style={styles.routeInfoItem}>
                <Ionicons name="time" size={16} color={COLORS.warning} />
                <Text style={styles.routeInfoText}>{formatDuration(duration)}</Text>
              </View>
              <View style={styles.routeInfoItem}>
                <MaterialCommunityIcons name="motorbike" size={16} color={COLORS.success} />
                <Text style={styles.routeInfoText}>Moto</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Calcul de l'itinéraire...</Text>
          </View>
        </View>
      )}

      {/* Contrôles de la carte */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (mapRef.current && pickupLocation && deliveryLocation) {
              mapRef.current.fitToCoordinates([
                { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
                { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
              ], {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
              });
            }
          }}
        >
          <Ionicons name="resize" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: COLORS.primary,
  },
  deliveryMarker: {
    backgroundColor: COLORS.success,
  },
  courierMarker: {
    backgroundColor: COLORS.warning,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  routeInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  routeInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
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
    zIndex: 2000,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  mapControls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 8,
  },
  currentLocationMarker: {
    backgroundColor: '#007AFF',
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
});

export default CustomMapView;