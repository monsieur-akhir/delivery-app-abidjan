<template>
  <div class="traffic-view">
    <div class="page-header">
      <h1>Analyse du trafic</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="generateReport">
          <font-awesome-icon icon="file-export" class="mr-1" />
          Générer un rapport
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="date-range">Période</label>
          <div class="date-range-picker">
            <input type="date" id="date-from" v-model="filters.startDate" class="form-control" />
            <span>à</span>
            <input type="date" id="date-to" v-model="filters.endDate" class="form-control" />
          </div>
        </div>

        <div class="filter-group">
          <label for="commune-filter">Commune</label>
          <select id="commune-filter" v-model="filters.commune" class="form-control">
            <option value="">Toutes les communes</option>
            <option v-for="commune in communes" :key="commune" :value="commune">
              {{ commune }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="time-of-day">Heure de la journée</label>
          <select id="time-of-day" v-model="filters.timeOfDay" class="form-control">
            <option value="">Toute la journée</option>
            <option value="morning">Matin (6h - 12h)</option>
            <option value="afternoon">Après-midi (12h - 18h)</option>
            <option value="evening">Soir (18h - 24h)</option>
            <option value="night">Nuit (0h - 6h)</option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <font-awesome-icon icon="times" class="mr-1" />
          Réinitialiser les filtres
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <font-awesome-icon icon="filter" class="mr-1" />
          Appliquer les filtres
        </button>
      </div>
    </div>

    <!-- Carte du trafic -->
    <div class="map-container">
      <h2>Carte du trafic</h2>
      <div id="traffic-map" class="map-content"></div>
    </div>

    <!-- Liste des signalements d'embouteillages -->
    <div class="reports-container">
      <h2>Signalements d'embouteillages</h2>
      <div class="report-list" v-if="trafficReports.length > 0">
        <div class="report-item" v-for="report in trafficReports" :key="report.id">
          <div class="report-header">
            <div class="report-location">
              <font-awesome-icon icon="map-marker-alt" class="mr-1" />
              {{ report.location }}
            </div>
            <div class="report-time">
              <font-awesome-icon icon="clock" class="mr-1" />
              {{ formatDateTime(report.created_at) }}
            </div>
          </div>
          <div class="report-description">
            {{ report.description }}
          </div>
          <div class="report-actions">
            <button class="btn btn-sm btn-outline" @click="viewReportDetails(report.id)">
              <font-awesome-icon icon="eye" class="mr-1" />
              Voir les détails
            </button>
            <button class="btn btn-sm btn-danger" @click="deleteReport(report.id)">
              <font-awesome-icon icon="trash" class="mr-1" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <font-awesome-icon icon="exclamation-triangle" />
        <p>Aucun signalement d'embouteillage trouvé.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTrafficReports, deleteTrafficReport } from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'TrafficView',
  setup() {
    

    // État
    const trafficReports = ref([])
    const loading = ref(true)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const trafficMap = ref(null)
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
    ])

    const filters = reactive({
      startDate: '',
      endDate: '',
      commune: '',
      timeOfDay: '',
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          start_date: filters.startDate,
          end_date: filters.endDate,
          commune: filters.commune,
          time_of_day: filters.timeOfDay,
        }

        const response = await getTrafficReports(params)
        trafficReports.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages
      } catch (error) {
        console.error('Erreur lors du chargement des rapports de trafic:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      fetchData()
    }

    const applyFilters = () => {
      currentPage.value = 1
      fetchData()
    }

    const resetFilters = () => {
      filters.startDate = ''
      filters.endDate = ''
      filters.commune = ''
      filters.timeOfDay = ''
      currentPage.value = 1
      fetchData()
    }

    const changePage = page => {
      currentPage.value = page
      fetchData()
    }

    const generateReport = () => {
      // Implémenter la génération de rapport
      console.log('Générer un rapport')
    }

    const viewReportDetails = reportId => {
      // Rediriger vers la page de détails du rapport
      console.log('Voir les détails du rapport:', reportId)
    }

    const deleteReport = async reportId => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
        return
      }

      try {
        await deleteTrafficReport(reportId)

        // Mettre à jour la liste des rapports
        fetchData()

        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la suppression du rapport:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }

    const initMap = () => {
      if (!trafficMap.value) {
        trafficMap.value = L.map('traffic-map').setView([5.36, -4.0083], 12) // Coordonnées d'Abidjan

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(trafficMap.value)

        // Ajouter des marqueurs pour les signalements d'embouteillages
        trafficReports.value.forEach(report => {
          // Vérifier si les coordonnées sont valides
          if (report.latitude && report.longitude) {
            L.marker([report.latitude, report.longitude]).addTo(trafficMap.value).bindPopup(`
                <b>${report.location}</b><br>
                ${report.description}<br>
                <i>${formatDateTime(report.created_at)}</i>
              `)
          }
        })
      }
    }

    // Pagination calculée
    const displayedPages = computed(() => {
      const pages = []
      const maxVisiblePages = 5

      if (totalPages.value <= maxVisiblePages) {
        // Afficher toutes les pages si le nombre total est inférieur ou égal au maximum visible
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        // Calculer les pages à afficher
        let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
        let endPage = startPage + maxVisiblePages - 1

        if (endPage > totalPages.value) {
          endPage = totalPages.value
          startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
      }

      return pages
    })

    // Debounce pour la recherche
    let searchTimeout = null
    const debounceSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        applyFilters()
      }, 500)
    }

    // Cycle de vie
    onMounted(() => {
      fetchData()

      // Initialiser la carte après le rendu du DOM
      setTimeout(() => {
        initMap()
      }, 100)
    })

    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })

    // Surveiller les changements dans les rapports de trafic
    watch(trafficReports, () => {
      // Mettre à jour les marqueurs sur la carte
      if (trafficMap.value) {
        // Supprimer tous les marqueurs existants
        trafficMap.value.eachLayer(layer => {
          if (layer instanceof L.Marker) {
            trafficMap.value.removeLayer(layer)
          }
        })

        // Ajouter les nouveaux marqueurs
        trafficReports.value.forEach(report => {
          if (report.latitude && report.longitude) {
            L.marker([report.latitude, report.longitude]).addTo(trafficMap.value).bindPopup(`
                <b>${report.location}</b><br>
                ${report.description}<br>
                <i>${formatDateTime(report.created_at)}</i>
              `)
          }
        })
      }
    })

    return {
      trafficReports,
      loading,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      communes,
      filters,
      displayedPages,

      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      generateReport,
      viewReportDetails,
      deleteReport,

      formatCurrency,
      formatDate,
      formatDateTime,
      debounceSearch,
    }
  },
}
</script>

<style scoped>
.traffic-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
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
  gap: 0.5rem;
}

.btn-primary {
  background-color: #0056b3;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #004494;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-outline {
  background-color: transparent;
  color: #0056b3;
  border: 1px solid #0056b3;
}

.btn-outline:hover {
  background-color: rgba(0, 86, 179, 0.1);
}

.filters-container {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #495057;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.search-input {
  position: relative;
}

.search-input input {
  padding-right: 2.5rem;
}

.search-input svg {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.map-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.map-content {
  height: 400px;
}

.reports-container {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.report-location {
  font-weight: 500;
  color: #333;
}

.report-time {
  font-size: 0.75rem;
  color: #6c757d;
}

.report-description {
  font-size: 0.875rem;
  color: #495057;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    min-width: 100%;
  }
}
</style>
