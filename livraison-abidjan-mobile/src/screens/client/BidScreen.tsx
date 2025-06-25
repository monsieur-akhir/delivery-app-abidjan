import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card, Chip, Button, Divider, Avatar, Surface } from 'react-native-paper'
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../hooks/useAlert'
import { useLoader } from '../../contexts/LoaderContext'
import DeliveryService from '../../services/DeliveryService'
import { formatPrice, formatDate, formatDistance } from '../../utils/formatters'
import { getDeliveryConsultations } from '../../services/api'
import type { RootStackParamList, Delivery, Bid } from '../../types'


const { width, height } = Dimensions.get('window')

interface RouteParams {
  deliveryId: string
  deliveryData?: Delivery
}

type BidScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BidScreen'>

interface CourierConsultation {
  id: string
  courier_id: string
  courier_name: string
  courier_avatar?: string
  courier_rating: number
  consultation_time: string
  status: 'viewing' | 'interested' | 'not_interested'
  distance?: number
}

interface BidWithCourier {
  id: number
  delivery_id: number
  courier_id: number
  amount: number
  estimated_time: number
  created_at: string
  proposed_price: number
  estimated_pickup_time: string
  updated_at: string
  courier: {
    id: string
    full_name: string
    phone: string
    rating: number
    avatar?: string
    vehicle_type: string
    distance?: number
  }
  status: 'pending' | 'accepted' | 'declined' | 'counter_offer'
}

