import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Picker as NativePicker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { AddressAutocomplete, CustomLoaderModal } from '../../components';
import MultiDestinationService, { MultiDestinationDeliveryCreate } from '../../services/MultiDestinationService';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import { useLoader } from '../../contexts/LoaderContext';

interface Destination {
  address: string;
  commune: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
  instructions: string;
}

interface FormErrors {
  pickupAddress?: string;
  pickupCommune?: string;
  destinations?: string;
  preferredDate?: string;
  package_description?: string;
}

const COMMUNES = [
  'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 
  'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
];

const CreateMultiDestinationDeliveryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  // États pour le formulaire principal
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCommune, setPickupCommune] = useState('');
  const [pickupContactName, setPickupContactName] = useState(user?.name || '');
  const [pickupContactPhone, setPickupContactPhone] = useState(user?.phone || '');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');

  // États pour les destinations
  const [destinations, setDestinations] = useState<Destination[]>([{
    address: '',
    commune: '',
    latitude: 0,
    longitude: 0,
    contactName: '',
    contactPhone: '',
    instructions: ''
  }]);

  // États pour la carte et géolocalisation
  const [region, setRegion] = useState({
    latitude: 5.3599517,
    longitude: -4.0082563,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [pickupLocation, setPickupLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  // États pour l'interface
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission refusée', 'La permission de géolocalisation est nécessaire');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setPickupLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
    }
  };

  const addDestination = () => {
    setDestinations([...destinations, {
      address: '',
      commune: '',
      latitude: 0,
      longitude: 0,
      contactName: '',
      contactPhone: '',
      instructions: ''
    }]);
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      const newDestinations = destinations.filter((_, i) => i !== index);
      setDestinations(newDestinations);
    }
  };

  const updateDestination = (index: number, field: keyof Destination, value: string | number) => {
    const newDestinations = [...destinations];
    newDestinations[index] = { ...newDestinations[index], [field]: value };
    setDestinations(newDestinations);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!pickupAddress.trim()) {
      errors.pickupAddress = 'L\'adresse de collecte est requise';
    }

    if (!pickupCommune) {
      errors.pickupCommune = 'La commune de collecte est requise';
    }

    if (!packageDescription.trim()) {
      errors.package_description = 'La description du colis est requise';
    }

    // Validation des destinations
    const validDestinations = destinations.filter(dest => dest.address.trim());
    if (validDestinations.length === 0) {
      errors.destinations = 'Au moins une destination est requise';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setIsLoading(true);
      showLoader();

      const validDestinations = destinations.filter(dest => dest.address.trim());

      const deliveryData = {
        pickup_address: pickupAddress,
        pickup_latitude: pickupLocation?.coords.latitude,
        pickup_longitude: pickupLocation?.coords.longitude,
        package_type: 'standard',
        package_description: packageDescription,
        destinations: validDestinations.map((dest, index) => ({
          address: dest.address,
          latitude: dest.latitude,
          longitude: dest.longitude,
          recipient_name: dest.contactName,
          recipient_phone: dest.contactPhone,
          delivery_notes: dest.instructions,
          order: index + 1,
        })),
        is_fragile: false,
        is_urgent: false,
        special_instructions: pickupInstructions,
        vehicle_type_required: 'any',
      };

      const result = await MultiDestinationService.createDelivery(deliveryData);

      showAlert('Succès', 'Livraison multi-destinations créée avec succès');
      
      // Rediriger vers l'écran des enchères
      navigation.navigate('MultiDestinationDeliveries' as never);
    } catch (error: any) {
      console.error('Erreur création:', error);
      showAlert('Erreur', error.message || 'Impossible de créer la livraison');
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (event.type === 'set' && selectedDate) {
      setPreferredDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Nouvelle livraison multi-destinations
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <CustomLoaderModal
        visible={isLoading}
        title="Création en cours..."
        message="Veuillez patienter pendant la création de votre livraison"
        type="loading"
      />

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Section Collecte */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📍 Point de collecte
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Adresse de collecte *</Text>
            <AddressAutocomplete
              label="Adresse de collecte"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={(address) => {
                setPickupAddress(address.description);
                setPickupCommune(address.commune || '');
                if (address.geometry?.location) {
                  setRegion({
                    latitude: address.geometry.location.lat,
                    longitude: address.geometry.location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                }
              }}
              placeholder="Saisir ou rechercher une adresse"
            />
            {formErrors.pickupAddress && (
              <Text style={styles.errorText}>{formErrors.pickupAddress}</Text>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Commune *</Text>
            <View style={styles.pickerContainer}>
              <NativePicker
                selectedValue={pickupCommune}
                onValueChange={setPickupCommune}
                style={styles.picker}
              >
                <NativePicker.Item label="Sélectionner une commune" value="" color="#aaa" />
                {COMMUNES.map(c => <NativePicker.Item key={c} label={c} value={c} />)}
              </NativePicker>
            </View>
            {formErrors.pickupCommune && (
              <Text style={styles.errorText}>{formErrors.pickupCommune}</Text>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Nom du contact collecte</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Nom du contact collecte"
              value={pickupContactName}
              onChangeText={setPickupContactName}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Téléphone du contact collecte</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Téléphone du contact collecte"
              value={pickupContactPhone}
              onChangeText={setPickupContactPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Instructions de collecte</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
              placeholder="Instructions de collecte"
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Section Destinations */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                🎯 Destinations ({destinations.length})
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={addDestination}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {destinations.map((destination, index) => (
              <View key={index} style={styles.destinationCard}>
                <View style={styles.destinationHeader}>
                  <Text style={[styles.destinationTitle, { color: colors.text }]}>
                    Destination {index + 1}
                  </Text>
                  {destinations.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDestination(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Adresse *</Text>
                <AddressAutocomplete
                  label={`Destination ${index + 1}`}
                  value={destination.address}
                  onChangeText={(text) => updateDestination(index, 'address', text)}
                  onAddressSelect={(address) => {
                    updateDestination(index, 'address', address.description);
                    updateDestination(index, 'commune', address.commune || '');
                    if (address.geometry?.location) {
                      updateDestination(index, 'latitude', address.geometry.location.lat);
                      updateDestination(index, 'longitude', address.geometry.location.lng);
                    }
                  }}
                  placeholder="Saisir ou rechercher une adresse"
                />

                <Text style={[styles.label, { color: colors.text }]}>Commune</Text>
                <View style={styles.pickerContainer}>
                  <NativePicker
                    selectedValue={destination.commune}
                    onValueChange={(value) => updateDestination(index, 'commune', value)}
                    style={styles.picker}
                  >
                    <NativePicker.Item label="Sélectionner une commune" value="" color="#aaa" />
                    {COMMUNES.map(c => <NativePicker.Item key={c} label={c} value={c} />)}
                  </NativePicker>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Nom du contact</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Nom du contact"
                  value={destination.contactName}
                  onChangeText={(text) => updateDestination(index, 'contactName', text)}
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={[styles.label, { color: colors.text }]}>Téléphone du contact</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Téléphone du contact"
                  value={destination.contactPhone}
                  onChangeText={(text) => updateDestination(index, 'contactPhone', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
                <TextInput
                  style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Instructions de livraison"
                  value={destination.instructions}
                  onChangeText={(text) => updateDestination(index, 'instructions', text)}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            ))}

            {formErrors.destinations && (
              <Text style={styles.errorText}>{formErrors.destinations}</Text>
            )}
          </View>

          {/* Section Détails */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📦 Détails de la livraison
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Description du colis *</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
              placeholder="Décrivez le contenu du colis"
              value={packageDescription}
              onChangeText={setPackageDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textSecondary}
            />
            {formErrors.package_description && (
              <Text style={styles.errorText}>{formErrors.package_description}</Text>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Date préférée</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {preferredDate.toLocaleDateString()} à {preferredDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>Prix proposé (FCFA)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="0"
              value={proposedPrice}
              onChangeText={setProposedPrice}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Création...' : 'Créer la livraison'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={preferredDate}
          mode="datetime"
          display={Platform.OS === 'android' ? 'calendar' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 8,
  },
});

export default CreateMultiDestinationDeliveryScreen;