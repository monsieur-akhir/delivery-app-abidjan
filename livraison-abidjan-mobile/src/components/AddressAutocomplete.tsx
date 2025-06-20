import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Platform,
  Dimensions,
  FlatList
} from 'react-native';
import {
  TextInput,
  List,
  Card,
  Text,
  HelperText,
  Divider,
  Surface
} from 'react-native-paper';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { debounce } from "lodash";

export interface Address {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  commune?: string;
  district?: string;
  postalCode?: string;
  type?: 'current_location' | 'saved' | 'recent' | 'suggestion';
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
  maxSuggestions?: number;
  onFocus?: () => void;
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
  maxSuggestions = 6,
  onFocus,
}) => {
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<any>(null);

  // Communes et zones populaires d'Abidjan avec coordonnées précises
  const popularPlaces = useMemo(() => [
    {
      id: 'domicile',
      name: 'Domicile',
      description: '918, Rue M60, Cocody',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'saved',
    },
    {
      id: 'groupe_itermi',
      name: 'Groupe Itermi',
      description: 'Quartier de la Djorabilité I, Cocody, Abidjan',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'business',
    },
    {
      id: 'rue_l125',
      name: 'Rue L125, 2166',
      description: 'Cocody, Abidjan',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'address',
    },
    {
      id: 'blvd_martyrs',
      name: 'Blvd des Martyrs 8303',
      description: 'Cocody, Abidjan',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'address',
    },
    {
      id: 'voie_djibi',
      name: 'Voie Djibi',
      description: 'Yopougon, Abidjan',
      commune: 'Yopougon',
      latitude: 5.3364,
      longitude: -4.0669,
      type: 'area',
    },
    {
      id: 'chawarma_plus',
      name: 'Chawarma+',
      description: 'Rue L156, Cocody, Abidjan',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'restaurant',
    },
    {
      id: 'azito',
      name: 'Azito',
      description: 'Yopougon, Abidjan',
      commune: 'Yopougon',
      latitude: 5.3364,
      longitude: -4.0669,
      type: 'area',
    },
    {
      id: 'cinema_benin',
      name: 'Le Cinéma Benin',
      description: 'Attécoubé, Rue I34, 514',
      commune: 'Attécoubé',
      latitude: 5.3164,
      longitude: -4.0269,
      type: 'entertainment',
    }
  ], []);

  const abidjanCommunes = useMemo(() => [
    { name: 'Abobo', latitude: 5.4167, longitude: -4.0167 },
    { name: 'Adjamé', latitude: 5.3667, longitude: -4.0333 },
    { name: 'Attécoubé', latitude: 5.3333, longitude: -4.0667 },
    { name: 'Cocody', latitude: 5.3500, longitude: -3.9874 },
    { name: 'Koumassi', latitude: 5.2833, longitude: -3.9500 },
    { name: 'Marcory', latitude: 5.2833, longitude: -4.0000 },
    { name: 'Plateau', latitude: 5.3274, longitude: -4.0266 },
    { name: 'Port-Bouët', latitude: 5.2500, longitude: -3.9167 },
    { name: 'Treichville', latitude: 5.3000, longitude: -4.0167 },
    { name: 'Yopougon', latitude: 5.3667, longitude: -4.0833 }
  ], []);

  // Obtenir la position actuelle
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation(location);
    } catch (error) {
      console.warn('Error getting current location:', error);
    }
  };

  // Recherche d'adresses
  const searchAddresses = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      setShowSuggestions(true);

      try {
        const results: Address[] = [];
        const normalizedQuery = query.toLowerCase().trim();

        // Recherche dans les lieux populaires
        popularPlaces.forEach((place) => {
          if (
            place.name.toLowerCase().includes(normalizedQuery) ||
            place.description.toLowerCase().includes(normalizedQuery) ||
            place.commune.toLowerCase().includes(normalizedQuery)
          ) {
            results.push({
              id: place.id,
              description: place.description,
              latitude: place.latitude,
              longitude: place.longitude,
              commune: place.commune,
              type: place.type as any
            });
          }
        });

        // Recherche par commune
        abidjanCommunes.forEach((commune, index) => {
          if (commune.name.toLowerCase().includes(normalizedQuery)) {
            results.push({
              id: `commune_${index}`,
              description: `${commune.name}, Abidjan`,
              latitude: commune.latitude,
              longitude: commune.longitude,
              commune: commune.name,
              type: 'suggestion'
            });
          }
        });

        setSuggestions(results.slice(0, maxSuggestions));
      } catch (error) {
        console.error('Error searching addresses:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [popularPlaces, abidjanCommunes, maxSuggestions]
  );

  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    searchAddresses(text);
  }, [onChangeText, searchAddresses]);

  const handleAddressSelect = useCallback((address: Address) => {
    onChangeText(address.description);
    onAddressSelect(address);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  }, [onChangeText, onAddressSelect]);

  const handleCurrentLocationSelect = async () => {
    if (!currentLocation) return;

    try {
      setLoading(true);

      // Trouver la commune la plus proche
      let nearestCommune = abidjanCommunes[0];
      let minDistance = Infinity;

      abidjanCommunes.forEach(commune => {
        const distance = Math.sqrt(
          Math.pow(currentLocation.coords.latitude - commune.latitude, 2) + 
          Math.pow(currentLocation.coords.longitude - commune.longitude, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCommune = commune;
        }
      });

      const address: Address = {
        id: 'current_location',
        description: `Position actuelle (${nearestCommune.name})`,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        commune: nearestCommune.name,
        type: 'current_location'
      };

      handleAddressSelect(address);
    } catch (error) {
      console.error('Error getting current location address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Délai pour permettre la sélection d'une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  const clearInput = useCallback(() => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [onChangeText]);

  const getIconForType = (type?: string) => {
    switch (type) {
      case 'current_location':
        return 'location';
      case 'saved':
        return 'home';
      case 'business':
        return 'business';
      case 'restaurant':
        return 'restaurant';
      default:
        return 'location-outline';
    }
  };

  const renderSuggestion = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleAddressSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons 
          name={getIconForType(item.type)} 
          size={16} 
          color="#666" 
        />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{item.description}</Text>
        {item.commune && (
          <Text style={styles.suggestionSubtitle}>Commune: {item.commune}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          label={label}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          error={!!error}
          disabled={disabled}
          style={[styles.input, isFocused && styles.inputFocused]}
          mode="outlined"
          dense
          right={
            <View style={{ flexDirection: 'row' }}>
              {showCurrentLocation && currentLocation && (
                <TextInput.Icon
                  icon="crosshair-gps"
                  iconColor="#4CAF50"
                  onPress={handleCurrentLocationSelect}
                  disabled={loading}
                />
              )}
              {value ? (
                <TextInput.Icon
                  icon="close"
                  onPress={clearInput}
                />
              ) : (
                <TextInput.Icon
                  icon="map-marker"
                  disabled
                />
              )}
            </View>
          }
        />
        {error && <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>}
      </View>

      {/* Suggestions directement sous l'input */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <Surface style={styles.suggestionsContainer} elevation={4}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Recherche...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <Divider />}
            />
          )}
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    marginTop: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: 300,
    zIndex: 1001,
    marginTop: 4,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default AddressAutocomplete;