"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, Animated } from "react-native"
import { Text } from "react-native-paper"
import { Feather } from "@expo/vector-icons"
import { useNetwork } from "../contexts/NetworkContext"

const OfflineIndicator: React.FC = () => {
  const { isConnected } = useNetwork()
  const [visible, setVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(-50)).current

  useEffect(() => {
    if (!isConnected) {
      setVisible(true)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.spring(slideAnim, {
        toValue: -50,
        useNativeDriver: true,
      }).start(() => setVisible(false))
    }
  }, [isConnected, slideAnim, visible])

  if (!visible) {
    return null
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Feather name="wifi-off" size={16} color="#FFFFFF" />
      <Text style={styles.text}>Vous êtes hors ligne</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    zIndex: 1000,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default OfflineIndicator
