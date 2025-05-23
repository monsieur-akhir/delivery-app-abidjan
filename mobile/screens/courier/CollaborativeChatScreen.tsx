"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import CollaborativeService from "../../services/CollaborativeService"
import type { ChatMessage, CollaborativeDelivery } from "../../types/models"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useWebSocketContext } from "../../contexts/WebSocketContext"
import ErrorView from "../../components/ErrorView"

type RouteParams = {
  deliveryId: string
}

const CollaborativeChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delivery, setDelivery] = useState<CollaborativeDelivery | null>(null)

  const route = useRoute()
  const { deliveryId } = route.params as RouteParams
  const navigation = useNavigation()
  const { user } = useAuth()
  const { colors } = useTheme()
  const { socket } = useWebSocketContext()
  const flatListRef = useRef<FlatList>(null)

  const fetchData = async () => {
    try {
      setError(null)
      setLoading(true)

      // Fetch delivery details
      const deliveryData = await CollaborativeService.getCollaborativeDelivery(deliveryId)
      setDelivery(deliveryData)

      // Fetch chat messages
      const messagesData = await CollaborativeService.getChatMessages(deliveryId)
      setMessages(messagesData)
    } catch (err) {
      console.error("Error fetching chat data:", err)
      setError("Impossible de charger les messages. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up WebSocket listener for new messages
    if (socket) {
      socket.on(`chat_message_${deliveryId}`, (message: ChatMessage) => {
        setMessages((prevMessages) => [...prevMessages, message])
      })
    }

    return () => {
      if (socket) {
        socket.off(`chat_message_${deliveryId}`)
      }
    }
  }, [deliveryId, socket])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      await CollaborativeService.sendChatMessage(deliveryId, newMessage.trim())
      setNewMessage("")
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Impossible d'envoyer le message. Veuillez réessayer.")
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isYesterday = (dateString: string) => {
    const date = new Date(dateString)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    )
  }

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.userId === user?.id
    const showDateHeader =
      index === 0 || new Date(item.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: colors.text }]}>
              {isToday(item.createdAt)
                ? "Aujourd'hui"
                : isYesterday(item.createdAt)
                  ? "Hier"
                  : formatDate(item.createdAt)}
            </Text>
          </View>
        )}
        <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage]}>
          {!isCurrentUser && (
            <View style={styles.avatarContainer}>
              {item.userAvatar ? (
                <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + "40" }]}>
                  <Text style={[styles.avatarFallbackText, { color: colors.primary }]}>{item.userName.charAt(0)}</Text>
                </View>
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isCurrentUser
                ? [styles.currentUserBubble, { backgroundColor: colors.primary }]
                : [styles.otherUserBubble, { backgroundColor: colors.card }],
            ]}
          >
            {!isCurrentUser && (
              <Text style={[styles.userName, { color: colors.primary }]}>
                {item.userName} (
                {item.userRole === "primary" ? "Principal" : item.userRole === "secondary" ? "Secondaire" : "Support"})
              </Text>
            )}
            <Text style={[styles.messageText, { color: isCurrentUser ? "white" : colors.text }]}>{item.message}</Text>
            <Text style={[styles.messageTime, { color: isCurrentUser ? "rgba(255, 255, 255, 0.7)" : colors.muted }]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </>
    )
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchData} />
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement des messages...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Livraison #{deliveryId.substring(0, 8)}</Text>
        {delivery && (
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {delivery.pickupCommune} → {delivery.deliveryCommune}
          </Text>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Tapez votre message..."
          placeholderTextColor={colors.muted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
  },
  dateHeader: {
    alignItems: "center",
    marginVertical: 8,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  currentUserMessage: {
    justifyContent: "flex-end",
  },
  otherUserMessage: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: 16,
    padding: 12,
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 4,
  },
  userName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
})

export default CollaborativeChatScreen
