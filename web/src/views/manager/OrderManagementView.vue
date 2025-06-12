
<template>
  <div class="order-management">
    <div class="header">
      <h1>{{ $t('orders.management') }}</h1>
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-primary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          {{ $t('common.refresh') }}
        </button>
        <button @click="exportOrders" class="btn btn-secondary">
          <i class="fas fa-download"></i>
          {{ $t('common.export') }}
        </button>
      </div>
    </div>

    <!-- Statistiques globales -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pending || 0 }}</div>
          <div class="stat-label">{{ $t('orders.pending') }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.active || 0 }}</div>
          <div class="stat-label">{{ $t('orders.active') }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon completed">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.completed || 0 }}</div>
          <div class="stat-label">{{ $t('orders.completed') }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon revenue">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.revenue || 0) }}</div>
          <div class="stat-label">{{ $t('orders.revenue') }}</div>
        </div>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          :placeholder="$t('orders.searchPlaceholder')"
          @input="applyFilters"
        />
      </div>
      
      <div class="filter-group">
        <select v-model="filters.status" @change="applyFilters" class="filter-select">
          <option value="">{{ $t('orders.allStatuses') }}</option>
          <option value="pending">{{ $t('orders.pending') }}</option>
          <option value="accepted">{{ $t('orders.accepted') }}</option>
          <option value="picked_up">{{ $t('orders.pickedUp') }}</option>
          <option value="in_progress">{{ $t('orders.inProgress') }}</option>
          <option value="delivered">{{ $t('orders.delivered') }}</option>
          <option value="cancelled">{{ $t('orders.cancelled') }}</option>
        </select>
        
        <select v-model="filters.commune" @change="applyFilters" class="filter-select">
          <option value="">{{ $t('orders.allCommunes') }}</option>
          <option v-for="commune in communes" :key="commune" :value="commune">
            {{ commune }}
          </option>
        </select>
        
        <select v-model="filters.period" @change="applyFilters" class="filter-select">
          <option value="today">{{ $t('filters.today') }}</option>
          <option value="week">{{ $t('filters.thisWeek') }}</option>
          <option value="month">{{ $t('filters.thisMonth') }}</option>
          <option value="custom">{{ $t('filters.custom') }}</option>
        </select>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>{{ $t('orders.dailyTrend') }}</h3>
        </div>
        <div class="chart-container">
          <canvas ref="ordersChart"></canvas>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>{{ $t('orders.statusDistribution') }}</h3>
        </div>
        <div class="chart-container">
          <PieChart :data="statusChartData" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Table des commandes -->
    <div class="orders-table-section">
      <div class="table-header">
        <h3>{{ $t('orders.recentOrders') }}</h3>
        <div class="table-actions">
          <button @click="showBulkActions = !showBulkActions" class="btn btn-outline">
            {{ $t('orders.bulkActions') }}
          </button>
        </div>
      </div>
      
      <div v-if="showBulkActions" class="bulk-actions">
        <div class="bulk-controls">
          <input 
            type="checkbox" 
            @change="selectAll" 
            :checked="selectedOrders.length === filteredOrders.length"
          />
          <span>{{ selectedOrders.length }} {{ $t('orders.selected') }}</span>
          
          <button 
            @click="bulkAssignCourier" 
            :disabled="selectedOrders.length === 0"
            class="btn btn-sm btn-primary"
          >
            {{ $t('orders.assignCourier') }}
          </button>
          
          <button 
            @click="bulkCancel" 
            :disabled="selectedOrders.length === 0"
            class="btn btn-sm btn-danger"
          >
            {{ $t('orders.cancel') }}
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th v-if="showBulkActions">
                <input type="checkbox" @change="selectAll" />
              </th>
              <th @click="sortBy('id')" class="sortable">
                {{ $t('orders.id') }}
                <i :class="getSortIcon('id')"></i>
              </th>
              <th>{{ $t('orders.client') }}</th>
              <th>{{ $t('orders.route') }}</th>
              <th>{{ $t('orders.courier') }}</th>
              <th @click="sortBy('status')" class="sortable">
                {{ $t('orders.status') }}
                <i :class="getSortIcon('status')"></i>
              </th>
              <th @click="sortBy('price')" class="sortable">
                {{ $t('orders.price') }}
                <i :class="getSortIcon('price')"></i>
              </th>
              <th @click="sortBy('created_at')" class="sortable">
                {{ $t('orders.createdAt') }}
                <i :class="getSortIcon('created_at')"></i>
              </th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in paginatedOrders" :key="order.id">
              <td v-if="showBulkActions">
                <input 
                  type="checkbox" 
                  :value="order.id" 
                  v-model="selectedOrders"
                />
              </td>
              <td class="order-id">#{{ order.id }}</td>
              <td>
                <div class="client-info">
                  <img :src="order.client.profile_picture || '/default-avatar.png'" class="avatar-sm" />
                  <div>
                    <div class="client-name">{{ order.client.full_name }}</div>
                    <div class="client-phone">{{ order.client.phone }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="route-info">
                  <div class="route-from">
                    <i class="fas fa-circle pickup"></i>
                    {{ order.pickup_commune }}
                  </div>
                  <div class="route-to">
                    <i class="fas fa-circle delivery"></i>
                    {{ order.delivery_commune }}
                  </div>
                </div>
              </td>
              <td>
                <div v-if="order.courier" class="courier-info">
                  <img :src="order.courier.profile_picture || '/default-avatar.png'" class="avatar-sm" />
                  <span>{{ order.courier.full_name }}</span>
                </div>
                <span v-else class="no-courier">{{ $t('orders.noCourier') }}</span>
              </td>
              <td>
                <span :class="['status-badge', order.status]">
                  {{ $t(`orders.status.${order.status}`) }}
                </span>
              </td>
              <td class="price">{{ formatCurrency(order.price) }}</td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="viewOrder(order)" class="btn btn-sm btn-outline">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button @click="trackOrder(order)" class="btn btn-sm btn-primary">
                    <i class="fas fa-map-marker-alt"></i>
                  </button>
                  <div class="dropdown">
                    <button class="btn btn-sm btn-outline dropdown-toggle">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                      <a @click="assignCourier(order)" class="dropdown-item">
                        {{ $t('orders.assignCourier') }}
                      </a>
                      <a @click="cancelOrder(order)" class="dropdown-item text-danger">
                        {{ $t('orders.cancel') }}
                      </a>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          {{ $t('pagination.showing') }} {{ (currentPage - 1) * pageSize + 1 }} 
          {{ $t('pagination.to') }} {{ Math.min(currentPage * pageSize, filteredOrders.length) }} 
          {{ $t('pagination.of') }} {{ filteredOrders.length }} {{ $t('pagination.entries') }}
        </div>
        <div class="pagination">
          <button 
            @click="goToPage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="btn btn-sm btn-outline"
          >
            {{ $t('pagination.previous') }}
          </button>
          
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            :class="['btn', 'btn-sm', page === currentPage ? 'btn-primary' : 'btn-outline']"
          >
            {{ page }}
          </button>
          
          <button 
            @click="goToPage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="btn btn-sm btn-outline"
          >
            {{ $t('pagination.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <OrderDetailsModal 
      v-if="showOrderDetails"
      :order="selectedOrder"
      @close="showOrderDetails = false"
      @update="handleOrderUpdate"
    />
    
    <CourierAssignmentModal
      v-if="showCourierAssignment"
      :order="selectedOrder"
      @close="showCourierAssignment = false"
      @assign="handleCourierAssignment"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import deliveriesApi from '@/api/deliveries'
import managerApi from '@/api/manager'
import PieChart from '@/components/charts/PieChart.vue'
import OrderDetailsModal from '@/components/modals/OrderDetailsModal.vue'
import CourierAssignmentModal from '@/components/modals/CourierAssignmentModal.vue'
import Chart from 'chart.js/auto'

export default {
  name: 'OrderManagementView',
  components: {
    PieChart,
    OrderDetailsModal,
    CourierAssignmentModal
  },
  setup() {
    const { showToast } = useToast()
    
    const loading = ref(false)
    const orders = ref([])
    const filteredOrders = ref([])
    const stats = reactive({})
    const communes = ref([])
    const selectedOrders = ref([])
    const showBulkActions = ref(false)
    const showOrderDetails = ref(false)
    const showCourierAssignment = ref(false)
    const selectedOrder = ref(null)
    const ordersChart = ref(null)
    
    // Pagination
    const currentPage = ref(1)
    const pageSize = ref(20)
    
    // Filtres
    const searchQuery = ref('')
    const filters = reactive({
      status: '',
      commune: '',
      period: 'week'
    })
    
    // Tri
    const sortField = ref('created_at')
    const sortDirection = ref('desc')
    
    let ordersChartInstance = null
    
    // Computed
    const paginatedOrders = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredOrders.value.slice(start, end)
    })
    
    const totalPages = computed(() => {
      return Math.ceil(filteredOrders.value.length / pageSize.value)
    })
    
    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, currentPage.value - 2)
      const end = Math.min(totalPages.value, currentPage.value + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    })
    
    const statusChartData = computed(() => ({
      labels: ['En attente', 'Acceptée', 'En cours', 'Livrée', 'Annulée'],
      datasets: [{
        data: [
          stats.pending || 0,
          stats.accepted || 0,
          stats.in_progress || 0,
          stats.delivered || 0,
          stats.cancelled || 0
        ],
        backgroundColor: ['#FFC107', '#2196F3', '#FF9800', '#4CAF50', '#F44336']
      }]
    }))
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
    
    // Méthodes
    const loadData = async () => {
      try {
        loading.value = true
        
        // Charger les commandes
        const ordersResponse = await deliveriesApi.getDeliveries({
          limit: 1000,
          include_client: true,
          include_courier: true
        })
        orders.value = ordersResponse.data || ordersResponse
        
        // Charger les statistiques
        const statsResponse = await managerApi.getDeliveryStats()
        Object.assign(stats, statsResponse.data)
        
        // Extraire les communes
        const communeSet = new Set()
        orders.value.forEach(order => {
          if (order.pickup_commune) communeSet.add(order.pickup_commune)
          if (order.delivery_commune) communeSet.add(order.delivery_commune)
        })
        communes.value = Array.from(communeSet).sort()
        
        applyFilters()
        await nextTick()
        updateOrdersChart()
        
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        loading.value = false
      }
    }
    
    const applyFilters = () => {
      let filtered = [...orders.value]
      
      // Recherche textuelle
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(order => 
          order.id.toString().includes(query) ||
          order.client?.full_name?.toLowerCase().includes(query) ||
          order.client?.phone?.includes(query) ||
          order.pickup_commune?.toLowerCase().includes(query) ||
          order.delivery_commune?.toLowerCase().includes(query)
        )
      }
      
      // Filtre par statut
      if (filters.status) {
        filtered = filtered.filter(order => order.status === filters.status)
      }
      
      // Filtre par commune
      if (filters.commune) {
        filtered = filtered.filter(order => 
          order.pickup_commune === filters.commune || 
          order.delivery_commune === filters.commune
        )
      }
      
      // Filtre par période
      if (filters.period !== 'custom') {
        const now = new Date()
        let startDate
        
        switch (filters.period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
        }
        
        if (startDate) {
          filtered = filtered.filter(order => new Date(order.created_at) >= startDate)
        }
      }
      
      // Appliquer le tri
      filtered.sort((a, b) => {
        let aVal = a[sortField.value]
        let bVal = b[sortField.value]
        
        if (sortField.value === 'price') {
          aVal = parseFloat(aVal) || 0
          bVal = parseFloat(bVal) || 0
        } else if (sortField.value === 'created_at') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }
        
        if (sortDirection.value === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
      
      filteredOrders.value = filtered
      currentPage.value = 1
    }
    
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortDirection.value = 'desc'
      }
      applyFilters()
    }
    
    const getSortIcon = (field) => {
      if (sortField.value !== field) return 'fas fa-sort'
      return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
    }
    
    const selectAll = (event) => {
      if (event.target.checked) {
        selectedOrders.value = filteredOrders.value.map(order => order.id)
      } else {
        selectedOrders.value = []
      }
    }
    
    const viewOrder = (order) => {
      selectedOrder.value = order
      showOrderDetails.value = true
    }
    
    const trackOrder = (order) => {
      // Ouvrir une nouvelle fenêtre avec le suivi
      window.open(`/track/${order.id}`, '_blank')
    }
    
    const assignCourier = (order) => {
      selectedOrder.value = order
      showCourierAssignment.value = true
    }
    
    const cancelOrder = async (order) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return
      
      try {
        await deliveriesApi.cancelDelivery(order.id, 'Annulée par l\'administrateur')
        showToast('Commande annulée avec succès', 'success')
        await loadData()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const bulkAssignCourier = () => {
      // Logique d'assignation en masse
      showToast('Fonctionnalité d\'assignation en masse à implémenter', 'info')
    }
    
    const bulkCancel = async () => {
      if (!confirm(`Annuler ${selectedOrders.value.length} commandes ?`)) return
      
      try {
        for (const orderId of selectedOrders.value) {
          await deliveriesApi.cancelDelivery(orderId, 'Annulation en masse')
        }
        showToast('Commandes annulées avec succès', 'success')
        selectedOrders.value = []
        await loadData()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }
    
    const updateOrdersChart = () => {
      if (!ordersChart.value) return
      
      const ctx = ordersChart.value.getContext('2d')
      
      if (ordersChartInstance) {
        ordersChartInstance.destroy()
      }
      
      // Données pour les 7 derniers jours
      const last7Days = []
      const orderCounts = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }))
        
        const dayOrders = orders.value.filter(order => {
          const orderDate = new Date(order.created_at)
          return orderDate.toDateString() === date.toDateString()
        })
        orderCounts.push(dayOrders.length)
      }
      
      ordersChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days,
          datasets: [{
            label: 'Commandes',
            data: orderCounts,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
    }
    
    const exportOrders = async () => {
      try {
        const response = await managerApi.exportDeliveries()
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const refreshData = () => {
      loadData()
    }
    
    const handleOrderUpdate = (updatedOrder) => {
      const index = orders.value.findIndex(o => o.id === updatedOrder.id)
      if (index !== -1) {
        orders.value[index] = updatedOrder
        applyFilters()
      }
    }
    
    const handleCourierAssignment = async (orderData) => {
      try {
        await deliveriesApi.assignCourier(orderData)
        showToast('Coursier assigné avec succès', 'success')
        showCourierAssignment.value = false
        await loadData()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
      }).format(amount)
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Lifecycle
    onMounted(() => {
      loadData()
    })
    
    return {
      loading,
      orders,
      filteredOrders,
      stats,
      communes,
      selectedOrders,
      showBulkActions,
      showOrderDetails,
      showCourierAssignment,
      selectedOrder,
      ordersChart,
      currentPage,
      pageSize,
      searchQuery,
      filters,
      sortField,
      sortDirection,
      paginatedOrders,
      totalPages,
      visiblePages,
      statusChartData,
      chartOptions,
      loadData,
      applyFilters,
      sortBy,
      getSortIcon,
      selectAll,
      viewOrder,
      trackOrder,
      assignCourier,
      cancelOrder,
      bulkAssignCourier,
      bulkCancel,
      goToPage,
      exportOrders,
      refreshData,
      handleOrderUpdate,
      handleCourierAssignment,
      formatCurrency,
      formatDate
    }
  }
}
</script>

<style scoped>
.order-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.pending { background: #FFC107; }
.stat-icon.active { background: #FF9800; }
.stat-icon.completed { background: #4CAF50; }
.stat-icon.revenue { background: #2196F3; }

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.filters-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.search-box input {
  width: 100%;
  padding: 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.chart-container {
  padding: 20px;
  height: 300px;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.orders-table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  color: #333;
}

.bulk-actions {
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.bulk-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.orders-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.orders-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.orders-table th.sortable:hover {
  background: #e9ecef;
}

.order-id {
  font-weight: 600;
  color: #2196F3;
}

.client-info,
.courier-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.client-name {
  font-weight: 500;
}

.client-phone {
  font-size: 12px;
  color: #666;
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.route-from,
.route-to {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.route-from .fas.fa-circle {
  color: #4CAF50;
}

.route-to .fas.fa-circle {
  color: #F44336;
}

.no-courier {
  color: #666;
  font-style: italic;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #FF9800;
}

.status-badge.accepted {
  background: #E3F2FD;
  color: #2196F3;
}

.status-badge.picked_up,
.status-badge.in_progress {
  background: #FFF3E0;
  color: #FF9800;
}

.status-badge.delivered {
  background: #E8F5E8;
  color: #4CAF50;
}

.status-badge.cancelled {
  background: #FFEBEE;
  color: #F44336;
}

.price {
  font-weight: 600;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 5px;
  align-items: center;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 150px;
}

.dropdown-item {
  display: block;
  padding: 8px 12px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item.text-danger {
  color: #F44336;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
}

.pagination {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  border-color: #2196F3;
  color: white;
}

.btn-primary:hover {
  background: #1976D2;
}

.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-outline {
  background: transparent;
}

.btn-danger {
  background: #F44336;
  border-color: #F44336;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>
