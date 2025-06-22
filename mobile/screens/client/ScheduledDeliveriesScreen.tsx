
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import {
  Text,
  Card,
  Surface,
  IconButton,
  Chip,
  Button,
  Menu,
  Portal,
  Dialog,
  FAB
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatters';

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

interface ScheduledDelivery {
  id: number;
  title: string;
  description?: string;
  pickup_address: string;
  delivery_address: string;
  scheduled_date: string;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  next_execution_at?: string;
  total_executions: number;
  proposed_price?: number;
  client: {
    id: number;
    name: string;
  };
}

interface ScheduledDeliveriesScreenProps {}

const ScheduledDeliveriesScreen: React.FC<ScheduledDeliveriesScreenProps> = () => {
  const navigation = useNavigation();

  const [schedules, setSchedules] = useState<ScheduledDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledDelivery | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      // TODO: Appeler l'API pour récupérer les livraisons planifiées
      // const response = await ScheduledDeliveryService.getScheduledDeliveries();
      
      // Mock data pour le développement
      const mockSchedules: ScheduledDelivery[] = [
        {
          id: 1,
          title: 'Livraison quotidienne des factures',
          description: 'Livraison des factures du bureau principal vers les succursales',
          pickup_address: 'Plateau, Immeuble SCIAM, 8ème étage',
          delivery_address: 'Yopougon, Agence Yop-Maroc',
          scheduled_date: '2024-01-20T09:00:00Z',
          recurrence_type: 'daily',
          status: 'active',
          next_execution_at: '2024-01-22T09:00:00Z',
          total_executions: 15,
          proposed_price: 1500,
          client: { id: 1, name: 'Société ABC' }
        },
        {
          id: 2,
          title: 'Livraison hebdomadaire des bulletins',
          description: 'Livraison des bulletins de paie tous les vendredis',
          pickup_address: 'Cocody, Riviera Palmeraie',
          delivery_address: 'Marcory, Zone Industrielle',
          scheduled_date: '2024-01-19T14:00:00Z',
          recurrence_type: 'weekly',
          status: 'active',
          next_execution_at: '2024-01-26T14:00:00Z',
          total_executions: 8,
          proposed_price: 2500,
          client: { id: 1, name: 'Société ABC' }
        },
        {
          id: 3,
          title: 'Livraison ponctuelle urgente',
          description: 'Documents administratifs urgents',
          pickup_address: 'Adjamé, Centre commercial',
          delivery_address: 'Koumassi, Résidence les Palmiers',
          scheduled_date: '2024-01-25T10:30:00Z',
          recurrence_type: 'none',
          status: 'paused',
          next_execution_at: '2024-01-25T10:30:00Z',
          total_executions: 0,
          proposed_price: 3000,
          client: { id: 1, name: 'Société ABC' }
        }
      ];

      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Erreur lors du chargement des planifications:', error);
      Alert.alert('Erreur', 'Impossible de charger les livraisons planifiées');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'paused': return COLORS.warning;
      case 'completed': return COLORS.primary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'En pause';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getRecurrenceLabel = (type: string) => {
    switch (type) {
      case 'none': return 'Ponctuelle';
      case 'daily': return 'Quotidienne';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuelle';
      default: return type;
    }
  };

  const handleSchedulePress = (schedule: ScheduledDelivery) => {
    navigation.navigate('ScheduledDeliveryDetails', { scheduleId: schedule.id });
  };

  const handleScheduleAction = (schedule: ScheduledDelivery, action: string) => {
    setSelectedSchedule(schedule);
    
    switch (action) {
      case 'edit':
        navigation.navigate('EditScheduledDelivery', { scheduleId: schedule.id });
        break;
      case 'pause':
        handlePauseSchedule(schedule);
        break;
      case 'resume':
        handleResumeSchedule(schedule);
        break;
      case 'delete':
        setShowDeleteDialog(true);
        break;
    }
    setShowMenu(false);
  };

  const handlePauseSchedule = async (schedule: ScheduledDelivery) => {
    try {
      // TODO: Appeler l'API pour mettre en pause
      Alert.alert('Succès', 'Livraison planifiée mise en pause');
      loadSchedules();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre en pause la planification');
    }
  };

  const handleResumeSchedule = async (schedule: ScheduledDelivery) => {
    try {
      // TODO: Appeler l'API pour reprendre
      Alert.alert('Succès', 'Livraison planifiée reprise');
      loadSchedules();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de reprendre la planification');
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;

    try {
      // TODO: Appeler l'API pour supprimer
      Alert.alert('Succès', 'Livraison planifiée supprimée');
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
      loadSchedules();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de supprimer la planification');
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'all') return true;
    return schedule.status === filter;
  });

  const renderScheduleItem = ({ item }: { item: ScheduledDelivery }) => (
    <Card style={styles.scheduleCard}>
      <TouchableOpacity onPress={() => handleSchedulePress(item)}>
        <Card.Content>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleTitle}>{item.title}</Text>
              <View style={styles.statusRow}>
                <Chip
                  mode="outlined"
                  style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
                  textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
                >
                  {getStatusLabel(item.status)}
                </Chip>
                <Chip
                  mode="outlined"
                  style={styles.recurrenceChip}
                  textStyle={styles.recurrenceText}
                >
                  {getRecurrenceLabel(item.recurrence_type)}
                </Chip>
              </View>
            </View>
            
            <Menu
              visible={showMenu && selectedSchedule?.id === item.id}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => {
                    setSelectedSchedule(item);
                    setShowMenu(true);
                  }}
                />
              }
            >
              <Menu.Item onPress={() => handleScheduleAction(item, 'edit')} title="Modifier" />
              {item.status === 'active' ? (
                <Menu.Item onPress={() => handleScheduleAction(item, 'pause')} title="Mettre en pause" />
              ) : (
                <Menu.Item onPress={() => handleScheduleAction(item, 'resume')} title="Reprendre" />
              )}
              <Menu.Item onPress={() => handleScheduleAction(item, 'delete')} title="Supprimer" />
            </Menu>
          </View>

          {item.description && (
            <Text style={styles.scheduleDescription}>{item.description}</Text>
          )}

          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <Ionicons name="radio-button-on" size={16} color={COLORS.primary} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.pickup_address}
              </Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color={COLORS.success} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.delivery_address}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleFooter}>
            <View style={styles.executionInfo}>
              <Text style={styles.executionText}>
                {item.total_executions} exécution{item.total_executions > 1 ? 's' : ''}
              </Text>
              {item.next_execution_at && (
                <Text style={styles.nextExecutionText}>
                  Prochaine: {new Date(item.next_execution_at).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>
            {item.proposed_price && (
              <Text style={styles.priceText}>
                {formatCurrency(item.proposed_price)}
              </Text>
            )}
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Livraisons planifiées</Text>
          <IconButton
            icon="calendar-outline"
            size={24}
            onPress={() => navigation.navigate('ScheduleCalendar')}
          />
        </View>
      </Surface>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <Chip
          mode={filter === 'all' ? 'flat' : 'outlined'}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
        >
          Toutes
        </Chip>
        <Chip
          mode={filter === 'active' ? 'flat' : 'outlined'}
          selected={filter === 'active'}
          onPress={() => setFilter('active')}
          style={styles.filterChip}
        >
          Actives
        </Chip>
        <Chip
          mode={filter === 'paused' ? 'flat' : 'outlined'}
          selected={filter === 'paused'}
          onPress={() => setFilter('paused')}
          style={styles.filterChip}
        >
          En pause
        </Chip>
      </View>

      {/* Liste des planifications */}
      {filteredSchedules.length > 0 ? (
        <FlatList
          data={filteredSchedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="calendar-clock"
          title="Aucune livraison planifiée"
          subtitle={
            filter === 'all'
              ? "Vous n'avez pas encore planifié de livraisons"
              : `Aucune livraison ${filter === 'active' ? 'active' : 'en pause'}`
          }
          actionText="Planifier une livraison"
          onAction={() => navigation.navigate('ScheduleDelivery')}
        />
      )}

      {/* FAB pour créer une planification */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ScheduleDelivery')}
      />

      {/* Dialog de suppression */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
        >
          <Dialog.Title>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text>
              Êtes-vous sûr de vouloir supprimer la planification "{selectedSchedule?.title}" ?
              Cette action est irréversible.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button onPress={handleDeleteSchedule} textColor={COLORS.error}>
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  scheduleCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recurrenceChip: {
    height: 28,
    borderColor: COLORS.border,
  },
  recurrenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scheduleDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  scheduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  executionInfo: {
    flex: 1,
  },
  executionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  nextExecutionText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default ScheduledDeliveriesScreen;
