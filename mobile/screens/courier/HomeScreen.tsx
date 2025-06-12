import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Switch,
  Dimensions,
  FlatList
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { DeliveryService } from '../../services/DeliveryService'
import { Delivery, DeliveryStatus } from '../../types/models'
import DeliveryStatusBadge from '../../components/DeliveryStatusBadge'
import VTCStyleMap from '../../components/VTCStyleMap'

const { width } = Dimensions.get('window')

interface CourierStats {
  todayEarnings: number
  todayDeliveries: number
  weeklyEarnings: number
  currentRating: number
  activeDeliveries: number
}

const CourierHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<CourierStats>({
    todayEarnings: 0,
    todayDeliveries: 0,
    weeklyEarnings: 0,
    currentRating: 5.0,
    activeDeliveries: 0
  })
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 5.3599517,
    longitude: -4.0282563
  })

  const loadData = useCallback(async () => {
    try {
      // Charger les livraisons disponibles
      const available = await DeliveryService.getAvailableDeliveries({
        limit: 10
      })
      setAvailableDeliveries(available)

      // Charger les livraisons actives du coursier
      const active = await DeliveryService.getActiveCourierDeliveries(user?.id || 0)
      setActiveDeliveries(active)

      // Charger les statistiques
      const statsData = await DeliveryService.getDeliveryStats(user?.id || 0)
      setStats({
        todayEarnings: statsData.today_earnings || 0,
        todayDeliveries: statsData.today_deliveries || 0,
        weeklyEarnings: statsData.weekly_earnings || 0,
        currentRating: statsData.average_rating || 5.0,
        activeDeliveries: active.length
      })
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
    // TODO: Envoyer le statut au backend
  }

  const handleAcceptDelivery = async (deliveryId: number) => {
    try {
      Alert.alert(
        'Accepter la livraison',
        'Voulez-vous accepter cette livraison ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Accepter',
            onPress: async () => {
              await DeliveryService.acceptDelivery(deliveryId)
              Alert.alert('Succès', 'Livraison acceptée avec succès!')
              loadData()
              navigation.navigate('CourierTrackDelivery', { deliveryId })
            }
          }
        ]
      )
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter la livraison')
    }
  }

  const handleViewActiveDelivery = (delivery: Delivery) => {
    navigation.navigate('CourierTrackDelivery', { deliveryId: delivery.id })
  }

  const renderAvailableDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryId}>#{item.id}</Text>
        <DeliveryStatusBadge status={item.status} />
      </View>

      <View style={styles.deliveryInfo}>
        <View style={styles.addressInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.address} numberOfLines={1}>
            {item.pickup_address}
          </Text>
        </View>
        <Ionicons name="arrow-down" size={16} color="#666" style={styles.arrowIcon} />
        <View style={styles.addressInfo}>
          <Ionicons name="flag-outline" size={16} color="#666" />
          <Text style={styles.address} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.proposed_price} FCFA</Text>
          <Text style={styles.distance}>~{item.estimated_distance || 0} km</Text>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderActiveDelivery = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={[styles.deliveryCard, styles.activeDeliveryCard]}
      onPress={() => handleViewActiveDelivery(item)}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryId}>#{item.id}</Text>
        <DeliveryStatusBadge status={item.status} />
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={styles.clientName}>Client: {item.client?.full_name || 'N/A'}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {getNextActionText(item.status)}
        </Text>
      </View>

      <View style={styles.deliveryFooter}>
        <Text style={styles.price}>{item.final_price || item.proposed_price} FCFA</Text>
        <Ionicons name="chevron-forward" size={20} color="#007AFF" />
      </View>
    </TouchableOpacity>
  )

  const getNextActionText = (status: DeliveryStatus) => {
    switch (status) {
      case 'accepted':
        return 'Se diriger vers le point de collecte'
      case 'pickup_in_progress':
        return 'Arrivé au point de collecte'
      case 'picked_up':
        return 'Se diriger vers la destination'
      case 'in_transit':
        return 'Livrer le colis'
      default:
        return 'En cours...'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.userName}>{user?.full_name}</Text>
          </View>

          <View style={styles.onlineToggle}>
            <Text style={styles.onlineText}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={isOnline ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>FCFA aujourd'hui</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.todayDeliveries}</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.currentRating.toFixed(1)} ⭐</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Livraisons actives */}
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Livraisons en cours</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CourierDeliveryHistory')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeDeliveries}
              renderItem={renderActiveDelivery}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Carte des livraisons disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraisons à proximité</Text>
          <View style={styles.mapContainer}>
            <VTCStyleMap
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              deliveries={availableDeliveries}
              onDeliveryPress={(delivery) => navigation.navigate('DeliveryDetails', { deliveryId: delivery.id })}
            />
          </View>
        </View>

        {/* Livraisons disponibles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AvailableDeliveries')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {availableDeliveries.length > 0 ? (
            <FlatList
              data={availableDeliveries.slice(0, 3)}
              renderItem={renderAvailableDelivery}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Aucune livraison disponible</Text>
              <Text style={styles.emptySubtext}>Vérifiez plus tard</Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CourierEarnings')}
            >
              <Ionicons name="wallet-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Gains</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CourierStats')}
            >
              <Ionicons name="stats-chart-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Statistiques</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VehicleManagement')}
            >
              <Ionicons name="car-sport-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Véhicules</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineToggle: {
    alignItems: 'center',
  },
  onlineText: {
    color: '#ffffff',
    fontSize: 12,
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginVertical: 8,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#007AFF',
    fontSize: 14,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deliveryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeDeliveryCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deliveryInfo: {
    marginBottom: 16,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  address: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 8,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  distance: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
  },
})

export default CourierHomeScreen