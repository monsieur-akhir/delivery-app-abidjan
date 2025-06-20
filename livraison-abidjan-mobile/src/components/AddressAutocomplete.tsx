
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Platform,
  Dimensions,
  FlatList
} from 'react-native';
import {
  TextInput,
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
  icon?: string;
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
  icon = "map-pin"
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
      id: 'votre_position',
      name: 'Votre position',
      description: 'Prise en charge à votre position GPS',
      latitude: 5.3364,
      longitude: -4.0266,
      commune: 'Abidjan',
      type: 'current_location',
    },
    {
      id: 'domicile',
      name: 'Domicile',
      description: '918, Rue M60',
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
      id: 'rue_l129',
      name: 'Rue L129, 107',
      description: 'Cocody, Abidjan',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'address',
    },
    {
      id: 'voie_djibi',
      name: 'Voie Djibi',
      description: 'Abidjan',
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
      id: 'rue_m2',
      name: 'Rue M2',
      description: 'Cocody, Abidjan',
      commune: 'Cocody',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'address',
    },
    {
      id: 'azito',
      name: 'Azito',
      description: 'Abidjan',
      commune: 'Yopougon',
      latitude: 5.3364,
      longitude: -4.0669,
      type: 'area',
    },
    {
      id: 'cinema_benin',
      name: 'Le Cinéma Benin',
      description: 'La commune Attécoubé, Rue I34, 514',
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

  // Recherche d'adresses améliorée
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

        // Ajouter "Votre position" en premier si demandé
        if (showCurrentLocation && normalizedQuery.includes('votre') || normalizedQuery.includes('position')) {
          results.push({
            id: 'current_location',
            description: 'Prise en charge à votre position GPS',
            latitude: currentLocation?.coords.latitude || 5.3364,
            longitude: currentLocation?.coords.longitude || -4.0266,
            commune: 'Abidjan',
            type: 'current_location'
          });
        }

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

        // Retirer les doublons et limiter les résultats
        const uniqueResults = results.filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        );

        setSuggestions(uniqueResults.slice(0, maxSuggestions));
      } catch (error) {
        console.error('Error searching addresses:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [popularPlaces, abidjanCommunes, maxSuggestions, showCurrentLocation, currentLocation]
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
    if (value.length >= 2) {
      searchAddresses(value);
    }
  }, [onFocus, value, searchAddresses]);

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
        return 'navigation';
      case 'saved':
        return 'home';
      case 'business':
        return 'briefcase';
      case 'restaurant':
        return 'restaurant';
      case 'entertainment':
        return 'film';
      default:
        return 'map-pin';
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
          size={20} 
          color="#666" 
        />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>
          {item.type === 'current_location' ? 'Votre position' : 
           item.description.split(',')[0] || item.description}
        </Text>
        <Text style={styles.suggestionSubtitle}>
          {item.type === 'current_location' ? 'Prise en charge à votre position GPS' :
           item.commune ? `${item.commune}, Abidjan` : item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Input principal */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={20} color="#666" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.labelText}>{label}</Text>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              style={styles.textInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              contentStyle={styles.inputContent}
              right={
                value ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={clearInput}
                    size={18}
                  />
                ) : undefined
              }
            />
          </View>
        </View>
        {error && <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>}
      </View>

      {/* Liste des suggestions */}
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
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <Divider />}
              maxToRenderPerBatch={10}
              windowSize={10}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 16,
    fontWeight: '400',
    color: '#1A1A1A',
    height: 24,
  },
  inputContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 1001,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontWeight: '500',
  },
});

export default AddressAutocomplete;
