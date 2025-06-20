
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView
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
  region?: string;
  city?: string;
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
  icon = "location-outline"
}) => {
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<any>(null);

  // Villes et lieux populaires de Côte d'Ivoire avec coordonnées précises
  const popularPlaces = useMemo(() => [
    {
      id: 'votre_position',
      name: 'Votre position',
      description: 'Prise en charge à votre position GPS',
      latitude: 7.539989,
      longitude: -5.54708,
      region: 'Côte d\'Ivoire',
      type: 'current_location',
    },
    // ABIDJAN
    {
      id: 'domicile',
      name: 'Domicile',
      description: '918, Rue M60',
      commune: 'Cocody',
      city: 'Abidjan',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'saved',
    },
    {
      id: 'plateau_abidjan',
      name: 'Plateau',
      description: 'Centre des affaires, Abidjan',
      commune: 'Plateau',
      city: 'Abidjan',
      latitude: 5.3274,
      longitude: -4.0266,
      type: 'business',
    },
    {
      id: 'cocody_abidjan',
      name: 'Cocody',
      description: 'Quartier résidentiel, Abidjan',
      commune: 'Cocody',
      city: 'Abidjan',
      latitude: 5.3599,
      longitude: -3.9569,
      type: 'residential',
    },
    {
      id: 'yopougon_abidjan',
      name: 'Yopougon',
      description: 'Plus grande commune d\'Abidjan',
      commune: 'Yopougon',
      city: 'Abidjan',
      latitude: 5.3364,
      longitude: -4.0669,
      type: 'residential',
    },
    // YAMOUSSOUKRO
    {
      id: 'yamoussoukro_centre',
      name: 'Yamoussoukro Centre',
      description: 'Capitale politique de la Côte d\'Ivoire',
      city: 'Yamoussoukro',
      latitude: 6.8276,
      longitude: -5.2893,
      type: 'capital',
    },
    {
      id: 'basilique_yamoussoukro',
      name: 'Basilique Notre-Dame de la Paix',
      description: 'Monument emblématique, Yamoussoukro',
      city: 'Yamoussoukro',
      latitude: 6.8108,
      longitude: -5.2894,
      type: 'landmark',
    },
    // BOUAKÉ
    {
      id: 'bouake_centre',
      name: 'Bouaké Centre',
      description: 'Deuxième plus grande ville',
      city: 'Bouaké',
      latitude: 7.6904,
      longitude: -5.0300,
      type: 'city_center',
    },
    // SAN PEDRO
    {
      id: 'san_pedro_port',
      name: 'Port de San Pedro',
      description: 'Port autonome, San Pedro',
      city: 'San Pedro',
      latitude: 4.7467,
      longitude: -6.6364,
      type: 'port',
    },
    // KORHOGO
    {
      id: 'korhogo_centre',
      name: 'Korhogo Centre',
      description: 'Capitale du Nord',
      city: 'Korhogo',
      latitude: 9.4580,
      longitude: -5.6297,
      type: 'city_center',
    },
    // DALOA
    {
      id: 'daloa_centre',
      name: 'Daloa Centre',
      description: 'Ville de l\'Ouest',
      city: 'Daloa',
      latitude: 6.8772,
      longitude: -6.4503,
      type: 'city_center',
    },
    // MAN
    {
      id: 'man_centre',
      name: 'Man Centre',
      description: 'Ville des 18 montagnes',
      city: 'Man',
      latitude: 7.4123,
      longitude: -7.5539,
      type: 'city_center',
    },
    // GAGNOA
    {
      id: 'gagnoa_centre',
      name: 'Gagnoa Centre',
      description: 'Chef-lieu du Gôh',
      city: 'Gagnoa',
      latitude: 6.1319,
      longitude: -5.9506,
      type: 'city_center',
    }
  ], []);

  // Toutes les villes importantes de Côte d'Ivoire
  const ivoryCoastCities = useMemo(() => [
    // District d'Abidjan
    { name: 'Abidjan', latitude: 5.3364, longitude: -4.0266, region: 'District d\'Abidjan' },
    { name: 'Abobo', latitude: 5.4167, longitude: -4.0167, region: 'District d\'Abidjan' },
    { name: 'Adjamé', latitude: 5.3667, longitude: -4.0333, region: 'District d\'Abidjan' },
    { name: 'Attécoubé', latitude: 5.3333, longitude: -4.0667, region: 'District d\'Abidjan' },
    { name: 'Cocody', latitude: 5.3500, longitude: -3.9874, region: 'District d\'Abidjan' },
    { name: 'Koumassi', latitude: 5.2833, longitude: -3.9500, region: 'District d\'Abidjan' },
    { name: 'Marcory', latitude: 5.2833, longitude: -4.0000, region: 'District d\'Abidjan' },
    { name: 'Plateau', latitude: 5.3274, longitude: -4.0266, region: 'District d\'Abidjan' },
    { name: 'Port-Bouët', latitude: 5.2500, longitude: -3.9167, region: 'District d\'Abidjan' },
    { name: 'Treichville', latitude: 5.3000, longitude: -4.0167, region: 'District d\'Abidjan' },
    { name: 'Yopougon', latitude: 5.3667, longitude: -4.0833, region: 'District d\'Abidjan' },
    
    // District de Yamoussoukro
    { name: 'Yamoussoukro', latitude: 6.8276, longitude: -5.2893, region: 'District de Yamoussoukro' },
    
    // Région des Lagunes
    { name: 'Dabou', latitude: 5.3275, longitude: -4.3767, region: 'Lagunes' },
    { name: 'Grand-Lahou', latitude: 5.2500, longitude: -5.0000, region: 'Lagunes' },
    { name: 'Tiassalé', latitude: 5.8989, longitude: -4.8222, region: 'Lagunes' },
    
    // Région du Haut-Sassandra
    { name: 'Daloa', latitude: 6.8772, longitude: -6.4503, region: 'Haut-Sassandra' },
    { name: 'Issia', latitude: 6.4931, longitude: -6.5856, region: 'Haut-Sassandra' },
    { name: 'Vavoua', latitude: 7.3817, longitude: -6.4794, region: 'Haut-Sassandra' },
    
    // Région de la Vallée du Bandama
    { name: 'Bouaké', latitude: 7.6904, longitude: -5.0300, region: 'Vallée du Bandama' },
    { name: 'Béoumi', latitude: 7.6744, longitude: -5.5811, region: 'Vallée du Bandama' },
    { name: 'Sakassou', latitude: 7.4547, longitude: -5.2925, region: 'Vallée du Bandama' },
    
    // Région des Montagnes
    { name: 'Man', latitude: 7.4123, longitude: -7.5539, region: 'Montagnes' },
    { name: 'Danané', latitude: 7.2658, longitude: -8.1511, region: 'Montagnes' },
    { name: 'Duékoué', latitude: 6.7406, longitude: -7.3572, region: 'Montagnes' },
    { name: 'Bangolo', latitude: 6.8381, longitude: -7.4881, region: 'Montagnes' },
    
    // Région des Savanes
    { name: 'Korhogo', latitude: 9.4580, longitude: -5.6297, region: 'Savanes' },
    { name: 'Boundiali', latitude: 9.5200, longitude: -6.4847, region: 'Savanes' },
    { name: 'Ferkessédougou', latitude: 9.5900, longitude: -5.1956, region: 'Savanes' },
    { name: 'Tengrela', latitude: 10.4833, longitude: -6.4086, region: 'Savanes' },
    
    // Région du Bas-Sassandra
    { name: 'San Pedro', latitude: 4.7467, longitude: -6.6364, region: 'Bas-Sassandra' },
    { name: 'Sassandra', latitude: 4.9500, longitude: -6.0833, region: 'Bas-Sassandra' },
    { name: 'Soubré', latitude: 5.7856, longitude: -6.5939, region: 'Bas-Sassandra' },
    
    // Région du Zanzan
    { name: 'Bondoukou', latitude: 8.0406, longitude: -2.8000, region: 'Zanzan' },
    { name: 'Bouna', latitude: 9.2717, longitude: -2.9950, region: 'Zanzan' },
    { name: 'Tanda', latitude: 7.8031, longitude: -3.1689, region: 'Zanzan' },
    
    // Région du Gôh-Djiboua
    { name: 'Gagnoa', latitude: 6.1319, longitude: -5.9506, region: 'Gôh-Djiboua' },
    { name: 'Divo', latitude: 5.8397, longitude: -5.3569, region: 'Gôh-Djiboua' },
    { name: 'Lakota', latitude: 5.8519, longitude: -5.6831, region: 'Gôh-Djiboua' },
    
    // Région du Lôh-Djiboua
    { name: 'Duekoué', latitude: 6.7406, longitude: -7.3572, region: 'Lôh-Djiboua' },
    
    // Région de l'Agnéby-Tiassa
    { name: 'Agboville', latitude: 5.9278, longitude: -4.2139, region: 'Agnéby-Tiassa' },
    { name: 'Sikensi', latitude: 5.6856, longitude: -4.5853, region: 'Agnéby-Tiassa' },
    
    // Région du Sud-Comoé
    { name: 'Aboisso', latitude: 5.4714, longitude: -3.2069, region: 'Sud-Comoé' },
    { name: 'Grand-Bassam', latitude: 5.2011, longitude: -3.7389, region: 'Sud-Comoé' },
    { name: 'Adiaké', latitude: 5.2908, longitude: -3.2994, region: 'Sud-Comoé' }
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

  // Recherche d'adresses améliorée pour toute la Côte d'Ivoire
  const searchAddresses = useCallback(
    debounce(async (query: string) => {
      if (query.length === 0) {
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
        if (showCurrentLocation && (normalizedQuery.includes('votre') || normalizedQuery.includes('position'))) {
          results.push({
            id: 'current_location',
            description: 'Prise en charge à votre position GPS',
            latitude: currentLocation?.coords.latitude || 7.539989,
            longitude: currentLocation?.coords.longitude || -5.54708,
            region: 'Côte d\'Ivoire',
            type: 'current_location'
          });
        }

        // Recherche dans les lieux populaires
        popularPlaces.forEach((place) => {
          if (
            place.name.toLowerCase().includes(normalizedQuery) ||
            place.description.toLowerCase().includes(normalizedQuery) ||
            (place.commune && place.commune.toLowerCase().includes(normalizedQuery)) ||
            (place.city && place.city.toLowerCase().includes(normalizedQuery)) ||
            (place.region && place.region.toLowerCase().includes(normalizedQuery))
          ) {
            results.push({
              id: place.id,
              description: place.description,
              latitude: place.latitude,
              longitude: place.longitude,
              commune: place.commune,
              city: place.city,
              region: place.region,
              type: place.type as any
            });
          }
        });

        // Recherche par ville dans toute la Côte d'Ivoire
        ivoryCoastCities.forEach((city, index) => {
          if (city.name.toLowerCase().includes(normalizedQuery) ||
              city.region.toLowerCase().includes(normalizedQuery)) {
            results.push({
              id: `city_${index}`,
              description: `${city.name}, ${city.region}`,
              latitude: city.latitude,
              longitude: city.longitude,
              city: city.name,
              region: city.region,
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
    [popularPlaces, ivoryCoastCities, maxSuggestions, showCurrentLocation, currentLocation]
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

      // Trouver la ville la plus proche en Côte d'Ivoire
      let nearestCity = ivoryCoastCities[0];
      let minDistance = Infinity;

      ivoryCoastCities.forEach(city => {
        const distance = Math.sqrt(
          Math.pow(currentLocation.coords.latitude - city.latitude, 2) + 
          Math.pow(currentLocation.coords.longitude - city.longitude, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      });

      const address: Address = {
        id: 'current_location',
        description: `Position actuelle (${nearestCity.name}, ${nearestCity.region})`,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        city: nearestCity.name,
        region: nearestCity.region,
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
    if (value.length > 0) {
      searchAddresses(value);
    } else {
      // Afficher les lieux populaires par défaut
      setSuggestions(popularPlaces.slice(0, maxSuggestions).map(place => ({
        id: place.id,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        commune: place.commune,
        city: place.city,
        region: place.region,
        type: place.type as any
      })));
      setShowSuggestions(true);
    }
  }, [onFocus, value, searchAddresses, popularPlaces, maxSuggestions]);

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
        return 'navigate-outline';
      case 'saved':
        return 'home-outline';
      case 'business':
        return 'business-outline';
      case 'restaurant':
        return 'restaurant-outline';
      case 'entertainment':
        return 'film-outline';
      case 'capital':
        return 'flag-outline';
      case 'port':
        return 'boat-outline';
      case 'landmark':
        return 'library-outline';
      case 'city_center':
        return 'business-outline';
      default:
        return 'location-outline';
    }
  };

  const renderSuggestion = (item: Address, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={styles.suggestionItem}
      onPress={() => handleAddressSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons 
          name={getIconForType(item.type) as any} 
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
           item.city && item.region ? `${item.city}, ${item.region}` :
           item.commune ? `${item.commune}, ${item.city || 'Abidjan'}` : 
           item.description}
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
            <Feather name={icon === "box" ? "box" : icon === "navigation" ? "compass" : "map-pin"} size={20} color="#666" />
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
                <View style={styles.inputActions}>
                  {showCurrentLocation && (
                    <TouchableOpacity
                      onPress={handleCurrentLocationSelect}
                      style={styles.locationButton}
                      disabled={loading}
                    >
                      <Ionicons 
                        name="locate" 
                        size={18} 
                        color={loading ? "#999" : "#666"} 
                      />
                    </TouchableOpacity>
                  )}
                  {value ? (
                    <TouchableOpacity
                      onPress={clearInput}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close" size={18} color="#666" />
                    </TouchableOpacity>
                  ) : null}
                </View>
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
            <View style={styles.suggestionsList}>
              {suggestions.map((item, index) => (
                <View key={item.id}>
                  {renderSuggestion(item, index)}
                  {index < suggestions.length - 1 && <Divider />}
                </View>
              ))}
            </View>
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
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  clearButton: {
    padding: 4,
  },
});

export default AddressAutocomplete;
