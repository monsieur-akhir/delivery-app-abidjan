import type React from "react"
import { StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"

interface EmptyStateProps {
  icon: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionLabel, onAction }) => {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(500)}>
      <Feather name={icon} size={64} color="#CCCCCC" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#FF6B00",
  },
})

export default EmptyState
