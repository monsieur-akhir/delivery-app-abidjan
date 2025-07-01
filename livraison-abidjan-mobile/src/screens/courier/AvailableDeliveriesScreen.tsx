import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { useUser } from '../../hooks/useUser'
import DeliveryService from '../../services/DeliveryService'
import { Delivery } from '../../types/models'
import DeliveryStatusBadge from '../../components/DeliveryStatusBadge'
import * as Location from 'expo-location'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

interface AvailableDeliveriesScreenProps {
  navigation: any
}

const AvailableDeliveriesScreen = ({ navigation }: AvailableDeliveriesScreenProps) => {
  const { user } = useAuth()
  const { kycStatus, getKYCStatus } = useUser()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [commune, setCommune] = useState<string | undefined>(undefined)
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)
  const [radius, setRadius] = useState<number>(5)
  const [communes, setCommunes] = useState<string[]>([])
  const [showMap, setShowMap] = useState(false)
  const [showKYCModal, setShowKYCModal] = useState(false)

  // Helper pour obtenir le statut KYC sous forme de string
  const getKYCStatusString = () => {
    if (!kycStatus) return 'pending';
    // Si kycStatus.status est un objet, adapte ici
    if (typeof kycStatus.status === 'string') return kycStatus.status;
    // fallback
    return 'pending';
  };

  const checkKYCStatus = useCallback(async () => {
    try {
      await getKYCStatus();
      const status = getKYCStatusString();
      if (status !== 'verified') {
        setShowKYCModal(true);
      } else {
        setShowKYCModal(false);
      }
    } catch (error) {
      setShowKYCModal(true);
    }
  }, [getKYCStatus, kycStatus]);

  const loadDeliveries = useCallback(async () => {
    if (getKYCStatusString() !== 'verified') {
      setDeliveries([])
      setLoading(false)
      return
    }

    try {
      let position = { latitude: lat, longitude: lng }
      if (!commune && (lat === undefined || lng === undefined)) {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Impossible d\'accéder à la position GPS')
          setLoading(false)
          return
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
        position = location.coords
        setLat(position.latitude)
        setLng(position.longitude)
      }
      const data = await DeliveryService.getAvailableDeliveries({
        commune,
        lat: commune ? undefined : position.latitude,
        lng: commune ? undefined : position.longitude,
        radius_km: radius
      })
      setDeliveries(data)
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons:', error)
    } finally {
      setLoading(false)
    }
  }, [commune, lat, lng, radius, kycStatus])

  useEffect(() => {
    getKYCStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const status = getKYCStatusString();
    setShowKYCModal(status !== 'verified');
  }, [kycStatus]);

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const communesList = await DeliveryService.getCommunes()
        setCommunes(communesList)
      } catch (e) {
        console.error('Erreur lors du chargement des communes:', e)
        setCommunes(["Abobo","Adjamé","Attécoubé","Cocody","Koumassi","Marcory","Plateau","Port-Bouët","Treichville","Yopougon","Bingerville","Songon"])
      }
    }
    fetchCommunes()
  }, [])

  useEffect(() => {
    console.log('[SCREEN] kycStatus (AvailableDeliveriesScreen):', kycStatus);
  }, [kycStatus]);

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

  const handleVerifyKYC = async () => {
    await getKYCStatus();
    const status = getKYCStatusString();
    console.log('[DEBUG] Statut KYC avant redirection:', status);
    if (status !== 'verified') {
      setShowKYCModal(true);
      return;
    }
    setShowKYCModal(false);
    navigation.navigate('KYCVerification');
  }

  const handleLaterKYC = () => {
    setShowKYCModal(false)
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

      <Modal
        visible={showKYCModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowKYCModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={48} color="#007AFF" />
              <Text style={styles.modalTitle}>Vérification requise</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Pour une meilleure utilisation de la plateforme, veuillez vérifier votre compte.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton]}
                onPress={() => handleVerifyKYC()}
              >
                <Text style={styles.verifyButtonText}>Vérifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.laterButton]}
                onPress={handleLaterKYC}
              >
                <Text style={styles.laterButtonText}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {getKYCStatusString() === 'verified' && !showKYCModal ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#f8f9fa', borderRadius: 12, margin: 8 }}>
            <TouchableOpacity
              style={{ 
                backgroundColor: commune ? '#e3f2fd' : '#007AFF', 
                borderRadius: 8, 
                padding: 10,
                minWidth: 100,
                alignItems: 'center'
              }}
              onPress={async () => {
                setCommune(undefined)
                setShowMap(false)
                await loadDeliveries()
              }}
            >
              <Text style={{ color: commune ? '#007AFF' : '#fff', fontWeight: '600' }}>Autour de moi</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <Picker
                selectedValue={commune}
                onValueChange={async (value: string | undefined) => {
                  setCommune(value)
                  setShowMap(false)
                  await loadDeliveries()
                }}
                style={{ backgroundColor: '#fff', borderRadius: 8, height: 40 }}
                enabled={communes.length > 0}
              >
                <Picker.Item label="Choisir une commune..." value={undefined} />
                {communes.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 4 }}>
              <Text style={{ color: '#333', marginRight: 8, fontWeight: '500' }}>Rayon</Text>
              <TouchableOpacity onPress={async () => { setRadius(Math.max(1, radius - 1)); await loadDeliveries() }} style={{ padding: 4 }}>
                <Ionicons name="remove-circle-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={{ color: '#007AFF', fontWeight: 'bold', minWidth: 30, textAlign: 'center', fontSize: 16 }}>{radius} km</Text>
              <TouchableOpacity onPress={async () => { setRadius(radius + 1); await loadDeliveries() }} style={{ padding: 4 }}>
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => setShowMap((v) => !v)} 
              style={{ 
                backgroundColor: showMap ? '#007AFF' : '#fff', 
                padding: 8, 
                borderRadius: 8,
                borderWidth: 1,
                borderColor: showMap ? '#007AFF' : '#ddd'
              }}
            >
              <Ionicons name="map" size={22} color={showMap ? '#fff' : '#666'} />
            </TouchableOpacity>
          </View>
          {showMap && lat && lng && (
            <View style={{ margin: 8, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
              <MapView
                style={{ height: 220 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                region={{ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                onPress={e => {
                  setLat(e.nativeEvent.coordinate.latitude)
                  setLng(e.nativeEvent.coordinate.longitude)
                  setCommune(undefined)
                  loadDeliveries()
                }}
              >
                <Marker coordinate={{ latitude: lat, longitude: lng }} title="Vous" pinColor="#007AFF" />
              </MapView>
            </View>
          )}

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
        </>
      ) : (
        <View style={styles.kycRequiredContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#ccc" />
          <Text style={styles.kycRequiredTitle}>Vérification KYC requise</Text>
          <Text style={styles.kycRequiredMessage}>
            Veuillez vérifier votre compte pour accéder aux livraisons disponibles.
          </Text>
          <TouchableOpacity
            style={styles.kycRequiredButton}
            onPress={() => handleVerifyKYC()}
          >
            <Text style={styles.kycRequiredButtonText}>Vérifier maintenant</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  kycRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  kycRequiredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  kycRequiredMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  kycRequiredButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  kycRequiredButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default AvailableDeliveriesScreen
