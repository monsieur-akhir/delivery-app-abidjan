<template>
  <div class="collaborative-stats">
    <div class="stats-header">
      <h3>Statistiques des livraisons collaboratives</h3>
      <div class="period-selector">
        <select v-model="selectedPeriod" @change="fetchStats">
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des statistiques...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchStats" class="retry-btn">Réessayer</button>
    </div>

    <div v-else class="stats-content">
      <!-- Métriques principales -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-handshake"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ stats.totalDeliveries }}</div>
            <div class="metric-label">Livraisons collaboratives</div>
            <div class="metric-change" :class="getChangeClass(stats.deliveriesChange)">
              <i :class="getChangeIcon(stats.deliveriesChange)"></i>
              {{ Math.abs(stats.deliveriesChange || 0) }}%
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ stats.averageTeamSize }}</div>
            <div class="metric-label">Taille moyenne d'équipe</div>
            <div class="metric-change" :class="getChangeClass(stats.teamSizeChange)">
              <i :class="getChangeIcon(stats.teamSizeChange)"></i>
              {{ Math.abs(stats.teamSizeChange || 0) }}%
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ stats.successRate }}%</div>
            <div class="metric-label">Taux de succès</div>
            <div class="metric-change" :class="getChangeClass(stats.successRateChange)">
              <i :class="getChangeIcon(stats.successRateChange)"></i>
              {{ Math.abs(stats.successRateChange || 0) }}%
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatCurrency(stats.totalEarnings) }}</div>
            <div class="metric-label">Gains totaux</div>
            <div class="metric-change" :class="getChangeClass(stats.earningsChange)">
              <i :class="getChangeIcon(stats.earningsChange)"></i>
              {{ Math.abs(stats.earningsChange || 0) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="charts-section">
        <div class="chart-container">
          <h4>Évolution des livraisons collaboratives</h4>
          <canvas ref="deliveriesChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
          <h4>Répartition par statut</h4>
          <canvas ref="statusChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Tableaux détaillés -->
      <div class="details-section">
        <div class="detail-table">
          <h4>Top coursiers collaboratifs</h4>
          <table>
            <thead>
              <tr>
                <th>Coursier</th>
                <th>Livraisons</th>
                <th>Gains</th>
                <th>Note moyenne</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="courier in stats.topCouriers" :key="courier.id">
                <td>
                  <div class="courier-info">
                    <img v-if="courier.avatar" :src="courier.avatar" :alt="courier.name" class="courier-avatar" />
                    <div v-else class="courier-avatar-fallback">
                      {{ getInitials(courier.name) }}
                    </div>
                    <span>{{ courier.name }}</span>
                  </div>
                </td>
                <td>{{ courier.deliveries }}</td>
                <td>{{ formatCurrency(courier.earnings) }}</td>
                <td>
                  <div class="rating">
                    <i class="fas fa-star"></i>
                    {{ courier.rating }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="detail-table">
          <h4>Trajets les plus populaires</h4>
          <table>
            <thead>
              <tr>
                <th>Trajet</th>
                <th>Livraisons</th>
                <th>Prix moyen</th>
                <th>Temps moyen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="route in stats.popularRoutes" :key="route.id">
                <td>
                  <div class="route-info">
                    <span class="route-text">{{ route.from }} → {{ route.to }}</span>
                    <span class="route-distance">{{ route.distance }} km</span>
                  </div>
                </td>
                <td>{{ route.deliveries }}</td>
                <td>{{ formatCurrency(route.averagePrice) }}</td>
                <td>{{ route.averageTime }} min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import collaborativeApi from '@/api/collaborative'

export default {
  name: 'CollaborativeStatsComponent',
  
  setup() {
    const stats = ref({})
    const loading = ref(true)
    const error = ref(null)
    const selectedPeriod = ref('month')
    
    const deliveriesChart = ref(null)
    const statusChart = ref(null)
    
    let deliveriesChartInstance = null
    let statusChartInstance = null
    
    const fetchStats = async () => {
      try {
        loading.value = true
        error.value = null
        
        const response = await collaborativeApi.getCollaborativeStats({
          period: selectedPeriod.value
        })
        
        stats.value = response
        
        // Mettre à jour les graphiques
        await nextTick()
        updateCharts()
      } catch (err) {
        console.error('Erreur lors du chargement des statistiques:', err)
        error.value = 'Impossible de charger les statistiques'
      } finally {
        loading.value = false
      }
    }
    
    const updateCharts = () => {
      updateDeliveriesChart()
      updateStatusChart()
    }
    
    const updateDeliveriesChart = () => {
      if (!deliveriesChart.value || !stats.value.deliveriesOverTime) return
      
      // Détruire le graphique existant
      if (deliveriesChartInstance) {
        deliveriesChartInstance.destroy()
      }
      
      const ctx = deliveriesChart.value.getContext('2d')
      deliveriesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stats.value.deliveriesOverTime.labels,
          datasets: [{
            label: 'Livraisons collaboratives',
            data: stats.value.deliveriesOverTime.data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      })
    }
    
    const updateStatusChart = () => {
      if (!statusChart.value || !stats.value.statusDistribution) return
      
      // Détruire le graphique existant
      if (statusChartInstance) {
        statusChartInstance.destroy()
      }
      
      const ctx = statusChart.value.getContext('2d')
      statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: stats.value.statusDistribution.labels,
          datasets: [{
            data: stats.value.statusDistribution.data,
            backgroundColor: [
              '#10b981', // Terminées
              '#3b82f6', // En cours
              '#f59e0b', // En attente
              '#ef4444'  // Annulées
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount)
    }
    
    const getChangeClass = (change) => {
      if (change > 0) return 'positive'
      if (change < 0) return 'negative'
      return 'neutral'
    }
    
    const getChangeIcon = (change) => {
      if (change > 0) return 'fas fa-arrow-up'
      if (change < 0) return 'fas fa-arrow-down'
      return 'fas fa-minus'
    }
    
    const getInitials = (name) => {
      if (!name) return '?'
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    
    onMounted(() => {
      fetchStats()
    })
    
    return {
      stats,
      loading,
      error,
      selectedPeriod,
      deliveriesChart,
      statusChart,
      fetchStats,
      formatCurrency,
      getChangeClass,
      getChangeIcon,
      getInitials
    }
  }
}
</script>

<style scoped>
.collaborative-stats {
  padding: 24px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stats-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.period-selector select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container i {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.metric-icon i {
  font-size: 20px;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.metric-change {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.metric-change i {
  margin-right: 4px;
}

.metric-change.positive {
  color: #10b981;
}

.metric-change.negative {
  color: #ef4444;
}

.metric-change.neutral {
  color: #6b7280;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.chart-container {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.chart-container h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.chart-container canvas {
  max-height: 300px;
}

.details-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-table {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.detail-table h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.detail-table table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th,
.detail-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.detail-table th {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
}

.courier-info {
  display: flex;
  align-items: center;
}

.courier-avatar,
.courier-avatar-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
}

.courier-avatar-fallback {
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.rating {
  display: flex;
  align-items: center;
  color: #f59e0b;
}

.rating i {
  margin-right: 4px;
}

.route-info {
  display: flex;
  flex-direction: column;
}

.route-text {
  font-weight: 500;
}

.route-distance {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .details-section {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
