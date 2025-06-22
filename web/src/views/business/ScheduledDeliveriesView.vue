
<template>
  <div class="scheduled-deliveries-view">
    <div class="header">
      <h1>📅 Livraisons Planifiées</h1>
      <p class="subtitle">Gérez vos livraisons récurrentes et ponctuelles</p>
      
      <div class="header-actions">
        <button @click="showCreateModal = true" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          Nouvelle planification
        </button>
        <button @click="refreshData" class="btn btn-secondary" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Actualiser
        </button>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_scheduled || 0 }}</div>
        <div class="stat-label">Total planifiées</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.active_schedules || 0 }}</div>
        <div class="stat-label">Actives</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_executions_this_month || 0 }}</div>
        <div class="stat-label">Exécutions ce mois</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ (stats.success_rate || 0).toFixed(1) }}%</div>
        <div class="stat-label">Taux de succès</div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters">
      <div class="filter-group">
        <label>Statut :</label>
        <select v-model="filters.status" @change="loadSchedules">
          <option value="">Tous</option>
          <option value="active">Actif</option>
          <option value="paused">En pause</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Type de récurrence :</label>
        <select v-model="filters.recurrence_type" @change="loadSchedules">
          <option value="">Tous</option>
          <option value="none">Ponctuel</option>
          <option value="daily">Quotidien</option>
          <option value="weekly">Hebdomadaire</option>
          <option value="monthly">Mensuel</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Date de début :</label>
        <input type="date" v-model="filters.start_date" @change="loadSchedules">
      </div>

      <div class="filter-group">
        <label>Date de fin :</label>
        <input type="date" v-model="filters.end_date" @change="loadSchedules">
      </div>
    </div>

    <!-- Liste des planifications -->
    <div class="schedules-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Chargement...
      </div>

      <div v-else-if="schedules.length === 0" class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <h3>Aucune livraison planifiée</h3>
        <p>Créez votre première planification pour commencer</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          Créer une planification
        </button>
      </div>

      <div v-else class="schedules-grid">
        <div 
          v-for="schedule in schedules" 
          :key="schedule.id" 
          class="schedule-card"
          :class="{ 'paused': schedule.status === 'paused' }"
        >
          <div class="schedule-header">
            <h3>{{ schedule.title }}</h3>
            <div class="schedule-status">
              <span :class="`status ${schedule.status}`">
                {{ getStatusLabel(schedule.status) }}
              </span>
            </div>
          </div>

          <div class="schedule-body">
            <div class="schedule-info">
              <div class="info-row">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ schedule.pickup_address }} → {{ schedule.delivery_address }}</span>
              </div>
              
              <div class="info-row">
                <i class="fas fa-calendar-alt"></i>
                <span>{{ formatScheduleDate(schedule.scheduled_date) }}</span>
              </div>

              <div class="info-row">
                <i class="fas fa-repeat"></i>
                <span>{{ getRecurrenceLabel(schedule.recurrence_type) }}</span>
              </div>

              <div v-if="schedule.proposed_price" class="info-row">
                <i class="fas fa-money-bill-alt"></i>
                <span>{{ formatPrice(schedule.proposed_price) }} FCFA</span>
              </div>

              <div v-if="schedule.next_execution_at" class="info-row next-execution">
                <i class="fas fa-clock"></i>
                <span>Prochaine : {{ formatDate(schedule.next_execution_at) }}</span>
              </div>
            </div>

            <div class="schedule-actions">
              <button 
                @click="viewSchedule(schedule)" 
                class="btn btn-sm btn-outline"
                title="Voir les détails"
              >
                <i class="fas fa-eye"></i>
              </button>

              <button 
                @click="editSchedule(schedule)" 
                class="btn btn-sm btn-outline"
                title="Modifier"
              >
                <i class="fas fa-edit"></i>
              </button>

              <button 
                v-if="schedule.status === 'active'"
                @click="pauseSchedule(schedule.id)" 
                class="btn btn-sm btn-warning"
                title="Mettre en pause"
              >
                <i class="fas fa-pause"></i>
              </button>

              <button 
                v-if="schedule.status === 'paused'"
                @click="resumeSchedule(schedule.id)" 
                class="btn btn-sm btn-success"
                title="Reprendre"
              >
                <i class="fas fa-play"></i>
              </button>

              <button 
                @click="executeSchedule(schedule.id)" 
                class="btn btn-sm btn-primary"
                title="Exécuter maintenant"
              >
                <i class="fas fa-play-circle"></i>
              </button>

              <button 
                @click="deleteSchedule(schedule.id)" 
                class="btn btn-sm btn-danger"
                title="Supprimer"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div v-if="schedule.description" class="schedule-description">
            {{ schedule.description }}
          </div>

          <div class="schedule-footer">
            <small>
              Créée le {{ formatDate(schedule.created_at) }} • 
              {{ schedule.total_executions }} exécution(s)
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total > pagination.limit" class="pagination">
      <button 
        @click="changePage(pagination.currentPage - 1)"
        :disabled="pagination.currentPage === 1"
        class="btn btn-outline"
      >
        Précédent
      </button>
      
      <span class="page-info">
        Page {{ pagination.currentPage }} sur {{ Math.ceil(pagination.total / pagination.limit) }}
      </span>
      
      <button 
        @click="changePage(pagination.currentPage + 1)"
        :disabled="pagination.currentPage * pagination.limit >= pagination.total"
        class="btn btn-outline"
      >
        Suivant
      </button>
    </div>

    <!-- Modal de création/édition -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ editingSchedule ? 'Modifier' : 'Créer' }} une planification</h2>
          <button @click="closeModal" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveSchedule">
            <!-- Informations générales -->
            <div class="form-section">
              <h3>Informations générales</h3>
              
              <div class="form-group">
                <label for="title">Titre *</label>
                <input 
                  type="text" 
                  id="title"
                  v-model="formData.title" 
                  required
                  placeholder="Ex: Livraison documents quotidiens"
                >
              </div>

              <div class="form-group">
                <label for="description">Description</label>
                <textarea 
                  id="description"
                  v-model="formData.description" 
                  rows="3"
                  placeholder="Description optionnelle de la planification"
                ></textarea>
              </div>
            </div>

            <!-- Adresses -->
            <div class="form-section">
              <h3>Adresses</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="pickup_address">Adresse de ramassage *</label>
                  <input 
                    type="text" 
                    id="pickup_address"
                    v-model="formData.pickup_address" 
                    required
                    placeholder="Adresse de ramassage"
                  >
                </div>

                <div class="form-group">
                  <label for="pickup_commune">Commune de ramassage</label>
                  <select id="pickup_commune" v-model="formData.pickup_commune">
                    <option value="">Sélectionner...</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Cocody">Cocody</option>
                    <option value="Yopougon">Yopougon</option>
                    <option value="Marcory">Marcory</option>
                    <option value="Treichville">Treichville</option>
                    <option value="Adjamé">Adjamé</option>
                    <option value="Koumassi">Koumassi</option>
                    <option value="Port-Bouët">Port-Bouët</option>
                    <option value="Abobo">Abobo</option>
                    <option value="Attécoubé">Attécoubé</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="delivery_address">Adresse de livraison *</label>
                  <input 
                    type="text" 
                    id="delivery_address"
                    v-model="formData.delivery_address" 
                    required
                    placeholder="Adresse de livraison"
                  >
                </div>

                <div class="form-group">
                  <label for="delivery_commune">Commune de livraison</label>
                  <select id="delivery_commune" v-model="formData.delivery_commune">
                    <option value="">Sélectionner...</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Cocody">Cocody</option>
                    <option value="Yopougon">Yopougon</option>
                    <option value="Marcory">Marcory</option>
                    <option value="Treichville">Treichville</option>
                    <option value="Adjamé">Adjamé</option>
                    <option value="Koumassi">Koumassi</option>
                    <option value="Port-Bouët">Port-Bouët</option>
                    <option value="Abobo">Abobo</option>
                    <option value="Attécoubé">Attécoubé</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Contacts -->
            <div class="form-section">
              <h3>Contacts</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="pickup_contact_name">Contact ramassage</label>
                  <input 
                    type="text" 
                    id="pickup_contact_name"
                    v-model="formData.pickup_contact_name" 
                    placeholder="Nom du contact"
                  >
                </div>

                <div class="form-group">
                  <label for="pickup_contact_phone">Téléphone ramassage</label>
                  <input 
                    type="tel" 
                    id="pickup_contact_phone"
                    v-model="formData.pickup_contact_phone" 
                    placeholder="+225 XX XX XX XX XX"
                  >
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="delivery_contact_name">Contact livraison</label>
                  <input 
                    type="text" 
                    id="delivery_contact_name"
                    v-model="formData.delivery_contact_name" 
                    placeholder="Nom du contact"
                  >
                </div>

                <div class="form-group">
                  <label for="delivery_contact_phone">Téléphone livraison</label>
                  <input 
                    type="tel" 
                    id="delivery_contact_phone"
                    v-model="formData.delivery_contact_phone" 
                    placeholder="+225 XX XX XX XX XX"
                  >
                </div>
              </div>
            </div>

            <!-- Colis -->
            <div class="form-section">
              <h3>Informations du colis</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="package_description">Description du colis</label>
                  <input 
                    type="text" 
                    id="package_description"
                    v-model="formData.package_description" 
                    placeholder="Ex: Documents administratifs"
                  >
                </div>

                <div class="form-group">
                  <label for="package_size">Taille</label>
                  <select id="package_size" v-model="formData.package_size">
                    <option value="small">Petit</option>
                    <option value="medium">Moyen</option>
                    <option value="large">Grand</option>
                    <option value="extra_large">Très grand</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="package_weight">Poids (kg)</label>
                  <input 
                    type="number" 
                    id="package_weight"
                    v-model="formData.package_weight" 
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                  >
                </div>

                <div class="form-group">
                  <label for="is_fragile">
                    <input 
                      type="checkbox" 
                      id="is_fragile"
                      v-model="formData.is_fragile"
                    >
                    Colis fragile
                  </label>
                </div>
              </div>
            </div>

            <!-- Planification -->
            <div class="form-section">
              <h3>Planification</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="scheduled_date">Date et heure *</label>
                  <input 
                    type="datetime-local" 
                    id="scheduled_date"
                    v-model="formData.scheduled_date" 
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="recurrence_type">Récurrence</label>
                  <select id="recurrence_type" v-model="formData.recurrence_type">
                    <option value="none">Ponctuel</option>
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>
              </div>

              <div v-if="formData.recurrence_type !== 'none'" class="form-row">
                <div class="form-group">
                  <label for="end_date">Date de fin</label>
                  <input 
                    type="date" 
                    id="end_date"
                    v-model="formData.end_date"
                  >
                </div>

                <div class="form-group">
                  <label for="max_occurrences">Nombre max d'occurrences</label>
                  <input 
                    type="number" 
                    id="max_occurrences"
                    v-model="formData.max_occurrences" 
                    min="1"
                    placeholder="Illimité"
                  >
                </div>
              </div>
            </div>

            <!-- Prix et véhicule -->
            <div class="form-section">
              <h3>Prix et véhicule</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="proposed_price">Prix proposé (FCFA)</label>
                  <input 
                    type="number" 
                    id="proposed_price"
                    v-model="formData.proposed_price" 
                    min="0"
                    placeholder="Prix en FCFA"
                  >
                </div>

                <div class="form-group">
                  <label for="required_vehicle_type">Type de véhicule</label>
                  <select id="required_vehicle_type" v-model="formData.required_vehicle_type">
                    <option value="">Aucune préférence</option>
                    <option value="bicycle">Vélo</option>
                    <option value="motorcycle">Moto</option>
                    <option value="scooter">Scooter</option>
                    <option value="car">Voiture</option>
                    <option value="van">Fourgonnette</option>
                    <option value="truck">Camion</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Options avancées -->
            <div class="form-section">
              <h3>Options avancées</h3>
              
              <div class="form-group">
                <label for="notification_advance_hours">Notification à l'avance (heures)</label>
                <input 
                  type="number" 
                  id="notification_advance_hours"
                  v-model="formData.notification_advance_hours" 
                  min="1"
                  max="168"
                  value="24"
                >
              </div>

              <div class="form-group">
                <label for="special_instructions">Instructions spéciales</label>
                <textarea 
                  id="special_instructions"
                  v-model="formData.special_instructions" 
                  rows="3"
                  placeholder="Instructions particulières pour le coursier"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="auto_create_delivery">
                  <input 
                    type="checkbox" 
                    id="auto_create_delivery"
                    v-model="formData.auto_create_delivery"
                  >
                  Créer automatiquement la livraison (sinon notification seulement)
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                {{ editingSchedule ? 'Mettre à jour' : 'Créer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de détails -->
    <div v-if="selectedSchedule" class="modal-overlay" @click="selectedSchedule = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedSchedule.title }}</h2>
          <button @click="selectedSchedule = null" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-section">
              <h3>Informations générales</h3>
              <div class="detail-item">
                <strong>Statut :</strong> {{ getStatusLabel(selectedSchedule.status) }}
              </div>
              <div class="detail-item">
                <strong>Description :</strong> {{ selectedSchedule.description || 'Aucune' }}
              </div>
              <div class="detail-item">
                <strong>Créée le :</strong> {{ formatDate(selectedSchedule.created_at) }}
              </div>
              <div class="detail-item">
                <strong>Dernière exécution :</strong> {{ selectedSchedule.last_executed_at ? formatDate(selectedSchedule.last_executed_at) : 'Jamais' }}
              </div>
              <div class="detail-item">
                <strong>Prochaine exécution :</strong> {{ selectedSchedule.next_execution_at ? formatDate(selectedSchedule.next_execution_at) : 'N/A' }}
              </div>
              <div class="detail-item">
                <strong>Total exécutions :</strong> {{ selectedSchedule.total_executions }}
              </div>
            </div>

            <div class="detail-section">
              <h3>Adresses</h3>
              <div class="detail-item">
                <strong>Ramassage :</strong> {{ selectedSchedule.pickup_address }}
                <span v-if="selectedSchedule.pickup_commune"> ({{ selectedSchedule.pickup_commune }})</span>
              </div>
              <div class="detail-item">
                <strong>Livraison :</strong> {{ selectedSchedule.delivery_address }}
                <span v-if="selectedSchedule.delivery_commune"> ({{ selectedSchedule.delivery_commune }})</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Contacts</h3>
              <div class="detail-item">
                <strong>Contact ramassage :</strong> 
                {{ selectedSchedule.pickup_contact_name || 'Non spécifié' }}
                <span v-if="selectedSchedule.pickup_contact_phone"> ({{ selectedSchedule.pickup_contact_phone }})</span>
              </div>
              <div class="detail-item">
                <strong>Contact livraison :</strong> 
                {{ selectedSchedule.delivery_contact_name || 'Non spécifié' }}
                <span v-if="selectedSchedule.delivery_contact_phone"> ({{ selectedSchedule.delivery_contact_phone }})</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Colis</h3>
              <div class="detail-item">
                <strong>Description :</strong> {{ selectedSchedule.package_description || 'Non spécifiée' }}
              </div>
              <div class="detail-item">
                <strong>Taille :</strong> {{ selectedSchedule.package_size || 'Non spécifiée' }}
              </div>
              <div class="detail-item">
                <strong>Poids :</strong> {{ selectedSchedule.package_weight ? selectedSchedule.package_weight + ' kg' : 'Non spécifié' }}
              </div>
              <div class="detail-item">
                <strong>Fragile :</strong> {{ selectedSchedule.is_fragile ? 'Oui' : 'Non' }}
              </div>
            </div>

            <div class="detail-section">
              <h3>Planification</h3>
              <div class="detail-item">
                <strong>Date programmée :</strong> {{ formatScheduleDate(selectedSchedule.scheduled_date) }}
              </div>
              <div class="detail-item">
                <strong>Récurrence :</strong> {{ getRecurrenceLabel(selectedSchedule.recurrence_type) }}
              </div>
              <div v-if="selectedSchedule.end_date" class="detail-item">
                <strong>Date de fin :</strong> {{ formatDate(selectedSchedule.end_date) }}
              </div>
              <div v-if="selectedSchedule.max_occurrences" class="detail-item">
                <strong>Max occurrences :</strong> {{ selectedSchedule.max_occurrences }}
              </div>
            </div>

            <div class="detail-section">
              <h3>Tarification</h3>
              <div class="detail-item">
                <strong>Prix proposé :</strong> 
                {{ selectedSchedule.proposed_price ? formatPrice(selectedSchedule.proposed_price) + ' FCFA' : 'Non spécifié' }}
              </div>
              <div class="detail-item">
                <strong>Véhicule requis :</strong> {{ selectedSchedule.required_vehicle_type || 'Aucune préférence' }}
              </div>
            </div>

            <div v-if="selectedSchedule.special_instructions" class="detail-section">
              <h3>Instructions spéciales</h3>
              <div class="detail-item">
                {{ selectedSchedule.special_instructions }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import scheduledDeliveryService from '../../api/scheduled-deliveries'
import { useToast } from '../../composables/useToast'

export default {
  name: 'ScheduledDeliveriesView',
  setup() {
    const { toast } = useToast()
    return { toast }
  },
  data() {
    return {
      loading: false,
      saving: false,
      schedules: [],
      stats: null,
      showCreateModal: false,
      selectedSchedule: null,
      editingSchedule: null,
      filters: {
        status: '',
        recurrence_type: '',
        start_date: '',
        end_date: ''
      },
      pagination: {
        currentPage: 1,
        limit: 20,
        total: 0
      },
      formData: {
        title: '',
        description: '',
        pickup_address: '',
        pickup_commune: '',
        pickup_contact_name: '',
        pickup_contact_phone: '',
        pickup_instructions: '',
        delivery_address: '',
        delivery_commune: '',
        delivery_contact_name: '',
        delivery_contact_phone: '',
        delivery_instructions: '',
        package_description: '',
        package_size: 'medium',
        package_weight: null,
        is_fragile: false,
        cargo_category: '',
        required_vehicle_type: '',
        proposed_price: null,
        delivery_type: 'standard',
        special_instructions: '',
        scheduled_date: '',
        recurrence_type: 'none',
        recurrence_interval: 1,
        recurrence_days: [],
        end_date: '',
        max_occurrences: null,
        notification_advance_hours: 24,
        auto_create_delivery: false
      }
    }
  },
  async mounted() {
    await this.loadSchedules()
    await this.loadStats()
  },
  methods: {
    async loadSchedules() {
      this.loading = true
      try {
        const params = {
          ...this.filters,
          skip: (this.pagination.currentPage - 1) * this.pagination.limit,
          limit: this.pagination.limit
        }

        const response = await scheduledDeliveryService.getScheduledDeliveries(params)
        
        if (response.success) {
          this.schedules = response.schedules || []
          this.pagination.total = response.total || 0
        } else {
          this.schedules = []
          this.pagination.total = 0
        }
      } catch (error) {
        console.error('Erreur lors du chargement des planifications:', error)
        this.toast.error('Erreur lors du chargement des planifications')
        this.schedules = []
      } finally {
        this.loading = false
      }
    },

    async loadStats() {
      try {
        const response = await scheduledDeliveryService.getScheduledDeliveryStats()
        if (response.success) {
          this.stats = response.stats
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      }
    },

    async refreshData() {
      await Promise.all([
        this.loadSchedules(),
        this.loadStats()
      ])
    },

    async saveSchedule() {
      // Validation
      const errors = scheduledDeliveryService.validateScheduleData(this.formData)
      if (errors.length > 0) {
        this.toast.error(errors.join('\n'))
        return
      }

      this.saving = true
      try {
        const apiData = scheduledDeliveryService.formatScheduleDataForAPI(this.formData)

        if (this.editingSchedule) {
          const response = await scheduledDeliveryService.updateScheduledDelivery(this.editingSchedule.id, apiData)
          if (response.success) {
            this.toast.success('Planification mise à jour avec succès')
          }
        } else {
          const response = await scheduledDeliveryService.createScheduledDelivery(apiData)
          if (response) {
            this.toast.success('Planification créée avec succès')
          }
        }

        this.closeModal()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
        this.toast.error(error.message || 'Erreur lors de la sauvegarde')
      } finally {
        this.saving = false
      }
    },

    editSchedule(schedule) {
      this.editingSchedule = schedule
      this.formData = { ...schedule }
      
      // Formater la date pour le champ datetime-local
      if (schedule.scheduled_date) {
        const date = new Date(schedule.scheduled_date)
        this.formData.scheduled_date = date.toISOString().slice(0, 16)
      }
      
      this.showCreateModal = true
    },

    viewSchedule(schedule) {
      this.selectedSchedule = schedule
    },

    async pauseSchedule(scheduleId) {
      if (!confirm('Êtes-vous sûr de vouloir mettre cette planification en pause ?')) {
        return
      }

      try {
        const response = await scheduledDeliveryService.pauseScheduledDelivery(scheduleId)
        if (response.success) {
          this.toast.success('Planification mise en pause')
          await this.loadSchedules()
        }
      } catch (error) {
        console.error('Erreur lors de la mise en pause:', error)
        this.toast.error(error.message || 'Erreur lors de la mise en pause')
      }
    },

    async resumeSchedule(scheduleId) {
      try {
        const response = await scheduledDeliveryService.resumeScheduledDelivery(scheduleId)
        if (response.success) {
          this.toast.success('Planification reprise')
          await this.loadSchedules()
        }
      } catch (error) {
        console.error('Erreur lors de la reprise:', error)
        this.toast.error(error.message || 'Erreur lors de la reprise')
      }
    },

    async executeSchedule(scheduleId) {
      if (!confirm('Êtes-vous sûr de vouloir exécuter cette planification maintenant ?')) {
        return
      }

      try {
        const response = await scheduledDeliveryService.executeScheduledDelivery(scheduleId)
        if (response.success) {
          this.toast.success(`Livraison créée avec succès (ID: ${response.delivery_id})`)
          await this.loadSchedules()
        }
      } catch (error) {
        console.error('Erreur lors de l\'exécution:', error)
        this.toast.error(error.message || 'Erreur lors de l\'exécution')
      }
    },

    async deleteSchedule(scheduleId) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette planification ? Cette action est irréversible.')) {
        return
      }

      try {
        const response = await scheduledDeliveryService.deleteScheduledDelivery(scheduleId)
        if (response.success) {
          this.toast.success('Planification supprimée')
          await this.loadSchedules()
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        this.toast.error(error.message || 'Erreur lors de la suppression')
      }
    },

    closeModal() {
      this.showCreateModal = false
      this.editingSchedule = null
      this.selectedSchedule = null
      this.resetForm()
    },

    resetForm() {
      this.formData = {
        title: '',
        description: '',
        pickup_address: '',
        pickup_commune: '',
        pickup_contact_name: '',
        pickup_contact_phone: '',
        pickup_instructions: '',
        delivery_address: '',
        delivery_commune: '',
        delivery_contact_name: '',
        delivery_contact_phone: '',
        delivery_instructions: '',
        package_description: '',
        package_size: 'medium',
        package_weight: null,
        is_fragile: false,
        cargo_category: '',
        required_vehicle_type: '',
        proposed_price: null,
        delivery_type: 'standard',
        special_instructions: '',
        scheduled_date: '',
        recurrence_type: 'none',
        recurrence_interval: 1,
        recurrence_days: [],
        end_date: '',
        max_occurrences: null,
        notification_advance_hours: 24,
        auto_create_delivery: false
      }
    },

    changePage(page) {
      if (page < 1 || page > Math.ceil(this.pagination.total / this.pagination.limit)) {
        return
      }
      this.pagination.currentPage = page
      this.loadSchedules()
    },

    getStatusLabel(status) {
      const labels = {
        active: 'Actif',
        paused: 'En pause',
        completed: 'Terminé',
        cancelled: 'Annulé'
      }
      return labels[status] || status
    },

    getRecurrenceLabel(recurrence) {
      const labels = {
        none: 'Ponctuel',
        daily: 'Quotidien',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuel'
      }
      return labels[recurrence] || recurrence
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatScheduleDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatPrice(price) {
      return new Intl.NumberFormat('fr-FR').format(price)
    }
  }
}
</script>

<style scoped>
.scheduled-deliveries-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
}

.subtitle {
  color: #7f8c8d;
  margin: 5px 0 0 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 5px;
}

.stat-label {
  color: #7f8c8d;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.schedules-container {
  min-height: 400px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.schedules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.schedule-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.schedule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.schedule-card.paused {
  opacity: 0.7;
  border-left: 4px solid #f39c12;
}

.schedule-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.schedule-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  line-height: 1.3;
}

.schedule-status .status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.paused {
  background: #fff3cd;
  color: #856404;
}

.status.completed {
  background: #cce5ff;
  color: #004085;
}

.status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.schedule-body {
  padding: 15px 20px;
}

.schedule-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #5a6c7d;
}

.info-row i {
  width: 16px;
  color: #3498db;
}

.info-row.next-execution {
  color: #e67e22;
  font-weight: 500;
}

.schedule-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.schedule-description {
  padding: 0 20px 10px;
  font-size: 14px;
  color: #7f8c8d;
  font-style: italic;
}

.schedule-footer {
  padding: 10px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  font-size: 12px;
  color: #6c757d;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-info {
  font-size: 14px;
  color: #7f8c8d;
}

/* Boutons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn-outline:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 5px;
}

.modal-close:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
}

/* Formulaire */
.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

/* Détails */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.detail-section {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.detail-section h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 600;
}

.detail-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.detail-item strong {
  color: #2c3e50;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .scheduled-deliveries-view {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters {
    flex-direction: column;
    gap: 15px;
  }

  .schedules-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .schedule-actions {
    justify-content: center;
  }
}
</style>
