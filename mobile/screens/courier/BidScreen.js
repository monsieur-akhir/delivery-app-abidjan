"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Text, TextInput, Button, Card, Divider, Snackbar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import MapView, { Marker, Polyline } from "react-native-maps"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, bidForDelivery } from "../../services/api"
import { formatPrice, formatDateTime } from "../../utils/formatters"

const BidScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { user } = useAuth()
  const { isConnected, isOfflineMode, addPendingUpload } = useNetwork()

  const [delivery, setDelivery] = useState(null)
  const [bidAmount, setBidAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [bidLoading, setBidLoading] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [routeCoordinates, setRouteCoordinates] = useState([])

  useEffect(() => {
    loadDeliveryDetails()
    getCurrentLocation()
  }, [deliveryId])

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)

      // Définir un montant d'enchère par défaut légèrement inférieur au prix proposé
      const defaultBid = Math.round(data.proposed_price * 0.9)
      setBidAmount(defaultBid.toString())
    } catch (error) {
      setError("Erreur lors du chargement des détails de la livraison")
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.log("Permission to access location was denied")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation(location)
    } catch (error) {
      console.error("Error getting current location:", error)
    }
  }

  useEffect(() => {
    if (delivery && currentLocation) {
      calculateRouteDetails()
    }
  }, [delivery, currentLocation])

  const calculateRouteDetails = async () => {
    if (!delivery?.pickup_lat || !delivery?.pickup_lng || !currentLocation) return

    try {
      // Dans une application réelle, vous utiliseriez un service comme Google Directions API
      // Pour simplifier, nous simulons un calcul de distance et de temps

      // Calculer la distance à vol d'oiseau
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        delivery.pickup_lat,
        delivery.pickup_lng,
      )

      setDistance(distance)

      // Estimer le temps (1 km = environ 3 minutes en moto à Abidjan avec trafic)
      const timeInMinutes = Math.round(distance * 3)
      setEstimatedTime(timeInMinutes)

      // Simuler des coordonnées de route
      const simulatedRoute = generateSimulatedRoute(
        { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
        { latitude: delivery.pickup_lat, longitude: delivery.pickup_lng },
      )

      setRouteCoordinates(simulatedRoute)
    } catch (error) {
      console.error("Error calculating route:", error)
    }
  }

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

  const generateSimulatedRoute = (start, end) => {
    // Générer quelques points intermédiaires pour simuler une route
    const points = []
    const steps = 5

    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps

      // Ajouter un peu de variation aléatoire pour simuler une route réelle
      const jitter = i > 0 && i < steps ? (Math.random() - 0.5) * 0.005 : 0

      points.push({
        latitude: start.latitude + (end.latitude - start.latitude) * fraction + jitter,
        longitude: start.longitude + (end.longitude - start.longitude) * fraction + jitter,
      })
    }

    return points
  }

  const handleBid = async () => {
    if (!isConnected && !isOfflineMode) {
      setError("Vous êtes hors ligne. Activez le mode hors ligne pour enchérir.")
      setVisible(true)
      return
    }

    if (!bidAmount || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
      setError("Veuillez entrer un montant valide")
      setVisible(true)
      return
    }

    const amount = Number(bidAmount)

    // Vérifier que le montant est raisonnable
    if (amount > delivery.proposed_price) {
      Alert.alert(
        "Montant élevé",
        "Votre enchère est supérieure au prix proposé par le client. Êtes-vous sûr de vouloir continuer ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Continuer", onPress: () => submitBid(amount) },
        ],
      )
      return
    }

    if (amount < delivery.proposed_price * 0.5) {
      Alert.alert(
        "Montant bas",
        "Votre enchère est très basse. Le client pourrait ne pas l'accepter. Êtes-vous sûr de vouloir continuer ?",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Continuer", onPress: () => submitBid(amount) },
        ],
      )
      return
    }

    submitBid(amount)
  }

  const submitBid = async (amount) => {
    setBidLoading(true)

    try {
      if (isOfflineMode && !isConnected) {
        // Sauvegarder l'enchère pour synchronisation ultérieure
        addPendingUpload({
          type: "bid",
          deliveryId,
          amount,
          timestamp: new Date().toISOString(),
        })

        Alert.alert(
          "Enchère enregistrée",
          "Votre enchère a été enregistrée et sera soumise lorsque vous serez en ligne.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        )
      } else {
        // Soumettre l'enchère immédiatement
        await bidForDelivery(deliveryId, amount)

        Alert.alert(
          "Enchère soumise",
          "Votre enchère a été soumise avec succès. Vous serez notifié si le client l'accepte.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        )
      }
    } catch (error) {
      setError(error.message || "Erreur lors de la soumission de l'enchère")
      setVisible(true)
    } finally {
      setBidLoading(false)
    }
  }

  if (loading || !delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chargement...</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Chargement des détails de la livraison...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enchérir</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.deliveryCard}>
          <Card.Content>
            <View style={styles.deliveryHeader}>
              <View>
                <Text style={styles.deliveryId}>Livraison #{delivery.id}</Text>
                <Text style={styles.deliveryDate}>{formatDateTime(delivery.created_at)}</Text>
              </View>
              <Text style={styles.deliveryPrice}>{formatPrice(delivery.proposed_price)} FCFA</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.addressContainer}>
              <View style={styles.addressRow}>
                <View style={styles.addressDot} />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>Ramassage</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                  <Text style={styles.communeText}>{delivery.pickup_commune}</Text>
                </View>
              </View>

              <View style={styles.addressLine} />

              <View style={styles.addressRow}>
                <View style={[styles.addressDot, styles.destinationDot]} />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>Livraison</Text>
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                  <Text style={styles.communeText}>{delivery.delivery_commune}</Text>
                </View>
              </View>
            </View>

            {delivery.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description :</Text>
                <Text style={styles.descriptionText}>{delivery.description}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {currentLocation && delivery.pickup_lat && delivery.pickup_lng && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (currentLocation.coords.latitude + delivery.pickup_lat) / 2,
                longitude: (currentLocation.coords.longitude + delivery.pickup_lng) / 2,
                latitudeDelta: Math.abs(currentLocation.coords.latitude - delivery.pickup_lat) * 2.5,
                longitudeDelta: Math.abs(currentLocation.coords.longitude - delivery.pickup_lng) * 2.5,
              }}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
                title="Votre position"
                pinColor="#4285F4"
              />

              <Marker
                coordinate={{
                  latitude: delivery.pickup_lat,
                  longitude: delivery.pickup_lng,
                }}
                title="Point de ramassage"
                pinColor="#FF6B00"
              />

              {delivery.delivery_lat && delivery.delivery_lng && (
                <Marker
                  coordinate={{
                    latitude: delivery.delivery_lat,
                    longitude: delivery.delivery_lng,
                  }}
                  title="Point de livraison"
                  pinColor="#4CAF50"
                />
              )}

              {routeCoordinates.length > 0 && (
                <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor="#4285F4" />
              )}
            </MapView>

            {distance && estimatedTime && (
              <View style={styles.routeInfoContainer}>
                <View style={styles.routeInfoItem}>
                  <Feather name="map" size={16} color="#FF6B00" />
                  <Text style={styles.routeInfoText}>{distance} km</Text>
                </View>
                <View style={styles.routeInfoItem}>
                  <Feather name="clock" size={16} color="#FF6B00" />
                  <Text style={styles.routeInfoText}>{estimatedTime} min</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.bidContainer}>
          <Text style={styles.bidTitle}>Votre enchère</Text>

          <TextInput
            label="Montant (FCFA)"
            value={bidAmount}
            onChangeText={setBidAmount}
            keyboardType="numeric"
            style={styles.bidInput}
            mode="outlined"
            left={<TextInput.Icon icon="cash" />}
          />

          <Text style={styles.bidTip}>
            Conseil : Proposez un prix compétitif pour augmenter vos chances d'être sélectionné.
          </Text>

          <Button
            mode="contained"
            onPress={handleBid}
            style={styles.bidButton}
            loading={bidLoading}
            disabled={bidLoading}
          >
            Soumettre l'enchère
          </Button>
        </View>
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  deliveryDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  divider: {
    marginVertical: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B00",
    marginTop: 4,
    marginRight: 8,
  },
  destinationDot: {
    backgroundColor: "#4CAF50",
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginLeft: 5,
    marginBottom: 8,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: "#212121",
  },
  communeText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#212121",
  },
  mapContainer: {
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  routeInfoContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 8,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeInfoText: {
    marginLeft: 4,
    fontWeight: "bold",
    color: "#212121",
  },
  bidContainer: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 20,
  },
  bidTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  bidInput: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  bidTip: {
    fontSize: 12,
    color: "#757575",
    fontStyle: "italic",
    marginBottom: 16,
  },
  bidButton: {
    backgroundColor: "#FF6B00",
  },
})

export default BidScreen
