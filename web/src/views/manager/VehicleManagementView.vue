<template>
  <div class="vehicle-management">
    <div class="header">
      <h1>{{ $t('vehicles.management') }}</h1>
      <div class="header-actions">
        <button @click="showAddVehicle = true" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          {{ $t('vehicles.addVehicle') }}
        </button>
        <button @click="exportVehicles" class="btn btn-secondary">
          <i class="fas fa-download"></i>
          {{ $t('common.export') }}
        </button>
      </div>
    </div>

    <!-- Statistiques véhicules -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-car"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ vehicleStats.total || 0 }}</div>
          <div class="stat-label">{{ $t('vehicles.total') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ vehicleStats.active || 0 }}</div>
          <div class="stat-label">{{ $t('vehicles.active') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon maintenance">
          <i class="fas fa-wrench"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ vehicleStats.maintenance || 0 }}</div>
          <div class="stat-label">{{ $t('vehicles.inMaintenance') }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon electric">
          <i class="fas fa-leaf"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ vehicleStats.electric || 0 }}</div>
          <div class="stat-label">{{ $t('vehicles.electric') }}</div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          :placeholder="$t('vehicles.searchPlaceholder')"
          @input="applyFilters"
        />
      </div>

      <div class="filter-group">
        <select v-model="filters.type" @change="applyFilters" class="filter-select">
          <option value="">{{ $t('vehicles.allTypes') }}</option>
          <option value="bicycle">{{ $t('vehicles.types.bicycle') }}</option>
          <option value="motorbike">{{ $t('vehicles.types.motorbike') }}</option>
          <option value="car">{{ $t('vehicles.types.car') }}</option>
          <option value="van">{{ $t('vehicles.types.van') }}</option>
          <option value="truck">{{ $t('vehicles.types.truck') }}</option>
        </select>

        <select v-model="filters.status" @change="applyFilters" class="filter-select">
          <option value="">{{ $t('vehicles.allStatuses') }}</option>
          <option value="active">{{ $t('vehicles.statuses.active') }}</option>
          <option value="inactive">{{ $t('vehicles.statuses.inactive') }}</option>
          <option value="maintenance">{{ $t('vehicles.statuses.maintenance') }}</option>
          <option value="retired">{{ $t('vehicles.statuses.retired') }}</option>
        </select>

        <select v-model="filters.owner" @change="applyFilters" class="filter-select">
          <option value="">{{ $t('vehicles.allOwners') }}</option>
          <option value="company">{{ $t('vehicles.owners.company') }}</option>
          <option value="courier">{{ $t('vehicles.owners.courier') }}</option>
        </select>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-header">
          <h3>{{ $t('vehicles.utilizationChart') }}</h3>
        </div>
        <div class="chart-container">
          <canvas ref="utilizationChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>{{ $t('vehicles.typeDistribution') }}</h3>
        </div>
        <div class="chart-container">
          <PieChart :data="typeChartData" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Liste des véhicules -->
    <div class="vehicles-table-section">
      <div class="table-header">
        <h3>{{ $t('vehicles.vehicleList') }}</h3>
        <div class="table-actions">
          <div class="view-toggle">
            <button
              @click="viewMode = 'table'"
              :class="['btn', 'btn-sm', viewMode === 'table' ? 'btn-primary' : 'btn-outline']"
            >
              <i class="fas fa-table"></i>
            </button>
            <button
              @click="viewMode = 'grid'"
              :class="['btn', 'btn-sm', viewMode === 'grid' ? 'btn-primary' : 'btn-outline']"
            >
              <i class="fas fa-th"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Vue tableau -->
      <div v-if="viewMode === 'table'" class="table-container">
        <table class="vehicles-table">
          <thead>
            <tr>
              <th>{{ $t('vehicles.vehicle') }}</th>
              <th>{{ $t('vehicles.type') }}</th>
              <th>{{ $t('vehicles.owner') }}</th>
              <th>{{ $t('vehicles.status') }}</th>
              <th>{{ $t('vehicles.mileage') }}</th>
              <th>{{ $t('vehicles.lastMaintenance') }}</th>
              <th>{{ $t('vehicles.utilization') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vehicle in paginatedVehicles" :key="vehicle.id">
              <td>
                <div class="vehicle-info">
                  <img :src="getVehicleImage(vehicle.vehicle_type)" class="vehicle-image" />
                  <div>
                    <div class="vehicle-name">{{ vehicle.brand }} {{ vehicle.model }}</div>
                    <div class="vehicle-plate">{{ vehicle.license_plate }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="vehicle-type">{{ $t(`vehicles.types.${vehicle.vehicle_type}`) }}</span>
                <span v-if="vehicle.is_electric" class="electric-badge">
                  <i class="fas fa-leaf"></i>
                  {{ $t('vehicles.electric') }}
                </span>
              </td>
              <td>
                <div v-if="vehicle.owner" class="owner-info">
                  <img
                    :src="vehicle.owner.profile_picture || '/default-avatar.png'"
                    class="avatar-sm"
                  />
                  <span>{{ vehicle.owner.full_name }}</span>
                </div>
                <span v-else class="no-owner">{{ $t('vehicles.noOwner') }}</span>
              </td>
              <td>
                <span :class="['status-badge', vehicle.status]">
                  {{ $t(`vehicles.statuses.${vehicle.status}`) }}
                </span>
              </td>
              <td>{{ formatMileage(vehicle.mileage) }}</td>
              <td>{{ formatDate(vehicle.last_maintenance) }}</td>
              <td>
                <div class="utilization-bar">
                  <div
                    class="utilization-fill"
                    :style="{ width: `${vehicle.utilization || 0}%` }"
                  ></div>
                  <span class="utilization-text">{{ vehicle.utilization || 0 }}%</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewVehicle(vehicle)" class="btn btn-sm btn-outline">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button @click="editVehicle(vehicle)" class="btn btn-sm btn-primary">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="viewMaintenance(vehicle)" class="btn btn-sm btn-warning">
                    <i class="fas fa-wrench"></i>
                  </button>
                  <div class="dropdown">
                    <button class="btn btn-sm btn-outline dropdown-toggle">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                      <a @click="trackVehicle(vehicle)" class="dropdown-item">
                        {{ $t('vehicles.track') }}
                      </a>
                      <a @click="scheduleMaintenace(vehicle)" class="dropdown-item">
                        {{ $t('vehicles.scheduleMaintenance') }}
                      </a>
                      <a @click="retireVehicle(vehicle)" class="dropdown-item text-danger">
                        {{ $t('vehicles.retire') }}
                      </a>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vue grille -->
      <div v-else class="vehicles-grid">
        <div v-for="vehicle in paginatedVehicles" :key="vehicle.id" class="vehicle-card">
          <div class="vehicle-card-header">
            <img :src="getVehicleImage(vehicle.vehicle_type)" class="vehicle-card-image" />
            <div class="vehicle-card-status">
              <span :class="['status-badge', vehicle.status]">
                {{ $t(`vehicles.statuses.${vehicle.status}`) }}
              </span>
            </div>
          </div>

          <div class="vehicle-card-content">
            <h4 class="vehicle-card-title">{{ vehicle.brand }} {{ vehicle.model }}</h4>
            <p class="vehicle-card-plate">{{ vehicle.license_plate }}</p>

            <div class="vehicle-card-stats">
              <div class="stat">
                <i class="fas fa-road"></i>
                <span>{{ formatMileage(vehicle.mileage) }}</span>
              </div>
              <div class="stat">
                <i class="fas fa-chart-line"></i>
                <span>{{ vehicle.utilization || 0 }}%</span>
              </div>
              <div v-if="vehicle.is_electric" class="stat electric">
                <i class="fas fa-leaf"></i>
                <span>{{ $t('vehicles.electric') }}</span>
              </div>
            </div>

            <div v-if="vehicle.owner" class="vehicle-card-owner">
              <img
                :src="vehicle.owner.profile_picture || '/default-avatar.png'"
                class="avatar-xs"
              />
              <span>{{ vehicle.owner.full_name }}</span>
            </div>
          </div>

          <div class="vehicle-card-actions">
            <button @click="viewVehicle(vehicle)" class="btn btn-sm btn-outline">
              {{ $t('common.view') }}
            </button>
            <button @click="editVehicle(vehicle)" class="btn btn-sm btn-primary">
              {{ $t('common.edit') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          {{ $t('pagination.showing') }} {{ (currentPage - 1) * pageSize + 1 }}
          {{ $t('pagination.to') }} {{ Math.min(currentPage * pageSize, filteredVehicles.length) }}
          {{ $t('pagination.of') }} {{ filteredVehicles.length }} {{ $t('pagination.entries') }}
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
    <VehicleDetailsModal
      v-if="showVehicleDetails"
      :vehicle="selectedVehicle"
      @close="showVehicleDetails = false"
      @update="handleVehicleUpdate"
    />

    <VehicleFormModal
      v-if="showAddVehicle || showEditVehicle"
      :vehicle="editingVehicle"
      :isEdit="showEditVehicle"
      @close="closeVehicleForm"
      @save="handleVehicleSave"
    />

    <MaintenanceModal
      v-if="showMaintenance"
      :vehicle="selectedVehicle"
      @close="showMaintenance = false"
      @update="handleMaintenanceUpdate"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import vehiclesApi from '@/api/vehicles'
import PieChart from '@/components/charts/PieChart.vue'
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal.vue'
import VehicleFormModal from '@/components/modals/VehicleFormModal.vue'
import MaintenanceModal from '@/components/modals/MaintenanceModal.vue'
import Chart from 'chart.js/auto'

export default {
  name: 'VehicleManagementView',
  components: {
    PieChart,
    VehicleDetailsModal,
    VehicleFormModal,
    MaintenanceModal,
  },
  setup() {
    const { showToast } = useToast()

    const loading = ref(false)
    const vehicles = ref([])
    const filteredVehicles = ref([])
    const vehicleStats = reactive({})
    const selectedVehicle = ref(null)
    const editingVehicle = ref(null)
    const utilizationChart = ref(null)

    // Interface
    const viewMode = ref('table')
    const showVehicleDetails = ref(false)
    const showAddVehicle = ref(false)
    const showEditVehicle = ref(false)
    const showMaintenance = ref(false)

    // Pagination
    const currentPage = ref(1)
    const pageSize = ref(20)

    // Filtres
    const searchQuery = ref('')
    const filters = reactive({
      type: '',
      status: '',
      owner: '',
    })

    let utilizationChartInstance = null

    // Computed
    const paginatedVehicles = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredVehicles.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredVehicles.value.length / pageSize.value)
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

    const typeChartData = computed(() => {
      const typeCounts = {}
      vehicles.value.forEach(vehicle => {
        const type = vehicle.vehicle_type
        typeCounts[type] = (typeCounts[type] || 0) + 1
      })

      return {
        labels: Object.keys(typeCounts).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
        datasets: [
          {
            data: Object.values(typeCounts),
            backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'],
          },
        ],
      }
    })

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    }

    // Méthodes
    const loadData = async () => {
      try {
        loading.value = true

        // Charger les véhicules
        const vehiclesResponse = await vehiclesApi.getVehicles({ include_owner: true })
        vehicles.value = vehiclesResponse.data || vehiclesResponse

        // Calculer les statistiques
        calculateStats()

        applyFilters()
        await nextTick()
        updateUtilizationChart()
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        loading.value = false
      }
    }

    const calculateStats = () => {
      const stats = {
        total: vehicles.value.length,
        active: 0,
        maintenance: 0,
        electric: 0,
      }

      vehicles.value.forEach(vehicle => {
        if (vehicle.status === 'active') stats.active++
        if (vehicle.status === 'maintenance') stats.maintenance++
        if (vehicle.is_electric) stats.electric++
      })

      Object.assign(vehicleStats, stats)
    }

    const applyFilters = () => {
      let filtered = [...vehicles.value]

      // Recherche textuelle
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          vehicle =>
            vehicle.brand?.toLowerCase().includes(query) ||
            vehicle.model?.toLowerCase().includes(query) ||
            vehicle.license_plate?.toLowerCase().includes(query) ||
            vehicle.owner?.full_name?.toLowerCase().includes(query)
        )
      }

      // Filtre par type
      if (filters.type) {
        filtered = filtered.filter(vehicle => vehicle.vehicle_type === filters.type)
      }

      // Filtre par statut
      if (filters.status) {
        filtered = filtered.filter(vehicle => vehicle.status === filters.status)
      }

      // Filtre par propriétaire
      if (filters.owner) {
        if (filters.owner === 'company') {
          filtered = filtered.filter(vehicle => !vehicle.owner || vehicle.owner.role === 'business')
        } else if (filters.owner === 'courier') {
          filtered = filtered.filter(vehicle => vehicle.owner && vehicle.owner.role === 'courier')
        }
      }

      filteredVehicles.value = filtered
      currentPage.value = 1
    }

    const viewVehicle = vehicle => {
      selectedVehicle.value = vehicle
      showVehicleDetails.value = true
    }

    const editVehicle = vehicle => {
      editingVehicle.value = { ...vehicle }
      showEditVehicle.value = true
    }

    const viewMaintenance = vehicle => {
      selectedVehicle.value = vehicle
      showMaintenance.value = true
    }

    const trackVehicle = vehicle => {
      // Ouvrir une nouvelle fenêtre avec le suivi du véhicule
      window.open(`/vehicles/track/${vehicle.id}`, '_blank')
    }

    const scheduleMaintenace = vehicle => {
      selectedVehicle.value = vehicle
      showMaintenance.value = true
    }

    const retireVehicle = async vehicle => {
      if (!confirm('Êtes-vous sûr de vouloir retirer ce véhicule ?')) return

      try {
        await vehiclesApi.updateVehicle(vehicle.id, { status: 'retired' })
        showToast('Véhicule retiré avec succès', 'success')
        await loadData()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }

    const closeVehicleForm = () => {
      showAddVehicle.value = false
      showEditVehicle.value = false
      editingVehicle.value = null
    }

    const handleVehicleSave = async vehicleData => {
      try {
        if (showEditVehicle.value) {
          await vehiclesApi.updateVehicle(editingVehicle.value.id, vehicleData)
          showToast('Véhicule mis à jour avec succès', 'success')
        } else {
          await vehiclesApi.createVehicle(vehicleData)
          showToast('Véhicule créé avec succès', 'success')
        }

        closeVehicleForm()
        await loadData()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }

    const handleVehicleUpdate = updatedVehicle => {
      const index = vehicles.value.findIndex(v => v.id === updatedVehicle.id)
      if (index !== -1) {
        vehicles.value[index] = updatedVehicle
        calculateStats()
        applyFilters()
      }
    }

    const handleMaintenanceUpdate = () => {
      loadData()
    }

    const goToPage = page => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }

    const updateUtilizationChart = () => {
      if (!utilizationChart.value) return

      const ctx = utilizationChart.value.getContext('2d')

      if (utilizationChartInstance) {
        utilizationChartInstance.destroy()
      }

      // Données d'utilisation des 7 derniers jours
      const last7Days = []
      const utilizationData = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }))

        // Simulation d'utilisation (à remplacer par des vraies données)
        utilizationData.push(Math.floor(Math.random() * 100))
      }

      utilizationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days,
          datasets: [
            {
              label: 'Utilisation (%)',
              data: utilizationData,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
              max: 100,
            },
          },
        },
      })
    }

    const exportVehicles = async () => {
      try {
        const response = await vehiclesApi.exportVehicles()
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vehicules_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        showToast(error.message, 'error')
      }
    }

    const getVehicleImage = type => {
      const images = {
        bicycle: '/assets/vehicles/bicycle.png',
        motorbike: '/assets/vehicles/motorcycle.png',
        car: '/assets/vehicles/car.png',
        van: '/assets/vehicles/van.png',
        truck: '/assets/vehicles/truck.png',
      }
      return images[type] || '/assets/vehicles/vehicle-placeholder.png'
    }

    const formatMileage = mileage => {
      if (!mileage) return 'N/A'
      return `${mileage.toLocaleString()} km`
    }

    const formatDate = dateString => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('fr-FR')
    }

    // Lifecycle
    onMounted(() => {
      loadData()
    })

    return {
      loading,
      vehicles,
      filteredVehicles,
      vehicleStats,
      selectedVehicle,
      editingVehicle,
      utilizationChart,
      viewMode,
      showVehicleDetails,
      showAddVehicle,
      showEditVehicle,
      showMaintenance,
      currentPage,
      pageSize,
      searchQuery,
      filters,
      paginatedVehicles,
      totalPages,
      visiblePages,
      typeChartData,
      chartOptions,
      loadData,
      applyFilters,
      viewVehicle,
      editVehicle,
      viewMaintenance,
      trackVehicle,
      scheduleMaintenace,
      retireVehicle,
      closeVehicleForm,
      handleVehicleSave,
      handleVehicleUpdate,
      handleMaintenanceUpdate,
      goToPage,
      exportVehicles,
      getVehicleImage,
      formatMileage,
      formatDate,
    }
  },
}
</script>

