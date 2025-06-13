import type React from "react"
import { View, StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { Feather } from "@expo/vector-icons"
import type { Icon } from "@expo/vector-icons/build/createIconSet"

export interface EmptyStateProps {
  icon: React.ComponentProps<typeof Feather>["name"]
  title: string
  message: string
  buttonText?: string
  onButtonPress?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, buttonText, onButtonPress }) => {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={64} color="#CCCCCC" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onButtonPress && (
        <Button mode="contained" onPress={onButtonPress} style={styles.button}>
          {buttonText || "Réessayer"}
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