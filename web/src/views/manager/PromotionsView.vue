<template>
  <div class="promotions-management">
    <!-- En-tête -->
    <div class="page-header">
      <h1>Gestion des Promotions</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle Promotion
      </button>
    </div>

    <!-- Statistiques -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-tags"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.overview.total_promotions }}</div>
          <div class="stat-label">Total Promotions</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-play"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.overview.active_promotions }}</div>
          <div class="stat-label">Actives</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon usage">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.overview.total_usage }}</div>
          <div class="stat-label">Utilisations</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon discount">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ formatCurrency(analytics.overview.total_discount) }}</div>
          <div class="stat-label">Remises Accordées</div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Contenu des onglets -->
    <div class="tab-content">
      <!-- Liste des promotions -->
      <div v-if="activeTab === 'list'" class="promotions-list">
        <!-- Filtres -->
        <div class="filters">
          <select v-model="filters.status" @change="loadPromotions">
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="active">Active</option>
            <option value="paused">Suspendue</option>
            <option value="expired">Expirée</option>
            <option value="completed">Terminée</option>
          </select>

          <select v-model="filters.type" @change="loadPromotions">
            <option value="">Tous les types</option>
            <option value="discount_percentage">Pourcentage</option>
            <option value="discount_fixed">Montant fixe</option>
            <option value="free_delivery">Livraison gratuite</option>
            <option value="cashback">Cashback</option>
            <option value="referral_bonus">Bonus parrainage</option>
          </select>

          <input
            type="text"
            v-model="searchQuery"
            @input="searchPromotions"
            placeholder="Rechercher une promotion..."
            class="search-input"
          />
        </div>

        <!-- Table des promotions -->
        <div class="table-container">
          <table class="promotions-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Valeur</th>
                <th>Utilisations</th>
                <th>Période</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="promotion in promotions" :key="promotion.id">
                <td>
                  <div class="promotion-name">
                    <strong>{{ promotion.name }}</strong>
                    <small v-if="promotion.description">{{ promotion.description }}</small>
                  </div>
                </td>
                <td>
                  <span v-if="promotion.code" class="promo-code">{{ promotion.code }}</span>
                  <span v-else class="no-code">Auto-appliquée</span>
                </td>
                <td>
                  <span :class="['type-badge', promotion.promotion_type]">
                    {{ getTypeLabel(promotion.promotion_type) }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', promotion.status]">
                    {{ getStatusLabel(promotion.status) }}
                  </span>
                </td>
                <td>
                  <div class="value-display">
                    <span v-if="promotion.promotion_type === 'discount_percentage'">
                      {{ promotion.discount_value }}%
                    </span>
                    <span v-else-if="promotion.promotion_type === 'discount_fixed'">
                      {{ formatCurrency(promotion.discount_value) }}
                    </span>
                    <span v-else-if="promotion.promotion_type === 'free_delivery'"> Gratuite </span>
                    <span v-else-if="promotion.promotion_type === 'cashback'">
                      {{ promotion.cashback_percentage }}%
                    </span>
                  </div>
                </td>
                <td>
                  <div class="usage-info">
                    <span>{{ promotion.current_uses }}</span>
                    <span v-if="promotion.max_uses_total">/ {{ promotion.max_uses_total }}</span>
                  </div>
                </td>
                <td>
                  <div class="period-info">
                    <div>{{ formatDate(promotion.start_date) }}</div>
                    <div>{{ formatDate(promotion.end_date) }}</div>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button @click="editPromotion(promotion)" class="btn-icon">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      v-if="promotion.status === 'draft'"
                      @click="activatePromotion(promotion.id)"
                      class="btn-icon success"
                    >
                      <i class="fas fa-play"></i>
                    </button>
                    <button
                      v-if="promotion.status === 'active'"
                      @click="pausePromotion(promotion.id)"
                      class="btn-icon warning"
                    >
                      <i class="fas fa-pause"></i>
                    </button>
                    <button @click="viewUsage(promotion)" class="btn-icon info">
                      <i class="fas fa-chart-bar"></i>
                    </button>
                    <button @click="deletePromotion(promotion.id)" class="btn-icon danger">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Analyses -->
      <div v-if="activeTab === 'analytics'" class="analytics">
        <div class="charts-grid">
          <div class="chart-container">
            <h4>Promotions les Plus Utilisées</h4>
            <HorizontalBarChart :data="topPromotionsChart" />
          </div>

          <div class="chart-container">
            <h4>Utilisation Quotidienne</h4>
            <LineChart :data="dailyUsageChart" />
          </div>

          <div class="chart-container">
            <h4>Remises par Type</h4>
            <PieChart :data="discountByTypeChart" />
          </div>

          <div class="chart-container">
            <h4>Budget vs Utilisation</h4>
            <AreaChart :data="budgetUsageChart" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition -->
    <Modal v-if="showCreateModal || editingPromotion" @close="closeModal">
      <div class="promotion-form">
        <h3>{{ editingPromotion ? 'Modifier' : 'Créer' }} une Promotion</h3>

        <form @submit.prevent="savePromotion">
          <div class="form-grid">
            <div class="form-group">
              <label>Nom de la promotion *</label>
              <input type="text" v-model="promotionForm.name" required />
            </div>

            <div class="form-group">
              <label>Code promo (optionnel)</label>
              <input type="text" v-model="promotionForm.code" placeholder="Ex: SAVE20" />
            </div>

            <div class="form-group">
              <label>Type de promotion *</label>
              <select v-model="promotionForm.promotion_type" required>
                <option value="discount_percentage">Pourcentage de remise</option>
                <option value="discount_fixed">Montant fixe</option>
                <option value="free_delivery">Livraison gratuite</option>
                <option value="cashback">Cashback</option>
                <option value="referral_bonus">Bonus parrainage</option>
              </select>
            </div>

            <div class="form-group" v-if="promotionForm.promotion_type === 'discount_percentage'">
              <label>Pourcentage de remise (%)</label>
              <input type="number" v-model="promotionForm.discount_value" min="0" max="100" />
            </div>

            <div class="form-group" v-if="promotionForm.promotion_type === 'discount_fixed'">
              <label>Montant de remise (XOF)</label>
              <input type="number" v-model="promotionForm.discount_value" min="0" />
            </div>

            <div class="form-group" v-if="promotionForm.promotion_type === 'cashback'">
              <label>Pourcentage de cashback (%)</label>
              <input type="number" v-model="promotionForm.cashback_percentage" min="0" max="100" />
            </div>

            <div class="form-group">
              <label>Remise maximale (XOF)</label>
              <input type="number" v-model="promotionForm.max_discount" min="0" />
            </div>

            <div class="form-group">
              <label>Commande minimale (XOF)</label>
              <input type="number" v-model="promotionForm.min_order_value" min="0" />
            </div>

            <div class="form-group">
              <label>Utilisations maximales</label>
              <input type="number" v-model="promotionForm.max_uses_total" min="1" />
            </div>

            <div class="form-group">
              <label>Utilisations par utilisateur</label>
              <input type="number" v-model="promotionForm.max_uses_per_user" min="1" />
            </div>

            <div class="form-group">
              <label>Date de début *</label>
              <input type="datetime-local" v-model="promotionForm.start_date" required />
            </div>

            <div class="form-group">
              <label>Date de fin *</label>
              <input type="datetime-local" v-model="promotionForm.end_date" required />
            </div>

            <div class="form-group">
              <label>Budget alloué (XOF)</label>
              <input type="number" v-model="promotionForm.budget_allocated" min="0" />
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="promotionForm.description" rows="3"></textarea>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="promotionForm.is_auto_apply" />
              Application automatique
            </label>

            <label class="checkbox-label">
              <input type="checkbox" v-model="promotionForm.is_stackable" />
              Cumulable avec d'autres promotions
            </label>

            <label class="checkbox-label">
              <input type="checkbox" v-model="promotionForm.requires_referral" />
              Nécessite un parrainage
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal">Annuler</button>
            <button type="submit" class="btn-primary">
              {{ editingPromotion ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { promotionsAPI } from '../../api/promotions'
import Modal from '../../components/ui/Modal.vue'
import HorizontalBarChart from '../../components/charts/HorizontalBarChart.vue'
import LineChart from '../../components/charts/LineChart.vue'
import PieChart from '../../components/charts/PieChart.vue'
import AreaChart from '../../components/charts/AreaChart.vue'

export default {
  name: 'PromotionsView',
  components: {
    Modal,
    HorizontalBarChart,
    LineChart,
    PieChart,
    AreaChart,
  },
  setup() {
    const activeTab = ref('list')
    const promotions = ref([])
    const analytics = ref({
      overview: {
        total_promotions: 0,
        active_promotions: 0,
        total_usage: 0,
        total_discount: 0,
      },
      top_promotions: [],
      daily_usage: [],
    })

    const showCreateModal = ref(false)
    const editingPromotion = ref(null)
    const searchQuery = ref('')

    const filters = reactive({
      status: '',
      type: '',
    })

    const promotionForm = reactive({
      name: '',
      description: '',
      code: '',
      promotion_type: 'discount_percentage',
      discount_value: null,
      max_discount: null,
      cashback_percentage: null,
      min_order_value: null,
      max_uses_total: null,
      max_uses_per_user: null,
      start_date: '',
      end_date: '',
      budget_allocated: null,
      is_auto_apply: false,
      is_stackable: false,
      requires_referral: false,
    })

    const tabs = [
      { id: 'list', label: 'Promotions' },
      { id: 'analytics', label: 'Analyses' },
    ]

    const topPromotionsChart = computed(() => ({
      labels: analytics.value.top_promotions.map(item => item.name),
      datasets: [
        {
          label: 'Utilisations',
          data: analytics.value.top_promotions.map(item => item.usage_count),
          backgroundColor: '#FF6B00',
        },
      ],
    }))

    const dailyUsageChart = computed(() => ({
      labels: analytics.value.daily_usage.map(item => item.date),
      datasets: [
        {
          label: 'Utilisations',
          data: analytics.value.daily_usage.map(item => item.count),
          borderColor: '#2563eb',
          tension: 0.1,
        },
      ],
    }))

    const loadPromotions = async () => {
      try {
        const response = await promotionsAPI.getPromotions({
          status: filters.status,
          promotion_type: filters.type,
        })
        promotions.value = response.data
      } catch (error) {
        console.error('Erreur lors du chargement des promotions:', error)
      }
    }

    const loadAnalytics = async () => {
      try {
        const response = await promotionsAPI.getAnalytics()
        analytics.value = response.data
      } catch (error) {
        console.error('Erreur lors du chargement des analyses:', error)
      }
    }

    const savePromotion = async () => {
      try {
        if (editingPromotion.value) {
          await promotionsAPI.updatePromotion(editingPromotion.value.id, promotionForm)
        } else {
          await promotionsAPI.createPromotion(promotionForm)
        }

        closeModal()
        loadPromotions()
        loadAnalytics()
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }

    const editPromotion = promotion => {
      editingPromotion.value = promotion
      Object.keys(promotionForm).forEach(key => {
        if (promotion[key] !== undefined) {
          promotionForm[key] = promotion[key]
        }
      })
      showCreateModal.value = true
    }

    const activatePromotion = async id => {
      try {
        await promotionsAPI.activatePromotion(id)
        loadPromotions()
      } catch (error) {
        console.error("Erreur lors de l'activation:", error)
      }
    }

    const deletePromotion = async id => {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
        try {
          await promotionsAPI.deletePromotion(id)
          loadPromotions()
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
        }
      }
    }

    const closeModal = () => {
      showCreateModal.value = false
      editingPromotion.value = null
      Object.keys(promotionForm).forEach(key => {
        promotionForm[key] = ''
      })
    }

    const getTypeLabel = type => {
      const labels = {
        discount_percentage: 'Pourcentage',
        discount_fixed: 'Montant fixe',
        free_delivery: 'Livraison gratuite',
        cashback: 'Cashback',
        referral_bonus: 'Parrainage',
      }
      return labels[type] || type
    }

    const getStatusLabel = status => {
      const labels = {
        draft: 'Brouillon',
        active: 'Active',
        paused: 'Suspendue',
        expired: 'Expirée',
        completed: 'Terminée',
      }
      return labels[status] || status
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
      }).format(amount || 0)
    }

    const formatDate = date => {
      return new Date(date).toLocaleDateString('fr-FR')
    }

    onMounted(() => {
      loadPromotions()
      loadAnalytics()
    })

    return {
      activeTab,
      promotions,
      analytics,
      showCreateModal,
      editingPromotion,
      searchQuery,
      filters,
      promotionForm,
      tabs,
      topPromotionsChart,
      dailyUsageChart,
      loadPromotions,
      savePromotion,
      editPromotion,
      activatePromotion,
      deletePromotion,
      closeModal,
      getTypeLabel,
      getStatusLabel,
      formatCurrency,
      formatDate,
    }
  },
}
</script>

<style scoped>
.promotions-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  background: #e5e7eb;
  color: #6b7280;
}

