
<template>
  <div class="scheduled-deliveries-view">
    <!-- En-tête -->
    <div class="header-section">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Livraisons Planifiées</h2>
          <p class="text-muted mb-0">Gérez vos livraisons récurrentes et ponctuelles</p>
        </div>
        <div class="d-flex gap-2">
          <button 
            class="btn btn-outline-primary"
            @click="showCalendarView = !showCalendarView"
          >
            <i class="fas fa-calendar-alt me-2"></i>
            {{ showCalendarView ? 'Vue Liste' : 'Vue Calendrier' }}
          </button>
          <button 
            class="btn btn-primary"
            @click="showCreateModal = true"
          >
            <i class="fas fa-plus me-2"></i>
            Nouvelle Planification
          </button>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="row mb-4" v-if="stats">
        <div class="col-md-3">
          <div class="stat-card bg-primary">
            <div class="stat-number">{{ stats.total_scheduled }}</div>
            <div class="stat-label">Total Planifiées</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bg-success">
            <div class="stat-number">{{ stats.active_schedules }}</div>
            <div class="stat-label">Actives</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bg-warning">
            <div class="stat-number">{{ stats.upcoming_executions_today }}</div>
            <div class="stat-label">Prévues Aujourd'hui</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card bg-info">
            <div class="stat-number">{{ stats.total_executions_this_month }}</div>
            <div class="stat-label">Exécutions ce Mois</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section mb-4">
      <div class="card">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-3">
              <label class="form-label">Statut</label>
              <select 
                class="form-select"
                v-model="filters.status"
                @change="loadSchedules"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="paused">En pause</option>
                <option value="completed">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Type de récurrence</label>
              <select 
                class="form-select"
                v-model="filters.recurrence"
                @change="loadSchedules"
              >
                <option value="">Tous les types</option>
                <option value="none">Ponctuelle</option>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Recherche</label>
              <input 
                type="text"
                class="form-control"
                placeholder="Rechercher par titre ou adresse..."
                v-model="filters.search"
                @input="debouncedSearch"
              >
            </div>
            <div class="col-md-2">
              <label class="form-label">&nbsp;</label>
              <button 
                class="btn btn-outline-secondary w-100"
                @click="resetFilters"
              >
                <i class="fas fa-times me-1"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue Calendrier -->
    <div v-if="showCalendarView" class="calendar-section mb-4">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Calendrier des Livraisons Planifiées</h5>
        </div>
        <div class="card-body">
          <div id="calendar"></div>
        </div>
      </div>
    </div>

    <!-- Vue Liste -->
    <div v-else class="list-section">
      <div class="card">
        <div class="card-body">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
          </div>

          <!-- Liste des planifications -->
          <div v-else-if="schedules.length > 0">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Adresses</th>
                    <th>Récurrence</th>
                    <th>Prochaine Exécution</th>
                    <th>Statut</th>
                    <th>Exécutions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="schedule in schedules" :key="schedule.id">
                    <td>
                      <div>
                        <strong>{{ schedule.title }}</strong>
                        <div class="text-muted small" v-if="schedule.description">
                          {{ schedule.description }}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="small">
                        <div class="mb-1">
                          <i class="fas fa-circle text-primary me-1"></i>
                          {{ schedule.pickup_address }}
                        </div>
                        <div>
                          <i class="fas fa-map-marker-alt text-success me-1"></i>
                          {{ schedule.delivery_address }}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-secondary">
                        {{ getRecurrenceLabel(schedule.recurrence_type) }}
                      </span>
                    </td>
                    <td>
                      <div v-if="schedule.next_execution_at" class="small">
                        {{ formatDateTime(schedule.next_execution_at) }}
                      </div>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td>
                      <span :class="getStatusBadgeClass(schedule.status)">
                        {{ getStatusLabel(schedule.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="text-center">
                        <strong>{{ schedule.total_executions }}</strong>
                      </div>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button 
                          class="btn btn-sm btn-outline-primary"
                          @click="editSchedule(schedule)"
                          title="Modifier"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button 
                          v-if="schedule.status === 'active'"
                          class="btn btn-sm btn-outline-warning"
                          @click="pauseSchedule(schedule.id)"
                          title="Mettre en pause"
                        >
                          <i class="fas fa-pause"></i>
                        </button>
                        <button 
                          v-else-if="schedule.status === 'paused'"
                          class="btn btn-sm btn-outline-success"
                          @click="resumeSchedule(schedule.id)"
                          title="Reprendre"
                        >
                          <i class="fas fa-play"></i>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-danger"
                          @click="confirmDelete(schedule)"
                          title="Supprimer"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <nav v-if="totalPages > 1" class="mt-4">
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button 
                    class="page-link"
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                  >
                    Précédent
                  </button>
                </li>
                <li 
                  v-for="page in visiblePages" 
                  :key="page"
                  class="page-item"
                  :class="{ active: page === currentPage }"
                >
                  <button 
                    class="page-link"
                    @click="changePage(page)"
                  >
                    {{ page }}
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button 
                    class="page-link"
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                  >
                    Suivant
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <!-- État vide -->
          <div v-else class="text-center py-5">
            <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Aucune livraison planifiée</h5>
            <p class="text-muted">Créez votre première planification de livraison</p>
            <button 
              class="btn btn-primary"
              @click="showCreateModal = true"
            >
              <i class="fas fa-plus me-2"></i>
              Créer une planification
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition -->
    <ScheduledDeliveryModal
      v-if="showCreateModal || editingSchedule"
      :show="showCreateModal || !!editingSchedule"
      :schedule="editingSchedule"
      @close="closeModal"
      @saved="onScheduleSaved"
    />

    <!-- Modal de confirmation de suppression -->
    <div 
      v-if="scheduleToDelete"
      class="modal fade show d-block"
      style="background-color: rgba(0,0,0,0.5)"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmer la suppression</h5>
            <button 
              type="button" 
              class="btn-close"
              @click="scheduleToDelete = null"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              Êtes-vous sûr de vouloir supprimer la planification 
              <strong>"{{ scheduleToDelete.title }}"</strong> ?
            </p>
            <p class="text-danger small mb-0">
              Cette action est irréversible et supprimera toutes les exécutions futures.
            </p>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary"
              @click="scheduleToDelete = null"
            >
              Annuler
            </button>
            <button 
              type="button" 
              class="btn btn-danger"
              @click="deleteSchedule"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { scheduledDeliveriesAPI } from '@/api/scheduled-deliveries'
import ScheduledDeliveryModal from '@/components/modals/ScheduledDeliveryModal.vue'
import { debounce } from 'lodash'

export default {
  name: 'ScheduledDeliveriesView',
  components: {
    ScheduledDeliveryModal
  },
  data() {
    return {
      loading: false,
      showCalendarView: false,
      showCreateModal: false,
      editingSchedule: null,
      scheduleToDelete: null,
      schedules: [],
      stats: null,
      filters: {
        status: '',
        recurrence: '',
        search: ''
      },
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      debouncedSearch: null
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalItems / this.itemsPerPage)
    },
    visiblePages() {
      const pages = []
      const start = Math.max(1, this.currentPage - 2)
      const end = Math.min(this.totalPages, this.currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    }
  },
  mounted() {
    this.debouncedSearch = debounce(this.loadSchedules, 500)
    this.loadStats()
    this.loadSchedules()
  },
  methods: {
    async loadStats() {
      try {
        const response = await scheduledDeliveriesAPI.getStats()
        this.stats = response.stats
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      }
    },
    async loadSchedules() {
      this.loading = true
      try {
        const params = {
          skip: (this.currentPage - 1) * this.itemsPerPage,
          limit: this.itemsPerPage
        }
        
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.search) params.search = this.filters.search
        
        const response = await scheduledDeliveriesAPI.getAll(params)
        this.schedules = response.schedules
        this.totalItems = response.total
      } catch (error) {
        console.error('Erreur lors du chargement des planifications:', error)
        this.$toast.error('Erreur lors du chargement des planifications')
      } finally {
        this.loading = false
      }
    },
    async pauseSchedule(scheduleId) {
      try {
        await scheduledDeliveriesAPI.pause(scheduleId)
        this.$toast.success('Planification mise en pause')
        this.loadSchedules()
        this.loadStats()
      } catch (error) {
        console.error('Erreur lors de la mise en pause:', error)
        this.$toast.error('Erreur lors de la mise en pause')
      }
    },
    async resumeSchedule(scheduleId) {
      try {
        await scheduledDeliveriesAPI.resume(scheduleId)
        this.$toast.success('Planification reprise')
        this.loadSchedules()
        this.loadStats()
      } catch (error) {
        console.error('Erreur lors de la reprise:', error)
        this.$toast.error('Erreur lors de la reprise')
      }
    },
    editSchedule(schedule) {
      this.editingSchedule = { ...schedule }
    },
    confirmDelete(schedule) {
      this.scheduleToDelete = schedule
    },
    async deleteSchedule() {
      try {
        await scheduledDeliveriesAPI.delete(this.scheduleToDelete.id)
        this.$toast.success('Planification supprimée')
        this.scheduleToDelete = null
        this.loadSchedules()
        this.loadStats()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        this.$toast.error('Erreur lors de la suppression')
      }
    },
    closeModal() {
      this.showCreateModal = false
      this.editingSchedule = null
    },
    onScheduleSaved() {
      this.closeModal()
      this.loadSchedules()
      this.loadStats()
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadSchedules()
      }
    },
    resetFilters() {
      this.filters = {
        status: '',
        recurrence: '',
        search: ''
      }
      this.currentPage = 1
      this.loadSchedules()
    },
    getRecurrenceLabel(type) {
      const labels = {
        none: 'Ponctuelle',
        daily: 'Quotidienne',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuelle'
      }
      return labels[type] || type
    },
    getStatusLabel(status) {
      const labels = {
        active: 'Active',
        paused: 'En pause',
        completed: 'Terminée',
        cancelled: 'Annulée'
      }
      return labels[status] || status
    },
    getStatusBadgeClass(status) {
      const classes = {
        active: 'badge bg-success',
        paused: 'badge bg-warning',
        completed: 'badge bg-primary',
        cancelled: 'badge bg-danger'
      }
      return classes[status] || 'badge bg-secondary'
    },
    formatDateTime(dateStr) {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.scheduled-deliveries-view {
  padding: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, var(--bs-primary), var(--bs-primary-dark));
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.bg-success {
  background: linear-gradient(135deg, var(--bs-success), var(--bs-success-dark));
}

.stat-card.bg-warning {
  background: linear-gradient(135deg, var(--bs-warning), var(--bs-warning-dark));
}

.stat-card.bg-info {
  background: linear-gradient(135deg, var(--bs-info), var(--bs-info-dark));
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.table th {
  background-color: #f8f9fa;
  border-top: none;
  font-weight: 600;
}

.btn-group .btn {
  margin-right: 0.25rem;
}

.pagination {
  margin-bottom: 0;
}

.modal.show {
  animation: fadeIn 0.15s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
