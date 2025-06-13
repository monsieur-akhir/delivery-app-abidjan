/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { View, StyleSheet, TouchableOpacity, Alert, Platform, AppState, type AppStateStatus } from "react-native"
import { Text, Button, Card, Snackbar, ActivityIndicator, Badge } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"

import * as Location from "expo-location"
import { Audio } from "expo-av"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { useWebSocket } from "../../contexts/WebSocketContext"
import {
  fetchDeliveryDetails,
  updateDeliveryStatus,
  sendTrackingPoint,
  getDirections,
  sendDeliveryNotification,
} from "../../services/api"
import { formatPrice, formatTime, formatDistance } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery, DeliveryStatus } from "../../types/models"

type CourierTrackDeliveryScreenProps = {
  route: RouteProp<RootStackParamList, "CourierTrackDelivery">
  navigation: NativeStackNavigationProp<RootStackParamList, "CourierTrackDelivery">
}

interface RouteCoordinate {
  latitude: number
  longitude: number
}

interface TrackingPoint {
  latitude: number
  longitude: number
  timestamp: string
  accuracy: number
  speed: number
}

const LOCATION_TRACKING_INTERVAL = 15000 // 15 secondes
const LOCATION_DISTANCE_FILTER = 10 // 10 mètres

const CourierTrackDeliveryScreen: React.FC<CourierTrackDeliveryScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { user } = useAuth()
  const { isConnected, isOfflineMode, addPendingUpload } = useNetwork()
  const { sendMessage } = useWebSocket()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [statusLoading, setStatusLoading] = useState<boolean>(false)
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([])
  const [trackingHistory, setTrackingHistory] = useState<TrackingPoint[]>([])
  const [isTracking, setIsTracking] = useState<boolean>(false)
  const [remainingDistance, setRemainingDistance] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [error, setError] = useState<string>("")
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false)
  const [arrivedAtPickup, setArrivedAtPickup] = useState<boolean>(false)
  const [arrivedAtDelivery, setArrivedAtDelivery] = useState<boolean>(false)
  const [showClientInfo, setShowClientInfo] = useState<boolean>(false)

  const mapRef = useRef<MapView | null>(null)
  const locationSubscription = useRef<Location.LocationSubscription | null>(null)
  const trackingInterval = useRef<number | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const soundRef = useRef<Audio.Sound | null>(null)

  // Démarrer le suivi de localisation
  const startLocationTracking = useCallback(async (): Promise<void> => {
    try {
      // Arrêter tout suivi existant
      stopLocationTracking()

      // Configurer le suivi de localisation en arrière-plan
      await Location.startLocationUpdatesAsync("tracking-task", {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: LOCATION_DISTANCE_FILTER,
        timeInterval: LOCATION_TRACKING_INTERVAL,
        foregroundService: {
          notificationTitle: "Suivi de livraison",
          notificationBody: "Votre position est partagée avec le client",
        },
      })

      // Configurer le suivi de localisation au premier plan
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: LOCATION_DISTANCE_FILTER,
          timeInterval: LOCATION_TRACKING_INTERVAL,
        },
        handleLocationUpdate,
      )

      // Configurer l'intervalle d'envoi des points de suivi
      trackingInterval.current = setInterval(sendCurrentLocation, LOCATION_TRACKING_INTERVAL) as unknown as number

      setIsTracking(true)
    } catch (error) {
      console.error("Error starting location tracking:", error)
      setError("Erreur lors du démarrage du suivi de localisation")
      setSnackbarVisible(true)
    }
  }, [handleLocationUpdate, sendCurrentLocation])

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        // L'application revient au premier plan
        if (isTracking) {
          stopLocationTracking()
          startLocationTracking()
        }
      } else if (nextAppState.match(/inactive|background/) && appStateRef.current === "active") {
        // L'application passe en arrière-plan
        if (Platform.OS === "ios") {
          // Sur iOS, le suivi de localisation en arrière-plan nécessite des configurations spéciales
          stopLocationTracking()
        }
      }
      appStateRef.current = nextAppState
    },
    [isTracking, startLocationTracking],
  )

  const loadDeliveryDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)

      // Vérifier si le coursier est bien assigné à cette livraison
      if (data.courier_id !== user?.id) {
        Alert.alert("Accès non autorisé", "Vous n'êtes pas le coursier assigné à cette livraison.", [
          { text: "Retour", onPress: () => navigation.goBack() },
        ])
        return
      }

      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setLocationPermissionDenied(true)
        return
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setCurrentLocation(location)

      // Charger l'itinéraire initial
      if (data.status === "accepted") {
        // Si la livraison est acceptée, l'itinéraire va de la position actuelle au point de ramassage
        if (data.pickup_lat && data.pickup_lng) {
          loadRoute(location.coords.latitude, location.coords.longitude, data.pickup_lat, data.pickup_lng)
        }
      } else if (data.status === "in_progress") {
        // Si la livraison est en cours, l'itinéraire va du point de ramassage au point de livraison
        if (data.pickup_lat && data.pickup_lng && data.delivery_lat && data.delivery_lng) {
          loadRoute(location.coords.latitude, location.coords.longitude, data.delivery_lat, data.delivery_lng)
        }
      }

      // Démarrer le suivi de localisation si la livraison est en cours
      if (data.status === "accepted" || data.status === "in_progress") {
        startLocationTracking()
      }
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError("Erreur lors du chargement des détails de la livraison")
      setSnackbarVisible(true)
    } finally {
      setLoading(false)
    }
  }, [deliveryId, navigation, user, startLocationTracking])

  // Charger l'itinéraire entre deux points
  const loadRoute = async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<void> => {
    try {
      // Dans une application réelle, vous utiliseriez un service comme Google Directions API
      const directions = await getDirections(startLat, startLng, endLat, endLng)

      if (directions && directions.routes && directions.routes.length > 0) {
        const route = directions.routes[0]
        setRouteCoordinates(route.coordinates)
        setRemainingDistance(route.distance)
        setRemainingTime(route.duration)

        // Ajuster la vue de la carte pour montrer l'itinéraire complet
        if (mapRef.current && route.coordinates.length > 0) {
          mapRef.current.fitToCoordinates(route.coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          })
        }
      }
    } catch (error) {
      console.error("Error loading route:", error)
    }
  }

  // Arrêter le suivi de localisation
  const stopLocationTracking = (): void => {
    // Arrêter le suivi de localisation en arrière-plan
    Location.hasStartedLocationUpdatesAsync("tracking-task").then((hasStarted) => {
      if (hasStarted) {
        Location.stopLocationUpdatesAsync("tracking-task")
      }
    })

    // Arrêter le suivi de localisation au premier plan
    if (locationSubscription.current) {
      locationSubscription.current.remove()
      locationSubscription.current = null
    }

    // Arrêter l'intervalle d'envoi des points de suivi
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current)
      trackingInterval.current = null
    }

    setIsTracking(false)
  }

  function handleLocationUpdate(location: Location.LocationObject): void {
    setCurrentLocation(location)
    updateRouteWithNewLocation(location)
    checkArrivalStatus(location)
    const newPoint: TrackingPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
      accuracy: location.coords.accuracy || 0,
      speed: location.coords.speed || 0,
    }
    setTrackingHistory((prev) => [...prev, newPoint])
  }

  // Mettre à jour l'itinéraire en fonction de la nouvelle position
  const updateRouteWithNewLocation = (location: Location.LocationObject): void => {
    if (!delivery) return

    // Mettre à jour l'itinéraire en fonction du statut de la livraison
    if (delivery.status === "accepted" && delivery.pickup_lat && delivery.pickup_lng) {
      loadRoute(location.coords.latitude, location.coords.longitude, delivery.pickup_lat, delivery.pickup_lng)
    } else if (delivery.status === "in_progress" && delivery.delivery_lat && delivery.delivery_lng) {
      loadRoute(location.coords.latitude, location.coords.longitude, delivery.delivery_lat, delivery.delivery_lng)
    }
  }

  // Vérifier si le coursier est arrivé au point de ramassage ou de livraison
  const checkArrivalStatus = (location: Location.LocationObject): void => {
    if (!delivery) return

    const ARRIVAL_THRESHOLD = 50 // 50 mètres

    // Vérifier si le coursier est arrivé au point de ramassage
    if (delivery.status === "accepted" && delivery.pickup_lat && delivery.pickup_lng && !arrivedAtPickup) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        delivery.pickup_lat,
        delivery.pickup_lng,
      )

      if (distance <= ARRIVAL_THRESHOLD) {
        setArrivedAtPickup(true)
        playArrivalSound()
        Alert.alert(
          "Arrivée au point de ramassage",
          "Vous êtes arrivé au point de ramassage. Récupérez le colis et commencez la livraison.",
          [
            { text: "Plus tard" },
            {
              text: "Commencer la livraison",
              onPress: () => updateStatus("in_progress"),
            },
          ],
        )
      }
    }

    // Vérifier si le coursier est arrivé au point de livraison
    if (delivery.status === "in_progress" && delivery.delivery_lat && delivery.delivery_lng && !arrivedAtDelivery) {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        delivery.delivery_lat,
        delivery.delivery_lng,
      )

      if (distance <= ARRIVAL_THRESHOLD) {
        setArrivedAtDelivery(true)
        playArrivalSound()
        Alert.alert("Arrivée au point de livraison", "Vous êtes arrivé à destination. Livrez le colis au client.", [
          { text: "Plus tard" },
          {
            text: "Confirmer la livraison",
            onPress: () => updateStatus("delivered"),
          },
        ])
      }
    }
  }

  // Calculer la distance entre deux points géographiques
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c * 1000 // Distance en mètres
    return distance
  }

  // Convertir des degrés en radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180)
  }

  // Jouer le son d'arrivée
  const playArrivalSound = async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { sound } = await Audio.Sound.createAsync(require("../../assets/sounds/arrival.mp3"))
      soundRef.current = sound
      await sound.playAsync()
    } catch (error) {
      console.error("Error playing sound:", error)
    }
  }

  async function sendCurrentLocation(): Promise<void> {
    if (!currentLocation || !delivery || !isConnected) return
    try {
      const trackingData = {
        delivery_id: deliveryId,
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
        speed: currentLocation.coords.speed || 0,
        timestamp: new Date().toISOString(),
      }
      if (isOfflineMode) {
        addPendingUpload({
          type: "tracking",
          data: trackingData,
        })
      } else {
        await sendTrackingPoint(trackingData)
        sendMessage({
          type: "tracking_update",
          data: {
            delivery_id: deliveryId,
            courier_id: user?.id,
            location: {
              lat: currentLocation.coords.latitude,
              lng: currentLocation.coords.longitude,
              timestamp: new Date().toISOString(),
            },
          },
        })
      }
    } catch (error) {
      console.error("Error sending tracking point:", error)
    }
  }

  // Mettre à jour le statut de la livraison
  const updateStatus = async (status: Delivery["status"]): Promise<void> => {
    if (!delivery) return

    try {
      setStatusLoading(true)

      if (isOfflineMode && !isConnected) {
        // Utiliser un type valide pour PendingOperation
        addPendingUpload({
          type: "delivery",
          data: {
            delivery_id: deliveryId,
            status,
            operation: "status_update"
          },
          retries: 0
        })

        // Mettre à jour l'état local
        setDelivery({ ...delivery, status })

        Alert.alert("Mise à jour enregistrée", "Le statut sera mis à jour lorsque vous serez en ligne.")
      } else {
        // Mettre à jour immédiatement
        await updateDeliveryStatus(deliveryId, status)

        // Mettre à jour l'état local
        setDelivery({ ...delivery, status })

        // Envoyer une notification au client
        let message = ""
        if (status === "in_progress") {
          message = "Le coursier a récupéré votre colis et est en route pour la livraison."
        } else if (status === "delivered") {
          message = "Votre colis a été livré. Veuillez confirmer la réception."
        }

        if (message && delivery.user_id) {
          await sendDeliveryNotification(delivery.user_id.toString(), {
            title: "Mise à jour de votre livraison",
            body: message,
            data: { delivery_id: deliveryId, status },
            type: "",
            message: ""
          })
        }

        // Mettre à jour l'itinéraire si nécessaire
        if (status === "in_progress" && currentLocation && delivery.delivery_lat && delivery.delivery_lng) {
          loadRoute(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            delivery.delivery_lat,
            delivery.delivery_lng,
          )
        }
      }
    } catch (error) {
      console.error("Error updating delivery status:", error)
      setError("Erreur lors de la mise à jour du statut")
      setSnackbarVisible(true)
    } finally {
      setStatusLoading(false)
    }
  }

  // Charger les détails de la livraison au montage du composant et lors du changement de deliveryId
  useEffect(() => {
    loadDeliveryDetails()
    return () => {
      stopLocationTracking()
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [deliveryId, loadDeliveryDetails])

  // Gérer les changements d'état de l'application (premier plan/arrière-plan)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [isTracking, handleAppStateChange])

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
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement des détails de la livraison...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (locationPermissionDenied) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suivi de livraison</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.permissionDeniedContainer}>
          <Feather name="map-pin" size={64} color="#FF6B00" />
          <Text style={styles.permissionDeniedTitle}>Localisation requise</Text>
          <Text style={styles.permissionDeniedText}>
            Pour suivre cette livraison, vous devez autoriser l&apos;accès à votre position.
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync()
              if (status === "granted") {
                setLocationPermissionDenied(false)
                loadDeliveryDetails()
              }
            }}
            style={styles.permissionButton}
          >
            Autoriser la localisation
          </Button>
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
        <Text style={styles.headerTitle}>Livraison #{delivery.id}</Text>
        <TouchableOpacity onPress={() => setShowClientInfo(!showClientInfo)}>
          <Feather name="info" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsTraffic={true}
            {...{} /* Cast to enforce type compatibility */}
          >
            {/* Point de ramassage */}
            {delivery.pickup_lat && delivery.pickup_lng && (
              <Marker
                coordinate={{
                  latitude: delivery.pickup_lat,
                  longitude: delivery.pickup_lng,
                }}
                title="Point de ramassage"
                description={delivery.pickup_address}
                pinColor="#FF6B00"
              />
            )}

            {/* Point de livraison */}
            {delivery.delivery_lat && delivery.delivery_lng && (
              <Marker
                coordinate={{
                  latitude: delivery.delivery_lat,
                  longitude: delivery.delivery_lng,
                }}
                title="Point de livraison"
                description={delivery.delivery_address}
                pinColor="#4CAF50"
              />
            )}

            {/* Itinéraire */}
            {routeCoordinates.length > 0 && (
              <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="#4285F4" />
            )}

            {/* Historique de suivi */}
            {trackingHistory.length > 1 && (
              <Polyline
                coordinates={trackingHistory.map((point) => ({
                  latitude: point.latitude,
                  longitude: point.longitude,
                }))}
                strokeWidth={3}
                strokeColor="#FF6B00"
                lineDashPattern={[0, 4, 8]}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.mapPlaceholderText}>Chargement de la carte...</Text>
          </View>
        )}

        {/* Informations de navigation */}
        {remainingDistance !== null && remainingTime !== null && (
          <View style={styles.navigationInfo}>
            <View style={styles.navigationInfoItem}>
              <Feather name="map" size={16} color="#FF6B00" />
              <Text style={styles.navigationInfoText}>{formatDistance(remainingDistance)}</Text>
            </View>
            <View style={styles.navigationInfoItem}>
              <Feather name="clock" size={16} color="#FF6B00" />
              <Text style={styles.navigationInfoText}>{formatTime(String(remainingTime))}</Text>
            </View>
          </View>
        )}

        {/* Bouton de centrage sur la position actuelle */}
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            if (mapRef.current && currentLocation) {
              mapRef.current.animateToRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              })
            }
          }}
        >
          <Feather name="crosshair" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      {/* Informations du client (affichées conditionnellement) */}
      {showClientInfo && delivery.user_id && (
        <Card style={styles.clientCard}>
          <Card.Content>
            <View style={styles.clientHeader}>
              <Text style={styles.clientTitle}>Informations du client</Text>
              <TouchableOpacity onPress={() => setShowClientInfo(false)}>
                <Feather name="x" size={20} color="#757575" />
              </TouchableOpacity>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{delivery.user_id}</Text>
              {/* Afficher d'autres informations si nécessaire */}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Détails de la livraison */}
      <Card style={styles.deliveryCard}>
        <Card.Content>
          <View style={styles.deliveryHeader}>
            <View>
              <Text style={styles.deliveryStatus}>
                {delivery.status === "accepted"
                  ? "À récupérer"
                  : delivery.status === "in_progress"
                    ? "En cours de livraison"
                    : delivery.status === "delivered"
                      ? "Livré"
                      : "Terminé"}
              </Text>
              <Text style={styles.deliveryPrice}>
                {formatPrice(delivery.final_price || delivery.proposed_price)} FCFA
              </Text>
            </View>
            <View style={styles.deliveryStatusBadge}>
              {isTracking ? (
                <Badge size={12} style={styles.trackingBadge} />
              ) : (
                <Badge size={12} style={styles.notTrackingBadge} />
              )}
              <Text style={styles.trackingStatus}>{isTracking ? "Suivi actif" : "Suivi inactif"}</Text>
            </View>
          </View>

          <View style={styles.addressContainer}>
            {delivery.status === "accepted" ? (
              <>
                <View style={styles.addressRow}>
                  <View style={styles.addressDot} />
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressLabel}>Ramassage</Text>
                    <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                    <Text style={styles.communeText}>Commune de retrait</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.addressRow}>
                  <View style={[styles.addressDot, styles.completedDot]} />
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressLabel}>Ramassage (Complété)</Text>
                    <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                    <Text style={styles.communeText}>Commune de retrait</Text>
                  </View>
                </View>

                <View style={styles.addressLine} />

                <View style={styles.addressRow}>
                  <View style={[styles.addressDot, styles.destinationDot]} />
                  <View style={styles.addressTextContainer}>
                    <Text style={styles.addressLabel}>Livraison</Text>
                    <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                    <Text style={styles.communeText}>Commune de retrait</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {delivery.package_description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description :</Text>
              <Text style={styles.descriptionText}>{delivery.package_description}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {delivery.status === "accepted" && (
          <Button
            mode="contained"
            onPress={() => updateStatus("in_progress")}
            style={styles.actionButton}
            loading={statusLoading}
            disabled={statusLoading}
            icon="package-up"
          >
            J&apos;ai récupéré le colis
          </Button>
        )}

        {delivery.status === "in_progress" && (
          <Button
            mode="contained"
            onPress={() => updateStatus("delivered")}
            style={styles.actionButton}
            loading={statusLoading}
            disabled={statusLoading}
            icon="package-down"
          >
            J&apos;ai livré le colis
          </Button>
        )}

        {delivery.status === "delivered" && (
          <View style={styles.deliveredMessage}>
            <Feather name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.deliveredText}>Livraison effectuée. En attente de confirmation du client.</Text>
          </View>
        )}

        {!isTracking && delivery.status !== "delivered" && delivery.status !== "completed" && (
          <Button mode="outlined" onPress={startLocationTracking} style={styles.trackingButton} icon="map-marker">
            Activer le suivi
          </Button>
        )}

        {isTracking && (
          <Button
            mode="outlined"
            onPress={stopLocationTracking}
            style={styles.stopTrackingButton}
            icon="map-marker-off"
          >
            Désactiver le suivi
          </Button>
        )}
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
    fontSize: 16,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    padding: 8,
  },
  offlineText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
  },
  mapContainer: {
    height: 300,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  mapPlaceholderText: {
    marginTop: 16,
    color: "#757575",
  },
  navigationInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 12,
    elevation: 3,
  },
  navigationInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigationInfoText: {
    marginLeft: 8,
    fontWeight: "bold",
    color: "#212121",
    fontSize: 16,
  },
  centerButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  clientCard: {
    margin: 16,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  clientInfo: {
    marginTop: 8,
  },
  clientName: {
    fontSize: 16,
    color: "#212121",
  },
  clientContact: {
    flexDirection: "row",
    marginTop: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  contactButtonText: {
    marginLeft: 8,
    color: "#212121",
  },
  deliveryCard: {
    margin: 16,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  deliveryStatus: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  deliveryPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
    marginTop: 4,
  },
  deliveryStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  trackingBadge: {
    backgroundColor: "#4CAF50",
  },
  notTrackingBadge: {
    backgroundColor: "#F44336",
  },
  trackingStatus: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
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
  completedDot: {
    backgroundColor: "#9E9E9E",
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
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: "#FF6B00",
    marginBottom: 12,
  },
  trackingButton: {
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  stopTrackingButton: {
    borderColor: "#F44336",
    borderWidth: 1,
  },
  deliveredMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  deliveredText: {
    marginLeft: 12,
    color: "#2E7D32",
    flex: 1,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionDeniedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionDeniedText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#FF6B00",
  },
})

export default CourierTrackDeliveryScreen