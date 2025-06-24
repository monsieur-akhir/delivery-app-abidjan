import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Ionicons'
import { useTheme } from '../../contexts/ThemeContext'
import { colors } from '../../styles/colors'
import { CustomLoaderModal, MultiDestinationActions } from '../../components'
import MultiDestinationService, { MultiDestinationDelivery, MultiDestinationBid } from '../../services/MultiDestinationService'

const MultiDestinationDeliveryDetailsScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { theme } = useTheme()
  const { deliveryId } = route.params as { deliveryId: number }

  const [delivery, setDelivery] = useState<MultiDestinationDelivery | null>(null)
  const [bids, setBids] = useState<MultiDestinationBid[]>([])
  const [loading, setLoading] = useState(true)
  const [bidsLoading, setBidsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState('')

  useEffect(() => {
    loadDeliveryDetails()
    if (delivery?.status === 'pending') {
      loadBids()
    }
  }, [deliveryId])

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true)
      const data = await MultiDestinationService.getDeliveryById(deliveryId)
      setDelivery(data)
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const loadBids = async () => {
    try {
      setBidsLoading(true)
      const bidsData = await MultiDestinationService.getDeliveryBids(deliveryId)
      setBids(bidsData)
    } catch (error) {
      console.error('Erreur lors du chargement des enchères:', error)
    } finally {
      setBidsLoading(false)
    }
  }

