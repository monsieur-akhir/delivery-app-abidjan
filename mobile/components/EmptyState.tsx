
import React from "react"
import { View, StyleSheet } from "react-native"
import { Text, Button } from "react-native-paper"
import { Feather } from "@expo/vector-icons"

export interface EmptyStateProps {
  title: string
  subtitle?: string
  actionText?: string
  onAction?: () => void
  image?: any
  icon?: keyof typeof Feather.glyphMap
  message?: string
  buttonText?: string
  onButtonPress?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  subtitle, 
  actionText, 
  onAction, 
  image, 
  icon = "inbox",
  message,
  buttonText,
  onButtonPress
}) => {
  const displayMessage = message || subtitle || ""
  const displayButtonText = buttonText || actionText
  const displayOnPress = onButtonPress || onAction

  return (
    <View style={styles.container}>
      <Feather name={icon} size={64} color="#CCCCCC" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      {displayOnPress && displayButtonText && (
        <Button mode="contained" onPress={displayOnPress} style={styles.button}>
          {displayButtonText || "Réessayer"}
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
