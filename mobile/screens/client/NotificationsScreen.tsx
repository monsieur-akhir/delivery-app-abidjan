
import React, { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity,
  Animated,
  Alert,
  BackHandler
} from 'react-native'
import { 
  Text, 
  Card, 
  Surface, 
  IconButton, 
  Chip,
  Badge,
  Divider,
  ActivityIndicator,
  Button,
  Menu,
  Searchbar
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useNotification } from '../../contexts/NotificationContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { formatDate } from '../../utils/formatters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'
import type { Notification } from '../../types/models'

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>
}

interface NotificationGroup {
  title: string
  data: Notification[]
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications 
  } = useNotification()
  const { connected, subscribe, unsubscribe } = useWebSocket()

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [menuVisible, setMenuVisible] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])

  const slideAnim = React.useRef(new Animated.Value(0)).current

  const filters = [
    { key: 'all', label: 'Tout', icon: 'list' },
    { key: 'delivery', label: 'Livraisons', icon: 'package' },
    { key: 'payment', label: 'Paiements', icon: 'credit-card' },
    { key: 'system', label: 'Système', icon: 'settings' },
    { key: 'promotion', label: 'Promotions', icon: 'tag' },
  ]

  useEffect(() => {
    // S'abonner aux notifications WebSocket
    const unsubscribeWS = subscribe('notification', handleNewNotification)
    
    // Gérer le bouton retour
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectionMode) {
        exitSelectionMode()
        return true
      }
      return false
    })

    return () => {
      unsubscribeWS()
      backHandler.remove()
    }
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, selectedFilter, searchQuery])

  const handleNewNotification = useCallback((data: any) => {
    // Animation pour nouvelle notification
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start()
  }, [slideAnim])

  const filterNotifications = () => {
    let filtered = notifications

    // Filtrer par type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(notification => {
        switch (selectedFilter) {
          case 'delivery':
            return notification.data?.type === 'delivery' || notification.title.toLowerCase().includes('livraison')
          case 'payment':
            return notification.data?.type === 'payment' || notification.title.toLowerCase().includes('paiement')
          case 'system':
            return notification.data?.type === 'system' || notification.title.toLowerCase().includes('système')
          case 'promotion':
            return notification.data?.type === 'promotion' || notification.title.toLowerCase().includes('promotion')
          default:
            return true
        }
      })
    }

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }

  const groupNotificationsByDate = (notifications: Notification[]): NotificationGroup[] => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const oneWeekAgo = new Date(today)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const groups: NotificationGroup[] = []
    const groupMap = new Map<string, Notification[]>()

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.date)
      let groupKey: string

      if (notificationDate.toDateString() === today.toDateString()) {
        groupKey = "Aujourd'hui"
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Hier'
      } else if (notificationDate >= oneWeekAgo) {
        groupKey = 'Cette semaine'
      } else {
        groupKey = 'Plus ancien'
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, [])
      }
      groupMap.get(groupKey)!.push(notification)
    })

    const orderedKeys = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien']
    orderedKeys.forEach(key => {
      if (groupMap.has(key)) {
        groups.push({
          title: key,
          data: groupMap.get(key)!
        })
      }
    })

    return groups
  }

  const onRefresh = async () => {
    setRefreshing(true)
    // Simuler le rafraîchissement
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const handleNotificationPress = (notification: Notification) => {
    if (selectionMode) {
      toggleNotificationSelection(notification.id.toString())
      return
    }

    if (!notification.read) {
      markNotificationAsRead(notification.id.toString())
    }

    // Navigation basée sur le type de notification
    if (notification.data?.deliveryId) {
      navigation.navigate('TrackDelivery', { 
        deliveryId: notification.data.deliveryId.toString() 
      })
    } else if (notification.data?.type === 'payment') {
      navigation.navigate('Wallet')
    }
  }

  const handleNotificationLongPress = (notification: Notification) => {
    if (!selectionMode) {
      setSelectionMode(true)
    }
    toggleNotificationSelection(notification.id.toString())
  }

  const toggleNotificationSelection = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications)
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId)
    } else {
      newSelection.add(notificationId)
    }
    setSelectedNotifications(newSelection)

    if (newSelection.size === 0) {
      setSelectionMode(false)
    }
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedNotifications(new Set())
  }

  const deleteSelectedNotifications = () => {
    Alert.alert(
      'Supprimer les notifications',
      `Êtes-vous sûr de vouloir supprimer ${selectedNotifications.size} notification(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            selectedNotifications.forEach(id => deleteNotification(id))
            exitSelectionMode()
          }
        }
      ]
    )
  }

  const markSelectedAsRead = () => {
    selectedNotifications.forEach(id => markNotificationAsRead(id))
    exitSelectionMode()
  }

  const getNotificationIcon = (notification: Notification) => {
    if (notification.data?.type === 'delivery') return 'package'
    if (notification.data?.type === 'payment') return 'credit-card'
    if (notification.data?.type === 'system') return 'settings'
    if (notification.data?.type === 'promotion') return 'tag'
    return 'bell'
  }

  const getNotificationColor = (notification: Notification) => {
    if (notification.data?.type === 'delivery') return '#4CAF50'
    if (notification.data?.type === 'payment') return '#2196F3'
    if (notification.data?.type === 'system') return '#FF9800'
    if (notification.data?.type === 'promotion') return '#9C27B0'
    return '#757575'
  }

  const renderNotification = ({ item }: { item: Notification }) => {
    const isSelected = selectedNotifications.has(item.id.toString())
    const iconColor = getNotificationColor(item)

    return (
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleNotificationLongPress(item)}
          activeOpacity={0.7}
        >
          <Card style={[
            styles.notificationCard,
            !item.read && styles.unreadCard,
            isSelected && styles.selectedCard
          ]}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationLeft}>
                <Surface style={[styles.notificationIcon, { backgroundColor: iconColor }]}>
                  <Feather 
                    name={getNotificationIcon(item)} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </Surface>
                
                <View style={styles.notificationText}>
                  <View style={styles.notificationHeader}>
                    <Text style={[
                      styles.notificationTitle,
                      !item.read && styles.unreadTitle
                    ]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {!item.read && <Badge style={styles.unreadBadge} />}
                  </View>
                  
                  <Text style={styles.notificationMessage} numberOfLines={3}>
                    {item.message}
                  </Text>
                  
                  <Text style={styles.notificationTime}>
                    {formatDate(item.date)}
                  </Text>
                </View>
              </View>

              <View style={styles.notificationRight}>
                {selectionMode && (
                  <Surface style={[
                    styles.selectionCircle,
                    isSelected && styles.selectedCircle
                  ]}>
                    {isSelected && (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    )}
                  </Surface>
                )}
                
                {!selectionMode && (
                  <Menu
                    visible={false}
                    onDismiss={() => {}}
                    anchor={
                      <IconButton
                        icon="more-vertical"
                        size={20}
                        onPress={() => {}}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => markNotificationAsRead(item.id.toString())}
                      title={item.read ? "Marquer comme non lu" : "Marquer comme lu"}
                      leadingIcon={item.read ? "eye-off" : "eye"}
                    />
                    <Menu.Item
                      onPress={() => deleteNotification(item.id.toString())}
                      title="Supprimer"
                      leadingIcon="delete"
                    />
                  </Menu>
                )}
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderSectionHeader = ({ section }: { section: NotificationGroup }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  )

  const renderFilterChip = (filter: typeof filters[0]) => (
    <Chip
      key={filter.key}
      selected={selectedFilter === filter.key}
      onPress={() => setSelectedFilter(filter.key)}
      style={[
        styles.filterChip,
        selectedFilter === filter.key && styles.selectedFilterChip
      ]}
      textStyle={
        selectedFilter === filter.key ? styles.selectedFilterText : styles.filterText
      }
      icon={filter.icon}
    >
      {filter.label}
    </Chip>
  )

  const groupedNotifications = groupNotificationsByDate(filteredNotifications)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {selectionMode ? (
            <IconButton
              icon="close"
              size={24}
              onPress={exitSelectionMode}
            />
          ) : (
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
          )}
          <Text style={styles.headerTitle}>
            {selectionMode 
              ? `${selectedNotifications.size} sélectionnée(s)`
              : 'Notifications'
            }
          </Text>
        </View>

        <View style={styles.headerRight}>
          {selectionMode ? (
            <View style={styles.selectionActions}>
              <IconButton
                icon="eye"
                size={20}
                onPress={markSelectedAsRead}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={deleteSelectedNotifications}
              />
            </View>
          ) : (
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <IconButton
                  icon="check-all"
                  size={20}
                  onPress={markAllNotificationsAsRead}
                />
              )}
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="more-vertical"
                    size={20}
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false)
                    markAllNotificationsAsRead()
                  }}
                  title="Tout marquer comme lu"
                  leadingIcon="check-all"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false)
                    Alert.alert(
                      'Effacer toutes les notifications',
                      'Êtes-vous sûr de vouloir supprimer toutes les notifications ?',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { 
                          text: 'Effacer', 
                          style: 'destructive',
                          onPress: clearAllNotifications 
                        }
                      ]
                    )
                  }}
                  title="Effacer tout"
                  leadingIcon="delete-sweep"
                />
              </Menu>
            </View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      {!selectionMode && (
        <Surface style={styles.searchContainer}>
          <Searchbar
            placeholder="Rechercher dans les notifications..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </Surface>
      )}

      {/* Filters */}
      {!selectionMode && (
        <Surface style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filters}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => renderFilterChip(item)}
            contentContainerStyle={styles.filtersContent}
          />
        </Surface>
      )}

      {/* Connection Status */}
      {!connected && (
        <Surface style={styles.connectionStatus}>
          <Feather name="wifi-off" size={16} color="#f44336" />
          <Text style={styles.connectionText}>
            Mode hors ligne - Les notifications peuvent être retardées
          </Text>
        </Surface>
      )}

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="bell-off" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedFilter !== 'all' 
              ? 'Aucune notification correspondant à vos critères'
              : 'Vous n\'avez pas encore de notifications'
            }
          </Text>
          {(searchQuery || selectedFilter !== 'all') && (
            <Button
              mode="outlined"
              onPress={() => {
                setSearchQuery('')
                setSelectedFilter('all')
              }}
              style={styles.clearFiltersButton}
            >
              Effacer les filtres
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#FF6B00']} 
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedFilterChip: {
    backgroundColor: '#FF6B00',
  },
  filterText: {
    fontSize: 12,
    color: '#212121',
  },
  selectedFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffebee',
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#f44336',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
    textTransform: 'uppercase',
  },
  notificationCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#FF6B00',
    borderWidth: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    backgroundColor: '#FF6B00',
    marginLeft: 8,
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  notificationRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedCircle: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
})

export default NotificationsScreen
