"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useDelivery } from "../../hooks"
import type { CollaborativeDelivery, DeliveryStatus } from "../../types/models"
import { useTheme } from "../../contexts/ThemeContext"
import ErrorView from "../../components/ErrorView"
import EmptyState from "../../components/EmptyState"
import DeliveryStatusBadge from "../../components/DeliveryStatusBadge"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

const CollaborativeDeliveriesScreen: React.FC = () => {
  const [deliveries, setDeliveries] = useState<CollaborativeDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"active" | "available" | "completed">("active")

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { colors } = useTheme()
  const { getCollaborativeDeliveries } = useDelivery()

  const fetchDeliveries = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      let data: CollaborativeDelivery[] = []

      if (activeTab === "active") {
        const result = await getCollaborativeDeliveries({ status: "in_progress" })
        data = Array.isArray(result) ? result : []
      } else if (activeTab === "available") {
        const result = await getCollaborativeDeliveries({ status: "pending" })
        data = Array.isArray(result) ? result : []
      } else if (activeTab === "completed") {
        const result = await getCollaborativeDeliveries({ status: "completed" })
        data = Array.isArray(result) ? result : []
      } else {
        const result = await getCollaborativeDeliveries()
        data = Array.isArray(result) ? result : []
      }

      setDeliveries(data)
    } catch (err) {
      console.error("Error fetching collaborative deliveries:", err)
      setError("Impossible de charger les livraisons. Veuillez réessayer.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, getCollaborativeDeliveries])

  useEffect(() => {
    fetchDeliveries()
  }, [activeTab, fetchDeliveries])

  const onRefresh = () => {
    setRefreshing(true)
    fetchDeliveries()
  }

  const handleViewDelivery = (delivery: CollaborativeDelivery) => {
    navigation.navigate("CollaborativeDeliveryDetails", {
      deliveryId: delivery.id.toString(),
      clientName: delivery.clientName,
      finalPrice: delivery.finalPrice || 0,
    })
  }

  const handleJoinDelivery = (delivery: CollaborativeDelivery) => {
    navigation.navigate("JoinCollaborativeDelivery", { deliveryId: delivery.id.toString() })
  }

  const handleChatDelivery = (delivery: CollaborativeDelivery) => {
    navigation.navigate("CollaborativeChat", { deliveryId: delivery.id.toString() })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderDeliveryItem = ({ item }: { item: CollaborativeDelivery }) => (
    <TouchableOpacity
      style={[styles.deliveryCard, { backgroundColor: colors.card }]}
      onPress={() => handleViewDelivery(item)}
    >
      <View style={styles.deliveryHeader}>
        <View>
          <Text style={[styles.deliveryId, { color: colors.text }]}>#{item.id.toString().substring(0, 8)}</Text>
          <Text style={[styles.clientName, { color: colors.text }]}>{item.clientName}</Text>
        </View>
        <DeliveryStatusBadge status={item.status as DeliveryStatus} />
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.routeText, { color: colors.text }]}>{item.pickupCommune}</Text>
        </View>
        <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: "#ef4444" }]} />
          <Text style={[styles.routeText, { color: colors.text }]}>{item.deliveryCommune}</Text>
        </View>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.finalPrice ? formatCurrency(item.finalPrice) : formatCurrency(item.proposedPrice || 0)}
          </Text>
        </View>

        {item.estimatedDistance && (
          <View style={styles.detailItem}>
            <Ionicons name="map-outline" size={16} color={colors.text} />
            <Text style={[styles.detailText, { color: colors.text }]}>{item.estimatedDistance} km</Text>
          </View>
        )}

        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.collaborators.length} collaborateur{item.collaborators.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.text} />
          <Text style={[styles.detailText, { color: colors.text }]}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {activeTab === "available" ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleJoinDelivery(item)}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>Rejoindre</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleChatDelivery(item)}
            >
              <Ionicons name="chatbubble-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#10b981" }]}
              onPress={() => handleViewDelivery(item)}
            >
              <Ionicons name="eye-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Détails</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  )

  const renderTabButton = (tab: "active" | "available" | "completed", label: string, icon: keyof typeof Ionicons.glyphMap) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons name={icon} size={18} color={activeTab === tab ? colors.primary : colors.text} />
      <Text style={[styles.tabButtonText, { color: activeTab === tab ? colors.primary : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  )

  if (error) {
    return <ErrorView message={error} onRetry={fetchDeliveries} />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabsContainer}>
        {renderTabButton("active", "En cours", "bicycle")}
        {renderTabButton("available", "Disponibles", "search")}
        {renderTabButton("completed", "Terminées", "checkmark-circle")}
      </View>

      {deliveries.length === 0 && !loading ? (
        <EmptyState
          icon={
            activeTab === "active"
              ? "activity"
              : activeTab === "available"
                ? "search"
                : "check-circle"
          }
          title={`Aucune livraison ${activeTab === "active" ? "en cours" : activeTab === "available" ? "disponible" : "terminée"}`}
          message={
            activeTab === "active"
              ? "Vous n'avez pas de livraisons collaboratives en cours."
              : activeTab === "available"
                ? "Aucune livraison collaborative n'est disponible pour le moment."
                : "Vous n'avez pas encore terminé de livraisons collaboratives."
          }
          buttonText={activeTab === "available" ? "Actualiser" : undefined}
          onButtonPress={activeTab === "available" ? onRefresh : undefined}
        />
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
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
  tabsContainer: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  deliveryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deliveryId: {
    fontSize: 14,
    opacity: 0.7,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  routeLine: {
    width: 2,
    height: 16,
    marginLeft: 4,
  },
  routeText: {
    fontSize: 16,
  },
  deliveryDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  detailItem: {
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
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginLeft: 4,
  },
})

export default CollaborativeDeliveriesScreen