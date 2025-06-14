<template>
  <div class="collaborative-deliveries-view">
    <div class="page-header">
      <h1>Livraisons Collaboratives</h1>
      <div class="actions">
        <button class="btn-primary" @click="showCreateForm = true">
          <i class="fas fa-plus"></i> Nouvelle livraison collaborative
        </button>
      </div>
    </div>

    <div class="filters-container">
      <div class="filters">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status">
            <option value="">Tous</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-filter">Date</label>
          <select id="date-filter" v-model="filters.dateRange">
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search">Recherche</label>
          <input
            type="text"
            id="search"
            v-model="filters.search"
            placeholder="ID, commune, coursier..."
          />
        </div>
      </div>

      <button class="btn-outline" @click="resetFilters">
        <i class="fas fa-redo"></i> Réinitialiser
      </button>
    </div>

    <div class="content-container">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement des livraisons collaboratives...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <p>{{ error }}</p>
        <button @click="fetchDeliveries" class="retry-button">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>

      <div v-else-if="filteredDeliveries.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-box-open"></i>
        </div>
        <h3>Aucune livraison collaborative trouvée</h3>
        <p>Aucune livraison ne correspond à vos critères de recherche.</p>
      </div>

      <template v-else>
        <CollaborativeDeliveryList
          :deliveries="filteredDeliveries"
          @view="viewDelivery"
          @edit="editDelivery"
          @cancel="confirmCancelDelivery"
        />

        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--" class="pagination-btn">
            <i class="fas fa-chevron-left"></i>
          </button>

          <span class="pagination-info"> Page {{ currentPage }} sur {{ totalPages }} </span>

          <button
            :disabled="currentPage === totalPages"
            @click="currentPage++"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </template>
    </div>

    <!-- Modal pour créer une nouvelle livraison collaborative -->
    <Modal
      v-if="showCreateForm"
      @close="showCreateForm = false"
      title="Nouvelle livraison collaborative"
    >
      <CollaborativeDeliveryForm @submit="createDelivery" @cancel="showCreateForm = false" />
    </Modal>

    <!-- Modal pour éditer une livraison collaborative -->
    <Modal
      v-if="showEditForm"
      @close="showEditForm = false"
      title="Modifier la livraison collaborative"
    >
      <CollaborativeDeliveryForm
        :delivery="selectedDelivery"
        @submit="updateDelivery"
        @cancel="showEditForm = false"
      />
    </Modal>

    <!-- Modal pour voir les détails d'une livraison collaborative -->
    <Modal
      v-if="showDetails"
      @close="showDetails = false"
      title="Détails de la livraison collaborative"
      size="large"
    >
      <div class="tabs">
        <button
          :class="['tab-btn', { active: activeTab === 'details' }]"
          @click="activeTab = 'details'"
        >
          Détails
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'collaborators' }]"
          @click="activeTab = 'collaborators'"
        >
          Collaborateurs
        </button>
        <button :class="['tab-btn', { active: activeTab === 'chat' }]" @click="activeTab = 'chat'">
          Chat
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'earnings' }]"
          @click="activeTab = 'earnings'"
        >
          Gains
        </button>
      </div>

      <div class="tab-content">
        <DeliveryDetailsComponent
          v-if="activeTab === 'details' && selectedDelivery"
          :delivery="selectedDelivery"
        />

        <div v-else-if="activeTab === 'collaborators' && selectedDelivery">
          <!-- Composant pour afficher les collaborateurs -->
          <h3>Collaborateurs</h3>
          <!-- Contenu à implémenter -->
        </div>

        <CollaborativeChatComponent
          v-else-if="activeTab === 'chat' && selectedDelivery"
          :deliveryId="selectedDelivery.id"
        />

        <EarningsDistributionComponent
          v-else-if="activeTab === 'earnings' && selectedDelivery"
          :deliveryId="selectedDelivery.id"
        />
      </div>
    </Modal>

    <!-- Modal de confirmation pour annuler une livraison -->
    <ConfirmDialog
      v-if="showCancelConfirm"
      @confirm="cancelDelivery"
      @cancel="showCancelConfirm = false"
      title="Annuler la livraison collaborative"
      message="Êtes-vous sûr de vouloir annuler cette livraison collaborative ? Cette action est irréversible."
      confirmText="Annuler la livraison"
      cancelText="Retour"
      type="danger"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import collaborativeApi from '@/api/collaborative'
import CollaborativeDeliveryList from '@/components/collaborative/CollaborativeDeliveryList.vue'
import CollaborativeDeliveryForm from '@/components/collaborative/CollaborativeDeliveryForm.vue'
import DeliveryDetailsComponent from '@/components/collaborative/DeliveryDetailsComponent.vue'
import CollaborativeChatComponent from '@/components/collaborative/CollaborativeChatComponent.vue'
import EarningsDistributionComponent from '@/components/collaborative/EarningsDistributionComponent.vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

