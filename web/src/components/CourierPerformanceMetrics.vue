<template>
  <div class="courier-performance-metrics">
    <div class="metrics-header">
      <h3 class="metrics-title">Performance du coursier</h3>
      <div class="metrics-period">
        {{ formatDateRange(startDate, endDate) }}
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-truck-loading"></i>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ metrics.totalDeliveries }}</div>
          <div class="metric-label">Livraisons</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatCurrency(metrics.totalEarnings) }}</div>
          <div class="metric-label">Gains</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-star"></i>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ metrics.averageRating.toFixed(1) }}</div>
          <div class="metric-label">Note moyenne</div>
          <div class="rating-stars">
            <i
              v-for="star in 5"
              :key="star"
              class="fas fa-star"
              :class="{ 'star-filled': star <= Math.round(metrics.averageRating) }"
            ></i>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatTime(metrics.averageDeliveryTime) }}</div>
          <div class="metric-label">Temps moyen</div>
        </div>
      </div>
    </div>

    <div class="metrics-details">
      <div class="metrics-section">
        <h4 class="section-title">Répartition des livraisons</h4>
        <div class="chart-container">
          <canvas ref="deliveryTypeChart"></canvas>
        </div>
      </div>

      <div class="metrics-section">
        <h4 class="section-title">Performance par jour</h4>
        <div class="chart-container">
          <canvas ref="dailyPerformanceChart"></canvas>
        </div>
      </div>
    </div>

    <div class="metrics-details">
      <div class="metrics-section">
        <h4 class="section-title">Statistiques détaillées</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Taux d'acceptation</div>
            <div class="stat-value">{{ metrics.acceptanceRate.toFixed(1) }}%</div>
            <div class="progress-bar">
              <div
                class="progress-value"
                :style="{ width: `${metrics.acceptanceRate}%` }"
                :class="getProgressClass(metrics.acceptanceRate)"
              ></div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Taux de complétion</div>
            <div class="stat-value">{{ metrics.completionRate.toFixed(1) }}%</div>
            <div class="progress-bar">
              <div
                class="progress-value"
                :style="{ width: `${metrics.completionRate}%` }"
                :class="getProgressClass(metrics.completionRate)"
              ></div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Livraisons à l'heure</div>
            <div class="stat-value">{{ metrics.onTimeRate.toFixed(1) }}%</div>
            <div class="progress-bar">
              <div
                class="progress-value"
                :style="{ width: `${metrics.onTimeRate}%` }"
                :class="getProgressClass(metrics.onTimeRate)"
              ></div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">Satisfaction client</div>
            <div class="stat-value">{{ metrics.customerSatisfaction.toFixed(1) }}%</div>
            <div class="progress-bar">
              <div
                class="progress-value"
                :style="{ width: `${metrics.customerSatisfaction}%` }"
                :class="getProgressClass(metrics.customerSatisfaction)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="metrics-section">
        <h4 class="section-title">Commentaires récents</h4>
        <div class="reviews-list">
          <div v-for="(review, index) in metrics.recentReviews" :key="index" class="review-item">
            <div class="review-header">
              <div class="review-rating">
                <i
                  v-for="star in 5"
                  :key="star"
                  class="fas fa-star"
                  :class="{ 'star-filled': star <= review.rating }"
                ></i>
              </div>
              <div class="review-date">{{ formatDate(review.date) }}</div>
            </div>
            <div class="review-content">{{ review.comment }}</div>
            <div class="review-delivery">Livraison #{{ review.deliveryId }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { getCourierPerformance } from '@/api/manager'

