<template>
  <div class="zones-management">
    <!-- En-tête -->
    <div class="page-header">
      <h1>Gestion des Zones de Livraison</h1>
      <button @click="showCreateModal = true" class="btn-primary">
        <i class="fas fa-plus"></i>
        Nouvelle Zone
      </button>
    </div>

    <!-- Statistiques -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-map"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.total_zones }}</div>
          <div class="stat-label">Total Zones</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ analytics.active_zones }}</div>
          <div class="stat-label">Zones Actives</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue">
          <i class="fas fa-coins"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ formatCurrency(totalRevenue) }}</div>
          <div class="stat-label">Revenus Total</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon deliveries">
          <i class="fas fa-truck"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalDeliveries }}</div>
          <div class="stat-label">Livraisons</div>
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
      <!-- Liste des zones avec carte -->
      <div v-if="activeTab === 'zones'" class="zones-content">
        <div class="zones-layout">
          <!-- Liste des zones -->
          <div class="zones-list">
            <div class="filters">
              <select v-model="filters.type" @change="loadZones">
                <option value="">Tous les types</option>
                <option value="city">Ville</option>
                <option value="district">District</option>
                <option value="custom">Personnalisée</option>
                <option value="exclusion">Exclusion</option>
              </select>

              <select v-model="filters.active" @change="loadZones">
                <option value="">Toutes</option>
                <option value="true">Actives</option>
                <option value="false">Inactives</option>
              </select>
            </div>

            <div class="zone-items">
              <div
                v-for="zone in zones"
                :key="zone.id"
                :class="[
                  'zone-item',
                  { selected: selectedZone?.id === zone.id, inactive: !zone.is_active },
                ]"
                @click="selectZone(zone)"
              >
                <div class="zone-header">
                  <h4>{{ zone.name }}</h4>
                  <span :class="['zone-type', zone.zone_type]">
                    {{ getZoneTypeLabel(zone.zone_type) }}
                  </span>
                </div>

                <p v-if="zone.description" class="zone-description">
                  {{ zone.description }}
                </p>

                <div class="zone-details">
                  <div class="detail">
                    <i class="fas fa-dollar-sign"></i>
                    <span>{{ formatCurrency(zone.base_price || 0) }} base</span>
                  </div>
                  <div class="detail">
                    <i class="fas fa-road"></i>
                    <span>{{ zone.price_per_km || 0 }} XOF/km</span>
                  </div>
                  <div v-if="zone.max_delivery_time" class="detail">
                    <i class="fas fa-clock"></i>
                    <span>{{ zone.max_delivery_time }}min max</span>
                  </div>
                </div>

                <div class="zone-actions">
                  <button @click.stop="editZone(zone)" class="btn-icon">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click.stop="toggleZoneStatus(zone)"
                    :class="['btn-icon', zone.is_active ? 'danger' : 'success']"
                  >
                    <i :class="zone.is_active ? 'fas fa-pause' : 'fas fa-play'"></i>
                  </button>
                  <button @click.stop="deleteZone(zone.id)" class="btn-icon danger">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Carte interactive -->
          <div class="map-container">
            <ZoneMap
              :zones="zones"
              :selected-zone="selectedZone"
              @zone-selected="selectZone"
              @zone-created="onZoneCreated"
            />
          </div>
        </div>
      </div>

      <!-- Tarification -->
      <div v-if="activeTab === 'pricing'" class="pricing-content">
        <div v-if="selectedZone" class="pricing-details">
          <h3>Tarification - {{ selectedZone.name }}</h3>

          <!-- Paramètres de base -->
          <div class="pricing-section">
            <h4>Paramètres de Base</h4>
            <div class="pricing-grid">
              <div class="form-group">
                <label>Prix de base (XOF)</label>
                <input
                  type="number"
                  v-model="selectedZone.base_price"
                  @change="updateZonePricing"
                />
              </div>

              <div class="form-group">
                <label>Prix par km (XOF)</label>
                <input
                  type="number"
                  v-model="selectedZone.price_per_km"
                  @change="updateZonePricing"
                />
              </div>

              <div class="form-group">
                <label>Prix minimum (XOF)</label>
                <input
                  type="number"
                  v-model="selectedZone.min_delivery_fee"
                  @change="updateZonePricing"
                />
              </div>

              <div class="form-group">
                <label>Prix maximum (XOF)</label>
                <input
                  type="number"
                  v-model="selectedZone.max_delivery_fee"
                  @change="updateZonePricing"
                />
              </div>

              <div class="form-group">
                <label>Multiplicateur heure de pointe</label>
                <input
                  type="number"
                  step="0.1"
                  v-model="selectedZone.peak_hour_multiplier"
                  @change="updateZonePricing"
                />
              </div>

              <div class="form-group">
                <label>Temps max livraison (min)</label>
                <input
                  type="number"
                  v-model="selectedZone.max_delivery_time"
                  @change="updateZonePricing"
                />
              </div>
            </div>
          </div>

          <!-- Règles de tarification -->
          <div class="pricing-section">
            <div class="section-header">
              <h4>Règles de Tarification</h4>
              <button @click="showPricingRuleModal = true" class="btn-secondary">
                <i class="fas fa-plus"></i>
                Ajouter Règle
              </button>
            </div>

            <div class="pricing-rules">
              <div v-for="rule in selectedZone.pricing_rules" :key="rule.id" class="pricing-rule">
                <div class="rule-content">
                  <h5>{{ rule.name }}</h5>
                  <p>{{ rule.condition_type }} {{ rule.operator }} {{ rule.condition_value }}</p>
                  <span class="adjustment">
                    {{
                      rule.adjustment_type === 'percentage'
                        ? rule.price_adjustment + '%'
                        : formatCurrency(rule.price_adjustment)
                    }}
                  </span>
                </div>

                <div class="rule-actions">
                  <label class="toggle">
                    <input
                      type="checkbox"
                      :checked="rule.is_active"
                      @change="togglePricingRule(rule)"
                    />
                    <span class="slider"></span>
                  </label>
                  <button @click="deletePricingRule(rule.id)" class="btn-icon danger">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Restrictions -->
          <div class="pricing-section">
            <div class="section-header">
              <h4>Restrictions</h4>
              <button @click="showRestrictionModal = true" class="btn-secondary">
                <i class="fas fa-plus"></i>
                Ajouter Restriction
              </button>
            </div>

            <div class="restrictions">
              <div
                v-for="restriction in selectedZone.restrictions"
                :key="restriction.id"
                class="restriction-item"
              >
                <div class="restriction-content">
                  <h5>{{ restriction.restriction_type }}</h5>
                  <p>{{ restriction.description }}</p>
                  <span class="restriction-value">{{ restriction.restriction_value }}</span>
                </div>

                <div class="restriction-actions">
                  <label class="toggle">
                    <input
                      type="checkbox"
                      :checked="restriction.is_active"
                      @change="toggleRestriction(restriction)"
                    />
                    <span class="slider"></span>
                  </label>
                  <button @click="deleteRestriction(restriction.id)" class="btn-icon danger">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-zone-selected">
          <i class="fas fa-map-marker-alt"></i>
          <h3>Sélectionnez une zone</h3>
          <p>Choisissez une zone dans la liste pour configurer sa tarification</p>
        </div>
      </div>

      <!-- Analyses -->
      <div v-if="activeTab === 'analytics'" class="analytics">
        <div class="charts-grid">
          <div class="chart-container">
            <h4>Revenus par Zone</h4>
            <HorizontalBarChart :data="revenueByZoneChart" />
          </div>

          <div class="chart-container">
            <h4>Livraisons par Zone</h4>
            <PieChart :data="deliveriesByZoneChart" />
          </div>

          <div class="chart-container">
            <h4>Prix Moyen par Zone</h4>
            <AreaChart :data="avgPriceByZoneChart" />
          </div>

          <div class="chart-container">
            <h4>Performance des Zones</h4>
            <LineChart :data="zonePerformanceChart" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de création/édition de zone -->
    <Modal v-if="showCreateModal || editingZone" @close="closeZoneModal">
      <div class="zone-form">
        <h3>{{ editingZone ? 'Modifier' : 'Créer' }} une Zone</h3>

        <form @submit.prevent="saveZone">
          <div class="form-grid">
            <div class="form-group">
              <label>Nom de la zone *</label>
              <input type="text" v-model="zoneForm.name" required />
            </div>

            <div class="form-group">
              <label>Type de zone *</label>
              <select v-model="zoneForm.zone_type" required>
                <option value="city">Ville</option>
                <option value="district">District</option>
                <option value="custom">Personnalisée</option>
                <option value="exclusion">Zone d'exclusion</option>
              </select>
            </div>

            <div class="form-group">
              <label>Prix de base (XOF)</label>
              <input type="number" v-model="zoneForm.base_price" min="0" />
            </div>

            <div class="form-group">
              <label>Prix par km (XOF)</label>
              <input type="number" v-model="zoneForm.price_per_km" min="0" />
            </div>

            <div class="form-group">
              <label>Temps max livraison (min)</label>
              <input type="number" v-model="zoneForm.max_delivery_time" min="1" />
            </div>

            <div class="form-group">
              <label>Note minimum coursier</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                v-model="zoneForm.min_courier_rating"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="zoneForm.description" rows="3"></textarea>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="zoneForm.requires_special_vehicle" />
              Nécessite un véhicule spécialisé
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeZoneModal">Annuler</button>
            <button type="submit" class="btn-primary">
              {{ editingZone ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { zonesAPI } from '../../api/zones'
import Modal from '../../components/ui/Modal.vue'
import ZoneMap from '../../components/maps/ZoneMap.vue'
import HorizontalBarChart from '../../components/charts/HorizontalBarChart.vue'
import LineChart from '../../components/charts/LineChart.vue'
import PieChart from '../../components/charts/PieChart.vue'
import AreaChart from '../../components/charts/AreaChart.vue'

export default {
  name: 'ZonesView',
  components: {
    Modal,
    ZoneMap,
    HorizontalBarChart,
    LineChart,
    PieChart,
    AreaChart,
  },
  setup() {
    const activeTab = ref('zones')
    const zones = ref([])
    const selectedZone = ref(null)
    const analytics = ref({
      total_zones: 0,
      active_zones: 0,
      revenue_by_zone: [],
    })

    const showCreateModal = ref(false)
    const editingZone = ref(null)
    

    const filters = reactive({
      type: '',
      active: '',
    })

    const zoneForm = reactive({
      name: '',
      description: '',
      zone_type: 'city',
      base_price: null,
      price_per_km: null,
      max_delivery_time: null,
      min_courier_rating: null,
      requires_special_vehicle: false,
    })

    const tabs = [
      { id: 'zones', label: 'Zones' },
      { id: 'pricing', label: 'Tarification' },
      { id: 'analytics', label: 'Analyses' },
    ]

    const totalRevenue = computed(() => {
      return analytics.value.revenue_by_zone.reduce((sum, zone) => sum + zone.revenue, 0)
    })

    const totalDeliveries = computed(() => {
      return analytics.value.revenue_by_zone.reduce((sum, zone) => sum + zone.deliveries, 0)
    })

    const loadZones = async () => {
      try {
        const response = await zonesAPI.getZones({
          zone_type: filters.type,
          is_active: filters.active,
        })
        zones.value = response.data
      } catch (error) {
        console.error('Erreur lors du chargement des zones:', error)
      }
    }

    const loadAnalytics = async () => {
      try {
        const response = await zonesAPI.getAnalytics()
        analytics.value = response.data
      } catch (error) {
        console.error('Erreur lors du chargement des analyses:', error)
      }
    }

    const selectZone = zone => {
      selectedZone.value = zone
    }

    const saveZone = async () => {
      try {
        if (editingZone.value) {
          await zonesAPI.updateZone(editingZone.value.id, zoneForm)
        } else {
          await zonesAPI.createZone(zoneForm)
        }

        closeZoneModal()
        loadZones()
        loadAnalytics()
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }

    const editZone = zone => {
      editingZone.value = zone
      Object.keys(zoneForm).forEach(key => {
        if (zone[key] !== undefined) {
          zoneForm[key] = zone[key]
        }
      })
      showCreateModal.value = true
    }

    const deleteZone = async id => {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
        try {
          await zonesAPI.deleteZone(id)
          loadZones()
          if (selectedZone.value?.id === id) {
            selectedZone.value = null
          }
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
        }
      }
    }

    const toggleZoneStatus = async zone => {
      try {
        await zonesAPI.updateZone(zone.id, { is_active: !zone.is_active })
        loadZones()
      } catch (error) {
        console.error('Erreur lors de la modification du statut:', error)
      }
    }

    const closeZoneModal = () => {
      showCreateModal.value = false
      editingZone.value = null
      Object.keys(zoneForm).forEach(key => {
        zoneForm[key] = ''
      })
    }

    const getZoneTypeLabel = type => {
      const labels = {
        city: 'Ville',
        district: 'District',
        custom: 'Personnalisée',
        exclusion: 'Exclusion',
      }
      return labels[type] || type
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
      }).format(amount || 0)
    }

    onMounted(() => {
      loadZones()
      loadAnalytics()
    })

    return {
      activeTab,
      zones,
      selectedZone,
      analytics,
      showCreateModal,
      editingZone,
      filters,
      zoneForm,
      tabs,
      totalRevenue,
      totalDeliveries,
      loadZones,
      selectZone,
      saveZone,
      editZone,
      deleteZone,
      toggleZoneStatus,
      closeZoneModal,
      getZoneTypeLabel,
      formatCurrency,
    }
  },
}
</script>

