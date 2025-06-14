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
  StatusBar
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
  SegmentedButtons,
  ActivityIndicator
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
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

interface QuickService {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  estimatedTime: string
  basePrice: number
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { unreadCount } = useNotification()
  const { connected } = useWebSocket()
  const { getActiveDeliveries, getClientDeliveryHistory } = useDelivery()

  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedService, setSelectedService] = useState('standard')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapRegion, setMapRegion] = useState({
    latitude: 5.3599517,
    longitude: -4.0082563,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  const quickServices: QuickService[] = [
    {
      id: 'standard',
      title: 'Livraison Standard',
      subtitle: 'Économique et fiable',
      icon: 'package',
      color: '#4CAF50',
      estimatedTime: '30-45 min',
      basePrice: 1500
    },
    {
      id: 'express',
      title: 'Livraison Express',
      subtitle: 'Rapide et prioritaire',
      icon: 'zap',
      color: '#FF6B00',
      estimatedTime: '15-20 min',
      basePrice: 3000
    },
    {
      id: 'collaborative',
      title: 'Livraison Groupée',
      subtitle: 'Partagée et économique',
      icon: 'users',
      color: '#9C27B0',
      estimatedTime: '45-60 min',
      basePrice: 1000
    },
    {
      id: 'fragile',
      title: 'Colis Fragile',
      subtitle: 'Manipulation délicate',
      icon: 'shield',
      color: '#2196F3',
      estimatedTime: '25-35 min',
      basePrice: 2500
    }
  ]

  useEffect(() => {
    loadData()
    startAnimations()
  }, [])

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
      })
    ]).start()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const deliveries = await getClientDeliveryHistory({})
      if (deliveries && Array.isArray(deliveries)) {
        const active = deliveries.filter(d => d.status === 'in_progress' || d.status === 'picked_up')
        const recent = deliveries.filter(d => d.status === 'completed' || d.status === 'cancelled')
        setActiveDeliveries(active)
        setRecentDeliveries(recent)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      Alert.alert('Erreur', 'Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleCreateDelivery = (serviceType: string) => {
    navigation.navigate('CreateDelivery', { serviceType })
  }

  const handleServiceSelect = (service: QuickService) => {
    setSelectedService(service.id)
    handleCreateDelivery(service.id)
  }

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'accepted': return '#2196F3'
      case 'in_progress': return '#4CAF50'
      case 'delivered': return '#9C27B0'
      case 'completed': return '#4CAF50'
      case 'cancelled': return '#f44336'
      default: return '#757575'
    }
  }

  const getStatusText = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'accepted': return 'Acceptée'
      case 'in_progress': return 'En cours'
      case 'delivered': return 'Livrée'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return 'Inconnu'
    }
  }

  const renderActiveDelivery = (delivery: Delivery) => (
    <Card key={delivery.id} style={styles.activeDeliveryCard}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('TrackDelivery', { deliveryId: Number(delivery.id) })}
      >
        <LinearGradient
          colors={['#FF6B00', '#FF8F00']}
          style={styles.activeDeliveryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.activeDeliveryHeader}>
            <View>
              <Text style={styles.activeDeliveryTitle}>Livraison en cours</Text>
              <Text style={styles.activeDeliveryId}>#{delivery.id}</Text>
            </View>
            <Chip 
              mode="flat" 
              style={styles.statusChip}
              textStyle={styles.statusChipText}
            >
              {getStatusText(delivery.status)}
            </Chip>
          </View>

          <View style={styles.activeDeliveryRoute}>
            <View style={styles.routePoint}>
              <Feather name="map-pin" size={16} color="#FFFFFF" />
              <Text style={styles.routeText} numberOfLines={1}>
                {delivery.pickup_address}
              </Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routePoint}>
              <Feather name="target" size={16} color="#FFFFFF" />
              <Text style={styles.routeText} numberOfLines={1}>
                {delivery.delivery_address}
              </Text>
            </View>
          </View>

          <View style={styles.activeDeliveryFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPrice(delivery.price || delivery.final_price || 0)} F</Text>
            </View>
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => navigation.navigate('TrackDelivery', { deliveryId: Number(delivery.id) })}
            >
              <Feather name="eye" size={20} color="#FF6B00" />
              <Text style={styles.trackButtonText}>Suivre</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Card>
  )

  const renderQuickService = (service: QuickService) => (
    <TouchableOpacity 
      key={service.id}
      style={styles.serviceCard}
      onPress={() => handleServiceSelect(service)}
      activeOpacity={0.8}
    >
      <Surface style={[styles.serviceIcon, { backgroundColor: service.color }]}>
        <Feather name={service.icon as any} size={24} color="#FFFFFF" />
      </Surface>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
        <View style={styles.serviceMetrics}>
          <Text style={styles.serviceTime}>{service.estimatedTime}</Text>
          <Text style={styles.servicePrice}>À partir de {formatPrice(service.basePrice)} F</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#757575" />
    </TouchableOpacity>
  )

  const renderRecentDelivery = (delivery: Delivery) => (
    <TouchableOpacity 
      key={delivery.id}
      style={styles.recentDeliveryItem}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: delivery.id.toString() })}
    >
      <View style={[styles.recentStatusDot, { backgroundColor: getStatusColor(delivery.status) }]} />
      <View style={styles.recentDeliveryContent}>
        <Text style={styles.recentDeliveryTitle} numberOfLines={1}>
          {delivery.pickup_commune} → {delivery.delivery_commune}
        </Text>
        <Text style={styles.recentDeliveryDate}>
          {formatDate(delivery.created_at)}
        </Text>
      </View>
      <Text style={styles.recentDeliveryPrice}>
        {formatPrice(delivery.price || delivery.final_price || 0)} F
      </Text>
    </TouchableOpacity>
  )

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
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar.Text 
              size={40} 
              label={user?.first_name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Bonjour</Text>
            <Text style={styles.userName}>{user?.first_name || 'Utilisateur'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {!connected && (
            <Chip 
              icon="wifi-off" 
              style={styles.offlineChip}
              textStyle={styles.offlineText}
            >
              Hors ligne
            </Chip>
          )}
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Feather name="bell" size={24} color="#212121" />
            {unreadCount > 0 && (
              <Badge style={styles.notificationBadge}>{unreadCount}</Badge>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, { transform: [{ translateY: slideAnim }] }]}>
          <Searchbar
            placeholder="Où souhaitez-vous envoyer ?"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#FF6B00"
            onSubmitEditing={() => navigation.navigate('CreateDelivery', { searchQuery })}
          />
        </Animated.View>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Livraisons actives</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeDeliveries.map(renderActiveDelivery)}
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Services */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Services de livraison</Text>
          <View style={styles.servicesGrid}>
            {quickServices.map(renderQuickService)}
          </View>
        </Animated.View>

        {/* Map Preview */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.mapContainer}>
            <CustomMapView
              initialRegion={mapRegion}
              style={styles.mapPreview}
            />
            <TouchableOpacity 
              style={styles.mapOverlay}
              onPress={() => navigation.navigate('CreateDelivery')}
            >
              <Text style={styles.mapOverlayText}>Planifier une livraison</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Recent Deliveries */}
        {recentDeliveries.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Livraisons récentes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DeliveryHistory')}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <Surface style={styles.recentDeliveriesContainer}>
              {recentDeliveries.map(renderRecentDelivery)}
            </Surface>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Surface style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' }]}>
                <Feather name="credit-card" size={24} color="#FFFFFF" />
              </Surface>
              <Text style={styles.quickActionText}>Portefeuille</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('DeliveryHistory')}
            >
              <Surface style={[styles.quickActionIcon, { backgroundColor: '#2196F3' }]}>
                <Feather name="clock" size={24} color="#FFFFFF" />
              </Surface>
              <Text style={styles.quickActionText}>Historique</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Support')}
            >
              <Surface style={[styles.quickActionIcon, { backgroundColor: '#9C27B0' }]}>
                <Feather name="help-circle" size={24} color="#FFFFFF" />
              </Surface>
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Surface style={[styles.quickActionIcon, { backgroundColor: '#FF9800' }]}>
                <Feather name="settings" size={24} color="#FFFFFF" />
              </Surface>
              <Text style={styles.quickActionText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => navigation.navigate('CreateDelivery')}
        label="Nouvelle livraison"
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#FF6B00',
  },
  greeting: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 14,
    color: '#757575',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineChip: {
    marginRight: 8,
    backgroundColor: '#f44336',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
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
    color: '#FF6B00',
    fontWeight: '600',
  },
  activeDeliveryCard: {
    marginLeft: 20,
    marginRight: 10,
    borderRadius: 16,
    overflow: 'hidden',
    width: width * 0.85,
  },
  activeDeliveryGradient: {
    padding: 20,
  },
  activeDeliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeDeliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeDeliveryId: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statusChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  activeDeliveryRoute: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 8,
    marginBottom: 8,
  },
  activeDeliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B00',
  },
  servicesGrid: {
    paddingHorizontal: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  serviceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceTime: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreview: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 107, 0, 0.9)',
    padding: 16,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentDeliveriesContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  recentDeliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  recentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recentDeliveryContent: {
    flex: 1,
  },
  recentDeliveryTitle: {
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
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#212121',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B00',
  },
})

export default HomeScreen