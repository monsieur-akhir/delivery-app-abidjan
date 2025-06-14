import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Chip } from 'react-native-paper'
import { Feather } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import AddressAutocomplete from '../../components/AddressAutocomplete'
import MapView from '../../components/MapView'
import WeatherInfo from '../../components/WeatherInfo'
import { useAuth } from '../../contexts/AuthContext'
import { useNetwork } from '../../contexts/NetworkContext'
import { useDelivery } from '../../hooks/useDelivery'
import { useUser } from '../../hooks/useUser'
import DeliveryService from '../../services/DeliveryService'

import type {
  User,
  Delivery,
  Address,
  Weather,
  VehicleType,
  RootStackParamList
} from '../../types'

import { formatPrice, formatDistance } from "../../utils/formatters"

// Helper function to extract commune from address
const extractCommune = (address: string): string => {
  // Simple extraction logic - you can enhance this based on your address format
  const parts = address.split(',')
  return parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown'
}

// Helper function to calculate distance between two coordinates
const calculateDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

interface DeliveryCreateRequest {
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_lat: number
  delivery_lng: number
  package_type: string
  package_description?: string
  package_size?: string
  package_weight?: number
  is_fragile?: boolean
  proposed_price: number
  recipient_name: string
  recipient_phone?: string
  special_instructions?: string
  distance?: number
  estimated_duration?: number
  weather_conditions?: string
}

interface RouteParams {
  searchQuery?: string
}

type CreateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateDelivery'>

