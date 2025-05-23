<template>
  <div class="analytics-dashboard">
    <h1 class="page-title">Tableau de bord analytique</h1>
    
    <div class="date-filter">
      <div class="date-range">
        <label>Période:</label>
        <select v-model="dateRange" @change="loadAnalytics">
          <option value="today">Aujourd'hui</option>
          <option value="yesterday">Hier</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
          <option value="custom">Personnalisé</option>
        </select>
      </div>
      
      <div v-if="dateRange === 'custom'" class="custom-date-range">
        <div class="date-input">
          <label>Du:</label>
          <input type="date" v-model="startDate" @change="loadAnalytics">
        </div>
        <div class="date-input">
          <label>Au:</label>
          <input type="date" v-model="endDate" @change="loadAnalytics">
        </div>
      </div>
      
      <div class="commune-filter">
        <label>Commune:</label>
        <select v-model="selectedCommune" @change="loadAnalytics">
          <option value="">Toutes les communes</option>
          <option v-for="commune in communes" :key="commune" :value="commune">
            {{ commune }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="metrics-cards">
      <div class="metric-card">
        <div class="metric-icon">
          <font-awesome-icon icon="box" />
        </div>
        <div class="metric-content">
          <h3>Livraisons</h3>
          <div class="metric-value">{{ metrics.deliveries.total }}</div>
          <div class="metric-change" :class="getChangeClass(metrics.deliveries.change)">
            <font-awesome-icon :icon="getChangeIcon(metrics.deliveries.change)" />
            {{ formatPercentage(metrics.deliveries.change) }}
          </div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <font-awesome-icon icon="money-bill-wave" />
        </div>
        <div class="metric-content">
          <h3>Revenus</h3>
          <div class="metric-value">{{ formatCurrency(metrics.revenue.total) }}</div>
          <div class="metric-change" :class="getChangeClass(metrics.revenue.change)">
            <font-awesome-icon :icon="getChangeIcon(metrics.revenue.change)" />
            {{ formatPercentage(metrics.revenue.change) }}
          </div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <font-awesome-icon icon="users" />
        </div>
        <div class="metric-content">
          <h3>Nouveaux utilisateurs</h3>
          <div class="metric-value">{{ metrics.newUsers.total }}</div>
          <div class="metric-change" :class="getChangeClass(metrics.newUsers.change)">
            <font-awesome-icon :icon="getChangeIcon(metrics.newUsers.change)" />
            {{ formatPercentage(metrics.newUsers.change) }}
          </div>
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">
          <font-awesome-icon icon="star" />
        </div>
        <div class="metric-content">
          <h3>Satisfaction</h3>
          <div class="metric-value">{{ formatRating(metrics.satisfaction.total) }}</div>
          <div class="metric-change" :class="getChangeClass(metrics.satisfaction.change)">
            <font-awesome-icon :icon="getChangeIcon(metrics.satisfaction.change)" />
            {{ formatPercentage(metrics.satisfaction.change) }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="charts-container">
      <div class="chart-card">
        <h3>Livraisons par jour</h3>
        <deliveries-chart 
          :chart-data="deliveriesChartData" 
          :options="deliveriesChartOptions"
        />
      </div>
      
      <div class="chart-card">
        <h3>Répartition par statut</h3>
        <pie-chart 
          :chart-data="statusChartData" 
          :options="statusChartOptions"
        />
      </div>
      
      <div class="chart-card">
        <h3>Livraisons par commune</h3>
        <horizontal-bar-chart 
          :chart-data="communeChartData" 
          :options="communeChartOptions"
        />
      </div>
      
      <div class="chart-card">
        <h3>Revenus par jour</h3>
        <deliveries-chart 
          :chart-data="revenueChartData" 
          :options="revenueChartOptions"
        />
      </div>
    </div>
    
    <div class="performance-section">
      <h2>Performance des coursiers</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Coursier</th>
              <th>Livraisons</th>
              <th>Taux de complétion</th>
              <th>Temps moyen</th>
              <th>Évaluation</th>
              <th>Revenus</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="courier in topCouriers" :key="courier.id">
              <td>
                <div class="courier-info">
                  <img :src="courier.profilePicture || '/img/default-avatar.png'" alt="Avatar">
                  <span>{{ courier.name }}</span>
                </div>
              </td>
              <td>{{ courier.deliveries }}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress" :style="{ width: courier.completionRate + '%' }"></div>
                  <span>{{ courier.completionRate }}%</span>
                </div>
              </td>
              <td>{{ formatDuration(courier.averageTime) }}</td>
              <td>
                <div class="rating">
                  <span class="stars">
                    <font-awesome-icon v-for="n in Math.floor(courier.rating)" :key="n" icon="star" class="star-filled" />
                    <font-awesome-icon v-if="courier.rating % 1 > 0" icon="star-half-alt" class="star-filled" />
                    <font-awesome-icon v-for="n in (5 - Math.ceil(courier.rating))" :key="n + Math.ceil(courier.rating)" icon="star" class="star-empty" />
                  </span>
                  <span class="rating-value">{{ courier.rating.toFixed(1) }}</span>
                </div>
              </td>
              <td>{{ formatCurrency(courier.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import DeliveriesChart from '@/components/charts/DeliveriesChart.vue';
import PieChart from '@/components/charts/PieChart.vue';
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue';
import { getAnalyticsData, getCourierPerformance } from '@/api/manager';
import { formatCurrency, formatPercentage, formatDuration } from '@/utils/formatters';
import { generateChartColors } from '@/utils/chart-helpers';

export default {
  name: 'AnalyticsView',
  components: {
    DeliveriesChart,
    PieChart,
    HorizontalBarChart
  },
  setup() {
    const dateRange = ref('week');
    const startDate = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10));
    const endDate = ref(new Date().toISOString().substr(0, 10));
    const selectedCommune = ref('');
    const communes = ref([
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
    ]);
    
    const metrics = ref({
      deliveries: { total: 0, change: 0 },
      revenue: { total: 0, change: 0 },
      newUsers: { total: 0, change: 0 },
      satisfaction: { total: 0, change: 0 }
    });
    
    const deliveriesChartData = ref({
      labels: [],
      datasets: []
    });
    
    const statusChartData = ref({
      labels: [],
      datasets: []
    });
    
    const communeChartData = ref({
      labels: [],
      datasets: []
    });
    
    const revenueChartData = ref({
      labels: [],
      datasets: []
    });
    
    const topCouriers = ref([]);
    
    const deliveriesChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    };
    
    const statusChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        }
      }
    };
    
    const communeChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    };
    
    const revenueChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    };
    
    const loadAnalytics = async () => {
      try {
        // Préparer les paramètres de date
        let params = {};
        
        if (dateRange.value === 'custom') {
          params.startDate = startDate.value;
          params.endDate = endDate.value;
        } else {
          params.dateRange = dateRange.value;
        }
        
        if (selectedCommune.value) {
          params.commune = selectedCommune.value;
        }
        
        // Charger les données analytiques
        const data = await getAnalyticsData(params);
        
        // Mettre à jour les métriques
        metrics.value = data.metrics;
        
        // Mettre à jour les données des graphiques
        deliveriesChartData.value = {
          labels: data.deliveriesByDay.labels,
          datasets: [{
            label: 'Livraisons',
            data: data.deliveriesByDay.data,
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          }]
        };
        
        statusChartData.value = {
          labels: data.deliveriesByStatus.labels,
          datasets: [{
            data: data.deliveriesByStatus.data,
            backgroundColor: generateChartColors(data.deliveriesByStatus.labels.length),
            borderWidth: 1
          }]
        };
        
        communeChartData.value = {
          labels: data.deliveriesByCommune.labels,
          datasets: [{
            label: 'Livraisons',
            data: data.deliveriesByCommune.data,
            backgroundColor: '#2196F3',
            borderColor: '#2196F3',
            borderWidth: 1
          }]
        };
        
        revenueChartData.value = {
          labels: data.revenueByDay.labels,
          datasets: [{
            label: 'Revenus',
            data: data.revenueByDay.data,
            backgroundColor: '#FF9800',
            borderColor: '#FF9800',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          }]
        };
        
        // Charger les performances des coursiers
        const courierData = await getCourierPerformance(params);
        topCouriers.value = courierData.topCouriers;
        
      } catch (error) {
        console.error('Erreur lors du chargement des données analytiques:', error);
      }
    };
    
    const getChangeClass = (change) => {
      if (change > 0) return 'positive';
      if (change < 0) return 'negative';
      return 'neutral';
    };
    
    const getChangeIcon = (change) => {
      if (change > 0) return 'arrow-up';
      if (change < 0) return 'arrow-down';
      return 'minus';
    };
    
    const formatRating = (rating) => {
      return rating.toFixed(1) + '/5';
    };
    
    onMounted(() => {
      loadAnalytics();
    });
    
    return {
      dateRange,
      startDate,
      endDate,
      selectedCommune,
      communes,
      metrics,
      deliveriesChartData,
      statusChartData,
      communeChartData,
      revenueChartData,
      deliveriesChartOptions,
      statusChartOptions,
      communeChartOptions,
      revenueChartOptions,
      topCouriers,
      loadAnalytics,
      getChangeClass,
      getChangeIcon,
      formatCurrency,
      formatPercentage,
      formatDuration,
      formatRating
    };
  }
};
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.date-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.date-range, .custom-date-range, .commune-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-date-range {
  display: flex;
  gap: 15px;
}

.date-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

select, input[type="date"] {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  margin-right: 15px;
  background-color: #f0f4ff;
  border-radius: 50%;
  color: #4361ee;
  font-size: 20px;
}

.metric-content {
  flex: 1;
}

.metric-content h3 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.metric-change {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.metric-change.positive {
  color: #4CAF50;
}

.metric-change.negative {
  color: #F44336;
}

.metric-change.neutral {
  color: #9E9E9E;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 350px;
}

.chart-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.performance-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.performance-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #f9f9f9;
  font-weight: 600;
}

.courier-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.courier-info img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 4px;
}

.progress-bar span {
  position: absolute;
  top: 10px;
  left: 0;
  font-size: 12px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stars {
  color: #FFD700;
}

.star-empty {
  color: #ddd;
}

.rating-value {
  font-weight: 600;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .metrics-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