const BidScreen: React.FC = () => {
  const navigation = useNavigation<BidScreenNavigationProp>()
  const route = useRoute()
  const params = route.params as RouteParams
  const { user } = useAuth()
  const { showSuccessAlert, showErrorAlert, showInfoAlert, showConfirmationAlert, showDeleteConfirmationAlert } = useAlert()
  const { showLoader, hideLoader } = useLoader()
  const { t } = useTranslation()

  // State
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [bids, setBids] = useState<BidWithCourier[]>([])
  const [consultations, setConsultations] = useState<CourierConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false)
  const [selectedBid, setSelectedBid] = useState<BidWithCourier | null>(null)
  const [counterOfferAmount, setCounterOfferAmount] = useState('')
  const [searchingCouriers, setSearchingCouriers] = useState(true)
  const [searchProgress, setSearchProgress] = useState(0)
  const [newBids, setNewBids] = useState<Set<number>>(new Set())
  const [sortByDistance, setSortByDistance] = useState(false)
  const [deliveryTimeout, setDeliveryTimeout] = useState(false)
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)
  const [counterOfferModalVisible, setCounterOfferModalVisible] = useState(false)
  const [selectedBidForCounter, setSelectedBidForCounter] = useState<BidWithCourier | null>(null)
  const [counterOfferPrice, setCounterOfferPrice] = useState('')
  const [counterOfferMessage, setCounterOfferMessage] = useState('')

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  // Polling pour les mises à jour en temps réel
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour trier les enchères
  const getSortedBids = () => {
    if (sortByDistance) {
      return [...bids].sort((a, b) => {
        const distanceA = a.courier.distance || Infinity
        const distanceB = b.courier.distance || Infinity
        return distanceA - distanceB
      })
    }
    return bids
  }

  // Simuler la recherche de coursiers
  useEffect(() => {
    if (searchingCouriers) {
      simulateCourierSearch()
    }
  }, [searchingCouriers])

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Démarrer le polling pour les mises à jour en temps réel
  useEffect(() => {
    if (!searchingCouriers && !loading) {
      startPolling()
    }

    // Démarrer les mises à jour simulées en temps réel
    const cleanupRealTimeUpdates = simulateRealTimeUpdates()

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
      cleanupRealTimeUpdates()
    }
  }, [searchingCouriers, loading])

  // Gérer le timeout de la livraison (2 minutes)
  useEffect(() => {
    if (!searchingCouriers && !loading && bids.length === 0) {
      const timeoutId = setTimeout(() => {
        setDeliveryTimeout(true)
        setShowTimeoutMessage(true)
      }, 120000) // 2 minutes

      return () => clearTimeout(timeoutId)
    }
  }, [searchingCouriers, loading, bids.length])

  const startPolling = () => {
    // Rafraîchir les données toutes les 10 secondes
    pollingInterval.current = setInterval(async () => {
      try {
        // Rafraîchir les consultations
        const consultationsData = await getDeliveryConsultations(params.deliveryId)
        setConsultations(consultationsData)

        // Rafraîchir les enchères
        const bidsData = await DeliveryService.getDeliveryBids(params.deliveryId)
        // Convertir les données Bid en BidWithCourier
        const convertedBids: BidWithCourier[] = bidsData.map((bid: any) => ({
          id: bid.id,
          delivery_id: bid.delivery_id,
          courier_id: bid.courier_id,
          amount: bid.amount || bid.proposed_price,
          estimated_time: bid.estimated_time || 30,
          created_at: bid.created_at,
          proposed_price: bid.proposed_price || bid.amount,
          estimated_pickup_time: bid.estimated_pickup_time || new Date().toISOString(),
          updated_at: bid.updated_at || bid.created_at,
          courier: {
            id: bid.courier?.id?.toString() || bid.courier_id?.toString(),
            full_name: bid.courier?.full_name || bid.courier?.name || 'Coursier inconnu',
            phone: bid.courier?.phone || '',
            rating: bid.courier?.rating || 4.5,
            vehicle_type: bid.courier?.vehicle_type || 'motorcycle',
            distance: bid.courier?.distance || 1.0
          },
          status: bid.status || 'pending'
        }))
        setBids(convertedBids)
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error)
      }
    }, 10000)
  }

  const simulateCourierSearch = async () => {
    const searchSteps = [
      'Analyse de votre demande...',
      'Recherche de coursiers disponibles...',
      'Calcul des meilleurs tarifs...',
      'Génération des offres...'
    ]

    for (let i = 0; i < searchSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSearchProgress((i + 1) / searchSteps.length)
    }

    setSearchingCouriers(false)
    loadDeliveryData()
  }

  const loadDeliveryData = async () => {
    try {
      setLoading(true)
      
      // Charger les détails de la livraison
      const deliveryData = await DeliveryService.getDeliveryById(params.deliveryId)
      setDelivery(deliveryData)

      // Charger les enchères
      const bidsData = await DeliveryService.getDeliveryBids(params.deliveryId)
      // Convertir les données Bid en BidWithCourier
      const convertedBids: BidWithCourier[] = bidsData.map((bid: any) => ({
        id: bid.id,
        delivery_id: bid.delivery_id,
        courier_id: bid.courier_id,
        amount: bid.amount || bid.proposed_price,
        estimated_time: bid.estimated_time || 30,
        created_at: bid.created_at,
        proposed_price: bid.proposed_price || bid.amount,
        estimated_pickup_time: bid.estimated_pickup_time || new Date().toISOString(),
        updated_at: bid.updated_at || bid.created_at,
        courier: {
          id: bid.courier?.id?.toString() || bid.courier_id?.toString(),
          full_name: bid.courier?.full_name || bid.courier?.name || 'Coursier inconnu',
          phone: bid.courier?.phone || '',
          rating: bid.courier?.rating || 4.5,
          vehicle_type: bid.courier?.vehicle_type || 'motorcycle',
          distance: bid.courier?.distance || 1.0
        },
        status: bid.status || 'pending'
      }))
      setBids(convertedBids)

      // Charger les consultations de coursiers
      try {
        const consultationsData = await getDeliveryConsultations(params.deliveryId)
        setConsultations(consultationsData)
      } catch (error) {
        console.error('Erreur lors du chargement des consultations:', error)
        // Utiliser les consultations simulées en cas d'erreur
        simulateCourierConsultations()
      }

      // Simuler les enchères si aucune donnée réelle n'est disponible
      if (!bidsData || bidsData.length === 0) {
        simulateBids()
      }

    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      showErrorAlert('Erreur', 'Impossible de charger les données de la livraison')
      
      // En cas d'erreur, utiliser les simulations
      simulateCourierConsultations()
      simulateBids()
    } finally {
    hideLoader()
      setLoading(false)
    }
  }

  const simulateCourierConsultations = () => {
    const mockConsultations: CourierConsultation[] = [
      {
        id: '1',
        courier_id: '101',
        courier_name: 'Kouassi Jean',
        courier_rating: 4.8,
        consultation_time: new Date().toISOString(),
        status: 'viewing',
        distance: 0.8
      },
      {
        id: '2',
        courier_id: '102',
        courier_name: 'Traoré Fatou',
        courier_rating: 4.6,
        consultation_time: new Date().toISOString(),
        status: 'interested',
        distance: 1.2
      },
      {
        id: '3',
        courier_id: '103',
        courier_name: 'Koné Mamadou',
        courier_rating: 4.9,
        consultation_time: new Date().toISOString(),
        status: 'viewing',
        distance: 0.5
      }
    ]

    setConsultations(mockConsultations)

    // Simuler l'arrivée progressive des coursiers
    setTimeout(() => {
      setConsultations(prev => [...prev, {
        id: '4',
        courier_id: '104',
        courier_name: 'Ouattara Aminata',
        courier_rating: 4.7,
        consultation_time: new Date().toISOString(),
        status: 'viewing',
        distance: 1.8
      }])
    }, 8000)

    setTimeout(() => {
      setConsultations(prev => [...prev, {
        id: '5',
        courier_id: '105',
        courier_name: 'Bamba Souleymane',
        courier_rating: 4.5,
        consultation_time: new Date().toISOString(),
        status: 'interested',
        distance: 1.8
      }])
    }, 15000)

    // Ajouter un coursier qui refuse
    setTimeout(() => {
      setConsultations(prev => [...prev, {
        id: '6',
        courier_id: '106',
        courier_name: 'Diallo Moussa',
        courier_rating: 4.3,
        consultation_time: new Date().toISOString(),
        status: 'not_interested',
        distance: 0.8
      }])
    }, 22000)
  }

  const simulateBids = () => {
    const mockBids: BidWithCourier[] = [
      {
        id: 1,
        delivery_id: parseInt(params.deliveryId),
        courier_id: 101,
        amount: 1200,
        estimated_time: 25,
        created_at: new Date().toISOString(),
        proposed_price: 1200,
        estimated_pickup_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courier: {
          id: '101',
          full_name: 'Kouassi Jean',
          phone: '+225 07 12 34 56 78',
          rating: 4.8,
          vehicle_type: 'motorcycle',
          distance: 0.8
        },
        status: 'pending'
      },
      {
        id: 2,
        delivery_id: parseInt(params.deliveryId),
        courier_id: 102,
        amount: 1100,
        estimated_time: 30,
        created_at: new Date().toISOString(),
        proposed_price: 1100,
        estimated_pickup_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courier: {
          id: '102',
          full_name: 'Traoré Fatou',
          phone: '+225 07 23 45 67 89',
          rating: 4.6,
          vehicle_type: 'car',
          distance: 1.2
        },
        status: 'pending'
      }
    ]

    setBids(mockBids)

    // Simuler l'arrivée progressive des offres
    setTimeout(() => {
      setBids(prev => [...prev, {
        id: 3,
        delivery_id: parseInt(params.deliveryId),
        courier_id: 103,
        amount: 1300,
        estimated_time: 20,
        created_at: new Date().toISOString(),
        proposed_price: 1300,
        estimated_pickup_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courier: {
          id: '103',
          full_name: 'Koné Mamadou',
          phone: '+225 07 34 56 78 90',
          rating: 4.9,
          vehicle_type: 'motorcycle',
          distance: 0.5
        },
        status: 'pending'
      }])
      setNewBids(prev => new Set([...prev, 3]))
      showInfoAlert('Nouvelle offre', 'Koné Mamadou a fait une offre de 1 300 FCFA')
      
      // Retirer l'indicateur de nouvelle offre après 5 secondes
      setTimeout(() => {
        setNewBids(prev => {
          const updated = new Set(prev)
          updated.delete(3)
          return updated
        })
      }, 5000)
    }, 12000)

    // Simuler une offre refusée
    setTimeout(() => {
      setBids(prev => prev.map(bid => 
        bid.id === 1 ? { ...bid, status: 'declined' as const } : bid
      ))
      showInfoAlert('Offre refusée', 'Kouassi Jean a refusé votre offre')
    }, 18000)

    // Simuler une contre-offre
    setTimeout(() => {
      setBids(prev => [...prev, {
        id: 5,
        delivery_id: parseInt(params.deliveryId),
        courier_id: 105,
        amount: 1400,
        estimated_time: 28,
        created_at: new Date().toISOString(),
        proposed_price: 1400,
        estimated_pickup_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courier: {
          id: '105',
          full_name: 'Bamba Souleymane',
          phone: '+225 07 56 78 90 12',
          rating: 4.5,
          vehicle_type: 'motorcycle',
          distance: 1.8
        },
        status: 'counter_offer'
      }])
      setNewBids(prev => new Set([...prev, 5]))
      showInfoAlert('Nouvelle contre-offre', 'Bamba Souleymane a fait une contre-offre de 1 400 FCFA')
      
      // Retirer l'indicateur de nouvelle offre après 5 secondes
      setTimeout(() => {
        setNewBids(prev => {
          const updated = new Set(prev)
          updated.delete(5)
          return updated
        })
      }, 5000)
    }, 25000)

    // Simuler une autre offre refusée
    setTimeout(() => {
      setBids(prev => prev.map(bid => 
        bid.id === 2 ? { ...bid, status: 'declined' as const } : bid
      ))
      showInfoAlert('Offre refusée', 'Traoré Fatou a refusé votre offre')
    }, 32000)

    // Simuler une contre-offre sur une offre existante
    setTimeout(() => {
      setBids(prev => prev.map(bid => 
        bid.id === 3 ? { ...bid, status: 'counter_offer' as const } : bid
      ))
      showInfoAlert('Contre-offre reçue', 'Koné Mamadou a fait une contre-offre')
    }, 40000)
  }

  const simulateRealTimeUpdates = () => {
    // Simuler des mises à jour en temps réel toutes les 30 secondes
    const updateInterval = setInterval(() => {
      setBids(prev => {
        const updatedBids = [...prev]
        let hasChanges = false
        
        // Simuler des changements aléatoires de statut
        updatedBids.forEach(bid => {
          if (bid.status === 'pending' && Math.random() < 0.1) {
            const newStatus = Math.random() < 0.5 ? 'counter_offer' : 'declined'
            bid.status = newStatus
            hasChanges = true
            
            // Afficher une notification
            if (newStatus === 'counter_offer') {
              showInfoAlert('Nouvelle contre-offre', `${bid.courier.full_name} a fait une contre-offre de ${formatPrice(bid.amount)}`)
            } else if (newStatus === 'declined') {
              showInfoAlert('Offre refusée', `${bid.courier.full_name} a refusé votre offre`)
            }
          }
        })
        
        return hasChanges ? updatedBids : prev
      })
    }, 30000)

    return () => clearInterval(updateInterval)
  }

  const handleAcceptBid = async (bid: BidWithCourier) => {
    try {
      await DeliveryService.acceptBid(params.deliveryId, bid.id)
      showSuccessAlert('Succès', `Vous avez accepté l'offre de ${bid.courier.full_name}`)
      
      // Mettre à jour le statut de la livraison
      setDelivery(prev => prev ? { ...prev, status: 'accepted' } : null)
      
      // Rediriger vers le suivi de livraison
      navigation.navigate('TrackDelivery', { deliveryId: params.deliveryId })
    } catch (error) {
      showErrorAlert('Erreur', 'Impossible d\'accepter cette offre')
    }
  }

  const handleDeclineBid = async (bid: BidWithCourier) => {
    Alert.alert(
      'Refuser l\'offre',
      `Êtes-vous sûr de vouloir refuser l'offre de ${bid.courier.full_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeliveryService.declineBid(params.deliveryId, bid.id)
              showInfoAlert('Offre refusée', `L'offre de ${bid.courier.full_name} a été refusée`)
              
              // Retirer l'offre de la liste
              setBids(prev => prev.filter(b => b.id !== bid.id))
            } catch (error) {
              showErrorAlert('Erreur', 'Impossible de refuser cette offre')
            }
          }
        }
      ]
    )
  }

  const handleCounterOffer = (bid: BidWithCourier) => {
    setSelectedBidForCounter(bid)
    setCounterOfferPrice(bid.amount.toString())
    setCounterOfferMessage('')
    setCounterOfferModalVisible(true)
  }

  const submitCounterOffer = async () => {
    if (!selectedBidForCounter || !counterOfferPrice) {
      showErrorAlert('Erreur', 'Veuillez saisir un prix valide')
      return
    }

    try {
      const newPrice = parseFloat(counterOfferPrice)
      if (isNaN(newPrice) || newPrice <= 0) {
        showErrorAlert('Erreur', 'Prix invalide')
        return
      }

      await DeliveryService.createCounterOffer(
        params.deliveryId,
        selectedBidForCounter.id,
        {
          proposed_price: newPrice,
          message: counterOfferMessage
        }
      )

      showSuccessAlert('Contre-offre envoyée', 'Votre contre-offre a été envoyée au coursier')
      setCounterOfferModalVisible(false)
      setSelectedBidForCounter(null)
      setCounterOfferPrice('')
      setCounterOfferMessage('')
      
      // Recharger les enchères
      await loadDeliveryData()
    } catch (error) {
      showErrorAlert('Erreur', 'Impossible d\'envoyer la contre-offre')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadDeliveryData()
      showSuccessAlert('Rafraîchi', 'Les données ont été mises à jour')
    } catch (error) {
      showErrorAlert('Erreur', 'Impossible de rafraîchir les données')
    } finally {
    hideLoader()
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'viewing': return '#2196F3'
      case 'interested': return '#4CAF50'
      case 'not_interested': return '#F44336'
      default: return '#666'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'viewing': return 'Consulte'
      case 'interested': return 'Intéressé'
      case 'not_interested': return 'Non intéressé'
      default: return 'Inconnu'
    }
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800'
      case 'accepted': return '#4CAF50'
      case 'declined': return '#F44336'
      case 'counter_offer': return '#9C27B0'
      default: return '#666'
    }
  }

  const getBidStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'accepted': return 'Acceptée'
      case 'declined': return 'Refusée'
      case 'counter_offer': return 'Contre-offre'
      default: return 'Inconnu'
    }
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Distance inconnue'
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  const handleModifyDelivery = () => {
    Alert.alert(
      'Modifier la livraison',
      'Voulez-vous modifier les détails de votre livraison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Modifier',
          onPress: () => {
            if (delivery) {
              navigation.navigate('CreateDelivery', { 
                isModification: true,
                deliveryData: {
                  id: delivery.id,
                  pickup_address: delivery.pickup_address,
                  delivery_address: delivery.delivery_address,
                  pickup_commune: delivery.pickup_commune || '',
                  delivery_commune: delivery.delivery_commune || '',
                  pickup_lat: delivery.pickup_lat,
                  pickup_lng: delivery.pickup_lng,
                  delivery_lat: delivery.delivery_lat,
                  delivery_lng: delivery.delivery_lng,
                  package_description: delivery.package_description || '',
                  package_size: delivery.package_type || '',
                  package_weight: delivery.package_weight || 0,
                  is_fragile: delivery.is_fragile || false,
                  proposed_price: delivery.proposed_price,
                  delivery_type: 'standard'
                }
              })
            } else {
              showErrorAlert('Erreur', 'Impossible de récupérer les données de la livraison')
            }
          }
        }
      ]
    )
  }

  const handleCancelDelivery = () => {
    Alert.alert(
      'Annuler la livraison',
      'Êtes-vous sûr de vouloir annuler cette livraison ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeliveryService.cancelDelivery(params.deliveryId)
              showSuccessAlert('Livraison annulée', 'Votre livraison a été annulée avec succès')
              navigation.goBack()
            } catch (error) {
              showErrorAlert('Erreur', 'Impossible d\'annuler la livraison')
            }
          }
        }
      ]
    )
  }

  if (searchingCouriers) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.searchingTitle}>Recherche de coursiers</Text>
          <Text style={styles.searchingSubtitle}>
            Nous cherchons les meilleurs coursiers pour votre livraison...
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${searchProgress * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(searchProgress * 100)}%
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <Surface style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Propositions de prix</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setSortByDistance(!sortByDistance)}
              style={styles.sortButton}
            >
              <MaterialIcons 
                name={sortByDistance ? "sort" : "sort-by-alpha"} 
                size={20} 
                color="#FF6B35" 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh}>
              <MaterialIcons name="refresh" size={24} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </Surface>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Informations de la livraison */}
          {delivery && (
            <Card style={styles.deliveryCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Détails de la livraison</Text>
                <View style={styles.deliveryInfo}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {delivery.pickup_address} → {delivery.delivery_address}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="attach-money" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      Prix proposé: {formatPrice(delivery.proposed_price)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="access-time" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      Créée le {formatDate(delivery.created_at)}
                    </Text>
                  </View>
                </View>
                
                
                {/* Boutons d'action pour modifier/annuler */}
                {!deliveryTimeout && !bids.some(bid => bid.status === 'accepted') && (
                  <View style={styles.deliveryActions}>
                    <Button
                      mode="outlined"
                      onPress={handleModifyDelivery}
                      style={[styles.modifyButton, { borderColor: '#FF6B35' }]}
                      textColor="#FF6B35"
                      icon={() => <MaterialIcons name="edit" size={20} color="#FF6B35" />}
                    >
                      Modifier
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={handleCancelDelivery}
                      style={styles.cancelButton}
                      textColor="#F44336"
                      icon={() => <MaterialIcons name="close" size={20} color="#F44336" />}
                    >
                      Annuler
                    </Button>
                  </View>
                )}

                {/* Message de timeout */}
                {showTimeoutMessage && (
                  <View style={styles.timeoutContainer}>
                    <MaterialIcons name="schedule" size={48} color="#F44336" />
                    <Text style={styles.timeoutTitle}>Aucun livreur trouvé</Text>
                    <Text style={styles.timeoutMessage}>
                      Après 2 minutes d'attente, aucun coursier n'a accepté votre livraison.
                    </Text>
                    <Text style={styles.timeoutSuggestion}>
                      Veuillez réessayer plus tard ou modifier vos critères.
                    </Text>
                    <View style={styles.timeoutActions}>
                      <Button
                        mode="contained"
                        onPress={handleModifyDelivery}
                        style={styles.retryButton}
                      >
                        Modifier et réessayer
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={handleCancelDelivery}
                        style={styles.cancelTimeoutButton}
                        textColor="#F44336"
                      >
                        Annuler la livraison
                      </Button>
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Coursiers qui consultent */}
          <Card style={styles.consultationsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Coursiers qui consultent ({consultations.length})
              </Text>
              <Text style={styles.sectionSubtitle}>
                Ces coursiers ont vu votre livraison et pourraient faire une offre
              </Text>
              
              {consultations.map((consultation) => (
                <View key={consultation.id} style={styles.consultationItem}>
                  <Avatar.Text 
                    size={40} 
                    label={consultation.courier_name.split(' ').map(n => n[0]).join('')} 
                  />
                  <View style={styles.consultationInfo}>
                    <Text style={styles.courierName}>{consultation.courier_name}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>{consultation.courier_rating}</Text>
                    </View>
                    <View style={styles.distanceContainer}>
                      <MaterialIcons name="location-on" size={12} color="#666" />
                      <Text style={styles.distanceText}>
                        {formatDistance(consultation.distance)}
                      </Text>
                    </View>
                  </View>
                  <Chip 
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(consultation.status) }
                    ]}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(consultation.status)}
                  </Chip>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Propositions reçues */}
          <Card style={styles.bidsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Propositions reçues ({bids.length})
              </Text>
              
              {bids.length === 0 ? (
                <View style={styles.noBidsContainer}>
                  <MaterialIcons name="local-offer" size={48} color="#ccc" />
                  <Text style={styles.noBidsText}>Aucune proposition pour le moment</Text>
                  <Text style={styles.noBidsSubtext}>
                    Les coursiers peuvent encore faire des offres
                  </Text>
                </View>
              ) : (
                getSortedBids().map((bid) => (
                  <View key={bid.id} style={[
                    styles.bidItem,
                    bid.status === 'declined' && styles.declinedBidItem,
                    newBids.has(bid.id) && styles.newBidItem
                  ]}>
                    {newBids.has(bid.id) && (
                      <View style={styles.newBidBadge}>
                        <Text style={styles.newBidBadgeText}>NOUVEAU</Text>
                      </View>
                    )}
                    <View style={styles.bidHeader}>
                      <Avatar.Text 
                        size={40} 
                        label={bid.courier.full_name.split(' ').map(n => n[0]).join('')} 
                      />
                      <View style={styles.bidInfo}>
                        <Text style={styles.courierName}>{bid.courier.full_name}</Text>
                        <View style={styles.ratingContainer}>
                          <MaterialIcons name="star" size={14} color="#FFD700" />
                          <Text style={styles.ratingText}>{bid.courier.rating}</Text>
                        </View>
                        <Text style={styles.vehicleType}>{bid.courier.vehicle_type}</Text>
                        <View style={styles.distanceContainer}>
                          <MaterialIcons name="location-on" size={12} color="#666" />
                          <Text style={styles.distanceText}>
                            {formatDistance(bid.courier.distance)}
                          </Text>
                        </View>
                        {bid.status !== 'pending' && (
                          <Chip 
                            style={[
                              styles.statusChip,
                              { backgroundColor: getBidStatusColor(bid.status) }
                            ]}
                            textStyle={{ color: 'white', fontSize: 10 }}
                          >
                            {getBidStatusText(bid.status)}
                          </Chip>
                        )}
                      </View>
                      <View style={styles.bidPrice}>
                        <Text style={[
                          styles.priceText,
                          bid.status === 'declined' && styles.declinedPriceText
                        ]}>
                          {formatPrice(bid.amount)}
                        </Text>
                        <Text style={styles.priceLabel}>Offre</Text>
                        {bid.estimated_time && (
                          <Text style={styles.estimatedTime}>
                            ~{bid.estimated_time} min
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {bid.status === 'pending' && (
                      <View style={styles.bidActions}>
                        <Button
                          mode="outlined"
                          onPress={() => handleCounterOffer(bid)}
                          style={styles.actionButton}
                        >
                          Contre-offre
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleDeclineBid(bid)}
                          style={[styles.actionButton, styles.declineButton]}
                          textColor="#F44336"
                        >
                          Refuser
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => handleAcceptBid(bid)}
                          style={[styles.actionButton, styles.acceptButton]}
                        >
                          Accepter
                        </Button>
                      </View>
                    )}
                    
                    {bid.status === 'counter_offer' && (
                      <View style={styles.bidActions}>
                        <Text style={styles.counterOfferText}>
                          💬 Ce coursier a fait une contre-offre
                        </Text>
                        <Button
                          mode="outlined"
                          onPress={() => handleCounterOffer(bid)}
                          style={styles.actionButton}
                        >
                          Répondre
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleDeclineBid(bid)}
                          style={[styles.actionButton, styles.declineButton]}
                          textColor="#F44336"
                        >
                          Refuser
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => handleAcceptBid(bid)}
                          style={[styles.actionButton, styles.acceptButton]}
                        >
                          Accepter
                        </Button>
                      </View>
                    )}
                    
                    {bid.status === 'declined' && (
                      <View style={styles.declinedBidInfo}>
                        <Text style={styles.declinedText}>
                          ❌ Cette offre a été refusée
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Modal de contre-offre */}
        <Modal
          visible={counterOfferModalVisible}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Faire une contre-offre</Text>
              <Text style={styles.modalSubtitle}>
                Proposez un nouveau prix à {selectedBidForCounter?.courier.full_name}
              </Text>
              
              <TextInput
                style={styles.counterOfferInput}
                placeholder="Montant en FCFA"
                keyboardType="numeric"
                value={counterOfferPrice}
                onChangeText={setCounterOfferPrice}
              />
              
              <TextInput
                style={styles.counterOfferMessageInput}
                placeholder="Message (optionnel)"
                value={counterOfferMessage}
                onChangeText={setCounterOfferMessage}
              />
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setCounterOfferModalVisible(false)}
                  style={styles.modalButton}
                >
                  Annuler
                </Button>
                <Button
                  mode="contained"
                  onPress={submitCounterOffer}
                  style={styles.modalButton}
                >
                  Envoyer
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    
      {/* Composants d'alerte modernes */}
      

      
</SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  deliveryCard: {
    marginBottom: 16,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  deliveryInfo: {
    gap: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  consultationsCard: {
    marginBottom: 16,
    elevation: 2
  },
  consultationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  consultationInfo: {
    flex: 1,
    marginLeft: 12
  },
  courierName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  statusChip: {
    marginLeft: 8
  },
  bidsCard: {
    marginBottom: 16,
    elevation: 2
  },
  noBidsContainer: {
    alignItems: 'center',
    paddingVertical: 32
  },
  noBidsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12
  },
  noBidsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4
  },
  bidItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  bidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  bidInfo: {
    flex: 1,
    marginLeft: 12
  },
  vehicleType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  bidPrice: {
    alignItems: 'center'
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50'
  },
  priceLabel: {
    fontSize: 12,
    color: '#666'
  },
  bidActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8
  },
  actionButton: {
    flex: 1
  },
  declineButton: {
    borderColor: '#F44336'
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center'
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B35',
    marginTop: 8
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24
  },
  counterOfferInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24
  },
  counterOfferMessageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1
  },
  declinedBidItem: {
    backgroundColor: '#FFEBEB'
  },
  declinedPriceText: {
    color: '#F44336'
  },
  declinedBidInfo: {
    padding: 12,
    backgroundColor: '#FFEBEB',
    borderRadius: 8
  },
  declinedText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500'
  },
  counterOfferText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  estimatedTime: {
    fontSize: 12,
    color: '#666'
  },
  newBidItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    paddingLeft: 12
  },
  newBidBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 4,
    borderRadius: 4
  },
  newBidBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white'
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sortButton: {
    padding: 8
  },
  deliveryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8
  },
  modifyButton: {
    flex: 1
  },
  cancelButton: {
    flex: 1
  },
  timeoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  timeoutTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16
  },
  timeoutMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32
  },
  timeoutSuggestion: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32
  },
  timeoutActions: {
    flexDirection: 'row',
    gap: 12
  },
  retryButton: {
    flex: 1
  },
  cancelTimeoutButton: {
    flex: 1
  }
})

export default BidScreen 