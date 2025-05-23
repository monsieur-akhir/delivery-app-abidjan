"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native"
import { Text, Card, Chip, Divider, IconButton, Searchbar, Button, Menu } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchClientDeliveryHistory } from "../../services/api"
import { formatPrice, formatRelativeTime } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery } from "../../types/models"
import EmptyState from "../../components/EmptyState"
import DeliveryStatusBadge from "../../components/DeliveryStatusBadge"
import ErrorView from "../../components/ErrorView"
import { useFocusEffect } from "@react-navigation/native"
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated"

type DeliveryHistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "DeliveryHistory">
}

type FilterOption = "all" | "completed" | "cancelled" | "in_progress"

const DeliveryHistoryScreen: React.FC<DeliveryHistoryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected, isOfflineMode } = useNetwork()

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [currentFilter, setCurrentFilter] = useState<FilterOption>("all")
  const [filterMenuVisible, setFilterMenuVisible] = useState<boolean>(false)
  const [sortMenuVisible, setSortMenuVisible] = useState<boolean>(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "price_high" | "price_low">("newest")
  const [page, setPage] = useState<number>(1)
  const [hasMoreData, setHasMoreData] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  // Charger les données initiales lorsque l'écran est affiché
  useFocusEffect(
    useCallback(() => {
      loadDeliveryHistory()
      return () => {
        // Nettoyage si nécessaire
      }
    }, []),
  )

  // Charger l'historique des livraisons
  const loadDeliveryHistory = async (refresh = true): Promise<void> => {
    if (refresh) {
      setLoading(true)
      setPage(1)
      setHasMoreData(true)
    }

    try {
      if (!isConnected && !isOfflineMode) {
        setError(t("common.offlineError"))
        setLoading(false)
        return
      }

      // Convertir le filtre pour l'API
      let apiFilter = ""
      if (currentFilter === "completed") apiFilter = "completed"
      else if (currentFilter === "cancelled") apiFilter = "cancelled"
      else if (currentFilter === "in_progress") apiFilter = "in_progress"

      const data = await fetchClientDeliveryHistory(apiFilter)

      if (refresh) {
        setDeliveries(data)
        setFilteredDeliveries(data)
      } else {
        if (data.length === 0) {
          setHasMoreData(false)
        } else {
          setDeliveries((prev) => [...prev, ...data])
          setFilteredDeliveries((prev) => [...prev, ...data])
        }
      }

      setError(null)
    } catch (error) {
      console.error("Error loading delivery history:", error)
      setError(t("deliveryHistory.errorLoading"))
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  // Actualiser les données
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadDeliveryHistory()
  }

  // Charger plus de données
  const loadMoreData = async (): Promise<void> => {
    if (loadingMore || !hasMoreData) return

    setLoadingMore(true)
    setPage((prev) => prev + 1)
    await loadDeliveryHistory(false)
  }

  // Filtrer les livraisons
  useEffect(() => {
    filterDeliveries()
  }, [searchQuery, currentFilter, sortOrder, deliveries])

  const filterDeliveries = (): void => {
    let filtered = [...deliveries]

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (delivery) =>
          delivery.id.toString().includes(query) ||
          delivery.pickup_address.toLowerCase().includes(query) ||
          delivery.delivery_address.toLowerCase().includes(query) ||
          (delivery.courier?.full_name && delivery.courier.full_name.toLowerCase().includes(query)),
      )
    }

    // Filtrer par statut
    if (currentFilter !== "all") {
      filtered = filtered.filter((delivery) => {
        if (currentFilter === "completed") return delivery.status === "completed"
        if (currentFilter === "cancelled") return delivery.status === "cancelled"
        if (currentFilter === "in_progress") return ["accepted", "in_progress", "picked_up"].includes(delivery.status)
        return true
      })
    }

    // Trier les résultats
    filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortOrder === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortOrder === "price_high") {
        return (b.final_price || b.proposed_price) - (a.final_price || a.proposed_price)
      } else if (sortOrder === "price_low") {
        return (a.final_price || a.proposed_price) - (b.final_price || b.proposed_price)
      }
      return 0
    })

    setFilteredDeliveries(filtered)
  }

  // Afficher les détails d'une livraison
  const viewDeliveryDetails = (deliveryId: string): void => {
    navigation.navigate("DeliveryDetails", { deliveryId })
  }

  // Rendu d'un élément de livraison
  const renderDeliveryItem = ({ item, index }: { item: Delivery; index: number }): React.ReactElement => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()} exiting={FadeOutDown.springify()}>
      <Card style={styles.deliveryCard} onPress={() => viewDeliveryDetails(item.id)} mode="elevated">
        <Card.Content>
          <View style={styles.deliveryHeader}>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryId}>Livraison #{item.id}</Text>
              <Text style={styles.deliveryDate}>{formatRelativeTime(item.created_at)}</Text>
            </View>
            <DeliveryStatusBadge status={item.status} />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <View style={styles.addressDot} />
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressLabel}>{t("deliveryHistory.pickup")}</Text>
                <Text style={styles.addressText}>{item.pickup_address}</Text>
                <Text style={styles.communeText}>{item.pickup_commune}</Text>
              </View>
            </View>

            <View style={styles.addressLine} />

            <View style={styles.addressRow}>
              <View style={[styles.addressDot, styles.destinationDot]} />
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressLabel}>{t("deliveryHistory.delivery")}</Text>
                <Text style={styles.addressText}>{item.delivery_address}</Text>
                <Text style={styles.communeText}>{item.delivery_commune}</Text>
              </View>
            </View>
          </View>

          <View style={styles.deliveryFooter}>
            <Text style={styles.deliveryPrice}>{formatPrice(item.final_price || item.proposed_price)} FCFA</Text>

            {item.courier && (
              <Chip icon="account" style={styles.courierChip}>
                {item.courier.full_name}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  )

  // Rendu du pied de liste (chargement plus)
  const renderFooter = (): React.ReactElement | null => {
    if (!loadingMore) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF6B00" />
        <Text style={styles.footerText}>{t("common.loadingMore")}</Text>
      </View>
    )
  }

  // Rendu principal
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("deliveryHistory.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>{t("common.offlineMode")}</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t("deliveryHistory.search")}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#FF6B00"
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterButtons}>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setFilterMenuVisible(true)}
                icon="filter-variant"
                style={styles.filterButton}
              >
                {currentFilter === "all"
                  ? t("deliveryHistory.allDeliveries")
                  : currentFilter === "completed"
                    ? t("deliveryHistory.completed")
                    : currentFilter === "cancelled"
                      ? t("deliveryHistory.cancelled")
                      : t("deliveryHistory.inProgress")}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setCurrentFilter("all")
                setFilterMenuVisible(false)
              }}
              title={t("deliveryHistory.allDeliveries")}
              leadingIcon="package-variant"
            />
            <Menu.Item
              onPress={() => {
                setCurrentFilter("completed")
                setFilterMenuVisible(false)
              }}
              title={t("deliveryHistory.completed")}
              leadingIcon="check-circle"
            />
            <Menu.Item
              onPress={() => {
                setCurrentFilter("in_progress")
                setFilterMenuVisible(false)
              }}
              title={t("deliveryHistory.inProgress")}
              leadingIcon="progress-clock"
            />
            <Menu.Item
              onPress={() => {
                setCurrentFilter("cancelled")
                setFilterMenuVisible(false)
              }}
              title={t("deliveryHistory.cancelled")}
              leadingIcon="close-circle"
            />
          </Menu>

          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setSortMenuVisible(true)} icon="sort" style={styles.sortButton}>
                {sortOrder === "newest"
                  ? t("deliveryHistory.newest")
                  : sortOrder === "oldest"
                    ? t("deliveryHistory.oldest")
                    : sortOrder === "price_high"
                      ? t("deliveryHistory.priceHigh")
                      : t("deliveryHistory.priceLow")}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortOrder("newest")
                setSortMenuVisible(false)
              }}
              title={t("deliveryHistory.newest")}
              leadingIcon="clock-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortOrder("oldest")
                setSortMenuVisible(false)
              }}
              title={t("deliveryHistory.oldest")}
              leadingIcon="clock-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortOrder("price_high")
                setSortMenuVisible(false)
              }}
              title={t("deliveryHistory.priceHigh")}
              leadingIcon="cash"
            />
            <Menu.Item
              onPress={() => {
                setSortOrder("price_low")
                setSortMenuVisible(false)
              }}
              title={t("deliveryHistory.priceLow")}
              leadingIcon="cash"
            />
          </Menu>
        </View>

        {filteredDeliveries.length > 0 && (
          <Text style={styles.resultsCount}>
            {filteredDeliveries.length} {t("deliveryHistory.results")}
          </Text>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("deliveryHistory.loading")}</Text>
        </View>
      ) : error ? (
        <ErrorView message={error} onRetry={loadDeliveryHistory} icon="alert-circle" />
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          icon="package"
          title={t("deliveryHistory.noDeliveries")}
          message={
            searchQuery
              ? t("deliveryHistory.noSearchResults")
              : currentFilter !== "all"
                ? t("deliveryHistory.noFilterResults")
                : t("deliveryHistory.emptyHistory")
          }
          actionLabel={searchQuery || currentFilter !== "all" ? t("deliveryHistory.clearFilters") : undefined}
          onAction={() => {
            setSearchQuery("")
            setCurrentFilter("all")
          }}
        />
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
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
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
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
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#DDDDDD",
  },
  sortButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: "#DDDDDD",
  },
  resultsCount: {
    marginTop: 8,
    fontSize: 12,
    color: "#757575",
    textAlign: "right",
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
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  deliveryCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  courierChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    color: "#757575",
  },
})

export default DeliveryHistoryScreen
