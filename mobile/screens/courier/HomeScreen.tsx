import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Card, Button, Avatar, Chip, FAB } from 'react-native-paper'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../contexts/AuthContext'
import { useDelivery } from '../../hooks/useDelivery'
import GamificationService from '../../services/GamificationService'
import { formatPrice, formatDistance } from '../../utils/formatters'
import { WeatherInfo } from '../../components/WeatherInfo'
import { Delivery, CourierStats, AvailableDelivery as AvailableDeliveryType } from '../../types/models'
import DeliveryService from '../../services/DeliveryService'

const { width } = Dimensions.get('window')

interface ActiveDelivery extends Delivery {
  client_name: string
}

interface CourierStatsLocal {
  completed_today: number
  earnings_today: number
  total_deliveries: number
  average_rating: number
  total_distance?: number
}

interface AvailableDeliveryLocal extends Omit<AvailableDeliveryType, 'package_weight'> {
  package_weight: number
}

const CourierHomeScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { user } = useAuth()
  const {
    getAvailableDeliveries,
    getCourierActiveDeliveries,
    isLoading,
    error
  } = useDelivery()

  const [stats, setStats] = useState<CourierStatsLocal>({
    completed_today: 0,
    earnings_today: 0,
    total_deliveries: 0,
    average_rating: 0,
    total_distance: 0,
  })
  const [availableDeliveries, setAvailableDeliveries] = useState<AvailableDeliveryLocal[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      // Charger les livraisons disponibles
      await getAvailableDeliveries()
      const response = await DeliveryService.getAvailableDeliveries()
      setAvailableDeliveries((response || []).map((delivery: any) => ({
        ...delivery,
        pickup_address: delivery.pickup_address || 'Adresse non définie',
        delivery_address: delivery.delivery_address || 'Adresse non définie',
        package_type: delivery.package_type || 'standard',
        proposed_price: delivery.proposed_price || 0
      })))

      // Charger les livraisons actives
      await getCourierActiveDeliveries()
      const activeResponse = await DeliveryService.getCourierActiveDeliveries()
      setActiveDeliveries((activeResponse || []).map((delivery: any) => ({
        ...delivery,
        pickup_address: delivery.pickup_address || 'Adresse non définie',
        delivery_address: delivery.delivery_address || 'Adresse non définie',
        package_type: delivery.package_type || 'standard',
        proposed_price: delivery.proposed_price || 0
      })))

      // Charger les statistiques
      if (user?.id) {
        const statsResponse = await GamificationService.getCourierStats()
        setStats({
          completed_today: statsResponse?.total_deliveries || 0,
          earnings_today: statsResponse?.total_earnings || 0,
          total_deliveries: statsResponse?.total_deliveries || 0,
          average_rating: statsResponse?.average_rating || 0,
          total_distance: statsResponse?.total_distance || 0,
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }, [getAvailableDeliveries, getCourierActiveDeliveries, user?.id])

  // Rafraîchir
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Basculer le statut en ligne/hors ligne
  const toggleOnlineStatus = useCallback(async () => {
    try {
      setIsOnline(!isOnline)
      // Ici vous pouvez ajouter l'appel API pour mettre à jour le statut
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
      setIsOnline(isOnline) // Revenir à l'état précédent en cas d'erreur
    }
  }, [isOnline])

  // Accepter une livraison
  const acceptDelivery = useCallback(async (deliveryId: number) => {
    try {
      // Ici vous pouvez ajouter l'appel API pour accepter la livraison
      Alert.alert('Succès', 'Livraison acceptée avec succès')
      loadData()
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error)
      Alert.alert('Erreur', 'Impossible d\'accepter cette livraison')
    }
  }, [loadData])

  // Rendu d'une livraison active
  const renderActiveDelivery = ({ item }: { item: ActiveDelivery }) => (
    <Card style={styles.deliveryCard} key={item.id}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CourierTrackDelivery', { deliveryId: item.id.toString() })}
      >
        <Card.Content>
          <View style={styles.deliveryHeader}>
            <Text style={styles.activeDeliveryPrice}>{formatPrice(item.final_price || item.proposed_price)} FCFA</Text>
            <Chip mode="outlined" style={styles.statusChip}>
              {t(`deliveryStatus.${item.status}`)}
            </Chip>
          </View>

          <View style={styles.addressContainer}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#4CAF50" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>

          <View style={styles.addressContainer}>
            <MaterialCommunityIcons name="map-marker-check" size={16} color="#F44336" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>

          <Text style={styles.clientPhone}>{item.client_phone || 'N/A'}</Text>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('CourierTrackDelivery', { deliveryId: item.id.toString() })}
            style={styles.trackButton}
          >
            Suivre la livraison
          </Button>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  )

  // Rendu d'une livraison disponible
  const renderAvailableDelivery = ({ item }: { item: AvailableDeliveryLocal }) => (
    <Card style={styles.deliveryCard} key={item.id}>
      <Card.Content>
        <View style={styles.deliveryHeader}>
          <Text style={styles.deliveryPrice}>{formatPrice(item.proposed_price)} FCFA</Text>
          <Text style={styles.deliveryDistance}>{formatDistance(item.distance)}</Text>
        </View>

        <View style={styles.addressContainer}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#4CAF50" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.pickup_address}
          </Text>
        </View>

        <View style={styles.addressContainer}>
          <MaterialCommunityIcons name="map-marker-check" size={16} color="#F44336" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={() => acceptDelivery(item.id)}
          style={styles.acceptButton}
        >
          Accepter ({item.bids_count || 0} offres)
        </Button>
      </Card.Content>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec statut */}
      <LinearGradient
        colors={isOnline ? ['#4CAF50', '#45A049'] : ['#9E9E9E', '#757575']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <Avatar.Image 
              size={60} 
              source={{ uri: user?.profile_picture || 'https://via.placeholder.com/60' }} 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.welcomeText}>Bonjour,</Text>
              <Text style={styles.userName}>{user?.full_name || 'Coursier'}</Text>
              <TouchableOpacity onPress={toggleOnlineStatus}>
                <Text style={styles.statusText}>
                  {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Météo */}
      <WeatherInfo />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques du jour */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistiques du jour</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completed_today}</Text>
                <Text style={styles.statLabel}>Livraisons</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatPrice(stats.earnings_today)} FCFA</Text>
                <Text style={styles.statLabel}>Gains</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.average_rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Note</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Livraisons actives */}
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livraisons en cours</Text>
            {activeDeliveries.map((item) => (
              <View key={`active-${item.id}`}>
                {renderActiveDelivery({ item })}
              </View>
            ))}
          </View>
        )}

        {/* Livraisons disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraisons disponibles</Text>
          {availableDeliveries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>Aucune livraison disponible</Text>
              </Card.Content>
            </Card>
          ) : (
            availableDeliveries.map((item) => (
              <View key={`available-${item.id}`}>
                {renderAvailableDelivery({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB pour basculer le statut */}
      <FAB
        icon={isOnline ? "pause" : "play"}
        style={[styles.fab, { backgroundColor: isOnline ? '#F44336' : '#4CAF50' }]}
        onPress={toggleOnlineStatus}
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    marginRight: 8,
    fontSize: 14,
    color: '#757575',
  },
  statusContent: {
    padding: 16,
  },
  statusDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  statsContainer: {
    margin: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    textTransform: 'uppercase',
  },
  quickActions: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  actionArrow: {
    opacity: 0.5,
  },
  recentDeliveries: {
    margin: 16,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryContent: {
    padding: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  deliveryRoute: {
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B00',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 16,
  },
})

export default HomeScreen