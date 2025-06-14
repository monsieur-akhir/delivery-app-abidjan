<template>
  <div class="couriers-management">
    <div class="page-header">
      <h1>Gestion des coursiers</h1>
      <button @click="showInviteModal = true" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        Inviter un coursier
      </button>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un coursier..."
          @input="debouncedSearch"
        />
      </div>
      <div class="filters">
        <select v-model="statusFilter" @change="loadCouriers">
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
        <select v-model="vehicleTypeFilter" @change="loadCouriers">
          <option value="">Tous les véhicules</option>
          <option value="motorcycle">Moto</option>
          <option value="scooter">Scooter</option>
          <option value="bicycle">Vélo</option>
          <option value="van">Camionnette</option>
        </select>
        <select v-model="sortBy" @change="loadCouriers">
          <option value="created_at">Date d'inscription</option>
          <option value="rating">Note moyenne</option>
          <option value="deliveries_count">Nombre de livraisons</option>
          <option value="earnings">Gains totaux</option>
        </select>
      </div>
    </div>

    <!-- Liste des coursiers -->
    <div class="couriers-grid">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des coursiers...</p>
      </div>

      <div v-else-if="couriers.length === 0" class="empty-state">
        <img src="/empty-couriers.svg" alt="Aucun coursier" />
        <h3>Aucun coursier trouvé</h3>
        <p>Invitez des coursiers pour commencer à livrer vos commandes</p>
        <button @click="showInviteModal = true" class="btn btn-primary">Inviter un coursier</button>
      </div>

      <div v-else v-for="(courier, index) in couriers" :key="courier.id" class="courier-card">
        <div class="courier-header">
          <div class="courier-avatar">
            <img :src="courier.profile_picture || '/default-avatar.png'" :alt="courier.full_name" />
            <div v-if="courier.is_online" class="online-indicator"></div>
          </div>
          <div class="courier-info">
            <h3>{{ courier.full_name }}</h3>
            <p class="courier-phone">{{ courier.phone }}</p>
            <div class="courier-status">
              <span :class="['status-badge', courier.status]">
                {{ getStatusLabel(courier.status) }}
              </span>
              <span v-if="courier.is_favorite" class="favorite-badge">
                <i class="fas fa-star"></i>
                Favori
              </span>
            </div>
          </div>
          <div class="courier-actions">
            <div class="dropdown">
              <button class="dropdown-toggle">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div class="dropdown-menu">
                <button @click="viewCourierDetails(courier)" class="dropdown-item">
                  <i class="fas fa-eye"></i>
                  Voir détails
                </button>
                <button @click="toggleFavorite(courier)" class="dropdown-item">
                  <i :class="courier.is_favorite ? 'fas fa-star-half-alt' : 'fas fa-star'"></i>
                  {{ courier.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
                </button>
                <button
                  @click="sendMessage(courier)"
                  class="dropdown-item"
                  :disabled="!courier.is_online"
                >
                  <i class="fas fa-comment"></i>
                  Envoyer un message
                </button>
                <div class="dropdown-divider"></div>
                <button
                  @click="suspendCourier(courier)"
                  class="dropdown-item danger"
                  v-if="courier.status === 'active'"
                >
                  <i class="fas fa-ban"></i>
                  Suspendre
                </button>
                <button
                  @click="reactivateCourier(courier)"
                  class="dropdown-item"
                  v-if="courier.status === 'suspended'"
                >
                  <i class="fas fa-check"></i>
                  Réactiver
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="courier-stats">
          <div class="stat-item">
            <i class="fas fa-star text-yellow"></i>
            <span>{{ courier.average_rating || 0 }}/5</span>
            <small>({{ courier.ratings_count || 0 }} avis)</small>
          </div>
          <div class="stat-item">
            <i class="fas fa-truck text-blue"></i>
            <span>{{ courier.completed_deliveries || 0 }}</span>
            <small>livraisons</small>
          </div>
          <div class="stat-item">
            <i class="fas fa-euro-sign text-green"></i>
            <span>{{ formatCurrency(courier.total_earnings || 0) }}</span>
            <small>gains totaux</small>
          </div>
        </div>

        <div class="courier-vehicle" v-if="courier.vehicle">
          <div class="vehicle-info">
            <i :class="getVehicleIcon(courier.vehicle.type)"></i>
            <span>{{ getVehicleLabel(courier.vehicle.type) }}</span>
            <span class="vehicle-plate">{{ courier.vehicle.license_plate }}</span>
          </div>
        </div>

        <div class="courier-footer">
          <div class="last-activity">
            <i class="fas fa-clock"></i>
            <span>Dernière activité: {{ formatLastActivity(courier.last_activity) }}</span>
          </div>
          <button
            @click="assignDelivery(courier)"
            class="btn btn-sm btn-outline"
            :disabled="!courier.is_online || courier.status !== 'active'"
          >
            Assigner une livraison
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
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
          :class="['btn', 'btn-outline', { active: page === currentPage }]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="btn btn-outline"
      >
        Suivant
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal d'invitation -->
    <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Inviter un coursier</h2>
          <button @click="closeInviteModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="inviteCourier">
            <div class="form-group">
              <label>Numéro de téléphone</label>
              <input
                v-model="inviteForm.phone"
                type="tel"
                placeholder="+237 6XX XXX XXX"
                required
              />
            </div>
            <div class="form-group">
              <label>Message d'invitation (optionnel)</label>
              <textarea
                v-model="inviteForm.message"
                placeholder="Message personnalisé pour le coursier..."
                rows="4"
              ></textarea>
            </div>
            <div class="form-group">
              <label>Commission proposée (%)</label>
              <input
                v-model.number="inviteForm.commission"
                type="number"
                min="5"
                max="30"
                step="0.5"
                placeholder="15"
              />
              <small>Commission sur chaque livraison (recommandé: 15-20%)</small>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeInviteModal" class="btn btn-outline">Annuler</button>
          <button
            @click="inviteCourier"
            class="btn btn-primary"
            :disabled="!inviteForm.phone || inviting"
          >
            <i v-if="inviting" class="fas fa-spinner fa-spin"></i>
            {{ inviting ? 'Envoi...' : "Envoyer l'invitation" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de détails coursier -->
    <CourierDetailsModal
      v-if="selectedCourier"
      :courier="selectedCourier"
      @close="selectedCourier = null"
      @update="loadCouriers"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchBusinessCouriers,
  inviteBusinessCourier,
  toggleBusinessCourierFavorite,
} from '@/api/business'
import { useToast } from '@/composables/useToast'
import CourierDetailsModal from '@/components/modals/CourierDetailsModal.vue'

export default {
  name: 'BusinessCouriersManagementView',
  components: {
    CourierDetailsModal,
  },
  setup() {
    const router = useRouter()
    const { showToast } = useToast()

    const couriers = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    const statusFilter = ref('')
    const vehicleTypeFilter = ref('')
    const sortBy = ref('created_at')

    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = 12

    const showInviteModal = ref(false)
    const inviting = ref(false)
    const inviteForm = ref({
      phone: '',
      message: '',
      commission: 15,
    })

    const selectedCourier = ref(null)

    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, currentPage.value - 2)
      const end = Math.min(totalPages.value, start + 4)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    })

    const loadCouriers = async (page = 1) => {
      try {
        loading.value = true
        const params = {
          page,
          limit: itemsPerPage,
          search: searchQuery.value,
          status: statusFilter.value,
          vehicle_type: vehicleTypeFilter.value,
          sort: sortBy.value,
        }

        const response = await fetchBusinessCouriers(params)
        couriers.value = response.couriers || []
        currentPage.value = response.page || 1
        totalPages.value = response.total_pages || 1
      } catch (error) {
        console.error('Erreur lors du chargement des coursiers:', error)
        showToast('Erreur lors du chargement des coursiers', 'error')
      } finally {
        loading.value = false
      }
    }

    const debouncedSearch = (() => {
      let timeout
      return () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          currentPage.value = 1
          loadCouriers()
        }, 500)
      }
    })()

    const changePage = page => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        loadCouriers(page)
      }
    }

    const viewCourierDetails = courier => {
      selectedCourier.value = courier
    }

    const toggleFavorite = async courier => {
      try {
        await toggleBusinessCourierFavorite(courier.id, !courier.is_favorite)
        courier.is_favorite = !courier.is_favorite
        showToast(
          courier.is_favorite ? 'Coursier ajouté aux favoris' : 'Coursier retiré des favoris',
          'success'
        )
      } catch (error) {
        console.error('Erreur lors de la mise à jour des favoris:', error)
        showToast('Erreur lors de la mise à jour', 'error')
      }
    }

    const sendMessage = courier => {
      // Rediriger vers l'interface de messagerie
      router.push(`/business/messages?courier=${courier.id}`)
    }

    const assignDelivery = courier => {
      // Rediriger vers la création de livraison avec le coursier pré-sélectionné
      router.push(`/business/deliveries/new?courier=${courier.id}`)
    }

    const suspendCourier = async courier => {
      if (confirm(`Êtes-vous sûr de vouloir suspendre ${courier.full_name} ?`)) {
        try {
          // API call to suspend courier
          showToast('Coursier suspendu avec succès', 'success')
          loadCouriers(currentPage.value)
        } catch (error) {
          console.error('Erreur lors de la suspension:', error)
          showToast('Erreur lors de la suspension', 'error')
        }
      }
    }

    const reactivateCourier = async courier => {
      try {
        // API call to reactivate courier
        showToast('Coursier réactivé avec succès', 'success')
        loadCouriers(currentPage.value)
      } catch (error) {
        console.error('Erreur lors de la réactivation:', error)
        showToast('Erreur lors de la réactivation', 'error')
      }
    }

    const inviteCourier = async () => {
      try {
        inviting.value = true
        await inviteBusinessCourier(inviteForm.value)
        showToast('Invitation envoyée avec succès', 'success')
        closeInviteModal()
        loadCouriers(currentPage.value)
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'invitation:", error)
        showToast("Erreur lors de l'envoi de l'invitation", 'error')
      } finally {
        inviting.value = false
      }
    }

    const closeInviteModal = () => {
      showInviteModal.value = false
      inviteForm.value = {
        phone: '',
        message: '',
        commission: 15,
      }
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount / 100)
    }

    const formatLastActivity = date => {
      if (!date) return 'Jamais'

      const now = new Date()
      const activity = new Date(date)
      const diff = now - activity

      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 60) return `Il y a ${minutes} min`
      if (hours < 24) return `Il y a ${hours}h`
      return `Il y a ${days} jour(s)`
    }

    const getStatusLabel = status => {
      const labels = {
        active: 'Actif',
        inactive: 'Inactif',
        suspended: 'Suspendu',
        pending_verification: 'En attente',
      }
      return labels[status] || status
    }

    const getVehicleIcon = type => {
      const icons = {
        motorcycle: 'fas fa-motorcycle',
        scooter: 'fas fa-motorcycle',
        bicycle: 'fas fa-bicycle',
        van: 'fas fa-truck',
        car: 'fas fa-car',
      }
      return icons[type] || 'fas fa-question'
    }

    const getVehicleLabel = type => {
      const labels = {
        motorcycle: 'Moto',
        scooter: 'Scooter',
        bicycle: 'Vélo',
        van: 'Camionnette',
        car: 'Voiture',
      }
      return labels[type] || type
    }

    onMounted(() => {
      loadCouriers()
    })

    return {
      couriers,
      loading,
      searchQuery,
      statusFilter,
      vehicleTypeFilter,
      sortBy,
      currentPage,
      totalPages,
      visiblePages,
      showInviteModal,
      inviting,
      inviteForm,
      selectedCourier,
      loadCouriers,
      debouncedSearch,
      changePage,
      viewCourierDetails,
      toggleFavorite,
      sendMessage,
      assignDelivery,
      suspendCourier,
      reactivateCourier,
      inviteCourier,
      closeInviteModal,
      formatCurrency,
      formatLastActivity,
      getStatusLabel,
      getVehicleIcon,
      getVehicleLabel,
    }
  },
}
</script>

