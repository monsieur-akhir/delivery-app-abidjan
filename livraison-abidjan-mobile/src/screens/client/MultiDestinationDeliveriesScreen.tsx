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
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { RootStackParamList } from '../../types/navigation'
import { EmptyState, Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE_URL } from '../../config'
import { getToken } from '../../utils'
import { fetchMultiDestinationDeliveries } from '../../services/api'
import { useAlert } from '../../hooks/useAlert'
import { useLoader } from '../../contexts/LoaderContext'

type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MultiDestinationDeliveries'>

interface MultiDestinationDelivery {
  id: number
  title?: string
  pickup_address: string
  pickup_commune: string
  destinations: {
    delivery_order: number
    commune: string
    // autres champs si besoin
  }[]
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  created_at: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const MultiDestinationDeliveriesScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>()
  const { colors } = useTheme()
  const { showErrorAlert } = useAlert()
  const { hideLoader } = useLoader()

  const [deliveries, setDeliveries] = useState<MultiDestinationDelivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  const loadDeliveries = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchMultiDestinationDeliveries(filter)
      setDeliveries(
        (data || []).map((item: any) => ({
          id: item.id,
          title: item.title || `Livraison du ${new Date(item.created_at).toLocaleDateString('fr-FR')}`,
          pickup_address: item.pickup_address,
          pickup_commune: item.pickup_commune,
          destinations: (item.destinations || []).map((dest: any) => ({
            delivery_order: dest.original_order,
            commune: dest.delivery_commune,
            // autres champs si besoin
          })),
          status: item.status,
          total_price: item.total_final_price ?? item.total_proposed_price ?? 0,
          created_at: item.created_at,
        }))
      )
    } catch (error) {
      console.log('[DEBUG] Erreur dans loadDeliveries:', error)
      showErrorAlert('Erreur', 'Impossible de charger les livraisons')
    } finally {
      hideLoader()
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

  useFocusEffect(
    useCallback(() => {
      loadDeliveries()
    }, [loadDeliveries])
  )

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
            <TouchableOpacity
              key={delivery.id}
              activeOpacity={0.93}
              style={styles.cardTouchable}
              onPress={() => navigation.navigate('MultiDestinationDeliveryDetails', { deliveryId: delivery.id })}
            >
              <View style={[styles.deliveryCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
                {/* Ligne date + statut */}
                <View style={styles.headerRow}>
                  <View style={styles.dateStatus}>
                    <MaterialCommunityIcons name="calendar" size={18} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.dateText}>{formatDate(delivery.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
                  </View>
                </View>
                {/* Titre */}
                <Text style={styles.title}>Livraison multiple</Text>
                {/* Départ + nb destinations */}
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="flag-checkered" size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>Départ : {delivery.pickup_commune}</Text>
                  <View style={styles.destBadge}>
                    <MaterialCommunityIcons name="map-marker-multiple" size={14} color="#fff" />
                    <Text style={styles.destBadgeText}>{delivery.destinations.length} dest.</Text>
                  </View>
                </View>
                {/* Prix */}
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="cash" size={16} color={colors.textSecondary} />
                  <Text style={styles.priceText}>{delivery.total_price.toLocaleString()} FCFA</Text>
                </View>
                {/* Destinations */}
                <View style={styles.destinationsContainer}>
                  <Text style={styles.destinationsTitle}>Destinations :</Text>
                  {delivery.destinations.slice(0, 2).map((dest, idx) => (
                    <Text key={idx} style={styles.destinationText}>
                      {idx + 1}. {dest.commune}
                    </Text>
                  ))}
                  {delivery.destinations.length > 2 && (
                    <Text style={styles.moreDestinations}>+{delivery.destinations.length - 2} autres...</Text>
                  )}
                </View>
                {/* Bouton voir les détails */}
                <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('MultiDestinationDeliveryDetails', { deliveryId: delivery.id })}>
                  <Text style={styles.detailsButtonText}>Voir les détails</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
  cardTouchable: {
    marginBottom: 20,
    borderRadius: 18,
    // Pour effet d'élévation au toucher
  },
  deliveryCard: {
    borderRadius: 18,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    marginLeft: 6,
    color: '#555',
    fontWeight: '500',
  },
  destBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingHorizontal: 8,
    marginLeft: 10,
    height: 22,
  },
  destBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 6,
  },
  destinationsContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  destinationsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#222',
  },
  destinationText: {
    fontSize: 13,
    marginLeft: 16,
    marginBottom: 2,
    color: '#555',
  },
  moreDestinations: {
    fontSize: 13,
    marginLeft: 16,
    fontStyle: 'italic',
    color: '#FF9800',
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 6,
  },
})

export default MultiDestinationDeliveriesScreen