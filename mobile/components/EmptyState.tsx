
import type React from "react"
import { View, StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { Feather } from "@expo/vector-icons"

export interface EmptyStateProps {
  title: string
  subtitle: string
  actionText?: string
  onAction?: () => void
  image?: any
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, actionText, onAction, image }) => {
  return (
    <View style={styles.container}>
      <Feather name="inbox" size={64} color="#CCCCCC" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{subtitle}</Text>
      {onAction && actionText && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionText}
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
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
export { EmptyState }
