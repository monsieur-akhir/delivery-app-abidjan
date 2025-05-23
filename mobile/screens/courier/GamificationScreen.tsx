"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from "react-native"
import { Text, Card, Button, ProgressBar, IconButton, ActivityIndicator, Chip } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchGamificationProfile, fetchRankings, claimReward } from "../../services/api"
import GamificationBadge from "../../components/GamificationBadge"

const { width } = Dimensions.get("window")

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at?: string
}

interface Achievement {
  id: string
  name: string
  description: string
  progress: number
  max_progress: number
  completed: boolean
  completed_at?: string
}

interface Reward {
  id: string
  name: string
  description: string
  points_cost: number
  available: boolean
  claimed: boolean
  claimed_at?: string
  expires_at?: string
}

interface RankingUser {
  id: string
  full_name: string
  profile_picture?: string
  level: number
  points: number
  rank: number
}

interface GamificationProfile {
  user_id: string
  level: number
  points: number
  points_to_next_level: number
  badges: Badge[]
  achievements: Achievement[]
  rewards: Reward[]
  daily_streak: number
  daily_bonus_claimed: boolean
  last_active: string
}

const GamificationScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { isConnected } = useNetwork()

  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const [rankings, setRankings] = useState<RankingUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  const [claimingDailyBonus, setClaimingDailyBonus] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("profile")

  useEffect(() => {
    loadData()
  }, [isConnected])

  const loadData = async () => {
    if (!isConnected) {
      setError(t("common.offline"))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const profileData = await fetchGamificationProfile()
      setProfile(profileData)

      const rankingsData = await fetchRankings()
      setRankings(rankingsData)
    } catch (error) {
      console.error("Error loading gamification data:", error)
      setError(t("gamification.errorLoading"))
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (rewardId: string) => {
    if (!isConnected) {
      setError(t("common.offline"))
      return
    }

    try {
      setClaimingReward(rewardId)
      await claimReward(rewardId)

      // Mettre à jour l'état local
      setProfile((prevProfile) => {
        if (!prevProfile) return null

        return {
          ...prevProfile,
          rewards: prevProfile.rewards.map((reward) =>
            reward.id === rewardId ? { ...reward, claimed: true, claimed_at: new Date().toISOString() } : reward,
          ),
        }
      })

      // Recharger les données pour obtenir les points mis à jour
      loadData()
    } catch (error) {
      console.error("Error claiming reward:", error)
      setError(t("gamification.errorClaimingReward"))
    } finally {
      setClaimingReward(null)
    }
  }

  const handleClaimDailyBonus = async () => {
    if (!isConnected) {
      setError(t("common.offline"))
      return
    }

    try {
      setClaimingDailyBonus(true)
      // Simuler l'appel API pour réclamer le bonus quotidien
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mettre à jour l'état local
      setProfile((prevProfile) => {
        if (!prevProfile) return null

        return {
          ...prevProfile,
          daily_bonus_claimed: true,
          points: prevProfile.points + 50, // Ajouter 50 points pour le bonus quotidien
        }
      })
    } catch (error) {
      console.error("Error claiming daily bonus:", error)
      setError(t("gamification.errorClaimingReward"))
    } finally {
      setClaimingDailyBonus(false)
    }
  }

  const renderProfileTab = () => {
    if (!profile) return null

    const progressToNextLevel = (profile.points / (profile.points + profile.points_to_next_level)) * 100

    return (
      <View style={styles.tabContent}>
        <Card style={styles.levelCard}>
          <Card.Content>
            <View style={styles.levelHeader}>
              <View>
                <Text style={styles.levelLabel}>{t("gamification.level")}</Text>
                <Text style={styles.levelValue}>{profile.level}</Text>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsLabel}>{t("gamification.points")}</Text>
                <Text style={styles.pointsValue}>{profile.points}</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <ProgressBar progress={progressToNextLevel / 100} color="#FF6B00" style={styles.progressBar} />
              <Text style={styles.progressText}>
                {profile.points_to_next_level} {t("gamification.nextLevel")}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.streakCard}>
          <Card.Content>
            <View style={styles.streakHeader}>
              <View>
                <Text style={styles.streakLabel}>{t("gamification.dailyStreak")}</Text>
                <View style={styles.streakValueContainer}>
                  <Text style={styles.streakValue}>{profile.daily_streak}</Text>
                  <Text style={styles.streakDays}> {t("gamification.days")}</Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={handleClaimDailyBonus}
                disabled={profile.daily_bonus_claimed || claimingDailyBonus}
                loading={claimingDailyBonus}
                style={[styles.claimButton, profile.daily_bonus_claimed && styles.claimedButton]}
              >
                {profile.daily_bonus_claimed ? t("common.claimed") : t("gamification.claim")}
              </Button>
            </View>

            <Text style={styles.bonusText}>{t("gamification.dailyBonus")}: +50 points</Text>
          </Card.Content>
        </Card>

        {profile.badges && profile.badges.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("gamification.badges")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesContainer}>
              {profile.badges.map((badge) => (
                <GamificationBadge key={badge.id} badge={badge} />
              ))}
            </ScrollView>
          </View>
        )}

        {profile.achievements && profile.achievements.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t("gamification.achievements")}</Text>
            <View style={styles.achievementsContainer}>
              {profile.achievements.map((achievement) => (
                <Card key={achievement.id} style={styles.achievementCard}>
                  <Card.Content>
                    <View style={styles.achievementHeader}>
                      <Text style={styles.achievementName}>{achievement.name}</Text>
                      {achievement.completed && (
                        <IconButton icon="check-circle" size={20} color="#4CAF50" style={styles.completedIcon} />
                      )}
                    </View>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <View style={styles.achievementProgressContainer}>
                      <ProgressBar
                        progress={achievement.progress / achievement.max_progress}
                        color={achievement.completed ? "#4CAF50" : "#FF6B00"}
                        style={styles.achievementProgressBar}
                      />
                      <Text style={styles.achievementProgressText}>
                        {achievement.progress}/{achievement.max_progress}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderRewardsTab = () => {
    if (!profile) return null

    return (
      <View style={styles.tabContent}>
        <View style={styles.rewardsHeader}>
          <Text style={styles.rewardsTitle}>{t("gamification.rewards")}</Text>
          <Chip icon="star" style={styles.pointsChip}>
            {profile.points} {t("gamification.points")}
          </Chip>
        </View>

        <View style={styles.rewardsContainer}>
          {profile.rewards && profile.rewards.length > 0 ? (
            profile.rewards.map((reward) => (
              <Card key={reward.id} style={styles.rewardCard}>
                <Card.Content>
                  <View style={styles.rewardHeader}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    <Chip icon="star" style={styles.rewardPointsChip}>
                      {reward.points_cost}
                    </Chip>
                  </View>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>

                  {reward.expires_at && (
                    <Text style={styles.rewardExpiry}>
                      {t("common.expires")}: {new Date(reward.expires_at).toLocaleDateString()}
                    </Text>
                  )}

                  <Button
                    mode="contained"
                    onPress={() => handleClaimReward(reward.id)}
                    disabled={
                      reward.claimed ||
                      !reward.available ||
                      profile.points < reward.points_cost ||
                      claimingReward === reward.id
                    }
                    loading={claimingReward === reward.id}
                    style={[
                      styles.rewardButton,
                      reward.claimed && styles.claimedButton,
                      !reward.available && styles.unavailableButton,
                    ]}
                  >
                    {reward.claimed
                      ? t("common.claimed")
                      : !reward.available
                        ? t("common.unavailable")
                        : t("gamification.claimReward")}
                  </Button>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noDataText}>{t("gamification.noRewards")}</Text>
          )}
        </View>
      </View>
    )
  }

  const renderLeaderboardTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.leaderboardTitle}>{t("gamification.leaderboard")}</Text>

        {rankings && rankings.length > 0 ? (
          <View style={styles.rankingsContainer}>
            {rankings.map((user, index) => (
              <Card key={user.id} style={styles.rankingCard}>
                <Card.Content style={styles.rankingContent}>
                  <Text style={styles.rankingPosition}>{user.rank}</Text>
                  <View style={styles.rankingAvatarContainer}>
                    {user.profile_picture ? (
                      <Image source={{ uri: user.profile_picture }} style={styles.rankingAvatar} />
                    ) : (
                      <View style={[styles.rankingAvatar, styles.rankingAvatarPlaceholder]}>
                        <Text style={styles.rankingAvatarText}>
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.rankingUserInfo}>
                    <Text style={styles.rankingName}>{user.full_name}</Text>
                    <View style={styles.rankingLevelContainer}>
                      <Text style={styles.rankingLevelLabel}>{t("gamification.level")}</Text>
                      <Text style={styles.rankingLevelValue}>{user.level}</Text>
                    </View>
                  </View>
                  <View style={styles.rankingPointsContainer}>
                    <Text style={styles.rankingPointsValue}>{user.points}</Text>
                    <Text style={styles.rankingPointsLabel}>{t("gamification.points")}</Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>{t("gamification.noLeaderboardData")}</Text>
        )}
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>{t("gamification.loading")}</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadData} style={styles.retryButton}>
          {t("common.retry")}
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>
            {t("gamification.title")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rewards" && styles.activeTab]}
          onPress={() => setActiveTab("rewards")}
        >
          <Text style={[styles.tabText, activeTab === "rewards" && styles.activeTabText]}>
            {t("gamification.rewards")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "leaderboard" && styles.activeTab]}
          onPress={() => setActiveTab("leaderboard")}
        >
          <Text style={[styles.tabText, activeTab === "leaderboard" && styles.activeTabText]}>
            {t("gamification.leaderboard")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === "profile" && renderProfileTab()}
        {activeTab === "rewards" && renderRewardsTab()}
        {activeTab === "leaderboard" && renderLeaderboardTab()}
      </ScrollView>
    </View>
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
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF6B00",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B00",
  },
  tabText: {
    fontSize: 14,
    color: "#757575",
  },
  activeTabText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  levelCard: {
    marginBottom: 16,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 14,
    color: "#757575",
  },
  levelValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsLabel: {
    fontSize: 14,
    color: "#757575",
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
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
  streakCard: {
    marginBottom: 16,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 14,
    color: "#757575",
  },
  streakValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  streakDays: {
    fontSize: 14,
    color: "#757575",
  },
  claimButton: {
    backgroundColor: "#FF6B00",
  },
  claimedButton: {
    backgroundColor: "#BDBDBD",
  },
  bonusText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  achievementsContainer: {
    marginBottom: 8,
  },
  achievementCard: {
    marginBottom: 8,
    elevation: 1,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  completedIcon: {
    margin: 0,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#757575",
    marginVertical: 4,
  },
  achievementProgressContainer: {
    marginTop: 8,
  },
  achievementProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
    textAlign: "right",
  },
  rewardsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  pointsChip: {
    backgroundColor: "#FFF3E0",
  },
  rewardsContainer: {
    marginBottom: 8,
  },
  rewardCard: {
    marginBottom: 8,
    elevation: 1,
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
  },
  rewardPointsChip: {
    backgroundColor: "#FFF3E0",
  },
  rewardDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 12,
  },
  rewardExpiry: {
    fontSize: 12,
    color: "#F44336",
    marginBottom: 12,
  },
  rewardButton: {
    backgroundColor: "#FF6B00",
  },
  unavailableButton: {
    backgroundColor: "#BDBDBD",
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  rankingsContainer: {
    marginBottom: 8,
  },
  rankingCard: {
    marginBottom: 8,
    elevation: 1,
  },
  rankingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankingPosition: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    width: 30,
    textAlign: "center",
  },
  rankingAvatarContainer: {
    marginRight: 12,
  },
  rankingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankingAvatarPlaceholder: {
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
  },
  rankingAvatarText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  rankingUserInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  rankingLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankingLevelLabel: {
    fontSize: 12,
    color: "#757575",
    marginRight: 4,
  },
  rankingLevelValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  rankingPointsContainer: {
    alignItems: "center",
  },
  rankingPointsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  rankingPointsLabel: {
    fontSize: 12,
    color: "#757575",
  },
  noDataText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginTop: 24,
  },
})

export default GamificationScreen
