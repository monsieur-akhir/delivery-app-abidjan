
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  Animated,
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

import { useAuth } from '../../hooks/useAuth';
import { useDelivery } from '../../hooks/useDelivery';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { formatPrice, formatDate } from '../../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;

export default function CourierHomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { connected } = useWebSocket();
  const { recentDeliveries, loading: deliveriesLoading } = useDelivery();

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

  useEffect(() => {
    loadDashboardData();
    startAnimations();
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
      screen: 'ExpressDeliveries'
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
  ];

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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionCard}
            onPress={() => navigation.navigate(action.screen)}
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

  const renderServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mes services</Text>
      <View style={styles.servicesGrid}>
        {serviceItems.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={styles.serviceItem}
            onPress={() => navigation.navigate(service.screen)}
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
          {renderServices()}
          {renderSummaryCard()}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>
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
});
