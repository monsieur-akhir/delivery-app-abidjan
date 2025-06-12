
import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Text, Card, ProgressBar, Avatar, Button, Badge } from "react-native-paper"
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
      
      setStats(statsData)
      setAchievements(achievementsData)
      setLeaderboard(leaderboardData)
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

  const getAchievementIcon = (type: string): string => {
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

  const currentLevel = getCurrentLevel(stats.total_points)
  const progress = getProgressToNextLevel(stats.total_points)

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
                  <Text style={styles.totalPoints}>{stats.total_points} points</Text>
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
                    ? ` ${levelThresholds[currentLevel + 1] - stats.total_points} points restants`
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
              {achievements.slice(0, 3).map((achievement, index) => (
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
                  {achievement.unlocked_at && (
                    <Badge style={styles.newBadge}>Nouveau !</Badge>
                  )}
                </View>
              ))}
              
              <Button
                mode="outlined"
                onPress={() => {/* Navigate to full achievements */}}
                style={styles.viewAllButton}
              >
                Voir tous les succès
              </Button>
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
                        name={index === 0 ? "award" : "medal"} 
                        size={16} 
                        color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"}
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
                      {entry.deliveries_count} livraisons • {entry.points} pts
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
                    progress={Math.min(stats.daily_deliveries / 5, 1)} 
                    color="#FF6B00" 
                    style={styles.challengeProgress}
                  />
                  <Text style={styles.challengeText}>
                    {stats.daily_deliveries}/5 livraisons
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
    elevation: 4,
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
    color: "#212121",
  },
  userLevel: {
    fontSize: 16,
    color: "#FF6B00",
    fontWeight: "600",
    marginTop: 4,
  },
  totalPoints: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#757575",
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
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
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
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
    borderBottomColor: "#E0E0E0",
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  achievementDescription: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  achievementPoints: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "600",
    marginTop: 4,
  },
  newBadge: {
    backgroundColor: "#FF6B00",
  },
  viewAllButton: {
    marginTop: 16,
    borderColor: "#FF6B00",
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
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native"
import { Text, Card, ProgressBar, Surface, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../../contexts/AuthContext"
import { fetchCourierGamification } from "../../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

const { width } = Dimensions.get('window')

type GamificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Gamification">
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  progress?: number
  target?: number
}

interface Level {
  current: number
  xp: number
  nextLevelXp: number
  title: string
}

interface Achievement {
  id: string
  title: string
  description: string
  reward: string
  completed: boolean
  progress: number
  target: number
  icon: string
}

const GamificationScreen: React.FC<GamificationScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  
  const [level, setLevel] = useState<Level>({
    current: 5,
    xp: 2450,
    nextLevelXp: 3000,
    title: "Coursier Expérimenté"
  })
  
  const [badges, setBadges] = useState<Badge[]>([
    {
      id: '1',
      name: 'Première Livraison',
      description: 'Complétez votre première livraison',
      icon: 'award',
      rarity: 'common',
      unlocked: true
    },
    {
      id: '2',
      name: 'Speed Demon',
      description: 'Livrez 10 commandes en moins de 20 minutes',
      icon: 'zap',
      rarity: 'rare',
      unlocked: true
    },
    {
      id: '3',
      name: 'Client Heureux',
      description: 'Obtenez 50 évaluations 5 étoiles',
      icon: 'star',
      rarity: 'epic',
      unlocked: false,
      progress: 32,
      target: 50
    },
    {
      id: '4',
      name: 'Maître des Routes',
      description: 'Parcourez 1000 km au total',
      icon: 'navigation',
      rarity: 'legendary',
      unlocked: false,
      progress: 847,
      target: 1000
    }
  ])

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Marathon du Jour',
      description: 'Complétez 20 livraisons en une journée',
      reward: '500 XP + Badge',
      completed: false,
      progress: 12,
      target: 20,
      icon: 'target'
    },
    {
      id: '2',
      title: 'Semaine Parfaite',
      description: 'Maintenez une note de 5.0 pendant 7 jours',
      reward: '1000 XP + Badge Rare',
      completed: false,
      progress: 3,
      target: 7,
      icon: 'calendar'
    }
  ])

  const [stats, setStats] = useState({
    totalDeliveries: 847,
    averageRating: 4.8,
    totalDistance: 2134,
    totalEarnings: 425000,
    streak: 12
  })

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9E9E9E'
      case 'rare': return '#2196F3'
      case 'epic': return '#9C27B0'
      case 'legendary': return '#FF9800'
      default: return '#9E9E9E'
    }
  }

  const renderBadge = (badge: Badge) => (
    <TouchableOpacity
      key={badge.id}
      style={[
        styles.badgeCard,
        { borderColor: getRarityColor(badge.rarity) },
        !badge.unlocked && styles.lockedBadge
      ]}
    >
      <LinearGradient
        colors={badge.unlocked ? [getRarityColor(badge.rarity), `${getRarityColor(badge.rarity)}80`] : ['#F5F5F5', '#EEEEEE']}
        style={styles.badgeIconContainer}
      >
        <Feather 
          name={badge.icon as any} 
          size={24} 
          color={badge.unlocked ? "#FFFFFF" : "#CCCCCC"} 
        />
      </LinearGradient>
      
      <Text style={[styles.badgeName, !badge.unlocked && styles.lockedText]} numberOfLines={2}>
        {badge.name}
      </Text>
      
      {!badge.unlocked && badge.progress && badge.target && (
        <View style={styles.badgeProgress}>
          <ProgressBar
            progress={badge.progress / badge.target}
            color={getRarityColor(badge.rarity)}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {badge.progress}/{badge.target}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderAchievement = (achievement: Achievement) => (
    <Card key={achievement.id} style={styles.achievementCard}>
      <Card.Content>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementIcon}>
            <Feather name={achievement.icon as any} size={20} color="#FF6B00" />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            <Text style={styles.achievementReward}>🎁 {achievement.reward}</Text>
          </View>
        </View>
        
        <View style={styles.achievementProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression</Text>
            <Text style={styles.progressNumbers}>
              {achievement.progress}/{achievement.target}
            </Text>
          </View>
          <ProgressBar
            progress={achievement.progress / achievement.target}
            color="#FF6B00"
            style={styles.achievementProgressBar}
          />
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Récompenses</Text>
        <TouchableOpacity>
          <Feather name="help-circle" size={24} color="#757575" />
        </TouchableOpacity>
      </Surface>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Niveau et XP */}
        <LinearGradient
          colors={['#FF6B00', '#FF8F00']}
          style={styles.levelCard}
        >
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelTitle}>Niveau {level.current}</Text>
              <Text style={styles.levelSubtitle}>{level.title}</Text>
            </View>
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>{level.xp} XP</Text>
            </View>
          </View>
          
          <View style={styles.xpProgress}>
            <ProgressBar
              progress={level.xp / level.nextLevelXp}
              color="#FFFFFF"
              style={styles.xpProgressBar}
            />
            <Text style={styles.xpProgressText}>
              {level.nextLevelXp - level.xp} XP jusqu'au niveau {level.current + 1}
            </Text>
          </View>
        </LinearGradient>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vos performances</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Livraisons</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.averageRating}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Série active</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges collectés</Text>
            <Chip mode="outlined" style={styles.chip}>
              {badges.filter(b => b.unlocked).length}/{badges.length}
            </Chip>
          </View>
          
          <View style={styles.badgesGrid}>
            {badges.map(renderBadge)}
          </View>
        </View>

        {/* Défis actifs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Défis en cours</Text>
          {achievements.map(renderAchievement)}
        </View>

        {/* Classement */}
        <Card style={styles.leaderboardCard}>
          <Card.Content>
            <View style={styles.leaderboardHeader}>
              <Text style={styles.sectionTitle}>Classement hebdomadaire</Text>
              <Chip style={styles.rankChip}>
                <Text style={styles.rankText}>#12</Text>
              </Chip>
            </View>
            
            <Text style={styles.leaderboardDescription}>
              Vous êtes dans le top 15% des coursiers cette semaine !
            </Text>
            
            <TouchableOpacity style={styles.viewLeaderboardButton}>
              <Text style={styles.viewLeaderboardText}>Voir le classement complet</Text>
              <Feather name="chevron-right" size={16} color="#FF6B00" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  scrollView: {
    flex: 1,
  },
  levelCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  levelSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 4,
  },
  xpContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  xpProgress: {
    marginTop: 8,
  },
  xpProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  xpProgressText: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 8,
    textAlign: "center",
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
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
    height: 32,
    backgroundColor: "#E0E0E0",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  chip: {
    height: 28,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  badgeCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  lockedBadge: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212121",
    textAlign: "center",
    marginBottom: 8,
  },
  lockedText: {
    color: "#757575",
  },
  badgeProgress: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    height: 4,
    width: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: "#757575",
    marginTop: 4,
  },
  achievementCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
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
    color: "#212121",
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  achievementReward: {
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "600",
  },
  achievementProgress: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#757575",
  },
  progressNumbers: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212121",
  },
  achievementProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  leaderboardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  leaderboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rankChip: {
    backgroundColor: "#E8F5E8",
  },
  rankText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  leaderboardDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  viewLeaderboardButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  viewLeaderboardText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "600",
    marginRight: 4,
  },
  bottomSpacer: {
    height: 20,
  },
})

export default GamificationScreen
