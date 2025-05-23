<template>
  <div class="dashboard-container">
    <div class="page-header">
      <div class="header-content">
        <h1>Tableau de bord</h1>
        <div class="period-selector">
          <button 
            v-for="period in periods" 
            :key="period.value" 
            :class="['period-btn', { active: selectedPeriod === period.value }]"
            @click="changePeriod(period.value)"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="exportDashboard">
          <i class="fas fa-download"></i> Exporter
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchDashboardData">Réessayer</button>
    </div>

    <div v-else class="dashboard-content">
      <!-- Cartes de statistiques -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-truck"></i>
          </div>
          <div class="stat-content">
            <h3>Livraisons</h3>
            <div class="stat-value">{{ dashboardData.deliveries_count }}</div>
            <div class="stat-trend" :class="getTrendClass(dashboardData.deliveries_trend)">
              <i :class="getTrendIcon(dashboardData.deliveries_trend)"></i>
              {{ formatTrend(dashboardData.deliveries_trend) }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-content">
            <h3>Revenus</h3>
            <div class="stat-value">{{ formatPrice(dashboardData.revenue) }} FCFA</div>
            <div class="stat-trend" :class="getTrendClass(dashboardData.revenue_trend)">
              <i :class="getTrendIcon(dashboardData.revenue_trend)"></i>
              {{ formatTrend(dashboardData.revenue_trend) }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-content">
            <h3>Satisfaction</h3>
            <div class="stat-value">{{ dashboardData.satisfaction_rate }}%</div>
            <div class="stat-trend" :class="getTrendClass(dashboardData.satisfaction_trend)">
              <i :class="getTrendIcon(dashboardData.satisfaction_trend)"></i>
              {{ formatTrend(dashboardData.satisfaction_trend) }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>Clients</h3>
            <div class="stat-value">{{ dashboardData.clients_count }}</div>
            <div class="stat-trend" :class="getTrendClass(dashboardData.clients_trend)">
              <i :class="getTrendIcon(dashboardData.clients_trend)"></i>
              {{ formatTrend(dashboardData.clients_trend) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="charts-container">
        <div class="chart-card">
          <div class="chart-header">
            <h3>Livraisons par jour</h3>
            <div class="chart-actions">
              <button class="btn-icon" @click="toggleChartType('deliveries')">
                <i :class="chartTypes.deliveries === 'bar' ? 'fas fa-chart-line' : 'fas fa-chart-bar'"></i>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <canvas ref="deliveriesChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>Revenus par jour</h3>
            <div class="chart-actions">
              <button class="btn-icon" @click="toggleChartType('revenue')">
                <i :class="chartTypes.revenue === 'bar' ? 'fas fa-chart-line' : 'fas fa-chart-bar'"></i>
              </button>
            </div>
          </div>
          <div class="chart-body">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Répartition par commune -->
      <div class="chart-card">
        <div class="chart-header">
          <h3>Répartition par commune</h3>
          <div class="chart-actions">
            <button 
              v-for="view in communeViews" 
              :key="view.value" 
              :class="['btn-text', { active: selectedCommuneView === view.value }]"
              @click="changeCommuneView(view.value)"
            >
              {{ view.label }}
            </button>
          </div>
        </div>
        <div class="chart-body commune-chart">
          <div class="commune-map">
            <canvas ref="communeChart"></canvas>
          </div>
          <div class="commune-list">
            <div 
              v-for="(commune, index) in topCommunes" 
              :key="commune.name" 
              class="commune-item"
            >
              <div class="commune-rank">{{ index + 1 }}</div>
              <div class="commune-name">{{ commune.name }}</div>
              <div class="commune-value">
                {{ selectedCommuneView === 'deliveries' ? commune.deliveries : formatPrice(commune.revenue) + ' FCFA' }}
              </div>
              <div class="commune-bar-container">
                <div 
                  class="commune-bar" 
                  :style="{ width: `${commune.percentage}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Livraisons récentes et alertes -->
      <div class="bottom-cards">
        <div class="recent-deliveries-card">
          <div class="card-header">
            <h3>Livraisons récentes</h3>
            <button class="btn-text" @click="viewAllDeliveries">
              Voir tout <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="card-body">
            <div v-if="recentDeliveries.length === 0" class="empty-state">
              <p>Aucune livraison récente</p>
            </div>
            <div v-else class="deliveries-list">
              <div 
                v-for="delivery in recentDeliveries" 
                :key="delivery.id" 
                class="delivery-item"
                @click="viewDeliveryDetails(delivery.id)"
              >
                <div class="delivery-status" :class="delivery.status">
                  <i :class="getStatusIcon(delivery.status)"></i>
                </div>
                <div class="delivery-info">
                  <div class="delivery-id">#{{ delivery.id }}</div>
                  <div class="delivery-addresses">
                    <span class="pickup">{{ delivery.pickup_address }}</span>
                    <i class="fas fa-arrow-right"></i>
                    <span class="delivery">{{ delivery.delivery_address }}</span>
                  </div>
                  <div class="delivery-meta">
                    <span class="delivery-date">{{ formatDate(delivery.created_at) }}</span>
                    <span class="delivery-price">{{ formatPrice(delivery.price) }} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="alerts-card">
          <div class="card-header">
            <h3>Alertes</h3>
            <button class="btn-text" @click="viewAllAlerts">
              Voir tout <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="card-body">
            <div v-if="alerts.length === 0" class="empty-state">
              <p>Aucune alerte</p>
            </div>
            <div v-else class="alerts-list">
              <div 
                v-for="alert in alerts" 
                :key="alert.id" 
                class="alert-item"
                :class="alert.severity"
                @click="handleAlert(alert)"
              >
                <div class="alert-icon">
                  <i :class="getAlertIcon(alert.type)"></i>
                </div>
                <div class="alert-content">
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-time">{{ formatTime(alert.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Chart from 'chart.js/auto';
import { fetchBusinessDashboard } from '@/api/business';
import { formatPrice, formatDate, formatTime } from '@/utils/formatters';
import { exportToExcel } from '@/utils/export-utils';

export default {
  name: 'DashboardView',
  setup() {
    const router = useRouter();
    
    // Références pour les graphiques
    const deliveriesChart = ref(null);
    const revenueChart = ref(null);
    const communeChart = ref(null);
    
    // Instances de graphiques
    let deliveriesChartInstance = null;
    let revenueChartInstance = null;
    let communeChartInstance = null;
    
    // État
    const loading = ref(true);
    const error = ref(null);
    const selectedPeriod = ref('week');
    const selectedCommuneView = ref('deliveries');
    const chartTypes = reactive({
      deliveries: 'bar',
      revenue: 'line'
    });
    
    // Données du tableau de bord
    const dashboardData = reactive({
      deliveries_count: 0,
      deliveries_trend: 0,
      revenue: 0,
      revenue_trend: 0,
      satisfaction_rate: 0,
      satisfaction_trend: 0,
      clients_count: 0,
      clients_trend: 0,
      deliveries_by_day: [],
      revenue_by_day: [],
      communes_data: []
    });
    
    // Livraisons récentes
    const recentDeliveries = ref([]);
    
    // Alertes
    const alerts = ref([]);
    
    // Options
    const periods = [
      { value: 'week', label: 'Semaine' },
      { value: 'month', label: 'Mois' },
      { value: 'quarter', label: 'Trimestre' },
      { value: 'year', label: 'Année' }
    ];
    
    const communeViews = [
      { value: 'deliveries', label: 'Livraisons' },
      { value: 'revenue', label: 'Revenus' }
    ];
    
    // Computed
    const topCommunes = ref([]);
    
    // Méthodes
    const fetchDashboardData = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await fetchBusinessDashboard(selectedPeriod.value);
        
        // Mettre à jour les données du tableau de bord
        Object.assign(dashboardData, response.data);
        
        // Mettre à jour les livraisons récentes
        recentDeliveries.value = response.data.recent_deliveries || [];
        
        // Mettre à jour les alertes
        alerts.value = response.data.alerts || [];
        
        // Mettre à jour les communes
        updateCommunesData();
        
        // Mettre à jour les graphiques
        updateCharts();
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        error.value = 'Impossible de charger les données du tableau de bord. Veuillez réessayer.';
      } finally {
        loading.value = false;
      }
    };
    
    const updateCommunesData = () => {
      if (!dashboardData.communes_data || dashboardData.communes_data.length === 0) {
        topCommunes.value = [];
        return;
      }
      
      // Trier les communes par livraisons ou revenus
      const sortedCommunes = [...dashboardData.communes_data].sort((a, b) => {
        if (selectedCommuneView.value === 'deliveries') {
          return b.deliveries - a.deliveries;
        } else {
          return b.revenue - a.revenue;
        }
      });
      
      // Calculer le pourcentage pour chaque commune
      const maxValue = sortedCommunes[0][selectedCommuneView.value];
      
      topCommunes.value = sortedCommunes.map(commune => ({
        ...commune,
        percentage: (commune[selectedCommuneView.value] / maxValue) * 100
      }));
    };
    
    const updateCharts = () => {
      // Mettre à jour le graphique des livraisons
      updateDeliveriesChart();
      
      // Mettre à jour le graphique des revenus
      updateRevenueChart();
      
      // Mettre à jour le graphique des communes
      updateCommuneChart();
    };
    
    const updateDeliveriesChart = () => {
      if (!deliveriesChart.value) return;
      
      // Détruire l'instance existante si elle existe
      if (deliveriesChartInstance) {
        deliveriesChartInstance.destroy();
      }
      
      // Créer une nouvelle instance
      const ctx = deliveriesChart.value.getContext('2d');
      
      const labels = dashboardData.deliveries_by_day.map(item => item.date);
      const data = dashboardData.deliveries_by_day.map(item => item.count);
      
      deliveriesChartInstance = new Chart(ctx, {
        type: chartTypes.deliveries,
        data: {
          labels,
          datasets: [{
            label: 'Livraisons',
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          }
        }
      });
    };
    
    const updateRevenueChart = () => {
      if (!revenueChart.value) return;
      
      // Détruire l'instance existante si elle existe
      if (revenueChartInstance) {
        revenueChartInstance.destroy();
      }
      
      // Créer une nouvelle instance
      const ctx = revenueChart.value.getContext('2d');
      
      const labels = dashboardData.revenue_by_day.map(item => item.date);
      const data = dashboardData.revenue_by_day.map(item => item.amount);
      
      revenueChartInstance = new Chart(ctx, {
        type: chartTypes.revenue,
        data: {
          labels,
          datasets: [{
            label: 'Revenus (FCFA)',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatPrice(value) + ' FCFA';
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  return formatPrice(context.raw) + ' FCFA';
                }
              }
            }
          }
        }
      });
    };
    
    const updateCommuneChart = () => {
      if (!communeChart.value) return;
      
      // Détruire l'instance existante si elle existe
      if (communeChartInstance) {
        communeChartInstance.destroy();
      }
      
      // Créer une nouvelle instance
      const ctx = communeChart.value.getContext('2d');
      
      const labels = topCommunes.value.map(commune => commune.name);
      const data = topCommunes.value.map(commune => 
        selectedCommuneView.value === 'deliveries' ? commune.deliveries : commune.revenue
      );
      
      communeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)',
              'rgba(83, 102, 255, 0.7)',
              'rgba(40, 159, 64, 0.7)',
              'rgba(210, 199, 199, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
              'rgba(40, 159, 64, 1)',
              'rgba(210, 199, 199, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  if (selectedCommuneView.value === 'deliveries') {
                    return `${context.label}: ${value} livraisons`;
                  } else {
                    return `${context.label}: ${formatPrice(value)} FCFA`;
                  }
                }
              }
            }
          }
        }
      });
    };
    
    const changePeriod = (period) => {
      selectedPeriod.value = period;
      fetchDashboardData();
    };
    
    const changeCommuneView = (view) => {
      selectedCommuneView.value = view;
      updateCommunesData();
      updateCommuneChart();
    };
    
    const toggleChartType = (chartName) => {
      if (chartName === 'deliveries') {
        chartTypes.deliveries = chartTypes.deliveries === 'bar' ? 'line' : 'bar';
        updateDeliveriesChart();
      } else if (chartName === 'revenue') {
        chartTypes.revenue = chartTypes.revenue === 'bar' ? 'line' : 'bar';
        updateRevenueChart();
      }
    };
    
    const refreshData = () => {
      fetchDashboardData();
    };
    
    const exportDashboard = () => {
      // Préparer les données pour l'export
      const deliveriesData = dashboardData.deliveries_by_day.map(item => ({
        'Date': item.date,
        'Nombre de livraisons': item.count
      }));
      
      const revenueData = dashboardData.revenue_by_day.map(item => ({
        'Date': item.date,
        'Revenus (FCFA)': item.amount
      }));
      
      const communesData = dashboardData.communes_data.map(commune => ({
        'Commune': commune.name,
        'Livraisons': commune.deliveries,
        'Revenus (FCFA)': commune.revenue
      }));
      
      // Créer un workbook avec plusieurs feuilles
      const workbook = {
        'Résumé': [
          {
            'Métrique': 'Livraisons',
            'Valeur': dashboardData.deliveries_count,
            'Tendance (%)': dashboardData.deliveries_trend
          },
          {
            'Métrique': 'Revenus',
            'Valeur': dashboardData.revenue,
            'Tendance (%)': dashboardData.revenue_trend
          },
          {
            'Métrique': 'Satisfaction',
            'Valeur': dashboardData.satisfaction_rate,
            'Tendance (%)': dashboardData.satisfaction_trend
          },
          {
            'Métrique': 'Clients',
            'Valeur': dashboardData.clients_count,
            'Tendance (%)': dashboardData.clients_trend
          }
        ],
        'Livraisons par jour': deliveriesData,
        'Revenus par jour': revenueData,
        'Communes': communesData
      };
      
      // Exporter en Excel
      exportToExcel(workbook, `tableau-de-bord-${selectedPeriod.value}`);
    };
    
    const viewAllDeliveries = () => {
      router.push({ name: 'business-deliveries' });
    };
    
    const viewDeliveryDetails = (deliveryId) => {
      router.push({ name: 'business-delivery-detail', params: { id: deliveryId } });
    };
    
    const viewAllAlerts = () => {
      router.push({ name: 'business-notifications' });
    };
    
    const handleAlert = (alert) => {
      if (alert.action_url) {
        router.push(alert.action_url);
      } else if (alert.type === 'delivery') {
        router.push({ name: 'business-delivery-detail', params: { id: alert.reference_id } });
      } else if (alert.type === 'complaint') {
        router.push({ name: 'business-complaints' });
      } else {
        router.push({ name: 'business-notifications' });
      }
    };
    
    const getTrendClass = (trend) => {
      if (trend > 0) return 'positive';
      if (trend < 0) return 'negative';
      return 'neutral';
    };
    
    const getTrendIcon = (trend) => {
      if (trend > 0) return 'fas fa-arrow-up';
      if (trend < 0) return 'fas fa-arrow-down';
      return 'fas fa-minus';
    };
    
    const formatTrend = (trend) => {
      const sign = trend > 0 ? '+' : '';
      return `${sign}${trend}%`;
    };
    
    const getStatusIcon = (status) => {
      const statusIcons = {
        pending: 'fas fa-clock',
        accepted: 'fas fa-check',
        in_progress: 'fas fa-truck',
        completed: 'fas fa-flag-checkered',
        cancelled: 'fas fa-times'
      };
      
      return statusIcons[status] || 'fas fa-question';
    };
    
    const getAlertIcon = (type) => {
      const alertIcons = {
        delivery: 'fas fa-truck',
        payment: 'fas fa-money-bill-wave',
        system: 'fas fa-cogs',
        complaint: 'fas fa-exclamation-circle',
        security: 'fas fa-shield-alt'
      };
      
      return alertIcons[type] || 'fas fa-bell';
    };
    
    // Cycle de vie
    onMounted(() => {
      fetchDashboardData();
      
      // Mettre à jour les données toutes les 5 minutes
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 5 * 60 * 1000);
      
      // Nettoyer l'intervalle lors du démontage
      onUnmounted(() => {
        clearInterval(interval);
        
        // Détruire les instances de graphiques
        if (deliveriesChartInstance) {
          deliveriesChartInstance.destroy();
        }
        
        if (revenueChartInstance) {
          revenueChartInstance.destroy();
        }
        
        if (communeChartInstance) {
          communeChartInstance.destroy();
        }
      });
    });
    
    return {
      loading,
      error,
      selectedPeriod,
      selectedCommuneView,
      chartTypes,
      dashboardData,
      recentDeliveries,
      alerts,
      periods,
      communeViews,
      topCommunes,
      deliveriesChart,
      revenueChart,
      communeChart,
      
      fetchDashboardData,
      changePeriod,
      changeCommuneView,
      toggleChartType,
      refreshData,
      exportDashboard,
      viewAllDeliveries,
      viewDeliveryDetails,
      viewAllAlerts,
      handleAlert,
      getTrendClass,
      getTrendIcon,
      formatTrend,
      getStatusIcon,
      getAlertIcon,
      
      formatPrice,
      formatDate,
      formatTime
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-content h1 {
  font-size: 1.8rem;
  margin: 0;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
}

.period-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.period-btn.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(0, 123, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-icon i {
  font-size: 1.5rem;
  color: #007bff;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #6c757d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.stat-trend {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-trend.positive {
  color: #28a745;
}

.stat-trend.negative {
  color: #dc3545;
}

.stat-trend.neutral {
  color: #6c757d;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #ced4da;
  background-color: white;
  color: #495057;
  cursor: pointer;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.btn-text.active {
  font-weight: 600;
  text-decoration: underline;
}

.chart-body {
  padding: 1.5rem;
  height: 300px;
  position: relative;
}

.commune-chart {
  display: flex;
  gap: 1.5rem;
}

.commune-map {
  flex: 1;
  max-width: 300px;
}

.commune-list {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: 300px;
}

.commune-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.commune-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.commune-name {
  flex: 1;
  font-weight: 500;
}

.commune-value {
  font-weight: 600;
  min-width: 100px;
  text-align: right;
}

.commune-bar-container {
  flex: 2;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.commune-bar {
  height: 100%;
  background-color: #007bff;
  border-radius: 4px;
}

.bottom-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.recent-deliveries-card,
.alerts-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.card-body {
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.deliveries-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.delivery-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.delivery-item:hover {
  background-color: #f8f9fa;
}

.delivery-status {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.delivery-status.pending {
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.delivery-status.accepted {
  background-color: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

.delivery-status.in_progress {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.delivery-status.completed {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.delivery-status.cancelled {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.delivery-info {
  flex: 1;
}

.delivery-id {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.delivery-addresses {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.delivery-addresses i {
  font-size: 0.8rem;
  color: #6c757d;
}

.delivery-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #6c757d;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-left: 4px solid;
  border-radius: 0.25rem;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-item:hover {
  background-color: #e9ecef;
}

.alert-item.high {
  border-color: #dc3545;
}

.alert-item.medium {
  border-color: #ffc107;
}

.alert-item.low {
  border-color: #17a2b8;
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.alert-message {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.alert-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  border: 1px solid #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}

.btn-outline {
  background-color: white;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background-color: #f8f9fa;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .charts-container,
  .bottom-cards {
    grid-template-columns: 1fr;
  }
  
  .commune-chart {
    flex-direction: column;
  }
  
  .commune-map {
    max-width: 100%;
    margin-bottom: 1.5rem;
  }
}
</style>
