
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScheduledDelivery } from '../services/ScheduledDeliveryService';
import { formatPrice, formatDate } from '../utils/formatters';

interface ScheduledDeliveryCardProps {
  schedule: ScheduledDelivery;
  onPress?: () => void;
  onExecute?: () => void;
  onPauseResume?: () => void;
  showActions?: boolean;
}

const ScheduledDeliveryCard: React.FC<ScheduledDeliveryCardProps> = ({
  schedule,
  onPress,
  onExecute,
  onPauseResume,
  showActions = true,
}) => {
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

  const getRecurrenceIcon = (recurrenceType: string) => {
    switch (recurrenceType) {
      case 'daily': return 'calendar-today';
      case 'weekly': return 'calendar-week';
      case 'monthly': return 'calendar-month';
      default: return 'calendar-blank';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Header avec titre et statut */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {schedule.title}
            </Text>
            <Chip
              mode="outlined"
              compact
              style={[styles.statusChip, { borderColor: getStatusColor(schedule.status) }]}
              textStyle={{ color: getStatusColor(schedule.status), fontSize: 12 }}
            >
              {schedule.status}
            </Chip>
          </View>

          {/* Informations de récurrence */}
          <View style={styles.recurrenceRow}>
            <MaterialCommunityIcons
              name={getRecurrenceIcon(schedule.recurrence_type)}
              size={16}
              color="#757575"
            />
            <Text style={styles.recurrenceText}>
              {getRecurrenceText(schedule)} - {formatDate(schedule.scheduled_date)}
            </Text>
          </View>

          {/* Adresses */}
          <View style={styles.addressSection}>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#4CAF50" />
              <Text style={styles.addressText} numberOfLines={1}>
                {schedule.pickup_address}
              </Text>
            </View>
            
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker-check" size={14} color="#F44336" />
              <Text style={styles.addressText} numberOfLines={1}>
                {schedule.delivery_address}
              </Text>
            </View>
          </View>

          {/* Informations supplémentaires */}
          <View style={styles.infoRow}>
            {schedule.proposed_price && (
              <View style={styles.priceContainer}>
                <MaterialCommunityIcons name="cash" size={14} color="#FF6B00" />
                <Text style={styles.priceText}>
                  {formatPrice(schedule.proposed_price)} FCFA
                </Text>
              </View>
            )}
            
            <View style={styles.executionsContainer}>
              <MaterialCommunityIcons name="repeat" size={14} color="#2196F3" />
              <Text style={styles.executionsText}>
                {schedule.total_executions} exécutions
              </Text>
            </View>
          </View>

          {/* Prochaine exécution */}
          {schedule.next_execution_at && (
            <View style={styles.nextExecutionRow}>
              <MaterialCommunityIcons name="calendar-clock" size={14} color="#9C27B0" />
              <Text style={styles.nextExecutionText}>
                Prochaine: {formatDate(schedule.next_execution_at)}
              </Text>
            </View>
          )}

          {/* Description */}
          {schedule.description && (
            <Text style={styles.description} numberOfLines={2}>
              {schedule.description}
            </Text>
          )}

          {/* Actions */}
          {showActions && (
            <View style={styles.actionsContainer}>
              {schedule.status === 'active' && onExecute && (
                <Button
                  mode="contained"
                  compact
                  style={[styles.actionButton, styles.executeButton]}
                  labelStyle={styles.actionButtonLabel}
                  onPress={onExecute}
                >
                  Exécuter
                </Button>
              )}
              
              {onPauseResume && (
                <Button
                  mode="outlined"
                  compact
                  style={styles.actionButton}
                  labelStyle={styles.actionButtonLabel}
                  onPress={onPauseResume}
                >
                  {schedule.status === 'active' ? 'Pause' : 'Reprendre'}
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    backgroundColor: 'transparent',
    height: 24,
  },
  recurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 6,
  },
  addressSection: {
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#616161',
    marginLeft: 6,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '600',
    marginLeft: 4,
  },
  executionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  executionsText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
  },
  nextExecutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextExecutionText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
    height: 32,
  },
  executeButton: {
    backgroundColor: '#FF6B00',
  },
  actionButtonLabel: {
    fontSize: 12,
    marginVertical: 4,
  },
});

export default ScheduledDeliveryCard;
