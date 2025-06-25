import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Modal,
  Image,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTheme } from '../../contexts/ThemeContext'
import { colors } from '../../styles/colors'
import { CustomLoaderModal, MultiDestinationActions } from '../../components'
import MultiDestinationService, { MultiDestinationDelivery, MultiDestinationBid } from '../../services/MultiDestinationService'
import { useAlert } from '../../hooks/useAlert'
import { useLoader } from '../../contexts/LoaderContext'

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
  const [callModalVisible, setCallModalVisible] = useState(false)

  const { showErrorAlert, showSuccessAlert } = useAlert()
  const { hideLoader } = useLoader()

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
      showErrorAlert('Erreur', 'Impossible de charger les détails de la livraison')
      navigation.goBack()
    } finally {
    hideLoader()
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
    hideLoader()
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
                showSuccessAlert('Succès', 'Enchère acceptée avec succès')
                loadDeliveryDetails() // Recharger les détails
              } catch (error) {
                console.error('Erreur lors de l\'acceptation:', error)
                Alert.alert('Erreur', 'Impossible d\'accepter cette enchère')
              } finally {
    hideLoader()
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
    navigation.navigate('CreateMultiDestinationDelivery')
  }

  const handleCancelDelivery = async () => {
    try {
      setCurrentAction('Annulation de la livraison...')
      setActionLoading(true)
      await MultiDestinationService.cancelDelivery(deliveryId, 'Annulation par le client')
      showSuccessAlert('Succès', 'Livraison annulée avec succès')
      navigation.goBack()
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      Alert.alert('Erreur', 'Impossible d\'annuler cette livraison')
    } finally {
    hideLoader()
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
      showSuccessAlert('Succès', 'Contre-offre envoyée avec succès')
      loadBids() // Recharger les enchères
    } catch (error) {
      console.error('Erreur lors de la contre-offre:', error)
      Alert.alert('Erreur', 'Impossible d\'envoyer la contre-offre')
    } finally {
    hideLoader()
      setActionLoading(false)
    }
  }

  const handleCallCourier = () => {
    setCallModalVisible(true)
  }

  const confirmCall = () => {
    setCallModalVisible(false)
    if (delivery && delivery.courier && delivery.courier.phone) {
      Linking.openURL(`tel:${delivery.courier.phone}`)
    }
  }

  if (loading || !delivery) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.gray }]}>
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={[styles.loadingText, { color: colors.black }]}>
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
      default: return colors.gray
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
      default: return colors.gray
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
    <View style={[styles.container, { backgroundColor: colors.gray }]}>
      <ScrollView>
        {/* Informations de base */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <Text style={styles.price}><MaterialCommunityIcons name="cash" size={18} /> {(delivery.total_final_price || delivery.total_proposed_price || 0).toLocaleString()} FCFA</Text>
            <View style={styles.statusBadge}><Text style={styles.statusText}>{getStatusText(delivery.status)}</Text></View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cube-outline" size={18} color="#FF9800" />
            <Text style={styles.infoText}>{delivery.package_type} - {delivery.destinations.length} destination(s)</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#FF9800" />
            <Text style={styles.infoText}>Point de ramassage : {delivery.pickup_address}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={18} color="#FF9800" />
            <Text style={styles.infoText}>Créée le {new Date(delivery.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</Text>
          </View>
          {delivery.special_instructions && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="information-circle" size={18} color="#FF9800" />
              <Text style={styles.infoText}>Instructions spéciales : {delivery.special_instructions}</Text>
            </View>
          )}
        </View>

        {/* Destinations */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.sectionTitle}>Destinations ({delivery.destinations.length})</Text>

          {delivery.destinations.map((destination, index) => (
            <View key={destination.id || index} style={styles.destinationCard}>
              <View style={styles.destinationHeader}>
                <View style={styles.destinationAddress}>
                  <MaterialCommunityIcons name="map-marker" size={18} color="#FF9800" style={{ marginRight: 6 }} />
                  <Text style={styles.destinationName} numberOfLines={2} ellipsizeMode="tail">
                    {destination.delivery_address}
                  </Text>
                </View>
                <View style={styles.destinationStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getDestinationStatusColor(destination.status) }]} />
                  <Text style={[styles.destinationStatus, { color: getDestinationStatusColor(destination.status) }]}> {getDestinationStatusText(destination.status)}</Text>
                </View>
              </View>
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="account" size={15} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.contactText}>{destination.recipient_name}</Text>
                <MaterialCommunityIcons name="phone" size={15} color="#888" style={{ marginLeft: 12, marginRight: 4 }} />
                <Text style={styles.contactText}>{destination.recipient_phone}</Text>
              </View>
              {destination.delivery_notes && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="information-circle" size={18} color="#FF9800" />
                  <Text style={styles.infoText}>Notes: {destination.delivery_notes}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Enchères */}
        {delivery.status === 'pending' && bids.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.sectionTitle}>Enchères reçues ({bids.length})</Text>

            {bidsLoading ? (
              <ActivityIndicator size="small" color={colors.orange} />
            ) : (
              bids.map((bid) => (
                <View key={bid.id} style={styles.bidItem}>
                  <View style={styles.bidHeader}>
                    <Text style={[styles.courierName, { color: colors.black }]}>
                      {bid.courier.first_name} {bid.courier.last_name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={16} color="#FFD700" />
                      <Text style={[styles.ratingText, { color: colors.darkGray }]}>
                        {bid.courier.rating}/5
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bidDetails}>
                    <Text style={[styles.bidPrice, { color: colors.orange }]}>
                      {bid.proposed_price.toLocaleString()} FCFA
                    </Text>
                    <Text style={[styles.bidTime, { color: colors.darkGray }]}>
                      Temps estimé: {bid.estimated_total_time} min
                    </Text>
                    {bid.message && (
                      <Text style={[styles.bidMessage, { color: colors.darkGray }]}>
                        Message: {bid.message}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.acceptBidButton, { backgroundColor: colors.orange }]}
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
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.sectionTitle}>Coursier assigné</Text>

            <View style={styles.courierInfo}>
              <View style={styles.courierDetails}>
                <Text style={[styles.courierName, { color: colors.black }]}>
                  {delivery.courier.first_name} {delivery.courier.last_name}
                </Text>
                <Text style={[styles.courierPhone, { color: colors.darkGray }]}>
                  {delivery.courier.phone}
                </Text>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color="#FFD700" />
                  <Text style={[styles.ratingText, { color: colors.darkGray }]}>
                    {delivery.courier.rating}/5
                  </Text>
                </View>
              </View>
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

      {/* Bouton flottant d'appel du coursier */}
      {delivery && delivery.courier && (
        <TouchableOpacity
          style={[styles.fabCallButton, { backgroundColor: colors.orange, shadowColor: colors.orange }]}
          activeOpacity={0.8}
          onPress={handleCallCourier}
        >
          <Icon name="call" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal personnalisé de confirmation d'appel */}
      {delivery && delivery.courier && (
        <Modal
          visible={callModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCallModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={require('../../assets/images/default-avatar.png')}
                style={styles.courierAvatar}
              />
              <Text style={styles.modalTitle}>Appeler le coursier</Text>
              <Text style={styles.modalName}>
                {delivery.courier.first_name} {delivery.courier.last_name}
              </Text>
              <Text style={styles.modalPhone}>{delivery.courier.phone}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                  onPress={confirmCall}
                >
                  <Icon name="call" size={20} color="#fff" />
                  <Text style={styles.modalButtonText}>Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.gray }]}
                  onPress={() => setCallModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.black }]}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
    backgroundColor: '#F5F6FA',
    padding: 0,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 12,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 80,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 2,
  },
  infoText: {
    fontSize: 15,
    color: '#444',
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 18,
    color: '#222',
  },
  destinationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  destinationAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    flex: 1,
    flexWrap: 'wrap',
  },
  destinationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  destinationStatus: {
    fontWeight: '600',
    fontSize: 13,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  contactText: {
    fontSize: 13,
    color: '#555',
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginHorizontal: 18,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginRight: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  actionButtonDanger: {
    backgroundColor: '#F44336',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  courierAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalPhone: {
    fontSize: 14,
    color: colors.darkGray,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: colors.orange,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fabCallButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
})

export default MultiDestinationDeliveryDetailsScreen