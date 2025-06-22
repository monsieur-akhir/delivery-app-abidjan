
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card, Button, Chip, FAB, Searchbar } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import ScheduledDeliveryService, { ScheduledDelivery } from '../../services/ScheduledDeliveryService';
import { formatPrice, formatDate } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const CourierScheduledDeliveriesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<ScheduledDelivery[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ScheduledDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'active', label: 'Actives' },
    { value: 'paused', label: 'En pause' },
    { value: 'completed', label: 'Terminées' },
  ];

  const loadScheduledDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ScheduledDeliveryService.getScheduledDeliveries();
      setSchedules(response.schedules || []);
      setFilteredSchedules(response.schedules || []);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons planifiées:', error);
      Alert.alert('Erreur', 'Impossible de charger les livraisons planifiées');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScheduledDeliveries();
    setRefreshing(false);
  }, [loadScheduledDeliveries]);

  useEffect(() => {
    loadScheduledDeliveries();
  }, [loadScheduledDeliveries]);

  // Filtrer les livraisons
  useEffect(() => {
    let filtered = schedules;

    // Filtrer par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === selectedStatus);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(schedule =>
        schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.pickup_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSchedules(filtered);
  }, [schedules, selectedStatus, searchQuery]);

  const handleExecuteSchedule = async (scheduleId: number) => {
    Alert.alert(
      'Exécuter maintenant',
      'Voulez-vous créer une livraison immédiatement à partir de cette planification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exécuter',
          onPress: async () => {
            try {
              const response = await ScheduledDeliveryService.executeScheduledDelivery(scheduleId);
              Alert.alert('Succès', `Livraison créée avec l'ID: ${response.delivery_id}`);
              loadScheduledDeliveries();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'exécuter la planification');
            }
          },
        },
      ]
    );
  };

  const handlePauseResume = async (schedule: ScheduledDelivery) => {
    try {
      if (schedule.status === 'active') {
        await ScheduledDeliveryService.pauseScheduledDelivery(schedule.id);
        Alert.alert('Succès', 'Planification mise en pause');
      } else if (schedule.status === 'paused') {
        await ScheduledDeliveryService.resumeScheduledDelivery(schedule.id);
        Alert.alert('Succès', 'Planification reprise');
      }
      loadScheduledDeliveries();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRecurrenceText = (schedule: ScheduledDelivery) => {
    switch (schedule.recurrence_type) {
      case 'daily': return 'Quotidienne';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuelle';
      default: return 'Ponctuelle';
    }
  };

  const renderScheduleCard = (schedule: ScheduledDelivery) => (
    <Card key={schedule.id} style={styles.scheduleCard}>
      <Card.Content>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
          <Chip
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(schedule.status) }]}
            textStyle={{ color: getStatusColor(schedule.status) }}
          >
            {schedule.status}
          </Chip>
        </View>

        <View style={styles.scheduleInfo}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#757575" />
            <Text style={styles.infoText}>
              {formatDate(schedule.scheduled_date)} - {getRecurrenceText(schedule)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#4CAF50" />
            <Text style={styles.infoText} numberOfLines={1}>
              {schedule.pickup_address}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-check" size={16} color="#F44336" />
            <Text style={styles.infoText} numberOfLines={1}>
              {schedule.delivery_address}
            </Text>
          </View>

          {schedule.proposed_price && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="cash" size={16} color="#FF6B00" />
              <Text style={styles.priceText}>
                {formatPrice(schedule.proposed_price)} FCFA
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="repeat" size={16} color="#2196F3" />
            <Text style={styles.infoText}>
              {schedule.total_executions} exécutions
            </Text>
          </View>

          {schedule.next_execution_at && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color="#9C27B0" />
              <Text style={styles.infoText}>
                Prochaine: {formatDate(schedule.next_execution_at)}
              </Text>
            </View>
          )}
        </View>

        {schedule.description && (
          <Text style={styles.description} numberOfLines={2}>
            {schedule.description}
          </Text>
        )}

        <View style={styles.actionButtons}>
          {schedule.status === 'active' && (
            <Button
              mode="contained"
              compact
              style={[styles.actionButton, { backgroundColor: '#FF6B00' }]}
              onPress={() => handleExecuteSchedule(schedule.id)}
            >
              Exécuter
            </Button>
          )}

          <Button
            mode="outlined"
            compact
            style={styles.actionButton}
            onPress={() => handlePauseResume(schedule)}
          >
            {schedule.status === 'active' ? 'Pause' : 'Reprendre'}
          </Button>

          <Button
            mode="text"
            compact
            style={styles.actionButton}
            onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: schedule.id })}
          >
            Détails
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.header}>
        <Text style={styles.headerTitle}>Livraisons Planifiées</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSchedules.length} planification(s)
        </Text>
      </LinearGradient>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Filtres de statut */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              selectedStatus === option.value && styles.filterChipSelected,
            ]}
            onPress={() => setSelectedStatus(option.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === option.value && styles.filterChipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des planifications */}
      <ScrollView
        style={styles.content}
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
        {filteredSchedules.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Aucune planification</Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedStatus !== 'all'
                  ? 'Aucune planification ne correspond aux critères'
                  : 'Aucune livraison planifiée pour le moment'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredSchedules.map(renderScheduleCard)
        )}
      </ScrollView>

      {/* FAB pour créer une nouvelle planification */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ScheduleDelivery')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: 'white',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 14,
    color: '#757575',
  },
  filterChipTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scheduleCard: {
    marginBottom: 16,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    backgroundColor: 'transparent',
  },
  scheduleInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
    flex: 1,
  },
  priceText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});

export default CourierScheduledDeliveriesScreen;
