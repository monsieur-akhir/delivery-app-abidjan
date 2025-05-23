"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native"
import { Text, Card, Button, FAB, Chip, ActivityIndicator, Badge } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchAvailableDeliveries, fetchCourierStats, fetchLeaderboard } from "../../services/api"
import { formatDate, formatPrice } from "../../utils/formatters"

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth()
  const { isConnected, isOfflineMode } = useNetwork()

  const [refreshing, setRefreshing] = useState(false)
  const [availableDeliveries, setAvailableDeliveries] = useState([])
  const [courierStats, setCourierStats] = useState(null)
  const [topCouriers, setTopCouriers] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCommune, setSelectedCommune] = useState(null)

  const communes = ["Cocody", "Yopougon", "Plateau", "Treichville", "Adjamé", "Marcory", "Abobo"]

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          console.log("Permission to access location was denied")
          return
        }

        const location = await Location.getCurrentPositionAsync({})
        setLocation(location)

        await loadData()
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Charger les livraisons disponibles
      const deliveriesData = await fetchAvailableDeliveries(selectedCommune)
      setAvailableDeliveries(deliveriesData)

      // Charger les statistiques du coursier
      const statsData = await fetchCourierStats()
      setCourierStats(statsData)

      // Charger le classement des coursiers
      const leaderboardData = await fetchLeaderboard(5)
      setTopCouriers(leaderboardData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const filterByCommune = (commune) => {
    if (selectedCommune === commune) {
      setSelectedCommune(null)
    } else {
      setSelectedCommune(commune)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.full_name?.split(" ")[0]}</Text>
          <Text style={styles.subGreeting}>Prêt à livrer aujourd'hui ?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <View>
            <Feather name="bell" size={24} color="#FF6B00" />
            <Badge style={styles.badge} size={8} />
          </View>
        </TouchableOpacity>
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
        {/* Section des statistiques du coursier */}
        {courierStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{courierStats.total_points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Niv. {courierStats.level}</Text>
              <Text style={styles.statLabel}>Niveau</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{courierStats.deliveries_completed}</Text>
              <Text style={styles.statLabel}>Livraisons</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{courierStats.five_star_ratings}</Text>
              <Text style={styles.statLabel}>5 étoiles</Text>
            </View>
          </View>
        )}

        {/* Filtres par commune */}
        <View style={styles.communeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {communes.map((commune) => (
              <Chip
                key={commune}
                selected={selectedCommune === commune}
                onPress={() => filterByCommune(commune)}
                style={[styles.communeChip, selectedCommune === commune && styles.selectedChip]}
                textStyle={selectedCommune === commune ? styles.selectedChipText : {}}
              >
                {commune}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Section des livraisons disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraisons disponibles</Text>

          {loading ? (
            <ActivityIndicator color="#FF6B00" style={styles.loader} />
          ) : availableDeliveries.length > 0 ? (
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

                  {delivery.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {delivery.description}
                    </Text>
                  )}
                </Card.Content>
                <Card.Actions>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate("Bid", { deliveryId: delivery.id })}
                    style={styles.bidButton}
                  >
                    Enchérir
                  </Button>
                </Card.Actions>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="package" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>Aucune livraison disponible</Text>
              <Text style={styles.emptySubtext}>Revenez plus tard ou changez de commune</Text>
            </View>
          )}
        </View>

        {/* Section du classement */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meilleurs coursiers</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Leaderboard")}>
              <Text style={styles.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#FF6B00" style={styles.loader} />
          ) : topCouriers.length > 0 ? (
            <View style={styles.leaderboardContainer}>
              {topCouriers.map((courier, index) => (
                <View key={courier.courier_id} style={styles.leaderboardRow}>
                  <View style={styles.rankContainer}>
                    <Text
                      style={[
                        styles.rankText,
                        index === 0 && styles.firstRank,
                        index === 1 && styles.secondRank,
                        index === 2 && styles.thirdRank,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.courierInfo}>
                    <Text style={styles.courierName}>{courier.courier_name}</Text>
                    <Text style={styles.courierCommune}>{courier.commune || "Non spécifié"}</Text>
                  </View>

                  <View style={styles.courierStats}>
                    <Text style={styles.courierPoints}>{courier.total_points} pts</Text>
                    <Text style={styles.courierDeliveries}>{courier.deliveries_completed} livraisons</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun classement disponible</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {location && !isOfflineMode && (
        <FAB
          style={styles.fab}
          icon="map-marker"
          color="#FFFFFF"
          onPress={() => navigation.navigate("CourierTracking")}
          label="Activer le suivi"
        />
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
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  subGreeting: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF6B00",
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  communeFilters: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  communeChip: {
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedChip: {
    backgroundColor: "#FF6B00",
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  seeAllLink: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  deliveryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
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
  description: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  bidButton: {
    backgroundColor: "#FF6B00",
  },
  leaderboardContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    fontWeight: "bold",
    color: "#757575",
  },
  firstRank: {
    color: "#FFD700",
  },
  secondRank: {
    color: "#C0C0C0",
  },
  thirdRank: {
    color: "#CD7F32",
  },
  courierInfo: {
    flex: 1,
  },
  courierName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  courierCommune: {
    fontSize: 12,
    color: "#757575",
  },
  courierStats: {
    alignItems: "flex-end",
  },
  courierPoints: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  courierDeliveries: {
    fontSize: 12,
    color: "#757575",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 12,
    color: "#757575",
    fontSize: 16,
  },
  emptySubtext: {
    color: "#9E9E9E",
    fontSize: 14,
    marginTop: 4,
  },
  loader: {
    padding: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#FF6B00",
  },
})

export default HomeScreen
