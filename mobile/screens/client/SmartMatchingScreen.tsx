
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { DeliveryService } from '../../services/DeliveryService'

interface SuggestedCourier {
  courier_id: number
  courier: {
    id: number
    full_name: string
    phone: string
    profile_image?: string
  }
  distance: number
  score: number
  eta_minutes: number
}

interface SmartMatchingScreenProps {
  route: {
    params: {
      deliveryId: number
    }
  }
  navigation: any
}

const SmartMatchingScreen = ({ route, navigation }: SmartMatchingScreenProps) => {
  const { deliveryId } = route.params
  const [suggestedCouriers, setSuggestedCouriers] = useState<SuggestedCourier[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null)

  useEffect(() => {
    loadSuggestedCouriers()
  }, [deliveryId])

  const loadSuggestedCouriers = async () => {
    try {
      const response = await DeliveryService.getSuggestedCouriers(deliveryId)
      setSuggestedCouriers(response.suggested_couriers || [])
    } catch (error) {
      console.error('Erreur lors du chargement des coursiers suggérés:', error)
      Alert.alert('Erreur', 'Impossible de charger les coursiers suggérés')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoAssign = async () => {
    Alert.alert(
      'Assignment automatique',
      'Voulez-vous laisser notre système choisir le meilleur coursier pour vous ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Assigner automatiquement',
          onPress: async () => {
            setAssigning(true)
            try {
              await DeliveryService.autoAssignDelivery(deliveryId)
              Alert.alert('Succès', 'Coursier assigné automatiquement!', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('ActiveOrderTracking', { deliveryId })
                }
              ])
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'assigner automatiquement')
            } finally {
              setAssigning(false)
            }
          }
        }
      ]
    )
  }

  const handleManualAssign = async (courierId: number) => {
    setSelectedCourier(courierId)
    try {
      await DeliveryService.assignCourier({ delivery_id: deliveryId, courier_id: courierId })
      Alert.alert('Succès', 'Coursier assigné!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ActiveOrderTracking', { deliveryId })
        }
      ])
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'assigner ce coursier')
    } finally {
      setSelectedCourier(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4CAF50'
    if (score >= 6) return '#FF9800'
    return '#F44336'
  }

  const renderCourierItem = ({ item }: { item: SuggestedCourier }) => (
    <TouchableOpacity
      style={styles.courierCard}
      onPress={() => handleManualAssign(item.courier_id)}
      disabled={selectedCourier === item.courier_id}
    >
      <View style={styles.courierHeader}>
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
            <Text style={styles.courierPhone}>{item.courier.phone}</Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
            <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.courierStats}>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.statText}>{item.distance.toFixed(1)} km</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.statText}>{item.eta_minutes} min</Text>
        </View>
      </View>

      {selectedCourier === item.courier_id ? (
        <View style={styles.assigningIndicator}>
          <ActivityIndicator color="#007AFF" size="small" />
          <Text style={styles.assigningText}>Assignment en cours...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => handleManualAssign(item.courier_id)}
        >
          <Text style={styles.assignButtonText}>Choisir ce coursier</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir un coursier</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Recherche des meilleurs coursiers...</Text>
        </View>
      ) : (
        <>
          <View style={styles.autoAssignContainer}>
            <Text style={styles.autoAssignTitle}>✨ Assignment intelligent</Text>
            <Text style={styles.autoAssignDescription}>
              Notre IA choisit le meilleur coursier selon la distance, les notes et la disponibilité
            </Text>
            <TouchableOpacity
              style={styles.autoAssignButton}
              onPress={handleAutoAssign}
              disabled={assigning}
            >
              {assigning ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#ffffff" />
                  <Text style={styles.autoAssignButtonText}>Assignment automatique</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou choisissez manuellement</Text>
            <View style={styles.dividerLine} />
          </View>

          {suggestedCouriers.length > 0 ? (
            <FlatList
              data={suggestedCouriers}
              renderItem={renderCourierItem}
              keyExtractor={(item) => item.courier_id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucun coursier disponible</Text>
              <Text style={styles.emptyMessage}>
                Aucun coursier n'est disponible dans votre zone pour le moment
              </Text>
            </View>
          )}
        </>
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
  autoAssignContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoAssignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  autoAssignDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  autoAssignButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  autoAssignButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  courierCard: {
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
  courierHeader: {
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
  courierPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  courierStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
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
  assignButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  assigningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  assigningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
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

export default SmartMatchingScreen
