"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { StyleSheet, Animated, TouchableOpacity } from "react-native"
import { Text } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../contexts/NetworkContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface OfflineIndicatorProps {
  onPress?: () => void
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onPress }) => {
  const { t } = useTranslation()
  const { isConnected, pendingUploads } = useNetwork()

  const [visible, setVisible] = useState(!isConnected || pendingUploads.length > 0)
  const slideAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    const newVisible = !isConnected || pendingUploads.length > 0

    if (newVisible !== visible) {
      setVisible(newVisible)

      Animated.timing(slideAnim, {
        toValue: newVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isConnected, pendingUploads.length])

  if (!visible && slideAnim._value === 0) {
    return null
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  })

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] },
        isConnected ? styles.pendingContainer : styles.offlineContainer,
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.8}>
        <MaterialCommunityIcons
          name={isConnected ? "cloud-sync" : "wifi-off"}
          size={20}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {isConnected ? t("offline.pendingSyncs", { count: pendingUploads.length }) : t("offline.offlineMode")}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  offlineContainer: {
    backgroundColor: "#F44336",
  },
  pendingContainer: {
    backgroundColor: "#FF9800",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
})

export default OfflineIndicator
