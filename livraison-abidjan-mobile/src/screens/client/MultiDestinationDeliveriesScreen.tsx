
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { RootStackParamList } from '../../types/navigation'
import { EmptyState, Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE_URL } from '../../config'
import { getToken } from '../../utils/storage'

type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MultiDestinationDeliveries'>

interface MultiDestinationDelivery {
  id: number
  title: string
  pickup_address: string
  pickup_commune: string
  destinations: {
    address: string
    commune: string
    contact_name?: string
    delivery_order: number
  }[]
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  created_at: string
}

const MultiDestinationDeliveriesScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>()
  const { colors } = useTheme()
  
  const [deliveries, setDeliveries] = useState<MultiDestinationDelivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  const loadDeliveries = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const queryParams = filter !== 'all' ? `?status=${filter}` : ''
      
      const response = await fetch(`${API_BASE_URL}/multi-destination-deliveries${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      setDeliveries(data)
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les livraisons')
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadDeliveries()
    setRefreshing(false)
  }, [loadDeliveries])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'in_progress': return '#2196F3'
      case 'completed': return '#4CAF50'
      case 'cancelled': return '#F44336'
      default: return colors.text
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter === 'all') return true
    return delivery.status === filter
  })

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Destinations multiples
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateMultiDestinationDelivery')}
        >
          <Icon name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        {['all', 'pending', 'in_progress', 'completed'].map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === filterType ? colors.primary : 'transparent',
                borderColor: colors.primary,
              }
            ]}
            onPress={() => setFilter(filterType as any)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === filterType ? colors.surface : colors.primary }
              ]}
            >
              {filterType === 'all' ? 'Toutes' : 
               filterType === 'pending' ? 'En attente' :
               filterType === 'in_progress' ? 'En cours' : 'Terminées'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDeliveries.length === 0 ? (
          <EmptyState
            title="Aucune livraison multiple"
            subtitle="Créez votre première livraison à destinations multiples"
            actionText="Créer une livraison"
            onAction={() => navigation.navigate('CreateMultiDestinationDelivery')}
          />
        ) : (
          filteredDeliveries.map(delivery => (
            <Card key={delivery.id} style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <Text style={[styles.deliveryTitle, { color: colors.text }]}>
                  {delivery.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(delivery.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryInfo}>
                <View style={styles.infoRow}>
                  <Icon name="place" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Départ: {delivery.pickup_commune}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="my-location" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {delivery.destinations.length} destination{delivery.destinations.length > 1 ? 's' : ''}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="attach-money" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {delivery.total_price.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>

              {/* Destinations */}
              <View style={styles.destinationsContainer}>
                <Text style={[styles.destinationsTitle, { color: colors.text }]}>
                  Destinations:
                </Text>
                {delivery.destinations.slice(0, 3).map((dest, index) => (
                  <Text key={index} style={[styles.destinationText, { color: colors.textSecondary }]}>
                    {dest.delivery_order}. {dest.commune}
                  </Text>
                ))}
                {delivery.destinations.length > 3 && (
                  <Text style={[styles.moreDestinations, { color: colors.primary }]}>
                    +{delivery.destinations.length - 3} autres...
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.viewButton, { borderColor: colors.primary }]}
                onPress={() => navigation.navigate('MultiDestinationDeliveryDetails', { deliveryId: delivery.id })}
              >
                <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                  Voir les détails
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
    padding: 16,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  deliveryInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  destinationsContainer: {
    marginBottom: 16,
  },
  destinationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 2,
  },
  moreDestinations: {
    fontSize: 12,
    marginLeft: 16,
    fontStyle: 'italic',
  },
  viewButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})

export default MultiDestinationDeliveriesScreen
