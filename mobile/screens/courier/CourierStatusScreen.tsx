/* eslint-disable react/no-unescaped-entities */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Text, Card, Button, Divider, ActivityIndicator, Avatar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import FeatherIcon, { type FeatherIconName } from "../../components/FeatherIcon"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { updateCourierStatus, fetchCourierProfile, fetchWeatherForecast } from "../../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { UserProfile, Weather, CourierProfile } from "../../types/models"

type CourierStatusScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CourierStatus">
}

const CourierStatusScreen: React.FC<CourierStatusScreenProps> = ({ navigation }) => {
  const { user, updateUserData } = useAuth()
  const { isConnected, isOfflineMode } = useNetwork()

  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [statusLoading, setStatusLoading] = useState<boolean>(false)
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)

      // Vérifier les permissions de localisation
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setLocationPermissionDenied(true)
        setLoading(false)
        return
      }

      // Charger le profil du coursier
      const profileData = await fetchCourierProfile()
      // Assurer que profileData a tous les champs requis
      const completeProfile: CourierProfile = {
        user_id: profileData.user_id || user?.id || 0,
        full_name: profileData.full_name || user?.full_name || '',
        phone: profileData.phone || user?.phone || '',
        email: profileData.email || user?.email || '',
        vehicle_type: (profileData.vehicle_type as VehicleType) || 'motorcycle',
        license_plate: profileData.license_plate || '',
        is_available: profileData.is_available ?? true,
        rating: profileData.rating || 0,
        total_deliveries: profileData.total_deliveries || 0,
      }
      setCourierProfile(completeProfile)
      setIsOnline(profileData.is_online ?? true)

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      // Charger les données météo
      const weatherData = await fetchWeatherForecast(location.coords.latitude, location.coords.longitude)
      setWeather(weatherData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOnlineStatus = async (): Promise<void> => {
    if (!isConnected && !isOfflineMode) {
      Alert.alert(
        "Hors ligne",
        "Vous êtes actuellement hors ligne. Veuillez vous connecter à Internet pour changer votre statut.",
      )
      return
    }

    try {
      setStatusLoading(true)
      const newStatus = !isOnline

      // Vérifier les permissions de localisation si le coursier passe en ligne
      if (newStatus) {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          Alert.alert("Permission requise", "Vous devez autoriser l'accès à votre position pour passer en ligne.")
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

      // Mettre à jour les données utilisateur localement
      if (updateUserData) {
        updateUserData({ 
          ...user,
          // Note: is_online n'est pas dans User type, on garde juste le statut local
        })
      }

      // Afficher une confirmation
      if (newStatus) {
        Alert.alert(
          "Vous êtes en ligne",
          "Vous recevrez désormais des notifications pour les nouvelles livraisons disponibles.",
        )
      }
    } catch (error) {
      console.error("Error updating status:", error)
      Alert.alert("Erreur", "Une erreur s'est produite lors de la mise à jour de votre statut.")
    } finally {
      setStatusLoading(false)
    }
  }

  const getWeatherIcon = (condition: string): FeatherIconName => {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon statut</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement...</Text>
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
          <Text style={styles.headerTitle}>Mon statut</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.permissionDeniedContainer}>
          <FeatherIcon name="map-pin-off" size={64} color="#FF6B00" />
          <Text style={styles.permissionDeniedTitle}>Localisation requise</Text>
          <Text style={styles.permissionDeniedText}>
            Pour utiliser cette fonctionnalité, vous devez autoriser l'accès à votre position.
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync()
              if (status === "granted") {
                setLocationPermissionDenied(false)
                loadData()
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
        <Text style={styles.headerTitle}>Mon statut</Text>
        <View style={{ width: 24 }} />
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}

      <ScrollView>
        {/* Carte de statut */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <View style={styles.profileInfo}>
                <Avatar.Image
                  size={60}
                  source={
                    user?.profile_picture
                      ? { uri: user.profile_picture }
                      : require("../../assets/images/default-avatar.png")
                  }
                />
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{user?.full_name}</Text>
                  <Text style={styles.userRole}>Coursier</Text>
                </View>
              </View>
              <View style={styles.statusToggleContainer}>
                <Text style={styles.statusLabel}>{isOnline ? "En ligne" : "Hors ligne"}</Text>
                <Switch
                  value={isOnline}
                  onValueChange={toggleOnlineStatus}
                  disabled={statusLoading}
                  trackColor={{ false: "#E0E0E0", true: "#A5D6A7" }}
                  thumbColor={isOnline ? "#4CAF50" : "#9E9E9E"}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.statusMessage}>
              <Feather
                name={isOnline ? "check-circle" : "x-circle"}
                size={24}
                color={isOnline ? "#4CAF50" : "#F44336"}
              />
              <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
                {isOnline
                  ? "Vous êtes en ligne et disponible pour recevoir des livraisons"
                  : "Vous êtes hors ligne et ne recevrez pas de nouvelles livraisons"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Carte météo */}
        {weather && (
          <Card style={styles.weatherCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Conditions météo</Text>
              <View style={styles.weatherContent}>
                <FeatherIcon name={getWeatherIcon(weather.current?.condition || 'sunny') as any} size={48} color="#FF6B00" />
                  <View style={styles.weatherInfo}>
                  <Text style={styles.temperature}>{weather.current?.temperature || 0}°C</Text>
                  <Text style={styles.weatherCondition}>{weather.current?.condition || 'Clear'}</Text>
                  </View>
                  <View style={styles.weatherDetails}>
                    <Text style={styles.weatherDetailText}>Humidité: {weather.current?.humidity || 0}%</Text>
                    <Text style={styles.weatherDetailText}>Vent: {weather.current?.wind_speed || 0} km/h</Text>

                </View>
                <View style={styles.weatherDetails}>
                  <View style={styles.weatherDetail}>
                    <Feather name="droplet" size={16} color="#2196F3" />
                    <Text style={styles.weatherDetailText}>{weather.current?.humidity || 0}%</Text>
                  </View>
                  <View style={styles.weatherDetail}>
                    <Feather name="wind" size={16} color="#607D8B" />
                    <Text style={styles.weatherDetailText}>{weather.current?.wind_speed || 0} km/h</Text>
                  </View>
                </View>
              </View>

              {weather.alerts && weather.alerts.length > 0 && (
                      <View style={styles.weatherAlert}>
                        <Feather name="alert-triangle" size={16} color="#F44336" />
                        <Text style={styles.weatherAlertText}>{weather.alerts.map(alert => alert.message || alert.description).join(", ")}</Text>
                      </View>
                    )}
            </Card.Content>
          </Card>
        )}

        {/* Informations du véhicule */}
        {courierProfile && (
          <Card style={styles.vehicleCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Mon véhicule</Text>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleIconContainer}>
                  <Feather
                    name={
                      courierProfile.vehicle_type === "motorcycle"
                        ? "truck"
                        : courierProfile.vehicle_type === "bicycle"
                          ? "truck"
                          : "truck"
                    }
                    size={36}
                    color="#FF6B00"
                  />
                </View>
                <View style={styles.vehicleDetails}>
                  <Text style={styles.vehicleType}>
                    {courierProfile.vehicle_type === "motorcycle"
                      ? "Moto"
                      : courierProfile.vehicle_type === "bicycle"
                        ? "Vélo"
                        : "Voiture"}
                  </Text>
                  {courierProfile.license_plate && (
                    <Text style={styles.licensePlate}>{courierProfile.license_plate}</Text>
                  )}
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
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("AvailableDeliveries")}>
                <View style={styles.actionIconContainer}>
                  <Feather name="package" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>Mes livraisons</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CourierHome")}>
                <View style={[styles.actionIconContainer, { backgroundColor: "#4CAF50" }]}>
                  <Feather name="dollar-sign" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>Mes gains</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CourierHome")}>
                <View style={[styles.actionIconContainer, { backgroundColor: "#2196F3" }]}>
                  <Feather name="bar-chart-2" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>Statistiques</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
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
  statusCard: {
    margin: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameContainer: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  userRole: {
    fontSize: 14,
    color: "#757575",
  },
  statusToggleContainer: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  onlineText: {
    color: "#2E7D32",
  },
  weatherCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  weatherContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherIcon: {
    marginRight: 16,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  weatherCondition: {
    fontSize: 16,
    color: "#212121",
  },
  weatherLocation: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
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
    color: "#757575",
  },
  weatherAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  weatherAlertText: {
    marginLeft: 8,
    color: "#C62828",
    flex: 1,
  },
  vehicleCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  licensePlate: {
    fontSize: 16,
    color: "#757575",
    marginTop: 4,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
    width: "30%",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#212121",
    textAlign: "center",
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

export default CourierStatusScreen