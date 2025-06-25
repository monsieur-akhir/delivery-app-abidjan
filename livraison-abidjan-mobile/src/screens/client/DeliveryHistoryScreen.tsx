import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { Card } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { colors } from '../../styles/colors'
import { useAuth } from '../../contexts/AuthContext'
import { useDelivery } from '../../hooks/useDelivery'
import { formatPrice } from '../../utils/formatters'
import { EmptyState } from '../../components/EmptyState'
import DeliveryStatusBadge from '../../components/DeliveryStatusBadge'
import CustomLoaderModal from '../../components/CustomLoaderModal'

const { width, height } = Dimensions.get('window')

interface DeliveryHistory {
  id: string
  title: string
  pickup_address: string
  delivery_address: string
  status: 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled'
  total_cost: number
  created_at: string
  estimated_time?: string
  courier_name?: string
  rating?: number
}

// Composant Loader avec moto animée
const MotorcycleLoader: React.FC = () => {
  const moveAnimation = useRef(new Animated.Value(-100)).current
  const rotateAnimation = useRef(new Animated.Value(0)).current
  const bounceAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const moveMotorcycle = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(moveAnimation, {
            toValue: width + 50,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(moveAnimation, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    const rotateWheels = () => {
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ).start()
    }

    const bounceMotorcycle = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: -5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    moveMotorcycle()
    rotateWheels()
    bounceMotorcycle()
  }, [])

  const wheelRotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.roadContainer}>
        <View style={styles.road}>
          <View style={styles.roadLine} />
        </View>
      </View>

      <Animated.View
        style={[
          styles.motorcycleContainer,
          {
            transform: [
              { translateX: moveAnimation },
              { translateY: bounceAnimation },
            ],
          },
        ]}
      >
        <View style={styles.motorcycle}>
          {/* Corps de la moto */}
          <View style={styles.motorcycleBody}>
            <Text style={styles.motorcycleEmoji}>🏍️</Text>
          </View>

          {/* Roues animées */}
          <Animated.View
            style={[
              styles.wheel,
              styles.frontWheel,
              { transform: [{ rotate: wheelRotation }] },
            ]}
          >
            <View style={styles.wheelInner} />
          </Animated.View>

          <Animated.View
            style={[
              styles.wheel,
              styles.backWheel,
              { transform: [{ rotate: wheelRotation }] },
            ]}
          >
            <View style={styles.wheelInner} />
          </Animated.View>
        </View>
      </Animated.View>

      <Text style={styles.loadingText}>Chargement de votre historique...</Text>
      <View style={styles.loadingDots}>
        <ActivityIndicator size="small" color={colors.orange} />
      </View>
    </View>
  )
}

