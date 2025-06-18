"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
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
import { useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import CollaborativeService from "../../services/CollaborativeService"
import { useDelivery } from "../../hooks"
import type { ChatMessage, CollaborativeDelivery } from "../../types/models"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { useWebSocket } from "../../contexts/WebSocketContext"
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
  const { user } = useAuth()
  const { colors } = useTheme()
  const { lastMessage, connected } = useWebSocket()
  const flatListRef = useRef<FlatList>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Fetch delivery details
      const deliveryData = await CollaborativeService.getCollaborativeDelivery(deliveryId)
      setDelivery(deliveryData)

      // Fetch chat messages
      const messagesData = await CollaborativeService.getChatMessages(deliveryId)
      
      // Map API response properties to our expected ChatMessage properties
      const enhancedMessages = messagesData.map(msg => ({
        ...msg,
        createdAt: msg.createdAt || msg.timestamp || new Date().toISOString(),
        userId: msg.userId || msg.user_id,
        userName: msg.userName || "Utilisateur",
        userRole: msg.userRole || "courier",
      }));
      
      setMessages(enhancedMessages)
    } catch (err) {
      console.error("Error fetching chat data:", err)
      setError("Impossible de charger les messages. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }, [deliveryId])

  useEffect(() => {
    fetchData()

    // Set up WebSocket listener for new messages
    if (connected && lastMessage && lastMessage.type === 'chat_message' && lastMessage.data) {
      // Check if the message is for our current chat
      if (lastMessage.data.delivery_id === deliveryId) {
        const chatMsg: ChatMessage = {
          id: parseInt(lastMessage.data.id?.toString() || Math.random().toString()) || Math.floor(Math.random() * 1000000),
          delivery_id: parseInt(lastMessage.data.delivery_id) || 0,
          user_id: parseInt(lastMessage.data.user_id?.toString() || '0') || 0,
          userId: parseInt(lastMessage.data.user_id?.toString() || '0') || 0,
          message: typeof lastMessage.data.message === 'string' ? lastMessage.data.message : "",
          timestamp: lastMessage.data.timestamp?.toString() || new Date().toISOString(),
          createdAt: lastMessage.data.createdAt?.toString() || lastMessage.data.timestamp?.toString() || new Date().toISOString(),
          userName: lastMessage.data.userName?.toString() || "Utilisateur",
          userRole: lastMessage.data.userRole?.toString() || "courier",
          userAvatar: typeof lastMessage.data.userAvatar === 'string' ? lastMessage.data.userAvatar : undefined
        };
        setMessages((prevMessages) => [...prevMessages, chatMsg])
      }
    }

    return () => {
      // Clean up WebSocket listener if needed
    }
  }, [deliveryId, connected, lastMessage, fetchData])

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
    const isCurrentUser = (item.userId || item.user_id) === user?.id
    const createdAt = item.createdAt || item.timestamp || new Date().toISOString()
    const prevCreatedAt = index > 0 ? (messages[index - 1].createdAt || messages[index - 1].timestamp || '') : ''
    const showDateHeader =
      index === 0 || new Date(createdAt).toDateString() !== new Date(prevCreatedAt).toDateString()

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: colors.text }]}>
              {isToday(createdAt)
                ? "Aujourd'hui"
                : isYesterday(createdAt)
                  ? "Hier"
                  : formatDate(createdAt)}
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
                  <Text style={[styles.avatarFallbackText, { color: colors.primary }]}>
                    {(item.userName || "U").charAt(0)}
                  </Text>
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
                {item.userName || "Utilisateur"} (
                {(item.userRole === "primary" || item.userRole === "primary_courier") ? "Principal" : 
                 (item.userRole === "secondary" || item.userRole === "secondary_courier") ? "Secondaire" : "Support"})
              </Text>
            )}
            <Text style={[styles.messageText, { color: isCurrentUser ? "white" : colors.text }]}>{item.message}</Text>
            <Text style={[styles.messageTime, { color: isCurrentUser ? "rgba(255, 255, 255, 0.7)" : colors.muted }]}>
              {formatTime(createdAt)}
            </Text>
          </View>
        </View>
      </>
    )
  }

  const updateMessages = (prevMessages: ChatMessage[]): ChatMessage[] => {
    return prevMessages.map((message) => ({
      ...message,
      // Ensure all returned objects conform to ChatMessage type
    }));
  };

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
        keyExtractor={(item) => item.id.toString()}
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
