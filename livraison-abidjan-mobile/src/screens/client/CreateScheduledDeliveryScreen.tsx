
import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialIcons'
import DateTimePicker from '@react-native-community/datetimepicker'

import { RootStackParamList } from '../../types/navigation'
import { Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'
import ScheduledDeliveryService from '../../services/ScheduledDeliveryService'

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
          Nouvelle livraison planifiée
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.formCard}>
          {/* Titre */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Titre *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Ex: Livraison hebdomadaire bureau"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Description optionnelle"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Adresses */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Adresse de récupération *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.pickup_address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pickup_address: text }))}
              placeholder="Adresse complète de récupération"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Commune de récupération *</Text>
            <View style={[styles.picker, { borderColor: colors.border }]}>
              {/* Ici vous pourriez utiliser un picker plus sophistiqué */}
              <TextInput
                style={[styles.input, { borderWidth: 0, color: colors.text }]}
                value={formData.pickup_commune}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pickup_commune: text }))}
                placeholder="Sélectionner la commune"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Adresse de livraison *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.delivery_address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, delivery_address: text }))}
              placeholder="Adresse complète de livraison"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Commune de livraison *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.delivery_commune}
              onChangeText={(text) => setFormData(prev => ({ ...prev, delivery_commune: text }))}
              placeholder="Sélectionner la commune"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Prix proposé */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Prix proposé (FCFA)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.proposed_price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, proposed_price: text }))}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Date et heure */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Date et heure de début</Text>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formData.scheduled_date.toLocaleDateString()} à {formData.scheduled_date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
              <Icon name="date-range" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Récurrence */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Type de récurrence</Text>
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
                      backgroundColor: formData.recurrence_type === option.key ? colors.primary : 'transparent',
                      borderColor: colors.primary,
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, recurrence_type: option.key as any }))}
                >
                  <Text
                    style={[
                      styles.recurrenceText,
                      { color: formData.recurrence_type === option.key ? 'white' : colors.primary }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Bouton de création */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreate}
          disabled={isLoading}
        >
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
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false)
            if (selectedDate) {
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
})

export default CreateScheduledDeliveryScreen
