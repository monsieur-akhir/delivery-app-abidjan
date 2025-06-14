"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { View, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from "react-native"
import { Text, Card, Button, Avatar, Chip, Divider, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView from "react-native-maps"
import { CustomMapView } from "../../components"
import type { Route as MapRoute } from "../../components"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { useWebSocket } from "../../contexts/WebSocketContext"
import { useDelivery } from "../../hooks"
import { formatPrice, formatDate } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery, Courier, Coordinates, DeliveryStatus } from "../../types/models"

// Define the missing API functions
const fetchDeliveryRoute = async (_deliveryId: string): Promise<MapRoute> => {
  // Implementation would call the actual API
  // This is a placeholder that returns a default route
  return {
    coordinates: [],
    distance: 0,
    duration: 0,
    instructions: []
  }
}

const getETA = async (_deliveryId: string): Promise<{ eta_minutes: number }> => {
  // Implementation would call the actual API
  // This is a placeholder that returns a default value
  return { eta_minutes: 15 }
}

type TrackDeliveryScreenProps = {
  route: RouteProp<RootStackParamList, "TrackDelivery">
  navigation: NativeStackNavigationProp<RootStackParamList, "TrackDelivery">
}

interface DeliveryStatusInfo {
  icon: string
  color: string
  label: string
  description: string
}

