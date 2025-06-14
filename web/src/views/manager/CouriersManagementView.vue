<template>
  <div class="couriers-management-view">
    <div class="page-header">
      <h1>Gestion des Coursiers</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="showAddCourierModal = true">
          <font-awesome-icon icon="plus" class="mr-1" />
          Ajouter un coursier
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" class="form-control">
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="pending_verification">En attente de vérification</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="availability-filter">Disponibilité</label>
          <select id="availability-filter" v-model="filters.availability" class="form-control">
            <option value="">Toutes</option>
            <option value="available">Disponible</option>
            <option value="unavailable">Indisponible</option>
            <option value="on_delivery">En livraison</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="vehicle-filter">Type de véhicule</label>
          <select id="vehicle-filter" v-model="filters.vehicleType" class="form-control">
            <option value="">Tous les véhicules</option>
            <option value="motorcycle">Moto</option>
            <option value="car">Voiture</option>
            <option value="bicycle">Vélo</option>
            <option value="foot">À pied</option>
            <option value="truck">Camion</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="commune-filter">Commune</label>
          <select id="commune-filter" v-model="filters.commune" class="form-control">
            <option value="">Toutes les communes</option>
            <option v-for="commune in communes" :key="commune" :value="commune">
              {{ commune }}
            </option>
          </select>
        </div>
      </div>

      <div class="filters-row">
        <div class="filter-group">
          <label for="rating-filter">Note minimale</label>
          <select id="rating-filter" v-model="filters.rating" class="form-control">
            <option value="">Toutes les notes</option>
            <option value="4">4★ et plus</option>
            <option value="3">3★ et plus</option>
            <option value="2">2★ et plus</option>
            <option value="1">1★ et plus</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="search-filter">Recherche</label>
          <div class="search-input">
            <input
              type="text"
              id="search-filter"
              v-model="filters.search"
              class="form-control"
              placeholder="Nom, email, téléphone..."
              @input="debounceSearch"
            />
            <font-awesome-icon icon="search" />
          </div>
        </div>

        <div class="filter-group">
          <label for="sort-by">Trier par</label>
          <select id="sort-by" v-model="sortBy" class="form-control">
            <option value="name_asc">Nom (A-Z)</option>
            <option value="name_desc">Nom (Z-A)</option>
            <option value="rating_desc">Note (élevée → basse)</option>
            <option value="rating_asc">Note (basse → élevée)</option>
            <option value="deliveries_desc">Livraisons (élevé → bas)</option>
            <option value="created_at_desc">Date d'inscription (récent → ancien)</option>
            <option value="created_at_asc">Date d'inscription (ancien → récent)</option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <font-awesome-icon icon="times" class="mr-1" />
          Réinitialiser les filtres
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <font-awesome-icon icon="filter" class="mr-1" />
          Appliquer les filtres
        </button>
      </div>
    </div>

    <!-- Carte des coursiers -->
    <div class="map-container">
      <div class="map-header">
        <h2>Localisation des coursiers</h2>
        <div class="map-actions">
          <button class="btn btn-sm btn-outline" @click="centerMap">
            <font-awesome-icon icon="crosshairs" class="mr-1" />
            Centrer
          </button>
          <select v-model="mapDisplayMode" class="form-control-sm">
            <option value="all">Tous les coursiers</option>
            <option value="available">Coursiers disponibles</option>
            <option value="on_delivery">Coursiers en livraison</option>
          </select>
          <div class="map-refresh">
            <span>Actualisation: {{ autoRefreshEnabled ? 'Activée' : 'Désactivée' }}</span>
            <label class="toggle-switch">
              <input type="checkbox" v-model="autoRefreshEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      <div id="couriers-map" class="map-content"></div>
      <div class="map-legend">
        <div class="legend-item">
          <div class="legend-color courier-available"></div>
          <div class="legend-label">Disponible</div>
        </div>
        <div class="legend-item">
          <div class="legend-color courier-on-delivery"></div>
          <div class="legend-label">En livraison</div>
        </div>
        <div class="legend-item">
          <div class="legend-color courier-unavailable"></div>
          <div class="legend-label">Indisponible</div>
        </div>
        <div class="legend-item">
          <div class="legend-color courier-selected"></div>
          <div class="legend-label">Sélectionné</div>
        </div>
      </div>
    </div>

    <!-- Tableau des coursiers -->
    <div class="table-container" v-if="!loading && couriers.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Coursier</th>
            <th>Contact</th>
            <th>Véhicule</th>
            <th>Statut</th>
            <th>Disponibilité</th>
            <th>Note</th>
            <th>Livraisons</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="courier in couriers"
            :key="courier.id"
            @click="selectCourier(courier)"
            :class="{ 'selected-row': selectedCourier && selectedCourier.id === courier.id }"
          >
            <td>#{{ courier.id }}</td>
            <td>
              <div class="courier-name">
                <div class="courier-avatar">
                  <img
                    v-if="courier.profile_picture"
                    :src="courier.profile_picture"
                    :alt="courier.name"
                  />
                  <div v-else class="avatar-placeholder">{{ getInitials(courier.name) }}</div>
                </div>
                <span>{{ courier.name }}</span>
              </div>
            </td>
            <td>
              <div class="courier-contact">
                <div><font-awesome-icon icon="phone" class="mr-1" /> {{ courier.phone }}</div>
                <div><font-awesome-icon icon="envelope" class="mr-1" /> {{ courier.email }}</div>
              </div>
            </td>
            <td>
              <div class="vehicle-info">
                <font-awesome-icon :icon="getVehicleIcon(courier.vehicle_type)" class="mr-1" />
                {{ getVehicleTypeLabel(courier.vehicle_type) }}
                <div v-if="courier.license_plate" class="license-plate">
                  {{ courier.license_plate }}
                </div>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(courier.status)">
                {{ getStatusLabel(courier.status) }}
              </span>
            </td>
            <td>
              <span class="availability-badge" :class="getAvailabilityClass(courier.availability)">
                {{ getAvailabilityLabel(courier.availability) }}
              </span>
            </td>
            <td>
              <div class="rating">
                <div class="stars">
                  <font-awesome-icon
                    v-for="n in 5"
                    :key="n"
                    icon="star"
                    :class="{ filled: n <= Math.round(courier.rating) }"
                  />
                </div>
                <span class="rating-value">{{ courier.rating.toFixed(1) }}</span>
              </div>
            </td>
            <td>
              <div class="deliveries-info">
                <div>
                  Total: <strong>{{ courier.total_deliveries }}</strong>
                </div>
                <div>
                  Mois: <strong>{{ courier.monthly_deliveries }}</strong>
                </div>
              </div>
            </td>
            <td>
              <div class="actions-cell">
                <button
                  class="btn-icon"
                  @click.stop="viewCourierDetails(courier.id)"
                  title="Voir les détails"
                >
                  <font-awesome-icon icon="eye" />
                </button>
                <button class="btn-icon" @click.stop="editCourier(courier.id)" title="Modifier">
                  <font-awesome-icon icon="edit" />
                </button>
                <button
                  v-if="courier.status === 'active'"
                  class="btn-icon"
                  @click.stop="suspendCourier(courier.id)"
                  title="Suspendre"
                >
                  <font-awesome-icon icon="ban" />
                </button>
                <button
                  v-if="courier.status === 'suspended'"
                  class="btn-icon"
                  @click.stop="activateCourier(courier.id)"
                  title="Activer"
                >
                  <font-awesome-icon icon="check" />
                </button>
                <button
                  v-if="courier.status === 'pending_verification'"
                  class="btn-icon"
                  @click.stop="verifyCourier(courier.id)"
                  title="Vérifier"
                >
                  <font-awesome-icon icon="check-circle" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button class="btn-page" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          <font-awesome-icon icon="chevron-left" />
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
          <font-awesome-icon icon="chevron-right" />
        </button>
      </div>
    </div>

    <!-- État vide -->
    <div class="empty-state" v-else-if="!loading && couriers.length === 0">
      <div class="empty-icon">
        <font-awesome-icon icon="users" />
      </div>
      <h3>Aucun coursier trouvé</h3>
      <p>Aucun coursier ne correspond à vos critères de recherche.</p>
      <button class="btn btn-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des coursiers...</p>
    </div>

    <!-- Modal de détails du coursier -->
    <div class="modal" v-if="showCourierDetailsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails du coursier</h2>
          <button class="btn-close" @click="closeCourierDetailsModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body" v-if="selectedCourier">
          <div class="courier-details">
            <div class="courier-details-header">
              <div class="courier-details-avatar">
                <img
                  v-if="selectedCourier.profile_picture"
                  :src="selectedCourier.profile_picture"
                  :alt="selectedCourier.name"
                />
                <div v-else class="avatar-placeholder">{{ getInitials(selectedCourier.name) }}</div>
              </div>
              <div class="courier-details-info">
                <h2 class="courier-details-name">{{ selectedCourier.name }}</h2>
                <div class="courier-details-meta">
                  <span class="status-badge" :class="getStatusClass(selectedCourier.status)">
                    {{ getStatusLabel(selectedCourier.status) }}
                  </span>
                  <span
                    class="availability-badge"
                    :class="getAvailabilityClass(selectedCourier.availability)"
                  >
                    {{ getAvailabilityLabel(selectedCourier.availability) }}
                  </span>
                </div>
              </div>
              <div class="courier-details-actions">
                <button class="btn btn-outline" @click="editCourier(selectedCourier.id)">
                  <font-awesome-icon icon="edit" class="mr-1" />
                  Modifier
                </button>
                <button
                  v-if="selectedCourier.status === 'active'"
                  class="btn btn-danger"
                  @click="suspendCourier(selectedCourier.id)"
                >
                  <font-awesome-icon icon="ban" class="mr-1" />
                  Suspendre
                </button>
                <button
                  v-if="selectedCourier.status === 'suspended'"
                  class="btn btn-success"
                  @click="activateCourier(selectedCourier.id)"
                >
                  <font-awesome-icon icon="check" class="mr-1" />
                  Activer
                </button>
                <button
                  v-if="selectedCourier.status === 'pending_verification'"
                  class="btn btn-success"
                  @click="verifyCourier(selectedCourier.id)"
                >
                  <font-awesome-icon icon="check-circle" class="mr-1" />
                  Vérifier
                </button>
              </div>
            </div>

            <div class="courier-details-tabs">
              <button
                v-for="tab in courierDetailsTabs"
                :key="tab.id"
                class="tab-button"
                :class="{ active: activeCourierDetailsTab === tab.id }"
                @click="activeCourierDetailsTab = tab.id"
              >
                <font-awesome-icon :icon="tab.icon" class="tab-icon" />
                <span class="tab-label">{{ tab.label }}</span>
              </button>
            </div>

            <div class="courier-details-content">
              <!-- Informations personnelles -->
              <div v-if="activeCourierDetailsTab === 'personal'" class="courier-details-section">
                <h3>Informations personnelles</h3>

                <div class="details-grid">
                  <div class="details-item">
                    <div class="details-label">ID</div>
                    <div class="details-value">#{{ selectedCourier.id }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Nom complet</div>
                    <div class="details-value">{{ selectedCourier.name }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Email</div>
                    <div class="details-value">{{ selectedCourier.email }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Téléphone</div>
                    <div class="details-value">{{ selectedCourier.phone }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Adresse</div>
                    <div class="details-value">
                      {{ selectedCourier.address || 'Non renseignée' }}
                    </div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Commune</div>
                    <div class="details-value">
                      {{ selectedCourier.commune || 'Non renseignée' }}
                    </div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Inscrit le</div>
                    <div class="details-value">{{ formatDate(selectedCourier.created_at) }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Dernière connexion</div>
                    <div class="details-value">{{ formatDate(selectedCourier.last_login) }}</div>
                  </div>
                </div>

                <div class="courier-vehicle-details">
                  <h4>Informations du véhicule</h4>

                  <div class="details-grid">
                    <div class="details-item">
                      <div class="details-label">Type de véhicule</div>
                      <div class="details-value">
                        <font-awesome-icon
                          :icon="getVehicleIcon(selectedCourier.vehicle_type)"
                          class="mr-1"
                        />
                        {{ getVehicleTypeLabel(selectedCourier.vehicle_type) }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Numéro d'immatriculation</div>
                      <div class="details-value">
                        {{ selectedCourier.license_plate || 'Non renseigné' }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Numéro de permis</div>
                      <div class="details-value">
                        {{ selectedCourier.driving_license || 'Non renseigné' }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Disponibilité</div>
                      <div class="details-value">
                        {{ getAvailabilityLabel(selectedCourier.availability) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Performance -->
              <div v-if="activeCourierDetailsTab === 'performance'" class="courier-details-section">
                <h3>Performance</h3>

                <div class="performance-summary">
                  <div class="performance-card">
                    <div class="performance-value">{{ selectedCourier.total_deliveries }}</div>
                    <div class="performance-label">Livraisons totales</div>
                  </div>
                  <div class="performance-card">
                    <div class="performance-value">{{ selectedCourier.monthly_deliveries }}</div>
                    <div class="performance-label">Livraisons ce mois</div>
                  </div>
                  <div class="performance-card">
                    <div class="performance-value">{{ selectedCourier.weekly_deliveries }}</div>
                    <div class="performance-label">Livraisons cette semaine</div>
                  </div>
                  <div class="performance-card">
                    <div class="performance-value">
                      {{ formatCurrency(selectedCourier.total_earnings) }}
                    </div>
                    <div class="performance-label">Gains totaux</div>
                  </div>
                </div>

                <div class="performance-charts">
                  <div class="chart-container">
                    <h4>Livraisons par jour</h4>
                    <div class="chart-placeholder">
                      <font-awesome-icon icon="chart-bar" />
                      <p>Graphique des livraisons par jour</p>
                    </div>
                  </div>

                  <div class="chart-container">
                    <h4>Évaluations</h4>
                    <div class="chart-placeholder">
                      <font-awesome-icon icon="star" />
                      <p>Graphique des évaluations</p>
                    </div>
                  </div>
                </div>

                <div class="performance-metrics">
                  <h4>Métriques de performance</h4>

                  <div class="metrics-grid">
                    <div class="metric-item">
                      <div class="metric-label">Taux d'acceptation</div>
                      <div class="metric-value">
                        {{ (selectedCourier.acceptance_rate * 100).toFixed(1) }}%
                      </div>
                      <div class="metric-progress">
                        <div
                          class="progress-bar"
                          :style="{ width: selectedCourier.acceptance_rate * 100 + '%' }"
                        ></div>
                      </div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">Taux de complétion</div>
                      <div class="metric-value">
                        {{ (selectedCourier.completion_rate * 100).toFixed(1) }}%
                      </div>
                      <div class="metric-progress">
                        <div
                          class="progress-bar"
                          :style="{ width: selectedCourier.completion_rate * 100 + '%' }"
                        ></div>
                      </div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">Temps moyen de livraison</div>
                      <div class="metric-value">
                        {{ formatMinutes(selectedCourier.average_delivery_time) }}
                      </div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-label">Distance moyenne par livraison</div>
                      <div class="metric-value">
                        {{ selectedCourier.average_distance.toFixed(1) }} km
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Livraisons -->
              <div v-if="activeCourierDetailsTab === 'deliveries'" class="courier-details-section">
                <h3>Livraisons récentes</h3>

                <div v-if="courierDeliveries.length === 0" class="empty-state">
                  <font-awesome-icon icon="truck" />
                  <p>Aucune livraison trouvée</p>
                </div>
                <div v-else class="deliveries-list">
                  <table class="deliveries-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Origine</th>
                        <th>Destination</th>
                        <th>Statut</th>
                        <th>Montant</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="delivery in courierDeliveries" :key="delivery.id">
                        <td>#{{ delivery.id }}</td>
                        <td>{{ formatDate(delivery.created_at) }}</td>
                        <td>{{ delivery.client_name }}</td>
                        <td>{{ delivery.pickup_address }}</td>
                        <td>{{ delivery.delivery_address }}</td>
                        <td>
                          <span
                            class="status-badge"
                            :class="getDeliveryStatusClass(delivery.status)"
                          >
                            {{ getDeliveryStatusLabel(delivery.status) }}
                          </span>
                        </td>
                        <td>{{ formatCurrency(delivery.price) }} FCFA</td>
                        <td>
                          <div class="rating" v-if="delivery.rating">
                            <div class="stars">
                              <font-awesome-icon
                                v-for="n in 5"
                                :key="n"
                                icon="star"
                                :class="{ filled: n <= Math.round(delivery.rating) }"
                              />
                            </div>
                          </div>
                          <span v-else>-</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Paiements -->
              <div v-if="activeCourierDetailsTab === 'payments'" class="courier-details-section">
                <h3>Paiements</h3>

                <div v-if="courierPayments.length === 0" class="empty-state">
                  <font-awesome-icon icon="money-bill" />
                  <p>Aucun paiement trouvé</p>
                </div>
                <div v-else class="payments-list">
                  <table class="payments-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Montant</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="payment in courierPayments" :key="payment.id">
                        <td>#{{ payment.id }}</td>
                        <td>{{ formatDate(payment.date) }}</td>
                        <td>{{ payment.description }}</td>
                        <td>{{ formatCurrency(payment.amount) }} FCFA</td>
                        <td>
                          <div class="payment-method">
                            <font-awesome-icon
                              :icon="getPaymentMethodIcon(payment.method)"
                              class="mr-1"
                            />
                            {{ getPaymentMethodLabel(payment.method) }}
                          </div>
                        </td>
                        <td>
                          <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                            {{ getPaymentStatusLabel(payment.status) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Vérification KYC -->
              <div v-if="activeCourierDetailsTab === 'kyc'" class="courier-details-section">
                <h3>Vérification KYC</h3>

                <div v-if="!selectedCourier.kyc" class="empty-state">
                  <font-awesome-icon icon="id-card" />
                  <p>Aucun document KYC soumis</p>
                </div>
                <div v-else class="kyc-details">
                  <div class="kyc-status">
                    <div class="kyc-status-label">Statut de vérification :</div>
                    <span
                      class="status-badge"
                      :class="getKycStatusClass(selectedCourier.kyc.status)"
                    >
                      {{ getKycStatusLabel(selectedCourier.kyc.status) }}
                    </span>
                  </div>

                  <div class="kyc-documents">
                    <div class="kyc-document-section">
                      <h4>Documents du coursier</h4>

                      <div class="document-grid">
                        <div class="document-item">
                          <div class="document-header">
                            <div class="document-title">Pièce d'identité</div>
                            <div
                              class="document-status"
                              :class="selectedCourier.kyc.id_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedCourier.kyc.id_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedCourier.kyc.id_document">
                            <img
                              v-if="isImageDocument(selectedCourier.kyc.id_document)"
                              :src="selectedCourier.kyc.id_document"
                              alt="Pièce d'identité"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedCourier.kyc.id_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedCourier.kyc.id_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedCourier.id, 'id')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedCourier.kyc.id_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedCourier.id, 'id')"
                                title="Rejeter"
                              >
                                <font-awesome-icon icon="times" />
                              </button>
                            </div>
                          </div>
                          <div v-else class="document-empty">Aucun document soumis</div>
                        </div>

                        <div class="document-item">
                          <div class="document-header">
                            <div class="document-title">Permis de conduire</div>
                            <div
                              class="document-status"
                              :class="selectedCourier.kyc.license_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedCourier.kyc.license_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedCourier.kyc.license_document">
                            <img
                              v-if="isImageDocument(selectedCourier.kyc.license_document)"
                              :src="selectedCourier.kyc.license_document"
                              alt="Permis de conduire"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedCourier.kyc.license_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedCourier.kyc.license_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedCourier.id, 'license')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedCourier.kyc.license_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedCourier.id, 'license')"
                                title="Rejeter"
                              >
                                <font-awesome-icon icon="times" />
                              </button>
                            </div>
                          </div>
                          <div v-else class="document-empty">Aucun document soumis</div>
                        </div>

                        <div class="document-item">
                          <div class="document-header">
                            <div class="document-title">Carte grise</div>
                            <div
                              class="document-status"
                              :class="selectedCourier.kyc.vehicle_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedCourier.kyc.vehicle_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedCourier.kyc.vehicle_document">
                            <img
                              v-if="isImageDocument(selectedCourier.kyc.vehicle_document)"
                              :src="selectedCourier.kyc.vehicle_document"
                              alt="Carte grise"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedCourier.kyc.vehicle_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedCourier.kyc.vehicle_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedCourier.id, 'vehicle')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedCourier.kyc.vehicle_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedCourier.id, 'vehicle')"
                                title="Rejeter"
                              >
                                <font-awesome-icon icon="times" />
                              </button>
                            </div>
                          </div>
                          <div v-else class="document-empty">Aucun document soumis</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="kyc-actions" v-if="selectedCourier.status === 'pending_verification'">
                    <button class="btn btn-success" @click="verifyCourier(selectedCourier.id)">
                      <font-awesome-icon icon="check-circle" class="mr-1" />
                      Approuver la vérification
                    </button>
                    <button class="btn btn-danger" @click="rejectVerification(selectedCourier.id)">
                      <font-awesome-icon icon="times-circle" class="mr-1" />
                      Rejeter la vérification
                    </button>
                  </div>
                </div>
              </div>

              <!-- Localisation -->
              <div v-if="activeCourierDetailsTab === 'location'" class="courier-details-section">
                <h3>Localisation actuelle</h3>

                <div class="location-details">
                  <div class="location-info">
                    <div class="location-item">
                      <div class="location-label">Dernière mise à jour</div>
                      <div class="location-value">
                        {{ formatDateTime(selectedCourier.last_location_update) }}
                      </div>
                    </div>
                    <div class="location-item">
                      <div class="location-label">Adresse</div>
                      <div class="location-value">
                        {{ selectedCourier.current_address || 'Non disponible' }}
                      </div>
                    </div>
                    <div class="location-item">
                      <div class="location-label">Commune</div>
                      <div class="location-value">
                        {{ selectedCourier.current_commune || 'Non disponible' }}
                      </div>
                    </div>
                    <div class="location-item">
                      <div class="location-label">Coordonnées</div>
                      <div class="location-value">
                        <span v-if="selectedCourier.latitude && selectedCourier.longitude">
                          {{ selectedCourier.latitude.toFixed(6) }},
                          {{ selectedCourier.longitude.toFixed(6) }}
                        </span>
                        <span v-else>Non disponible</span>
                      </div>
                    </div>
                  </div>

                  <div id="courier-detail-map" class="location-map"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCourierDetailsModal">Fermer</button>
          <button class="btn btn-primary" @click="sendNotification(selectedCourier?.id)">
            <font-awesome-icon icon="bell" class="mr-1" />
            Envoyer une notification
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout/modification de coursier -->
    <div class="modal" v-if="showAddCourierModal || showEditCourierModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showEditCourierModal ? 'Modifier le coursier' : 'Ajouter un coursier' }}</h2>
          <button class="btn-close" @click="closeCourierModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveCourier">
            <div class="form-group">
              <label for="courier_name">Nom complet</label>
              <input
                type="text"
                id="courier_name"
                v-model="courierForm.name"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="courier_email">Email</label>
              <input
                type="email"
                id="courier_email"
                v-model="courierForm.email"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="courier_phone">Téléphone</label>
              <input
                type="tel"
                id="courier_phone"
                v-model="courierForm.phone"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="courier_address">Adresse</label>
              <input
                type="text"
                id="courier_address"
                v-model="courierForm.address"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="courier_commune">Commune</label>
              <select id="courier_commune" v-model="courierForm.commune" class="form-control">
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="courier_vehicle_type">Type de véhicule</label>
              <select
                id="courier_vehicle_type"
                v-model="courierForm.vehicleType"
                class="form-control"
                required
              >
                <option value="motorcycle">Moto</option>
                <option value="car">Voiture</option>
                <option value="bicycle">Vélo</option>
                <option value="foot">À pied</option>
                <option value="truck">Camion</option>
              </select>
            </div>

            <div class="form-group">
              <label for="courier_license_plate">Numéro d'immatriculation</label>
              <input
                type="text"
                id="courier_license_plate"
                v-model="courierForm.licensePlate"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="courier_driving_license">Numéro de permis</label>
              <input
                type="text"
                id="courier_driving_license"
                v-model="courierForm.drivingLicense"
                class="form-control"
              />
            </div>

            <div class="form-group" v-if="!showEditCourierModal">
              <label for="courier_password">Mot de passe</label>
              <div class="password-input">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="courier_password"
                  v-model="courierForm.password"
                  class="form-control"
                  :required="!showEditCourierModal"
                />
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="courier_status">Statut</label>
              <select
                id="courier_status"
                v-model="courierForm.status"
                class="form-control"
                required
              >
                <option value="active">Actif</option>
                <option value="pending_verification">En attente de vérification</option>
                <option value="suspended">Suspendu</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeCourierModal">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
                {{ showEditCourierModal ? 'Enregistrer' : 'Ajouter' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal d'envoi de notification -->
    <div class="modal" v-if="showNotificationModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Envoyer une notification</h2>
          <button class="btn-close" @click="closeNotificationModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitNotification">
            <div class="form-group">
              <label for="notification_title">Titre</label>
              <input
                type="text"
                id="notification_title"
                v-model="notificationForm.title"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="notification_message">Message</label>
              <textarea
                id="notification_message"
                v-model="notificationForm.message"
                class="form-control"
                rows="4"
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label for="notification_type">Type</label>
              <select
                id="notification_type"
                v-model="notificationForm.type"
                class="form-control"
                required
              >
                <option value="system">Système</option>
                <option value="delivery_status">Statut de livraison</option>
                <option value="new_bid">Nouvelle offre</option>
                <option value="weather_alert">Alerte météo</option>
              </select>
            </div>

            <div class="form-group">
              <label>Canaux</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="notificationForm.channels.in_app" />
                  Application
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="notificationForm.channels.push" />
                  Push
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="notificationForm.channels.sms" />
                  SMS
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="notificationForm.channels.whatsapp" />
                  WhatsApp
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="notificationForm.channels.email" />
                  Email
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeNotificationModal">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSendingNotification">
                <font-awesome-icon icon="spinner" spin v-if="isSendingNotification" class="mr-1" />
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de rejet de vérification -->
    <div class="modal" v-if="showRejectVerificationModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h2>Rejeter la vérification</h2>
          <button class="btn-close" @click="showRejectVerificationModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <p>Veuillez indiquer la raison du rejet de la vérification de ce coursier.</p>
          <div class="form-group">
            <label for="rejection_reason">Raison du rejet</label>
            <textarea
              id="rejection_reason"
              v-model="rejectionReason"
              class="form-control"
              rows="4"
              placeholder="Expliquez pourquoi la vérification est rejetée..."
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRejectVerificationModal = false">
            Annuler
          </button>
          <button
            class="btn btn-danger"
            @click="confirmRejectVerification"
            :disabled="!rejectionReason.trim()"
          >
            <font-awesome-icon icon="times-circle" class="mr-1" />
            Rejeter
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import {
  fetchCouriers,
  fetchCourierDetails,
  fetchCourierDeliveries,
  fetchCourierPayments,
  addCourier,
  updateCourier,
  updateCourierStatus,
  verifyCourierDocument,
  rejectCourierDocument,
  verifyCourierKyc,
  rejectCourierKyc,
  sendCourierNotification,
} from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime, formatMinutes } from '@/utils/formatters'
import { COMMUNES } from '@/config'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

export default {
  name: 'CouriersManagementView',
  setup() {
    const route = useRoute()
    const store = useStore()
    const { showToast } = useToast()

    // État
    const couriers = ref([])
    const selectedCourier = ref(null)
    const showAddCourierModal = ref(false)
    const showEditCourierModal = ref(false)
    const showCourierDetailsModal = ref(false)
    const showNotificationModal = ref(false)
    const showRejectVerificationModal = ref(false)
    const loading = ref(true)
    const isSaving = ref(false)
    const isSendingNotification = ref(false)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const mapDisplayMode = ref('all')
    const autoRefreshEnabled = ref(false)
    const showPassword = ref(false)
    const rejectionReason = ref('')
    const courierMap = ref(null)
    const courierDetailMap = ref(null)
    const courierMarkers = ref({})
    const refreshInterval = ref(null)
    const communes = COMMUNES
    const courierDeliveries = ref([])
    const courierPayments = ref([])

    const filters = reactive({
      status: '',
      availability: '',
      vehicleType: '',
      commune: '',
      rating: '',
      search: '',
    })

    const courierForm = reactive({
      id: null,
      name: '',
      email: '',
      phone: '',
      address: '',
      commune: '',
      vehicleType: 'motorcycle',
      licensePlate: '',
      drivingLicense: '',
      password: '',
      status: 'active',
    })

    const notificationForm = reactive({
      title: '',
      message: '',
      type: 'system',
      channels: {
        in_app: true,
        push: false,
        sms: false,
        whatsapp: false,
        email: false,
      },
    })

    const courierDetailsTabs = [
      { id: 'personal', label: 'Informations', icon: 'user' },
      { id: 'performance', label: 'Performance', icon: 'chart-line' },
      { id: 'deliveries', label: 'Livraisons', icon: 'truck' },
      { id: 'payments', label: 'Paiements', icon: 'money-bill' },
      { id: 'kyc', label: 'Vérification KYC', icon: 'id-card' },
      { id: 'location', label: 'Localisation', icon: 'map-marker-alt' },
    ]

    const activeCourierDetailsTab = ref('personal')

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          status: filters.status,
          availability: filters.availability,
          vehicle_type: filters.vehicleType,
          commune: filters.commune,
          rating: filters.rating,
          search: filters.search,
          sort: sortBy.value,
        }

        const response = await fetchCouriers(params)
        couriers.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages

        // Mettre à jour les marqueurs sur la carte
        updateMapMarkers()
      } catch (error) {
        console.error('Erreur lors du chargement des coursiers:', error)
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
      filters.availability = ''
      filters.vehicleType = ''
      filters.commune = ''
      filters.rating = ''
      filters.search = ''
      currentPage.value = 1
      fetchData()
    }

    const changePage = page => {
      currentPage.value = page
      fetchData()
    }

    const initMap = () => {
      // Initialiser la carte principale
      if (!courierMap.value) {
        courierMap.value = L.map('couriers-map').setView([5.36, -4.0083], 12) // Coordonnées d'Abidjan

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(courierMap.value)
      }
    }

    const updateMapMarkers = () => {
      if (!courierMap.value) return

      // Supprimer les marqueurs existants
      Object.values(courierMarkers.value).forEach(marker => {
        courierMap.value.removeLayer(marker)
      })

      courierMarkers.value = {}

      // Filtrer les coursiers selon le mode d'affichage
      let filteredCouriers = couriers.value
      if (mapDisplayMode.value === 'available') {
        filteredCouriers = couriers.value.filter(c => c.availability === 'available')
      } else if (mapDisplayMode.value === 'on_delivery') {
        filteredCouriers = couriers.value.filter(c => c.availability === 'on_delivery')
      }

      // Ajouter les nouveaux marqueurs
      filteredCouriers.forEach(courier => {
        if (courier.latitude && courier.longitude) {
          const markerIcon = L.divIcon({
            className: `courier-marker ${getAvailabilityMarkerClass(courier.availability)}`,
            html: `<div class="marker-content">${getInitials(courier.name)}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          })

          const marker = L.marker([courier.latitude, courier.longitude], {
            icon: markerIcon,
          }).addTo(courierMap.value).bindPopup(`
              <div class="marker-popup">
                <div class="popup-header">${courier.name}</div>
                <div class="popup-content">
                  <div><strong>Téléphone:</strong> ${courier.phone}</div>
                  <div><strong>Véhicule:</strong> ${getVehicleTypeLabel(courier.vehicle_type)}</div>
                  <div><strong>Disponibilité:</strong> ${getAvailabilityLabel(
                    courier.availability
                  )}</div>
                  <div><strong>Note:</strong> ${courier.rating.toFixed(1)} ★</div>
                </div>
                <div class="popup-actions">
                  <button class="popup-btn" onclick="window.viewCourierDetails(${
                    courier.id
                  })">Voir détails</button>
                </div>
              </div>
            `)

          courierMarkers.value[courier.id] = marker

          // Si ce coursier est sélectionné, ouvrir son popup
          if (selectedCourier.value && selectedCourier.value.id === courier.id) {
            marker.openPopup()
          }
        }
      })

      // Centrer la carte si nécessaire
      if (filteredCouriers.length > 0 && filteredCouriers.some(c => c.latitude && c.longitude)) {
        const bounds = L.latLngBounds(
          filteredCouriers
            .filter(c => c.latitude && c.longitude)
            .map(c => [c.latitude, c.longitude])
        )
        courierMap.value.fitBounds(bounds, { padding: [50, 50] })
      }
    }

    const centerMap = () => {
      if (!courierMap.value) return

      const filteredCouriers = couriers.value.filter(c => c.latitude && c.longitude)

      if (filteredCouriers.length > 0) {
        const bounds = L.latLngBounds(filteredCouriers.map(c => [c.latitude, c.longitude]))
        courierMap.value.fitBounds(bounds, { padding: [50, 50] })
      } else {
        // Centrer sur Abidjan par défaut
        courierMap.value.setView([5.36, -4.0083], 12)
      }
    }

    const initDetailMap = () => {
      if (
        !courierDetailMap.value &&
        selectedCourier.value &&
        selectedCourier.value.latitude &&
        selectedCourier.value.longitude
      ) {
        // Initialiser la carte de détail
        setTimeout(() => {
          const mapElement = document.getElementById('courier-detail-map')
          if (mapElement) {
            courierDetailMap.value = L.map('courier-detail-map').setView(
              [selectedCourier.value.latitude, selectedCourier.value.longitude],
              15
            )

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(courierDetailMap.value)

            const markerIcon = L.divIcon({
              className: `courier-marker ${getAvailabilityMarkerClass(
                selectedCourier.value.availability
              )}`,
              html: `<div class="marker-content">${getInitials(selectedCourier.value.name)}</div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })

            L.marker([selectedCourier.value.latitude, selectedCourier.value.longitude], {
              icon: markerIcon,
            }).addTo(courierDetailMap.value)
          }
        }, 100)
      }
    }

    const selectCourier = courier => {
      selectedCourier.value = courier

      // Mettre en évidence le marqueur sur la carte
      if (courierMap.value && courierMarkers.value[courier.id]) {
        Object.values(courierMarkers.value).forEach(marker => {
          const markerElement = marker.getElement()
          if (markerElement) {
            markerElement.classList.remove('selected')
          }
        })

        const markerElement = courierMarkers.value[courier.id].getElement()
        if (markerElement) {
          markerElement.classList.add('selected')
        }

        courierMarkers.value[courier.id].openPopup()
      }
    }

    const viewCourierDetails = async courierId => {
      try {
        loading.value = true
        const response = await fetchCourierDetails(courierId)
        selectedCourier.value = response

        // Charger les livraisons du coursier
        loadCourierDeliveries(courierId)

        // Charger les paiements du coursier
        loadCourierPayments(courierId)

        // Afficher le modal
        showCourierDetailsModal.value = true

        // Réinitialiser l'onglet actif
        activeCourierDetailsTab.value = 'personal'
      } catch (error) {
        console.error('Erreur lors du chargement des détails du coursier:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const loadCourierDeliveries = async courierId => {
      try {
        const deliveries = await fetchCourierDeliveries(courierId)
        courierDeliveries.value = deliveries
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons du coursier:', error)
        courierDeliveries.value = []
      }
    }

    const loadCourierPayments = async courierId => {
      try {
        const payments = await fetchCourierPayments(courierId)
        courierPayments.value = payments
      } catch (error) {
        console.error('Erreur lors du chargement des paiements du coursier:', error)
        courierPayments.value = []
      }
    }

    const closeCourierDetailsModal = () => {
      showCourierDetailsModal.value = false
      selectedCourier.value = null

      // Détruire la carte de détail
      if (courierDetailMap.value) {
        courierDetailMap.value.remove()
        courierDetailMap.value = null
      }

      // Réinitialiser la sélection sur la carte principale
      if (courierMap.value) {
        Object.values(courierMarkers.value).forEach(marker => {
          const markerElement = marker.getElement()
          if (markerElement) {
            markerElement.classList.remove('selected')
          }
        })
      }
    }

    const editCourier = async courierId => {
      try {
        loading.value = true

        // Fermer le modal de détails s'il est ouvert
        if (showCourierDetailsModal.value) {
          closeCourierDetailsModal()
        }

        const courier = await fetchCourierDetails(courierId)

        // Remplir le formulaire avec les données du coursier
        courierForm.id = courier.id
        courierForm.name = courier.name
        courierForm.email = courier.email
        courierForm.phone = courier.phone
        courierForm.address = courier.address || ''
        courierForm.commune = courier.commune || ''
        courierForm.vehicleType = courier.vehicle_type
        courierForm.licensePlate = courier.license_plate || ''
        courierForm.drivingLicense = courier.driving_license || ''
        courierForm.password = ''
        courierForm.status = courier.status

        showEditCourierModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement du coursier:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const closeCourierModal = () => {
      showAddCourierModal.value = false
      showEditCourierModal.value = false
      resetCourierForm()
    }

    const resetCourierForm = () => {
      courierForm.id = null
      courierForm.name = ''
      courierForm.email = ''
      courierForm.phone = ''
      courierForm.address = ''
      courierForm.commune = ''
      courierForm.vehicleType = 'motorcycle'
      courierForm.licensePlate = ''
      courierForm.drivingLicense = ''
      courierForm.password = ''
      courierForm.status = 'active'
    }

    const saveCourier = async () => {
      try {
        isSaving.value = true

        const payload = {
          name: courierForm.name,
          email: courierForm.email,
          phone: courierForm.phone,
          address: courierForm.address,
          commune: courierForm.commune,
          vehicle_type: courierForm.vehicleType,
          license_plate: courierForm.licensePlate,
          driving_license: courierForm.drivingLicense,
          status: courierForm.status,
        }

        if (courierForm.password) {
          payload.password = courierForm.password
        }

        if (showEditCourierModal.value) {
          // Mise à jour d'un coursier existant
          await updateCourier(courierForm.id, payload)
        } else {
          // Création d'un nouveau coursier
          await addCourier(payload)
        }

        // Fermer le modal
        closeCourierModal()

        // Rafraîchir les données
        fetchData()

        // Afficher une notification de succès
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du coursier:", error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        isSaving.value = false
      }
    }

    const suspendCourier = async courierId => {
      if (!confirm(`Êtes-vous sûr de vouloir suspendre ce coursier ?`)) {
        return
      }

      try {
        await updateCourierStatus(courierId, 'suspended')

        // Mettre à jour le coursier dans la liste
        const index = couriers.value.findIndex(c => c.id === courierId)
        if (index !== -1) {
          couriers.value[index].status = 'suspended'
        }

        // Mettre à jour le coursier sélectionné si nécessaire
        if (selectedCourier.value && selectedCourier.value.id === courierId) {
          selectedCourier.value.status = 'suspended'
        }

        // Afficher une notification de succès
        showToast('Coursier suspendu avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors de la suspension du coursier:', error)
        showToast('Erreur lors de la suspension du coursier', { type: 'error' })
      }
    }

    const activateCourier = async courierId => {
      try {
        await updateCourierStatus(courierId, 'active')

        // Mettre à jour le coursier dans la liste
        const index = couriers.value.findIndex(c => c.id === courierId)
        if (index !== -1) {
          couriers.value[index].status = 'active'
        }

        // Mettre à jour le coursier sélectionné si nécessaire
        if (selectedCourier.value && selectedCourier.value.id === courierId) {
          selectedCourier.value.status = 'active'
        }

        // Afficher une notification de succès
        showToast('Coursier activé avec succès', { type: 'success' })
      } catch (error) {
        console.error("Erreur lors de l'activation du coursier:", error)
        showToast("Erreur lors de l'activation du coursier", { type: 'error' })
      }
    }

    const verifyCourier = async courierId => {
      try {
        await verifyCourierKyc(courierId)

        // Mettre à jour le coursier dans la liste
        const index = couriers.value.findIndex(c => c.id === courierId)
        if (index !== -1) {
          couriers.value[index].status = 'active'
        }

        // Mettre à jour le coursier sélectionné si nécessaire
        if (selectedCourier.value && selectedCourier.value.id === courierId) {
          selectedCourier.value.status = 'active'
          if (selectedCourier.value.kyc) {
            selectedCourier.value.kyc.status = 'verified'
          }
        }

        // Afficher une notification de succès
        showToast('Coursier vérifié avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors de la vérification du coursier:', error)
        showToast('Erreur lors de la vérification du coursier', { type: 'error' })
      }
    }

    const rejectVerification = courierId => {
      rejectionReason.value = ''
      showRejectVerificationModal.value = true
    }

    const confirmRejectVerification = async () => {
      try {
        if (!selectedCourier.value) return

        await rejectCourierKyc(selectedCourier.value.id, rejectionReason.value)

        // Mettre à jour le coursier dans la liste
        const index = couriers.value.findIndex(c => c.id === selectedCourier.value.id)
        if (index !== -1) {
          couriers.value[index].status = 'inactive'
        }

        // Mettre à jour le coursier sélectionné
        selectedCourier.value.status = 'inactive'
        if (selectedCourier.value.kyc) {
          selectedCourier.value.kyc.status = 'rejected'
        }

        // Fermer le modal
        showRejectVerificationModal.value = false

        // Afficher une notification de succès
        showToast('Vérification rejetée avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors du rejet de la vérification:', error)
        showToast('Erreur lors du rejet de la vérification', { type: 'error' })
      }
    }

    const verifyDocument = async (courierId, documentType) => {
      try {
        await verifyCourierDocument(courierId, documentType)

        // Mettre à jour le coursier sélectionné si nécessaire
        if (
          selectedCourier.value &&
          selectedCourier.value.id === courierId &&
          selectedCourier.value.kyc
        ) {
          selectedCourier.value.kyc[`${documentType}_verified`] = true
        }

        // Afficher une notification de succès
        showToast('Document vérifié avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors de la vérification du document:', error)
        showToast('Erreur lors de la vérification du document', { type: 'error' })
      }
    }

    const rejectDocument = async (courierId, documentType) => {
      if (!confirm('Êtes-vous sûr de vouloir rejeter ce document ?')) {
        return
      }

      try {
        await rejectCourierDocument(courierId, documentType)

        // Mettre à jour le coursier sélectionné si nécessaire
        if (
          selectedCourier.value &&
          selectedCourier.value.id === courierId &&
          selectedCourier.value.kyc
        ) {
          selectedCourier.value.kyc[`${documentType}_verified`] = false
          selectedCourier.value.kyc[`${documentType}_document`] = null
        }

        // Afficher une notification de succès
        showToast('Document rejeté avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors du rejet du document:', error)
        showToast('Erreur lors du rejet du document', { type: 'error' })
      }
    }

    const sendNotification = courierId => {
      // Réinitialiser le formulaire
      notificationForm.title = ''
      notificationForm.message = ''
      notificationForm.type = 'system'
      notificationForm.channels = {
        in_app: true,
        push: false,
        sms: false,
        whatsapp: false,
        email: false,
      }

      showNotificationModal.value = true
    }

    const closeNotificationModal = () => {
      showNotificationModal.value = false
    }

    const submitNotification = async () => {
      try {
        isSendingNotification.value = true

        if (!selectedCourier.value) return

        const channels = Object.entries(notificationForm.channels)
          .filter(([_, value]) => value)
          .map(([key]) => key)

        await sendCourierNotification(selectedCourier.value.id, {
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          channels,
        })

        // Fermer le modal
        closeNotificationModal()

        // Afficher une notification de succès
        showToast('Notification envoyée avec succès', { type: 'success' })
      } catch (error) {
        console.error("Erreur lors de l'envoi de la notification:", error)
        showToast("Erreur lors de l'envoi de la notification", { type: 'error' })
      } finally {
        isSendingNotification.value = false
      }
    }

    const blockCourier = async reason => {
      try {
        if (!selectedCourier.value) return

        await store.dispatch('blockCourier', {
          courierId: selectedCourier.value.id,
          reason: reason,
        })

        showToast('Coursier bloqué avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors du blocage du coursier:', error)
        showToast('Erreur lors du blocage du coursier', { type: 'error' })
      }
    }

    const unblockCourier = async () => {
      try {
        if (!selectedCourier.value) return

        await store.dispatch('unblockCourier', {
          courierId: selectedCourier.value.id,
        })

        showToast('Coursier débloqué avec succès', { type: 'success' })
      } catch (error) {
        console.error('Erreur lors du déblocage du coursier:', error)
        showToast('Erreur lors du déblocage du coursier', { type: 'error' })
      }
    }

    const onCourierBlocked = courier => {
      showToast(`Coursier ${courier.name} a été bloqué`, { type: 'info' })
    }

    store.subscribeAction({
      after: (action, state, error, response) => {
        if (action.type === 'auth/login') {
          if (response?.payload?.success) {
            this.$router.push('/')
          }
        }
      },
      onError: (error, response) => {
        showToast(response?.payload?.message, { type: 'error' })
      },
    })

    // Utilitaires
    const getInitials = name => {
      if (!name) return ''

      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }

    const isImageDocument = url => {
      if (!url) return false

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext))
    }

    const getVehicleIcon = vehicleType => {
      const vehicleIcons = {
        motorcycle: 'motorcycle',
        car: 'car',
        bicycle: 'bicycle',
        foot: 'walking',
        truck: 'truck',
      }

      return vehicleIcons[vehicleType] || 'question-circle'
    }

    const getVehicleTypeLabel = vehicleType => {
      const vehicleLabels = {
        motorcycle: 'Moto',
        car: 'Voiture',
        bicycle: 'Vélo',
        foot: 'À pied',
        truck: 'Camion',
      }

      return vehicleLabels[vehicleType] || vehicleType
    }

    const getStatusClass = status => {
      const statusClasses = {
        active: 'status-active',
        pending_verification: 'status-pending',
        suspended: 'status-suspended',
        inactive: 'status-inactive',
      }

      return statusClasses[status] || 'status-unknown'
    }

    const getStatusLabel = status => {
      const statusLabels = {
        active: 'Actif',
        pending_verification: 'En attente de vérification',
        suspended: 'Suspendu',
        inactive: 'Inactif',
      }

      return statusLabels[status] || status
    }

    const getAvailabilityClass = availability => {
      const availabilityClasses = {
        available: 'availability-available',
        unavailable: 'availability-unavailable',
        on_delivery: 'availability-on-delivery',
      }

      return availabilityClasses[availability] || 'availability-unknown'
    }

    const getAvailabilityMarkerClass = availability => {
      const markerClasses = {
        available: 'courier-available',
        unavailable: 'courier-unavailable',
        on_delivery: 'courier-on-delivery',
      }

      return markerClasses[availability] || 'courier-unknown'
    }

    const getAvailabilityLabel = availability => {
      const availabilityLabels = {
        available: 'Disponible',
        unavailable: 'Indisponible',
        on_delivery: 'En livraison',
      }

      return availabilityLabels[availability] || availability
    }

    const getDeliveryStatusClass = status => {
      const statusClasses = {
        pending: 'status-pending',
        accepted: 'status-accepted',
        picked_up: 'status-picked-up',
        in_transit: 'status-in-transit',
        delivered: 'status-delivered',
        cancelled: 'status-cancelled',
        failed: 'status-failed',
      }

      return statusClasses[status] || 'status-unknown'
    }

    const getDeliveryStatusLabel = status => {
      const statusLabels = {
        pending: 'En attente',
        accepted: 'Acceptée',
        picked_up: 'Récupérée',
        in_transit: 'En transit',
        delivered: 'Livrée',
        cancelled: 'Annulée',
        failed: 'Échouée',
      }

      return statusLabels[status] || status
    }

    const getPaymentMethodIcon = method => {
      const methodIcons = {
        cash: 'money-bill',
        orange_money: 'mobile-alt',
        mtn_money: 'mobile-alt',
        moov_money: 'mobile-alt',
        credit_card: 'credit-card',
        bank_transfer: 'university',
      }

      return methodIcons[method] || 'money-bill'
    }

    const getPaymentMethodLabel = method => {
      const methodLabels = {
        cash: 'Espèces',
        orange_money: 'Orange Money',
        mtn_money: 'MTN Money',
        moov_money: 'Moov Money',
        credit_card: 'Carte bancaire',
        bank_transfer: 'Virement bancaire',
      }

      return methodLabels[method] || method
    }

    const getPaymentStatusClass = status => {
      const statusClasses = {
        completed: 'status-completed',
        pending: 'status-pending',
        failed: 'status-failed',
      }

      return statusClasses[status] || 'status-unknown'
    }

    const getPaymentStatusLabel = status => {
      const statusLabels = {
        completed: 'Complété',
        pending: 'En attente',
        failed: 'Échoué',
      }

      return statusLabels[status] || status
    }

    const getKycStatusClass = status => {
      const statusClasses = {
        verified: 'status-active',
        pending: 'status-pending',
        rejected: 'status-suspended',
      }

      return statusClasses[status] || 'status-unknown'
    }

    const getKycStatusLabel = status => {
      const statusLabels = {
        verified: 'Vérifié',
        pending: 'En attente',
        rejected: 'Rejeté',
      }

      return statusLabels[status] || status
    }

    // Computed properties
    const sortBy = ref('name_asc')

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

      // Initialiser la carte après le rendu du DOM
      setTimeout(() => {
        initMap()
      }, 100)

      // Exposer la fonction viewCourierDetails pour les popups Leaflet
      window.viewCourierDetails = viewCourierDetails
    })

    onUnmounted(() => {
      // Nettoyer les intervalles et les cartes
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
      }

      if (courierMap.value) {
        courierMap.value.remove()
      }

      if (courierDetailMap.value) {
        courierDetailMap.value.remove()
      }

      // Supprimer la fonction globale
      delete window.viewCourierDetails
    })

    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })

    // Surveiller les changements du mode d'affichage de la carte
    watch(mapDisplayMode, () => {
      updateMapMarkers()
    })

    // Surveiller l'activation/désactivation de l'actualisation automatique
    watch(autoRefreshEnabled, newValue => {
      if (newValue) {
        // Activer l'actualisation automatique (toutes les 30 secondes)
        refreshInterval.value = setInterval(() => {
          fetchData()
        }, 30000)
      } else {
        // Désactiver l'actualisation automatique
        if (refreshInterval.value) {
          clearInterval(refreshInterval.value)
          refreshInterval.value = null
        }
      }
    })

    // Surveiller les changements d'onglet dans les détails du coursier
    watch(activeCourierDetailsTab, newValue => {
      if (newValue === 'location') {
        // Initialiser la carte de détail lorsque l'onglet de localisation est sélectionné
        initDetailMap()
      }
    })

    return {
      couriers,
      selectedCourier,
      showAddCourierModal,
      showEditCourierModal,
      showCourierDetailsModal,
      showNotificationModal,
      showRejectVerificationModal,
      loading,
      isSaving,
      isSendingNotification,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      mapDisplayMode,
      autoRefreshEnabled,
      showPassword,
      rejectionReason,
      filters,
      courierForm,
      notificationForm,
      courierDetailsTabs,
      activeCourierDetailsTab,
      communes,
      courierDeliveries,
      courierPayments,
      sortBy,
      displayedPages,

      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      centerMap,
      selectCourier,
      viewCourierDetails,
      closeCourierDetailsModal,
      editCourier,
      closeCourierModal,
      saveCourier,
      suspendCourier,
      activateCourier,
      verifyCourier,
      rejectVerification,
      confirmRejectVerification,
      verifyDocument,
      rejectDocument,
      sendNotification,
      closeNotificationModal,
      submitNotification,
      blockCourier,
      unblockCourier,

      getInitials,
      isImageDocument,
      getVehicleIcon,
      getVehicleTypeLabel,
      getStatusClass,
      getStatusLabel,
      getAvailabilityClass,
      getAvailabilityLabel,
      getDeliveryStatusClass,
      getDeliveryStatusLabel,
      getPaymentMethodIcon,
      getPaymentMethodLabel,
      getPaymentStatusClass,
      getPaymentStatusLabel,
      getKycStatusClass,
      getKycStatusLabel,

      formatCurrency,
      formatDate,
      formatDateTime,
      formatMinutes,
      debounceSearch,
      onCourierBlocked,
    }
  },
}
</script>

