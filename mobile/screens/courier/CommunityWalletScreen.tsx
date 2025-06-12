import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CommunityWalletService } from '../../services/CommunityWalletService';
import type { WalletBalance, WalletTransaction, LoanResponse, ActiveLoan } from '../../types/models';

interface LoanRequest {
  amount: number;
  reason: string;
  monthly_income?: number;
  employment_status?: string;
}

export const CommunityWalletScreen: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null);
  const [loanHistory, setLoanHistory] = useState<LoanResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'loans'>('balance');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanReason, setLoanReason] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const walletService = new CommunityWalletService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, transactionsData, activeLoanData, historyData] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(),
        walletService.getActiveLoan().catch(() => null),
        walletService.getLoanHistory(),
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);
      setActiveLoan(activeLoanData);
      setLoanHistory(historyData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const requestLoan = async () => {
    if (!loanAmount || !loanReason) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const loanRequest: LoanRequest = {
        amount: parseFloat(loanAmount),
        reason: loanReason,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        employment_status: 'courier',
      };

      await walletService.requestLoan(loanRequest.amount, loanRequest.reason);

      Alert.alert(
        'Demande soumise',
        'Votre demande de prêt a été soumise et sera examinée dans les plus brefs délais.',
        [{ text: 'OK', onPress: () => setShowLoanModal(false) }]
      );

      // Reset form
      setLoanAmount('');
      setLoanReason('');
      setMonthlyIncome('');

      // Refresh data
      await loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de soumettre la demande de prêt');
      console.error('Loan request error:', error);
    }
  };

  const repayLoan = async () => {
    if (!activeLoan) return;

    Alert.alert(
      'Confirmer le remboursement',
      `Êtes-vous sûr de vouloir rembourser ${activeLoan.remaining_balance} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await walletService.repayLoan(activeLoan.id);
              Alert.alert('Succès', 'Prêt remboursé avec succès');
              await loadData();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de rembourser le prêt');
              console.error('Repay loan error:', error);
            }
          },
        },
      ]
    );
  };

  const renderBalanceTab = () => (
    <ScrollView style={styles.tabContent}>
      {balance && (
        <>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Solde Disponible</Text>
            <Text style={styles.balanceAmount}>
              {balance.balance.toLocaleString()} {balance.currency}
            </Text>
            {balance.pending_balance && balance.pending_balance > 0 && (
              <Text style={styles.pendingBalance}>
                En attente: {balance.pending_balance.toLocaleString()} {balance.currency}
              </Text>
            )}
            <Text style={styles.lastUpdated}>
              Mis à jour: {new Date(balance.last_updated).toLocaleDateString()}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Actions Rapides</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowLoanModal(true)}
                disabled={!!activeLoan}
              >
                <Feather name="plus-circle" size={24} color="#007AFF" />
                <Text style={styles.actionButtonText}>Demander un prêt</Text>
              </TouchableOpacity>

              {activeLoan && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={repayLoan}
                >
                  <Feather name="credit-card" size={24} color="#28a745" />
                  <Text style={styles.actionButtonText}>Rembourser</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Active Loan */}
          {activeLoan && (
            <View style={styles.loanCard}>
              <Text style={styles.sectionTitle}>Prêt Actif</Text>
              <View style={styles.loanDetails}>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>Montant restant:</Text>
                  <Text style={styles.loanValue}>
                    {activeLoan.remaining_balance.toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>Paiement mensuel:</Text>
                  <Text style={styles.loanValue}>
                    {activeLoan.monthly_payment.toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>Prochaine échéance:</Text>
                  <Text style={styles.loanValue}>
                    {new Date(activeLoan.next_payment_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>Taux d'intérêt:</Text>
                  <Text style={styles.loanValue}>{activeLoan.interest_rate}%</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderTransactionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Historique des Transactions</Text>
      {transactions.map((transaction) => (
        <View key={transaction.id} style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>{transaction.type}</Text>
            <Text style={[
              styles.transactionAmount,
              transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
            ]}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} FCFA
            </Text>
          </View>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          <View style={styles.transactionFooter}>
            <Text style={styles.transactionDate}>
              {new Date(transaction.created_at).toLocaleDateString()}
            </Text>
            <View style={[
              styles.statusBadge,
              transaction.status === 'completed' ? styles.completedStatus : styles.pendingStatus
            ]}>
              <Text style={styles.statusText}>{transaction.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderLoansTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Historique des Prêts</Text>
      {loanHistory.map((loan) => (
        <View key={loan.id} style={styles.loanHistoryCard}>
          <View style={styles.loanHistoryHeader}>
            <Text style={styles.loanAmount}>{loan.amount.toLocaleString()} FCFA</Text>
            <View style={[
              styles.statusBadge,
              loan.status === 'approved' ? styles.approvedStatus :
              loan.status === 'rejected' ? styles.rejectedStatus : styles.pendingStatus
            ]}>
              <Text style={styles.statusText}>{loan.status}</Text>
            </View>
          </View>
          <Text style={styles.loanDate}>
            Demandé le: {new Date(loan.created_at).toLocaleDateString()}
          </Text>
          {loan.due_date && (
            <Text style={styles.loanDueDate}>
              Échéance: {new Date(loan.due_date).toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.loanInterest}>
            Taux: {loan.interest_rate}% - Paiement mensuel: {loan.monthly_payment.toLocaleString()} FCFA
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portefeuille Communautaire</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Feather name="refresh-cw" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'balance' && styles.activeTab]}
          onPress={() => setActiveTab('balance')}
        >
          <Text style={[styles.tabText, activeTab === 'balance' && styles.activeTabText]}>
            Solde
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loans' && styles.activeTab]}
          onPress={() => setActiveTab('loans')}
        >
          <Text style={[styles.tabText, activeTab === 'loans' && styles.activeTabText]}>
            Prêts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'balance' && renderBalanceTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
        {activeTab === 'loans' && renderLoansTab()}
      </View>

      {/* Loan Request Modal */}
      <Modal
        visible={showLoanModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Demande de Prêt</Text>
            <TouchableOpacity onPress={() => setShowLoanModal(false)}>
              <Feather name="x" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant (FCFA) *</Text>
              <TextInput
                style={styles.input}
                value={loanAmount}
                onChangeText={setLoanAmount}
                placeholder="Ex: 50000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Raison du prêt *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={loanReason}
                onChangeText={setLoanReason}
                placeholder="Expliquez pourquoi vous avez besoin de ce prêt"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Revenus mensuels (FCFA)</Text>
              <TextInput
                style={styles.input}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="Ex: 200000"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={requestLoan}
            >
              <Text style={styles.submitButtonText}>Soumettre la Demande</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  pendingBalance: {
    fontSize: 14,
    color: '#ffc107',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 120,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  loanDetails: {
    gap: 12,
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  loanValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#28a745',
  },
  negativeAmount: {
    color: '#dc3545',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  completedStatus: {
    backgroundColor: '#28a745',
  },
  pendingStatus: {
    backgroundColor: '#ffc107',
  },
  approvedStatus: {
    backgroundColor: '#007AFF',
  },
  rejectedStatus: {
    backgroundColor: '#dc3545',
  },
  loanHistoryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  loanHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  loanDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  loanDueDate: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 4,
  },
  loanInterest: {
    fontSize: 14,
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});