import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import DeliveryService from '../../services/DeliveryService'
import { Delivery } from '../../types/models'
import DeliveryStatusBadge from '../../components/DeliveryStatusBadge'
import VTCStyleMap from '../../components/VTCStyleMap'

interface DeliveryDetailsScreenProps {
  route: {
    params: {
      deliveryId: number
    }
  }
  navigation: any
}

const DeliveryDetailsScreen = ({ route, navigation }: DeliveryDetailsScreenProps) => {
  const { deliveryId } = route.params
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    loadDelivery()
  }, [deliveryId])

  const loadDelivery = async () => {
    try {
      const data = await DeliveryService.getDeliveryById(deliveryId.toString())
      setDelivery(data)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptDelivery = async () => {
    if (!delivery) return

    Alert.alert(
      'Accepter la livraison',
      `Voulez-vous accepter cette livraison pour ${delivery.proposed_price} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            setAccepting(true)
            try {
              await DeliveryService.acceptDelivery(delivery.id)
              Alert.alert('Succès', 'Livraison acceptée avec succès!', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.replace('CourierTrackDelivery', { deliveryId: delivery.id })
                  }
                }
              ])
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'accepter la livraison')
            } finally {
              setAccepting(false)
            }
          }
        }
      ]
    )
  }

  const handleCallClient = () => {
    if (delivery?.client_phone) {
      Linking.openURL(`tel:${delivery.client_phone}`)
    }
  }

  const handleOpenMaps = (address: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)
    } else {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la livraison</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la livraison</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Livraison non trouvée</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livraison #{delivery.id}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Statut et prix */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <DeliveryStatusBadge status={delivery.status} />
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{delivery.proposed_price} FCFA</Text>
              <Text style={styles.priceLabel}>Prix proposé</Text>
            </View>
          </View>
        </View>

        {/* Informations du trajet */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations du trajet</Text>

          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.pointIcon}>
                <Ionicons name="location" size={16} color="#007AFF" />
              </View>
              <View style={styles.pointDetails}>
                <Text style={styles.pointLabel}>Point de collecte</Text>
                <Text style={styles.pointAddress}>{delivery.pickup_address}</Text>
                <Text style={styles.pointCommune}>{delivery.pickup_commune}</Text>
              </View>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => handleOpenMaps(delivery.pickup_address, delivery.pickup_lat, delivery.pickup_lng)}
              >
                <Ionicons name="map" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={[styles.pointIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="flag" size={16} color="#ffffff" />
              </View>
              <View style={styles.pointDetails}>
                <Text style={styles.pointLabel}>Point de livraison</Text>
                <Text style={styles.pointAddress}>{delivery.delivery_address}</Text>
                <Text style={styles.pointCommune}>{delivery.delivery_commune}</Text>
              </View>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => handleOpenMaps(delivery.delivery_address, delivery.delivery_lat, delivery.delivery_lng)}
              >
                <Ionicons name="map" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Ionicons name="map-outline" size={16} color="#666" />
              <Text style={styles.statText}>~{delivery.estimated_distance || 0} km</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.statText}>~{delivery.estimated_duration || 30} min</Text>
            </View>
          </View>
        </View>

        {/* Carte */}
        <View style={styles.mapCard}>
          <Text style={styles.cardTitle}>Aperçu du trajet</Text>
          <View style={styles.mapContainer}>
            <VTCStyleMap
              showUserLocation={true}
              deliveryStatus="in_progress"
            />
          </View>
        </View>

        {/* Détails du colis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du colis</Text>

          <View style={styles.packageDetails}>
            <View style={styles.packageItem}>
              <Text style={styles.packageLabel}>Type</Text>
              <Text style={styles.packageValue}>{delivery.package_type || 'Standard'}</Text>
            </View>

            {delivery.package_description && (
              <View style={styles.packageItem}>
                <Text style={styles.packageLabel}>Description</Text>
                <Text style={styles.packageValue}>{delivery.package_description}</Text>
              </View>
            )}

            <View style={styles.packageItem}>
              <Text style={styles.packageLabel}>Instructions spéciales</Text>
              <Text style={styles.packageValue}>
                {delivery.special_instructions || 'Aucune instruction spéciale'}
              </Text>
            </View>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations client</Text>

          <View style={styles.clientInfo}>
            <View style={styles.clientItem}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.clientText}>{delivery.client?.full_name || 'N/A'}</Text>
            </View>

            {delivery.client_phone && (
              <TouchableOpacity style={styles.clientItem} onPress={handleCallClient}>
                <Ionicons name="call-outline" size={20} color="#4CAF50" />
                <Text style={[styles.clientText, { color: '#4CAF50' }]}>
                  {delivery.client_phone}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      {delivery.status === 'pending' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAcceptDelivery}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Accepter cette livraison</Text>
              </>
            )}
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pointDetails: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  pointAddress: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  pointCommune: {
    fontSize: 12,
    color: '#666',
  },
  mapButton: {
    padding: 8,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 15,
    marginBottom: 12,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  mapCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 200,
  },
  packageDetails: {
    gap: 12,
  },
  packageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packageLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  packageValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  clientInfo: {
    gap: 12,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
})

export default DeliveryDetailsScreen