export const DeliveryHistoryScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { getClientDeliveryHistory, deliveries: globalDeliveries } = useDelivery()

  const [deliveries, setDeliveries] = useState<DeliveryHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all')

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  const loadDeliveries = useCallback(async () => {
    try {
      setLoading(true)
      await getClientDeliveryHistory()
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
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setLoading(false)
    }
  }, [fadeAnim, slideAnim, getClientDeliveryHistory])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadDeliveries()
    setRefreshing(false)
  }, [loadDeliveries])

  useFocusEffect(
    useCallback(() => {
      loadDeliveries()
    }, [loadDeliveries])
  )

  useEffect(() => {
    // Mapping explicite pour correspondre à DeliveryHistory
    setDeliveries(
      (globalDeliveries || []).map((d: any) => ({
        id: d.id,
        title: d.title || d.package_type || 'Livraison',
        pickup_address: d.pickup_address,
        delivery_address: d.delivery_address,
        status: d.status,
        total_cost: d.total_cost || d.price || d.final_price || 0,
        created_at: d.created_at,
        estimated_time: d.estimated_time,
        courier_name: d.courier_name,
        rating: d.rating
      }))
    )
  }, [globalDeliveries])

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter === 'all') return true
    return delivery.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'check-circle'
      case 'cancelled':
        return 'x-circle'
      case 'in_progress':
        return 'truck'
      case 'pending':
        return 'clock'
      default:
        return 'package'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#10B981'
      case 'cancelled':
        return '#EF4444'
      case 'in_progress':
        return '#F59E0B'
      case 'pending':
        return '#6B7280'
      default:
        return colors.orange
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const renderDeliveryItem = ({ item, index }: { item: DeliveryHistory; index: number }) => (
    <Animated.View
      style={[
        styles.deliveryItemContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 + index * 10],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.deliveryItem}
        onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
        activeOpacity={0.7}
      >
        <Card style={styles.deliveryCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.cardGradient}
          >
            {/* En-tête avec statut */}
            <View style={styles.deliveryHeader}>
              <View style={styles.deliveryTitleSection}>
                <Text style={styles.deliveryTitle} numberOfLines={1}>
                  {item.title || 'Livraison'}
                </Text>
                <Text style={styles.deliveryDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>

              <View style={styles.statusSection}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Feather 
                    name={getStatusIcon(item.status)} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.priceText}>
                  {formatPrice(item.total_cost)}
                </Text>
              </View>
            </View>

            {/* Adresses */}
            <View style={styles.addressesSection}>
              <View style={styles.addressRow}>
                <View style={styles.addressIcon}>
                  <Feather name="map-pin" size={14} color="#10B981" />
                </View>
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.pickup_address}
                </Text>
              </View>

              <View style={styles.routeLine} />

              <View style={styles.addressRow}>
                <View style={styles.addressIcon}>
                  <Feather name="navigation" size={14} color="#EF4444" />
                </View>
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.delivery_address}
                </Text>
              </View>
            </View>

            {/* Informations supplémentaires */}
            {(item.courier_name || item.rating || item.estimated_time) && (
              <View style={styles.extraInfo}>
                {item.courier_name && (
                  <View style={styles.courierInfo}>
                    <Feather name="user" size={12} color="#6B7280" />
                    <Text style={styles.courierName}>{item.courier_name}</Text>
                  </View>
                )}

                {item.rating && (
                  <View style={styles.ratingInfo}>
                    <Feather name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                )}

                {item.estimated_time && (
                  <View style={styles.timeInfo}>
                    <Feather name="clock" size={12} color="#6B7280" />
                    <Text style={styles.timeText}>{item.estimated_time}</Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  )

  if (loading) {
    return <MotorcycleLoader />
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Loader personnalisé */}
      <CustomLoaderModal visible={loading} title="Chargement de l'historique..." message="Veuillez patienter pendant le chargement de votre historique de livraisons." type="loading" />

      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerTitleSection}>
          <Text style={styles.headerTitle}>Historique</Text>
          <Text style={styles.headerSubtitle}>
            {filteredDeliveries.length} livraison{filteredDeliveries.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.searchButton}>
          <Feather name="search" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {(['all', 'delivered', 'cancelled'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            onPress={() => setFilter(filterType)}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.filterTextActive
            ]}>
              {filterType === 'all' ? 'Toutes' : 
               filterType === 'delivered' ? 'Livrées' : 'Annulées'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des livraisons */}
      {filteredDeliveries.length === 0 ? (
        <EmptyState
          icon="package"
          title="Aucune livraison"
          subtitle="Vous n'avez pas encore effectué de livraisons"
        />
      ) : (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.orange]}
              tintColor={colors.orange}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Styles du loader
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  roadContainer: {
    position: 'absolute',
    bottom: height * 0.4,
    width: width,
    height: 60,
  },
  road: {
    flex: 1,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadLine: {
    width: '80%',
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  motorcycleContainer: {
    position: 'absolute',
    bottom: height * 0.4 + 10,
  },
  motorcycle: {
    position: 'relative',
    width: 80,
    height: 40,
  },
  motorcycleBody: {
    position: 'absolute',
    top: -10,
    left: 15,
    zIndex: 2,
  },
  motorcycleEmoji: {
    fontSize: 40,
  },
  wheel: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 0,
  },
  frontWheel: {
    right: 5,
  },
  backWheel: {
    left: 5,
  },
  wheelInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 40,
    textAlign: 'center',
  },
  loadingDots: {
    marginTop: 20,
  },

  // Styles de l'écran principal
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
  },

  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: colors.orange,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  deliveryItemContainer: {
    marginBottom: 16,
  },
  deliveryItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  deliveryCard: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderRadius: 16,
  },
  cardGradient: {
    padding: 20,
  },

  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deliveryTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deliveryDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },

  addressesSection: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginLeft: 11,
    marginBottom: 8,
  },

  extraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courierName: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
})

export default DeliveryHistoryScreen