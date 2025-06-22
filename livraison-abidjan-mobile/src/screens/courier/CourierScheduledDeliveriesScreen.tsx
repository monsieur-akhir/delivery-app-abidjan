
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { DeliveryService } from '../../services/DeliveryService';
import { EmptyState } from '../../components/EmptyState';
import { Card } from '../../components/Card';
import { DeliveryStatusBadge } from '../../components/DeliveryStatusBadge';

interface ScheduledDelivery {
  id: string;
  title: string;
  pickup_address: string;
  delivery_address: string;
  scheduled_date: string;
  scheduled_time: string;
  price: number;
  status: string;
  client_name: string;
  vehicle_type: string;
  package_type: string;
  estimated_duration: number;
  distance: number;
}

const CourierScheduledDeliveriesScreen: React.FC = () => {
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadScheduledDeliveries();
  }, []);

  const loadScheduledDeliveries = async () => {
    try {
      setLoading(true);
      // Récupérer les livraisons planifiées disponibles pour le coursier
      const response = await DeliveryService.getAvailableDeliveries({
        delivery_type: 'scheduled',
        status: 'pending'
      });
      setDeliveries(response);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons planifiées:', error);
      Alert.alert('Erreur', 'Impossible de charger les livraisons planifiées');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScheduledDeliveries();
    setRefreshing(false);
  };

  const acceptScheduledDelivery = async (deliveryId: string) => {
    try {
      Alert.alert(
        'Accepter la livraison',
        'Voulez-vous accepter cette livraison planifiée ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Accepter',
            onPress: async () => {
              await DeliveryService.acceptDelivery(deliveryId);
              Alert.alert('Succès', 'Livraison acceptée avec succès');
              loadScheduledDeliveries();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la livraison');
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return format(dateTime, 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  const renderDeliveryItem = ({ item }: { item: ScheduledDelivery }) => (
    <Card style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.deliveryTitle}>{item.title}</Text>
          <Text style={styles.clientName}>Client: {item.client_name}</Text>
        </View>
        <DeliveryStatusBadge status={item.status} />
      </View>

      <View style={styles.scheduleInfo}>
        <View style={styles.scheduleRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.scheduleText}>
            {formatDateTime(item.scheduled_date, item.scheduled_time)}
          </Text>
        </View>
        <View style={styles.scheduleRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.scheduleText}>
            Durée estimée: {item.estimated_duration} min
          </Text>
        </View>
      </View>

      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color="#4CAF50" />
          <Text style={styles.addressText} numberOfLines={2}>
            Collecte: {item.pickup_address}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <Ionicons name="flag-outline" size={16} color="#FF5722" />
          <Text style={styles.addressText} numberOfLines={2}>
            Livraison: {item.delivery_address}
          </Text>
        </View>
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.package_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.vehicle_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="speedometer-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance} km</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{item.price} FCFA</Text>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptScheduledDelivery(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livraisons Planifiées</Text>
      </View>

      {deliveries.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Aucune livraison planifiée"
          message="Il n'y a pas de livraisons planifiées disponibles pour le moment"
        />
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
  },
  scheduleInfo: {
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  deliveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CourierScheduledDeliveriesScreen;
