import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  Surface,
  IconButton,
  Chip,
  ProgressBar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import AddressAutocomplete, { Address } from '../../components/AddressAutocomplete';
import CustomMapView from '../../components/CustomMapView';
import { useDelivery } from '../../hooks/useDelivery';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2196F3',
  secondary: '#FFC107',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  text: '#333333',
  textSecondary: '#666666',
  background: '#F5F5F5',
  white: '#FFFFFF',
  shadow: '#000000',
  border: '#E0E0E0',
};

const PACKAGE_TYPES = [
  { id: 'small', label: 'Petit colis', icon: 'cube-outline', price: 500 },
  { id: 'medium', label: 'Colis moyen', icon: 'cube', price: 1000 },
  { id: 'large', label: 'Gros colis', icon: 'cube-sharp', price: 1500 },
  { id: 'fragile', label: 'Fragile', icon: 'alert-circle-outline', price: 2000 },
];

const URGENCY_LEVELS = [
  { id: 'normal', label: 'Normal', icon: 'time-outline', multiplier: 1 },
  { id: 'urgent', label: 'Urgent', icon: 'flash-outline', multiplier: 1.5 },
  { id: 'express', label: 'Express', icon: 'rocket-outline', multiplier: 2 },
];

interface CreateDeliveryScreenProps {}

