import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Text, Card, ProgressBar, Avatar, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as Animatable from "react-native-animatable"
import { useAuth } from "../../contexts/AuthContext"
import GamificationService from "../../services/GamificationService"
import type { Achievement, Leaderboard, CourierStats } from "../../types/models"

const GamificationScreen: React.FC = () => {
  const { user } = useAuth()

  const [stats, setStats] = useState<CourierStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500]
  const levelNames = [
    "Novice", "Apprenti", "Livreur", "Expert", "Maître", 
    "Champion", "Légende", "Héros", "Titan", "Dieu de la livraison"
  ]

  useEffect(() => {
    loadGamificationData()
  }, [])

  const loadGamificationData = async () => {
    try {
      setLoading(true)
      const [statsData, achievementsData, leaderboardData] = await Promise.all([
        GamificationService.getCourierStats(),
        GamificationService.getAchievements(),
        GamificationService.getLeaderboard()
      ])

      setStats({
        ...statsData,
        average_rating: statsData.average_rating || 0,
        total_deliveries: statsData.total_deliveries || 0,
        total_earnings: 0,
        totalDistance: 0,
        level: statsData.level || 0,
        total_points: statsData.total_points || 0,
        experience: statsData.total_points || 0,
        nextLevelExperience: levelThresholds[statsData.level + 1] || 0,
        badges: [],
        deliveriesCompleted: statsData.total_deliveries || 0,
        daily_deliveries: 0,
        daily_rating: 0
      })
      setAchievements(achievementsData)
      // Adapter les données du service vers le type models
      const adaptedLeaderboard = leaderboardData.map(entry => ({
        ...entry,
        deliveriescount: entry.deliveries_count || 0
      }))
      setLeaderboard(adaptedLeaderboard)
    } catch (error) {
      console.error("Error loading gamification data:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadGamificationData()
    setRefreshing(false)
  }

  const getCurrentLevel = (points: number): number => {
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (points >= levelThresholds[i]) {
        return i
      }
    }
    return 0
  }

  const getProgressToNextLevel = (points: number): number => {
    const currentLevel = getCurrentLevel(points)
    if (currentLevel >= levelThresholds.length - 1) return 1

    const currentThreshold = levelThresholds[currentLevel]
    const nextThreshold = levelThresholds[currentLevel + 1]

    return (points - currentThreshold) / (nextThreshold - currentThreshold)
  }

  const getAchievementIcon = (type: string): "package" | "star" | "zap" | "map" | "users" | "award" => {
    switch (type) {
      case "delivery_count": return "package"
      case "rating": return "star"
      case "speed": return "zap"
      case "distance": return "map"
      case "collaboration": return "users"
      default: return "award"
    }
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement des données de gamification...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const currentLevel = getCurrentLevel(stats?.total_points || 0)
  const progress = getProgressToNextLevel(stats?.total_points || 0)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />
        }
      >
        {/* Profil et niveau */}
        <Animatable.View animation="fadeInUp" duration={800}>
          <Card style={styles.profileCard}>
            <Card.Content>
              <View style={styles.profileHeader}>
                <Avatar.Image
                  size={80}
                  source={
                    user?.profile_picture 
                      ? { uri: user.profile_picture } 
                      : require("../../assets/images/default-avatar.png")
                  }
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{user?.full_name}</Text>
                  <Text style={styles.userLevel}>
                    Niveau {currentLevel + 1} - {levelNames[currentLevel]}
                  </Text>
                  <Text style={styles.totalPoints}>{stats.total_points || 0} points</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>
                  Progression vers le niveau {currentLevel + 2}
                </Text>
                <ProgressBar 
                  progress={progress} 
                  color="#FF6B00" 
                  style={styles.progressBar} 
                />
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}% - 
                  {currentLevel < levelThresholds.length - 1 
                    ? ` ${levelThresholds[currentLevel + 1] - (stats.total_points || 0)} points restants`
                    : " Niveau maximum atteint !"
                  }
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Statistiques */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Mes statistiques</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Feather name="package" size={24} color="#FF6B00" />
                  <Text style={styles.statValue}>{stats.total_deliveries}</Text>
                  <Text style={styles.statLabel}>Livraisons</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="star" size={24} color="#FFD700" />
                  <Text style={styles.statValue}>{stats.average_rating?.toFixed(1) || "N/A"}</Text>
                  <Text style={styles.statLabel}>Note moyenne</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="zap" size={24} color="#4CAF50" />
                  <Text style={styles.statValue}>{stats.completion_rate?.toFixed(0) || 0}%</Text>
                  <Text style={styles.statLabel}>Taux de réussite</Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="clock" size={24} color="#2196F3" />
                  <Text style={styles.statValue}>{stats.average_delivery_time || "N/A"}</Text>
                  <Text style={styles.statLabel}>Temps moyen</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Achievements récents */}
        <Animatable.View animation="fadeInUp" duration={800} delay={400}>
          <Card style={styles.achievementsCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Succès récents</Text>
              {achievements.slice(0, 3).map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Feather 
                      name={getAchievementIcon(achievement.type)} 
                      size={24} 
                      color="#FFD700" 
                    />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                    <Text style={styles.achievementPoints}>
                      +{achievement.points} points
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Classement */}
        <Animatable.View animation="fadeInUp" duration={800} delay={600}>
          <Card style={styles.leaderboardCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Classement hebdomadaire</Text>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <View key={entry.courier_id} style={styles.leaderboardItem}>
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankText,
                      index < 3 && styles.topRank
                    ]}>
                      #{index + 1}
                    </Text>
                    {index < 3 && (
                      <Feather 
                        name={index === 0 ? "award" : "award"} 
                        size={24} 
                        color="#FFD700" 
                      />
                    )}
                  </View>

                  <Avatar.Image
                    size={40}
                    source={
                      entry.profile_picture 
                        ? { uri: entry.profile_picture }
                        : require("../../assets/images/default-avatar.png")
                    }
                  />

                  <View style={styles.leaderboardInfo}>
                    <Text style={[
                      styles.leaderboardName,
                      entry.courier_id === user?.id && styles.currentUser
                    ]}>
                      {entry.courier_id === user?.id ? "Vous" : entry.name}
                    </Text>
                    <Text style={styles.leaderboardStats}>
                      {entry.deliveriescount} livraisons • {entry.points} pts
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Défis du jour */}
        <Animatable.View animation="fadeInUp" duration={800} delay={800}>
          <Card style={styles.challengesCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Défis du jour</Text>

              <View style={styles.challengeItem}>
                <View style={styles.challengeIcon}>
                  <Feather name="target" size={20} color="#FF6B00" />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>Complétez 5 livraisons</Text>
                  <Text style={styles.challengeReward}>Récompense: 50 points</Text>
                  <ProgressBar 
                    progress={Math.min((stats.daily_deliveries || 0) / 5, 1)} 
                    color="#FF6B00" 
                    style={styles.challengeProgress}
                  />
                  <Text style={styles.challengeText}>
                    {stats.daily_deliveries || 0}/5 livraisons
                  </Text>
                </View>
              </View>

              <View style={styles.challengeItem}>
                <View style={styles.challengeIcon}>
                  <Feather name="star" size={20} color="#FFD700" />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>Maintenez une note de 4.5+</Text>
                  <Text style={styles.challengeReward}>Récompense: 30 points</Text>
                  <ProgressBar 
                    progress={Math.min((stats.daily_rating || 0) / 4.5, 1)} 
                    color="#FFD700" 
                    style={styles.challengeProgress}
                  />
                  <Text style={styles.challengeText}>
                    Note actuelle: {stats.daily_rating?.toFixed(1) || "N/A"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  totalPoints: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  achievementsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  achievementPoints: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  leaderboardCard: {
    marginBottom: 16,
    elevation: 2,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 40,
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  topRank: {
    color: "#FF6B00",
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  currentUser: {
    color: "#FF6B00",
  },
  leaderboardStats: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  challengesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  challengeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212121",
  },
  challengeReward: {
    fontSize: 13,
    color: "#FF6B00",
    marginTop: 2,
  },
  challengeProgress: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 4,
  },
  challengeText: {
    fontSize: 12,
    color: "#757575",
  },
})

export default GamificationScreen