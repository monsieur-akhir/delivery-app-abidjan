import type React from "react"
import { View, StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { Feather } from "@expo/vector-icons"

interface ErrorViewProps {
  message: string
  onRetry?: () => void
  icon?: string
  isConnected?: boolean
}

const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry, icon = "alert-circle", isConnected = true }) => {
  return (
    <View style={styles.container}>
      <Feather name={icon as any} size={64} color="#F44336" />
      <Text style={styles.title}>Erreur</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && isConnected && (
        <Button mode="contained" onPress={onRetry} style={styles.button}>
          Réessayer
        </Button>
      )}
      {!isConnected && (
        <Text style={styles.offlineMessage}>
          Connexion internet requise. Veuillez vérifier votre connexion et réessayer.
        </Text>
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
    backgroundColor: "#F44336",
  },
  offlineMessage: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
  }
})

export default ErrorView
