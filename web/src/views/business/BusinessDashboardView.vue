<template>
  <div class="business-dashboard">
    <!-- Header avec statistiques principales -->
    <div class="dashboard-header">
      <h1>Tableau de bord - {{ businessProfile?.business_name || 'Mon Entreprise' }}</h1>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon deliveries">
            <i class="fas fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardData?.total_deliveries || 0 }}</h3>
            <p>Livraisons totales</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardData?.active_deliveries || 0 }}</h3>
            <p>En cours</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue">
            <i class="fas fa-euro-sign"></i>
          </div>
          <div class="stat-content">
            <h3>{{ formatCurrency(dashboardData?.total_revenue || 0) }}</h3>
            <p>Chiffre d'affaires</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon couriers">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ dashboardData?.total_couriers || 0 }}</h3>
            <p>Coursiers actifs</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="quick-actions">
      <h2>Actions rapides</h2>
      <div class="actions-grid">
        <router-link to="/business/deliveries/new" class="action-card">
          <i class="fas fa-plus"></i>
          <span>Nouvelle livraison</span>
        </router-link>
        <router-link to="/business/couriers" class="action-card">
          <i class="fas fa-motorcycle"></i>
          <span>Gérer les coursiers</span>
        </router-link>
        <router-link to="/business/vehicles" class="action-card">
          <i class="fas fa-car"></i>
          <span>Mes véhicules</span>
        </router-link>
        <router-link to="/business/finances" class="action-card">
          <i class="fas fa-chart-line"></i>
          <span>Finances</span>
        </router-link>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="dashboard-content">
      <!-- Livraisons récentes -->
      <div class="content-section">
        <div class="section-header">
          <h2>Livraisons récentes</h2>
          <router-link to="/business/deliveries" class="view-all-btn"> Voir tout </router-link>
        </div>
        <div v-if="loading.deliveries" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Chargement...
        </div>
        <div v-else-if="recentDeliveries.length === 0" class="empty-state">
          <p>Aucune livraison récente</p>
        </div>
        <div v-else class="deliveries-list">
          <div
            v-for="delivery in recentDeliveries"
            :key="delivery.id"
            class="delivery-item"
            @click="viewDelivery(delivery.id)"
          >
            <div class="delivery-info">
              <div class="delivery-route">
                <span class="pickup">{{ delivery.pickup_commune }}</span>
                <i class="fas fa-arrow-right"></i>
                <span class="dropoff">{{ delivery.delivery_commune }}</span>
              </div>
              <div class="delivery-meta">
                <span class="delivery-id">#{{ delivery.id }}</span>
                <span class="delivery-date">{{ formatDate(delivery.created_at) }}</span>
              </div>
            </div>
            <div class="delivery-status">
              <span :class="['status-badge', delivery.status]">
                {{ getStatusLabel(delivery.status) }}
              </span>
              <span class="delivery-price">{{
                formatCurrency(delivery.final_price || delivery.proposed_price)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="content-section">
        <div class="section-header">
          <h2>Analyses</h2>
          <select v-model="chartPeriod" @change="loadChartData" class="period-select">
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="quarter">3 derniers mois</option>
          </select>
        </div>
        <div class="charts-grid">
          <div class="chart-container">
            <h3>Revenus par jour</h3>
            <LineChart
              v-if="chartData.revenue"
              :data="chartData.revenue"
              :options="chartOptions.revenue"
            />
          </div>
          <div class="chart-container">
            <h3>Livraisons par statut</h3>
            <PieChart
              v-if="chartData.status"
              :data="chartData.status"
              :options="chartOptions.status"
            />
          </div>
        </div>
      </div>

      <!-- Coursiers performance -->
      <div class="content-section">
        <div class="section-header">
          <h2>Top coursiers</h2>
          <router-link to="/business/couriers" class="view-all-btn"> Voir tout </router-link>
        </div>
        <div v-if="loading.couriers" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Chargement...
        </div>
        <div v-else-if="topCouriers.length === 0" class="empty-state">
          <p>Aucun coursier</p>
        </div>
        <div v-else class="couriers-list">
          <div v-for="courier in topCouriers" :key="courier.id" class="courier-item">
            <div class="courier-avatar">
              <img
                :src="courier.profile_picture || '/default-avatar.png'"
                :alt="courier.full_name"
              />
            </div>
            <div class="courier-info">
              <h4>{{ courier.full_name }}</h4>
              <p>{{ courier.stats?.completed_deliveries || 0 }} livraisons</p>
            </div>
            <div class="courier-stats">
              <div class="rating">
                <i class="fas fa-star"></i>
                {{ (courier.stats?.average_rating || 0).toFixed(1) }}
              </div>
              <div class="earnings">
                {{ formatCurrency(courier.stats?.total_earnings || 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fetchBusinessDashboard, getRecentDeliveries, fetchBusinessCouriers } from '@/api/business'
import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'

export default {
  name: 'BusinessDashboardView',
  components: {
    LineChart,
    PieChart,
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const dashboardData = ref(null)
    const businessProfile = ref(null)
    const recentDeliveries = ref([])
    const topCouriers = ref([])
    const chartData = ref({})
    const chartPeriod = ref('week')

    const loading = ref({
      deliveries: false,
      couriers: false,
      dashboard: false,
    })

    const chartOptions = {
      revenue: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString() + ' €'
              },
            },
          },
        },
      },
      status: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    }

    const loadDashboardData = async () => {
      try {
        loading.value.dashboard = true
        const data = await fetchBusinessDashboard(chartPeriod.value)
        dashboardData.value = data
        businessProfile.value = authStore.user?.business_profile
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error)
      } finally {
        loading.value.dashboard = false
      }
    }

    const loadRecentDeliveries = async () => {
      try {
        loading.value.deliveries = true
        const data = await getRecentDeliveries(5)
        recentDeliveries.value = data.deliveries || []
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons:', error)
      } finally {
        loading.value.deliveries = false
      }
    }

    const loadTopCouriers = async () => {
      try {
        loading.value.couriers = true
        const data = await fetchBusinessCouriers({ limit: 5, sort: 'rating', order: 'desc' })
        topCouriers.value = data.couriers || []
      } catch (error) {
        console.error('Erreur lors du chargement des coursiers:', error)
      } finally {
        loading.value.couriers = false
      }
    }

    const loadChartData = async () => {
      try {
        // Charger les données de graphique depuis l'API
        const response = await fetchBusinessDashboard(chartPeriod.value)

        chartData.value = {
          revenue: {
            labels: response.revenue_by_day?.labels || [],
            datasets: [
              {
                label: 'Revenus (€)',
                data: response.revenue_by_day?.data || [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
              },
            ],
          },
          status: {
            labels: ['En attente', 'En cours', 'Terminées', 'Annulées'],
            datasets: [
              {
                data: [
                  response.pending_deliveries || 0,
                  response.active_deliveries || 0,
                  response.completed_deliveries || 0,
                  response.cancelled_deliveries || 0,
                ],
                backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
              },
            ],
          },
        }
      } catch (error) {
        console.error('Erreur lors du chargement des graphiques:', error)
      }
    }

    const viewDelivery = deliveryId => {
      router.push(`/business/deliveries/${deliveryId}`)
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount / 100)
    }

    const formatDate = date => {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const getStatusLabel = status => {
      const labels = {
        pending: 'En attente',
        bidding: 'Enchères',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        delivered: 'Livrée',
        completed: 'Terminée',
        cancelled: 'Annulée',
      }
      return labels[status] || status
    }

    onMounted(() => {
      loadDashboardData()
      loadRecentDeliveries()
      loadTopCouriers()
      loadChartData()
    })

    return {
      dashboardData,
      businessProfile,
      recentDeliveries,
      topCouriers,
      chartData,
      chartPeriod,
      chartOptions,
      loading,
      loadChartData,
      viewDelivery,
      formatCurrency,
      formatDate,
      getStatusLabel,
    }
  },
}
</script>

