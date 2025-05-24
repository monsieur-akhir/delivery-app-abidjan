"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text, Card, Button, Avatar, Divider, IconButton, ProgressBar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { Dimensions } from "react-native"
import { formatPrice } from "../../utils/formatters"
import OfflineIndicator from "../../components/OfflineIndicator"
import WeatherInfo from "../../components/WeatherInfo"
import { fetchCourierStats, fetchCourierEarnings, fetchAvailableDeliveries } from "../../services/api"
import type { Delivery } from "../../types/models"
import { LineChart } from "react-native-chart-kit";

// Define the missing types for the chart components
declare module 'react-native-chart-kit' {
  export interface LineChartData {
    labels: string[]
    datasets: {
      data: number[]
      color?: (opacity: number) => string
      strokeWidth?: number
    }[]
    legend?: string[]
  }

  export interface ChartConfig {
    backgroundGradientFrom: string
    backgroundGradientTo: string
    color: (opacity: number) => string
    strokeWidth?: number
    barPercentage?: number
    useShadowColorFromDataset?: boolean
    decimalPlaces?: number
    labelColor?: (opacity: number) => string
    style?: {
      borderRadius?: number
    }
    propsForDots?: {
      r: string
      strokeWidth: string
      stroke: string
    }
  }
}

const screenWidth = Dimensions.get("window").width

const CourierDashboardScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()
  const { isConnected } = useNetwork()

  const [stats, setStats] = useState({
    deliveries_completed: 0,
    total_earnings: 0,
    rating: 0,
    level: 1,
    experience_points: 0,
    next_level_points: 100,
    badges_count: 0,
    active_deliveries: 0,
  })
  const [earningsData, setEarningsData] = useState({
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
      },
    ],
  })
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Add loading state to component rendering
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Add a loading indicator at the top of the component if needed
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Charger les statistiques du coursier
      const statsData = await fetchCourierStats()
      setStats(statsData)

      // Charger les données de gains
      const earningsData = await fetchCourierEarnings("week")

      // Formater les données pour le graphique
      const chartData = {
        labels: earningsData.days.map((day: { day_short: string }) => day.day_short),
        datasets: [
          {
            data: earningsData.days.map((day: { amount: number }) => day.amount),
          },
        ],
      }
      setEarningsData(chartData)

      // Charger les livraisons disponibles
      const deliveriesData = await fetchAvailableDeliveries("5")
      setAvailableDeliveries(deliveriesData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  const navigateToDeliveryDetails = (deliveryId: string) => {
    navigation.navigate("DeliveryDetails", { deliveryId });
  }

  const navigateToCourierEarnings = () => {
    navigation.navigate("CourierEarnings", undefined);
  }

  const navigateToGamification = () => {
    navigation.navigate("GamificationScreen");
  }

  const navigateToAvailableDeliveries = () => {
    navigation.navigate("AvailableDeliveries");
  }

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  }

  const userProfilePicture = user?.profile_picture || "https://via.placeholder.com/40";
  const userFullName = user?.full_name || "Anonymous";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar.Image size={40} source={{ uri: userProfilePicture }} />
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>{t("dashboard.welcome")}</Text>
            <Text style={styles.nameText}>{userFullName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton icon="bell-outline" iconColor="#212121" size={24} onPress={() => navigation.navigate("Notifications")} />
          <IconButton icon="cog-outline" iconColor="#212121" size={24} onPress={() => navigation.navigate("Settings")} />
        </View>
      </View>

      {!isConnected && <OfflineIndicator />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        <WeatherInfo />

        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.deliveries_completed}</Text>
                  <Text style={styles.statLabel}>{t("dashboard.deliveries")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatPrice(stats.total_earnings)}</Text>
                  <Text style={styles.statLabel}>{t("dashboard.earnings")}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
                    <IconButton icon="star" size={16} iconColor="#FFC107" style={styles.ratingIcon} />
                  </View>
                  <Text style={styles.statLabel}>{t("dashboard.rating")}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.levelCard}>
          <Card.Content>
            <View style={styles.levelHeader}>
              <View>
                <Text style={styles.levelLabel}>{t("dashboard.level")}</Text>
                <Text style={styles.levelValue}>{t("dashboard.levelValue", { level: stats.level })}</Text>
              </View>
              <TouchableOpacity onPress={navigateToGamification}>
                <View style={styles.badgesContainer}>
                  <IconButton icon="medal" size={20} iconColor="#FF6B00" style={styles.badgeIcon} />
                  <Text style={styles.badgesCount}>{stats.badges_count}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <ProgressBar
                progress={stats.experience_points / stats.next_level_points}
                color="#FF6B00"
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {stats.experience_points} / {stats.next_level_points} XP
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.earningsCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("dashboard.weeklyEarnings")}</Text>
              <TouchableOpacity onPress={navigateToCourierEarnings}>
                <Text style={styles.seeAllText}>{t("dashboard.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            <LineChart
              data={earningsData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        <Card style={styles.deliveriesCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("dashboard.availableDeliveries")}</Text>
              <TouchableOpacity onPress={navigateToAvailableDeliveries}>
                <Text style={styles.seeAllText}>{t("dashboard.seeAll")}</Text>
              </TouchableOpacity>
            </View>

            {availableDeliveries.length > 0 ? (
              <>
                {availableDeliveries.map((delivery, index) => (
                  <React.Fragment key={delivery.id}>
                    <TouchableOpacity
                      style={styles.deliveryItem}
                      onPress={() => navigateToDeliveryDetails(delivery.id)}
                    >
                      <View style={styles.deliveryInfo}>
                        <View style={styles.deliveryAddresses}>
                          <Text style={styles.deliveryCommune} numberOfLines={1}>
                            {delivery.pickup_commune} → {delivery.delivery_commune}
                          </Text>
                          <Text style={styles.deliveryDistance} numberOfLines={1}>
                            {delivery.distance} km • {delivery.estimated_duration} min
                          </Text>
                        </View>
                        <View style={styles.deliveryPrice}>
                          <Text style={styles.priceValue}>{formatPrice(delivery.proposed_price)}</Text>
                          <Text style={styles.priceCurrency}>FCFA</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < availableDeliveries.length - 1 && <Divider style={styles.deliveryDivider} />}
                  </React.Fragment>
                ))}
              </>
            ) : (
              <View style={styles.emptyDeliveries}>
                <IconButton icon="package-variant" size={40} iconColor="#BDBDBD" />
                <Text style={styles.emptyText}>{t("dashboard.noAvailableDeliveries")}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="bike"
            style={styles.actionButton}
            onPress={() => navigation.navigate("CourierStatus")}
          >
            {t("dashboard.goOnline")}
          </Button>

          <Button
            mode="outlined"
            icon="map-marker"
            style={styles.actionButton}
            onPress={() => navigation.navigate("AvailableDeliveries")}
          >
            {t("dashboard.findDeliveries")}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 12,
    color: "#757575",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  headerRight: {
    flexDirection: "row",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  weatherCard: {
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#EEEEEE",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingIcon: {
    margin: 0,
    padding: 0,
  },
  levelCard: {
    borderRadius: 8,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 12,
    color: "#757575",
  },
  levelValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeIcon: {
    margin: 0,
    padding: 0,
  },
  badgesCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
    textAlign: "right",
  },
  earningsCard: {
    borderRadius: 8,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B00",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  deliveriesCard: {
    borderRadius: 8,
    marginBottom: 16,
  },
  deliveryItem: {
    paddingVertical: 12,
  },
  deliveryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryAddresses: {
    flex: 1,
    marginRight: 16,
  },
  deliveryCommune: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  deliveryDistance: {
    fontSize: 12,
    color: "#757575",
  },
  deliveryPrice: {
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  priceCurrency: {
    fontSize: 12,
    color: "#757575",
  },
  deliveryDivider: {
    backgroundColor: "#EEEEEE",
  },
  emptyDeliveries: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
})

export default CourierDashboardScreen
