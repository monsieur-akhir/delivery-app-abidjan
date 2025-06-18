import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
  Modal
} from 'react-native';
import {
  TextInput,
  List,
  Card,
  Text,
  HelperText,
  Divider,
  IconButton,
  Surface
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
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
  showSuggestions?: boolean;
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
  maxSuggestions = 8,
  onFocus,
  showSuggestions = false,
}) => {
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestionsState, setShowSuggestionsState] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [recentAddresses, setRecentAddresses] = useState<Address[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Communes et zones populaires d'Abidjan avec coordonnées précises
  const popularPlaces = useMemo(() => [
    {
      name: 'Aéroport Félix Houphouët-Boigny',
      commune: 'Port-Bouët',
      latitude: 5.2612,
      longitude: -3.9269,
      type: 'airport'
    },
    {
      name: 'Plateau Centre-ville',
      commune: 'Plateau',
      latitude: 5.3274,
      longitude: -4.0266,
      type: 'business'
    },
    {
      name: 'Université Félix Houphouët-Boigny',
      commune: 'Cocody',
      latitude: 5.3844,
      longitude: -3.9731,
      type: 'university'
    },
    {
      name: 'Marché de Treichville',
      commune: 'Treichville',
      latitude: 5.2969,
      longitude: -4.0178,
      type: 'market'
    },
    {
      name: 'Gare de Yopougon',
      commune: 'Yopougon',
      latitude: 5.3456,
      longitude: -4.0642,
      type: 'transport'
    },
    {
      name: 'CHU de Cocody',
      commune: 'Cocody',
      latitude: 5.3667,
      longitude: -3.9833,
      type: 'hospital'
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

  // Animation d'entrée
  useEffect(() => {
    if (showSuggestionsState) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-10);
    }
  }, [showSuggestionsState, fadeAnim, slideAnim]);

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

  // Recherche d'adresses intelligente
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results: Address[] = [];
      const normalizedQuery = query.toLowerCase().trim();

      // 1. Recherche dans les lieux populaires
      popularPlaces.forEach((place, index) => {
        if (
          place.name.toLowerCase().includes(normalizedQuery) ||
          place.commune.toLowerCase().includes(normalizedQuery)
        ) {
          results.push({
            id: `popular_${index}`,
            description: `${place.name}, ${place.commune}`,
            latitude: place.latitude,
            longitude: place.longitude,
            commune: place.commune,
            type: 'suggestion'
          });
        }
      });

      // 2. Recherche par commune
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

      // 3. Recherche de rues et adresses spécifiques
      if (query.length >= 4) {
        const streetPrefixes = ['Rue', 'Avenue', 'Boulevard', 'Allée', 'Place'];
        const randomStreets = [
          'des Jardins', 'de la Paix', 'du Commerce', 'de l\'Indépendance',
          'des Cocotiers', 'de la République', 'du Stade', 'de l\'Église'
        ];

        // Générer des suggestions de rues réalistes
        for (let i = 0; i < Math.min(3, maxSuggestions - results.length); i++) {
          const prefix = streetPrefixes[Math.floor(Math.random() * streetPrefixes.length)];
          const suffix = randomStreets[Math.floor(Math.random() * randomStreets.length)];
          const commune = abidjanCommunes[Math.floor(Math.random() * abidjanCommunes.length)];

          results.push({
            id: `street_${i}_${Date.now()}`,
            description: `${prefix} ${query} ${suffix}, ${commune.name}`,
            latitude: commune.latitude + (Math.random() - 0.5) * 0.02,
            longitude: commune.longitude + (Math.random() - 0.5) * 0.02,
            commune: commune.name,
            type: 'suggestion'
          });
        }
      }

      // Limiter le nombre de résultats
      setSuggestions(results.slice(0, maxSuggestions));
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [popularPlaces, abidjanCommunes, maxSuggestions]);

  // Géocodage inverse pour la position actuelle
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<Address> => {
    // Trouver la commune la plus proche
    let nearestCommune = abidjanCommunes[0];
    let minDistance = Infinity;

    abidjanCommunes.forEach(commune => {
      const distance = Math.sqrt(
        Math.pow(latitude - commune.latitude, 2) + Math.pow(longitude - commune.longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCommune = commune;
      }
    });

    return {
      id: 'current_location',
      description: `Position actuelle (${nearestCommune.name})`,
      latitude,
      longitude,
      commune: nearestCommune.name,
      type: 'current_location'
    };
  }, [abidjanCommunes]);

  // Gestionnaires d'événements
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
    setInputValue(text);
    
    if (text.length >= 2) {
      setShowSuggestionsState(true);
      
      // Debounce search
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        searchAddresses(text);
      }, 300);
    } else {
      setShowSuggestionsState(false);
      setSuggestions([]);
    }
  }, [onChangeText, searchAddresses]);

  const handleAddressSelect = useCallback((address: Address) => {
    onChangeText(address.description);
    setInputValue(address.description);
    onAddressSelect(address);
    setShowSuggestionsState(false);
    setSuggestions([]);
    Keyboard.dismiss();

    // Ajouter aux récents (simulation)
    setRecentAddresses(prev => [
      address,
      ...prev.filter(addr => addr.id !== address.id).slice(0, 2)
    ]);
  }, [onChangeText, onAddressSelect]);

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

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (value.length >= 2 || recentAddresses.length > 0) {
      setShowSuggestionsState(true);
      if (value.length >= 2) {
        searchAddresses(value);
      }
    }
    onFocus?.();
  }, [value, recentAddresses.length, searchAddresses, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Délai pour permettre la sélection
    setTimeout(() => {
      setShowSuggestionsState(false);
    }, 200);
  }, []);

  const clearInput = useCallback(() => {
    onChangeText('');
    setInputValue('');
    setSuggestions([]);
    setShowSuggestionsState(false);
  }, [onChangeText]);

  // Icônes pour différents types de suggestions
  const getIconForType = (type?: string) => {
    switch (type) {
      case 'current_location':
        return 'location';
      case 'recent':
        return 'time-outline';
      case 'saved':
        return 'bookmark-outline';
      default:
        return 'location-outline';
    }
  };

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'current_location':
        return '#4CAF50';
      case 'recent':
        return '#FF9800';
      case 'saved':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getIconForType2 = (type: string) => {
    switch (type) {
      case "airport": return "airplane"
      case "university": return "school"
      case "hospital": return "medical"
      case "market": return "cart"
      case "transport": return "bus"
      case "business": return "business"
      default: return "location"
    }
  };

  const renderSuggestion = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleAddressSelect(item)}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionIcon}>
          <Ionicons 
            name={getIconForType(item.type)} 
            size={16} 
            color={getIconColor(item.type)} 
          />
        </View>
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle}>{item.description}</Text>
          <Text style={styles.suggestionSubtitle}>
            {item.commune && `Commune: ${item.commune}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          label={label}
          value={inputValue}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          error={!!error}
          disabled={disabled}
          style={[styles.input, isFocused && styles.inputFocused]}
          right={
            <TextInput.Icon
              icon="map-marker"
              onPress={clearInput}
              disabled={!inputValue}
            />
          }
        />
        {error && <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>}
      </View>

      {/* Suggestions en overlay (pas en modal) */}
      {showSuggestionsState && (
        <Animated.View
          style={[
            styles.suggestionsOverlay,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Card style={styles.suggestionsCard}>
            <ScrollView 
              style={styles.suggestionsList}
              contentContainerStyle={styles.suggestionsContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {/* Position actuelle */}
              {showCurrentLocation && currentLocation && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Position actuelle</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={handleCurrentLocationSelect}
                    disabled={loading}
                  >
                    <View style={styles.suggestionContent}>
                      <View style={[styles.suggestionIcon, styles.currentLocationIcon]}>
                        {loading ? (
                          <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                          <Ionicons name="location" size={16} color="#4CAF50" />
                        )}
                      </View>
                      <View style={styles.suggestionText}>
                        <Text style={styles.suggestionTitle}>Utiliser ma position actuelle</Text>
                        <Text style={styles.suggestionSubtitle}>Détection automatique</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Divider style={styles.divider} />
                </>
              )}

              {/* Adresses récentes */}
              {recentAddresses.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Récents</Text>
                  </View>
                  {recentAddresses.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.suggestionItem}
                      onPress={() => handleAddressSelect(address)}
                    >
                      <View style={styles.suggestionContent}>
                        <View style={styles.suggestionIcon}>
                          <Ionicons 
                            name={getIconForType(address.type)} 
                            size={16} 
                            color={getIconColor(address.type)} 
                          />
                        </View>
                        <View style={styles.suggestionText}>
                          <Text style={styles.suggestionTitle}>{address.description}</Text>
                          <Text style={styles.suggestionSubtitle}>
                            {address.commune && `Commune: ${address.commune}`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {suggestions.length > 0 && <Divider style={styles.divider} />}
                </>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Suggestions</Text>
                  </View>
                  {suggestions.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.suggestionItem}
                      onPress={() => handleAddressSelect(address)}
                    >
                      <View style={styles.suggestionContent}>
                        <View style={styles.suggestionIcon}>
                          <Ionicons 
                            name={getIconForType(address.type)} 
                            size={16} 
                            color={getIconColor(address.type)} 
                          />
                        </View>
                        <View style={styles.suggestionText}>
                          <Text style={styles.suggestionTitle}>{address.description}</Text>
                          <Text style={styles.suggestionSubtitle}>
                            {address.commune && `Commune: ${address.commune}`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Aucun résultat */}
              {suggestions.length === 0 && recentAddresses.length === 0 && value.length >= 2 && !loading && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>Aucun résultat trouvé</Text>
                  <Text style={styles.noResultsSubtext}>Essayez avec d'autres mots-clés</Text>
                </View>
              )}

              {/* Loading */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.loadingText}>Recherche en cours...</Text>
                </View>
              )}
            </ScrollView>
          </Card>
        </Animated.View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window')

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
  suggestionsOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1001,
    marginTop: 4,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionsContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  suggestionItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  suggestionContent: {
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
  currentLocationIcon: {
    backgroundColor: '#e8f5e8',
  },
  suggestionText: {
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
  divider: {
    marginVertical: 4,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
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
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionCommune: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
});

export default AddressAutocomplete;