<style scoped>
.couriers-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 45px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.filters select {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.couriers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.courier-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.courier-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.courier-header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
}

.courier-avatar {
  position: relative;
}

.courier-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
}

.courier-info {
  flex: 1;
}

.courier-info h3 {
  margin: 0 0 5px 0;
  color: #1f2937;
}

.courier-phone {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.courier-status {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}
.status-badge.inactive {
  background: #f3f4f6;
  color: #6b7280;
}
.status-badge.suspended {
  background: #fee2e2;
  color: #dc2626;
}

.favorite-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.courier-actions {
  position: relative;
}

.dropdown {
  position: relative;
}

.dropdown-toggle {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 10;
  display: none;
}

.dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f9fafb;
}

.dropdown-item.danger {
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 5px 0;
}

.courier-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-item i {
  margin-bottom: 5px;
}

.stat-item span {
  font-weight: 600;
  color: #1f2937;
}

.stat-item small {
  color: #6b7280;
  font-size: 12px;
}

.text-yellow {
  color: #f59e0b;
}
.text-blue {
  color: #3b82f6;
}
.text-green {
  color: #10b981;
}

.courier-vehicle {
  margin-bottom: 15px;
  padding: 10px;
  background: #f3f4f6;
  border-radius: 6px;
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.vehicle-plate {
  margin-left: auto;
  font-weight: 600;
  color: #1f2937;
}

.courier-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.last-activity {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
}

.btn.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn.btn-primary:hover {
  background: #2563eb;
}

.btn.btn-outline {
  background: transparent;
}

.btn.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state img {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #1f2937;
  margin-bottom: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #6b7280;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .couriers-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .courier-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .courier-footer {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .modal {
    width: 95%;
  }
}
</style>
