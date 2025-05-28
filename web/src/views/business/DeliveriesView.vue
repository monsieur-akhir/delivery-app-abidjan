<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="deliveries-view">
    <div class="page-header">
      <h1>Livraisons</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="openCreateDeliveryModal">
          <font-awesome-icon icon="plus" class="mr-1" />
          Nouvelle livraison
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" class="form-control">
            <option value="">Tous les statuts</option>
            <option v-for="(status, key) in DELIVERY_STATUSES" :key="key" :value="key">
              {{ status.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="date-filter">Période</label>
          <select id="date-filter" v-model="filters.period" class="form-control">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>
        <div class="filter-group" v-if="filters.period === 'custom'">
          <label for="start-date">Du</label>
          <input type="date" id="start-date" v-model="filters.startDate" class="form-control" />
        </div>
        <div class="filter-group" v-if="filters.period === 'custom'">
          <label for="end-date">Au</label>
          <input type="date" id="end-date" v-model="filters.endDate" class="form-control" />
        </div>
        <div class="filter-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input 
              type="text" 
              id="search" 
              v-model="filters.search" 
              class="form-control" 
              placeholder="ID, client, adresse..." 
            />
            <button class="search-button" @click="applyFilters">
              <font-awesome-icon icon="search" />
            </button>
          </div>
        </div>
      </div>
      <div class="filters-actions">
        <button class="btn btn-outline btn-sm" @click="resetFilters">
          <font-awesome-icon icon="times" class="mr-1" />
          Réinitialiser
        </button>
        <button class="btn btn-primary btn-sm" @click="applyFilters">
          <font-awesome-icon icon="filter" class="mr-1" />
          Filtrer
        </button>
      </div>
    </div>

    <div class="deliveries-stats">
      <div class="stat-card" v-for="(stat, index) in deliveryStats" :key="index">
        <div class="stat-icon" :class="`bg-${stat.color}`">
          <font-awesome-icon :icon="stat.icon" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stat.value }}</h3>
          <p class="stat-label">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Liste des livraisons</h2>
        <div class="card-actions">
          <div class="view-toggle">
            <button 
              class="view-toggle-btn" 
              :class="{ active: viewMode === 'list' }" 
              @click="viewMode = 'list'"
            >
              <font-awesome-icon icon="list" />
            </button>
            <button 
              class="view-toggle-btn" 
              :class="{ active: viewMode === 'grid' }" 
              @click="viewMode = 'grid'"
            >
              <font-awesome-icon icon="th-large" />
            </button>
          </div>
          <div class="export-dropdown">
            <button class="btn-icon" @click="toggleExportMenu">
              <font-awesome-icon icon="download" />
            </button>
            <div class="export-menu" v-if="showExportMenu">
              <button class="export-option" @click="exportDeliveries('csv')">
                <font-awesome-icon icon="file-csv" class="mr-1" />
                Exporter en CSV
              </button>
              <button class="export-option" @click="exportDeliveries('excel')">
                <font-awesome-icon icon="file-excel" class="mr-1" />
                Exporter en Excel
              </button>
              <button class="export-option" @click="exportDeliveries('pdf')">
                <font-awesome-icon icon="file-pdf" class="mr-1" />
                Exporter en PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-state">
          <font-awesome-icon icon="spinner" spin size="2x" />
          <p>Chargement des livraisons...</p>
        </div>
        
        <div v-else-if="deliveries.length === 0" class="empty-state">
          <font-awesome-icon icon="box-open" size="2x" />
          <p>Aucune livraison trouvée</p>
          <button class="btn btn-primary" @click="openCreateDeliveryModal">
            Créer une livraison
          </button>
        </div>
        
        <div v-else>
          <!-- Vue liste -->
          <div v-if="viewMode === 'list'" class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Adresse</th>
                  <th>Coursier</th>
                  <th>Statut</th>
                  <th>Prix</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="delivery in deliveries" :key="delivery.id">
                  <td>#{{ delivery.id }}</td>
                  <td>
                    <div class="user-info">
                      <div class="user-avatar">
                        <img v-if="delivery.client?.profile_picture" :src="delivery.client.profile_picture" :alt="delivery.client?.full_name">
                        <div v-else class="avatar-placeholder">{{ getInitials(delivery.client?.full_name) }}</div>
                      </div>
                      <div class="user-name">{{ delivery.client?.full_name }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="address-info">
                      <div class="address-text">{{ truncateText(delivery.delivery_address, 30) }}</div>
                      <div class="address-commune">{{ delivery.delivery_commune }}</div>
                    </div>
                  </td>
                  <td>
                    <div v-if="delivery.courier" class="user-info">
                      <div class="user-avatar">
                        <img v-if="delivery.courier?.profile_picture" :src="delivery.courier.profile_picture" :alt="delivery.courier?.full_name">
                        <div v-else class="avatar-placeholder">{{ getInitials(delivery.courier?.full_name) }}</div>
                      </div>
                      <div class="user-name">{{ delivery.courier?.full_name }}</div>
                    </div>
                    <span v-else class="text-muted">Non assigné</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(delivery.status)">
                      {{ getStatusLabel(delivery.status) }}
                    </span>
                  </td>
                  <td>{{ formatPrice(delivery.final_price || delivery.proposed_price) }} FCFA</td>
                  <td>{{ formatDate(delivery.created_at) }}</td>
                  <td>
                    <div class="table-actions">
                      <router-link :to="`/business/deliveries/${delivery.id}`" class="btn-icon" title="Voir les détails">
                        <font-awesome-icon icon="eye" />
                      </router-link>
                      <button class="btn-icon" @click="openEditDeliveryModal(delivery)" title="Modifier" v-if="canEditDelivery(delivery)">
                        <font-awesome-icon icon="edit" />
                      </button>
                      <button class="btn-icon" @click="cancelDelivery(delivery.id)" title="Annuler" v-if="canCancelDelivery(delivery)">
                        <font-awesome-icon icon="times" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Vue grille -->
          <div v-else-if="viewMode === 'grid'" class="deliveries-grid">
            <div v-for="delivery in deliveries" :key="delivery.id" class="delivery-card">
              <div class="delivery-header">
                <div class="delivery-id">#{{ delivery.id }}</div>
                <span class="status-badge" :class="getStatusClass(delivery.status)">
                  {{ getStatusLabel(delivery.status) }}
                </span>
              </div>
              <div class="delivery-content">
                <div class="delivery-info">
                  <div class="info-item">
                    <font-awesome-icon icon="user" class="info-icon" />
                    <span>{{ delivery.client?.full_name || 'Client inconnu' }}</span>
                  </div>
                  <div class="info-item">
                    <font-awesome-icon icon="map-marker-alt" class="info-icon" />
                    <span>{{ truncateText(delivery.delivery_address, 40) }}</span>
                  </div>
                  <div class="info-item">
                    <font-awesome-icon icon="truck" class="info-icon" />
                    <span>{{ delivery.courier?.full_name || 'Non assigné' }}</span>
                  </div>
                  <div class="info-item">
                    <font-awesome-icon icon="money-bill" class="info-icon" />
                    <span>{{ formatPrice(delivery.final_price || delivery.proposed_price) }} FCFA</span>
                  </div>
                  <div class="info-item">
                    <font-awesome-icon icon="calendar" class="info-icon" />
                    <span>{{ formatDate(delivery.created_at) }}</span>
                  </div>
                </div>
              </div>
              <div class="delivery-footer">
                <router-link :to="`/business/deliveries/${delivery.id}`" class="btn btn-sm btn-outline">
                  <font-awesome-icon icon="eye" class="mr-1" />
                  Détails
                </router-link>
                <button class="btn btn-sm btn-outline" @click="openEditDeliveryModal(delivery)" v-if="canEditDelivery(delivery)">
                  <font-awesome-icon icon="edit" class="mr-1" />
                  Modifier
                </button>
                <button class="btn btn-sm btn-danger" @click="cancelDelivery(delivery.id)" v-if="canCancelDelivery(delivery)">
                  <font-awesome-icon icon="times" class="mr-1" />
                  Annuler
                </button>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <div class="pagination-container">
            <div class="pagination-info">
              Affichage de {{ paginationInfo.from }}-{{ paginationInfo.to }} sur {{ paginationInfo.total }} livraisons
            </div>
            <div class="pagination-controls">
              <button 
                class="pagination-button" 
                :disabled="currentPage === 1" 
                @click="changePage(currentPage - 1)"
              >
                <font-awesome-icon icon="chevron-left" />
              </button>
              <div class="pagination-pages">
                <button 
                  v-for="page in displayedPages" 
                  :key="page" 
                  class="pagination-page" 
                  :class="{ active: currentPage === page }"
                  @click="changePage(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button 
                class="pagination-button" 
                :disabled="currentPage === totalPages" 
                @click="changePage(currentPage + 1)"
              >
                <font-awesome-icon icon="chevron-right" />
              </button>
            </div>
            <div class="pagination-size">
              <select v-model="pageSize" @change="changePageSize" class="form-control">
                <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
                  {{ size }} par page
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création de livraison -->
    <div class="modal" v-if="showCreateModal">
      <div class="modal-backdrop" @click="showCreateModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nouvelle livraison</h3>
          <button class="modal-close" @click="showCreateModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createDelivery">
            <div class="form-group">
              <label for="pickup_address">Adresse de ramassage</label>
              <input type="text" id="pickup_address" v-model="newDelivery.pickup_address" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="pickup_commune">Commune de ramassage</label>
              <select id="pickup_commune" v-model="newDelivery.pickup_commune" class="form-control" required>
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="delivery_address">Adresse de livraison</label>
              <input type="text" id="delivery_address" v-model="newDelivery.delivery_address" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="delivery_commune">Commune de livraison</label>
              <select id="delivery_commune" v-model="newDelivery.delivery_commune" class="form-control" required>
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="package_description">Description du colis</label>
              <textarea id="package_description" v-model="newDelivery.package_description" class="form-control" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label for="package_size">Taille du colis</label>
              <select id="package_size" v-model="newDelivery.package_size" class="form-control" required>
                <option value="small">Petit (&lt; 5kg)</option>
                <option value="medium">Moyen (5-10kg)</option>
                <option value="large">Grand (> 10kg)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="proposed_price">Prix proposé (FCFA)</label>
              <input type="number" id="proposed_price" v-model="newDelivery.proposed_price" class="form-control" min="500" required />
            </div>
            <div class="form-group">
              <label for="notes">Notes supplémentaires</label>
              <textarea id="notes" v-model="newDelivery.notes" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showCreateModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <font-awesome-icon icon="spinner" spin v-if="isSubmitting" class="mr-1" />
                Créer la livraison
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de modification de livraison -->
    <div class="modal" v-if="showEditModal">
      <div class="modal-backdrop" @click="showEditModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Modifier la livraison #{{ editDelivery.id }}</h3>
          <button class="modal-close" @click="showEditModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateDelivery">
            <div class="form-group">
              <label for="edit_pickup_address">Adresse de ramassage</label>
              <input type="text" id="edit_pickup_address" v-model="editDelivery.pickup_address" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="edit_pickup_commune">Commune de ramassage</label>
              <select id="edit_pickup_commune" v-model="editDelivery.pickup_commune" class="form-control" required>
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_delivery_address">Adresse de livraison</label>
              <input type="text" id="edit_delivery_address" v-model="editDelivery.delivery_address" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="edit_delivery_commune">Commune de livraison</label>
              <select id="edit_delivery_commune" v-model="editDelivery.delivery_commune" class="form-control" required>
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_package_description">Description du colis</label>
              <textarea id="edit_package_description" v-model="editDelivery.package_description" class="form-control" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label for="edit_package_size">Taille du colis</label>
              <select id="edit_package_size" v-model="editDelivery.package_size" class="form-control" required>
                <option value="small">Petit (&lt; 5kg)</option>
                <option value="medium">Moyen (5-10kg)</option>
                <option value="large">Grand (> 10kg)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_proposed_price">Prix proposé (FCFA)</label>
              <input type="number" id="edit_proposed_price" v-model="editDelivery.proposed_price" class="form-control" min="500" required />
            </div>
            <div class="form-group">
              <label for="edit_notes">Notes supplémentaires</label>
              <textarea id="edit_notes" v-model="editDelivery.notes" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showEditModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <font-awesome-icon icon="spinner" spin v-if="isSubmitting" class="mr-1" />
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { 
  fetchBusinessDeliveries, 
  createBusinessDelivery, 
  updateBusinessDelivery, 
  cancelBusinessDelivery,
  exportBusinessDeliveries
} from '@/api/business'
import { formatDate, formatPrice, truncateText } from '@/utils/formatters'
import { exportToCSV, exportToPDF, exportToExcel } from '@/utils/export-utils'
import { DELIVERY_STATUSES, COMMUNES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/config'

export default {
  name: 'BusinessDeliveriesView',
  setup() {
    const loading = ref(false)
    const isSubmitting = ref(false)
    const deliveries = ref([])
    const viewMode = ref('list')
    const currentPage = ref(1)
    const totalPages = ref(1)
    const pageSize = ref(DEFAULT_PAGE_SIZE)
    const totalItems = ref(0)
    const showCreateModal = ref(false)
    const showEditModal = ref(false)
    const showExportMenu = ref(false)
    const communes = ref(COMMUNES)
    
    const newDelivery = reactive({
      pickup_address: '',
      pickup_commune: '',
      delivery_address: '',
      delivery_commune: '',
      package_description: '',
      package_size: 'small',
      proposed_price: 1000,
      notes: ''
    })
    
    const editDelivery = reactive({
      id: null,
      pickup_address: '',
      pickup_commune: '',
      delivery_address: '',
      delivery_commune: '',
      package_description: '',
      package_size: 'small',
      proposed_price: 1000,
      notes: '',
      status: ''
    })
    
    const filters = reactive({
      status: '',
      period: 'week',
      startDate: '',
      endDate: '',
      search: ''
    })
    
    const paginationInfo = computed(() => {
      const from = totalItems.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
      const to = Math.min(from + pageSize.value - 1, totalItems.value)
      
      return {
        from,
        to,
        total: totalItems.value
      }
    })
    
    const displayedPages = computed(() => {
      const pages = []
      const maxPagesToShow = 5
      
      if (totalPages.value <= maxPagesToShow) {
        // Afficher toutes les pages si leur nombre est inférieur ou égal à maxPagesToShow
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        // Toujours afficher la première page
        pages.push(1)
        
        // Calculer les pages à afficher autour de la page courante
        let startPage = Math.max(2, currentPage.value - Math.floor(maxPagesToShow / 2))
        let endPage = Math.min(totalPages.value - 1, startPage + maxPagesToShow - 3)
        
        // Ajuster startPage si endPage est trop petit
        startPage = Math.max(2, endPage - (maxPagesToShow - 3))
        
        // Ajouter des points de suspension si nécessaire
        if (startPage > 2) {
          pages.push('...')
        }
        
        // Ajouter les pages intermédiaires
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
        
        // Ajouter des points de suspension si nécessaire
        if (endPage < totalPages.value - 1) {
          pages.push('...')
        }
        
        // Toujours afficher la dernière page
        pages.push(totalPages.value)
      }
      
      return pages
    })
    
    const deliveryStats = computed(() => {
      // Calculer les statistiques à partir des données
      const total = deliveries.value.length
      const pending = deliveries.value.filter(d => d.status === 'pending').length
      const active = deliveries.value.filter(d => ['accepted', 'in_progress'].includes(d.status)).length
      const completed = deliveries.value.filter(d => d.status === 'completed').length
      
      return [
        {
          label: 'Total',
          value: total,
          icon: 'box',
          color: 'primary'
        },
        {
          label: 'En attente',
          value: pending,
          icon: 'clock',
          color: 'warning'
        },
        {
          label: 'En cours',
          value: active,
          icon: 'truck',
          color: 'info'
        },
        {
          label: 'Terminées',
          value: completed,
          icon: 'check',
          color: 'success'
        }
      ]
    })
    
    // Charger les livraisons
    const loadDeliveries = async () => {
      try {
        loading.value = true
        
        // Préparer les paramètres de requête
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          status: filters.status || undefined,
          search: filters.search || undefined
        }
        
        // Ajouter les dates si nécessaire
        if (filters.period === 'custom' && filters.startDate && filters.endDate) {
          params.start_date = filters.startDate
          params.end_date = filters.endDate
        } else if (filters.period !== 'custom') {
          params.period = filters.period
        }
        
        const response = await fetchBusinessDeliveries(params)
        
        deliveries.value = response.items
        totalItems.value = response.total
        totalPages.value = Math.ceil(response.total / pageSize.value)
        
        // Ajuster la page courante si elle dépasse le nombre total de pages
        if (currentPage.value > totalPages.value && totalPages.value > 0) {
          currentPage.value = totalPages.value
          await loadDeliveries()
        }
      } catch (error) {
        console.error('Error loading deliveries:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Changer de page
    const changePage = (page) => {
      if (page === '...') return
      
      currentPage.value = page
      loadDeliveries()
    }
    
    // Changer la taille de page
    const changePageSize = () => {
      currentPage.value = 1
      loadDeliveries()
    }
    
    // Appliquer les filtres
    const applyFilters = () => {
      currentPage.value = 1
      loadDeliveries()
    }
    
    // Réinitialiser les filtres
    const resetFilters = () => {
      filters.status = ''
      filters.period = 'week'
      filters.startDate = ''
      filters.endDate = ''
      filters.search = ''
      
      currentPage.value = 1
      loadDeliveries()
    }
    
    // Rafraîchir les données
    const refreshData = () => {
      loadDeliveries()
    }
    
    // Exporter les livraisons
    const exportDeliveries = async (format) => {
      try {
        showExportMenu.value = false
        loading.value = true
        
        // Préparer les paramètres d'exportation
        const params = {
          format,
          status: filters.status || undefined,
          search: filters.search || undefined
        }
        
        // Ajouter les dates si nécessaire
        if (filters.period === 'custom' && filters.startDate && filters.endDate) {
          params.start_date = filters.startDate
          params.end_date = filters.endDate
        } else if (filters.period !== 'custom') {
          params.period = filters.period
        }
        
        // Utiliser l'API d'exportation ou exporter localement
        if (format === 'csv') {
          // Exporter en CSV localement
          const headers = [
            { key: 'id', label: 'ID' },
            { key: 'client_name', label: 'Client' },
            { key: 'delivery_address', label: 'Adresse de livraison' },
            { key: 'delivery_commune', label: 'Commune de livraison' },
            { key: 'courier_name', label: 'Coursier' },
            { key: 'status', label: 'Statut' },
            { key: 'price', label: 'Prix (FCFA)' },
            { key: 'created_at', label: 'Date de création' }
          ]
          
          // Préparer les données pour l'exportation
          const exportData = deliveries.value.map(delivery => ({
            id: delivery.id,
            client_name: delivery.client?.full_name || 'N/A',
            delivery_address: delivery.delivery_address,
            delivery_commune: delivery.delivery_commune,
            courier_name: delivery.courier?.full_name || 'Non assigné',
            status: getStatusLabel(delivery.status),
            price: delivery.final_price || delivery.proposed_price,
            created_at: formatDate(delivery.created_at)
          }))
          
          exportToCSV(exportData, headers, `livraisons_${new Date().toISOString().split('T')[0]}.csv`)
        } else if (format === 'excel') {
          // Exporter en Excel localement
          const headers = [
            { key: 'id', label: 'ID' },
            { key: 'client_name', label: 'Client' },
            { key: 'delivery_address', label: 'Adresse de livraison' },
            { key: 'delivery_commune', label: 'Commune de livraison' },
            { key: 'courier_name', label: 'Coursier' },
            { key: 'status', label: 'Statut' },
            { key: 'price', label: 'Prix (FCFA)' },
            { key: 'created_at', label: 'Date de création' }
          ]
          
          // Préparer les données pour l'exportation
          const exportData = deliveries.value.map(delivery => ({
            id: delivery.id,
            client_name: delivery.client?.full_name || 'N/A',
            delivery_address: delivery.delivery_address,
            delivery_commune: delivery.delivery_commune,
            courier_name: delivery.courier?.full_name || 'Non assigné',
            status: getStatusLabel(delivery.status),
            price: delivery.final_price || delivery.proposed_price,
            created_at: formatDate(delivery.created_at)
          }))
          
          await exportToExcel(exportData, headers, `livraisons_${new Date().toISOString().split('T')[0]}.xlsx`)
        } else if (format === 'pdf') {
          // Exporter en PDF localement
          const columns = [
            { header: 'ID', dataKey: 'id' },
            { header: 'Client', dataKey: 'client_name' },
            { header: 'Adresse', dataKey: 'delivery_address' },
            { header: 'Coursier', dataKey: 'courier_name' },
            { header: 'Statut', dataKey: 'status' },
            { header: 'Prix (FCFA)', dataKey: 'price' },
            { header: 'Date', dataKey: 'created_at' }
          ]
          
          // Préparer les données pour l'exportation
          const exportData = deliveries.value.map(delivery => ({
            id: delivery.id,
            client_name: delivery.client?.full_name || 'N/A',
            delivery_address: delivery.delivery_address,
            courier_name: delivery.courier?.full_name || 'Non assigné',
            status: getStatusLabel(delivery.status),
            price: formatPrice(delivery.final_price || delivery.proposed_price),
            created_at: formatDate(delivery.created_at)
          }))
          
          const options = {
            title: 'Liste des livraisons',
            fileName: `livraisons_${new Date().toISOString().split('T')[0]}.pdf`,
            pageOrientation: 'landscape'
          }
          
          await exportToPDF(exportData, columns, options)
        } else {
          // Utiliser l'API d'exportation
          const blob = await exportBusinessDeliveries(params)
          
          // Créer un lien de téléchargement
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `livraisons_${new Date().toISOString().split('T')[0]}.${format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Error exporting deliveries:', error)
        alert(`Erreur lors de l'exportation des livraisons: ${error.message}`)
      } finally {
        loading.value = false
      }
    }
    
    // Afficher/masquer le menu d'exportation
    const toggleExportMenu = () => {
      showExportMenu.value = !showExportMenu.value
    }
    
    // Ouvrir le modal de création de livraison
    const openCreateDeliveryModal = () => {
      // Réinitialiser le formulaire
      Object.keys(newDelivery).forEach(key => {
        if (key === 'package_size') {
          newDelivery[key] = 'small'
        } else if (key === 'proposed_price') {
          newDelivery[key] = 1000
        } else {
          newDelivery[key] = ''
        }
      })
      
      showCreateModal.value = true
    }
    
    // Créer une nouvelle livraison
    const createDelivery = async () => {
      try {
        isSubmitting.value = true
        
        await createBusinessDelivery(newDelivery)
        
        showCreateModal.value = false
        loadDeliveries()
        
        // Afficher un message de succès
        alert('Livraison créée avec succès')
      } catch (error) {
        console.error('Error creating delivery:', error)
        alert(`Erreur lors de la création de la livraison: ${error.message}`)
      } finally {
        isSubmitting.value = false
      }
    }
    
    // Ouvrir le modal de modification de livraison
    const openEditDeliveryModal = (delivery) => {
      // Copier les données de la livraison
      Object.keys(editDelivery).forEach(key => {
        if (delivery[key] !== undefined) {
          editDelivery[key] = delivery[key]
        }
      })
      
      showEditModal.value = true
    }
    
    // Mettre à jour une livraison
    const updateDelivery = async () => {
      try {
        isSubmitting.value = true
        
        await updateBusinessDelivery(editDelivery.id, editDelivery)
        
        showEditModal.value = false
        loadDeliveries()
        
        // Afficher un message de succès
        alert('Livraison mise à jour avec succès')
      } catch (error) {
        console.error('Error updating delivery:', error)
        alert(`Erreur lors de la mise à jour de la livraison: ${error.message}`)
      } finally {
        isSubmitting.value = false
      }
    }
    
    // Annuler une livraison
    const cancelDelivery = async (id) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) {
        return
      }
      
      try {
        await cancelBusinessDelivery(id)
        
        loadDeliveries()
        
        // Afficher un message de succès
        alert('Livraison annulée avec succès')
      } catch (error) {
        console.error('Error cancelling delivery:', error)
        alert(`Erreur lors de l'annulation de la livraison: ${error.message}`)
      }
    }
    
    // Vérifier si une livraison peut être modifiée
    const canEditDelivery = (delivery) => {
      return ['pending'].includes(delivery.status)
    }
    
    // Vérifier si une livraison peut être annulée
    const canCancelDelivery = (delivery) => {
      return ['pending', 'accepted'].includes(delivery.status)
    }
    
    // Obtenir les initiales d'un nom
    const getInitials = (name) => {
      if (!name) return ''
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
    }
    
    // Obtenir la classe CSS pour un statut
    const getStatusClass = (status) => {
      return `status-${status}`
    }
    
    // Obtenir le libellé d'un statut
    const getStatusLabel = (status) => {
      return DELIVERY_STATUSES[status]?.label || status
    }
    
    // Fermer le menu d'exportation lorsque l'utilisateur clique ailleurs
    const handleClickOutside = (event) => {
      if (showExportMenu.value && !event.target.closest('.export-dropdown')) {
        showExportMenu.value = false
      }
    }
    
    onMounted(() => {
      loadDeliveries()
      document.addEventListener('click', handleClickOutside)
    })
    
    // Nettoyer les écouteurs d'événements
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      loading,
      isSubmitting,
      deliveries,
      viewMode,
      currentPage,
      totalPages,
      pageSize,
      totalItems,
      showCreateModal,
      showEditModal,
      showExportMenu,
      newDelivery,
      editDelivery,
      filters,
      communes,
      paginationInfo,
      displayedPages,
      deliveryStats,
      DELIVERY_STATUSES,
      PAGE_SIZE_OPTIONS,
      changePage,
      changePageSize,
      applyFilters,
      resetFilters,
      refreshData,
      exportDeliveries,
      toggleExportMenu,
      openCreateDeliveryModal,
      createDelivery,
      openEditDeliveryModal,
      updateDelivery,
      cancelDelivery,
      canEditDelivery,
      canCancelDelivery,
      getInitials,
      getStatusClass,
      getStatusLabel,
      formatDate,
      formatPrice,
      truncateText
    }
  }
}
</script>

<style scoped>
.deliveries-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.filters-section {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
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
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.search-input {
  position: relative;
}

.search-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.deliveries-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  font-size: 1.5rem;
}

.bg-primary {
  background-color: var(--primary-color);
}

.bg-info {
  background-color: var(--info-color);
}

.bg-success {
  background-color: var(--success-color);
}

.bg-warning {
  background-color: var(--warning-color);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-toggle {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-right: 0.5rem;
}

.view-toggle-btn {
  padding: 0.5rem;
  background-color: var(--background-color);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle-btn.active {
  background-color: var(--primary-color);
  color: white;
}

.export-dropdown {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-background);
  border-radius: 4px;
  box-shadow: 0 2px 8px var(--shadow-color);
  z-index: 10;
  min-width: 180px;
  margin-top: 0.5rem;
}

.export-option {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  color: var(--text-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-option:hover {
  background-color: var(--background-secondary);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: var(--primary-color);
  color: white;
}

.card-body {
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-state svg,
.empty-state svg {
  margin-bottom: 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.table th {
  font-weight: 600;
  color: var(--text-color);
}

.table td {
  color: var(--text-color);
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  background-color: var(--background-secondary);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
  color: var(--text-color);
}

.address-info {
  display: flex;
  flex-direction: column;
}

.address-text {
  font-weight: 500;
  color: var(--text-color);
}

.address-commune {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background-color: #FFF8E1;
  color: #FFA000;
}

.status-accepted {
  background-color: #E3F2FD;
  color: #1976D2;
}

.status-in_progress {
  background-color: #FFF0E8;
  color: #FF6B00;
}

.status-delivered {
  background-color: #E8F5E9;
  color: #388E3C;
}

.status-completed {
  background-color: #E8F5E9;
  color: #388E3C;
}

.status-cancelled {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
}

.deliveries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.delivery-card {
  background-color: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s;
}

.delivery-card:hover {
  box-shadow: 0 4px 12px var(--shadow-color);
  transform: translateY(-2px);
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.delivery-id {
  font-weight: 600;
  color: var(--text-color);
}

.delivery-content {
  padding: 1rem;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-icon {
  width: 20px;
  margin-right: 0.75rem;
  color: var(--text-secondary);
}

.delivery-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
}

.pagination-button {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button:not(:disabled):hover {
  background-color: var(--primary-color);
  color: white;
}

.pagination-pages {
  display: flex;
  margin: 0 0.5rem;
}

.pagination-page {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  border: none;
  cursor: pointer;
  margin: 0 0.25rem;
  transition: all 0.2s;
}

.pagination-page.active {
  background-color: var(--primary-color);
  color: white;
}

.pagination-page:not(.active):hover {
  background-color: var(--border-color);
}

.pagination-size {
  width: 120px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-danger {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: #D32F2F;
  border-color: #D32F2F;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

@media (max-width: 992px) {
  .filters-row {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-info {
    order: 3;
  }
  
  .pagination-controls {
    order: 1;
  }
  
  .pagination-size {
    order: 2;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .btn {
    flex: 1;
  }
  
  .deliveries-grid {
    grid-template-columns: 1fr;
  }
}
</style>
