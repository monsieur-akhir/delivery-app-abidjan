import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Text, Card, Button, Chip, ActivityIndicator, Searchbar, FAB } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../contexts/AuthContext"
import DeliveryService from "../../services/DeliveryService"
import { formatPrice, formatDate } from "../../utils/formatters"
import type { Delivery, DeliveryStatus } from "../../types/models"
import type { ClientTabParamList } from "../../types/navigation"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

type NavigationProp = NativeStackNavigationProp<ClientTabParamList, "DeliveryHistory">

const DeliveryHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>()
  const { user } = useAuth()

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus | "all">("all")

  const statusFilters: Array<{ key: DeliveryStatus | "all"; label: string; color: string }> = [
    { key: "all", label: "Toutes", color: "#757575" },
    { key: "pending", label: "En attente", color: "#FF9800" },
    { key: "accepted", label: "Acceptées", color: "#2196F3" },
    { key: "in_progress", label: "En cours", color: "#FF6B00" },
    { key: "delivered", label: "Livrées", color: "#4CAF50" },
    { key: "cancelled", label: "Annulées", color: "#F44336" },
  ]

  const loadDeliveries = useCallback(async () => {
    try {
      setLoading(true)
      const filters = {
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: searchQuery || undefined,
      }
      const data = await DeliveryService.getClientDeliveryHistory(filters)
      setDeliveries(data)
    } catch (error) {
      console.error("Error loading deliveries:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, searchQuery])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDeliveries()
    setRefreshing(false)
  }

  const getStatusColor = (status: DeliveryStatus): string => {
    const statusFilter = statusFilters.find(f => f.key === status)
    return statusFilter?.color || "#757575"
  }

  const getStatusLabel = (status: DeliveryStatus): string => {
    const statusFilter = statusFilters.find(f => f.key === status)
    return statusFilter?.label || status
  }

  const filteredDeliveries = deliveries.filter(delivery => 
    searchQuery === "" || 
    delivery.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes livraisons</Text>
      </View>

      <Searchbar
        placeholder="Rechercher une livraison..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        iconColor="#FF6B00"
      />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
      >
        {statusFilters.map((filter) => (
          <Chip
            key={filter.key}
            selected={selectedStatus === filter.key}
            onPress={() => setSelectedStatus(filter.key)}
            style={[
              styles.filterChip, 
              selectedStatus === filter.key && { backgroundColor: filter.color }
            ]}
            textStyle={selectedStatus === filter.key ? styles.selectedChipText : {}}
          >
            {filter.label}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery) => (
            <Card
              key={delivery.id}
              style={styles.deliveryCard}
              onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: delivery.id.toString() })}
            >
              <Card.Content>
                <View style={styles.deliveryHeader}>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryId}>Livraison #{delivery.id}</Text>
                    <Text style={styles.deliveryDate}>{formatDate(delivery.created_at)}</Text>
                  </View>
                  <Chip 
                    style={[styles.statusChip, { backgroundColor: getStatusColor(delivery.status) }]}
                    textStyle={styles.statusText}
                  >
                    {getStatusLabel(delivery.status)}
                  </Chip>
                </View>

                <Text style={styles.deliveryDescription} numberOfLines={2}>
                  {delivery.description}
                </Text>

                <View style={styles.addressContainer}>
                  <View style={styles.addressRow}>
                    <Feather name="map-pin" size={16} color="#FF6B00" />
                    <Text style={styles.addressText} numberOfLines={1}>
                      De: {delivery.pickup_address}
                    </Text>
                  </View>
                  <View style={styles.addressRow}>
                    <Feather name="flag" size={16} color="#4CAF50" />
                    <Text style={styles.addressText} numberOfLines={1}>
                      À: {delivery.delivery_address}
                    </Text>
                  </View>
                </View>

                <View style={styles.deliveryFooter}>
                  <Text style={styles.priceText}>
                    {formatPrice(delivery.final_price || delivery.proposed_price)} FCFA
                  </Text>
                  {delivery.status === "in_progress" && (
                    <Button
                      mode="contained"
                      size="small"
                      onPress={() => navigation.navigate("TrackDelivery", { deliveryId: delivery.id.toString() })}
                      style={styles.trackButton}
                    >
                      Suivre
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="package" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>Aucune livraison trouvée</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? "Aucune livraison ne correspond à votre recherche"
                : "Vous n'avez encore aucune livraison"
              }
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => navigation.navigate("CreateDelivery")}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  searchbar: {
    margin: 16,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  deliveryCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
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
  statusChip: {
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  deliveryDescription: {
    fontSize: 14,
    color: "#424242",
    marginBottom: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: "#616161",
    marginLeft: 8,
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  trackButton: {
    backgroundColor: "#FF6B00",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#FF6B00",
  },
})

export default DeliveryHistoryScreen