const CreateDeliveryScreen: React.FC<CreateDeliveryScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { createDelivery, loading } = useDelivery();

  // États du formulaire
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<Address | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Address | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageType, setPackageType] = useState('small');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // États pour le loader et la recherche de coursiers
  const [searchingCouriers, setSearchingCouriers] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  // Références
  const scrollViewRef = useRef<ScrollView>(null);

  // Calcul du prix estimé
  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      const baseType = PACKAGE_TYPES.find(type => type.id === packageType);
      const urgency = URGENCY_LEVELS.find(level => level.id === urgencyLevel);

      if (baseType && urgency) {
        // Calcul de distance approximative (en km)
        const distance = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude
        );

        const basePrice = baseType.price + (distance * 100); // 100 FCFA par km
        const finalPrice = basePrice * urgency.multiplier;

        setEstimatedPrice(Math.round(finalPrice));
      }
    }
  }, [pickupLocation, deliveryLocation, packageType, urgencyLevel]);

  // Fonction de calcul de distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    if (!pickupLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse de départ');
      return false;
    }
    if (!deliveryLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse de destination');
      return false;
    }
    if (!recipientName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du destinataire');
      return false;
    }
    if (!recipientPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le téléphone du destinataire');
      return false;
    }
    return true;
  };

  // Simulation de recherche de coursiers avec loader
  const searchForCouriers = async (): Promise<void> => {
    setSearchingCouriers(true);
    setSearchProgress(0);

    // Simulation du processus de recherche
    const searchSteps = [
      'Analyse de votre demande...',
      'Recherche de coursiers disponibles...',
      'Calcul des meilleurs tarifs...',
      'Génération des offres...'
    ];

    for (let i = 0; i < searchSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSearchProgress((i + 1) / searchSteps.length);
    }

    // Attendre un peu plus pour l'effet
    await new Promise(resolve => setTimeout(resolve, 500));

    setSearchingCouriers(false);

    // Redirection vers l'écran des propositions de prix
    navigation.navigate('BidsScreen', {
      deliveryRequest: {
        pickup: pickupLocation,
        delivery: deliveryLocation,
        recipientName,
        recipientPhone,
        packageType,
        urgencyLevel,
        specialInstructions,
        estimatedPrice
      }
    });
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await searchForCouriers();
    } catch (error) {
      console.error('Erreur lors de la recherche de coursiers:', error);
      Alert.alert('Erreur', 'Impossible de rechercher des coursiers. Veuillez réessayer.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.headerTitle}>Nouvelle livraison</Text>
            <View style={{ width: 40 }} />
          </View>
        </Surface>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section des adresses */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Adresses de livraison</Text>

              {/* Adresse de départ */}
              <View style={styles.addressSection}>
                <View style={styles.addressHeader}>
                  <View style={[styles.addressIcon, styles.pickupIcon]}>
                    <Ionicons name="radio-button-on" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.addressLabel}>Adresse de départ</Text>
                </View>

                <AddressAutocomplete
                  label=""
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  onAddressSelect={(address) => {
                    setPickupLocation(address);
                    setPickupAddress(address.description);
                  }}
                  placeholder="D'où partons-nous ?"
                  showCurrentLocation={true}
                  icon="location"
                />
              </View>

              {/* Adresse de destination */}
              <View style={styles.addressSection}>
                <View style={styles.addressHeader}>
                  <View style={[styles.addressIcon, styles.deliveryIcon]}>
                    <Ionicons name="location" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.addressLabel}>Adresse de destination</Text>
                </View>

                <AddressAutocomplete
                  label=""
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  onAddressSelect={(address) => {
                    setDeliveryLocation(address);
                    setDeliveryAddress(address.description);
                  }}
                  placeholder="Où allons-nous ?"
                  showCurrentLocation={false}
                  icon="location-outline"
                />
              </View>
            </Card.Content>
          </Card>

          {/* Informations du destinataire */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Informations du destinataire</Text>

              <TextInput
                label="Nom du destinataire"
                value={recipientName}
                onChangeText={setRecipientName}
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
              />

              <TextInput
                label="Téléphone du destinataire"
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
                style={styles.input}
                left={<TextInput.Icon icon="phone-outline" />}
              />
            </Card.Content>
          </Card>

          {/* Type de colis */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Type de colis</Text>

              <View style={styles.optionsGrid}>
                {PACKAGE_TYPES.map((type) => (
                  <Chip
                    key={type.id}
                    selected={packageType === type.id}
                    onPress={() => setPackageType(type.id)}
                    style={[
                      styles.optionChip,
                      packageType === type.id && styles.selectedChip
                    ]}
                    textStyle={[
                      styles.chipText,
                      packageType === type.id && styles.selectedChipText
                    ]}
                    icon={type.icon}
                  >
                    {type.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Niveau d'urgence */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Niveau d'urgence</Text>

              <View style={styles.optionsGrid}>
                {URGENCY_LEVELS.map((level) => (
                  <Chip
                    key={level.id}
                    selected={urgencyLevel === level.id}
                    onPress={() => setUrgencyLevel(level.id)}
                    style={[
                      styles.optionChip,
                      urgencyLevel === level.id && styles.selectedChip
                    ]}
                    textStyle={[
                      styles.chipText,
                      urgencyLevel === level.id && styles.selectedChipText
                    ]}
                    icon={level.icon}
                  >
                    {level.label}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Instructions spéciales */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Instructions spéciales (optionnel)</Text>

              <TextInput
                label="Instructions pour le coursier"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
                style={styles.input}
                left={<TextInput.Icon icon="note-text-outline" />}
              />
            </Card.Content>
          </Card>

          {/* Résumé et prix */}
          {estimatedPrice > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Résumé de la commande</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Prix estimé</Text>
                  <Text style={styles.summaryPrice}>{formatCurrency(estimatedPrice)}</Text>
                </View>

                <Divider style={styles.divider} />

                <Text style={styles.summaryNote}>
                  * Le prix final sera déterminé par les offres des coursiers
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Bouton de soumission */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading || !pickupLocation || !deliveryLocation}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
          >
            Rechercher des coursiers
          </Button>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de recherche de coursiers */}
      <Modal
        visible={searchingCouriers}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loaderOverlay}>
          <Surface style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderTitle}>Recherche en cours...</Text>
            <Text style={styles.loaderSubtitle}>
              Nous cherchons les meilleurs coursiers pour votre livraison
            </Text>

            <ProgressBar
              progress={searchProgress}
              color={COLORS.primary}
              style={styles.progressBar}
            />

            <Text style={styles.progressText}>
              {Math.round(searchProgress * 100)}% terminé
            </Text>

            <Text style={styles.loaderNote}>
              Veuillez patienter, cela ne prendra que quelques secondes...
            </Text>
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pickupIcon: {
    backgroundColor: COLORS.primary,
  },
  deliveryIcon: {
    backgroundColor: COLORS.success,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
  },
  selectedChipText: {
    color: COLORS.white,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    marginVertical: 12,
  },
  summaryNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 32,
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: width * 0.9,
    elevation: 8,
  },
  loaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  loaderSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 16,
  },
  loaderNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CreateDeliveryScreen;