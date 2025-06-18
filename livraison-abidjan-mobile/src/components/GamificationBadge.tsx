"use client"

import type React from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Text, IconButton } from "react-native-paper"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at?: string
}

interface GamificationBadgeProps {
  badge: Badge
  size?: "small" | "medium" | "large"
  onPress?: () => void
  style?: any
}

const GamificationBadge: React.FC<GamificationBadgeProps> = ({ badge, size = "medium", onPress, style }) => {
  const getBadgeIcon = (iconName: string): string => {
    // Mapping des noms d'icônes aux icônes de Lucide
    const iconMap: Record<string, string> = {
      "first-delivery": "package",
      "delivery-master": "truck",
      "speed-demon": "zap",
      "night-owl": "moon",
      "perfect-rating": "star",
      "community-helper": "users",
      "weather-warrior": "cloud-lightning",
      "distance-champion": "map-pin",
      "streak-master": "calendar",
      "top-earner": "dollar-sign",
    }

    return iconMap[iconName] || "award"
  }

  const getBadgeColor = (iconName: string): string => {
    // Couleurs pour différents types de badges
    const colorMap: Record<string, string> = {
      "first-delivery": "#4CAF50",
      "delivery-master": "#2196F3",
      "speed-demon": "#FF9800",
      "night-owl": "#673AB7",
      "perfect-rating": "#FFC107",
      "community-helper": "#3F51B5",
      "weather-warrior": "#607D8B",
      "distance-champion": "#009688",
      "streak-master": "#E91E63",
      "top-earner": "#F44336",
    }

    return colorMap[iconName] || "#FF6B00"
  }

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: styles.smallContainer,
          iconSize: 24,
          nameText: styles.smallNameText,
        }
      case "large":
        return {
          container: styles.largeContainer,
          iconSize: 48,
          nameText: styles.largeNameText,
        }
      default:
        return {
          container: styles.mediumContainer,
          iconSize: 36,
          nameText: styles.mediumNameText,
        }
    }
  }

  const sizeStyles = getSizeStyles()
  const badgeColor = getBadgeColor(badge.icon)
  const badgeIcon = getBadgeIcon(badge.icon)

  const renderBadgeContent = () => (
    <View style={[styles.container, sizeStyles.container, !badge.unlocked && styles.lockedContainer, style]}>
      <View style={[styles.iconContainer, { backgroundColor: badge.unlocked ? `${badgeColor}20` : "#E0E0E0" }]}>
        <IconButton
          icon={badgeIcon}
          size={sizeStyles.iconSize}
          iconColor={badge.unlocked ? badgeColor : "#BDBDBD"}
          style={styles.icon}
        />
      </View>
      <Text
        style={[
          styles.nameText,
          sizeStyles.nameText,
          !badge.unlocked && styles.lockedText,
          { color: badge.unlocked ? badgeColor : "#BDBDBD" },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {badge.name}
      </Text>
      {!badge.unlocked && size !== "small" && (
        <View style={styles.lockedOverlay}>
          <IconButton icon="lock" size={24} iconColor="#FFFFFF" style={styles.lockIcon} />
        </View>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!badge.unlocked}>
        {renderBadgeContent()}
      </TouchableOpacity>
    )
  }

  return renderBadgeContent()
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  smallContainer: {
    width: 60,
    height: 70,
  },
  mediumContainer: {
    width: 80,
    height: 90,
  },
  largeContainer: {
    width: 100,
    height: 110,
  },
  iconContainer: {
    borderRadius: 50,
    padding: 4,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    margin: 0,
  },
  nameText: {
    textAlign: "center",
    fontWeight: "bold",
  },
  smallNameText: {
    fontSize: 10,
  },
  mediumNameText: {
    fontSize: 12,
  },
  largeNameText: {
    fontSize: 14,
  },
  lockedContainer: {
    opacity: 0.7,
  },
  lockedText: {
    color: "#BDBDBD",
  },
  lockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    margin: 0,
  },
})

export default GamificationBadge
