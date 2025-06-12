
<template>
  <div class="delivery-management">
    <div class="page-header">
      <div class="header-content">
        <h1>Gestion des Livraisons</h1>
        <p class="subtitle">Supervision et contrôle de toutes les livraisons</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="showCreateDelivery = true">
          <i class="fas fa-plus"></i> Nouvelle Livraison
        </button>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>En Attente</h3>
          <div class="stat-value">{{ stats.pending || 0 }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon progress">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <h3>En Cours</h3>
          <div class="stat-value">{{ stats.in_progress || 0 }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>Terminées</h3>
          <div class="stat-value">{{ stats.completed || 0 }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon revenue">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <h3>Revenus Aujourd'hui</h3>
          <div class="stat-value">{{ formatPrice(stats.revenue || 0) }} FCFA</div>
        </div>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Rechercher par ID, client, coursier..."
          @input="debouncedSearch"
        >
      </div>
      <div class="filters">
        <select v-model="filters.status" @change="fetchDeliveries">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="accepted">Acceptée</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
        <select v-model="filters.commune" @change="fetchDeliveries">
          <option value="">Toutes les communes</option>
          <option v-for="commune in communes" :key="commune" :value="commune">
            {{ commune }}
          </option>
        </select>
        <input 
          v-model="filters.startDate" 
          type="date" 
          @change="fetchDeliveries"
        >
        <input 
          v-model="filters.endDate" 
          type="date" 
          @change="fetchDeliveries"
        >
      </div>
    </div>

    <!-- Tableau des livraisons -->
    <div class="deliveries-table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des livraisons...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="fetchDeliveries">Réessayer</button>
      </div>
      
      <div v-else-if="deliveries.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>Aucune livraison trouvée</p>
      </div>
      
      <table v-else class="deliveries-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Coursier</th>
            <th>Trajet</th>
            <th>Statut</th>
            <th>Prix</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="delivery in deliveries" :key="delivery.id" class="delivery-row">
            <td class="delivery-id">#{{ delivery.id }}</td>
            <td class="client-info">
              <div class="user-info">
                <img 
                  :src="delivery.client?.avatar || '/default-avatar.png'" 
                  :alt="delivery.client?.name"
                  class="user-avatar"
                >
                <div>
                  <div class="user-name">{{ delivery.client?.name || 'Inconnu' }}</div>
                  <div class="user-phone">{{ delivery.client?.phone || '' }}</div>
                </div>
              </div>
            </td>
            <td class="courier-info">
              <div v-if="delivery.courier" class="user-info">
                <img 
                  :src="delivery.courier.avatar || '/default-avatar.png'" 
                  :alt="delivery.courier.name"
                  class="user-avatar"
                >
                <div>
                  <div class="user-name">{{ delivery.courier.name }}</div>
                  <div class="user-rating">
                    <i class="fas fa-star"></i>
                    {{ delivery.courier.rating || 'N/A' }}
                  </div>
                </div>
              </div>
              <span v-else class="no-courier">Non assigné</span>
            </td>
            <td class="route-info">
              <div class="route">
                <div class="pickup">
                  <i class="fas fa-circle pickup-icon"></i>
                  {{ truncateAddress(delivery.pickup_address) }}
                </div>
                <div class="delivery">
                  <i class="fas fa-map-marker-alt delivery-icon"></i>
                  {{ truncateAddress(delivery.delivery_address) }}
                </div>
              </div>
            </td>
            <td>
              <span :class="['status-badge', delivery.status]">
                {{ getStatusLabel(delivery.status) }}
              </span>
            </td>
            <td class="price">{{ formatPrice(delivery.price) }} FCFA</td>
            <td class="date">{{ formatDate(delivery.created_at) }}</td>
            <td class="actions">
              <button 
                class="btn-icon btn-primary" 
                @click="viewDelivery(delivery)"
                title="Voir détails"
              >
                <i class="fas fa-eye"></i>
              </button>
              <button 
                v-if="delivery.status === 'pending'" 
                class="btn-icon btn-warning" 
                @click="assignCourier(delivery)"
                title="Assigner coursier"
              >
                <i class="fas fa-user-plus"></i>
              </button>
              <button 
                class="btn-icon btn-danger" 
                @click="cancelDelivery(delivery)"
                title="Annuler"
                :disabled="delivery.status === 'completed' || delivery.status === 'cancelled'"
              >
                <i class="fas fa-times"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="btn btn-outline" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="page-info">
        Page {{ currentPage }} sur {{ totalPages }}
      </span>
      <button 
        class="btn btn-outline" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal de détails -->
    <Modal v-if="selectedDelivery" @close="selectedDelivery = null">
      <template #header>
        <h3>Détails de la Livraison #{{ selectedDelivery.id }}</h3>
      </template>
      <template #body>
        <div class="delivery-details">
          <div class="detail-section">
            <h4>Informations Générales</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Statut:</label>
                <span :class="['status-badge', selectedDelivery.status]">
                  {{ getStatusLabel(selectedDelivery.status) }}
                </span>
              </div>
              <div class="detail-item">
                <label>Prix:</label>
                <span>{{ formatPrice(selectedDelivery.price) }} FCFA</span>
              </div>
              <div class="detail-item">
                <label>Distance:</label>
                <span>{{ selectedDelivery.distance || 'N/A' }} km</span>
              </div>
              <div class="detail-item">
                <label>Temps estimé:</label>
                <span>{{ selectedDelivery.estimated_time || 'N/A' }} min</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>Trajet</h4>
            <div class="route-details">
              <div class="route-point pickup">
                <i class="fas fa-circle"></i>
                <div>
                  <strong>Point de collecte</strong>
                  <p>{{ selectedDelivery.pickup_address }}</p>
                </div>
              </div>
              <div class="route-point delivery">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                  <strong>Point de livraison</strong>
                  <p>{{ selectedDelivery.delivery_address }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedDelivery.description" class="detail-section">
            <h4>Description</h4>
            <p>{{ selectedDelivery.description }}</p>
          </div>

          <div class="detail-section">
            <h4>Historique</h4>
            <div class="timeline">
              <div v-for="event in selectedDelivery.timeline || []" :key="event.id" class="timeline-item">
                <div class="timeline-icon">
                  <i :class="getTimelineIcon(event.type)"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ event.title }}</div>
                  <div class="timeline-time">{{ formatDateTime(event.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn btn-outline" @click="selectedDelivery = null">
          Fermer
        </button>
        <button 
          v-if="selectedDelivery.status !== 'completed' && selectedDelivery.status !== 'cancelled'"
          class="btn btn-danger" 
          @click="cancelDelivery(selectedDelivery)"
        >
          Annuler la livraison
        </button>
      </template>
    </Modal>

    <!-- Modal d'assignation de coursier -->
    <Modal v-if="showAssignCourier" @close="showAssignCourier = false">
      <template #header>
        <h3>Assigner un Coursier</h3>
      </template>
      <template #body>
        <div class="courier-assignment">
          <div class="available-couriers">
            <h4>Coursiers Disponibles</h4>
            <div v-if="availableCouriers.length === 0" class="empty-state">
              <p>Aucun coursier disponible dans la zone</p>
            </div>
            <div v-else class="couriers-list">
              <div 
                v-for="courier in availableCouriers" 
                :key="courier.id" 
                class="courier-item"
                :class="{ selected: selectedCourierId === courier.id }"
                @click="selectedCourierId = courier.id"
              >
                <img 
                  :src="courier.avatar || '/default-avatar.png'" 
                  :alt="courier.name"
                  class="courier-avatar"
                >
                <div class="courier-info">
                  <div class="courier-name">{{ courier.name }}</div>
                  <div class="courier-rating">
                    <i class="fas fa-star"></i>
                    {{ courier.rating || 'N/A' }}
                  </div>
                  <div class="courier-vehicle">{{ courier.vehicle_type }}</div>
                </div>
                <div class="courier-distance">
                  {{ courier.distance || 'N/A' }} km
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button class="btn btn-outline" @click="showAssignCourier = false">
          Annuler
        </button>
        <button 
          class="btn btn-primary" 
          @click="confirmCourierAssignment"
          :disabled="!selectedCourierId"
        >
          Assigner
        </button>
      </template>
    </Modal>

    <!-- Modal de création de livraison -->
    <Modal v-if="showCreateDelivery" @close="showCreateDelivery = false">
      <template #header>
        <h3>Créer une Nouvelle Livraison</h3>
      </template>
      <template #body>
        <form @submit.prevent="createDelivery" class="delivery-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="clientSelect">Client</label>
              <select id="clientSelect" v-model="newDelivery.client_id" required>
                <option value="">Sélectionner un client</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }} - {{ client.phone }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="pickupAddress">Adresse de collecte</label>
              <input 
                id="pickupAddress"
                v-model="newDelivery.pickup_address" 
                type="text" 
                required
                placeholder="Entrez l'adresse de collecte"
              >
            </div>
            <div class="form-group">
              <label for="deliveryAddress">Adresse de livraison</label>
              <input 
                id="deliveryAddress"
                v-model="newDelivery.delivery_address" 
                type="text" 
                required
                placeholder="Entrez l'adresse de livraison"
              >
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description"
                v-model="newDelivery.description" 
                placeholder="Description du colis (optionnel)"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="priority">Priorité</label>
              <select id="priority" v-model="newDelivery.priority">
                <option value="normal">Normale</option>
                <option value="high">Élevée</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div class="form-group">
              <label for="scheduledFor">Programmer pour (optionnel)</label>
              <input 
                id="scheduledFor"
                v-model="newDelivery.scheduled_for" 
                type="datetime-local"
              >
            </div>
          </div>
        </form>
      </template>
      <template #footer>
        <button class="btn btn-outline" @click="showCreateDelivery = false">
          Annuler
        </button>
        <button class="btn btn-primary" @click="createDelivery">
          Créer la Livraison
        </button>
      </template>
    </Modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { debounce } from 'lodash'
import Modal from '@/components/ui/Modal.vue'
import deliveriesApi from '@/api/deliveries'
import { formatPrice, formatDate, formatDateTime } from '@/utils/formatters'

export default {
  name: 'DeliveryManagementView',
  components: {
    Modal
  },
  setup() {
    // État réactif
    const loading = ref(false)
    const error = ref(null)
    const deliveries = ref([])
    const stats = ref({})
    const searchQuery = ref('')
    const selectedDelivery = ref(null)
    const showAssignCourier = ref(false)
    const showCreateDelivery = ref(false)
    const availableCouriers = ref([])
    const selectedCourierId = ref(null)
    const clients = ref([])
    const communes = ref([
      'Plateau', 'Cocody', 'Yopougon', 'Marcory', 'Treichville',
      'Adjamé', 'Attécoubé', 'Koumassi', 'Port-Bouët', 'Abobo'
    ])

    // Pagination
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalItems = ref(0)

    // Filtres
    const filters = reactive({
      status: '',
      commune: '',
      startDate: '',
      endDate: ''
    })

    // Nouvelle livraison
    const newDelivery = reactive({
      client_id: '',
      pickup_address: '',
      delivery_address: '',
      description: '',
      priority: 'normal',
      scheduled_for: ''
    })

    // Computed
    const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

    // Méthodes
    const fetchDeliveries = async () => {
      loading.value = true
      error.value = null

      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          search: searchQuery.value,
          ...filters
        }

        const response = await deliveriesApi.getAllDeliveries(params)
        deliveries.value = response.deliveries || []
        totalItems.value = response.total || 0
        stats.value = response.stats || {}
      } catch (err) {
        console.error('Erreur lors du chargement des livraisons:', err)
        error.value = 'Impossible de charger les livraisons'
      } finally {
        loading.value = false
      }
    }

    const debouncedSearch = debounce(() => {
      currentPage.value = 1
      fetchDeliveries()
    }, 300)

    const refreshData = () => {
      fetchDeliveries()
    }

    const changePage = (page) => {
      currentPage.value = page
      fetchDeliveries()
    }

    const viewDelivery = (delivery) => {
      selectedDelivery.value = delivery
    }

    const assignCourier = async (delivery) => {
      try {
        selectedDelivery.value = delivery
        showAssignCourier.value = true
        
        // Charger les coursiers disponibles
        const response = await deliveriesApi.getAvailableCouriers({
          pickup_lat: delivery.pickup_latitude,
          pickup_lng: delivery.pickup_longitude,
          radius: 10
        })
        
        availableCouriers.value = response
      } catch (err) {
        console.error('Erreur lors du chargement des coursiers:', err)
        error.value = 'Impossible de charger les coursiers disponibles'
      }
    }

    const confirmCourierAssignment = async () => {
      try {
        loading.value = true
        
        await deliveriesApi.assignCourier(selectedDelivery.value.id, selectedCourierId.value)
        
        showAssignCourier.value = false
        selectedCourierId.value = null
        selectedDelivery.value = null
        
        await fetchDeliveries()
      } catch (err) {
        console.error('Erreur lors de l\'assignation:', err)
        error.value = 'Impossible d\'assigner le coursier'
      } finally {
        loading.value = false
      }
    }

    const cancelDelivery = async (delivery) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) {
        return
      }

      try {
        loading.value = true
        
        await deliveriesApi.updateDeliveryStatus(delivery.id, 'cancelled')
        
        selectedDelivery.value = null
        await fetchDeliveries()
      } catch (err) {
        console.error('Erreur lors de l\'annulation:', err)
        error.value = 'Impossible d\'annuler la livraison'
      } finally {
        loading.value = false
      }
    }

    const createDelivery = async () => {
      try {
        loading.value = true
        
        await deliveriesApi.createDelivery(newDelivery)
        
        showCreateDelivery.value = false
        
        // Réinitialiser le formulaire
        Object.assign(newDelivery, {
          client_id: '',
          pickup_address: '',
          delivery_address: '',
          description: '',
          priority: 'normal',
          scheduled_for: ''
        })
        
        await fetchDeliveries()
      } catch (err) {
        console.error('Erreur lors de la création:', err)
        error.value = 'Impossible de créer la livraison'
      } finally {
        loading.value = false
      }
    }

    // Utilitaires
    const getStatusLabel = (status) => {
      const labels = {
        pending: 'En attente',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée'
      }
      return labels[status] || status
    }

    const truncateAddress = (address) => {
      if (!address) return ''
      return address.length > 30 ? address.substring(0, 30) + '...' : address
    }

    const getTimelineIcon = (type) => {
      const icons = {
        created: 'fas fa-plus',
        assigned: 'fas fa-user-check',
        pickup: 'fas fa-box',
        delivery: 'fas fa-check',
        cancelled: 'fas fa-times'
      }
      return icons[type] || 'fas fa-circle'
    }

    // Lifecycle
    onMounted(() => {
      fetchDeliveries()
    })

    return {
      // État
      loading,
      error,
      deliveries,
      stats,
      searchQuery,
      selectedDelivery,
      showAssignCourier,
      showCreateDelivery,
      availableCouriers,
      selectedCourierId,
      clients,
      communes,
      currentPage,
      totalPages,
      filters,
      newDelivery,

      // Méthodes
      fetchDeliveries,
      debouncedSearch,
      refreshData,
      changePage,
      viewDelivery,
      assignCourier,
      confirmCourierAssignment,
      cancelDelivery,
      createDelivery,
      getStatusLabel,
      truncateAddress,
      getTimelineIcon,

      // Utilitaires
      formatPrice,
      formatDate,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.delivery-management {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-icon.pending { background: rgba(255, 193, 7, 0.1); color: #ffc107; }
.stat-icon.progress { background: rgba(0, 123, 255, 0.1); color: #007bff; }
.stat-icon.completed { background: rgba(40, 167, 69, 0.1); color: #28a745; }
.stat-icon.revenue { background: rgba(108, 117, 125, 0.1); color: #6c757d; }

.stat-content h3 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.filters-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.filters select,
.filters input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.deliveries-table-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.deliveries-table {
  width: 100%;
  border-collapse: collapse;
}

.deliveries-table th,
.deliveries-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.deliveries-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.delivery-id {
  font-weight: 600;
  color: #007bff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.user-phone,
.user-rating {
  font-size: 0.8rem;
  color: #6c757d;
}

.route-info .route {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pickup,
.delivery {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.pickup-icon {
  color: #28a745;
  font-size: 0.6rem;
}

.delivery-icon {
  color: #dc3545;
  font-size: 0.8rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background: rgba(255, 193, 7, 0.1);
  color: #856404;
}

.status-badge.accepted,
.status-badge.in_progress {
  background: rgba(0, 123, 255, 0.1);
  color: #004085;
}

.status-badge.completed {
  background: rgba(40, 167, 69, 0.1);
  color: #155724;
}

.status-badge.cancelled {
  background: rgba(220, 53, 69, 0.1);
  color: #721c24;
}

.price {
  font-weight: 600;
  color: #28a745;
}

.date {
  font-size: 0.9rem;
  color: #6c757d;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon.btn-primary {
  background: #007bff;
  color: white;
}

.btn-icon.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-icon.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.loading-state,
.error-state,
.empty-state {
  padding: 3rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  font-size: 0.9rem;
  color: #6c757d;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-outline {
  background: white;
  border: 1px solid #ced4da;
  color: #495057;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.delivery-details {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  margin: 0 0 1rem;
  color: #495057;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.9rem;
}

.route-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route-point {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
}

.route-point i {
  margin-top: 0.25rem;
}

.route-point.pickup i {
  color: #28a745;
}

.route-point.delivery i {
  color: #dc3545;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timeline-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.timeline-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.courier-assignment {
  max-height: 60vh;
  overflow-y: auto;
}

.couriers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 40vh;
  overflow-y: auto;
}

.courier-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.courier-item:hover {
  background: #f8f9fa;
}

.courier-item.selected {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.05);
}

.courier-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.courier-info {
  flex: 1;
}

.courier-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.courier-rating,
.courier-vehicle {
  font-size: 0.8rem;
  color: #6c757d;
}

.courier-distance {
  font-weight: 500;
  color: #007bff;
}

.delivery-form {
  max-height: 60vh;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

@media (max-width: 768px) {
  .delivery-management {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .filters {
    grid-template-columns: 1fr;
  }
  
  .deliveries-table-container {
    overflow-x: auto;
  }
  
  .deliveries-table {
    min-width: 800px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
