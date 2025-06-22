
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
import ScheduledDeliveryService, { ScheduledDelivery } from '../../services/ScheduledDeliveryService'
import { EmptyState, Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'

type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScheduledDeliveries'>

const ScheduledDeliveriesScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>()
  const { colors } = useTheme()
  
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')

  const loadDeliveries = useCallback(async () => {
    try {
      setIsLoading(true)
      const filters = filter !== 'all' ? { status: filter } : {}
      const data = await ScheduledDeliveryService.getScheduledDeliveries(filters)
      setDeliveries(data)
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les livraisons planifiées')
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

  const handlePauseResume = async (delivery: ScheduledDelivery) => {
    try {
      if (delivery.status === 'active') {
        await ScheduledDeliveryService.pauseScheduledDelivery(delivery.id)
        Alert.alert('Succès', 'Livraison planifiée mise en pause')
      } else {
        await ScheduledDeliveryService.resumeScheduledDelivery(delivery.id)
        Alert.alert('Succès', 'Livraison planifiée reprise')
      }
      loadDeliveries()
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut')
    }
  }

  const handleDelete = (delivery: ScheduledDelivery) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${delivery.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ScheduledDeliveryService.deleteScheduledDelivery(delivery.id)
              Alert.alert('Succès', 'Livraison planifiée supprimée')
              loadDeliveries()
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la livraison')
            }
          },
        },
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50'
      case 'paused': return '#FF9800'
      case 'completed': return '#2196F3'
      case 'cancelled': return '#F44336'
      default: return colors.text
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'paused': return 'En pause'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const getRecurrenceText = (type: string) => {
    switch (type) {
      case 'daily': return 'Quotidienne'
      case 'weekly': return 'Hebdomadaire'
      case 'monthly': return 'Mensuelle'
      case 'none': 
      default: return 'Unique'
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
          Livraisons planifiées
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateScheduledDelivery')}
        >
          <Icon name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        {['all', 'active', 'paused'].map(filterType => (
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
              {filterType === 'all' ? 'Toutes' : filterType === 'active' ? 'Actives' : 'En pause'}
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
            title="Aucune livraison planifiée"
            subtitle="Créez votre première livraison récurrente"
            actionText="Créer une livraison"
            onAction={() => navigation.navigate('CreateScheduledDelivery')}
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

              {delivery.description && (
                <Text style={[styles.deliveryDescription, { color: colors.textSecondary }]}>
                  {delivery.description}
                </Text>
              )}

              <View style={styles.deliveryInfo}>
                <View style={styles.infoRow}>
                  <Icon name="place" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {delivery.pickup_commune} → {delivery.delivery_commune}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="schedule" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {getRecurrenceText(delivery.recurrence_type)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon name="attach-money" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {delivery.proposed_price.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>

              <View style={styles.deliveryActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.primary }]}
                  onPress={() => navigation.navigate('EditScheduledDelivery', { deliveryId: delivery.id })}
                >
                  <Icon name="edit" size={20} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: getStatusColor(delivery.status) }]}
                  onPress={() => handlePauseResume(delivery)}
                >
                  <Icon 
                    name={delivery.status === 'active' ? 'pause' : 'play-arrow'} 
                    size={20} 
                    color={getStatusColor(delivery.status)} 
                  />
                  <Text style={[styles.actionText, { color: getStatusColor(delivery.status) }]}>
                    {delivery.status === 'active' ? 'Pause' : 'Reprendre'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: '#F44336' }]}
                  onPress={() => handleDelete(delivery)}
                >
                  <Icon name="delete" size={20} color="#F44336" />
                  <Text style={[styles.actionText, { color: '#F44336' }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 8,
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
  deliveryDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  deliveryInfo: {
    marginBottom: 16,
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
  deliveryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

export default ScheduledDeliveriesScreen
