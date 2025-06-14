<template>
  <div class="express-delivery-view">
    <div class="page-header">
      <h1 class="page-title">Livraisons Express Solidaires</h1>
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
          <label for="commune-filter">Commune</label>
          <select id="commune-filter" v-model="filters.commune" @change="loadDeliveries">
            <option value="">Toutes les communes</option>
            <option value="plateau">Plateau</option>
            <option value="cocody">Cocody</option>
            <option value="marcory">Marcory</option>
            <option value="treichville">Treichville</option>
            <option value="yopougon">Yopougon</option>
            <option value="abobo">Abobo</option>
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
              placeholder="ID, adresse, client..."
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
          <i class="fas fa-bolt"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalDeliveries }}</div>
          <div class="stat-label">Livraisons Express</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-hand-holding-heart"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.totalDonations) }}</div>
          <div class="stat-label">Dons générés</div>
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
          <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
          <div class="stat-label">Revenus totaux</div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Chargement des livraisons express...</p>
      </div>
      <div v-else-if="deliveries.length === 0" class="empty-state">
        <i class="fas fa-bolt fa-2x"></i>
        <p>Aucune livraison express trouvée</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Créer une livraison express
        </button>
      </div>
      <div v-else class="deliveries-table-container">
        <table class="deliveries-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Client</th>
              <th>Origine</th>
              <th>Destination</th>
              <th>Coursier</th>
              <th>Don</th>
              <th>Statut</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="delivery in deliveries" :key="delivery.id">
              <td>#{{ delivery.id }}</td>
              <td>{{ formatDate(delivery.created_at) }}</td>
              <td>{{ delivery.client ? delivery.client.name : 'N/A' }}</td>
              <td>{{ delivery.pickup_address }}</td>
              <td>{{ delivery.delivery_address }}</td>
              <td>{{ delivery.courier ? delivery.courier.name : 'Non assigné' }}</td>
              <td>
                <div v-if="delivery.donation" class="donation-badge">
                  {{ formatCurrency(delivery.donation.amount) }}
                </div>
                <span v-else>-</span>
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
                    @click="assignCourier(delivery.id)"
                    title="Assigner un coursier"
                    v-if="delivery.status === 'pending' && !delivery.courier"
                  >
                    <i class="fas fa-user-plus"></i>
                  </button>
                  <button
                    class="btn-icon"
                    @click="cancelDelivery(delivery.id)"
                    title="Annuler la livraison"
                    v-if="delivery.status === 'pending' || delivery.status === 'accepted'"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                  <button
                    class="btn-icon"
                    @click="completeDelivery(delivery.id)"
                    title="Marquer comme terminée"
                    v-if="delivery.status === 'in_progress'"
                  >
                    <i class="fas fa-check"></i>
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
      title="Détails de la livraison express"
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
          <h3>Coursier</h3>
          <div v-if="selectedDelivery.courier" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nom</span>
              <span class="detail-value">{{ selectedDelivery.courier.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Téléphone</span>
              <span class="detail-value">{{ selectedDelivery.courier.phone }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Note</span>
              <span class="detail-value">
                <i class="fas fa-star star-icon"></i>
                {{ selectedDelivery.courier.rating }}
              </span>
            </div>
          </div>
          <div v-else class="empty-courier">
            <p>Aucun coursier assigné à cette livraison</p>
            <button
              class="btn btn-primary"
              @click="assignCourier(selectedDelivery.id)"
              v-if="selectedDelivery.status === 'pending'"
            >
              Assigner un coursier
            </button>
          </div>
        </div>

        <div class="detail-section">
          <h3>Don</h3>
          <div v-if="selectedDelivery.donation" class="donation-details">
            <div class="donation-amount">
              <span class="donation-label">Montant du don</span>
              <span class="donation-value">{{
                formatCurrency(selectedDelivery.donation.amount)
              }}</span>
            </div>
            <div class="donation-organization">
              <span class="donation-label">Organisation</span>
              <span class="donation-value">{{ selectedDelivery.donation.organization }}</span>
            </div>
            <div class="donation-status">
              <span class="donation-label">Statut</span>
              <span
                class="donation-value"
                :class="getStatusClass(selectedDelivery.donation.status)"
              >
                {{ getStatusLabel(selectedDelivery.donation.status) }}
              </span>
            </div>
          </div>
          <div v-else class="empty-donation">
            <p>Aucun don associé à cette livraison</p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeliveryModal = false">Fermer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour assigner un coursier -->
    <Modal v-if="showAssignModal" @close="showAssignModal = false" title="Assigner un coursier">
      <div class="assign-courier-form">
        <div class="form-group">
          <label for="courier-select">Sélectionner un coursier</label>
          <select id="courier-select" v-model="selectedCourierId">
            <option value="">Sélectionner un coursier</option>
            <option v-for="courier in availableCouriers" :key="courier.id" :value="courier.id">
              {{ courier.name }} ({{ courier.phone }}) - Note: {{ courier.rating }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="sendNotification" />
            <span>Envoyer une notification au coursier</span>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAssignModal = false">Annuler</button>
          <button
            class="btn btn-primary"
            @click="confirmAssignCourier"
            :disabled="!selectedCourierId"
          >
            Assigner
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour annuler une livraison -->
    <Modal v-if="showCancelModal" @close="showCancelModal = false" title="Annuler la livraison">
      <div class="cancel-delivery-form">
        <div class="form-group">
          <label for="cancel-reason">Raison de l'annulation</label>
          <textarea
            id="cancel-reason"
            v-model="cancelReason"
            rows="4"
            placeholder="Veuillez indiquer la raison de l'annulation..."
          ></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCancelModal = false">Annuler</button>
          <button
            class="btn btn-danger"
            @click="confirmCancelDelivery"
            :disabled="!cancelReason.trim()"
          >
            Confirmer l'annulation
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour créer une livraison express -->
    <Modal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      title="Nouvelle livraison express"
    >
      <div class="create-delivery-form">
        <div class="form-section">
          <h3>Informations client</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="client-select">Client</label>
              <select id="client-select" v-model="newDelivery.clientId">
                <option value="">Sélectionner un client</option>
                <option v-for="client in availableClients" :key="client.id" :value="client.id">
                  {{ client.name }} ({{ client.phone }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Adresses</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="pickup-address">Adresse de ramassage</label>
              <input
                type="text"
                id="pickup-address"
                v-model="newDelivery.pickupAddress"
                placeholder="Adresse complète de ramassage"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="delivery-address">Adresse de livraison</label>
              <input
                type="text"
                id="delivery-address"
                v-model="newDelivery.deliveryAddress"
                placeholder="Adresse complète de livraison"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Détails de la livraison</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="package-description">Description du colis</label>
              <textarea
                id="package-description"
                v-model="newDelivery.packageDescription"
                rows="2"
                placeholder="Description du contenu du colis..."
              ></textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="delivery-price">Prix de la livraison (FCFA)</label>
              <input
                type="number"
                id="delivery-price"
                v-model.number="newDelivery.price"
                min="0"
                step="100"
              />
            </div>
            <div class="form-group">
              <label for="express-surcharge">Supplément express (FCFA)</label>
              <input
                type="number"
                id="express-surcharge"
                v-model.number="newDelivery.expressSurcharge"
                min="0"
                step="100"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Don solidaire</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="donation-percentage">Pourcentage du supplément à donner</label>
              <div class="input-group">
                <input
                  type="number"
                  id="donation-percentage"
                  v-model.number="newDelivery.donationPercentage"
                  min="0"
                  max="100"
                  step="5"
                />
                <div class="input-group-append">
                  <span class="input-group-text">%</span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label for="charity-organization">Organisation caritative</label>
              <select
                id="charity-organization"
                v-model="newDelivery.charityOrganization"
                :disabled="newDelivery.donationPercentage <= 0"
              >
                <option value="">Sélectionner une organisation</option>
                <option v-for="org in charityOrganizations" :key="org.name" :value="org.name">
                  {{ org.name }} ({{ org.category }})
                </option>
              </select>
            </div>
          </div>
          <div class="donation-preview" v-if="newDelivery.donationPercentage > 0">
            <div class="donation-preview-label">Montant estimé du don:</div>
            <div class="donation-preview-amount">
              {{ formatCurrency(calculateDonationAmount()) }}
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateModal = false">Annuler</button>
          <button class="btn btn-primary" @click="createDelivery" :disabled="!isValidDelivery">
            Créer la livraison
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import {
  getExpressDeliveries,
  getExpressDelivery,
  createExpressDelivery,
  assignCourierToExpressDelivery,
  cancelExpressDelivery,
  completeExpressDelivery,
  getExpressStats,
  exportExpressData,
} from '@/api/express'
import { useToast } from '@/composables/useToast'

export default {
  name: 'ExpressDeliveryView',
  components: {
    Modal,
  },
  setup() {
    const { showToast } = useToast()

    // État des données
    const deliveries = ref([])
    const loading = ref(true)
    const stats = ref({
      totalDeliveries: 0,
      totalDonations: 0,
      completedDeliveries: 0,
      totalRevenue: 0,
    })

    // État de la pagination
    const currentPage = ref(1)
    const totalItems = ref(0)
    const itemsPerPage = ref(10)
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

    // État des filtres
    const filters = ref({
      status: '',
      commune: '',
      dateRange: 'all',
      startDate: null,
      endDate: null,
      search: '',
    })

    // État des modals
    const showDeliveryModal = ref(false)
    const showAssignModal = ref(false)
    const showCancelModal = ref(false)
    const showCreateModal = ref(false)

    // État des éléments sélectionnés
    const selectedDelivery = ref(null)
    const selectedDeliveryId = ref(null)
    const selectedCourierId = ref('')
    const sendNotification = ref(true)
    const cancelReason = ref('')

    // État pour la création d'une livraison
    const newDelivery = ref({
      clientId: '',
      pickupAddress: '',
      deliveryAddress: '',
      packageDescription: '',
      price: 2000,
      expressSurcharge: 1000,
      donationPercentage: 20,
      charityOrganization: '',
    })

    // Validation de la nouvelle livraison
    const isValidDelivery = computed(() => {
      const delivery = newDelivery.value

      if (!delivery.clientId) return false
      if (!delivery.pickupAddress.trim()) return false
      if (!delivery.deliveryAddress.trim()) return false
      if (delivery.price <= 0) return false
      if (delivery.expressSurcharge < 0) return false

      if (delivery.donationPercentage > 0 && !delivery.charityOrganization) return false

      return true
    })

    // Liste des coursiers disponibles
    const availableCouriers = ref([
      { id: 1, name: 'Amadou Diallo', phone: '77 123 45 67', rating: 4.8 },
      { id: 2, name: 'Fatou Sow', phone: '76 234 56 78', rating: 4.5 },
      { id: 3, name: 'Moussa Camara', phone: '70 345 67 89', rating: 4.9 },
      { id: 4, name: 'Aïssatou Bah', phone: '78 456 78 90', rating: 4.7 },
    ])

    // Liste des clients disponibles
    const availableClients = ref([
      { id: 1, name: 'Ibrahim Koné', phone: '77 987 65 43' },
      { id: 2, name: 'Mariam Touré', phone: '76 876 54 32' },
      { id: 3, name: 'Seydou Diop', phone: '70 765 43 21' },
      { id: 4, name: 'Aminata Cissé', phone: '78 654 32 10' },
    ])

    // Liste des organisations caritatives
    const charityOrganizations = ref([
      { name: 'Éducation Pour Tous', category: 'Éducation' },
      { name: 'Santé Communautaire', category: 'Santé' },
      { name: 'Planète Verte', category: 'Environnement' },
      { name: "Enfants d'Abord", category: 'Enfance' },
      { name: 'Solidarité Aînés', category: 'Personnes âgées' },
    ])

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
        const response = await getExpressDeliveries(
          filters.value.status,
          filters.value.commune,
          filters.value.search,
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
    const updateStats = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        await getExpressStats()
        stats.value = {
          totalDeliveries: 67,
          totalDonations: 125000,
          completedDeliveries: 52,
          totalRevenue: 670000,
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
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

    // Voir les détails d'une livraison
    const viewDeliveryDetails = async deliveryId => {
      try {
        loading.value = true
        const delivery = await getExpressDelivery(deliveryId)
        selectedDelivery.value = delivery
        showDeliveryModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la livraison:', error)
        showToast('Erreur lors du chargement des détails de la livraison', 'error')
      } finally {
        loading.value = false
      }
    }

    // Assigner un coursier
    const assignCourier = deliveryId => {
      selectedDeliveryId.value = deliveryId
      selectedCourierId.value = ''
      sendNotification.value = true
      showAssignModal.value = true
    }

    // Confirmer l'assignation d'un coursier
    const confirmAssignCourier = async () => {
      try {
        if (!selectedDeliveryId.value || !selectedCourierId.value) return

        await assignCourierToExpressDelivery(
          selectedDeliveryId.value,
          selectedCourierId.value,
          sendNotification.value
        )

        showToast('Coursier assigné avec succès', 'success')
        showAssignModal.value = false

        // Recharger les livraisons
        loadDeliveries()
      } catch (error) {
        console.error("Erreur lors de l'assignation du coursier:", error)
        showToast("Erreur lors de l'assignation du coursier", 'error')
      }
    }

    // Annuler une livraison
    const cancelDelivery = deliveryId => {
      selectedDeliveryId.value = deliveryId
      cancelReason.value = ''
      showCancelModal.value = true
    }

    // Confirmer l'annulation d'une livraison
    const confirmCancelDelivery = async () => {
      try {
        if (!selectedDeliveryId.value || !cancelReason.value.trim()) return

        await cancelExpressDelivery(selectedDeliveryId.value, cancelReason.value)

        showToast('Livraison annulée avec succès', 'success')
        showCancelModal.value = false

        // Recharger les livraisons
        loadDeliveries()
      } catch (error) {
        console.error("Erreur lors de l'annulation de la livraison:", error)
        showToast("Erreur lors de l'annulation de la livraison", 'error')
      }
    }

    // Marquer une livraison comme terminée
    const completeDelivery = async deliveryId => {
      try {
        await completeExpressDelivery(deliveryId)

        showToast('Livraison marquée comme terminée avec succès', 'success')

        // Recharger les livraisons
        loadDeliveries()
      } catch (error) {
        console.error('Erreur lors du marquage de la livraison comme terminée:', error)
        showToast('Erreur lors du marquage de la livraison comme terminée', 'error')
      }
    }

    // Ouvrir le modal de création
    const openCreateModal = () => {
      // Réinitialiser le formulaire
      newDelivery.value = {
        clientId: '',
        pickupAddress: '',
        deliveryAddress: '',
        packageDescription: '',
        price: 2000,
        expressSurcharge: 1000,
        donationPercentage: 20,
        charityOrganization: '',
      }

      showCreateModal.value = true
    }

    // Calculer le montant du don
    const calculateDonationAmount = () => {
      return (newDelivery.value.expressSurcharge * newDelivery.value.donationPercentage) / 100
    }

    // Créer une livraison
    const createDelivery = async () => {
      try {
        if (!isValidDelivery.value) return

        const deliveryData = {
          client_id: newDelivery.value.clientId,
          pickup_address: newDelivery.value.pickupAddress,
          delivery_address: newDelivery.value.deliveryAddress,
          package_description: newDelivery.value.packageDescription,
          price: newDelivery.value.price,
          express_surcharge: newDelivery.value.expressSurcharge,
          donation_percentage: newDelivery.value.donationPercentage,
          charity_organization: newDelivery.value.charityOrganization,
        }

        await createExpressDelivery(deliveryData)

        showToast('Livraison express créée avec succès', 'success')
        showCreateModal.value = false

        // Recharger les livraisons
        loadDeliveries()
      } catch (error) {
        console.error('Erreur lors de la création de la livraison:', error)
        showToast('Erreur lors de la création de la livraison', 'error')
      }
    }

    // Exporter les données
    const exportData = async () => {
      try {
        const dataToExport = deliveries.value.map(delivery => ({
          id: delivery.id,
          date: formatDate(delivery.created_at),
          client: delivery.client ? delivery.client.name : 'N/A',
          pickup_address: delivery.pickup_address,
          delivery_address: delivery.delivery_address,
          courier: delivery.courier ? delivery.courier.name : 'Non assigné',
          donation: delivery.donation ? delivery.donation.amount : 0,
          status: getStatusLabel(delivery.status),
          price: delivery.price,
        }))

        await exportExpressData(dataToExport, 'livraisons-express.csv')
        showToast('Données exportées avec succès', 'success')
      } catch (error) {
        console.error("Erreur lors de l'export des données:", error)
        showToast("Erreur lors de l'export des données", 'error')
      }
    }

    onMounted(() => {
      loadDeliveries()
    })

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
      showAssignModal,
      showCancelModal,
      showCreateModal,
      selectedDelivery,
      selectedDeliveryId,
      selectedCourierId,
      sendNotification,
      cancelReason,
      newDelivery,
      isValidDelivery,
      availableCouriers,
      availableClients,
      charityOrganizations,
      loadDeliveries,
      changePage,
      handleDateRangeChange,
      debounceSearch,
      formatDate,
      formatDateTime,
      formatCurrency,
      getStatusClass,
      getStatusLabel,
      viewDeliveryDetails,
      assignCourier,
      confirmAssignCourier,
      cancelDelivery,
      confirmCancelDelivery,
      completeDelivery,
      openCreateModal,
      calculateDonationAmount,
      createDelivery,
      exportData,
    }
  },
}
</script>

<style scoped>
.express-delivery-view {
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

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
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

.donation-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #16a34a;
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

.empty-courier,
.empty-donation {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
}

.empty-courier p,
.empty-donation p {
  margin-bottom: 1rem;
}

.donation-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.donation-amount,
.donation-organization,
.donation-status {
  display: flex;
  flex-direction: column;
}

.donation-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.donation-value {
  font-weight: 500;
  color: #1f2937;
}

.star-icon {
  color: #f59e0b;
  margin-right: 0.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.assign-courier-form,
.cancel-delivery-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.create-delivery-form {
  padding: 1rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
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

.donation-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f0fdf4;
  border-radius: 0.375rem;
  margin-top: 0.5rem;
}

.donation-preview-label {
  font-size: 0.875rem;
  color: #16a34a;
}

.donation-preview-amount {
  font-weight: 600;
  color: #16a34a;
}
</style>