"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from "react-native"
import { Text, Card, Button, Chip, ActivityIndicator, Badge, Avatar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { useWebSocket } from "../../contexts/WebSocketContext"
import { useNotification } from "../../contexts/NotificationContext"
import { useTranslation } from "react-i18next"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import {
  fetchAvailableDeliveries,
  fetchCourierProfile,
  updateCourierStatus,
  fetchWeatherForecast,
} from "../../services/api"
import { formatPrice, formatDistance, formatDate } from "../../utils/formatters"
import type { CourierHomeScreenNavigationProp } from "../../types/navigation"
import type { Delivery, Weather } from "../../types/models"

type CourierHomeScreenProps = {
  navigation: CourierHomeScreenNavigationProp
}

const { width } = Dimensions.get("window")

const CourierHomeScreen: React.FC<CourierHomeScreenProps> = ({ navigation }) => {
  const { user, updateUserData } = useAuth()
  const { isConnected, isOfflineMode } = useNetwork()
  const { sendMessage } = useWebSocket()
  const { unreadCount } = useNotification()
  const { t } = useTranslation()

  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [statusLoading, setStatusLoading] = useState<boolean>(false)
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([])
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async (): Promise<void> => {
    try {
      setLoading(true)

      // Vérifier les permissions de localisation
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setLocationPermissionDenied(true)
        setLoading(false)
        return
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setCurrentLocation(location)

      // Charger le profil du coursier
      const profileData = await fetchCourierProfile()
      setIsOnline(profileData.is_online)

      // Charger les livraisons disponibles
      await loadAvailableDeliveries()

      // Charger les données météo
      const weatherData = await fetchWeatherForecast(location.coords.latitude, location.coords.longitude)
      setWeather(weatherData)
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableDeliveries = async (): Promise<void> => {
    try {
      const deliveries = await fetchAvailableDeliveries()
      setAvailableDeliveries(deliveries)
    } catch (error) {
      console.error("Error loading available deliveries:", error)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadInitialData()
    setRefreshing(false)
  }, [])

  const toggleOnlineStatus = async (): Promise<void> => {
    if (!isConnected && !isOfflineMode) {
      return
    }

    try {
      setStatusLoading(true)
      const newStatus = !isOnline

      if (newStatus) {
        // Vérifier les permissions de localisation
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          setStatusLoading(false)
          return
        }

        // Obtenir la position actuelle
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        // Mettre à jour le statut avec la position
        await updateCourierStatus(newStatus, location.coords.latitude, location.coords.longitude)
      } else {
        // Simplement mettre à jour le statut
        await updateCourierStatus(newStatus)
      }

      // Mettre à jour l'état local
      setIsOnline(newStatus)

      // Mettre à jour les données utilisateur
      updateUserData({ is_online: newStatus })

      // Envoyer un message WebSocket pour informer le serveur du changement de statut
      if (isConnected) {
        sendMessage({
          type: "courier_status_update",
          data: {
            courier_id: user?.id,
            is_online: newStatus,
            location: currentLocation
              ? {
                  lat: currentLocation.coords.latitude,
                  lng: currentLocation.coords.longitude,
                }
              : null,
          },
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setStatusLoading(false)
    }
  }

  const getWeatherIcon = (condition: string): string => {
    switch (condition.toLowerCase()) {
      case "clear":
      case "sunny":
        return "sun"
      case "partly cloudy":
        return "cloud"
      case "cloudy":
        return "cloud"
      case "overcast":
        return "cloud"
      case "mist":
      case "fog":
        return "cloud-drizzle"
      case "rain":
      case "light rain":
      case "moderate rain":
        return "cloud-rain"
      case "heavy rain":
        return "cloud-rain"
      case "thunderstorm":
        return "cloud-lightning"
      default:
        return "cloud"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar.Image
            size={40}
            source={
              user?.profile_picture ? { uri: user.profile_picture } : require("../../assets/images/default-avatar.png")
            }
          />
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.full_name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("Notifications")}>
            <Feather name="bell" size={24} color="#212121" />
            {unreadCount > 0 && (
              <Badge style={styles.notificationBadge} size={16}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : locationPermissionDenied ? (
          <View style={styles.permissionDeniedContainer}>
            <Feather name="map-pin-off" size={64} color="#FF6B00" />
            <Text style={styles.permissionDeniedTitle}>Localisation requise</Text>
            <Text style={styles.permissionDeniedText}>
              Pour utiliser cette application en tant que coursier, vous devez autoriser l'accès à votre position.
            </Text>
            <Button
              mode="contained"
              onPress={async () => {
                const { status } = await Location.requestForegroundPermissionsAsync()
                if (status === "granted") {
                  setLocationPermissionDenied(false)
                  loadInitialData()
                }
              }}
              style={styles.permissionButton}
            >
              Autoriser la localisation
            </Button>
          </View>
        ) : (
          <>
            {/* Carte avec la position actuelle */}
            {currentLocation && (
              <Card style={styles.mapCard}>
                <Card.Content style={styles.mapContainer}>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                      latitude: currentLocation.coords.latitude,
                      longitude: currentLocation.coords.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsUserLocation
                    showsMyLocationButton
                  >
                    {availableDeliveries.map(
                      (delivery) =>
                        delivery.pickup_lat &&
                        delivery.pickup_lng && (
                          <Marker
                            key={delivery.id}
                            coordinate={{
                              latitude: delivery.pickup_lat,
                              longitude: delivery.pickup_lng,
                            }}
                            title={`Livraison #${delivery.id}`}
                            description={delivery.pickup_address}
                            pinColor="#FF6B00"
                          />
                        ),
                    )}
                  </MapView>
                </Card.Content>
              </Card>
            )}

            {/* Statut en ligne/hors ligne */}
            <Card style={styles.statusCard}>
              <Card.Content>
                <View style={styles.statusContainer}>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>Statut</Text>
                    <View style={styles.statusIndicator}>
                      <View style={[styles.statusDot, { backgroundColor: isOnline ? "#4CAF50" : "#F44336" }]} />
                      <Text style={styles.statusText}>{isOnline ? "En ligne" : "Hors ligne"}</Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    onPress={toggleOnlineStatus}
                    loading={statusLoading}
                    disabled={statusLoading}
                    style={[styles.statusButton, { backgroundColor: isOnline ? "#F44336" : "#4CAF50" }]}
                  >
                    {isOnline ? "Passer hors ligne" : "Passer en ligne"}
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Météo */}
            {weather && (
              <Card style={styles.weatherCard}>
                <Card.Content>
                  <View style={styles.weatherContainer}>
                    <Feather name={getWeatherIcon(weather.current.condition)} size={36} color="#FF6B00" />
                    <View style={styles.weatherInfo}>
                      <Text style={styles.weatherTemperature}>{weather.current.temperature}°C</Text>
                      <Text style={styles.weatherCondition}>{weather.current.condition}</Text>
                    </View>
                    <View style={styles.weatherDetails}>
                      <View style={styles.weatherDetail}>
                        <Feather name="droplet" size={14} color="#2196F3" />
                        <Text style={styles.weatherDetailText}>{weather.current.humidity}%</Text>
                      </View>
                      <View style={styles.weatherDetail}>
                        <Feather name="wind" size={14} color="#607D8B" />
                        <Text style={styles.weatherDetailText}>{weather.current.wind_speed} km/h</Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Actions rapides */}
            <Card style={styles.actionsCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Actions rapides</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CourierStatus")}>
                    <View style={[styles.actionIconContainer, { backgroundColor: "#FF6B00" }]}>
                      <Feather name="activity" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionText}>Mon statut</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CourierStats")}>
                    <View style={[styles.actionIconContainer, { backgroundColor: "#2196F3" }]}>
                      <Feather name="bar-chart-2" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionText}>Statistiques</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate("CollaborativeDeliveries")}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: "#4CAF50" }]}>
                      <Feather name="users" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionText}>Collaboratif</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate("VehicleManagement")}
                  >
                    <View style={[styles.actionButtonIcon, { backgroundColor: "#FF9800" }]}>
                      <Icon name="truck" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionButtonText}>{t("courierHome.manageVehicles")}</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* Livraisons disponibles */}
            <View style={styles.deliveriesSection}>
              <Text style={styles.sectionTitle}>Livraisons disponibles</Text>
              {availableDeliveries.length > 0 ? (
                availableDeliveries.map((delivery) => (
                  <Card
                    key={delivery.id}
                    style={styles.deliveryCard}
                    onPress={() => navigation.navigate("Bid", { deliveryId: delivery.id })}
                  >
                    <Card.Content>
                      <View style={styles.deliveryHeader}>
                        <View style={styles.deliveryInfo}>
                          <Text style={styles.deliveryId}>Livraison #{delivery.id}</Text>
                          <Text style={styles.deliveryDate}>{formatDate(delivery.created_at)}</Text>
                        </View>
                        <Text style={styles.deliveryPrice}>{formatPrice(delivery.proposed_price)} FCFA</Text>
                      </View>

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

                      {delivery.distance && (
                        <View style={styles.deliveryFooter}>
                          <Chip icon="map-marker-distance">{formatDistance(delivery.distance)}</Chip>
                          {delivery.type === "express" && (
                            <Chip icon="flash" style={styles.expressChip}>
                              Express
                            </Chip>
                          )}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="package" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyStateText}>Aucune livraison disponible pour le moment</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: "#757575",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#F44336",
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  mapCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  mapContainer: {
    height: 200,
    padding: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  statusCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#212121",
  },
  statusButton: {
    borderRadius: 20,
  },
  weatherCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  weatherContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherInfo: {
    flex: 1,
    marginLeft: 16,
  },
  weatherTemperature: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  weatherCondition: {
    fontSize: 14,
    color: "#757575",
  },
  weatherDetails: {
    alignItems: "flex-end",
  },
  weatherDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  weatherDetailText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#757575",
  },
  actionsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#212121",
  },
  actionButtonText: {
    fontSize: 12,
    color: "#212121",
  },
  deliveriesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  deliveryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
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
  deliveryFooter: {
    flexDirection: "row",
    marginTop: 8,
  },
  expressChip: {
    marginLeft: 8,
    backgroundColor: "#FFF3E0",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyStateText: {
    marginTop: 16,
    color: "#757575",
    textAlign: "center",
  },
  permissionDeniedContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    margin: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  permissionDeniedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
    marginBottom: 8,
  },
  permissionDeniedText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#FF6B00",
  },
})

export default CourierHomeScreen