.stat-icon.active {
  background: #dcfce7;
  color: #16a34a;
}
.stat-icon.usage {
  background: #dbeafe;
  color: #2563eb;
}
.stat-icon.discount {
  background: #fef3c7;
  color: #d97706;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #111827;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9em;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.tab-button {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  border-bottom-color: #2563eb;
  color: #2563eb;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.filters select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.promotions-table {
  width: 100%;
  border-collapse: collapse;
}

.promotions-table th,
.promotions-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.promotions-table th {
  background: #f9fafb;
  font-weight: bold;
  color: #374151;
}

.promotion-name strong {
  display: block;
  margin-bottom: 4px;
}

.promotion-name small {
  color: #6b7280;
  font-size: 0.85em;
}

.promo-code {
  background: #2563eb;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.no-code {
  color: #6b7280;
  font-style: italic;
}

.type-badge,
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.type-badge.discount_percentage {
  background: #dbeafe;
  color: #1e40af;
}
.type-badge.discount_fixed {
  background: #dcfce7;
  color: #15803d;
}
.type-badge.free_delivery {
  background: #fef3c7;
  color: #a16207;
}
.type-badge.cashback {
  background: #f3e8ff;
  color: #7c3aed;
}

.status-badge.draft {
  background: #f3f4f6;
  color: #374151;
}
.status-badge.active {
  background: #dcfce7;
  color: #15803d;
}
.status-badge.paused {
  background: #fef3c7;
  color: #a16207;
}
.status-badge.expired {
  background: #fee2e2;
  color: #dc2626;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon:hover {
  background: #e5e7eb;
}
.btn-icon.success {
  background: #dcfce7;
  color: #15803d;
}
.btn-icon.warning {
  background: #fef3c7;
  color: #a16207;
}
.btn-icon.info {
  background: #dbeafe;
  color: #1e40af;
}
.btn-icon.danger {
  background: #fee2e2;
  color: #dc2626;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.promotion-form {
  width: 800px;
  max-width: 90vw;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.form-options {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
