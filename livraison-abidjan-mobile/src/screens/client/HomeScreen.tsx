
import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ImageBackground,
  Platform
} from 'react-native'
import { 
  Text, 
  Card, 
  Button, 
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
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { CustomMapView } from '../../components'
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
  gradient: string[]
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
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  // Actions rapides pour les clients
  const quickActions: QuickAction[] = [
    {
      id: 'standard',
      title: 'Livraison Standard',
      subtitle: 'Économique et fiable',
      icon: 'package',
      iconFamily: 'Feather',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#66BB6A'],
      route: 'CreateDelivery',
      params: { serviceType: 'standard' }
    },
    {
      id: 'express',
      title: 'Livraison Express',
      subtitle: 'Rapide et prioritaire',
      icon: 'flash',
      iconFamily: 'Ionicons',
      color: '#FF6B00',
      gradient: ['#FF6B00', '#FF8F00'],
      route: 'CreateDelivery',
      params: { serviceType: 'express' }
    },
    {
      id: 'scheduled',
      title: 'Planifier',
      subtitle: 'Programmer une livraison',
      icon: 'schedule',
      iconFamily: 'MaterialIcons',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#BA68C8'],
      route: 'ScheduledDeliveries'
    },
    {
      id: 'multiple',
      title: 'Multi-destinations',
      subtitle: 'Plusieurs arrêts',
      icon: 'map',
      iconFamily: 'Ionicons',
      color: '#2196F3',
      gradient: ['#2196F3', '#42A5F5'],
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const deliveries = await getClientDeliveryHistory({})
      const active = (deliveries || []).filter((d: any) => 
        ['pending', 'accepted', 'in_progress', 'picked_up'].includes(d.status)
      )
      const recent = (deliveries || []).filter((d: any) => 
        ['completed', 'delivered'].includes(d.status)
      ).slice(0, 3)
      
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
      <Animated.View 
        key={delivery.id}
        style={[
          styles.activeDeliveryCard,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('TrackDelivery', { deliveryId: Number(delivery.id) })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF6B00', '#FF8F00']}
            style={styles.activeDeliveryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.activeDeliveryHeader}>
              <View style={styles.activeDeliveryInfo}>
                <Text style={styles.activeDeliveryTitle}>Livraison #{delivery.id}</Text>
                <View style={styles.statusContainer}>
                  <Feather name={statusInfo.icon as any} size={14} color="#FFFFFF" />
                  <Text style={styles.statusText}>{statusInfo.text}</Text>
                </View>
              </View>
              <IconButton
                icon="eye"
                iconColor="#FFFFFF"
                size={20}
                style={styles.trackButton}
                onPress={() => navigation.navigate('TrackDelivery', { deliveryId: Number(delivery.id) })}
              />
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={styles.routeIcon}>
                  <Feather name="map-pin" size={12} color="#FF6B00" />
                </View>
                <Text style={styles.routeText} numberOfLines={1}>
                  {delivery.pickup_address}
                </Text>
              </View>
              
              <View style={styles.routeLine} />
              
              <View style={styles.routePoint}>
                <View style={styles.routeIcon}>
                  <Feather name="target" size={12} color="#FF6B00" />
                </View>
                <Text style={styles.routeText} numberOfLines={1}>
                  {delivery.delivery_address}
                </Text>
              </View>
            </View>

            <View style={styles.deliveryFooter}>
              <Text style={styles.priceText}>
                {formatPrice(delivery.price || delivery.final_price || 0)} F
              </Text>
              <Text style={styles.timeText}>
                {formatDate(delivery.created_at)}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderQuickAction = (action: QuickAction, index: number) => (
    <Animated.View
      key={action.id}
      style={[
        styles.quickActionWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.quickActionCard}
        onPress={() => navigation.navigate(action.route as any, action.params)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={action.gradient}
          style={styles.quickActionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.quickActionIcon}>
            {action.iconFamily === 'Feather' && (
              <Feather name={action.icon as any} size={24} color="#FFFFFF" />
            )}
            {action.iconFamily === 'MaterialIcons' && (
              <MaterialIcons name={action.icon as any} size={24} color="#FFFFFF" />
            )}
            {action.iconFamily === 'Ionicons' && (
              <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.quickActionTitle}>{action.title}</Text>
          <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )

  const renderRecentDelivery = (delivery: Delivery) => {
    const statusInfo = getStatusInfo(delivery.status)
    
    return (
      <TouchableOpacity 
        key={delivery.id}
        style={styles.recentDeliveryItem}
        onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: delivery.id.toString() })}
        activeOpacity={0.8}
      >
        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        <View style={styles.recentDeliveryContent}>
          <Text style={styles.recentDeliveryRoute} numberOfLines={1}>
            {delivery.pickup_commune} → {delivery.delivery_commune}
          </Text>
          <Text style={styles.recentDeliveryDate}>
            {formatDate(delivery.created_at)}
          </Text>
        </View>
        <Text style={styles.recentDeliveryPrice}>
          {formatPrice(delivery.price || delivery.final_price || 0)} F
        </Text>
        <Feather name="chevron-right" size={16} color="#757575" />
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B00" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#FF6B00', '#FF8F00']}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar.Text 
                size={45} 
                label={
                  user?.full_name
                    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
                    : user?.first_name
                      ? user.first_name.charAt(0).toUpperCase()
                      : 'U'
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.userName}>
                {user?.full_name || user?.first_name || 'Utilisateur'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {!connected && (
              <Chip 
                icon="wifi-off" 
                style={styles.offlineChip}
                textStyle={styles.offlineText}
                compact
              >
                Hors ligne
              </Chip>
            )}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Feather name="bell" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <Badge style={styles.notificationBadge} size={18}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de recherche */}
        <Animated.View style={[styles.searchSection, { transform: [{ translateY: slideAnim }] }]}>
          <Searchbar
            placeholder="Où souhaitez-vous envoyer ?"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#FF6B00"
            placeholderTextColor="#9E9E9E"
            onSubmitEditing={() => navigation.navigate('CreateDelivery', { searchQuery })}
          />
        </Animated.View>

        {/* Livraisons actives */}
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚚 Livraisons en cours</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeDeliveriesContainer}
            >
              {activeDeliveries.map(renderActiveDelivery)}
            </ScrollView>
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Livraisons récentes */}
        {recentDeliveries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Historique récent</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DeliveryHistory')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <Surface style={styles.recentDeliveriesCard} elevation={2}>
              {recentDeliveries.map((delivery, index) => (
                <View key={delivery.id}>
                  {renderRecentDelivery(delivery)}
                  {index < recentDeliveries.length - 1 && <Divider />}
                </View>
              ))}
            </Surface>
          </View>
        )}

        {/* Services supplémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#4CAF50' }]} elevation={2}>
                <Feather name="credit-card" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Portefeuille</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Support')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#2196F3' }]} elevation={2}>
                <Feather name="help-circle" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Settings')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#9C27B0' }]} elevation={2}>
                <Feather name="settings" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Paramètres</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Marketplace')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#FF9800' }]} elevation={2}>
                <Feather name="shopping-bag" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Marketplace</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB pour nouvelle livraison */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => navigation.navigate('CreateDelivery')}
        label="Nouvelle livraison"
        variant="extended"
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
    color: '#757575',
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 15,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineChip: {
    marginRight: 10,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    height: 28,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
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
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 5,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
    borderRadius: 25,
    height: 50,
  },
  searchInput: {
    fontSize: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
  },
  activeDeliveriesContainer: {
    paddingLeft: 20,
  },
  activeDeliveryCard: {
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    width: width * 0.8,
  },
  activeDeliveryGradient: {
    padding: 20,
  },
  activeDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  activeDeliveryInfo: {
    flex: 1,
  },
  activeDeliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  trackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: 0,
  },
  routeContainer: {
    marginBottom: 15,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 11,
    marginBottom: 8,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  quickActionIcon: {
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  recentDeliveriesCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  recentDeliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recentDeliveryContent: {
    flex: 1,
  },
  recentDeliveryRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  recentDeliveryDate: {
    fontSize: 12,
    color: '#757575',
  },
  recentDeliveryPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginRight: 10,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#212121',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: '#FF6B00',
    borderRadius: 25,
  },
})

export default ClientHomeScreen
