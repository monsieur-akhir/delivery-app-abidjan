<template>
  <div class="promotions-view">
    <div class="page-header">
      <h1>Gestion des promotions</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="showAddPromotionModal = true">
          <i class="fas fa-plus"></i> Nouvelle promotion
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
            <option value="active">Actif</option>
            <option value="scheduled">Programmé</option>
            <option value="expired">Expiré</option>
            <option value="disabled">Désactivé</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="type-filter">Type</label>
          <select id="type-filter" v-model="filters.type" @change="applyFilters">
            <option value="">Tous les types</option>
            <option value="percentage">Pourcentage</option>
            <option value="fixed_amount">Montant fixe</option>
            <option value="free_delivery">Livraison gratuite</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search-filter">Recherche</label>
          <div class="search-input">
            <input 
              type="text" 
              id="search-filter" 
              v-model="filters.search" 
              placeholder="Code, nom..." 
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
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

    <!-- Tableau des promotions -->
    <div class="table-container" v-if="!loading && promotions.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Valeur</th>
            <th>Période</th>
            <th>Utilisations</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="promotion in promotions" :key="promotion.id">
            <td>
              <div class="promo-code">{{ promotion.code }}</div>
            </td>
            <td>{{ promotion.name }}</td>
            <td>
              <span class="promotion-type" :class="getPromotionTypeClass(promotion.type)">
                {{ getPromotionTypeLabel(promotion.type) }}
              </span>
            </td>
            <td>
              <div class="promotion-value">
                {{ formatPromotionValue(promotion) }}
              </div>
            </td>
            <td>
              <div class="promotion-period">
                <div>{{ formatDate(promotion.start_date) }}</div>
                <div class="period-separator">→</div>
                <div>{{ formatDate(promotion.end_date) }}</div>
              </div>
            </td>
            <td>
              <div class="promotion-usage">
                {{ promotion.usage_count }} / {{ promotion.usage_limit || '∞' }}
              </div>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(promotion.status)">
                {{ getStatusLabel(promotion.status) }}
              </span>
            </td>
            <td>
              <div class="actions-cell">
                <button class="btn-icon" @click="viewPromotionDetails(promotion.id)" title="Voir les détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" @click="editPromotion(promotion.id)" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="promotion.status !== 'active'" 
                  class="btn-icon" 
                  @click="activatePromotion(promotion.id)" 
                  title="Activer"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  v-if="promotion.status === 'active'" 
                  class="btn-icon" 
                  @click="deactivatePromotion(promotion.id)" 
                  title="Désactiver"
                >
                  <i class="fas fa-ban"></i>
                </button>
                <button class="btn-icon" @click="deletePromotion(promotion.id)" title="Supprimer">
                  <i class="fas fa-trash"></i>
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
    <div class="empty-state" v-else-if="!loading && promotions.length === 0">
      <div class="empty-icon">
        <i class="fas fa-ticket-alt"></i>
      </div>
      <h3>Aucune promotion trouvée</h3>
      <p>Aucune promotion ne correspond à vos critères de recherche ou aucune promotion n'a été créée.</p>
      <button class="btn btn-primary" @click="showAddPromotionModal = true">Créer une promotion</button>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des promotions...</p>
    </div>

    <!-- Modal d'ajout/modification de promotion -->
    <div class="modal" v-if="showAddPromotionModal || showEditPromotionModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showEditPromotionModal ? 'Modifier la promotion' : 'Nouvelle promotion' }}</h2>
          <button class="btn-close" @click="closePromotionModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="promotion-form">
            <div class="form-group">
              <label for="promotion-name">Nom de la promotion</label>
              <input 
                type="text" 
                id="promotion-name" 
                v-model="promotionForm.name" 
                placeholder="Ex: Offre de bienvenue"
              />
            </div>
            
            <div class="form-group">
              <label for="promotion-code">Code promo</label>
              <div class="code-input-group">
                <input 
                  type="text" 
                  id="promotion-code" 
                  v-model="promotionForm.code" 
                  placeholder="Ex: WELCOME10"
                  :disabled="showEditPromotionModal"
                />
                <button 
                  v-if="!showEditPromotionModal" 
                  class="btn-generate" 
                  @click="generatePromoCode"
                  title="Générer un code aléatoire"
                >
                  <i class="fas fa-random"></i>
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="promotion-description">Description</label>
              <textarea 
                id="promotion-description" 
                v-model="promotionForm.description" 
                rows="3" 
                placeholder="Décrivez cette promotion..."
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="promotion-type">Type de promotion</label>
                <select id="promotion-type" v-model="promotionForm.type">
                  <option value="percentage">Pourcentage</option>
                  <option value="fixed_amount">Montant fixe</option>
                  <option value="free_delivery">Livraison gratuite</option>
                </select>
              </div>
              
              <div class="form-group" v-if="promotionForm.type !== 'free_delivery'">
                <label for="promotion-value">Valeur</label>
                <div class="value-input-group">
                  <input 
                    type="number" 
                    id="promotion-value" 
                    v-model.number="promotionForm.value" 
                    min="0"
                    :max="promotionForm.type === 'percentage' ? 100 : null"
                  />
                  <span class="value-suffix">{{ promotionForm.type === 'percentage' ? '%' : 'FCFA' }}</span>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="promotion-start-date">Date de début</label>
                <input type="datetime-local" id="promotion-start-date" v-model="promotionForm.startDate" />
              </div>
              
              <div class="form-group">
                <label for="promotion-end-date">Date de fin</label>
                <input type="datetime-local" id="promotion-end-date" v-model="promotionForm.endDate" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="promotion-min-order">Montant minimum de commande (FCFA)</label>
                <input 
                  type="number" 
                  id="promotion-min-order" 
                  v-model.number="promotionForm.minOrderAmount" 
                  min="0"
                  placeholder="0 = Pas de minimum"
                />
              </div>
              
              <div class="form-group">
                <label for="promotion-max-discount">Réduction maximale (FCFA)</label>
                <input 
                  type="number" 
                  id="promotion-max-discount" 
                  v-model.number="promotionForm.maxDiscountAmount" 
                  min="0"
                  placeholder="0 = Pas de maximum"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="promotion-usage-limit">Limite d'utilisations</label>
                <input 
                  type="number" 
                  id="promotion-usage-limit" 
                  v-model.number="promotionForm.usageLimit" 
                  min="0"
                  placeholder="0 = Illimité"
                />
              </div>
              
              <div class="form-group">
                <label for="promotion-user-limit">Utilisations par utilisateur</label>
                <input 
                  type="number" 
                  id="promotion-user-limit" 
                  v-model.number="promotionForm.userLimit" 
                  min="0"
                  placeholder="0 = Illimité"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label>Restrictions</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="promotionForm.firstOrderOnly" />
                  Première commande uniquement
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="promotionForm.newUsersOnly" />
                  Nouveaux utilisateurs uniquement
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>Communes éligibles</label>
              <div class="communes-grid">
                <label class="checkbox-label" v-for="commune in communes" :key="commune">
                  <input 
                    type="checkbox" 
                    :value="commune" 
                    v-model="promotionForm.eligibleCommunes"
                  />
                  {{ commune }}
                </label>
              </div>
              <div class="select-all-option">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :checked="isAllCommunesSelected" 
                    @change="toggleAllCommunes"
                  />
                  Sélectionner toutes les communes
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label for="promotion-status">Statut</label>
              <select id="promotion-status" v-model="promotionForm.status">
                <option value="active">Actif</option>
                <option value="scheduled">Programmé</option>
                <option value="disabled">Désactivé</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePromotionModal">Annuler</button>
          <button 
            class="btn btn-primary" 
            @click="savePromotion" 
            :disabled="!isPromotionFormValid || isSaving"
          >
            <i class="fas fa-spinner fa-spin" v-if="isSaving"></i>
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de détails de promotion -->
    <div class="modal" v-if="showPromotionDetailsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails de la promotion</h2>
          <button class="btn-close" @click="closePromotionDetailsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedPromotion">
          <div class="promotion-details">
            <div class="detail-section">
              <h3>Informations générales</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID</span>
                  <span class="detail-value">{{ selectedPromotion.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Code</span>
                  <span class="detail-value promo-code-display">{{ selectedPromotion.code }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nom</span>
                  <span class="detail-value">{{ selectedPromotion.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Type</span>
                  <span class="detail-value promotion-type" :class="getPromotionTypeClass(selectedPromotion.type)">
                    {{ getPromotionTypeLabel(selectedPromotion.type) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Valeur</span>
                  <span class="detail-value">{{ formatPromotionValue(selectedPromotion) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Statut</span>
                  <span class="detail-value status-badge" :class="getStatusClass(selectedPromotion.status)">
                    {{ getStatusLabel(selectedPromotion.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Créé le</span>
                  <span class="detail-value">{{ formatDateTime(selectedPromotion.created_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Dernière modification</span>
                  <span class="detail-value">{{ formatDateTime(selectedPromotion.updated_at) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Description</h3>
              <p class="promotion-description">{{ selectedPromotion.description || 'Aucune description' }}</p>
            </div>

            <div class="detail-section">
              <h3>Période de validité</h3>
              <div class="date-range-info">
                <div class="date-range-item">
                  <span class="date-label">Date de début:</span>
                  <span class="date-value">{{ formatDateTime(selectedPromotion.start_date) }}</span>
                </div>
                <div class="date-range-item">
                  <span class="date-label">Date de fin:</span>
                  <span class="date-value">{{ formatDateTime(selectedPromotion.end_date) }}</span>
                </div>
                <div class="date-range-duration">
                  <i class="fas fa-calendar-alt"></i>
                  {{ formatDateRangeDuration(selectedPromotion.start_date, selectedPromotion.end_date) }}
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Conditions d'utilisation</h3>
              <div class="conditions-grid">
                <div class="condition-item">
                  <span class="condition-label">Montant minimum de commande:</span>
                  <span class="condition-value">
                    {{ selectedPromotion.min_order_amount ? formatCurrency(selectedPromotion.min_order_amount) + ' FCFA' : 'Aucun minimum' }}
                  </span>
                </div>
                <div class="condition-item">
                  <span class="condition-label">Réduction maximale:</span>
                  <span class="condition-value">
                    {{ selectedPromotion.max_discount_amount ? formatCurrency(selectedPromotion.max_discount_amount) + ' FCFA' : 'Aucun maximum' }}
                  </span>
                </div>
                <div class="condition-item">
                  <span class="condition-label">Première commande uniquement:</span>
                  <span class="condition-value">{{ selectedPromotion.first_order_only ? 'Oui' : 'Non' }}</span>
                </div>
                <div class="condition-item">
                  <span class="condition-label">Nouveaux utilisateurs uniquement:</span>
                  <span class="condition-value">{{ selectedPromotion.new_users_only ? 'Oui' : 'Non' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Limites d'utilisation</h3>
              <div class="usage-stats">
                <div class="usage-item">
                  <div class="usage-header">
                    <span class="usage-label">Utilisations totales</span>
                    <span class="usage-value">{{ selectedPromotion.usage_count }} / {{ selectedPromotion.usage_limit || '∞' }}</span>
                  </div>
                  <div class="usage-progress">
                    <div 
                      class="usage-bar" 
                      :style="{ width: getUsagePercentage(selectedPromotion.usage_count, selectedPromotion.usage_limit) + '%' }"
                    ></div>
                  </div>
                </div>
                <div class="usage-details">
                  <div class="usage-detail-item">
                    <span class="usage-detail-label">Limite par utilisateur:</span>
                    <span class="usage-detail-value">{{ selectedPromotion.user_limit || 'Illimité' }}</span>
                  </div>
                  <div class="usage-detail-item">
                    <span class="usage-detail-label">Utilisations restantes:</span>
                    <span class="usage-detail-value">
                      {{ selectedPromotion.usage_limit ? selectedPromotion.usage_limit - selectedPromotion.usage_count : 'Illimité' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Communes éligibles</h3>
              <div class="communes-list">
                <div v-if="selectedPromotion.eligible_communes && selectedPromotion.eligible_communes.length > 0">
                  <div class="commune-tag" v-for="commune in selectedPromotion.eligible_communes" :key="commune">
                    {{ commune }}
                  </div>
                </div>
                <div v-else class="no-communes">
                  Toutes les communes sont éligibles
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedPromotion.usage_history && selectedPromotion.usage_history.length > 0">
              <h3>Historique d'utilisation</h3>
              <div class="usage-history">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Utilisateur</th>
                      <th>Commande</th>
                      <th>Montant</th>
                      <th>Réduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(usage, index) in selectedPromotion.usage_history" :key="index">
                      <td>{{ formatDateTime(usage.date) }}</td>
                      <td>{{ usage.user_name }}</td>
                      <td>
                        <a :href="`/manager/deliveries/${usage.order_id}`" class="order-link">
                          #{{ usage.order_id }}
                        </a>
                      </td>
                      <td>{{ formatCurrency(usage.order_amount) }} FCFA</td>
                      <td>{{ formatCurrency(usage.discount_amount) }} FCFA</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closePromotionDetailsModal">Fermer</button>
          <button class="btn btn-outline" @click="editPromotion(selectedPromotion?.id)">
            <i class="fas fa-edit"></i> Modifier
          </button>
          <button 
            v-if="selectedPromotion && selectedPromotion.status !== 'active'" 
            class="btn btn-success" 
            @click="activatePromotion(selectedPromotion.id)"
          >
            <i class="fas fa-check"></i> Activer
          </button>
          <button 
            v-if="selectedPromotion && selectedPromotion.status === 'active'" 
            class="btn btn-warning" 
            @click="deactivatePromotion(selectedPromotion.id)"
          >
            <i class="fas fa-ban"></i> Désactiver
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div class="modal" v-if="showDeleteConfirmModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button class="btn-close" @click="showDeleteConfirmModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.</p>
          <div class="warning-message" v-if="promotionToDelete && promotionToDelete.usage_count > 0">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Cette promotion a déjà été utilisée {{ promotionToDelete.usage_count }} fois.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirmModal = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmDeletePromotion">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { 
  fetchPromotions, 
  fetchPromotionDetails, 
  createPromotion, 
  updatePromotion, 
  deletePromotion as deletePromotionApi,
  activatePromotion as activatePromotionApi,
  deactivatePromotion as deactivatePromotionApi
} from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import { COMMUNES } from '@/config'

export default {
  name: 'PromotionsView',
  setup() {
    // État
    const promotions = ref([])
    const selectedPromotion = ref(null)
    const promotionToDelete = ref(null)
    const showAddPromotionModal = ref(false)
    const showEditPromotionModal = ref(false)
    const showPromotionDetailsModal = ref(false)
    const showDeleteConfirmModal = ref(false)
    const loading = ref(true)
    const isSaving = ref(false)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const communes = COMMUNES
    
    const filters = reactive({
      status: '',
      type: '',
      search: ''
    })
    
    const promotionForm = reactive({
      id: null,
      name: '',
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      startDate: '',
      endDate: '',
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      userLimit: 0,
      firstOrderOnly: false,
      newUsersOnly: false,
      eligibleCommunes: [],
      status: 'active'
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          status: filters.status,
          type: filters.type,
          search: filters.search
        }
        
        const response = await fetchPromotions(params)
        promotions.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages
      } catch (error) {
        console.error('Erreur lors du chargement des promotions:', error)
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
      filters.status = ''
      filters.type = ''
      filters.search = ''
      currentPage.value = 1
      fetchData()
    }
    
    const changePage = (page) => {
      currentPage.value = page
      fetchData()
    }
    
    const viewPromotionDetails = async (promotionId) => {
      try {
        loading.value = true
        const response = await fetchPromotionDetails(promotionId)
        selectedPromotion.value = response
        showPromotionDetailsModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }
    
    const closePromotionDetailsModal = () => {
      showPromotionDetailsModal.value = false
      selectedPromotion.value = null
    }
    
    const editPromotion = async (promotionId) => {
      try {
        loading.value = true
        
        // Fermer le modal de détails s'il est ouvert
        if (showPromotionDetailsModal.value) {
          closePromotionDetailsModal()
        }
        
        const promotion = await fetchPromotionDetails(promotionId)
        
        // Remplir le formulaire avec les données de la promotion
        promotionForm.id = promotion.id
        promotionForm.name = promotion.name
        promotionForm.code = promotion.code
        promotionForm.description = promotion.description
        promotionForm.type = promotion.type
        promotionForm.value = promotion.value
        promotionForm.startDate = formatDateTimeForInput(promotion.start_date)
        promotionForm.endDate = formatDateTimeForInput(promotion.end_date)
        promotionForm.minOrderAmount = promotion.min_order_amount
        promotionForm.maxDiscountAmount = promotion.max_discount_amount
        promotionForm.usageLimit = promotion.usage_limit
        promotionForm.userLimit = promotion.user_limit
        promotionForm.firstOrderOnly = promotion.first_order_only
        promotionForm.newUsersOnly = promotion.new_users_only
        promotionForm.eligibleCommunes = promotion.eligible_communes || []
        promotionForm.status = promotion.status
        
        showEditPromotionModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }
    
    const closePromotionModal = () => {
      showAddPromotionModal.value = false
      showEditPromotionModal.value = false
      resetPromotionForm()
    }
    
    const resetPromotionForm = () => {
      promotionForm.id = null
      promotionForm.name = ''
      promotionForm.code = ''
      promotionForm.description = ''
      promotionForm.type = 'percentage'
      promotionForm.value = 0
      promotionForm.startDate = ''
      promotionForm.endDate = ''
      promotionForm.minOrderAmount = 0
      promotionForm.maxDiscountAmount = 0
      promotionForm.usageLimit = 0
      promotionForm.userLimit = 0
      promotionForm.firstOrderOnly = false
      promotionForm.newUsersOnly = false
      promotionForm.eligibleCommunes = []
      promotionForm.status = 'active'
    }
    
    const savePromotion = async () => {
      try {
        isSaving.value = true
        
        const payload = {
          name: promotionForm.name,
          code: promotionForm.code,
          description: promotionForm.description,
          type: promotionForm.type,
          value: promotionForm.value,
          start_date: promotionForm.startDate,
          end_date: promotionForm.endDate,
          min_order_amount: promotionForm.minOrderAmount || 0,
          max_discount_amount: promotionForm.maxDiscountAmount || 0,
          usage_limit: promotionForm.usageLimit || 0,
          user_limit: promotionForm.userLimit || 0,
          first_order_only: promotionForm.firstOrderOnly,
          new_users_only: promotionForm.newUsersOnly,
          eligible_communes: promotionForm.eligibleCommunes.length > 0 ? promotionForm.eligibleCommunes : null,
          status: promotionForm.status
        }
        
        if (showEditPromotionModal.value) {
          // Mise à jour d'une promotion existante
          await updatePromotion(promotionForm.id, payload)
        } else {
          // Création d'une nouvelle promotion
          await createPromotion(payload)
        }
        
        // Fermer le modal
        closePromotionModal()
        
        // Rafraîchir les données
        fetchData()
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        isSaving.value = false
      }
    }
    
    const generatePromoCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      promotionForm.code = code
    }
    
    const formatDateTimeForInput = (dateTimeString) => {
      if (!dateTimeString) return ''
      
      const date = new Date(dateTimeString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    const deletePromotion = async (promotionId) => {
      try {
        // Récupérer les détails de la promotion pour afficher des informations dans le modal de confirmation
        const promotion = await fetchPromotionDetails(promotionId)
        promotionToDelete.value = promotion
        showDeleteConfirmModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const confirmDeletePromotion = async () => {
      try {
        if (!promotionToDelete.value) return
        
        await deletePromotionApi(promotionToDelete.value.id)
        
        // Fermer le modal de confirmation
        showDeleteConfirmModal.value = false
        
        // Rafraîchir les données
        fetchData()
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la suppression de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        promotionToDelete.value = null
      }
    }
    
    const activatePromotion = async (promotionId) => {
      try {
        await activatePromotionApi(promotionId)
        
        // Mettre à jour la promotion dans la liste
        const index = promotions.value.findIndex(p => p.id === promotionId)
        if (index !== -1) {
          promotions.value[index].status = 'active'
        }
        
        // Mettre à jour la promotion sélectionnée si nécessaire
        if (selectedPromotion.value && selectedPromotion.value.id === promotionId) {
          selectedPromotion.value.status = 'active'
        }
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de l\'activation de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    const deactivatePromotion = async (promotionId) => {
      try {
        await deactivatePromotionApi(promotionId)
        
        // Mettre à jour la promotion dans la liste
        const index = promotions.value.findIndex(p => p.id === promotionId)
        if (index !== -1) {
          promotions.value[index].status = 'disabled'
        }
        
        // Mettre à jour la promotion sélectionnée si nécessaire
        if (selectedPromotion.value && selectedPromotion.value.id === promotionId) {
          selectedPromotion.value.status = 'disabled'
        }
        
        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la désactivation de la promotion:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      }
    }
    
    // Utilitaires
    const formatPromotionValue = (promotion) => {
      if (!promotion) return ''
      
      switch (promotion.type) {
        case 'percentage':
          return `${promotion.value}%`
        case 'fixed_amount':
          return `${formatCurrency(promotion.value)} FCFA`
        case 'free_delivery':
          return 'Livraison gratuite'
        default:
          return ''
      }
    }
    
    const formatDateRangeDuration = (startDate, endDate) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return 'Même jour'
      } else if (diffDays === 1) {
        return '1 jour'
      } else if (diffDays < 7) {
        return `${diffDays} jours`
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return weeks === 1 ? '1 semaine' : `${weeks} semaines`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return months === 1 ? '1 mois' : `${months} mois`
      } else {
        const years = Math.floor(diffDays / 365)
        return years === 1 ? '1 an' : `${years} ans`
      }
    }
    
    const getPromotionTypeClass = (type) => {
      const typeMap = {
        percentage: 'type-percentage',
        fixed_amount: 'type-fixed',
        free_delivery: 'type-free-delivery'
      }
      return typeMap[type] || 'type-unknown'
    }
    
    const getPromotionTypeLabel = (type) => {
      const typeMap = {
        percentage: 'Pourcentage',
        fixed_amount: 'Montant fixe',
        free_delivery: 'Livraison gratuite'
      }
      return typeMap[type] || 'Inconnu'
    }
    
    const getStatusClass = (status) => {
      const statusMap = {
        active: 'status-active',
        scheduled: 'status-scheduled',
        expired: 'status-expired',
        disabled: 'status-disabled'
      }
      return statusMap[status] || 'status-unknown'
    }
    
    const getStatusLabel = (status) => {
      const statusMap = {
        active: 'Actif',
        scheduled: 'Programmé',
        expired: 'Expiré',
        disabled: 'Désactivé'
      }
      return statusMap[status] || 'Inconnu'
    }
    
    const getUsagePercentage = (usageCount, usageLimit) => {
      if (!usageLimit || usageLimit <= 0) return 0
      return Math.min(100, (usageCount / usageLimit) * 100)
    }
    
    // Computed properties
    const isAllCommunesSelected = computed(() => {
      return promotionForm.eligibleCommunes.length === communes.length
    })
    
    const isPromotionFormValid = computed(() => {
      if (!promotionForm.name.trim()) return false
      if (!promotionForm.code.trim()) return false
      
      if (promotionForm.type !== 'free_delivery' && (!promotionForm.value || promotionForm.value <= 0)) {
        return false
      }
      
      if (!promotionForm.startDate || !promotionForm.endDate) return false
      
      // Vérifier que la date de début est antérieure à la date de fin
      const startDate = new Date(promotionForm.startDate)
      const endDate = new Date(promotionForm.endDate)
      if (startDate >= endDate) return false
      
      return true
    })
    
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
    
    // Méthodes pour les communes
    const toggleAllCommunes = (event) => {
      if (event.target.checked) {
        promotionForm.eligibleCommunes = [...communes]
      } else {
        promotionForm.eligibleCommunes = []
      }
    }
    
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
      promotions,
      selectedPromotion,
      promotionToDelete,
      showAddPromotionModal,
      showEditPromotionModal,
      showPromotionDetailsModal,
      showDeleteConfirmModal,
      loading,
      isSaving,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      filters,
      promotionForm,
      communes,
      isAllCommunesSelected,
      isPromotionFormValid,
      displayedPages,
      
      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      viewPromotionDetails,
      closePromotionDetailsModal,
      editPromotion,
      closePromotionModal,
      resetPromotionForm,
      savePromotion,
      generatePromoCode,
      deletePromotion,
      confirmDeletePromotion,
      activatePromotion,
      deactivatePromotion,
      toggleAllCommunes,
      debounceSearch,
      
      formatPromotionValue,
      formatDateRangeDuration,
      getPromotionTypeClass,
      getPromotionTypeLabel,
      getStatusClass,
      getStatusLabel,
      getUsagePercentage,
      
      formatCurrency,
      formatDate,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.promotions-view {
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

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.promo-code {
  font-family: monospace;
  font-weight: 600;
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.promotion-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-percentage {
  background-color: #cce5ff;
  color: #004085;
}

.type-fixed {
  background-color: #d1ecf1;
  color: #0c5460;
}

.type-free-delivery {
  background-color: #d4edda;
  color: #155724;
}

.promotion-value {
  font-weight: 500;
}

.promotion-period {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.period-separator {
  color: #6c757d;
  margin: 0.125rem 0;
}

.promotion-usage {
  font-size: 0.875rem;
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

.status-scheduled {
  background-color: #cce5ff;
  color: #004085;
}

.status-expired {
  background-color: #f8d7da;
  color: #721c24;
}

.status-disabled {
  background-color: #e2e3e5;
  color: #383d41;
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

.modal-content.modal-sm {
  max-width: 500px;
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

.promotion-form {
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

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.code-input-group {
  display: flex;
  align-items: center;
}

.code-input-group input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.btn-generate {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-left: none;
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  cursor: pointer;
}

.btn-generate:hover {
  background-color: #e9ecef;
}

.value-input-group {
  display: flex;
  align-items: center;
}

.value-input-group input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.value-suffix {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-left: none;
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  color: #495057;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
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

.communes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.select-all-option {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
}

.promotion-details {
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

.promo-code-display {
  font-family: monospace;
  font-weight: 600;
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.promotion-description {
  font-size: 0.875rem;
  color: #495057;
  margin: 0;
}

.date-range-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-range-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-label {
  font-weight: 500;
  color: #495057;
  width: 100px;
}

.date-value {
  color: #333;
}

.date-range-duration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.conditions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.condition-item {
  display: flex;
  flex-direction: column;
}

.condition-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.condition-value {
  font-weight: 500;
  color: #333;
}

.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.usage-label {
  font-weight: 500;
  color: #495057;
}

.usage-value {
  font-weight: 600;
  color: #333;
}

.usage-progress {
  height: 0.5rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.usage-bar {
  height: 100%;
  background-color: #0056b3;
  border-radius: 0.25rem;
}

.usage-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.usage-detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.usage-detail-label {
  font-size: 0.875rem;
  color: #6c757d;
}

.usage-detail-value {
  font-weight: 500;
  color: #333;
}

.communes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.commune-tag {
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #495057;
}

.no-communes {
  font-style: italic;
  color: #6c757d;
}

.usage-history {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.875rem;
}

.history-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.order-link {
  color: #0056b3;
  text-decoration: none;
}

.order-link:hover {
  text-decoration: underline;
}

.warning-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fff3cd;
  border-radius: 0.25rem;
  color: #856404;
}

.warning-message i {
  color: #856404;
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
  
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .detail-grid,
  .conditions-grid {
    grid-template-columns: 1fr;
  }
  
  .communes-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
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
