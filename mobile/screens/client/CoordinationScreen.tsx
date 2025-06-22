
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScheduledDeliveryService from '../../services/ScheduledDeliveryService';
import { FeatherIcon } from '../../components';

type CoordinationScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
};

const CoordinationScreen: React.FC<CoordinationScreenProps> = ({ navigation, route }) => {
  const { scheduleId, executionId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coordinationData, setCoordinationData] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    loadCoordinationStatus();
  }, []);

  const loadCoordinationStatus = async () => {
    try {
      setLoading(true);
      const response = await ScheduledDeliveryService.getCoordinationStatus(executionId);
      setCoordinationData(response);
      
      if (response.execution?.planned_date) {
        setSelectedTime(new Date(response.execution.planned_date));
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de coordination');
    } finally {
      setLoading(false);
    }
  };

  const saveCoordination = async () => {
    try {
      setSaving(true);
      
      const coordinationPayload = {
        notes: notes.trim(),
        confirmed_time: selectedTime.toISOString(),
      };

      await ScheduledDeliveryService.coordinateScheduledDelivery(executionId, coordinationPayload);
      
      Alert.alert(
        'Succès',
        'Coordination enregistrée avec succès. Le coursier sera notifié.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la coordination');
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!coordinationData?.is_j_minus_1) {
    return (
      <View style={styles.container}>
        <View style={styles.infoCard}>
          <FeatherIcon name="info" size={24} color="#FF9500" />
          <Text style={styles.infoText}>
            La coordination n'est disponible que la veille de la livraison (J-1)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadCoordinationStatus} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Coordination Livraison</Text>
        <Text style={styles.subtitle}>
          Livraison prévue demain • Mettez-vous d'accord avec le coursier
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails de la livraison</Text>
        <View style={styles.deliveryInfo}>
          <Text style={styles.infoRow}>
            📍 De: {coordinationData.schedule.pickup_address}
          </Text>
          <Text style={styles.infoRow}>
            📍 Vers: {coordinationData.schedule.delivery_address}
          </Text>
          <Text style={styles.infoRow}>
            📦 Colis: {coordinationData.schedule.package_description}
          </Text>
          <Text style={styles.infoRow}>
            💰 Prix: {coordinationData.schedule.proposed_price}€
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Heure de ramassage</Text>
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <FeatherIcon name="clock" size={20} color="#007AFF" />
          <Text style={styles.timeText}>
            {selectedTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions spéciales</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          placeholder="Ajoutez des instructions pour le coursier (sonnette, étage, contact...)"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {coordinationData.special_instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions existantes</Text>
          <Text style={styles.existingInstructions}>
            {coordinationData.special_instructions}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveCoordination}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Enregistrement...' : 'Confirmer la coordination'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  deliveryInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  existingInstructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#E65100',
  },
});

export default CoordinationScreen;
