Applying the changes will enhance the CreateDeliveryScreen component with improved autocompletion, a Yango/Uber-style map, and an enhanced user interface.
```

```replit_final_file
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar
} from 'react-native'
import {
  Text,
  TextInput,
  Button,
  Divider,
  Chip,
  HelperText,
  Snackbar,
  IconButton,
  Surface,
  Card
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import MapView, { Marker, Polyline } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useNetwork } from '../../contexts/NetworkContext'
import { useDelivery } from '../../hooks'
import {
  geocodeAddress,
  getRecommendedPrice,
  getVehicleRecommendation,
  getWeatherData,
  getDirections,
  getTrafficInfo
} from '../../services/api'
import { formatPrice } from '../../utils/formatters'
import AddressAutocomplete, { Address } from '../../components/AddressAutocomplete'
import CustomMapView from '../../components/MapView'
import WeatherInfo from '../../components/WeatherInfo'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'
import { Weather, CargoCategory, VehicleType } from '../../types/models'

const { width, height } = Dimensions.get('window')

type CreateDeliveryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateDelivery'>
}

type PackageSize = 'small' | 'medium' | 'large'
type PackageType = 'document' | 'food' | 'clothing' | 'electronics' | 'other'

interface RouteInfo {
  distance: number
  duration: number
  coordinates: { latitude: number; longitude: number }[]
  trafficLevel: 'low' | 'moderate' | 'high' | 'severe'
}

