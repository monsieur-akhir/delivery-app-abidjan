
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native'
import { Text, Card, Surface, Chip, Searchbar, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrice } from '../../utils/formatters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'

type TransactionHistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransactionHistory'>
}

interface Transaction {
  id: number
  type: 'payment' | 'refund' | 'bonus' | 'penalty' | 'add_funds'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  delivery_id?: number
  payment_method?: string
}

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  const filters = [
    { key: 'all', label: 'Tout', count: transactions.length },
    { key: 'payment', label: 'Paiements', count: transactions.filter(t => t.type === 'payment').length },
    { key: 'refund', label: 'Remboursements', count: transactions.filter(t => t.type === 'refund').length },
    { key: 'add_funds', label: 'Ajouts', count: transactions.filter(t => t.type === 'add_funds').length },
  ]

  const loadTransactions = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/wallet/transactions?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()
      setTransactions(data)
      setFilteredTransactions(data)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, selectedFilter, transactions])

  const applyFilters = () => {
    let filtered = transactions

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(t => t.type === selectedFilter)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTransactions(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadTransactions()
    setRefreshing(false)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment': return 'credit-card'
      case 'refund': return 'arrow-down-left'
      case 'bonus': return 'gift'
      case 'penalty': return 'alert-triangle'
      case 'add_funds': return 'plus-circle'
      default: return 'circle'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment': return '#f44336'
      case 'refund': return '#4caf50'
      case 'bonus': return '#ff9800'
      case 'penalty': return '#f44336'
      case 'add_funds': return '#2196f3'
      default: return '#757575'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50'
      case 'pending': return '#ff9800'
      case 'failed': return '#f44336'
      default: return '#757575'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé'
      case 'pending': return 'En attente'
      case 'failed': return 'Échoué'
      default: return 'Inconnu'
    }
  }

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card style={styles.transactionCard}>
      <TouchableOpacity
        style={styles.transactionContent}
        onPress={() => {
          if (item.delivery_id) {
            navigation.navigate('DeliveryDetails', { 
              deliveryId: item.delivery_id.toString() 
            })
          }
        }}
      >
        <View style={styles.transactionLeft}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: getTransactionColor(item.type) }
          ]}>
            <Feather 
              name={getTransactionIcon(item.type)} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionDate}>
              {new Date(item.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {item.payment_method && (
              <Text style={styles.paymentMethod}>via {item.payment_method}</Text>
            )}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { 
              color: item.type === 'refund' || item.type === 'bonus' || item.type === 'add_funds'
                ? '#4CAF50' 
                : '#f44336' 
            }
          ]}>
            {item.type === 'refund' || item.type === 'bonus' || item.type === 'add_funds' ? '+' : '-'}
            {formatPrice(Math.abs(item.amount))} F
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" iconColor="#212121" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <Surface style={styles.searchContainer}>
        <SearchBar
          placeholder="Rechercher une transaction..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </Surface>

      {/* Filters */}
      <Surface style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Chip
              selected={selectedFilter === item.key}
              onPress={() => setSelectedFilter(item.key)}
              style={[
                styles.filterChip,
                selectedFilter === item.key && styles.selectedFilterChip
              ]}
              textStyle={
                selectedFilter === item.key ? styles.selectedFilterText : styles.filterText
              }
            >
              {item.label} ({item.count})
            </Chip>
          )}
        />
      </Surface>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="list" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>Aucune transaction trouvée</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  searchbar: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedFilterChip: {
    backgroundColor: '#FF6B00',
  },
  filterText: {
    fontSize: 12,
    color: '#212121',
  },
  selectedFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  transactionContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#757575',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#FF6B00',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
})

export default TransactionHistoryScreen
