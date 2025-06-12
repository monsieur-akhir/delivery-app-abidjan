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
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native"
import { Text, Card, Button, Surface, Chip, FAB, Modal, Portal } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../../contexts/AuthContext"
import { formatPrice } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

type CommunityWalletScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CommunityWallet">
}

interface WalletBalance {
  personal: number
  community: number
  available_for_loan: number
  pending_loans: number
}

interface Loan {
  id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'repaid'
  interest_rate: number
  repayment_date: string
  requested_date: string
  duration_days: number
}

interface Transaction {
  id: string
  type: 'contribution' | 'loan_request' | 'loan_repayment' | 'donation'
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending'
}

const CommunityWalletScreen: React.FC<CommunityWalletScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  
  const [refreshing, setRefreshing] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'loans' | 'history'>('overview')
  
  const [balance, setBalance] = useState<WalletBalance>({
    personal: 45000,
    community: 125000,
    available_for_loan: 80000,
    pending_loans: 15000
  })

  const [loans, setLoans] = useState<Loan[]>([
    {
      id: '1',
      amount: 15000,
      reason: 'Réparation de moto',
      status: 'approved',
      interest_rate: 5,
      repayment_date: '2024-02-15',
      requested_date: '2024-01-15',
      duration_days: 30
    },
    {
      id: '2',
      amount: 25000,
      reason: 'Achat de carburant',
      status: 'pending',
      interest_rate: 3,
      repayment_date: '2024-02-20',
      requested_date: '2024-01-20',
      duration_days: 30
    }
  ])

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'contribution',
      amount: 5000,
      description: 'Cotisation mensuelle',
      date: '2024-01-25',
      status: 'completed'
    },
    {
      id: '2',
      type: 'loan_request',
      amount: 15000,
      description: 'Prêt approuvé - Réparation moto',
      date: '2024-01-15',
      status: 'completed'
    }
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    // Simuler le chargement des données
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50'
      case 'pending': return '#FF9800'
      case 'rejected': return '#F44336'
      case 'repaid': return '#2196F3'
      default: return '#757575'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé'
      case 'pending': return 'En attente'
      case 'rejected': return 'Rejeté'
      case 'repaid': return 'Remboursé'
      default: return status
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'contribution': return 'plus-circle'
      case 'loan_request': return 'arrow-down-circle'
      case 'loan_repayment': return 'arrow-up-circle'
      case 'donation': return 'heart'
      default: return 'circle'
    }
  }

  const renderOverview = () => (
    <View>
      {/* Solde principal */}
      <LinearGradient
        colors={['#FF6B00', '#FF8F00']}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>Mon portefeuille personnel</Text>
        <Text style={styles.balanceAmount}>{formatPrice(balance.personal)} F CFA</Text>
        
        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.balanceButton}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.balanceButtonText}>Recharger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balanceButton}>
            <Feather name="send" size={16} color="#FFFFFF" />
            <Text style={styles.balanceButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Portefeuille communautaire */}
      <Card style={styles.communityCard}>
        <Card.Content>
          <View style={styles.communityHeader}>
            <View style={styles.communityIcon}>
              <Feather name="users" size={24} color="#FF6B00" />
            </View>
            <View style={styles.communityInfo}>
              <Text style={styles.communityTitle}>Portefeuille Communautaire</Text>
              <Text style={styles.communitySubtitle}>Fonds partagés entre coursiers</Text>
            </View>
          </View>

          <View style={styles.communityStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPrice(balance.community)} F</Text>
              <Text style={styles.statLabel}>Fonds total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPrice(balance.available_for_loan)} F</Text>
              <Text style={styles.statLabel}>Disponible prêt</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setShowLoanModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Feather name="credit-card" size={20} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Demander un prêt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Feather name="heart" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Faire un don</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Feather name="plus-circle" size={20} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Contribuer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#FCE4EC' }]}>
              <Feather name="bar-chart-2" size={20} color="#E91E63" />
            </View>
            <Text style={styles.actionText}>Statistiques</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mes prêts actifs */}
      <View style={styles.activeLoans}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes prêts actifs</Text>
          <TouchableOpacity onPress={() => setSelectedTab('loans')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {loans.filter(loan => loan.status === 'approved').slice(0, 2).map((loan) => (
          <Card key={loan.id} style={styles.loanCard}>
            <Card.Content>
              <View style={styles.loanHeader}>
                <Text style={styles.loanAmount}>{formatPrice(loan.amount)} F</Text>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(loan.status) + '20' }]}
                  textStyle={{ color: getStatusColor(loan.status) }}
                >
                  {getStatusText(loan.status)}
                </Chip>
              </View>
              <Text style={styles.loanReason}>{loan.reason}</Text>
              <Text style={styles.loanDate}>
                À rembourser avant le {new Date(loan.repayment_date).toLocaleDateString('fr-FR')}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </View>
  )

  const renderLoans = () => (
    <View>
      <Text style={styles.sectionTitle}>Historique des prêts</Text>
      {loans.map((loan) => (
        <Card key={loan.id} style={styles.loanCard}>
          <Card.Content>
            <View style={styles.loanHeader}>
              <Text style={styles.loanAmount}>{formatPrice(loan.amount)} F</Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(loan.status) + '20' }]}
                textStyle={{ color: getStatusColor(loan.status) }}
              >
                {getStatusText(loan.status)}
              </Chip>
            </View>
            <Text style={styles.loanReason}>{loan.reason}</Text>
            <View style={styles.loanDetails}>
              <Text style={styles.loanDetailText}>
                Taux: {loan.interest_rate}% • Durée: {loan.duration_days} jours
              </Text>
              <Text style={styles.loanDate}>
                Demandé le {new Date(loan.requested_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            
            {loan.status === 'approved' && (
              <Button
                mode="contained"
                style={styles.repayButton}
                onPress={() => {}}
              >
                Rembourser
              </Button>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  )

  const renderHistory = () => (
    <View>
      <Text style={styles.sectionTitle}>Historique des transactions</Text>
      {transactions.map((transaction) => (
        <Card key={transaction.id} style={styles.transactionCard}>
          <Card.Content>
            <View style={styles.transactionRow}>
              <View style={styles.transactionIcon}>
                <Feather 
                  name={getTransactionIcon(transaction.type) as any} 
                  size={20} 
                  color="#FF6B00" 
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'contribution' || transaction.type === 'loan_repayment' ? '#F44336' : '#4CAF50' }
              ]}>
                {transaction.type === 'contribution' || transaction.type === 'loan_repayment' ? '-' : '+'}
                {formatPrice(transaction.amount)} F
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Portefeuille Communautaire</Text>
        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="#757575" />
        </TouchableOpacity>
      </Surface>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'overview', label: 'Aperçu' },
          { key: 'loans', label: 'Prêts' },
          { key: 'history', label: 'Historique' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'loans' && renderLoans()}
        {selectedTab === 'history' && renderHistory()}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => setShowLoanModal(true)}
      />

      {/* Modal de demande de prêt */}
      <Portal>
        <Modal
          visible={showLoanModal}
          onDismiss={() => setShowLoanModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Demander un prêt</Text>
          <Text style={styles.modalDescription}>
            Remplissez le formulaire pour soumettre votre demande de prêt communautaire.
          </Text>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowLoanModal(false)}
              style={styles.modalButton}
            >
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setShowLoanModal(false)
                // Navigation vers le formulaire de prêt
              }}
              style={[styles.modalButton, styles.primaryButton]}
            >
              Continuer
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
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  balanceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  balanceButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  communityCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  communitySubtitle: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  communityStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
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
  quickActions: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionItem: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#212121",
    textAlign: "center",
  },
  activeLoans: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "600",
  },
  loanCard: {
    marginBottom: 12,
    borderRadius: 12,
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
  statusChip: {
    height: 24,
  },
  loanReason: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 8,
  },
  loanDate: {
    fontSize: 12,
    color: "#757575",
  },
  loanDetails: {
    marginBottom: 12,
  },
  loanDetailText: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  repayButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 8,
  },
  transactionCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#757575",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 16,
    backgroundColor: "#FF6B00",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: "#FF6B00",
  },
  bottomSpacer: {
    height: 80,
  },
})

export default CommunityWalletScreen
