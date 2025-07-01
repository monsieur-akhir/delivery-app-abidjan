"use client"

import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text, Card, Button, Avatar, Divider, IconButton, ProgressBar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Dimensions } from "react-native"
import { formatPrice } from "../../utils/formatters"
import OfflineIndicator from "../../components/OfflineIndicator"
import WeatherInfo from "../../components/WeatherInfo"
import { fetchCourierStats, fetchCourierEarnings, fetchAvailableDeliveries } from "../../services/api"
import type { Delivery, Notification } from "../../types/models"
import { LineChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons"
import { API_URL } from '../../config/environment';

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
  const { notifications, unreadCount } = useNotification()

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
  const [deliveryAlerts, setDeliveryAlerts] = useState<Notification[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [isOnline, setIsOnline] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      // Charger les statistiques du coursier
      const statsData = await fetchCourierStats()
      setStats(statsData)

      // Charger les données de gains
      const earningsData = await fetchCourierEarnings("week")

      // Formater les données pour le graphique
      const chartData = {
        labels: Array.isArray(earningsData.days) ? earningsData.days.map((day: { day_short: string }) => day.day_short) : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [
          {
            data: Array.isArray(earningsData.days) ? earningsData.days.map((day: { amount: number }) => day.amount) : [0, 0, 0, 0, 0, 0, 0],
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
  }, [])

  // Filtrer les notifications pour les alertes de demande de course
  useEffect(() => {
    const courseAlerts = notifications.filter(
      (notification) => 
        notification.type === 'delivery' && 
        !notification.read &&
        (notification.title.toLowerCase().includes('nouvelle livraison') ||
         notification.title.toLowerCase().includes('demande de course') ||
         notification.title.toLowerCase().includes('livraison disponible'))
    )
    setDeliveryAlerts(courseAlerts)
    setShowAlerts(courseAlerts.length > 0)
  }, [notifications])

  // Add loading state to component rendering
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

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

  const handleAlertPress = (alert: Notification) => {
    if (alert.data && alert.data.delivery_id) {
      navigation.navigate("DeliveryDetails", { deliveryId: alert.data.delivery_id.toString() })
    } else {
      navigation.navigate("AvailableDeliveries")
    }
    // Marquer l'alerte comme lue
    // markNotificationAsRead(alert.id.toString())
  }

  const dismissAlert = (alertId: string) => {
    setDeliveryAlerts(prev => prev.filter(alert => alert.id.toString() !== alertId))
    if (deliveryAlerts.length <= 1) {
      setShowAlerts(false)
    }
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

  const userProfilePicture = user?.profile_picture
    ? user.profile_picture.startsWith('http')
      ? { uri: user.profile_picture }
      : { uri: `${API_URL.replace(/\/$/, '')}/${user.profile_picture.replace(/^\//, '')}` }
    : require('../../assets/images/default-avatar.png');
  const userFullName = user?.full_name || "Anonymous";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image source={userProfilePicture} size={56} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.full_name}</Text>
          <Text style={styles.userRole}>{t('dashboard.role')}</Text>
        </View>
        <IconButton icon="bell-outline" iconColor="#212121" size={28} onPress={() => navigation.navigate("Notifications")} />
      </View>

      {/* Bouton En ligne / Hors ligne */}
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <Button
          mode={isOnline ? 'contained' : 'outlined'}
          onPress={() => setIsOnline(v => !v)}
          style={{
            backgroundColor: isOnline ? '#4CAF50' : '#fff',
            borderColor: isOnline ? '#4CAF50' : '#FF6B00',
            borderWidth: 2,
            borderRadius: 24,
            paddingHorizontal: 32,
            paddingVertical: 8,
            minWidth: 200,
          }}
          labelStyle={{ color: isOnline ? '#fff' : '#FF6B00', fontWeight: 'bold', fontSize: 16 }}
          icon={isOnline ? 'check-circle-outline' : 'power'}
        >
          {isOnline ? t('dashboard.goOffline') : t('dashboard.goOnline')}
        </Button>
        <Text style={{ color: isOnline ? '#4CAF50' : '#888', marginTop: 8, fontSize: 14, textAlign: 'center' }}>
          {isOnline ? t('dashboard.onlineStatus') : t('dashboard.offlineStatus')}
        </Text>
      </View>

      {!isConnected && <OfflineIndicator />}

      {/* Alertes de demande de course */}
      {showAlerts && deliveryAlerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {deliveryAlerts.slice(0, 3).map((alert, index) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              onPress={() => handleAlertPress(alert)}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertIndicator} />
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <TouchableOpacity
                  onPress={() => dismissAlert(alert.id.toString())}
                  style={styles.dismissButton}
                >
                  <IconButton icon="close" size={16} iconColor="#757575" />
                </TouchableOpacity>
              </View>
              <Text style={styles.alertMessage} numberOfLines={2}>
                {alert.message}
              </Text>
              <View style={styles.alertFooter}>
                <Text style={styles.alertTime}>
                  {new Date(alert.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Button
                  mode="contained"
                  compact
                  style={styles.alertButton}
                  onPress={() => handleAlertPress(alert)}
                >
                  {t("dashboard.viewDetails")}
                </Button>
              </View>
            </TouchableOpacity>
          ))}
          
          {deliveryAlerts.length > 3 && (
            <TouchableOpacity
              style={styles.moreAlertsButton}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Text style={styles.moreAlertsText}>
                +{deliveryAlerts.length - 3} {t("dashboard.moreAlerts")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        <WeatherInfo />

        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.deliveries_completed}</Text>
                  <Text style={styles.statLabel}>{t("dashboard.deliveries")}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatPrice(stats.total_earnings)} FCFA</Text>
                  <Text style={styles.statLabel}>{t("dashboard.earnings")}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.rating}</Text>
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
                progress={
                  stats.next_level_points && stats.next_level_points > 0
                    ? Math.max(0, Math.min(1, stats.experience_points / stats.next_level_points))
                    : 0
                }
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
                      onPress={() => navigateToDeliveryDetails(delivery.id.toString())}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 2,
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  userRole: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    backgroundColor: '#eee',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginTop: 8,
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
  alertsContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  alertCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B00",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  alertIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B00",
    marginRight: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  dismissButton: {
    margin: 0,
    padding: 0,
  },
  alertMessage: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
    lineHeight: 16,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertTime: {
    fontSize: 10,
    color: "#9E9E9E",
  },
  alertButton: {
    height: 28,
    backgroundColor: "#FF6B00",
  },
  moreAlertsButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    marginTop: 4,
  },
  moreAlertsText: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "bold",
  },
})

export default CourierDashboardScreen