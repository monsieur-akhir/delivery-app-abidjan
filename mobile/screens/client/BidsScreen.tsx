
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Chip,
  Surface,
  IconButton,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import StarRating from '../../components/StarRating';
import { formatCurrency, formatDuration } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2196F3',
  secondary: '#FFC107',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  text: '#333333',
  textSecondary: '#666666',
  background: '#F5F5F5',
  white: '#FFFFFF',
  shadow: '#000000',
  border: '#E0E0E0',
};

interface Bid {
  id: string;
  courierId: string;
  courierName: string;
  courierPhoto?: string;
  courierRating: number;
  courierDeliveries: number;
  price: number;
  estimatedDuration: number;
  vehicleType: string;
  isOnline: boolean;
  distance: number;
  specialOffer?: string;
  arrivalTime: string;
}

interface BidsScreenProps {}

const BidsScreen: React.FC<BidsScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryRequest } = route.params as any;

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Simulation de chargement des offres de coursiers
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées des offres
      const mockBids: Bid[] = [
        {
          id: '1',
          courierId: 'courier_1',
          courierName: 'Kouamé Jean',
          courierPhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
          courierRating: 4.8,
          courierDeliveries: 127,
          price: deliveryRequest.estimatedPrice - 200,
          estimatedDuration: 25,
          vehicleType: 'Moto',
          isOnline: true,
          distance: 2.3,
          arrivalTime: '5 min',
          specialOffer: 'Livraison express gratuite'
        },
        {
          id: '2',
          courierId: 'courier_2',
          courierName: 'Fatou Sanogo',
          courierPhoto: 'https://randomuser.me/api/portraits/women/2.jpg',
          courierRating: 4.9,
          courierDeliveries: 203,
          price: deliveryRequest.estimatedPrice,
          estimatedDuration: 20,
          vehicleType: 'Scooter',
          isOnline: true,
          distance: 1.8,
          arrivalTime: '3 min'
        },
        {
          id: '3',
          courierId: 'courier_3',
          courierName: 'Mamadou Traoré',
          courierPhoto: 'https://randomuser.me/api/portraits/men/3.jpg',
          courierRating: 4.7,
          courierDeliveries: 89,
          price: deliveryRequest.estimatedPrice + 300,
          estimatedDuration: 15,
          vehicleType: 'Voiture',
          isOnline: true,
          distance: 3.1,
          arrivalTime: '8 min',
          specialOffer: 'Service premium'
        },
        {
          id: '4',
          courierId: 'courier_4',
          courierName: 'Aissatou Diallo',
          courierPhoto: 'https://randomuser.me/api/portraits/women/4.jpg',
          courierRating: 4.6,
          courierDeliveries: 156,
          price: deliveryRequest.estimatedPrice - 100,
          estimatedDuration: 30,
          vehicleType: 'Vélo',
          isOnline: true,
          distance: 1.5,
          arrivalTime: '2 min'
        }
      ];

      setBids(mockBids.sort((a, b) => a.price - b.price));
    } catch (error) {
      console.error('Erreur lors du chargement des offres:', error);
      Alert.alert('Erreur', 'Impossible de charger les offres. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    Alert.alert(
      'Confirmer la sélection',
      `Voulez-vous accepter l'offre de ${bid.courierName} pour ${formatCurrency(bid.price)} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Accepter',
          onPress: async () => {
            setAcceptingBid(bid.id);
            
            try {
              // Simulation de l'acceptation de l'offre
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Redirection vers l'écran de suivi
              navigation.replace('EnhancedTrackDeliveryScreen', {
                deliveryId: 'delivery_' + Date.now(),
                delivery: {
                  id: 'delivery_' + Date.now(),
                  ...deliveryRequest,
                  courier: {
                    id: bid.courierId,
                    name: bid.courierName,
                    photo: bid.courierPhoto,
                    rating: bid.courierRating,
                    phone: '+225 07 00 00 00 00',
                    vehicleType: bid.vehicleType
                  },
                  finalPrice: bid.price,
                  estimatedDuration: bid.estimatedDuration,
                  status: 'assigned',
                  courierArrivalTime: bid.arrivalTime,
                  createdAt: new Date().toISOString()
                }
              });
            } catch (error) {
              console.error('Erreur lors de l\'acceptation:', error);
              Alert.alert('Erreur', 'Impossible d\'accepter l\'offre. Veuillez réessayer.');
            } finally {
              setAcceptingBid(null);
            }
          }
        }
      ]
    );
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'moto':
        return 'motorcycle';
      case 'scooter':
        return 'scooter';
      case 'voiture':
        return 'car-sport';
      case 'vélo':
        return 'bicycle';
      default:
        return 'car';
    }
  };

  const renderBidCard = (bid: Bid, index: number) => (
    <Card key={bid.id} style={[styles.bidCard, index === 0 && styles.bestOfferCard]}>
      <Card.Content>
        {index === 0 && (
          <View style={styles.bestOfferBadge}>
            <Chip
              icon="star"
              style={styles.bestOfferChip}
              textStyle={styles.bestOfferText}
            >
              Meilleure offre
            </Chip>
          </View>
        )}

        <View style={styles.courierHeader}>
          <Avatar.Image
            size={60}
            source={{ uri: bid.courierPhoto || 'https://via.placeholder.com/60' }}
          />
          
          <View style={styles.courierInfo}>
            <View style={styles.courierNameRow}>
              <Text style={styles.courierName}>{bid.courierName}</Text>
              {bid.isOnline && (
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>En ligne</Text>
                </View>
              )}
            </View>
            
            <View style={styles.courierStats}>
              <StarRating rating={bid.courierRating} size={16} />
              <Text style={styles.ratingText}>
                {bid.courierRating} ({bid.courierDeliveries} livraisons)
              </Text>
            </View>
            
            <View style={styles.vehicleInfo}>
              <Ionicons 
                name={getVehicleIcon(bid.vehicleType)} 
                size={16} 
                color={COLORS.textSecondary} 
              />
              <Text style={styles.vehicleText}>{bid.vehicleType}</Text>
              <Text style={styles.distanceText}>• {bid.distance} km</Text>
              <Text style={styles.arrivalText}>• Arrivée: {bid.arrivalTime}</Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.offerDetails}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Prix de la course</Text>
            <Text style={styles.priceValue}>{formatCurrency(bid.price)}</Text>
          </View>
          
          <View style={styles.durationSection}>
            <Text style={styles.durationLabel}>Durée estimée</Text>
            <Text style={styles.durationValue}>{formatDuration(bid.estimatedDuration)}</Text>
          </View>
        </View>

        {bid.specialOffer && (
          <View style={styles.specialOfferContainer}>
            <Chip
              icon="gift"
              style={styles.specialOfferChip}
              textStyle={styles.specialOfferText}
            >
              {bid.specialOffer}
            </Chip>
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => handleAcceptBid(bid)}
          disabled={acceptingBid !== null}
          loading={acceptingBid === bid.id}
          style={[styles.acceptButton, index === 0 && styles.bestOfferButton]}
          contentStyle={styles.acceptButtonContent}
          labelStyle={styles.acceptButtonLabel}
        >
          {acceptingBid === bid.id ? 'Confirmation...' : 'Accepter cette offre'}
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text style={styles.headerTitle}>Propositions de coursiers</Text>
            <View style={{ width: 40 }} />
          </View>
        </Surface>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des offres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Propositions de coursiers</Text>
          <View style={{ width: 40 }} />
        </View>
      </Surface>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBids(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Résumé de votre demande</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="radio-button-on" size={16} color={COLORS.primary} />
              <Text style={styles.summaryText}>
                {deliveryRequest.pickup?.description}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="location" size={16} color={COLORS.success} />
              <Text style={styles.summaryText}>
                {deliveryRequest.delivery?.description}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="person" size={16} color={COLORS.textSecondary} />
              <Text style={styles.summaryText}>
                {deliveryRequest.recipientName} • {deliveryRequest.recipientPhone}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Text style={styles.bidsTitle}>
          {bids.length} coursier{bids.length > 1 ? 's' : ''} disponible{bids.length > 1 ? 's' : ''}
        </Text>

        {bids.map((bid, index) => renderBidCard(bid, index))}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  bidsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  bidCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  bestOfferCard: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  bestOfferBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    zIndex: 1,
  },
  bestOfferChip: {
    backgroundColor: COLORS.success,
  },
  bestOfferText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  courierHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  courierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  courierStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  arrivalText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  durationSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  durationLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  specialOfferContainer: {
    marginBottom: 16,
  },
  specialOfferChip: {
    backgroundColor: COLORS.warning,
    alignSelf: 'flex-start',
  },
  specialOfferText: {
    color: COLORS.white,
    fontSize: 12,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  bestOfferButton: {
    backgroundColor: COLORS.success,
  },
  acceptButtonContent: {
    paddingVertical: 8,
  },
  acceptButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 32,
  },
});

export default BidsScreen;
