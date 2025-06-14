<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Tableau de bord</h1>
      <div class="dashboard-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="exportData">
          <font-awesome-icon icon="download" class="mr-1" />
          Exporter
        </button>
      </div>
    </div>

    <div class="dashboard-stats">
      <div class="stat-card" v-for="(stat, index) in stats" :key="index">
        <div class="stat-icon" :class="`bg-${stat.color}`">
          <font-awesome-icon :icon="stat.icon" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stat.value }}</h3>
          <p class="stat-label">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <div class="dashboard-col">
        <div class="card">
          <div class="card-header">
            <h2>Livraisons par jour</h2>
            <div class="card-actions">
              <button class="btn-icon" @click="changeChartPeriod('week')">7j</button>
              <button class="btn-icon" @click="changeChartPeriod('month')">30j</button>
              <button class="btn-icon" @click="changeChartPeriod('year')">1an</button>
            </div>
          </div>
          <div class="card-body">
            <canvas ref="deliveriesChart"></canvas>
          </div>
        </div>
      </div>
      <div class="dashboard-col">
        <div class="card">
          <div class="card-header">
            <h2>Revenus par commune</h2>
          </div>
          <div class="card-body">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <div class="dashboard-col">
        <div class="card">
          <div class="card-header">
            <h2>Meilleurs coursiers</h2>
            <div class="card-actions">
              <router-link to="/manager/users?role=courier" class="btn-link">
                Voir tout
              </router-link>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Coursier</th>
                    <th>Commune</th>
                    <th>Livraisons</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(courier, index) in topCouriers" :key="courier.id">
                    <td>
                      <span class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</span>
                    </td>
                    <td>
                      <div class="user-info">
                        <div class="user-avatar">
                          <img
                            v-if="courier.profile_picture"
                            :src="courier.profile_picture"
                            :alt="courier.name"
                          />
                          <div v-else class="avatar-placeholder">
                            {{ getInitials(courier.name) }}
                          </div>
                        </div>
                        <div class="user-details">
                          <div class="user-name">{{ courier.name }}</div>
                          <div class="user-phone">{{ courier.phone }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ courier.commune || 'Non spécifié' }}</td>
                    <td>{{ courier.deliveries_completed }}</td>
                    <td>
                      <div class="points">
                        <span class="points-value">{{ courier.total_points }}</span>
                        <span class="points-level">Niv. {{ courier.level }}</span>
                      </div>
                    </td>
                    <td>
                      <router-link :to="`/manager/users/${courier.id}`" class="btn-icon">
                        <font-awesome-icon icon="eye" />
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="dashboard-col">
        <div class="card">
          <div class="card-header">
            <h2>Livraisons récentes</h2>
            <div class="card-actions">
              <router-link to="/manager/deliveries" class="btn-link"> Voir tout </router-link>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Coursier</th>
                    <th>Statut</th>
                    <th>Prix</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="delivery in recentDeliveries" :key="delivery.id">
                    <td>#{{ delivery.id }}</td>
                    <td>{{ delivery.client_name }}</td>
                    <td>{{ delivery.courier_name || 'Non assigné' }}</td>
                    <td>
                      <span class="status-badge" :class="getStatusClass(delivery.status)">
                        {{ getStatusLabel(delivery.status) }}
                      </span>
                    </td>
                    <td>{{ formatPrice(delivery.final_price || delivery.proposed_price) }} FCFA</td>
                    <td>{{ formatDate(delivery.created_at) }}</td>
                    <td>
                      <router-link :to="`/manager/deliveries/${delivery.id}`" class="btn-icon">
                        <font-awesome-icon icon="eye" />
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import { fetchManagerDashboard } from '@/api/manager'
import { formatDate, formatPrice } from '@/utils/formatters'

