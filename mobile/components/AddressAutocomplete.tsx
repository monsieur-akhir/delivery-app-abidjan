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
import LocationService from '../services/LocationService';

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

  // Recherche avec API backend
  const searchAddresses = useCallback(async (query: string) => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      console.log('[AddressAutocomplete] Recherche:', cleanQuery);

      // Utiliser l'API backend qui gère Google Places
      const { getAddressAutocomplete } = await import('../services/api');
      const response = await getAddressAutocomplete(cleanQuery);

      console.log('[AddressAutocomplete] Réponse API:', response);

      if (response.predictions && response.predictions.length > 0) {
        // Convertir les prédictions au format attendu
        const convertedResults: Address[] = response.predictions.map((prediction, index) => ({
          id: prediction.place_id || `suggestion_${index}`,
          description: prediction.description,
          latitude: 5.3158 + (Math.random() - 0.5) * 0.1, // Coordonnées approximatives d'Abidjan
          longitude: -4.0029 + (Math.random() - 0.5) * 0.1,
          commune: prediction.structured_formatting?.secondary_text || 'Abidjan',
          placeId: prediction.place_id,
          type: 'google_place' as const
        }));

        setSuggestions(convertedResults.slice(0, maxSuggestions));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('[DEBUG] Erreur backend address-autocomplete:', error);

      // Message d'erreur compréhensible pour l'utilisateur
      if (error.response?.status === 422) {
        setError('Veuillez saisir au moins 3 caractères pour la recherche');
      } else if (error.response?.status === 500) {
        setError('Service de géolocalisation temporairement indisponible');
      } else if (!error.response) {
        setError('Vérifiez votre connexion internet');
      } else {
        setError('Erreur lors de la recherche d\'adresses');
      }

      // Fallback vers les données simulées en cas d'erreur
      const mockSuggestions = [
        { 
          description: "Cocody, Abidjan", 
          latitude: 5.3364, 
          longitude: -4.0267,
          commune: "Cocody"
        },
        { 
          description: "Plateau, Abidjan", 
          latitude: 5.32, 
          longitude: -4.03,
          commune: "Plateau"
        },
        { 
          description: "Marcory, Abidjan", 
          latitude: 5.2849, 
          longitude: -4.0082,
          commune: "Marcory"
        }
      ];
      setSuggestions(mockSuggestions);
    } finally {
      setLoading(false);
    }
  }, [maxSuggestions]);

  // Suggestions locales de fallback
  const getLocalSuggestions = (query: string): Address[] => {
    const communes = [
      { name: 'Abobo', lat: 5.4167, lng: -4.0167 },
      { name: 'Adjamé', lat: 5.3667, lng: -4.0333 },
      { name: 'Attécoubé', lat: 5.3333, lng: -4.0667 },
      { name: 'Cocody', lat: 5.3500, lng: -3.9874 },
      { name: 'Koumassi', lat: 5.2833, lng: -3.9500 },
      { name: 'Marcory', lat: 5.2833, lng: -4.0000 },
      { name: 'Plateau', lat: 5.3274, lng: -4.0266 },
      { name: 'Port-Bouët', lat: 5.2500, lng: -3.9167 },
      { name: 'Treichville', lat: 5.3000, lng: -4.0167 },
      { name: 'Yopougon', lat: 5.3667, lng: -4.0833 }
    ];

    const queryLower = query.toLowerCase();

    return communes
      .filter(commune => commune.name.toLowerCase().includes(queryLower))
      .map((commune, index) => ({
        id: `local_${index}`,
        description: `${commune.name}, Abidjan`,
        latitude: commune.lat,
        longitude: commune.lng,
        commune: commune.name,
        type: 'suggestion' as const
      }));
  };

  // Simulation de recherche Google Places améliorée
  const searchGooglePlaces = async (query: string): Promise<Address[]> => {
    // Base de données étendue de lieux réels d'Abidjan
    const mockGooglePlaces = [
      // Hôtels
      { name: 'Hotel Ibis Abidjan Plateau', commune: 'Plateau', lat: 5.3267, lng: -4.0252, category: 'hotel' },
      { name: 'Sofitel Abidjan Hôtel Ivoire', commune: 'Cocody', lat: 5.3439, lng: -3.9889, category: 'hotel' },
      { name: 'Pullman Abidjan', commune: 'Cocody', lat: 5.3400, lng: -3.9900, category: 'hotel' },
      { name: 'Radisson Blu Hotel', commune: 'Plateau', lat: 5.3250, lng: -4.0230, category: 'hotel' },

      // Centres commerciaux
      { name: 'Cap Sud Shopping Center', commune: 'Marcory', lat: 5.2800, lng: -3.9600, category: 'mall' },
      { name: 'Cosmos Yopougon', commune: 'Yopougon', lat: 5.3200, lng: -4.0700, category: 'mall' },
      { name: 'Abidjan Mall', commune: 'Marcory', lat: 5.2850, lng: -3.9650, category: 'mall' },

      // Restaurants populaires
      { name: 'Restaurant Chez Amina', commune: 'Plateau', lat: 5.3300, lng: -4.0100, category: 'restaurant' },
      { name: 'Maquis du Rail', commune: 'Treichville', lat: 5.3100, lng: -4.0300, category: 'restaurant' },
      { name: 'Restaurant Allocodrome', commune: 'Marcory', lat: 5.2900, lng: -3.9750, category: 'restaurant' },
      { name: 'Brasserie Abidjanaise', commune: 'Plateau', lat: 5.3280, lng: -4.0200, category: 'restaurant' },

      // Pharmacies
      { name: 'Pharmacie de la Paix', commune: 'Plateau', lat: 5.3200, lng: -4.0200, category: 'pharmacy' },
      { name: 'Pharmacie du Plateau', commune: 'Plateau', lat: 5.3250, lng: -4.0250, category: 'pharmacy' },
      { name: 'Pharmacie Cocody', commune: 'Cocody', lat: 5.3500, lng: -3.9800, category: 'pharmacy' },
      { name: 'Pharmacie Nouvelle', commune: 'Adjamé', lat: 5.3650, lng: -4.0180, category: 'pharmacy' },

      // Banques
      { name: 'SGBCI Plateau', commune: 'Plateau', lat: 5.3280, lng: -4.0280, category: 'bank' },
      { name: 'Ecobank Cocody', commune: 'Cocody', lat: 5.3600, lng: -3.9700, category: 'bank' },
      { name: 'BICICI Marcory', commune: 'Marcory', lat: 5.2900, lng: -3.9700, category: 'bank' },

      // Universités et écoles
      { name: 'Université Félix Houphouët-Boigny', commune: 'Cocody', lat: 5.3847, lng: -3.9883, category: 'university' },
      { name: 'École Internationale Jean-Mermoz', commune: 'Cocody', lat: 5.3700, lng: -3.9600, category: 'school' },
      { name: 'Institut National Polytechnique', commune: 'Yamoussoukro', lat: 5.3500, lng: -4.0000, category: 'school' },

      // Hôpitaux
      { name: 'CHU de Treichville', commune: 'Treichville', lat: 5.2900, lng: -4.0100, category: 'hospital' },
      { name: 'Clinique Farah', commune: 'Cocody', lat: 5.3400, lng: -3.9800, category: 'hospital' },
      { name: 'Hôpital Général de Bingerville', commune: 'Bingerville', lat: 5.3550, lng: -3.8950, category: 'hospital' },

      // Centres d'affaires
      { name: 'Tour BCEAO', commune: 'Plateau', lat: 5.3250, lng: -4.0220, category: 'office' },
      { name: 'Immeuble CCIA', commune: 'Plateau', lat: 5.3280, lng: -4.0240, category: 'office' },
      { name: 'Centre des Affaires', commune: 'Plateau', lat: 5.3270, lng: -4.0210, category: 'office' },

      // Marchés
      { name: 'Marché de Treichville', commune: 'Treichville', lat: 5.2833, lng: -4.0000, category: 'market' },
      { name: 'Marché d\'Adjamé', commune: 'Adjamé', lat: 5.3667, lng: -4.0167, category: 'market' },
      { name: 'Marché de Cocody', commune: 'Cocody', lat: 5.3500, lng: -3.9850, category: 'market' },

      // Transports
      { name: 'Gare de Bassam', commune: 'Plateau', lat: 5.3200, lng: -4.0200, category: 'transport' },
      { name: 'Gare Routière d\'Adjamé', commune: 'Adjamé', lat: 5.3700, lng: -4.0200, category: 'transport' },
      { name: 'Aéroport Félix Houphouët-Boigny', commune: 'Port-Bouët', lat: 5.2539, lng: -3.9263, category: 'airport' }
    ];

    const normalizedQuery = query.toLowerCase();
    const matchingPlaces = mockGooglePlaces.filter(place => 
      place.name.toLowerCase().includes(normalizedQuery) ||
      place.commune.toLowerCase().includes(normalizedQuery) ||
      place.category.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(place.name.toLowerCase().split(' ')[0])
    );

    return matchingPlaces.map((place, index) => ({
      id: `google_${index}_${Date.now()}`,
      description: `${place.name}, ${place.commune}, Abidjan`,
      latitude: place.lat,
      longitude: place.lng,
      commune: place.commune,
      placeId: `ChIJ${Math.random().toString(36).substr(2, 9)}`,
      type: 'google_place' as const
    }));
  };

  // Génération d'adresses de rues spécifiques
  const generateStreetAddresses = (query: string, normalizedQuery: string): Address[] => {
    const streetPrefixes = ['Rue', 'Avenue', 'Boulevard', 'Allée', 'Place', 'Carrefour'];
    const streetNames = [
      'de la Paix', 'de l\'Indépendance', 'des Jardins', 'du Commerce',
      'de la République', 'des Cocotiers', 'du Stade', 'de l\'Église',
      'des Martyrs', 'de l\'Université', 'du Marché', 'de la Gare',
      'Jessé Jackson', 'Nangui Abrogoua', 'du 7 Décembre', 'Franchet d\'Esperey'
    ];

    const results: Address[] = [];

    streetPrefixes.forEach(prefix => {
      streetNames.forEach(streetName => {
        if (streetName.toLowerCase().includes(normalizedQuery) || 
            prefix.toLowerCase().includes(normalizedQuery) ||
            normalizedQuery.length >= 3) {

          const randomCommune = abidjanCommunes[Math.floor(Math.random() * abidjanCommunes.length)];
          results.push({
            id: `street_${prefix}_${streetName}_${Date.now()}_${Math.random()}`,
            description: `${prefix} ${streetName}, ${randomCommune.name}, Abidjan`,
            latitude: randomCommune.latitude + (Math.random() - 0.5) * 0.02,
            longitude: randomCommune.longitude + (Math.random() - 0.5) * 0.02,
            commune: randomCommune.name,
            type: 'suggestion'
          });
        }
      });
    });

    return results.slice(0, 3);
  };

  // Lieux spécifiques d'Abidjan basés sur la requête
  const getSpecificAbidjanPlaces = (normalizedQuery: string): Address[] => {
    const specificPlaces = [
      { name: 'Zone 4C', commune: 'Marcory', lat: 5.2950, lng: -3.9720 },
      { name: 'Riviera Golf', commune: 'Cocody', lat: 5.3789, lng: -3.9956 },
      { name: 'Carrefour Kennedy', commune: 'Yopougon', lat: 5.3289, lng: -4.0756 },
      { name: 'Deux Plateaux', commune: 'Cocody', lat: 5.3600, lng: -3.9750 },
      { name: 'Angré', commune: 'Cocody', lat: 5.3700, lng: -3.9600 },
      { name: 'Banco', commune: 'Yopougon', lat: 5.3400, lng: -4.0900 },
      { name: 'Vridi', commune: 'Port-Bouët', lat: 5.2400, lng: -3.9200 },
      { name: 'Koumassi Centre', commune: 'Koumassi', lat: 5.2900, lng: -3.9400 }
    ];

    return specificPlaces
      .filter(place => 
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.commune.toLowerCase().includes(normalizedQuery)
      )
      .map((place, index) => ({
        id: `specific_${index}_${Date.now()}`,
        description: `${place.name}, ${place.commune}, Abidjan`,
        latitude: place.lat,
        longitude: place.lng,
        commune: place.commune,
        type: 'suggestion'
      }));
  };

  // Géocodage inverse pour la position actuelle avec Google API
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<Address> => {
    try {
      const locationService = LocationService.getInstance();
      const result = await locationService.reverseGeocode(latitude, longitude);

      if (result) {
        return {
          id: result.id,
          description: result.address,
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          commune: result.commune,
          type: result.type as any
        };
      }
    } catch (error) {
      console.error('Error with Google reverse geocoding:', error);
    }

    // Fallback vers l'ancienne méthode si Google API échoue
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

  // Added state for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Function to set the error message
  const setError = (message: string) => {
    setErrorMessage(message);
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
            error={!!errorMessage} // Use errorMessage here
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

        {errorMessage && (
          <HelperText type="error" visible={!!errorMessage} style={styles.errorText}>
            {errorMessage}
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