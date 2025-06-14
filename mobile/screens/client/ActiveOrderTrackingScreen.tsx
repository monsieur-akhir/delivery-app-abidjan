import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from 'react-native'
import { Text, Card, Button, Avatar, Chip, ActivityIndicator, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'

import DeliveryService from '../../services/DeliveryService'
import { useAuth } from '../../contexts/AuthContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Delivery, DeliveryStatus } from '../../types/models'
import { VTCStyleMap } from '../../components/VTCStyleMap'
import { formatDate, formatPrice } from '../../utils/formatters'

const { width, height } = Dimensions.get('window')

interface TimelineItem {
  status: string
  timestamp: string
  title: string
  description: string
}

interface StatusTimeline {
  timeline: TimelineItem[]
  current_status: DeliveryStatus
}

const ActiveOrderTrackingScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  const { user } = useAuth()
  const { subscribe, unsubscribe } = useWebSocket()

  const { deliveryId } = route.params as { deliveryId: string }

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [courierLocation, setCourierLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null)

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  // Charger les détails de la livraison
  const loadDeliveryDetails = useCallback(async () => {
    try {
      setLoading(true)
      const [deliveryData, timelineData] = await Promise.all([
        DeliveryService.getDeliveryById(Number(deliveryId)),
        DeliveryService.getDeliveryStatusTimeline(Number(deliveryId))
      ])

      setDelivery(deliveryData)
      setTimeline(timelineData.timeline)

      // Animation d'entrée
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
      console.error('Erreur lors du chargement:', error)
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison')
    } finally {
      setLoading(false)
    }
  }, [deliveryId, fadeAnim, slideAnim])

  // Rafraîchir
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await loadDeliveryDetails()
    setRefreshing(false)
  }, [loadDeliveryDetails])

  // Gestion des mises à jour WebSocket
  const handleLocationUpdate = useCallback((data: any) => {
    setCourierLocation({ latitude: data.latitude, longitude: data.longitude })
    setEstimatedArrival(data.estimated_arrival)
  }, [])

  const handleStatusUpdate = useCallback((data: any) => {
    setDelivery(prev => prev ? { ...prev, status: data.status } : null)
    loadDeliveryDetails() // Recharger pour avoir la timeline mise à jour
  }, [loadDeliveryDetails])

  // Effets
  useEffect(() => {
    loadDeliveryDetails()
  }, [loadDeliveryDetails])

  useFocusEffect(
    useCallback(() => {
      if (!delivery?.courier_id) return

      // S'abonner aux mises à jour
      const locationChannel = `courier.${delivery.courier_id}.location`
      const statusChannel = `delivery.${deliveryId}.status`

      subscribe(locationChannel, handleLocationUpdate)
      subscribe(statusChannel, handleStatusUpdate)

      return () => {
        unsubscribe(locationChannel)
        unsubscribe(statusChannel)
      }
    }, [delivery?.courier_id, deliveryId, subscribe, unsubscribe, handleLocationUpdate, handleStatusUpdate])
  )

  // Animation de pulsation pour le statut actif
  useEffect(() => {
    if (delivery?.status === 'in_transit' || delivery?.status === 'picked_up') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }
  }, [delivery?.status, pulseAnim])

  // Actions
  const callCourier = useCallback(() => {
    if (!delivery?.courier?.phone) {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible')
      return
    }

    const phoneNumber = delivery.courier.phone.startsWith('+') 
      ? delivery.courier.phone 
      : `+225${delivery.courier.phone}`

    Linking.openURL(`tel:${phoneNumber}`)
  }, [delivery?.courier?.phone])

  const messageCourier = useCallback(() => {
    if (!delivery?.courier?.phone) {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible')
      return
    }

    const phoneNumber = delivery.courier.phone.startsWith('+') 
      ? delivery.courier.phone 
      : `+225${delivery.courier.phone}`

    const message = `Bonjour, concernant ma livraison #${deliveryId}`
    const url = Platform.OS === 'ios' 
      ? `sms:${phoneNumber}&body=${encodeURIComponent(message)}`
      : `sms:${phoneNumber}?body=${encodeURIComponent(message)}`

    Linking.openURL(url)
  }, [delivery?.courier?.phone, deliveryId])

  const confirmDelivery = useCallback(async () => {
    if (!delivery) return

    Alert.alert(
      'Confirmer la réception',
      'Avez-vous bien reçu votre colis ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, confirmer',
          onPress: () => navigation.navigate('RateDelivery', { deliveryId })
        }
      ]
    )
  }, [delivery, deliveryId, navigation])

  // Obtenir la couleur du statut
  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return '#FF8C00'
      case 'accepted': return '#2196F3'
      case 'picked_up': return '#9C27B0'
      case 'in_transit': return '#FF6B00'
      case 'delivered': return '#4CAF50'
      default: return '#9E9E9E'
    }
  }

  // Obtenir l'icône du statut
  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending': return 'clock-outline'
      case 'accepted': return 'check-circle-outline'
      case 'picked_up': return 'package-variant'
      case 'in_transit': return 'truck-delivery-outline'
      case 'delivered': return 'check-all'
      default: return 'help-circle-outline'
    }
  }

  // Rendu du contenu principal
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )
    }

    if (!delivery) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Livraison introuvable</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </View>
      )
    }

    return (
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Carte du statut actuel */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Animated.View style={[styles.statusIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={[getStatusColor(delivery.status), getStatusColor(delivery.status) + '80']}
                  style={styles.statusIconGradient}
                >
                  <MaterialCommunityIcons 
                    name={getStatusIcon(delivery.status)} 
                    size={32} 
                    color="white" 
                  />
                </LinearGradient>
              </Animated.View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {t(`deliveryStatus.${delivery.status}`)}
                </Text>
                <Text style={styles.deliveryId}>Livraison #{delivery.id}</Text>
                {estimatedArrival && (
                  <Text style={styles.estimatedArrival}>
                    Arrivée estimée: {estimatedArrival}
                  </Text>
                )}
              </View>
            </View>

            {/* Informations du coursier */}
            {delivery.courier && (
              <View style={styles.courierSection}>
                <Avatar.Image 
                  size={50} 
                  source={{ uri: delivery.courier.avatar || 'https://via.placeholder.com/50' }} 
                />
                <View style={styles.courierInfo}>
                  <Text style={styles.courierName}>{delivery.courier.full_name}</Text>
                  <View style={styles.courierDetails}>
                    <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.courierRating}>
                      {delivery.courier.average_rating?.toFixed(1) || 'N/A'}
                    </Text>
                    <Text style={styles.courierVehicle}>
                      • {delivery.courier.vehicle_type || 'Véhicule'}
                    </Text>
                  </View>
                </View>
                <View style={styles.courierActions}>
                  <IconButton
                    icon="phone"
                    size={24}
                    iconColor="#4CAF50"
                    onPress={callCourier}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="message-text"
                    size={24}
                    iconColor="#2196F3"
                    onPress={messageCourier}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Carte */}
        {(delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng) && (
          <Card style={styles.mapCard}>
            <VTCStyleMap
              deliveries={[delivery]}
              courierLocation={courierLocation}
            />
          </Card>
        )}

        {/* Timeline */}
        <Card style={styles.timelineCard}>
          <Card.Content>
            <Text style={styles.timelineTitle}>Suivi de votre commande</Text>
            {timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View 
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: getStatusColor(item.status as DeliveryStatus) }
                    ]}
                  >
                    <MaterialCommunityIcons 
                      name={getStatusIcon(item.status as DeliveryStatus)} 
                      size={16} 
                      color="white" 
                    />
                  </View>
                  {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineItemTitle}>{item.title}</Text>
                  <Text style={styles.timelineItemDescription}>{item.description}</Text>
                  <Text style={styles.timelineItemTime}>
                    {formatDate(item.timestamp, 'short')}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Informations de livraison */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.detailsTitle}>Détails de la livraison</Text>

            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#4CAF50" />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Collecte</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                </View>
              </View>

              <View style={styles.addressItem}>
                <MaterialCommunityIcons name="map-marker-check" size={24} color="#F44336" />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Livraison</Text>
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.packageInfo}>
              <Text style={styles.packageTitle}>Informations du colis</Text>
              {delivery.package_description && (
                <Text style={styles.packageDescription}>{delivery.package_description}</Text>
              )}
              <View style={styles.packageDetails}>
                <Chip icon="weight" style={styles.packageChip}>
                  {delivery.package_weight ? `${delivery.package_weight}kg` : 'Poids non spécifié'}
                </Chip>
                {delivery.is_fragile && (
                  <Chip icon="fragile" style={[styles.packageChip, styles.fragileChip]}>
                    Fragile
                  </Chip>
                )}
              </View>
            </View>

            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>Prix total</Text>
              <Text style={styles.priceValue}>
                {formatPrice(delivery.final_price || delivery.proposed_price)} FCFA
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Bouton d'action selon le statut */}
        {delivery.status === 'delivered' && (
          <Button
            mode="contained"
            onPress={confirmDelivery}
            style={styles.confirmButton}
            icon="check-circle"
          >
            Confirmer la réception
          </Button>
        )}
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi de livraison</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#212121" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  deliveryId: {
    fontSize: 14,
    color: '#757575',
  },
  estimatedArrival: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
    marginTop: 4,
  },
  courierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  courierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  courierDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  courierRating: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  courierVehicle: {
    fontSize: 14,
    color: '#757575',
  },
  courierActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#F5F5F5',
    marginLeft: 4,
  },
  mapCard: {
    height: 250,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  timelineCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  timelineItemDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  timelineItemTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  detailsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 16,
    color: '#212121',
  },
  packageInfo: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  packageDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  packageChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  fragileChip: {
    backgroundColor: '#FFF3E0',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  confirmButton: {
    marginBottom: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
  },
})

export default ActiveOrderTrackingScreen