export default {
  name: 'ManagerDashboardView',
  setup() {
    const loading = ref(false)
    const dashboardData = ref(null)
    const deliveriesChart = ref(null)
    const revenueChart = ref(null)
    const chartPeriod = ref('week')

    const stats = computed(() => {
      if (!dashboardData.value) return []

      return [
        {
          label: 'Utilisateurs',
          value: getTotalUsers(),
          icon: 'users',
          color: 'primary',
        },
        {
          label: 'Livraisons actives',
          value: dashboardData.value.active_deliveries || 0,
          icon: 'truck',
          color: 'info',
        },
        {
          label: 'Livraisons terminées',
          value: dashboardData.value.completed_deliveries || 0,
          icon: 'check',
          color: 'success',
        },
        {
          label: 'Revenus totaux',
          value: formatPrice(dashboardData.value.total_revenue || 0) + ' FCFA',
          icon: 'money-bill',
          color: 'warning',
        },
      ]
    })

    const topCouriers = computed(() => {
      return dashboardData.value?.top_couriers || []
    })

    const recentDeliveries = computed(() => {
      return dashboardData.value?.recent_deliveries || []
    })

    function getTotalUsers() {
      if (!dashboardData.value?.total_users) return 0

      return Object.values(dashboardData.value.total_users).reduce((sum, count) => sum + count, 0)
    }

    async function loadDashboardData() {
      try {
        loading.value = true
        dashboardData.value = await fetchManagerDashboard()
        renderCharts()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        loading.value = false
      }
    }

    function renderCharts() {
      if (!dashboardData.value) return

      renderDeliveriesChart()
      renderRevenueChart()
    }

    function renderDeliveriesChart() {
      const ctx = deliveriesChart.value.getContext('2d')

      // Préparer les données pour le graphique
      const deliveryStats = dashboardData.value.delivery_stats_by_day || {}
      const dates = Object.keys(deliveryStats).sort()
      const createdData = dates.map(date => deliveryStats[date].created || 0)
      const completedData = dates.map(date => deliveryStats[date].completed || 0)

      // Créer le graphique
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates.map(date => formatDate(date)),
          datasets: [
            {
              label: 'Créées',
              data: createdData,
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Terminées',
              data: completedData,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        },
      })
    }

    function renderRevenueChart() {
      const ctx = revenueChart.value.getContext('2d')

      // Préparer les données pour le graphique
      const revenueByCommune = dashboardData.value.revenue_by_commune || {}
      const communes = Object.keys(revenueByCommune)
      const revenueData = communes.map(commune => revenueByCommune[commune])

      // Couleurs pour les communes
      const colors = [
        '#FF6B00',
        '#4CAF50',
        '#2196F3',
        '#FFC107',
        '#9C27B0',
        '#E91E63',
        '#3F51B5',
        '#00BCD4',
        '#009688',
        '#FF5722',
      ]

      // Créer le graphique
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: communes,
          datasets: [
            {
              data: revenueData,
              backgroundColor: colors.slice(0, communes.length),
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
                  return `${context.label}: ${formatPrice(value)} FCFA`
                },
              },
            },
          },
        },
      })
    }

    function changeChartPeriod(period) {
      chartPeriod.value = period
      // Recharger les données avec la nouvelle période
      loadDashboardData()
    }

    function refreshData() {
      loadDashboardData()
    }

    function exportData() {
      // Implémenter l'exportation des données
      alert("Fonctionnalité d'exportation à implémenter")
    }

    function getInitials(name) {
      if (!name) return ''
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
    }

    function getRankClass(index) {
      const classes = ['rank-1', 'rank-2', 'rank-3']
      return index < 3 ? classes[index] : ''
    }

    function getStatusClass(status) {
      const statusClasses = {
        pending: 'status-pending',
        accepted: 'status-accepted',
        in_progress: 'status-in-progress',
        delivered: 'status-delivered',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
      }

      return statusClasses[status] || ''
    }

    function getStatusLabel(status) {
      const statusLabels = {
        pending: 'En attente',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        delivered: 'Livrée',
        completed: 'Terminée',
        cancelled: 'Annulée',
      }

      return statusLabels[status] || status
    }

    onMounted(() => {
      loadDashboardData()
    })

    return {
      loading,
      stats,
      topCouriers,
      recentDeliveries,
      deliveriesChart,
      revenueChart,
      refreshData,
      exportData,
      changeChartPeriod,
      getInitials,
      getRankClass,
      getStatusClass,
      getStatusLabel,
      formatDate,
      formatPrice,
    }
  },
}
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dashboard-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.dashboard-actions {
  display: flex;
  gap: 0.5rem;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.stat-icon {
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

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.dashboard-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.card-actions {
  display: flex;
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
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
}

.btn-link:hover {
  text-decoration: underline;
}

.card-body {
  position: relative;
  min-height: 300px;
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

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}
</style>
