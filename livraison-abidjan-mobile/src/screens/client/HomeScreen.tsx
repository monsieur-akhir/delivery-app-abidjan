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

import { useAuth } from '../../hooks/useAuth';
import { useDelivery } from '../../hooks/useDelivery';
import { DeliveryService } from '../../services/DeliveryService';
import { LocationService } from '../../services/LocationService';
import { WeatherInfo } from '../../components/WeatherInfo';
import { OfflineIndicator } from '../../components/OfflineIndicator';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { recentDeliveries, loading: deliveriesLoading, refreshDeliveries } = useDelivery();

  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Données des dernières courses avec états
  const [recentOrders, setRecentOrders] = useState([
    {
      id: 1,
      status: 'completed',
      pickup: 'Cocody Riviera',
      delivery: 'Marcory Zone 4',
      date: '2025-01-19',
      amount: 2500,
      rating: 4.8
    },
    {
      id: 2,
      status: 'in_progress',
      pickup: 'Plateau Centre',
      delivery: 'Yopougon Niangon',
      date: '2025-01-19',
      amount: 3200,
      courier: 'Jean-Baptiste K.'
    },
    {
      id: 3,
      status: 'cancelled',
      pickup: 'Adjamé Commerce',
      delivery: 'Abobo Pk18',
      date: '2025-01-18',
      amount: 1800,
      reason: 'Coursier indisponible'
    }
  ]);

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
    getCurrentLocation();
    getWeatherData();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Erreur localisation:', error);
    }
  };

  const getWeatherData = async () => {
    // Simuler des données météo pour Abidjan
    setWeatherData({
      temperature: 28,
      condition: 'sunny',
      humidity: 75,
      description: 'Ensoleillé'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'pending': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
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
            onPress={() => navigation.navigate('NotificationsScreen')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
            <Badge style={styles.notificationBadge} size={8} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('WalletScreen')}
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
            onPress={() => navigation.navigate(action.screen, action.params)}
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
            onPress={() => navigation.navigate('MarketplaceScreen', { category: category.id })}
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

  const renderRecentOrders = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vos dernières courses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DeliveryHistoryScreen')}>
          <Text style={styles.seeAllText}>Tout voir</Text>
        </TouchableOpacity>
      </View>

      {recentOrders.map((order) => (
        <Card key={order.id} style={styles.orderCard}>
          <Card.Content style={styles.orderContent}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <View style={styles.routeInfo}>
                  <MaterialCommunityIcons name="circle-outline" size={12} color="#4CAF50" />
                  <Text style={styles.locationText} numberOfLines={1}>{order.pickup}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeInfo}>
                  <MaterialCommunityIcons name="map-marker" size={12} color="#F44336" />
                  <Text style={styles.locationText} numberOfLines={1}>{order.delivery}</Text>
                </View>
              </View>

              <View style={styles.orderMeta}>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) + '15' }]}
                  textStyle={[styles.statusText, { color: getStatusColor(order.status) }]}
                  compact
                >
                  {getStatusText(order.status)}
                </Chip>
                <Text style={styles.orderAmount}>{order.amount} FCFA</Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderDate}>{order.date}</Text>
              {order.status === 'completed' && order.rating && (
                <View style={styles.ratingSection}>
                  <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{order.rating}</Text>
                </View>
              )}
              {order.status === 'in_progress' && order.courier && (
                <Text style={styles.courierText}>Coursier: {order.courier}</Text>
              )}
              {order.status === 'cancelled' && order.reason && (
                <Text style={styles.reasonText}>{order.reason}</Text>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

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
            {weatherData.temperature}°C • {weatherData.description}
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
        onPress={() => navigation.navigate('CreateDeliveryScreen')}
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
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 6,
    marginVertical: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  courierText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
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