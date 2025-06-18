import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Chip, Divider } from 'react-native-paper'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import AddressAutocomplete from '../../components/AddressAutocomplete'
import MapView from '../../components/MapView'
import WeatherInfo from '../../components/WeatherInfo'
import CustomAlert from '../../components/CustomAlert'
import CustomToast from '../../components/CustomToast'
import { useAuth } from '../../contexts/AuthContext'
import { useNetwork } from '../../contexts/NetworkContext'
import { useDelivery } from '../../hooks/useDelivery'
import { useUser } from '../../hooks/useUser'
import { useAlert } from '../../hooks/useAlert'
import DeliveryService from '../../services/DeliveryService'
import api from '../../services/api'

import type {
  User,
  Delivery,
  Address,
  Weather,
  VehicleType,
  RootStackParamList,
  DeliveryStatus,
  VehicleRecommendationData
} from '../../types'

import { formatPrice, formatDistance } from "../../utils/formatters"

// Helper function to extract commune from address
const extractCommune = (address: string): string => {
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
  pickup_commune: string
  pickup_lat: number
  pickup_lng: number
  delivery_address: string
  delivery_commune: string
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
  vehicle_type?: string
  delivery_speed?: string
  extras?: string[]
}

interface RouteParams {
  searchQuery?: string
}

type CreateDeliveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateDelivery'>

// Fonction utilitaire pour choisir la bonne icône
function getIcon(icon: string, color: string, size: number): React.ReactElement {
  switch (icon) {
    case 'package':
      return <Feather name="package" size={size} color={color} />
    case 'alert-triangle':
      return <Feather name="alert-triangle" size={size} color={color} />
    case 'coffee':
      return <MaterialCommunityIcons name="coffee" size={size} color={color} />
    case 'file-text':
      return <Feather name="file-text" size={size} color={color} />
    case 'motorcycle':
      return <MaterialCommunityIcons name="motorbike" size={size} color={color} />
    case 'clock':
      return <Feather name="clock" size={size} color={color} />
    default:
      return <Ionicons name={icon as any} size={size} color={color} />
  }
}