<style scoped>
.vehicle-management {
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.stat-icon.total {
  background: #2196f3;
}
.stat-icon.active {
  background: #4caf50;
}
.stat-icon.maintenance {
  background: #ff9800;
}
.stat-icon.electric {
  background: #8bc34a;
}

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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.chart-container {
  padding: 20px;
  height: 300px;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

.vehicles-table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.view-toggle {
  display: flex;
  gap: 5px;
}

.table-container {
  overflow-x: auto;
}

.vehicles-table {
  width: 100%;
  border-collapse: collapse;
}

.vehicles-table th,
.vehicles-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.vehicles-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.vehicle-image {
  width: 40px;
  height: 30px;
  object-fit: contain;
}

.vehicle-name {
  font-weight: 500;
}

.vehicle-plate {
  font-size: 12px;
  color: #666;
}

.vehicle-type {
  display: block;
  margin-bottom: 5px;
}

.electric-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: #e8f5e8;
  color: #4caf50;
  border-radius: 10px;
  font-size: 10px;
}

.owner-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.no-owner {
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

.status-badge.active {
  background: #e8f5e8;
  color: #4caf50;
}

.status-badge.inactive {
  background: #f5f5f5;
  color: #666;
}

.status-badge.maintenance {
  background: #fff3e0;
  color: #ff9800;
}

.status-badge.retired {
  background: #ffebee;
  color: #f44336;
}

.utilization-bar {
  position: relative;
  width: 80px;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.utilization-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s;
}

.utilization-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 500;
  color: #333;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.vehicle-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s;
}

.vehicle-card:hover {
  transform: translateY(-2px);
}

.vehicle-card-header {
  position: relative;
  padding: 20px;
  text-align: center;
  background: #f8f9fa;
}

.vehicle-card-image {
  width: 80px;
  height: 60px;
  object-fit: contain;
}

.vehicle-card-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

.vehicle-card-content {
  padding: 20px;
}

.vehicle-card-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
}

.vehicle-card-plate {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
}

.vehicle-card-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
}

.stat.electric {
  color: #4caf50;
}

.vehicle-card-owner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.avatar-xs {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.vehicle-card-actions {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  color: #f44336;
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
  background: #2196f3;
  border-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background: #1976d2;
}

.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-outline {
  background: transparent;
}

.btn-warning {
  background: #ff9800;
  border-color: #ff9800;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>
