import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native'
import { 
  Text, 
  Card, 
  Surface, 
  Avatar, 
  Chip,
  FAB,
  Searchbar,
  Badge,
  ActivityIndicator,
  IconButton,
  Divider
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useDelivery } from '../../hooks/useDelivery'
import { formatPrice, formatDate } from '../../utils/formatters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'
import type { Delivery, DeliveryStatus } from '../../types/models'

const { width, height } = Dimensions.get('window')

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>
}

interface QuickAction {
  id: string
  title: string
  subtitle: string
  icon: string
  iconFamily: 'Feather' | 'MaterialIcons' | 'Ionicons'
  color: string
  route: string
  params?: any
}

const ClientHomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { unreadCount } = useNotification()
  const { connected } = useWebSocket()
  const { getActiveDeliveries, getClientDeliveryHistory } = useDelivery()

  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [greeting, setGreeting] = useState('')

  const fadeAnim = useRef(new Animated.Value(0)).current

  // Actions rapides avec design épuré
  const quickActions: QuickAction[] = [
    {
      id: 'standard',
      title: 'Livraison',
      subtitle: 'Économique',
      icon: 'package',
      iconFamily: 'Feather',
      color: '#2E7D32',
      route: 'CreateDelivery',
      params: { serviceType: 'standard' }
    },
    {
      id: 'express',
      title: 'Express',
      subtitle: 'Rapide',
      icon: 'zap',
      iconFamily: 'Feather',
      color: '#F57C00',
      route: 'CreateDelivery',
      params: { serviceType: 'express' }
    },
    {
      id: 'scheduled',
      title: 'Planifier',
      subtitle: 'Plus tard',
      icon: 'clock',
      iconFamily: 'Feather',
      color: '#7B1FA2',
      route: 'ScheduledDeliveries'
    },
    {
      id: 'multiple',
      title: 'Multi-stops',
      subtitle: 'Plusieurs',
      icon: 'map-pin',
      iconFamily: 'Feather',
      color: '#1976D2',
      route: 'MultiDestinationDeliveries'
    }
  ]

  useEffect(() => {
    loadData()
    setGreetingMessage()
    startAnimations()
  }, [])

  const setGreetingMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Bonjour')
    else if (hour < 17) setGreeting('Bon après-midi')
    else setGreeting('Bonsoir')
  }

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const deliveries = await getClientDeliveryHistory({})
      const active = (deliveries || []).filter((d: any) => 
        ['pending', 'accepted', 'in_progress', 'picked_up'].includes(d.status)
      )
      const recent = (deliveries || [])
        .filter((d: any) => !['pending', 'accepted', 'in_progress', 'picked_up'].includes(d.status))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)

      setActiveDeliveries(active)
      setRecentDeliveries(recent)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const getStatusInfo = (status: DeliveryStatus) => {
    const statusMap = {
      pending: { color: '#FF9800', text: 'En attente', icon: 'clock' },
      accepted: { color: '#2196F3', text: 'Acceptée', icon: 'check-circle' },
      in_progress: { color: '#4CAF50', text: 'En cours', icon: 'truck' },
      picked_up: { color: '#9C27B0', text: 'Collectée', icon: 'package' },
      delivered: { color: '#4CAF50', text: 'Livrée', icon: 'check' },
      completed: { color: '#4CAF50', text: 'Terminée', icon: 'check-circle' },
      cancelled: { color: '#f44336', text: 'Annulée', icon: 'x-circle' }
    }
    return statusMap[status] || { color: '#757575', text: 'Inconnu', icon: 'help-circle' }
  }

  const renderActiveDelivery = (delivery: Delivery, index: number) => {
    const statusInfo = getStatusInfo(delivery.status)

    return (
      <Animated.View key={delivery.id} style={[styles.activeDeliveryCard, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('TrackDelivery', { deliveryId: Number(delivery.id) })}
          activeOpacity={0.8}
          style={styles.activeDeliveryContent}
        >
          <View style={styles.activeDeliveryHeader}>
            <View style={styles.deliveryInfoContainer}>
              <Text style={styles.deliveryNumber}>#{delivery.id}</Text>
              <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.statusText}>{statusInfo.text}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.trackIconButton}>
              <Feather name="eye" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.routeSection}>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText} numberOfLines={1}>
                {delivery.pickup_address}
              </Text>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {delivery.delivery_address}
              </Text>
            </View>
          </View>

          <View style={styles.deliveryFooter}>
            <Text style={styles.priceText}>
              {formatPrice(delivery.price || delivery.final_price || 0)} F CFA
            </Text>
            <Text style={styles.timeText}>
              {formatDate(delivery.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderQuickAction = (action: QuickAction, index: number) => (
    <Animated.View key={action.id} style={[styles.quickActionContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate(action.route as any, action.params)}
        activeOpacity={0.8}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
          {action.iconFamily === 'Feather' && (
            <Feather name={action.icon as any} size={20} color="#FFFFFF" />
          )}
          {action.iconFamily === 'MaterialIcons' && (
            <MaterialIcons name={action.icon as any} size={20} color="#FFFFFF" />
          )}
          {action.iconFamily === 'Ionicons' && (
            <Ionicons name={action.icon as any} size={20} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
  )

  const renderRecentDelivery = (delivery: Delivery, index: number) => {
    const statusInfo = getStatusInfo(delivery.status)

    return (
      <TouchableOpacity 
        key={delivery.id}
        style={styles.recentDeliveryItem}
        onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: delivery.id.toString() })}
        activeOpacity={0.8}
      >
        <View style={styles.recentDeliveryLeft}>
          <View style={styles.recentDeliveryHeader}>
            <Text style={styles.recentDeliveryId}>#{delivery.id}</Text>
            <View style={[styles.miniStatusBadge, { backgroundColor: statusInfo.color }]} />
          </View>
          <Text style={styles.recentDeliveryRoute} numberOfLines={1}>
            {delivery.pickup_commune} → {delivery.delivery_commune}
          </Text>
          <Text style={styles.recentDeliveryDate}>
            {formatDate(delivery.created_at)}
          </Text>
        </View>
        <View style={styles.recentDeliveryRight}>
          <Text style={styles.recentDeliveryPrice}>
            {formatPrice(delivery.price || delivery.final_price || 0)} F
          </Text>
          <Feather name="chevron-right" size={16} color="#999" />
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header épuré */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar.Text 
                size={42} 
                label={
                  user?.full_name
                    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
                    : user?.first_name
                      ? user.first_name.charAt(0).toUpperCase()
                      : 'U'
                }
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                {greeting}, {user?.first_name || 'Utilisateur'}
              </Text>
              <Text style={styles.locationText}>Abidjan, Côte d'Ivoire</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {!connected && (
              <View style={styles.offlineIndicator}>
                <Feather name="wifi-off" size={16} color="#f44336" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Feather name="bell" size={22} color="#333" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de recherche moderne */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Où livrer ?"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#666"
            placeholderTextColor="#999"
            onSubmitEditing={() => navigation.navigate('CreateDelivery', { searchQuery })}
          />
        </View>

        {/* Livraisons actives */}
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En cours</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContainer}
            >
              {activeDeliveries.map(renderActiveDelivery)}
            </ScrollView>
          </View>
        )}

        {/* Actions rapides avec design épuré */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Livraisons récentes */}
        {recentDeliveries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activité récente</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DeliveryHistory')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <Surface style={styles.recentDeliveriesCard} elevation={1}>
              {recentDeliveries.map((delivery, index) => (
                <View key={delivery.id}>
                  {renderRecentDelivery(delivery, index)}
                  {index < recentDeliveries.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Surface>
          </View>
        )}

        {/* Raccourcis additionnels */}
        <View style={styles.section}>
          <View style={styles.additionalServicesGrid}>
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Wallet')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#E8F5E8' }]}>
                <Feather name="credit-card" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.serviceTitle}>Portefeuille</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Support')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#E3F2FD' }]}>
                <Feather name="help-circle" size={20} color="#1976D2" />
              </View>
              <Text style={styles.serviceTitle}>Aide</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Marketplace')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#FFF3E0' }]}>
                <Feather name="shopping-bag" size={20} color="#F57C00" />
              </View>
              <Text style={styles.serviceTitle}>Boutique</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#F3E5F5' }]}>
                <Feather name="settings" size={20} color="#7B1FA2" />
              </View>
              <Text style={styles.serviceTitle}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB moderne */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => navigation.navigate('CreateDelivery')}
        customSize={56}
      />
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
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#1976D2',
    marginRight: 12,
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIndicator: {
    marginRight: 12,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  horizontalScrollContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  activeDeliveryCard: {
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    width: width * 0.85,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeDeliveryContent: {
    padding: 20,
  },
  activeDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryInfoContainer: {
    flex: 1,
  },
  deliveryNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trackIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  routeSection: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#f44336',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 3,
    marginBottom: 8,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  quickActionContainer: {
    width: (width - 80) / 4,
    alignItems: 'center',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  recentDeliveriesCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  recentDeliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  recentDeliveryLeft: {
    flex: 1,
  },
  recentDeliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentDeliveryId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  miniStatusBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recentDeliveryRoute: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  recentDeliveryDate: {
    fontSize: 12,
    color: '#666',
  },
  recentDeliveryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentDeliveryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginRight: 8,
  },
  divider: {
    marginHorizontal: 16,
    backgroundColor: '#F0F0F0',
  },
  additionalServicesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  serviceCard: {
    alignItems: 'center',
    width: (width - 80) / 4,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#1976D2',
    borderRadius: 28,
  },
})

export default ClientHomeScreen