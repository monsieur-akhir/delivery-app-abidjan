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
  overlay: 'rgba(0, 0, 0, 0.4)'
}

// Styles modernes
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header moderne
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
  
  // Map container
  mapContainer: {
    height: height * 0.4,
    backgroundColor: COLORS.backgroundSecondary,
    position: 'relative',
  },
  
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8',
  },
  
  mapOverlay: {
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  mapOverlayIcon: {
    marginRight: 12,
  },
  
  mapOverlayText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  
  priceIndicator: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  
  priceText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Bottom sheet
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
    maxHeight: height * 0.7,
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  
  // Address inputs
  addressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  
  addressInputIcon: {
    marginRight: 12,
  },
  
  addressInputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  
  addressInputPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // Delivery options
  deliveryOptionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  
  deliveryOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  deliveryOptionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  
  deliveryOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: '600',
    color: COLORS.text,
  },
  
  // Special features section
  specialFeaturesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  specialFeatureCard: {
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  
  specialFeatureText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Action button
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
    paddingVertical: 16,
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
    maxHeight: height * 0.9,
  },
  
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  
  // Package types
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
    padding: 12,
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
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
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
  const { t } = useTranslation()

  // State management
  const [pickupAddress, setPickupAddress] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [pickupLocation, setPickupLocation] = useState<Address | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<Address | null>(null)
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('moto')
  const [estimatedPrice, setEstimatedPrice] = useState(400)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [selectedPackageType, setSelectedPackageType] = useState('')
  const [loading, setLoading] = useState(false)

  // Delivery options
  const deliveryOptions = [
    {
      key: 'moto',
      title: 'Livraison à moto',
      subtitle: 'à partir de 400 F',
      icon: 'motorcycle',
      price: 400,
      image: '🏍️'
    },
    {
      key: 'voiture', 
      title: 'Livraison en voiture',
      subtitle: 'à partir de 500 F',
      icon: 'car',
      price: 500,
      image: '🚗'
    },
    {
      key: 'express',
      title: 'Express Cargo',
      subtitle: 'à partir de 3100 F',
      icon: 'truck',
      price: 3100,
      image: '🚛'
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

  const handleDeliverySelection = (option: any) => {
    setSelectedDeliveryType(option.key)
    setEstimatedPrice(option.price)
  }

  const handleCreateDelivery = async () => {
    if (!pickupAddress || !deliveryAddress || !selectedDeliveryType) {
      return
    }

    setLoading(true)
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Navigation vers écran de suivi
      navigation.navigate('TrackDelivery', { deliveryId: 'DEL123' })
    } catch (error) {
      console.error('Erreur création livraison:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderDeliveryOption = (option: any) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.deliveryOptionCard,
        selectedDeliveryType === option.key && styles.deliveryOptionCardSelected
      ]}
      onPress={() => handleDeliverySelection(option)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.deliveryOptionIcon,
        selectedDeliveryType === option.key && styles.deliveryOptionIconSelected
      ]}>
        <Text style={{ fontSize: 24 }}>{option.image}</Text>
      </View>
      <View style={styles.deliveryOptionInfo}>
        <Text style={styles.deliveryOptionTitle}>{option.title}</Text>
        <Text style={styles.deliveryOptionSubtitle}>{option.subtitle}</Text>
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
          <Text style={styles.bottomSheetTitle}>Type de colis</Text>
          
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
                  setShowPackageModal(false)
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
          <Feather name="more-horizontal" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          {pickupLocation && deliveryLocation ? (
            <MapView
              pickupLocation={pickupLocation}
              deliveryLocation={deliveryLocation}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={{ color: COLORS.textSecondary }}>Carte interactive</Text>
            </View>
          )}
          
          {/* Map Overlay */}
          <View style={styles.mapOverlay}>
            <View style={styles.mapOverlayIcon}>
              <Feather name="navigation" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.mapOverlayText}>
              {pickupAddress || 'Sélectionner une adresse'}
            </Text>
            <View style={styles.priceIndicator}>
              <Text style={styles.priceText}>F {estimatedPrice}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>ENVOYER UN COLIS</Text>

          {/* Address Inputs */}
          <View style={styles.addressSection}>
            <AddressAutocomplete
              label="Adresse de ramassage"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={(address) => {
                setPickupLocation(address)
                setPickupAddress(address.description)
              }}
              placeholder="Où doit-on récupérer le colis ?"
            />
            
            <AddressAutocomplete
              label="Adresse de livraison"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              onAddressSelect={(address) => {
                setDeliveryLocation(address)
                setDeliveryAddress(address.description)
              }}
              placeholder="Où doit-on livrer le colis ?"
            />
          </View>

          {/* Delivery Options */}
          <View style={styles.deliveryOptionsSection}>
            {deliveryOptions.map(renderDeliveryOption)}
          </View>

          {/* Special Features */}
          <View style={styles.specialFeaturesSection}>
            <TouchableOpacity style={styles.specialFeatureCard}>
              <Text style={styles.specialFeatureText}>
                💰 Gagnez du temps et récupérez vos achats avec la Livraison
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!pickupAddress || !deliveryAddress || !selectedDeliveryType) && styles.actionButtonDisabled
          ]}
          onPress={handleCreateDelivery}
          disabled={!pickupAddress || !deliveryAddress || !selectedDeliveryType}
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
    </SafeAreaView>
  )
}

export default CreateDeliveryScreen
