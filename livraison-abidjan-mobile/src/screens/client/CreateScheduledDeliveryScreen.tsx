import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialIcons'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'

import { RootStackParamList } from '../../types/navigation'
import { Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'
import ScheduledDeliveryService from '../../services/ScheduledDeliveryService'
import CustomLoaderModal from '../../components/CustomLoaderModal'
import AddressAutocomplete from '../../components/AddressAutocomplete'

type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateScheduledDelivery'>

const CreateScheduledDeliveryScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>()
  const { colors } = useTheme()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pickup_address: '',
    pickup_commune: '',
    delivery_address: '',
    delivery_commune: '',
    package_description: '',
    proposed_price: '',
    scheduled_date: new Date(),
    recurrence_type: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    notification_advance_hours: '2',
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pickupCommune, setPickupCommune] = useState('')
  const [deliveryCommune, setDeliveryCommune] = useState('')

  const handleCreate = async () => {
    if (!formData.title || !formData.pickup_address || !formData.delivery_address) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setIsLoading(true)
      
      await ScheduledDeliveryService.createScheduledDelivery({
        ...formData,
        proposed_price: parseFloat(formData.proposed_price) || 0,
        scheduled_date: formData.scheduled_date.toISOString(),
        notification_advance_hours: parseInt(formData.notification_advance_hours) || 2,
      })

      Alert.alert('Succès', 'Livraison planifiée créée avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la livraison planifiée')
    } finally {
      setIsLoading(false)
    }
  }

  const communes = [
    'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 
    'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
  ]

  return (
    <View style={[styles.container, { backgroundColor: '#F6F7FB' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle livraison planifiée</Text>
        <View style={{ width: 28 }} />
      </View>

      <CustomLoaderModal
        visible={isLoading}
        title="Création en cours..."
        message="Veuillez patienter"
        type="loading"
      />

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          {/* Titre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Ex: Livraison hebdomadaire bureau"
              placeholderTextColor="#BDBDBD"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Description optionnelle"
              placeholderTextColor="#BDBDBD"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Adresse de récupération */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse de récupération *</Text>
            <AddressAutocomplete
              label="Adresse de récupération"
              value={formData.pickup_address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pickup_address: text }))}
              onAddressSelect={(address) => {
                setFormData(prev => ({ ...prev, pickup_address: address.description }))
                setPickupCommune(address.commune || '')
              }}
              placeholder="Saisir ou rechercher une adresse"
            />
            {pickupCommune ? (
              <Text style={styles.communeText}>Commune détectée : {pickupCommune}</Text>
            ) : null}
          </View>

          {/* Adresse de livraison */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse de livraison *</Text>
            <AddressAutocomplete
              label="Adresse de livraison"
              value={formData.delivery_address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, delivery_address: text }))}
              onAddressSelect={(address) => {
                setFormData(prev => ({ ...prev, delivery_address: address.description }))
                setDeliveryCommune(address.commune || '')
              }}
              placeholder="Saisir ou rechercher une adresse"
            />
            {deliveryCommune ? (
              <Text style={styles.communeText}>Commune détectée : {deliveryCommune}</Text>
            ) : null}
          </View>

          {/* Séparateur */}
          <View style={styles.sectionDivider} />

          {/* Prix proposé */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix proposé (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={formData.proposed_price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, proposed_price: text }))}
              placeholder="0"
              placeholderTextColor="#BDBDBD"
              keyboardType="numeric"
            />
          </View>

          {/* Date et heure */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date et heure de début</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {formData.scheduled_date.toLocaleDateString()} à {formData.scheduled_date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
              <Icon name="date-range" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          </View>

          {/* Récurrence */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de récurrence</Text>
            <View style={styles.recurrenceOptions}>
              {[
                { key: 'none', label: 'Unique' },
                { key: 'daily', label: 'Quotidienne' },
                { key: 'weekly', label: 'Hebdomadaire' },
                { key: 'monthly', label: 'Mensuelle' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.recurrenceOption,
                    {
                      backgroundColor: formData.recurrence_type === option.key ? '#FF9800' : 'transparent',
                      borderColor: '#FF9800',
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, recurrence_type: option.key as any }))}
                >
                  <Text
                    style={[
                      styles.recurrenceText,
                      { color: formData.recurrence_type === option.key ? 'white' : '#FF9800' }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Bouton de création */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.createButtonText}>
            {isLoading ? 'Création...' : 'Créer la livraison planifiée'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.scheduled_date}
          mode="datetime"
          display={Platform.OS === 'android' ? 'calendar' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowDatePicker(false)
            
            // Vérification robuste de l'événement
            if (!event) {
              return
            }
            
            // Si l'événement est dismissed ou annulé, on ne fait rien
            if (event.type === 'dismissed' || event.type === 'neutralButtonPressed') {
              return
            }
            
            // Si une date est sélectionnée et l'événement est 'set'
            if (event.type === 'set' && selectedDate) {
              setFormData(prev => ({ ...prev, scheduled_date: selectedDate }))
            }
          }}
        />
      )}
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
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
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
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  recurrenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  communeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
})

export default CreateScheduledDeliveryScreen
