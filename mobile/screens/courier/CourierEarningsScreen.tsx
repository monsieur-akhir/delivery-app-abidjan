"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native"
import { Text, Card, Button, Divider, Chip, ActivityIndicator, Menu } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { useNetwork } from "../../contexts/NetworkContext"
import { useUser } from "../../hooks"
import { formatPrice, formatDate } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

type CourierEarningsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CourierEarnings">
}

interface EarningsSummary {
  total_earnings: number
  available_balance: number
  pending_balance: number
  total_deliveries: number
  total_distance: number
  average_rating: number
}

interface EarningsHistory {
  date: string
  amount: number
  deliveries: number
}

interface Transaction {
  id: string
  type: "earning" | "withdrawal" | "bonus" | "fee"
  amount: number
  status: "completed" | "pending" | "failed"
  delivery_id?: string
  description: string
  created_at: string
}

const screenWidth = Dimensions.get("window").width

const CourierEarningsScreen: React.FC<CourierEarningsScreenProps> = ({ navigation: _navigation }) => {
  const { isOfflineMode } = useNetwork()
  const { getCourierEarnings, withdrawFunds } = useUser()

  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null)
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistory[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("week")
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [withdrawalLoading, setWithdrawalLoading] = useState<boolean>(false)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await getCourierEarnings(selectedPeriod)
      setEarningsSummary(data.summary)
      setEarningsHistory(data.history)
      setTransactions(data.transactions)
    } catch (error) {
      console.error("Error loading earnings data:", error)
    } finally {
      setLoading(false)
    }
  }, [getCourierEarnings, selectedPeriod])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleWithdraw = async (): Promise<void> => {
    if (!earningsSummary || earningsSummary.available_balance <= 0) {
      return
    }

    try {
      setWithdrawalLoading(true)
      await withdrawFunds(earningsSummary.available_balance, 'bank_transfer')

      // Mettre à jour les données après le retrait
      await loadData()
    } catch (error) {
      console.error("Error withdrawing funds:", error)
    } finally {
      setWithdrawalLoading(false)
    }
  }

  const renderChart = (): React.ReactNode => {
    if (!earningsHistory || earningsHistory.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Aucune donnée disponible</Text>
        </View>
      )
    }

    const labels = earningsHistory.map((item) => {
      const date = new Date(item.date)
      return selectedPeriod === "week"
        ? date.toLocaleDateString("fr-FR", { weekday: "short" }).substring(0, 3)
        : date.getDate().toString()
    })

    const data = earningsHistory.map((item) => item.amount)

    return (
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data,
              color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
              strokeWidth: 2,
            },
          ],
          legend: [`Gains (${selectedPeriod === "week" ? "7 derniers jours" : "30 derniers jours"})`],
        }}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: "#FFFFFF",
          backgroundGradientFrom: "#FFFFFF",
          backgroundGradientTo: "#FFFFFF",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#FF6B00",
          },
        }}
        bezier
        style={styles.chart}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes gains</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Feather name="calendar" size={24} color="#212121" />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedPeriod("week")
              setMenuVisible(false)
            }}
            title="7 derniers jours"
          />
          <Menu.Item
            onPress={() => {
              setSelectedPeriod("month")
              setMenuVisible(false)
            }}
            title="30 derniers jours"
          />
        </Menu>
      </View>

      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>Mode hors ligne</Text>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            {/* Résumé des gains */}
            {earningsSummary && (
              <Card style={styles.summaryCard}>
                <Card.Content>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Solde disponible</Text>
                    <Text style={styles.balanceAmount}>{formatPrice(earningsSummary.available_balance)} FCFA</Text>
                    <Button
                      mode="contained"
                      onPress={handleWithdraw}
                      style={styles.withdrawButton}
                      disabled={earningsSummary.available_balance <= 0 || withdrawalLoading}
                      loading={withdrawalLoading}
                    >
                      Retirer les fonds
                    </Button>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{formatPrice(earningsSummary.total_earnings)} FCFA</Text>
                      <Text style={styles.statLabel}>Gains totaux</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{earningsSummary.total_deliveries}</Text>
                      <Text style={styles.statLabel}>Livraisons</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{earningsSummary.average_rating.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>Note moyenne</Text>
                    </View>
                  </View>

                  <View style={styles.pendingContainer}>
                    <Text style={styles.pendingLabel}>En attente de paiement</Text>
                    <Text style={styles.pendingAmount}>{formatPrice(earningsSummary.pending_balance)} FCFA</Text>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Graphique des gains */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Évolution des gains</Text>
                <View style={styles.periodSelector}>
                  <Chip
                    selected={selectedPeriod === "week"}
                    onPress={() => setSelectedPeriod("week")}
                    style={styles.periodChip}
                    textStyle={selectedPeriod === "week" ? styles.selectedPeriodText : {}}
                  >
                    Semaine
                  </Chip>
                  <Chip
                    selected={selectedPeriod === "month"}
                    onPress={() => setSelectedPeriod("month")}
                    style={styles.periodChip}
                    textStyle={selectedPeriod === "month" ? styles.selectedPeriodText : {}}
                  >
                    Mois
                  </Chip>
                </View>
              </View>

              <Card style={styles.chartCard}>
                <Card.Content>{renderChart()}</Card.Content>
              </Card>
            </View>

            {/* Transactions récentes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transactions récentes</Text>

              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <Card key={transaction.id} style={styles.transactionCard}>
                    <Card.Content>
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionType}>
                            {transaction.type === "earning"
                              ? "Gain de livraison"
                              : transaction.type === "withdrawal"
                                ? "Retrait"
                                : transaction.type === "bonus"
                                  ? "Bonus"
                                  : "Frais"}
                          </Text>
                          <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                        </View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            transaction.type === "withdrawal" || transaction.type === "fee"
                              ? styles.negativeAmount
                              : styles.positiveAmount,
                          ]}
                        >
                          {transaction.type === "withdrawal" || transaction.type === "fee" ? "-" : "+"}
                          {formatPrice(transaction.amount)} FCFA
                        </Text>
                      </View>

                      {transaction.description && (
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      )}

                      {transaction.status === "pending" && (
                        <Chip style={styles.pendingChip} textStyle={styles.pendingChipText}>
                          En attente
                        </Chip>
                      )}
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="credit-card" size={40} color="#CCCCCC" />
                  <Text style={styles.emptyText}>Aucune transaction récente</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    padding: 8,
  },
  offlineText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  summaryCard: {
    margin: 16,
    elevation: 2,
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  withdrawButton: {
    backgroundColor: "#FF6B00",
  },
  divider: {
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  pendingContainer: {
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingLabel: {
    fontSize: 14,
    color: "#FF8F00",
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF8F00",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  periodSelector: {
    flexDirection: "row",
  },
  periodChip: {
    marginLeft: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedPeriodText: {
    color: "#FF6B00",
  },
  chartCard: {
    marginHorizontal: 16,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  chartPlaceholderText: {
    color: "#757575",
  },
  transactionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  transactionDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  positiveAmount: {
    color: "#4CAF50",
  },
  negativeAmount: {
    color: "#F44336",
  },
  transactionDescription: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  pendingChip: {
    backgroundColor: "#FFF8E1",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  pendingChipText: {
    color: "#FF8F00",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 16,
    color: "#757575",
    fontSize: 16,
  },
})

export default CourierEarningsScreen
