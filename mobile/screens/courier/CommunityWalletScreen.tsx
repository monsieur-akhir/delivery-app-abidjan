"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import {
  Text,
  Card,
  Button,
  Divider,
  IconButton,
  ActivityIndicator,
  TextInput,
  Chip,
  Dialog,
  Portal,
} from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { useNetwork } from "../../contexts/NetworkContext"
import {
  fetchWalletBalance,
  fetchWalletTransactions,
  requestLoan,
  repayLoan,
  fetchActiveLoan,
  fetchLoanHistory,
} from "../../services/api"

interface Transaction {
  id: string
  amount: number
  type: "deposit" | "withdrawal" | "payment" | "refund" | "bonus" | "loan" | "repayment" | "contribution"
  status: "pending" | "completed" | "failed"
  reference?: string
  description?: string
  created_at: string
}

interface Loan {
  id: string
  user_id: string
  amount: number
  reason: string
  status: "pending" | "approved" | "rejected" | "repaid"
  approved_at?: string
  repaid_at?: string
  due_date?: string
  created_at: string
}

interface WalletBalance {
  balance: number
  currency: string
  total_contributed: number
  total_borrowed: number
  available_credit: number
}

const CommunityWalletScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { isConnected } = useNetwork()

  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null)
  const [loanHistory, setLoanHistory] = useState<Loan[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("wallet")
  const [transactionFilter, setTransactionFilter] = useState<string>("all")
  const [loanAmount, setLoanAmount] = useState<string>("")
  const [loanReason, setLoanReason] = useState<string>("")
  const [requestingLoan, setRequestingLoan] = useState<boolean>(false)
  const [repayingLoan, setRepayingLoan] = useState<boolean>(false)
  const [loanDialogVisible, setLoanDialogVisible] = useState<boolean>(false)

  useEffect(() => {
    loadData()
  }, [isConnected])

  const loadData = async () => {
    if (!isConnected) {
      setError(t("common.offline"))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const balanceData = await fetchWalletBalance()
      setBalance(balanceData)

      const transactionsData = await fetchWalletTransactions()
      setTransactions(transactionsData)

      const activeLoanData = await fetchActiveLoan()
      setActiveLoan(activeLoanData)

      const loanHistoryData = await fetchLoanHistory()
      setLoanHistory(loanHistoryData)
    } catch (error) {
      console.error("Error loading wallet data:", error)
      setError(t("communityWallet.errorLoading"))
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLoan = async () => {
    if (!isConnected) {
      setError(t("common.offline"))
      return
    }

    if (!loanAmount || !loanReason) {
      Alert.alert(t("common.error"), t("communityWallet.missingLoanInfo"))
      return
    }

    const amount = Number.parseFloat(loanAmount)
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t("common.error"), t("communityWallet.invalidAmount"))
      return
    }

    try {
      setRequestingLoan(true)
      await requestLoan(amount, loanReason)

      // Mettre à jour l'état local
      setLoanDialogVisible(false)
      setLoanAmount("")
      setLoanReason("")

      // Recharger les données
      loadData()
    } catch (error) {
      console.error("Error requesting loan:", error)
      setError(t("communityWallet.errorRequestingLoan"))
    } finally {
      setRequestingLoan(false)
    }
  }

  const handleRepayLoan = async () => {
    if (!isConnected) {
      setError(t("common.offline"))
      return
    }

    if (!activeLoan) {
      return
    }

    try {
      setRepayingLoan(true)
      await repayLoan(activeLoan.id)

      // Recharger les données
      loadData()
    } catch (error) {
      console.error("Error repaying loan:", error)
      setError(t("communityWallet.errorRepayingLoan"))
    } finally {
      setRepayingLoan(false)
    }
  }

  const handleTransactionFilterChange = async (filter: string) => {
    setTransactionFilter(filter)

    if (!isConnected) {
      setError(t("common.offline"))
      return
    }

    try {
      const transactionsData = await fetchWalletTransactions(filter !== "all" ? filter : undefined)
      setTransactions(transactionsData)
    } catch (error) {
      console.error("Error filtering transactions:", error)
      setError(t("communityWallet.errorLoading"))
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2)} ${balance?.currency || "XOF"}`
  }

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case "deposit":
        return "arrow-down-circle"
      case "withdrawal":
        return "arrow-up-circle"
      case "payment":
        return "credit-card"
      case "refund":
        return "refresh-cw"
      case "bonus":
        return "gift"
      case "loan":
        return "trending-up"
      case "repayment":
        return "trending-down"
      case "contribution":
        return "users"
      default:
        return "dollar-sign"
    }
  }

  const getTransactionColor = (type: string): string => {
    switch (type) {
      case "deposit":
      case "refund":
      case "bonus":
        return "#4CAF50"
      case "withdrawal":
      case "payment":
        return "#F44336"
      case "loan":
        return "#2196F3"
      case "repayment":
        return "#FF9800"
      case "contribution":
        return "#9C27B0"
      default:
        return "#757575"
    }
  }

  const renderWalletTab = () => {
    if (!balance) return null

    return (
      <View style={styles.tabContent}>
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>{t("communityWallet.balance")}</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balance.balance)}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("communityWallet.totalContributed")}</Text>
                <Text style={styles.statValue}>{formatCurrency(balance.total_contributed)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("communityWallet.totalBorrowed")}</Text>
                <Text style={styles.statValue}>{formatCurrency(balance.total_borrowed)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("communityWallet.availableCredit")}</Text>
                <Text style={styles.statValue}>{formatCurrency(balance.available_credit)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {activeLoan && (
          <Card style={styles.activeLoanCard}>
            <Card.Content>
              <View style={styles.activeLoanHeader}>
                <Text style={styles.activeLoanTitle}>{t("communityWallet.activeLoan")}</Text>
                <Chip icon="calendar" style={styles.dueDateChip}>
                  {activeLoan.due_date ? formatDate(activeLoan.due_date).split(" ")[0] : t("common.notAvailable")}
                </Chip>
              </View>

              <View style={styles.loanDetailsContainer}>
                <View style={styles.loanDetailItem}>
                  <Text style={styles.loanDetailLabel}>{t("communityWallet.loanAmount")}</Text>
                  <Text style={styles.loanDetailValue}>{formatCurrency(activeLoan.amount)}</Text>
                </View>
                <View style={styles.loanDetailItem}>
                  <Text style={styles.loanDetailLabel}>{t("communityWallet.loanReason")}</Text>
                  <Text style={styles.loanDetailValue}>{activeLoan.reason}</Text>
                </View>
                <View style={styles.loanDetailItem}>
                  <Text style={styles.loanDetailLabel}>{t("communityWallet.loanStatus")}</Text>
                  <Chip style={styles.statusChip}>{t(`communityWallet.${activeLoan.status}`)}</Chip>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={handleRepayLoan}
                loading={repayingLoan}
                disabled={repayingLoan || activeLoan.status !== "approved"}
                style={styles.repayButton}
              >
                {t("communityWallet.repayLoan")}
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>{t("communityWallet.transactions")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            <Chip
              selected={transactionFilter === "all"}
              onPress={() => handleTransactionFilterChange("all")}
              style={styles.filterChip}
            >
              {t("communityWallet.all")}
            </Chip>
            <Chip
              selected={transactionFilter === "deposit"}
              onPress={() => handleTransactionFilterChange("deposit")}
              style={styles.filterChip}
            >
              {t("communityWallet.deposit")}
            </Chip>
            <Chip
              selected={transactionFilter === "withdrawal"}
              onPress={() => handleTransactionFilterChange("withdrawal")}
              style={styles.filterChip}
            >
              {t("communityWallet.withdrawal")}
            </Chip>
            <Chip
              selected={transactionFilter === "loan"}
              onPress={() => handleTransactionFilterChange("loan")}
              style={styles.filterChip}
            >
              {t("communityWallet.loan")}
            </Chip>
            <Chip
              selected={transactionFilter === "repayment"}
              onPress={() => handleTransactionFilterChange("repayment")}
              style={styles.filterChip}
            >
              {t("communityWallet.repayment")}
            </Chip>
            <Chip
              selected={transactionFilter === "contribution"}
              onPress={() => handleTransactionFilterChange("contribution")}
              style={styles.filterChip}
            >
              {t("communityWallet.contribution")}
            </Chip>
          </ScrollView>
        </View>

        {transactions.length > 0 ? (
          <View style={styles.transactionsContainer}>
            {transactions.map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <Card.Content style={styles.transactionContent}>
                  <View style={styles.transactionIconContainer}>
                    <IconButton
                      icon={getTransactionIcon(transaction.type)}
                      size={24}
                      color={getTransactionColor(transaction.type)}
                      style={styles.transactionIcon}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>{t(`communityWallet.${transaction.type}`)}</Text>
                    {transaction.description && (
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    )}
                    <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color: getTransactionColor(transaction.type),
                      },
                    ]}
                  >
                    {transaction.type === "deposit" ||
                    transaction.type === "refund" ||
                    transaction.type === "bonus" ||
                    transaction.type === "loan"
                      ? "+"
                      : "-"}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>{t("communityWallet.noTransactions")}</Text>
        )}

        {!activeLoan && (
          <Button
            mode="contained"
            onPress={() => setLoanDialogVisible(true)}
            style={styles.requestLoanButton}
            icon="cash-plus"
          >
            {t("communityWallet.requestLoan")}
          </Button>
        )}
      </View>
    )
  }

  const renderLoansTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.loansHistoryTitle}>{t("communityWallet.loanHistory")}</Text>

        {loanHistory.length > 0 ? (
          <View style={styles.loansContainer}>
            {loanHistory.map((loan) => (
              <Card key={loan.id} style={styles.loanCard}>
                <Card.Content>
                  <View style={styles.loanHeader}>
                    <View>
                      <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
                      <Text style={styles.loanDate}>{formatDate(loan.created_at).split(" ")[0]}</Text>
                    </View>
                    <Chip
                      style={[
                        styles.loanStatusChip,
                        {
                          backgroundColor:
                            loan.status === "approved"
                              ? "#4CAF5020"
                              : loan.status === "rejected"
                                ? "#F4433620"
                                : loan.status === "repaid"
                                  ? "#2196F320"
                                  : "#FF980020",
                        },
                      ]}
                    >
                      {t(`communityWallet.${loan.status}`)}
                    </Chip>
                  </View>

                  <Divider style={styles.loanDivider} />

                  <View style={styles.loanReasonContainer}>
                    <Text style={styles.loanReasonLabel}>{t("communityWallet.loanReason")}</Text>
                    <Text style={styles.loanReasonText}>{loan.reason}</Text>
                  </View>

                  {loan.due_date && (
                    <View style={styles.loanDueDateContainer}>
                      <Text style={styles.loanDueDateLabel}>{t("communityWallet.dueDate")}</Text>
                      <Text style={styles.loanDueDateText}>{formatDate(loan.due_date).split(" ")[0]}</Text>
                    </View>
                  )}

                  {loan.repaid_at && (
                    <View style={styles.loanRepaidContainer}>
                      <Text style={styles.loanRepaidLabel}>{t("communityWallet.repaidDate")}</Text>
                      <Text style={styles.loanRepaidText}>{formatDate(loan.repaid_at).split(" ")[0]}</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={styles.noDataText}>{t("communityWallet.noLoans")}</Text>
        )}
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>{t("communityWallet.loading")}</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadData} style={styles.retryButton}>
          {t("common.retry")}
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "wallet" && styles.activeTab]}
          onPress={() => setActiveTab("wallet")}
        >
          <Text style={[styles.tabText, activeTab === "wallet" && styles.activeTabText]}>
            {t("communityWallet.title")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "loans" && styles.activeTab]}
          onPress={() => setActiveTab("loans")}
        >
          <Text style={[styles.tabText, activeTab === "loans" && styles.activeTabText]}>
            {t("communityWallet.loans")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === "wallet" && renderWalletTab()}
        {activeTab === "loans" && renderLoansTab()}
      </ScrollView>

      <Portal>
        <Dialog visible={loanDialogVisible} onDismiss={() => setLoanDialogVisible(false)}>
          <Dialog.Title>{t("communityWallet.requestLoan")}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={t("communityWallet.loanAmount")}
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <TextInput
              label={t("communityWallet.loanReason")}
              value={loanReason}
              onChangeText={setLoanReason}
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLoanDialogVisible(false)}>{t("common.cancel")}</Button>
            <Button
              onPress={handleRequestLoan}
              loading={requestingLoan}
              disabled={requestingLoan || !loanAmount || !loanReason}
            >
              {t("common.submit")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF6B00",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B00",
  },
  tabText: {
    fontSize: 14,
    color: "#757575",
  },
  activeTabText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  balanceCard: {
    marginBottom: 16,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#757575",
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  activeLoanCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: "#FFF3E0",
  },
  activeLoanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeLoanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  dueDateChip: {
    backgroundColor: "#FFFFFF",
  },
  loanDetailsContainer: {
    marginBottom: 16,
  },
  loanDetailItem: {
    marginBottom: 8,
  },
  loanDetailLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  loanDetailValue: {
    fontSize: 16,
    color: "#212121",
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  repayButton: {
    backgroundColor: "#FF6B00",
  },
  transactionsHeader: {
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  transactionsContainer: {
    marginBottom: 16,
  },
  transactionCard: {
    marginBottom: 8,
    elevation: 1,
  },
  transactionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionIcon: {
    margin: 0,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  transactionDescription: {
    fontSize: 12,
    color: "#757575",
  },
  transactionDate: {
    fontSize: 12,
    color: "#757575",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noDataText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginTop: 24,
  },
  requestLoanButton: {
    backgroundColor: "#FF6B00",
    marginTop: 16,
  },
  loansHistoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  loansContainer: {
    marginBottom: 16,
  },
  loanCard: {
    marginBottom: 8,
    elevation: 1,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  loanDate: {
    fontSize: 12,
    color: "#757575",
  },
  loanStatusChip: {
    height: 28,
  },
  loanDivider: {
    marginVertical: 8,
  },
  loanReasonContainer: {
    marginBottom: 8,
  },
  loanReasonLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  loanReasonText: {
    fontSize: 14,
    color: "#212121",
  },
  loanDueDateContainer: {
    marginBottom: 8,
  },
  loanDueDateLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  loanDueDateText: {
    fontSize: 14,
    color: "#212121",
  },
  loanRepaidContainer: {
    marginBottom: 8,
  },
  loanRepaidLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  loanRepaidText: {
    fontSize: 14,
    color: "#212121",
  },
  dialogInput: {
    marginBottom: 16,
  },
  totalContributed: {
    fontSize: 14,
    color: "#757575",
  },
  totalBorrowed: {
    fontSize: 14,
    color: "#757575",
  },
  availableCredit: {
    fontSize: 14,
    color: "#757575",
  },
})

export default CommunityWalletScreen
