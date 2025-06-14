import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { IconButton, Chip, ActivityIndicator, Badge, Switch } from 'react-native-paper'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { Swipeable } from 'react-native-gesture-handler'

import NotificationService from '../../services/NotificationService'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { Notification, NotificationType } from '../../types/models'
import { EmptyState } from '../../components/EmptyState'

const { width, height } = Dimensions.get('window')

interface NotificationsScreenProps {}

const NotificationsScreen: React.FC<NotificationsScreenProps> = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { user } = useAuth()
  const { notifications, unreadCount } = useNotifications()

  // Fonction locale pour marquer comme lu
  const markAsRead = async (notificationId: number) => {
    try {
      await NotificationService.markAsRead(notificationId.toString())
    } catch (error) {
      console.error('Erreur lors du marquage:', error)
    }
  }

  // Fonction locale pour marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead()
    } catch (error) {
      console.error('Erreur lors du marquage global:', error)
    }
  }

  // États
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [scrollY] = useState(new Animated.Value(0))

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      // Les notifications sont déjà gérées par le contexte
      setFilteredNotifications(notifications)

      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start()
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [notifications, fadeAnim, slideAnim])

  // Rafraîchir
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await loadNotifications()
    setRefreshing(false)
  }, [loadNotifications])

  // Filtrer les notifications
  const filterNotifications = useCallback((type: NotificationType | 'all', unreadOnly: boolean = showUnreadOnly) => {
    let filtered = notifications

    if (type !== 'all') {
      filtered = filtered.filter(notification => notification.type === type)
    }

    if (unreadOnly) {
      filtered = filtered.filter(notification => !notification.is_read)
    }

    setFilteredNotifications(filtered)
  }, [notifications, showUnreadOnly])

  // Effets
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    filterNotifications(activeFilter, showUnreadOnly)
  }, [activeFilter, showUnreadOnly, filterNotifications])

  // Obtenir la couleur du type de notification
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'delivery_update': return '#2196F3'
      case 'payment': return '#4CAF50'
      case 'promotion': return '#FF9800'
      case 'system': return '#9C27B0'
      case 'message': return '#00BCD4'
      case 'warning': return '#FF9800'
      case 'info': return '#2196F3'
      case 'success': return '#4CAF50'
      case 'error': return '#F44336'
      default: return '#757575'
    }
  }

  // Obtenir l'icône du type de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery_update': return 'truck-delivery'
      case 'payment': return 'credit-card'
      case 'promotion': return 'tag'
      case 'system': return 'cog'
      case 'message': return 'message-text'
      case 'warning': return 'alert-triangle'
      case 'info': return 'info'
      case 'success': return 'check-circle'
      case 'error': return 'x-circle'
      default: return 'bell'
    }
  }

  // Gérer la sélection d'une notification
  const handleNotificationPress = useCallback(async (notification: Notification) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (!notification.is_read) {
      await markAsRead(typeof notification.id === 'string' ? parseInt(notification.id) : notification.id)
    }

    // Navigation basée sur le type de notification
    switch (notification.type) {
      case 'delivery_update':
        if (notification.data?.delivery_id) {
          navigation.navigate('TrackDelivery', { deliveryId: notification.data.delivery_id })
        }
        break
      case 'payment':
        if (notification.data?.transaction_id) {
          navigation.navigate('TransactionHistory')
        }
        break
      case 'message':
        // Naviguer vers les messages
        break
      default:
        // Afficher les détails de la notification
        break
    }
  }, [navigation, markAsRead])

  // Marquer toutes comme lues
  const handleMarkAllAsRead = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await markAllAsRead()
  }, [markAllAsRead])

  // Supprimer une notification
  const handleDeleteNotification = useCallback(async (notificationId: number) => {
    try {
      await NotificationService.deleteNotification(notificationId.toString())
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [])

  // Confirmer la suppression
  const confirmDelete = useCallback((notificationId: number) => {
    Alert.alert(
      t('notifications.deleteTitle'),
      t('notifications.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress={() => handleDeleteNotification(notificationId)
        },
      ]
    )
  }, [t, handleDeleteNotification])

  // Rendu des actions de swipe
  const renderRightActions = useCallback((notificationId: number) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => confirmDelete(notificationId)}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </View>
    )
  }, [confirmDelete])

  // Rendu d'une notification
  const renderNotificationItem = useCallback(({ item, index }: { item: Notification; index: number }) => {
    const notificationColor = getNotificationColor(item.type)
    const notificationIcon = getNotificationIcon(item.type)

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(typeof item.id === 'number' ? item.id : parseInt(item.id))}
        rightThreshold={40}
      >
        <Animated.View
          style={[
            styles.notificationCard,
            !item.is_read && styles.unreadCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, index * 5],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
          >
            {/* Indicateur de notification non lue */}
            {!item.is_read && <View style={styles.unreadIndicator} />}

            {/* Icône */}
            <View style={[styles.iconContainer, { backgroundColor: notificationColor + '20' }]}>
              <MaterialCommunityIcons 
                name={notificationIcon} 
                size={24} 
                color={notificationColor} 
              />
            </View>

            {/* Contenu */}
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>
                  {item.title}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>

              {/* Badge du type */}
              <View style={styles.badgeContainer}>
                <View style={[styles.typeBadge, { backgroundColor: notificationColor + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: notificationColor }]}>
                    {t(`notificationTypes.${item.type}`)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    )
  }, [fadeAnim, slideAnim, handleNotificationPress, renderRightActions, t])

  // Rendu des filtres
  const renderFilters = () => {
    const filters: Array<{ key: NotificationType | 'all'; label: string; count: number }> = [
      { key: 'all', label: t('notifications.all'), count: notifications.length },
      { key: 'delivery_update', label: t('notifications.deliveries'), count: notifications.filter(n => n.type === 'delivery_update').length },
      { key: 'payment', label: t('notifications.payments'), count: notifications.filter(n => n.type === 'payment').length },
      { key: 'promotion', label: t('notifications.promotions'), count: notifications.filter(n => n.type === 'promotion').length },
    ]

    return (
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setActiveFilter(item.key)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }}
            >
              <Chip
                selected={activeFilter === item.key}
                style={[
                  styles.filterChip,
                  activeFilter === item.key && styles.activeFilterChip,
                ]}
                textStyle={[
                  styles.filterChipText,
                  activeFilter === item.key && styles.activeFilterChipText,
                ]}
              >
                {item.label} ({item.count})
              </Chip>
            </TouchableOpacity>
          )}
        />

        {/* Toggle pour les non lues */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{t('notifications.unreadOnly')}</Text>
          <Switch
            value={showUnreadOnly}
            onValueChange={setShowUnreadOnly}
            color="#FF6B00"
          />
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#FF6B00', '#FF8C00']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconButton 
                icon="arrow-left" 
                size={24} 
                iconColor="white"
                onPress={() => navigation.goBack()} 
              />
              <View>
                <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
                {unreadCount > 0 && (
                  <Text style={styles.headerSubtitle}>
                    {unreadCount} {t('notifications.unread')}
                  </Text>
                )}
              </View>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Filtres */}
      {renderFilters()}

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          image={require('../../assets/empty-states/no-notifications.png')}
          title={t('notifications.noNotifications')}
          subtitle={t('notifications.noNotificationsSubtitle')}
        />
      ) : (
        <Animated.FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B00']}
              tintColor="#FF6B00"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  activeFilterChip: {
    backgroundColor: '#FF6B00',
  },
  filterChipText: {
    fontSize: 14,
    color: '#757575',
  },
  activeFilterChipText: {
    color: 'white',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#424242',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  message: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  swipeAction: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: '#F44336',
  },
})

export default NotificationsScreen