const TrackDeliveryScreen: React.FC<TrackDeliveryScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { isConnected } = useNetwork()
  const { subscribe } = useWebSocket()
  const { getDeliveryDetails } = useDelivery()
  const mapRef = useRef<MapView | null>(null)

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [courier, setCourier] = useState<Courier | null>(null)
  const [courierLocation, setCourierLocation] = useState<Coordinates | null>(null)
  const [deliveryRoute, setDeliveryRoute] = useState<MapRoute | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  // Define update handlers using useCallback before using them in useEffect
  const updateEta = useCallback(async (): Promise<void> => {
    if (!isConnected || !delivery) return

    try {
      const etaData = await getETA(deliveryId.toString())
      setEta(etaData.eta_minutes)
    } catch (error) {
      console.error("Error updating ETA:", error)
    }
  }, [isConnected, delivery, deliveryId])

  const handleLocationUpdate = useCallback((data: Record<string, unknown>): void => {
    const latitude = data.latitude as number;
    const longitude = data.longitude as number;

    setCourierLocation({
      latitude,
      longitude,
    })

    // Mettre à jour l'ETA si nécessaire
    updateEta()
  }, [updateEta])

  const handleStatusUpdate = useCallback((data: Record<string, unknown>): void => {
    if (delivery) {
      const status = data.status as DeliveryStatus;
      setDelivery({
        ...delivery,
        status,
      })

      // Si la livraison est terminée, naviguer vers l'écran d'évaluation
      if (status === "delivered") {
        Alert.alert(t("trackDelivery.deliveryCompleted"), t("trackDelivery.deliveryCompletedMessage"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("RateDelivery", { deliveryId }),
          },
        ])
      }
    }
  }, [delivery, t, navigation, deliveryId])

  const loadRouteAndEta = useCallback(async (deliveryData: Delivery): Promise<void> => {
    try {
      // Charger l'itinéraire
      const routeData = await fetchDeliveryRoute(deliveryId.toString())
      const etaData = await getETA(deliveryId.toString())
      setDeliveryRoute(routeData)

      // Charger l'ETA
      setEta(etaData.eta_minutes)

      // Centrer la carte sur l'itinéraire
      if (routeData.coordinates.length > 0 && mapRef.current) {
        const coordinates = [
          {
            latitude: deliveryData.pickup_lat || 0,
            longitude: deliveryData.pickup_lng || 0,
          },
          {
            latitude: deliveryData.delivery_lat || 0,
            longitude: deliveryData.delivery_lng || 0,
          },
        ]

        if (routeData.coordinates.length > 0) {
          coordinates.push(...routeData.coordinates)
        }

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        })
      }
    } catch (error) {
      console.error("Error loading route and ETA:", error)
    }
  }, [deliveryId])

  const loadDeliveryDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      // Charger les détails de la livraison avec le hook
      const deliveryData = await getDeliveryDetails(Number(deliveryId))
      if (deliveryData) {
        setDelivery(deliveryData)

        // Si un coursier est assigné, charger ses informations
        if (deliveryData.courier) {
          setCourier(deliveryData.courier)

          // Si la livraison est en cours, charger l'itinéraire et l'ETA
          if (deliveryData.status === "in_progress" || deliveryData.status === "picked_up") {
            await loadRouteAndEta(deliveryData)
          }
        }
      }
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError(t("trackDelivery.errorLoadingDelivery"))
    } finally {
      setLoading(false)
    }
  }, [deliveryId, getDeliveryDetails, loadRouteAndEta, t])

  useEffect(() => {
    loadDeliveryDetails()

    // S'abonner aux mises à jour de localisation du coursier
    const unsubscribeFromLocation = subscribe(`delivery.${deliveryId}.location`, handleLocationUpdate)

    // S'abonner aux mises à jour de statut de la livraison
    const unsubscribeFromStatus = subscribe(`delivery.${deliveryId}.status`, handleStatusUpdate)

    return () => {
      unsubscribeFromLocation()
      unsubscribeFromStatus()
    }
  }, [deliveryId, loadDeliveryDetails, subscribe, handleLocationUpdate, handleStatusUpdate])

  const callCourier = (): void => {
    if (!courier || !courier.phone) {
      Alert.alert(t("trackDelivery.error"), t("trackDelivery.phoneNotAvailable"))
      return
    }

    const phoneNumber = courier.phone.startsWith("+") ? courier.phone : `+225${courier.phone}`
    Linking.openURL(`tel:${phoneNumber}`)
  }

  const messageCourier = (): void => {
    if (!courier || !courier.phone) {
      Alert.alert(t("trackDelivery.error"), t("trackDelivery.phoneNotAvailable"))
      return
    }

    const phoneNumber = courier.phone.startsWith("+") ? courier.phone : `+225${courier.phone}`

    if (Platform.OS === "android") {
      Linking.openURL(`sms:${phoneNumber}`)
    } else {
      Linking.openURL(`sms:${phoneNumber}`)
    }
  }

  const getStatusInfo = (status: DeliveryStatus): DeliveryStatusInfo => {
    switch (status) {
      case "pending":
        return {
          icon: "clock-outline",
          color: "#FFC107",
          label: t("deliveryStatus.pending"),
          description: t("deliveryStatus.pendingDescription"),
        }
      case "accepted":
        return {
          icon: "check-circle-outline",
          color: "#2196F3",
          label: t("deliveryStatus.accepted"),
          description: t("deliveryStatus.acceptedDescription"),
        }
      case "picked_up":
        return {
          icon: "package-up",
          color: "#FF9800",
          label: t("deliveryStatus.pickedUp"),
          description: t("deliveryStatus.pickedUpDescription"),
        }
      case "in_progress":
        return {
          icon: "motorbike",
          color: "#FF6B00",
          label: t("deliveryStatus.inProgress"),
          description: t("deliveryStatus.inProgressDescription"),
        }
      case "delivered":
        return {
          icon: "check-circle",
          color: "#4CAF50",
          label: t("deliveryStatus.delivered"),
          description: t("deliveryStatus.deliveredDescription"),
        }
      case "cancelled":
        return {
          icon: "close-circle",
          color: "#F44336",
          label: t("deliveryStatus.cancelled"),
          description: t("deliveryStatus.cancelledDescription"),
        }
      default:
        return {
          icon: "help-circle-outline",
          color: "#9E9E9E",
          label: t("deliveryStatus.unknown"),
          description: t("deliveryStatus.unknownDescription"),
        }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} iconColor="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("trackDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("trackDelivery.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} iconColor="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("trackDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle-outline" size={50} iconColor="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={loadDeliveryDetails} style={styles.retryButton}>
            {t("common.retry")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} iconColor="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("trackDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.errorContainer}>
          <IconButton icon="package-variant" size={50} iconColor="#9E9E9E" />
          <Text style={styles.errorText}>{t("trackDelivery.deliveryNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.back")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const statusInfo = getStatusInfo(delivery.status)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("trackDelivery.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.mapContainer}>
        <CustomMapView
          style={styles.map}
          initialRegion={{
            latitude: delivery.pickup_lat || 5.3599517,
            longitude: delivery.pickup_lng || -4.0082563,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          deliveries={[delivery]}
          route={deliveryRoute || undefined}
          showsTraffic={true}
        />

        {/* Indicateur d'ETA */}
        {eta !== null && (delivery.status === "in_progress" || delivery.status === "picked_up") && (
          <View style={styles.etaContainer}>
            <Text style={styles.etaLabel}>{t("trackDelivery.estimatedArrival")}</Text>
            <Text style={styles.etaTime}>{eta} min</Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <IconButton icon={statusInfo.icon} size={24} iconColor={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
        <Text style={styles.statusDescription}>{statusInfo.description}</Text>
      </View>

      <Card style={styles.deliveryCard}>
        <Card.Content>
          <View style={styles.deliveryHeader}>
            <Text style={styles.deliveryTitle}>{t("trackDelivery.deliveryDetails")}</Text>
            <Chip icon="package" style={styles.deliveryIdChip}>
              #{deliveryId}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.addressContainer}>
            <View style={styles.addressItem}>
              <IconButton icon="map-marker" size={20} iconColor="#FF6B00" style={styles.addressIcon} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>{t("trackDelivery.from")}</Text>
                <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                <Text style={styles.communeText}>{delivery.pickup_commune}</Text>
              </View>
            </View>

            <View style={styles.addressDivider}>
              <View style={styles.addressDividerLine} />
            </View>

            <View style={styles.addressItem}>
              <IconButton icon="map-marker" size={20} iconColor="#4CAF50" style={styles.addressIcon} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>{t("trackDelivery.to")}</Text>
                <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                <Text style={styles.communeText}>{delivery.delivery_commune}</Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t("trackDelivery.price")}</Text>
              <Text style={styles.detailValue}>
                {formatPrice(delivery.final_price || delivery.proposed_price)} FCFA
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t("trackDelivery.distance")}</Text>
              <Text style={styles.detailValue}>{delivery.distance || "-"} km</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t("trackDelivery.date")}</Text>
              <Text style={styles.detailValue}>{formatDate(delivery.created_at)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {courier && (
        <Card style={styles.courierCard}>
          <Card.Content>
            <View style={styles.courierHeader}>
              <View style={styles.courierInfo}>
                <Avatar.Image size={50} source={{ uri: courier.profile_picture || "https://via.placeholder.com/50" }} />
                <View style={styles.courierDetails}>
                  <Text style={styles.courierName}>{courier.full_name}</Text>
                  <View style={styles.courierRating}>
                    <IconButton icon="star" size={16} iconColor="#FFC107" style={styles.ratingIcon} />
                    <Text style={styles.ratingText}>
                      {courier.rating?.toFixed(1) || "0.0"} ({courier.rating_count || 0})
                    </Text>
                  </View>
                </View>
              </View>

              <Chip icon="motorbike" style={styles.vehicleChip}>
                {courier.vehicle_type}
              </Chip>
            </View>

            <View style={styles.courierActions}>
              <Button mode="outlined" icon="phone" onPress={callCourier} style={styles.callButton}>
                {t("trackDelivery.call")}
              </Button>

              <Button mode="outlined" icon="message-text" onPress={messageCourier} style={styles.messageButton}>
                {t("trackDelivery.message")}
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
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
    marginVertical: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#FF6B00",
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#757575",
  },
  mapContainer: {
    height: 250,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  courierMarker: {
    backgroundColor: "#FF6B00",
    borderRadius: 20,
    padding: 4,
  },
  etaContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
    alignItems: "center",
  },
  etaLabel: {
    fontSize: 12,
    color: "#757575",
  },
  etaTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  statusContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusDescription: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
    marginLeft: 40,
  },
  deliveryCard: {
    margin: 16,
    marginBottom: 8,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  deliveryIdChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressIcon: {
    margin: 0,
    padding: 0,
  },
  addressContent: {
    flex: 1,
    marginLeft: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: "#757575",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 2,
  },
  communeText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  addressDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 28,
    marginVertical: 4,
  },
  addressDividerLine: {
    flex: 1,
    height: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    marginLeft: 10,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  courierCard: {
    margin: 16,
    marginTop: 8,
  },
  courierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  courierDetails: {
    marginLeft: 12,
  },
  courierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  courierRating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingIcon: {
    margin: 0,
    padding: 0,
  },
  ratingText: {
    fontSize: 12,
    color: "#757575",
  },
  vehicleChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  courierActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  callButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#4CAF50",
  },
  messageButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: "#2196F3",
  },
})

export default TrackDeliveryScreen