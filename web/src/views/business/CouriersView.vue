<template>
  <div class="couriers-view">
    <div class="page-header">
      <h1>Coursiers</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="openInviteModal">
          <font-awesome-icon icon="user-plus" class="mr-1" />
          Inviter un coursier
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" class="form-control">
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="busy">Occupé</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="rating-filter">Évaluation</label>
          <select id="rating-filter" v-model="filters.rating" class="form-control">
            <option value="">Toutes les évaluations</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles et plus</option>
            <option value="3">3 étoiles et plus</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="vehicle-filter">Type de véhicule</label>
          <select id="vehicle-filter" v-model="filters.vehicleType" class="form-control">
            <option value="">Tous les véhicules</option>
            <option v-for="(vehicle, key) in VEHICLE_TYPES" :key="key" :value="key">
              {{ vehicle.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input
              type="text"
              id="search"
              v-model="filters.search"
              class="form-control"
              placeholder="Nom, téléphone, commune..."
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

    <div class="couriers-stats">
      <div class="stat-card">
        <div class="stat-icon bg-primary">
          <font-awesome-icon icon="users" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ courierStats.total }}</h3>
          <p class="stat-label">Total coursiers</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-success">
          <font-awesome-icon icon="user-check" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ courierStats.active }}</h3>
          <p class="stat-label">Coursiers actifs</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-info">
          <font-awesome-icon icon="truck" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ courierStats.busy }}</h3>
          <p class="stat-label">Coursiers occupés</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-warning">
          <font-awesome-icon icon="star" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ courierStats.averageRating.toFixed(1) }}</h3>
          <p class="stat-label">Note moyenne</p>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Liste des coursiers</h2>
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
          <button class="btn-icon" @click="exportCouriers">
            <font-awesome-icon icon="download" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-state">
          <font-awesome-icon icon="spinner" spin size="2x" />
          <p>Chargement des coursiers...</p>
        </div>

        <div v-else-if="couriers.length === 0" class="empty-state">
          <font-awesome-icon icon="user-slash" size="2x" />
          <p>Aucun coursier trouvé</p>
          <button class="btn btn-primary" @click="openInviteModal">Inviter un coursier</button>
        </div>

        <div v-else>
          <!-- Vue liste -->
          <div v-if="viewMode === 'list'" class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Coursier</th>
                  <th>Contact</th>
                  <th>Commune</th>
                  <th>Véhicule</th>
                  <th>Évaluation</th>
                  <th>Livraisons</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="courier in couriers" :key="courier.id">
                  <td>
                    <div class="user-info">
                      <div class="user-avatar">
                        <img
                          v-if="courier.profile_picture"
                          :src="courier.profile_picture"
                          :alt="courier.full_name"
                        />
                        <div v-else class="avatar-placeholder">
                          {{ getInitials(courier.full_name) }}
                        </div>
                      </div>
                      <div class="user-name">{{ courier.full_name }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="contact-info">
                      <div class="contact-phone">{{ courier.phone }}</div>
                      <div class="contact-email" v-if="courier.email">{{ courier.email }}</div>
                    </div>
                  </td>
                  <td>{{ courier.commune || 'Non spécifié' }}</td>
                  <td>
                    <div class="vehicle-info" v-if="courier.vehicle_type">
                      <font-awesome-icon
                        :icon="getVehicleIcon(courier.vehicle_type)"
                        class="vehicle-icon"
                      />
                      <span>{{ getVehicleLabel(courier.vehicle_type) }}</span>
                    </div>
                    <span v-else class="text-muted">Non spécifié</span>
                  </td>
                  <td>
                    <div class="rating-stars">
                      <div class="stars">
                        <font-awesome-icon
                          v-for="i in 5"
                          :key="i"
                          :icon="i <= Math.round(courier.rating) ? 'star' : 'star-o'"
                          :class="i <= Math.round(courier.rating) ? 'star-filled' : 'star-empty'"
                        />
                      </div>
                      <span class="rating-value">{{ courier.rating.toFixed(1) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="deliveries-info">
                      <div class="deliveries-total">
                        {{ courier.deliveries_completed }} terminées
                      </div>
                      <div class="deliveries-success-rate">
                        {{ courier.success_rate }}% de succès
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(courier.status)">
                      {{ getStatusLabel(courier.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button
                        class="btn-icon"
                        @click="viewCourierDetails(courier)"
                        title="Voir les détails"
                      >
                        <font-awesome-icon icon="eye" />
                      </button>
                      <button
                        class="btn-icon"
                        @click="toggleFavorite(courier)"
                        :title="courier.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                      >
                        <font-awesome-icon
                          :icon="courier.is_favorite ? 'star' : 'star-o'"
                          :class="courier.is_favorite ? 'text-warning' : ''"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Vue grille -->
          <div v-else-if="viewMode === 'grid'" class="couriers-grid">
            <div v-for="courier in couriers" :key="courier.id" class="courier-card">
              <div class="courier-header">
                <div class="courier-avatar">
                  <img
                    v-if="courier.profile_picture"
                    :src="courier.profile_picture"
                    :alt="courier.full_name"
                  />
                  <div v-else class="avatar-placeholder">{{ getInitials(courier.full_name) }}</div>
                </div>
                <button
                  class="favorite-button"
                  @click="toggleFavorite(courier)"
                  :class="{ active: courier.is_favorite }"
                >
                  <font-awesome-icon :icon="courier.is_favorite ? 'star' : 'star-o'" />
                </button>
              </div>
              <div class="courier-content">
                <h3 class="courier-name">{{ courier.full_name }}</h3>
                <div class="courier-rating">
                  <div class="stars">
                    <font-awesome-icon
                      v-for="i in 5"
                      :key="i"
                      :icon="i <= Math.round(courier.rating) ? 'star' : 'star-o'"
                      :class="i <= Math.round(courier.rating) ? 'star-filled' : 'star-empty'"
                    />
                  </div>
                  <span class="rating-value">{{ courier.rating.toFixed(1) }}</span>
                </div>
                <div class="courier-info">
                  <div class="info-item">
                    <font-awesome-icon icon="phone" class="info-icon" />
                    <span>{{ courier.phone }}</span>
                  </div>
                  <div class="info-item" v-if="courier.email">
                    <font-awesome-icon icon="envelope" class="info-icon" />
                    <span>{{ courier.email }}</span>
                  </div>
                  <div class="info-item" v-if="courier.commune">
                    <font-awesome-icon icon="map-marker-alt" class="info-icon" />
                    <span>{{ courier.commune }}</span>
                  </div>
                  <div class="info-item" v-if="courier.vehicle_type">
                    <font-awesome-icon
                      :icon="getVehicleIcon(courier.vehicle_type)"
                      class="info-icon"
                    />
                    <span>{{ getVehicleLabel(courier.vehicle_type) }}</span>
                  </div>
                  <div class="info-item">
                    <font-awesome-icon icon="box" class="info-icon" />
                    <span>{{ courier.deliveries_completed }} livraisons</span>
                  </div>
                  <div class="info-item">
                    <font-awesome-icon icon="check-circle" class="info-icon" />
                    <span>{{ courier.success_rate }}% de succès</span>
                  </div>
                </div>
              </div>
              <div class="courier-footer">
                <span class="status-badge" :class="getStatusClass(courier.status)">
                  {{ getStatusLabel(courier.status) }}
                </span>
                <button class="btn btn-sm btn-outline" @click="viewCourierDetails(courier)">
                  <font-awesome-icon icon="eye" class="mr-1" />
                  Détails
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination-container">
            <div class="pagination-info">
              Affichage de {{ paginationInfo.from }}-{{ paginationInfo.to }} sur
              {{ paginationInfo.total }} coursiers
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

    <!-- Modal d'invitation de coursier -->
    <div class="modal" v-if="showInviteModal">
      <div class="modal-backdrop" @click="showInviteModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Inviter un coursier</h3>
          <button class="modal-close" @click="showInviteModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="inviteCourier">
            <div class="form-group">
              <label for="invite_phone">Numéro de téléphone</label>
              <input
                type="tel"
                id="invite_phone"
                v-model="inviteForm.phone"
                class="form-control"
                placeholder="+225 XX XX XX XX XX"
                required
              />
            </div>
            <div class="form-group">
              <label for="invite_message">Message personnalisé (optionnel)</label>
              <textarea
                id="invite_message"
                v-model="inviteForm.message"
                class="form-control"
                rows="3"
                placeholder="Écrivez un message personnalisé pour le coursier..."
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showInviteModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <font-awesome-icon icon="spinner" spin v-if="isSubmitting" class="mr-1" />
                Envoyer l'invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de détails du coursier -->
    <div class="modal" v-if="showDetailsModal">
      <div class="modal-backdrop" @click="showDetailsModal = false"></div>
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>Détails du coursier</h3>
          <button class="modal-close" @click="showDetailsModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body" v-if="selectedCourier">
          <div class="courier-profile">
            <div class="courier-profile-header">
              <div class="courier-profile-avatar">
                <img
                  v-if="selectedCourier.profile_picture"
                  :src="selectedCourier.profile_picture"
                  :alt="selectedCourier.full_name"
                />
                <div v-else class="avatar-placeholder">
                  {{ getInitials(selectedCourier.full_name) }}
                </div>
              </div>
              <div class="courier-profile-info">
                <h2>{{ selectedCourier.full_name }}</h2>
                <div class="courier-profile-meta">
                  <div class="meta-item">
                    <font-awesome-icon icon="phone" />
                    <span>{{ selectedCourier.phone }}</span>
                  </div>
                  <div class="meta-item" v-if="selectedCourier.email">
                    <font-awesome-icon icon="envelope" />
                    <span>{{ selectedCourier.email }}</span>
                  </div>
                  <div class="meta-item" v-if="selectedCourier.commune">
                    <font-awesome-icon icon="map-marker-alt" />
                    <span>{{ selectedCourier.commune }}</span>
                  </div>
                </div>
                <div class="courier-profile-rating">
                  <div class="stars">
                    <font-awesome-icon
                      v-for="i in 5"
                      :key="i"
                      :icon="i <= Math.round(selectedCourier.rating) ? 'star' : 'star-o'"
                      :class="
                        i <= Math.round(selectedCourier.rating) ? 'star-filled' : 'star-empty'
                      "
                    />
                  </div>
                  <span class="rating-value"
                    >{{ selectedCourier.rating.toFixed(1) }} ({{
                      selectedCourier.ratings_count
                    }}
                    évaluations)</span
                  >
                </div>
              </div>
              <div class="courier-profile-actions">
                <button class="btn btn-outline" @click="toggleFavorite(selectedCourier)">
                  <font-awesome-icon
                    :icon="selectedCourier.is_favorite ? 'star' : 'star-o'"
                    class="mr-1"
                    :class="selectedCourier.is_favorite ? 'text-warning' : ''"
                  />
                  {{ selectedCourier.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}
                </button>
              </div>
            </div>

            <div class="courier-profile-stats">
              <div class="stat-item">
                <div class="stat-value">{{ selectedCourier.deliveries_completed }}</div>
                <div class="stat-label">Livraisons terminées</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ selectedCourier.success_rate }}%</div>
                <div class="stat-label">Taux de succès</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ selectedCourier.average_delivery_time || 'N/A' }}</div>
                <div class="stat-label">Temps moyen</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatDate(selectedCourier.joined_at) }}</div>
                <div class="stat-label">Membre depuis</div>
              </div>
            </div>

            <div class="courier-profile-details">
              <div class="details-section">
                <h3>Informations sur le véhicule</h3>
                <div class="details-content" v-if="selectedCourier.vehicle_type">
                  <div class="details-item">
                    <div class="details-label">Type de véhicule</div>
                    <div class="details-value">
                      <font-awesome-icon
                        :icon="getVehicleIcon(selectedCourier.vehicle_type)"
                        class="mr-1"
                      />
                      {{ getVehicleLabel(selectedCourier.vehicle_type) }}
                    </div>
                  </div>
                  <div class="details-item" v-if="selectedCourier.vehicle_brand">
                    <div class="details-label">Marque</div>
                    <div class="details-value">{{ selectedCourier.vehicle_brand }}</div>
                  </div>
                  <div class="details-item" v-if="selectedCourier.vehicle_model">
                    <div class="details-label">Modèle</div>
                    <div class="details-value">{{ selectedCourier.vehicle_model }}</div>
                  </div>
                  <div class="details-item" v-if="selectedCourier.vehicle_color">
                    <div class="details-label">Couleur</div>
                    <div class="details-value">{{ selectedCourier.vehicle_color }}</div>
                  </div>
                  <div class="details-item" v-if="selectedCourier.vehicle_plate">
                    <div class="details-label">Plaque d'immatriculation</div>
                    <div class="details-value">{{ selectedCourier.vehicle_plate }}</div>
                  </div>
                </div>
                <div class="details-content" v-else>
                  <p class="text-muted">Aucune information sur le véhicule disponible</p>
                </div>
              </div>

              <div class="details-section">
                <h3>Dernières livraisons</h3>
                <div class="details-content">
                  <div
                    v-if="
                      selectedCourier.recent_deliveries &&
                      selectedCourier.recent_deliveries.length > 0
                    "
                  >
                    <div
                      class="recent-delivery"
                      v-for="delivery in selectedCourier.recent_deliveries"
                      :key="delivery.id"
                    >
                      <div class="delivery-header">
                        <div class="delivery-id">#{{ delivery.id }}</div>
                        <div class="delivery-date">{{ formatDate(delivery.created_at) }}</div>
                      </div>
                      <div class="delivery-addresses">
                        <div class="address-item">
                          <font-awesome-icon icon="map-marker" class="address-icon pickup" />
                          <span>{{ delivery.pickup_commune }}</span>
                        </div>
                        <div class="address-arrow">
                          <font-awesome-icon icon="arrow-right" />
                        </div>
                        <div class="address-item">
                          <font-awesome-icon icon="map-marker" class="address-icon delivery" />
                          <span>{{ delivery.delivery_commune }}</span>
                        </div>
                      </div>
                      <div class="delivery-footer">
                        <span class="status-badge" :class="getStatusClass(delivery.status)">
                          {{ getStatusLabel(delivery.status) }}
                        </span>
                        <span class="delivery-price"
                          >{{
                            formatPrice(delivery.final_price || delivery.proposed_price)
                          }}
                          FCFA</span
                        >
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-muted">Aucune livraison récente</p>
                </div>
              </div>

              <div class="details-section">
                <h3>Évaluations récentes</h3>
                <div class="details-content">
                  <div
                    v-if="
                      selectedCourier.recent_ratings && selectedCourier.recent_ratings.length > 0
                    "
                  >
                    <div
                      class="recent-rating"
                      v-for="rating in selectedCourier.recent_ratings"
                      :key="rating.id"
                    >
                      <div class="rating-header">
                        <div class="rating-stars">
                          <font-awesome-icon
                            v-for="i in 5"
                            :key="i"
                            :icon="i <= rating.score ? 'star' : 'star-o'"
                            :class="i <= rating.score ? 'star-filled' : 'star-empty'"
                          />
                        </div>
                        <div class="rating-date">{{ formatDate(rating.created_at) }}</div>
                      </div>
                      <div class="rating-comment" v-if="rating.comment">
                        {{ rating.comment }}
                      </div>
                      <div class="rating-delivery">
                        Pour la livraison
                        <router-link :to="`/business/deliveries/${rating.delivery_id}`"
                          >#{{ rating.delivery_id }}</router-link
                        >
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-muted">Aucune évaluation récente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  fetchBusinessCouriers,
  inviteBusinessCourier,
  toggleBusinessCourierFavorite,
} from '@/api/business'
import { formatDate, formatPrice, getInitials } from '@/utils/formatters'
import { VEHICLE_TYPES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/config'

export default {
  name: 'BusinessCouriersView',
  setup() {
    const loading = ref(false)
    const isSubmitting = ref(false)
    const couriers = ref([])
    const viewMode = ref('grid')
    const currentPage = ref(1)
    const totalPages = ref(1)
    const pageSize = ref(DEFAULT_PAGE_SIZE)
    const totalItems = ref(0)
    const showInviteModal = ref(false)
    const showDetailsModal = ref(false)
    const selectedCourier = ref(null)

    const inviteForm = reactive({
      phone: '',
      message: '',
    })

    const filters = reactive({
      status: '',
      rating: '',
      vehicleType: '',
      search: '',
    })

    const paginationInfo = computed(() => {
      const from = totalItems.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
      const to = Math.min(from + pageSize.value - 1, totalItems.value)

      return {
        from,
        to,
        total: totalItems.value,
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

    const courierStats = computed(() => {
      // Calculer les statistiques à partir des données
      const total = totalItems.value
      const active = couriers.value.filter(c => c.status === 'active').length
      const busy = couriers.value.filter(c => c.status === 'busy').length

      // Calculer la note moyenne
      let totalRating = 0
      let ratedCouriers = 0

      couriers.value.forEach(courier => {
        if (courier.rating > 0) {
          totalRating += courier.rating
          ratedCouriers++
        }
      })

      const averageRating = ratedCouriers > 0 ? totalRating / ratedCouriers : 0

      return {
        total,
        active,
        busy,
        averageRating,
      }
    })

    // Charger les coursiers
    const loadCouriers = async () => {
      try {
        loading.value = true

        // Préparer les paramètres de requête
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          status: filters.status || undefined,
          rating: filters.rating || undefined,
          vehicle_type: filters.vehicleType || undefined,
          search: filters.search || undefined,
        }

        const response = await fetchBusinessCouriers(params)

        couriers.value = response.items
        totalItems.value = response.total
        totalPages.value = Math.ceil(response.total / pageSize.value)

        // Ajuster la page courante si elle dépasse le nombre total de pages
        if (currentPage.value > totalPages.value && totalPages.value > 0) {
          currentPage.value = totalPages.value
          await loadCouriers()
        }
      } catch (error) {
        console.error('Error loading couriers:', error)
      } finally {
        loading.value = false
      }
    }

    // Changer de page
    const changePage = page => {
      if (page === '...') return

      currentPage.value = page
      loadCouriers()
    }

    // Changer la taille de page
    const changePageSize = () => {
      currentPage.value = 1
      loadCouriers()
    }

    // Appliquer les filtres
    const applyFilters = () => {
      currentPage.value = 1
      loadCouriers()
    }

    // Réinitialiser les filtres
    const resetFilters = () => {
      filters.status = ''
      filters.rating = ''
      filters.vehicleType = ''
      filters.search = ''

      currentPage.value = 1
      loadCouriers()
    }

    // Rafraîchir les données
    const refreshData = () => {
      loadCouriers()
    }

    // Exporter les coursiers
    const exportCouriers = () => {
      // Implémenter l'exportation des coursiers (CSV, Excel, etc.)
      alert("Fonctionnalité d'exportation à implémenter")
    }

    // Ouvrir le modal d'invitation
    const openInviteModal = () => {
      // Réinitialiser le formulaire
      inviteForm.phone = ''
      inviteForm.message = ''

      showInviteModal.value = true
    }

    // Inviter un coursier
    const inviteCourier = async () => {
      try {
        isSubmitting.value = true

        await inviteBusinessCourier(inviteForm)

        showInviteModal.value = false

        // Afficher un message de succès
        alert('Invitation envoyée avec succès')
      } catch (error) {
        console.error('Error inviting courier:', error)
        alert(`Erreur lors de l'envoi de l'invitation: ${error.message}`)
      } finally {
        isSubmitting.value = false
      }
    }

    // Voir les détails d'un coursier
    const viewCourierDetails = async courier => {
      selectedCourier.value = courier
      showDetailsModal.value = true
    }

    // Ajouter/retirer un coursier des favoris
    const toggleFavorite = async courier => {
      try {
        const isFavorite = !courier.is_favorite

        await toggleBusinessCourierFavorite(courier.id, isFavorite)

        // Mettre à jour l'état local
        courier.is_favorite = isFavorite

        // Si le coursier sélectionné est le même, mettre à jour également
        if (selectedCourier.value && selectedCourier.value.id === courier.id) {
          selectedCourier.value.is_favorite = isFavorite
        }
      } catch (error) {
        console.error('Error toggling favorite:', error)
        alert(`Erreur lors de la modification des favoris: ${error.message}`)
      }
    }

    // Obtenir l'icône pour un type de véhicule
    const getVehicleIcon = type => {
      return VEHICLE_TYPES[type]?.icon || 'car'
    }

    // Obtenir le libellé d'un type de véhicule
    const getVehicleLabel = type => {
      return VEHICLE_TYPES[type]?.label || type
    }

    // Obtenir la classe CSS pour un statut
    const getStatusClass = status => {
      const statusClasses = {
        active: 'status-active',
        inactive: 'status-inactive',
        busy: 'status-busy',
        suspended: 'status-suspended',
      }

      return statusClasses[status] || ''
    }

    // Obtenir le libellé d'un statut
    const getStatusLabel = status => {
      const statusLabels = {
        active: 'Actif',
        inactive: 'Inactif',
        busy: 'Occupé',
        suspended: 'Suspendu',
      }

      return statusLabels[status] || status
    }

    onMounted(() => {
      loadCouriers()
    })

    return {
      loading,
      isSubmitting,
      couriers,
      viewMode,
      currentPage,
      totalPages,
      pageSize,
      totalItems,
      showInviteModal,
      showDetailsModal,
      selectedCourier,
      inviteForm,
      filters,
      paginationInfo,
      displayedPages,
      courierStats,
      VEHICLE_TYPES,
      PAGE_SIZE_OPTIONS,
      changePage,
      changePageSize,
      applyFilters,
      resetFilters,
      refreshData,
      exportCouriers,
      openInviteModal,
      inviteCourier,
      viewCourierDetails,
      toggleFavorite,
      getVehicleIcon,
      getVehicleLabel,
      getStatusClass,
      getStatusLabel,
      formatDate,
      formatPrice,
      getInitials,
    }
  },
}
</script>

<style scoped>
.couriers-view {
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

.couriers-stats {
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

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-phone {
  font-weight: 500;
  color: var(--text-color);
}

.contact-email {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.vehicle-info {
  display: flex;
  align-items: center;
}

.vehicle-icon {
  margin-right: 0.5rem;
  color: var(--text-secondary);
}

.rating-stars {
  display: flex;
  align-items: center;
}

.stars {
  display: flex;
  margin-right: 0.5rem;
  color: #ffc107;
}

.star-filled {
  color: #ffc107;
}

.star-empty {
  color: #e0e0e0;
}

.rating-value {
  font-weight: 500;
  color: var(--text-color);
}

.deliveries-info {
  display: flex;
  flex-direction: column;
}

.deliveries-total {
  font-weight: 500;
  color: var(--text-color);
}

.deliveries-success-rate {
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

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-inactive {
  background-color: #eeeeee;
  color: #757575;
}

.status-busy {
  background-color: #fff0e8;
  color: #ff6b00;
}

.status-suspended {
  background-color: #ffebee;
  color: #d32f2f;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
}

.couriers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.courier-card {
  background-color: var(--background-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s;
}

.courier-card:hover {
  box-shadow: 0 4px 12px var(--shadow-color);
  transform: translateY(-2px);
}

.courier-header {
  position: relative;
  padding: 1rem;
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.courier-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  background-color: var(--background-secondary);
}

.courier-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.favorite-button.active {
  color: #ffc107;
}

.courier-content {
  padding: 1rem;
}

.courier-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
  text-align: center;
}

.courier-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.courier-info {
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

.courier-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.modal-content.modal-lg {
  max-width: 800px;
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

.courier-profile {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.courier-profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.courier-profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--background-secondary);
  flex-shrink: 0;
}

.courier-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.courier-profile-info {
  flex: 1;
}

.courier-profile-info h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.courier-profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
}

.meta-item svg {
  margin-right: 0.5rem;
}

.courier-profile-rating {
  display: flex;
  align-items: center;
}

.courier-profile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.courier-profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.courier-profile-stats .stat-item {
  text-align: center;
}

.courier-profile-stats .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.courier-profile-stats .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.courier-profile-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-section {
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.details-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.details-content {
  color: var(--text-color);
}

.details-item {
  display: flex;
  margin-bottom: 0.5rem;
}

.details-label {
  width: 150px;
  font-weight: 500;
  color: var(--text-secondary);
}

.details-value {
  flex: 1;
}

.recent-delivery {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.delivery-id {
  font-weight: 600;
  color: var(--text-color);
}

.delivery-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.delivery-addresses {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.address-item {
  display: flex;
  align-items: center;
}

.address-icon {
  margin-right: 0.5rem;
}

.address-icon.pickup {
  color: var(--primary-color);
}

.address-icon.delivery {
  color: var(--success-color);
}

.address-arrow {
  margin: 0 0.5rem;
  color: var(--text-secondary);
}

.delivery-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delivery-price {
  font-weight: 600;
  color: var(--primary-color);
}

.recent-rating {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.rating-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.rating-comment {
  margin-bottom: 0.5rem;
}

.rating-delivery {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.text-warning {
  color: #ffc107;
}

.text-muted {
  color: var(--text-secondary);
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

  .courier-profile-header {
    flex-direction: column;
    text-align: center;
  }

  .courier-profile-meta,
  .courier-profile-rating {
    justify-content: center;
  }

  .courier-profile-actions {
    margin-top: 1rem;
  }

  .details-item {
    flex-direction: column;
  }

  .details-label {
    width: 100%;
    margin-bottom: 0.25rem;
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

  .couriers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
