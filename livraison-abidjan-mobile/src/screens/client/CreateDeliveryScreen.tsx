
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
  Haptic,
  LayoutAnimation
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Chip, Divider, ProgressBar, Surface } from 'react-native-paper'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
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

const { width } = Dimensions.get('window')
const COLORS = {
  primary: '#FF6B00',
  primaryLight: '#FF8A33',
  primaryDark: '#E55A00',
  secondary: '#FFF6ED',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6C757D',
  border: '#E9ECEF',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  shadow: 'rgba(0, 0, 0, 0.1)'
}

// Animation configurations
const animationConfig = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
}

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

const hapticFeedback = () => {
  if (Platform.OS === 'ios') {
    Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Medium)
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

// Enhanced Icon Component
const EnhancedIcon: React.FC<{
  name: string
  size?: number
  color?: string
  animated?: boolean
}> = ({ name, size = 24, color = COLORS.primary, animated = false }) => {
  const animatedValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      )
      animation.start()
      return () => animation.stop()
    }
  }, [animated, animatedValue])

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'package': <Feather name="package" size={size} color={color} />,
      'alert-triangle': <Feather name="alert-triangle" size={size} color={color} />,
      'coffee': <MaterialCommunityIcons name="coffee" size={size} color={color} />,
      'file-text': <Feather name="file-text" size={size} color={color} />,
      'motorcycle': <MaterialCommunityIcons name="motorbike" size={size} color={color} />,
      'car': <Feather name="truck" size={size} color={color} />,
      'bus': <Ionicons name="bus" size={size} color={color} />,
      'clock': <Feather name="clock" size={size} color={color} />,
      'flash': <Ionicons name="flash" size={size} color={color} />,
      'thermometer': <Feather name="thermometer" size={size} color={color} />,
      'default': <Ionicons name={iconName as any} size={size} color={color} />
    }
    return iconMap[iconName] || iconMap['default']
  }

  if (animated) {
    return (
      <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
        {getIcon(name)}
      </Animated.View>
    )
  }

  return getIcon(name)
}

// Progress Step Component
const ProgressStep: React.FC<{
  currentStep: number
  totalSteps: number
}> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.progressContainer}>
      <ProgressBar
        progress={currentStep / totalSteps}
        color={COLORS.primary}
        style={styles.progressBar}
      />
      <Text style={styles.progressText}>
        Étape {currentStep} sur {totalSteps}
      </Text>
    </View>
  )
}