<style scoped>
.zones-management {
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
.stat-icon.revenue {
  background: #fef3c7;
  color: #d97706;
}
.stat-icon.deliveries {
  background: #dbeafe;
  color: #2563eb;
}

.zones-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  height: 600px;
}

.zones-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters {
  padding: 15px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 10px;
}

.filters select {
  flex: 1;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.zone-items {
  height: calc(100% - 60px);
  overflow-y: auto;
}

.zone-item {
  padding: 15px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.zone-item:hover {
  background: #f9fafb;
}

.zone-item.selected {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
}

.zone-item.inactive {
  opacity: 0.6;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.zone-header h4 {
  margin: 0;
  color: #111827;
}

.zone-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.zone-type.city {
  background: #dbeafe;
  color: #1e40af;
}
.zone-type.district {
  background: #dcfce7;
  color: #15803d;
}
.zone-type.custom {
  background: #f3e8ff;
  color: #7c3aed;
}
.zone-type.exclusion {
  background: #fee2e2;
  color: #dc2626;
}

.zone-description {
  color: #6b7280;
  font-size: 0.9em;
  margin-bottom: 10px;
}

.zone-details {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.detail {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85em;
  color: #6b7280;
}

.zone-actions {
  display: flex;
  gap: 8px;
}

.map-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pricing-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.pricing-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.pricing-rules,
.restrictions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pricing-rule,
.restriction-item {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-content,
.restriction-content {
  flex: 1;
}

.rule-content h5,
.restriction-content h5 {
  margin: 0 0 5px 0;
  color: #111827;
}

.rule-content p,
.restriction-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9em;
}

.adjustment,
.restriction-value {
  background: #2563eb;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9em;
}

.rule-actions,
.restriction-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 24px;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #2563eb;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.no-zone-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
}

.no-zone-selected i {
  font-size: 4em;
  margin-bottom: 20px;
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
.btn-icon.danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
