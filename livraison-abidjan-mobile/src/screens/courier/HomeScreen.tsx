
import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native'
import { 
  Text, 
  Card, 
  Button, 
  Surface, 
  Avatar, 
  Chip,
  Switch,
  ActivityIndicator,
  IconButton,
  Divider,
  ProgressBar
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useDelivery } from '../../hooks/useDelivery'
import { formatPrice, formatDate } from '../../utils/formatters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'

const { width, height } = Dimensions.get('window')

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CourierHome'>
}

interface EarningsStat {
  title: string
  value: string
  subtitle: string
  icon: string
  color: string
  trend?: 'up' | 'down' | 'stable'
}

interface QuickStat {
  label: string
  value: number
  total: number
  color: string
  icon: string
}

const CourierHomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { unreadCount } = useNotification()
  const { connected } = useWebSocket()

  const [isOnline, setIsOnline] = useState(false)
  const [availableDeliveries, setAvailableDeliveries] = useState([])
  const [activeDeliveries, setActiveDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [todayStats, setTodayStats] = useState({
    earnings: 0,
    deliveries: 0,
    distance: 0,
    rating: 4.5
  })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  const earningsStats: EarningsStat[] = [
    {
      title: "Aujourd'hui",
      value: formatPrice(todayStats.earnings) + ' F',
      subtitle: '+12% vs hier',
      icon: 'trending-up',
      color: '#4CAF50',
      trend: 'up'
    },
    {
      title: 'Cette semaine',
      value: formatPrice(todayStats.earnings * 7) + ' F',
      subtitle: 'Objectif: 50k F',
      icon: 'calendar',
      color: '#2196F3'
    },
    {
      title: 'Note moyenne',
      value: todayStats.rating.toString(),
      subtitle: 'Excellente!',
      icon: 'star',
      color: '#FF9800'
    }
  ]

  const quickStats: QuickStat[] = [
    {
      label: 'Livraisons',
      value: todayStats.deliveries,
      total: 10,
      color: '#4CAF50',
      icon: 'package'
    },
    {
      label: 'Distance',
      value: todayStats.distance,
      total: 100,
      color: '#2196F3',
      icon: 'navigation'
    },
    {
      label: 'Temps actif',
      value: 6,
      total: 8,
      color: '#FF9800',
      icon: 'clock'
    }
  ]

  useEffect(() => {
    loadData()
    startAnimations()
  }, [])

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      // Simuler des données pour l'exemple
      setTodayStats({
        earnings: 15000,
        deliveries: 8,
        distance: 65,
        rating: 4.7
      })
      setAvailableDeliveries([])
      setActiveDeliveries([])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
    // Implémenter la logique de mise en ligne/hors ligne
  }

  const renderEarningsStat = (stat: EarningsStat, index: number) => (
    <Animated.View
      key={stat.title}
      style={[
        styles.earningsCard,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <Surface style={styles.earningsCardSurface} elevation={3}>
        <View style={styles.earningsHeader}>
          <View style={[styles.earningsIcon, { backgroundColor: stat.color }]}>
            <Feather name={stat.icon as any} size={20} color="#FFFFFF" />
          </View>
          {stat.trend && (
            <Chip 
              mode="flat" 
              style={[styles.trendChip, { backgroundColor: `${stat.color}20` }]}
              textStyle={{ color: stat.color, fontSize: 10 }}
              compact
            >
              {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'} {stat.subtitle}
            </Chip>
          )}
        </View>
        <Text style={styles.earningsValue}>{stat.value}</Text>
        <Text style={styles.earningsTitle}>{stat.title}</Text>
        {!stat.trend && (
          <Text style={styles.earningsSubtitle}>{stat.subtitle}</Text>
        )}
      </Surface>
    </Animated.View>
  )

  const renderQuickStat = (stat: QuickStat) => {
    const progress = stat.total > 0 ? stat.value / stat.total : 0
    
    return (
      <View key={stat.label} style={styles.quickStatItem}>
        <View style={styles.quickStatHeader}>
          <View style={[styles.quickStatIcon, { backgroundColor: stat.color }]}>
            <Feather name={stat.icon as any} size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.quickStatValue}>{stat.value}</Text>
        </View>
        <Text style={styles.quickStatLabel}>{stat.label}</Text>
        <ProgressBar 
          progress={progress} 
          color={stat.color} 
          style={styles.quickStatProgress}
        />
        <Text style={styles.quickStatTotal}>/{stat.total}</Text>
      </View>
    )
  }

  const renderQuickAction = (title: string, subtitle: string, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity 
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.quickActionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Feather name={icon as any} size={24} color="#FFFFFF" />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      {/* Header coursier */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('CourierProfile')}>
              <Avatar.Text 
                size={45} 
                label={
                  user?.full_name
                    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'C'
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Bonjour coursier</Text>
              <Text style={styles.userName}>
                {user?.full_name || user?.first_name || 'Coursier'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.onlineToggle}>
              <Text style={styles.onlineText}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={toggleOnlineStatus}
                color="#FFFFFF"
                style={styles.switch}
              />
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Feather name="bell" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Statut et statut rapides */}
        <Animated.View style={[styles.statusContainer, { opacity: fadeAnim }]}>
          <View style={styles.quickStatsContainer}>
            {quickStats.map(renderQuickStat)}
          </View>
        </Animated.View>
      </LinearGradient>

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
        {/* Statistiques de gains */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Revenus & Performance</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.earningsContainer}
          >
            {earningsStats.map(renderEarningsStat)}
          </ScrollView>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction(
              'Livraisons disponibles',
              `${availableDeliveries.length} nouvelles`,
              'package',
              '#2196F3',
              () => navigation.navigate('AvailableDeliveries')
            )}
            {renderQuickAction(
              'Livraisons express',
              'Gains élevés',
              'zap',
              '#FF6B00',
              () => navigation.navigate('ExpressDeliveries')
            )}
            {renderQuickAction(
              'Collaboratives',
              'Partagées',
              'users',
              '#9C27B0',
              () => navigation.navigate('CollaborativeDeliveries')
            )}
            {renderQuickAction(
              'Planifiées',
              'Programmées',
              'calendar',
              '#FF9800',
              () => navigation.navigate('CourierScheduledDeliveries')
            )}
          </View>
        </View>

        {/* Résumé des gains */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Résumé de la journée</Text>
          <Surface style={styles.summaryCard} elevation={2}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Revenus bruts</Text>
                <Text style={styles.summaryValue}>{formatPrice(todayStats.earnings)} F</Text>
              </View>
              <Divider style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Commission plateforme</Text>
                <Text style={styles.summaryValue}>-{formatPrice(todayStats.earnings * 0.1)} F</Text>
              </View>
            </View>
            <Divider />
            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>Net à recevoir</Text>
              <Text style={styles.summaryTotalValue}>
                {formatPrice(todayStats.earnings * 0.9)} F
              </Text>
            </View>
          </Surface>
        </View>

        {/* Services coursier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Mes services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('CourierEarnings')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#4CAF50' }]} elevation={2}>
                <Feather name="dollar-sign" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Revenus</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('VehicleManagement')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#2196F3' }]} elevation={2}>
                <Feather name="truck" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Véhicules</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('CourierStats')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#9C27B0' }]} elevation={2}>
                <Feather name="bar-chart-2" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Statistiques</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceItem}
              onPress={() => navigation.navigate('Gamification')}
            >
              <Surface style={[styles.serviceIcon, { backgroundColor: '#FF9800' }]} elevation={2}>
                <Feather name="award" size={20} color="#FFFFFF" />
              </Surface>
              <Text style={styles.serviceText}>Récompenses</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#757575',
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 15,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  onlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  quickStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  quickStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    marginBottom: 5,
  },
  quickStatProgress: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    width: '100%',
    marginBottom: 2,
  },
  quickStatTotal: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  earningsContainer: {
    paddingLeft: 20,
  },
  earningsCard: {
    marginRight: 15,
    width: width * 0.7,
  },
  earningsCardSurface: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  earningsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendChip: {
    height: 24,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 5,
  },
  earningsTitle: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  earningsSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 15,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 15,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#212121',
    fontWeight: '500',
  },
})

export default CourierHomeScreen
