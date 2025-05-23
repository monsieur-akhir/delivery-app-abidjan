"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Text, Card, IconButton, Divider, Menu, Chip, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNotification } from "../contexts/NotificationContext"
import { formatRelativeTime } from "../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import type { Notification } from "../types/models"

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Notifications">
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotification()

  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const openMenu = (): void => setMenuVisible(true)
  const closeMenu = (): void => setMenuVisible(false)

  const handleMarkAllAsRead = (): void => {
    closeMenu()
    markAllNotificationsAsRead()
  }

  const handleClearAll = (): void => {
    closeMenu()
    Alert.alert(t("notifications.clearAllTitle"), t("notifications.clearAllMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: clearAllNotifications,
      },
    ])
  }

  const handleNotificationPress = (notification: Notification): void => {
    // Marquer comme lu
    if (!notification.read) {
      markNotificationAsRead(notification.id)
    }

    // Naviguer vers l'écran approprié en fonction du type de notification
    if (notification.data && notification.data.type) {
      switch (notification.data.type) {
        case "delivery_status":
          navigation.navigate("DeliveryDetails", { deliveryId: notification.data.deliveryId })
          break
        case "new_bid":
          navigation.navigate("DeliveryDetails", { deliveryId: notification.data.deliveryId })
          break
        case "payment":
          navigation.navigate("Payment", { paymentId: notification.data.paymentId })
          break
        case "rating":
          navigation.navigate("RateDelivery", {
            deliveryId: notification.data.deliveryId,
            courierId: notification.data.courierId,
          })
          break
        case "promotion":
          navigation.navigate("Marketplace")
          break
        default:
          // Aucune action spécifique
          break
      }
    }
  }

  const handleDeleteNotification = (id: string): void => {
    Alert.alert(t("notifications.deleteTitle"), t("notifications.deleteMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: () => deleteNotification(id),
      },
    ])
  }

  const getNotificationIcon = (type?: string): string => {
    switch (type) {
      case "delivery_status":
        return "package"
      case "new_bid":
        return "tag"
      case "payment":
        return "credit-card"
      case "rating":
        return "star"
      case "promotion":
        return "gift"
      default:
        return "bell"
    }
  }

  const getNotificationColor = (type?: string): string => {
    switch (type) {
      case "delivery_status":
        return "#4CAF50"
      case "new_bid":
        return "#2196F3"
      case "payment":
        return "#FF9800"
      case "rating":
        return "#FFC107"
      case "promotion":
        return "#9C27B0"
      default:
        return "#757575"
    }
  }

  const renderNotificationItem = ({ item }: { item: Notification }): React.ReactElement => (
    <Card
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            <IconButton
              icon={getNotificationIcon(item.data?.type)}
              size={24}
              color="#FFFFFF"
              style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.data?.type) }]}
            />
          </View>

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.body}</Text>
            <Text style={styles.notificationTime}>{formatRelativeTime(item.date)}</Text>
          </View>

          <IconButton icon="delete" size={20} color="#757575" onPress={() => handleDeleteNotification(item.id)} />
        </View>

        {!item.read && (
          <Chip style={styles.unreadChip} textStyle={styles.unreadChipText}>
            {t("notifications.new")}
          </Chip>
        )}
      </Card.Content>
    </Card>
  )

  const renderEmptyList = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <IconButton icon="bell-off" size={50} color="#CCCCCC" />
      <Text style={styles.emptyText}>{t("notifications.noNotifications")}</Text>
      <Text style={styles.emptySubtext}>{t("notifications.checkLater")}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>

        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={<IconButton icon="dots-vertical" size={24} color="#212121" onPress={openMenu} />}
        >
          <Menu.Item onPress={handleMarkAllAsRead} title={t("notifications.markAllAsRead")} leadingIcon="check-all" />
          <Divider />
          <Menu.Item onPress={handleClearAll} title={t("notifications.clearAll")} leadingIcon="delete-sweep" />
        </Menu>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <>
          {notifications.length > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>{t("notifications.total", { count: notifications.length })}</Text>
              <Text style={styles.statsText}>
                {t("notifications.unread", {
                  count: notifications.filter((n) => !n.read).length,
                })}
              </Text>
            </View>
          )}

          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  statsText: {
    color: "#757575",
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  notificationCard: {
    marginBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  unreadCard: {
    backgroundColor: "#FFF8E1",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationIcon: {
    margin: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  unreadChip: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF6B00",
    height: 24,
  },
  unreadChipText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
})

export default NotificationsScreen
