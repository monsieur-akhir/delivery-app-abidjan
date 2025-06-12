
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Searchbar, FAB, Chip, ActivityIndicator, Badge } from 'react-native-paper'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'

import { DeliveryService } from '../../services/DeliveryService'
import { NotificationService } from '../../services/NotificationService'
import { useAuth } from '../../contexts/AuthContext'
import { Delivery, DeliveryStatus } from '../../types/models'
import { EmptyState } from '../../components/EmptyState'

const { width, height } = Dimensions.get('window')

interface OrdersScreenProps {}

const OrdersScreen: React.FC<OrdersScreenProps> = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { user } = useAuth()

  // États
  const [orders, setOrders] = useState<Delivery[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<DeliveryStatus | 'all'>('all')
  const [scrollY] = useState(new Animated.Value(0))
  const [headerOpacity] = useState(new Animated.Value(1))

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0]
  const slideAnim = useState(new Animated.Value(50))[0]

  // Charger les commandes
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await DeliveryService.getUserDeliveries(user?.id!)
      setOrders(response)
      setFilteredOrders(response)
      
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
      console.error('Erreur lors du chargement des commandes:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, fadeAnim, slideAnim])

  // Rafraîchir
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await loadOrders()
    setRefreshing(false)
  }, [loadOrders])

  // Filtrer les commandes
  const filterOrders = useCallback((status: DeliveryStatus | 'all', query: string = searchQuery) => {
    let filtered = orders

    if (status !== 'all') {
      filtered = filtered.filter(order => order.status === status)
    }

    if (query.trim()) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(query) ||
        order.pickup_address?.toLowerCase().includes(query.toLowerCase()) ||
        order.delivery_address?.toLowerCase().includes(query.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery])

  // Effets
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    filterOrders(activeFilter, searchQuery)
  }, [activeFilter, searchQuery, filterOrders])

  // Configuration de l'animation du header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  })

  const headerScale = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  })

  // Obtenir la couleur du statut
  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '#FF8C00'
      case 'accepted': return '#2196F3'
      case 'picked_up': return '#9C27B0'
      case 'in_transit': return '#FF6B00'
      case 'delivered': return '#4CAF50'
      case 'cancelled': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  // Obtenir l'icône du statut
  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return 'clock-outline'
      case 'accepted': return 'check-circle-outline'
      case 'picked_up': return 'package-variant'
      case 'in_transit': return 'truck-delivery-outline'
      case 'delivered': return 'check-all'
      case 'cancelled': return 'close-circle-outline'
      default: return 'help-circle-outline'
    }
  }

  // Gérer la sélection d'une commande
  const handleOrderPress = useCallback(async (order: Delivery) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    if (order.status === 'in_transit' || order.status === 'picked_up') {
      navigation.navigate('TrackDelivery', { deliveryId: order.id })
    } else {
      navigation.navigate('DeliveryDetails', { deliveryId: order.id })
    }
  }, [navigation])

  // Gérer la création d'une nouvelle commande
  const handleCreateOrder = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    navigation.navigate('CreateDelivery')
  }, [navigation])

  // Rendu d'un élément de commande
  const renderOrderItem = useCallback(({ item, index }: { item: Delivery; index: number }) => {
    const statusColor = getStatusColor(item.status)
    const statusIcon = getStatusIcon(item.status)
    
    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index * 10],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.orderCardContent}
          onPress={() => handleOrderPress(item)}
          activeOpacity={0.7}
        >
          {/* En-tête de la carte */}
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>#{item.id}</Text>
              <Badge size={20} style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Ionicons name={statusIcon} size={12} color="white" />
              </Badge>
            </View>
            <View style={styles.orderTimeContainer}>
              <Text style={styles.orderTime}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* Itinéraire */}
          <View style={styles.routeContainer}>
            <View style={styles.routePointContainer}>
              <View style={[styles.routePoint, styles.pickupPoint]} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.pickup_address}
              </Text>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.routePointContainer}>
              <View style={[styles.routePoint, styles.deliveryPoint]} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.delivery_address}
              </Text>
            </View>
          </View>

          {/* Détails de la commande */}
          <View style={styles.orderDetails}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="weight" size={16} color="#757575" />
              <Text style={styles.detailText}>
                {item.package_weight ? `${item.package_weight} kg` : t('orders.weightNotSpecified')}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="currency-eur" size={16} color="#757575" />
              <Text style={[styles.detailText, styles.priceText]}>
                {item.total_price ? `${item.total_price} FCFA` : t('orders.priceNotCalculated')}
              </Text>
            </View>
          </View>

          {/* Statut */}
          <View style={styles.statusContainer}>
            <LinearGradient
              colors={[statusColor + '20', statusColor + '10']}
              style={styles.statusBackground}
            >
              <Ionicons name={statusIcon} size={18} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {t(`deliveryStatus.${item.status}`)}
              </Text>
            </LinearGradient>
          </View>

          {/* Actions rapides */}
          {(item.status === 'in_transit' || item.status === 'picked_up') && (
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => navigation.navigate('TrackDelivery', { deliveryId: item.id })}
              >
                <MaterialCommunityIcons name="map-marker-path" size={16} color="#FF6B00" />
                <Text style={styles.trackButtonText}>{t('orders.track')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    )
  }, [fadeAnim, slideAnim, handleOrderPress, navigation, t])

  // Rendu des filtres
  const renderFilters = () => {
    const filters: Array<{ key: DeliveryStatus | 'all'; label: string; count: number }> = [
      { key: 'all', label: t('orders.all'), count: orders.length },
      { key: 'pending', label: t('orders.pending'), count: orders.filter(o => o.status === 'pending').length },
      { key: 'in_transit', label: t('orders.inTransit'), count: orders.filter(o => o.status === 'in_transit').length },
      { key: 'delivered', label: t('orders.delivered'), count: orders.filter(o => o.status === 'delivered').length },
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
      
      {/* Header animé */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
            opacity: headerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#FF6B00', '#FF8C00']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('orders.myOrders')}</Text>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              <Badge size={20} style={styles.notificationBadge}>3</Badge>
            </TouchableOpacity>
          </View>
          
          <Searchbar
            placeholder={t('orders.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#FF6B00"
          />
        </LinearGradient>
      </Animated.View>

      {/* Filtres */}
      {renderFilters()}

      {/* Liste des commandes */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          image={require('../../assets/empty-states/no-deliveries.png')}
          title={t('orders.noOrders')}
          subtitle={t('orders.noOrdersSubtitle')}
          actionText={t('orders.createFirst')}
          onAction={handleCreateOrder}
        />
      ) : (
        <Animated.FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
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

      {/* FAB pour créer une nouvelle commande */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateOrder}
        color="white"
        customSize={60}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
  },
  searchBar: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderCardContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginRight: 8,
  },
  statusBadge: {
    alignSelf: 'center',
  },
  orderTimeContainer: {},
  orderTime: {
    fontSize: 14,
    color: '#757575',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  routePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  pickupPoint: {
    backgroundColor: '#4CAF50',
  },
  deliveryPoint: {
    backgroundColor: '#F44336',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  priceText: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF6B0020',
  },
  trackButtonText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B00',
  },
})

export default OrdersScreen
