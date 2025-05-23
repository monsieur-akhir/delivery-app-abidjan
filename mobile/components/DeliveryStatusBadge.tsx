import type React from "react"
import { View, StyleSheet } from "react-native"
import { Text } from "react-native-paper"
import { Feather } from "@expo/vector-icons"

interface DeliveryStatusBadgeProps {
  status: string
  size?: "small" | "medium" | "large"
}

const DeliveryStatusBadge: React.FC<DeliveryStatusBadgeProps> = ({ status, size = "medium" }) => {
  const getStatusInfo = () => {
    switch (status) {
      case "pending":
        return {
          label: "En attente",
          color: "#FFC107",
          backgroundColor: "#FFF8E1",
          icon: "clock",
        }
      case "accepted":
        return {
          label: "Acceptée",
          color: "#2196F3",
          backgroundColor: "#E3F2FD",
          icon: "check-circle",
        }
      case "picked_up":
        return {
          label: "Ramassée",
          color: "#FF9800",
          backgroundColor: "#FFF3E0",
          icon: "package-up",
        }
      case "in_progress":
        return {
          label: "En cours",
          color: "#FF6B00",
          backgroundColor: "#FBE9E7",
          icon: "truck",
        }
      case "delivered":
        return {
          label: "Livrée",
          color: "#4CAF50",
          backgroundColor: "#E8F5E9",
          icon: "package-down",
        }
      case "completed":
        return {
          label: "Terminée",
          color: "#4CAF50",
          backgroundColor: "#E8F5E9",
          icon: "check-circle",
        }
      case "cancelled":
        return {
          label: "Annulée",
          color: "#F44336",
          backgroundColor: "#FFEBEE",
          icon: "x-circle",
        }
      default:
        return {
          label: "Inconnu",
          color: "#9E9E9E",
          backgroundColor: "#F5F5F5",
          icon: "help-circle",
        }
    }
  }

  const { label, color, backgroundColor, icon } = getStatusInfo()

  const sizeStyles = {
    small: {
      container: { paddingVertical: 2, paddingHorizontal: 6 },
      text: { fontSize: 10 },
      icon: 12,
    },
    medium: {
      container: { paddingVertical: 4, paddingHorizontal: 8 },
      text: { fontSize: 12 },
      icon: 14,
    },
    large: {
      container: { paddingVertical: 6, paddingHorizontal: 12 },
      text: { fontSize: 14 },
      icon: 16,
    },
  }

  const currentSize = sizeStyles[size]

  return (
    <View style={[styles.container, { backgroundColor }, currentSize.container]}>
      <Feather name={icon} size={currentSize.icon} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }, currentSize.text]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "bold",
  },
})

export default DeliveryStatusBadge
