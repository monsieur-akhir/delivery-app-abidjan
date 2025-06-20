
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
  Modal,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import {
  TextInput,
  List,
  Card,
  Text,
  HelperText,
  Divider,
  IconButton,
  Surface,
  Button
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
  placeId?: string;
  type?: 'current_location' | 'saved' | 'recent' | 'suggestion' | 'google_place';
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
  maxSuggestions = 8,
  onFocus,
  showSuggestions = false,
  icon = "location-outline"
}) => {
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestionsState, setShowSuggestionsState] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [recentAddresses, setRecentAddresses] = useState<Address[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [locationLoading, setLocationLoading] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const inputRef = useRef<any>(null);

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
    },
    {
      name: 'Centre Commercial PlaYce Marcory',
      commune: 'Marcory',
      latitude: 5.2956,
      longitude: -3.9750,
      type: 'mall'
    },
    {
      name: 'Riviera Golf',
      commune: 'Cocody',
      latitude: 5.3789,
      longitude: -3.9956,
      type: 'entertainment'
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

  // Synchroniser la valeur
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la localisation pour utiliser cette fonctionnalité.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentLocation(location);
    } catch (error) {
      console.warn('Error getting current location:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position actuelle.');
    }
  };

  // Recherche avec Google Places API et données locales
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results: Address[] = [];
      const normalizedQuery = query.toLowerCase().trim();

      // 1. Recherche dans les lieux populaires locaux
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

      // 3. Recherche avec Google Places API (simulée pour l'environnement local)
      if (query.length >= 3) {
        const googlePlaces = await searchGooglePlaces(query);
        results.push(...googlePlaces);
      }

      // 4. Recherche de rues et adresses spécifiques
      if (query.length >= 4) {
        const streetPrefixes = ['Rue', 'Avenue', 'Boulevard', 'Allée', 'Place'];
        const randomStreets = [
          'des Jardins', 'de la Paix', 'du Commerce', 'de l\'Indépendance',
          'des Cocotiers', 'de la République', 'du Stade', 'de l\'Église'
        ];

        // Générer des suggestions de rues réalistes
        for (let i = 0; i < Math.min(2, maxSuggestions - results.length); i++) {
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

  // Simulation de recherche Google Places (à remplacer par une vraie API)
  const searchGooglePlaces = async (query: string): Promise<Address[]> => {
    // Simulation de lieux Google Places réels d'Abidjan
    const mockGooglePlaces = [
      {
        id: 'google_1',
        description: `Hotel Ibis Abidjan Plateau, ${query}`,
        latitude: 5.3267,
        longitude: -4.0252,
        commune: 'Plateau',
        placeId: 'ChIJ1234567890',
        type: 'google_place' as const
      },
      {
        id: 'google_2',
        description: `Sofitel Abidjan Hôtel Ivoire, ${query}`,
        latitude: 5.3439,
        longitude: -3.9889,
        commune: 'Cocody',
        placeId: 'ChIJ0987654321',
        type: 'google_place' as const
      },
      {
        id: 'google_3',
        description: `Pharmacie de la Paix, ${query}`,
        latitude: 5.3200 + (Math.random() - 0.5) * 0.01,
        longitude: -4.0200 + (Math.random() - 0.5) * 0.01,
        commune: 'Plateau',
        placeId: 'ChIJ1357924680',
        type: 'google_place' as const
      }
    ];

    return mockGooglePlaces.filter(place => 
      place.description.toLowerCase().includes(query.toLowerCase())
    );
  };

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

  // Gestionnaires d'événements améliorés
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
    
    // Ajouter aux récents (simulation)
    setRecentAddresses(prev => [
      address,
      ...prev.filter(addr => addr.id !== address.id).slice(0, 2)
    ]);
  }, [onChangeText, onAddressSelect]);

  const handleCurrentLocationSelect = async () => {
    if (!currentLocation) {
      setLocationLoading(true);
      await getCurrentLocation();
      setLocationLoading(false);
      return;
    }

    try {
      setLoading(true);
      const address = await reverseGeocode(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      handleAddressSelect(address);
    } catch (error) {
      console.error('Error getting current location address:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir l\'adresse de votre position actuelle.');
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
    // Délai plus long pour permettre la sélection
    setTimeout(() => {
      setShowSuggestionsState(false);
    }, 300);
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
      case 'google_place':
        return 'business-outline';
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
      case 'google_place':
        return '#DB4437';
      default:
        return '#666';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
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
              inputValue ? (
                <TextInput.Icon
                  icon="close"
                  onPress={clearInput}
                />
              ) : null
            }
          />
          
          {/* Bouton position actuelle */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleCurrentLocationSelect}
            disabled={locationLoading || loading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Ionicons 
                name="locate" 
                size={24} 
                color={currentLocation ? "#4CAF50" : "#666"} 
              />
            )}
          </TouchableOpacity>
        </View>
        
        {error && (
          <HelperText type="error" visible={!!error} style={styles.errorText}>
            {error}
          </HelperText>
        )}
      </View>

      {/* Suggestions en modal pour éviter les problèmes de positionnement */}
      <Modal
        visible={showSuggestionsState}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuggestionsState(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSuggestionsState(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.suggestionsContainer}>
                <Card style={styles.suggestionsCard}>
                  <ScrollView
                    style={styles.suggestionsList}
                    contentContainerStyle={styles.suggestionsContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Position actuelle */}
                    {showCurrentLocation && (
                      <>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Position actuelle</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.suggestionItem}
                          onPress={handleCurrentLocationSelect}
                          disabled={loading}
                          activeOpacity={0.7}
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
                            activeOpacity={0.7}
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
                            activeOpacity={0.7}
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
                                  {address.type === 'google_place' && ' • Google Places'}
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
                        <Ionicons name="search-outline" size={48} color="#ccc" />
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

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
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  inputFocused: {
    backgroundColor: '#FFFFFF',
  },
  locationButton: {
    position: 'absolute',
    right: 50,
    top: 8,
    bottom: 8,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  errorText: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  suggestionsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 400,
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
    maxHeight: 400,
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
});

export default AddressAutocomplete;
