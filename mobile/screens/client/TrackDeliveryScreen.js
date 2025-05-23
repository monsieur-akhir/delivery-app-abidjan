"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, Alert, Linking, Platform, Dimensions } from "react-native"
import { Text, Button, Chip, ActivityIndicator, IconButton, Card, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { useWebSocket } from "../../contexts/WebSocketContext"
import { fetchDeliveryDetails, getCourierLocation, updateDeliveryStatus, getTrafficInfo } from "../../services/api"

const TrackDeliveryScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected, isOfflineMode } = useNetwork()
  const { subscribe, unsubscribe } = useWebSocket()

  const [delivery, setDelivery] = useState(null)
  const [courier, setCourier] = useState(null)
  const [courierLocation, setCourierLocation] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [estimatedTime, setEstimatedTime] = useState(null)
  const [distance, setDistance] = useState(null)
  const [trafficInfo, setTrafficInfo] = useState(null)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)

  const mapRef = useRef(null)
  const locationTimerRef = useRef(null)
  const subscriptionRef = useRef(null)

  const { width, height } = Dimensions.get("window")
  const ASPECT_RATIO = width / height
  const LATITUDE_DELTA = 0.01
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

  useEffect(() => {
    loadDeliveryDetails()
    getCurrentLocation()

    // Configurer un intervalle pour mettre à jour la position du coursier
    // en cas de problème avec WebSocket
    locationTimerRef.current = setInterval(() => {
      if (delivery?.courier_id && isConnected) {
        fetchCourierLocation(delivery.courier_id, deliveryId)
      }
    }, 30000) // Toutes les 30 secondes comme fallback

    return () => {
      // Nettoyer l'intervalle et fermer le WebSocket à la sortie
      if (locationTimerRef.current) {
        clearInterval(locationTimerRef.current)
      }

      if (subscriptionRef.current) {
        unsubscribe(subscriptionRef.current)
      }
    }
  }, [deliveryId])

  // Configurer le WebSocket lorsque les détails de livraison sont chargés
  useEffect(() => {
    if (delivery?.courier_id && isConnected) {
      setupWebSocket(delivery.client_id, delivery.courier_id)

      // Charger les informations de trafic
      loadTrafficInfo()
    }
  }, [delivery, isConnected])

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true)

      if (isConnected || isOfflineMode) {
        const data = await fetchDeliveryDetails(deliveryId)
        setDelivery(data)

        if (data.courier) {
          setCourier(data.courier)
        }

        // Charger la position initiale du coursier
        if (data.courier_id && data.status !== "pending") {
          fetchCourierLocation(data.courier_id, deliveryId)
        }
      } else {
        // Mode hors ligne sans données mises en cache
        setError(t("trackDelivery.offlineNoData"))
        setVisible(true)
      }
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError(t("trackDelivery.errorLoadingDelivery"))
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setUserLocation(location)
    } catch (error) {
      console.error("Error getting current location:", error)
    }
  }

  const fetchCourierLocation = async (courierId, deliveryId) => {
    if (!isConnected) return

    try {
      const locationData = await getCourierLocation(deliveryId)

      if (locationData && locationData.lat && locationData.lng) {
        setCourierLocation({
          latitude: locationData.lat,
          longitude: locationData.lng,
          timestamp: locationData.timestamp,
        })

        // Mettre à jour l'itinéraire et les estimations
        if (delivery.delivery_lat && delivery.delivery_lng) {
          updateRouteEstimates(locationData.lat, locationData.lng, delivery.delivery_lat, delivery.delivery_lng)
        }
      }
    } catch (error) {
      console.error("Error fetching courier location:", error)
    }
  }

  const setupWebSocket = (clientId, courierId) => {
    try {
      // S'abonner aux mises à jour de localisation
      const subscription = subscribe(`delivery_${deliveryId}`, (data) => {
        if (data.type === "courier_location" && data.delivery_id === deliveryId) {
          setCourierLocation({
            latitude: data.lat,
            longitude: data.lng,
            timestamp: data.timestamp,
          })

          // Mettre à jour l'itinéraire et les estimations
          if (delivery.delivery_lat && delivery.delivery_lng) {
            updateRouteEstimates(data.lat, data.lng, delivery.delivery_lat, delivery.delivery_lng)
          }
        } else if (data.type === "delivery_status_update" && data.delivery_id === deliveryId) {
          // Recharger les détails de la livraison lorsque le statut change
          loadDeliveryDetails()
        } else if (data.type === "traffic_alert" && data.delivery_id === deliveryId) {
          // Mettre à jour les informations de trafic
          setTrafficInfo(data.traffic_info)
        }
      })

      subscriptionRef.current = subscription
    } catch (error) {
      console.error("Error setting up WebSocket:", error)
    }
  }

  const loadTrafficInfo = async () => {
    if (!isConnected || !delivery) return

    try {
      const info = await getTrafficInfo(
        delivery.pickup_lat,
        delivery.pickup_lng,
        delivery.delivery_lat,
        delivery.delivery_lng,
      )

      setTrafficInfo(info)
    } catch (error) {
      console.error("Error loading traffic info:", error)
    }
  }

  const updateRouteEstimates = (startLat, startLng, endLat, endLng) => {
    // Calculer la distance
    const distance = calculateDistance(startLat, startLng, endLat, endLng)
    setDistance(distance)

    // Estimer le temps (1 km = environ 3 minutes en moto à Abidjan avec trafic)
    let timeInMinutes = Math.round(distance * 3)

    // Ajuster le temps en fonction des informations de trafic
    if (trafficInfo && trafficInfo.congestion_level) {
      const congestionFactor = 1 + trafficInfo.congestion_level / 10 // 0-10 scale
      timeInMinutes = Math.round(timeInMinutes * congestionFactor)
    }

    setEstimatedTime(timeInMinutes)

    // Générer un itinéraire simulé
    const simulatedRoute = generateSimulatedRoute(
      { latitude: startLat, longitude: startLng },
      { latitude: endLat, longitude: endLng },
    )

    setRouteCoordinates(simulatedRoute)
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

  const callCourier = () => {
    if (!courier || !courier.phone) {
      Alert.alert(t("trackDelivery.error"), t("trackDelivery.phoneNotAvailable"))
      return
    }

    const phoneNumber = courier.phone.startsWith("+") ? courier.phone : `+225${courier.phone}`
    Linking.openURL(`tel:${phoneNumber}`)
  }

  const sendSMS = () => {
    if (!courier || !courier.phone) {
      Alert.alert(t("trackDelivery.error"), t("trackDelivery.phoneNotAvailable"))
      return
    }

    const phoneNumber = courier.phone.startsWith("+") ? courier.phone : `+225${courier.phone}`
    Linking.openURL(`sms:${phoneNumber}`)
  }

  const openMaps = () => {
    if (!courierLocation) {
      Alert.alert(t("trackDelivery.error"), t("trackDelivery.locationNotAvailable"))
      return
    }

    const { latitude, longitude } = courierLocation
    const label = t("trackDelivery.courierLocation")

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    })

    Linking.openURL(url)
  }

  const confirmDelivery = () => {
    if (!isConnected) {
      Alert.alert(t("trackDelivery.offlineTitle"), t("trackDelivery.offlineConfirmDelivery"))
      return
    }

    Alert.alert(t("trackDelivery.confirmDeliveryTitle"), t("trackDelivery.confirmDeliveryMessage"), [
      { text: t("common.no"), style: "cancel" },
      { text: t("common.yes"), onPress: completeDelivery },
    ])
  }

  const completeDelivery = async () => {
    try {
      await updateDeliveryStatus(deliveryId, "completed")

      Alert.alert(t("trackDelivery.deliveryCompleted"), t("trackDelivery.rateDeliveryQuestion"), [
        {
          text: t("trackDelivery.later"),
          onPress: () => navigation.goBack(),
        },
        {
          text: t("trackDelivery.rateNow"),
          onPress: () =>
            navigation.navigate("RateDelivery", {
              deliveryId,
              courierId: courier.id,
            }),
        },
      ])
    } catch (error) {
      console.error("Error completing delivery:", error)
      setError(t("trackDelivery.errorCompletingDelivery"))
      setVisible(true)
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "#FFC107",
      accepted: "#2196F3",
      in_progress: "#FF6B00",
      delivered: "#4CAF50",
      completed: "#4CAF50",
      cancelled: "#F44336",
    }

    return statusColors[status] || "#757575"
  }

  const getStatusText = (status) => {
    return t(`deliveryStatus.${status}`)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("trackDelivery.loading")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("trackDelivery.loadingDetails")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("trackDelivery.error")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={50} color="#F44336" />
          <Text style={styles.errorText}>{t("trackDelivery.deliveryNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.goBack")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("trackDelivery.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statusContainer}>
        <Chip
          style={[styles.statusChip, { backgroundColor: getStatusColor(delivery.status) }]}
          textStyle={styles.statusChipText}
        >
          {getStatusText(delivery.status)}
        </Chip>
        <Text style={styles.deliveryId}>
          {t("trackDelivery.delivery")} #{delivery.id}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={
            courierLocation
              ? {
                  latitude: courierLocation.latitude,
                  longitude: courierLocation.longitude,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                }
              : delivery.pickup_lat && delivery.pickup_lng
                ? {
                    latitude: delivery.pickup_lat,
                    longitude: delivery.pickup_lng,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                  }
                : {
                    latitude: 5.3599517,
                    longitude: -4.0082563, // Coordonnées d'Abidjan par défaut
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }
          }
        >
          {/* Marqueur de la position de l'utilisateur */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              title={t("trackDelivery.yourPosition")}
              pinColor="#4285F4"
            />
          )}

          {/* Marqueur du point de ramassage */}
          {delivery.pickup_lat && delivery.pickup_lng && (
            <Marker
              coordinate={{
                latitude: delivery.pickup_lat,
                longitude: delivery.pickup_lng,
              }}
              title={t("trackDelivery.pickupPoint")}
              pinColor="#FF6B00"
            />
          )}

          {/* Marqueur du point de livraison */}
          {delivery.delivery_lat && delivery.delivery_lng && (
            <Marker
              coordinate={{
                latitude: delivery.delivery_lat,
                longitude: delivery.delivery_lng,
              }}
              title={t("trackDelivery.deliveryPoint")}
              pinColor="#4CAF50"
            />
          )}

          {/* Marqueur de la position du coursier */}
          {courierLocation && (
            <Marker
              coordinate={{
                latitude: courierLocation.latitude,
                longitude: courierLocation.longitude,
              }}
              title={t("trackDelivery.courier")}
            >
              <View style={styles.courierMarker}>
                <IconButton icon="navigation" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Tracé de l'itinéraire */}
          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor="#4285F4" />
          )}
        </MapView>

        {/* Informations sur l'itinéraire */}
        {distance && estimatedTime && (
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeInfoItem}>
              <IconButton icon="map-marker-distance" size={16} color="#FF6B00" />
              <Text style={styles.routeInfoText}>{distance} km</Text>
            </View>
            <View style={styles.routeInfoItem}>
              <IconButton icon="clock-outline" size={16} color="#FF6B00" />
              <Text style={styles.routeInfoText}>{estimatedTime} min</Text>
            </View>
            {trafficInfo && (
              <View style={styles.routeInfoItem}>
                <IconButton
                  icon={trafficInfo.congestion_level > 5 ? "traffic-light" : "car"}
                  size={16}
                  color={trafficInfo.congestion_level > 5 ? "#F44336" : "#4CAF50"}
                />
                <Text
                  style={[styles.routeInfoText, { color: trafficInfo.congestion_level > 5 ? "#F44336" : "#4CAF50" }]}
                >
                  {trafficInfo.congestion_level > 5 ? t("trackDelivery.heavyTraffic") : t("trackDelivery.lightTraffic")}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Informations sur le coursier */}
      {courier && (
        <Card style={styles.courierCard}>
          <Card.Content>
            <View style={styles.courierHeader}>
              <View style={styles.courierInfo}>
                <Text style={styles.courierTitle}>{t("trackDelivery.yourCourier")}</Text>
                <Text style={styles.courierName}>{courier.full_name}</Text>
                {courier.vehicle_type && <Chip style={styles.vehicleChip}>{courier.vehicle_type}</Chip>}
              </View>
              {courier.profile_picture ? (
                <Card.Cover source={{ uri: courier.profile_picture }} style={styles.courierImage} />
              ) : (
                <View style={styles.courierImagePlaceholder}>
                  <IconButton icon="account" size={30} color="#FFFFFF" />
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="phone"
                onPress={callCourier}
                style={[styles.actionButton, styles.callButton]}
              >
                {t("trackDelivery.call")}
              </Button>
              <Button
                mode="contained"
                icon="message-text"
                onPress={sendSMS}
                style={[styles.actionButton, styles.smsButton]}
              >
                {t("trackDelivery.sms")}
              </Button>
              <Button
                mode="contained"
                icon="map-marker"
                onPress={openMaps}
                style={[styles.actionButton, styles.mapButton]}
              >
                {t("trackDelivery.openMaps")}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Bouton de confirmation de livraison */}
      {delivery.status === "delivered" && (
        <Button mode="contained" icon="check-circle" onPress={confirmDelivery} style={styles.confirmButton}>
          {t("trackDelivery.confirmDelivery")}
        </Button>
      )}
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
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: "#FF6B00",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  statusChip: {
    height: 30,
  },
  statusChipText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  deliveryId: {
    fontSize: 14,
    color: "#757575",
  },
  mapContainer: {
    height: 300,
    width: "100%",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  courierMarker: {
    backgroundColor: "#FF6B00",
    borderRadius: 20,
    padding: 5,
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
  courierCard: {
    margin: 16,
    elevation: 2,
  },
  courierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courierInfo: {
    flex: 1,
  },
  courierTitle: {
    fontSize: 14,
    color: "#757575",
  },
  courierName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginVertical: 4,
  },
  vehicleChip: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    height: 24,
  },
  courierImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  courierImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    marginVertical: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: "#4CAF50",
  },
  smsButton: {
    backgroundColor: "#2196F3",
  },
  mapButton: {
    backgroundColor: "#FF9800",
  },
  confirmButton: {
    margin: 16,
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
  },
})

export default TrackDeliveryScreen
