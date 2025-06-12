"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, StyleSheet } from "react-native"
import { Text, TextInput, Button, Divider, Chip, HelperText, Snackbar, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView from "react-native-maps"
import * as Location from "expo-location"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { useDelivery } from "../../hooks"
import { geocodeAddress, getRecommendedPrice, getVehicleRecommendation, getWeatherData } from "../../services/api"
import { formatPrice } from "../../utils/formatters"
import WeatherInfo from "../../components/WeatherInfo"
import { CustomMapView } from "../../components"
import type { Coordinates, Route, TrafficInfo } from "../../components"
import AddressAutocomplete, { Address } from "../../components/AddressAutocomplete"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { Weather, CargoCategory, VehicleType } from "../../types/models"

type CreateDeliveryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateDelivery">
}

type PackageSize = "small" | "medium" | "large"
type PackageType = "document" | "food" | "clothing" | "electronics" | "other"

interface PackageSizeOption {
  value: PackageSize
  label: string
}

interface PackageTypeOption {
  value: PackageType
  label: string
}

interface CargoCategoryOption {
  value: CargoCategory
  label: string
}

const CreateDeliveryScreen: React.FC<CreateDeliveryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { isConnected, addPendingUpload } = useNetwork()
  const mapRef = useRef<MapView | null>(null)

  const {
    createDelivery: submitDeliveryData,
    loading: deliveryLoading
  } = useDelivery()

  const [pickupAddress, setPickupAddress] = useState<string>("")
  const [pickupCommune, setPickupCommune] = useState<string>("")
  const [deliveryAddress, setDeliveryAddress] = useState<string>("")
  const [deliveryCommune, setDeliveryCommune] = useState<string>("")
  const [recipientName, setRecipientName] = useState<string>("")
  const [recipientPhone, setRecipientPhone] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [packageSize, setPackageSize] = useState<PackageSize>("medium")
  const [packageType, setPackageType] = useState<PackageType | "">("")
  const [cargoCategory, setCargoCategory] = useState<CargoCategory | "">("")
  const [isFragile, setIsFragile] = useState<boolean>(false)
  const [isUrgent, setIsUrgent] = useState<boolean>(false)
  const [proposedPrice, setProposedPrice] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  const [pickupLocation, setPickupLocation] = useState<Location.LocationObject | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<Location.LocationObject | null>(null)
  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null)
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null)
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null)
  const [weatherData, setWeatherData] = useState<Weather | null>(null)
  const [recommendedVehicle, setRecommendedVehicle] = useState<{
    type: VehicleType
    name: string
    reason: string
    priceMultiplier: number
  } | null>(null)

  const [loading, setLoading] = useState<boolean>(false)
  const [geocoding, setGeocoding] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [showWeather, setShowWeather] = useState<boolean>(false)
  const [routeInfo, setRouteInfo] = useState<{
    distance: number
    duration: number
    instructions: string[]
  } | null>(null)
  const [trafficInfo, setTrafficInfo] = useState<{
    level: 'low' | 'moderate' | 'high' | 'severe'
    delay: number
    description: string
  } | null>(null)

  const communes: string[] = [
    "Abobo",
    "Adjamé",
    "Attécoubé",
    "Cocody",
    "Koumassi",
    "Marcory",
    "Plateau",
    "Port-Bouët",
    "Treichville",
    "Yopougon",
  ]

  const packageSizes: PackageSizeOption[] = [
    { value: "small", label: t("createDelivery.packageSizes.small") },
    { value: "medium", label: t("createDelivery.packageSizes.medium") },
    { value: "large", label: t("createDelivery.packageSizes.large") },
  ]

  const packageTypes: PackageTypeOption[] = [
    { value: "document", label: t("createDelivery.packageTypes.document") },
    { value: "food", label: t("createDelivery.packageTypes.food") },
    { value: "clothing", label: t("createDelivery.packageTypes.clothing") },
    { value: "electronics", label: t("createDelivery.packageTypes.electronics") },
    { value: "other", label: t("createDelivery.packageTypes.other") },
  ]

  const cargoCategories: CargoCategoryOption[] = [
    { value: CargoCategory.DOCUMENTS, label: t("createDelivery.cargoCategories.documents") },
    { value: CargoCategory.SMALL_PACKAGE, label: t("createDelivery.cargoCategories.smallPackages") },
    { value: CargoCategory.MEDIUM_PACKAGE, label: t("createDelivery.cargoCategories.mediumPackages") },
    { value: CargoCategory.LARGE_PACKAGE, label: t("createDelivery.cargoCategories.largePackages") },
    { value: CargoCategory.FRAGILE, label: t("createDelivery.cargoCategories.fragile") },
    { value: CargoCategory.FOOD, label: t("createDelivery.cargoCategories.food") },
    { value: CargoCategory.ELECTRONICS, label: t("createDelivery.cargoCategories.electronics") },
    { value: CargoCategory.FURNITURE, label: t("createDelivery.cargoCategories.furniture") },
    { value: CargoCategory.APPLIANCES, label: t("createDelivery.cargoCategories.appliances") },
    { value: CargoCategory.CONSTRUCTION, label: t("createDelivery.cargoCategories.construction") },
    { value: CargoCategory.CUSTOM, label: t("createDelivery.cargoCategories.custom") },
  ]

  const deg2rad = useCallback((deg: number) => {
    return deg * (Math.PI / 180)
  }, [])

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371 // Rayon de la Terre en km
      const dLat = deg2rad(lat2 - lat1)
      const dLon = deg2rad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c
      return Math.round(distance * 10) / 10
    },
    [deg2rad],
  )

  const updatePriceEstimate = useCallback(async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      const distance = calculateDistance(
        pickupLocation.coords.latitude,
        pickupLocation.coords.longitude,
        deliveryLocation.coords.latitude,
        deliveryLocation.coords.longitude,
      )
      setEstimatedDistance(distance)

      const duration = Math.round(distance * 3) // Estimation simple : 3 min/km
      setEstimatedDuration(duration)

      if (isConnected) {
        const price = await getRecommendedPrice({
          distance,
          package_size: packageSize,
          is_fragile: isFragile,
          is_urgent: isUrgent,
          weather_condition: weatherData?.current.condition || "Clear", // Utiliser condition comme string
          pickup_commune: pickupCommune,
          delivery_commune: deliveryCommune,
        })

        setRecommendedPrice(price)

        if (!proposedPrice) {
          setProposedPrice(price.toString())
        }

        if (cargoCategory) {
          try {
            const recommendation = await getVehicleRecommendation({
              cargo_category: cargoCategory,
              distance,
              weight: packageSize === "small" ? 1 : packageSize === "medium" ? 5 : 15,
              is_fragile: isFragile,
              is_urgent: isUrgent,
            })

            setRecommendedVehicle({
              type: recommendation.recommended_vehicle.type,
              name: recommendation.recommended_vehicle.name,
              reason: recommendation.reason,
              priceMultiplier: recommendation.price_multiplier,
            })

            const adjustedPrice = Math.round(price * recommendation.price_multiplier)
            setRecommendedPrice(adjustedPrice)
            if (!proposedPrice) {
              setProposedPrice(adjustedPrice.toString())
            }
          } catch (error) {
            console.error("Erreur lors de la récupération de la recommandation de véhicule :", error)
          }
        }
      } else {
        const basePrice = 500
        const pricePerKm = 100
        let price = basePrice + Math.round(distance * pricePerKm)

        if (packageSize === "large") price += 300
        if (isFragile) price += 200
        if (isUrgent) price += 500

        setRecommendedPrice(price)

        if (!proposedPrice) {
          setProposedPrice(price.toString())
        }
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'estimation de prix :", error)
    }
  }, [pickupLocation, deliveryLocation, packageSize, isFragile, isUrgent, pickupCommune, deliveryCommune, isConnected, cargoCategory, proposedPrice, calculateDistance, weatherData])

  const searchPickupLocation = useCallback(
    async () => {
      if (!pickupAddress || !pickupCommune) return

      try {
        setGeocoding(true)
        const searchQuery = `${pickupAddress}, ${pickupCommune}, Abidjan, Côte d'Ivoire`

        if (isConnected) {
          const result = await geocodeAddress(searchQuery)

          if (result && result.length > 0) {
            const newLocation: Location.LocationObject = {
              coords: {
                latitude: result[0].latitude,
                longitude: result[0].longitude,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            }
            setPickupLocation(newLocation)

            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: result[0].latitude,
                longitude: result[0].longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              })
            }
          } else {
            Alert.alert(t("createDelivery.addressNotFound"), t("createDelivery.tryDifferentAddress"))
          }
        } else {
          Alert.alert(t("createDelivery.offlineGeocoding"), t("createDelivery.usingCurrentLocation"))
        }
      } catch (error) {
        console.error("Erreur lors du géocodage de l'adresse de ramassage :", error)
      } finally {
        setGeocoding(false)
        updatePriceEstimate()
      }
    },
    [pickupAddress, pickupCommune, isConnected, t, updatePriceEstimate],
  )

  const searchDeliveryLocation = useCallback(
    async () => {
      if (!deliveryAddress || !deliveryCommune) return

      try {
        setGeocoding(true)
        const searchQuery = `${deliveryAddress}, ${deliveryCommune}, Abidjan, Côte d'Ivoire`

        if (isConnected) {
          const result = await geocodeAddress(searchQuery)

          if (result && result.length > 0) {
            const newLocation: Location.LocationObject = {
              coords: {
                latitude: result[0].latitude,
                longitude: result[0].longitude,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            }
            setDeliveryLocation(newLocation)

            if (mapRef.current && pickupLocation) {
              const edgePadding = {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50,
              }

              mapRef.current.fitToCoordinates(
                [
                  {
                    latitude: pickupLocation.coords.latitude,
                    longitude: pickupLocation.coords.longitude,
                  },
                  {
                    latitude: result[0].latitude,
                    longitude: result[0].longitude,
                  },
                ],
                { edgePadding },
              )
            }
          } else {
            Alert.alert(t("createDelivery.addressNotFound"), t("createDelivery.tryDifferentAddress"))
          }
        } else {
          Alert.alert(t("createDelivery.offlineGeocoding"), t("createDelivery.usingApproximateLocation"))

          if (pickupLocation) {
            const newLocation: Location.LocationObject = {
              coords: {
                latitude: pickupLocation.coords.latitude + 0.045,
                longitude: pickupLocation.coords.longitude + 0.045,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            }
            setDeliveryLocation(newLocation)
          }
        }
      } catch (error) {
        console.error("Erreur lors du géocodage de l'adresse de livraison :", error)
      } finally {
        setGeocoding(false)
        updatePriceEstimate()
      }
    },
    [deliveryAddress, deliveryCommune, isConnected, pickupLocation, t, updatePriceEstimate],
  )

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          Alert.alert(t("createDelivery.locationPermissionDenied"), t("createDelivery.locationPermissionMessage"))
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        setPickupLocation(location)

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          })
        }

        if (isConnected) {
          const weather = await getWeatherData(location.coords.latitude, location.coords.longitude)
          setWeatherData(weather)
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la localisation ou des données météo :", error)
        setError(t("createDelivery.errorFetchingLocation"))
        setVisible(true)
      }
    })()
  }, [isConnected, t])

  const handleSubmit = async () => {
    if (!pickupAddress || !pickupCommune || !deliveryAddress || !deliveryCommune || !proposedPrice) {
      setError(t("createDelivery.errorRequiredFields"))
      setVisible(true)
      return
    }

    if (!recipientPhone || recipientPhone.trim().length === 0) {
      setError(t("createDelivery.errorRecipientPhoneRequired"))
      setVisible(true)
      return
    }

    // Validation du numéro de téléphone ivoirien
    const phoneRegex = /^(\+225)?[0-9]{8,10}$/
    if (!phoneRegex.test(recipientPhone.replace(/\s/g, ''))) {
      setError(t("createDelivery.errorInvalidPhoneNumber"))
      setVisible(true)
      return
    }

    // Cargo category is now optional
    // if (!cargoCategory) {
    //   setError(t("createDelivery.errorCargoCategoryRequired"))
    //   setVisible(true)
    //   return
    // }

    if (isNaN(Number.parseFloat(proposedPrice)) || Number.parseFloat(proposedPrice) <= 0) {
      setError(t("createDelivery.errorInvalidPrice"))
      setVisible(true)
      return
    }

    if (recommendedPrice && Number.parseFloat(proposedPrice) < recommendedPrice * 0.7) {
      Alert.alert(t("createDelivery.lowPriceWarning"), t("createDelivery.lowPriceMessage"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.continue"),
          onPress: submitDelivery,
        },
      ])
    } else {
      submitDelivery()
    }
  }

  const submitDelivery = async () => {
    setLoading(true)
    try {
      const deliveryData = {
        pickup_address: pickupAddress,
        pickup_commune: pickupCommune,
        pickup_lat: pickupLocation?.coords.latitude,
        pickup_lng: pickupLocation?.coords.longitude,
        delivery_address: deliveryAddress,
        delivery_commune: deliveryCommune,
        delivery_lat: deliveryLocation?.coords.latitude,
        delivery_lng: deliveryLocation?.coords.longitude,
        delivery_contact_name: recipientName.trim() || undefined,
        delivery_contact_phone: recipientPhone.trim(),
        description,
        package_size: packageSize,
        package_type: packageType,
        cargo_category: cargoCategory || undefined,
        is_fragile: isFragile,
        is_urgent: isUrgent,
        proposed_price: Number.parseFloat(proposedPrice),
        notes,
        estimated_distance: estimatedDistance ?? undefined,
        estimated_duration: estimatedDuration ?? undefined,
        required_vehicle_type: recommendedVehicle?.type,
      }

      if (isConnected) {
        const response = await submitDeliveryData(deliveryData)
        Alert.alert('Succès', 'Livraison créée avec succès!', [
          {
            text: 'Choisir un coursier',
            onPress: () => navigation.navigate('SmartMatching', { deliveryId: response.id })
          },
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => navigation.navigate('Orders')
          }
        ])
      } else {
        addPendingUpload({
          type: "create_delivery",
          data: deliveryData,
        })

        Alert.alert(t("createDelivery.offlineDeliveryCreated"), t("createDelivery.offlineDeliveryMessage"), [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ])
      }
    } catch (error) {
      console.error("Erreur lors de la création de la livraison :", error)
      setError(error instanceof Error ? error.message : t("createDelivery.errorCreatingDelivery"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cargoCategory && estimatedDistance) {
      updatePriceEstimate()
    }
  }, [cargoCategory, estimatedDistance, updatePriceEstimate])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" iconColor="#212121" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("createDelivery.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.mapContainer}>
            <CustomMapView
              style={styles.map}
              initialRegion={{
                latitude: 5.3599517,
                longitude: -4.0082563,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              pickupPoint={pickupLocation ? {
                latitude: pickupLocation.coords.latitude,
                longitude: pickupLocation.coords.longitude,
                title: t("createDelivery.pickupPoint"),
                description: pickupAddress
              } : undefined}
              deliveryPoint={deliveryLocation ? {
                latitude: deliveryLocation.coords.latitude,
                longitude: deliveryLocation.coords.longitude,
                title: t("createDelivery.deliveryPoint"),
                description: deliveryAddress
              } : undefined}
              onPickupPointSelected={(coordinate: Coordinates) => {
                setPickupLocation({
                  coords: {
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    altitude: null,
                    accuracy: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                  },
                  timestamp: Date.now()
                });
              }}
              onDeliveryPointSelected={(coordinate: Coordinates) => {
                setDeliveryLocation({
                  coords: {
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    altitude: null,
                    accuracy: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                  },
                  timestamp: Date.now()
                });
              }}
              onRouteCalculated={(route: Route) => {
                setRouteInfo(route);
                setEstimatedDistance(route.distance);
                setEstimatedDuration(route.duration);
              }}
              onTrafficUpdate={(traffic: TrafficInfo) => {
                setTrafficInfo(traffic);
              }}
              showsTraffic={true}
              showsUserLocation={true}
            />

            {weatherData && (
              <TouchableOpacity style={styles.weatherButton} onPress={() => setShowWeather(!showWeather)}>
                <Text style={styles.weatherButtonText}>
                  {showWeather ? t("createDelivery.hideWeather") : t("createDelivery.showWeather")}
                </Text>
              </TouchableOpacity>
            )}

            {showWeather && weatherData && (
              <View style={styles.weatherContainer}>
                <WeatherInfo weather={weatherData} />
              </View>
            )}

            {routeInfo && (
              <View style={styles.routeInfoContainer}>
                <Text style={styles.routeInfoTitle}>{t("createDelivery.routeInformation")}</Text>
                <View style={styles.routeInfoRow}>
                  <Text style={styles.routeInfoLabel}>{t("createDelivery.distance")}:</Text>
                  <Text style={styles.routeInfoValue}>{(routeInfo.distance / 1000).toFixed(1)} km</Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Text style={styles.routeInfoLabel}>{t("createDelivery.estimatedTime")}:</Text>
                  <Text style={styles.routeInfoValue}>{Math.round(routeInfo.duration / 60)} min</Text>
                </View>
                {trafficInfo && (
                  <View style={styles.routeInfoRow}>
                    <Text style={styles.routeInfoLabel}>{t("createDelivery.traffic")}:</Text>
                    <Text style={[styles.routeInfoValue, { 
                      color: trafficInfo.level === 'high' || trafficInfo.level === 'severe' ? '#f44336' : 
                             trafficInfo.level === 'moderate' ? '#ff9800' : '#4caf50' 
                    }]}>
                      {t(`createDelivery.trafficLevels.${trafficInfo.level}`)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.pickupAddress")}</Text>

            <AddressAutocomplete
              label={t("createDelivery.address")}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onAddressSelect={(address: Address) => {
                setPickupAddress(address.description);
                setPickupCommune(address.commune || '');
                setPickupLocation({
                  coords: {
                    latitude: address.latitude,
                    longitude: address.longitude,
                    altitude: null,
                    accuracy: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                  },
                  timestamp: Date.now()
                });
              }}
              placeholder={t("createDelivery.enterAddress")}
              style={styles.input}
              showCurrentLocation={true}
            />

            <View style={styles.communeContainer}>
              <Text style={styles.communeLabel}>{t("createDelivery.commune")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {communes.map((commune) => (
                  <Chip
                    key={commune}
                    selected={pickupCommune === commune}
                    onPress={() => {
                      setPickupCommune(commune)
                      setTimeout(searchPickupLocation, 500)
                    }}
                    style={[styles.communeChip, pickupCommune === commune && styles.selectedChip]}
                    textStyle={pickupCommune === commune ? styles.selectedChipText : {}}
                  >
                    {commune}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.deliveryAddress")}</Text>

            <AddressAutocomplete
              label={t("createDelivery.address")}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              onAddressSelect={(address: Address) => {
                setDeliveryAddress(address.description);
                setDeliveryCommune(address.commune || '');
                setDeliveryLocation({
                  coords: {
                    latitude: address.latitude,
                    longitude: address.longitude,
                    altitude: null,
                    accuracy: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                  },
                  timestamp: Date.now()
                });
              }}
              placeholder={t("createDelivery.enterAddress")}
              style={styles.input}
              showCurrentLocation={false}
            />

            <View style={styles.communeContainer}>
              <Text style={styles.communeLabel}>{t("createDelivery.commune")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {communes.map((commune) => (
                  <Chip
                    key={commune}
                    selected={deliveryCommune === commune}
                    onPress={() => {
                      setDeliveryCommune(commune)
                      setTimeout(searchDeliveryLocation, 500)
                    }}
                    style={[styles.communeChip, deliveryCommune === commune && styles.selectedChip]}
                    textStyle={deliveryCommune === commune ? styles.selectedChipText : {}}
                  >
                    {commune}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Section Destinataire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.recipientInfo")}</Text>

            <TextInput
              label={`${t("createDelivery.recipientPhone")} *`}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="01 02 03 04 05"
              left={<TextInput.Icon icon="phone" />}
            />
            <HelperText type="info" visible={true}>
              {t("createDelivery.recipientPhoneRequired")}
            </HelperText>

            <TextInput
              label={t("createDelivery.recipientName")}
              value={recipientName}
              onChangeText={setRecipientName}
              style={styles.input}
              mode="outlined"
              placeholder={t("createDelivery.recipientNamePlaceholder")}
              left={<TextInput.Icon icon="account" />}
            />
            <HelperText type="info" visible={true}>
              {t("createDelivery.recipientNameOptional")}
            </HelperText>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.packageDetails")}</Text>

            <TextInput
              label={t("createDelivery.description")}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="text" />}
            />

            <Text style={styles.optionLabel}>{t("createDelivery.packageSize")}</Text>
            <View style={styles.optionsContainer}>
              {packageSizes.map((size) => (
                <Chip
                  key={size.value}
                  selected={packageSize === size.value}
                  onPress={() => {
                    setPackageSize(size.value)
                    updatePriceEstimate()
                  }}
                  style={[styles.optionChip, packageSize === size.value && styles.selectedChip]}
                  textStyle={packageSize === size.value ? styles.selectedChipText : {}}
                >
                  {size.label}
                </Chip>
              ))}
            </View>

            <Text style={styles.optionLabel}>{t("createDelivery.packageType")}</Text>
            <View style={styles.optionsContainer}>
              {packageTypes.map((type) => (
                <Chip
                  key={type.value}
                  selected={packageType === type.value}
                  onPress={() => setPackageType(type.value)}
                  style={[styles.optionChip, packageType === type.value && styles.selectedChip]}
                  textStyle={packageType === type.value ? styles.selectedChipText : {}}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            <Text style={styles.optionLabel}>{t("createDelivery.cargoCategory")} ({t("common.optional")})</Text>
            <View style={styles.optionsContainer}>
              {cargoCategories.map((category) => (
                <Chip
                  key={category.value}
                  selected={cargoCategory === category.value}
                  onPress={() => setCargoCategory(category.value)}
                  style={[styles.optionChip, cargoCategory === category.value && styles.selectedChip]}
                  textStyle={cargoCategory === category.value ? styles.selectedChipText : {}}
                >
                  {category.label}
                </Chip>
              ))}
            </View>

            <View style={styles.checkboxContainer}>
              <Chip
                selected={isFragile}
                onPress={() => {
                  setIsFragile(!isFragile)
                  updatePriceEstimate()
                }}
                style={[styles.optionChip, isFragile && styles.selectedChip]}
                textStyle={isFragile ? styles.selectedChipText : {}}
                icon={isFragile ? "check" : "close"}
              >
                {t("createDelivery.isFragile")}
              </Chip>

              <Chip
                selected={isUrgent}
                onPress={() => {
                  setIsUrgent(!isUrgent)
                  updatePriceEstimate()
                }}
                style={[styles.optionChip, isUrgent && styles.selectedChip]}
                textStyle={isUrgent ? styles.selectedChipText : {}}
                icon={isUrgent ? "check" : "close"}
              >
                {t("createDelivery.isUrgent")}
              </Chip>
            </View>

            <TextInput
              label={t("createDelivery.notes")}
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              left={<TextInput.Icon icon="note" />}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.priceAndEstimates")}</Text>

            {estimatedDistance && estimatedDuration && (
              <View style={styles.estimatesContainer}>
                <View style={styles.estimateItem}>
                  <Text style={styles.estimateLabel}>{t("createDelivery.distance")}</Text>
                  <Text style={styles.estimateValue}>{estimatedDistance} km</Text>
                </View>
                <View style={styles.estimateItem}>
                  <Text style={styles.estimateLabel}>{t("createDelivery.duration")}</Text>
                  <Text style={styles.estimateValue}>{estimatedDuration} min</Text>
                </View>
              </View>
            )}

            {recommendedVehicle && (
              <View style={styles.vehicleRecommendationContainer}>
                <Text style={styles.vehicleRecommendationTitle}>{t("createDelivery.recommendedVehicle")}</Text>
                <View style={styles.vehicleRecommendationContent}>
                  <View style={styles.vehicleIconContainer}>
                    <IconButton
                      icon={
                        recommendedVehicle.type === VehicleType.SCOOTER
                          ? "scooter"
                          : recommendedVehicle.type === VehicleType.BICYCLE
                            ? "bicycle"
                            : recommendedVehicle.type ===`MOTORCYCLE
                              ? "motorbike"                              : recommendedVehicle.type === VehicleType.VAN
                                ? "truck-delivery"
                              : recommendedVehicle.type === VehicleType.PICKUP
                                ? "truck"
                                  : recommendedVehicle.type === VehicleType.KIA_TRUCK ||
                                      recommendedVehicle.type === VehicleType.MOVING_TRUCK
                                    ? "truck"
                                    : "truck-outline"
                      }
                      size={36}
                      iconColor="#FF6B00"
                    />
                  </View>
                  <View style={styles.vehicleRecommendationDetails}>
                    <Text style={styles.vehicleRecommendationName}>{recommendedVehicle.name}</Text>
                    <Text style={styles.vehicleRecommendationReason}>{recommendedVehicle.reason}</Text>
                    <Text style={styles.vehicleRecommendationMultiplier}>
                      {t("createDelivery.priceMultiplier")}: x{recommendedVehicle.priceMultiplier.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TextInput
              label={t("createDelivery.proposedPrice")}
              value={proposedPrice}
              onChangeText={setProposedPrice}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="cash" />}
              right={<TextInput.Affix text="FCFA" />}
            />

            {recommendedPrice && (
              <HelperText type="info" style={styles.recommendedPrice}>
                {t("createDelivery.recommendedPrice")}: {formatPrice(recommendedPrice)} FCFA
              </HelperText>
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading || deliveryLoading}
            disabled={loading || deliveryLoading || geocoding}
          >
            {t("createDelivery.submit")}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  weatherButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  weatherButtonText: {
    fontSize: 12,
    color: "#FF6B00",
  },
  weatherContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#212121",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  communeContainer: {
    marginBottom: 16,
  },
  communeLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  communeChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },
  optionLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  optionChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedChip: {
    backgroundColor: "#FF6B00",
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  checkboxContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  estimatesContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  estimateItem: {
    flex: 1,
    alignItems: "center",
  },
  estimateLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  vehicleRecommendationContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  vehicleRecommendationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 8,
  },
  vehicleRecommendationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleIconContainer: {
    marginRight: 8,
  },
  vehicleRecommendationDetails: {
    flex: 1,
  },
  vehicleRecommendationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  vehicleRecommendationReason: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  vehicleRecommendationMultiplier: {
    fontSize: 14,
    color: "#FF6B00",
    marginTop: 4,
    fontWeight: "bold",
  },
  recommendedPrice: {
    fontSize: 14,
    color: "#4CAF50",
  },
  divider: {
    marginVertical: 16,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 8,
    backgroundColor: "#FF6B00",
  },
  routeInfoContainer: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  routeInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  routeInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: "#757575",
  },
  routeInfoValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#212121",
  },
})

export default CreateDeliveryScreen