// Enhanced Selection Card
const SelectionCard: React.FC<{
  title: string
  subtitle?: string
  icon: string
  selected: boolean
  onPress: () => void
  disabled?: boolean
  price?: string
  animated?: boolean
}> = ({ title, subtitle, icon, selected, onPress, disabled = false, price, animated = false }) => {
  const animatedValue = useRef(new Animated.Value(0)).current
  const scaleValue = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [selected, animatedValue])

  const handlePress = () => {
    if (disabled) return
    
    hapticFeedback()
    
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
    
    onPress()
  }

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.white, COLORS.primary],
  })

  const textColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.text, COLORS.white],
  })

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.selectionCardContainer, disabled && styles.disabledCard]}
    >
      <Animated.View
        style={[
          styles.selectionCard,
          {
            backgroundColor,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <EnhancedIcon
          name={icon}
          size={32}
          color={selected ? COLORS.white : COLORS.primary}
          animated={animated && selected}
        />
        <Animated.Text style={[styles.selectionCardTitle, { color: textColor }]}>
          {title}
        </Animated.Text>
        {subtitle && (
          <Animated.Text style={[styles.selectionCardSubtitle, { color: textColor }]}>
            {subtitle}
          </Animated.Text>
        )}
        {price && (
          <Animated.Text style={[styles.selectionCardPrice, { color: textColor }]}>
            {price}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  )
}

// Enhanced Input Component
const EnhancedInput: React.FC<{
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  multiline?: boolean
  numberOfLines?: number
  keyboardType?: 'default' | 'numeric' | 'phone-pad'
  error?: string
  required?: boolean
}> = ({ label, value, onChangeText, placeholder, multiline = false, numberOfLines = 1, keyboardType = 'default', error, required = false }) => {
  const [focused, setFocused] = useState(false)
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: focused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [focused, value, animatedValue])

  const labelStyle = {
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [COLORS.textSecondary, focused ? COLORS.primary : COLORS.text],
    }),
  }

  return (
    <View style={styles.inputContainer}>
      <Animated.Text style={[styles.inputLabel, labelStyle]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Animated.Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={focused ? '' : placeholder}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.textArea,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
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

  // Enhanced state management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Form states with validation
  const [formData, setFormData] = useState({
    packageType: 'small',
    packageSize: 'small',
    packageWeight: '',
    isFragile: false,
    pickupAddress: '',
    deliveryAddress: '',
    proposedPrice: '',
    packageDescription: '',
    specialInstructions: '',
    recipientName: '',
    recipientPhone: '',
    selectedVehicleType: '',
    selectedSpeed: '',
    selectedExtras: [] as string[],
  })

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [pickupLocation, setPickupLocation] = useState<Address | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)
  const [deliveryOptions, setDeliveryOptions] = useState<any>(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [weatherData, setWeatherData] = useState<Weather | null>(null)
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  // Package types configuration
  const packageTypes = useMemo(() => [
    { key: 'small', label: 'Petit colis', icon: 'package', description: 'Jusqu\'à 5kg' },
    { key: 'medium', label: 'Colis moyen', icon: 'package', description: '5-15kg' },
    { key: 'large', label: 'Gros colis', icon: 'package', description: '15-30kg' },
    { key: 'fragile', label: 'Fragile', icon: 'alert-triangle', description: 'Manipulation délicate' },
    { key: 'food', label: 'Nourriture', icon: 'coffee', description: 'Produits alimentaires' },
    { key: 'documents', label: 'Documents', icon: 'file-text', description: 'Papiers importants' }
  ], [])

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, slideAnim])

  // Handle route params
  useEffect(() => {
    if (params?.searchQuery) {
      setFormData(prev => ({ ...prev, pickupAddress: params.searchQuery }))
    }
  }, [params])

  // Load delivery options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await api.get('/api/deliveries/options')
        setDeliveryOptions(response.data)
      } catch (error) {
        console.warn('Erreur lors du chargement des options:', error)
        // Fallback data
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

  // Calculate price when dependencies change
  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      calculatePriceEstimate()
      fetchWeatherData()
    }
  }, [pickupLocation, deliveryLocation, formData.selectedVehicleType, formData.selectedSpeed, formData.selectedExtras])

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: {[key: string]: string} = {}

    if (!formData.pickupAddress.trim()) {
      errors.pickupAddress = 'Adresse de ramassage requise'
    }
    if (!formData.deliveryAddress.trim()) {
      errors.deliveryAddress = 'Adresse de livraison requise'
    }
    if (!pickupLocation) {
      errors.pickupLocation = 'Veuillez sélectionner une adresse de ramassage valide'
    }
    if (!deliveryLocation) {
      errors.deliveryLocation = 'Veuillez sélectionner une adresse de livraison valide'
    }
    if (!formData.recipientName.trim()) {
      errors.recipientName = 'Nom du destinataire requis'
    }
    if (!formData.proposedPrice || parseFloat(formData.proposedPrice) <= 0) {
      errors.proposedPrice = 'Prix valide requis'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, pickupLocation, deliveryLocation])

  const calculatePriceEstimate = async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      const distance = calculateDistance(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
      )

      const estimateData = {
        pickup_address: formData.pickupAddress,
        delivery_address: formData.deliveryAddress,
        pickup_lat: pickupLocation.latitude,
        pickup_lng: pickupLocation.longitude,
        delivery_lat: deliveryLocation.latitude,
        delivery_lng: deliveryLocation.longitude,
        package_type: formData.packageType,
        proposed_price: 0,
        recipient_name: '',
        distance: distance
      }

      await getPriceEstimate(estimateData)

      if (estimate) {
        let basePrice = estimate.estimated_price
        
        if (formData.selectedVehicleType && deliveryOptions?.vehicle_types) {
          const vehicle = deliveryOptions.vehicle_types.find((v: any) => v.type === formData.selectedVehicleType)
          if (vehicle) {
            basePrice = Math.max(basePrice, vehicle.min_price)
          }
        }

        if (formData.selectedSpeed && deliveryOptions?.delivery_speeds) {
          const speed = deliveryOptions.delivery_speeds.find((s: any) => s.key === formData.selectedSpeed)
          if (speed) {
            basePrice = Math.max(basePrice, speed.min_price)
          }
        }

        let extrasCost = 0
        if (formData.selectedExtras.length > 0 && deliveryOptions?.extras) {
          formData.selectedExtras.forEach(extraKey => {
            const extra = deliveryOptions.extras.find((e: any) => e.key === extraKey)
            if (extra) {
              extrasCost += extra.price
            }
          })
        }

        const finalPrice = basePrice + extrasCost
        setTotalPrice(finalPrice)
        setRecommendedPrice(finalPrice)
        setFormData(prev => ({ ...prev, proposedPrice: finalPrice.toString() }))
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

  const updateFormData = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear error when user starts typing
    if (formErrors[key]) {
      setFormErrors(prev => ({ ...prev, [key]: '' }))
    }
  }, [formErrors])

  const handleAddressSelect = useCallback((address: any, type: 'pickup' | 'delivery') => {
    LayoutAnimation.configureNext(animationConfig)
    
    if (type === 'pickup') {
      setPickupLocation(address)
      updateFormData('pickupAddress', address.description)
    } else {
      setDeliveryLocation(address)
      updateFormData('deliveryAddress', address.description)
    }
  }, [updateFormData])

  const toggleExtra = useCallback((extraKey: string) => {
    hapticFeedback()
    
    setFormData(prev => ({
      ...prev,
      selectedExtras: prev.selectedExtras.includes(extraKey)
        ? prev.selectedExtras.filter(k => k !== extraKey)
        : [...prev.selectedExtras, extraKey]
    }))
  }, [])

  const handleSubmit = async () => {
    if (!validateForm()) {
      showErrorAlert('Formulaire incomplet', 'Veuillez corriger les erreurs avant de continuer')
      return
    }

    setLoading(true)
    hapticFeedback()

    const payload: DeliveryCreateRequest = {
      pickup_address: formData.pickupAddress,
      pickup_commune: extractCommune(formData.pickupAddress),
      pickup_lat: pickupLocation!.latitude,
      pickup_lng: pickupLocation!.longitude,
      delivery_address: formData.deliveryAddress,
      delivery_commune: extractCommune(formData.deliveryAddress),
      delivery_lat: deliveryLocation!.latitude,
      delivery_lng: deliveryLocation!.longitude,
      package_type: formData.packageType,
      package_description: formData.packageDescription,
      package_size: formData.packageSize,
      package_weight: parseFloat(formData.packageWeight) || 1,
      is_fragile: formData.isFragile,
      proposed_price: parseFloat(formData.proposedPrice),
      recipient_name: formData.recipientName,
      recipient_phone: formData.recipientPhone,
      special_instructions: formData.specialInstructions,
      distance: calculateDistance(
        { latitude: pickupLocation!.latitude, longitude: pickupLocation!.longitude },
        { latitude: deliveryLocation!.latitude, longitude: deliveryLocation!.longitude }
      ),
      weather_conditions: weatherData?.current?.condition || 'clear',
      vehicle_type: formData.selectedVehicleType,
      delivery_speed: formData.selectedSpeed,
      extras: formData.selectedExtras
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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      LayoutAnimation.configureNext(animationConfig)
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      LayoutAnimation.configureNext(animationConfig)
      setCurrentStep(prev => prev - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderAddressStep()
      case 2:
        return renderDeliveryOptionsStep()
      case 3:
        return renderPackageInfoStep()
      case 4:
        return renderRecipientStep()
      default:
        return renderAddressStep()
    }
  }

  const renderAddressStep = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>Adresses</Text>
      
      <AddressAutocomplete
        label="Adresse de ramassage"
        value={formData.pickupAddress}
        onChangeText={(text) => updateFormData('pickupAddress', text)}
        onAddressSelect={(address) => handleAddressSelect(address, 'pickup')}
        placeholder="Où récupérer le colis ?"
        style={styles.addressInput}
        error={formErrors.pickupAddress}
      />

      <AddressAutocomplete
        label="Adresse de livraison"
        value={formData.deliveryAddress}
        onChangeText={(text) => updateFormData('deliveryAddress', text)}
        onAddressSelect={(address) => handleAddressSelect(address, 'delivery')}
        placeholder="Où livrer le colis ?"
        style={styles.addressInput}
        error={formErrors.deliveryAddress}
      />
    </Card>
  )

  const renderDeliveryOptionsStep = () => (
    <>
      {deliveryOptions?.vehicle_types && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Types de livraison</Text>
          <View style={styles.selectionGrid}>
            {deliveryOptions.vehicle_types.map((option: any, index: number) => (
              <SelectionCard
                key={option.type}
                title={option.label}
                subtitle={`${formatPrice(option.min_price)}`}
                icon={option.icon}
                selected={formData.selectedVehicleType === option.type}
                onPress={() => updateFormData('selectedVehicleType', option.type)}
                animated={index === 0}
              />
            ))}
          </View>
        </Card>
      )}

      {deliveryOptions?.delivery_speeds && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Délais</Text>
          <View style={styles.selectionRow}>
            {deliveryOptions.delivery_speeds.map((speed: any) => (
              <SelectionCard
                key={speed.key}
                title={speed.label}
                subtitle={speed.delay}
                icon={speed.icon}
                selected={formData.selectedSpeed === speed.key}
                onPress={() => updateFormData('selectedSpeed', speed.key)}
              />
            ))}
          </View>
        </Card>
      )}

      {deliveryOptions?.extras && (
        <Card style={styles.stepCard}>
          <Text style={styles.stepTitle}>Options supplémentaires</Text>
          {deliveryOptions.extras.map((extra: any) => (
            <View key={extra.key} style={styles.extraOption}>
              <TouchableOpacity
                style={styles.extraOptionContent}
                onPress={() => toggleExtra(extra.key)}
              >
                <View style={styles.extraInfo}>
                  <EnhancedIcon name={extra.icon} size={20} />
                  <Text style={styles.extraLabel}>{extra.label}</Text>
                  {extra.price > 0 && (
                    <Text style={styles.extraPrice}>+{formatPrice(extra.price)}</Text>
                  )}
                </View>
                <Switch
                  value={formData.selectedExtras.includes(extra.key)}
                  onValueChange={() => toggleExtra(extra.key)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}
    </>
  )

  const renderPackageInfoStep = () => (
    <Card style={styles.stepCard}>
      <Text style={styles.stepTitle}>Informations du colis</Text>
      
      <View style={styles.selectionGrid}>
        {packageTypes.map((type) => (
          <SelectionCard
            key={type.key}
            title={type.label}
            subtitle={type.description}
            icon={type.icon}
            selected={formData.packageType === type.key}
            onPress={() => updateFormData('packageType', type.key)}
          />
        ))}
      </View>

      <View style={styles.inputRow}>
        <EnhancedInput
          label="Poids"
          value={formData.packageWeight}
          onChangeText={(text) => updateFormData('packageWeight', text)}
          placeholder="Poids en kg"
          keyboardType="numeric"
        />
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Fragile</Text>
          <Switch
            value={formData.isFragile}
            onValueChange={(value) => updateFormData('isFragile', value)}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      <EnhancedInput
        label="Description du colis"
        value={formData.packageDescription}
        onChangeText={(text) => updateFormData('packageDescription', text)}
        placeholder="Décrivez le contenu du colis"
        multiline
        numberOfLines={3}
      />
    </Card>
  )

  const renderRecipientStep = () => (
    <>
      <Card style={styles.stepCard}>
        <Text style={styles.stepTitle}>Destinataire</Text>
        
        <EnhancedInput
          label="Nom du destinataire"
          value={formData.recipientName}
          onChangeText={(text) => updateFormData('recipientName', text)}
          placeholder="Nom complet"
          error={formErrors.recipientName}
          required
        />

        <EnhancedInput
          label="Téléphone"
          value={formData.recipientPhone}
          onChangeText={(text) => updateFormData('recipientPhone', text)}
          placeholder="Numéro de téléphone (optionnel)"
          keyboardType="phone-pad"
        />

        <EnhancedInput
          label="Instructions spéciales"
          value={formData.specialInstructions}
          onChangeText={(text) => updateFormData('specialInstructions', text)}
          placeholder="Instructions pour le livreur"
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card style={styles.stepCard}>
        <Text style={styles.stepTitle}>Prix et validation</Text>
        
        {totalPrice > 0 && (
          <Surface style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix total estimé</Text>
            <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
          </Surface>
        )}

        <EnhancedInput
          label="Prix que vous proposez"
          value={formData.proposedPrice}
          onChangeText={(text) => updateFormData('proposedPrice', text)}
          placeholder="Montant en FCFA"
          keyboardType="numeric"
          error={formErrors.proposedPrice}
          required
        />
      </Card>
    </>
  )

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle livraison</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Progress */}
        <ProgressStep currentStep={currentStep} totalSteps={totalSteps} />

        {/* Content */}
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </Animated.ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={prevStep} style={styles.navButton}>
              <Text style={styles.navButtonText}>Précédent</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navButtonSpacer} />
          
          {currentStep < totalSteps ? (
            <TouchableOpacity onPress={nextStep} style={[styles.navButton, styles.navButtonPrimary]}>
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Suivant</Text>
            </TouchableOpacity>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              Créer la livraison
            </Button>
          )}
        </View>
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
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stepCard: {
    margin: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  addressInput: {
    marginBottom: 16,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectionCardContainer: {
    width: '48%',
  },
  selectionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  disabledCard: {
    opacity: 0.5,
  },
  selectionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectionCardSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  selectionCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  extraOption: {
    marginBottom: 16,
  },
  extraOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  extraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  extraLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  extraPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.text,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  switchContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  navButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  navButtonTextPrimary: {
    color: COLORS.white,
  },
  navButtonSpacer: {
    flex: 1,
  },
  submitButton: {
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  submitButtonContent: {
    height: 50,
  },
  submitButtonLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
})

export default CreateDeliveryScreen
