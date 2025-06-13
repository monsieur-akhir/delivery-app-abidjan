"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Text, Card, Button, TextInput, Divider, Chip, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useTranslation } from "react-i18next"
import { useAuth } from "../contexts/AuthContext"
import { useNetwork } from "../contexts/NetworkContext"
import { useNotification } from "../contexts/NotificationContext"
import {
  fetchSupportTickets,
  createSupportTicket,
  addMessageToTicket,
  uploadTicketImage,
  fetchFAQs,
  getChatbotResponse,
} from "../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"

type SupportScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Support">
}

interface SupportTicket {
  id: string
  subject: string
  status: "open" | "in_progress" | "resolved" | "closed"
  created_at: string
  updated_at: string
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  content: string
  sender_type: "user" | "support" | "system"
  sender_name: string
  created_at: string
  attachments: Attachment[]
}

interface Attachment {
  id: string
  url: string
  file_name: string
  file_type: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()
  const { sendLocalNotification } = useNotification()
  const scrollViewRef = useRef<ScrollView>(null)

  const [activeTab, setActiveTab] = useState<"tickets" | "new" | "faq" | "chat">("tickets")
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [ticketSubject, setTicketSubject] = useState<string>("")
  const [ticketMessage, setTicketMessage] = useState<string>("")
  const [replyMessage, setReplyMessage] = useState<string>("")
  const [ticketImages, setTicketImages] = useState<string[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [faqCategory, setFaqCategory] = useState<string | null>(null)
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<{ text: string; sender: "user" | "bot" }[]>([
    { text: t("support.chatbotWelcome"), sender: "bot" },
  ])
  const [chatInput, setChatInput] = useState<string>("")
  const [chatLoading, setChatLoading] = useState<boolean>(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true)
      const ticketsData = await fetchSupportTickets()
      setTickets(ticketsData)

      const faqsData = await fetchFAQs()
      setFaqs(faqsData)
    } catch (error) {
      console.error("Error loading support data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (): Promise<void> => {
    if (!ticketSubject.trim()) {
      Alert.alert(t("support.missingSubjectTitle"), t("support.missingSubjectMessage"))
      return
    }

    if (!ticketMessage.trim()) {
      Alert.alert(t("support.missingMessageTitle"), t("support.missingMessageMessage"))
      return
    }

    try {
      setSubmitting(true)

      if (isConnected) {
        // Create ticket online
        const newTicket = await createSupportTicket(ticketSubject, ticketMessage)

        // Upload images if any
        if (ticketImages.length > 0) {
          for (const imageUri of ticketImages) {
            await uploadTicketImage(newTicket.id, imageUri)
          }
        }

        // Refresh tickets
        await loadData()

        // Reset form
        setTicketSubject("")
        setTicketMessage("")
        setTicketImages([])

        // Switch to tickets tab
        setActiveTab("tickets")

        // Show success notification
        sendLocalNotification(t("support.ticketCreatedTitle"), t("support.ticketCreatedMessage"))
      } else {
        // Store for later sync
        addPendingUpload({
          type: "support_ticket",
          data: {
            subject: ticketSubject,
            message: ticketMessage,
            images: ticketImages,
          },
          retries: 0
        })

        // Reset form
        setTicketSubject("")
        setTicketMessage("")
        setTicketImages([])

        // Switch to tickets tab
        setActiveTab("tickets")

        // Show offline notification
        sendLocalNotification(t("support.offlineTicketTitle"), t("support.offlineTicketMessage"))
      }
    } catch (error) {
      console.error("Error creating support ticket:", error)
      Alert.alert(t("support.errorTitle"), t("support.errorCreatingTicket"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplyToTicket = async (): Promise<void> => {
    if (!selectedTicket) return

    if (!replyMessage.trim()) {
      Alert.alert(t("support.missingReplyTitle"), t("support.missingReplyMessage"))
      return
    }

    try {
      setSubmitting(true)

      if (isConnected) {
        // Send reply online
        await addMessageToTicket(selectedTicket.id, replyMessage)

        // Refresh tickets
        await loadData()

        // Update selected ticket
        const updatedTicket = tickets.find((t) => t.id === selectedTicket.id)
        if (updatedTicket) {
          setSelectedTicket(updatedTicket)
        }

        // Reset reply input
        setReplyMessage("")

        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      } else {
        // Store for later sync
        addPendingUpload({
          type: "ticket_reply",
          data: {
            ticketId: selectedTicket.id,
            message: replyMessage,
          },
          retries: 0
        })

        // Reset reply input
        setReplyMessage("")

        // Show offline notification
        sendLocalNotification(t("support.offlineReplyTitle"), t("support.offlineReplyMessage"))
      }
    } catch (error) {
      console.error("Error replying to ticket:", error)
      Alert.alert(t("support.errorTitle"), t("support.errorReplyingToTicket"))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePickImage = async (): Promise<void> => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t("support.permissionDeniedTitle"), t("support.permissionDeniedMessage"))
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTicketImages([...ticketImages, result.assets[0].uri])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert(t("support.errorTitle"), t("support.errorPickingImage"))
    }
  }

  const handleRemoveImage = (index: number): void => {
    setTicketImages(ticketImages.filter((_, i) => i !== index))
  }

  const handleSelectTicket = (ticket: SupportTicket): void => {
    setSelectedTicket(ticket)
  }

  const handleBackToTickets = (): void => {
    setSelectedTicket(null)
  }

  const handleFilterFaqs = (category: string): void => {
    if (faqCategory === category) {
      setFaqCategory(null)
    } else {
      setFaqCategory(category)
    }
  }

  const handleSendChatMessage = async (): Promise<void> => {
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatInput("")

    // Add user message to chat
    setChatMessages((prev) => [...prev, { text: userMessage, sender: "user" }])

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    if (!isConnected) {
      setChatMessages((prev) => [
        ...prev,
        {
          text: t("support.chatbotOffline"),
          sender: "bot",
        },
      ])
      return
    }

    try {
      setChatLoading(true)

      // Get response from chatbot
      const response = await getChatbotResponse(userMessage)

      // Add bot response to chat
      setChatMessages((prev) => [...prev, { text: response.message, sender: "bot" }])

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error("Error getting chatbot response:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          text: t("support.chatbotError"),
          sender: "bot",
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "open":
        return "#2196F3"
      case "in_progress":
        return "#FF9800"
      case "resolved":
        return "#4CAF50"
      case "closed":
        return "#757575"
      default:
        return "#757575"
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case "open":
        return t("support.statusOpen")
      case "in_progress":
        return t("support.statusInProgress")
      case "resolved":
        return t("support.statusResolved")
      case "closed":
        return t("support.statusClosed")
      default:
        return status
    }
  }

  const renderTicketsList = (): React.ReactNode => {
    if (tickets.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>{t("support.noTickets")}</Text>
          <Button mode="contained" onPress={() => setActiveTab("new")} style={styles.createTicketButton}>
            {t("support.createTicket")}
          </Button>
        </View>
      )
    }

    return (
      <View style={styles.ticketsContainer}>
        <View style={styles.ticketsHeader}>
          <Text style={styles.sectionTitle}>{t("support.yourTickets")}</Text>
          <Button
            mode="contained"
            onPress={() => setActiveTab("new")}
            style={styles.newTicketButton}
            labelStyle={styles.newTicketButtonLabel}
          >
            {t("support.new")}
          </Button>
        </View>

        {tickets.map((ticket) => (
          <Card key={ticket.id} style={styles.ticketCard} onPress={() => handleSelectTicket(ticket)}>
            <Card.Content>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <Text style={styles.ticketDate}>{new Date(ticket.created_at).toLocaleDateString()}</Text>
                </View>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(ticket.status) + "20" }]}
                  textStyle={{ color: getStatusColor(ticket.status) }}
                >
                  {getStatusText(ticket.status)}
                </Chip>
              </View>

              <Text style={styles.ticketPreview} numberOfLines={2}>
                {ticket.messages[0]?.content || ""}
              </Text>

              <View style={styles.ticketFooter}>
                <Text style={styles.messageCount}>
                  {ticket.messages.length} {t("support.messages")}
                </Text>
                <Text style={styles.lastUpdated}>
                  {t("support.lastUpdated")}: {new Date(ticket.updated_at).toLocaleDateString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    )
  }

  const renderTicketDetail = (): React.ReactNode => {
    if (!selectedTicket) return null

    return (
      <View style={styles.ticketDetailContainer}>
        <View style={styles.ticketDetailHeader}>
          <TouchableOpacity onPress={handleBackToTickets} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#212121" />
            <Text style={styles.backButtonText}>{t("support.backToTickets")}</Text>
          </TouchableOpacity>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(selectedTicket.status) + "20" }]}
            textStyle={{ color: getStatusColor(selectedTicket.status) }}
          >
            {getStatusText(selectedTicket.status)}
          </Chip>
        </View>

        <Text style={styles.ticketDetailSubject}>{selectedTicket.subject}</Text>
        <Text style={styles.ticketDetailDate}>
          {t("support.created")}: {new Date(selectedTicket.created_at).toLocaleDateString()}
        </Text>

        <Divider style={styles.divider} />

        <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
          {selectedTicket.messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender_type === "user" ? styles.userMessage : styles.supportMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>{message.sender_name}</Text>
                <Text style={styles.messageDate}>{new Date(message.created_at).toLocaleString()}</Text>
              </View>

              <Text style={styles.messageContent}>{message.content}</Text>

              {message.attachments && message.attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {message.attachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentItem}>
                      <Image source={{ uri: attachment.url }} style={styles.attachmentImage} resizeMode="cover" />
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.file_name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={100}
            style={styles.replyContainer}
          >
            <TextInput
              value={replyMessage}
              onChangeText={setReplyMessage}
              placeholder={t("support.typeReply")}
              multiline
              style={styles.replyInput}
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handleReplyToTicket}
              loading={submitting}
              disabled={submitting || !replyMessage.trim()}
              style={styles.sendButton}
            >
              {t("support.send")}
            </Button>
          </KeyboardAvoidingView>
        )}
      </View>
    )
  }

  const renderNewTicketForm = (): React.ReactNode => {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.newTicketContainer}>
        <Text style={styles.formTitle}>{t("support.createNewTicket")}</Text>

        <TextInput
          label={t("support.subject")}
          value={ticketSubject}
          onChangeText={setTicketSubject}
          style={styles.formInput}
          mode="outlined"
        />

        <TextInput
          label={t("support.message")}
          value={ticketMessage}
          onChangeText={setTicketMessage}
          multiline
          numberOfLines={5}
          style={styles.formInput}
          mode="outlined"
        />

        <View style={styles.imagesContainer}>
          {ticketImages.map((uri, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                <Feather name="x" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
            <Feather name="plus" size={24} color="#757575" />
            <Text style={styles.addImageText}>{t("support.addImage")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formButtons}>
          <Button mode="outlined" onPress={() => setActiveTab("tickets")} style={styles.cancelButton}>
            {t("common.cancel")}
          </Button>

          <Button
            mode="contained"
            onPress={handleCreateTicket}
            loading={submitting}
            disabled={submitting || !ticketSubject.trim() || !ticketMessage.trim()}
            style={styles.submitButton}
          >
            {t("support.submit")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    )
  }

  const renderFAQs = (): React.ReactNode => {
    const categories = [...new Set(faqs.map((faq) => faq.category))]
    const filteredFaqs = faqCategory ? faqs.filter((faq) => faq.category === faqCategory) : faqs

    return (
      <View style={styles.faqContainer}>
        <Text style={styles.sectionTitle}>{t("support.frequentlyAskedQuestions")}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={faqCategory === category}
              onPress={() => handleFilterFaqs(category)}
              style={[styles.categoryChip, faqCategory === category && styles.selectedCategoryChip]}
              textStyle={faqCategory === category ? styles.selectedCategoryChipText : {}}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>

        {filteredFaqs.map((faq) => (
          <Card key={faq.id} style={styles.faqCard}>
            <Card.Content>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Divider style={styles.faqDivider} />
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    )
  }

  const renderChatbot = (): React.ReactNode => {
    return (
      <View style={styles.chatContainer}>
        <Text style={styles.sectionTitle}>{t("support.virtualAssistant")}</Text>

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatMessagesContainer}
          contentContainerStyle={styles.chatMessagesContent}
        >
          {chatMessages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.chatMessageContainer,
                message.sender === "user" ? styles.userChatMessage : styles.botChatMessage,
              ]}
            >
              <Text style={styles.chatMessageText}>{message.text}</Text>
            </View>
          ))}

          {chatLoading && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>{t("support.botIsTyping")}</Text>
              <ActivityIndicator size="small" color="#757575" style={styles.typingLoader} />
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
          style={styles.chatInputContainer}
        >
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder={t("support.typeMessage")}
            style={styles.chatInput}
            mode="outlined"
            right={
              <TextInput.Icon icon="send" onPress={handleSendChatMessage} disabled={!chatInput.trim() || chatLoading} />
            }
            onSubmitEditing={handleSendChatMessage}
          />
        </KeyboardAvoidingView>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("support.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tickets" && styles.activeTab]}
          onPress={() => setActiveTab("tickets")}
        >
          <Text style={[styles.tabText, activeTab === "tickets" && styles.activeTabText]}>{t("support.tickets")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "faq" && styles.activeTab]}
          onPress={() => setActiveTab("faq")}
        >
          <Text style={[styles.tabText, activeTab === "faq" && styles.activeTabText]}>{t("support.faq")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.activeTab]}
          onPress={() => setActiveTab("chat")}
        >
          <Text style={[styles.tabText, activeTab === "chat" && styles.activeTabText]}>{t("support.chat")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("support.loading")}</Text>
        </View>
      ) : (
        <>
          {activeTab === "tickets" && !selectedTicket && renderTicketsList()}
          {activeTab === "tickets" && selectedTicket && renderTicketDetail()}
          {activeTab === "new" && renderNewTicketForm()}
          {activeTab === "faq" && renderFAQs()}
          {activeTab === "chat" && renderChatbot()}
        </>
      )}
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B00",
  },
  tabText: {
    fontSize: 14,
    color: "#757575",
  },
  activeTabText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    color: "#757575",
    textAlign: "center",
  },
  createTicketButton: {
    backgroundColor: "#FF6B00",
  },
  ticketsContainer: {
    flex: 1,
    padding: 16,
  },
  ticketsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  newTicketButton: {
    backgroundColor: "#FF6B00",
    height: 36,
  },
  newTicketButtonLabel: {
    fontSize: 12,
    marginVertical: 0,
  },
  ticketCard: {
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  ticketDate: {
    fontSize: 12,
    color: "#757575",
  },
  statusChip: {
    height: 24,
  },
  ticketPreview: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageCount: {
    fontSize: 12,
    color: "#757575",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#757575",
  },
  ticketDetailContainer: {
    flex: 1,
    padding: 16,
  },
  ticketDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    marginLeft: 4,
    color: "#212121",
  },
  ticketDetailSubject: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  ticketDetailDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userMessage: {
    backgroundColor: "#E8F5E9",
    marginLeft: 24,
  },
  supportMessage: {
    backgroundColor: "#E3F2FD",
    marginRight: 24,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  messageDate: {
    fontSize: 10,
    color: "#757575",
  },
  messageContent: {
    fontSize: 14,
    color: "#212121",
  },
  attachmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  attachmentItem: {
    width: 80,
    marginRight: 8,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  attachmentName: {
    fontSize: 10,
    color: "#757575",
    marginTop: 2,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  replyInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  sendButton: {
    backgroundColor: "#FF6B00",
  },
  newTicketContainer: {
    flex: 1,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  formInput: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  imagePreviewContainer: {
    width: 80,
    height: 80,
    marginRight: 8,
    marginBottom: 8,
    position: "relative",
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F44336",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderStyle: "dashed",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 10,
    color: "#757575",
    marginTop: 4,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#757575",
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
  },
  faqContainer: {
    flex: 1,
    padding: 16,
  },
  categoriesContainer: {
    marginVertical: 16,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedCategoryChip: {
    backgroundColor: "#FF6B00",
  },
  selectedCategoryChipText: {
    color: "#FFFFFF",
  },
  faqCard: {
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  faqDivider: {
    marginBottom: 8,
  },
```text
  faqAnswer: {
    fontSize: 14,
    color: "#212121",
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingBottom: 16,
  },
  chatMessageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userChatMessage: {
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-end",
  },
  botChatMessage: {
    backgroundColor: "#E3F2FD",
    alignSelf: "flex-start",
  },
  chatMessageText: {
    fontSize: 14,
    color: "#212121",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  typingText: {
    fontSize: 12,
    color: "#757575",
    marginRight: 4,
  },
  typingLoader: {
    marginLeft: 4,
  },
  chatInputContainer: {
    marginTop: 8,
  },
  chatInput: {
    backgroundColor: "#FFFFFF",
  },
})

export default SupportScreen