<style scoped>
.couriers-management-view {
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
  font-size: 0.875rem;
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

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.mr-1 {
  margin-right: 0.25rem;
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

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.form-control-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.search-input {
  position: relative;
}

.search-input input {
  padding-right: 2.5rem;
}

.search-input svg {
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

.map-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.map-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.map-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.map-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #495057;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #0056b3;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.map-content {
  height: 400px;
}

.map-legend {
  display: flex;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
}

.courier-available {
  background-color: #28a745;
}

.courier-on-delivery {
  background-color: #fd7e14;
}

.courier-unavailable {
  background-color: #dc3545;
}

.courier-selected {
  background-color: #0056b3;
}

.legend-label {
  font-size: 0.875rem;
  color: #495057;
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

.data-table tr.selected-row td {
  background-color: rgba(0, 86, 179, 0.1);
}

.courier-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.courier-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f8f9fa;
}

.courier-avatar img {
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
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background-color: #0056b3;
}

.courier-contact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.license-plate {
  font-size: 0.75rem;
  color: #6c757d;
}

.status-badge,
.availability-badge {
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
  background-color: #fff3cd;
  color: #856404;
}

.status-suspended {
  background-color: #f8d7da;
  color: #721c24;
}

.status-inactive {
  background-color: #e9ecef;
  color: #6c757d;
}

.availability-available {
  background-color: #d4edda;
  color: #155724;
}

.availability-unavailable {
  background-color: #f8d7da;
  color: #721c24;
}

.availability-on-delivery {
  background-color: #fff3cd;
  color: #856404;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.125rem;
}

.stars svg {
  color: #e9ecef;
  font-size: 0.875rem;
}

.stars svg.filled {
  color: #ffc107;
}

.rating-value {
  font-weight: 500;
}

.deliveries-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
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

.btn-icon svg {
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

.empty-state svg {
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

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #495057;
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 2.5rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
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

.courier-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.courier-details-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.courier-details-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f8f9fa;
  flex-shrink: 0;
}

.courier-details-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.courier-details-info {
  flex: 1;
}

.courier-details-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem;
}

.courier-details-meta {
  display: flex;
  gap: 0.5rem;
}

.courier-details-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.courier-details-tabs {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: #495057;
  white-space: nowrap;
}

.tab-button:hover {
  background-color: #f8f9fa;
}

.tab-button.active {
  border-bottom-color: #0056b3;
  color: #0056b3;
}

.tab-icon {
  margin-right: 0.75rem;
  width: 16px;
}

.courier-details-content {
  padding-top: 1.5rem;
}

.courier-details-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.courier-details-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.details-item {
  margin-bottom: 0.5rem;
}

.details-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.details-value {
  font-weight: 500;
  color: #333;
}

.courier-vehicle-details {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.performance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.performance-card {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
}

.performance-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0056b3;
  margin-bottom: 0.5rem;
}

.performance-label {
  font-size: 0.875rem;
  color: #495057;
}

.performance-charts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.chart-container h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-top: 0;
  margin-bottom: 1rem;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.chart-placeholder svg {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.performance-metrics {
  margin-top: 1.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.metric-item {
  margin-bottom: 1rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.metric-progress {
  height: 0.5rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #0056b3;
}

.deliveries-table,
.payments-table {
  width: 100%;
  border-collapse: collapse;
}

.deliveries-table th,
.deliveries-table td,
.payments-table th,
.payments-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.deliveries-table th,
.payments-table th {
  font-weight: 600;
  color: #495057;
  background-color: #f8f9fa;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kyc-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.kyc-status-label {
  font-weight: 500;
  color: #333;
}

.kyc-documents {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.document-item {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.document-title {
  font-weight: 500;
  color: #333;
}

.document-status {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.document-status.verified {
  color: #28a745;
}

.document-status.pending {
  color: #ffc107;
}

.document-preview {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.document-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pdf-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.pdf-preview svg {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.document-actions {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.document-empty {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.kyc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.location-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.location-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.location-item {
  margin-bottom: 0.5rem;
}

.location-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.location-value {
  font-weight: 500;
  color: #333;
}

.location-map {
  height: 300px;
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Styles pour les marqueurs Leaflet */
:global(.courier-marker) {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

:global(.courier-marker.courier-available) {
  background-color: #28a745;
}

:global(.courier-marker.courier-on-delivery) {
  background-color: #fd7e14;
}

:global(.courier-marker.courier-unavailable) {
  background-color: #dc3545;
}

:global(.courier-marker.selected) {
  border-color: #0056b3;
  border-width: 3px;
  z-index: 1000 !important;
}

:global(.marker-content) {
  color: white;
  font-weight: 700;
  font-size: 14px;
}

:global(.marker-popup) {
  padding: 5px;
}

:global(.popup-header) {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e9ecef;
}

:global(.popup-content) {
  font-size: 12px;
  margin-bottom: 10px;
}

:global(.popup-actions) {
  display: flex;
  justify-content: center;
}

:global(.popup-btn) {
  padding: 5px 10px;
  background-color: #0056b3;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
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

  .map-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .courier-details-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .courier-details-actions {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .courier-details-tabs {
    overflow-x: auto;
  }

  .tab-button {
    padding: 0.75rem 1rem;
  }

  .details-grid,
  .performance-summary,
  .performance-charts,
  .metrics-grid,
  .document-grid {
    grid-template-columns: 1fr;
  }

  .data-table {
    display: block;
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .actions {
    width: 100%;
  }

  .btn {
    flex: 1;
  }

  .filters-actions {
    flex-direction: column;
  }

  .filters-actions .btn {
    width: 100%;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }

  .kyc-actions {
    flex-direction: column;
  }
}
</style>
