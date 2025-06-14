<template>
  <div class="finances-view">
    <div class="page-header">
      <h1>Finances</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="exportFinancialData">
          <font-awesome-icon icon="download" class="mr-1" />
          Exporter
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label for="period-filter">Période</label>
          <select
            id="period-filter"
            v-model="filters.period"
            class="form-control"
            @change="handlePeriodChange"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>
        <div class="filter-group" v-if="filters.period === 'custom'">
          <label for="start-date">Du</label>
          <input type="date" id="start-date" v-model="filters.startDate" class="form-control" />
        </div>
        <div class="filter-group" v-if="filters.period === 'custom'">
          <label for="end-date">Au</label>
          <input type="date" id="end-date" v-model="filters.endDate" class="form-control" />
        </div>
        <div class="filter-group">
          <label for="payment-status">Statut de paiement</label>
          <select id="payment-status" v-model="filters.paymentStatus" class="form-control">
            <option value="">Tous</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
          </select>
        </div>
      </div>
      <div class="filters-actions">
        <button class="btn btn-outline btn-sm" @click="resetFilters">
          <font-awesome-icon icon="times" class="mr-1" />
          Réinitialiser
        </button>
        <button class="btn btn-primary btn-sm" @click="applyFilters">
          <font-awesome-icon icon="filter" class="mr-1" />
          Filtrer
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <font-awesome-icon icon="spinner" spin size="2x" />
      <p>Chargement des données financières...</p>
    </div>

    <div v-else>
      <div class="finances-summary">
        <div class="summary-card">
          <div class="summary-icon bg-primary">
            <font-awesome-icon icon="money-bill" />
          </div>
          <div class="summary-content">
            <h3 class="summary-value">{{ formatPrice(financialData.total_revenue) }} FCFA</h3>
            <p class="summary-label">Revenus totaux</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon bg-success">
            <font-awesome-icon icon="check-circle" />
          </div>
          <div class="summary-content">
            <h3 class="summary-value">{{ formatPrice(financialData.paid_amount) }} FCFA</h3>
            <p class="summary-label">Montant payé</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon bg-warning">
            <font-awesome-icon icon="clock" />
          </div>
          <div class="summary-content">
            <h3 class="summary-value">{{ formatPrice(financialData.pending_amount) }} FCFA</h3>
            <p class="summary-label">Montant en attente</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon bg-info">
            <font-awesome-icon icon="truck" />
          </div>
          <div class="summary-content">
            <h3 class="summary-value">{{ financialData.total_deliveries }}</h3>
            <p class="summary-label">Livraisons totales</p>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <div class="card-header">
            <h2>Revenus par jour</h2>
            <div class="card-actions">
              <button class="btn-icon" @click="downloadRevenueChart">
                <font-awesome-icon icon="download" />
              </button>
            </div>
          </div>
          <div class="card-body">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="card-header">
            <h2>Répartition des paiements</h2>
            <div class="card-actions">
              <button class="btn-icon" @click="downloadPaymentChart">
                <font-awesome-icon icon="download" />
              </button>
            </div>
          </div>
          <div class="card-body">
            <canvas ref="paymentChart"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2>Transactions</h2>
          <div class="card-actions">
            <button class="btn-icon" @click="exportTransactions">
              <font-awesome-icon icon="download" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="financialData.transactions.length === 0" class="empty-state">
            <font-awesome-icon icon="receipt" size="2x" />
            <p>Aucune transaction trouvée pour cette période</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Livraison</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in financialData.transactions" :key="transaction.id">
                  <td>#{{ transaction.id }}</td>
                  <td>{{ formatDate(transaction.date) }}</td>
                  <td>{{ transaction.description }}</td>
                  <td>
                    <router-link
                      v-if="transaction.delivery_id"
                      :to="`/business/deliveries/${transaction.delivery_id}`"
                    >
                      #{{ transaction.delivery_id }}
                    </router-link>
                    <span v-else>-</span>
                  </td>
                  <td :class="transaction.type === 'credit' ? 'text-success' : 'text-danger'">
                    {{ transaction.type === 'credit' ? '+' : '-' }}
                    {{ formatPrice(transaction.amount) }} FCFA
                  </td>
                  <td>
                    <div class="payment-method">
                      <font-awesome-icon
                        :icon="getPaymentMethodIcon(transaction.payment_method)"
                        class="mr-1"
                      />
                      {{ getPaymentMethodLabel(transaction.payment_method) }}
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" :class="getPaymentStatusClass(transaction.status)">
                      {{ getPaymentStatusLabel(transaction.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button
                        class="btn-icon"
                        @click="viewTransactionDetails(transaction)"
                        title="Voir les détails"
                      >
                        <font-awesome-icon icon="eye" />
                      </button>
                      <button
                        v-if="transaction.status === 'pending'"
                        class="btn-icon"
                        @click="markAsPaid(transaction.id)"
                        title="Marquer comme payé"
                      >
                        <font-awesome-icon icon="check" />
                      </button>
                      <button
                        v-if="transaction.invoice_url"
                        class="btn-icon"
                        @click="downloadInvoice(transaction)"
                        title="Télécharger la facture"
                      >
                        <font-awesome-icon icon="file-invoice" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-container" v-if="financialData.transactions.length > 0">
            <div class="pagination-info">
              Affichage de {{ paginationInfo.from }}-{{ paginationInfo.to }} sur
              {{ paginationInfo.total }} transactions
            </div>
            <div class="pagination-controls">
              <button
                class="pagination-button"
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
              >
                <font-awesome-icon icon="chevron-left" />
              </button>
              <div class="pagination-pages">
                <button
                  v-for="page in displayedPages"
                  :key="page"
                  class="pagination-page"
                  :class="{ active: currentPage === page }"
                  @click="changePage(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button
                class="pagination-button"
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
              >
                <font-awesome-icon icon="chevron-right" />
              </button>
            </div>
            <div class="pagination-size">
              <select v-model="pageSize" @change="changePageSize" class="form-control">
                <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
                  {{ size }} par page
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails de transaction -->
    <div class="modal" v-if="showTransactionModal">
      <div class="modal-backdrop" @click="showTransactionModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Détails de la transaction #{{ selectedTransaction?.id }}</h3>
          <button class="modal-close" @click="showTransactionModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body" v-if="selectedTransaction">
          <div class="transaction-details">
            <div class="transaction-header">
              <div
                class="transaction-amount"
                :class="selectedTransaction.type === 'credit' ? 'text-success' : 'text-danger'"
              >
                {{ selectedTransaction.type === 'credit' ? '+' : '-' }}
                {{ formatPrice(selectedTransaction.amount) }} FCFA
              </div>
              <span class="status-badge" :class="getPaymentStatusClass(selectedTransaction.status)">
                {{ getPaymentStatusLabel(selectedTransaction.status) }}
              </span>
            </div>

            <div class="details-grid">
              <div class="details-item">
                <div class="details-label">ID de transaction</div>
                <div class="details-value">#{{ selectedTransaction.id }}</div>
              </div>
              <div class="details-item">
                <div class="details-label">Date</div>
                <div class="details-value">{{ formatDate(selectedTransaction.date) }}</div>
              </div>
              <div class="details-item">
                <div class="details-label">Description</div>
                <div class="details-value">{{ selectedTransaction.description }}</div>
              </div>
              <div class="details-item">
                <div class="details-label">Type</div>
                <div class="details-value">
                  {{ selectedTransaction.type === 'credit' ? 'Crédit' : 'Débit' }}
                </div>
              </div>
              <div class="details-item">
                <div class="details-label">Méthode de paiement</div>
                <div class="details-value">
                  <font-awesome-icon
                    :icon="getPaymentMethodIcon(selectedTransaction.payment_method)"
                    class="mr-1"
                  />
                  {{ getPaymentMethodLabel(selectedTransaction.payment_method) }}
                </div>
              </div>
              <div class="details-item" v-if="selectedTransaction.reference">
                <div class="details-label">Référence</div>
                <div class="details-value">{{ selectedTransaction.reference }}</div>
              </div>
              <div class="details-item" v-if="selectedTransaction.delivery_id">
                <div class="details-label">Livraison</div>
                <div class="details-value">
                  <router-link :to="`/business/deliveries/${selectedTransaction.delivery_id}`">
                    #{{ selectedTransaction.delivery_id }}
                  </router-link>
                </div>
              </div>
            </div>

            <div class="transaction-notes" v-if="selectedTransaction.notes">
              <h4>Notes</h4>
              <p>{{ selectedTransaction.notes }}</p>
            </div>

            <div class="transaction-actions" v-if="selectedTransaction.status === 'pending'">
              <button class="btn btn-primary" @click="markAsPaid(selectedTransaction.id)">
                <font-awesome-icon icon="check" class="mr-1" />
                Marquer comme payé
              </button>
            </div>

            <div class="transaction-invoice" v-if="selectedTransaction.invoice_url">
              <h4>Facture</h4>
              <button class="btn btn-outline" @click="downloadInvoice(selectedTransaction)">
                <font-awesome-icon icon="file-invoice" class="mr-1" />
                Télécharger la facture
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import { fetchBusinessFinances, markTransactionAsPaid } from '@/api/business'
import { formatDate, formatPrice } from '@/utils/formatters'
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/config'

export default {
  name: 'BusinessFinancesView',
  setup() {
    const loading = ref(false)
    const financialData = ref({
      total_revenue: 0,
      paid_amount: 0,
      pending_amount: 0,
      total_deliveries: 0,
      transactions: [],
      total_transactions: 0,
    })
    const revenueChart = ref(null)
    const paymentChart = ref(null)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const pageSize = ref(DEFAULT_PAGE_SIZE)
    const showTransactionModal = ref(false)
    const selectedTransaction = ref(null)
    let revenueChartInstance = null
    let paymentChartInstance = null

    const filters = reactive({
      period: 'month',
      startDate: '',
      endDate: '',
      paymentStatus: '',
    })

    const paginationInfo = computed(() => {
      const from =
        financialData.value.transactions.length === 0
          ? 0
          : (currentPage.value - 1) * pageSize.value + 1
      const to = Math.min(from + pageSize.value - 1, financialData.value.total_transactions)

      return {
        from,
        to,
        total: financialData.value.total_transactions,
      }
    })

    const displayedPages = computed(() => {
      const pages = []
      const maxPagesToShow = 5

      if (totalPages.value <= maxPagesToShow) {
        // Afficher toutes les pages si leur nombre est inférieur ou égal à maxPagesToShow
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        // Toujours afficher la première page
        pages.push(1)

        // Calculer les pages à afficher autour de la page courante
        let startPage = Math.max(2, currentPage.value - Math.floor(maxPagesToShow / 2))
        let endPage = Math.min(totalPages.value - 1, startPage + maxPagesToShow - 3)

        // Ajuster startPage si endPage est trop petit
        startPage = Math.max(2, endPage - (maxPagesToShow - 3))

        // Ajouter des points de suspension si nécessaire
        if (startPage > 2) {
          pages.push('...')
        }

        // Ajouter les pages intermédiaires
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }

        // Ajouter des points de suspension si nécessaire
        if (endPage < totalPages.value - 1) {
          pages.push('...')
        }

        // Toujours afficher la dernière page
        pages.push(totalPages.value)
      }

      return pages
    })

    // Charger les données financières
    const loadFinancialData = async () => {
      try {
        loading.value = true

        // Préparer les paramètres de requête
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          period: filters.period !== 'custom' ? filters.period : undefined,
          start_date: filters.period === 'custom' ? filters.startDate : undefined,
          end_date: filters.period === 'custom' ? filters.endDate : undefined,
          payment_status: filters.paymentStatus || undefined,
        }

        const data = await fetchBusinessFinances(params)
        financialData.value = data
        totalPages.value = Math.ceil(data.total_transactions / pageSize.value)

        // Ajuster la page courante si elle dépasse le nombre total de pages
        if (currentPage.value > totalPages.value && totalPages.value > 0) {
          currentPage.value = totalPages.value
          await loadFinancialData()
        } else {
          renderCharts()
        }
      } catch (error) {
        console.error('Error loading financial data:', error)
      } finally {
        loading.value = false
      }
    }

    // Gérer le changement de période
    const handlePeriodChange = () => {
      if (filters.period !== 'custom') {
        // Réinitialiser les dates personnalisées
        filters.startDate = ''
        filters.endDate = ''
      } else {
        // Définir des dates par défaut pour la période personnalisée
        const today = new Date()
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        filters.endDate = today.toISOString().split('T')[0]
        filters.startDate = lastMonth.toISOString().split('T')[0]
      }
    }

    // Appliquer les filtres
    const applyFilters = () => {
      currentPage.value = 1
      loadFinancialData()
    }

    // Réinitialiser les filtres
    const resetFilters = () => {
      filters.period = 'month'
      filters.startDate = ''
      filters.endDate = ''
      filters.paymentStatus = ''

      currentPage.value = 1
      loadFinancialData()
    }

    // Changer de page
    const changePage = page => {
      if (page === '...') return

      currentPage.value = page
      loadFinancialData()
    }

    // Changer la taille de page
    const changePageSize = () => {
      currentPage.value = 1
      loadFinancialData()
    }

    // Rafraîchir les données
    const refreshData = () => {
      loadFinancialData()
    }

    // Exporter les données financières
    const exportFinancialData = () => {
      // Implémenter l'exportation des données financières (CSV, Excel, etc.)
      alert("Fonctionnalité d'exportation à implémenter")
    }

    // Exporter les transactions
    const exportTransactions = () => {
      // Implémenter l'exportation des transactions (CSV, Excel, etc.)
      alert("Fonctionnalité d'exportation à implémenter")
    }

    // Télécharger le graphique des revenus
    const downloadRevenueChart = () => {
      if (!revenueChartInstance) return

      const link = document.createElement('a')
      link.download = 'revenus.png'
      link.href = revenueChartInstance.toBase64Image()
      link.click()
    }

    // Télécharger le graphique des paiements
    const downloadPaymentChart = () => {
      if (!paymentChartInstance) return

      const link = document.createElement('a')
      link.download = 'paiements.png'
      link.href = paymentChartInstance.toBase64Image()
      link.click()
    }

    // Voir les détails d'une transaction
    const viewTransactionDetails = transaction => {
      selectedTransaction.value = transaction
      showTransactionModal.value = true
    }

    // Marquer une transaction comme payée
    const markAsPaid = async transactionId => {
      try {
        await markTransactionAsPaid(transactionId)

        // Mettre à jour l'état local
        if (selectedTransaction.value && selectedTransaction.value.id === transactionId) {
          selectedTransaction.value.status = 'paid'
        }

        // Rafraîchir les données
        await loadFinancialData()

        // Afficher un message de succès
        alert('Transaction marquée comme payée avec succès')
      } catch (error) {
        console.error('Error marking transaction as paid:', error)
        alert(`Erreur lors du marquage de la transaction comme payée: ${error.message}`)
      }
    }

    // Télécharger une facture
    const downloadInvoice = transaction => {
      if (!transaction.invoice_url) return

      window.open(transaction.invoice_url, '_blank')
    }

    // Obtenir l'icône pour une méthode de paiement
    const getPaymentMethodIcon = method => {
      const methodIcons = {
        cash: 'money-bill',
        orange_money: 'mobile-alt',
        mtn_money: 'mobile-alt',
        credit_card: 'credit-card',
        bank_transfer: 'university',
      }

      return methodIcons[method] || 'money-bill'
    }

    // Obtenir le libellé pour une méthode de paiement
    const getPaymentMethodLabel = method => {
      const methodLabels = {
        cash: 'Espèces',
        orange_money: 'Orange Money',
        mtn_money: 'MTN Money',
        credit_card: 'Carte bancaire',
        bank_transfer: 'Virement bancaire',
      }

      return methodLabels[method] || method
    }

    // Obtenir la classe CSS pour un statut de paiement
    const getPaymentStatusClass = status => {
      const statusClasses = {
        paid: 'status-paid',
        pending: 'status-pending',
        failed: 'status-failed',
      }

      return statusClasses[status] || ''
    }

    // Obtenir le libellé pour un statut de paiement
    const getPaymentStatusLabel = status => {
      const statusLabels = {
        paid: 'Payé',
        pending: 'En attente',
        failed: 'Échoué',
      }

      return statusLabels[status] || status
    }

    // Rendre les graphiques
    const renderCharts = () => {
      renderRevenueChart()
      renderPaymentChart()
    }

    // Rendre le graphique des revenus
    const renderRevenueChart = () => {
      if (!revenueChart.value || !financialData.value.revenue_by_day) return

      const ctx = revenueChart.value.getContext('2d')

      // Détruire le graphique existant s'il existe
      if (revenueChartInstance) {
        revenueChartInstance.destroy()
      }

      // Préparer les données pour le graphique
      const revenueByDay = financialData.value.revenue_by_day
      const dates = Object.keys(revenueByDay).sort()
      const revenues = dates.map(date => revenueByDay[date])

      // Créer le graphique
      revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates.map(date => formatDate(date)),
          datasets: [
            {
              label: 'Revenus (FCFA)',
              data: revenues,
              backgroundColor: 'rgba(255, 107, 0, 0.7)',
              borderColor: '#FF6B00',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw
                  return `${formatPrice(value)} FCFA`
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return formatPrice(value) + ' FCFA'
                },
              },
            },
          },
        },
      })
    }

    // Rendre le graphique des paiements
    const renderPaymentChart = () => {
      if (!paymentChart.value || !financialData.value.payment_status_distribution) return

      const ctx = paymentChart.value.getContext('2d')

      // Détruire le graphique existant s'il existe
      if (paymentChartInstance) {
        paymentChartInstance.destroy()
      }

      // Préparer les données pour le graphique
      const distribution = financialData.value.payment_status_distribution
      const statuses = Object.keys(distribution)
      const amounts = statuses.map(status => distribution[status])

      // Définir les couleurs pour chaque statut
      const colors = {
        paid: '#4CAF50',
        pending: '#FFC107',
        failed: '#F44336',
      }

      // Définir les libellés pour chaque statut
      const labels = {
        paid: 'Payé',
        pending: 'En attente',
        failed: 'Échoué',
      }

      // Créer le graphique
      paymentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: statuses.map(status => labels[status] || status),
          datasets: [
            {
              data: amounts,
              backgroundColor: statuses.map(status => colors[status] || '#9E9E9E'),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${context.label}: ${formatPrice(value)} FCFA (${percentage}%)`
                },
              },
            },
          },
        },
      })
    }

    // Surveiller les changements de taille de fenêtre pour redimensionner les graphiques
    const handleResize = () => {
      if (revenueChartInstance) {
        revenueChartInstance.resize()
      }

      if (paymentChartInstance) {
        paymentChartInstance.resize()
      }
    }

    // Surveiller les changements de période pour mettre à jour les graphiques
    watch(
      () => filters.period,
      () => {
        handlePeriodChange()
      }
    )

    onMounted(() => {
      loadFinancialData()
      window.addEventListener('resize', handleResize)
    })

    return {
      loading,
      financialData,
      revenueChart,
      paymentChart,
      currentPage,
      totalPages,
      pageSize,
      filters,
      showTransactionModal,
      selectedTransaction,
      paginationInfo,
      displayedPages,
      PAGE_SIZE_OPTIONS,
      handlePeriodChange,
      applyFilters,
      resetFilters,
      changePage,
      changePageSize,
      refreshData,
      exportFinancialData,
      exportTransactions,
      downloadRevenueChart,
      downloadPaymentChart,
      viewTransactionDetails,
      markAsPaid,
      downloadInvoice,
      getPaymentMethodIcon,
      getPaymentMethodLabel,
      getPaymentStatusClass,
      getPaymentStatusLabel,
      formatDate,
      formatPrice,
    }
  },
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
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.filters-section {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
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

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.loading-state svg {
  margin-bottom: 1rem;
}

.finances-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  font-size: 1.5rem;
}

.bg-primary {
  background-color: var(--primary-color);
}

.bg-info {
  background-color: var(--info-color);
}

.bg-success {
  background-color: var(--success-color);
}

.bg-warning {
  background-color: var(--warning-color);
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: var(--primary-color);
  color: white;
}

.card-body {
  padding: 1.5rem;
  height: 300px;
  position: relative;
}

.card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  font-weight: 600;
  color: var(--text-color);
}

.table td {
  color: var(--text-color);
}

.payment-method {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-paid {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-pending {
  background-color: #fff8e1;
  color: #ffa000;
}

.status-failed {
  background-color: #ffebee;
  color: #d32f2f;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
}

.text-success {
  color: #4caf50;
}

.text-danger {
  color: #f44336;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
}

.pagination-button {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button:not(:disabled):hover {
  background-color: var(--primary-color);
  color: white;
}

.pagination-pages {
  display: flex;
  margin: 0 0.5rem;
}

.pagination-page {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  border: none;
  cursor: pointer;
  margin: 0 0.25rem;
  transition: all 0.2s;
}

.pagination-page.active {
  background-color: var(--primary-color);
  color: white;
}

.pagination-page:not(.active):hover {
  background-color: var(--border-color);
}

.pagination-size {
  width: 120px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-amount {
  font-size: 1.5rem;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.details-item {
  margin-bottom: 0.5rem;
}

.details-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.details-value {
  font-weight: 500;
  color: var(--text-color);
}

.transaction-notes h4,
.transaction-invoice h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.transaction-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 992px) {
  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .charts-row {
    grid-template-columns: 1fr;
  }

  .pagination-container {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-info {
    order: 3;
  }

  .pagination-controls {
    order: 1;
  }

  .pagination-size {
    order: 2;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }

  .transaction-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
