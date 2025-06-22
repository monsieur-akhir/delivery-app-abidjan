
<template>
  <div class="multi-destination-deliveries">
    <!-- En-tête -->
    <div class="header-section">
      <div class="header-content">
        <h1 class="page-title">
          <i class="fas fa-route"></i>
          Livraisons Multi-Destinataires
        </h1>
        <p class="page-subtitle">
          Gérez vos livraisons avec plusieurs arrêts optimisés
        </p>
      </div>
      <div class="header-actions">
        <button 
          @click="showCreateModal = true" 
          class="btn btn-primary"
        >
          <i class="fas fa-plus"></i>
          Nouvelle Livraison Multi-Stop
        </button>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total }}</h3>
          <p>Total Livraisons</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pending }}</h3>
          <p>En Attente</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <i class="fas fa-check"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.completed }}</h3>
          <p>Terminées</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info">
          <i class="fas fa-euro-sign"></i>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.totalValue) }}</h3>
          <p>Valeur Totale</p>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label>Statut</label>
          <select v-model="filters.status" @change="loadDeliveries">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Acceptée</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Période</label>
          <select v-model="filters.period" @change="loadDeliveries">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Toutes</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Recherche</label>
          <input 
            type="text" 
            v-model="filters.search" 
            @input="debounceSearch"
            placeholder="Rechercher par adresse, destinataire..."
          >
        </div>
      </div>
    </div>

    <!-- Liste des livraisons -->
    <div class="deliveries-section">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des livraisons...</p>
      </div>

      <div v-else-if="deliveries.length === 0" class="empty-state">
        <i class="fas fa-box-open"></i>
        <h3>Aucune livraison multi-destinataires</h3>
        <p>Créez votre première livraison avec plusieurs arrêts</p>
        <button @click="showCreateModal = true" class="btn btn-primary">
          Créer une livraison
        </button>
      </div>

      <div v-else class="deliveries-grid">
        <div 
          v-for="delivery in deliveries" 
          :key="delivery.id"
          class="delivery-card"
          @click="viewDelivery(delivery.id)"
        >
          <!-- En-tête de la carte -->
          <div class="delivery-header">
            <div class="delivery-id">
              <strong>#MD{{ delivery.id }}</strong>
              <span class="destinations-count">
                {{ delivery.total_destinations }} arrêts
              </span>
            </div>
            <div class="delivery-status">
              <span :class="['status-badge', delivery.status]">
                {{ getStatusLabel(delivery.status) }}
              </span>
            </div>
          </div>

          <!-- Informations de ramassage -->
          <div class="pickup-info">
            <div class="address-line">
              <i class="fas fa-map-marker-alt pickup"></i>
              <div class="address-content">
                <strong>Ramassage:</strong>
                <span>{{ delivery.pickup_address }}, {{ delivery.pickup_commune }}</span>
              </div>
            </div>
          </div>

          <!-- Liste des destinations -->
          <div class="destinations-preview">
            <div class="destinations-header">
              <i class="fas fa-route"></i>
              <span>Destinations ({{ delivery.destinations?.length || 0 }})</span>
            </div>
            <div class="destinations-list">
              <div 
                v-for="(destination, index) in delivery.destinations?.slice(0, 3)" 
                :key="index"
                class="destination-item"
              >
                <span class="destination-number">{{ index + 1 }}</span>
                <div class="destination-content">
                  <span class="recipient">{{ destination.recipient_name }}</span>
                  <span class="address">{{ destination.delivery_address }}</span>
                </div>
                <span :class="['destination-status', destination.status || 'pending']">
                  <i :class="getDestinationIcon(destination.status)"></i>
                </span>
              </div>
              <div v-if="delivery.destinations?.length > 3" class="more-destinations">
                +{{ delivery.destinations.length - 3 }} autres destinations
              </div>
            </div>
          </div>

          <!-- Informations de livraison -->
          <div class="delivery-details">
            <div class="detail-row">
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>{{ formatDate(delivery.created_at) }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-route"></i>
                <span>{{ delivery.estimated_total_distance?.toFixed(1) || 0 }} km</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-euro-sign"></i>
                <span>{{ formatCurrency(delivery.total_final_price || delivery.total_proposed_price) }}</span>
              </div>
            </div>
          </div>

          <!-- Coursier assigné -->
          <div v-if="delivery.courier" class="courier-info">
            <div class="courier-avatar">
              <img 
                :src="delivery.courier.profile_picture || '/src/assets/default-avatar.png'" 
                :alt="delivery.courier.full_name"
              >
            </div>
            <div class="courier-details">
              <span class="courier-name">{{ delivery.courier.full_name }}</span>
              <span class="courier-phone">{{ delivery.courier.phone }}</span>
            </div>
            <div class="courier-rating">
              <i class="fas fa-star"></i>
              <span>{{ delivery.courier.rating?.toFixed(1) || 'N/A' }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="delivery-actions">
            <button 
              @click.stop="viewDelivery(delivery.id)" 
              class="btn btn-sm btn-outline"
            >
              <i class="fas fa-eye"></i>
              Voir détails
            </button>
            <button 
              v-if="delivery.status === 'pending'" 
              @click.stop="editDelivery(delivery.id)" 
              class="btn btn-sm btn-outline"
            >
              <i class="fas fa-edit"></i>
              Modifier
            </button>
            <button 
              v-if="['pending', 'accepted'].includes(delivery.status)" 
              @click.stop="cancelDelivery(delivery.id)" 
              class="btn btn-sm btn-danger"
            >
              <i class="fas fa-times"></i>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination-section">
      <button 
        @click="changePage(pagination.currentPage - 1)"
        :disabled="pagination.currentPage === 1"
        class="btn btn-outline"
      >
        <i class="fas fa-chevron-left"></i>
        Précédent
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          :class="['page-btn', { active: page === pagination.currentPage }]"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        @click="changePage(pagination.currentPage + 1)"
        :disabled="pagination.currentPage === pagination.totalPages"
        class="btn btn-outline"
      >
        Suivant
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal de création -->
    <CreateMultiDestinationModal 
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onDeliveryCreated"
    />

    <!-- Modal de détails -->
    <MultiDestinationDetailsModal 
      v-if="showDetailsModal"
      :delivery-id="selectedDeliveryId"
      @close="showDetailsModal = false"
      @updated="loadDeliveries"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import multiDestinationApi from '@/api/multi-destination-deliveries'
import CreateMultiDestinationModal from '@/components/modals/CreateMultiDestinationModal.vue'
import MultiDestinationDetailsModal from '@/components/modals/MultiDestinationDetailsModal.vue'

export default {
  name: 'MultiDestinationDeliveriesView',
  components: {
    CreateMultiDestinationModal,
    MultiDestinationDetailsModal
  },
  setup() {
    const { showToast } = useToast()
    
    // État réactif
    const loading = ref(false)
    const deliveries = ref([])
    const showCreateModal = ref(false)
    const showDetailsModal = ref(false)
    const selectedDeliveryId = ref(null)
    
    const stats = reactive({
      total: 0,
      pending: 0,
      completed: 0,
      totalValue: 0
    })
    
    const filters = reactive({
      status: '',
      period: 'month',
      search: ''
    })
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 12,
      totalItems: 0,
      totalPages: 0
    })
    
    // Computed
    const visiblePages = computed(() => {
      const current = pagination.currentPage
      const total = pagination.totalPages
      const delta = 2
      const range = []
      
      for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i)
      }
      
      if (current - delta > 2) {
        range.unshift('...')
      }
      if (current + delta < total - 1) {
        range.push('...')
      }
      
      range.unshift(1)
      if (total > 1) {
        range.push(total)
      }
      
      return range
    })
    
    // Méthodes
    const loadDeliveries = async (page = 1) => {
      try {
        loading.value = true
        
        const params = {
          page,
          limit: pagination.pageSize,
          status: filters.status || undefined,
          period: filters.period,
          search: filters.search || undefined
        }
        
        const response = await multiDestinationApi.getDeliveries(params)
        
        deliveries.value = response.data
        pagination.currentPage = response.pagination.page
        pagination.totalItems = response.pagination.total
        pagination.totalPages = response.pagination.pages
        
        // Calculer les statistiques
        calculateStats()
        
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons:', error)
        showToast('Erreur lors du chargement des livraisons', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const calculateStats = () => {
      const all = deliveries.value
      stats.total = all.length
      stats.pending = all.filter(d => d.status === 'pending').length
      stats.completed = all.filter(d => d.status === 'completed').length
      stats.totalValue = all.reduce((sum, d) => sum + (d.total_final_price || d.total_proposed_price), 0)
    }
    
    const viewDelivery = (deliveryId) => {
      selectedDeliveryId.value = deliveryId
      showDetailsModal.value = true
    }
    
    const editDelivery = (deliveryId) => {
      // TODO: Implémenter l'édition
      showToast('Fonctionnalité d\'édition en cours de développement', 'info')
    }
    
    const cancelDelivery = async (deliveryId) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) return
      
      try {
        await multiDestinationApi.cancelDelivery(deliveryId)
        showToast('Livraison annulée avec succès', 'success')
        loadDeliveries()
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error)
        showToast('Erreur lors de l\'annulation de la livraison', 'error')
      }
    }
    
    const onDeliveryCreated = (delivery) => {
      showCreateModal.value = false
      showToast('Livraison créée avec succès', 'success')
      loadDeliveries()
    }
    
    const changePage = (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        loadDeliveries(page)
      }
    }
    
    let searchTimeout
    const debounceSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        loadDeliveries(1)
      }, 500)
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
    
    const getDestinationIcon = (status) => {
      const icons = {
        pending: 'fas fa-clock',
        arrived: 'fas fa-map-marker-alt',
        delivered: 'fas fa-check-circle',
        failed: 'fas fa-times-circle'
      }
      return icons[status] || 'fas fa-clock'
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
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount)
    }
    
    // Lifecycle
    onMounted(() => {
      loadDeliveries()
    })
    
    return {
      loading,
      deliveries,
      stats,
      filters,
      pagination,
      showCreateModal,
      showDetailsModal,
      selectedDeliveryId,
      visiblePages,
      loadDeliveries,
      viewDelivery,
      editDelivery,
      cancelDelivery,
      onDeliveryCreated,
      changePage,
      debounceSearch,
      getStatusLabel,
      getDestinationIcon,
      formatDate,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.multi-destination-deliveries {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* En-tête */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.header-content h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-content h1 i {
  color: #3b82f6;
}

.page-subtitle {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.header-actions .btn {
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* Statistiques */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 24px;
}

.stat-icon.active {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.success {
  background: #d1fae5;
  color: #059669;
}

.stat-icon.info {
  background: #dbeafe;
  color: #2563eb;
}

.stat-content h3 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.stat-content p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

/* Filtres */
.filters-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.filter-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* États vides */
.loading-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.loading-state i {
  font-size: 48px;
  color: #3b82f6;
  margin-bottom: 16px;
}

.empty-state i {
  font-size: 64px;
  color: #d1d5db;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 24px;
  color: #111827;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 24px;
}

/* Grille des livraisons */
.deliveries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.delivery-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delivery-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.12);
  border-color: #3b82f6;
}

/* En-tête de carte */
.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.delivery-id strong {
  font-size: 18px;
  color: #111827;
}

.destinations-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.accepted {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.in_progress {
  background: #ecfdf5;
  color: #059669;
}

.status-badge.completed {
  background: #d1fae5;
  color: #047857;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* Informations de ramassage */
.pickup-info {
  margin-bottom: 20px;
}

.address-line {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.address-line i {
  margin-top: 4px;
  font-size: 16px;
}

.address-line i.pickup {
  color: #059669;
}

.address-content strong {
  display: block;
  color: #111827;
  margin-bottom: 4px;
}

.address-content span {
  color: #6b7280;
  font-size: 14px;
}

/* Prévisualisation des destinations */
.destinations-preview {
  margin-bottom: 20px;
}

.destinations-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.destinations-header i {
  color: #3b82f6;
}

.destinations-list {
  space-y: 8px;
}

.destination-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f9fafb;
}

.destination-item:last-child {
  border-bottom: none;
}

.destination-number {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.destination-content {
  flex: 1;
}

.destination-content .recipient {
  display: block;
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.destination-content .address {
  display: block;
  color: #6b7280;
  font-size: 12px;
}

.destination-status {
  font-size: 16px;
}

.destination-status.pending {
  color: #d97706;
}

.destination-status.arrived {
  color: #2563eb;
}

.destination-status.delivered {
  color: #059669;
}

.destination-status.failed {
  color: #dc2626;
}

.more-destinations {
  text-align: center;
  padding: 8px;
  color: #6b7280;
  font-size: 12px;
  font-style: italic;
}

/* Détails de livraison */
.delivery-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.detail-item i {
  color: #9ca3af;
}

/* Informations coursier */
.courier-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.courier-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.courier-details {
  flex: 1;
}

.courier-name {
  display: block;
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.courier-phone {
  display: block;
  color: #6b7280;
  font-size: 12px;
}

.courier-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-size: 14px;
  font-weight: 600;
}

/* Actions */
.delivery-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-danger {
  border-color: #dc2626;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fee2e2;
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.page-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Responsive */
@media (max-width: 768px) {
  .multi-destination-deliveries {
    padding: 16px;
  }
  
  .header-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .deliveries-grid {
    grid-template-columns: 1fr;
  }
  
  .delivery-actions {
    justify-content: center;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
