
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import DeliveryService from '../../services/DeliveryService'
import { Delivery } from '../../types/models'
import DeliveryStatusBadge from '../../components/DeliveryStatusBadge'

interface AvailableDeliveriesScreenProps {
  navigation: any
}

const AvailableDeliveriesScreen = ({ navigation }: AvailableDeliveriesScreenProps) => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await DeliveryService.getAvailableDeliveries({
        limit: 50
      })
      setDeliveries(data)
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadDeliveries()
    setRefreshing(false)
  }, [loadDeliveries])

  const handleAcceptDelivery = async (deliveryId: number) => {
    Alert.alert(
      'Accepter la livraison',
      'Voulez-vous accepter cette livraison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setAcceptingId(deliveryId)
            try {
              await DeliveryService.acceptDelivery(deliveryId)
              Alert.alert('Succès', 'Livraison acceptée avec succès!')
              loadDeliveries()
              navigation.navigate('CourierTrackDelivery', { deliveryId })
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'accepter la livraison')
            } finally {
              setAcceptingId(null)
            }
          }
        }
      ]
    )
  }

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryIdContainer}>
          <Text style={styles.deliveryId}>#{item.id}</Text>
          <DeliveryStatusBadge status={item.status} />
        </View>
        <Text style={styles.deliveryTime}>
          Il y a {Math.floor(Math.random() * 60)} min
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <Ionicons name="location" size={16} color="#007AFF" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.pickup_address}
          </Text>
        </View>
        
        <View style={styles.routeLine}>
          <View style={styles.dottedLine} />
          <Ionicons name="arrow-down" size={16} color="#666" />
          <View style={styles.dottedLine} />
        </View>
        
        <View style={styles.routePoint}>
          <Ionicons name="flag" size={16} color="#4CAF50" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="map" size={14} color="#666" />
          <Text style={styles.detailText}>~{item.estimated_distance || 0} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.detailText}>~{item.estimated_duration || 30} min</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cube" size={14} color="#666" />
          <Text style={styles.detailText}>{item.package_type || 'Standard'}</Text>
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{item.proposed_price} FCFA</Text>
          <Text style={styles.priceLabel}>Prix proposé</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.acceptButton,
            acceptingId === item.id && styles.acceptButtonDisabled
          ]}
          onPress={() => handleAcceptDelivery(item.id)}
          disabled={acceptingId === item.id}
        >
          {acceptingId === item.id ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.acceptButtonText}>Accepter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Livraisons disponibles</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des livraisons...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livraisons disponibles</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadDeliveries}
        >
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{deliveries.length}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {deliveries.reduce((sum, d) => sum + d.proposed_price, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>FCFA total</Text>
        </View>
      </View>

      {deliveries.length > 0 ? (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Aucune livraison disponible</Text>
          <Text style={styles.emptyMessage}>
            Vérifiez plus tard ou assurez-vous d'être en ligne
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDeliveries}>
            <Text style={styles.retryButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#666',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 8,
  },
  dottedLine: {
    height: 1,
    flex: 1,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  deliveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonDisabled: {
    backgroundColor: '#ccc',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default AvailableDeliveriesScreen
