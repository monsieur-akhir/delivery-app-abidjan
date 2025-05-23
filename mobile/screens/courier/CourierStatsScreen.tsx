"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native"
import { Text, Card, Divider, Chip, ActivityIndicator, ProgressBar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { PieChart, BarChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchCourierStats, fetchCourierRatings } from "../../services/api"
import { formatDistance, formatTime } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

type CourierStatsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CourierStats">
}

interface CourierStats {
  total_deliveries: number
  deliveries_completed: number
  deliveries_cancelled: number
  total_distance: number
  total_earnings: number
  average_rating: number
  total_points: number
  level: number
  level_progress: number
  points_to_next_level: number
  five_star_ratings: number
  four_star_ratings: number
  three_star_ratings: number
  two_star_ratings: number
  one_star_ratings: number
  average_delivery_time: number
  on_time_percentage: number
  busiest_day: string
  busiest_time: string
  most_frequent_communes: Array<{
    commune: string
    count: number
    percentage: number
  }>
}

interface RatingComment {
  id: string
  rating: number
  comment: string
  client_name: string
  date: string
}

const screenWidth = Dimensions.get("window").width

const CourierStatsScreen: React.FC<CourierStatsScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { isConnected, isOfflineMode } = useNetwork()

  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<CourierStats | null>(null)
  const [ratingComments, setRatingComments] = useState<RatingComment[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)
      const statsData = await fetchCourierStats(selectedPeriod)
      setStats(statsData)

      const ratingsData = await fetchCourierRatings(selectedPeriod)
      setRatingComments(ratingsData)
    } catch (error) {
      console.error("Error loading stats data:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [selectedPeriod])

  const renderRatingDistribution = (): React.ReactNode => {
    if (!stats) return null

    const data = [
      {
        name: "5★",
        population: stats.five_star_ratings,
        color: "#4CAF50",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "4★",
        population: stats.four_star_ratings,
        color: "#8BC34A",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "3★",
        population: stats.three_star_ratings,
        color: "#FFC107",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "2★",
        population: stats.two_star_ratings,
        color: "#FF9800",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
      {
        name: "1★",
        population: stats.one_star_ratings,
        color: "#F44336",
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      },
    ]

    return (
      <PieChart
        data={data}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          backgroundColor: "#FFFFFF",
          backgroundGradientFrom: "#FFFFFF",
          backgroundGradientTo: "#FFFFFF",
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    )
  }

  const renderCommunesChart = (): React.ReactNode => {
    if (!stats || !stats.most_frequent_communes || stats.most_frequent_communes.length === 0) {
      return null
    }

    const data = {
      labels: stats.most_frequent_communes.map((item) => item.commune),
      datasets: [
        {
          data: stats.most_frequent_communes.map((item) => item.percentage),
        },
      ],
    }

    return (
      <BarChart
        data={data}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix="%"
        chartConfig={{
          backgroundColor: "#FFFFFF",
          backgroundGradientFrom: "#FFFFFF",
          backgroundGradientTo: "#FFFFFF",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.7,
        }}
        style={styles.chart}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes statistiques</Text>
        <View style={{ width: 24 }} />
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}

      <View style={styles.periodSelector}>
        <Chip
          selected={selectedPeriod === "week"}
          onPress={() => setSelectedPeriod("week")}
          style={styles.periodChip}
          textStyle={selectedPeriod === "week" ? styles.selectedPeriodText : {}}
        >
          7 jours
        </Chip>
        <Chip
          selected={selectedPeriod === "month"}
          onPress={() => setSelectedPeriod("month")}
          style={styles.periodChip}
          textStyle={selectedPeriod === "month" ? styles.selectedPeriodText : {}}
        >
          30 jours
        </Chip>
        <Chip
          selected={selectedPeriod === "year"}
          onPress={() => setSelectedPeriod("year")}
          style={styles.periodChip}
          textStyle={selectedPeriod === "year" ? styles.selectedPeriodText : {}}
        >
          Année
        </Chip>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Chargement des statistiques...</Text>
          </View>
        ) : stats ? (
          <>
            {/* Niveau et points */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Niveau et points</Text>
                <View style={styles.levelContainer}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{stats.level}</Text>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={styles.pointsText}>{stats.total_points} points</Text>
                    <ProgressBar progress={stats.level_progress} color="#FF6B00" style={styles.progressBar} />
                    <Text style={styles.nextLevelText}>{stats.points_to_next_level} points pour le niveau suivant</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Statistiques générales */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Statistiques générales</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.total_deliveries}</Text>
                    <Text style={styles.statLabel}>Livraisons</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatDistance(stats.total_distance)}</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.average_rating.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Note moyenne</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatTime(stats.average_delivery_time)}</Text>
                    <Text style={styles.statLabel}>Temps moyen</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.on_time_percentage}%</Text>
                    <Text style={styles.statLabel}>À l'heure</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.busiest_day}</Text>
                    <Text style={styles.statLabel}>Jour le plus actif</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Distribution des évaluations */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Distribution des évaluations</Text>
                {renderRatingDistribution()}
              </Card.Content>
            </Card>

            {/* Communes les plus fréquentes */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Communes les plus fréquentes</Text>
                {renderCommunesChart()}
              </Card.Content>
            </Card>

            {/* Commentaires récents */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Commentaires récents</Text>
                {ratingComments.length > 0 ? (
                  ratingComments.map((comment, index) => (
                    <View key={comment.id}>
                      <View style={styles.commentContainer}>
                        <View style={styles.commentHeader}>
                          <View style={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Feather
                                key={star}
                                name="star"
                                size={16}
                                color={star <= comment.rating ? "#FFC107" : "#E0E0E0"}
                              />
                            ))}
                          </View>
                          <Text style={styles.commentDate}>{comment.date}</Text>
                        </View>
                        <Text style={styles.commentText}>{comment.comment}</Text>
                        <Text style={styles.commentAuthor}>- {comment.client_name}</Text>
                      </View>
                      {index < ratingComments.length - 1 && <Divider style={styles.commentDivider} />}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCommentsContainer}>
                    <Feather name="message-square" size={40} color="#CCCCCC" />
                    <Text style={styles.emptyCommentsText}>Aucun commentaire pour cette période</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorText}>Impossible de charger les statistiques. Veuillez réessayer.</Text>
          </View>
        )}
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
  periodSelector: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  periodChip: {
    marginHorizontal: 4,
    backgroundColor: "#F5F5F5",
  },
  selectedPeriodText: {
    color: "#FF6B00",
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
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  levelInfo: {
    flex: 1,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  nextLevelText: {
    fontSize: 12,
    color: "#757575",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  commentContainer: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  commentDate: {
    fontSize: 12,
    color: "#757575",
  },
  commentText: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 4,
    fontStyle: "italic",
  },
  commentAuthor: {
    fontSize: 12,
    color: "#757575",
    textAlign: "right",
  },
  commentDivider: {
    marginVertical: 12,
  },
  emptyCommentsContainer: {
    alignItems: "center",
    padding: 20,
  },
  emptyCommentsText: {
    marginTop: 12,
    color: "#757575",
    textAlign: "center",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 16,
    color: "#757575",
    textAlign: "center",
  },
})

export default CourierStatsScreen
