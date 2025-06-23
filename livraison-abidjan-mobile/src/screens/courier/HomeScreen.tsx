import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  Avatar, 
  Badge, 
  Switch, 
  Chip, 
  ActivityIndicator, 
  ProgressBar,
  Button,
  Surface
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import DeliveryService from '../../services/DeliveryService';

import { useAuth } from '../../hooks/useAuth';
import { useDelivery } from '../../hooks/useDelivery';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatPrice, formatDate } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;

type CourierHomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Types pour les demandes de livraison
interface DeliveryRequest {
  delivery_id: string
  pickup_address: string
  delivery_address: string
  pickup_commune: string
  delivery_commune: string
  proposed_price: number
  distance: string
  estimated_duration: number
  package_type: string
  client_name: string
  urgency: string
  created_at: string
}

export default function CourierHomeScreen() {
  const navigation = useNavigation<CourierHomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { connected } = useWebSocket();
  const { deliveries, isLoading } = useDelivery();

  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    earnings: 15000,
    deliveries: 8,
    distance: 65,
    rating: 4.7,
    hours: 6,
    targetEarnings: 25000
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showAlert, setShowAlert] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alertsList, setAlertsList] = useState<DeliveryRequest[]>([]);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);

  useEffect(() => {
    loadDashboardData();
    startAnimations();
  }, []);

  useEffect(() => {
    // Simuler la réception de nouvelles demandes de course
    const simulateNewDelivery = () => {
      const newDelivery = {
        delivery_id: Math.random().toString(36).substring(7),
        pickup_address: '123 Main St, Plateau',
        delivery_address: '456 Elm St, Cocody',
        pickup_commune: 'Plateau',
        delivery_commune: 'Cocody',
        proposed_price: Math.floor(Math.random() * 10000) + 5000,
        distance: (Math.random() * 20 + 2).toFixed(1),
        estimated_duration: Math.floor(Math.random() * 30 + 10),
        package_type: ['Standard', 'Fragile', 'Express'][Math.floor(Math.random() * 3)],
        client_name: 'Client ' + Math.floor(Math.random() * 100),
        urgency: Math.random() > 0.7 ? 'urgent' : 'normal',
        created_at: new Date().toISOString(),
      };

      setAlertsList(prev => [newDelivery, ...prev.slice(0, 4)]); // Garder max 5 alertes
    };

    // Ajouter quelques alertes initiales
    setTimeout(() => {
      simulateNewDelivery();
      simulateNewDelivery();
    }, 2000);

    const intervalId = setInterval(simulateNewDelivery, 20000);

    return () => clearInterval(intervalId);
  }, []);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simuler le chargement des données
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    // Implémentation de la logique de statut en ligne
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      await DeliveryService.acceptDelivery(deliveryId);
      Alert.alert('Succès', 'Livraison acceptée avec succès');
      setAlertsList(prev => prev.filter(alert => alert.delivery_id !== deliveryId));
      setShowDetailModal(false);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'acceptation de la livraison');
    }
  };

  const handleRejectDelivery = async (deliveryId: string) => {
    Alert.alert('Ignorer', 'Demande ignorée');
    setAlertsList(prev => prev.filter(alert => alert.delivery_id !== deliveryId));
    setShowDetailModal(false);
  };

  const handleCounterOffer = async (deliveryId: string) => {
    Alert.alert('Contre-offre', 'Fonctionnalité de contre-offre bientôt disponible');
    setShowDetailModal(false);
  };

  const handleViewDetails = (delivery: DeliveryRequest) => {
    setSelectedDelivery(delivery);
    setShowDetailModal(true);
  };

  const removeAlert = (deliveryId: string) => {
    setAlertsList(prev => prev.filter(alert => alert.delivery_id !== deliveryId));
  };


  const quickActions = [
    {
      id: 'available',
      title: 'Livraisons disponibles',
      subtitle: '12 nouvelles',
      icon: 'package-variant-closed',
      color: '#4CAF50',
      screen: 'AvailableDeliveries'
    },
    {
      id: 'express',
      title: 'Express',
      subtitle: 'Gains élevés',
      icon: 'flash',
      color: '#FF6B00',
      screen: 'ExpressDeliveries' as const
    },
    {
      id: 'collaborative',
      title: 'Collaboratives',
      subtitle: 'Partagées',
      icon: 'account-group',
      color: '#9C27B0',
      screen: 'CollaborativeDeliveries'
    },
    {
      id: 'scheduled',
      title: 'Planifiées',
      subtitle: 'Programmées',
      icon: 'calendar-clock',
      color: '#2196F3',
      screen: 'CourierScheduledDeliveries'
    }
  ] as const;

  const statsData = [
    {
      label: 'Livraisons',
      value: todayStats.deliveries,
      target: 15,
      icon: 'package-variant',
      color: '#4CAF50'
    },
    {
      label: 'Distance',
      value: todayStats.distance,
      target: 100,
      icon: 'map-marker-distance',
      color: '#2196F3',
      unit: 'km'
    },
    {
      label: 'Temps actif',
      value: todayStats.hours,
      target: 8,
      icon: 'clock',
      color: '#FF9800',
      unit: 'h'
    }
  ];

  const serviceItems = [
    { title: 'Revenus', icon: 'cash', color: '#4CAF50', screen: 'CourierEarnings' },
    { title: 'Véhicules', icon: 'car', color: '#2196F3', screen: 'VehicleManagement' },
    { title: 'Statistiques', icon: 'chart-line', color: '#9C27B0', screen: 'CourierStats' },
    { title: 'Récompenses', icon: 'trophy', color: '#FF9800', screen: 'Gamification' }
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => navigation.navigate('CourierProfile')}>
            <Avatar.Text 
              size={48} 
              label={
                user?.full_name
                  ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
                  : 'C'
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.welcomeText}>
            <Text style={styles.greetingText}>Bonjour coursier</Text>
            <Text style={styles.userName}>
              {user?.full_name || user?.first_name || 'Coursier'}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.statusText}>
                {connected ? 'Connecté' : 'Déconnecté'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={styles.onlineToggle}>
            <Text style={[styles.onlineText, { color: isOnline ? '#4CAF50' : '#666' }]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              thumbColor={isOnline ? '#4CAF50' : '#f4f3f4'}
              trackColor={{ false: '#767577', true: '#4CAF5081' }}
            />
          </View>

          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
            <Badge style={styles.notificationBadge} size={8} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEarningsCard = () => {
    const progress = todayStats.targetEarnings > 0 ? todayStats.earnings / todayStats.targetEarnings : 0;

    return (
      <Card style={styles.earningsCard}>
        <Card.Content style={styles.earningsContent}>
          <View style={styles.earningsHeader}>
            <View>
              <Text style={styles.earningsLabel}>Revenus aujourd'hui</Text>
              <Text style={styles.earningsValue}>{formatPrice(todayStats.earnings)} FCFA</Text>
            </View>
            <View style={styles.ratingSection}>
              <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
              <Text style={styles.ratingText}>{todayStats.rating}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Objectif: {formatPrice(todayStats.targetEarnings)} FCFA</Text>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
            <ProgressBar 
              progress={progress} 
              color="#4CAF50" 
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderStatsCards = () => (
    <View style={styles.statsGrid}>
      {statsData.map((stat, index) => {
        const progress = stat.target > 0 ? stat.value / stat.target : 0;

        return (
          <Card key={index} style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                  <MaterialCommunityIcons 
                    name={stat.icon} 
                    size={20} 
                    color={stat.color} 
                  />
                </View>
                <Text style={styles.statValue}>
                  {stat.value}{stat.unit || ''}
                </Text>
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <ProgressBar 
                progress={progress} 
                color={stat.color} 
                style={styles.statProgress}
              />
              <Text style={styles.statTarget}>/{stat.target}{stat.unit || ''}</Text>
            </Card.Content>
          </Card>
        );
      })}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsGrid}>
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.quickActionCard}
          onPress={() => navigation.navigate(action.screen as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
            <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
          </View>
          <Text style={styles.quickActionTitle}>{action.title}</Text>
          <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mes services</Text>
      <View style={styles.servicesGrid}>
        {serviceItems.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={styles.serviceItem}
            onPress={() => navigation.navigate(service.screen as any)}
          >
            <Surface style={[styles.serviceIcon, { backgroundColor: service.color + '15' }]} elevation={0}>
              <MaterialCommunityIcons 
                name={service.icon} 
                size={24} 
                color={service.color} 
              />
            </Surface>
            <Text style={styles.serviceText}>{service.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSummaryCard = () => {
    const commission = todayStats.earnings * 0.1;
    const netEarnings = todayStats.earnings - commission;

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Résumé financier</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Revenus bruts</Text>
              <Text style={styles.summaryValue}>{formatPrice(todayStats.earnings)} FCFA</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Commission (10%)</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                -{formatPrice(commission)} FCFA
              </Text>
            </View>
          </View>

          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Net à recevoir</Text>
            <Text style={styles.summaryTotalValue}>
              {formatPrice(netEarnings)} FCFA
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDeliveryAlerts = () => {
    if (alertsList.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.alertsHeader}>
          <Text style={styles.sectionTitle}>Nouvelles demandes ({alertsList.length})</Text>
          <TouchableOpacity 
            onPress={() => setAlertsList([])}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>

        {alertsList.map((alert, index) => (
          <Surface key={alert.delivery_id} style={styles.alertItem} elevation={2}>
            <View style={styles.alertContent}>
              <View style={styles.alertHeader}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertPrice}>{alert.proposed_price?.toLocaleString()} FCFA</Text>
                  <View style={styles.alertMeta}>
                    <Text style={styles.alertDistance}>{alert.distance} km</Text>
                    <Text style={styles.alertDuration}>• {alert.estimated_duration} min</Text>
                    {alert.urgency === 'urgent' && (
                      <Chip 
                        style={styles.urgentChip} 
                        textStyle={styles.urgentChipText}
                        compact
                      >
                        Urgent
                      </Chip>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => removeAlert(alert.delivery_id)}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="circle-outline" size={12} color="#4CAF50" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {alert.pickup_commune}
                  </Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={12} color="#666" />
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={12} color="#F44336" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {alert.delivery_commune}
                  </Text>
                </View>
              </View>

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectDelivery(alert.delivery_id)}
                >
                  <Text style={styles.rejectButtonText}>{t('alerts.ignore')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleViewDetails(alert)}
                >
                  <Text style={styles.detailsButtonText}>Détails</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptDelivery(alert.delivery_id)}
                >
                  <Text style={styles.acceptButtonText}>{t('alerts.accept')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        ))}
      </View>
    );
  };

  const renderRecentDeliveries = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      );
    }

    if (!deliveries || deliveries.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune livraison récente</Text>
        </View>
      );
    }
    // ... existing code ...
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderEarningsCard()}
          {renderStatsCards()}
          {renderQuickActions()}
          {renderDeliveryAlerts()}
          {renderServices()}
          {renderSummaryCard()}
          {renderRecentDeliveries()}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AvailableDeliveries')}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de détails de livraison */}
      <Modal
        visible={showDetailModal && selectedDelivery !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de la livraison</Text>
              <TouchableOpacity 
                onPress={() => setShowDetailModal(false)}
                style={styles.closeModalButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedDelivery && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.priceSection}>
                  <Text style={styles.modalPrice}>
                    {selectedDelivery.proposed_price?.toLocaleString()} FCFA
                  </Text>
                  {selectedDelivery.urgency === 'urgent' && (
                    <Chip style={styles.urgentChip} textStyle={styles.urgentChipText}>
                      Urgent
                    </Chip>
                  )}
                </View>

                <View style={styles.routeSection}>
                  <Text style={styles.sectionTitle}>Itinéraire</Text>
                  <View style={styles.routeInfo}>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="circle-outline" size={16} color="#4CAF50" />
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationLabel}>Ramassage</Text>
                        <Text style={styles.locationText}>
                          {selectedDelivery.pickup_address || selectedDelivery.pickup_commune}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#F44336" />
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationLabel}>Livraison</Text>
                        <Text style={styles.locationText}>
                          {selectedDelivery.delivery_address || selectedDelivery.delivery_commune}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Informations</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="map-marker-distance" size={20} color="#2196F3" />
                      <Text style={styles.detailLabel}>Distance</Text>
                      <Text style={styles.detailValue}>{selectedDelivery.distance} km</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color="#FF9800" />
                      <Text style={styles.detailLabel}>Durée estimée</Text>
                      <Text style={styles.detailValue}>{selectedDelivery.estimated_duration} min</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="package-variant" size={20} color="#9C27B0" />
                      <Text style={styles.detailLabel}>Type de colis</Text>
                      <Text style={styles.detailValue}>{selectedDelivery.package_type}</Text>
                    </View>
                    {selectedDelivery.client_name && (
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="account" size={20} color="#4CAF50" />
                        <Text style={styles.detailLabel}>Client</Text>
                        <Text style={styles.detailValue}>{selectedDelivery.client_name}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButton]}
                    onPress={() => handleRejectDelivery(selectedDelivery.delivery_id)}
                  >
                    <Text style={styles.rejectButtonText}>{t('alerts.ignore')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.counterOfferButton]}
                    onPress={() => handleCounterOffer(selectedDelivery.delivery_id)}
                  >
                    <Text style={styles.counterOfferButtonText}>Contre-offre</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.acceptButton]}
                    onPress={() => handleAcceptDelivery(selectedDelivery.delivery_id)}
                  >
                    <Text style={styles.acceptButtonText}>{t('alerts.accept')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  animatedContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  welcomeText: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  userName: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  onlineToggle: {
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B00',
  },
  earningsCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsContent: {
    padding: 20,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  earningsValue: {
    fontSize: 28,
    color: '#333',
    fontWeight: '700',
    marginTop: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    color: '#F57F17',
    fontWeight: '600',
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressPercent: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8F5E8',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  statProgress: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    width: '100%',
    marginBottom: 4,
  },
  statTarget: {
    fontSize: 10,
    color: '#999',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  quickActionCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  bottomPadding: {
    height: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B00',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Styles pour les alertes
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  clearAllText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  alertItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
  },
  alertContent: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  alertDistance: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  alertDuration: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  urgentChip: {
    backgroundColor: '#FF5722',
    marginLeft: 8,
    height: 20,
  },
  urgentChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 12,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  // Styles pour le modal de détails
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B00',
  },
  routeSection: {
    marginBottom: 24,
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 2,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginLeft: 8,
    marginVertical: 8,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  counterOfferButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  counterOfferButtonText: {
    color: '#FF9800',
    fontWeight: '600',
    fontSize: 14,
  },
});