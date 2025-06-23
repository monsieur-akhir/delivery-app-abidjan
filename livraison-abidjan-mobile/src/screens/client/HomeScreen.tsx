import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Avatar, Badge, Chip, FAB } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../hooks/useAuth';
import DeliveryService from '../../services/DeliveryService';
import LocationService from '../../services/LocationService';
import WeatherService from '../../services/CommuneWeatherService';
import OfflineIndicator from '../../components/OfflineIndicator';
import type { Delivery, Weather } from '../../types/models';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ address?: string } | null>(null);
  const [weatherData, setWeatherData] = useState<Weather | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const refreshDeliveries = useCallback(async () => {
    try {
      setDeliveriesLoading(true);
      // Charger les vraies livraisons récentes
      const deliveries = await DeliveryService.getUserDeliveries();
      setRecentDeliveries(deliveries);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons:', error);
    } finally {
      setDeliveriesLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshDeliveries();
      // Rafraîchir d'autres données si nécessaire
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshDeliveries]);

  useEffect(() => {
    handleGetLocation();
    refreshDeliveries();
  }, []);

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true)
      const locationService = LocationService.getInstance()
      const position = await locationService.getCurrentPosition()
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      })
      const commune = await locationService.getCommuneFromCoords(position.latitude, position.longitude)
      getWeatherData(commune || 'Cocody')
      console.log('Position obtenue:', position, 'Commune:', commune)
    } catch (error) {
      console.error('Erreur localisation:', error)
      Alert.alert(
        'Erreur de localisation',
        'Impossible d\'obtenir votre position. Vérifiez que la localisation est activée.'
      )
    } finally {
      setLocationLoading(false)
    }
  }

  const getWeatherData = async (commune: string) => {
    try {
      const weather = await WeatherService.getWeatherForCommune(commune);
      if (weather && weather.current) {
        setWeatherData(weather.current);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la météo:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'pending': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'in_progress': return 'En cours';
      case 'cancelled': return 'Annulée';
      case 'pending': return 'En attente';
      default: return 'Inconnue';
    }
  };

  const quickActions = [
    {
      id: 'express',
      title: 'Livraison Express',
      subtitle: 'Urgente • 30min',
      icon: 'flash',
      color: '#FF6B00',
      screen: 'CreateDelivery',
      params: { type: 'express' }
    },
    {
      id: 'standard',
      title: 'Livraison Standard',
      subtitle: 'Économique • 2-4h',
      icon: 'package-variant',
      color: '#2196F3',
      screen: 'CreateDelivery',
      params: { type: 'standard' }
    },
    {
      id: 'scheduled',
      title: 'Programmer',
      subtitle: 'Plus tard • À l\'heure',
      icon: 'calendar-clock',
      color: '#9C27B0',
      screen: 'ScheduledDeliveries'
    },
    {
      id: 'multi',
      title: 'Multi-destinations',
      subtitle: 'Plusieurs arrêts',
      icon: 'map-marker-multiple',
      color: '#4CAF50',
      screen: 'MultiDestinationDeliveries'
    }
  ];

  const serviceCategories = [
    { id: 'food', name: 'Restaurant', icon: 'food', color: '#FF5722' },
    { id: 'pharmacy', name: 'Pharmacie', icon: 'medical-bag', color: '#4CAF50' },
    { id: 'grocery', name: 'Épicerie', icon: 'cart', color: '#FF9800' },
    { id: 'electronics', name: 'Tech', icon: 'cellphone', color: '#3F51B5' },
    { id: 'fashion', name: 'Mode', icon: 'tshirt-crew', color: '#E91E63' },
    { id: 'other', name: 'Autre', icon: 'dots-horizontal', color: '#607D8B' }
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.welcomeSection}>
          <Avatar.Image 
            size={48} 
            source={user?.profile_picture ? { uri: user.profile_picture } : require('../../assets/default-avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Bonjour</Text>
            <Text style={styles.userName}>{user?.first_name || 'Utilisateur'}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
            <Badge style={styles.notificationBadge} size={8} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <MaterialCommunityIcons name="wallet-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {currentLocation && (
        <View style={styles.locationSection}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {currentLocation.address || 'Abidjan, Côte d\'Ivoire'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Services rapides</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionCard}
            onPress={() => navigation.navigate(action.screen as any, action.params)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
              <MaterialCommunityIcons 
                name={action.icon} 
                size={28} 
                color={action.color} 
              />
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Catégories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {serviceCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryChip}
            // onPress={() => navigation.navigate('Marketplace', { category: category.id })}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
              <MaterialCommunityIcons 
                name={category.icon} 
                size={20} 
                color={category.color} 
              />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecentOrders = () => {
    if (deliveriesLoading) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
          <View style={styles.loadingContainer}>
            <Text>Chargement...</Text>
          </View>
        </View>
      );
    }

    if (recentDeliveries.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune commande récente</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DeliveryHistory')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recentDeliveries.slice(0, 3).map((delivery) => (
          <Card key={delivery.id} style={styles.orderCard}>
            <Card.Content style={styles.orderContent}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>Livraison #{delivery.id}</Text>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(delivery.status) + '15' }]}
                  textStyle={[styles.statusText, { color: getStatusColor(delivery.status) }]}
                  compact
                >
                  {getStatusText(delivery.status)}
                </Chip>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeInfo}>
                  <MaterialCommunityIcons name="circle-outline" size={12} color="#4CAF50" />
                  <Text style={styles.routeLocationText} numberOfLines={1}>
                    {delivery.pickup_address || delivery.pickup_commune}
                  </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeInfo}>
                  <MaterialCommunityIcons name="map-marker" size={12} color="#F44336" />
                  <Text style={styles.routeLocationText} numberOfLines={1}>
                    {delivery.delivery_address || delivery.delivery_commune}
                  </Text>
                </View>
              </View>

              <View style={styles.orderMeta}>
                <Text style={styles.orderAmount}>
                  {(delivery.final_price || delivery.proposed_price || 0).toLocaleString()} FCFA
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(delivery.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderWeatherInfo = () => {
    if (!weatherData) return null;

    return (
      <Card style={styles.weatherCard}>
        <Card.Content style={styles.weatherContent}>
          <MaterialCommunityIcons 
            name="weather-sunny" 
            size={24} 
            color="#FF9800" 
          />
          <Text style={styles.weatherText}>
            {weatherData.temperature}°C • {weatherData.condition}
          </Text>
          <Text style={styles.weatherHumidity}>
            Humidité {weatherData.humidity}%
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <OfflineIndicator />

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderWeatherInfo()}
        {renderQuickActions()}
        {renderCategories()}
        {renderRecentOrders()}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateDelivery')}
        color="#FFFFFF"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  userName: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B00',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  weatherCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    borderRadius: 12,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  weatherText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  weatherHumidity: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeLine: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 6,
    marginVertical: 2,
  },
  routeLocationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B00',
  },
  bottomPadding: {
    height: 80,
  },
});