const handleAcceptBid = async (bidId: number) => {
    try {
      Alert.alert(
        'Accepter cette enchère',
        'Êtes-vous sûr de vouloir accepter cette enchère ? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Accepter',
            onPress: async () => {
              try {
                setCurrentAction('Acceptation de l\'enchère...')
                setActionLoading(true)
                await MultiDestinationService.acceptBid(deliveryId, bidId)
                Alert.alert('Succès', 'Enchère acceptée avec succès')
                loadDeliveryDetails() // Recharger les détails
              } catch (error) {
                console.error('Erreur lors de l\'acceptation:', error)
                Alert.alert('Erreur', 'Impossible d\'accepter cette enchère')
              } finally {
                setActionLoading(false)
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleEditDelivery = () => {
    // Naviguer vers l'écran de modification
    navigation.navigate('CreateMultiDestinationDelivery', {
      editMode: true,
      deliveryId: deliveryId,
      existingData: delivery
    })
  }

  const handleCancelDelivery = async () => {
    try {
      setCurrentAction('Annulation de la livraison...')
      setActionLoading(true)
      await MultiDestinationService.cancelDelivery(deliveryId, 'Annulation par le client')
      Alert.alert('Succès', 'Livraison annulée avec succès')
      navigation.goBack()
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      Alert.alert('Erreur', 'Impossible d\'annuler cette livraison')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCounterOffer = async (bidId: number, price: number, message?: string) => {
    try {
      setCurrentAction('Envoi de la contre-offre...')
      setActionLoading(true)
      await MultiDestinationService.createCounterOffer(deliveryId, bidId, {
        proposed_price: price,
        message: message
      })
      Alert.alert('Succès', 'Contre-offre envoyée avec succès')
      loadBids() // Recharger les enchères
    } catch (error) {
      console.error('Erreur lors de la contre-offre:', error)
      Alert.alert('Erreur', 'Impossible d\'envoyer la contre-offre')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !delivery) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement des détails...
        </Text>
      </View>
    )
  }

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

  const getDestinationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'in_progress': return '#2196F3'
      case 'delivered': return '#4CAF50'
      case 'failed': return '#F44336'
      default: return colors.text
    }
  }

  const getDestinationStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'in_progress': return 'En cours'
      case 'delivered': return 'Livrée'
      case 'failed': return 'Échouée'
      default: return status
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Informations de base */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {delivery.package_type} - {delivery.destinations.length} destination(s)
          </Text>

          <View style={styles.infoRow}>
            <Icon name="cube-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Statut
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                <Text style={styles.statusText}>
                  {getStatusText(delivery.status)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="location-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Point de ramassage
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {delivery.pickup_address}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="document-text-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Description du colis
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {delivery.package_description}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="cash-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Prix total
              </Text>
              <Text style={[styles.priceText, { color: colors.primary }]}>
                {(delivery.total_final_price || delivery.total_proposed_price || 0).toLocaleString()} FCFA
              </Text>
            </View>
          </View>

          {delivery.special_instructions && (
            <View style={styles.infoRow}>
              <Icon name="information-circle-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Instructions spéciales
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {delivery.special_instructions}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="time-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Date de création
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(delivery.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Destinations */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Destinations ({delivery.destinations.length})
          </Text>

          {delivery.destinations.map((destination, index) => (
            <View key={destination.id || index} style={styles.destinationItem}>
              <View style={styles.destinationHeader}>
                <View style={[styles.orderBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.orderText}>
                    {destination.delivery_order}
                  </Text>
                </View>
                <View style={[styles.destinationStatusBadge, { backgroundColor: getDestinationStatusColor(destination.status) }]}>
                  <Text style={styles.destinationStatusText}>
                    {getDestinationStatusText(destination.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.destinationInfo}>
                <Text style={[styles.destinationAddress, { color: colors.text }]}>
                  {destination.delivery_address}
                </Text>
                <Text style={[styles.contactName, { color: colors.textSecondary }]}>
                  Contact: {destination.recipient_name}
                </Text>
                <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                  Téléphone: {destination.recipient_phone}
                </Text>
                {destination.delivery_notes && (
                  <Text style={[styles.deliveryNotes, { color: colors.textSecondary }]}>
                    Notes: {destination.delivery_notes}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Enchères */}
        {delivery.status === 'pending' && bids.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Enchères reçues ({bids.length})
            </Text>

            {bidsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              bids.map((bid) => (
                <View key={bid.id} style={styles.bidItem}>
                  <View style={styles.bidHeader}>
                    <Text style={[styles.courierName, { color: colors.text }]}>
                      {bid.courier.first_name} {bid.courier.last_name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={16} color="#FFD700" />
                      <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                        {bid.courier.rating}/5
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bidDetails}>
                    <Text style={[styles.bidPrice, { color: colors.primary }]}>
                      {bid.proposed_price.toLocaleString()} FCFA
                    </Text>
                    <Text style={[styles.bidTime, { color: colors.textSecondary }]}>
                      Temps estimé: {bid.estimated_total_time} min
                    </Text>
                    {bid.message && (
                      <Text style={[styles.bidMessage, { color: colors.textSecondary }]}>
                        Message: {bid.message}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.acceptBidButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAcceptBid(bid.id)}
                  >
                    <Text style={styles.acceptBidText}>Accepter</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Informations du coursier */}
        {delivery.courier && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Coursier assigné
            </Text>

            <View style={styles.courierInfo}>
              <View style={styles.courierDetails}>
                <Text style={[styles.courierName, { color: colors.text }]}>
                  {delivery.courier.first_name} {delivery.courier.last_name}
                </Text>
                <Text style={[styles.courierPhone, { color: colors.textSecondary }]}>
                  {delivery.courier.phone}
                </Text>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                    {delivery.courier.rating}/5
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.callButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // TODO: Implémenter l'appel
                  Alert.alert('Appel', `Appeler ${delivery.courier.phone}`)
                }}
              >
                <Icon name="call" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions disponibles */}
        <MultiDestinationActions
          deliveryId={deliveryId}
          currentStatus={delivery.status}
          canEdit={delivery.status === 'pending'}
          canCancel={['pending', 'in_progress'].includes(delivery.status)}
          onEdit={handleEditDelivery}
          onCancel={handleCancelDelivery}
          loading={loading || actionLoading}
        />
      </ScrollView>

      {/* Loader personnalisé pour les actions */}
      <CustomLoaderModal
        visible={actionLoading}
        title={currentAction}
        message="Veuillez patienter..."
        type="loading"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoContent: {
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  destinationItem: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  destinationStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  destinationStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  destinationInfo: {
    marginLeft: 32,
  },
  destinationAddress: {
    fontSize: 16,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    marginBottom: 4,
  },
  courierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courierDetails: {
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courierPhone: {
    fontSize: 14,
    color: '#757575',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  callButton: {
    padding: 12,
    borderRadius: 8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  bidItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    marginBottom: 8,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidDetails: {
    marginBottom: 12,
  },
  bidPrice: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bidTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  bidMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  acceptBidButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  acceptBidText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  deliveryNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
})

export default MultiDestinationDeliveryDetailsScreen