<template>
  <div class="analytics-view">
    <div class="header">
      <h1>{{ $t('analytics.title') }}</h1>
      <div class="period-selector">
        <select v-model="selectedPeriod" @change="loadData" class="period-select">
          <option value="day">{{ $t('analytics.periods.day') }}</option>
          <option value="week">{{ $t('analytics.periods.week') }}</option>
          <option value="month">{{ $t('analytics.periods.month') }}</option>
          <option value="year">{{ $t('analytics.periods.year') }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      {{ $t('common.loading') }}
    </div>

    <div v-else class="analytics-content">
      <!-- KPIs principaux -->
      <div class="kpi-grid">
        <div class="kpi-card users">
          <div class="kpi-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats.users?.total || 0 }}</div>
            <div class="kpi-label">{{ $t('analytics.totalUsers') }}</div>
            <div class="kpi-growth" :class="getGrowthClass(stats.users?.growth_rate)">
              <i :class="getGrowthIcon(stats.users?.growth_rate)"></i>
              {{ Math.abs(stats.users?.growth_rate || 0).toFixed(1) }}%
            </div>
          </div>
        </div>

        <div class="kpi-card deliveries">
          <div class="kpi-icon">
            <i class="fas fa-box"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ stats.deliveries?.total || 0 }}</div>
            <div class="kpi-label">{{ $t('analytics.totalDeliveries') }}</div>
            <div class="kpi-growth positive">
              <i class="fas fa-arrow-up"></i>
              {{ stats.deliveries?.period || 0 }} {{ $t(`analytics.periods.${selectedPeriod}`) }}
            </div>
          </div>
        </div>

        <div class="kpi-card revenue">
          <div class="kpi-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ formatCurrency(stats.revenue?.total || 0) }}</div>
            <div class="kpi-label">{{ $t('analytics.totalRevenue') }}</div>
            <div class="kpi-growth positive">
              <i class="fas fa-arrow-up"></i>
              {{ formatCurrency(stats.revenue?.period || 0) }}
            </div>
          </div>
        </div>

        <div class="kpi-card kyc">
          <div class="kpi-icon">
            <i class="fas fa-id-card"></i>
          </div>
          <div class="kpi-content">
            <div class="kpi-value">{{ kycStats.pending || 0 }}</div>
            <div class="kpi-label">{{ $t('analytics.pendingKyc') }}</div>
            <div class="kpi-growth neutral">
              {{ Math.round((kycStats.verified / kycStats.total) * 100) }}%
              {{ $t('analytics.verified') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="charts-grid">
        <!-- Répartition des utilisateurs par rôle -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>{{ $t('analytics.usersByRole') }}</h3>
          </div>
          <div class="chart-content">
            <PieChart :data="userRoleData" :options="chartOptions" />
          </div>
        </div>

        <!-- Évolution des livraisons -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>{{ $t('analytics.deliveryTrend') }}</h3>
          </div>
          <div class="chart-content">
            <canvas ref="deliveryChart"></canvas>
          </div>
        </div>

        <!-- Statut KYC -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>{{ $t('analytics.kycStatus') }}</h3>
          </div>
          <div class="chart-content">
            <HorizontalBarChart :data="kycChartData" :options="kycChartOptions" />
          </div>
        </div>

        <!-- Revenus par commune -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>{{ $t('analytics.revenueByCommune') }}</h3>
          </div>
          <div class="chart-content">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tableaux de données -->
      <div class="data-tables">
        <!-- Top coursiers -->
        <div class="table-card">
          <div class="table-header">
            <h3>{{ $t('analytics.topCouriers') }}</h3>
          </div>
          <div class="table-content">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ $t('courier.name') }}</th>
                  <th>{{ $t('stats.deliveries') }}</th>
                  <th>{{ $t('stats.rating') }}</th>
                  <th>{{ $t('stats.earnings') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="courier in topCouriers" :key="courier.id">
                  <td>
                    <div class="user-cell">
                      <img
                        :src="courier.profile_picture || '/default-avatar.png'"
                        :alt="courier.name"
                        class="user-avatar-sm"
                      />
                      {{ courier.name }}
                    </div>
                  </td>
                  <td>{{ courier.deliveries_completed }}</td>
                  <td>
                    <div class="rating-cell">
                      <i class="fas fa-star"></i>
                      {{ courier.average_rating }}/5
                    </div>
                  </td>
                  <td>{{ formatCurrency(courier.total_earnings) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Activité récente -->
        <div class="table-card">
          <div class="table-header">
            <h3>{{ $t('analytics.recentActivity') }}</h3>
          </div>
          <div class="table-content">
            <div class="activity-list">
              <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                <div class="activity-icon">
                  <i :class="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-description">{{ activity.description }}</div>
                  <div class="activity-time">{{ formatTime(activity.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alertes et notifications -->
      <div class="alerts-section">
        <h3>{{ $t('analytics.alerts') }}</h3>
        <div class="alerts-grid">
          <div v-if="kycStats.pending > 10" class="alert-card warning">
            <div class="alert-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ $t('alerts.highPendingKyc') }}</div>
              <div class="alert-description">
                {{ kycStats.pending }} {{ $t('alerts.kycPendingMessage') }}
              </div>
            </div>
            <div class="alert-action">
              <button @click="$router.push('/manager/kyc')" class="btn btn-sm btn-warning">
                {{ $t('alerts.review') }}
              </button>
            </div>
          </div>

          <div v-if="stats.users?.growth_rate < 0" class="alert-card danger">
            <div class="alert-icon">
              <i class="fas fa-arrow-down"></i>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ $t('alerts.userGrowthDecline') }}</div>
              <div class="alert-description">
                {{ $t('alerts.userGrowthMessage') }}
              </div>
            </div>
          </div>

          <div v-if="!alerts.length" class="alert-card success">
            <div class="alert-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ $t('alerts.allGood') }}</div>
              <div class="alert-description">{{ $t('alerts.noIssues') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import managerApi from '@/api/manager'
import PieChart from '@/components/charts/PieChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import Chart from 'chart.js/auto'

export default {
  name: 'AnalyticsView',
  components: {
    PieChart,
    HorizontalBarChart,
  },
  setup() {
    const { showToast } = useToast()

    const loading = ref(false)
    const selectedPeriod = ref('month')
    const deliveryChart = ref(null)
    const revenueChart = ref(null)

    const stats = reactive({})
    const kycStats = reactive({})
    const topCouriers = ref([])
    const recentActivity = ref([])
    const alerts = ref([])

    let deliveryChartInstance = null
    let revenueChartInstance = null

    // Computed
    const userRoleData = computed(() => ({
      labels: ['Clients', 'Coursiers', 'Entreprises'],
      datasets: [
        {
          data: [
            stats.usersByRole?.client || 0,
            stats.usersByRole?.courier || 0,
            stats.usersByRole?.business || 0,
          ],
          backgroundColor: ['#2196F3', '#4CAF50', '#FF9800'],
        },
      ],
    }))

    const kycChartData = computed(() => ({
      labels: ['Vérifié', 'En attente', 'Rejeté'],
      datasets: [
        {
          data: [kycStats.verified || 0, kycStats.pending || 0, kycStats.rejected || 0],
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
        },
      ],
    }))

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    }

    const kycChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    }

    // Méthodes
    const loadData = async () => {
      try {
        loading.value = true

        // Charger les statistiques avancées
        const statsResponse = await managerApi.getAdvancedStats(selectedPeriod.value)
        Object.assign(stats, statsResponse.data)

        // Charger les stats KYC
        const kycResponse = await managerApi.getKycStats()
        Object.assign(kycStats, kycResponse.data)

        // Charger les top coursiers
        const couriersResponse = await managerApi.getCouriers({ limit: 5, sort: 'earnings' })
        topCouriers.value = couriersResponse.data

        // Charger l'activité récente
        const activityResponse = await managerApi.getRecentActivity()
        recentActivity.value = activityResponse.data

        // Mettre à jour les graphiques
        await nextTick()
        updateCharts()
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        loading.value = false
      }
    }

    const updateCharts = () => {
      // Graphique d'évolution des livraisons
      if (deliveryChart.value) {
        const ctx = deliveryChart.value.getContext('2d')

        if (deliveryChartInstance) {
          deliveryChartInstance.destroy()
        }

        deliveryChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: stats.deliveryTrend?.labels || [],
            datasets: [
              {
                label: 'Livraisons',
                data: stats.deliveryTrend?.data || [],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.3,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        })
      }

      // Graphique des revenus par commune
      if (revenueChart.value) {
        const ctx = revenueChart.value.getContext('2d')

        if (revenueChartInstance) {
          revenueChartInstance.destroy()
        }

        revenueChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: stats.revenueByCommune?.labels || [],
            datasets: [
              {
                label: 'Revenus (XOF)',
                data: stats.revenueByCommune?.data || [],
                backgroundColor: '#4CAF50',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        })
      }
    }

    const getGrowthClass = rate => {
      if (rate > 0) return 'positive'
      if (rate < 0) return 'negative'
      return 'neutral'
    }

    const getGrowthIcon = rate => {
      if (rate > 0) return 'fas fa-arrow-up'
      if (rate < 0) return 'fas fa-arrow-down'
      return 'fas fa-minus'
    }

    const getActivityIcon = type => {
      const icons = {
        user_registered: 'fas fa-user-plus',
        delivery_completed: 'fas fa-check-circle',
        kyc_submitted: 'fas fa-id-card',
        payment_processed: 'fas fa-credit-card',
      }
      return icons[type] || 'fas fa-circle'
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
      }).format(amount)
    }

    const formatTime = dateString => {
      const now = new Date()
      const date = new Date(dateString)
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 60) return `Il y a ${diffMins} min`
      if (diffHours < 24) return `Il y a ${diffHours}h`
      return `Il y a ${diffDays}j`
    }

    // Lifecycle
    onMounted(() => {
      loadData()
    })

    return {
      loading,
      selectedPeriod,
      deliveryChart,
      revenueChart,
      stats,
      kycStats,
      topCouriers,
      recentActivity,
      alerts,
      userRoleData,
      kycChartData,
      chartOptions,
      kycChartOptions,
      loadData,
      getGrowthClass,
      getGrowthIcon,
      getActivityIcon,
      formatCurrency,
      formatTime,
    }
  },
}
</script>

<style scoped>
.analytics-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.period-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.kpi-card.users .kpi-icon {
  background: #2196f3;
}
.kpi-card.deliveries .kpi-icon {
  background: #4caf50;
}
.kpi-card.revenue .kpi-icon {
  background: #ff9800;
}
.kpi-card.kyc .kpi-icon {
  background: #9c27b0;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.kpi-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.kpi-growth {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.kpi-growth.positive {
  color: #4caf50;
}
.kpi-growth.negative {
  color: #f44336;
}
.kpi-growth.neutral {
  color: #666;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.chart-header h3 {
  margin: 0;
  color: #333;
}

.chart-content {
  padding: 20px;
  height: 300px;
}

.chart-content canvas {
  width: 100% !important;
  height: 100% !important;
}

.data-tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.table-header h3 {
  margin: 0;
  color: #333;
}

.table-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  font-weight: 600;
  color: #333;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ff9800;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2196f3;
  font-size: 14px;
}

.activity-content {
  flex: 1;
}

.activity-description {
  color: #333;
  font-size: 14px;
  margin-bottom: 5px;
}

.activity-time {
  color: #666;
  font-size: 12px;
}

.alerts-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.alerts-grid {
  display: grid;
  gap: 15px;
}

.alert-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 15px;
}

.alert-card.warning {
  border-left-color: #ff9800;
  background: #fff8e1;
}

.alert-card.danger {
  border-left-color: #f44336;
  background: #ffebee;
}

.alert-card.success {
  border-left-color: #4caf50;
  background: #e8f5e8;
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.alert-card.warning .alert-icon {
  background: #ff9800;
  color: white;
}

.alert-card.danger .alert-icon {
  background: #f44336;
  color: white;
}

.alert-card.success .alert-icon {
  background: #4caf50;
  color: white;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.alert-description {
  color: #666;
  font-size: 14px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-warning {
  background: #ff9800;
  color: white;
}
</style>