export default {
  name: 'CollaborativeDeliveriesView',

  components: {
    CollaborativeDeliveryList,
    CollaborativeDeliveryForm,
    DeliveryDetailsComponent,
    CollaborativeChatComponent,
    EarningsDistributionComponent,
    Modal,
    ConfirmDialog,
  },

  setup() {
    const { showToast } = useToast()

    // État des données
    const deliveries = ref([])
    const loading = ref(true)
    const error = ref(null)

    // État de la pagination
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)

    // État des filtres
    const filters = ref({
      status: '',
      dateRange: 'all',
      search: '',
    })

    // État des modals
    const showCreateForm = ref(false)
    const showEditForm = ref(false)
    const showDetails = ref(false)
    const showCancelConfirm = ref(false)
    const selectedDelivery = ref(null)
    const activeTab = ref('details')

    // Calcul du nombre total de pages
    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    // Filtrer les livraisons en fonction des critères
    const filteredDeliveries = computed(() => {
      let result = [...deliveries.value]

      // Filtre par statut
      if (filters.value.status) {
        result = result.filter(d => d.status === filters.value.status)
      }

      // Filtre par date
      if (filters.value.dateRange !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        if (filters.value.dateRange === 'today') {
          result = result.filter(d => {
            const date = new Date(d.createdAt)
            return date >= today
          })
        } else if (filters.value.dateRange === 'week') {
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())

          result = result.filter(d => {
            const date = new Date(d.createdAt)
            return date >= weekStart
          })
        } else if (filters.value.dateRange === 'month') {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

          result = result.filter(d => {
            const date = new Date(d.createdAt)
            return date >= monthStart
          })
        }
      }

      // Filtre par recherche
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        result = result.filter(
          d =>
            d.id.toLowerCase().includes(searchLower) ||
            d.pickupCommune.toLowerCase().includes(searchLower) ||
            d.deliveryCommune.toLowerCase().includes(searchLower) ||
            (d.primaryCourierName && d.primaryCourierName.toLowerCase().includes(searchLower))
        )
      }

      // Mettre à jour le nombre total d'éléments filtrés
      totalItems.value = result.length

      // Appliquer la pagination
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value

      return result.slice(start, end)
    })

    // Récupérer les livraisons collaboratives
    const fetchDeliveries = async () => {
      try {
        loading.value = true
        error.value = null

        const response = await collaborativeApi.getCollaborativeDeliveries()
        deliveries.value = response
        totalItems.value = response.length
      } catch (err) {
        console.error('Erreur lors du chargement des livraisons collaboratives:', err)
        error.value = 'Impossible de charger les livraisons collaboratives. Veuillez réessayer.'
      } finally {
        loading.value = false
      }
    }

    // Réinitialiser les filtres
    const resetFilters = () => {
      filters.value = {
        status: '',
        dateRange: 'all',
        search: '',
      }
      currentPage.value = 1
    }

    // Voir les détails d'une livraison
    const viewDelivery = delivery => {
      selectedDelivery.value = delivery
      activeTab.value = 'details'
      showDetails.value = true
    }

    // Éditer une livraison
    const editDelivery = delivery => {
      selectedDelivery.value = delivery
      showEditForm.value = true
    }

    // Confirmer l'annulation d'une livraison
    const confirmCancelDelivery = delivery => {
      selectedDelivery.value = delivery
      showCancelConfirm.value = true
    }

    // Créer une nouvelle livraison collaborative
    const createDelivery = async deliveryData => {
      try {
        loading.value = true

        await collaborativeApi.createCollaborativeDelivery(deliveryData)
        showToast('Livraison collaborative créée avec succès', 'success')
        showCreateForm.value = false

        // Rafraîchir la liste
        await fetchDeliveries()
      } catch (err) {
        console.error('Erreur lors de la création de la livraison collaborative:', err)
        showToast('Erreur lors de la création de la livraison collaborative', 'error')
      } finally {
        loading.value = false
      }
    }

    // Mettre à jour une livraison collaborative
    const updateDelivery = async deliveryData => {
      try {
        loading.value = true

        await collaborativeApi.updateCollaborativeDelivery(selectedDelivery.value.id, deliveryData)
        showToast('Livraison collaborative mise à jour avec succès', 'success')
        showEditForm.value = false

        // Rafraîchir la liste
        await fetchDeliveries()
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la livraison collaborative:', err)
        showToast('Erreur lors de la mise à jour de la livraison collaborative', 'error')
      } finally {
        loading.value = false
      }
    }

    // Annuler une livraison collaborative
    const cancelDelivery = async () => {
      try {
        loading.value = true

        await collaborativeApi.cancelCollaborativeDelivery(selectedDelivery.value.id)
        showToast('Livraison collaborative annulée avec succès', 'success')
        showCancelConfirm.value = false

        // Rafraîchir la liste
        await fetchDeliveries()
      } catch (err) {
        console.error("Erreur lors de l'annulation de la livraison collaborative:", err)
        showToast("Erreur lors de l'annulation de la livraison collaborative", 'error')
      } finally {
        loading.value = false
      }
    }

    // Revenir à la première page quand les filtres changent
    watch(filters, () => {
      currentPage.value = 1
    })

    // Charger les données au montage du composant
    onMounted(() => {
      fetchDeliveries()
    })

    return {
      deliveries,
      loading,
      error,
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      filters,
      filteredDeliveries,
      showCreateForm,
      showEditForm,
      showDetails,
      showCancelConfirm,
      selectedDelivery,
      activeTab,
      fetchDeliveries,
      resetFilters,
      viewDelivery,
      editDelivery,
      confirmCancelDelivery,
      createDelivery,
      updateDelivery,
      cancelDelivery,
    }
  },
}
</script>

<style scoped>
.collaborative-deliveries-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-primary i {
  margin-right: 8px;
}

.filters-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.filters {
  display: flex;
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.btn-outline {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-outline i {
  margin-right: 8px;
}

.content-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.empty-icon {
  color: #9ca3af;
}

.retry-button {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.retry-button i {
  margin-right: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  margin: 0 16px;
  font-size: 14px;
  color: #6b7280;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: #6b7280;
  position: relative;
}

.tab-btn.active {
  color: #3b82f6;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3b82f6;
}

.tab-content {
  padding: 16px;
  min-height: 400px;
}
</style>
