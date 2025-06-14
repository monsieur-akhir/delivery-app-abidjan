<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h2 class="dashboard-title">Tableau de bord analytique</h2>
      <div class="dashboard-filters">
        <div class="filter-group">
          <label for="date-range">Période</label>
          <select id="date-range" v-model="filters.dateRange" @change="handleDateRangeChange">
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="last_7_days">7 derniers jours</option>
            <option value="last_30_days">30 derniers jours</option>
            <option value="this_month">Ce mois</option>
            <option value="last_month">Mois dernier</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>
        <div class="filter-group" v-if="filters.dateRange === 'custom'">
          <label for="start-date">Date de début</label>
          <input type="date" id="start-date" v-model="filters.startDate" @change="loadData" />
        </div>
        <div class="filter-group" v-if="filters.dateRange === 'custom'">
          <label for="end-date">Date de fin</label>
          <input type="date" id="end-date" v-model="filters.endDate" @change="loadData" />
        </div>
        <div class="filter-group">
          <label for="commune">Commune</label>
          <select id="commune" v-model="filters.commune" @change="loadData">
            <option value="">Toutes les communes</option>
            <option v-for="commune in communes" :key="commune" :value="commune">
              {{ commune }}
            </option>
          </select>
        </div>
        <button class="btn btn-primary" @click="loadData">
          <i class="fas fa-sync-alt mr-1"></i>
          Actualiser
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
    <div v-else>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-truck-loading"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalDeliveries }}</div>
            <div class="stat-label">Livraisons</div>
            <div class="stat-change" :class="getChangeClass(stats.deliveriesChange)">
              <i :class="getChangeIcon(stats.deliveriesChange)"></i>
              {{ formatPercentage(stats.deliveriesChange) }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
            <div class="stat-label">Revenus</div>
            <div class="stat-change" :class="getChangeClass(stats.revenueChange)">
              <i :class="getChangeIcon(stats.revenueChange)"></i>
              {{ formatPercentage(stats.revenueChange) }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">Utilisateurs</div>
            <div class="stat-change" :class="getChangeClass(stats.usersChange)">
              <i :class="getChangeIcon(stats.usersChange)"></i>
              {{ formatPercentage(stats.usersChange) }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.averageRating.toFixed(1) }}</div>
            <div class="stat-label">Note moyenne</div>
            <div class="stat-change" :class="getChangeClass(stats.ratingChange)">
              <i :class="getChangeIcon(stats.ratingChange)"></i>
              {{ formatPercentage(stats.ratingChange) }}
            </div>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Livraisons par jour</h3>
            <div class="chart-actions">
              <button class="btn-icon" @click="exportChart('deliveries')" title="Exporter">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="deliveriesChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Revenus par jour</h3>
            <div class="chart-actions">
              <button class="btn-icon" @click="exportChart('revenue')" title="Exporter">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Répartition des livraisons</h3>
            <div class="chart-actions">
              <button class="btn-icon" @click="exportChart('distribution')" title="Exporter">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="distributionChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Performance des coursiers</h3>
            <div class="chart-actions">
              <button class="btn-icon" @click="exportChart('couriers')" title="Exporter">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="couriersChart"></canvas>
          </div>
        </div>
      </div>

      <div class="data-tables">
        <div class="data-table-card">
          <div class="table-header">
            <h3 class="table-title">Meilleures communes</h3>
            <div class="table-actions">
              <button class="btn-icon" @click="exportTable('communes')" title="Exporter">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Commune</th>
                  <th>Livraisons</th>
                  <th>Revenus</th>
                  <th>Note moyenne</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(commune, index) in topCommunes" :key="index">
                  <td>{{ commune.name }}</td>
                  <td>{{ commune.deliveries }}</td>
                  <td>{{ formatCurrency(commune.revenue) }}</td>
                  <td>
                    <div class="rating-display">
                      <span class="rating-value">{{ commune.rating.toFixed(1) }}</span>
                      <div class="rating-stars">
                        <i
                          v-for="star in 5"
                          :key="star"
                          class="fas fa-star"
                          :class="{ 'star-filled': star <= Math.round(commune.rating) }"
                        ></i>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="data-table-card">
          <div class="table-header">
            <h3 class="table-title">Meilleurs coursiers</h3>
            <div class="table-actions">
              <button class="btn-icon" @click="exportTable('couriers')" title="Exporter">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Coursier</th>
                  <th>Livraisons</th>
                  <th>Revenus générés</th>
                  <th>Note moyenne</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(courier, index) in topCouriers" :key="index">
                  <td>
                    <div class="courier-info">
                      <div class="courier-avatar">
                        <img v-if="courier.avatar" :src="courier.avatar" :alt="courier.name" />
                        <div v-else class="avatar-placeholder">
                          {{ getInitials(courier.name) }}
                        </div>
                      </div>
                      <div class="courier-name">{{ courier.name }}</div>
                    </div>
                  </td>
                  <td>{{ courier.deliveries }}</td>
                  <td>{{ formatCurrency(courier.revenue) }}</td>
                  <td>
                    <div class="rating-display">
                      <span class="rating-value">{{ courier.rating.toFixed(1) }}</span>
                      <div class="rating-stars">
                        <i
                          v-for="star in 5"
                          :key="star"
                          class="fas fa-star"
                          :class="{ 'star-filled': star <= Math.round(courier.rating) }"
                        ></i>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'
import { getAnalyticsData, getCourierPerformance } from '@/api/manager'

export default {
  name: 'AnalyticsDashboard',
  setup() {
    const loading = ref(true)
    const filters = ref({
      dateRange: 'last_7_days',
      startDate: null,
      endDate: null,
      commune: '',
    })

    // Données statistiques
    const stats = ref({
      totalDeliveries: 0,
      deliveriesChange: 0,
      totalRevenue: 0,
      revenueChange: 0,
      totalUsers: 0,
      usersChange: 0,
      averageRating: 0,
      ratingChange: 0,
    })

    // Références aux éléments canvas pour les graphiques
    const deliveriesChart = ref(null)
    const revenueChart = ref(null)
    const distributionChart = ref(null)
    const couriersChart = ref(null)

    // Instances des graphiques
    let deliveriesChartInstance = null
    let revenueChartInstance = null
    let distributionChartInstance = null
    let couriersChartInstance = null

    // Données pour les tableaux
    const topCommunes = ref([])
    const topCouriers = ref([])

    // Liste des communes
    const communes = ref([
      'Abobo',
      'Adjamé',
      'Attécoubé',
      'Cocody',
      'Koumassi',
      'Marcory',
      'Plateau',
      'Port-Bouët',
      'Treichville',
      'Yopougon',
      'Bingerville',
      'Songon',
    ])

    // Gérer le changement de plage de dates
    const handleDateRangeChange = () => {
      if (filters.value.dateRange !== 'custom') {
        // Calculer les dates en fonction de la plage sélectionnée
        const now = new Date()
        let startDate = new Date()
        let endDate = new Date()

        switch (filters.value.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            endDate = now
            break
          case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
            break
          case 'last_7_days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
            endDate = now
            break
          case 'last_30_days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
            endDate = now
            break
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = now
            break
          case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            break
        }

        filters.value.startDate = startDate.toISOString().split('T')[0]
        filters.value.endDate = endDate.toISOString().split('T')[0]
      }

      loadData()
    }

    // Charger les données
    const loadData = async () => {
      loading.value = true

      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Appeler l'API pour obtenir les données analytiques
        const analyticsData = await getAnalyticsData({
          dateRange: filters.value.dateRange,
          startDate: filters.value.startDate,
          endDate: filters.value.endDate,
          commune: filters.value.commune,
        })

        // Appeler l'API pour obtenir les performances des coursiers
        const courierPerformance = await getCourierPerformance({
          dateRange: filters.value.dateRange,
          startDate: filters.value.startDate,
          endDate: filters.value.endDate,
          commune: filters.value.commune,
        })

        // Mettre à jour les statistiques
        updateStats(analyticsData)

        // Mettre à jour les graphiques
        updateCharts(analyticsData)

        // Mettre à jour les tableaux
        updateTables(analyticsData, courierPerformance)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)

        // Utiliser des données fictives pour la démonstration
        const mockData = generateMockData()

        // Mettre à jour les statistiques
        updateStats(mockData)

        // Mettre à jour les graphiques
        updateCharts(mockData)

        // Mettre à jour les tableaux
        updateTables(mockData, mockData.courierPerformance)
      } finally {
        loading.value = false
      }
    }

    // Mettre à jour les statistiques
    const updateStats = data => {
      stats.value = {
        totalDeliveries: data.totalDeliveries || 0,
        deliveriesChange: data.deliveriesChange || 0,
        totalRevenue: data.totalRevenue || 0,
        revenueChange: data.revenueChange || 0,
        totalUsers: data.totalUsers || 0,
        usersChange: data.usersChange || 0,
        averageRating: data.averageRating || 0,
        ratingChange: data.ratingChange || 0,
      }
    }

    // Mettre à jour les graphiques
    const updateCharts = data => {
      // Mettre à jour le graphique des livraisons
      updateDeliveriesChart(data.deliveriesByDay || [])

      // Mettre à jour le graphique des revenus
      updateRevenueChart(data.revenueByDay || [])

      // Mettre à jour le graphique de répartition
      updateDistributionChart(data.deliveryDistribution || {})

      // Mettre à jour le graphique des coursiers
      updateCouriersChart(data.courierPerformance || [])
    }

    // Mettre à jour les tableaux
    const updateTables = (data, courierPerformance) => {
      // Mettre à jour le tableau des communes
      topCommunes.value = data.topCommunes || []

      // Mettre à jour le tableau des coursiers
      topCouriers.value = courierPerformance.topCouriers || []
    }

    // Mettre à jour le graphique des livraisons
    const updateDeliveriesChart = data => {
      if (deliveriesChartInstance) {
        deliveriesChartInstance.destroy()
      }

      const ctx = deliveriesChart.value.getContext('2d')

      deliveriesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(item => item.date),
          datasets: [
            {
              label: 'Livraisons',
              data: data.map(item => item.count),
              backgroundColor: 'rgba(79, 70, 229, 0.2)',
              borderColor: 'rgba(79, 70, 229, 1)',
              borderWidth: 2,
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
              display: false,
            },
            tooltip: {
              mode: 'index',
              intersect: false,
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
            },
          },
        },
      })
    }

    // Mettre à jour le graphique des revenus
    const updateRevenueChart = data => {
      if (revenueChartInstance) {
        revenueChartInstance.destroy()
      }

      const ctx = revenueChart.value.getContext('2d')

      revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(item => item.date),
          datasets: [
            {
              label: 'Revenus',
              data: data.map(item => item.amount),
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderRadius: 4,
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
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function (context) {
                  return formatCurrency(context.raw)
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

    // Mettre à jour le graphique de répartition
    const updateDistributionChart = data => {
      if (distributionChartInstance) {
        distributionChartInstance.destroy()
      }

      const ctx = distributionChart.value.getContext('2d')

      const labels = Object.keys(data)
      const values = Object.values(data)

      distributionChartInstance = new Chart(ctx, {
        type: 'pie',
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

    // Mettre à jour le graphique des coursiers
    const updateCouriersChart = data => {
      if (couriersChartInstance) {
        couriersChartInstance.destroy()
      }

      const ctx = couriersChart.value.getContext('2d')

      couriersChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(item => item.name),
          datasets: [
            {
              label: 'Livraisons',
              data: data.map(item => item.deliveries),
              backgroundColor: 'rgba(79, 70, 229, 0.7)',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
            y: {
              grid: {
                display: false,
              },
            },
          },
        },
      })
    }

    // Exporter un graphique
    const exportChart = chartType => {
      let chartInstance
      let fileName

      switch (chartType) {
        case 'deliveries':
          chartInstance = deliveriesChartInstance
          fileName = 'livraisons_par_jour'
          break
        case 'revenue':
          chartInstance = revenueChartInstance
          fileName = 'revenus_par_jour'
          break
        case 'distribution':
          chartInstance = distributionChartInstance
          fileName = 'repartition_livraisons'
          break
        case 'couriers':
          chartInstance = couriersChartInstance
          fileName = 'performance_coursiers'
          break
      }

      if (chartInstance) {
        const link = document.createElement('a')
        link.href = chartInstance.toBase64Image()
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.png`
        link.click()
      }
    }

    // Exporter un tableau
    const exportTable = tableType => {
      let data
      let fileName
      let headers

      switch (tableType) {
        case 'communes':
          data = topCommunes.value
          fileName = 'meilleures_communes'
          headers = ['Commune', 'Livraisons', 'Revenus', 'Note moyenne']
          break
        case 'couriers':
          data = topCouriers.value
          fileName = 'meilleurs_coursiers'
          headers = ['Coursier', 'Livraisons', 'Revenus générés', 'Note moyenne']
          break
      }

      if (data && data.length > 0) {
        // Créer le contenu CSV
        let csvContent = headers.join(',') + '\n'

        data.forEach(item => {
          let row

          if (tableType === 'communes') {
            row = [item.name, item.deliveries, item.revenue, item.rating.toFixed(1)]
          } else {
            row = [item.name, item.deliveries, item.revenue, item.rating.toFixed(1)]
          }

          csvContent += row.join(',') + '\n'
        })

        // Créer un objet Blob et un lien de téléchargement
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      }
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

    // Formater le pourcentage
    const formatPercentage = value => {
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(1)}%`
    }

    // Obtenir la classe CSS pour un changement
    const getChangeClass = value => {
      if (value > 0) return 'change-positive'
      if (value < 0) return 'change-negative'
      return ''
    }

    // Obtenir l'icône pour un changement
    const getChangeIcon = value => {
      if (value > 0) return 'fas fa-arrow-up'
      if (value < 0) return 'fas fa-arrow-down'
      return 'fas fa-minus'
    }

    // Obtenir les initiales d'un nom
    const getInitials = name => {
      if (!name) return ''

      const parts = name.split(' ')
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
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

      // Générer des données de livraisons par jour
      const deliveriesByDay = dates.map(date => ({
        date,
        count: Math.floor(Math.random() * 50) + 10,
      }))

      // Générer des données de revenus par jour
      const revenueByDay = dates.map(date => ({
        date,
        amount: Math.floor(Math.random() * 500000) + 100000,
      }))

      // Générer des données de répartition des livraisons
      const deliveryDistribution = {
        Standard: Math.floor(Math.random() * 100) + 50,
        Express: Math.floor(Math.random() * 50) + 20,
        Collaboratif: Math.floor(Math.random() * 30) + 10,
        Programmé: Math.floor(Math.random() * 20) + 5,
        Spécial: Math.floor(Math.random() * 10) + 1,
      }

      // Générer des données de performance des coursiers
      const courierNames = [
        'Jean Kouassi',
        'Marie Koné',
        'Pierre Diallo',
        'Sophie Touré',
        'Paul Ouattara',
      ]

      const courierPerformance = {
        topCouriers: courierNames.map((name, index) => ({
          name,
          deliveries: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 300000) + 50000,
          rating: Math.random() * 2 + 3,
          avatar: null,
        })),
      }

      // Générer des données de meilleures communes
      const topCommunes = communes.value.slice(0, 5).map(name => ({
        name,
        deliveries: Math.floor(Math.random() * 100) + 20,
        revenue: Math.floor(Math.random() * 500000) + 100000,
        rating: Math.random() * 2 + 3,
      }))

      // Calculer les totaux et les changements
      const totalDeliveries = deliveriesByDay.reduce((sum, item) => sum + item.count, 0)
      const totalRevenue = revenueByDay.reduce((sum, item) => sum + item.amount, 0)
      const totalUsers = Math.floor(Math.random() * 500) + 100
      const averageRating = 4.2

      return {
        totalDeliveries,
        deliveriesChange: Math.random() * 20 - 10,
        totalRevenue,
        revenueChange: Math.random() * 30 - 10,
        totalUsers,
        usersChange: Math.random() * 15 - 5,
        averageRating,
        ratingChange: Math.random() * 10 - 5,
        deliveriesByDay,
        revenueByDay,
        deliveryDistribution,
        courierPerformance,
        topCommunes,
      }
    }

    // Initialiser au montage du composant
    onMounted(() => {
      // Initialiser les dates par défaut
      handleDateRangeChange()
    })

    // Nettoyer les ressources au démontage du composant
    onUnmounted(() => {
      // Détruire les instances de graphiques
      if (deliveriesChartInstance) deliveriesChartInstance.destroy()
      if (revenueChartInstance) revenueChartInstance.destroy()
      if (distributionChartInstance) distributionChartInstance.destroy()
      if (couriersChartInstance) couriersChartInstance.destroy()
    })

    return {
      loading,
      filters,
      stats,
      deliveriesChart,
      revenueChart,
      distributionChart,
      couriersChart,
      topCommunes,
      topCouriers,
      communes,
      handleDateRangeChange,
      loadData,
      exportChart,
      exportTable,
      formatCurrency,
      formatPercentage,
      getChangeClass,
      getChangeIcon,
      getInitials,
      mr1: 'mr-1',
    }
  },
}
</script>

<style scoped>
.analytics-dashboard {
  padding: 1.5rem;
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.dashboard-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
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
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #4f46e5;
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.change-positive {
  color: #10b981;
}

.change-negative {
  color: #ef4444;
}

.stat-change i {
  margin-right: 0.25rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-actions {
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
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
}

.btn-icon:hover {
  background-color: #f3f4f6;
  color: #4f46e5;
}

.chart-container {
  height: 300px;
  position: relative;
}

.data-tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
}

.data-table-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
}

.data-table th {
  background-color: #f9fafb;
  font-weight: 500;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.courier-info {
  display: flex;
  align-items: center;
}

.courier-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 600;
}

.courier-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.courier-name {
  font-weight: 500;
}

.rating-display {
  display: flex;
  align-items: center;
}

.rating-value {
  margin-right: 0.5rem;
  font-weight: 500;
}

.rating-stars {
  display: flex;
  color: #d1d5db;
}

.star-filled {
  color: #f59e0b;
}

.mr-1 {
  margin-right: 0.25rem;
}

@media (max-width: 768px) {
  .dashboard-filters {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .charts-grid,
  .data-tables {
    grid-template-columns: 1fr;
  }
}
</style>
