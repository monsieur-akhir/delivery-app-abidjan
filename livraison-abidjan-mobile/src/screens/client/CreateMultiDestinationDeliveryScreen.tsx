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
import Toast from 'react-native-root-toast';
import { Picker as NativePicker } from '@react-native-picker/picker';
import axios from 'axios';

import { AddressAutocomplete, CustomLoaderModal } from '../../components';
import { DeliveryService } from '../../services';
import MultiDestinationService from '../../services/MultiDestinationService';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface Destination {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  recipient_name: string;
  recipient_phone: string;
  delivery_notes?: string;
  order: number;
  commune: string;
}

const COMMUNES = [
  'Plateau', 'Cocody', 'Yopougon', 'Marcory', 'Treichville', 'Adjamé', 'Abobo', 'Koumassi', 'Port-Bouët', 'Bingerville', 'Anyama', 'Songon', 'Attécoubé',
  // Communes environnantes
  'Grand-Bassam', 'Dabou', 'Jacqueville', 'Azaguié', 'Alépé', 'Bonoua'
];

// Fonction utilitaire pour obtenir le nom à afficher du user
const getUserDisplayName = (user: any) =>
  user?.full_name || user?.name || user?.first_name || user?.username || user?.phone || '';

const CreateMultiDestinationDeliveryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const mapRef = useRef<MapView | null>(null);

  // États pour le point de collecte
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCommune, setPickupCommune] = useState('');
  const [pickupLocation, setPickupLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');

  // États pour les destinations
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [currentDestination, setCurrentDestination] = useState({
    address: '',
    commune: '',
    latitude: 0,
    longitude: 0,
    recipient_name: '',
    recipient_phone: '',
    delivery_notes: '',
  });

  // États pour le colis
  const [packageType, setPackageType] = useState('small');
  const [packageDescription, setPackageDescription] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [totalProposedPrice, setTotalProposedPrice] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // UX/validation
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Itinéraire et prix recommandé
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number, longitude: number}[]>([]);
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // Carte
  const [region, setRegion] = useState({
    latitude: 5.3600,
    longitude: -4.0083,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Pré-remplir nom et téléphone du user connecté pour le point de collecte
  useEffect(() => {
    if (user) {
      setPickupContactName(getUserDisplayName(user));
      setPickupContactPhone(user.phone || '');
    }
  }, [user]);

  // Calcul automatique de l'itinéraire et du prix recommandé
  useEffect(() => {
    const fetchRouteAndPrice = async () => {
      if (!pickupLocation || destinations.length < 2) {
        setRouteCoordinates([]);
        setRecommendedPrice(null);
        setDistanceKm(null);
        return;
      }
      try {
        // Utilise la clé Google Places de l'environnement
        const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY; // Doit être défini dans l'environnement ou .env
        const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;
        const waypoints = destinations.map(dest => `${dest.latitude},${dest.longitude}`).join('|');
        const destination = `${destinations[destinations.length-1].latitude},${destinations[destinations.length-1].longitude}`;
        // Option optimize:true pour l'ordre optimal
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true|${waypoints}&mode=driving&key=${GOOGLE_API_KEY}`;
        const res = await axios.get(url);
        if (res.data.status === 'OK') {
          // Décodage du polyline
          const points: {latitude: number, longitude: number}[] = [];
          (res.data.routes[0].legs as any[]).forEach((leg: any) => {
            (leg.steps as any[]).forEach((step: any) => {
              points.push({ latitude: step.start_location.lat, longitude: step.start_location.lng });
              points.push({ latitude: step.end_location.lat, longitude: step.end_location.lng });
            });
          });
          setRouteCoordinates(points);
          // Distance totale
          const totalMeters = (res.data.routes[0].legs as any[]).reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
          const km = totalMeters / 1000;
          setDistanceKm(km);
          // Prix recommandé (exemple : 500 FCFA de base + 200 FCFA/km)
          const price = Math.round(500 + km * 200);
          setRecommendedPrice(price);
        } else {
          setRouteCoordinates([]);
          setRecommendedPrice(null);
          setDistanceKm(null);
        }
      } catch (e) {
        setRouteCoordinates([]);
        setRecommendedPrice(null);
        setDistanceKm(null);
      }
    };
    fetchRouteAndPrice();
  }, [pickupLocation, destinations]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          ...region,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  const addDestination = () => {
    if (!currentDestination.address || !currentDestination.recipient_name || !currentDestination.recipient_phone || !currentDestination.commune) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires de la destination');
      return;
    }
    const newDestination: Destination = {
      id: Date.now().toString(),
      address: currentDestination.address,
      latitude: currentDestination.latitude || region.latitude,
      longitude: currentDestination.longitude || region.longitude,
      recipient_name: currentDestination.recipient_name,
      recipient_phone: currentDestination.recipient_phone,
      delivery_notes: currentDestination.delivery_notes,
      order: destinations.length + 1,
      commune: currentDestination.commune,
    };
    setDestinations([...destinations, newDestination]);
    setCurrentDestination({
      address: '',
      commune: '',
      latitude: 0,
      longitude: 0,
      recipient_name: '',
      recipient_phone: '',
      delivery_notes: '',
    });
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter(dest => dest.id !== id));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!pickupAddress) errors.pickupAddress = 'Adresse de collecte requise';
    if (!pickupCommune) errors.pickupCommune = 'Commune de collecte requise';
    if (!totalProposedPrice) errors.totalProposedPrice = 'Prix proposé requis';
    if (destinations.length < 2) errors.destinations = 'Au moins 2 destinations requises';
    destinations.forEach((dest, idx) => {
      if (!dest.address) errors[`dest_address_${idx}`] = 'Adresse requise';
      if (!dest.commune) errors[`dest_commune_${idx}`] = 'Commune requise';
      if (!dest.recipient_name) errors[`dest_name_${idx}`] = 'Nom requis';
      if (!dest.recipient_phone) errors[`dest_phone_${idx}`] = 'Téléphone requis';
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show('Veuillez corriger les erreurs du formulaire.', { backgroundColor: '#E53935', textColor: '#fff', duration: 2000 });
      return;
    }
    setLoading(true);
    try {
      const deliveryData = {
        pickup_address: pickupAddress,
        pickup_commune: pickupCommune,
        pickup_lat: pickupLocation?.latitude,
        pickup_lng: pickupLocation?.longitude,
        pickup_contact_name: pickupContactName,
        pickup_contact_phone: pickupContactPhone,
        pickup_instructions: pickupInstructions,
        destinations: destinations.map(dest => ({
          delivery_address: dest.address,
          delivery_commune: dest.commune,
          delivery_lat: dest.latitude,
          delivery_lng: dest.longitude,
          recipient_name: dest.recipient_name,
          recipient_phone: dest.recipient_phone,
          special_instructions: dest.delivery_notes,
        })),
        total_proposed_price: parseFloat(totalProposedPrice),
        special_instructions: specialInstructions,
        vehicle_type_required: vehicleType,
        is_fragile: isFragile,
        is_urgent: isUrgent,
      };
      console.log('Payload envoyé:', JSON.stringify(deliveryData, null, 2));
      await MultiDestinationService.createDelivery(deliveryData);
      Toast.show('Livraison créée avec succès !', { backgroundColor: '#4CAF50', textColor: '#fff', duration: 2000 });
      navigation.navigate('MultiDestinationDeliveries' as never);
    } catch (error: any) {
      if (error.response && error.response.data) {
        console.log('Erreur détaillée:', error.response.data);
        Toast.show('Erreur : ' + JSON.stringify(error.response.data), { backgroundColor: '#E53935', textColor: '#fff', duration: 3000 });
      } else {
        console.error('Erreur lors de la création:', error);
        Toast.show('Erreur inconnue lors de la création', { backgroundColor: '#E53935', textColor: '#fff', duration: 3000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle livraison multi-destinations</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Affichage du nom du user connecté en haut de l'écran */}
          {getUserDisplayName(user) && (
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#2196F3' }}>
              Bonjour, {getUserDisplayName(user)} !
            </Text>
          )}

          {/* Carte */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
            >
              {pickupLocation && (
                <Marker
                  coordinate={{
                    latitude: pickupLocation.latitude,
                    longitude: pickupLocation.longitude,
                  }}
                  title="Point de collecte"
                  pinColor="green"
                />
              )}
              {destinations.map((dest, index) => (
                <Marker
                  key={dest.id}
                  coordinate={{
                    latitude: dest.latitude,
                    longitude: dest.longitude,
                  }}
                  title={`Destination ${index + 1}`}
                  description={dest.address}
                />
              ))}
              {routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#2196F3"
                  strokeWidth={4}
                />
              )}
            </MapView>
          </View>

          {/* Point de collecte */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Point de collecte <Text style={{color:'#E53935'}}>*</Text></Text>
            <Text style={styles.label}>Adresse de collecte</Text>
            <AddressAutocomplete
              label="Adresse de collecte"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={(address) => {
                setPickupAddress(address.description);
                setPickupCommune(address.commune || '');
                setPickupLocation({
                  latitude: address.latitude,
                  longitude: address.longitude,
                });
                mapRef.current?.animateToRegion({
                  latitude: address.latitude,
                  longitude: address.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }}
            />
            {formErrors.pickupAddress ? <Text style={styles.errorText}>{formErrors.pickupAddress}</Text> : null}
            <Text style={styles.label}>Commune de collecte</Text>
            <View style={[styles.input, {padding:0}]}> 
              <NativePicker
                selectedValue={pickupCommune}
                onValueChange={setPickupCommune}
                style={{height:40, color: pickupCommune ? '#333' : '#aaa'}}>
                <NativePicker.Item label="Sélectionner la commune" value="" color="#aaa" />
                {COMMUNES.map(c => <NativePicker.Item key={c} label={c} value={c} />)}
              </NativePicker>
            </View>
            {pickupCommune ? (
              <Text style={{color:'#2196F3', marginTop:4}}>Commune sélectionnée : {pickupCommune}</Text>
            ) : null}
            {formErrors.pickupCommune ? <Text style={styles.errorText}>{formErrors.pickupCommune}</Text> : null}
            <Text style={styles.label}>Nom du contact collecte (pré-rempli)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du contact collecte"
              value={pickupContactName}
              onChangeText={setPickupContactName}
            />
            <Text style={styles.label}>Téléphone du contact collecte (pré-rempli)</Text>
            <TextInput
              style={styles.input}
              placeholder="Téléphone du contact collecte"
              value={pickupContactPhone}
              onChangeText={setPickupContactPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Instructions de collecte (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Instructions de collecte"
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
            />
          </View>

          {/* Destinations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destinations ({destinations.length})</Text>
            {/* Liste des destinations */}
            {destinations.map((dest, index) => (
              <View key={dest.id} style={styles.destinationItem}>
                <View style={styles.destinationHeader}>
                  <Text style={styles.destinationNumber}>{index + 1}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDestination(dest.id)}
                    accessibilityLabel={`Supprimer la destination ${index + 1}`}
                    hitSlop={{top:10, bottom:10, left:10, right:10}}
                  >
                    <Ionicons name="close-circle" size={28} color="#FF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.destinationAddress}>{dest.address}</Text>
                <Text style={styles.destinationDetails}>
                  {dest.recipient_name} • {dest.recipient_phone}
                </Text>
                <Text style={styles.destinationDetails}>{dest.commune}</Text>
                {dest.delivery_notes && (
                  <Text style={styles.deliveryNotes}>{dest.delivery_notes}</Text>
                )}
                {formErrors[`dest_address_${index}`] ? <Text style={styles.errorText}>{formErrors[`dest_address_${index}`]}</Text> : null}
                {formErrors[`dest_commune_${index}`] ? <Text style={styles.errorText}>{formErrors[`dest_commune_${index}`]}</Text> : null}
                {formErrors[`dest_name_${index}`] ? <Text style={styles.errorText}>{formErrors[`dest_name_${index}`]}</Text> : null}
                {formErrors[`dest_phone_${index}`] ? <Text style={styles.errorText}>{formErrors[`dest_phone_${index}`]}</Text> : null}
              </View>
            ))}
            {formErrors.destinations ? <Text style={styles.errorText}>{formErrors.destinations}</Text> : null}
            {/* Formulaire nouvelle destination */}
            <View style={styles.newDestinationForm}>
              <Text style={styles.label}>Adresse de livraison</Text>
              <AddressAutocomplete
                label="Nouvelle adresse de livraison"
                value={currentDestination.address}
                onChangeText={(text) => 
                  setCurrentDestination({ ...currentDestination, address: text })
                }
                onAddressSelect={(address) => {
                  setCurrentDestination({
                    ...currentDestination,
                    address: address.description,
                    commune: address.commune || '',
                    latitude: address.latitude,
                    longitude: address.longitude,
                  });
                  setRegion({
                    latitude: address.latitude,
                    longitude: address.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                }}
              />
              <Text style={styles.label}>Commune de livraison</Text>
              <View style={[styles.input, {padding:0}]}> 
                <NativePicker
                  selectedValue={currentDestination.commune}
                  onValueChange={(text) => setCurrentDestination({ ...currentDestination, commune: text })}
                  style={{height:40, color: currentDestination.commune ? '#333' : '#aaa'}}>
                  <NativePicker.Item label="Sélectionner la commune" value="" color="#aaa" />
                  {COMMUNES.map(c => <NativePicker.Item key={c} label={c} value={c} />)}
                </NativePicker>
              </View>
              {currentDestination.commune ? (
                <Text style={{color:'#2196F3', marginTop:4}}>Commune sélectionnée : {currentDestination.commune}</Text>
              ) : null}
              <Text style={styles.label}>Nom du destinataire</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom du destinataire"
                value={currentDestination.recipient_name}
                onChangeText={(text) =>
                  setCurrentDestination({ ...currentDestination, recipient_name: text })
                }
              />
              <Text style={styles.label}>Téléphone du destinataire</Text>
              <TextInput
                style={styles.input}
                placeholder="Téléphone du destinataire"
                value={currentDestination.recipient_phone}
                onChangeText={(text) =>
                  setCurrentDestination({ ...currentDestination, recipient_phone: text })
                }
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Instructions de livraison (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Instructions de livraison"
                value={currentDestination.delivery_notes}
                onChangeText={(text) =>
                  setCurrentDestination({ ...currentDestination, delivery_notes: text })
                }
                multiline
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addDestination}
                accessibilityLabel="Ajouter la destination"
                hitSlop={{top:10, bottom:10, left:10, right:10}}
              >
                <Text style={styles.addButtonText}>Ajouter la destination</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Informations du colis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du colis</Text>
            <Text style={styles.label}>Description du colis (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description du colis"
              value={packageDescription}
              onChangeText={setPackageDescription}
              multiline
            />
            <Text style={styles.label}>Prix proposé (FCFA) <Text style={{color:'#E53935'}}>*</Text></Text>
            <TextInput
              style={[styles.input, formErrors.totalProposedPrice && { borderColor: 'red' }]}
              placeholder="Prix proposé (FCFA)"
              value={totalProposedPrice}
              onChangeText={setTotalProposedPrice}
              keyboardType="numeric"
            />
            {recommendedPrice && (
              <View style={{flexDirection:'column', marginBottom:8}}>
                <Text style={{color:'#2196F3', fontWeight:'bold'}}>Prix recommandé : {recommendedPrice} FCFA</Text>
                {distanceKm && (
                  <Text style={{color:'#666'}}>Distance totale : {distanceKm.toFixed(1)} km</Text>
                )}
                <Text style={{color:'#888', fontSize:12}}>
                  (Formule : 500 FCFA de base + 200 FCFA/km)
                </Text>
              </View>
            )}
            {formErrors.totalProposedPrice ? <Text style={styles.errorText}>{formErrors.totalProposedPrice}</Text> : null}
            <Text style={styles.label}>Type de véhicule</Text>
            <View style={[styles.input, {padding:0}]}> 
              <NativePicker
                selectedValue={vehicleType}
                onValueChange={setVehicleType}
                style={{height:40, color: vehicleType ? '#333' : '#aaa'}}>
                <NativePicker.Item label="Type de véhicule" value="" color="#aaa" />
                <NativePicker.Item label="Moto" value="moto" />
                <NativePicker.Item label="Voiture" value="voiture" />
                <NativePicker.Item label="Camionnette" value="camionnette" />
                <NativePicker.Item label="Tricycle" value="tricycle" />
                <NativePicker.Item label="Pickup" value="pickup" />
                <NativePicker.Item label="Van" value="van" />
              </NativePicker>
            </View>
            {vehicleType ? (
              <Text style={{color:'#2196F3', marginTop:4}}>Véhicule sélectionné : {vehicleType}</Text>
            ) : null}
            <Text style={styles.label}>Instructions spéciales (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Instructions spéciales"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ marginRight: 8 }}>Colis fragile</Text>
              <TouchableOpacity onPress={() => setIsFragile(!isFragile)} accessibilityLabel="Colis fragile" hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name={isFragile ? 'checkbox' : 'square-outline'} size={28} color="#2196F3" />
              </TouchableOpacity>
              <Text style={{ marginLeft: 16, marginRight: 8 }}>Urgent</Text>
              <TouchableOpacity onPress={() => setIsUrgent(!isUrgent)} accessibilityLabel="Urgent" hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name={isUrgent ? 'checkbox' : 'square-outline'} size={28} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Récapitulatif avant soumission */}
          <View style={{backgroundColor:'#f0f8ff', borderRadius:8, padding:12, marginBottom:16}}>
            <Text style={{fontWeight:'bold'}}>Récapitulatif :</Text>
            <Text>Collecte : {pickupAddress} ({pickupCommune})</Text>
            <Text>Contact : {pickupContactName} - {pickupContactPhone}</Text>
            <Text>Destinations :</Text>
            {destinations.map((dest, idx) => (
              <Text key={dest.id}>  {idx+1}. {dest.address} ({dest.commune}) - {dest.recipient_name}</Text>
            ))}
            {vehicleType ? <Text>Véhicule : {vehicleType}</Text> : null}
            {recommendedPrice ? <Text>Prix recommandé : {recommendedPrice} FCFA</Text> : null}
            {distanceKm ? <Text>Distance : {distanceKm.toFixed(1)} km</Text> : null}
          </View>

          {/* Bouton pour effacer tout le formulaire */}
          <TouchableOpacity
            style={[styles.addButton, {backgroundColor:'#E53935', marginBottom:16}]}
            onPress={() => {
              setPickupAddress('');
              setPickupCommune('');
              setPickupLocation(null);
              setPickupContactName(getUserDisplayName(user));
              setPickupContactPhone(user?.phone || '');
              setPickupInstructions('');
              setDestinations([]);
              setCurrentDestination({
                address: '',
                commune: '',
                latitude: 0,
                longitude: 0,
                recipient_name: '',
                recipient_phone: '',
                delivery_notes: '',
              });
              setPackageType('small');
              setPackageDescription('');
              setIsFragile(false);
              setIsUrgent(false);
              setTotalProposedPrice('');
              setVehicleType('');
              setSpecialInstructions('');
              setFormErrors({});
              setRouteCoordinates([]);
              setRecommendedPrice(null);
              setDistanceKm(null);
            }}
            accessibilityLabel="Effacer le formulaire"
            hitSlop={{top:10, bottom:10, left:10, right:10}}
          >
            <Text style={styles.addButtonText}>Tout effacer</Text>
          </TouchableOpacity>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!pickupAddress || !pickupCommune || destinations.length < 2 || !totalProposedPrice || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!pickupAddress || !pickupCommune || destinations.length < 2 || !totalProposedPrice || loading}
            accessibilityLabel="Créer la livraison"
            hitSlop={{top:10, bottom:10, left:10, right:10}}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Création en cours...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Créer la livraison</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Loader personnalisé */}
        <CustomLoaderModal
          visible={loading}
          title="Création en cours..."
          message="Votre livraison multi-destinations est en cours de création"
          type="loading"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  destinationItem: {
    backgroundColor: '#f8f8f8',
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
  destinationNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  removeButton: {
    padding: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  destinationDetails: {
    fontSize: 13,
    color: '#666',
  },
  deliveryNotes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  newDestinationForm: {
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateMultiDestinationDeliveryScreen;