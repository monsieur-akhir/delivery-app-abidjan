
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { Text, Card, Button, Surface, List, Divider, FAB, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrice } from '../../utils/formatters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'

type WalletScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Wallet'>
}

interface WalletBalance {
  main_balance: number
  pending_balance: number
  total_spent: number
  total_refunds: number
}

interface Transaction {
  id: number
  type: 'payment' | 'refund' | 'bonus' | 'penalty'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  created_at: string
  delivery_id?: number
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadWalletData = async () => {
    try {
      // API call to get wallet balance
      const balanceResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })
      const balanceData = await balanceResponse.json()
      setBalance(balanceData)

      // API call to get transaction history
      const transactionsResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })
      const transactionsData = await transactionsResponse.json()
      setTransactions(transactionsData)
    } catch (error) {
      console.error('Error loading wallet data:', error)
      Alert.alert('Erreur', 'Impossible de charger les données du portefeuille')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWalletData()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadWalletData()
    setRefreshing(false)
  }

  const handleAddFunds = () => {
    navigation.navigate('AddFunds')
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment': return 'credit-card'
      case 'refund': return 'arrow-down-left'
      case 'bonus': return 'gift'
      case 'penalty': return 'alert-triangle'
      default: return 'circle'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'payment': return '#f44336'
      case 'refund': return '#4caf50'
      case 'bonus': return '#ff9800'
      case 'penalty': return '#f44336'
      default: return '#757575'
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement du portefeuille...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B00']} />
        }
      >
        {/* Balance Card */}
        {balance && (
          <Card style={styles.balanceCard}>
            <LinearGradient
              colors={['#FF6B00', '#FF8F00']}
              style={styles.balanceGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceTitle}>Solde Principal</Text>
                <TouchableOpacity>
                  <Feather name="eye" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>
                {formatPrice(balance.main_balance)} F
              </Text>
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatLabel}>En attente</Text>
                  <Text style={styles.balanceStatValue}>
                    {formatPrice(balance.pending_balance)} F
                  </Text>
                </View>
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatLabel}>Dépenses totales</Text>
                  <Text style={styles.balanceStatValue}>
                    {formatPrice(balance.total_spent)} F
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Card>
        )}

        {/* Quick Actions */}
        <Surface style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddFunds}>
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Feather name="plus" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Ajouter des fonds</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('PaymentMethods')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
                <Feather name="credit-card" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Méthodes de paiement</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('TransactionHistory')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
                <Feather name="list" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Historique</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Recent Transactions */}
        <Surface style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.length > 0 ? (
            <View>
              {transactions.slice(0, 5).map((transaction, index) => (
                <View key={transaction.id}>
                  <List.Item
                    title={transaction.description}
                    description={new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    left={() => (
                      <View style={[
                        styles.transactionIcon,
                        { backgroundColor: getTransactionColor(transaction.type) }
                      ]}>
                        <Feather 
                          name={getTransactionIcon(transaction.type)} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                      </View>
                    )}
                    right={() => (
                      <View style={styles.transactionAmount}>
                        <Text style={[
                          styles.amountText,
                          { 
                            color: transaction.type === 'refund' || transaction.type === 'bonus' 
                              ? '#4CAF50' 
                              : '#f44336' 
                          }
                        ]}>
                          {transaction.type === 'refund' || transaction.type === 'bonus' ? '+' : '-'}
                          {formatPrice(Math.abs(transaction.amount))} F
                        </Text>
                        <Text style={styles.statusText}>
                          {transaction.status === 'completed' ? 'Terminé' : 
                           transaction.status === 'pending' ? 'En attente' : 'Échoué'}
                        </Text>
                      </View>
                    )}
                    onPress={() => {
                      if (transaction.delivery_id) {
                        navigation.navigate('DeliveryDetails', { 
                          deliveryId: transaction.delivery_id.toString() 
                        })
                      }
                    }}
                  />
                  {index < transactions.slice(0, 5).length - 1 && <Divider />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="credit-card" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>Aucune transaction</Text>
            </View>
          )}
        </Surface>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={handleAddFunds}
        label="Ajouter"
      />
    </SafeAreaView>
  )
}

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
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#212121',
  },
  transactionsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FF6B00',
  },
})

export default WalletScreen
