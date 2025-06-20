
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Animated,
  Dimensions,
  Alert,
  LayoutAnimation,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Chip, Divider, ProgressBar, Surface } from 'react-native-paper'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'

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

const { width, height } = Dimensions.get('window')

// Couleurs modernes inspirées de Uber/Glovo
const COLORS = {
  primary: '#FF4D4D',
  primaryLight: '#FF7070',
  primaryDark: '#E63946',
  secondary: '#FFF5F5',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#8E8E93',
  textLight: '#C7C7CC',
  border: '#E5E5EA',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  mapBackground: '#F5F5F5'
}

// Styles modernes
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header moderne avec navigation icons
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  // Map container avec overlay de navigation
  mapContainer: {
    height: height * 0.4,
    backgroundColor: COLORS.mapBackground,
    position: 'relative',
  },
  
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8',
  },
  
  // Navigation overlay au top de la carte
  navigationOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  
  vehicleIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  
  vehicleIcon: {
    marginRight: 8,
  },
  
  routeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  
  // Indicateur de prix en haut à droite
  priceIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  priceText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Bottom sheet avec handle
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flex: 1,
    minHeight: height * 0.6,
  },
  
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Address inputs avec design moderne
  addressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  addressInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  addressInputIcon: {
    marginRight: 12,
  },
  
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  
  deliveryIcon: {
    width: 12,
    height: 12,
  },
  
  addressInputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  
  addressInputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Ligne de connexion entre les adresses
  connectionLine: {
    position: 'absolute',
    left: 36,
    top: 56,
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
  },
  
  // Delivery options avec design amélioré
  deliveryOptionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  deliveryOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  deliveryOptionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  
  deliveryOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  deliveryOptionIconSelected: {
    backgroundColor: COLORS.primary,
  },
  
  deliveryOptionInfo: {
    flex: 1,
  },
  
  deliveryOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  
  deliveryOptionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  
  deliveryOptionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  // Section promotionnelle
  promotionalSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  promotionalCard: {
    backgroundColor: COLORS.warning,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  promotionalText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  
  promotionalIcon: {
    marginLeft: 12,
  },
  
  // Action button avec design moderne
  actionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  actionButtonDisabled: {
    backgroundColor: COLORS.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: height * 0.85,
  },
  
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  
  // Package types grid
  packageTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  packageTypeCard: {
    width: (width - 52) / 3,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  
  packageTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  
  packageTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  packageTypeIconSelected: {
    backgroundColor: COLORS.primary,
  },
  
  packageTypeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  
  packageTypeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Loading modal
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  
  // Informations supplémentaires
  deliveryInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  infoIcon: {
    marginRight: 12,
  },
  
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
})

// Helper functions
const extractCommune = (address: string): string => {
  const parts = address.split(',')
  return parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown'
}

