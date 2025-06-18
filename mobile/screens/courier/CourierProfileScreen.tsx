"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Avatar, Button, Card, ActivityIndicator } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import FeatherIcon from "../../components/FeatherIcon"
import StarRating from "../../components/StarRating"
import ErrorView from "../../components/ErrorView"
import type { CourierStats } from "../../types/models"
import type { CourierStatsScreenNavigationProp } from "../../types/navigation"
import { fetchCourierStats } from "../../services/api"

const CourierProfileScreen: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigation = useNavigation<CourierStatsScreenNavigationProp>()

  const [stats, setStats] = useState<CourierStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourierStats()
  }, [])

  const fetchCourierStats = async () => {
    try {
      setLoading(true)
      const response = await fetchCourierStats()
      setStats(response)
      setError(null)
    } catch (err) {
      setError(t("errors.failedToLoadStats"))
      console.error("Error fetching courier stats:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    )
  }

  if (error || !stats) {
    return <ErrorView message={error || t("errors.unknownError")} onRetry={fetchCourierStats} />
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={100}
          source={user?.profile_image ? { uri: user.profile_image } : require("../../assets/default-avatar.png")}
        />
        <Text style={styles.name}>{user?.name || ""}</Text>
        <View style={styles.ratingContainer}>
          <StarRating rating={stats.average_rating || 0} size={20} />
          <Text style={styles.ratingText}>{(stats.average_rating || 0).toFixed(1)}</Text>
        </View>
        <Text style={styles.role}>{t("profile.courier")}</Text>
      </View>

      <Card style={styles.statsCard}>
        <Card.Title title={t("profile.statistics")} />
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <FeatherIcon name="package" size={24} color="#FF6B00" />
              <Text style={styles.statValue}>{stats.total_deliveries || 0}</Text>
              <Text style={styles.statLabel}>{t("profile.deliveries")}</Text>
            </View>
            <View style={styles.statItem}>
              <FeatherIcon name="dollar-sign" size={24} color="#FF6B00" />
              <Text style={styles.statValue}>{(stats.total_earnings || 0).toLocaleString()} XOF</Text>
              <Text style={styles.statLabel}>{t("profile.earnings")}</Text>
            </View>
            <View style={styles.statItem}>
              <FeatherIcon name="map-pin" size={24} color="#FF6B00" />
              <Text style={styles.statValue}>{((stats.distance_traveled || 0) / 1000).toFixed(1)} km</Text>
              <Text style={styles.statLabel}>{t("profile.distance")}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.levelCard}>
        <Card.Title title={t("profile.level")} />
        <Card.Content>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Niveau {(stats as any).level || 1}</Text>
            <View style={styles.progressContainer}>
              <View 
                style={[styles.progressBar, { width: `${(((stats as any).experience || 0) / ((stats as any).nextLevelExperience || 100)) * 100}%` }]}
              />
            </View>
            <Text style={styles.experienceText}>
              {(stats as any).experience || 0} / {(stats as any).nextLevelExperience || 100} XP
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.badgesCard}>
        <Card.Title title={t("profile.badges")} />
        <Card.Content>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            {/* Badges will be implemented later */}
            {false && (
              <View style={styles.badgeItem}>
                <View style={styles.badgeIconContainer}>
                  <FeatherIcon name="award" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.badgeName}>Badge</Text>
                <Text style={styles.badgePoints}>+0 pts</Text>
              </View>
            )}
          </ScrollView>
        </Card.Content>
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon={({ size, color }) => <FeatherIcon name="edit" size={size} color={color} />}
          style={styles.actionButton}
          onPress={() => navigation.navigate("Settings")}
        >
          {t("profile.editProfile")}
        </Button>
        <Button
          mode="outlined"
          icon={({ size, color }) => <FeatherIcon name="truck" size={size} color={color} />}
          style={styles.actionButton}
          onPress={() => navigation.navigate("VehicleManagement")}
        >
          {t("profile.manageVehicles")}
        </Button>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  role: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  levelCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  levelContainer: {
    alignItems: "center",
  },
  levelText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  progressContainer: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    width: "100%",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FF6B00",
    borderRadius: 6,
  },
  experienceText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  badgesCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  badgesScroll: {
    flexDirection: "row",
    marginTop: 8,
  },
  badgeItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  badgeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  badgePoints: {
    fontSize: 10,
    color: "#757575",
    marginTop: 4,
  },
  actionsContainer: {
    margin: 16,
    marginTop: 0,
  },
  actionButton: {
    marginBottom: 12,
  },
})

export default CourierProfileScreen