
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { RootStackParamList } from '../../types/navigation'
import { Card } from '../../components'
import { useTheme } from '../../contexts/ThemeContext'
import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config'
import { getToken } from '../../utils'

type ScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MultiDestinationDeliveryDetails'>
type ScreenRouteProp = RouteProp<RootStackParamList, 'MultiDestinationDeliveryDetails'>

interface MultiDestinationDeliveryDetails {
  id: number
  title: string
  pickup_address: string
  pickup_commune: string
  destinations: {
    id: number
    address: string
    commune: string
    contact_name?: string
    contact_phone?: string
    delivery_order: number
    status: 'pending' | 'in_progress' | 'completed'
  }[]
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  total_price: number
  package_description?: string
  created_at: string
  updated_at: string
}

const MultiDestinationDeliveryDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp>()
  const route = useRoute<ScreenRouteProp>()
  const { colors } = useTheme()
  const { showErrorAlert } = useAlert()

  const [delivery, setDelivery] = useState<MultiDestinationDeliveryDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const { deliveryId } = route.params

  useEffect(() => {
    loadDeliveryDetails()
  }, [deliveryId])

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      
      const response = await fetch(`${API_BASE_URL}/multi-destination-deliveries/${deliveryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      setDelivery(data)
    } catch (error) {
      console.error('Erreur chargement détails:', error)
      showErrorAlert('Erreur', 'Impossible de charger les détails de la livraison')
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
      </View>
    )
  }

  if (!delivery) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Livraison introuvable</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Détails de la livraison
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Informations générales */}
        <Card style={styles.section}>
          <View style={styles.deliveryHeader}>
            <Text style={[styles.deliveryTitle, { color: colors.text }]}>
              {delivery.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
              <Text style={styles.statusText}>
                {getStatusText(delivery.status)}
              </Text>
            </View>
          </View>

          {delivery.package_description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {delivery.package_description}
            </Text>
          )}

          <View style={styles.infoRow}>
            <Icon name="attach-money" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Prix total: {delivery.total_price.toLocaleString()} FCFA
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="access-time" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Créée le {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </Card>

        {/* Point de ramassage */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Point de ramassage
          </Text>
          <View style={styles.addressContainer}>
            <Icon name="place" size={20} color={colors.primary} />
            <View style={styles.addressInfo}>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {delivery.pickup_address}
              </Text>
              <Text style={[styles.communeText, { color: colors.textSecondary }]}>
                {delivery.pickup_commune}
              </Text>
            </View>
          </View>
        </Card>

        {/* Destinations */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Destinations ({delivery.destinations.length})
          </Text>
          
          {delivery.destinations
            .sort((a, b) => a.delivery_order - b.delivery_order)
            .map((destination, index) => (
            <View key={destination.id} style={styles.destinationCard}>
              <View style={styles.destinationHeader}>
                <View style={styles.destinationNumber}>
                  <Text style={[styles.numberText, { color: 'white' }]}>
                    {destination.delivery_order}
                  </Text>
                </View>
                <View style={styles.destinationInfo}>
                  <Text style={[styles.destinationAddress, { color: colors.text }]}>
                    {destination.address}
                  </Text>
                  <Text style={[styles.destinationCommune, { color: colors.textSecondary }]}>
                    {destination.commune}
                  </Text>
                  {destination.contact_name && (
                    <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
                      Contact: {destination.contact_name}
                      {destination.contact_phone && ` - ${destination.contact_phone}`}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.destinationStatus,
                  { backgroundColor: getStatusColor(destination.status) }
                ]}>
                  <Text style={styles.destinationStatusText}>
                    {getStatusText(destination.status)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  communeText: {
    fontSize: 14,
    marginTop: 2,
  },
  destinationCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  destinationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationAddress: {
    fontSize: 14,
    fontWeight: '500',
  },
  destinationCommune: {
    fontSize: 12,
    marginTop: 2,
  },
  contactInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  destinationStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  destinationStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
})

export default MultiDestinationDeliveryDetailsScreen
