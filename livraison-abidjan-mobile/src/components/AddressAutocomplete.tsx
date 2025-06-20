import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard, ActivityIndicator } from 'react-native';
import { TextInput, Card, Text, Button, HelperText } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoogleMapsApiKey } from '../config/environment';
import { colors } from '../styles/colors';
import type { Address } from '../types/models';

interface AddressAutocompleteProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onAddressSelect: (address: Address) => void;
  placeholder?: string;
  error?: string;
  style?: object;
  disabled?: boolean;
}

const HISTORY_KEY = 'address_history';

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  label,
  value,
  onChangeText,
  onAddressSelect,
  placeholder,
  error,
  style,
  disabled = false,
}) => {
  const [history, setHistory] = useState<Address[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const inputRef = useRef<any>(null);
  const [predictions, setPredictions] = useState<Array<{
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    description: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger l'historique local
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        setHistory(stored ? (JSON.parse(stored) as Address[]) : []);
      } catch {
        setHistory([]);
      }
    })();
  }, []);

  // Ajouter à l'historique
  const addToHistory = async (address: Address) => {
    try {
      const newHistory = [address, ...history.filter(a => a.description !== address.description)].slice(0, 8);
      setHistory(newHistory);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch {}
  };

  // Utiliser la position actuelle
  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission refusée');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      let address = '';
      let commune = '';
      try {
        const res = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (res && res[0]) {
          address = `${res[0].name || ''} ${res[0].street || ''}, ${res[0].city || res[0].region || ''}`.trim();
          commune = res[0].city || res[0].region || '';
        }
      } catch {}
      const addr: Address = {
        id: 'current_location',
        name: address,
        description: address,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        commune,
        type: 'current_location',
      };
      onChangeText(address);
      onAddressSelect(addr);
      addToHistory(addr);
    } catch {}
    setLoadingLocation(false);
  };

  // Sélection d'une suggestion Google ou historique
  const handleSelect = (address: Address) => {
    onChangeText(address.description);
    onAddressSelect(address);
    addToHistory(address);
    setShowHistory(false);
    Keyboard.dismiss();
  };

  const handleTextChange = async (text: string) => {
    onChangeText(text);
    if (text.length > 2) {
      setIsLoading(true);
      try {
        // TODO: Implémenter l'appel à l'API Google Places
        const results: Array<{
          place_id: string;
          structured_formatting: {
            main_text: string;
            secondary_text: string;
          };
          description: string;
        }> = []; // Remplacer par l'appel API réel
        setPredictions(results);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setPredictions([]);
    }
  };

  const handleSelectAddress = async (prediction: any) => {
    try {
      // TODO: Get address details from Google
      const addressDetails: Address = {
        id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        description: prediction.description,
        commune: prediction.structured_formatting.secondary_text,
        latitude: 0, // Replace with actual coords
        longitude: 0, // Replace with actual coords
        type: 'google',
      };
      onAddressSelect(addressDetails);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } catch (error) {
      console.error('Error getting address details:', error);
    }
  };

  const handleSelectHistory = (item: Address) => {
    onAddressSelect({
      ...item,
    });
    setShowHistory(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <TextInput
          label={label}
          placeholder={placeholder || 'Saisir une adresse'}
          value={value}
          onChangeText={handleTextChange}
          placeholderTextColor={colors.text}
          style={[styles.textInput, { borderRadius: 12, backgroundColor: '#fff', fontSize: 16, padding: 12 }]}
          editable={!disabled}
          right={<TextInput.Icon icon={() => <Feather name="map-pin" size={20} color="#007AFF" />} onPress={() => setShowHistory(true)} />}
          error={!!error}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
        ) : value ? (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.icon}>
            <Feather name="x" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && <HelperText type="error" visible={!!error}>{error}</HelperText>}
      <Button
        mode="outlined"
        icon={loadingLocation ? 'loading' : 'crosshairs-gps'}
        onPress={handleUseCurrentLocation}
        style={{ marginTop: 8, borderRadius: 8 }}
        loading={loadingLocation}
      >Utiliser ma position actuelle</Button>
      {showHistory && history.length > 0 && (
        <Card style={styles.suggestionsCard}>
          {history.map((h, idx) => (
            <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSelect(h)}>
              <Text style={styles.suggestionText}>{h.description}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}
      <GooglePlacesAutocomplete
        ref={inputRef}
        placeholder={placeholder || 'Rechercher une adresse'}
        minLength={2}
        fetchDetails={true}
        enablePoweredByContainer={false}
        debounce={400}
        onPress={(data, details = null) => {
          if (!data || !details || !details.geometry || !details.geometry.location) return;
          const address: Address = {
            id: data.place_id,
            name: data.description,
            description: data.description,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            commune: (details.address_components || []).find((c: any) => (c.types || []).includes('locality'))?.long_name || '',
            type: 'google',
          };
          handleSelect(address);
        }}
        query={{
          key: getGoogleMapsApiKey(),
          language: 'fr',
          components: 'country:ci',
        }}
        predefinedPlaces={[]}
        styles={{
          textInput: { borderRadius: 12, backgroundColor: '#fff', fontSize: 16, padding: 12 },
          listView: { borderRadius: 12, backgroundColor: '#fff', marginTop: 4 },
          row: { padding: 12 },
          description: { fontSize: 15 },
          poweredContainer: { display: 'none' },
        }}
        renderLeftButton={() => (
          <Feather name="map-pin" size={20} color="#007AFF" style={{ marginLeft: 8 }} />
        )}
        textInputProps={{
          value,
          onChangeText: (txt: string) => {
            onChangeText(txt);
            setShowHistory(false);
          },
          editable: !disabled,
        }}
      />
      {predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          {predictions.map((prediction) => (
            <TouchableOpacity
              key={prediction.place_id}
              style={styles.predictionItem}
              onPress={() => handleSelectAddress(prediction)}
            >
              <Feather name="map-pin" size={16} color={colors.text} style={styles.predictionIcon} />
              <View style={styles.predictionTextContainer}>
                <Text style={styles.mainText}>{prediction.structured_formatting.main_text}</Text>
                <Text style={styles.secondaryText}>{prediction.structured_formatting.secondary_text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 8,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    elevation: 2,
    paddingVertical: 4,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  icon: {
    padding: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  predictionIcon: {
    marginRight: 12,
  },
  predictionTextContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    color: colors.text,
  },
  secondaryText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
});

export default AddressAutocomplete;
