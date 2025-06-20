import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Card, Chip, Avatar } from 'react-native-paper'
import { Feather } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import DeliveryService from '../../services/DeliveryService'
import { formatPrice, formatDate, formatDistance } from '../../utils/formatters'
import type { RootStackParamList, Delivery, Bid } from '../../types'

interface RouteParams {
  deliveryId: number
}

type DeliveryDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DeliveryDetails'>

const DeliveryDetailsScreen: React.FC = () => {
  const navigation = useNavigation<DeliveryDetailsScreenNavigationProp>()
  const route = useRoute()
  const { deliveryId } = route.params as { deliveryId: string | number }

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [cancelling, setCancelling] = useState<boolean>(false)
  const [acceptingBid, setAcceptingBid] = useState<number | null>(null)

  useEffect(() => {
    loadDeliveryDetails()
  }, [deliveryId])

  const loadDeliveryDetails = async () => {
    console.log('🚀 [DEBUG] Début loadDeliveryDetails')
    console.log('🔍 [DEBUG] deliveryId reçu:', deliveryId)
    console.log('🔍 [DEBUG] Type de deliveryId:', typeof deliveryId)

    try {
      setLoading(true)
      console.log('📡 [DEBUG] Appel de getDeliveryById avec ID:', String(deliveryId))

      const deliveryData = await DeliveryService.getDeliveryById(String(deliveryId))
      console.log('📦 [DEBUG] Données livraison reçues:', deliveryData)
      console.log('📦 [DEBUG] Type de deliveryData:', typeof deliveryData)

      console.log('📡 [DEBUG] Appel de getDeliveryBids avec ID:', String(deliveryId))
      const bidsData = await DeliveryService.getDeliveryBids(String(deliveryId))
      console.log('💰 [DEBUG] Données enchères reçues:', bidsData)
      console.log('💰 [DEBUG] Nombre d\'enchères:', bidsData.length)

      setDelivery(deliveryData)
      setBids(bidsData)

      console.log('✅ [DEBUG] État mis à jour avec succès')
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors du chargement:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      const errorStack = error instanceof Error ? error.stack : 'Pas de stack trace disponible'
      console.error('❌ [DEBUG] Message d\'erreur:', errorMessage)
      console.error('❌ [DEBUG] Stack trace:', errorStack)
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison')
    } finally {
      setLoading(false)
      console.log('🏁 [DEBUG] loadDeliveryDetails terminé')
    }
  }

  const handleCancelDelivery = async () => {
    Alert.alert(
      'Annuler la livraison',
      'Êtes-vous sûr de vouloir annuler cette livraison ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true)
            try {
              await DeliveryService.cancelDelivery(String(deliveryId), "Annulée par le client")
              Alert.alert('Succès', 'Livraison annulée avec succès')
              navigation.goBack()
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Impossible d\'annuler la livraison'
              Alert.alert('Erreur', errorMessage)
            } finally {
              setCancelling(false)
            }
          }
        }
      ]
    )
  }

  const handleAcceptBid = async (bidId: number) => {
    Alert.alert(
      'Accepter cette enchère',
      'Voulez-vous vraiment accepter cette enchère ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setAcceptingBid(bidId)
            try {
              await DeliveryService.acceptBid(String(deliveryId), bidId)
              Alert.alert('Succès', 'Enchère acceptée!')
              loadDeliveryDetails()
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Impossible d\'accepter cette enchère'
              Alert.alert('Erreur', errorMessage)
            } finally {
              setAcceptingBid(null)
            }
          }
        }
      ]
    )
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: '#FFA726',
      bidding: '#42A5F5',
      accepted: '#66BB6A',
      confirmed: '#66BB6A',
      picked_up: '#AB47BC',
      in_progress: '#26C6DA',
      in_transit: '#26C6DA',
      near_destination: '#FF7043',
      delivered: '#4CAF50',
      completed: '#4CAF50',
      cancelled: '#EF5350'
    }
    return colors[status as keyof typeof colors] || '#757575'
  }

  const getStatusText = (status: string): string => {
    const texts = {
      pending: 'En attente',
      bidding: 'Enchères ouvertes',
      accepted: 'Acceptée',
      confirmed: 'Confirmée',
      picked_up: 'Récupérée',
      in_progress: 'En cours',
      in_transit: 'En transit',
      near_destination: 'Proche destination',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée'
    }
    return texts[status as keyof typeof texts] || status
  }

  if (deliveryId === undefined || deliveryId === null || deliveryId === "") {
    console.error("DeliveryDetailsScreen: deliveryId est manquant ou invalide", route.params)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#EF5350" />
          <Text style={styles.errorText}>Aucun identifiant de livraison fourni</Text>
          <Button mode="outlined" onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#EF5350" />
          <Text style={styles.errorText}>Livraison non trouvée</Text>
          <Button mode="outlined" onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la livraison</Text>
        <TouchableOpacity onPress={loadDeliveryDetails}>
          <Feather name="refresh-cw" size={24} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.deliveryId}>Livraison #{delivery.id}</Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: getStatusColor(delivery.status) }]}
                textStyle={styles.statusChipText}
              >
                {getStatusText(delivery.status)}
              </Chip>
            </View>
            <Text style={styles.deliveryDate}>
              {formatDate(delivery.created_at)}
            </Text>
          </View>

          <Text style={styles.description}>
            {delivery.package_description || 'Aucune description fournie'}
          </Text>

          <View style={styles.packageInfo}>
            <View style={styles.packageDetail}>
              <Text style={styles.packageLabel}>Type</Text>
              <Text style={styles.packageValue}>{delivery.package_type}</Text>
            </View>
            <View style={styles.packageDetail}>
              <Text style={styles.packageLabel}>Taille</Text>
              <Text style={styles.packageValue}>Moyen</Text>
            </View>
            <View style={styles.packageDetail}>
              <Text style={styles.packageLabel}>Fragile</Text>
              <Text style={styles.packageValue}>Non</Text>
            </View>
            <View style={styles.packageDetail}>
              <Text style={styles.packageLabel}>Urgent</Text>
              <Text style={styles.packageValue}>Non</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.addressCard}>
          <Text style={styles.cardTitle}>Adresses</Text>

          <View style={styles.addressPoint}>
            <View style={styles.addressIcon}>
              <Feather name="map-pin" size={20} color="#4CAF50" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Retrait</Text>
              <Text style={styles.addressText}>{delivery.pickup_address}</Text>
              <Text style={styles.communeText}>Commune</Text>
            </View>
          </View>

          <View style={styles.addressDivider} />

          <View style={styles.addressPoint}>
            <View style={styles.addressIcon}>
              <Feather name="map-pin" size={20} color="#F44336" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Livraison</Text>
              <Text style={styles.addressText}>{delivery.delivery_address}</Text>
              <Text style={styles.communeText}>Commune</Text>
            </View>
          </View>

          <View style={styles.routeInfo}>
            <View style={styles.routeDetail}>
              <Feather name="navigation" size={16} color="#757575" />
              <Text style={styles.routeText}>~{typeof delivery.distance === 'number' ? delivery.distance.toFixed(1) : 'N/A'} km</Text>
            </View>
            <View style={styles.routeDetail}>
              <Feather name="clock" size={16} color="#757575" />
              <Text style={styles.routeText}>~{delivery.estimated_duration} min</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.priceCard}>
          <Text style={styles.cardTitle}>Prix</Text>
          <View style={styles.priceInfo}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix proposé</Text>
              <Text style={styles.priceValue}>
                {formatPrice(delivery.proposed_price)} FCFA
              </Text>
            </View>
            {delivery.final_price && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix final</Text>
                <Text style={[styles.priceValue, styles.finalPrice]}>
                  {formatPrice(delivery.final_price)} FCFA
                </Text>
              </View>
            )}
          </View>
        </Card>

        {delivery.courier && (
          <Card style={styles.courierCard}>
            <Text style={styles.cardTitle}>Coursier assigné</Text>
            <View style={styles.courierInfo}>
              <Avatar.Image
                size={50}
                source={{
                  uri: delivery.courier.profile_picture || 'https://via.placeholder.com/50'
                }}
              />
              <View style={styles.courierDetails}>
                <Text style={styles.courierName}>
                  {delivery.courier.full_name || delivery.courier.name}
                </Text>
                <Text style={styles.courierPhone}>
                  {delivery.courier.phone || delivery.courier.user?.phone}
                </Text>
                <View style={styles.courierRating}>
                  <Feather name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {typeof delivery.courier.rating === 'number' ? delivery.courier.rating.toFixed(1) : 'N/A'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Feather name="phone" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {bids.length > 0 && delivery.status === 'bidding' && (
          <Card style={styles.bidsCard}>
            <Text style={styles.cardTitle}>Enchères reçues ({bids.length})</Text>
            {bids.slice(0, 3).map((bid) => (
              <View key={bid.id} style={styles.bidItem}>
                <View style={styles.bidInfo}>
                  <Text style={styles.bidCourier}>
                    {bid.courier?.full_name || bid.courier?.name || 'Coursier'}
                  </Text>
                  <Text style={styles.bidPrice}>
                    {formatPrice(bid.proposed_price)} FCFA
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  onPress={() => handleAcceptBid(bid.id)}
                  loading={acceptingBid === bid.id}
                  disabled={acceptingBid !== null}
                  compact
                >
                  Accepter
                </Button>
              </View>
            ))}

            {bids.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllBids}
                onPress={() => navigation.navigate('Settings')} // BidsScreen n'existe pas dans navigation
              >
                <Text style={styles.viewAllBidsText}>
                  Voir toutes les enchères ({bids.length})
                </Text>
                <Feather name="chevron-right" size={20} color="#FF6B00" />
              </TouchableOpacity>
            )}
          </Card>
        )}

        <View style={styles.actionButtons}>
          {delivery.status === 'pending' || delivery.status === 'bidding' ? (
            <Button
              mode="outlined"
              onPress={handleCancelDelivery}
              loading={cancelling}
              disabled={cancelling}
              style={styles.cancelButton}
            >
              Annuler la livraison
            </Button>
          ) : null}

          {delivery.status === 'delivered' && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('RateDelivery', { deliveryId: String(deliveryId) })}
              style={styles.rateButton}
            >
              Noter la livraison
            </Button>
          )}

          {(delivery.status === 'accepted' || 
            delivery.status === 'confirmed' || 
            delivery.status === 'picked_up' || 
            delivery.status === 'in_progress' || 
            delivery.status === 'in_transit') && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('TrackDelivery', { deliveryId })}
              style={styles.trackButton}
            >
              Suivre la livraison
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF5350',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center'
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  statusInfo: {
    flex: 1
  },
  deliveryId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8
  },
  statusChip: {
    alignSelf: 'flex-start'
  },
  statusChipText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  deliveryDate: {
    fontSize: 14,
    color: '#757575'
  },
  description: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 16,
    lineHeight: 22
  },
  packageInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  packageDetail: {
    width: '48%',
    marginBottom: 8
  },
  packageLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2
  },
  packageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  addressCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16
  },
  addressPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  addressInfo: {
    flex: 1
  },
  addressLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4
  },
  communeText: {
    fontSize: 14,
    color: '#666'
  },
  addressDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    marginLeft: 52
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  routeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#757575'
  },
  priceCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  priceInfo: {
    marginTop: 8
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  priceLabel: {
    fontSize: 16,
    color: '#424242'
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  finalPrice: {
    color: '#4CAF50'
  },
  courierCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  courierInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  courierDetails: {
    flex: 1,
    marginLeft: 12
  },
  courierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4
  },
  courierPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  courierRating: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666'
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bidsCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12
  },
  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  bidInfo: {
    flex: 1
  },
  bidCourier: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4
  },
  bidPrice: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: 'bold'
  },
  viewAllBids: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8
  },
  viewAllBidsText: {
    fontSize: 16,
    color: '#FF6B00',
    fontWeight: '600'
  },
  actionButtons: {
    marginBottom: 32
  },
  cancelButton: {
    marginBottom: 12,
    borderColor: '#EF5350'
  },
  rateButton: {
    marginBottom: 12,
    backgroundColor: '#FFD700'
  },
  trackButton: {
    backgroundColor: '#FF6B00'
  }
})

export default DeliveryDetailsScreen