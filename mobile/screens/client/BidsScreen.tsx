import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { DeliveryService } from '../../services/DeliveryService'

interface Bid {
  id: number
  courier: {
    id: number
    full_name: string
    phone: string
    profile_image?: string
    average_rating: number
    total_deliveries: number
  }
  amount: number
  estimated_time: number
  message?: string
  created_at: string
  status: 'pending' | 'accepted' | 'rejected'
}

interface BidsScreenProps {
  route: {
    params: {
      deliveryId: number
    }
  }
  navigation: any
}

const BidsScreen = ({ route, navigation }: BidsScreenProps) => {
  const { deliveryId } = route.params
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingBid, setAcceptingBid] = useState<number | null>(null)

  useEffect(() => {
    loadBids()
  }, [deliveryId])

  const loadBids = async () => {
    try {
      const response = await DeliveryService.getDeliveryBids(deliveryId)
      setBids(response)
    } catch (error) {
      console.error('Erreur lors du chargement des enchères:', error)
      Alert.alert('Erreur', 'Impossible de charger les enchères')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadBids()
  }

  const handleAcceptBid = async (bidId: number) => {
    Alert.alert(
      'Accepter cette enchère',
      'Voulez-vous vraiment accepter cette enchère ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setAcceptingBid(bidId)
            try {
              await DeliveryService.acceptBid(deliveryId, bidId)
              Alert.alert('Succès', 'Enchère acceptée! Le coursier a été assigné.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('ActiveOrderTracking', { deliveryId })
                }
              ])
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'accepter cette enchère')
            } finally {
              setAcceptingBid(null)
            }
          }
        }
      ]
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins} min`
  }

  const renderBidItem = ({ item }: { item: Bid }) => (
    <View style={styles.bidCard}>
      <View style={styles.bidHeader}>
        <View style={styles.courierInfo}>
          <Image
            source={
              item.courier.profile_image
                ? { uri: item.courier.profile_image }
                : require('../../assets/default-avatar.png')
            }
            style={styles.courierAvatar}
          />
          <View style={styles.courierDetails}>
            <Text style={styles.courierName}>{item.courier.full_name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>
                {item.courier.average_rating.toFixed(1)} ({item.courier.total_deliveries} livraisons)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bidAmount}>
          <Text style={styles.amountText}>{formatPrice(item.amount)} FCFA</Text>
          <Text style={styles.timeText}>{formatTime(item.estimated_time)}</Text>
        </View>
      </View>

      {item.message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      )}

      <View style={styles.bidFooter}>
        <Text style={styles.bidTime}>
          Enchère placée {new Date(item.created_at).toLocaleDateString('fr-FR')} à{' '}
          {new Date(item.created_at).toLocaleTimeString('fr-FR')}
        </Text>

        {item.status === 'pending' && (
          <TouchableOpacity
            style={[
              styles.acceptButton,
              acceptingBid === item.id && styles.acceptButtonDisabled
            ]}
            onPress={() => handleAcceptBid(item.id)}
            disabled={acceptingBid === item.id}
          >
            {acceptingBid === item.id ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Accepter</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {item.status === 'accepted' && (
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>Acceptée</Text>
          </View>
        )}

        {item.status === 'rejected' && (
          <View style={[styles.statusBadge, { backgroundColor: '#ffebee' }]}>
            <Ionicons name="close-circle" size={16} color="#f44336" />
            <Text style={[styles.statusText, { color: '#f44336' }]}>Rejetée</Text>
          </View>
        )}
      </View>
    </View>
  )

  const sortedBids = bids.sort((a, b) => {
    // Les enchères acceptées en premier
    if (a.status === 'accepted' && b.status !== 'accepted') return -1
    if (b.status === 'accepted' && a.status !== 'accepted') return 1

    // Puis par prix croissant
    return a.amount - b.amount
  })

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enchères reçues</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des enchères...</Text>
        </View>
      ) : bids.length > 0 ? (
        <FlatList
          data={sortedBids}
          renderItem={renderBidItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="folder-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Aucune enchère reçue</Text>
          <Text style={styles.emptyMessage}>
            Les coursiers n'ont pas encore placé d'enchères pour cette livraison
          </Text>
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
  bidCard: {
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
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courierAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  courierDetails: {
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  bidAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messageContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidTime: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
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
})

export default BidsScreen