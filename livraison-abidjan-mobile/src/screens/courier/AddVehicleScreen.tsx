import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { Text, TextInput, Button, Card, Switch } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useVehicle } from '../../hooks'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'
import type { VehicleCreateRequest as ServiceVehicleCreateRequest } from '../../services/VehicleService'
import type { VehicleType } from '../../types/models'

// Définition des constantes pour les types de véhicules
const VEHICLE_TYPES = {
  MOTORCYCLE: 'motorcycle' as const,
  PICKUP: 'pickup' as const,
  BICYCLE: 'bicycle' as const,
  VAN: 'van' as const,
  CUSTOM: 'custom' as const
} as const

interface VehicleFormData {
  type: VehicleType
  brand: string
  model: string
  year: string
  license_plate: string
  capacity: string
  is_electric: boolean
  customType: string
}

type AddVehicleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VehicleManagement'>
}

const AddVehicleScreen: React.FC<AddVehicleScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { addVehicle, loading } = useVehicle()

  const [formData, setFormData] = useState<VehicleFormData>({
    type: VEHICLE_TYPES.MOTORCYCLE,
    brand: '',
    model: '',
    year: '',
    license_plate: '',
    capacity: '',
    is_electric: false,
    customType: ''
  })

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.brand || !formData.model || !formData.license_plate) {
        Alert.alert(t('errors.validation'), t('vehicle.fillAllFields'))
        return
      }

      // Préparation des données pour l'API selon le format attendu par VehicleService
      const vehicleData: ServiceVehicleCreateRequest = {
        brand: formData.brand,
        model: formData.model,
        license_plate: formData.license_plate,
        year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
        vehicle_type: formData.type === VEHICLE_TYPES.CUSTOM ? formData.customType as VehicleType : formData.type as VehicleType,
        is_electric: formData.is_electric,
        max_load_weight: formData.capacity ? parseFloat(formData.capacity) : undefined,
      }

      await addVehicle(vehicleData)
      Alert.alert(t('success.title'), t('vehicle.addSuccess'))
      navigation.goBack()
    } catch (error) {
      console.error('Error adding vehicle:', error)
      Alert.alert(t('errors.title'), t('vehicle.addError'))
    }
  }

  const updateFormData = (field: keyof VehicleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>{t('vehicle.addVehicle')}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('vehicle.type')}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => updateFormData('type', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Moto" value={VEHICLE_TYPES.MOTORCYCLE} />
                  <Picker.Item label="Voiture" value={VEHICLE_TYPES.PICKUP} />
                  <Picker.Item label="Vélo" value={VEHICLE_TYPES.BICYCLE} />
                  <Picker.Item label="Camion" value={VEHICLE_TYPES.VAN} />
                  <Picker.Item label="Autre" value={VEHICLE_TYPES.CUSTOM} />
                </Picker>
              </View>
            </View>

            {formData.type === VEHICLE_TYPES.CUSTOM && (
              <TextInput
                label={t('vehicle.customType')}
                value={formData.customType}
                onChangeText={(text) => updateFormData('customType', text)}
                style={styles.input}
                mode="outlined"
              />
            )}

            <TextInput
              label={t('vehicle.brand')}
              value={formData.brand}
              onChangeText={(text) => updateFormData('brand', text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('vehicle.model')}
              value={formData.model}
              onChangeText={(text) => updateFormData('model', text)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('vehicle.year')}
              value={formData.year}
              onChangeText={(text) => updateFormData('year', text)}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label={t('vehicle.licensePlate')}
              value={formData.license_plate}
              onChangeText={(text) => updateFormData('license_plate', text)}
              style={styles.input}
              mode="outlined"
              autoCapitalize="characters"
            />

            <TextInput
              label={t('vehicle.capacity')}
              value={formData.capacity}
              onChangeText={(text) => updateFormData('capacity', text)}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              placeholder="kg"
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{t('vehicle.isElectric')}</Text>
              <Switch
                value={formData.is_electric}
                onValueChange={(value) => updateFormData('is_electric', value)}
                thumbColor={formData.is_electric ? '#FF6B00' : "#f4f3f4"}
                trackColor={{ false: "#767577", true: "#FF6B0080" }}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              {t('vehicle.addVehicle')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#212121',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#212121',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#212121',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#FF6B00',
  },
})

export default AddVehicleScreen