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
  Image,
  FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Chip, Divider, ProgressBar, Surface } from 'react-native-paper'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import * as Location from 'expo-location'

import MapView from '../../components/MapView'
import AddressAutocomplete from '../../components/AddressAutocomplete'
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

// Données d'Abidjan pour l'autocomplétion locale
const ABIDJAN_PLACES = [
  {
    id: 'votre_position',
    name: 'Votre position',
    description: 'Prise en charge à votre position GPS',
    type: 'current_location',
    icon: 'crosshairs-gps'
  },
  {
    id: 'domicile',
    name: 'Domicile',
    description: '918, Rue M60',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'saved',
    icon: 'home'
  },
  {
    id: 'groupe_itermi',
    name: 'Groupe Itermi',
    description: 'Quartier de la Djorabilité I, Cocody, Abidjan',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'business',
    icon: 'map-pin'
  },
  {
    id: 'rue_l125',
    name: 'Rue L125, 2166',
    description: 'Cocody, Abidjan',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'address',
    icon: 'map-pin'
  },
  {
    id: 'blvd_martyrs',
    name: 'Blvd des Martyrs 8303',
    description: 'Cocody, Abidjan',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'address',
    icon: 'map-pin'
  },
  {
    id: 'rue_l129',
    name: 'Rue L129, 107',
    description: 'Cocody, Abidjan',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'address',
    icon: 'map-pin'
  },
  {
    id: 'voie_djibi',
    name: 'Voie Djibi',
    description: 'Abidjan',
    commune: 'Yopougon',
    latitude: 5.3364,
    longitude: -4.0669,
    type: 'area',
    icon: 'map-pin'
  },
  {
    id: 'chawarma_plus',
    name: 'Chawarma+',
    description: 'Rue L156, Cocody, Abidjan',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'restaurant',
    icon: 'restaurant'
  },
  {
    id: 'rue_m2',
    name: 'Rue M2',
    description: 'Cocody, Abidjan',
    commune: 'Cocody',
    latitude: 5.3599,
    longitude: -3.9569,
    type: 'address',
    icon: 'map-pin'
  },
  {
    id: 'azito',
    name: 'Azito',
    description: 'Abidjan',
    commune: 'Yopougon',
    latitude: 5.3364,
    longitude: -4.0669,
    type: 'area',
    icon: 'map-pin'
  },
  {
    id: 'cinema_benin',
    name: 'Le Cinéma Benin',
    description: 'La commune Attécoubé, Rue I34, 514',
    commune: 'Attécoubé',
    latitude: 5.3164,
    longitude: -4.0269,
    type: 'entertainment',
    icon: 'film'
  }
]

// Catégories de colis
const PACKAGE_CATEGORIES = [
  { key: 'small', label: 'Petit colis', icon: '📦', description: 'Documents, bijoux, etc.' },
  { key: 'medium', label: 'Colis moyen', icon: '📋', description: 'Vêtements, livres, etc.' },
  { key: 'large', label: 'Gros colis', icon: '📺', description: 'Électronique, meuble, etc.' },
  { key: 'food', label: 'Nourriture', icon: '🍕', description: 'Repas, courses, etc.' },
  { key: 'fragile', label: 'Fragile', icon: '🍷', description: 'Verre, céramique, etc.' },
  { key: 'documents', label: 'Documents', icon: '📄', description: 'Papiers importants' }
]