<style scoped>
.business-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header h1 {
  margin-bottom: 20px;
  color: #1f2937;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-icon.deliveries {
  background: #3b82f6;
}
.stat-icon.active {
  background: #f59e0b;
}
.stat-icon.revenue {
  background: #10b981;
}
.stat-icon.couriers {
  background: #8b5cf6;
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.stat-content p {
  margin: 0;
  color: #6b7280;
}

.quick-actions {
  margin-bottom: 30px;
}

.quick-actions h2 {
  margin-bottom: 15px;
  color: #1f2937;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  color: #1f2937;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-card i {
  font-size: 24px;
  color: #3b82f6;
  margin-bottom: 10px;
  display: block;
}

.dashboard-content {
  display: grid;
  gap: 30px;
}

.content-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #1f2937;
}

.view-all-btn {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.period-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.deliveries-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.delivery-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delivery-item:hover {
  background-color: #f9fafb;
}

.delivery-route {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.delivery-route i {
  color: #6b7280;
}

.delivery-meta {
  display: flex;
  gap: 15px;
  margin-top: 5px;
  font-size: 14px;
  color: #6b7280;
}

.delivery-status {
  text-align: right;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 5px;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}
.status-badge.accepted {
  background: #dbeafe;
  color: #2563eb;
}
.status-badge.in_progress {
  background: #fee2e2;
  color: #dc2626;
}
.status-badge.completed {
  background: #d1fae5;
  color: #059669;
}
.status-badge.cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.delivery-price {
  font-weight: 600;
  color: #1f2937;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.chart-container h3 {
  margin: 0 0 15px 0;
  color: #1f2937;
}

.couriers-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.courier-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.courier-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.courier-info {
  flex: 1;
}

.courier-info h4 {
  margin: 0 0 5px 0;
  color: #1f2937;
}

.courier-info p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.courier-stats {
  text-align: right;
}

.rating {
  color: #f59e0b;
  margin-bottom: 5px;
}

.rating i {
  margin-right: 5px;
}

.earnings {
  font-weight: 600;
  color: #1f2937;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .delivery-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .delivery-status {
    text-align: left;
    width: 100%;
  }
}
</style>
