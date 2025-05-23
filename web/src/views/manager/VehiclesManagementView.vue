<template>
  <div class="vehicles-management">
    <h1 class="page-title">Gestion des Véhicules</h1>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filter-group">
        <label for="vehicle-type">Type de véhicule</label>
        <select id="vehicle-type" v-model="filters.vehicleType" class="form-control">
          <option value="">Tous les types</option>
          <option v-for="type in vehicleTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="status">Statut</label>
        <select id="status" v-model="filters.status" class="form-control">
          <option value="">Tous les statuts</option>
          <option v-for="status in vehicleStatuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="business">Entreprise</label>
        <select id="business" v-model="filters.businessId" class="form-control">
          <option value="">Toutes les entreprises</option>
          <option v-for="business in businesses" :key="business.id" :value="business.id">
            {{ business.name }}
          </option>
        </select>
      </div>

      <button @click="applyFilters" class="btn btn-primary">
        <font-awesome-icon icon="filter" /> Filtrer
      </button>

      <button @click="resetFilters" class="btn btn-outline-secondary">
        <font-awesome-icon icon="times" /> Réinitialiser
      </button>
    </div>

    <!-- Actions -->
    <div class="actions-container">
      <button @click="showAddVehicleModal = true" class="btn btn-success">
        <font-awesome-icon icon="plus" /> Ajouter un véhicule
      </button>
      <button @click="exportVehicles" class="btn btn-outline-primary">
        <font-awesome-icon icon="file-export" /> Exporter
      </button>
    </div>

    <!-- Tableau des véhicules -->
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th @click="sortBy('name')">
              Nom
              <font-awesome-icon v-if="sortKey === 'name'" :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'" />
            </th>
            <th @click="sortBy('type')">
              Type
              <font-awesome-icon v-if="sortKey === 'type'" :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'" />
            </th>
            <th @click="sortBy('license_plate')">
              Plaque
              <font-awesome-icon v-if="sortKey === 'license_plate'" :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'" />
            </th>
            <th @click="sortBy('status')">
              Statut
              <font-awesome-icon v-if="sortKey === 'status'" :icon="sortOrder === 'asc' ? 'sort-up' : 'sort-down'" />
            </th>
            <th>Électrique</th>
            <th>Documents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody v-if="!loading && vehicles.length > 0">
          <tr v-for="vehicle in sortedVehicles" :key="vehicle.id">
            <td>{{ vehicle.name }}</td>
            <td>
              <span class="vehicle-type-badge" :class="getVehicleTypeClass(vehicle.type)">
                <font-awesome-icon :icon="getVehicleTypeIcon(vehicle.type)" />
                {{ getVehicleTypeLabel(vehicle.type) }}
              </span>
            </td>
            <td>{{ vehicle.license_plate }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(vehicle.status)">
                {{ getStatusLabel(vehicle.status) }}
              </span>
            </td>
            <td>
              <font-awesome-icon v-if="vehicle.is_electric" icon="bolt" class="text-success" />
              <font-awesome-icon v-else icon="gas-pump" class="text-secondary" />
            </td>
            <td>
              <div class="document-badges">
                <span 
                  class="document-badge" 
                  :class="vehicle.registration_document_url ? 'document-valid' : 'document-missing'"
                  :title="vehicle.registration_document_url ? 'Document présent' : 'Document manquant'"
                >
                  <font-awesome-icon :icon="vehicle.registration_document_url ? 'check' : 'times'" />
                  Immatriculation
                </span>
                <span 
                  class="document-badge" 
                  :class="vehicle.insurance_document_url ? 'document-valid' : 'document-missing'"
                  :title="vehicle.insurance_document_url ? 'Document présent' : 'Document manquant'"
                >
                  <font-awesome-icon :icon="vehicle.insurance_document_url ? 'check' : 'times'" />
                  Assurance
                </span>
                <span 
                  class="document-badge" 
                  :class="vehicle.technical_inspection_url ? 'document-valid' : 'document-missing'"
                  :title="vehicle.technical_inspection_url ? 'Document présent' : 'Document manquant'"
                >
                  <font-awesome-icon :icon="vehicle.technical_inspection_url ? 'check' : 'times'" />
                  Contrôle technique
                </span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="editVehicle(vehicle)" class="btn btn-sm btn-primary">
                  <font-awesome-icon icon="edit" />
                </button>
                <button @click="viewVehicle(vehicle)" class="btn btn-sm btn-info">
                  <font-awesome-icon icon="eye" />
                </button>
                <button @click="confirmDeleteVehicle(vehicle)" class="btn btn-sm btn-danger">
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="loading">
          <tr>
            <td colspan="7" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Chargement...</span>
              </div>
              <p class="mt-2">Chargement des véhicules...</p>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="7" class="text-center py-4">
              <font-awesome-icon icon="car" size="2x" class="text-muted mb-3" />
              <p>Aucun véhicule trouvé.</p>
              <button @click="showAddVehicleModal = true" class="btn btn-primary">
                <font-awesome-icon icon="plus" /> Ajouter un véhicule
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-container">
      <button 
        @click="changePage(currentPage - 1)" 
        class="btn btn-outline-primary" 
        :disabled="currentPage === 1"
      >
        <font-awesome-icon icon="chevron-left" /> Précédent
      </button>
      <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
      <button 
        @click="changePage(currentPage + 1)" 
        class="btn btn-outline-primary" 
        :disabled="currentPage === totalPages"
      >
        Suivant <font-awesome-icon icon="chevron-right" />
      </button>
    </div>

    <!-- Modal d'ajout de véhicule -->
    <div class="modal fade" :class="{ 'show': showAddVehicleModal }" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ajouter un véhicule</h5>
            <button type="button" class="close" @click="showAddVehicleModal = false">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitVehicleForm">
              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="name">Nom du véhicule</label>
                  <input type="text" class="form-control" id="name" v-model="vehicleForm.name" required>
                </div>
                <div class="form-group col-md-6">
                  <label for="type">Type de véhicule</label>
                  <select class="form-control" id="type" v-model="vehicleForm.type" required>
                    <option v-for="type in vehicleTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group" v-if="vehicleForm.type === 'custom'">
                <label for="custom_type">Type personnalisé</label>
                <input type="text" class="form-control" id="custom_type" v-model="vehicleForm.custom_type" required>
              </div>

              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="license_plate">Plaque d'immatriculation</label>
                  <input type="text" class="form-control" id="license_plate" v-model="vehicleForm.license_plate" required>
                </div>
                <div class="form-group col-md-6">
                  <label for="status">Statut</label>
                  <select class="form-control" id="status" v-model="vehicleForm.status">
                    <option v-for="status in vehicleStatuses" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col-md-4">
                  <label for="brand">Marque</label>
                  <input type="text" class="form-control" id="brand" v-model="vehicleForm.brand">
                </div>
                <div class="form-group col-md-4">
                  <label for="model">Modèle</label>
                  <input type="text" class="form-control" id="model" v-model="vehicleForm.model">
                </div>
                <div class="form-group col-md-4">
                  <label for="year">Année</label>
                  <input type="number" class="form-control" id="year" v-model="vehicleForm.year">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col-md-4">
                  <label for="color">Couleur</label>
                  <input type="text" class="form-control" id="color" v-model="vehicleForm.color">
                </div>
                <div class="form-group col-md-4">
                  <label for="max_weight">Poids max (kg)</label>
                  <input type="number" step="0.1" class="form-control" id="max_weight" v-model="vehicleForm.max_weight">
                </div>
                <div class="form-group col-md-4">
                  <label for="max_volume">Volume max (m³)</label>
                  <input type="number" step="0.1" class="form-control" id="max_volume" v-model="vehicleForm.max_volume">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col-md-6">
                  <label for="max_distance">Distance max (km)</label>
                  <input type="number" step="0.1" class="form-control" id="max_distance" v-model="vehicleForm.max_distance">
                </div>
                <div class="form-group col-md-6">
                  <label for="business_id">Entreprise</label>
                  <select class="form-control" id="business_id" v-model="vehicleForm.business_id">
                    <option value="">Aucune entreprise</option>
                    <option v-for="business in businesses" :key="business.id" :value="business.id">
                      {{ business.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <div class="custom-control custom-switch">
                  <input type="checkbox" class="custom-control-input" id="is_electric" v-model="vehicleForm.is_electric">
                  <label class="custom-control-label" for="is_electric">Véhicule électrique</label>
                </div>
              </div>

              <div class="form-group">
                <label for="photo_url">URL de la photo</label>
                <input type="url" class="form-control" id="photo_url" v-model="vehicleForm.photo_url">
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="showAddVehicleModal = false">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <span v-if="submitting" class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                  {{ editMode ? 'Mettre à jour' : 'Ajouter' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div class="modal fade" :class="{ 'show': showDeleteModal }" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmer la suppression</h5>
            <button type="button" class="close" @click="showDeleteModal = false">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Êtes-vous sûr de vouloir supprimer le véhicule <strong>{{ vehicleToDelete?.name }}</strong> ?</p>
            <p class="text-danger">Cette action est irréversible.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Annuler</button>
            <button type="button" class="btn btn-danger" @click="deleteVehicle" :disabled="deleting">
              <span v-if="deleting" class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails du véhicule -->
    <div class="modal fade" :class="{ 'show': showViewModal }" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Détails du véhicule</h5>
            <button type="button" class="close" @click="showViewModal = false">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body" v-if="selectedVehicle">
            <div class="vehicle-details">
              <div class="vehicle-header">
                <div class="vehicle-image">
                  <img :src="selectedVehicle.photo_url || '/placeholder-vehicle.jpg'" alt="Photo du véhicule">
                </div>
                <div class="vehicle-info">
                  <h3>{{ selectedVehicle.name }}</h3>
                  <div class="vehicle-badges">
                    <span class="vehicle-type-badge" :class="getVehicleTypeClass(selectedVehicle.type)">
                      <font-awesome-icon :icon="getVehicleTypeIcon(selectedVehicle.type)" />
                      {{ getVehicleTypeLabel(selectedVehicle.type) }}
                    </span>
                    <span class="status-badge" :class="getStatusClass(selectedVehicle.status)">
                      {{ getStatusLabel(selectedVehicle.status) }}
                    </span>
                    <span v-if="selectedVehicle.is_electric" class="electric-badge">
                      <font-awesome-icon icon="bolt" /> Électrique
                    </span>
                  </div>
                </div>
              </div>

              <div class="vehicle-specs">
                <div class="spec-item">
                  <div class="spec-label">Plaque d'immatriculation</div>
                  <div class="spec-value">{{ selectedVehicle.license_plate }}</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.brand">
                  <div class="spec-label">Marque</div>
                  <div class="spec-value">{{ selectedVehicle.brand }}</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.model">
                  <div class="spec-label">Modèle</div>
                  <div class="spec-value">{{ selectedVehicle.model }}</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.year">
                  <div class="spec-label">Année</div>
                  <div class="spec-value">{{ selectedVehicle.year }}</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.color">
                  <div class="spec-label">Couleur</div>
                  <div class="spec-value">{{ selectedVehicle.color }}</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.max_weight">
                  <div class="spec-label">Poids maximum</div>
                  <div class="spec-value">{{ selectedVehicle.max_weight }} kg</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.max_volume">
                  <div class="spec-label">Volume maximum</div>
                  <div class="spec-value">{{ selectedVehicle.max_volume }} m³</div>
                </div>
                <div class="spec-item" v-if="selectedVehicle.max_distance">
                  <div class="spec-label">Distance maximum</div>
                  <div class="spec-value">{{ selectedVehicle.max_distance }} km</div>
                </div>
              </div>

              <div class="vehicle-documents">
                <h4>Documents</h4>
                <div class="document-list">
                  <div class="document-item">
                    <div class="document-info">
                      <font-awesome-icon :icon="selectedVehicle.registration_document_url ? 'check-circle' : 'times-circle'" :class="selectedVehicle.registration_document_url ? 'text-success' : 'text-danger'" />
                      <span>Certificat d'immatriculation</span>
                    </div>
                    <div class="document-actions">
                      <a v-if="selectedVehicle.registration_document_url" :href="selectedVehicle.registration_document_url" target="_blank" class="btn btn-sm btn-outline-primary">
                        <font-awesome-icon icon="eye" /> Voir
                      </a>
                      <button v-else class="btn btn-sm btn-outline-secondary" @click="uploadDocument(selectedVehicle.id, 'registration')">
                        <font-awesome-icon icon="upload" /> Télécharger
                      </button>
                    </div>
                  </div>
                  <div class="document-item">
                    <div class="document-info">
                      <font-awesome-icon :icon="selectedVehicle.insurance_document_url ? 'check-circle' : 'times-circle'" :class="selectedVehicle.insurance_document_url ? 'text-success' : 'text-danger'" />
                      <span>Assurance</span>
                    </div>
                    <div class="document-actions">
                      <a v-if="selectedVehicle.insurance_document_url" :href="selectedVehicle.insurance_document_url" target="_blank" class="btn btn-sm btn-outline-primary">
                        <font-awesome-icon icon="eye" /> Voir
                      </a>
                      <button v-else class="btn btn-sm btn-outline-secondary" @click="uploadDocument(selectedVehicle.id, 'insurance')">
                        <font-awesome-icon icon="upload" /> Télécharger
                      </button>
                    </div>
                  </div>
                  <div class="document-item">
                    <div class="document-info">
                      <font-awesome-icon :icon="selectedVehicle.technical_inspection_url ? 'check-circle' : 'times-circle'" :class="selectedVehicle.technical_inspection_url ? 'text-success' : 'text-danger'" />
                      <span>Contrôle technique</span>
                    </div>
                    <div class="document-actions">
                      <a v-if="selectedVehicle.technical_inspection_url" :href="selectedVehicle.technical_inspection_url" target="_blank" class="btn btn-sm btn-outline-primary">
                        <font-awesome-icon icon="eye" /> Voir
                      </a>
                      <button v-else class="btn btn-sm btn-outline-secondary" @click="uploadDocument(selectedVehicle.id, 'technical_inspection')">
                        <font-awesome-icon icon="upload" /> Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showViewModal = false">Fermer</button>
            <button type="button" class="btn btn-primary" @click="editVehicle(selectedVehicle)">
              <font-awesome-icon icon="edit" /> Modifier
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Input file caché pour l'upload de documents -->
    <input 
      type="file" 
      ref="fileInput" 
      style="display: none" 
      @change="handleFileUpload" 
      accept=".pdf,.jpg,.jpeg,.png"
    >
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { 
  fetchVehicles, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle as apiDeleteVehicle,
  uploadVehicleDocument
} from '@/api/transport'
import { fetchBusinesses } from '@/api/business'
import { exportToCSV } from '@/utils/export-utils'

export default {
  name: 'VehiclesManagementView',
  setup() {
    const { showToast } = useToast()
    
    // État
    const vehicles = ref([])
    const businesses = ref([])
    const loading = ref(true)
    const submitting = ref(false)
    const deleting = ref(false)
    const uploadingDocument = ref(false)
    const currentDocumentType = ref(null)
    const currentVehicleId = ref(null)
    
    // Pagination
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    
    // Tri
    const sortKey = ref('name')
    const sortOrder = ref('asc')
    
    // Filtres
    const filters = reactive({
      vehicleType: '',
      status: '',
      businessId: ''
    })
    
    // Modals
    const showAddVehicleModal = ref(false)
    const showDeleteModal = ref(false)
    const showViewModal = ref(false)
    const editMode = ref(false)
    const vehicleToDelete = ref(null)
    const selectedVehicle = ref(null)
    
    // Formulaire
    const vehicleForm = reactive({
      name: '',
      type: 'van',
      custom_type: '',
      license_plate: '',
      brand: '',
      model: '',
      year: null,
      color: '',
      max_weight: null,
      max_volume: null,
      max_distance: null,
      photo_url: '',
      status: 'active',
      is_electric: false,
      business_id: ''
    })
    
    // Référence au input file
    const fileInput = ref(null)
    
    // Options pour les types de véhicules
    const vehicleTypes = [
      { value: 'scooter', label: 'Trottinette', icon: 'walking' },
      { value: 'bicycle', label: 'Vélo', icon: 'bicycle' },
      { value: 'motorcycle', label: 'Moto', icon: 'motorcycle' },
      { value: 'van', label: 'Fourgonnette', icon: 'shuttle-van' },
      { value: 'pickup', label: 'Pick-up', icon: 'truck-pickup' },
      { value: 'kia_truck', label: 'Camion Kia', icon: 'truck' },
      { value: 'moving_truck', label: 'Camion de déménagement', icon: 'truck-moving' },
      { value: 'custom', label: 'Personnalisé', icon: 'car-alt' }
    ]
    
    // Options pour les statuts
    const vehicleStatuses = [
      { value: 'active', label: 'Actif', class: 'status-active' },
      { value: 'maintenance', label: 'En maintenance', class: 'status-maintenance' },
      { value: 'inactive', label: 'Inactif', class: 'status-inactive' },
      { value: 'pending_verification', label: 'En attente de vérification', class: 'status-pending' }
    ]
    
    // Calcul du nombre total de pages
    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / itemsPerPage.value)
    })
    
    // Tri des véhicules
    const sortedVehicles = computed(() => {
      return [...vehicles.value].sort((a, b) => {
        let aValue = a[sortKey.value]
        let bValue = b[sortKey.value]
        
        // Gestion des valeurs nulles
        if (aValue === null) aValue = ''
        if (bValue === null) bValue = ''
        
        // Comparaison
        if (sortOrder.value === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    })
    
    // Chargement des données
    onMounted(async () => {
      try {
        loading.value = true
        
        // Charger les véhicules
        const response = await fetchVehicles()
        vehicles.value = response.items
        totalItems.value = response.total
        
        // Charger les entreprises
        const businessesResponse = await fetchBusinesses()
        businesses.value = businessesResponse.items
      } catch (error) {
        console.error('Error loading vehicles:', error)
        showToast('Erreur lors du chargement des véhicules', 'error')
      } finally {
        loading.value = false
      }
    })
    
    // Méthodes
    const loadVehicles = async () => {
      try {
        loading.value = true
        
        const params = {
          skip: (currentPage.value - 1) * itemsPerPage.value,
          limit: itemsPerPage.value
        }
        
        // Ajouter les filtres
        if (filters.vehicleType) params.vehicle_type = filters.vehicleType
        if (filters.status) params.status = filters.status
        if (filters.businessId) params.business_id = filters.businessId
        
        const response = await fetchVehicles(params)
        vehicles.value = response.items
        totalItems.value = response.total
      } catch (error) {
        console.error('Error loading vehicles:', error)
        showToast('Erreur lors du chargement des véhicules', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const resetForm = () => {
      Object.keys(vehicleForm).forEach(key => {
        if (typeof vehicleForm[key] === 'boolean') {
          vehicleForm[key] = false
        } else if (typeof vehicleForm[key] === 'number') {
          vehicleForm[key] = null
        } else {
          vehicleForm[key] = ''
        }
      })
      
      vehicleForm.type = 'van'
      vehicleForm.status = 'active'
    }
    
    const submitVehicleForm = async () => {
      try {
        submitting.value = true
        
        // Validation
        if (vehicleForm.type === 'custom' && !vehicleForm.custom_type) {
          showToast('Veuillez spécifier un type personnalisé', 'error')
          return
        }
        
        // Préparer les données
        const vehicleData = { ...vehicleForm }
        
        // Convertir les valeurs vides en null
        Object.keys(vehicleData).forEach(key => {
          if (vehicleData[key] === '') {
            vehicleData[key] = null
          }
        })
        
        if (editMode.value) {
          // Mise à jour
          await updateVehicle(selectedVehicle.value.id, vehicleData)
          showToast('Véhicule mis à jour avec succès', 'success')
        } else {
          // Création
          await createVehicle(vehicleData)
          showToast('Véhicule ajouté avec succès', 'success')
        }
        
        // Recharger les véhicules
        await loadVehicles()
        
        // Fermer le modal et réinitialiser le formulaire
        showAddVehicleModal.value = false
        resetForm()
      } catch (error) {
        console.error('Error submitting vehicle form:', error)
        showToast('Erreur lors de l\'enregistrement du véhicule', 'error')
      } finally {
        submitting.value = false
      }
    }
    
    const editVehicle = (vehicle) => {
      // Remplir le formulaire avec les données du véhicule
      Object.keys(vehicleForm).forEach(key => {
        vehicleForm[key] = vehicle[key] !== undefined ? vehicle[key] : vehicleForm[key]
      })
      
      // Activer le mode édition
      editMode.value = true
      selectedVehicle.value = vehicle
      
      // Fermer le modal de détails si ouvert
      showViewModal.value = false
      
      // Ouvrir le modal d'édition
      showAddVehicleModal.value = true
    }
    
    const viewVehicle = (vehicle) => {
      selectedVehicle.value = vehicle
      showViewModal.value = true
    }
    
    const confirmDeleteVehicle = (vehicle) => {
      vehicleToDelete.value = vehicle
      showDeleteModal.value = true
    }
    
    const deleteVehicle = async () => {
      try {
        deleting.value = true
        
        await apiDeleteVehicle(vehicleToDelete.value.id)
        showToast('Véhicule supprimé avec succès', 'success')
        
        // Recharger les véhicules
        await loadVehicles()
        
        // Fermer le modal
        showDeleteModal.value = false
        vehicleToDelete.value = null
      } catch (error) {
        console.error('Error deleting vehicle:', error)
        showToast('Erreur lors de la suppression du véhicule', 'error')
      } finally {
        deleting.value = false
      }
    }
    
    const uploadDocument = (vehicleId, documentType) => {
      currentVehicleId.value = vehicleId
      currentDocumentType.value = documentType
      fileInput.value.click()
    }
    
    const handleFileUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        uploadingDocument.value = true
        
        // Créer un FormData
        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', currentDocumentType.value)
        
        // Envoyer le fichier
        await uploadVehicleDocument(currentVehicleId.value, formData)
        
        // Recharger les véhicules
        await loadVehicles()
        
        // Mettre à jour le véhicule sélectionné si nécessaire
        if (selectedVehicle.value && selectedVehicle.value.id === currentVehicleId.value) {
          const updatedVehicle = vehicles.value.find(v => v.id === currentVehicleId.value)
          if (updatedVehicle) {
            selectedVehicle.value = updatedVehicle
          }
        }
        
        showToast('Document téléchargé avec succès', 'success')
      } catch (error) {
        console.error('Error uploading document:', error)
        showToast('Erreur lors du téléchargement du document', 'error')
      } finally {
        uploadingDocument.value = false
        currentVehicleId.value = null
        currentDocumentType.value = null
        
        // Réinitialiser l'input file
        event.target.value = null
      }
    }
    
    const sortBy = (key) => {
      if (sortKey.value === key) {
        // Inverser l'ordre si on clique sur la même colonne
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        // Nouvelle colonne, ordre ascendant par défaut
        sortKey.value = key
        sortOrder.value = 'asc'
      }
    }
    
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      currentPage.value = page
      loadVehicles()
    }
    
    const applyFilters = () => {
      currentPage.value = 1 // Revenir à la première page
      loadVehicles()
    }
    
    const resetFilters = () => {
      filters.vehicleType = ''
      filters.status = ''
      filters.businessId = ''
      currentPage.value = 1
      loadVehicles()
    }
    
    const exportVehicles = () => {
      const data = vehicles.value.map(vehicle => ({
        'Nom': vehicle.name,
        'Type': getVehicleTypeLabel(vehicle.type),
        'Plaque': vehicle.license_plate,
        'Marque': vehicle.brand || '',
        'Modèle': vehicle.model || '',
        'Année': vehicle.year || '',
        'Statut': getStatusLabel(vehicle.status),
        'Électrique': vehicle.is_electric ? 'Oui' : 'Non',
        'Poids max (kg)': vehicle.max_weight || '',
        'Volume max (m³)': vehicle.max_volume || '',
        'Distance max (km)': vehicle.max_distance || ''
      }))
      
      exportToCSV(data, 'vehicles_export.csv')
      showToast('Export réussi', 'success')
    }
    
    // Fonctions utilitaires
    const getVehicleTypeLabel = (type) => {
      const vehicleType = vehicleTypes.find(t => t.value === type)
      return vehicleType ? vehicleType.label : type
    }
    
    const getVehicleTypeIcon = (type) => {
      const vehicleType = vehicleTypes.find(t => t.value === type)
      return vehicleType ? vehicleType.icon : 'car-alt'
    }
    
    const getVehicleTypeClass = (type) => {
      return `vehicle-type-${type}`
    }
    
    const getStatusLabel = (status) => {
      const vehicleStatus = vehicleStatuses.find(s => s.value === status)
      return vehicleStatus ? vehicleStatus.label : status
    }
    
    const getStatusClass = (status) => {
      const vehicleStatus = vehicleStatuses.find(s => s.value === status)
      return vehicleStatus ? vehicleStatus.class : ''
    }
    
    return {
      vehicles,
      businesses,
      loading,
      submitting,
      deleting,
      currentPage,
      totalPages,
      sortKey,
      sortOrder,
      filters,
      showAddVehicleModal,
      showDeleteModal,
      showViewModal,
      editMode,
      vehicleToDelete,
      selectedVehicle,
      vehicleForm,
      fileInput,
      vehicleTypes,
      vehicleStatuses,
      sortedVehicles,
      loadVehicles,
      submitVehicleForm,
      editVehicle,
      viewVehicle,
      confirmDeleteVehicle,
      deleteVehicle,
      uploadDocument,
      handleFileUpload,
      sortBy,
      changePage,
      applyFilters,
      resetFilters,
      exportVehicles,
      getVehicleTypeLabel,
      getVehicleTypeIcon,
      getVehicleTypeClass,
      getStatusLabel,
      getStatusClass
    }
  }
}
</script>

<style scoped>
.vehicles-management {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.actions-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-responsive {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-info {
  font-weight: 500;
}

.vehicle-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.vehicle-type-scooter {
  background-color: #e3f2fd;
  color: #1976d2;
}

.vehicle-type-bicycle {
  background-color: #e8f5e9;
  color: #388e3c;
}

.vehicle-type-motorcycle {
  background-color: #fff3e0;
  color: #f57c00;
}

.vehicle-type-van {
  background-color: #e8eaf6;
  color: #3f51b5;
}

.vehicle-type-pickup {
  background-color: #fce4ec;
  color: #d81b60;
}

.vehicle-type-kia_truck {
  background-color: #f3e5f5;
  color: #8e24aa;
}

.vehicle-type-moving_truck {
  background-color: #ede7f6;
  color: #5e35b1;
}

.vehicle-type-custom {
  background-color: #f5f5f5;
  color: #616161;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-maintenance {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-inactive {
  background-color: #f5f5f5;
  color: #616161;
}

.status-pending {
  background-color: #e3f2fd;
  color: #1976d2;
}

.document-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.document-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.document-valid {
  background-color: #e8f5e9;
  color: #388e3c;
}

.document-missing {
  background-color: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.modal.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.vehicle-header {
  display: flex;
  margin-bottom: 20px;
}

.vehicle-image {
  width: 150px;
  height: 150px;
  margin-right: 20px;
  border-radius: 5px;
  overflow: hidden;
}

.vehicle-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vehicle-info {
  flex: 1;
}

.vehicle-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.electric-badge {
  background-color: #e8f5e9;
  color: #388e3c;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.vehicle-specs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.spec-item {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.spec-label {
  font-size: 0.85rem;
  color: #757575;
  margin-bottom: 5px;
}

.spec-value {
  font-weight: 500;
}

.vehicle-documents {
  margin-top: 20px;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
