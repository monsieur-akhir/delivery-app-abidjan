<template>
  <div class="transport-rules-view">
    <div class="page-header">
      <h1 class="page-title">Règles de transport</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openRuleModal()">
          <i class="fas fa-plus"></i> Ajouter une règle
        </button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-toggle-on"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeRulesCount }}</div>
          <div class="stat-label">Règles actives</div>
          <div class="stat-info">Sur {{ rules.length }} règles au total</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ uniqueCategories.length }}</div>
          <div class="stat-label">Catégories couvertes</div>
          <div class="stat-info">Sur 11 catégories disponibles</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ uniqueVehicles.length }}</div>
          <div class="stat-label">Véhicules utilisés</div>
          <div class="stat-info">Sur {{ vehicles.length }} véhicules disponibles</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-sort-amount-up"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ averagePriority.toFixed(1) }}</div>
          <div class="stat-label">Priorité moyenne</div>
          <div class="stat-info">Échelle de 1 à 10</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Règles de transport</h2>
        <p class="card-description">
          Définissez les règles d'attribution des véhicules selon le type de livraison
        </p>
      </div>

      <div class="card-body">
        <div class="filters">
          <div class="filter-group">
            <label for="vehicle-filter">Véhicule</label>
            <select id="vehicle-filter" v-model="filters.vehicleId" class="form-control">
              <option value="">Tous les véhicules</option>
              <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                {{ vehicle.name }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="category-filter">Catégorie</label>
            <select id="category-filter" v-model="filters.category" class="form-control">
              <option value="">Toutes les catégories</option>
              <option
                v-for="category in allCategories"
                :key="category.value"
                :value="category.value"
              >
                {{ category.label }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="status-filter">Statut</label>
            <select id="status-filter" v-model="filters.isActive" class="form-control">
              <option value="">Tous les statuts</option>
              <option :value="true">Actif</option>
              <option :value="false">Inactif</option>
            </select>
          </div>

          <button class="btn btn-outline" @click="resetFilters">Réinitialiser les filtres</button>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th>Catégorie</th>
                <th>Distance (km)</th>
                <th>Poids (kg)</th>
                <th>Volume (m³)</th>
                <th>Priorité</th>
                <th>Multiplicateur</th>
                <th>Statut</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="9" class="text-center py-4">
                  <div class="loading-spinner"></div>
                  <p>Chargement des règles de transport...</p>
                </td>
              </tr>
              <tr v-else-if="filteredRules.length === 0">
                <td colspan="9" class="text-center py-4">
                  <p class="text-muted">Aucune règle de transport trouvée</p>
                </td>
              </tr>
              <tr v-for="rule in filteredRules" :key="rule.id">
                <td>
                  <div class="vehicle-cell">
                    <i class="fas fa-car"></i>
                    <div>
                      <div class="vehicle-name">{{ rule.vehicle.name }}</div>
                      <div class="vehicle-type">{{ getVehicleTypeLabel(rule.vehicle.type) }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="category-cell">
                    <i class="fas fa-box"></i>
                    <span>{{ getCargoCategoryLabel(rule.cargoCategory) }}</span>
                  </div>
                </td>
                <td>{{ formatRange(rule.minDistance, rule.maxDistance) }}</td>
                <td>{{ formatRange(rule.minWeight, rule.maxWeight) }}</td>
                <td>{{ formatRange(rule.minVolume, rule.maxVolume) }}</td>
                <td>
                  <div class="priority-cell">
                    <i class="fas fa-sort-amount-up"></i>
                    <span>{{ rule.priority }}</span>
                  </div>
                </td>
                <td>x{{ rule.priceMultiplier.toFixed(2) }}</td>
                <td>
                  <span
                    :class="['status-badge', rule.isActive ? 'status-active' : 'status-inactive']"
                  >
                    {{ rule.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="actions-cell">
                    <button class="btn-icon" @click="openRuleModal(rule)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" @click="toggleRuleStatus(rule)">
                      <i :class="rule.isActive ? 'fas fa-toggle-off' : 'fas fa-toggle-on'"></i>
                    </button>
                    <button class="btn-icon btn-danger" @click="confirmDeleteRule(rule)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Rule Modal -->
    <modal v-if="showRuleModal" @close="closeRuleModal">
      <template #header>
        <h3>
          {{ editingRule ? 'Modifier la règle de transport' : 'Ajouter une règle de transport' }}
        </h3>
      </template>

      <template #body>
        <form @submit.prevent="saveRule" class="rule-form">
          <div class="form-group">
            <label for="vehicle">Véhicule</label>
            <select id="vehicle" v-model="ruleForm.vehicleId" class="form-control" required>
              <option value="" disabled>Sélectionnez un véhicule</option>
              <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                {{ vehicle.name }} ({{ getVehicleTypeLabel(vehicle.type) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="category">Catégorie de cargaison</label>
            <select id="category" v-model="ruleForm.cargoCategory" class="form-control" required>
              <option value="" disabled>Sélectionnez une catégorie</option>
              <option
                v-for="category in allCategories"
                :key="category.value"
                :value="category.value"
              >
                {{ category.label }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="min-distance">Distance minimale (km)</label>
              <input
                id="min-distance"
                type="number"
                v-model.number="ruleForm.minDistance"
                class="form-control"
                min="0"
                step="0.1"
              />
            </div>
            <div class="form-group half">
              <label for="max-distance">Distance maximale (km)</label>
              <input
                id="max-distance"
                type="number"
                v-model.number="ruleForm.maxDistance"
                class="form-control"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="min-weight">Poids minimal (kg)</label>
              <input
                id="min-weight"
                type="number"
                v-model.number="ruleForm.minWeight"
                class="form-control"
                min="0"
                step="0.1"
              />
            </div>
            <div class="form-group half">
              <label for="max-weight">Poids maximal (kg)</label>
              <input
                id="max-weight"
                type="number"
                v-model.number="ruleForm.maxWeight"
                class="form-control"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="min-volume">Volume minimal (m³)</label>
              <input
                id="min-volume"
                type="number"
                v-model.number="ruleForm.minVolume"
                class="form-control"
                min="0"
                step="0.01"
              />
            </div>
            <div class="form-group half">
              <label for="max-volume">Volume maximal (m³)</label>
              <input
                id="max-volume"
                type="number"
                v-model.number="ruleForm.maxVolume"
                class="form-control"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label for="priority">Priorité (1-10)</label>
              <input
                id="priority"
                type="number"
                v-model.number="ruleForm.priority"
                class="form-control"
                min="1"
                max="10"
                required
              />
            </div>
            <div class="form-group half">
              <label for="price-multiplier">Multiplicateur de prix</label>
              <input
                id="price-multiplier"
                type="number"
                v-model.number="ruleForm.priceMultiplier"
                class="form-control"
                min="0.1"
                step="0.1"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-container">
              <input type="checkbox" v-model="ruleForm.isActive" />
              <span class="checkmark"></span>
              Règle active
            </label>
          </div>
        </form>
      </template>

      <template #footer>
        <button class="btn btn-secondary" @click="closeRuleModal">Annuler</button>
        <button class="btn btn-primary" @click="saveRule">
          {{ editingRule ? 'Mettre à jour' : 'Ajouter' }}
        </button>
      </template>
    </modal>

    <!-- Confirm Delete Modal -->
    <confirm-dialog
      v-if="showDeleteConfirm"
      title="Supprimer la règle"
      :message="`Êtes-vous sûr de vouloir supprimer cette règle de transport ? Cette action est irréversible.`"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      @confirm="deleteRule"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from '@/composables/useToast'
import transportApi from '@/api/transport'
import vehiclesApi from '@/api/vehicles'
import Modal from '@/components/ui/Modal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

export default {
  name: 'TransportRulesView',
  components: {
    Modal,
    ConfirmDialog,
  },
  setup() {
    const { showToast } = useToast()

    // Data
    const rules = ref([])
    const vehicles = ref([])
    const loading = ref(true)
    const showRuleModal = ref(false)
    const showDeleteConfirm = ref(false)
    const editingRule = ref(null)
    const ruleToDelete = ref(null)

    const ruleForm = reactive({
      vehicleId: '',
      cargoCategory: '',
      minDistance: null,
      maxDistance: null,
      minWeight: null,
      maxWeight: null,
      minVolume: null,
      maxVolume: null,
      priority: 5,
      priceMultiplier: 1.0,
      isActive: true,
    })

    const filters = reactive({
      vehicleId: '',
      category: '',
      isActive: '',
    })

    // Computed properties
    const activeRulesCount = computed(() => {
      return rules.value.filter(rule => rule.isActive).length
    })

    const uniqueCategories = computed(() => {
      const categories = new Set(rules.value.map(rule => rule.cargoCategory))
      return Array.from(categories)
    })

    const uniqueVehicles = computed(() => {
      const vehicleIds = new Set(rules.value.map(rule => rule.vehicleId))
      return Array.from(vehicleIds)
    })

    const averagePriority = computed(() => {
      if (rules.value.length === 0) return 0
      const sum = rules.value.reduce((acc, rule) => acc + rule.priority, 0)
      return sum / rules.value.length
    })

    const filteredRules = computed(() => {
      return rules.value.filter(rule => {
        if (filters.vehicleId && rule.vehicleId !== filters.vehicleId) return false
        if (filters.category && rule.cargoCategory !== filters.category) return false
        if (filters.isActive !== '' && rule.isActive !== filters.isActive) return false
        return true
      })
    })

    const allCategories = [
      { value: 'documents', label: 'Documents' },
      { value: 'small_packages', label: 'Petits colis' },
      { value: 'medium_packages', label: 'Colis moyens' },
      { value: 'large_packages', label: 'Grands colis' },
      { value: 'fragile', label: 'Objets fragiles' },
      { value: 'food', label: 'Nourriture' },
      { value: 'electronics', label: 'Électronique' },
      { value: 'furniture', label: 'Meubles' },
      { value: 'appliances', label: 'Électroménager' },
      { value: 'construction', label: 'Matériaux de construction' },
      { value: 'custom', label: 'Personnalisé' },
    ]

    // Methods
    const fetchRules = async () => {
      try {
        loading.value = true
        const response = await transportApi.getTransportRules()
        rules.value = response.data
      } catch (error) {
        console.error('Error fetching transport rules:', error)
        showToast('Erreur lors du chargement des règles de transport', 'error')
      } finally {
        loading.value = false
      }
    }

    const fetchVehicles = async () => {
      try {
        const response = await vehiclesApi.getVehicles({ status: 'active' })
        vehicles.value = response.data
      } catch (error) {
        console.error('Error fetching vehicles:', error)
        showToast('Erreur lors du chargement des véhicules', 'error')
      }
    }

    const resetFilters = () => {
      filters.vehicleId = ''
      filters.category = ''
      filters.isActive = ''
    }

    const openRuleModal = (rule = null) => {
      if (rule) {
        editingRule.value = rule
        Object.assign(ruleForm, {
          vehicleId: rule.vehicleId,
          cargoCategory: rule.cargoCategory,
          minDistance: rule.minDistance,
          maxDistance: rule.maxDistance,
          minWeight: rule.minWeight,
          maxWeight: rule.maxWeight,
          minVolume: rule.minVolume,
          maxVolume: rule.maxVolume,
          priority: rule.priority,
          priceMultiplier: rule.priceMultiplier,
          isActive: rule.isActive,
        })
      } else {
        editingRule.value = null
        Object.assign(ruleForm, {
          vehicleId: '',
          cargoCategory: '',
          minDistance: null,
          maxDistance: null,
          minWeight: null,
          maxWeight: null,
          minVolume: null,
          maxVolume: null,
          priority: 5,
          priceMultiplier: 1.0,
          isActive: true,
        })
      }
      showRuleModal.value = true
    }

    const closeRuleModal = () => {
      showRuleModal.value = false
      editingRule.value = null
    }

    const saveRule = async () => {
      try {
        if (editingRule.value) {
          await transportApi.updateTransportRule(editingRule.value.id, ruleForm)
          showToast('Règle de transport mise à jour avec succès', 'success')
        } else {
          await transportApi.createTransportRule(ruleForm)
          showToast('Règle de transport créée avec succès', 'success')
        }
        closeRuleModal()
        fetchRules()
      } catch (error) {
        console.error('Error saving transport rule:', error)
        showToast("Erreur lors de l'enregistrement de la règle de transport", 'error')
      }
    }

    const toggleRuleStatus = async rule => {
      try {
        await transportApi.updateTransportRule(rule.id, {
          isActive: !rule.isActive,
        })
        rule.isActive = !rule.isActive
        showToast(`Règle ${rule.isActive ? 'activée' : 'désactivée'} avec succès`, 'success')
      } catch (error) {
        console.error('Error toggling rule status:', error)
        showToast('Erreur lors de la modification du statut de la règle', 'error')
      }
    }

    const confirmDeleteRule = rule => {
      ruleToDelete.value = rule
      showDeleteConfirm.value = true
    }

    const deleteRule = async () => {
      try {
        await transportApi.deleteTransportRule(ruleToDelete.value.id)
        rules.value = rules.value.filter(r => r.id !== ruleToDelete.value.id)
        showToast('Règle de transport supprimée avec succès', 'success')
      } catch (error) {
        console.error('Error deleting transport rule:', error)
        showToast('Erreur lors de la suppression de la règle de transport', 'error')
      } finally {
        showDeleteConfirm.value = false
        ruleToDelete.value = null
      }
    }

    const getVehicleTypeLabel = type => {
      const labels = {
        scooter: 'Trottinette',
        bicycle: 'Vélo',
        motorcycle: 'Moto',
        van: 'Fourgonnette',
        pickup: 'Pick-up',
        kia_truck: 'Camion KIA',
        moving_truck: 'Camion de déménagement',
        custom: 'Personnalisé',
      }
      return labels[type] || type
    }

    const getCargoCategoryLabel = category => {
      const found = allCategories.find(c => c.value === category)
      return found ? found.label : category
    }

    const formatRange = (min, max, unit = '') => {
      if (min !== null && min !== undefined && max !== null && max !== undefined) {
        return `${min} - ${max}${unit}`
      } else if (min !== null && min !== undefined) {
        return `> ${min}${unit}`
      } else if (max !== null && max !== undefined) {
        return `< ${max}${unit}`
      } else {
        return 'Tous'
      }
    }

    onMounted(async () => {
      await Promise.all([fetchRules(), fetchVehicles()])
    })

    return {
      rules,
      vehicles,
      loading,
      showRuleModal,
      showDeleteConfirm,
      editingRule,
      ruleForm,
      filters,
      activeRulesCount,
      uniqueCategories,
      uniqueVehicles,
      averagePriority,
      filteredRules,
      allCategories,
      resetFilters,
      openRuleModal,
      closeRuleModal,
      saveRule,
      toggleRuleStatus,
      confirmDeleteRule,
      deleteRule,
      getVehicleTypeLabel,
      getCargoCategoryLabel,
      formatRange,
    }
  },
}
</script>

<style scoped>
.transport-rules-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 4px;
}

.stat-info {
  font-size: 12px;
  color: #6b7280;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.card-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.card-body {
  padding: 24px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  align-items: flex-end;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: #374151;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-outline {
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background-color: #f9fafb;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #e5e7eb;
}

.btn-danger {
  color: #ef4444;
}

.btn-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.table td {
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.vehicle-cell,
.category-cell,
.priority-cell {
  display: flex;
  align-items: center;
}

.vehicle-cell i,
.category-cell i,
.priority-cell i {
  margin-right: 8px;
  color: #6b7280;
}

.vehicle-name {
  font-weight: 500;
}

.vehicle-type {
  font-size: 12px;
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-inactive {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #6b7280;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rule-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  flex: 1;
}

.form-group.half {
  flex: 0.5;
}

.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: #374151;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-right: 8px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #e5e7eb;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
