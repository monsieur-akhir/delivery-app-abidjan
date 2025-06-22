
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import AddressAutocomplete from '../../components/AddressAutocomplete'
import MultiDestinationDeliveryService, { MultiDestinationDelivery, MultiDestinationStop } from '../../services/MultiDestinationDeliveryService'
import { useAuth } from '../../hooks/useAuth'

const CreateMultiDestinationDeliveryScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  
  // États pour les données de livraison
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupCommune, setPickupCommune] = useState('')
  const [pickupCoordinates, setPickupCoordinates] = useState<{lat: number, lng: number} | null>(null)
  const [pickupContactName, setPickupContactName] = useState(user?.full_name || '')
  const [pickupContactPhone, setPickupContactPhone] = useState(user?.phone || '')
  const [pickupInstructions, setPickupInstructions] = useState('')
  
  const [destinations, setDestinations] = useState<MultiDestinationStop[]>([
    {
      delivery_address: '',
      delivery_commune: '',
      recipient_name: '',
      package_description: ''
    },
    {
      delivery_address: '',
      delivery_commune: '',
      recipient_name: '',
      package_description: ''
    }
  ])
  
  const [totalPrice, setTotalPrice] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [isFragile, setIsFragile] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  
  // États pour l'interface
  const [loading, setLoading] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [estimatedDistance, setEstimatedDistance] = useState(0)
  const [suggestedPrice, setSuggestedPrice] = useState(0)

  const vehicleTypes = [
    { id: 'motorcycle', name: 'Moto', icon: 'bicycle' },
    { id: 'car', name: 'Voiture', icon: 'car' },
    { id: 'van', name: 'Camionnette', icon: 'car-sport' },
    { id: 'truck', name: 'Camion', icon: 'bus' }
  ]

  // Calculer le prix suggéré quand les destinations changent
  useEffect(() => {
    const validDestinations = destinations.filter(d => d.delivery_address.trim())
    if (validDestinations.length >= 2) {
      const suggested = MultiDestinationDeliveryService.calculateSuggestedPrice(estimatedDistance, validDestinations.length)
      setSuggestedPrice(suggested)
      if (!totalPrice) {
        setTotalPrice(suggested.toString())
      }
    }
  }, [destinations, estimatedDistance])

  const handlePickupAddressSelect = (addressData: any) => {
    setPickupAddress(addressData.address)
    setPickupCommune(addressData.commune)
    setPickupCoordinates(addressData.coordinates)
  }

  const handleDestinationAddressSelect = (index: number, addressData: any) => {
    const updatedDestinations = [...destinations]
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      delivery_address: addressData.address,
      delivery_commune: addressData.commune,
      delivery_lat: addressData.coordinates?.lat,
      delivery_lng: addressData.coordinates?.lng
    }
    setDestinations(updatedDestinations)
  }

  const addDestination = () => {
    if (destinations.length < 10) {
      setDestinations([
        ...destinations,
        {
          delivery_address: '',
          delivery_commune: '',
          recipient_name: '',
          package_description: ''
        }
      ])
    } else {
      Alert.alert('Limite atteinte', 'Maximum 10 destinations autorisées')
    }
  }

  const removeDestination = (index: number) => {
    if (destinations.length > 2) {
      const updatedDestinations = destinations.filter((_, i) => i !== index)
      setDestinations(updatedDestinations)
    } else {
      Alert.alert('Minimum requis', 'Au moins 2 destinations sont requises')
    }
  }

  const updateDestination = (index: number, field: keyof MultiDestinationStop, value: any) => {
    const updatedDestinations = [...destinations]
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value
    }
    setDestinations(updatedDestinations)
  }

  const validateForm = (): string[] => {
    const deliveryData: Partial<MultiDestinationDelivery> = {
      pickup_address: pickupAddress,
      pickup_commune: pickupCommune,
      destinations,
      total_proposed_price: parseFloat(totalPrice) || 0,
      is_fragile: isFragile,
      is_urgent: isUrgent
    }

    return MultiDestinationDeliveryService.validateDeliveryData(deliveryData)
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      Alert.alert('Erreurs de validation', errors.join('\n'))
      return
    }

    setLoading(true)
    try {
      const deliveryData: Omit<MultiDestinationDelivery, 'id' | 'total_destinations'> = {
        pickup_address: pickupAddress,
        pickup_commune: pickupCommune,
        pickup_lat: pickupCoordinates?.lat,
        pickup_lng: pickupCoordinates?.lng,
        pickup_contact_name: pickupContactName,
        pickup_contact_phone: pickupContactPhone,
        pickup_instructions: pickupInstructions,
        destinations: destinations.map((dest, index) => ({
          ...dest,
          original_order: index + 1
        })),
        total_proposed_price: parseFloat(totalPrice),
        special_instructions: specialInstructions,
        vehicle_type_required: vehicleType,
        is_fragile: isFragile,
        is_urgent: isUrgent,
        status: 'pending'
      }

      const result = await MultiDestinationDeliveryService.createDelivery(deliveryData)
      
      Alert.alert(
        'Livraison créée',
        'Votre demande de livraison multi-destinataires a été créée avec succès.',
        [
          {
            text: 'Voir les détails',
            onPress: () => navigation.navigate('MultiDestinationDeliveryDetails', { deliveryId: result.id })
          }
        ]
      )
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const renderDestinationCard = (destination: MultiDestinationStop, index: number) => (
    <View key={index} style={styles.destinationCard}>
      <View style={styles.destinationHeader}>
        <View style={styles.destinationNumber}>
          <Text style={styles.destinationNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.destinationTitle}>Destination {index + 1}</Text>
        {destinations.length > 2 && (
          <TouchableOpacity onPress={() => removeDestination(index)} style={styles.removeButton}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Adresse de livraison *</Text>
        <AddressAutocomplete
          placeholder="Saisir l'adresse de livraison"
          onAddressSelect={(data) => handleDestinationAddressSelect(index, data)}
          initialValue={destination.delivery_address}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom du destinataire *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom complet du destinataire"
          value={destination.recipient_name}
          onChangeText={(text) => updateDestination(index, 'recipient_name', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Téléphone du destinataire</Text>
        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          value={destination.recipient_phone}
          onChangeText={(text) => updateDestination(index, 'recipient_phone', text)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description du colis</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Décrivez le colis à livrer"
          value={destination.package_description}
          onChangeText={(text) => updateDestination(index, 'package_description', text)}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <Text style={styles.label}>Taille</Text>
          <TextInput
            style={styles.input}
            placeholder="Petit, Moyen, Grand"
            value={destination.package_size}
            onChangeText={(text) => updateDestination(index, 'package_size', text)}
          />
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <Text style={styles.label}>Poids (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.0"
            value={destination.package_weight?.toString()}
            onChangeText={(text) => updateDestination(index, 'package_weight', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Instructions spéciales</Text>
        <TextInput
          style={styles.input}
          placeholder="Instructions pour cette livraison"
          value={destination.special_instructions}
          onChangeText={(text) => updateDestination(index, 'special_instructions', text)}
        />
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Livraison Multi-Destinataires</Text>
          <Text style={styles.subtitle}>Livrez plusieurs colis en une seule course</Text>
        </View>

        {/* Point de ramassage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Point de ramassage</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Adresse de ramassage *</Text>
            <AddressAutocomplete
              placeholder="D'où récupérer les colis ?"
              onAddressSelect={handlePickupAddressSelect}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Contact</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom du contact"
                value={pickupContactName}
                onChangeText={setPickupContactName}
              />
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                value={pickupContactPhone}
                onChangeText={setPickupContactPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Instructions de ramassage</Text>
            <TextInput
              style={styles.input}
              placeholder="Instructions pour le ramassage"
              value={pickupInstructions}
              onChangeText={setPickupInstructions}
            />
          </View>
        </View>

        {/* Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Destinations ({destinations.length})</Text>
            <TouchableOpacity onPress={addDestination} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {destinations.map((destination, index) => renderDestinationCard(destination, index))}
        </View>

        {/* Prix et options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Prix et options</Text>

          <View style={styles.priceContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prix total proposé (FCFA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prix"
                value={totalPrice}
                onChangeText={setTotalPrice}
                keyboardType="numeric"
              />
            </View>
            {suggestedPrice > 0 && (
              <TouchableOpacity 
                style={styles.suggestedPriceButton}
                onPress={() => setTotalPrice(suggestedPrice.toString())}
              >
                <Text style={styles.suggestedPriceText}>
                  💡 Prix suggéré: {suggestedPrice.toLocaleString()} FCFA
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={styles.vehicleSelector}
            onPress={() => setShowVehicleModal(true)}
          >
            <Text style={styles.label}>Type de véhicule requis</Text>
            <View style={styles.vehicleSelectorContent}>
              <Text style={styles.vehicleSelectorText}>
                {vehicleType ? vehicleTypes.find(v => v.id === vehicleType)?.name : 'Sélectionner un véhicule'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Colis fragile</Text>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Livraison urgente</Text>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ false: '#E5E5E5', true: '#FF9500' }}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Instructions générales</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Instructions particulières pour toute la livraison"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Création en cours...' : 'Créer la livraison'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de sélection de véhicule */}
      <Modal visible={showVehicleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Type de véhicule</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  vehicleType === vehicle.id && styles.vehicleOptionSelected
                ]}
                onPress={() => {
                  setVehicleType(vehicle.id)
                  setShowVehicleModal(false)
                }}
              >
                <Ionicons name={vehicle.icon as any} size={24} color="#007AFF" />
                <Text style={styles.vehicleOptionText}>{vehicle.name}</Text>
                {vehicleType === vehicle.id && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '500'
  },
  destinationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF'
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  destinationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  destinationNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  destinationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  removeButton: {
    padding: 4
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  halfWidth: {
    flex: 1
  },
  priceContainer: {
    marginBottom: 16
  },
  suggestedPriceButton: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  suggestedPriceText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },
  vehicleSelector: {
    marginBottom: 16
  },
  vehicleSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white'
  },
  vehicleSelectorText: {
    fontSize: 16,
    color: '#333'
  },
  switchContainer: {
    marginBottom: 16
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  switchLabel: {
    fontSize: 16,
    color: '#333'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0'
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '50%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA'
  },
  vehicleOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  vehicleOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12
  }
})

export default CreateMultiDestinationDeliveryScreen
