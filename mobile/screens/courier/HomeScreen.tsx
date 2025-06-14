import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import DeliveryService from '../../services/DeliveryService'
import { useNavigation } from '../../navigation/CourierNavigator'

interface AvailableDelivery {
  id: number
  pickup_address: string
  delivery_address: string
  estimated_price: number
  package_weight: number
  distance: number
  commune: string
  created_at: string
  bids_count: number
  highest_bid?: number
  lowest_bid?: number
  status: string
  package_type: string
  urgency_level: string
  client_rating?: number
}

// Définir le type ActiveDelivery au début du fichier
interface ActiveDelivery extends Delivery {
  client_name: string
}

interface CourierStats {
  total_deliveries: number
  completed_today: number
  earnings_today: number
  average_rating: number
  current_earnings: number
}

const CourierHomeScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  const [availableDeliveries, setAvailableDeliveries] = useState<AvailableDelivery[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [courierStatus, setCourierStatus] = useState(false)
  const [stats, setStats] = useState<CourierStats>({
    total_deliveries: 0,
    completed_today: 0,
    earnings_today: 0,
    average_rating: 0,
    current_earnings: 0
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadAvailableDeliveries(),
        loadActiveDeliveries(),
        loadCourierStatus(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableDeliveries = async () => {
    try {
      const response = await DeliveryService.getAvailableDeliveries()
      setAvailableDeliveries(response || [])
    } catch (error) {
      console.error('Error loading available deliveries:', error)
    }
  }

  const loadActiveDeliveries = async () => {
    try {
      const response = await DeliveryService.getCourierActiveDeliveries()
      setActiveDeliveries(response || [])
    } catch (error) {
      console.error('Error loading active deliveries:', error)
    }
  }

  const loadCourierStatus = async () => {
    try {
      const response = await DeliveryService.getCourierStatus()
      setCourierStatus(response.data?.is_online || false)
    } catch (error) {
      console.error('Error loading courier status:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await DeliveryService.getCourierStats()
      setStats(response || stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const toggleCourierStatus = async () => {
    try {
      const newStatus = !courierStatus
      await DeliveryService.updateCourierStatus(newStatus ? 'online' : 'offline')
      setCourierStatus(newStatus)

      Alert.alert(
        'Statut mis à jour',
        `Vous êtes maintenant ${newStatus ? 'en ligne' : 'hors ligne'}`
      )
    } catch (error) {
      console.error('Error updating courier status:', error)
      Alert.alert('Erreur', 'Impossible de mettre à jour votre statut')
    }
  }

  const acceptDelivery = async (deliveryId: number) => {
    try {
      await DeliveryService.acceptDelivery(deliveryId)
      Alert.alert('Succès', 'Livraison acceptée!')
      loadData() // Refresh data
    } catch (error) {
      console.error('Error accepting delivery:', error)
      Alert.alert('Erreur', 'Impossible d\'accepter cette livraison')
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF5722'
      case 'medium': return '#FF9800'
      case 'low': return '#4CAF50'
      default: return '#9E9E9E'
    }
  }

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Aujourd'hui</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completed_today}</Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.earnings_today.toFixed(0)} F</Text>
          <Text style={styles.statLabel}>Gains</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.average_rating.toFixed(1)} ⭐</Text>
          <Text style={styles.statLabel}>Note</Text>
        </View>
      </View>
    </View>
  )

  const renderActiveDelivery = ({ item }: { item: ActiveDelivery }) => (
    <TouchableOpacity
      style={styles.activeDeliveryCard}
      onPress={() => navigation.navigate('CourierTrackDelivery', { deliveryId: item.id })}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.activeDeliveryTitle}>Livraison en cours</Text>
        <Text style={styles.activeDeliveryPrice}>{item.final_price.toFixed(0)} FCFA</Text>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color="#FF6B00" />
          <Text style={styles.address} numberOfLines={1}>
            {item.pickup_address}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="flag" size={16} color="#4CAF50" />
          <Text style={styles.address} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.clientPhone}>{item.client_phone}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('CourierTrackDelivery', { deliveryId: item.id })}
        >
          <Text style={styles.trackButtonText}>Suivre</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderAvailableDelivery = ({ item }: { item: AvailableDelivery }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.price}>{item.estimated_price.toFixed(0)} FCFA</Text>
        <View style={styles.deliveryBadges}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency_level) }]}>
            <Text style={styles.urgencyText}>{item.urgency_level}</Text>
          </View>
          <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color="#FF6B00" />
          <Text style={styles.address} numberOfLines={1}>
            {item.pickup_address}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="flag" size={16} color="#4CAF50" />
          <Text style={styles.address} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={styles.commune}>{item.commune}</Text>
        <Text style={styles.weight}>{item.package_weight}kg</Text>
        <Text style={styles.packageType}>{item.package_type}</Text>
        {item.client_rating && (
          <Text style={styles.clientRating}>Client: {item.client_rating.toFixed(1)} ⭐</Text>
        )}
      </View>

      {item.bids_count > 0 && (
        <View style={styles.bidsInfo}>
          <Text style={styles.bidsCount}>{item.bids_count} offres</Text>
          {item.lowest_bid && (
            <Text style={styles.lowestBid}>Meilleure: {item.lowest_bid.toFixed(0)} F</Text>
          )}
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.bidButton}
          onPress={() => navigation.navigate('BidScreen', { deliveryId: item.id.toString() })}
        >
          <Text style={styles.bidButtonText}>Faire une offre</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header avec statut */}
      <View style={styles.header}>
        <Text style={styles.title}>Accueil Coursier</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>
            {courierStatus ? 'En ligne' : 'Hors ligne'}
          </Text>
          <Switch
            value={courierStatus}
            onValueChange={toggleCourierStatus}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={courierStatus ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Statistiques */}
      {renderStatsCard()}

      {/* Livraisons actives */}
      {activeDeliveries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraisons actives</Text>
          <FlatList
            data={activeDeliveries}
            renderItem={renderActiveDelivery}
            keyExtractor={(item) => `active-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Livraisons disponibles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Livraisons disponibles ({availableDeliveries.length})
        </Text>
        {availableDeliveries.length > 0 ? (
          <FlatList
            data={availableDeliveries}
            renderItem={renderAvailableDelivery}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#9E9E9E" />
            <Text style={styles.emptyText}>Aucune livraison disponible</Text>
            <Text style={styles.emptySubtext}>
              {courierStatus ? 'Vérifiez plus tard' : 'Mettez-vous en ligne pour voir les livraisons'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    color: '#333',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  horizontalList: {
    paddingRight: 16,
  },

  // Active Delivery Card
  activeDeliveryCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  activeDeliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  activeDeliveryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  clientInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clientPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Available Delivery Card
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  deliveryBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  distance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  commune: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  weight: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  packageType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  clientRating: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  bidsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  bidsCount: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  lowestBid: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bidButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  bidButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  trackButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  listContainer: {
    paddingBottom: 16,
  },
})

export default CourierHomeScreen