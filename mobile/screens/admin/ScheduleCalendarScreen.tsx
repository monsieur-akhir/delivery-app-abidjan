
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Card,
  Chip,
  Button,
  Portal,
  Dialog
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  type: string;
  status: string;
  client_name: string;
  pickup_address: string;
  delivery_address: string;
  recurrence_type: string;
}

interface ScheduleCalendarScreenProps {}

const ScheduleCalendarScreen: React.FC<ScheduleCalendarScreenProps> = () => {
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Mock data pour le développement
      const mockEvents: CalendarEvent[] = [
        {
          id: 1,
          title: 'Livraison quotidienne des factures',
          start: '2024-01-22T09:00:00Z',
          end: '2024-01-22T10:00:00Z',
          type: 'scheduled_delivery',
          status: 'pending',
          client_name: 'Société ABC',
          pickup_address: 'Plateau, Immeuble SCIAM',
          delivery_address: 'Yopougon, Agence Yop-Maroc',
          recurrence_type: 'daily'
        },
        {
          id: 2,
          title: 'Livraison hebdomadaire des bulletins',
          start: '2024-01-26T14:00:00Z',
          end: '2024-01-26T15:00:00Z',
          type: 'scheduled_delivery',
          status: 'pending',
          client_name: 'Société DEF',
          pickup_address: 'Cocody, Riviera Palmeraie',
          delivery_address: 'Marcory, Zone Industrielle',
          recurrence_type: 'weekly'
        },
        {
          id: 3,
          title: 'Livraison ponctuelle urgente',
          start: '2024-01-25T10:30:00Z',
          end: '2024-01-25T11:30:00Z',
          type: 'scheduled_delivery',
          status: 'pending',
          client_name: 'Client XYZ',
          pickup_address: 'Adjamé, Centre commercial',
          delivery_address: 'Koumassi, Résidence les Palmiers',
          recurrence_type: 'none'
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    events.forEach(event => {
      const date = event.start.split('T')[0];
      if (!marked[date]) {
        marked[date] = { dots: [] };
      }
      
      marked[date].dots.push({
        key: event.id,
        color: getEventColor(event.status),
        selectedDotColor: COLORS.white
      });
    });

    // Marquer la date sélectionnée
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = COLORS.primary;
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: COLORS.primary,
        dots: []
      };
    }

    return marked;
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'created': return COLORS.success;
      case 'completed': return COLORS.primary;
      case 'failed': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.start.split('T')[0] === date);
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

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const handleExecuteEvent = async (event: CalendarEvent) => {
    try {
      // TODO: Appeler l'API pour exécuter la livraison planifiée
      console.log('Exécution de l\'événement:', event.id);
      setShowEventDialog(false);
      loadEvents();
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error);
    }
  };

  const renderEvent = (event: CalendarEvent) => (
    <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      onPress={() => handleEventPress(event)}
    >
      <View style={styles.eventHeader}>
        <View style={[styles.eventDot, { backgroundColor: getEventColor(event.status) }]} />
        <Text style={styles.eventTime}>
          {new Date(event.start).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        <Chip
          mode="outlined"
          style={styles.recurrenceChip}
          textStyle={styles.recurrenceText}
        >
          {getRecurrenceLabel(event.recurrence_type)}
        </Chip>
      </View>
      
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventClient}>{event.client_name}</Text>
      
      <View style={styles.eventAddresses}>
        <Text style={styles.eventAddress} numberOfLines={1}>
          📍 {event.pickup_address}
        </Text>
        <Text style={styles.eventAddress} numberOfLines={1}>
          📍 {event.delivery_address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const selectedDateEvents = getEventsForDate(selectedDate);

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
          <Text style={styles.headerTitle}>Calendrier des planifications</Text>
          <IconButton
            icon="refresh"
            size={24}
            onPress={loadEvents}
          />
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {/* Calendrier */}
        <Card style={styles.calendarCard}>
          <Calendar
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markedDates={getMarkedDates()}
            markingType="multi-dot"
            theme={{
              backgroundColor: COLORS.white,
              calendarBackground: COLORS.white,
              textSectionTitleColor: COLORS.textSecondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text,
              textDisabledColor: COLORS.border,
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.text,
              indicatorColor: COLORS.primary,
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
            firstDay={1}
          />
        </Card>

        {/* Événements du jour sélectionné */}
        <Card style={styles.eventsCard}>
          <Card.Content>
            <View style={styles.eventsHeader}>
              <Text style={styles.eventsTitle}>
                Événements du {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.eventsCount}>
                {selectedDateEvents.length} événement{selectedDateEvents.length > 1 ? 's' : ''}
              </Text>
            </View>

            {selectedDateEvents.length > 0 ? (
              <View style={styles.eventsList}>
                {selectedDateEvents.map(renderEvent)}
              </View>
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>
                  Aucun événement planifié pour cette date
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Légende */}
        <Card style={styles.legendCard}>
          <Card.Content>
            <Text style={styles.legendTitle}>Légende</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>En attente</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Créée</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Terminée</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Échouée</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Dialog des détails d'événement */}
      <Portal>
        <Dialog
          visible={showEventDialog}
          onDismiss={() => setShowEventDialog(false)}
          style={styles.eventDialog}
        >
          {selectedEvent && (
            <>
              <Dialog.Title>{selectedEvent.title}</Dialog.Title>
              <Dialog.Content>
                <View style={styles.eventDetailRow}>
                  <Text style={styles.eventDetailLabel}>Client:</Text>
                  <Text style={styles.eventDetailValue}>{selectedEvent.client_name}</Text>
                </View>
                
                <View style={styles.eventDetailRow}>
                  <Text style={styles.eventDetailLabel}>Heure:</Text>
                  <Text style={styles.eventDetailValue}>
                    {new Date(selectedEvent.start).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                <View style={styles.eventDetailRow}>
                  <Text style={styles.eventDetailLabel}>Récurrence:</Text>
                  <Text style={styles.eventDetailValue}>
                    {getRecurrenceLabel(selectedEvent.recurrence_type)}
                  </Text>
                </View>

                <View style={styles.eventDetailRow}>
                  <Text style={styles.eventDetailLabel}>Statut:</Text>
                  <Chip
                    mode="outlined"
                    style={[styles.statusChip, { borderColor: getEventColor(selectedEvent.status) }]}
                    textStyle={[styles.statusText, { color: getEventColor(selectedEvent.status) }]}
                  >
                    {selectedEvent.status === 'pending' ? 'En attente' : selectedEvent.status}
                  </Chip>
                </View>

                <Text style={styles.addressSectionTitle}>Adresses</Text>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Ramassage:</Text>
                  <Text style={styles.addressValue}>{selectedEvent.pickup_address}</Text>
                </View>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Livraison:</Text>
                  <Text style={styles.addressValue}>{selectedEvent.delivery_address}</Text>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowEventDialog(false)}>Fermer</Button>
                {selectedEvent.status === 'pending' && (
                  <Button
                    mode="contained"
                    onPress={() => handleExecuteEvent(selectedEvent)}
                  >
                    Exécuter maintenant
                  </Button>
                )}
              </Dialog.Actions>
            </>
          )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  calendarCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  eventsCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  eventsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginRight: 8,
  },
  recurrenceChip: {
    height: 24,
    marginLeft: 'auto',
  },
  recurrenceText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  eventClient: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  eventAddresses: {
    gap: 4,
  },
  eventAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  legendCard: {
    borderRadius: 12,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  eventDialog: {
    maxHeight: '80%',
  },
  eventDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  eventDetailValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addressSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 14,
    color: COLORS.text,
  },
});

export default ScheduleCalendarScreen;
