<template>
  <div class="finances-view">
    <div class="page-header">
      <h1>Gestion des Finances</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="exportData">
          <i class="fas fa-file-export"></i> Exporter
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="period-filter">Période</label>
          <select id="period-filter" v-model="filters.period" @change="handlePeriodChange">
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="this_week">Cette semaine</option>
            <option value="last_week">Semaine dernière</option>
            <option value="this_month">Ce mois</option>
            <option value="last_month">Mois dernier</option>
            <option value="this_year">Cette année</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>

        <div class="filter-group date-range" v-if="filters.period === 'custom'">
          <label>Période personnalisée</label>
          <div class="date-range-picker">
            <input type="date" v-model="filters.startDate" @change="applyFilters" />
            <span>à</span>
            <input type="date" v-model="filters.endDate" @change="applyFilters" />
          </div>
        </div>

        <div class="filter-group">
          <label for="transaction-type">Type de transaction</label>
          <select id="transaction-type" v-model="filters.transactionType" @change="applyFilters">
            <option value="">Tous les types</option>
            <option value="payment">Paiement</option>
            <option value="refund">Remboursement</option>
            <option value="commission">Commission</option>
            <option value="withdrawal">Retrait</option>
            <option value="adjustment">Ajustement</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="payment-method">Méthode de paiement</label>
          <select id="payment-method" v-model="filters.paymentMethod" @change="applyFilters">
            <option value="">Toutes les méthodes</option>
            <option value="cash">Espèces</option>
            <option value="card">Carte bancaire</option>
            <option value="orange_money">Orange Money</option>
            <option value="mtn_money">MTN Money</option>
            <option value="moov_money">Moov Money</option>
            <option value="wave">Wave</option>
          </select>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" @change="applyFilters">
            <option value="">Tous les statuts</option>
            <option value="completed">Complété</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
            <option value="disputed">Litigieux</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input 
              type="text" 
              id="search" 
              v-model="filters.search" 
              placeholder="ID, client, coursier..." 
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
        </div>

        <div class="filter-group">
          <label for="sort-by">Trier par</label>
          <select id="sort-by" v-model="sortBy" @change="applyFilters">
            <option value="date_desc">Date (récent → ancien)</option>
            <option value="date_asc">Date (ancien → récent)</option>
            <option value="amount_desc">Montant (élevé → bas)</option>
            <option value="amount_asc">Montant (bas → élevé)</option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <i class="fas fa-times"></i> Réinitialiser les filtres
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <i class="fas fa-filter"></i> Appliquer les filtres
        </button>
      </div>
    </div>

    <!-- Résumé financier -->
    <div class="finance-summary">
      <div class="summary-card">
        <div class="summary-header">
          <h3>Revenus</h3>
          <div class="summary-period">{{ formatPeriodLabel() }}</div>
        </div>
        <div class="summary-content">
          <div class="summary-main-value">{{ formatCurrency(summary.revenue) }}</div>
          <div class="summary-change" :class="getChangeClass(summary.revenueChange)">
            <i :class="getChangeIconClass(summary.revenueChange)"></i>
            {{ formatPercentage(summary.revenueChange) }}
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-header">
          <h3>Commissions</h3>
          <div class="summary-period">{{ formatPeriodLabel() }}</div>
        </div>
        <div class="summary-content">
          <div class="summary-main-value">{{ formatCurrency(summary.commissions) }}</div>
          <div class="summary-change" :class="getChangeClass(summary.commissionsChange)">
            <i :class="getChangeIconClass(summary.commissionsChange)"></i>
            {{ formatPercentage(summary.commissionsChange) }}
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-header">
          <h3>Remboursements</h3>
          <div class="summary-period">{{ formatPeriodLabel() }}</div>
        </div>
        <div class="summary-content">
          <div class="summary-main-value">{{ formatCurrency(summary.refunds) }}</div>
          <div class="summary-change" :class="getChangeClass(-summary.refundsChange)">
            <i :class="getChangeIconClass(-summary.refundsChange)"></i>
            {{ formatPercentage(summary.refundsChange) }}
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-header">
          <h3>Bénéfice net</h3>
          <div class="summary-period">{{ formatPeriodLabel() }}</div>
        </div>
        <div class="summary-content">
          <div class="summary-main-value">{{ formatCurrency(summary.netProfit) }}</div>
          <div class="summary-change" :class="getChangeClass(summary.netProfitChange)">
            <i :class="getChangeIconClass(summary.netProfitChange)"></i>
            {{ formatPercentage(summary.netProfitChange) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="charts-container">
      <div class="chart-card">
        <div class="chart-header">
          <h3>Revenus par jour</h3>
          <div class="chart-actions">
            <button 
              v-for="period in ['week', 'month', 'year']" 
              :key="period"
              class="btn-chart-period" 
              :class="{ active: chartPeriod === period }"
              @click="changeChartPeriod(period)"
            >
              {{ getPeriodLabel(period) }}
            </button>
          </div>
        </div>
        <div class="chart-content">
          <div class="chart-placeholder">
            <i class="fas fa-chart-line"></i>
            <p>Graphique des revenus par jour</p>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Répartition des revenus</h3>
        </div>
        <div class="chart-content">
          <div class="chart-placeholder">
            <i class="fas fa-chart-pie"></i>
            <p>Graphique de répartition des revenus</p>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #4e73df;"></div>
            <div class="legend-label">Commissions ({{ formatPercentage(65) }})</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #1cc88a;"></div>
            <div class="legend-label">Frais de livraison ({{ formatPercentage(25) }})</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #36b9cc;"></div>
            <div class="legend-label">Abonnements ({{ formatPercentage(10) }})</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau des transactions -->
    <div class="table-container" v-if="!loading && transactions.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Méthode</th>
            <th>Montant</th>
            <th>Solde</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in transactions" :key="transaction.id">
            <td>{{ transaction.id }}</td>
            <td>{{ formatDateTime(transaction.date) }}</td>
            <td>
              <span class="transaction-type" :class="getTransactionTypeClass(transaction.type)">
                {{ getTransactionTypeLabel(transaction.type) }}
              </span>
            </td>
            <td>{{ transaction.description }}</td>
            <td>
              <div class="payment-method">
                <i :class="getPaymentMethodIcon(transaction.payment_method)"></i>
                {{ getPaymentMethodLabel(transaction.payment_method) }}
              </div>
            </td>
            <td :class="getAmountClass(transaction.amount)">
              {{ formatCurrency(transaction.amount) }}
            </td>
            <td>{{ formatCurrency(transaction.balance) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(transaction.status)">
                {{ getStatusLabel(transaction.status) }}
              </span>
            </td>
            <td>
              <div class="actions-cell">
                <button class="btn-icon" @click="viewTransactionDetails(transaction.id)" title="Voir les détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  class="btn-icon" 
                  v-if="transaction.status === 'pending'" 
                  @click="processTransaction(transaction.id)" 
                  title="Traiter"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  class="btn-icon" 
                  v-if="transaction.status === 'disputed'" 
                  @click="resolveDispute(transaction.id)" 
                  title="Résoudre le litige"
                >
                  <i class="fas fa-gavel"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          class="btn-page" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <button 
          v-for="page in displayedPages" 
          :key="page" 
          class="btn-page" 
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="btn-page" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- État vide -->
    <div class="empty-state" v-else-if="!loading && transactions.length === 0">
      <div class="empty-icon">
        <i class="fas fa-money-bill-wave"></i>
      </div>
      <h3>Aucune transaction trouvée</h3>
      <p>Aucune transaction ne correspond à vos critères de recherche.</p>
      <button class="btn btn-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des données financières...</p>
    </div>

    <!-- Modal de détails de transaction -->
    <div class="modal" v-if="showTransactionModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails de la transaction #{{ selectedTransaction?.id }}</h2>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedTransaction">
          <div class="transaction-details">
            <div class="detail-section">
              <h3>Informations générales</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID de transaction</span>
                  <span class="detail-value">{{ selectedTransaction.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">ID externe</span>
                  <span class="detail-value">{{ selectedTransaction.external_id || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">{{ formatDateTime(selectedTransaction.date) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Type</span>
                  <span class="detail-value transaction-type" :class="getTransactionTypeClass(selectedTransaction.type)">
                    {{ getTransactionTypeLabel(selectedTransaction.type) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Statut</span>
                  <span class="detail-value status-badge" :class="getStatusClass(selectedTransaction.status)">
                    {{ getStatusLabel(selectedTransaction.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Méthode de paiement</span>
                  <span class="detail-value">
                    <i :class="getPaymentMethodIcon(selectedTransaction.payment_method)"></i>
                    {{ getPaymentMethodLabel(selectedTransaction.payment_method) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Montants</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Montant</span>
                  <span class="detail-value" :class="getAmountClass(selectedTransaction.amount)">
                    {{ formatCurrency(selectedTransaction.amount) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Frais</span>
                  <span class="detail-value">{{ formatCurrency(selectedTransaction.fees) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Montant net</span>
                  <span class="detail-value">{{ formatCurrency(selectedTransaction.net_amount) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Solde après transaction</span>
                  <span class="detail-value">{{ formatCurrency(selectedTransaction.balance) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Description</h3>
              <p class="transaction-description">{{ selectedTransaction.description }}</p>
              <div v-if="selectedTransaction.notes" class="transaction-notes">
                <h4>Notes</h4>
                <p>{{ selectedTransaction.notes }}</p>
              </div>
            </div>

            <div class="detail-section" v-if="selectedTransaction.related_entity">
              <h3>Entité associée</h3>
              <div class="related-entity">
                <div class="entity-type">
                  {{ getEntityTypeLabel(selectedTransaction.related_entity.type) }} #{{ selectedTransaction.related_entity.id }}
                </div>
                <div class="entity-link">
                  <button class="btn btn-link" @click="viewRelatedEntity(selectedTransaction.related_entity)">
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedTransaction.parties && selectedTransaction.parties.length > 0">
              <h3>Parties impliquées</h3>
              <div class="parties-list">
                <div class="party-item" v-for="(party, index) in selectedTransaction.parties" :key="index">
                  <div class="party-role">{{ getPartyRoleLabel(party.role) }}</div>
                  <div class="party-details">
                    <div class="party-name">{{ party.name }}</div>
                    <div class="party-id">ID: {{ party.id }}</div>
                    <div class="party-amount" v-if="party.amount">
                      Montant: <span :class="getAmountClass(party.amount)">{{ formatCurrency(party.amount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedTransaction.timeline && selectedTransaction.timeline.length > 0">
              <h3>Chronologie</h3>
              <div class="timeline">
                <div 
                  class="timeline-item" 
                  v-for="(event, index) in selectedTransaction.timeline" 
                  :key="index"
                >
                  <div class="timeline-icon" :class="getTimelineIconClass(event.status)">
                    <i :class="getTimelineIcon(event.status)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-time">{{ formatDateTime(event.timestamp) }}</div>
                    <div class="timeline-title">{{ getTimelineTitle(event.status) }}</div>
                    <div class="timeline-description" v-if="event.description">{{ event.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedTransaction.dispute">
              <h3>Litige</h3>
              <div class="dispute-details">
                <div class="dispute-item">
                  <span class="dispute-label">Raison</span>
                  <span class="dispute-value">{{ selectedTransaction.dispute.reason }}</span>
                </div>
                <div class="dispute-item">
                  <span class="dispute-label">Description</span>
                  <span class="dispute-value">{{ selectedTransaction.dispute.description }}</span>
                </div>
                <div class="dispute-item">
                  <span class="dispute-label">Statut</span>
                  <span class="dispute-value dispute-status" :class="getDisputeStatusClass(selectedTransaction.dispute.status)">
                    {{ getDisputeStatusLabel(selectedTransaction.dispute.status) }}
                  </span>
                </div>
                <div class="dispute-item">
                  <span class="dispute-label">Date d'ouverture</span>
                  <span class="dispute-value">{{ formatDateTime(selectedTransaction.dispute.created_at) }}</span>
                </div>
                <div class="dispute-item" v-if="selectedTransaction.dispute.resolved_at">
                  <span class="dispute-label">Date de résolution</span>
                  <span class="dispute-value">{{ formatDateTime(selectedTransaction.dispute.resolved_at) }}</span>
                </div>
                <div class="dispute-item" v-if="selectedTransaction.dispute.resolution">
                  <span class="dispute-label">Résolution</span>
                  <span class="dispute-value">{{ selectedTransaction.dispute.resolution }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Fermer</button>
          <button 
            class="btn btn-primary" 
            v-if="selectedTransaction && selectedTransaction.status === 'pending'"
            @click="processTransaction(selectedTransaction.id)"
          >
            Traiter la transaction
          </button>
          <button 
            class="btn btn-danger" 
            v-if="selectedTransaction && selectedTransaction.status === 'disputed'"
            @click="resolveDispute(selectedTransaction.id)"
          >
            Résoudre le litige
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de résolution de litige -->
    <div class="modal" v-if="showDisputeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Résoudre le litige - Transaction #{{ selectedTransaction?.id }}</h2>
          <button class="btn-close" @click="closeDisputeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedTransaction && selectedTransaction.dispute">
          <div class="dispute-resolution-form">
            <div class="form-group">
              <label>Raison du litige</label>
              <div class="readonly-field">{{ selectedTransaction.dispute.reason }}</div>
            </div>
            
            <div class="form-group">
              <label>Description du litige</label>
              <div class="readonly-field">{{ selectedTransaction.dispute.description }}</div>
            </div>
            
            <div class="form-group">
              <label for="resolution-decision">Décision</label>
              <select id="resolution-decision" v-model="disputeResolution.decision">
                <option value="approve">Approuver la transaction</option>
                <option value="refund">Rembourser</option>
                <option value="partial_refund">Remboursement partiel</option>
                <option value="reject">Rejeter la réclamation</option>
              </select>
            </div>
            
            <div class="form-group" v-if="disputeResolution.decision === 'partial_refund'">
              <label for="refund-amount">Montant du remboursement (FCFA)</label>
              <input 
                type="number" 
                id="refund-amount" 
                v-model.number="disputeResolution.refundAmount" 
                min="0" 
                :max="Math.abs(selectedTransaction.amount)"
              />
            </div>
            
            <div class="form-group">
              <label for="resolution-notes">Notes de résolution</label>
              <textarea 
                id="resolution-notes" 
                v-model="disputeResolution.notes" 
                rows="4" 
                placeholder="Expliquez votre décision..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="notify-parties">Notifier les parties</label>
              <div class="checkbox-group">
                <label class="checkbox-label" v-for="(party, index) in selectedTransaction.parties" :key="index">
                  <input type="checkbox" v-model="disputeResolution.notifyParties[party.id]" />
                  Notifier {{ party.name }} ({{ getPartyRoleLabel(party.role) }})
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDisputeModal">Annuler</button>
          <button class="btn btn-primary" @click="submitDisputeResolution">Résoudre le litige</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { fetchFinances, fetchTransactions, fetchTransactionDetails, processTransaction as processTransactionApi, resolveTransactionDispute } from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '@/utils/formatters'

export default {
  name: 'FinancesView',
  setup() {
    // État
    const transactions = ref([])
    const selectedTransaction = ref(null)
    const showTransactionModal = ref(false)
    const showDisputeModal = ref(false)
    const loading = ref(true)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const chartPeriod = ref('month')
    
    const summary = reactive({
      revenue: 0,
      revenueChange: 0,
      commissions: 0,
      commissionsChange: 0,
      refunds: 0,
      refundsChange: 0,
      netProfit: 0,
      netProfitChange: 0
    })
    
    const filters = reactive({
      period: 'this_month',
      startDate: '',
      endDate: '',
      transactionType: '',
      paymentMethod: '',
      status: '',
      search: ''
    })
    
    const sortBy = ref('date_desc')
    
    const disputeResolution = reactive({
      decision: 'approve',
      refundAmount: 0,
      notes: '',
      notifyParties: {}
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        // Récupérer le résumé financier
        const financeResponse = await fetchFinances({
          period: filters.period,
          start_date: filters.startDate,
          end_date: filters.endDate
        })
        
        // Mettre à jour le résumé
        summary.revenue = financeResponse.revenue
        summary.revenueChange = financeResponse.revenue_change
        summary.commissions = financeResponse.commissions
        summary.commissionsChange = financeResponse.commissions_change
        summary.refunds = financeResponse.refunds
        summary.refundsChange = financeResponse.refunds_change
        summary.netProfit = financeResponse.net_profit
        summary.netProfitChange = financeResponse.net_profit_change
        
        // Récupérer les transactions
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          sort: sortBy.value,
          period: filters.period,
          start_date: filters.startDate,
          end_date: filters.endDate,
          type: filters.transactionType,
          payment_method: filters.paymentMethod,
          status: filters.status,
          search: filters.search
        }
        
        const transactionsResponse = await fetchTransactions(params)
        transactions.value = transactionsResponse.items
        totalItems.value = transactionsResponse.total
        totalPages.value = transactionsResponse.pages
      } catch (error) {
        console.error('Erreur lors du chargement des données financières:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }
    
    const refreshData = () => {
      fetchData()
    }
    
    const handlePeriodChange = () => {
      if (filters.period !== 'custom') {
        // Réinitialiser les dates personnalisées si une période prédéfinie est sélectionnée
        filters.startDate = ''
        filters.endDate = ''
      } else {
        // Définir des dates par défaut pour la période personnalisée
        const today = new Date()
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        
        filters.endDate = formatDateForInput(today)
        filters.startDate = formatDateForInput(lastMonth)
      }
      
      applyFilters()
    }
    
    const formatDateForInput = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const applyFilters = () => {
      currentPage.value = 1
      fetchData()
    }
    
    const resetFilters = () => {
      filters.period = 'this_month'
      filters.startDate = ''
      filters.endDate = ''
      filters.transactionType = ''
      filters.paymentMethod = ''
      filters.status = ''
      filters.search = ''
      sortBy.value = 'date_desc'
      currentPage.value = 1
      fetchData()
    }
    
    const changePage = (page) => {
      currentPage.value = page
      fetchData()
    }
    
    const changeChartPeriod = (period) => {
      chartPeriod.value = period
      // Ici, vous pourriez recharger les données du graphique
    }
    
    const viewTransactionDetails = async (transactionId) => {
      try {
        loading.value = true
        const response = await fetchTransactionDetails(transactionId)
        selectedTransaction.value = response
        
        // Réinitialiser les notifications pour la résolution de litige
        if (selectedTransaction.value && selectedTransaction.value.parties) {
          disputeResolution.notifyParties = {}
          selectedTransaction.value.parties.forEach(party => {
            disputeResolution.notifyParties[party.id] = true
          })
        }
        
        showTransactionModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la transaction:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      showTransactionModal.value = false
      selectedTransaction.value = null
    }
    
    const processTransaction = async (transactionId) => {
      try {
        await processTransactionApi(transactionId)
        // Mettre à jour la liste des transactions
        fetchData()
        // Fermer le modal si ouvert
        if (showTransactionModal.value && selectedTransaction.value && selectedTransaction.value.id === transactionId) {
          closeModal()
        }
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors du traitement de la transaction:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const resolveDispute = (transactionId) => {
      // Réinitialiser le formulaire de résolution de litige
      disputeResolution.decision = 'approve'
      disputeResolution.refundAmount = 0
      disputeResolution.notes = ''
      
      // Afficher le modal de résolution de litige
      if (!selectedTransaction.value || selectedTransaction.value.id !== transactionId) {
        viewTransactionDetails(transactionId).then(() => {
          showDisputeModal.value = true
        })
      } else {
        showDisputeModal.value = true
      }
    }
    
    const closeDisputeModal = () => {
      showDisputeModal.value = false
    }
    
    const submitDisputeResolution = async () => {
      try {
        if (!selectedTransaction.value || !selectedTransaction.value.dispute) {
          return
        }
        
        const payload = {
          decision: disputeResolution.decision,
          notes: disputeResolution.notes,
          notify_parties: disputeResolution.notifyParties
        }
        
        if (disputeResolution.decision === 'partial_refund') {
          payload.refund_amount = disputeResolution.refundAmount
        }
        
        await resolveTransactionDispute(selectedTransaction.value.id, payload)
        
        // Fermer les modals
        closeDisputeModal()
        closeModal()
        
        // Rafraîchir les données
        fetchData()
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la résolution du litige:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const viewRelatedEntity = (entity) => {
      // Rediriger vers la page de détails de l'entité associée
      if (entity.type === 'delivery') {
        // router.push(`/manager/deliveries/${entity.id}`)
        console.log('Voir la livraison:', entity.id)
      } else if (entity.type === 'business') {
        // router.push(`/manager/businesses/${entity.id}`)
        console.log('Voir l\'entreprise:', entity.id)
      } else if (entity.type === 'user') {
        // router.push(`/manager/users/${entity.id}`)
        console.log('Voir l\'utilisateur:', entity.id)
      }
    }
    
    const exportData = () => {
      // Implémenter l'exportation des données (CSV, Excel, etc.)
      console.log('Exporter les données')
    }
    
    // Utilitaires
    const formatPeriodLabel = () => {
      switch (filters.period) {
        case 'today':
          return 'Aujourd\'hui'
        case 'yesterday':
          return 'Hier'
        case 'this_week':
          return 'Cette semaine'
        case 'last_week':
          return 'Semaine dernière'
        case 'this_month':
          return 'Ce mois'
        case 'last_month':
          return 'Mois dernier'
        case 'this_year':
          return 'Cette année'
        case 'custom':
          if (filters.startDate && filters.endDate) {
            return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
          }
          return 'Période personnalisée'
        default:
          return ''
      }
    }
    
    const getPeriodLabel = (period) => {
      switch (period) {
        case 'week':
          return 'Semaine'
        case 'month':
          return 'Mois'
        case 'year':
          return 'Année'
        default:
          return period
      }
    }
    
    const getChangeClass = (change) => {
      if (change > 0) {
        return 'change-positive'
      } else if (change < 0) {
        return 'change-negative'
      }
      return 'change-neutral'
    }
    
    const getChangeIconClass = (change) => {
      if (change > 0) {
        return 'fas fa-arrow-up'
      } else if (change < 0) {
        return 'fas fa-arrow-down'
      }
      return 'fas fa-minus'
    }
    
    const getTransactionTypeClass = (type) => {
      const typeMap = {
        payment: 'type-payment',
        refund: 'type-refund',
        commission: 'type-commission',
        withdrawal: 'type-withdrawal',
        adjustment: 'type-adjustment'
      }
      return typeMap[type] || 'type-unknown'
    }
    
    const getTransactionTypeLabel = (type) => {
      const typeMap = {
        payment: 'Paiement',
        refund: 'Remboursement',
        commission: 'Commission',
        withdrawal: 'Retrait',
        adjustment: 'Ajustement'
      }
      return typeMap[type] || 'Inconnu'
    }
    
    const getPaymentMethodIcon = (method) => {
      const methodMap = {
        cash: 'fas fa-money-bill',
        card: 'fas fa-credit-card',
        orange_money: 'fas fa-mobile-alt',
        mtn_money: 'fas fa-mobile-alt',
        moov_money: 'fas fa-mobile-alt',
        wave: 'fas fa-wave-square',
        bank_transfer: 'fas fa-university'
      }
      return methodMap[method] || 'fas fa-question-circle'
    }
    
    const getPaymentMethodLabel = (method) => {
      const methodMap = {
        cash: 'Espèces',
        card: 'Carte bancaire',
        orange_money: 'Orange Money',
        mtn_money: 'MTN Money',
        moov_money: 'Moov Money',
        wave: 'Wave',
        bank_transfer: 'Virement bancaire'
      }
      return methodMap[method] || 'Inconnu'
    }
    
    const getAmountClass = (amount) => {
      if (amount > 0) {
        return 'amount-positive'
      } else if (amount < 0) {
        return 'amount-negative'
      }
      return 'amount-neutral'
    }
    
    const getStatusClass = (status) => {
      const statusMap = {
        completed: 'status-completed',
        pending: 'status-pending',
        failed: 'status-failed',
        disputed: 'status-disputed'
      }
      return statusMap[status] || 'status-unknown'
    }
    
    const getStatusLabel = (status) => {
      const statusMap = {
        completed: 'Complété',
        pending: 'En attente',
        failed: 'Échoué',
        disputed: 'Litigieux'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getEntityTypeLabel = (type) => {
      const typeMap = {
        delivery: 'Livraison',
        business: 'Entreprise',
        user: 'Utilisateur',
        subscription: 'Abonnement'
      }
      return typeMap[type] || 'Entité'
    }
    
    const getPartyRoleLabel = (role) => {
      const roleMap = {
        platform: 'Plateforme',
        business: 'Entreprise',
        courier: 'Coursier',
        client: 'Client'
      }
      return roleMap[role] || role
    }
    
    const getTimelineIconClass = (status) => {
      const statusMap = {
        created: 'timeline-icon-created',
        pending: 'timeline-icon-pending',
        processing: 'timeline-icon-processing',
        completed: 'timeline-icon-completed',
        failed: 'timeline-icon-failed',
        disputed: 'timeline-icon-disputed',
        resolved: 'timeline-icon-resolved'
      }
      return statusMap[status] || 'timeline-icon-default'
    }
    
    const getTimelineIcon = (status) => {
      const statusMap = {
        created: 'fas fa-plus-circle',
        pending: 'fas fa-clock',
        processing: 'fas fa-cog',
        completed: 'fas fa-check-circle',
        failed: 'fas fa-times-circle',
        disputed: 'fas fa-exclamation-triangle',
        resolved: 'fas fa-gavel'
      }
      return statusMap[status] || 'fas fa-circle'
    }
    
    const getTimelineTitle = (status) => {
      const statusMap = {
        created: 'Transaction créée',
        pending: 'En attente de traitement',
        processing: 'En cours de traitement',
        completed: 'Transaction complétée',
        failed: 'Transaction échouée',
        disputed: 'Litige ouvert',
        resolved: 'Litige résolu'
      }
      return statusMap[status] || 'Événement'
    }
    
    const getDisputeStatusClass = (status) => {
      const statusMap = {
        open: 'dispute-open',
        in_review: 'dispute-in-review',
        resolved: 'dispute-resolved',
        closed: 'dispute-closed'
      }
      return statusMap[status] || 'dispute-unknown'
    }
    
    const getDisputeStatusLabel = (status) => {
      const statusMap = {
        open: 'Ouvert',
        in_review: 'En cours d\'examen',
        resolved: 'Résolu',
        closed: 'Fermé'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    // Pagination calculée
    const displayedPages = computed(() => {
      const pages = []
      const maxVisiblePages = 5
      
      if (totalPages.value <= maxVisiblePages) {
        // Afficher toutes les pages si le nombre total est inférieur ou égal au maximum visible
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        // Calculer les pages à afficher
        let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
        let endPage = startPage + maxVisiblePages - 1
        
        if (endPage > totalPages.value) {
          endPage = totalPages.value
          startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
      }
      
      return pages
    })
    
    // Debounce pour la recherche
    let searchTimeout = null
    const debounceSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        applyFilters()
      }, 500)
    }
    
    // Cycle de vie
    onMounted(() => {
      fetchData()
    })
    
    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })
    
    return {
      transactions,
      selectedTransaction,
      showTransactionModal,
      showDisputeModal,
      loading,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      chartPeriod,
      summary,
      filters,
      sortBy,
      disputeResolution,
      displayedPages,
      
      fetchData,
      refreshData,
      handlePeriodChange,
      applyFilters,
      resetFilters,
      changePage,
      changeChartPeriod,
      viewTransactionDetails,
      closeModal,
      processTransaction,
      resolveDispute,
      closeDisputeModal,
      submitDisputeResolution,
      viewRelatedEntity,
      exportData,
      debounceSearch,
      
      formatPeriodLabel,
      getPeriodLabel,
      getChangeClass,
      getChangeIconClass,
      getTransactionTypeClass,
      getTransactionTypeLabel,
      getPaymentMethodIcon,
      getPaymentMethodLabel,
      getAmountClass,
      getStatusClass,
      getStatusLabel,
      getEntityTypeLabel,
      getPartyRoleLabel,
      getTimelineIconClass,
      getTimelineIcon,
      getTimelineTitle,
      getDisputeStatusClass,
      getDisputeStatusLabel,
      
      formatCurrency,
      formatDate,
      formatDateTime,
      formatPercentage
    }
  }
}
</script>

<style scoped>
.finances-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #0056b3;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #004494;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-outline {
  background-color: transparent;
  color: #0056b3;
  border: 1px solid #0056b3;
}

.btn-outline:hover {
  background-color: rgba(0, 86, 179, 0.1);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-link {
  background-color: transparent;
  color: #0056b3;
  border: none;
  padding: 0;
  text-decoration: underline;
}

.filters-container {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group.date-range {
  flex: 2;
}

.filter-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #495057;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.date-range-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range-picker input {
  flex: 1;
}

.search-input {
  position: relative;
}

.search-input input {
  padding-right: 2.5rem;
}

.search-input i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.finance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.summary-period {
  font-size: 0.75rem;
  color: #6c757d;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-main-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.summary-change {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.change-positive {
  color: #28a745;
}

.change-negative {
  color: #dc3545;
}

.change-neutral {
  color: #6c757d;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-chart-period {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: transparent;
  border: 1px solid #ced4da;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-chart-period:hover {
  background-color: #f8f9fa;
}

.btn-chart-period.active {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.chart-content {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6c757d;
  text-align: center;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
}

.legend-label {
  font-size: 0.875rem;
  color: #495057;
}

.table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background-color: #f8f9fa;
}

.transaction-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-payment {
  background-color: #d4edda;
  color: #155724;
}

.type-refund {
  background-color: #f8d7da;
  color: #721c24;
}

.type-commission {
  background-color: #d1ecf1;
  color: #0c5460;
}

.type-withdrawal {
  background-color: #fff3cd;
  color: #856404;
}

.type-adjustment {
  background-color: #e2e3e5;
  color: #383d41;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.amount-positive {
  color: #28a745;
  font-weight: 500;
}

.amount-negative {
  color: #dc3545;
  font-weight: 500;
}

.amount-neutral {
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.status-pending {
  background-color: #ffeeba;
  color: #856404;
}

.status-failed {
  background-color: #f5c6cb;
  color: #721c24;
}

.status-disputed {
  background-color: #f8d7da;
  color: #721c24;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-icon:hover {
  background-color: #f8f9fa;
}

.btn-icon i {
  font-size: 0.875rem;
  color: #6c757d;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 1rem;
  gap: 0.25rem;
}

.btn-page {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #495057;
}

.btn-page:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #ced4da;
}

.btn-page.active {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  background-color: white;
  border-radius: 0.5rem;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #333;
}

.empty-state p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid rgba(0, 86, 179, 0.1);
  border-radius: 50%;
  border-top-color: #0056b3;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  font-size: 0.875rem;
  color: #6c757d;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.btn-close {
  background-color: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-section h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  color: #333;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #333;
}

.transaction-description {
  font-size: 0.875rem;
  color: #495057;
  margin: 0;
}

.transaction-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.transaction-notes p {
  font-size: 0.875rem;
  color: #495057;
  margin: 0;
  font-style: italic;
}

.related-entity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
}

.entity-type {
  font-weight: 500;
  color: #333;
}

.parties-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.party-item {
  display: flex;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
}

.party-role {
  font-weight: 500;
  color: #333;
  width: 100px;
  margin-right: 1rem;
}

.party-details {
  flex: 1;
}

.party-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.party-id,
.party-amount {
  font-size: 0.75rem;
  color: #6c757d;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 2.5rem;
  left: 1rem;
  width: 1px;
  height: calc(100% - 1rem);
  background-color: #ced4da;
}

.timeline-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  z-index: 1;
}

.timeline-icon-created {
  background-color: #b8daff;
  color: #004085;
}

.timeline-icon-pending {
  background-color: #ffeeba;
  color: #856404;
}

.timeline-icon-processing {
  background-color: #c3e6cb;
  color: #155724;
}

.timeline-icon-completed {
  background-color: #d4edda;
  color: #155724;
}

.timeline-icon-failed {
  background-color: #f5c6cb;
  color: #721c24;
}

.timeline-icon-disputed {
  background-color: #f8d7da;
  color: #721c24;
}

.timeline-icon-resolved {
  background-color: #d1ecf1;
  color: #0c5460;
}

.timeline-content {
  flex: 1;
}

.timeline-time {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.timeline-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.timeline-description {
  font-size: 0.875rem;
  color: #495057;
}

.dispute-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dispute-item {
  display: flex;
  flex-direction: column;
}

.dispute-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.dispute-value {
  font-weight: 500;
  color: #333;
}

.dispute-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.dispute-open {
  background-color: #ffeeba;
  color: #856404;
}

.dispute-in-review {
  background-color: #b8daff;
  color: #004085;
}

.dispute-resolved {
  background-color: #d4edda;
  color: #155724;
}

.dispute-closed {
  background-color: #e2e3e5;
  color: #383d41;
}

.dispute-resolution-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #495057;
}

.form-group select,
.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.readonly-field {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  color: #495057;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .finance-summary {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filters-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
