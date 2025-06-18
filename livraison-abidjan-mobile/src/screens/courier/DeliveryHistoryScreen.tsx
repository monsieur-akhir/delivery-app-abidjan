"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { Text, Card, Chip, Divider, IconButton, Searchbar, Button, Menu, ProgressBar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchCourierDeliveryHistory, fetchCourierStats } from "../../services/api"
import { formatPrice, formatRelativeTime } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery } from "../../types/models"
import EmptyState from "../../components/EmptyState"
import DeliveryStatusBadge from "../../components/DeliveryStatusBadge"
import ErrorView from "../../components/ErrorView"
import { useFocusEffect } from "@react-navigation/native"
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated"
import { LineChart } from "react-native-chart-kit"

interface CourierStats {
  total_deliveries: number
  completed_deliveries: number
  cancelled_deliveries: number
  revenue: number
  average_rating: number
  total_distance: number
  earnings_data: {
    labels: string[]
    data: number[]
  }
}

type DeliveryHistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "DeliveryHistory">
}

const { width } = Dimensions.get("window")

const DeliveryHistoryScreen: React.FC<DeliveryHistoryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [stats, setStats] = useState<CourierStats | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<"week" | "month" | "year">("week")
  const [currentFilter, setCurrentFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [showStats, setShowStats] = useState<boolean>(true)

  // Filtrer les livraisons
  const filterDeliveries = useCallback((): void => {
    let filtered = [...deliveries]

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          delivery.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
          (delivery.client?.full_name && delivery.client.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filtrer par statut
    if (currentFilter !== "all") {
      filtered = filtered.filter((delivery) => delivery.status === currentFilter)
    }

    // Trier
    filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    })

    setFilteredDeliveries(filtered)
  }, [searchQuery, currentFilter, sortOrder, deliveries])

  // Charger les statistiques
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      const statsData = await fetchCourierStats(currentPeriod)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading courier stats:", error)
    }
  }, [currentPeriod])

  // Charger l'historique des livraisons
  const loadDeliveryHistory = useCallback(async (refresh = true): Promise<void> => {
    if (refresh) {
      setLoading(true)
    }

    try {
      if (!isConnected) {
        setError(t("common.offlineError"))
        setLoading(false)
        return
      }

      // Convertir le filtre pour l'API
      let apiFilter = ""
      if (currentFilter === "completed") apiFilter = "completed"
      else if (currentFilter === "cancelled") apiFilter = "cancelled"
      else if (currentFilter === "in_progress") apiFilter = "in_progress"

      const data = await fetchCourierDeliveryHistory(apiFilter)

      if (refresh) {
        setDeliveries(data)
        setFilteredDeliveries(data)
      } else {
        if (data.length === 0) {
          setError(t("deliveryHistory.noMoreData"))
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
    }
  }, [isConnected, t, currentFilter])

  // Actualiser les données
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await Promise.all([loadDeliveryHistory(), loadStats()])
  }

  // Handle loading more data when user reaches end of list
  const handleLoadMore = useCallback(() => {
    if (!loading && !error) {
      loadDeliveryHistory(false)
    }
  }, [loading, error, loadDeliveryHistory])

  // Apply filtering when dependencies change
  useEffect(() => {
    filterDeliveries()
  }, [filterDeliveries])

  // Load initial data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadDeliveryHistory()
      loadStats()
      return () => {
        // Cleanup if needed
      }
    }, [loadDeliveryHistory, loadStats])
  )

  const handleViewDetails = (deliveryId: number) => {
    navigation.navigate("DeliveryDetails", { deliveryId: deliveryId.toString() })
  }

  const renderDeliveryCard = ({ item }: { item: Delivery }) => (
    <Card style={styles.deliveryCard} onPress={() => navigation.navigate("CourierTrackDelivery", { deliveryId: item.id.toString() })}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.deliveryCardTitle}>#{item.id}</Text>
          <DeliveryStatusBadge status={item.status} />
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <Ionicons name="radio-button-on" size={12} color="#4CAF50" />
            <View style={styles.pointInfo}>
              <Text style={styles.pointAddress}>{item.pickup_address}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <Ionicons name="location" size={12} color="#FF6B00" />
            <View style={styles.pointInfo}>
              <Text style={styles.pointAddress}>{item.delivery_address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => navigation.navigate("CourierTrackDelivery", { deliveryId: item.id.toString() })}
          >
            <Text style={styles.detailsButtonText}>{t("common.viewDetails")}</Text>
          </TouchableOpacity>

          <Text style={styles.completedText}>Livraison terminée</Text>
        </View>
      </Card.Content>
    </Card>
  )

  // Afficher les détails d'une livraison
  const viewDeliveryDetails = (deliveryId: string): void => {
    navigation.navigate("DeliveryDetails", { deliveryId })
  }

  // Rendu d'un élément de livraison
  const renderDeliveryItem2 = ({ item, index }: { item: Delivery; index: number }): React.ReactElement => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()} exiting={FadeOutDown.springify()}>
      <Card style={styles.deliveryCard} onPress={() => viewDeliveryDetails(item.id.toString())} mode="elevated">
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

            {item.client && (
              <Chip icon="account" style={styles.clientChip}>
                {item.client.full_name}
              </Chip>
            )}
          </View>

          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>{t("deliveryHistory.rating")}</Text>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const ratingValue = typeof item.rating === 'number' ? item.rating : item.rating?.rating ?? 0;
                  return (
                    <MaterialIcons
                      key={i}
                      name={i < Math.round(ratingValue) ? "star" : "star-outline"} // Adjusted to valid `MaterialIcons` names
                      size={16}
                      color={i < Math.round(ratingValue) ? "#FFC107" : "#CCCCCC"}
                      style={styles.ratingStar}
                    />
                  );
                })}
                <Text style={styles.ratingValue}>
                  ({typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating?.rating?.toFixed(1) ?? 'N/A'})
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  )

  // Rendu du pied de liste (chargement plus)
  const renderFooter = (): React.ReactElement | null => {
    if (!loading) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF6B00" />
        <Text style={styles.footerText}>{t("common.loadingMore")}</Text>
      </View>
    )
  }

  // Rendu des statistiques
  const renderStats = (): React.ReactElement => {
    if (!stats) {
      return (
        <View style={styles.statsLoadingContainer}>
          <ActivityIndicator size="small" color="#FF6B00" />
        </View>
      )
    }

    const chartData = {
      labels: stats.earnings_data.labels,
      datasets: [
        {
          data: stats.earnings_data.data,
          color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    }

    const chartConfig = {
      backgroundGradientFrom: "#FFFFFF",
      backgroundGradientTo: "#FFFFFF",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#FF6B00",
      },
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsPeriodSelector}>
          <Text style={styles.statsTitle}>{t("courierStats.earningsTitle")}</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="text" onPress={() => setMenuVisible(true)} icon="calendar" textColor="#FF6B00">
                {currentPeriod === "week"
                  ? t("courierStats.thisWeek")
                  : currentPeriod === "month"
                    ? t("courierStats.thisMonth")
                    : t("courierStats.thisYear")}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setCurrentPeriod("week")
                setMenuVisible(false)
              }}
              title={t("courierStats.thisWeek")}
            />
            <Menu.Item
              onPress={() => {
                setCurrentPeriod("month")
                setMenuVisible(false)
              }}
              title={t("courierStats.thisMonth")}
            />
            <Menu.Item
              onPress={() => {
                setCurrentPeriod("year")
                setMenuVisible(false)
              }}
              title={t("courierStats.thisYear")}
            />
          </Menu>
        </View>

        <LineChart
          data={chartData}
          width={width - 32}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />

        <View style={styles.statsCards}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>{t("courierStats.totalDeliveries")}</Text>
              <Text style={styles.statValue}>{stats.total_deliveries}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>{t("courierStats.totalEarnings")}</Text>
              <Text style={styles.statValue}>{formatPrice(stats.revenue)} FCFA</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsCards}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>{t("courierStats.completionRate")}</Text>
              <Text style={styles.statValue}>{((stats.completed_deliveries / stats.total_deliveries) * 100).toFixed(0)}%</Text>
              <ProgressBar progress={stats.completed_deliveries / stats.total_deliveries} color="#4CAF50" style={styles.progressBar} />
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statLabel}>{t("courierStats.averageRating")}</Text>
              <View style={styles.ratingStarsLarge}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaterialIcons
                    key={i}
                    name={i < Math.round(stats.average_rating) ? "star" : "star-border"}
                    size={18}
                    color={i < Math.round(stats.average_rating) ? "#FFC107" : "#CCCCCC"}
                    style={styles.ratingStarLarge}
                  />
                ))}
              </View>
              <Text style={styles.ratingValueLarge}>{stats.average_rating.toFixed(1)}</Text>
            </Card.Content>
          </Card>
        </View>

        <Button mode="text" onPress={() => setShowStats(false)} icon="chevron-up" style={styles.hideStatsButton}>
          {t("courierStats.hideStats")}
        </Button>
      </View>
    )
  }

  // Rendu principal
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("deliveryHistory.courierTitle")}</Text>
        <View style={{ width: 48 }} />
      </View>

      {!showStats && (
        <Button mode="text" onPress={() => setShowStats(true)} icon="chart-line" style={styles.showStatsButton}>
          {t("courierStats.showStats")}
        </Button>
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
            visible={showFilters}
            onDismiss={() => setShowFilters(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowFilters(true)}
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
                setShowFilters(false)
              }}
              title={t("deliveryHistory.allDeliveries")}
              leadingIcon="package-variant"
            />
            <Menu.Item
              onPress={() => {
                setCurrentFilter("completed")
                setShowFilters(false)
              }}
              title={t("deliveryHistory.completed")}
              leadingIcon="check-circle"
            />
            <Menu.Item
              onPress={() => {
                setCurrentFilter("in_progress")
                setShowFilters(false)
              }}
              title={t("deliveryHistory.inProgress")}
              leadingIcon="progress-clock"
            />
            <Menu.Item
              onPress={() => {
                setCurrentFilter("cancelled")
                setShowFilters(false)
              }}
              title={t("deliveryHistory.cancelled")}
              leadingIcon="close-circle"
            />
          </Menu>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)} icon="sort" style={styles.sortButton}>
                {sortOrder === "newest"
                  ? t("deliveryHistory.newest")
                  : sortOrder === "oldest"
                    ? t("deliveryHistory.oldest")
                    : t("deliveryHistory.defaultSort")}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortOrder("newest")
                setMenuVisible(false)
              }}
              title={t("deliveryHistory.newest")}
              leadingIcon="clock-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortOrder("oldest")
                setMenuVisible(false)
              }}
              title={t("deliveryHistory.oldest")}
              leadingIcon="clock-outline"
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
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={showStats ? renderStats : null}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
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
              buttonText={searchQuery || currentFilter !== "all" ? t("deliveryHistory.clearFilters") : undefined}
              onButtonPress={() => {
                setSearchQuery("")
                setCurrentFilter("all")
              }}
            />
          }
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
  clientChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  ratingContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingStar: {
    marginRight: 2,
  },
  ratingValue: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
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
  statsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  statsLoadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  statsPeriodSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  ratingStarsLarge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingStarLarge: {
    marginRight: 4,
  },
  ratingValueLarge: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 4,
  },
  hideStatsButton: {
    marginTop: 16,
  },
  showStatsButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  deliveryCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeContainer: {
    marginVertical: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  pointInfo: {
    marginLeft: 8,
    flex: 1,
  },
  pointAddress: {
    fontSize: 14,
    color: '#666',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 2,
  },
  detailsButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
})

export default DeliveryHistoryScreen