const CreateDeliveryScreen: React.FC<CreateDeliveryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { isConnected, addPendingUpload } = useNetwork()
  const mapRef = useRef<MapView | null>(null)

  const { createDelivery: submitDeliveryData, loading: deliveryLoading } = useDelivery()

  // États pour les adresses
  const [pickupAddress, setPickupAddress] = useState<string>('')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [pickupLocation, setPickupLocation] = useState<Address | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<Address | null>(null)

  // États pour les détails de livraison
  const [recipientName, setRecipientName] = useState<string>('')
  const [recipientPhone, setRecipientPhone] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [packageSize, setPackageSize] = useState<PackageSize>('medium')
  const [packageType, setPackageType] = useState<PackageType | ''>('')
  const [cargoCategory, setCargoCategory] = useState<CargoCategory | ''>('')
  const [isFragile, setIsFragile] = useState<boolean>(false)
  const [isUrgent, setIsUrgent] = useState<boolean>(false)
  const [proposedPrice, setProposedPrice] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // États pour les calculs et affichage
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  const [weatherData, setWeatherData] = useState<Weather | null>(null)
  const [recommendedVehicle, setRecommendedVehicle] = useState<{
    type: VehicleType
    name: string
    reason: string
    priceMultiplier: number
  } | null>(null)

  // États UI
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [visible, setVisible] = useState<boolean>(false)
  const [showMapFullscreen, setShowMapFullscreen] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<'addresses' | 'details' | 'review'>(
    'addresses'
  )

  const vehicleTypes = [
    { value: 'motorcycle', label: 'Moto', icon: 'motorcycle', color: '#FF6B00' },
    { value: 'bicycle', label: 'Vélo', icon: 'bicycle', color: '#4CAF50' },
    { value: 'car', label: 'Voiture', icon: 'car-sport', color: '#2196F3' },
    { value: 'van', label: 'Camionnette', icon: 'car', color: '#9C27B0' }
  ]

  const packageSizes = [
    { value: 'small', label: 'Petit', icon: 'cube-outline', description: 'Enveloppe, document' },
    {
      value: 'medium',
      label: 'Moyen',
      icon: 'gift-outline',
      description: 'Sac, boîte moyenne'
    },
    { value: 'large', label: 'Grand', icon: 'archive-outline', description: 'Gros colis, valise' }
  ]

  // Calculer la route quand les deux adresses sont définies
  useEffect(() => {
    const calculateRoute = async () => {
      if (!pickupLocation || !deliveryLocation) {
        setRouteInfo(null)
        return
      }

      try {
        setLoading(true)

        // Calculer les directions
        const directions = await getDirections(
          pickupLocation.latitude,
          pickupLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude
        )

        // Obtenir les infos de trafic
        const traffic = await getTrafficInfo(
          pickupLocation.latitude,
          pickupLocation.longitude,
          deliveryLocation.latitude,
          deliveryLocation.longitude
        )

        const route: RouteInfo = {
          distance: directions.distance / 1000, // en km
          duration: directions.duration / 60, // en minutes
          coordinates: directions.coordinates || [],
          trafficLevel:
            traffic.duration > directions.duration * 1.5
              ? 'high'
              : traffic.duration > directions.duration * 1.2
              ? 'moderate'
              : 'low'
        }

        setRouteInfo(route)

        // Calculer le prix recommandé
        const priceData = await getRecommendedPrice({
          distance: route.distance,
          duration: route.duration,
          packageSize,
          isUrgent,
          trafficLevel: route.trafficLevel
        })

        setRecommendedPrice(priceData.recommended_price)
        setEstimatedTime(route.duration)

        // Obtenir la recommandation de véhicule
        const vehicleRec = await getVehicleRecommendation({
          distance: route.distance,
          packageSize,
          packageType,
          isFragile,
          weatherConditions: weatherData?.condition
        })

        setRecommendedVehicle(vehicleRec)

        // Centrer la carte sur la route
        if (mapRef.current && route.coordinates.length > 0) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
              { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
            ],
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true
            }
          )
        }
      } catch (error) {
        console.error('Erreur lors du calcul de la route:', error)
        setError('Erreur lors du calcul de la route')
      } finally {
        setLoading(false)
      }
    }

    calculateRoute()
  }, [pickupLocation, deliveryLocation, packageSize, isUrgent, packageType, isFragile])

  // Charger les données météo
  useEffect(() => {
    const loadWeatherData = async () => {
      if (pickupLocation) {
        try {
          const weather = await getWeatherData(
            pickupLocation.latitude,
            pickupLocation.longitude
          )
          setWeatherData(weather)
        } catch (error) {
          console.error('Erreur lors du chargement de la météo:', error)
        }
      }
    }

    loadWeatherData()
  }, [pickupLocation])

  const handlePickupAddressSelect = (address: Address) => {
    setPickupLocation(address)
    setPickupAddress(address.description)
  }

  const handleDeliveryAddressSelect = (address: Address) => {
    setDeliveryLocation(address)
    setDeliveryAddress(address.description)
  }

  const validateForm = (): boolean => {
    if (!pickupLocation || !deliveryLocation) {
      setError('Veuillez sélectionner les adresses de départ et de destination')
      setVisible(true)
      return false
    }

    if (!recipientName.trim()) {
      setError('Veuillez entrer le nom du destinataire')
      setVisible(true)
      return false
    }

    if (!recipientPhone.trim()) {
      setError('Veuillez entrer le numéro du destinataire')
      setVisible(true)
      return false
    }

    if (!description.trim()) {
      setError('Veuillez décrire le colis à livrer')
      setVisible(true)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      const deliveryData = {
        pickup_address: pickupAddress,
        pickup_latitude: pickupLocation!.latitude,
        pickup_longitude: pickupLocation!.longitude,
        pickup_commune: pickupLocation!.commune || '',
        delivery_address: deliveryAddress,
        delivery_latitude: deliveryLocation!.latitude,
        delivery_longitude: deliveryLocation!.longitude,
        delivery_commune: deliveryLocation!.commune || '',
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        description,
        package_size: packageSize,
        package_type: packageType,
        cargo_category: cargoCategory,
        is_fragile: isFragile,
        is_urgent: isUrgent,
        proposed_price: parseFloat(proposedPrice) || recommendedPrice || 0,
        notes,
        estimated_distance: routeInfo?.distance || 0,
        estimated_duration: routeInfo?.duration || 0,
        weather_conditions: weatherData?.condition || 'unknown'
      }

      if (!isConnected) {
        addPendingUpload('delivery', deliveryData)
        Alert.alert(
          'Mode hors ligne',
          'Votre demande de livraison a été sauvegardée et sera envoyée quand vous serez reconnecté.'
        )
        navigation.goBack()
        return
      }

      const result = await submitDeliveryData(deliveryData)

      Alert.alert('Succès', 'Votre demande de livraison a été créée avec succès!', [
        {
          text: 'Voir les enchères',
          onPress: () => navigation.navigate('Bids', { deliveryId: result.id })
        }
      ])
    } catch (error) {
      setError('Erreur lors de la création de la livraison')
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const renderAddressSection = () => (
    <View style={styles.addressSection}>
      <Text style={styles.sectionTitle}>Où récupérer et livrer ?</Text>

      <View style={styles.addressContainer}>
        <View style={styles.addressInputContainer}>
          <View style={styles.addressDot} />
          <View style={styles.addressInputWrapper}>
            <AddressAutocomplete
              label="Adresse de départ"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={handlePickupAddressSelect}
              placeholder="D'où récupérer le colis ?"
              showCurrentLocation={true}
              style={styles.addressInput}
            />
          </View>
        </View>

        <View style={styles.addressLine} />

        <View style={styles.addressInputContainer}>
          <View style={[styles.addressDot, styles.destinationDot]} />
          <View style={styles.addressInputWrapper}>
            <AddressAutocomplete
              label="Adresse de destination"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              onAddressSelect={handleDeliveryAddressSelect}
              placeholder="Où livrer le colis ?"
              showCurrentLocation={false}
              style={styles.addressInput}
            />
          </View>
        </View>
      </View>

      {routeInfo && (
        <Surface style={styles.routeInfoCard} elevation={2}>
          <View style={styles.routeInfoHeader}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.routeInfoTitle}>Informations du trajet</Text>
          </View>
          <View style={styles.routeInfoContent}>
            <View style={styles.routeInfoItem}>
              <MaterialIcons name="straighten" size={16} color="#666" />
              <Text style={styles.routeInfoText}>{routeInfo.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.routeInfoItem}>
              <MaterialIcons name="schedule" size={16} color="#666" />
              <Text style={styles.routeInfoText}>{Math.round(routeInfo.duration)} min</Text>
            </View>
            <View style={styles.routeInfoItem}>
              <MaterialIcons name="traffic" size={16} color="#666" />
              <Text
                style={[
                  styles.routeInfoText,
                  {
                    color:
                      routeInfo.trafficLevel === 'high'
                        ? '#f44336'
                        : routeInfo.trafficLevel === 'moderate'
                        ? '#ff9800'
                        : '#4caf50'
                  }
                ]}
              >
                {routeInfo.trafficLevel === 'high'
                  ? 'Dense'
                  : routeInfo.trafficLevel === 'moderate'
                  ? 'Modéré'
                  : 'Fluide'}
              </Text>
            </View>
          </View>
        </Surface>
      )}
    </View>
  )

  const renderMapSection = () => (
    <View style={styles.mapSection}>
      <View style={styles.mapHeader}>
        <Text style={styles.sectionTitle}>Aperçu du trajet</Text>
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={() => setShowMapFullscreen(true)}
        >
          <Ionicons name="expand-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <CustomMapView
          ref={mapRef}
          style={styles.map}
          pickupPoint={
            pickupLocation
              ? {
                  latitude: pickupLocation.latitude,
                  longitude: pickupLocation.longitude,
                  title: 'Point de départ',
                  description: pickupAddress
                }
              : undefined
          }
          deliveryPoint={
            deliveryLocation
              ? {
                  latitude: deliveryLocation.latitude,
                  longitude: deliveryLocation.longitude,
                  title: 'Point de destination',
                  description: deliveryAddress
                }
              : undefined
          }
          route={
            routeInfo
              ? {
                  coordinates: routeInfo.coordinates,
                  distance: routeInfo.distance,
                  duration: routeInfo.duration,
                  instructions: []
                }
              : undefined
          }
          showUserLocation={true}
          showTraffic={true}
          isInteractive={true}
        />

        {loading && (
          <View style={styles.mapLoading}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
              style={styles.loadingOverlay}
            >
              <Text style={styles.loadingText}>Calcul du trajet...</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  )

  const renderPackageSection = () => (
    <View style={styles.packageSection}>
      <Text style={styles.sectionTitle}>Type de colis</Text>

      <View style={styles.packageSizeContainer}>
        {packageSizes.map((size) => (
          <TouchableOpacity
            key={size.value}
            style={[
              styles.packageSizeCard,
              packageSize === size.value && styles.packageSizeCardSelected
            ]}
            onPress={() => setPackageSize(size.value as PackageSize)}
          >
            <Ionicons
              name={size.icon as any}
              size={24}
              color={packageSize === size.value ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.packageSizeLabel,
                packageSize === size.value && styles.packageSizeLabelSelected
              ]}
            >
              {size.label}
            </Text>
            <Text style={styles.packageSizeDescription}>{size.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        label="Description du colis"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        placeholder="Décrivez ce que vous voulez livrer..."
        multiline
        numberOfLines={3}
      />

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionChip, isFragile && styles.optionChipSelected]}
          onPress={() => setIsFragile(!isFragile)}
        >
          <Ionicons
            name="warning-outline"
            size={16}
            color={isFragile ? '#ffffff' : '#666'}
          />
          <Text
            style={[styles.optionChipText, isFragile && styles.optionChipTextSelected]}
          >
            Fragile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionChip, isUrgent && styles.optionChipSelected]}
          onPress={() => setIsUrgent(!isUrgent)}
        >
          <Ionicons name="flash-outline" size={16} color={isUrgent ? '#ffffff' : '#666'} />
          <Text
            style={[styles.optionChipText, isUrgent && styles.optionChipTextSelected]}
          >
            Urgent
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderRecipientSection = () => (
    <View style={styles.recipientSection}>
      <Text style={styles.sectionTitle}>Informations du destinataire</Text>

      <TextInput
        label="Nom du destinataire"
        value={recipientName}
        onChangeText={setRecipientName}
        mode="outlined"
        style={styles.input}
        placeholder="Nom complet"
        left={<TextInput.Icon icon="account" />}
      />

      <TextInput
        label="Numéro de téléphone"
        value={recipientPhone}
        onChangeText={setRecipientPhone}
        mode="outlined"
        style={styles.input}
        placeholder="01 02 03 04 05"
        keyboardType="phone-pad"
        left={<TextInput.Icon icon="phone" />}
      />

      <TextInput
        label="Instructions spéciales (optionnel)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        style={styles.input}
        placeholder="Étage, code d'accès, instructions..."
        multiline
        numberOfLines={2}
        left={<TextInput.Icon icon="note-text" />}
      />
    </View>
  )

  const renderPriceSection = () => (
    <View style={styles.priceSection}>
      <Text style={styles.sectionTitle}>Prix et véhicule</Text>

      {recommendedPrice && (
        <Surface style={styles.priceCard} elevation={2}>
          <View style={styles.priceHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#007AFF" />
            <Text style={styles.priceTitle}>Prix recommandé</Text>
          </View>
          <Text style={styles.priceAmount}>{formatPrice(recommendedPrice)} FCFA</Text>
          <Text style={styles.priceNote}>
            Basé sur la distance ({routeInfo?.distance.toFixed(1)} km) et les conditions actuelles
          </Text>
        </Surface>
      )}

      <TextInput
        label="Votre prix proposé (FCFA)"
        value={proposedPrice}
        onChangeText={setProposedPrice}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        placeholder={recommendedPrice ? formatPrice(recommendedPrice) : '0'}
        left={<TextInput.Icon icon="currency-usd" />}
      />

      {recommendedVehicle && (
        <Surface style={styles.vehicleCard} elevation={2}>
          <View style={styles.vehicleHeader}>
            <Ionicons name="car-outline" size={20} color="#007AFF" />
            <Text style={styles.vehicleTitle}>Véhicule recommandé</Text>
          </View>
          <Text style={styles.vehicleName}>{recommendedVehicle.name}</Text>
          <Text style={styles.vehicleReason}>{recommendedVehicle.reason}</Text>
        </Surface>
      )}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#007AFF" barStyle="light-content" />

      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle livraison</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

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
          {renderAddressSection()}
          {(pickupLocation && deliveryLocation) && renderMapSection()}
          {renderPackageSection()}
          {renderRecipientSection()}
          {(routeInfo && recommendedPrice) && renderPriceSection()}

          {weatherData && <WeatherInfo weather={weatherData} style={styles.weatherInfo} />}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading || deliveryLoading}
            disabled={loading || deliveryLoading || !pickupLocation || !deliveryLocation}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
          >
            {loading || deliveryLoading ? 'Création...' : 'Créer la livraison'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerRight: {
    width: 32
  },
  keyboardAvoidingView: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 100
  },

  // Section des adresses
  addressSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  addressContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 20,
    marginRight: 12
  },
  destinationDot: {
    backgroundColor: '#f44336'
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
    marginVertical: 8
  },
  addressInputWrapper: {
    flex: 1
  },
  addressInput: {
    marginBottom: 8
  },
  routeInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  routeInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  routeInfoText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },

  // Section de la carte
  mapSection: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  fullscreenButton: {
    padding: 4
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  map: {
    flex: 1
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },

  // Section du colis
  packageSection: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  packageSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  packageSizeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  packageSizeCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff'
  },
  packageSizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
    marginBottom: 2
  },
  packageSizeLabelSelected: {
    color: '#007AFF'
  },
  packageSizeDescription: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center'
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: 12
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  optionChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  optionChipText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  optionChipTextSelected: {
    color: '#ffffff'
  },

  // Section destinataire
  recipientSection: {
    paddingHorizontal: 20,
    marginBottom: 24
  },

  // Section prix
  priceSection: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  priceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4
  },
  priceNote: {
    fontSize: 12,
    color: '#666'
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4
  },
  vehicleReason: {
    fontSize: 14,
    color: '#666'
  },

  // Éléments communs
  input: {
    backgroundColor: '#ffffff',
    marginBottom: 12
  },
  weatherInfo: {
    marginHorizontal: 20,
    marginBottom: 20
  },

  // Pied de page
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12
  },
  submitButtonContent: {
    paddingVertical: 4
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold'
  },

  snackbar: {
    backgroundColor: '#f44336'
  }
})

export default CreateDeliveryScreen
```Applying the changes will enhance the CreateDeliveryScreen component with improved autocompletion, a Yango/Uber-style map, and an enhanced user interface.