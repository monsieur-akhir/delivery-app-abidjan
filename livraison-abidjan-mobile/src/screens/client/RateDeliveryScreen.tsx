
import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Text, TextInput, Button, Card, Avatar, Divider } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'

import DeliveryService from '../../services/DeliveryService'
import StarRating from '../../components/StarRating'
import { Delivery } from '../../types/models'
import { formatPrice, formatDate } from '../../utils/formatters'

const RateDeliveryScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  
  const { deliveryId } = route.params as { deliveryId: string }
  
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Critères de notation prédéfinis
  const [criteria, setCriteria] = useState({
    punctuality: 5,
    packaging: 5,
    communication: 5,
    professionalism: 5,
  })

  // Commentaires suggérés
  const suggestedComments = [
    'Service excellent, très professionnel',
    'Livraison rapide et soignée',
    'Coursier très aimable et ponctuel',
    'Colis bien protégé, merci !',
    'Communication parfaite tout au long',
  ]

  // Charger les détails de la livraison
  useEffect(() => {
    const loadDelivery = async () => {
      try {
        setLoading(true)
        const deliveryData = await DeliveryService.getDeliveryById(deliveryId)
        setDelivery(deliveryData)
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        Alert.alert('Erreur', 'Impossible de charger les détails de la livraison')
        navigation.goBack()
      } finally {
        setLoading(false)
      }
    }

    loadDelivery()
  }, [deliveryId, navigation])

  // Calculer la note globale en fonction des critères
  useEffect(() => {
    const averageRating = Math.round(
      (criteria.punctuality + criteria.packaging + criteria.communication + criteria.professionalism) / 4
    )
    setRating(averageRating)
  }, [criteria])

  // Gérer la soumission de la notation
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Attention', 'Veuillez donner une note au coursier')
      return
    }

    try {
      setSubmitting(true)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // Confirmer la livraison et noter le coursier
      await DeliveryService.clientConfirmDelivery(Number(deliveryId), rating, comment || undefined)

      Alert.alert(
        'Merci !',
        'Votre notation a été prise en compte. La livraison est maintenant terminée.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ClientHome' }],
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Erreur lors de la notation:', error)
      Alert.alert('Erreur', 'Impossible de soumettre votre notation')
    } finally {
      setSubmitting(false)
    }
  }

  // Gérer la sélection d'un commentaire suggéré
  const selectSuggestedComment = (suggestedComment: string) => {
    setComment(suggestedComment)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  // Gérer la modification d'un critère
  const updateCriteria = (criterion: keyof typeof criteria, value: number) => {
    setCriteria(prev => ({ ...prev, [criterion]: value }))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  if (loading || !delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Noter la livraison</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Informations de la livraison */}
          <Card style={styles.deliveryCard}>
            <Card.Content>
              <View style={styles.deliveryHeader}>
                <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryTitle}>Livraison terminée !</Text>
                  <Text style={styles.deliverySubtitle}>
                    Livraison #{delivery.id} • {formatDate(delivery.delivered_at?.toString() || new Date().toISOString())}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.addressInfo}>
                <View style={styles.addressRow}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" />
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                </View>
                <View style={styles.addressRow}>
                  <MaterialCommunityIcons name="map-marker-check" size={20} color="#F44336" />
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Prix total</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(delivery.final_price || delivery.proposed_price)} FCFA
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Informations du coursier */}
          {delivery.courier && (
            <Card style={styles.courierCard}>
              <Card.Content>
                <View style={styles.courierHeader}>
                  <Avatar.Image 
                    size={60} 
                    source={{ uri: delivery.courier.profile_picture || 'https://via.placeholder.com/60' }} 
                  />
                  <View style={styles.courierInfo}>
                    <Text style={styles.courierName}>{delivery.courier.full_name}</Text>
                    <View style={styles.courierStats}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                      <Text style={styles.courierRating}>
                        {delivery.courier.rating?.toFixed(1) || 'N/A'}
                      </Text>
                      <Text style={styles.courierDeliveries}>
                        • {delivery.courier.total_deliveries || 0} livraisons
                      </Text>
                    </View>
                    <Text style={styles.courierVehicle}>
                      {delivery.courier.vehicle_type || 'Véhicule non spécifié'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ratingTitle}>Comment évaluez-vous cette livraison ?</Text>

                {/* Note globale */}
                <View style={styles.globalRatingContainer}>
                  <Text style={styles.globalRatingLabel}>Note globale</Text>
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
                    size={32}
                    style={styles.globalRating}
                  />
                  <Text style={styles.ratingText}>{rating}/5</Text>
                </View>

                {/* Critères détaillés */}
                <View style={styles.criteriaContainer}>
                  <Text style={styles.criteriaTitle}>Évaluation détaillée</Text>
                  
                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Ponctualité</Text>
                    <StarRating
                      rating={criteria.punctuality}
                      onRatingChange={(value: number) => updateCriteria('punctuality', value)}
                      size={20}
                    />
                  </View>

                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Soin du colis</Text>
                    <StarRating
                      rating={criteria.packaging}
                      onRatingChange={(value: number) => updateCriteria('packaging', value)}
                      size={20}
                    />
                  </View>

                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Communication</Text>
                    <StarRating
                      rating={criteria.communication}
                      onRatingChange={(value: number) => updateCriteria('communication', value)}
                      size={20}
                    />
                  </View>

                  <View style={styles.criteriaItem}>
                    <Text style={styles.criteriaLabel}>Professionnalisme</Text>
                    <StarRating
                      rating={criteria.professionalism}
                      onRatingChange={(value: number) => updateCriteria('professionalism', value)}
                      size={20}
                    />
                  </View>
                </View>

                {/* Commentaires suggérés */}
                <View style={styles.suggestedCommentsContainer}>
                  <Text style={styles.suggestedCommentsTitle}>Commentaires suggérés</Text>
                  <View style={styles.suggestedComments}>
                    {suggestedComments.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestionChip,
                          comment === suggestion && styles.suggestionChipSelected
                        ]}
                        onPress={() => selectSuggestedComment(suggestion)}
                      >
                        <Text style={[
                          styles.suggestionText,
                          comment === suggestion && styles.suggestionTextSelected
                        ]}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Commentaire personnalisé */}
                <TextInput
                  label="Commentaire (optionnel)"
                  value={comment}
                  onChangeText={setComment}
                  style={styles.commentInput}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Partagez votre expérience avec ce coursier..."
                />
              </Card.Content>
            </Card>
          )}

          {/* Bouton de soumission */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={submitting}
            disabled={submitting}
            icon="check"
          >
            Confirmer et terminer
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deliveryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  addressInfo: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    marginLeft: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
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
  courierCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  courierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  courierInfo: {
    flex: 1,
    marginLeft: 16,
  },
  courierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  courierStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  courierRating: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  courierDeliveries: {
    fontSize: 14,
    color: '#757575',
  },
  courierVehicle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  globalRatingContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  globalRatingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  globalRating: {
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  criteriaContainer: {
    marginBottom: 20,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  criteriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  criteriaLabel: {
    fontSize: 14,
    color: '#212121',
    flex: 1,
  },
  suggestedCommentsContainer: {
    marginBottom: 20,
  },
  suggestedCommentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  suggestedComments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  suggestionChipSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  suggestionText: {
    fontSize: 12,
    color: '#757575',
  },
  suggestionTextSelected: {
    color: 'white',
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
  },
  submitButton: {
    marginBottom: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
  },
})

export default RateDeliveryScreen
