<template>
  <div class="collaborative-delivery-view">
    <div class="page-header">
      <h1 class="page-title">Livraisons Collaboratives</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="exportData">
          <i class="fas fa-file-export mr-2"></i>
          Exporter
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus mr-2"></i>
          Nouvelle livraison
        </button>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" @change="loadDeliveries">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="date-range">Période</label>
          <select id="date-range" v-model="filters.dateRange" @change="handleDateRangeChange">
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="last_week">7 derniers jours</option>
            <option value="last_month">30 derniers jours</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>
        <div class="filter-group" v-if="filters.dateRange === 'custom'">
          <label for="start-date">Date de début</label>
          <input type="date" id="start-date" v-model="filters.startDate" @change="loadDeliveries" />
        </div>
        <div class="filter-group" v-if="filters.dateRange === 'custom'">
          <label for="end-date">Date de fin</label>
          <input type="date" id="end-date" v-model="filters.endDate" @change="loadDeliveries" />
        </div>
        <div class="filter-group search-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input
              type="text"
              id="search"
              v-model="filters.search"
              placeholder="ID, adresse, coursier..."
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalDeliveries }}</div>
          <div class="stat-label">Livraisons</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-motorcycle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalCouriers }}</div>
          <div class="stat-label">Coursiers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.completedDeliveries }}</div>
          <div class="stat-label">Terminées</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.totalEarnings) }}</div>
          <div class="stat-label">Gains totaux</div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Chargement des livraisons collaboratives...</p>
      </div>
      <div v-else-if="deliveries.length === 0" class="empty-state">
        <i class="fas fa-users fa-2x"></i>
        <p>Aucune livraison collaborative trouvée</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Créer une livraison collaborative
        </button>
      </div>
      <div v-else class="deliveries-table-container">
        <table class="deliveries-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Origine</th>
              <th>Destination</th>
              <th>Participants</th>
              <th>Statut</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="delivery in deliveries" :key="delivery.id">
              <td>#{{ delivery.id }}</td>
              <td>{{ formatDate(delivery.created_at) }}</td>
              <td>{{ delivery.pickup_address }}</td>
              <td>{{ delivery.delivery_address }}</td>
              <td>
                <div class="participants-count">
                  <i class="fas fa-users mr-1"></i>
                  {{ delivery.collaborative_couriers ? delivery.collaborative_couriers.length : 0 }}
                </div>
              </td>
              <td>
                <span :class="getStatusClass(delivery.status)">
                  {{ getStatusLabel(delivery.status) }}
                </span>
              </td>
              <td>{{ formatCurrency(delivery.price) }}</td>
              <td>
                <div class="table-actions">
                  <button
                    class="btn-icon"
                    @click="viewDeliveryDetails(delivery.id)"
                    title="Voir les détails"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button
                    class="btn-icon"
                    @click="viewParticipants(delivery.id)"
                    title="Gérer les participants"
                  >
                    <i class="fas fa-users"></i>
                  </button>
                  <button
                    class="btn-icon"
                    @click="viewEarnings(delivery.id)"
                    title="Voir les gains"
                    :disabled="delivery.status !== 'completed'"
                  >
                    <i class="fas fa-money-bill-wave"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="deliveries.length > 0 && totalPages > 1">
        <button
          class="pagination-button"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="pagination-info">Page {{ currentPage }} sur {{ totalPages }}</span>
        <button
          class="pagination-button"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal pour les détails de la livraison -->
    <Modal
      v-if="showDeliveryModal"
      @close="showDeliveryModal = false"
      title="Détails de la livraison collaborative"
    >
      <div v-if="selectedDelivery" class="delivery-details">
        <div class="detail-section">
          <h3>Informations générales</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID</span>
              <span class="detail-value">#{{ selectedDelivery.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de création</span>
              <span class="detail-value">{{ formatDateTime(selectedDelivery.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut</span>
              <span class="detail-value" :class="getStatusClass(selectedDelivery.status)">
                {{ getStatusLabel(selectedDelivery.status) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Prix</span>
              <span class="detail-value">{{ formatCurrency(selectedDelivery.price) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Adresses</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Adresse de ramassage</span>
              <span class="detail-value">{{ selectedDelivery.pickup_address }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Adresse de livraison</span>
              <span class="detail-value">{{ selectedDelivery.delivery_address }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Client</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nom</span>
              <span class="detail-value">{{
                selectedDelivery.client ? selectedDelivery.client.name : 'N/A'
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Téléphone</span>
              <span class="detail-value">{{
                selectedDelivery.client ? selectedDelivery.client.phone : 'N/A'
              }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Participants</h3>
          <div
            v-if="
              selectedDelivery.collaborative_couriers &&
              selectedDelivery.collaborative_couriers.length > 0
            "
          >
            <div
              class="participant-card"
              v-for="courier in selectedDelivery.collaborative_couriers"
              :key="courier.id"
            >
              <div class="participant-avatar">
                <img
                  v-if="courier.profile_picture"
                  :src="courier.profile_picture"
                  :alt="courier.name"
                />
                <div v-else class="avatar-placeholder">{{ getInitials(courier.name) }}</div>
              </div>
              <div class="participant-info">
                <div class="participant-name">{{ courier.name }}</div>
                <div class="participant-details">
                  <span class="participant-phone">{{ courier.phone }}</span>
                  <span class="participant-status" :class="getStatusClass(courier.status)">
                    {{ getStatusLabel(courier.status) }}
                  </span>
                </div>
              </div>
              <div class="participant-share">
                <span class="share-label">Part</span>
                <span class="share-value">{{ courier.share_percentage }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-participants">
            <p>Aucun participant pour cette livraison</p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeliveryModal = false">Fermer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour les participants -->
    <Modal
      v-if="showParticipantsModal"
      @close="showParticipantsModal = false"
      title="Gestion des participants"
    >
      <div v-if="selectedDelivery" class="participants-management">
        <div class="participants-header">
          <h3>Livraison #{{ selectedDelivery.id }}</h3>
          <div class="delivery-status" :class="getStatusClass(selectedDelivery.status)">
            {{ getStatusLabel(selectedDelivery.status) }}
          </div>
        </div>

        <div class="participants-list">
          <div
            v-if="
              selectedDelivery.collaborative_couriers &&
              selectedDelivery.collaborative_couriers.length > 0
            "
          >
            <div
              class="participant-row"
              v-for="courier in selectedDelivery.collaborative_couriers"
              :key="courier.id"
            >
              <div class="participant-info">
                <div class="participant-avatar">
                  <img
                    v-if="courier.profile_picture"
                    :src="courier.profile_picture"
                    :alt="courier.name"
                  />
                  <div v-else class="avatar-placeholder">{{ getInitials(courier.name) }}</div>
                </div>
                <div class="participant-details">
                  <div class="participant-name">{{ courier.name }}</div>
                  <div class="participant-phone">{{ courier.phone }}</div>
                </div>
              </div>
              <div class="participant-status-section">
                <select
                  v-model="courier.status"
                  @change="updateParticipantStatus(selectedDelivery.id, courier.id, courier.status)"
                  :disabled="
                    selectedDelivery.status === 'completed' ||
                    selectedDelivery.status === 'cancelled'
                  "
                >
                  <option value="pending">En attente</option>
                  <option value="accepted">Accepté</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div class="participant-share-section">
                <div class="share-display">
                  <span class="share-value">{{ courier.share_percentage }}%</span>
                  <button
                    class="btn-icon"
                    @click="editParticipantShare(courier)"
                    :disabled="
                      selectedDelivery.status === 'completed' ||
                      selectedDelivery.status === 'cancelled'
                    "
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </div>
              <div class="participant-actions">
                <button
                  class="btn-icon"
                  @click="removeParticipant(selectedDelivery.id, courier.id)"
                  :disabled="
                    selectedDelivery.status === 'completed' ||
                    selectedDelivery.status === 'cancelled'
                  "
                  title="Retirer le participant"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-participants">
            <p>Aucun participant pour cette livraison</p>
          </div>
        </div>

        <div
          class="add-participant-section"
          v-if="selectedDelivery.status !== 'completed' && selectedDelivery.status !== 'cancelled'"
        >
          <h3>Ajouter un participant</h3>
          <div class="add-participant-form">
            <div class="form-group">
              <label for="courier-select">Sélectionner un coursier</label>
              <select id="courier-select" v-model="newParticipant.courierId">
                <option value="">Sélectionner un coursier</option>
                <option v-for="courier in availableCouriers" :key="courier.id" :value="courier.id">
                  {{ courier.name }} ({{ courier.phone }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="share-percentage">Pourcentage de partage</label>
              <div class="input-group">
                <input
                  type="number"
                  id="share-percentage"
                  v-model.number="newParticipant.sharePercentage"
                  min="0"
                  max="100"
                  step="1"
                />
                <div class="input-group-append">
                  <span class="input-group-text">%</span>
                </div>
              </div>
            </div>
            <button
              class="btn btn-primary"
              @click="addParticipant"
              :disabled="
                !newParticipant.courierId ||
                newParticipant.sharePercentage < 0 ||
                newParticipant.sharePercentage > 100
              "
            >
              Ajouter
            </button>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showParticipantsModal = false">Fermer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour les gains -->
    <Modal
      v-if="showEarningsModal"
      @close="showEarningsModal = false"
      title="Répartition des gains"
    >
      <div v-if="selectedDelivery && earningsData" class="earnings-management">
        <div class="earnings-header">
          <h3>Livraison #{{ selectedDelivery.id }}</h3>
          <div class="delivery-price">Prix total: {{ formatCurrency(selectedDelivery.price) }}</div>
        </div>

        <div class="earnings-summary">
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ earningsData.participant_count }}</div>
              <div class="summary-label">Participants</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ formatCurrency(earningsData.total_earnings) }}</div>
              <div class="summary-label">Gains totaux</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ earningsData.total_percentage }}%</div>
              <div class="summary-label">Pourcentage total</div>
            </div>
          </div>
        </div>

        <div class="earnings-chart">
          <canvas ref="earningsChart"></canvas>
        </div>

        <div class="earnings-table">
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                <th>Pourcentage</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(amount, participantId) in earningsData.participant_earnings"
                :key="participantId"
              >
                <td>
                  {{ getParticipantName(participantId) }}
                </td>
                <td>{{ getParticipantPercentage(participantId) }}%</td>
                <td>
                  {{ formatCurrency(amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="earnings-actions">
          <button
            class="btn btn-primary"
            @click="distributeEarnings"
            :disabled="earningsDistributed"
          >
            <i class="fas fa-money-bill-wave mr-2"></i>
            {{ earningsDistributed ? 'Gains distribués' : 'Distribuer les gains' }}
          </button>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showEarningsModal = false">Fermer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour éditer le pourcentage de partage -->
    <Modal
      v-if="showShareModal"
      @close="showShareModal = false"
      title="Modifier le pourcentage de partage"
    >
      <ParticipantShareForm
        v-if="selectedParticipant"
        :participant="selectedParticipant"
        :current-share="selectedParticipant.share_percentage"
        :delivery-price="selectedDelivery ? selectedDelivery.price : 0"
        @save="saveParticipantShare"
        @cancel="showShareModal = false"
      />
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import Modal from '@/components/ui/Modal.vue'
import ParticipantShareForm from '@/components/forms/ParticipantShareForm.vue'
import {
  getCollaborativeDeliveries,
  getCollaborativeDelivery,
  updateParticipantShare,
  getCollaborativeEarnings,
  distributeCollaborativeEarnings,
  exportCollaborativeData,
} from '@/api/collaborative'
import { useToast } from '@/composables/useToast'

export default {
  name: 'CollaborativeDeliveryView',
  components: {
    Modal,
    ParticipantShareForm,
  },
  setup() {
    const { showToast } = useToast()

    // État des données
    const deliveries = ref([])
    const loading = ref(true)
    const stats = ref({
      totalDeliveries: 0,
      totalCouriers: 0,
      completedDeliveries: 0,
      totalEarnings: 0,
    })

    // État de la pagination
    const currentPage = ref(1)
    const totalItems = ref(0)
    const itemsPerPage = ref(10)
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

    // État des filtres
    const filters = ref({
      status: '',
      dateRange: 'all',
      startDate: null,
      endDate: null,
      search: '',
    })

    // État des modals
    const showDeliveryModal = ref(false)
    const showParticipantsModal = ref(false)
    const showEarningsModal = ref(false)
    const showShareModal = ref(false)

    // État des éléments sélectionnés
    const selectedDelivery = ref(null)
    const selectedParticipant = ref(null)
    const earningsData = ref(null)
    const earningsDistributed = ref(false)

    // État pour l'ajout de participant
    const newParticipant = ref({
      courierId: '',
      sharePercentage: 20,
    })

    // Liste des coursiers disponibles
    const availableCouriers = ref([
      { id: 1, name: 'Amadou Diallo', phone: '77 123 45 67' },
      { id: 2, name: 'Fatou Sow', phone: '76 234 56 78' },
      { id: 3, name: 'Moussa Camara', phone: '70 345 67 89' },
      { id: 4, name: 'Aïssatou Bah', phone: '78 456 78 90' },
    ])

    // Référence pour le graphique
    const earningsChart = ref(null)
    let chart = null

    // Chargement des livraisons
    const loadDeliveries = async () => {
      try {
        loading.value = true

        // Préparer les dates si nécessaire
        let startDate = null
        let endDate = null

        if (filters.value.dateRange === 'custom') {
          startDate = filters.value.startDate ? new Date(filters.value.startDate) : null
          endDate = filters.value.endDate ? new Date(filters.value.endDate) : null
        } else if (filters.value.dateRange === 'today') {
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
        } else if (filters.value.dateRange === 'yesterday') {
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 1)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setDate(endDate.getDate() - 1)
          endDate.setHours(23, 59, 59, 999)
        } else if (filters.value.dateRange === 'last_week') {
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          endDate = new Date()
        } else if (filters.value.dateRange === 'last_month') {
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          endDate = new Date()
        }

        // Appel API
        const skip = (currentPage.value - 1) * itemsPerPage.value
        const response = await getCollaborativeDeliveries(
          filters.value.status,
          startDate,
          endDate,
          skip,
          itemsPerPage.value
        )

        deliveries.value = response
        totalItems.value = response.length > 0 ? response[0].total_count || 100 : 0

        // Mise à jour des statistiques
        updateStats()
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons:', error)
        showToast('Erreur lors du chargement des livraisons', 'error')
      } finally {
        loading.value = false
      }
    }

    // Mise à jour des statistiques
    const updateStats = () => {
      // Dans un environnement réel, ces données viendraient de l'API
      stats.value = {
        totalDeliveries: 45,
        totalCouriers: 12,
        completedDeliveries: 32,
        totalEarnings: 450000,
      }
    }

    // Gestion des changements de page
    const changePage = page => {
      currentPage.value = page
      loadDeliveries()
    }

    // Gestion du changement de plage de dates
    const handleDateRangeChange = () => {
      if (filters.value.dateRange !== 'custom') {
        filters.value.startDate = null
        filters.value.endDate = null
      }
      loadDeliveries()
    }

    // Recherche avec debounce
    const debounceSearch = () => {
      clearTimeout(window.searchTimeout)
      window.searchTimeout = setTimeout(() => {
        loadDeliveries()
      }, 300)
    }

    // Formatage de la date
    const formatDate = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    // Formatage de la date et de l'heure
    const formatDateTime = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    // Formatage de la devise
    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // Obtenir la classe CSS pour un statut
    const getStatusClass = status => {
      switch (status) {
        case 'pending':
          return 'status-pending'
        case 'in_progress':
          return 'status-in-progress'
        case 'completed':
          return 'status-completed'
        case 'cancelled':
          return 'status-cancelled'
        default:
          return ''
      }
    }

    // Obtenir le libellé pour un statut
    const getStatusLabel = status => {
      switch (status) {
        case 'pending':
          return 'En attente'
        case 'in_progress':
          return 'En cours'
        case 'completed':
          return 'Terminée'
        case 'cancelled':
          return 'Annulée'
        case 'accepted':
          return 'Accepté'
        default:
          return status
      }
    }

    // Obtenir les initiales d'un nom
    const getInitials = name => {
      if (!name) return ''
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
    }

    // Voir les détails d'une livraison
    const viewDeliveryDetails = async deliveryId => {
      try {
        loading.value = true
        const delivery = await getCollaborativeDelivery(deliveryId)
        selectedDelivery.value = delivery
        showDeliveryModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la livraison:', error)
        showToast('Erreur lors du chargement des détails de la livraison', 'error')
      } finally {
        loading.value = false
      }
    }

    // Voir les participants d'une livraison
    const viewParticipants = async deliveryId => {
      try {
        loading.value = true
        const delivery = await getCollaborativeDelivery(deliveryId)
        selectedDelivery.value = delivery
        showParticipantsModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des participants:', error)
        showToast('Erreur lors du chargement des participants', 'error')
      } finally {
        loading.value = false
      }
    }

    // Voir les gains d'une livraison
    const viewEarnings = async deliveryId => {
      try {
        loading.value = true
        const delivery = await getCollaborativeDelivery(deliveryId)
        selectedDelivery.value = delivery

        // Récupérer les données de gains
        const earnings = await getCollaborativeEarnings(deliveryId)
        earningsData.value = earnings

        // Réinitialiser l'état de distribution
        earningsDistributed.value = false

        showEarningsModal.value = true

        // Créer le graphique après l'affichage du modal
        setTimeout(() => {
          createEarningsChart()
        }, 100)
      } catch (error) {
        console.error('Erreur lors du chargement des gains:', error)
        showToast('Erreur lors du chargement des gains', 'error')
      } finally {
        loading.value = false
      }
    }

    // Créer le graphique des gains
    const createEarningsChart = () => {
      if (!earningsChart.value || !earningsData.value) return

      const ctx = earningsChart.value.getContext('2d')

      // Détruire le graphique existant s'il y en a un
      if (chart) {
        chart.destroy()
      }

      // Préparer les données
      const labels = []
      const data = []
      const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#6f42c1']

      // Remplir les données
      for (const [participantId, amount] of Object.entries(
        earningsData.value.participant_earnings
      )) {
        labels.push(getParticipantName(participantId))
        data.push(amount)
      }

      // Créer le graphique
      chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: colors,
              hoverBackgroundColor: colors,
              hoverBorderColor: 'rgba(234, 236, 244, 1)',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || ''
                  if (label) {
                    label += ': '
                  }
                  if (context.parsed !== undefined) {
                    label += new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                    }).format(context.parsed)
                  }
                  return label
                },
              },
            },
          },
        },
      })
    }

    // Obtenir le nom d'un participant à partir de son ID
    const getParticipantName = participantId => {
      if (!selectedDelivery.value || !selectedDelivery.value.collaborative_couriers)
        return `Coursier #${participantId}`

      const participant = selectedDelivery.value.collaborative_couriers.find(
        c => c.id.toString() === participantId.toString()
      )
      return participant ? participant.name : `Coursier #${participantId}`
    }

    // Obtenir le pourcentage d'un participant à partir de son ID
    const getParticipantPercentage = participantId => {
      if (!selectedDelivery.value || !selectedDelivery.value.collaborative_couriers) return 0

      const participant = selectedDelivery.value.collaborative_couriers.find(
        c => c.id.toString() === participantId.toString()
      )
      return participant ? participant.share_percentage : 0
    }

    // Mettre à jour le statut d'un participant
    // Éditer le pourcentage de partage d'un participant
    const editParticipantShare = participant => {
      selectedParticipant.value = participant
      showShareModal.value = true
    }

    // Enregistrer le pourcentage de partage d'un participant
    const saveParticipantShare = async data => {
      try {
        if (!selectedDelivery.value) return

        await updateParticipantShare(
          selectedDelivery.value.id,
          data.participantId,
          data.sharePercentage
        )

        // Mettre à jour les données locales
        if (selectedDelivery.value.collaborative_couriers) {
          const participant = selectedDelivery.value.collaborative_couriers.find(
            c => c.id === data.participantId
          )
          if (participant) {
            participant.share_percentage = data.sharePercentage
          }
        }

        showToast('Pourcentage de partage mis à jour avec succès', 'success')
        showShareModal.value = false
      } catch (error) {
        console.error('Erreur lors de la mise à jour du pourcentage de partage:', error)
        showToast('Erreur lors de la mise à jour du pourcentage de partage', 'error')
      }
    }

    // Ajouter un participant
    const addParticipant = async () => {
      try {
        if (!selectedDelivery.value || !newParticipant.value.courierId) return

        // Dans un environnement réel, cela serait géré par l'API
        // Simuler l'ajout d'un participant
        const courier = availableCouriers.value.find(c => c.id === newParticipant.value.courierId)

        if (courier) {
          // Vérifier si le coursier est déjà un participant
          const isAlreadyParticipant = selectedDelivery.value.collaborative_couriers.some(
            c => c.id === courier.id
          )

          if (isAlreadyParticipant) {
            showToast('Ce coursier est déjà un participant à cette livraison', 'error')
            return
          }

          // Ajouter le coursier à la liste des participants
          selectedDelivery.value.collaborative_couriers.push({
            id: courier.id,
            name: courier.name,
            phone: courier.phone,
            status: 'pending',
            share_percentage: newParticipant.value.sharePercentage,
          })

          // Réinitialiser le formulaire
          newParticipant.value = {
            courierId: '',
            sharePercentage: 20,
          }

          showToast('Participant ajouté avec succès', 'success')
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du participant:", error)
        showToast("Erreur lors de l'ajout du participant", 'error')
      }
    }

    // Retirer un participant
    const removeParticipant = async (deliveryId, participantId) => {
      try {
        // Dans un environnement réel, cela serait géré par l'API
        // Simuler la suppression d'un participant
        if (selectedDelivery.value && selectedDelivery.value.collaborative_couriers) {
          selectedDelivery.value.collaborative_couriers =
            selectedDelivery.value.collaborative_couriers.filter(c => c.id !== participantId)

          showToast('Participant retiré avec succès', 'success')
        }
      } catch (error) {
        console.error('Erreur lors du retrait du participant:', error)
        showToast('Erreur lors du retrait du participant', 'error')
      }
    }

    // Distribuer les gains
    const distributeEarnings = async () => {
      try {
        if (!selectedDelivery.value) return

        await distributeCollaborativeEarnings(selectedDelivery.value.id)
        earningsDistributed.value = true

        showToast('Gains distribués avec succès', 'success')
      } catch (error) {
        console.error('Erreur lors de la distribution des gains:', error)
        showToast('Erreur lors de la distribution des gains', 'error')
      }
    }

    // Exporter les données
    const exportData = async () => {
      try {
        // Dans un environnement réel, les données viendraient de l'API
        // Simuler l'export de données
        const dataToExport = deliveries.value.map(delivery => ({
          id: delivery.id,
          date: formatDate(delivery.created_at),
          pickup_address: delivery.pickup_address,
          delivery_address: delivery.delivery_address,
          status: getStatusLabel(delivery.status),
          price: delivery.price,
          participants: delivery.collaborative_couriers
            ? delivery.collaborative_couriers.length
            : 0,
        }))

        await exportCollaborativeData(dataToExport, 'livraisons-collaboratives.csv')
        showToast('Données exportées avec succès', 'success')
      } catch (error) {
        console.error("Erreur lors de l'export des données:", error)
        showToast("Erreur lors de l'export des données", 'error')
      }
    }

    // Créer une nouvelle livraison
    const openCreateModal = () => {
      // Cette fonctionnalité serait implémentée dans une version future
      showToast('Fonctionnalité à venir', 'info')
    }

    // Charger les données au montage du composant
    onMounted(() => {
      loadDeliveries()
    })

    // Surveiller les changements de page
    watch(currentPage, () => {
      loadDeliveries()
    })

    return {
      deliveries,
      loading,
      stats,
      currentPage,
      totalItems,
      itemsPerPage,
      totalPages,
      filters,
      showDeliveryModal,
      showParticipantsModal,
      showEarningsModal,
      showShareModal,
      selectedDelivery,
      selectedParticipant,
      earningsData,
      earningsDistributed,
      newParticipant,
      availableCouriers,
      earningsChart,
      loadDeliveries,
      changePage,
      handleDateRangeChange,
      debounceSearch,
      formatDate,
      formatDateTime,
      formatCurrency,
      getStatusClass,
      getStatusLabel,
      getInitials,
      viewDeliveryDetails,
      viewParticipants,
      viewEarnings,
      getParticipantName,
      getParticipantPercentage,
      editParticipantShare,
      saveParticipantShare,
      addParticipant,
      removeParticipant,
      distributeEarnings,
      exportData,
      openCreateModal,
    }
  },
}
</script>

<style scoped>
.collaborative-delivery-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-outline {
  background-color: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.mr-2 {
  margin-right: 0.5rem;
}

.filter-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
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

.search-group {
  flex: 2;
}

.search-input {
  position: relative;
}

.search-input input {
  padding-right: 2.5rem;
}

.search-input i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #eef2ff;
  color: #4f46e5;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.content-section {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-state i,
.empty-state i {
  margin-bottom: 1rem;
  color: #6b7280;
}

.loading-state p,
.empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.deliveries-table-container {
  overflow-x: auto;
}

.deliveries-table {
  width: 100%;
  border-collapse: collapse;
}

.deliveries-table th,
.deliveries-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.deliveries-table th {
  font-weight: 600;
  color: #374151;
}

.deliveries-table tr:last-child td {
  border-bottom: none;
}

.participants-count {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: #4b5563;
}

.status-pending {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #fef3c7;
  color: #d97706;
}

.status-in-progress {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #dbeafe;
  color: #2563eb;
}

.status-completed {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #d1fae5;
  color: #059669;
}

.status-cancelled {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #fee2e2;
  color: #dc2626;
}

.table-actions {
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

.btn-icon:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #4f46e5;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-button {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.delivery-details {
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #1f2937;
}

.participant-card {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.participant-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-weight: 600;
}

.participant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.participant-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.participant-share {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.share-value {
  font-weight: 600;
  color: #1f2937;
}

.empty-participants {
  padding: 1.5rem;
  text-align: center;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.participants-management {
  padding: 1rem;
}

.participants-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.participants-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.delivery-status {
  font-weight: 500;
}

.participants-list {
  margin-bottom: 1.5rem;
}

.participant-row {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.participant-status-section,
.participant-share-section {
  margin: 0 0.75rem;
}

.participant-status-section select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.share-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-participant-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.add-participant-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.add-participant-form {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  flex: 1;
}

.input-group-append {
  display: flex;
  align-items: center;
}

.input-group-text {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-left: none;
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.earnings-management {
  padding: 1rem;
}

.earnings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.earnings-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.delivery-price {
  font-weight: 600;
  color: #1f2937;
}

.earnings-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #eef2ff;
  color: #4f46e5;
  margin-right: 0.75rem;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.earnings-chart {
  height: 300px;
  margin-bottom: 1.5rem;
}

.earnings-table {
  margin-bottom: 1.5rem;
}

.earnings-table table {
  width: 100%;
  border-collapse: collapse;
}

.earnings-table th,
.earnings-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.earnings-table th {
  font-weight: 600;
  color: #374151;
}

.earnings-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.mr-1 {
  margin-right: 0.25rem;
}
</style>
