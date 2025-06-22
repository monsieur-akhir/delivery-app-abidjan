
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { DeliveryService } from '../../services/DeliveryService';
import { EmptyState } from '../../components/EmptyState';
import { Card } from '../../components/Card';
import { DeliveryStatusBadge } from '../../components/DeliveryStatusBadge';

interface MultiDestinationDelivery {
  id: string;
  title: string;
  pickup_address: string;
  destinations: Array<{
    id: string;
    address: string;
    recipient_name: string;
    recipient_phone: string;
    delivery_notes?: string;
    order: number;
  }>;
  total_price: number;
  status: string;
  client_name: string;
  vehicle_type: string;
  package_type: string;
  estimated_duration: number;
  total_distance: number;
  delivery_fee_per_stop: number;
}

const CourierMultiDestinationScreen: React.FC = () => {
  const [deliveries, setDeliveries] = useState<MultiDestinationDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadMultiDestinationDeliveries();
  }, []);

  const loadMultiDestinationDeliveries = async () => {
    try {
      setLoading(true);
      // Récupérer les livraisons multi-destinations disponibles
      const response = await DeliveryService.getAvailableDeliveries({
        delivery_type: 'multi_destination',
        status: 'pending'
      });
      setDeliveries(response);
    } catch (error) {
      console.error('Erreur lors du chargement des livraisons multi-destinations:', error);
      Alert.alert('Erreur', 'Impossible de charger les livraisons multi-destinations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMultiDestinationDeliveries();
    setRefreshing(false);
  };

  const acceptMultiDestinationDelivery = async (deliveryId: string) => {
    try {
      Alert.alert(
        'Accepter la livraison',
        'Voulez-vous accepter cette livraison multi-destinations ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Accepter',
            onPress: async () => {
              await DeliveryService.acceptDelivery(deliveryId);
              Alert.alert('Succès', 'Livraison acceptée avec succès');
              loadMultiDestinationDeliveries();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la livraison');
    }
  };

  const renderDestination = (destination: any, index: number) => (
    <View key={destination.id} style={styles.destinationItem}>
      <View style={styles.destinationNumber}>
        <Text style={styles.destinationNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.destinationInfo}>
        <Text style={styles.destinationAddress} numberOfLines={2}>
          {destination.address}
        </Text>
        <Text style={styles.recipientName}>{destination.recipient_name}</Text>
        <Text style={styles.recipientPhone}>{destination.recipient_phone}</Text>
        {destination.delivery_notes && (
          <Text style={styles.deliveryNotes} numberOfLines={2}>
            Notes: {destination.delivery_notes}
          </Text>
        )}
      </View>
    </View>
  );

  const renderDeliveryItem = ({ item }: { item: MultiDestinationDelivery }) => (
    <Card style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.deliveryTitle}>{item.title}</Text>
          <Text style={styles.clientName}>Client: {item.client_name}</Text>
        </View>
        <DeliveryStatusBadge status={item.status} />
      </View>

      <View style={styles.pickupSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={16} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Point de collecte</Text>
        </View>
        <Text style={styles.pickupAddress}>{item.pickup_address}</Text>
      </View>

      <View style={styles.destinationsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flag-outline" size={16} color="#FF5722" />
          <Text style={styles.sectionTitle}>
            Destinations ({item.destinations.length})
          </Text>
        </View>
        <ScrollView style={styles.destinationsList} nestedScrollEnabled>
          {item.destinations
            .sort((a, b) => a.order - b.order)
            .map((destination, index) => renderDestination(destination, index))}
        </ScrollView>
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
          <Text style={styles.detailText}>{item.total_distance} km</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.estimated_duration} min</Text>
        </View>
      </View>

      <View style={styles.pricingDetails}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Prix par arrêt:</Text>
          <Text style={styles.pricingValue}>{item.delivery_fee_per_stop} FCFA</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Nombre d'arrêts:</Text>
          <Text style={styles.pricingValue}>{item.destinations.length}</Text>
        </View>
        <View style={[styles.pricingRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{item.total_price} FCFA</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptMultiDestinationDelivery(item.id)}
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
        <Text style={styles.headerTitle}>Livraisons Multi-Destinations</Text>
      </View>

      {deliveries.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="Aucune livraison multi-destinations"
          message="Il n'y a pas de livraisons multi-destinations disponibles pour le moment"
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
    marginBottom: 16,
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
  pickupSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  pickupAddress: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  destinationsSection: {
    marginBottom: 16,
  },
  destinationsList: {
    maxHeight: 200,
  },
  destinationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  destinationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destinationNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  recipientPhone: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  deliveryNotes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  deliveryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  pricingDetails: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  cardFooter: {
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CourierMultiDestinationScreen;
