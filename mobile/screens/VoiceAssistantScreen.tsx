/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native"
import { Text, Card, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import VoiceAssistantService, { type VoiceCommand } from "../services/VoiceAssistantService"
import { useNetwork } from "../contexts/NetworkContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const VoiceAssistantScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { isConnected } = useNetwork()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollViewRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    initializeAssistant()

    // Ajouter un message de bienvenue
    addMessage({
      id: Date.now().toString(),
      text: t("voiceAssistant.title"),
      isUser: false,
      timestamp: new Date(),
    })

    return () => {
      // Nettoyer les ressources lors de la fermeture de l'écran
      VoiceAssistantService.cleanup()
    }
  }, [])

  useEffect(() => {
    // Faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  useEffect(() => {
    // Animation de pulsation pour le bouton d'écoute
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [isListening])

  const initializeAssistant = async () => {
    try {
      await VoiceAssistantService.initialize()
    } catch (err) {
      console.error("Error initializing voice assistant:", err)
      setError(t("voiceAssistant.permissionDenied"))
    }
  }

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }

  const handleStartListening = async () => {
    if (!isConnected) {
      setError(t("voiceAssistant.offlineMode"))
      return
    }

    try {
      setIsListening(true)
      setError(null)

      await VoiceAssistantService.startListening()
    } catch (err) {
      console.error("Error starting listening:", err)
      setIsListening(false)
      setError(t("voiceAssistant.permissionDenied"))
    }
  }

  const handleStopListening = async () => {
    try {
      setIsListening(false)

      const command = await VoiceAssistantService.stopListening()

      if (command && command.command) {
        // Ajouter la commande de l'utilisateur aux messages
        addMessage({
          id: Date.now().toString(),
          text: command.command,
          isUser: true,
          timestamp: new Date(),
        })

        // Traiter la commande
        await processCommand(command)
      } else {
        setError(t("voiceAssistant.errorProcessing"))
      }
    } catch (err) {
      console.error("Error stopping listening:", err)
      setError(t("voiceAssistant.errorProcessing"))
    }
  }

  const processCommand = async (command: VoiceCommand) => {
    try {
      // Exécuter la commande
      const response = await VoiceAssistantService.executeCommand(command)

      // Ajouter la réponse aux messages
      addMessage({
        id: Date.now().toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
      })

      // Lire la réponse à haute voix
      await VoiceAssistantService.speak(response.text)

      // Exécuter l'action si nécessaire
      if (response.action && response.data) {
        executeAction(response.action, response.data)
      }
    } catch (err) {
      console.error("Error processing command:", err)
      addMessage({
        id: Date.now().toString(),
        text: t("voiceAssistant.errorProcessing"),
        isUser: false,
        timestamp: new Date(),
      })
    }
  }

  // Type guard to check if screen is a valid route
  const isValidRoute = (screen: string): screen is keyof RootStackParamList => {
    const validRoutes: (keyof RootStackParamList)[] = [
      'Login', 'Register', 'VerifyOTP', 'ForgotPassword', 'ClientTabs', 'CourierTabs',
      'Home', 'CreateDelivery', 'MerchantDetails', 'DeliveryDetails', 'Bids', 'TrackDelivery',
      'Payment', 'RateDelivery', 'EnhancedRateDelivery', 'Bid', 'CourierTrackDelivery',
      'CourierStatus', 'CourierStats', 'CollaborativeDeliveries', 'CollaborativeDeliveryDetails',
      'JoinCollaborativeDelivery', 'CollaborativeChat', 'Gamification', 'CommunityWallet',
      'VehicleManagement', 'CourierProfile', 'Notifications', 'Support', 'LanguageSettings',
      'Main', 'ClientHome', 'Marketplace', 'DeliveryHistory', 'Settings', 'CourierHome',
      'CourierEarnings', 'CourierDeliveryHistory', 'WebPayment', 'Cart', 'Profile',
      'NotificationSettings', 'SecuritySettings', 'ChangePassword', 'SecurityQuestions',
      'StorageManagementScreen', 'AutoSyncSettingsScreen', 'DataUsageSettingsScreen',
      'WeatherScreen', 'GamificationScreen', 'AvailableDeliveries'
    ]
    return validRoutes.includes(screen as keyof RootStackParamList)
  }

  // Navigation helper with proper type safety
  const navigateToScreen = (screenName: keyof RootStackParamList, params?: unknown) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigation as any
      
      switch (screenName) {
        case 'Login':
        case 'Register':
        case 'ForgotPassword':
        case 'ClientTabs':
        case 'CourierTabs':
        case 'Home':
        case 'CreateDelivery':
        case 'CourierStats':
        case 'CollaborativeDeliveries':
        case 'Gamification':
        case 'CommunityWallet':
        case 'VehicleManagement':
        case 'Notifications':
        case 'Support':
        case 'LanguageSettings':
        case 'Main':
        case 'ClientHome':
        case 'DeliveryHistory':
        case 'Settings':
        case 'CourierHome':
        case 'CourierEarnings':
        case 'CourierDeliveryHistory':
        case 'Profile':
        case 'NotificationSettings':
        case 'SecuritySettings':
        case 'ChangePassword':
        case 'SecurityQuestions':
        case 'StorageManagementScreen':
        case 'AutoSyncSettingsScreen':
        case 'DataUsageSettingsScreen':
        case 'GamificationScreen':
        case 'AvailableDeliveries':
          nav.navigate(screenName)
          break
        case 'Marketplace':
          if (params && typeof params === 'object' && 'category' in params) {
            nav.navigate(screenName, params)
          } else {
            nav.navigate(screenName)
          }
          break
        case 'CourierStatus':
          if (params && typeof params === 'object' && 'initialStatus' in params) {
            nav.navigate(screenName, params)
          } else {
            nav.navigate(screenName)
          }
          break
        case 'VerifyOTP':
          if (params && typeof params === 'object' && 'phone' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'MerchantDetails':
          if (params && typeof params === 'object' && 'merchantId' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'DeliveryDetails':
        case 'Bids':
        case 'TrackDelivery':
        case 'Bid':
        case 'CourierTrackDelivery':
        case 'JoinCollaborativeDelivery':
        case 'CollaborativeChat':
        case 'RateDelivery':
        case 'EnhancedRateDelivery':
          if (params && typeof params === 'object' && 'deliveryId' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'CollaborativeDeliveryDetails':
          if (params && typeof params === 'object' && 'deliveryId' in params && 'clientName' in params && 'finalPrice' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'Payment':
          if (params && typeof params === 'object' && 'deliveryId' in params && 'amount' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'CourierProfile':
          if (params && typeof params === 'object' && 'courierId' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'WebPayment':
          if (params && typeof params === 'object' && 'paymentUrl' in params && 'transactionId' in params && 'onComplete' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'Cart':
          if (params && typeof params === 'object' && 'merchantId' in params) {
            nav.navigate(screenName, params)
          }
          break
        case 'WeatherScreen':
          if (params && typeof params === 'object' && 'location' in params) {
            nav.navigate(screenName, params)
          }
          break
        default:
          console.error("Unhandled navigation case:", screenName)
      }
    } catch (error) {
      console.error("Navigation error:", error)
      throw error
    }
  }

  const executeAction = (action: string, data: { screen?: string; params?: unknown; deliveryId?: string; location?: string }) => {
    try {
      switch (action) {
        case "navigate":
          if (data?.screen && isValidRoute(data.screen)) {
            navigateToScreen(data.screen, data.params)
          } else {
            console.error("Invalid navigation route:", data?.screen)
          }
          break
        case "createDelivery":
          navigateToScreen("CreateDelivery")
          break
        case "trackDelivery":
          if (data?.deliveryId) {
            navigateToScreen("TrackDelivery", { deliveryId: data.deliveryId })
          }
          break
        case "checkWeather":
          navigateToScreen("WeatherScreen", { location: data?.location || "Abidjan" })
          break
        case "findMerchants":
          if (data?.params && typeof data.params === 'object' && 'category' in data.params) {
            navigateToScreen("Marketplace", { category: (data.params as { category?: string }).category })
          } else {
            navigateToScreen("Marketplace")
          }
          break
        case "checkEarnings":
          navigateToScreen("CourierEarnings")
          break
        case "goOnline":
        case "goOffline":
          navigateToScreen("CourierStatus", { initialStatus: action === "goOnline" })
          break
        default:
          console.error("Unknown action:", action)
      }
    } catch (error) {
      console.error("Navigation error:", error)
      setError(t("voiceAssistant.navigationError"))
    }
  }

  const renderMessage = (message: ChatMessage) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!message.isUser && (
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="robot" size={24} color="#FF6B00" />
          </View>
        )}
        <View style={[styles.messageBubble, message.isUser ? styles.userMessageBubble : styles.assistantMessageBubble]}>
          <Text style={[styles.messageText, message.isUser ? styles.userMessageText : styles.assistantMessageText]}>
            {message.text}
          </Text>
          <Text style={styles.timestampText}>
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {message.isUser && (
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={24} color="#1976D2" />
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t("voiceAssistant.title")}</Text>
        <IconButton
          icon="information-outline"
          size={24}
          onPress={() => {
            // Afficher les informations sur les commandes disponibles
            addMessage({
              id: Date.now().toString(),
              text: t("voiceAssistant.commands.help"),
              isUser: false,
              timestamp: new Date(),
            })
          }}
        />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map(renderMessage)}

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <View style={styles.controlsContainer}>
        <View style={styles.statusContainer}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : isListening ? (
            <Text style={styles.listeningText}>{t("voiceAssistant.listening")}</Text>
          ) : (
            <Text style={styles.statusText}>{t("voiceAssistant.tapToSpeak")}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.micButtonContainer}
          onPressIn={handleStartListening}
          onPressOut={handleStopListening}
          disabled={isListening || !isConnected}
        >
          <Animated.View
            style={[
              styles.micButton,
              { transform: [{ scale: pulseAnim }] },
              isListening && styles.listeningMicButton,
              !isConnected && styles.disabledMicButton,
            ]}
          >
            {isListening ? (
              <MaterialCommunityIcons name="microphone" size={32} color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="microphone-outline" size={32} color="#FFFFFF" />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: "#E3F2FD",
    borderBottomRightRadius: 4,
  },
  assistantMessageBubble: {
    backgroundColor: "#FFF3E0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userMessageText: {
    color: "#1565C0",
  },
  assistantMessageText: {
    color: "#E64A19",
  },
  timestampText: {
    fontSize: 10,
    color: "#9E9E9E",
    alignSelf: "flex-end",
  },
  errorCard: {
    marginVertical: 8,
    backgroundColor: "#FFEBEE",
  },
  errorText: {
    color: "#C62828",
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: "#757575",
  },
  listeningText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  micButtonContainer: {
    alignItems: "center",
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
  },
  listeningMicButton: {
    backgroundColor: "#F44336",
  },
  disabledMicButton: {
    backgroundColor: "#BDBDBD",
  },
})

export default VoiceAssistantScreen
