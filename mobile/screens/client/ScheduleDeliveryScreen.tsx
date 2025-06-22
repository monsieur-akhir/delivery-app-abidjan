
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Surface,
  IconButton,
  Chip,
  Switch,
  Checkbox,
  Portal,
  Dialog,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import AddressAutocomplete, { Address } from '../../components/AddressAutocomplete';
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

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Livraison ponctuelle', icon: 'calendar-outline' },
  { value: 'daily', label: 'Quotidienne', icon: 'repeat-outline' },
  { value: 'weekly', label: 'Hebdomadaire', icon: 'calendar-week-outline' },
  { value: 'monthly', label: 'Mensuelle', icon: 'calendar-month-outline' }
];

const WEEKDAYS = [
  { value: 1, label: 'Lun', short: 'L' },
  { value: 2, label: 'Mar', short: 'M' },
  { value: 3, label: 'Mer', short: 'M' },
  { value: 4, label: 'Jeu', short: 'J' },
  { value: 5, label: 'Ven', short: 'V' },
  { value: 6, label: 'Sam', short: 'S' },
  { value: 7, label: 'Dim', short: 'D' }
];

interface ScheduleDeliveryScreenProps {}

const ScheduleDeliveryScreen: React.FC<ScheduleDeliveryScreenProps> = () => {
  const navigation = useNavigation();

  // États du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState<Address | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Address | null>(null);
  
  // Contact de ramassage
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  
  // Contact de livraison
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Informations du colis
  const [packageDescription, setPackageDescription] = useState('');
  const [packageSize, setPackageSize] = useState('medium');
  const [packageWeight, setPackageWeight] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');

  // Planification
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date());
  const [maxOccurrences, setMaxOccurrences] = useState('');
  const [notificationHours, setNotificationHours] = useState(24);
  const [autoCreateDelivery, setAutoCreateDelivery] = useState(true);

  // États UI
  const [loading, setLoading] = useState(false);
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la planification');
      return false;
    }
    if (!pickupLocation || !deliveryLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner les adresses de départ et de destination');
      return false;
    }
    if (!pickupContactName.trim() || !pickupContactPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir les informations du contact de ramassage');
      return false;
    }
    if (!deliveryContactName.trim() || !deliveryContactPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir les informations du contact de livraison');
      return false;
    }
    if (scheduledDate <= new Date()) {
      Alert.alert('Erreur', 'La date de planification doit être dans le futur');
      return false;
    }
    if (recurrenceType === 'weekly' && selectedWeekdays.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un jour de la semaine');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const scheduleData = {
        title,
        description,
        pickup_address: pickupAddress,
        pickup_commune: pickupLocation?.commune || '',
        pickup_lat: pickupLocation?.latitude,
        pickup_lng: pickupLocation?.longitude,
        pickup_contact_name: pickupContactName,
        pickup_contact_phone: pickupContactPhone,
        pickup_instructions: pickupInstructions,
        delivery_address: deliveryAddress,
        delivery_commune: deliveryLocation?.commune || '',
        delivery_lat: deliveryLocation?.latitude,
        delivery_lng: deliveryLocation?.longitude,
        delivery_contact_name: deliveryContactName,
        delivery_contact_phone: deliveryContactPhone,
        delivery_instructions: deliveryInstructions,
        package_description: packageDescription,
        package_size: packageSize,
        package_weight: packageWeight ? parseFloat(packageWeight) : null,
        is_fragile: isFragile,
        proposed_price: proposedPrice ? parseFloat(proposedPrice) : null,
        scheduled_date: scheduledDate.toISOString(),
        recurrence_type: recurrenceType,
        recurrence_interval: recurrenceInterval,
        recurrence_days: recurrenceType === 'weekly' ? selectedWeekdays : null,
        end_date: hasEndDate ? endDate.toISOString() : null,
        max_occurrences: maxOccurrences ? parseInt(maxOccurrences) : null,
        notification_advance_hours: notificationHours,
        auto_create_delivery: autoCreateDelivery
      };

      // Ici, appeler l'API pour créer la livraison planifiée
      console.log('Données de planification:', scheduleData);
      
      Alert.alert('Succès', 'Livraison planifiée créée avec succès!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la planification');
    } finally {
      setLoading(false);
    }
  };

  const handleWeekdayToggle = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort());
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
            <Text style={styles.headerTitle}>Planifier une livraison</Text>
            <View style={{ width: 40 }} />
          </View>
        </Surface>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Informations générales */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Informations générales</Text>

              <TextInput
                label="Titre de la planification *"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholder="Ex: Livraison quotidienne des factures"
              />

              <TextInput
                label="Description (optionnel)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="Décrivez le type de livraison planifiée"
              />
            </Card.Content>
          </Card>

          {/* Adresses */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Adresses</Text>

              <View style={styles.addressSection}>
                <View style={styles.addressHeader}>
                  <View style={[styles.addressIcon, styles.pickupIcon]}>
                    <Ionicons name="radio-button-on" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.addressLabel}>Adresse de ramassage</Text>
                </View>

                <AddressAutocomplete
                  label=""
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  onAddressSelect={(address) => {
                    setPickupLocation(address);
                    setPickupAddress(address.description);
                  }}
                  placeholder="D'où récupérer le colis ?"
                  showCurrentLocation={true}
                  icon="location"
                />
              </View>

              <View style={styles.addressSection}>
                <View style={styles.addressHeader}>
                  <View style={[styles.addressIcon, styles.deliveryIcon]}>
                    <Ionicons name="location" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.addressLabel}>Adresse de livraison</Text>
                </View>

                <AddressAutocomplete
                  label=""
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  onAddressSelect={(address) => {
                    setDeliveryLocation(address);
                    setDeliveryAddress(address.description);
                  }}
                  placeholder="Où livrer le colis ?"
                  showCurrentLocation={false}
                  icon="location-outline"
                />
              </View>
            </Card.Content>
          </Card>

          {/* Contacts */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Contacts</Text>

              <Text style={styles.subsectionTitle}>Contact de ramassage</Text>
              <TextInput
                label="Nom du responsable *"
                value={pickupContactName}
                onChangeText={setPickupContactName}
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
              />
              <TextInput
                label="Téléphone *"
                value={pickupContactPhone}
                onChangeText={setPickupContactPhone}
                keyboardType="phone-pad"
                style={styles.input}
                left={<TextInput.Icon icon="phone-outline" />}
              />
              <TextInput
                label="Instructions de ramassage"
                value={pickupInstructions}
                onChangeText={setPickupInstructions}
                multiline
                numberOfLines={2}
                style={styles.input}
                placeholder="Ex: Bureau au 2ème étage, porte bleue"
              />

              <Text style={styles.subsectionTitle}>Contact de livraison</Text>
              <TextInput
                label="Nom du destinataire *"
                value={deliveryContactName}
                onChangeText={setDeliveryContactName}
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
              />
              <TextInput
                label="Téléphone *"
                value={deliveryContactPhone}
                onChangeText={setDeliveryContactPhone}
                keyboardType="phone-pad"
                style={styles.input}
                left={<TextInput.Icon icon="phone-outline" />}
              />
              <TextInput
                label="Instructions de livraison"
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline
                numberOfLines={2}
                style={styles.input}
                placeholder="Ex: Laisser à la réception si absent"
              />
            </Card.Content>
          </Card>

          {/* Informations du colis */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Informations du colis</Text>

              <TextInput
                label="Description du colis"
                value={packageDescription}
                onChangeText={setPackageDescription}
                style={styles.input}
                placeholder="Ex: Factures, bulletins de paie, documents"
              />

              <View style={styles.row}>
                <TextInput
                  label="Poids (kg)"
                  value={packageWeight}
                  onChangeText={setPackageWeight}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfWidth]}
                  placeholder="0.0"
                />
                <TextInput
                  label="Prix proposé (FCFA)"
                  value={proposedPrice}
                  onChangeText={setProposedPrice}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfWidth]}
                  placeholder="0"
                />
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={isFragile}
                  onValueChange={setIsFragile}
                  color={COLORS.primary}
                />
                <Text style={styles.switchLabel}>Colis fragile</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Planification */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Planification</Text>

              {/* Date et heure */}
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateTimeContent}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.dateTimeText}>
                    {scheduledDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeContent}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.dateTimeText}>
                    {scheduledDate.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Récurrence */}
              <TouchableOpacity
                style={styles.recurrenceButton}
                onPress={() => setShowRecurrenceDialog(true)}
              >
                <View style={styles.recurrenceContent}>
                  <Ionicons name="repeat-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.recurrenceText}>
                    {RECURRENCE_OPTIONS.find(opt => opt.value === recurrenceType)?.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Jours de la semaine pour récurrence hebdomadaire */}
              {recurrenceType === 'weekly' && (
                <View style={styles.weekdaysContainer}>
                  <Text style={styles.weekdaysTitle}>Jours de la semaine</Text>
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((day) => (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.weekdayChip,
                          selectedWeekdays.includes(day.value) && styles.weekdayChipSelected
                        ]}
                        onPress={() => handleWeekdayToggle(day.value)}
                      >
                        <Text
                          style={[
                            styles.weekdayText,
                            selectedWeekdays.includes(day.value) && styles.weekdayTextSelected
                          ]}
                        >
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Fin de récurrence */}
              {recurrenceType !== 'none' && (
                <View style={styles.endRecurrenceContainer}>
                  <View style={styles.switchContainer}>
                    <Switch
                      value={hasEndDate}
                      onValueChange={setHasEndDate}
                      color={COLORS.primary}
                    />
                    <Text style={styles.switchLabel}>Date de fin</Text>
                  </View>

                  {hasEndDate && (
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <View style={styles.dateTimeContent}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.dateTimeText}>
                          {endDate.toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <TextInput
                    label="Nombre maximum d'occurrences"
                    value={maxOccurrences}
                    onChangeText={setMaxOccurrences}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="Ex: 30 (pour 30 livraisons)"
                  />
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Paramètres de notification */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Notifications</Text>

              <TextInput
                label="Heures à l'avance pour la notification"
                value={notificationHours.toString()}
                onChangeText={(value) => setNotificationHours(parseInt(value) || 24)}
                keyboardType="numeric"
                style={styles.input}
                placeholder="24"
              />

              <View style={styles.switchContainer}>
                <Switch
                  value={autoCreateDelivery}
                  onValueChange={setAutoCreateDelivery}
                  color={COLORS.primary}
                />
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Création automatique</Text>
                  <Text style={styles.switchSubLabel}>
                    Créer automatiquement la livraison à l'heure prévue
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Bouton de soumission */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
          >
            Créer la planification
          </Button>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setScheduledDate(selectedDate);
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setScheduledDate(selectedTime);
            }
          }}
        />
      )}

      {/* Dialog de récurrence */}
      <Portal>
        <Dialog visible={showRecurrenceDialog} onDismiss={() => setShowRecurrenceDialog(false)}>
          <Dialog.Title>Type de récurrence</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={setRecurrenceType}
              value={recurrenceType}
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <View key={option.value} style={styles.radioOption}>
                  <RadioButton value={option.value} />
                  <View style={styles.radioLabelContainer}>
                    <Ionicons name={option.icon} size={20} color={COLORS.textSecondary} />
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </View>
                </View>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRecurrenceDialog(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfWidth: {
    width: '48%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: COLORS.text,
  },
  switchLabelContainer: {
    marginLeft: 12,
    flex: 1,
  },
  switchSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  dateTimeButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dateTimeText: {
    fontSize: 16,
    marginLeft: 12,
    color: COLORS.text,
  },
  recurrenceButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  recurrenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  recurrenceText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: COLORS.text,
  },
  weekdaysContainer: {
    marginTop: 12,
  },
  weekdaysTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekdayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  weekdayTextSelected: {
    color: COLORS.white,
  },
  endRecurrenceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
    color: COLORS.text,
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
});

export default ScheduleDeliveryScreen;
