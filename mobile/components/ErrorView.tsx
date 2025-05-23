import type React from "react"
import { StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { Feather } from "@expo/vector-icons"
import Animated, { FadeIn } from "react-native-reanimated"

interface ErrorViewProps {
  message: string
  onRetry: () => void
  icon?: string
}

const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry, icon = "alert-circle" }) => {
  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(500)}>
      <Feather name={icon} size={64} color="#F44336" />
      <Text style={styles.title}>Erreur</Text>
      <Text style={styles.message}>{message}</Text>
      <Button mode="contained" onPress={onRetry} style={styles.button} icon="refresh">
        Réessayer
      </Button>
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
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F44336",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#FF6B00",
  },
})

export default ErrorView
