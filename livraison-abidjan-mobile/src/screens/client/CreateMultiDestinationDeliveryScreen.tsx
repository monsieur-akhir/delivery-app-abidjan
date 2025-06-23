
import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { RootStackParamList } from '../../types/navigation'
import { Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'
import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config'
import { getToken } from '../../utils'

type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateMultiDestinationDelivery'>

interface Destination {
  id: string
  address: string
  commune: string
  contact_name?: string
  contact_phone?: string
  delivery_order: number
}

const CreateMultiDestinationDeliveryScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>()
  const { colors } = useTheme()
  const { showSuccessAlert, showErrorAlert, showConfirmationAlert } = useAlert()

  const [title, setTitle] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupCommune, setPickupCommune] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([
    { id: '1', address: '', commune: '', delivery_order: 1 },
    { id: '2', address: '', commune: '', delivery_order: 2 },
  ])
  const [packageDescription, setPackageDescription] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const addDestination = () => {
    const newDestination: Destination = {
      id: Date.now().toString(),
      address: '',
      commune: '',
      delivery_order: destinations.length + 1,
    }
    setDestinations([...destinations, newDestination])
  }

  const removeDestination = (id: string) => {
    if (destinations.length <= 2) {
      showErrorAlert('Erreur', 'Vous devez avoir au moins 2 destinations')
      return
    }
    
    setDestinations(destinations.filter(dest => dest.id !== id))
  }

  const updateDestination = (id: string, field: keyof Destination, value: string) => {
    setDestinations(destinations.map(dest => 
      dest.id === id ? { ...dest, [field]: value } : dest
    ))
  }

  const validateForm = () => {
    if (!title.trim()) {
      showErrorAlert('Erreur', 'Veuillez saisir un titre')
      return false
    }
    if (!pickupAddress.trim()) {
      showErrorAlert('Erreur', 'Veuillez saisir l\'adresse de ramassage')
      return false
    }
    if (!pickupCommune.trim()) {
      showErrorAlert('Erreur', 'Veuillez saisir la commune de ramassage')
      return false
    }
    
    const validDestinations = destinations.filter(dest => 
      dest.address.trim() && dest.commune.trim()
    )
    
    if (validDestinations.length < 2) {
      showErrorAlert('Erreur', 'Veuillez remplir au moins 2 destinations')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    showConfirmationAlert(
      'Confirmer la création',
      'Voulez-vous créer cette livraison multi-destinations ?',
      async () => {
        setLoading(true)
        try {
          const token = await getToken()
          
          const validDestinations = destinations.filter(dest => 
            dest.address.trim() && dest.commune.trim()
          ).map((dest, index) => ({
            ...dest,
            delivery_order: index + 1
          }))

          const deliveryData = {
            title: title.trim(),
            pickup_address: pickupAddress.trim(),
            pickup_commune: pickupCommune.trim(),
            destinations: validDestinations,
            package_description: packageDescription.trim(),
            estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
          }

          const response = await fetch(`${API_BASE_URL}/multi-destination-deliveries`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(deliveryData),
          })

          if (!response.ok) {
            throw new Error('Erreur lors de la création')
          }

          showSuccessAlert(
            'Succès',
            'Livraison multi-destinations créée avec succès',
            () => navigation.navigate('MultiDestinationDeliveries')
          )
        } catch (error) {
          console.error('Erreur création livraison:', error)
          showErrorAlert('Erreur', 'Impossible de créer la livraison')
        } finally {
          setLoading(false)
        }
      }
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Nouvelle livraison multi-destinations
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations générales */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Informations générales
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Livraison documents entreprise"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description du colis</Text>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text }]}
              value={packageDescription}
              onChangeText={setPackageDescription}
              placeholder="Description optionnelle du colis"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Prix estimé (FCFA)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={estimatedPrice}
              onChangeText={setEstimatedPrice}
              placeholder="Prix estimé (optionnel)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </Card>

        {/* Adresse de ramassage */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Point de ramassage
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Adresse *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Adresse complète de ramassage"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Commune *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={pickupCommune}
              onChangeText={setPickupCommune}
              placeholder="Commune de ramassage"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </Card>

        {/* Destinations */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Destinations ({destinations.length})
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.primary }]}
              onPress={addDestination}
            >
              <Icon name="add" size={20} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          {destinations.map((destination, index) => (
            <View key={destination.id} style={styles.destinationCard}>
              <View style={styles.destinationHeader}>
                <Text style={[styles.destinationNumber, { color: colors.primary }]}>
                  Destination {index + 1}
                </Text>
                {destinations.length > 2 && (
                  <TouchableOpacity
                    onPress={() => removeDestination(destination.id)}
                    style={styles.removeButton}
                  >
                    <Icon name="delete" size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Adresse *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={destination.address}
                  onChangeText={(value) => updateDestination(destination.id, 'address', value)}
                  placeholder="Adresse de livraison"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Commune *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={destination.commune}
                  onChangeText={(value) => updateDestination(destination.id, 'commune', value)}
                  placeholder="Commune"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Contact (optionnel)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={destination.contact_name || ''}
                  onChangeText={(value) => updateDestination(destination.id, 'contact_name', value)}
                  placeholder="Nom du contact"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Téléphone (optionnel)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={destination.contact_phone || ''}
                  onChangeText={(value) => updateDestination(destination.id, 'contact_phone', value)}
                  placeholder="Numéro de téléphone"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          ))}
        </Card>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1
            }
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Création en cours...' : 'Créer la livraison'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  destinationCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default CreateMultiDestinationDeliveryScreen
