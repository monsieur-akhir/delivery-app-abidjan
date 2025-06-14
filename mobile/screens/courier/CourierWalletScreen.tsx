import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native"
import { Text, Card, Button, Divider, IconButton, Portal, Modal, TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useUser } from "../../hooks"
import { formatCurrency, formatDate } from "../../utils/formatters"
import EmptyState from "../../components/EmptyState"
import ErrorView from "../../components/ErrorView"

interface Transaction {
  id: string
  type: 'earning' | 'withdrawal' | 'bonus' | 'penalty'
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
}

const CourierWalletScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { colors } = useTheme()
    const {
    userProfile,
    error,
    getUserProfile,
    getWalletTransactions,
    requestPayout,
    user
  } = useUser()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawing, setWithdrawing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState(userProfile?.name || '')

  interface PayoutRequest {
        id: number;
        user_id: number;
        amount: number;
        method: string;
        status: string;
        requested_at: string;
  }

  const loadWalletData = useCallback(async () => {
    try {
      await getUserProfile()
      const transactionData = await getWalletTransactions()
      // Convert WalletTransaction to Transaction format
      const convertedTransactions: Transaction[] = transactionData.map((wt) => ({
        id: wt.id.toString(),
        amount: wt.amount,
        type: wt.type as 'earning' | 'withdrawal' | 'bonus' | 'penalty',
        description: wt.description,
        date: wt.created_at,
        status: wt.status as 'completed' | 'pending' | 'failed'
      }))
      setTransactions(convertedTransactions)
    } catch (err) {
      console.error("Error loading wallet data:", err)
    }
  }, [getUserProfile, getWalletTransactions])

  useEffect(() => {
    loadWalletData()
  }, [loadWalletData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadWalletData()
    setRefreshing(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      return
    }

    const amount = Number(withdrawAmount)
    if (amount <= 0 || amount > (userProfile?.wallet_balance || 0)) {
      return
    }    try {
      setWithdrawing(true)
      const payoutRequestData: PayoutRequest = {
        id: 0,
        user_id: user?.id || 0,
        amount,
        method: paymentMethod,
        status: 'pending',
        requested_at: new Date().toISOString(),
      }
      await requestPayout(payoutRequestData)
      setShowWithdrawModal(false)
      setWithdrawAmount("")
      await loadWalletData()
    } catch (err) {
      console.error("Error requesting withdrawal:", err)
    } finally {
      setWithdrawing(false)
    }
  }
  const getTransactionIcon = (type: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'earning':
        return { name: 'trending-up', color: '#4CAF50' }
      case 'withdrawal':
        return { name: 'trending-down', color: '#f44336' }
      case 'bonus':
        return { name: 'gift', color: '#FF9800' }
      case 'penalty':
        return { name: 'remove-circle', color: '#f44336' }
      default:
        return { name: 'swap-horizontal', color: colors.primary }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50'
      case 'pending':
        return '#FF9800'
      case 'failed':
        return '#f44336'
      default:
        return colors.text
    }
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadWalletData} />
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("wallet.title")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Balance Card */}
        <Card style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <Card.Content>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>
                {t("wallet.availableBalance")}
              </Text>
              <TouchableOpacity onPress={loadWalletData}>
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {formatCurrency(userProfile?.wallet_balance || 0)} FCFA
            </Text>
            <View style={styles.balanceActions}>
              <Button
                mode="contained"
                onPress={() => setShowWithdrawModal(true)}
                style={styles.withdrawButton}
                disabled={(userProfile?.wallet_balance || 0) < 1000}
              >
                {t("wallet.withdraw")}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(userProfile?.monthly_earnings || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                {t("wallet.thisMonth")}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Card.Content style={styles.statContent}>
              <Ionicons name="trophy" size={24} color="#FF9800" />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {userProfile?.completed_deliveries || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                {t("wallet.deliveries")}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Transactions */}
        <Card style={[styles.transactionsCard, { backgroundColor: colors.card }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("wallet.recentTransactions")}
            </Text>

            {transactions.length === 0 ? (
              <EmptyState
                icon="credit-card"
                title={t("wallet.noTransactions")}
                message={t("wallet.noTransactionsMessage")}
              />
            ) : (
              transactions.map((transaction, index) => {
                const icon = getTransactionIcon(transaction.type)
                return (
                  <View key={transaction.id}>
                    <View style={styles.transactionItem}>
                      <View style={styles.transactionIcon}>                        <Ionicons
                          name={icon.name}
                          size={20}
                          color={icon.color}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={[styles.transactionDescription, { color: colors.text }]}>
                          {transaction.description}
                        </Text>
                        <Text style={[styles.transactionDate, { color: colors.text }]}>
                          {formatDate(transaction.date)}
                        </Text>
                      </View>
                      <View style={styles.transactionAmount}>
                        <Text
                          style={[
                            styles.transactionAmountText,
                            {
                              color: transaction.type === 'withdrawal' || transaction.type === 'penalty'
                                ? '#f44336'
                                : '#4CAF50'
                            }
                          ]}
                        >
                          {transaction.type === 'withdrawal' || transaction.type === 'penalty' ? '-' : '+'}
                          {formatCurrency(transaction.amount)} FCFA
                        </Text>
                        <Text
                          style={[
                            styles.transactionStatus,
                            { color: getStatusColor(transaction.status) }
                          ]}
                        >
                          {t(`wallet.status.${transaction.status}`)}
                        </Text>
                      </View>
                    </View>
                    {index < transactions.length - 1 && <Divider style={styles.divider} />}
                  </View>
                )
              })
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Withdraw Modal */}
      <Portal>
        <Modal
          visible={showWithdrawModal}
          onDismiss={() => setShowWithdrawModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("wallet.withdrawFunds")}
          </Text>

          <Text style={[styles.modalBalance, { color: colors.text }]}>
            {t("wallet.availableBalance")}: {formatCurrency(userProfile?.wallet_balance || 0)} FCFA
          </Text>

          <TextInput
            label={t("wallet.amount")}
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.withdrawInput}
            right={<TextInput.Affix text="FCFA" />}
          />

          <Text style={[styles.withdrawNote, { color: colors.text }]}>
            {t("wallet.withdrawNote")}
          </Text>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowWithdrawModal(false)}
              style={styles.modalButton}
            >
              {t("common.cancel")}
            </Button>
            <Button
              mode="contained"
              onPress={handleWithdraw}
              loading={withdrawing}
              disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) <= 0}
              style={styles.modalButton}
            >
              {t("wallet.withdraw")}
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  balanceActions: {
    flexDirection: "row",
  },
  withdrawButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  transactionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalBalance: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  withdrawInput: {
    marginBottom: 16,
  },
  withdrawNote: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
})

export default CourierWalletScreen