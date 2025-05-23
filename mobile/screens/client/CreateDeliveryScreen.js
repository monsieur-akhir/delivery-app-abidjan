"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native"
import { Text, TextInput, Button, Divider, Chip, HelperText, Snackbar, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker } from "react-native-maps"
import * as Location from "expo-location"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { createDelivery, geocodeAddress, getRecommendedPrice } from "../../services/api"
import { formatPrice } from "../../utils/formatters"
import { getWeatherForecast } from "../../services/api"
import WeatherInfo from "../../components/WeatherInfo"

const CreateDeliveryScreen = ({ navigation }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()
  const mapRef = useRef(null)

  // États pour les champs du formulaire
  const [pickupAddress, setPickupAddress] = useState("")
  const [pickupCommune, setPickupCommune] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryCommune, setDeliveryCommune] = useState("")
  const [description, setDescription] = useState("")
  const [packageSize, setPackageSize] = useState("medium")
  const [packageType, setPackageType] = useState("")
  const [isFragile, setIsFragile] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [proposedPrice, setProposedPrice] = useState("")
  const [notes, setNotes] = useState("")

  // États pour la géolocalisation
  const [location, setLocation] = useState(null)
  const [pickupLocation, setPickupLocation] = useState(null)
  const [deliveryLocation, setDeliveryLocation] = useState(null)

  // États pour les calculs et recommandations
  const [recommendedPrice, setRecommendedPrice] = useState(null)
  const [estimatedDistance, setEstimatedDistance] = useState(null)
  const [estimatedDuration, setEstimatedDuration] = useState(null)
  const [weatherData, setWeatherData] = useState(null)

  // États pour l'UI
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)
  const [showWeather, setShowWeather] = useState(false)

  const communes = [
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

  const packageSizes = [
    { value: "small", label: t("createDelivery.packageSizes.small") },
    { value: "medium", label: t("createDelivery.packageSizes.medium") },
    { value: "large", label: t("createDelivery.packageSizes.large") },
  ]

  const packageTypes = [
    { value: "document", label: t("createDelivery.packageTypes.document") },
    { value: "food", label: t("createDelivery.packageTypes.food") },
    { value: "clothing", label: t("createDelivery.packageTypes.clothing") },
    { value: "electronics", label: t("createDelivery.packageTypes.electronics") },
    { value: "other", label: t("createDelivery.packageTypes.other") },
  ]

  // Obtenir la position actuelle
  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          Alert.alert(t("createDelivery.locationPermissionDenied"), t("createDelivery.locationPermissionMessage"))
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        setLocation(location)
        setPickupLocation(location)

        // Centrer la carte sur la position actuelle
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          })
        }

        // Obtenir les prévisions météo pour la position actuelle
        if (isConnected) {
          const weather = await getWeatherForecast(location.coords.latitude, location.coords.longitude)
          setWeatherData(weather)
        }
      } catch (error) {
        console.error("Error getting location:", error)
      }
    })()
  }, [])

  // Géocodage de l'adresse de ramassage
  const searchPickupLocation = async () => {
    if (!pickupAddress || !pickupCommune) return

    try {
      setGeocoding(true)
      const searchQuery = `${pickupAddress}, ${pickupCommune}, Abidjan, Côte d'Ivoire`

      if (isConnected) {
        const result = await geocodeAddress(searchQuery)

        if (result && result.length > 0) {
          const newLocation = {
            coords: {
              latitude: result[0].latitude,
              longitude: result[0].longitude,
            },
          }
          setPickupLocation(newLocation)

          // Centrer la carte sur la nouvelle position
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: result[0].latitude,
              longitude: result[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            })
          }
        } else {
          // Fallback pour les adresses non trouvées
          Alert.alert(t("createDelivery.addressNotFound"), t("createDelivery.tryDifferentAddress"))
        }
      } else {
        // En mode hors ligne, utiliser la position actuelle
        Alert.alert(t("createDelivery.offlineGeocoding"), t("createDelivery.usingCurrentLocation"))
      }
    } catch (error) {
      console.error("Error geocoding pickup address:", error)
    } finally {
      setGeocoding(false)
      updatePriceEstimate()
    }
  }

  // Géocodage de l'adresse de livraison
  const searchDeliveryLocation = async () => {
    if (!deliveryAddress || !deliveryCommune) return

    try {
      setGeocoding(true)
      const searchQuery = `${deliveryAddress}, ${deliveryCommune}, Abidjan, Côte d'Ivoire`

      if (isConnected) {
        const result = await geocodeAddress(searchQuery)

        if (result && result.length > 0) {
          const newLocation = {
            coords: {
              latitude: result[0].latitude,
              longitude: result[0].longitude,
            },
          }
          setDeliveryLocation(newLocation)

          // Ajuster la carte pour montrer les deux points
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
          // Fallback pour les adresses non trouvées
          Alert.alert(t("createDelivery.addressNotFound"), t("createDelivery.tryDifferentAddress"))
        }
      } else {
        // En mode hors ligne, utiliser une position approximative
        Alert.alert(t("createDelivery.offlineGeocoding"), t("createDelivery.usingApproximateLocation"))

        // Simuler une position à 5km de la position de ramassage
        if (pickupLocation) {
          const newLocation = {
            coords: {
              latitude: pickupLocation.coords.latitude + 0.045,
              longitude: pickupLocation.coords.longitude + 0.045,
            },
          }
          setDeliveryLocation(newLocation)
        }
      }
    } catch (error) {
      console.error("Error geocoding delivery address:", error)
    } finally {
      setGeocoding(false)
      updatePriceEstimate()
    }
  }

  // Mettre à jour l'estimation de prix
  const updatePriceEstimate = async () => {
    if (!pickupLocation || !deliveryLocation) return

    try {
      // Calculer la distance
      const distance = calculateDistance(
        pickupLocation.coords.latitude,
        pickupLocation.coords.longitude,
        deliveryLocation.coords.latitude,
        deliveryLocation.coords.longitude,
      )
      setEstimatedDistance(distance)

      // Estimer la durée (1 km = environ 3 minutes en moto à Abidjan avec trafic)
      const duration = Math.round(distance * 3)
      setEstimatedDuration(duration)

      if (isConnected) {
        // Obtenir le prix recommandé du serveur
        const price = await getRecommendedPrice({
          distance,
          package_size: packageSize,
          is_fragile: isFragile,
          is_urgent: isUrgent,
          weather_condition: weatherData?.current?.condition?.code || 1000, // 1000 = ciel dégagé par défaut
          pickup_commune: pickupCommune,
          delivery_commune: deliveryCommune,
        })

        setRecommendedPrice(price)

        // Pré-remplir le prix proposé avec le prix recommandé
        if (!proposedPrice) {
          setProposedPrice(price.toString())
        }
      } else {
        // Calcul local simplifié en mode hors ligne
        const basePrice = 500
        const pricePerKm = 100
        let price = basePrice + Math.round(distance * pricePerKm)

        // Ajustements selon les options
        if (packageSize === "large") price += 300
        if (isFragile) price += 200
        if (isUrgent) price += 500

        setRecommendedPrice(price)

        // Pré-remplir le prix proposé avec le prix recommandé
        if (!proposedPrice) {
          setProposedPrice(price.toString())
        }
      }
    } catch (error) {
      console.error("Error calculating price estimate:", error)
    }
  }

  // Calculer la distance entre deux points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distance en km
    return Math.round(distance * 10) / 10 // Arrondir à 1 décimale
  }

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  // Soumettre la demande de livraison
  const handleSubmit = async () => {
    // Validation des champs
    if (!pickupAddress || !pickupCommune || !deliveryAddress || !deliveryCommune || !proposedPrice) {
      setError(t("createDelivery.errorRequiredFields"))
      setVisible(true)
      return
    }

    if (isNaN(Number.parseFloat(proposedPrice)) || Number.parseFloat(proposedPrice) <= 0) {
      setError(t("createDelivery.errorInvalidPrice"))
      setVisible(true)
      return
    }

    // Vérifier si le prix proposé est trop bas
    if (recommendedPrice && Number.parseFloat(proposedPrice) < recommendedPrice * 0.7) {
      Alert.alert(t("createDelivery.lowPriceWarning"), t("createDelivery.lowPriceMessage"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.continue"),
          onPress: () => submitDelivery(),
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
        description: description,
        package_size: packageSize,
        package_type: packageType,
        is_fragile: isFragile,
        is_urgent: isUrgent,
        proposed_price: Number.parseFloat(proposedPrice),
        notes: notes,
        estimated_distance: estimatedDistance,
        estimated_duration: estimatedDuration,
      }

      if (isConnected) {
        // Créer la livraison en ligne
        const response = await createDelivery(deliveryData)
        navigation.navigate("DeliveryDetails", { deliveryId: response.id })
      } else {
        // Stocker la livraison pour synchronisation ultérieure
        addPendingUpload({
          type: "create_delivery",
          data: deliveryData,
          timestamp: new Date().toISOString(),
        })

        Alert.alert(t("createDelivery.offlineDeliveryCreated"), t("createDelivery.offlineDeliveryMessage"), [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ])
      }
    } catch (error) {
      console.error("Error creating delivery:", error)
      setError(error.message || t("createDelivery.errorCreatingDelivery"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("createDelivery.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Carte */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: 5.3599517,
                longitude: -4.0082563, // Coordonnées d'Abidjan par défaut
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {pickupLocation && (
                <Marker
                  coordinate={{
                    latitude: pickupLocation.coords.latitude,
                    longitude: pickupLocation.coords.longitude,
                  }}
                  title={t("createDelivery.pickupPoint")}
                  pinColor="#FF6B00"
                />
              )}
              {deliveryLocation && (
                <Marker
                  coordinate={{
                    latitude: deliveryLocation.coords.latitude,
                    longitude: deliveryLocation.coords.longitude,
                  }}
                  title={t("createDelivery.deliveryPoint")}
                  pinColor="#4CAF50"
                />
              )}
            </MapView>

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
          </View>

          {/* Adresse de ramassage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.pickupAddress")}</Text>

            <TextInput
              label={t("createDelivery.address")}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              onBlur={searchPickupLocation}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
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

          {/* Adresse de livraison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("createDelivery.deliveryAddress")}</Text>

            <TextInput
              label={t("createDelivery.address")}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              onBlur={searchDeliveryLocation}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
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

          {/* Détails du colis */}
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

          {/* Prix et estimation */}
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
            loading={loading}
            disabled={loading || geocoding}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#212121",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
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
})

export default CreateDeliveryScreen