const calculateDistance = (coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number => {
  const R = 6371
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

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface DeliverySpeed {
  key: string;
  title: string;
  time: string;
  icon: FeatherIconName;
  multiplier: number;
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
  const { t } = useTranslation()

  const mapRef = useRef<any>(null)

  // Form states - conservation de votre logique existante
  const [packageType, setPackageType] = useState<string>('small')
  const [selectedPackageType, setSelectedPackageType] = useState<string>('small')
  const [packageSize, setPackageSize] = useState<string>('small')
  const [packageWeight, setPackageWeight] = useState<string>('')
  const [isFragile, setIsFragile] = useState<boolean>(false)
  const [pickupAddress, setPickupAddress] = useState<string>('Rue M60, 918')
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

  // États pour les options dynamiques - conservation de votre logique
  const [deliveryOptions, setDeliveryOptions] = useState<any>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('moto')
  const [selectedSpeed, setSelectedSpeed] = useState<string>('')
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState<number>(400)
  const [estimatedPrice, setEstimatedPrice] = useState(400)
  const [showPackageModal, setShowPackageModal] = useState(false)

  // Options de livraison modernisées
  const modernDeliveryOptions = [
    {
      key: 'moto',
      title: 'Livraison à moto',
      subtitle: 'à partir de 400 F',
      icon: '🏍️',
      price: 400,
      time: '25-35 min'
    },
    {
      key: 'voiture', 
      title: 'Livraison en voiture',
      subtitle: 'à partir de 500 F',
      icon: '🚗',
      price: 500,
      time: '30-45 min'
    },
    {
      key: 'express',
      title: 'Express Cargo',
      subtitle: 'à partir de 3100 F',
      icon: '🚛',
      price: 3100,
      time: '15-25 min'
    }
  ]

  // Package types
  const packageTypes = [
    { key: 'petit', label: 'Petit', icon: 'package' },
    { key: 'moyen', label: 'Moyen', icon: 'box' },
    { key: 'grand', label: 'Grand', icon: 'archive' },
    { key: 'fragile', label: 'Fragile', icon: 'alert-triangle' },
    { key: 'nourriture', label: 'Nourriture', icon: 'coffee' },
    { key: 'documents', label: 'Documents', icon: 'file-text' }
  ]

  // Conservation de tous vos useEffect existants
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
            { key: 'slow', label: 'En 3h', min_price: 400, delay: '3h', icon: 'time' }
          ],
          extras: [
            { key: 'isothermal_bag', label: 'Sac isotherme', price: 200, icon: 'thermometer' },
            { key: 'comment', label: 'Commentaire', price: 0, icon: 'chatbubble' }
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
  }, [pickupLocation, deliveryLocation, packageType, selectedVehicleType, selectedSpeed, selectedExtras])

  // Conservation de toutes vos fonctions existantes
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
        setEstimatedPrice(finalPrice)
      }

      // Recommendation de véhicule
      const vehicleData = {
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        delivery_lat: deliveryLocation.latitude,
        delivery_lng: deliveryLocation.longitude,
        package_type: selectedPackageType,
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
          priceMultiplier: recommendation.price_multiplier || 1.0
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

  const handleDeliverySelection = (option: any) => {
    setSelectedVehicleType(option.key)
    setEstimatedPrice(option.price)
    setTotalPrice(option.price)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
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

  const toggleExtra = (extraKey: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraKey) 
        ? prev.filter(k => k !== extraKey) 
        : [...prev, extraKey]
    )
  }

  const renderDeliveryOption = (option: any) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.deliveryOptionCard,
        selectedVehicleType === option.key && styles.deliveryOptionCardSelected
      ]}
      onPress={() => handleDeliverySelection(option)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.deliveryOptionIcon,
        selectedVehicleType === option.key && styles.deliveryOptionIconSelected
      ]}>
        <Text style={{ fontSize: 28 }}>{option.icon}</Text>
      </View>
      <View style={styles.deliveryOptionInfo}>
        <Text style={styles.deliveryOptionTitle}>{option.title}</Text>
        <Text style={styles.deliveryOptionSubtitle}>{option.subtitle}</Text>
        {option.time && (
          <Text style={[styles.deliveryOptionSubtitle, { marginTop: 2, fontSize: 12 }]}>
            ⏱️ {option.time}
          </Text>
        )}
      </View>
      <Text style={styles.deliveryOptionPrice}>{formatPrice(option.price)}</Text>
    </TouchableOpacity>
  )

  const renderPackageTypeModal = () => (
    <Modal
      visible={showPackageModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPackageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Type de colis</Text>
          
          <View style={styles.packageTypesGrid}>
            {packageTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.packageTypeCard,
                  selectedPackageType === type.key && styles.packageTypeCardSelected
                ]}
                onPress={() => {
                  setSelectedPackageType(type.key)
                  setPackageType(type.key)
                  setShowPackageModal(false)
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }}
              >
                <View style={[
                  styles.packageTypeIcon,
                  selectedPackageType === type.key && styles.packageTypeIconSelected
                ]}>
                  <Feather
                    name={type.icon as any}
                    size={20}
                    color={selectedPackageType === type.key ? COLORS.white : COLORS.primary}
                  />
                </View>
                <Text style={[
                  styles.packageTypeLabel,
                  selectedPackageType === type.key && styles.packageTypeLabelSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header moderne */}
      <View style={styles.modernHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Envoyer un colis</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="settings" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Map Section avec overlay navigation */}
        <View style={styles.mapContainer}>
          {pickupLocation && deliveryLocation ? (
            <MapView
              pickupLocation={pickupLocation}
              deliveryLocation={deliveryLocation}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Feather name="map" size={48} color={COLORS.textSecondary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
                Carte interactive
              </Text>
            </View>
          )}
          
          {/* Navigation overlay avec icônes de véhicules */}
          <View style={styles.navigationOverlay}>
            <View style={styles.vehicleIconsContainer}>
              <Text style={[styles.vehicleIcon, { fontSize: 16 }]}>🚛</Text>
              <Text style={[styles.vehicleIcon, { fontSize: 16 }]}>🚗</Text>
              <Text style={[styles.vehicleIcon, { fontSize: 16 }]}>🏍️</Text>
            </View>
            <Text style={styles.routeText}>
              {pickupAddress || 'Sélectionner une adresse'}
            </Text>
            <Feather name="navigation" size={20} color={COLORS.primary} />
          </View>
          
          {/* Indicateur de prix */}
          <View style={styles.priceIndicator}>
            <Text style={styles.priceText}>F {estimatedPrice}</Text>
          </View>
        </View>

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>ENVOYER UN COLIS</Text>

          {/* Address Inputs avec design moderne */}
          <View style={styles.addressSection}>
            <View style={styles.addressInputContainer}>
              <TouchableOpacity 
                style={styles.addressInput}
                onPress={() => {
                  // Ouvrir la sélection d'adresse de pickup
                }}
              >
                <View style={styles.addressInputIcon}>
                  <View style={styles.pickupDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>
                    Prise en charge
                  </Text>
                  <Text style={styles.addressInputText}>
                    {pickupAddress || 'Rue M60, 918'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.connectionLine} />
            </View>
            
            <TouchableOpacity 
              style={styles.addressInput}
              onPress={() => {
                // Ouvrir la sélection d'adresse de livraison
              }}
            >
              <View style={styles.addressInputIcon}>
                <Feather name="navigation" size={16} color={COLORS.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>
                  Adresse de livraison
                </Text>
                <Text style={[
                  deliveryAddress ? styles.addressInputText : styles.addressInputPlaceholder
                ]}>
                  {deliveryAddress || 'Où doit-on livrer le colis ?'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Delivery Options modernisées */}
          <View style={styles.deliveryOptionsSection}>
            {modernDeliveryOptions.map(renderDeliveryOption)}
          </View>

          {/* Section promotionnelle */}
          <View style={styles.promotionalSection}>
            <TouchableOpacity style={styles.promotionalCard}>
              <Text style={styles.promotionalText}>
                💰 Gagnez du temps et récupérez vos achats avec la Livraison
              </Text>
              <View style={styles.promotionalIcon}>
                <Feather name="chevron-right" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Informations de livraison */}
          <View style={styles.deliveryInfoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Feather name="clock" size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.infoText}>
                Livraison estimée en 25-35 min
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Feather name="shield" size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.infoText}>
                Assurance incluse jusqu'à 50 000 F
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!pickupAddress || !deliveryAddress || !selectedVehicleType) && styles.actionButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!pickupAddress || !deliveryAddress || !selectedVehicleType || loading}
        >
          <Text style={styles.actionButtonText}>
            Choix de la méthode de livraison
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderPackageTypeModal()}

      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Création en cours...</Text>
          </View>
        </View>
      </Modal>

      {/* Alerts et Toasts */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onDismiss={hideAlert}
        onConfirm={alertConfig.onConfirm}
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

export default CreateDeliveryScreen
