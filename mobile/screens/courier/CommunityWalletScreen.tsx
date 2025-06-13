import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { Card, Button, Surface, FAB } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { FeatherIcon } from '../../components/FeatherIcon'
import { formatPrice } from '../../utils/formatters'

interface CommunityTransaction {
  id: string
  type: 'contribution' | 'withdrawal' | 'loan' | 'repayment'
  amount: number
  date: string
  description: string
  status: 'pending' | 'completed' | 'failed'
}

const CommunityWalletScreen: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [totalContributions, setTotalContributions] = useState(0)
  const [pendingLoans, setPendingLoans] = useState(0)
  const [transactions, setTransactions] = useState<CommunityTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWalletData()
  }, [])

  const loadWalletData = async () => {
    try {
      // Données simulées pour la démo
      setBalance(25000)
      setTotalContributions(150000)
      setPendingLoans(10000)

      setTransactions([
        {
          id: '1',
          type: 'contribution',
          amount: 5000,
          date: new Date().toISOString(),
          description: 'Contribution mensuelle',
          status: 'completed'
        },
        {
          id: '2',
          type: 'loan',
          amount: 15000,
          date: new Date(Date.now() - 86400000).toISOString(),
          description: 'Prêt pour équipement',
          status: 'pending'
        }
      ])
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données du portefeuille')
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = () => {
    Alert.alert('Contribution', 'Fonctionnalité de contribution en développement')
  }

  const handleRequestLoan = () => {
    Alert.alert('Demande de prêt', 'Fonctionnalité de prêt en développement')
  }

  const renderTransaction = (transaction: CommunityTransaction) => {
    const getIcon = () => {
      switch (transaction.type) {
        case 'contribution': return 'plus-circle'
        case 'withdrawal': return 'minus-circle'
        case 'loan': return 'arrow-down-circle'
        case 'repayment': return 'arrow-up-circle'
        default: return 'circle'
      }
    }

    const getColor = () => {
      switch (transaction.type) {
        case 'contribution': return '#4CAF50'
        case 'withdrawal': return '#F44336'
        case 'loan': return '#FF9800'
        case 'repayment': return '#2196F3'
        default: return '#757575'
      }
    }

    return (
      <Card key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionContent}>
          <FeatherIcon name={getIcon()} size={24} color={getColor()} />
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={styles.transactionDate}>
              {new Date(transaction.date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <Text style={[styles.transactionAmount, { color: getColor() }]}>
            {transaction.type === 'withdrawal' || transaction.type === 'loan' ? '-' : '+'}
            {formatPrice(transaction.amount)} FCFA
          </Text>
        </View>
      </Card>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Chargement...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Surface style={styles.balanceCard} elevation={4}>
          <Text style={styles.balanceLabel}>Solde du portefeuille communautaire</Text>
          <Text style={styles.balanceAmount}>{formatPrice(balance)} FCFA</Text>
        </Surface>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Contributions totales</Text>
            <Text style={styles.statValue}>{formatPrice(totalContributions)} FCFA</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Prêts en cours</Text>
            <Text style={styles.statValue}>{formatPrice(pendingLoans)} FCFA</Text>
          </Card>
        </View>

        <View style={styles.actionsContainer}>
          <Button mode="contained" onPress={handleContribute} style={styles.actionButton}>
            Contribuer
          </Button>
          <Button mode="outlined" onPress={handleRequestLoan} style={styles.actionButton}>
            Demander un prêt
          </Button>
        </View>

        <Text style={styles.sectionTitle}>Transactions récentes</Text>
        {transactions.map(renderTransaction)}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleContribute}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF6B00',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FF6B00',
  },
})

export default CommunityWalletScreen