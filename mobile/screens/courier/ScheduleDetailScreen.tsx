
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import ScheduledDeliveryService, { ScheduledDelivery } from '../../services/ScheduledDeliveryService';
import { formatPrice, formatDate } from '../../utils/formatters';

const ScheduleDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { scheduleId } = route.params as { scheduleId: number };

  const [schedule, setSchedule] = useState<ScheduledDelivery | null>(null);
  const [loading, setLoading] = useState(true);

  const loadScheduleDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ScheduledDeliveryService.getScheduledDelivery(scheduleId);
      setSchedule(response.schedule);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la planification');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [scheduleId, navigation]);

  useEffect(() => {
    loadScheduleDetails();
  }, [loadScheduleDetails]);

  const handleExecute = async () => {
    if (!schedule) return;

    Alert.alert(
      'Exécuter maintenant',
      'Voulez-vous créer une livraison immédiatement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exécuter',
          onPress: async () => {
            try {
              const response = await ScheduledDeliveryService.executeScheduledDelivery(schedule.id);
              Alert.alert(
                'Succès',
                `Livraison créée avec l'ID: ${response.delivery_id}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('DeliveryDetails', { deliveryId: response.delivery_id }),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'exécuter la planification');
            }
          },
        },
      ]
    );
  };

  const handlePauseResume = async () => {
    if (!schedule) return;

    try {
      if (schedule.status === 'active') {
        await ScheduledDeliveryService.pauseScheduledDelivery(schedule.id);
        Alert.alert('Succès', 'Planification mise en pause');
      } else if (schedule.status === 'paused') {
        await ScheduledDeliveryService.resumeScheduledDelivery(schedule.id);
        Alert.alert('Succès', 'Planification reprise');
      }
      loadScheduleDetails();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;

    Alert.alert(
      'Supprimer la planification',
      'Êtes-vous sûr de vouloir supprimer cette planification ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await ScheduledDeliveryService.deleteScheduledDelivery(schedule.id);
              Alert.alert('Succès', 'Planification supprimée');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la planification');
            }
          },
        },
      ]
    );
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
    const baseText = (() => {
      switch (schedule.recurrence_type) {
        case 'daily': return 'Quotidienne';
        case 'weekly': return 'Hebdomadaire';
        case 'monthly': return 'Mensuelle';
        default: return 'Ponctuelle';
      }
    })();

    if (schedule.recurrence_interval && schedule.recurrence_interval > 1) {
      return `${baseText} (tous les ${schedule.recurrence_interval} ${
        schedule.recurrence_type === 'daily' ? 'jours' :
        schedule.recurrence_type === 'weekly' ? 'semaines' : 'mois'
      })`;
    }

    return baseText;
  };

  const getDaysOfWeekText = (days: number[]) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days.map(day => dayNames[day]).join(', ');
  };

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

  if (!schedule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>Planification non trouvée</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la planification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations principales */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{schedule.title}</Text>
              <Chip
                mode="outlined"
                style={[styles.statusChip, { borderColor: getStatusColor(schedule.status) }]}
                textStyle={{ color: getStatusColor(schedule.status) }}
              >
                {schedule.status}
              </Chip>
            </View>

            {schedule.description && (
              <Text style={styles.description}>{schedule.description}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Informations de planification */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Planification</Text>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar" size={20} color="#4CAF50" />
              <Text style={styles.infoLabel}>Date de début:</Text>
              <Text style={styles.infoValue}>{formatDate(schedule.scheduled_date)}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="repeat" size={20} color="#2196F3" />
              <Text style={styles.infoLabel}>Récurrence:</Text>
              <Text style={styles.infoValue}>{getRecurrenceText(schedule)}</Text>
            </View>

            {schedule.recurrence_type === 'weekly' && schedule.recurrence_days && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-week" size={20} color="#9C27B0" />
                <Text style={styles.infoLabel}>Jours:</Text>
                <Text style={styles.infoValue}>{getDaysOfWeekText(schedule.recurrence_days)}</Text>
              </View>
            )}

            {schedule.end_date && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-end" size={20} color="#FF5722" />
                <Text style={styles.infoLabel}>Date de fin:</Text>
                <Text style={styles.infoValue}>{formatDate(schedule.end_date)}</Text>
              </View>
            )}

            {schedule.max_occurrences && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="counter" size={20} color="#795548" />
                <Text style={styles.infoLabel}>Max occurrences:</Text>
                <Text style={styles.infoValue}>{schedule.max_occurrences}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-alert" size={20} color="#FF9800" />
              <Text style={styles.infoLabel}>Notification:</Text>
              <Text style={styles.infoValue}>{schedule.notification_advance_hours}h avant</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Informations de livraison */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Détails de livraison</Text>
            
            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Ramassage</Text>
                  <Text style={styles.addressText}>{schedule.pickup_address}</Text>
                  {schedule.pickup_contact_name && (
                    <Text style={styles.contactText}>
                      Contact: {schedule.pickup_contact_name}
                      {schedule.pickup_contact_phone && ` (${schedule.pickup_contact_phone})`}
                    </Text>
                  )}
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="map-marker-check" size={20} color="#F44336" />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Livraison</Text>
                  <Text style={styles.addressText}>{schedule.delivery_address}</Text>
                  {schedule.delivery_contact_name && (
                    <Text style={styles.contactText}>
                      Contact: {schedule.delivery_contact_name}
                      {schedule.delivery_contact_phone && ` (${schedule.delivery_contact_phone})`}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {schedule.package_description && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="package-variant" size={20} color="#8BC34A" />
                <Text style={styles.infoLabel}>Colis:</Text>
                <Text style={styles.infoValue}>{schedule.package_description}</Text>
              </View>
            )}

            {schedule.proposed_price && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="cash" size={20} color="#FF6B00" />
                <Text style={styles.infoLabel}>Prix:</Text>
                <Text style={[styles.infoValue, styles.priceText]}>
                  {formatPrice(schedule.proposed_price)} FCFA
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Statistiques d'exécution */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{schedule.total_executions}</Text>
                <Text style={styles.statLabel}>Exécutions</Text>
              </View>
              
              {schedule.last_executed_at && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatDate(schedule.last_executed_at, 'DD/MM')}
                  </Text>
                  <Text style={styles.statLabel}>Dernière</Text>
                </View>
              )}
              
              {schedule.next_execution_at && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatDate(schedule.next_execution_at, 'DD/MM')}
                  </Text>
                  <Text style={styles.statLabel}>Prochaine</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Instructions spéciales */}
        {schedule.special_instructions && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Instructions spéciales</Text>
              <Text style={styles.instructionsText}>{schedule.special_instructions}</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionContainer}>
        {schedule.status === 'active' && (
          <Button
            mode="contained"
            style={[styles.actionButton, { backgroundColor: '#FF6B00' }]}
            onPress={handleExecute}
          >
            Exécuter maintenant
          </Button>
        )}

        <Button
          mode="outlined"
          style={styles.actionButton}
          onPress={handlePauseResume}
        >
          {schedule.status === 'active' ? 'Mettre en pause' : 'Reprendre'}
        </Button>

        <Button
          mode="text"
          style={styles.actionButton}
          textColor="#F44336"
          onPress={handleDelete}
        >
          Supprimer
        </Button>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#F44336',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    backgroundColor: 'transparent',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    flex: 2,
  },
  priceText: {
    color: '#FF6B00',
  },
  addressSection: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  addressInfo: {
    marginLeft: 12,
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#757575',
  },
  divider: {
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  actionContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    marginBottom: 8,
  },
});

export default ScheduleDetailScreen;
