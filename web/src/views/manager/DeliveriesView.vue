<template>
  <div class="deliveries-view">
    <div class="page-header">
      <h1>Gestion des Livraisons</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="exportData">
          <i class="fas fa-file-export"></i> Exporter
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" @change="applyFilters">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Acceptée</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
            <option value="disputed">Litigieuse</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-range">Période</label>
          <div class="date-range-picker">
            <input type="date" v-model="filters.startDate" @change="applyFilters" />
            <span>à</span>
            <input type="date" v-model="filters.endDate" @change="applyFilters" />
          </div>
        </div>

        <div class="filter-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input 
              type="text" 
              id="search" 
              v-model="filters.search" 
              placeholder="ID, client, coursier..." 
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label for="district-filter">Quartier</label>
          <select id="district-filter" v-model="filters.district" @change="applyFilters">
            <option value="">Tous les quartiers</option>
            <option v-for="district in districts" :key="district" :value="district">
              {{ district }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="price-range">Prix (FCFA)</label>
          <div class="range-inputs">
            <input 
              type="number" 
              v-model.number="filters.minPrice" 
              placeholder="Min" 
              @change="applyFilters" 
            />
            <span>à</span>
            <input 
              type="number" 
              v-model.number="filters.maxPrice" 
              placeholder="Max" 
              @change="applyFilters" 
            />
          </div>
        </div>

        <div class="filter-group">
          <label for="sort-by">Trier par</label>
          <select id="sort-by" v-model="sortBy" @change="applyFilters">
            <option value="created_at_desc">Date (récent → ancien)</option>
            <option value="created_at_asc">Date (ancien → récent)</option>
            <option value="price_desc">Prix (élevé → bas)</option>
            <option value="price_asc">Prix (bas → élevé)</option>
            <option value="distance_desc">Distance (longue → courte)</option>
            <option value="distance_asc">Distance (courte → longue)</option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <i class="fas fa-times"></i> Réinitialiser les filtres
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <i class="fas fa-filter"></i> Appliquer les filtres
        </button>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total }}</h3>
          <p>Livraisons totales</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pending }}</h3>
          <p>En attente</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.inProgress }}</h3>
          <p>En cours</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.completed }}</h3>
          <p>Terminées</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.cancelled }}</h3>
          <p>Annulées</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.disputed }}</h3>
          <p>Litigieuses</p>
        </div>
      </div>
    </div>

    <!-- Tableau des livraisons -->
    <div class="table-container" v-if="!loading && deliveries.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Client</th>
            <th>Coursier</th>
            <th>Origine</th>
            <th>Destination</th>
            <th>Prix</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="delivery in deliveries" :key="delivery.id">
            <td>{{ delivery.id }}</td>
            <td>{{ formatDate(delivery.created_at) }}</td>
            <td>
              <div class="user-cell">
                <div class="user-avatar">{{ getUserInitials(delivery.client.name) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ delivery.client.name }}</div>
                  <div class="user-phone">{{ delivery.client.phone }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="user-cell" v-if="delivery.courier">
                <div class="user-avatar">{{ getUserInitials(delivery.courier.name) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ delivery.courier.name }}</div>
                  <div class="user-phone">{{ delivery.courier.phone }}</div>
                </div>
              </div>
              <span v-else class="no-courier">Non assigné</span>
            </td>
            <td>{{ delivery.pickup_address }}</td>
            <td>{{ delivery.delivery_address }}</td>
            <td>{{ formatCurrency(delivery.price) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(delivery.status)">
                {{ getStatusLabel(delivery.status) }}
              </span>
            </td>
            <td>
              <div class="actions-cell">
                <button class="btn-icon" @click="viewDeliveryDetails(delivery.id)" title="Voir les détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" @click="editDelivery(delivery.id)" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" v-if="delivery.status === 'disputed'" @click="resolveDispute(delivery.id)" title="Résoudre le litige">
                  <i class="fas fa-gavel"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          class="btn-page" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <button 
          v-for="page in displayedPages" 
          :key="page" 
          class="btn-page" 
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="btn-page" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- État vide -->
    <div class="empty-state" v-else-if="!loading && deliveries.length === 0">
      <div class="empty-icon">
        <i class="fas fa-box-open"></i>
      </div>
      <h3>Aucune livraison trouvée</h3>
      <p>Aucune livraison ne correspond à vos critères de recherche.</p>
      <button class="btn btn-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des livraisons...</p>
    </div>

    <!-- Modal de détails de livraison -->
    <div class="modal" v-if="showDeliveryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails de la livraison #{{ selectedDelivery?.id }}</h2>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedDelivery">
          <div class="delivery-details">
            <div class="detail-section">
              <h3>Informations générales</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID</span>
                  <span class="detail-value">{{ selectedDelivery.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date de création</span>
                  <span class="detail-value">{{ formatDateTime(selectedDelivery.created_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Statut</span>
                  <span class="detail-value status-badge" :class="getStatusClass(selectedDelivery.status)">
                    {{ getStatusLabel(selectedDelivery.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Prix</span>
                  <span class="detail-value">{{ formatCurrency(selectedDelivery.price) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Distance</span>
                  <span class="detail-value">{{ selectedDelivery.distance }} km</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Durée estimée</span>
                  <span class="detail-value">{{ selectedDelivery.estimated_duration }} min</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Client</h3>
              <div class="user-detail">
                <div class="user-avatar large">{{ getUserInitials(selectedDelivery.client.name) }}</div>
                <div class="user-info">
                  <h4>{{ selectedDelivery.client.name }}</h4>
                  <p><i class="fas fa-phone"></i> {{ selectedDelivery.client.phone }}</p>
                  <p><i class="fas fa-envelope"></i> {{ selectedDelivery.client.email }}</p>
                  <p><i class="fas fa-star"></i> {{ selectedDelivery.client.rating }} ({{ selectedDelivery.client.rating_count }} avis)</p>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedDelivery.courier">
              <h3>Coursier</h3>
              <div class="user-detail">
                <div class="user-avatar large">{{ getUserInitials(selectedDelivery.courier.name) }}</div>
                <div class="user-info">
                  <h4>{{ selectedDelivery.courier.name }}</h4>
                  <p><i class="fas fa-phone"></i> {{ selectedDelivery.courier.phone }}</p>
                  <p><i class="fas fa-envelope"></i> {{ selectedDelivery.courier.email }}</p>
                  <p><i class="fas fa-star"></i> {{ selectedDelivery.courier.rating }} ({{ selectedDelivery.courier.rating_count }} avis)</p>
                  <p><i class="fas fa-motorcycle"></i> {{ selectedDelivery.courier.vehicle_type }}</p>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Adresses</h3>
              <div class="address-container">
                <div class="address-item">
                  <div class="address-icon pickup">
                    <i class="fas fa-map-marker-alt"></i>
                  </div>
                  <div class="address-details">
                    <h4>Point de ramassage</h4>
                    <p>{{ selectedDelivery.pickup_address }}</p>
                    <p class="address-notes" v-if="selectedDelivery.pickup_notes">
                      <i class="fas fa-info-circle"></i> {{ selectedDelivery.pickup_notes }}
                    </p>
                  </div>
                </div>
                
                <div class="address-connector">
                  <div class="connector-line"></div>
                  <div class="connector-distance">{{ selectedDelivery.distance }} km</div>
                </div>
                
                <div class="address-item">
                  <div class="address-icon delivery">
                    <i class="fas fa-flag-checkered"></i>
                  </div>
                  <div class="address-details">
                    <h4>Point de livraison</h4>
                    <p>{{ selectedDelivery.delivery_address }}</p>
                    <p class="address-notes" v-if="selectedDelivery.delivery_notes">
                      <i class="fas fa-info-circle"></i> {{ selectedDelivery.delivery_notes }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Colis</h3>
              <div class="package-details">
                <div class="package-item">
                  <span class="package-label">Type</span>
                  <span class="package-value">{{ selectedDelivery.package_type }}</span>
                </div>
                <div class="package-item">
                  <span class="package-label">Poids</span>
                  <span class="package-value">{{ selectedDelivery.package_weight }} kg</span>
                </div>
                <div class="package-item">
                  <span class="package-label">Dimensions</span>
                  <span class="package-value">{{ selectedDelivery.package_dimensions }}</span>
                </div>
                <div class="package-item">
                  <span class="package-label">Fragile</span>
                  <span class="package-value">{{ selectedDelivery.is_fragile ? 'Oui' : 'Non' }}</span>
                </div>
                <div class="package-item">
                  <span class="package-label">Description</span>
                  <span class="package-value">{{ selectedDelivery.package_description || 'Aucune description' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedDelivery.timeline && selectedDelivery.timeline.length > 0">
              <h3>Chronologie</h3>
              <div class="timeline">
                <div 
                  class="timeline-item" 
                  v-for="(event, index) in selectedDelivery.timeline" 
                  :key="index"
                >
                  <div class="timeline-icon" :class="getTimelineIconClass(event.status)">
                    <i :class="getTimelineIcon(event.status)"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-time">{{ formatDateTime(event.timestamp) }}</div>
                    <div class="timeline-title">{{ getTimelineTitle(event.status) }}</div>
                    <div class="timeline-description" v-if="event.description">{{ event.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedDelivery.payment">
              <h3>Paiement</h3>
              <div class="payment-details">
                <div class="payment-item">
                  <span class="payment-label">Méthode</span>
                  <span class="payment-value">{{ getPaymentMethodLabel(selectedDelivery.payment.method) }}</span>
                </div>
                <div class="payment-item">
                  <span class="payment-label">Statut</span>
                  <span class="payment-value payment-status" :class="getPaymentStatusClass(selectedDelivery.payment.status)">
                    {{ getPaymentStatusLabel(selectedDelivery.payment.status) }}
                  </span>
                </div>
                <div class="payment-item">
                  <span class="payment-label">Montant</span>
                  <span class="payment-value">{{ formatCurrency(selectedDelivery.payment.amount) }}</span>
                </div>
                <div class="payment-item">
                  <span class="payment-label">Date</span>
                  <span class="payment-value">{{ formatDateTime(selectedDelivery.payment.timestamp) }}</span>
                </div>
                <div class="payment-item" v-if="selectedDelivery.payment.transaction_id">
                  <span class="payment-label">ID de transaction</span>
                  <span class="payment-value">{{ selectedDelivery.payment.transaction_id }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedDelivery.dispute">
              <h3>Litige</h3>
              <div class="dispute-details">
                <div class="dispute-item">
                  <span class="dispute-label">Raison</span>
                  <span class="dispute-value">{{ selectedDelivery.dispute.reason }}</span>
                </div>
                <div class="dispute-item">
                  <span class="dispute-label">Description</span>
                  <span class="dispute-value">{{ selectedDelivery.dispute.description }}</span>
                </div>
                <div class="dispute-item">
                  <span class="dispute-label">Statut</span>
                  <span class="dispute-value dispute-status" :class="getDisputeStatusClass(selectedDelivery.dispute.status)">
                    {{ getDisputeStatusLabel(selectedDelivery.dispute.status) }}
                  </span>
                </div>
                <div class="dispute-item">
                  <span class="dispute-label">Date d'ouverture</span>
                  <span class="dispute-value">{{ formatDateTime(selectedDelivery.dispute.created_at) }}</span>
                </div>
                <div class="dispute-item" v-if="selectedDelivery.dispute.resolved_at">
                  <span class="dispute-label">Date de résolution</span>
                  <span class="dispute-value">{{ formatDateTime(selectedDelivery.dispute.resolved_at) }}</span>
                </div>
                <div class="dispute-item" v-if="selectedDelivery.dispute.resolution">
                  <span class="dispute-label">Résolution</span>
                  <span class="dispute-value">{{ selectedDelivery.dispute.resolution }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Fermer</button>
          <button class="btn btn-primary" @click="editDelivery(selectedDelivery.id)">Modifier</button>
          <button 
            class="btn btn-danger" 
            v-if="selectedDelivery && selectedDelivery.status !== 'cancelled' && selectedDelivery.status !== 'completed'"
            @click="cancelDelivery(selectedDelivery.id)"
          >
            Annuler la livraison
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de résolution de litige -->
    <div class="modal" v-if="showDisputeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Résoudre le litige - Livraison #{{ selectedDelivery?.id }}</h2>
          <button class="btn-close" @click="closeDisputeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedDelivery && selectedDelivery.dispute">
          <div class="dispute-resolution-form">
            <div class="form-group">
              <label>Raison du litige</label>
              <div class="readonly-field">{{ selectedDelivery.dispute.reason }}</div>
            </div>
            
            <div class="form-group">
              <label>Description du litige</label>
              <div class="readonly-field">{{ selectedDelivery.dispute.description }}</div>
            </div>
            
            <div class="form-group">
              <label for="resolution-decision">Décision</label>
              <select id="resolution-decision" v-model="disputeResolution.decision">
                <option value="client_favor">En faveur du client</option>
                <option value="courier_favor">En faveur du coursier</option>
                <option value="partial_refund">Remboursement partiel</option>
                <option value="full_refund">Remboursement complet</option>
                <option value="redeliver">Nouvelle livraison</option>
              </select>
            </div>
            
            <div class="form-group" v-if="disputeResolution.decision === 'partial_refund'">
              <label for="refund-amount">Montant du remboursement (FCFA)</label>
              <input 
                type="number" 
                id="refund-amount" 
                v-model.number="disputeResolution.refundAmount" 
                min="0" 
                :max="selectedDelivery.price"
              />
            </div>
            
            <div class="form-group">
              <label for="resolution-notes">Notes de résolution</label>
              <textarea 
                id="resolution-notes" 
                v-model="disputeResolution.notes" 
                rows="4" 
                placeholder="Expliquez votre décision..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="notify-parties">Notifier les parties</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="disputeResolution.notifyClient" />
                  Notifier le client
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="disputeResolution.notifyCourier" />
                  Notifier le coursier
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDisputeModal">Annuler</button>
          <button class="btn btn-primary" @click="submitDisputeResolution">Résoudre le litige</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { fetchDeliveries, fetchDeliveryDetails, updateDeliveryStatus, resolveDeliveryDispute } from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'

export default {
  name: 'DeliveriesView',
  setup() {
    // État
    const deliveries = ref([])
    const selectedDelivery = ref(null)
    const showDeliveryModal = ref(false)
    const showDisputeModal = ref(false)
    const loading = ref(true)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const districts = ref([
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
    ])
    
    const stats = reactive({
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0
    })
    
    const filters = reactive({
      status: '',
      startDate: '',
      endDate: '',
      search: '',
      district: '',
      minPrice: null,
      maxPrice: null
    })
    
    const sortBy = ref('created_at_desc')
    
    const disputeResolution = reactive({
      decision: 'client_favor',
      refundAmount: 0,
      notes: '',
      notifyClient: true,
      notifyCourier: true
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          sort: sortBy.value,
          ...filters
        }
        
        const response = await fetchDeliveries(params)
        deliveries.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages
        
        // Mettre à jour les statistiques
        stats.total = response.stats.total
        stats.pending = response.stats.pending
        stats.inProgress = response.stats.in_progress
        stats.completed = response.stats.completed
        stats.cancelled = response.stats.cancelled
        stats.disputed = response.stats.disputed
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons:', error)
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
      Object.keys(filters).forEach(key => {
        if (typeof filters[key] === 'string') {
          filters[key] = ''
        } else if (typeof filters[key] === 'number') {
          filters[key] = null
        }
      })
      sortBy.value = 'created_at_desc'
      currentPage.value = 1
      fetchData()
    }
    
    const changePage = (page) => {
      currentPage.value = page
      fetchData()
    }
    
    const viewDeliveryDetails = async (deliveryId) => {
      try {
        loading.value = true
        const response = await fetchDeliveryDetails(deliveryId)
        selectedDelivery.value = response
        showDeliveryModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la livraison:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }
    
    const editDelivery = (deliveryId) => {
      // Rediriger vers la page d'édition de livraison
      // router.push(`/manager/deliveries/${deliveryId}/edit`)
      console.log('Éditer la livraison:', deliveryId)
    }
    
    const closeModal = () => {
      showDeliveryModal.value = false
      selectedDelivery.value = null
    }
    
    const cancelDelivery = async (deliveryId) => {
      try {
        await updateDeliveryStatus(deliveryId, 'cancelled')
        // Mettre à jour la liste des livraisons
        fetchData()
        // Fermer le modal
        closeModal()
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de l\'annulation de la livraison:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const resolveDispute = (deliveryId) => {
      // Réinitialiser le formulaire de résolution de litige
      disputeResolution.decision = 'client_favor'
      disputeResolution.refundAmount = 0
      disputeResolution.notes = ''
      disputeResolution.notifyClient = true
      disputeResolution.notifyCourier = true
      
      // Afficher le modal de résolution de litige
      viewDeliveryDetails(deliveryId).then(() => {
        showDisputeModal.value = true
      })
    }
    
    const closeDisputeModal = () => {
      showDisputeModal.value = false
    }
    
    const submitDisputeResolution = async () => {
      try {
        if (!selectedDelivery.value || !selectedDelivery.value.dispute) {
          return
        }
        
        const payload = {
          decision: disputeResolution.decision,
          notes: disputeResolution.notes,
          notify_client: disputeResolution.notifyClient,
          notify_courier: disputeResolution.notifyCourier
        }
        
        if (disputeResolution.decision === 'partial_refund') {
          payload.refund_amount = disputeResolution.refundAmount
        }
        
        await resolveDeliveryDispute(selectedDelivery.value.id, payload)
        
        // Fermer les modals
        closeDisputeModal()
        closeModal()
        
        // Rafraîchir les données
        fetchData()
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la résolution du litige:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const exportData = () => {
      // Implémenter l'exportation des données (CSV, Excel, etc.)
      console.log('Exporter les données')
    }
    
    // Utilitaires
    const getStatusClass = (status) => {
      const statusMap = {
        pending: 'status-pending',
        accepted: 'status-accepted',
        in_progress: 'status-in-progress',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
        disputed: 'status-disputed'
      }
      return statusMap[status] || 'status-unknown'
    }
    
    const getStatusLabel = (status) => {
      const statusMap = {
        pending: 'En attente',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée',
        disputed: 'Litigieuse'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getTimelineIconClass = (status) => {
      const statusMap = {
        created: 'timeline-icon-created',
        accepted: 'timeline-icon-accepted',
        picked_up: 'timeline-icon-picked-up',
        in_transit: 'timeline-icon-in-transit',
        delivered: 'timeline-icon-delivered',
        cancelled: 'timeline-icon-cancelled',
        disputed: 'timeline-icon-disputed'
      }
      return statusMap[status] || 'timeline-icon-default'
    }
    
    const getTimelineIcon = (status) => {
      const statusMap = {
        created: 'fas fa-plus-circle',
        accepted: 'fas fa-check-circle',
        picked_up: 'fas fa-box',
        in_transit: 'fas fa-truck',
        delivered: 'fas fa-flag-checkered',
        cancelled: 'fas fa-times-circle',
        disputed: 'fas fa-exclamation-triangle'
      }
      return statusMap[status] || 'fas fa-circle'
    }
    
    const getTimelineTitle = (status) => {
      const statusMap = {
        created: 'Livraison créée',
        accepted: 'Acceptée par le coursier',
        picked_up: 'Colis récupéré',
        in_transit: 'En transit',
        delivered: 'Livré',
        cancelled: 'Annulée',
        disputed: 'Litige ouvert'
      }
      return statusMap[status] || 'Événement'
    }
    
    const getPaymentMethodLabel = (method) => {
      const methodMap = {
        cash: 'Espèces',
        card: 'Carte bancaire',
        orange_money: 'Orange Money',
        mtn_money: 'MTN Money',
        moov_money: 'Moov Money',
        wave: 'Wave'
      }
      return methodMap[method] || 'Inconnu'
    }
    
    const getPaymentStatusClass = (status) => {
      const statusMap = {
        pending: 'payment-pending',
        completed: 'payment-completed',
        failed: 'payment-failed',
        refunded: 'payment-refunded'
      }
      return statusMap[status] || 'payment-unknown'
    }
    
    const getPaymentStatusLabel = (status) => {
      const statusMap = {
        pending: 'En attente',
        completed: 'Complété',
        failed: 'Échoué',
        refunded: 'Remboursé'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getDisputeStatusClass = (status) => {
      const statusMap = {
        open: 'dispute-open',
        in_review: 'dispute-in-review',
        resolved: 'dispute-resolved',
        closed: 'dispute-closed'
      }
      return statusMap[status] || 'dispute-unknown'
    }
    
    const getDisputeStatusLabel = (status) => {
      const statusMap = {
        open: 'Ouvert',
        in_review: 'En cours d\'examen',
        resolved: 'Résolu',
        closed: 'Fermé'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getUserInitials = (name) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
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
    })
    
    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })
    
    return {
      deliveries,
      selectedDelivery,
      showDeliveryModal,
      showDisputeModal,
      loading,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      districts,
      stats,
      filters,
      sortBy,
      disputeResolution,
      displayedPages,
      
      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      viewDeliveryDetails,
      editDelivery,
      closeModal,
      cancelDelivery,
      resolveDispute,
      closeDisputeModal,
      submitDisputeResolution,
      exportData,
      debounceSearch,
      
      getStatusClass,
      getStatusLabel,
      getTimelineIconClass,
      getTimelineIcon,
      getTimelineTitle,
      getPaymentMethodLabel,
      getPaymentStatusClass,
      getPaymentStatusLabel,
      getDisputeStatusClass,
      getDisputeStatusLabel,
      getUserInitials,
      
      formatCurrency,
      formatDate,
      formatDateTime
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

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #c82333;
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

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.date-range-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range-picker input {
  flex: 1;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-inputs input {
  flex: 1;
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
  color: #6c757d;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: rgba(0, 86, 179, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-icon i {
  font-size: 1.25rem;
  color: #0056b3;
}

.stat-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.stat-content p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0.25rem 0 0;
}

.table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background-color: #f8f9fa;
}

.user-cell {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #0056b3;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  margin-right: 0.75rem;
}

.user-avatar.large {
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.25rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-phone {
  font-size: 0.75rem;
  color: #6c757d;
}

.no-courier {
  color: #6c757d;
  font-style: italic;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending {
  background-color: #ffeeba;
  color: #856404;
}

.status-accepted {
  background-color: #b8daff;
  color: #004085;
}

.status-in-progress {
  background-color: #c3e6cb;
  color: #155724;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.status-cancelled {
  background-color: #f5c6cb;
  color: #721c24;
}

.status-disputed {
  background-color: #f8d7da;
  color: #721c24;
}

.actions-cell {
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
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-icon:hover {
  background-color: #f8f9fa;
}

.btn-icon i {
  font-size: 0.875rem;
  color: #6c757d;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 1rem;
  gap: 0.25rem;
}

.btn-page {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #495057;
}

.btn-page:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #ced4da;
}

.btn-page.active {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  background-color: white;
  border-radius: 0.5rem;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #333;
}

.empty-state p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid rgba(0, 86, 179, 0.1);
  border-radius: 50%;
  border-top-color: #0056b3;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  font-size: 0.875rem;
  color: #6c757d;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.btn-close {
  background-color: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.delivery-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #333;
}

.user-detail {
  display: flex;
  align-items: flex-start;
}

.user-detail .user-info {
  flex: 1;
}

.user-detail h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #333;
}

.user-detail p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.address-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.address-item {
  display: flex;
  align-items: flex-start;
}

.address-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.address-icon.pickup {
  background-color: rgba(0, 86, 179, 0.1);
  color: #0056b3;
}

.address-icon.delivery {
  background-color: rgba(21, 87, 36, 0.1);
  color: #155724;
}

.address-details {
  flex: 1;
}

.address-details h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: #333;
}

.address-details p {
  font-size: 0.875rem;
  color: #495057;
  margin: 0;
}

.address-notes {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  font-style: italic;
}

.address-connector {
  display: flex;
  align-items: center;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}

.connector-line {
  width: 1px;
  height: 2rem;
  background-color: #ced4da;
  margin-right: 1rem;
}

.connector-distance {
  font-size: 0.75rem;
  color: #6c757d;
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
}

.package-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.package-item {
  display: flex;
  flex-direction: column;
}

.package-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.package-value {
  font-weight: 500;
  color: #333;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 2.5rem;
  left: 1rem;
  width: 1px;
  height: calc(100% - 1rem);
  background-color: #ced4da;
}

.timeline-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  z-index: 1;
}

.timeline-icon-created {
  background-color: #b8daff;
  color: #004085;
}

.timeline-icon-accepted {
  background-color: #c3e6cb;
  color: #155724;
}

.timeline-icon-picked-up {
  background-color: #d1ecf1;
  color: #0c5460;
}

.timeline-icon-in-transit {
  background-color: #bee5eb;
  color: #0c5460;
}

.timeline-icon-delivered {
  background-color: #d4edda;
  color: #155724;
}

.timeline-icon-cancelled {
  background-color: #f5c6cb;
  color: #721c24;
}

.timeline-icon-disputed {
  background-color: #f8d7da;
  color: #721c24;
}

.timeline-content {
  flex: 1;
}

.timeline-time {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.timeline-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.timeline-description {
  font-size: 0.875rem;
  color: #495057;
}

.payment-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.payment-item {
  display: flex;
  flex-direction: column;
}

.payment-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.payment-value {
  font-weight: 500;
  color: #333;
}

.payment-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.payment-pending {
  background-color: #ffeeba;
  color: #856404;
}

.payment-completed {
  background-color: #d4edda;
  color: #155724;
}

.payment-failed {
  background-color: #f5c6cb;
  color: #721c24;
}

.payment-refunded {
  background-color: #f8d7da;
  color: #721c24;
}

.dispute-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dispute-item {
  display: flex;
  flex-direction: column;
}

.dispute-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.dispute-value {
  font-weight: 500;
  color: #333;
}

.dispute-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.dispute-open {
  background-color: #ffeeba;
  color: #856404;
}

.dispute-in-review {
  background-color: #b8daff;
  color: #004085;
}

.dispute-resolved {
  background-color: #d4edda;
  color: #155724;
}

.dispute-closed {
  background-color: #e2e3e5;
  color: #383d41;
}

.dispute-resolution-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #495057;
}

.form-group select,
.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.readonly-field {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  color: #495057;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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
  
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .detail-grid,
  .package-details,
  .payment-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filters-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    width: 100%;
  }
}
</style>

```vue file="web/src/views/manager/BusinessesView.vue"
<template>
  <div class="businesses-view">
    <div class="page-header">
      <h1>Gestion des Entreprises</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="exportData">
          <i class="fas fa-file-export"></i> Exporter
        </button>
      </div>
    </div>

    &lt;!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" @change="applyFilters">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="verification-filter">Vérification</label>
          <select id="verification-filter" v-model="filters.verification" @change="applyFilters">
            <option value="">Tous</option>
            <option value="verified">Vérifié</option>
            <option value="unverified">Non vérifié</option>
            <option value="pending">En attente</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input 
              type="text" 
              id="search" 
              v-model="filters.search" 
              placeholder="Nom, email, téléphone..." 
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label for="district-filter">Quartier</label>
          <select id="district-filter" v-model="filters.district" @change="applyFilters">
            <option value="">Tous les quartiers</option>
            <option v-for="district in districts" :key="district" :value="district">
              {{ district }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="business-type">Type d'entreprise</label>
          <select id="business-type" v-model="filters.businessType" @change="applyFilters">
            <option value="">Tous les types</option>
            <option value="restaurant">Restaurant</option>
            <option value="grocery">Épicerie</option>
            <option value="pharmacy">Pharmacie</option>
            <option value="retail">Commerce de détail</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="sort-by">Trier par</label>
          <select id="sort-by" v-model="sortBy" @change="applyFilters">
            <option value="created_at_desc">Date d'inscription (récent → ancien)</option>
            <option value="created_at_asc">Date d'inscription (ancien → récent)</option>
            <option value="name_asc">Nom (A → Z)</option>
            <option value="name_desc">Nom (Z → A)</option>
            <option value="rating_desc">Note (élevée → basse)</option>
            <option value="rating_asc">Note (basse → élevée)</option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <i class="fas fa-times"></i> Réinitialiser les filtres
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <i class="fas fa-filter"></i> Appliquer les filtres
        </button>
      </div>
    </div>

    &lt;!-- Statistiques -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-building"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total }}</h3>
          <p>Entreprises totales</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.active }}</h3>
          <p>Actives</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pending }}</h3>
          <p>En attente</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-ban"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.suspended }}</h3>
          <p>Suspendues</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-id-card"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.verified }}</h3>
          <p>Vérifiées</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.unverified }}</h3>
          <p>Non vérifiées</p>
        </div>
      </div>
    </div>

    &lt;!-- Tableau des entreprises -->
    <div class="table-container" v-if="!loading && businesses.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Entreprise</th>
            <th>Contact</th>
            <th>Type</th>
            <th>Adresse</th>
            <th>Statut</th>
            <th>Vérification</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="business in businesses" :key="business.id">
            <td>{{ business.id }}</td>
            <td>
              <div class="business-cell">
                <div class="business-logo" v-if="business.logo">
                  <img :src="business.logo" :alt="business.name" />
                </div>
                <div class="business-avatar" v-else>
                  {{ getBusinessInitials(business.name) }}
                </div>
                <div class="business-info">
                  <div class="business-name">{{ business.name }}</div>
                  <div class="business-since">Depuis {{ formatDate(business.created_at) }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="contact-info">
                <div>{{ business.contact_name }}</div>
                <div class="contact-phone">{{ business.phone }}</div>
                <div class="contact-email">{{ business.email }}</div>
              </div>
            </td>
            <td>{{ getBusinessTypeLabel(business.business_type) }}</td>
            <td>{{ business.address }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(business.status)">
                {{ getStatusLabel(business.status) }}
              </span>
            </td>
            <td>
              <span class="verification-badge" :class="getVerificationClass(business.verification_status)">
                {{ getVerificationLabel(business.verification_status) }}
              </span>
            </td>
            <td>
              <div class="rating">
                <span class="rating-value">{{ business.rating.toFixed(1) }}</span>
                <div class="rating-stars">
                  <i 
                    v-for="i in 5" 
                    :key="i" 
                    class="fas" 
                    :class="i &lt;= Math.round(business.rating) ? 'fa-star' : 'fa-star-o'"
                  ></i>
                </div>
                <span class="rating-count">({{ business.rating_count }})</span>
              </div>
            </td>
            <td>
              <div class="actions-cell">
                <button class="btn-icon" @click="viewBusinessDetails(business.id)" title="Voir les détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" @click="editBusiness(business.id)" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="btn-icon" 
                  v-if="business.verification_status === 'pending'" 
                  @click="verifyBusiness(business.id)" 
                  title="Vérifier"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  class="btn-icon" 
                  v-if="business.status === 'active'" 
                  @click="suspendBusiness(business.id)" 
                  title="Suspendre"
                >
                  <i class="fas fa-ban"></i>
                </button>
                <button 
                  class="btn-icon" 
                  v-if="business.status === 'suspended'" 
                  @click="activateBusiness(business.id)" 
                  title="Activer"
                >
                  <i class="fas fa-play"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      &lt;!-- Pagination -->
      <div class="pagination">
        <button 
          class="btn-page" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <button 
          v-for="page in displayedPages" 
          :key="page" 
          class="btn-page" 
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="btn-page" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    &lt;!-- État vide -->
    <div class="empty-state" v-else-if="!loading && businesses.length === 0">
      <div class="empty-icon">
        <i class="fas fa-building"></i>
      </div>
      <h3>Aucune entreprise trouvée</h3>
      <p>Aucune entreprise ne correspond à vos critères de recherche.</p>
      <button class="btn btn-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </div>

    &lt;!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des entreprises...</p>
    </div>

    &lt;!-- Modal de détails d'entreprise -->
    <div class="modal" v-if="showBusinessModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails de l'entreprise: {{ selectedBusiness?.name }}</h2>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedBusiness">
          <div class="business-details">
            <div class="detail-section">
              <h3>Informations générales</h3>
              <div class="business-header">
                <div class="business-logo-large" v-if="selectedBusiness.logo">
                  <img :src="selectedBusiness.logo" :alt="selectedBusiness.name" />
                </div>
                <div class="business-avatar-large" v-else>
                  {{ getBusinessInitials(selectedBusiness.name) }}
                </div>
                <div class="business-header-info">
                  <h4>{{ selectedBusiness.name }}</h4>
                  <p>
                    <span class="status-badge" :class="getStatusClass(selectedBusiness.status)">
                      {{ getStatusLabel(selectedBusiness.status) }}
                    </span>
                    <span class="verification-badge" :class="getVerificationClass(selectedBusiness.verification_status)">
                      {{ getVerificationLabel(selectedBusiness.verification_status) }}
                    </span>
                  </p>
                  <p><i class="fas fa-tag"></i> {{ getBusinessTypeLabel(selectedBusiness.business_type) }}</p>
                  <p><i class="fas fa-calendar-alt"></i> Inscrit le {{ formatDate(selectedBusiness.created_at) }}</p>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Contact</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Nom du contact</span>
                  <span class="detail-value">{{ selectedBusiness.contact_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ selectedBusiness.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Téléphone</span>
                  <span class="detail-value">{{ selectedBusiness.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Téléphone secondaire</span>
                  <span class="detail-value">{{ selectedBusiness.secondary_phone || 'Non renseigné' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Site web</span>
                  <span class="detail-value">
                    <a v-if="selectedBusiness.website" :href="selectedBusiness.website" target="_blank">
                      {{ selectedBusiness.website }}
                    </a>
                    <span v-else>Non renseigné</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Adresse</h3>
              <div class="address-details">
                <p>{{ selectedBusiness.address }}</p>
                <p>{{ selectedBusiness.district }}, Abidjan</p>
                <p v-if="selectedBusiness.address_notes">
                  <i class="fas fa-info-circle"></i> {{ selectedBusiness.address_notes }}
                </p>
                <div class="address-map" v-if="selectedBusiness.coordinates">
                  &lt;!-- Emplacement pour la carte -->
                  <div class="map-placeholder">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Carte non disponible en mode hors ligne</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Documents légaux</h3>
              <div class="documents-list">
                <div class="document-item" v-for="(doc, index) in selectedBusiness.documents" :key="index">
                  <div class="document-icon">
                    <i class="fas fa-file-alt"></i>
                  </div>
                  <div class="document-info">
                    <div class="document-name">{{ doc.name }}</div>
                    <div class="document-meta">
                      <span>{{ formatDate(doc.uploaded_at) }}</span>
                      <span :class="getVerificationClass(doc.status)">{{ getVerificationLabel(doc.status) }}</span>
                    </div>
                  </div>
                  <div class="document-actions">
                    <button class="btn-icon" @click="viewDocument(doc)" title="Voir le document">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      v-if="doc.status === 'pending'" 
                      @click="verifyDocument(doc.id, 'verified')" 
                      title="Approuver"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      v-if="doc.status === 'pending'" 
                      @click="verifyDocument(doc.id, 'rejected')" 
                      title="Rejeter"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <div class="empty-documents" v-if="!selectedBusiness.documents || selectedBusiness.documents.length === 0">
                  <i class="fas fa-file-alt"></i>
                  <p>Aucun document téléchargé</p>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Heures d'ouverture</h3>
              <div class="hours-list">
                <div class="hours-item" v-for="(hours, day) in selectedBusiness.opening_hours" :key="day">
                  <div class="hours-day">{{ getDayLabel(day) }}</div>
                  <div class="hours-time" v-if="hours.open">
                    {{ formatTime(hours.opening_time) }} - {{ formatTime(hours.closing_time) }}
                  </div>
                  <div class="hours-closed" v-else>Fermé</div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Statistiques</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ selectedBusiness.stats.total_orders }}</div>
                  <div class="stat-label">Commandes totales</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ formatCurrency(selectedBusiness.stats.total_revenue) }}</div>
                  <div class="stat-label">Chiffre d'affaires</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ selectedBusiness.stats.average_delivery_time }} min</div>
                  <div class="stat-label">Temps moyen de livraison</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ selectedBusiness.stats.cancellation_rate }}%</div>
                  <div class="stat-label">Taux d'annulation</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ selectedBusiness.rating.toFixed(1) }}</div>
                  <div class="stat-label">Note moyenne ({{ selectedBusiness.rating_count }} avis)</div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBusiness.recent_orders && selectedBusiness.recent_orders.length > 0">
              <h3>Commandes récentes</h3>
              <div class="recent-orders">
                <div class="order-item" v-for="order in selectedBusiness.recent_orders" :key="order.id">
                  <div class="order-header">
                    <div class="order-id">#{{ order.id }}</div>
                    <div class="order-date">{{ formatDateTime(order.created_at) }}</div>
                    <div class="order-status" :class="getOrderStatusClass(order.status)">
                      {{ getOrderStatusLabel(order.status) }}
                    </div>
                  </div>
                  <div class="order-details">
                    <div class="order-customer">
                      <i class="fas fa-user"></i> {{ order.customer_name }}
                    </div>
                    <div class="order-amount">
                      <i class="fas fa-money-bill-wave"></i> {{ formatCurrency(order.amount) }}
                    </div>
                    <div class="order-items">
                      <i class="fas fa-shopping-basket"></i> {{ order.items_count }} articles
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedBusiness.reviews && selectedBusiness.reviews.length > 0">
              <h3>Avis récents</h3>
              <div class="reviews-list">
                <div class="review-item" v-for="review in selectedBusiness.reviews" :key="review.id">
                  <div class="review-header">
                    <div class="review-author">{{ review.customer_name }}</div>
                    <div class="review-date">{{ formatDate(review.created_at) }}</div>
                    <div class="review-rating">
                      <i 
                        v-for="i in 5" 
                        :key="i" 
                        class="fas" 
                        :class="i &lt;= review.rating ? 'fa-star' : 'fa-star-o'"
                      ></i>
                    </div>
                  </div>
                  <div class="review-content">
                    {{ review.comment }}
                  </div>
                  <div class="review-actions" v-if="review.flagged">
                    <button class="btn btn-sm btn-danger" @click="moderateReview(review.id)">
                      <i class="fas fa-flag"></i> Modérer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Fermer</button>
          <button class="btn btn-primary" @click="editBusiness(selectedBusiness.id)">Modifier</button>
          <button 
            class="btn btn-success" 
            v-if="selectedBusiness && selectedBusiness.verification_status === 'pending'"
            @click="verifyBusiness(selectedBusiness.id)"
          >
            Vérifier l'entreprise
          </button>
          <button 
            class="btn btn-warning" 
            v-if="selectedBusiness && selectedBusiness.status === 'active'"
            @click="suspendBusiness(selectedBusiness.id)"
          >
            Suspendre
          </button>
          <button 
            class="btn btn-success" 
            v-if="selectedBusiness && selectedBusiness.status === 'suspended'"
            @click="activateBusiness(selectedBusiness.id)"
          >
            Activer
          </button>
        </div>
      </div>
    </div>

    &lt;!-- Modal de vérification d'entreprise -->
    <div class="modal" v-if="showVerificationModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Vérification de l'entreprise: {{ selectedBusiness?.name }}</h2>
          <button class="btn-close" @click="closeVerificationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedBusiness">
          <div class="verification-form">
            <div class="form-group">
              <label>Documents soumis</label>
              <div class="documents-list">
                <div class="document-item" v-for="(doc, index) in selectedBusiness.documents" :key="index">
                  <div class="document-icon">
                    <i class="fas fa-file-alt"></i>
                  </div>
                  <div class="document-info">
                    <div class="document-name">{{ doc.name }}</div>
                    <div class="document-meta">
                      <span>{{ formatDate(doc.uploaded_at) }}</span>
                      <span :class="getVerificationClass(doc.status)">{{ getVerificationLabel(doc.status) }}</span>
                    </div>
                  </div>
                  <div class="document-actions">
                    <button class="btn-icon" @click="viewDocument(doc)" title="Voir le document">
                      <i class="fas fa-eye"></i>
                    </button>
                    <div class="document-status-actions">
                      <button 
                        class="btn btn-sm" 
                        :class="verificationForm.documentStatuses[doc.id] === 'verified' ? 'btn-success' : 'btn-outline'"
                        @click="verificationForm.documentStatuses[doc.id] = 'verified'"
                      >
                        <i class="fas fa-check"></i> Approuver
                      </button>
                      <button 
                        class="btn btn-sm" 
                        :class="verificationForm.documentStatuses[doc.id] === 'rejected' ? 'btn-danger' : 'btn-outline'"
                        @click="verificationForm.documentStatuses[doc.id] = 'rejected'"
                      >
                        <i class="fas fa-times"></i> Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="verification-decision">Décision</label>
              <select id="verification-decision" v-model="verificationForm.decision">
                <option value="verified">Approuver</option>
                <option value="rejected">Rejeter</option>
                <option value="pending_additional_info">Demander des informations supplémentaires</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="verification-notes">Notes</label>
              <textarea 
                id="verification-notes" 
                v-model="verificationForm.notes" 
                rows="4" 
                placeholder="Ajoutez des notes ou des commentaires..."
              ></textarea>
            </div>
            
            <div class="form-group" v-if="verificationForm.decision === 'pending_additional_info'">
              <label for="additional-documents">Documents supplémentaires requis</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="verificationForm.additionalDocuments.business_registration" />
                  Registre du Commerce et du Crédit Mobilier (RCCM)
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="verificationForm.additionalDocuments.tax_id" />
                  Numéro de Compte Contribuable (NCC)
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="verificationForm.additionalDocuments.id_proof" />
                  Pièce d'identité du gérant
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="verificationForm.additionalDocuments.business_license" />
                  Licence d'exploitation
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="verificationForm.additionalDocuments.proof_of_address" />
                  Justificatif d'adresse
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label for="notify-business">Notification</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="verificationForm.notifyBusiness" />
                  Envoyer une notification à l'entreprise
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeVerificationModal">Annuler</button>
          <button class="btn btn-primary" @click="submitVerification">Soumettre la vérification</button>
        </div>
      </div>
    </div>

    &lt;!-- Modal de visualisation de document -->
    <div class="modal" v-if="showDocumentModal">
      <div class="modal-content document-modal">
        <div class="modal-header">
          <h2>{{ selectedDocument?.name }}</h2>
          <button class="btn-close" @click="closeDocumentModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body document-viewer">
          <div class="document-loading" v-if="documentLoading">
            <div class="spinner"></div>
            <p>Chargement du document...</p>
          </div>
          <div class="document-container" v-else-if="selectedDocument">
            <img 
              v-if="isImageDocument(selectedDocument)" 
              :src="selectedDocument.url" 
              :alt="selectedDocument.name" 
              class="document-image"
            />
            <iframe 
              v-else-if="isPdfDocument(selectedDocument)" 
              :src="selectedDocument.url" 
              class="document-pdf"
              title="Document PDF"
            ></iframe>
            <div class="document-unsupported" v-else>
              <i class="fas fa-file-alt"></i>
              <p>Ce type de document ne peut pas être prévisualisé.</p>
              <a :href="selectedDocument.url" download class="btn btn-primary">
                <i class="fas fa-download"></i> Télécharger
              </a>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDocumentModal">Fermer</button>
          <a 
            v-if="selectedDocument" 
            :href="selectedDocument.url" 
            download 
            class="btn btn-primary"
          >
            <i class="fas fa-download"></i> Télécharger
          </a>
          <div class="document-verification-actions" v-if="selectedDocument && selectedDocument.status === 'pending'">
            <button class="btn btn-success" @click="verifyDocument(selectedDocument.id, 'verified')">
              <i class="fas fa-check"></i> Approuver
            </button>
            <button class="btn btn-danger" @click="verifyDocument(selectedDocument.id, 'rejected')">
              <i class="fas fa-times"></i> Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { fetchBusinesses, fetchBusinessDetails, updateBusinessStatus, verifyBusinessDocuments } from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime, formatTime } from '@/utils/formatters'

export default {
  name: 'BusinessesView',
  setup() {
    // État
    const businesses = ref([])
    const selectedBusiness = ref(null)
    const selectedDocument = ref(null)
    const showBusinessModal = ref(false)
    const showVerificationModal = ref(false)
    const showDocumentModal = ref(false)
    const documentLoading = ref(false)
    const loading = ref(true)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const districts = ref([
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
    ])
    
    const stats = reactive({
      total: 0,
      active: 0,
      pending: 0,
      suspended: 0,
      verified: 0,
      unverified: 0
    })
    
    const filters = reactive({
      status: '',
      verification: '',
      search: '',
      district: '',
      businessType: ''
    })
    
    const sortBy = ref('created_at_desc')
    
    const verificationForm = reactive({
      decision: 'verified',
      notes: '',
      documentStatuses: {},
      additionalDocuments: {
        business_registration: false,
        tax_id: false,
        id_proof: false,
        business_license: false,
        proof_of_address: false
      },
      notifyBusiness: true
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          sort: sortBy.value,
          ...filters
        }
        
        const response = await fetchBusinesses(params)
        businesses.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages
        
        // Mettre à jour les statistiques
        stats.total = response.stats.total
        stats.active = response.stats.active
        stats.pending = response.stats.pending
        stats.suspended = response.stats.suspended
        stats.verified = response.stats.verified
        stats.unverified = response.stats.unverified
      } catch (error) {
        console.error('Erreur lors du chargement des entreprises:', error)
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
      Object.keys(filters).forEach(key => {
        filters[key] = ''
      })
      sortBy.value = 'created_at_desc'
      currentPage.value = 1
      fetchData()
    }
    
    const changePage = (page) => {
      currentPage.value = page
      fetchData()
    }
    
    const viewBusinessDetails = async (businessId) => {
      try {
        loading.value = true
        const response = await fetchBusinessDetails(businessId)
        selectedBusiness.value = response
        showBusinessModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'entreprise:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }
    
    const editBusiness = (businessId) => {
      // Rediriger vers la page d'édition d'entreprise
      // router.push(`/manager/businesses/${businessId}/edit`)
      console.log('Éditer l\'entreprise:', businessId)
    }
    
    const closeModal = () => {
      showBusinessModal.value = false
      selectedBusiness.value = null
    }
    
    const suspendBusiness = async (businessId) => {
      try {
        await updateBusinessStatus(businessId, 'suspended')
        // Mettre à jour la liste des entreprises
        fetchData()
        // Fermer le modal si ouvert
        if (showBusinessModal.value && selectedBusiness.value && selectedBusiness.value.id === businessId) {
          closeModal()
        }
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la suspension de l\'entreprise:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const activateBusiness = async (businessId) => {
      try {
        await updateBusinessStatus(businessId, 'active')
        // Mettre à jour la liste des entreprises
        fetchData()
        // Fermer le modal si ouvert
        if (showBusinessModal.value && selectedBusiness.value && selectedBusiness.value.id === businessId) {
          closeModal()
        }
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de l\'activation de l\'entreprise:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const verifyBusiness = (businessId) => {
      // Réinitialiser le formulaire de vérification
      verificationForm.decision = 'verified'
      verificationForm.notes = ''
      verificationForm.documentStatuses = {}
      Object.keys(verificationForm.additionalDocuments).forEach(key => {
        verificationForm.additionalDocuments[key] = false
      })
      verificationForm.notifyBusiness = true
      
      // Afficher le modal de vérification
      if (!selectedBusiness.value || selectedBusiness.value.id !== businessId) {
        viewBusinessDetails(businessId).then(() => {
          // Initialiser les statuts des documents
          if (selectedBusiness.value && selectedBusiness.value.documents) {
            selectedBusiness.value.documents.forEach(doc => {
              verificationForm.documentStatuses[doc.id] = doc.status
            })
          }
          showVerificationModal.value = true
        })
      } else {
        // Initialiser les statuts des documents
        if (selectedBusiness.value && selectedBusiness.value.documents) {
          selectedBusiness.value.documents.forEach(doc => {
            verificationForm.documentStatuses[doc.id] = doc.status
          })
        }
        showVerificationModal.value = true
      }
    }
    
    const closeVerificationModal = () => {
      showVerificationModal.value = false
    }
    
    const submitVerification = async () => {
      try {
        if (!selectedBusiness.value) {
          return
        }
        
        const payload = {
          verification_status: verificationForm.decision,
          notes: verificationForm.notes,
          document_statuses: verificationForm.documentStatuses,
          notify_business: verificationForm.notifyBusiness
        }
        
        if (verificationForm.decision === 'pending_additional_info') {
          payload.additional_documents = Object.keys(verificationForm.additionalDocuments)
            .filter(key => verificationForm.additionalDocuments[key])
        }
        
        await verifyBusinessDocuments(selectedBusiness.value.id, payload)
        
        // Fermer les modals
        closeVerificationModal()
        closeModal()
        
        // Rafraîchir les données
        fetchData()
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'entreprise:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const viewDocument = (doc) => {
      selectedDocument.value = doc
      documentLoading.value = true
      showDocumentModal.value = true
      
      // Simuler le chargement du document
      setTimeout(() => {
        documentLoading.value = false
      }, 1000)
    }
    
    const closeDocumentModal = () => {
      showDocumentModal.value = false
      selectedDocument.value = null
    }
    
    const verifyDocument = async (documentId, status) => {
      try {
        if (!selectedBusiness.value) {
          return
        }
        
        await verifyBusinessDocuments(selectedBusiness.value.id, {
          document_statuses: { [documentId]: status },
          notify_business: true
        })
        
        // Mettre à jour le document dans l'interface
        if (selectedBusiness.value && selectedBusiness.value.documents) {
          const docIndex = selectedBusiness.value.documents.findIndex(d => d.id === documentId)
          if (docIndex !== -1) {
            selectedBusiness.value.documents[docIndex].status = status
          }
        }
        
        // Fermer le modal de document si ouvert
        if (showDocumentModal.value && selectedDocument.value && selectedDocument.value.id === documentId) {
          closeDocumentModal()
        }
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la vérification du document:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const moderateReview = (reviewId) => {
      // Implémenter la modération des avis
      console.log('Modérer l\'avis:', reviewId)
    }
    
    const exportData = () => {
      // Implémenter l'exportation des données (CSV, Excel, etc.)
      console.log('Exporter les données')
    }
    
    // Utilitaires
    const getBusinessInitials = (name) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    
    const getBusinessTypeLabel = (type) => {
      const typeMap = {
        restaurant: 'Restaurant',
        grocery: 'Épicerie',
        pharmacy: 'Pharmacie',
        retail: 'Commerce de détail',
        other: 'Autre'
      }
      return typeMap[type] || 'Inconnu'
    }
    
    const getStatusClass = (status) => {
      const statusMap = {
        pending: 'status-pending',
        active: 'status-active',
        suspended: 'status-suspended',
        inactive: 'status-inactive'
      }
      return statusMap[status] || 'status-unknown'
    }
    
    const getStatusLabel = (status) => {
      const statusMap = {
        pending: 'En attente',
        active: 'Actif',
        suspended: 'Suspendu',
        inactive: 'Inactif'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getVerificationClass = (status) => {
      const statusMap = {
        verified: 'verification-verified',
        unverified: 'verification-unverified',
        pending: 'verification-pending',
        rejected: 'verification-rejected'
      }
      return statusMap[status] || 'verification-unknown'
    }
    
    const getVerificationLabel = (status) => {
      const statusMap = {
        verified: 'Vérifié',
        unverified: 'Non vérifié',
        pending: 'En attente',
        rejected: 'Rejeté'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getDayLabel = (day) => {
      const dayMap = {
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sunday: 'Dimanche'
      }
      return dayMap[day] || day
    }
    
    const getOrderStatusClass = (status) => {
      const statusMap = {
        pending: 'order-pending',
        confirmed: 'order-confirmed',
        preparing: 'order-preparing',
        ready: 'order-ready',
        in_delivery: 'order-in-delivery',
        delivered: 'order-delivered',
        cancelled: 'order-cancelled'
      }
      return statusMap[status] || 'order-unknown'
    }
    
    const getOrderStatusLabel = (status) => {
      const statusMap = {
        pending: 'En attente',
        confirmed: 'Confirmé',
        preparing: 'En préparation',
        ready: 'Prêt',
        in_delivery: 'En livraison',
        delivered: 'Livré',
        cancelled: 'Annulé'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const isImageDocument = (doc) => {
      if (!doc || !doc.mime_type) return false
      return doc.mime_type.startsWith('image/')
    }
    
    const isPdfDocument = (doc) => {
      if (!doc || !doc.mime_type) return false
      return doc.mime_type === 'application/pdf'
    }
    
    // Pagination calculée
    const displayedPages = computed(() => {
      const pages = []
      const maxVisiblePages = 5
      
      if (totalPages.value &lt;= maxVisiblePages) {
        // Afficher toutes les pages si le nombre total est inférieur ou égal au maximum visible
        for (let i = 1; i &lt;= totalPages.value; i++) {
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
        
        for (let i = startPage; i &lt;= endPage; i++) {
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
    })
    
    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })
    
    return {
      businesses,
      selectedBusiness,
      selectedDocument,
      showBusinessModal,
      showVerificationModal,
      showDocumentModal,
      documentLoading,
      loading,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      districts,
      stats,
      filters,
      sortBy,
      verificationForm,
      displayedPages,
      
      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      viewBusinessDetails,
      editBusiness,
      closeModal,
      suspendBusiness,
      activateBusiness,
      verifyBusiness,
      closeVerificationModal,
      submitVerification,
      viewDocument,
      closeDocumentModal,
      verifyDocument,
      moderateReview,
      exportData,
      debounceSearch,
      
      getBusinessInitials,
      getBusinessTypeLabel,
      getStatusClass,
      getStatusLabel,
      getVerificationClass,
      getVerificationLabel,
      getDayLabel,
      getOrderStatusClass,
      getOrderStatusLabel,
      isImageDocument,
      isPdfDocument,
      
      formatCurrency,
      formatDate,
      formatDateTime,
      formatTime
    }
  }
}
</script>

<style scoped>
.businesses-view {
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

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
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

.btn-success {
  background-color: #28a745;
  color: white;
  border: none;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
  border: none;
}

.btn-warning:hover {
  background-color: #e0a800;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #c82333;
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

.filter-group select,
.filter-group input {
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

.search-input i {
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

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: rgba(0, 86, 179, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-icon i {
  font-size: 1.25rem;
  color: #0056b3;
}

.stat-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.stat-content p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0.25rem 0 0;
}

.table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background-color: #f8f9fa;
}

.business-cell {
  display: flex;
  align-items: center;
}

.business-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-right: 0.75rem;
  background-color: #f8f9fa;
}

.business-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.business-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.25rem;
  background-color: #0056b3;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  margin-right: 0.75rem;
}

.business-info {
  display: flex;
  flex-direction: column;
}

.business-name {
  font-weight: 500;
  color: #333;
}

.business-since {
  font-size: 0.75rem;
  color: #6c757d;
}

.contact-info {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.contact-phone,
.contact-email {
  color: #6c757d;
  font-size: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #d4edda;
  color: #155724;
}

.status-pending {
  background-color: #ffeeba;
  color: #856404;
}

.status-suspended {
  background-color: #f5c6cb;
  color: #721c24;
}

.status-inactive {
  background-color: #e2e3e5;
  color: #383d41;
}

.verification-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.verification-verified {
  background-color: #d4edda;
  color: #155724;
}

.verification-unverified {
  background-color: #e2e3e5;
  color: #383d41;
}

.verification-pending {
  background-color: #ffeeba;
  color: #856404;
}

.verification-rejected {
  background-color: #f5c6cb;
  color: #721c24;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  font-weight: 600;
  color: #333;
}

.rating-stars {
  display: flex;
  color: #ffc107;
}

.rating-count {
  font-size: 0.75rem;
  color: #6c757d;
}

.actions-cell {
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
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-icon:hover {
  background-color: #f8f9fa;
}

.btn-icon i {
  font-size: 0.875rem;
  color: #6c757d;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 1rem;
  gap: 0.25rem;
}

.btn-page {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #495057;
}

.btn-page:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #ced4da;
}

.btn-page.active {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  background-color: white;
  border-radius: 0.5rem;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.empty
