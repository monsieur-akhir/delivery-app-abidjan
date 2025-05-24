"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Feather } from "@expo/vector-icons"
import VehicleService from "../../services/VehicleService"
import type { Vehicle } from "../../types/models"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useNetworkContext } from "../../contexts/NetworkContext"
import ErrorView from "../../components/ErrorView"
import EmptyState from "../../components/EmptyState"
import { useTranslation } from "react-i18next"

const VehicleManagementScreen: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const navigation = useNavigation()
  const { user } = useAuth()
  const { colors } = useTheme()
  const { isConnected } = useNetworkContext()

  const fetchVehicles = async () => {
    try {
      setError(null)
      const data = await VehicleService.getVehicles()
      setVehicles(data)
    } catch (err) {
      console.error("Error fetching vehicles:", err)
      setError("Impossible de charger les véhicules. Veuillez réessayer.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchVehicles()
  }

  const handleAddVehicle = () => {
    // @ts-ignore
    navigation.navigate("AddVehicle")
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    // @ts-ignore
    navigation.navigate("EditVehicle", { vehicleId: vehicle.id })
  }

  const handleViewVehicle = (vehicle: Vehicle) => {
    // @ts-ignore
    navigation.navigate("VehicleDetails", { vehicleId: vehicle.id })
  }

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert("Supprimer le véhicule", `Êtes-vous sûr de vouloir supprimer ${vehicle.name} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await VehicleService.deleteVehicle(vehicle.id)
            setVehicles(vehicles.filter((v) => v.id !== vehicle.id))
            Alert.alert("Succès", "Véhicule supprimé avec succès")
          } catch (err) {
            Alert.alert("Erreur", "Impossible de supprimer le véhicule")
          }
        },
      },
    ])
  }

  const handleVehiclePress = (vehicle: Vehicle) => {
    handleViewVehicle(vehicle)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10b981" // green
      case "maintenance":
        return "#f59e0b" // amber
      case "inactive":
        return "#ef4444" // red
      case "pending_verification":
        return "#6366f1" // indigo
      default:
        return "#6b7280" // gray
    }
  }

  const renderItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={[styles.vehicleCard, { backgroundColor: colors.card }]}
      onPress={() => handleVehiclePress(item)}
    >
      <View style={styles.vehicleHeader}>
        <Text style={[styles.vehiclePlate, { color: colors.text }]}>
          {item.licensePlate || item.license_plate || "N/A"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: getStatusColor(item.status || "inactive") + "20",
              borderColor: getStatusColor(item.status || "inactive"),
            },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status || "inactive") }]}>
            {(item.status || "inactive") === "active"
              ? t("vehicle.active")
              : (item.status || "inactive") === "maintenance"
                ? t("vehicle.maintenance")
                : (item.status || "inactive") === "inactive"
                  ? t("vehicle.inactive")
                  : t("vehicle.unknown")}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleDetails}>
        <View style={styles.vehicleDetail}>
          <Feather name="truck" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.type === "car"
              ? t("vehicle.car")
              : item.type === "motorcycle"
                ? t("vehicle.motorcycle")
                : item.type === "bicycle"
                  ? t("vehicle.bicycle")
                  : item.type === "truck"
                    ? t("vehicle.truck")
                    : item.customType || "Autre"}
          </Text>
        </View>

        {(item.maxWeight || item.max_weight) && (
          <View style={styles.vehicleDetail}>
            <Feather name="package" size={16} color={colors.text} />
            <Text style={[styles.detailText, { color: colors.text }]}>{item.maxWeight || item.max_weight} kg</Text>
          </View>
        )}

        {item.maxDistance && (
          <View style={styles.vehicleDetail}>
            <Feather name="map" size={16} color={colors.text} />
            <Text style={[styles.detailText, { color: colors.text }]}>{item.maxDistance} km</Text>
          </View>
        )}

        <View style={styles.vehicleDetail}>
          <Ionicons name={item.isElectric ? "flash-outline" : "water-outline"} size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.isElectric ? "Électrique" : "Thermique"}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + "20" }]}
          onPress={() => handleEditVehicle(item)}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Modifier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#ef4444" + "20" }]}
          onPress={() => handleDeleteVehicle(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: "#ef4444" }]}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  if (error) {
    return <ErrorView message={error} onRetry={fetchVehicles} />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Gestion des véhicules</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddVehicle}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 && !loading ? (
        <EmptyState
          icon="car-outline"
          title="Aucun véhicule"
          message="Vous n'avez pas encore de véhicules. Ajoutez-en un pour commencer."
          buttonText="Ajouter un véhicule"
          onButtonPress={handleAddVehicle}
        />
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vehiclePlate: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vehicleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  vehicleDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
})

export default VehicleManagementScreen