const CreateDeliveryScreen: React.FC = () => {
  const navigation = useNavigation<CreateDeliveryScreenNavigationProp>()
  const route = useRoute()
  const params = route.params as RouteParams
  const { user } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()
  const { createDelivery, getPriceEstimate, estimate } = useDelivery()
  const { } = useUser()

  const mapRef = useRef<any>(null)

  // Form states
  const [packageType, setPackageType] = useState<string>('small')
  const [selectedPackageType, setSelectedPackageType] = useState<string>('small')
  const [packageSize, setPackageSize] = useState<string>('small')
  const [packageWeight, setPackageWeight] = useState<string>('')
  const [isFragile, setIsFragile] = useState<boolean>(false)
  const [pickupAddress, setPickupAddress] = useState<string>('')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [pickupLocation, setPickupLocation] = useState<Address | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<Address | null>(null)
  const [proposedPrice, setProposedPrice] = useState<string>('')
  const [packageDescription, setPackageDescription] = useState<string>('')
  const [specialInstructions, setSpecialInstructions] = useState<string>('')
  const [weather, setWeather] = useState<any>(null)
  const [recipientName, setRecipientName] = useState<string>('')
  const [recipientPhone, setRecipientPhone] = useState<string>('')
  const [isUrgent, setIsUrgent] = useState<boolean>(false)

  // UI states
  const [loading, setLoading] = useState<boolean>(false)
  const [showMap, setShowMap] = useState<boolean>(false)
  const [weatherData, setWeatherData] = useState<Weather | null>(null)
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null)
  const [recommendedVehicle, setRecommendedVehicle] = useState<{
    type: VehicleType
    name: string
    reason: string
    priceMultiplier: number
  } | null>(null)

  const packageTypes = [
    { key: 'small', label: 'Petit colis', icon: 'package' },
    { key: 'medium', label: 'Colis moyen', icon: 'package' },
    { key: 'large', label: 'Gros colis', icon: 'package' },
    { key: 'fragile', label: 'Fragile', icon: 'alert-triangle' },
    { key: 'food', label: 'Nourriture', icon: 'coffee' },
    { key: 'documents', label: 'Documents', icon: 'file-text' }
  ]

  useEffect(() => {
    if (params?.searchQuery) {
      setPickupAddress(params.searchQuery)
    }
  }, [params])

  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      calculatePriceEstimate()
      fetchWeatherData()
    }
  }, [pickupLocation, deliveryLocation, packageType])

  const calculatePriceEstimate = async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      const distance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        {
          pickup_lat: pickupLocation.latitude,
          pickup_lng: pickupLocation.longitude,
          delivery_lat: deliveryLocation.latitude,
          delivery_lng: deliveryLocation.longitude,
          package_type: selectedPackageType,
          package_weight: parseFloat(packageWeight) || 0,
          package_size: packageSize,
          is_fragile: isFragile,
          distance: distance,
          weatherConditions: weather?.condition
        }
      )

      const estimateData = {
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        delivery_lat: deliveryLocation.latitude,
        delivery_lng: deliveryLocation.longitude,
        package_type: packageType,
        proposed_price: 0,
        recipient_name: '',
        distance: distance
      }

      await getPriceEstimate(estimateData)

      if (estimate) {
        setRecommendedPrice(estimate.estimated_price)
        setProposedPrice(estimate.estimated_price.toString())
      }

      // Recommendation de véhicule
      const vehicleData = {
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        delivery_lat: deliveryLocation.latitude,
        delivery_lng: deliveryLocation.longitude,
        package_type: selectedPackageType,
        package_weight: parseFloat(packageWeight) || 1,
        package_size: packageSize,
        is_fragile: isFragile || false,
        distance: calculateDistance(
          { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
        ),
        weatherConditions: weatherData?.current?.condition
      }

      const vehicleRec = await DeliveryService.getVehicleRecommendation(vehicleData)
      if (vehicleRec) {
        setRecommendedVehicle({
          type: vehicleRec.recommended_vehicle as VehicleType,
          name: getVehicleName(vehicleRec.recommended_vehicle as VehicleType),
          reason: vehicleRec.reason,
          priceMultiplier: 1
        })
      }
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
    }
  }

  const fetchWeatherData = async () => {
    if (!pickupLocation) return

    try {
      const weather = await fetch(`/api/weather/current?lat=${pickupLocation.latitude}&lng=${pickupLocation.longitude}`)
        .then(res => res.json())
      setWeatherData(weather)
    } catch (error) {
      console.error('Erreur météo:', error)
    }
  }

  const getVehicleName = (type: VehicleType): string => {
    const names = {
      bicycle: 'Vélo',
      motorcycle: 'Moto',
      scooter: 'Scooter',
      car: 'Voiture',
      van: 'Camionnette',
      truck: 'Camion'
    }
    return names[type] || 'Véhicule'
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    if (!pickupLocation || !deliveryLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner les adresses de retrait et de livraison')
      return
    }

    setLoading(true)

    const deliveryData: DeliveryCreateRequest = {
      pickup_address: pickupAddress,
      pickup_commune: extractCommune(pickupAddress),
      delivery_address: deliveryAddress,
      delivery_commune: extractCommune(deliveryAddress),
      pickup_lat: pickupLocation.latitude,
      pickup_lng: pickupLocation.longitude,
      delivery_lat: deliveryLocation.latitude,
      delivery_lng: deliveryLocation.longitude,
      package_type: packageType,
      package_description: packageDescription,
      proposed_price: parseFloat(proposedPrice),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      weather_conditions: weatherData?.current?.condition || 'clear'
    }

    try {
      if (!isConnected) {
        addPendingUpload({
          type: 'delivery',
          data: deliveryData,
          retries: 0
        })
        Alert.alert('Mode hors ligne', 'Votre livraison sera créée dès que la connexion sera rétablie')
        navigation.goBack()
        return
      }

      const result = await createDelivery(deliveryData)
      Alert.alert('Succès', 'Votre livraison a été créée avec succès!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('TrackDelivery', { deliveryId: result.id })
        }
      ])    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la livraison. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!pickupAddress || !deliveryAddress) {
      Alert.alert('Erreur', 'Veuillez renseigner les adresses de retrait et de livraison')
      return false
    }

    if (!packageType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de colis')
      return false
    }

    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un prix valide')
      return false
    }

    return true
  }

  const handleAddressSelect = (address: any, type: 'pickup' | 'delivery') => {
    const addressWithName = {
      ...address,
      name: address.name || address.description || address.address || 'Adresse'
    }

    if (type === 'pickup') {
      setPickupLocation(addressWithName)
      setPickupAddress(addressWithName.name)
    } else {
      setDeliveryLocation(addressWithName)
      setDeliveryAddress(addressWithName.name)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouvelle livraison</Text>
            <TouchableOpacity onPress={() => setShowMap(!showMap)}>
              <Feather name="map" size={24} color="#FF6B00" />
            </TouchableOpacity>
          </View>

          {showMap && pickupLocation && deliveryLocation && (
            <Card style={styles.mapCard}>
              <MapView
                style={{ flex: 1 }}
                pickupPoint={{
                  latitude: pickupLocation.latitude,
                  longitude: pickupLocation.longitude,
                  title: 'Retrait',
                  description: pickupAddress
                }}
                deliveryPoint={{
                  latitude: deliveryLocation.latitude,
                  longitude: deliveryLocation.longitude,
                  title: 'Livraison',
                  description: deliveryAddress
                }}
                showTraffic={false}
                isInteractive={true}
              />
            </Card>
          )}

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Adresses</Text>

            <AddressAutocomplete
              label="Adresse de retrait"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={(address) => handleAddressSelect(address, 'pickup')}
              showCurrentLocation={true}
            />

            <AddressAutocomplete
              label="Adresse de livraison"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              onAddressSelect={(address) => handleAddressSelect(address, 'delivery')}
              showCurrentLocation={false}
            />
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Type de colis</Text>
            <View style={styles.packageTypeGrid}>
              {packageTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.packageTypeButton,
                    packageType === type.key && styles.packageTypeButtonActive
                  ]}
                  onPress={() => setPackageType(type.key)}
                >
                  <Feather 
                    name={type.icon as any} 
                    size={24} 
                    color={packageType === type.key ? "#FFFFFF" : "#FF6B00"} 
                  />
                  <Text style={[
                    styles.packageTypeText,
                    packageType === type.key && styles.packageTypeTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Détails du colis</Text>

            <TextInput
              style={styles.input}
              placeholder="Description du colis"
              value={packageDescription}
              onChangeText={setPackageDescription}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Nom du destinataire"
              value={recipientName}
              onChangeText={setRecipientName}
            />

            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Instructions spéciales (optionnel)"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Prix et options</Text>

            <TextInput
              style={styles.input}
              placeholder="Votre prix proposé (FCFA)"
              value={proposedPrice}
              onChangeText={setProposedPrice}
              keyboardType="numeric"
            />

            {recommendedPrice && (
              <View style={styles.recommendationContainer}>
                <Feather name="info" size={16} color="#4CAF50" />
                <Text style={styles.recommendationText}>
                  Prix recommandé: {formatPrice(recommendedPrice)} FCFA
                </Text>
              </View>
            )}

            {recommendedVehicle && (
              <View style={styles.recommendationContainer}>
                <Feather name="truck" size={16} color="#2196F3" />
                <Text style={styles.recommendationText}>
                  Véhicule recommandé: {recommendedVehicle.name}
                </Text>
                <Text style={styles.recommendationReason}>
                  {recommendedVehicle.reason}
                </Text>
              </View>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, isUrgent && styles.optionButtonActive]}
                onPress={() => setIsUrgent(!isUrgent)}
              >
                <Feather name="clock" size={20} color={isUrgent ? "#FFFFFF" : "#FF6B00"} />
                <Text style={[styles.optionText, isUrgent && styles.optionTextActive]}>
                  Urgent
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, isFragile && styles.optionButtonActive]}
                onPress={() => setIsFragile(!isFragile)}
              >
                <Feather name="alert-triangle" size={20} color={isFragile ? "#FFFFFF" : "#FF6B00"} />
                <Text style={[styles.optionText, isFragile && styles.optionTextActive]}>
                  Fragile
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {weatherData?.current && (
            <View style={styles.weatherInfo}>
              <WeatherInfo 
                weather={{
                  current: weatherData.current,
                  forecast: weatherData.forecast,
                  alerts: weatherData.alerts
                }} 
              />
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {loading ? 'Création en cours...' : 'Créer la livraison'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000'
  },
  mapCard: {
    height: 200,
    marginBottom: 16,
    borderRadius: 12
  },
  formCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000'
  },
  packageTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  packageTypeButton: {
    width: '48%',
    aspectRatio: 1.5,
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF'
  },
  packageTypeButtonActive: {
    backgroundColor: '#FF6B00'
  },
  packageTypeText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B00',
    textAlign: 'center'
  },
  packageTypeTextActive: {
    color: '#FFFFFF'
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32'
  },
  recommendationReason: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    flex: 1
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF'
  },
  optionButtonActive: {
    backgroundColor: '#FF6B00'
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B00'
  },
  optionTextActive: {
    color: '#FFFFFF'
  },
  weatherInfo: {
    marginBottom: 16
  },
  submitButton: {
    marginBottom: 32,
    borderRadius: 25,
    backgroundColor: '#FF6B00'
  },
  submitButtonContent: {
    height: 50
  }
})

export default CreateDeliveryScreen
```