// Tailles de colis
const PACKAGE_SIZES = [
  { key: 'xs', label: 'Très petit', dimensions: '< 20cm', weight: '< 1kg' },
  { key: 'small', label: 'Petit', dimensions: '20-30cm', weight: '1-3kg' },
  { key: 'medium', label: 'Moyen', dimensions: '30-50cm', weight: '3-10kg' },
  { key: 'large', label: 'Grand', dimensions: '50-80cm', weight: '10-25kg' },
  { key: 'xl', label: 'Très grand', dimensions: '> 80cm', weight: '> 25kg' }
]

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
    height: height * 0.3,
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
    minHeight: height * 0.7,
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

  // Address section avec style Google Maps
  addressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  addressInput: {
    flex: 1,
    marginLeft: 12,
  },

  addressInputIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  pickupIcon: {
    backgroundColor: COLORS.primary,
  },

  destinationIcon: {
    backgroundColor: COLORS.text,
  },

  addressInputContent: {
    flex: 1,
  },

  addressInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  addressInput: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text,
    paddingVertical: 4,
    minHeight: 24,
  },

  addressInputPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  // Position actuelle button
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },

  currentLocationText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },



  // Section des informations du colis
  packageSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },

  packageCategoriesContainer: {
    marginBottom: 20,
  },

  packageCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  packageCategoryItem: {
    width: (width - 64) / 2,
    margin: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  packageCategoryItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },

  packageCategoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  packageCategoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },

  packageCategoryDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Form inputs
  formGroup: {
    marginBottom: 20,
  },

  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },

  textInputFocused: {
    borderColor: COLORS.primary,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Package size selector
  packageSizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },

  packageSizeItem: {
    flex: 1,
    margin: 4,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 80,
  },

  packageSizeItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },

  packageSizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },

  packageSizeDimensions: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Switches
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  switchLabel: {
    flex: 1,
  },

  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },

  switchDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Delivery options modernisées
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

  // Styles pour les options recommandées
  deliveryOptionRecommended: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FFF4',
  },

  deliveryOptionIconRecommended: {
    backgroundColor: COLORS.success,
  },

  deliveryOptionTitleRecommended: {
    color: COLORS.success,
    fontWeight: '700',
  },

  deliveryOptionPriceRecommended: {
    color: COLORS.success,
    fontWeight: '800',
  },

  // Recipient section
  recipientSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
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

  // Distance indicator
  distanceIndicator: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },

  distanceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Styles pour les inputs d'adresse modernisés
  modernAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  addressIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  pickupIndicator: {
    backgroundColor: COLORS.primary,
  },

  destinationIndicator: {
    backgroundColor: COLORS.text,
  },

  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },

  addressInputWrapper: {
    flex: 1,
  },

  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  modernAddressInput: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  addressConnector: {
    paddingLeft: 12 + 24 / 2,
    marginBottom: 10,
  },

  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
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

// Fonction pour calculer le prix en fonction de la distance, poids, taille et type de véhicule
const calculateDynamicPrice = (
  distance: number, 
  vehicleType: string, 
  isUrgent: boolean,
  packageWeight: number = 1,
  packageSize: string = 'small'
): number => {
  let basePrice = 400 // Prix de base
  let pricePerKm = 50 // Prix par kilomètre

  // Ajustement selon le type de véhicule
  switch (vehicleType) {
    case 'moto':
      basePrice = 400
      pricePerKm = 50
      break
    case 'voiture':
      basePrice = 500
      pricePerKm = 75
      break
    case 'express':
      basePrice = 800
      pricePerKm = 100
      break
    case 'camion':
      basePrice = 1200
      pricePerKm = 150
      break
    default:
      basePrice = 400
      pricePerKm = 50
  }

  // Multiplicateur selon le poids
  let weightMultiplier = 1
  if (packageWeight > 25) {
    weightMultiplier = 2.0  // Très lourd
  } else if (packageWeight > 10) {
    weightMultiplier = 1.5  // Lourd
  } else if (packageWeight > 3) {
    weightMultiplier = 1.2  // Moyen
  }

  // Multiplicateur selon la taille
  let sizeMultiplier = 1
  switch (packageSize) {
    case 'xl':
      sizeMultiplier = 1.8
      break
    case 'large':
      sizeMultiplier = 1.5
      break
    case 'medium':
      sizeMultiplier = 1.2
      break
    case 'small':
      sizeMultiplier = 1.0
      break
    case 'xs':
      sizeMultiplier = 0.9
      break
  }

  // Multiplicateur pour la distance (livraisons inter-villes)
  let distanceMultiplier = 1
  if (distance > 100) { // Inter-villes
    distanceMultiplier = 2.0
  } else if (distance > 50) {
    distanceMultiplier = 1.5
  }

  const distancePrice = distance * pricePerKm * distanceMultiplier
  const urgentMultiplier = isUrgent ? 1.5 : 1

  return Math.round((basePrice + distancePrice) * weightMultiplier * sizeMultiplier * urgentMultiplier)
}