export default {
  name: 'CourierPerformanceMetrics',
  props: {
    courierId: {
      type: [Number, String],
      required: true,
    },
    startDate: {
      type: Date,
      default: () => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return date
      },
    },
    endDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  setup(props) {
    const metrics = ref({
      totalDeliveries: 0,
      totalEarnings: 0,
      averageRating: 0,
      averageDeliveryTime: 0,
      acceptanceRate: 0,
      completionRate: 0,
      onTimeRate: 0,
      customerSatisfaction: 0,
      deliveryTypes: {},
      dailyPerformance: [],
      recentReviews: [],
    })

    // Références aux éléments canvas pour les graphiques
    const deliveryTypeChart = ref(null)
    const dailyPerformanceChart = ref(null)

    // Instances des graphiques
    let deliveryTypeChartInstance = null
    let dailyPerformanceChartInstance = null

    // Charger les données
    const loadData = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Pour la démonstration, nous utilisons des données fictives
        const mockData = generateMockData()

        // Mettre à jour les métriques
        metrics.value = mockData

        // Mettre à jour les graphiques
        updateCharts()
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    // Mettre à jour les graphiques
    const updateCharts = () => {
      // Mettre à jour le graphique des types de livraison
      updateDeliveryTypeChart()

      // Mettre à jour le graphique de performance quotidienne
      updateDailyPerformanceChart()
    }

    // Mettre à jour le graphique des types de livraison
    const updateDeliveryTypeChart = () => {
      if (deliveryTypeChartInstance) {
        deliveryTypeChartInstance.destroy()
      }

      const ctx = deliveryTypeChart.value.getContext('2d')

      const labels = Object.keys(metrics.value.deliveryTypes)
      const values = Object.values(metrics.value.deliveryTypes)

      deliveryTypeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: values,
              backgroundColor: [
                'rgba(79, 70, 229, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(59, 130, 246, 0.7)',
              ],
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
                  const label = context.label || ''
                  const value = context.raw
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = Math.round((value / total) * 100)
                  return `${label}: ${value} (${percentage}%)`
                },
              },
            },
          },
        },
      })
    }

    // Mettre à jour le graphique de performance quotidienne
    const updateDailyPerformanceChart = () => {
      if (dailyPerformanceChartInstance) {
        dailyPerformanceChartInstance.destroy()
      }

      const ctx = dailyPerformanceChart.value.getContext('2d')

      dailyPerformanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: metrics.value.dailyPerformance.map(item => item.date),
          datasets: [
            {
              label: 'Livraisons',
              data: metrics.value.dailyPerformance.map(item => item.deliveries),
              borderColor: 'rgba(79, 70, 229, 1)',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Gains (XOF)',
              data: metrics.value.dailyPerformance.map(item => item.earnings),
              borderColor: 'rgba(16, 185, 129, 1)',
              backgroundColor: 'transparent',
              tension: 0.4,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || ''
                  if (label) {
                    label += ': '
                  }
                  if (context.datasetIndex === 1) {
                    return label + formatCurrency(context.raw)
                  }
                  return label + context.raw
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              title: {
                display: true,
                text: 'Livraisons',
              },
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                display: false,
              },
              title: {
                display: true,
                text: 'Gains (XOF)',
              },
              ticks: {
                callback: function (value) {
                  return formatCurrency(value, true)
                },
              },
            },
          },
        },
      })
    }

    // Formater la devise
    const formatCurrency = (amount, short = false) => {
      if (short) {
        if (amount >= 1000000) {
          return (amount / 1000000).toFixed(1) + ' M'
        } else if (amount >= 1000) {
          return (amount / 1000).toFixed(1) + ' k'
        }
        return amount.toString()
      }

      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // Formater le temps
    const formatTime = minutes => {
      if (minutes < 60) {
        return `${minutes} min`
      } else {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours} h ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`
      }
    }

    // Formater la date
    const formatDate = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    // Formater la plage de dates
    const formatDateRange = (startDate, endDate) => {
      const start = formatDate(startDate)
      const end = formatDate(endDate)
      return `${start} - ${end}`
    }

    // Obtenir la classe CSS pour une barre de progression
    const getProgressClass = value => {
      if (value >= 90) return 'progress-excellent'
      if (value >= 75) return 'progress-good'
      if (value >= 50) return 'progress-average'
      return 'progress-poor'
    }

    // Générer des données fictives pour la démonstration
    const generateMockData = () => {
      // Générer des dates pour les 7 derniers jours
      const dates = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dates.push(date.toISOString().split('T')[0])
      }

      // Générer des données de performance quotidienne
      const dailyPerformance = dates.map(date => ({
        date,
        deliveries: Math.floor(Math.random() * 8) + 1,
        earnings: Math.floor(Math.random() * 30000) + 5000,
      }))

      // Générer des données de types de livraison
      const deliveryTypes = {
        Standard: Math.floor(Math.random() * 30) + 10,
        Express: Math.floor(Math.random() * 20) + 5,
        Collaboratif: Math.floor(Math.random() * 10) + 2,
        Programmé: Math.floor(Math.random() * 5) + 1,
      }

      // Générer des commentaires récents
      const comments = [
        'Très bon service, livraison rapide et coursier aimable.',
        'Livraison effectuée dans les délais, merci !',
        'Le coursier était très professionnel.',
        'Bonne communication et service impeccable.',
        'Un peu de retard mais le coursier a été très gentil.',
      ]

      const recentReviews = []
      for (let i = 0; i < 3; i++) {
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 7))

        recentReviews.push({
          rating: Math.floor(Math.random() * 2) + 4,
          comment: comments[Math.floor(Math.random() * comments.length)],
          date: date.toISOString(),
          deliveryId: Math.floor(Math.random() * 1000) + 100,
        })
      }

      // Calculer les totaux
      const totalDeliveries = dailyPerformance.reduce((sum, item) => sum + item.deliveries, 0)
      const totalEarnings = dailyPerformance.reduce((sum, item) => sum + item.earnings, 0)

      return {
        totalDeliveries,
        totalEarnings,
        averageRating: 4.3,
        averageDeliveryTime: 35,
        acceptanceRate: 92.5,
        completionRate: 97.8,
        onTimeRate: 88.3,
        customerSatisfaction: 94.2,
        deliveryTypes,
        dailyPerformance,
        recentReviews,
      }
    }

    // Initialiser au montage du composant
    onMounted(() => {
      loadData()
    })

    // Nettoyer les ressources au démontage du composant
    onUnmounted(() => {
      // Détruire les instances de graphiques
      if (deliveryTypeChartInstance) deliveryTypeChartInstance.destroy()
      if (dailyPerformanceChartInstance) dailyPerformanceChartInstance.destroy()
    })

    return {
      metrics,
      deliveryTypeChart,
      dailyPerformanceChart,
      formatCurrency,
      formatTime,
      formatDate,
      formatDateRange,
      getProgressClass,
    }
  },
}
</script>

<style scoped>
.courier-performance-metrics {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.metrics-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.metrics-period {
  font-size: 0.875rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
}

.metric-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #4f46e5;
  font-size: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.rating-stars {
  display: flex;
  color: #d1d5db;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.star-filled {
  color: #f59e0b;
}

.metrics-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.metrics-section {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-top: 0;
  margin-bottom: 1rem;
}

.chart-container {
  height: 250px;
  position: relative;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-item {
  margin-bottom: 1rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  border-radius: 9999px;
}

.progress-excellent {
  background-color: #10b981;
}

.progress-good {
  background-color: #3b82f6;
}

.progress-average {
  background-color: #f59e0b;
}

.progress-poor {
  background-color: #ef4444;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 250px;
  overflow-y: auto;
}

.review-item {
  background-color: white;
  border-radius: 0.375rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.review-rating {
  display: flex;
  color: #f59e0b;
  font-size: 0.875rem;
}

.review-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.review-content {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.review-delivery {
  font-size: 0.75rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .metrics-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-period {
    margin-top: 0.5rem;
  }

  .metrics-details {
    grid-template-columns: 1fr;
  }
}
</style>
