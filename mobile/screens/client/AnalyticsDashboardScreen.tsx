"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, TouchableOpacity } from "react-native"
import { Text, Card, Button, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { useAuth } from "../../contexts/AuthContext"
import axios from "axios"
import { API_URL } from "../../config/environment"
import { formatCurrency } from "../../utils/formatters"
import AsyncStorage from "@react-native-async-storage/async-storage"

const screenWidth = Dimensions.get("window").width

const AnalyticsDashboardScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month")
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    totalSpent: 0,
    averageRating: 0,
    deliveriesByStatus: [],
    spendingOverTime: [],
    deliveryTimeDistribution: [],
    topDestinations: [],
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("token")

      const response = await axios.get(`${API_URL}/analytics/client-dashboard?timeframe=${timeframe}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setStats(response.data)
      setError(null)
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setError(t("analytics.errorFetchingData"))
    } finally {
      setLoading(false)
    }
  }

  const getCompletionRate = () => {
    if (stats.totalDeliveries === 0) return 0
    return Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)
  }

  const getCancellationRate = () => {
    if (stats.totalDeliveries === 0) return 0
    return Math.round((stats.cancelledDeliveries / stats.totalDeliveries) * 100)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t("analytics.dashboard")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("analytics.loadingData")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t("analytics.dashboard")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Timeframe selector */}
        <View style={styles.timeframeSelector}>
          <TouchableOpacity
            style={[styles.timeframeOption, timeframe === "week" && styles.selectedTimeframe]}
            onPress={() => setTimeframe("week")}
          >
            <Text style={[styles.timeframeText, timeframe === "week" && styles.selectedTimeframeText]}>
              {t("analytics.week")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeframeOption, timeframe === "month" && styles.selectedTimeframe]}
            onPress={() => setTimeframe("month")}
          >
            <Text style={[styles.timeframeText, timeframe === "month" && styles.selectedTimeframeText]}>
              {t("analytics.month")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timeframeOption, timeframe === "year" && styles.selectedTimeframe]}
            onPress={() => setTimeframe("year")}
          >
            <Text style={[styles.timeframeText, timeframe === "year" && styles.selectedTimeframeText]}>
              {t("analytics.year")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* General statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("analytics.overview")}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
                <Text style={styles.statLabel}>{t("analytics.totalDeliveries")}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(stats.totalSpent)}</Text>
                <Text style={styles.statLabel}>{t("analytics.totalSpent")}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{getCompletionRate()}%</Text>
                <Text style={styles.statLabel}>{t("analytics.completionRate")}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>{t("analytics.averageRating")}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Spending chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("analytics.spendingOverTime")}</Text>

            {stats.spendingOverTime.length > 0 ? (
              <LineChart
                data={{
                  labels: stats.spendingOverTime.map((item: any) => item.label),
                  datasets: [
                    {
                      data: stats.spendingOverTime.map((item: any) => item.value),
                    },
                  ],
                }}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#FF6B00",
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>{t("analytics.noDataAvailable")}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Deliveries by status chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("analytics.deliveriesByStatus")}</Text>

            {stats.deliveriesByStatus.length > 0 ? (
              <PieChart
                data={stats.deliveriesByStatus.map((item: any) => ({
                  name: item.label,
                  population: item.value,
                  color: item.color,
                  legendFontColor: "#7F7F7F",
                  legendFontSize: 12,
                }))}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={styles.noDataText}>{t("analytics.noDataAvailable")}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Delivery time distribution */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("analytics.deliveryTimeDistribution")}</Text>

            {stats.deliveryTimeDistribution.length > 0 ? (
              <BarChart
                data={{
                  labels: stats.deliveryTimeDistribution.map((item: any) => item.label),
                  datasets: [
                    {
                      data: stats.deliveryTimeDistribution.map((item: any) => item.value),
                    },
                  ],
                }}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>{t("analytics.noDataAvailable")}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Top destinations */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("analytics.topDestinations")}</Text>

            {stats.topDestinations.length > 0 ? (
              <View style={styles.destinationsContainer}>
                {stats.topDestinations.map((destination: any, index) => (
                  <View key={index} style={styles.destinationItem}>
                    <View style={styles.destinationRank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.destinationInfo}>
                      <Text style={styles.destinationName}>{destination.name}</Text>
                      <Text style={styles.destinationCount}>
                        {destination.count} {t("analytics.deliveries")}
                      </Text>
                    </View>
                    <Text style={styles.destinationPercentage}>{destination.percentage}%</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>{t("analytics.noDataAvailable")}</Text>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          style={styles.exportButton}
          onPress={() => {
            // Export functionality to be implemented
            Alert.alert(t("analytics.exportTitle"), t("analytics.exportMessage"))
          }}
        >
          {t("analytics.exportData")}
        </Button>
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
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  timeframeSelector: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  timeframeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedTimeframe: {
    backgroundColor: "#FF6B00",
  },
  timeframeText: {
    fontSize: 14,
    color: "#757575",
  },
  selectedTimeframeText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  statsCard: {
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: "center",
    padding: 16,
    color: "#757575",
  },
  destinationsContainer: {
    gap: 12,
  },
  destinationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  destinationRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
  },
  destinationCount: {
    fontSize: 12,
    color: "#757575",
  },
  destinationPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  exportButton: {
    borderColor: "#FF6B00",
    borderWidth: 1,
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
})

export default AnalyticsDashboardScreen
