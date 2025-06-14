import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView } from "react-native"
import { Text, Card, Button, Avatar, Divider, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from '@expo/vector-icons'

import type { Delivery, DeliveryStatus, VTCDeliveryStatusType } from "../../types/models"
import { VTCStyleMap, VTCCoordinates, VTCCourier, VTCRoute, VTCDeliveryStatus } from "../../components/VTCStyleMap"
import useDelivery from "../../hooks/useDelivery"
import { useNetwork } from "../../contexts/NetworkContext"
import { useTranslation } from "react-i18next"
import { formatPrice, formatDate } from "../../utils/formatters"
import { useAuth } from "../../contexts/AuthContext"
import { useWebSocket } from "../../contexts/WebSocketContext"
import DeliveryService from "../../services/DeliveryService"

// Fonctions utilitaires pour les statuts
const getStatusMessage = (status: string): string => {
  const messages: Record<string, string> = {
    'pending': 'Commande en attente',
    'searching': 'Recherche d\'un coursier',
    'assigned': 'Coursier assigné',
    'pickup': 'Récupération en cours',
    'transit': 'En cours de livraison',
    'delivered': 'Livré',
    'cancelled': 'Annulé'
  }
  return messages[status] || 'Statut inconnu'
}

const getProgressPercentage = (status: string): number => {
  const progressMap: Record<string, number> = {
    'pending': 10,
    'searching': 20,
    'assigned': 40,
    'pickup': 60,
    'transit': 80,
    'delivered': 100,
    'cancelled': 0
  }
  return progressMap[status] || 0
}

type EnhancedTrackDeliveryScreenProps = {
  route: { params: { deliveryId: string } }
  navigation: {
    goBack: () => void
    navigate: (screen: string, params?: Record<string, unknown>) => void
  }
}

const EnhancedTrackDeliveryScreen: React.FC<EnhancedTrackDeliveryScreenProps> = ({ 
  route, 
  navigation 
}) => {  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { getDeliveryDetails } = useDelivery()
  const { isConnected } = useNetwork()

  // State
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [vtcCourier, setVtcCourier] = useState<VTCCourier | null>(null)
  const [pickupLocation, setPickupLocation] = useState<VTCCoordinates | null>(null)
  const [deliveryLocation, setDeliveryLocation] = useState<VTCCoordinates | null>(null)
  const [deliveryRoute, setDeliveryRoute] = useState<VTCRoute | null>(null)
  const [deliveryStatus, setDeliveryStatus] = useState<VTCDeliveryStatus>({
    status: 'searching',
    message: 'Recherche du meilleur coursier...',
    eta: '',
    progress: 0
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [showDetails, setShowDetails] = useState<boolean>(false)

  // Load delivery data
  const loadDeliveryData = useCallback(async () => {
    if (!deliveryId || !isConnected) return

    try {
      setLoading(true)
      const deliveryData = await getDeliveryDetails(deliveryId.toString())
      if (!deliveryData) {
        setError(t('trackDelivery.errorLoadingDelivery'))
        setLoading(false)
        return
      }

      setDelivery(deliveryData)

      // Convert to VTC format
      if (deliveryData.pickup_location && typeof deliveryData.pickup_location === 'object' && 'latitude' in deliveryData.pickup_location && 'longitude' in deliveryData.pickup_location) {
        setPickupLocation({
          latitude: deliveryData.pickup_lat as number,
          longitude: deliveryData.pickup_lng as number
        })
      }

      if (deliveryData.delivery_lat && deliveryData.delivery_lng) {
        setDeliveryLocation({
          latitude: deliveryData.delivery_lat as number,
          longitude: deliveryData.delivery_lng as number
        })
      }      // Convert courier data if available
      if (deliveryData.courier) {
        const courier = deliveryData.courier;        setVtcCourier({
          id: String(courier.id),
          name: courier.name || courier?.full_name || "Coursier",
          rating: courier.rating || 4.5,
          photo: courier?.profile_picture,
          vehicle: {
            type: (courier.vehicle_type as "car" | "motorcycle" | "bicycle" | "truck" | "van") || "motorcycle",
            model: "Unknown",
            plate: courier.license_plate || "N/A"
          },
          location: pickupLocation || {
            latitude: 5.3599517,
            longitude: -4.0082563
          }
        })
      }

      // Set delivery status
      const statusMapping: Record<string, string> = {
        pending: 'searching',
        accepted: 'assigned',
        picked_up: 'pickup',
        in_progress: 'transit',
        delivered: 'delivered',
        completed: 'delivered',
        cancelled: 'cancelled',
        bidding: 'searching',
        confirmed: 'assigned',
        in_transit: 'transit',
        near_destination: 'transit',
      }

      setDeliveryStatus({
        ...deliveryStatus,
        status: (statusMapping[deliveryData.status] || 'searching') as "delivered" | "cancelled" | "pickup" | "searching" | "assigned" | "transit",
        message: getStatusMessage(deliveryData.status),
        eta: deliveryData.estimated_arrival_time,
        progress: getProgressPercentage(deliveryData.status)
      })      // Note: Route fetching would be implemented with a real API endpoint
      // For now, we'll set a mock route if both locations are available
      if (pickupLocation && deliveryLocation) {
        try {
          // Mock route - in production this would call a real route API
          setDeliveryRoute({
            coordinates: [
              { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
              { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude }
            ],
            distance: 10, // Mock distance in km
            duration: 30  // Mock duration in minutes
          })
        } catch (routeError) {
          console.error('Error loading route:', routeError)
        }
      }    } catch (error) {
      console.error('Error loading delivery data:', error)
      setError(t('trackDelivery.errorLoadingDelivery'))
    } finally {
      setLoading(false)
    }  }, [deliveryId, isConnected, getDeliveryDetails, t, pickupLocation, deliveryLocation])

  // Get progress percentage from status
  const getProgressFromStatus = (status: DeliveryStatus): number => {
    switch (status) {
      case 'pending': return 10
      case 'accepted': return 25
      case 'picked_up': return 50
      case 'in_progress': return 75
      case 'delivered': return 100
      case 'completed': return 100
      case 'cancelled': return 0
      case 'bidding': return 5
      default: return 0
    }
  }

  // Effects
  useEffect(() => {
    loadDeliveryData()
  }, [loadDeliveryData])

  // Note: WebSocket functionality would be implemented here
  // For now, we'll use periodic polling or other real-time updates
  // Actions
  const handleCallCourier = () => {
    if (vtcCourier && delivery?.courier?.phone) {
      const phoneUrl = `tel:${delivery.courier.phone}`
      Linking.canOpenURL(phoneUrl).then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl)
        } else {
          Alert.alert(t('trackDelivery.errorCannotCall'))
        }
      })
    }
  }

  const handleCancelDelivery = () => {
    Alert.alert(
      t('trackDelivery.confirmCancel'),
      t('trackDelivery.confirmCancelMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('trackDelivery.confirmCancelAction'), 
          style: 'destructive',
          onPress: () => {
            // Handle cancellation
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF5722" />
          <Text style={styles.errorText}>{error || t('trackDelivery.errorLoadingDelivery')}</Text>
          <Button mode="contained" onPress={loadDeliveryData}>
            {t('common.retry')}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('trackDelivery.title')}</Text>
          <Text style={styles.headerSubtitle}>#{deliveryId.slice(-8)}</Text>
        </View>
        <IconButton 
          icon={showDetails ? "chevron-up" : "chevron-down"} 
          onPress={() => setShowDetails(!showDetails)} 
        />
      </View>      {/* Map */}
      <View style={styles.mapContainer}>
        <VTCStyleMap
          pickupLocation={pickupLocation || undefined}
          deliveryLocation={deliveryLocation || undefined}
          courier={vtcCourier || undefined}
          route={deliveryRoute || undefined}
          deliveryStatus={deliveryStatus}
        />
      </View>

      {/* Details Panel */}
      {showDetails && (
        <View style={styles.detailsPanel}>
          <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
            {/* Courier Info */}
            {vtcCourier && (
              <Card style={styles.courierCard}>
                <Card.Content>
                  <View style={styles.courierHeader}>
                    <Avatar.Image 
                      size={50} 
                      source={{ uri: vtcCourier.photo || 'https://via.placeholder.com/50' }} 
                    />
                    <View style={styles.courierInfo}>
                      <Text style={styles.courierName}>{vtcCourier.name}</Text>
                      <View style={styles.courierRating}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>{vtcCourier.rating}</Text>
                      </View>
                      <Text style={styles.vehicleInfo}>
                        {vtcCourier.vehicle.type} • {vtcCourier.vehicle.plate}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.callButton} onPress={handleCallCourier}>
                      <MaterialIcons name="phone" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Delivery Details */}
            <Card style={styles.detailsCard}>
              <Card.Content>
                <Text style={styles.cardTitle}>{t('trackDelivery.deliveryDetails')}</Text>

                <View style={styles.addressContainer}>
                  <View style={styles.addressItem}>
                    <MaterialIcons name="location-on" size={20} color="#FF6B00" />
                    <View style={styles.addressText}>
                      <Text style={styles.addressLabel}>{t('trackDelivery.pickupAddress')}</Text>
                      <Text style={styles.addressValue}>{delivery.pickup_address}</Text>
                    </View>
                  </View>

                  <View style={styles.addressItem}>
                    <MaterialIcons name="flag" size={20} color="#4CAF50" />
                    <View style={styles.addressText}>
                      <Text style={styles.addressLabel}>{t('trackDelivery.deliveryAddress')}</Text>
                      <Text style={styles.addressValue}>{delivery.delivery_address}</Text>
                    </View>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t('trackDelivery.packageType')}</Text>
                    <Text style={styles.infoValue}>{delivery.package_type || 'N/A'}</Text>
                  </View>
                    <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t('trackDelivery.price')}</Text>
                    <Text style={styles.infoValue}>{formatPrice(delivery.proposed_price || delivery.final_price || 0)}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t('trackDelivery.createdAt')}</Text>
                    <Text style={styles.infoValue}>{formatDate(delivery.created_at)}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Actions */}
            {deliveryStatus.status !== 'delivered' && deliveryStatus.status !== 'cancelled' && (
              <View style={styles.actionsContainer}>
                <Button 
                  mode="outlined" 
                  onPress={handleCancelDelivery}
                  icon="cancel"
                  buttonColor="#FFEBEE"
                  textColor="#F44336"
                >
                  {t('trackDelivery.cancelDelivery')}
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    textAlign: 'center',
    marginVertical: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Details Panel
  detailsPanel: {
    maxHeight: '50%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailsScroll: {
    padding: 20,
  },

  // Courier Card
  courierCard: {
    marginBottom: 16,
    elevation: 2,
  },
  courierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courierRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#999',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Details Card
  detailsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  // Addresses
  addressContainer: {
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 14,
    color: '#333',
  },

  divider: {
    marginVertical: 16,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  // Actions
  actionsContainer: {
    marginTop: 8,
  },
})

export default EnhancedTrackDeliveryScreen