
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../styles/colors';
import MultiDestinationService from '../../services/MultiDestinationService';
import { MultiDestinationActions, CustomLoaderModal } from '../../components';

const { width, height } = Dimensions.get('window');

interface MultiDestinationDelivery {
  id: number;
  title: string;
  total_price: number;
  status: string;
  pickup_location: string;
  pickup_address: string;
  created_at: string;
  destinations: Array<{
    id: number;
    address: string;
    contact_name: string;
    contact_phone: string;
    status: string;
    delivery_notes?: string;
  }>;
  bids?: Array<{
    id: number;
    courier_name: string;
    amount: number;
    estimated_time: string;
    status: string;
  }>;
}

const MultiDestinationDeliveryDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<MultiDestinationDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const deliveryId = route.params?.deliveryId;

  useEffect(() => {
    if (deliveryId) {
      loadDeliveryDetails();
      startAnimations();
    }
  }, [deliveryId]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true);
      const data = await MultiDestinationService.getDeliveryById(deliveryId);
      setDelivery(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveryDetails();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'in_progress': return '#42A5F5';
      case 'completed': return '#66BB6A';
      case 'cancelled': return '#EF5350';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const renderStatusBadge = (status: string) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusText}>{getStatusText(status)}</Text>
    </View>
  );

  const renderDestinationCard = (destination: any, index: number) => (
    <Animated.View 
      key={destination.id}
      style={[
        styles.destinationCard,
        {
          opacity: fadeAnim,
          transform: [{ 
            translateY: slideAnim.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 30 + (index * 10)],
            })
          }],
        },
      ]}
    >
      <View style={styles.destinationHeader}>
        <View style={styles.destinationNumber}>
          <Text style={styles.destinationNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.destinationInfo}>
          <Text style={styles.destinationAddress} numberOfLines={2}>
            {destination.address}
          </Text>
          {renderStatusBadge(destination.status)}
        </View>
      </View>

      <View style={styles.destinationDetails}>
        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.contactText}>{destination.contact_name}</Text>
          </View>
          <TouchableOpacity style={styles.phoneButton}>
            <Ionicons name="call-outline" size={16} color={colors.orange} />
            <Text style={styles.phoneText}>{destination.contact_phone}</Text>
          </TouchableOpacity>
        </View>

        {destination.delivery_notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.notesText}>{destination.delivery_notes}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#999" />
        <Text style={styles.errorText}>Livraison introuvable</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.orange} />
      
      {/* Header avec gradient amélioré */}
      <LinearGradient
        colors={['#FF6B35', '#FF8A50', '#FFA726']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Détails de la livraison</Text>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Carte principale améliorée */}
        <Animated.View 
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.priceContainer}>
            <View style={styles.priceWrapper}>
              <MaterialIcons name="payments" size={24} color={colors.orange} />
              <Text style={styles.priceAmount}>{delivery.total_price.toLocaleString()} FCFA</Text>
            </View>
            {renderStatusBadge(delivery.status)}
          </View>

          <View style={styles.deliveryInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{delivery.destinations.length} destination(s)</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText} numberOfLines={2}>
                Point de ramassage : {delivery.pickup_address}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                Créée le {new Date(delivery.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Section destinations améliorée */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flag-outline" size={22} color={colors.orange} />
              <Text style={styles.sectionTitle}>
                Destinations ({delivery.destinations.length})
              </Text>
            </View>
          </View>

          <View style={styles.destinationsContainer}>
            {delivery.destinations.map((destination, index) => 
              renderDestinationCard(destination, index)
            )}
          </View>
        </Animated.View>

        {/* Section enchères */}
        {delivery.bids && delivery.bids.length > 0 && (
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="hammer-outline" size={22} color={colors.orange} />
                <Text style={styles.sectionTitle}>
                  Enchères ({delivery.bids.length})
                </Text>
              </View>
            </View>

            <View style={styles.bidsContainer}>
              {delivery.bids.map((bid, index) => (
                <View key={bid.id} style={styles.bidCard}>
                  <View style={styles.bidHeader}>
                    <Text style={styles.courierName}>{bid.courier_name}</Text>
                    <Text style={styles.bidAmount}>{bid.amount.toLocaleString()} FCFA</Text>
                  </View>
                  <View style={styles.bidDetails}>
                    <Text style={styles.bidTime}>Temps estimé: {bid.estimated_time}</Text>
                    {renderStatusBadge(bid.status)}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Actions en bas */}
        <Animated.View 
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <MultiDestinationActions 
            delivery={delivery}
            onUpdate={loadDeliveryDetails}
          />
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Message d'erreur en bas */}
      <View style={styles.errorContainer}>
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#F44336" />
          <Text style={styles.errorBannerText}>
            Erreur lors de la récupération des enchères...
          </Text>
          <TouchableOpacity style={styles.closeErrorButton}>
            <Ionicons name="close" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Boutons d'action flottants */}
      <View style={styles.floatingActions}>
        <TouchableOpacity style={styles.modifyButton}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton}>
          <Ionicons name="close-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header amélioré
  header: {
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },

  // Contenu principal
  scrollView: {
    flex: 1,
    marginTop: -20,
  },

  // Carte principale redesignée
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  deliveryInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },

  // Status badges améliorés
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Sections
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 12,
  },

  // Cartes destinations redesignées
  destinationsContainer: {
    gap: 16,
  },
  destinationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  destinationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  destinationNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  destinationInfo: {
    flex: 1,
    gap: 8,
  },
  destinationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 22,
  },
  destinationDetails: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  phoneText: {
    fontSize: 14,
    color: colors.orange,
    fontWeight: '600',
    marginLeft: 6,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },

  // Section enchères
  bidsContainer: {
    gap: 12,
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.orange,
  },
  bidDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidTime: {
    fontSize: 14,
    color: '#666',
  },

  // Actions
  actionsContainer: {
    marginTop: 32,
    marginHorizontal: 16,
  },

  // Erreur banner
  errorContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#F44336',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  closeErrorButton: {
    padding: 4,
  },

  // Boutons d'action flottants
  floatingActions: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  modifyButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  bottomSpacing: {
    height: 140,
  },
});

export default MultiDestinationDeliveryDetailsScreen;
