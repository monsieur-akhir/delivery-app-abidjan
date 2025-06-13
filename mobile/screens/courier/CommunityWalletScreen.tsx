import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import walletService from '../../services/CommunityWalletService';
import type { Transaction as ModelTransaction } from '../../types/models';
import { styles } from './CommunityWalletScreen.styles';

interface ServiceTransaction {
  id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "payment" | "refund" | "bonus" | "loan" | "repayment" | "contribution";
  status: "pending" | "completed" | "failed";
  reference?: string;
  description?: string;
  created_at: string;
}

interface LoanRequest {
  amount: number;
  reason: string;
}

interface Loan {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  approved_at?: string;
  repaid_at?: string;
  due_date?: string;
  created_at: string;
}

interface WalletBalance {
  balance: number;
  currency: string;
  total_contributed: number;
  total_borrowed: number;
  available_credit: number;
}

export const CommunityWalletScreen: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<ServiceTransaction[]>([]);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [loanHistory, setLoanHistory] = useState<Loan[]>([]);
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'loans'>('balance');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanReason, setLoanReason] = useState('');

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
      `Êtes-vous sûr de vouloir rembourser ${activeLoan.amount} FCFA ?`,
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
            {balance.available_credit > 0 && (
              <Text style={styles.balanceLabel}>
                Crédit disponible: {balance.available_credit.toLocaleString()} {balance.currency}
              </Text>
            )}
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
                  <Text style={styles.loanLabel}>Montant:</Text>
                  <Text style={styles.loanValue}>
                    {activeLoan.amount.toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>Statut:</Text>
                  <Text style={styles.loanValue}>{activeLoan.status}</Text>
                </View>
                {activeLoan.due_date && (
                  <View style={styles.loanRow}>
                    <Text style={styles.loanLabel}>Échéance:</Text>
                    <Text style={styles.loanValue}>
                      {new Date(activeLoan.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
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
              transaction.status === "completed" ? styles.completedStatus : styles.pendingStatus
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
              loan.status === 'approved' ? styles.completedStatus : styles.pendingStatus
            ]}>
              <Text style={styles.statusText}>{loan.status}</Text>
            </View>
          </View>
          <Text style={styles.loanLabel}>
            Demandé le: {new Date(loan.created_at).toLocaleDateString()}
          </Text>
          {loan.due_date && (
            <Text style={styles.loanLabel}>
              Échéance: {new Date(loan.due_date).toLocaleDateString()}
            </Text>
          )}
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
      <View style={styles.header}>
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
      <View style={styles.container}>
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
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Demande de Prêt</Text>
            <TouchableOpacity onPress={() => setShowLoanModal(false)}>
              <Feather name="x" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.container}>
            <View style={styles.container}>
              <Text style={styles.inputLabel}>Montant (FCFA) *</Text>
              <TextInput
                style={styles.input}
                value={loanAmount}
                onChangeText={setLoanAmount}
                placeholder="Ex: 50000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.container}>
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

            <TouchableOpacity
              style={styles.submitButton}
              onPress={requestLoan}
            >
              <Text style={styles.submitButtonText}>Soumettre la demande</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