const CreateDeliveryScreen: React.FC = () => {
  const navigation = useNavigation<CreateDeliveryScreenNavigationProp>()
  const route = useRoute()
  const params = route.params as RouteParams
  const { user } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()
  const { createDelivery, getPriceEstimate, estimate } = useDelivery()
  const { } = useUser()
  const { 
    alertVisible,
    alertConfig,
    toastVisible,
    toastConfig,
    showErrorAlert, 
    showSuccessAlert, 
    showInfoAlert, 
    showConfirmationAlert,
    hideAlert,
    hideToast
  } = useAlert()

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

  // Nouveaux états pour les options dynamiques
  const [deliveryOptions, setDeliveryOptions] = useState<any>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('')
  const [selectedSpeed, setSelectedSpeed] = useState<string>('')
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState<number>(0)

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
    // Charger dynamiquement les options depuis le backend
    const fetchOptions = async () => {
      try {
        const response = await api.get('/api/deliveries/options')
        setDeliveryOptions(response.data)
      } catch (e) {
        // fallback statique si besoin
        setDeliveryOptions({
          vehicle_types: [
            { type: 'moto', label: 'Livraison à moto', min_price: 500, icon: 'motorcycle' },
            { type: 'voiture', label: 'Livraison en voiture', min_price: 500, icon: 'car' },
            { type: 'interville', label: 'Intervilles', min_price: 1990, icon: 'bus' }
          ],
          delivery_speeds: [
            { key: 'urgent', label: 'Urgent', min_price: 700, delay: '30min', icon: 'flash' },
            { key: 'normal', label: 'Un peu plus long', min_price: 500, delay: '1h', icon: 'clock' },
            { key: 'slow', label: 'En 3h', min_price: 400, delay: '3h', icon: 'clock' }
          ],
          extras: [
            { key: 'isothermal_bag', label: 'Sac isotherme', price: 200, icon: 'thermometer' },
            { key: 'comment', label: 'Commentaire', price: 0, icon: 'file-text' }
          ]
        })
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      calculatePriceEstimate()
      fetchWeatherData()
    }
  }, [pickupLocation, deliveryLocation, selectedVehicleType, selectedSpeed, selectedExtras])

  // Mettre à jour le prix proposé quand les options changent
  useEffect(() => {
    if (deliveryOptions && selectedVehicleType) {
      const selectedVehicle = deliveryOptions.vehicle_types?.find((v: any) => v.type === selectedVehicleType)
      if (selectedVehicle) {
        setProposedPrice(selectedVehicle.min_price.toString())
      }
    }
  }, [selectedVehicleType, deliveryOptions])

  const calculatePriceEstimate = async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      const distance = calculateDistance(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
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
        let basePrice = estimate.estimated_price
        
        // Ajouter les coûts des options sélectionnées
        if (selectedVehicleType && deliveryOptions?.vehicle_types) {
          const vehicle = deliveryOptions.vehicle_types.find((v: any) => v.type === selectedVehicleType)
          if (vehicle) {
            basePrice = Math.max(basePrice, vehicle.min_price)
          }
        }

        if (selectedSpeed && deliveryOptions?.delivery_speeds) {
          const speed = deliveryOptions.delivery_speeds.find((s: any) => s.key === selectedSpeed)
          if (speed) {
            basePrice = Math.max(basePrice, speed.min_price)
          }
        }

        // Ajouter le coût des extras
        let extrasCost = 0
        if (selectedExtras.length > 0 && deliveryOptions?.extras) {
          selectedExtras.forEach(extraKey => {
            const extra = deliveryOptions.extras.find((e: any) => e.key === extraKey)
            if (extra) {
              extrasCost += extra.price
            }
          })
        }

        const finalPrice = basePrice + extrasCost
        setTotalPrice(finalPrice)
        setRecommendedPrice(finalPrice)
        setProposedPrice(finalPrice.toString())
      }

      // Recommendation de véhicule
      const vehicleData = {
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        delivery_lat: deliveryLocation.latitude,
        delivery_lng: deliveryLocation.longitude,
        package_type: selectedPackageType,
        package_size: packageSize,
        package_weight: parseFloat(packageWeight) || 1,
        is_fragile: isFragile,
        distance: distance
      }

      try {
        const recommendation = await DeliveryService.getVehicleRecommendation(vehicleData)
        setRecommendedVehicle({
          type: recommendation.recommended_vehicle as VehicleType,
          name: getVehicleName(recommendation.recommended_vehicle as VehicleType),
          reason: recommendation.reason,
          priceMultiplier: 1.0 // Valeur par défaut
        })
      } catch (error) {
        console.warn('Erreur lors de la recommandation de véhicule:', error)
      }
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error)
      showErrorAlert('Erreur', 'Impossible de calculer le prix estimé')
    }
  }

  const fetchWeatherData = async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${pickupLocation.latitude},${pickupLocation.longitude}`
      )
      const data = await response.json()
      setWeatherData(data)
    } catch (error) {
      console.warn('Erreur lors de la récupération des données météo:', error)
    }
  }

  const getVehicleName = (type: VehicleType): string => {
    switch (type) {
      case 'motorcycle':
        return 'Moto'
      case 'car':
        return 'Voiture'
      case 'van':
        return 'Camionnette'
      case 'truck':
        return 'Camion'
      default:
        return 'Véhicule'
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    const payload = {
      pickup_address: pickupAddress,
      pickup_commune: extractCommune(pickupAddress),
      pickup_lat: pickupLocation!.latitude,
      pickup_lng: pickupLocation!.longitude,
      delivery_address: deliveryAddress,
      delivery_commune: extractCommune(deliveryAddress),
      delivery_lat: deliveryLocation!.latitude,
      delivery_lng: deliveryLocation!.longitude,
      package_type: packageType,
      package_description: packageDescription,
      package_size: packageSize,
      package_weight: parseFloat(packageWeight) || 1,
      is_fragile: isFragile,
      proposed_price: parseFloat(proposedPrice),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      special_instructions: specialInstructions,
      distance: calculateDistance(
        { latitude: pickupLocation!.latitude, longitude: pickupLocation!.longitude },
        { latitude: deliveryLocation!.latitude, longitude: deliveryLocation!.longitude }
      ),
      weather_conditions: weatherData?.current?.condition || 'clear',
      vehicle_type: selectedVehicleType,
      delivery_speed: selectedSpeed,
      extras: selectedExtras
    }

    try {
      if (!isConnected) {
        addPendingUpload({
          type: 'delivery',
          data: payload,
          retries: 0
        })
        showInfoAlert('Hors ligne', 'Votre livraison sera créée dès la reconnexion')
        navigation.navigate('Home')
        return
      }

      const result = await createDelivery(payload)
      showSuccessAlert('Succès', 'Votre livraison a été créée avec succès!')
      navigation.navigate('TrackDelivery', { deliveryId: result.id })
    } catch (error) {
      console.error('Erreur lors de la création de la livraison:', error)
      showErrorAlert('Erreur', 'Impossible de créer la livraison. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!pickupAddress.trim()) {
      showErrorAlert('Erreur', 'Veuillez saisir l\'adresse de ramassage')
      return false
    }
    if (!deliveryAddress.trim()) {
      showErrorAlert('Erreur', 'Veuillez saisir l\'adresse de livraison')
      return false
    }
    if (!pickupLocation) {
      showErrorAlert('Erreur', 'Veuillez sélectionner une adresse de ramassage valide')
      return false
    }
    if (!deliveryLocation) {
      showErrorAlert('Erreur', 'Veuillez sélectionner une adresse de livraison valide')
      return false
    }
    if (!recipientName.trim()) {
      showErrorAlert('Erreur', 'Veuillez saisir le nom du destinataire')
      return false
    }
    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      showErrorAlert('Erreur', 'Veuillez saisir un prix valide')
      return false
    }
    return true
  }

  const handleAddressSelect = (address: any, type: 'pickup' | 'delivery') => {
    if (type === 'pickup') {
      setPickupLocation(address)
      setPickupAddress(address.description)
    } else {
      setDeliveryLocation(address)
      setDeliveryAddress(address.description)
    }
  }

  const getAddressSuggestions = async (query: string) => {
    // Méthode non implémentée dans ce projet
    console.log('getAddressSuggestions not implemented')
    return []
  }

  const getPopularPlaces = async (category?: string) => {
    // Méthode non implémentée dans ce projet
    console.log('getPopularPlaces not implemented')
    return []
  }

  const performSmartMatching = async () => {
    // Méthode non implémentée dans ce projet
    console.log('smartMatching not implemented')
    return null
  }

  const toggleExtra = (extraKey: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraKey) 
        ? prev.filter(k => k !== extraKey) 
        : [...prev, extraKey]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouvelle livraison</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Adresses */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Adresses</Text>
            
            <AddressAutocomplete
              label="Adresse de ramassage"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={(address) => handleAddressSelect(address, 'pickup')}
              placeholder="Où récupérer le colis ?"
              style={styles.addressInput}
            />

            <AddressAutocomplete
              label="Adresse de livraison"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              onAddressSelect={(address) => handleAddressSelect(address, 'delivery')}
              placeholder="Où livrer le colis ?"
              style={styles.addressInput}
            />
          </Card>

          {/* Types de livraison dynamiques */}
          {deliveryOptions?.vehicle_types && (
            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Types de livraison</Text>
              <View style={styles.vehicleTypesContainer}>
                {deliveryOptions.vehicle_types.map((option: any) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.vehicleTypeCard,
                      selectedVehicleType === option.type && styles.selectedCard
                    ]}
                    onPress={() => setSelectedVehicleType(option.type)}
                  >
                    {getIcon(option.icon, selectedVehicleType === option.type ? '#FFF' : '#FF6B00', 32)}
                    <Text style={[
                      styles.vehicleTypeLabel,
                      selectedVehicleType === option.type && styles.selectedText
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.vehicleTypePrice,
                      selectedVehicleType === option.type && styles.selectedText
                    ]}>
                      {option.min_price} FCFA
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Délais dynamiques */}
          {deliveryOptions?.delivery_speeds && (
            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Délais</Text>
              <View style={styles.speedsContainer}>
                {deliveryOptions.delivery_speeds.map((speed: any) => (
                  <TouchableOpacity
                    key={speed.key}
                    style={[
                      styles.speedCard,
                      selectedSpeed === speed.key && styles.selectedCard
                    ]}
                    onPress={() => setSelectedSpeed(speed.key)}
                  >
                    {getIcon(speed.icon, selectedSpeed === speed.key ? '#FFF' : '#FF6B00', 20)}
                    <Text style={[
                      styles.speedLabel,
                      selectedSpeed === speed.key && styles.selectedText
                    ]}>
                      {speed.label}
                    </Text>
                    <Text style={[
                      styles.speedDelay,
                      selectedSpeed === speed.key && styles.selectedText
                    ]}>
                      {speed.delay}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Options supplémentaires dynamiques */}
          {deliveryOptions?.extras && (
            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Options supplémentaires</Text>
              {deliveryOptions.extras.map((extra: any) => (
                <View key={extra.key} style={styles.extraOptionContainer}>
                  <TouchableOpacity
                    style={styles.extraOption}
                    onPress={() => toggleExtra(extra.key)}
                  >
                    <View style={styles.extraOptionContent}>
                      {getIcon(extra.icon, selectedExtras.includes(extra.key) ? '#FF6B00' : '#666', 20)}
                      <Text style={styles.extraOptionLabel}>{extra.label}</Text>
                      {extra.price > 0 && (
                        <Text style={styles.extraOptionPrice}>+{extra.price} FCFA</Text>
                      )}
                    </View>
                    <Switch
                      value={selectedExtras.includes(extra.key)}
                      onValueChange={() => toggleExtra(extra.key)}
                      trackColor={{ false: '#E0E0E0', true: '#FF6B00' }}
                      thumbColor={selectedExtras.includes(extra.key) ? '#FFF' : '#FFF'}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          )}

          {/* Informations du colis */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informations du colis</Text>
            
            <View style={styles.packageTypesContainer}>
              {packageTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.packageTypeCard,
                    packageType === type.key && styles.selectedCard
                  ]}
                  onPress={() => setPackageType(type.key)}
                >
                  {getIcon(type.icon, packageType === type.key ? '#FFF' : '#666', 20)}
                  <Text style={[
                    styles.packageTypeLabel,
                    packageType === type.key && styles.selectedText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                placeholder="Poids (kg)"
                value={packageWeight}
                onChangeText={setPackageWeight}
                keyboardType="numeric"
                style={styles.halfInput}
              />
              <View style={styles.fragileContainer}>
                <Text style={styles.fragileLabel}>Fragile</Text>
                <Switch
                  value={isFragile}
                  onValueChange={setIsFragile}
                  trackColor={{ false: '#E0E0E0', true: '#FF6B00' }}
                  thumbColor={isFragile ? '#FFF' : '#FFF'}
                />
              </View>
            </View>

            <TextInput
              placeholder="Description du colis"
              value={packageDescription}
              onChangeText={setPackageDescription}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </Card>

          {/* Informations du destinataire */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Destinataire</Text>
            
            <TextInput
              placeholder="Nom du destinataire"
              value={recipientName}
              onChangeText={setRecipientName}
              style={styles.input}
            />

            <TextInput
              placeholder="Téléphone (optionnel)"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              placeholder="Instructions spéciales"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </Card>

          {/* Prix et validation */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Prix et paiement</Text>
            
            {/* Suggestions de prix */}
            <View style={styles.priceSuggestionsContainer}>
              <Text style={styles.priceSuggestionsTitle}>Suggestions de prix</Text>
              <View style={styles.priceSuggestionsGrid}>
                {deliveryOptions?.vehicle_types?.map((vehicle: any) => (
                  <TouchableOpacity
                    key={vehicle.type}
                    style={[
                      styles.priceSuggestionCard,
                      parseFloat(proposedPrice) === vehicle.min_price && styles.selectedPriceCard
                    ]}
                    onPress={() => setProposedPrice(vehicle.min_price.toString())}
                  >
                    <Text style={[
                      styles.priceSuggestionLabel,
                      parseFloat(proposedPrice) === vehicle.min_price && styles.selectedPriceText
                    ]}>
                      {vehicle.label}
                    </Text>
                    <Text style={[
                      styles.priceSuggestionValue,
                      parseFloat(proposedPrice) === vehicle.min_price && styles.selectedPriceText
                    ]}>
                      {formatPrice(vehicle.min_price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Prix estimé total */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Prix total estimé</Text>
              <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
            </View>

            {/* Détails du calcul du prix */}
            {totalPrice > 0 && (
              <View style={styles.priceBreakdownContainer}>
                <Text style={styles.priceBreakdownTitle}>Détails du calcul</Text>
                <View style={styles.priceBreakdownItem}>
                  <Text style={styles.priceBreakdownLabel}>Prix de base</Text>
                  <Text style={styles.priceBreakdownValue}>
                    {formatPrice(estimate?.estimated_price || 0)}
                  </Text>
                </View>
                {selectedVehicleType && deliveryOptions?.vehicle_types && (
                  <View style={styles.priceBreakdownItem}>
                    <Text style={styles.priceBreakdownLabel}>Type de véhicule</Text>
                    <Text style={styles.priceBreakdownValue}>
                      {deliveryOptions.vehicle_types.find((v: any) => v.type === selectedVehicleType)?.label}
                    </Text>
                  </View>
                )}
                {selectedSpeed && deliveryOptions?.delivery_speeds && (
                  <View style={styles.priceBreakdownItem}>
                    <Text style={styles.priceBreakdownLabel}>Délai de livraison</Text>
                    <Text style={styles.priceBreakdownValue}>
                      {deliveryOptions.delivery_speeds.find((s: any) => s.key === selectedSpeed)?.label}
                    </Text>
                  </View>
                )}
                {selectedExtras.length > 0 && deliveryOptions?.extras && (
                  <View style={styles.priceBreakdownItem}>
                    <Text style={styles.priceBreakdownLabel}>Options supplémentaires</Text>
                    <Text style={styles.priceBreakdownValue}>
                      +{formatPrice(selectedExtras.reduce((total, extraKey) => {
                        const extra = deliveryOptions.extras.find((e: any) => e.key === extraKey)
                        return total + (extra?.price || 0)
                      }, 0))}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Saisie manuelle du prix */}
            <View style={styles.manualPriceContainer}>
              <Text style={styles.manualPriceLabel}>Prix que vous proposez</Text>
              <TextInput
                placeholder="Saisissez votre prix (FCFA)"
                value={proposedPrice}
                onChangeText={setProposedPrice}
                keyboardType="numeric"
                style={styles.manualPriceInput}
              />
              <Text style={styles.priceNote}>
                💡 Vous pouvez ajuster le prix selon vos besoins
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              Valider la méthode de livraison
            </Button>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alerts et Toasts */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onDismiss={hideAlert}
      />

      <CustomToast
        visible={toastVisible}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={hideToast}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  formCard: {
    margin: 16,
    marginBottom: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
  },
  addressInput: {
    marginBottom: 16,
  },
  vehicleTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleTypeCard: {
    width: '48%',
    padding: 18,
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 16,
    marginBottom: 14,
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    transform: [{ scale: 1 }],
  },
  selectedCard: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
    shadowOpacity: 0.18,
    transform: [{ scale: 1.04 }],
  },
  vehicleTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  selectedText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  vehicleTypePrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  speedsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedCard: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  speedDelay: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  extraOptionContainer: {
    marginBottom: 12,
  },
  extraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  extraOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  extraOptionLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  extraOptionPrice: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
  },
  packageTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  packageTypeCard: {
    width: '48%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  packageTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginRight: 16,
  },
  fragileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 100,
  },
  fragileLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 16,
  },
  priceSuggestionsContainer: {
    marginBottom: 16,
  },
  priceSuggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceSuggestionCard: {
    width: '48%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  selectedPriceCard: {
    backgroundColor: '#FF6B00',
  },
  priceSuggestionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedPriceText: {
    color: '#FFF',
  },
  priceSuggestionValue: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#FFF6ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD6B0',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  manualPriceContainer: {
    marginBottom: 16,
  },
  manualPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  manualPriceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  submitButton: {
    borderRadius: 16,
    backgroundColor: '#FF6B00',
    marginTop: 10,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonContent: {
    height: 56,
  },
  submitButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceBreakdownContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  priceBreakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceBreakdownLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceBreakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
})

export default CreateDeliveryScreen