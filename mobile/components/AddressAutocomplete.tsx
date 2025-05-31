import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import {
  TextInput,
  List,
  Card,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import * as Location from 'expo-location';

export interface Address {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  commune?: string;
  district?: string;
  postalCode?: string;
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect: (address: Address) => void;
  placeholder?: string;
  error?: string;
  style?: object;
  disabled?: boolean;
  showCurrentLocation?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChangeText,
  onAddressSelect,
  placeholder,
  error,
  style,
  disabled = false,
  showCurrentLocation = true,
}) => {
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Communes d'Abidjan pour les suggestions locales
  const abidjanCommunes = [
    'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
    'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
  ];

  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.warn('Error getting current location:', error);
    }
  };

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual geocoding service
      const mockAddresses: Address[] = [];
      
      // Add commune-based suggestions
      abidjanCommunes.forEach((commune, index) => {
        if (commune.toLowerCase().includes(query.toLowerCase())) {
          mockAddresses.push({
            id: `commune_${index}`,
            description: `${commune}, Abidjan`,
            latitude: getApproximateCoordinates(commune).latitude,
            longitude: getApproximateCoordinates(commune).longitude,
            commune,
          });
        }
      });

      // Add street-level suggestions
      if (query.length >= 5) {
        const streetSuggestions: Address[] = [
          {
            id: `street_1_${query}`,
            description: `Rue de ${query}, Plateau, Abidjan`,
            latitude: 5.3274 + Math.random() * 0.01,
            longitude: -4.0266 + Math.random() * 0.01,
            commune: 'Plateau',
          },
          {
            id: `street_2_${query}`,
            description: `Boulevard ${query}, Cocody, Abidjan`,
            latitude: 5.3500 + Math.random() * 0.01,
            longitude: -3.9874 + Math.random() * 0.01,
            commune: 'Cocody',
          },
        ];
        mockAddresses.push(...streetSuggestions);
      }

      setSuggestions(mockAddresses);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getApproximateCoordinates = (commune: string) => {
    const coordinates: { [key: string]: { latitude: number; longitude: number } } = {
      'Abobo': { latitude: 5.4167, longitude: -4.0167 },
      'Adjamé': { latitude: 5.3667, longitude: -4.0333 },
      'Attécoubé': { latitude: 5.3333, longitude: -4.0667 },
      'Cocody': { latitude: 5.3500, longitude: -3.9874 },
      'Koumassi': { latitude: 5.2833, longitude: -3.9500 },
      'Marcory': { latitude: 5.2833, longitude: -4.0000 },
      'Plateau': { latitude: 5.3274, longitude: -4.0266 },
      'Port-Bouët': { latitude: 5.2500, longitude: -3.9167 },
      'Treichville': { latitude: 5.3000, longitude: -4.0167 },
      'Yopougon': { latitude: 5.3667, longitude: -4.0833 },
    };
    return coordinates[commune] || { latitude: 5.3599517, longitude: -4.0082563 };
  };

  const reverseGeocode = async (latitude: number, longitude: number): Promise<Address> => {
    // Mock reverse geocoding - replace with actual service
    const nearestCommune = findNearestCommune(latitude, longitude);
    return {
      id: 'current_location',
      description: `Position actuelle (${nearestCommune})`,
      latitude,
      longitude,
      commune: nearestCommune,
    };
  };

  const findNearestCommune = (lat: number, lng: number): string => {
    let minDistance = Infinity;
    let nearestCommune = 'Plateau';

    abidjanCommunes.forEach(commune => {
      const coords = getApproximateCoordinates(commune);
      const distance = Math.sqrt(
        Math.pow(lat - coords.latitude, 2) + Math.pow(lng - coords.longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCommune = commune;
      }
    });

    return nearestCommune;
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    setShowSuggestions(true);

    // Debounce search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      searchAddresses(text);
    }, 300);
  };

  const handleAddressSelect = (address: Address) => {
    onChangeText(address.description);
    onAddressSelect(address);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleCurrentLocationSelect = async () => {
    if (!currentLocation) return;

    try {
      setLoading(true);
      const address = await reverseGeocode(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      handleAddressSelect(address);
    } catch (error) {
      console.error('Error getting current location address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    if (value.length >= 3) {
      setShowSuggestions(true);
      searchAddresses(value);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        mode="outlined"
        disabled={disabled}
        error={!!error}
        style={styles.input}
        left={<TextInput.Icon icon="map-marker" />}
        right={loading ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> : undefined}
      />
      
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      {showSuggestions && (suggestions.length > 0 || (currentLocation && showCurrentLocation)) && (
        <Card style={styles.suggestionsCard}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {currentLocation && showCurrentLocation && (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={handleCurrentLocationSelect}
              >
                <List.Item
                  title="Position actuelle"
                  description="Utiliser ma position actuelle"
                  left={props => <List.Icon {...props} icon="crosshairs-gps" color="#4CAF50" />}
                  titleStyle={styles.currentLocationTitle}
                />
              </TouchableOpacity>
            )}
            
            {suggestions.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={styles.suggestionItem}
                onPress={() => handleAddressSelect(address)}
              >
                <List.Item
                  title={address.description}
                  description={address.commune ? `Commune: ${address.commune}` : undefined}
                  left={props => <List.Icon {...props} icon="map-marker" />}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  suggestionsCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  currentLocationTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default AddressAutocomplete;
