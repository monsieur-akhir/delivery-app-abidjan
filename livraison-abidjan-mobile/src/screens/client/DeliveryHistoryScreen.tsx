
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { TextInput, Button, Chip } from 'react-native-paper'
import DeliveryService from '../../services/DeliveryService'
import DeliveryStatusBadge from '../../components/DeliveryStatusBadge'
import { useAuth } from '../../contexts/AuthContext'

interface DeliveryHistoryScreenProps {
  navigation: any
}

const DeliveryHistoryScreen = ({ navigation }: DeliveryHistoryScreenProps) => {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'accepted', label: 'Acceptée' },
    { value: 'picked_up', label: 'Collectée' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'delivered', label: 'Livrée' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' }
  ]

  const dateOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' }
  ]

  useEffect(() => {
    loadDeliveries()
  }, [])

  useEffect(() => {
    filterDeliveries()
  }, [deliveries, searchQuery, selectedStatus, dateFilter])

  const loadDeliveries = async () => {
    if (!user) return

    try {
      const response = await DeliveryService.getUserDeliveries(user.id)
      setDeliveries(response)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterDeliveries = () => {
    let filtered = [...deliveries]

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(delivery =>
        delivery.id.toString().includes(searchQuery) ||
        delivery.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        delivery.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrage par statut
    if (selectedStatus) {
      filtered = filtered.filter(delivery => delivery.status === selectedStatus)
    }

    // Filtrage par date
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.created_at)
        
        switch (dateFilter) {
          case 'today':
            return deliveryDate >= today
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return deliveryDate >= weekAgo
          case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
            return deliveryDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Trier par date de création (plus récent en premier)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFilteredDeliveries(filtered)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadDeliveries()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedStatus('')
    setDateFilter('all')
    setShowFilters(false)
  }

  const renderDeliveryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryId}>Livraison #{item.id}</Text>
          <Text style={styles.deliveryDate}>{formatDate(item.created_at)}</Text>
        </View>
        <DeliveryStatusBadge status={item.status} />
      </View>

      <View style={styles.deliveryBody}>
        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="flag" size={16} color="#f44336" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.deliveryDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.deliveryFooter}>
        <Text style={styles.deliveryPrice}>
          {formatPrice(item.total_price || item.proposed_price)} FCFA
        </Text>
        {item.courier && (
          <Text style={styles.courierName}>
            Par {item.courier.full_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Statut</Text>
              <View style={styles.chipContainer}>
                {statusOptions.map((option) => (
                  <Chip
                    key={option.value}
                    selected={selectedStatus === option.value}
                    onPress={() => setSelectedStatus(option.value)}
                    style={styles.filterChip}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Période</Text>
              <View style={styles.chipContainer}>
                {dateOptions.map((option) => (
                  <Chip
                    key={option.value}
                    selected={dateFilter === option.value}
                    onPress={() => setDateFilter(option.value as "today" | "week" | "month" | "all")}
                    style={styles.filterChip}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={clearFilters}
              style={styles.clearButton}
            >
              Effacer
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowFilters(false)}
              style={styles.applyButton}
            >
              Appliquer
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des livraisons</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <TextInput
          label="Rechercher..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
          placeholder="ID, adresse, description..."
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredDeliveries.length > 0 ? (
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedStatus || dateFilter !== 'all'
              ? 'Aucun résultat'
              : 'Aucune livraison'
            }
          </Text>
          <Text style={styles.emptyMessage}>
            {searchQuery || selectedStatus || dateFilter !== 'all'
              ? 'Aucune livraison ne correspond à vos critères'
              : 'Vous n\'avez pas encore effectué de livraisons'
            }
          </Text>
        </View>
      )}

      {renderFilterModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deliveryDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deliveryBody: {
    marginBottom: 12,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  deliveryDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  courierName: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    maxHeight: 400,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
})

export default DeliveryHistoryScreen