// Fonction pour recommander le type de véhicule selon poids et taille
const recommendVehicleType = (packageWeight: number, packageSize: string, distance: number): string => {
  // Pour les livraisons inter-villes (> 50km)
  if (distance > 50) {
    if (packageWeight > 25 || packageSize === 'xl') {
      return 'camion'
    }
    return 'voiture'
  }

  // Pour les livraisons urbaines
  if (packageWeight > 15 || packageSize === 'xl') {
    return 'camion'
  } else if (packageWeight > 5 || packageSize === 'large') {
    return 'voiture'
  } else {
    return 'moto'
  }
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

  // Form states
  const [packageType, setPackageType] = useState<string>('small')
  const [selectedPackageType, setSelectedPackageType] = useState<string>('small')
  const [packageSize, setPackageSize] = useState<string>('small')
  const [packageWeight, setPackageWeight] = useState<string>('')
  const [isFragile, setIsFragile] = useState<boolean>(false)
  const [isUrgent, setIsUrgent] = useState<boolean>(false)
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

  // UI states
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false)
  const [showMap, setShowMap] = useState<boolean>(false)
  const [weatherData, setWeatherData] = useState<Weather | null>(null)
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null)
  const [recommendedVehicle, setRecommendedVehicle] = useState<{
    type: VehicleType
    name: string
    reason: string
    priceMultiplier: number
  } | null>(null)

  // États pour l'autocomplétion
  const [pickupQuery, setPickupQuery] = useState<string>('')
  const [deliveryQuery, setDeliveryQuery] = useState<string>('')
  const [activeField, setActiveField] = useState<'pickup' | 'delivery' | null>(null)

  // États pour les options dynamiques
  const [deliveryOptions, setDeliveryOptions] = useState<any>(null)
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('moto')
  const [selectedSpeed, setSelectedSpeed] = useState<string>('')
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [totalPrice, setTotalPrice] = useState<number>(400)
  const [estimatedPrice, setEstimatedPrice] = useState(400)
  const [currentDistance, setCurrentDistance] = useState<number>(0)

  // Focus states pour les inputs
  const [pickupFocused, setPickupFocused] = useState<boolean>(false)
  const [deliveryFocused, setDeliveryFocused] = useState<boolean>(false)

  // Options de livraison dynamiques selon poids, taille et distance
  const modernDeliveryOptions = useMemo(() => {
    const weight = parseFloat(packageWeight) || 1
    const size = packageSize
    const distance = currentDistance

    const allOptions = [
      {
        key: 'moto',
        title: 'Livraison à moto',
        subtitle: '',
        icon: '🏍️',
        price: 400,
        time: '25-35 min',
```text
        maxWeight: 5,
        maxSize: 'small',
        suitable: weight <= 5 && ['xs', 'small'].includes(size) && distance <= 50
      },
      {
        key: 'voiture', 
        title: 'Livraison en voiture',
        subtitle: '',
        icon: '🚗',
        price: 500,
        time: '30-45 min',
        maxWeight: 15,
        maxSize: 'large',
        suitable: weight <= 15 && ['xs', 'small', 'medium', 'large'].includes(size)
      },
      {
        key: 'camion',
        title: 'Livraison par camion',
        subtitle: '',
        icon: '🚛',
        price: 1200,
        time: '45-60 min',
        maxWeight: 100,
        maxSize: 'xl',
        suitable: true // Toujours disponible pour gros colis
      },
      {
        key: 'express',
        title: 'Express Cargo',
        subtitle: '',
        icon: '⚡',
        price: 800,
        time: '15-25 min',
        maxWeight: 10,
        maxSize: 'medium',
        suitable: weight <= 10 && ['xs', 'small', 'medium'].includes(size) && distance <= 30
      }
    ]

    // Filtrer les options appropriées
    const suitableOptions = allOptions.filter(option => option.suitable)

    // Recommander le meilleur véhicule
    const recommendedVehicle = recommendVehicleType(weight, size, distance)

    return suitableOptions.map(option => {
      const calculatedPrice = calculateDynamicPrice(distance, option.key, isUrgent, weight, size)
      const isRecommended = option.key === recommendedVehicle

      return {
        ...option,
        price: calculatedPrice,
        subtitle: isRecommended 
          ? `🌟 Recommandé - ${calculatedPrice} F` 
          : `à partir de ${calculatedPrice} F`,
        recommended: isRecommended
      }
    })
  }, [currentDistance, isUrgent, packageWeight, packageSize])



  // Fonction pour utiliser la position actuelle
  const useCurrentLocation = async (field: 'pickup' | 'delivery') => {
    setLoadingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        showErrorAlert('Permission refusée', 'Nous avons besoin de votre localisation pour cette fonctionnalité')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      })

      let addressName = 'Position actuelle'
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        })
        if (reverseGeocode && reverseGeocode[0]) {
          const addr = reverseGeocode[0]
          addressName = `${addr.name || ''} ${addr.street || ''}, ${addr.city || addr.region || ''}`.trim()
        }
      } catch (error) {
        console.warn('Erreur lors du géocodage inverse:', error)
      }

      const currentLocationAddress: Address = {
        id: 'current_location',
        name: addressName,
        description: addressName,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        commune: 'Abidjan',
        type: 'current_location'
      }

      if (field === 'pickup') {
        setPickupAddress(addressName)
        setPickupQuery(addressName)
        setPickupLocation(currentLocationAddress)
        setShowPickupSuggestions(false)
      } else if (field === 'delivery') {
        setDeliveryAddress(addressName)
        setDeliveryQuery(addressName)
        setDeliveryLocation(currentLocationAddress)
        setShowDeliverySuggestions(false)
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.error('Erreur lors de la géolocalisation:', error)
      showErrorAlert('Erreur', 'Impossible de récupérer votre position')
    } finally {
      setLoadingLocation(false)
    }
  }

  // Gestion de la sélection d'une suggestion
  const handleSuggestionSelect = useCallback((address: Address, type: 'pickup' | 'delivery') => {
    if (type === 'pickup') {
      setPickupAddress(address.description)
      setPickupQuery(address.description)
      setPickupLocation(address)
      setPickupFocused(false)
    } else {
      setDeliveryAddress(address.description)
      setDeliveryQuery(address.description)
      setDeliveryLocation(address)
      setDeliveryFocused(false)
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  // Gestion du changement de texte
  const handleTextChange = useCallback((text: string, type: 'pickup' | 'delivery') => {
    if (type === 'pickup') {
      setPickupQuery(text)
      setPickupAddress(text)
      if (text.length === 0) {
        setPickupLocation(null)
      }
    } else {
      setDeliveryQuery(text)
      setDeliveryAddress(text)
      if (text.length === 0) {
        setDeliveryLocation(null)
      }
    }
  }, [])

  // Conservation de vos useEffect existants
  useEffect(() => {
    if (params?.searchQuery) {
      setPickupAddress(params.searchQuery)
      setPickupQuery(params.searchQuery)
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
      const distance = calculateDistance(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
      )
      setCurrentDistance(distance)
      calculatePriceEstimate()
      fetchWeatherData()
    }
  }, [pickupLocation, deliveryLocation, packageType, selectedVehicleType, selectedSpeed, selectedExtras, isUrgent])

  // Conservation de toutes vos fonctions existantes
  const calculatePriceEstimate = async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      const distance = calculateDistance(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
      )

      const weight = parseFloat(packageWeight) || 1

      // Utiliser le calcul dynamique local avec poids et taille
      const calculatedPrice = calculateDynamicPrice(distance, selectedVehicleType, isUrgent, weight, packageSize)

      setTotalPrice(calculatedPrice)
      setRecommendedPrice(calculatedPrice)
      setProposedPrice(calculatedPrice.toString())
      setEstimatedPrice(calculatedPrice)
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

  const handleDeliverySelection = (option: any) => {
    setSelectedVehicleType(option.key)
    setEstimatedPrice(option.price)
    setTotalPrice(option.price)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handlePackageCategorySelect = (category: string) => {
    setPackageType(category)
    setSelectedPackageType(category)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handlePackageSizeSelect = (size: string) => {
    setPackageSize(size)
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
      proposed_price: parseFloat(proposedPrice) || estimatedPrice,
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
    return true
  }

  const renderPackageCategory = (category: any) => (
    <TouchableOpacity
      key={category.key}
      style={[
        styles.packageCategoryItem,
        selectedPackageType === category.key && styles.packageCategoryItemSelected
      ]}
      onPress={() => handlePackageCategorySelect(category.key)}
      activeOpacity={0.8}
    >
      <Text style={styles.packageCategoryIcon}>{category.icon}</Text>
      <Text style={styles.packageCategoryLabel}>{category.label}</Text>
      <Text style={styles.packageCategoryDescription}>{category.description}</Text>
    </TouchableOpacity>
  )

  const renderPackageSize = (size: any) => (
    <TouchableOpacity
      key={size.key}
      style={[
        styles.packageSizeItem,
        packageSize === size.key && styles.packageSizeItemSelected
      ]}
      onPress={() => handlePackageSizeSelect(size.key)}
      activeOpacity={0.8}
    >
      <Text style={styles.packageSizeLabel}>{size.label}</Text>
      <Text style={styles.packageSizeDimensions}>{size.dimensions}</Text>
      <Text style={styles.packageSizeDimensions}>{size.weight}</Text>
    </TouchableOpacity>
  )

  const renderDeliveryOption = (option: any) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.deliveryOptionCard,
        selectedVehicleType === option.key && styles.deliveryOptionCardSelected,
        option.recommended && styles.deliveryOptionRecommended
      ]}
      onPress={() => handleDeliverySelection(option)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.deliveryOptionIcon,
        selectedVehicleType === option.key && styles.deliveryOptionIconSelected,
        option.recommended && styles.deliveryOptionIconRecommended
      ]}>
        <Text style={{ fontSize: 28 }}>{option.icon}</Text>
      </View>
      <View style={styles.deliveryOptionInfo}>
        <Text style={[
          styles.deliveryOptionTitle,
          option.recommended && styles.deliveryOptionTitleRecommended
        ]}>
          {option.title}
          {option.recommended && ' ⭐'}
        </Text>
        <Text style={styles.deliveryOptionSubtitle}>{option.subtitle}</Text>
        {option.time && (
          <Text style={[styles.deliveryOptionSubtitle, { marginTop: 2, fontSize: 12 }]}>
            ⏱️ {option.time}
          </Text>
        )}
        {option.maxWeight && (
          <Text style={[styles.deliveryOptionSubtitle, { marginTop: 2, fontSize: 11, color: '#999' }]}>
            Max: {option.maxWeight}kg, Taille {option.maxSize}
          </Text>
        )}
      </View>
      <Text style={[
        styles.deliveryOptionPrice,
        option.recommended && styles.deliveryOptionPriceRecommended
      ]}>
        {formatPrice(option.price)}
      </Text>
    </TouchableOpacity>
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Map Section avec overlay navigation */}
        <View style={styles.mapContainer}>
          <MapView
            pickupLocation={pickupLocation}
            deliveryLocation={deliveryLocation}
            style={{ flex: 1 }}
            showRoute={!!(pickupLocation && deliveryLocation)}
          />

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

          {/* Address Inputs modernes comme sur la capture */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Adresses de livraison</Text>

            {/* Pickup Address avec design moderne */}
            <AddressAutocomplete
              label="Prise en charge"
              value={pickupQuery}
              onChangeText={(text) => handleTextChange(text, 'pickup')}
              onAddressSelect={(address) => handleSuggestionSelect(address, 'pickup')}
              placeholder="Adresse de prise en charge"
              showCurrentLocation={true}
              maxSuggestions={8}
              icon="box"
              onFocus={() => {
                setPickupFocused(true)
                setActiveField('pickup')
              }}
              style={{ marginBottom: 16 }}
            />

            {/* Delivery Address avec design moderne */}
            <AddressAutocomplete
              label="Destination"
              value={deliveryQuery}
              onChangeText={(text) => handleTextChange(text, 'delivery')}
              onAddressSelect={(address) => handleSuggestionSelect(address, 'delivery')}
              placeholder="Adresse de livraison"
              showCurrentLocation={true}
              maxSuggestions={8}
              icon="compass"
              onFocus={() => {
                setDeliveryFocused(true)
                setActiveField('delivery')
              }}
              style={{ marginBottom: 16 }}
            />

            {/* Distance indicator */}
            {pickupLocation && deliveryLocation && (
              <View style={styles.distanceIndicator}>
                <Text style={styles.distanceText}>
                  Distance: {formatDistance(currentDistance)}
                </Text>
              </View>
            )}
          </View>

          {/* Package Information Section */}
          <View style={styles.packageSection}>
            <Text style={styles.sectionTitle}>Informations du colis</Text>

            {/* Package Categories */}
            <View style={styles.packageCategoriesContainer}>
              <Text style={styles.formLabel}>Type de colis</Text>
              <View style={styles.packageCategoriesGrid}>
                {PACKAGE_CATEGORIES.map(renderPackageCategory)}
              </View>
            </View>

            {/* Package Size */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Taille du colis</Text>
              <View style={styles.packageSizeContainer}>
                {PACKAGE_SIZES.map(renderPackageSize)}
              </View>
            </View>

            {/* Package Weight */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Poids estimé (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={packageWeight}
                onChangeText={setPackageWeight}
                placeholder="Ex: 2.5"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Package Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description du colis</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={packageDescription}
                onChangeText={setPackageDescription}
                placeholder="Décrivez le contenu du colis..."
                multiline
                numberOfLines={3}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Fragile Switch */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchTitle}>Colis fragile</Text>
                <Text style={styles.switchDescription}>Manipulation délicate requise</Text>
              </View>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={isFragile ? COLORS.primary : COLORS.textLight}
              />
            </View>

            {/* Urgent Switch */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchTitle}>Livraison urgente</Text>
                <Text style={styles.switchDescription}>Livraison prioritaire (+50% sur le prix)</Text>
              </View>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={isUrgent ? COLORS.primary : COLORS.textLight}
              />
            </View>
          </View>

          {/* Recipient Information Section */}
          <View style={styles.recipientSection}>
            <Text style={styles.sectionTitle}>Informations du destinataire</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nom du destinataire *</Text>
              <TextInput
                style={styles.textInput}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Nom complet du destinataire"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Téléphone du destinataire</Text>
              <TextInput
                style={styles.textInput}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                placeholder="+225 XX XX XX XX XX"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Instructions spéciales</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder="Instructions pour le livreur..."
                multiline
                numberOfLines={2}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Proposed Price */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Prix proposé (F CFA)</Text>
              <TextInput
                style={styles.textInput}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                placeholder={`Prix recommandé: ${estimatedPrice} F`}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Delivery Options modernisées avec calcul dynamique */}
          <View style={styles.deliveryOptionsSection}>
            <Text style={styles.sectionTitle}>Options de livraison</Text>
            {modernDeliveryOptions.map(renderDeliveryOption)}
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!pickupAddress || !deliveryAddress || !selectedVehicleType || !recipientName) && styles.actionButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!pickupAddress || !deliveryAddress || !selectedVehicleType || !recipientName || loading}
        >
          <Text style={styles.actionButtonText}>
            Créer la livraison - {formatPrice(estimatedPrice)}
          </Text>
        </TouchableOpacity>
      </View>

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