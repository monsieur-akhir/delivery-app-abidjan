"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Text, IconButton, Divider, Menu } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNotification } from "../contexts/NotificationContext"
import { formatRelativeTime } from "../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import type { Notification } from "../types/models"
import FeatherIcon from "../components/FeatherIcon"
import { colors } from '../styles/colors';
import type { FeatherIconName } from '../components/FeatherIcon';

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Notifications">
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const {
    notifications,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotification()

  const [menuVisible, setMenuVisible] = useState<boolean>(false)

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

  const handleNotificationPress = (notification: Notification) => {
    // Mark notification as read functionality would be implemented here

    if (notification.type === 'delivery_assigned' && notification.data?.delivery_id) {
      navigation.navigate("TrackDelivery", { deliveryId: notification.data.delivery_id.toString() })
    } else if (notification.type === 'delivery_status' && notification.data?.delivery_id) {
      navigation.navigate("CourierTrackDelivery", { deliveryId: notification.data.delivery_id.toString() })
    } else if (notification.type === 'payment') {
      navigation.navigate("Wallet")
    } else if (notification.type === 'delivery_completed' && notification.data?.delivery_id) {
      navigation.navigate("RateDelivery", { deliveryId: notification.data.delivery_id.toString() })
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
      case "delivery_assigned":
        return "package"
      case "delivery_status":
        return "package"
      case "bid_accepted":
        return "tag"
      case "payment":
        return "credit-card"
      case "delivery_completed":
        return "star"
      case "promotion":
        return "gift"
      default:
        return "bell"
    }
  }

  const getNotificationColor = (type?: string): string => {
    switch (type) {
      case "delivery_assigned":
        return "#4CAF50"
      case "delivery_status":
        return "#4CAF50"
      case "bid_accepted":
        return "#2196F3"
      case "payment":
        return "#FF9800"
      case "delivery_completed":
        return "#FFC107"
      case "promotion":
        return "#9C27B0"
      default:
        return "#757575"
    }
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { backgroundColor: colors.card }]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) }]}>
          <FeatherIcon name={getNotificationIcon(item.type)} size={20} color="#000000" style={styles.iconStyle} />
        </View>
        <View style={styles.notificationTextContainer}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formatRelativeTime(item.date || new Date().toISOString())}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteNotification(item.id.toString())}>
          <FeatherIcon name="delete" size={20} color="#757575" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyList = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <IconButton icon="bell-off" size={50} iconColor="#CCCCCC" />
      <Text style={styles.emptyText}>{t("notifications.noNotifications")}</Text>
      <Text style={styles.emptySubtext}>{t("notifications.checkLater")}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>

        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={<TouchableOpacity onPress={openMenu} style={styles.menuButton}>
            <FeatherIcon name="more-vertical" size={24} color="#212121" />
          </TouchableOpacity>}
        >
          <Menu.Item onPress={handleMarkAllAsRead} title={t("notifications.markAllAsRead")} leadingIcon="check-all" />
          <Divider />
          <Menu.Item onPress={handleClearAll} title={t("notifications.clearAll")} leadingIcon="delete-sweep" />
        </Menu>
      </View>

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
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationContent: {
    flexDirection: "row",
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  iconStyle: {
    color: "#FFFFFF",
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
  menuButton: {
    padding: 8,
  },
})

export default NotificationsScreen