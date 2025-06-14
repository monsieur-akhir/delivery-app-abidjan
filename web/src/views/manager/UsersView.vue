<template>
  <div class="users-view">
    <div class="page-header">
      <h1>Gestion des utilisateurs</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="showAddUserModal = true">
          <font-awesome-icon icon="plus" class="mr-1" />
          Ajouter un utilisateur
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label for="role-filter">Rôle</label>
          <select id="role-filter" v-model="filters.role" class="form-control">
            <option value="">Tous les rôles</option>
            <option value="client">Client</option>
            <option value="courier">Coursier</option>
            <option value="business">Entreprise</option>
            <option value="manager">Gestionnaire</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" class="form-control">
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="pending_verification">En attente de vérification</option>
            <option value="suspended">Suspendu</option>
            <option value="inactive">Inactif</option>
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
            />
            <button class="search-clear" v-if="filters.search" @click="filters.search = ''">
              <font-awesome-icon icon="times" />
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

    <div v-if="loading" class="loading-state">
      <font-awesome-icon icon="spinner" spin size="2x" />
      <p>Chargement des utilisateurs...</p>
    </div>

    <div v-else>
      <div v-if="users.length === 0" class="empty-state">
        <font-awesome-icon icon="users" size="2x" />
        <p>Aucun utilisateur trouvé</p>
      </div>
      <div v-else class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th class="sortable" @click="sortBy('id')">
                ID
                <font-awesome-icon
                  v-if="sortColumn === 'id'"
                  :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
                />
              </th>
              <th class="sortable" @click="sortBy('name')">
                Nom
                <font-awesome-icon
                  v-if="sortColumn === 'name'"
                  :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
                />
              </th>
              <th>Email</th>
              <th>Téléphone</th>
              <th class="sortable" @click="sortBy('role')">
                Rôle
                <font-awesome-icon
                  v-if="sortColumn === 'role'"
                  :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
                />
              </th>
              <th class="sortable" @click="sortBy('status')">
                Statut
                <font-awesome-icon
                  v-if="sortColumn === 'status'"
                  :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
                />
              </th>
              <th class="sortable" @click="sortBy('created_at')">
                Inscrit le
                <font-awesome-icon
                  v-if="sortColumn === 'created_at'"
                  :icon="sortDirection === 'asc' ? 'sort-up' : 'sort-down'"
                />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>#{{ user.id }}</td>
              <td>
                <div class="user-name">
                  <div class="user-avatar">
                    <img v-if="user.profile_picture" :src="user.profile_picture" :alt="user.name" />
                    <div v-else class="avatar-placeholder">{{ getInitials(user.name) }}</div>
                  </div>
                  <span>{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone }}</td>
              <td>
                <span class="role-badge" :class="getRoleClass(user.role)">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(user.status)">
                  {{ getStatusLabel(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="viewUserDetails(user)" title="Voir les détails">
                    <font-awesome-icon icon="eye" />
                  </button>
                  <button class="btn-icon" @click="editUser(user)" title="Modifier">
                    <font-awesome-icon icon="edit" />
                  </button>
                  <button
                    v-if="user.status === 'active'"
                    class="btn-icon"
                    @click="suspendUser(user)"
                    title="Suspendre"
                  >
                    <font-awesome-icon icon="ban" />
                  </button>
                  <button
                    v-if="user.status === 'suspended'"
                    class="btn-icon"
                    @click="activateUser(user)"
                    title="Activer"
                  >
                    <font-awesome-icon icon="check" />
                  </button>
                  <button
                    v-if="user.status === 'pending_verification'"
                    class="btn-icon"
                    @click="verifyUser(user)"
                    title="Vérifier"
                  >
                    <font-awesome-icon icon="check-circle" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          Affichage de {{ paginationInfo.from }}-{{ paginationInfo.to }} sur
          {{ paginationInfo.total }} utilisateurs
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

    <!-- Modal d'ajout d'utilisateur -->
    <div class="modal" v-if="showAddUserModal">
      <div class="modal-backdrop" @click="showAddUserModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ajouter un utilisateur</h3>
          <button class="modal-close" @click="showAddUserModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addUser">
            <div class="form-group">
              <label for="user_name">Nom complet</label>
              <input
                type="text"
                id="user_name"
                v-model="newUser.name"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="user_email">Email</label>
              <input
                type="email"
                id="user_email"
                v-model="newUser.email"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="user_phone">Téléphone</label>
              <input
                type="tel"
                id="user_phone"
                v-model="newUser.phone"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="user_role">Rôle</label>
              <select id="user_role" v-model="newUser.role" class="form-control" required>
                <option value="client">Client</option>
                <option value="courier">Coursier</option>
                <option value="business">Entreprise</option>
                <option value="manager">Gestionnaire</option>
              </select>
            </div>

            <div class="form-group" v-if="newUser.role === 'business'">
              <label for="business_name">Nom de l'entreprise</label>
              <input
                type="text"
                id="business_name"
                v-model="newUser.business_name"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="user_password">Mot de passe</label>
              <div class="password-input">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="user_password"
                  v-model="newUser.password"
                  class="form-control"
                  required
                />
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                  <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="user_status">Statut</label>
              <select id="user_status" v-model="newUser.status" class="form-control" required>
                <option value="active">Actif</option>
                <option value="pending_verification">En attente de vérification</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showAddUserModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isAddingUser">
                <font-awesome-icon icon="spinner" spin v-if="isAddingUser" class="mr-1" />
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de détails d'utilisateur -->
    <div class="modal" v-if="showUserDetailsModal">
      <div class="modal-backdrop" @click="showUserDetailsModal = false"></div>
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>Détails de l'utilisateur</h3>
          <button class="modal-close" @click="showUserDetailsModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body" v-if="selectedUser">
          <div class="user-details">
            <div class="user-details-header">
              <div class="user-details-avatar">
                <img
                  v-if="selectedUser.profile_picture"
                  :src="selectedUser.profile_picture"
                  :alt="selectedUser.name"
                />
                <div v-else class="avatar-placeholder">{{ getInitials(selectedUser.name) }}</div>
              </div>
              <div class="user-details-info">
                <h2 class="user-details-name">{{ selectedUser.name }}</h2>
                <div class="user-details-meta">
                  <span class="role-badge" :class="getRoleClass(selectedUser.role)">
                    {{ getRoleLabel(selectedUser.role) }}
                  </span>
                  <span class="status-badge" :class="getStatusClass(selectedUser.status)">
                    {{ getStatusLabel(selectedUser.status) }}
                  </span>
                </div>
              </div>
              <div class="user-details-actions">
                <button class="btn btn-outline" @click="editUser(selectedUser)">
                  <font-awesome-icon icon="edit" class="mr-1" />
                  Modifier
                </button>
                <button
                  v-if="selectedUser.status === 'active'"
                  class="btn btn-danger"
                  @click="suspendUser(selectedUser)"
                >
                  <font-awesome-icon icon="ban" class="mr-1" />
                  Suspendre
                </button>
                <button
                  v-if="selectedUser.status === 'suspended'"
                  class="btn btn-success"
                  @click="activateUser(selectedUser)"
                >
                  <font-awesome-icon icon="check" class="mr-1" />
                  Activer
                </button>
                <button
                  v-if="selectedUser.status === 'pending_verification'"
                  class="btn btn-success"
                  @click="verifyUser(selectedUser)"
                >
                  <font-awesome-icon icon="check-circle" class="mr-1" />
                  Vérifier
                </button>
              </div>
            </div>

            <div class="user-details-tabs">
              <button
                v-for="tab in userDetailsTabs"
                :key="tab.id"
                class="tab-button"
                :class="{ active: activeUserDetailsTab === tab.id }"
                @click="activeUserDetailsTab = tab.id"
              >
                <font-awesome-icon :icon="tab.icon" class="tab-icon" />
                <span class="tab-label">{{ tab.label }}</span>
              </button>
            </div>

            <div class="user-details-content">
              <!-- Informations personnelles -->
              <div v-if="activeUserDetailsTab === 'personal'" class="user-details-section">
                <h3>Informations personnelles</h3>

                <div class="details-grid">
                  <div class="details-item">
                    <div class="details-label">ID</div>
                    <div class="details-value">#{{ selectedUser.id }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Nom complet</div>
                    <div class="details-value">{{ selectedUser.name }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Email</div>
                    <div class="details-value">{{ selectedUser.email }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Téléphone</div>
                    <div class="details-value">{{ selectedUser.phone }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Adresse</div>
                    <div class="details-value">{{ selectedUser.address || 'Non renseignée' }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Commune</div>
                    <div class="details-value">{{ selectedUser.commune || 'Non renseignée' }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Inscrit le</div>
                    <div class="details-value">{{ formatDate(selectedUser.created_at) }}</div>
                  </div>
                  <div class="details-item">
                    <div class="details-label">Dernière connexion</div>
                    <div class="details-value">{{ formatDate(selectedUser.last_login) }}</div>
                  </div>
                </div>

                <div v-if="selectedUser.role === 'business'" class="business-details">
                  <h4>Informations de l'entreprise</h4>

                  <div class="details-grid">
                    <div class="details-item">
                      <div class="details-label">Nom de l'entreprise</div>
                      <div class="details-value">{{ selectedUser.business_name }}</div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">SIRET/RCCM</div>
                      <div class="details-value">{{ selectedUser.siret || 'Non renseigné' }}</div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Type d'entreprise</div>
                      <div class="details-value">
                        {{ getBusinessTypeLabel(selectedUser.business_type) }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Adresse de l'entreprise</div>
                      <div class="details-value">
                        {{ selectedUser.business_address || 'Non renseignée' }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedUser.role === 'courier'" class="courier-details">
                  <h4>Informations du coursier</h4>

                  <div class="details-grid">
                    <div class="details-item">
                      <div class="details-label">Type de véhicule</div>
                      <div class="details-value">
                        {{ getVehicleTypeLabel(selectedUser.vehicle_type) }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Numéro d'immatriculation</div>
                      <div class="details-value">
                        {{ selectedUser.license_plate || 'Non renseigné' }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Numéro de permis</div>
                      <div class="details-value">
                        {{ selectedUser.driving_license || 'Non renseigné' }}
                      </div>
                    </div>
                    <div class="details-item">
                      <div class="details-label">Disponibilité</div>
                      <div class="details-value">
                        {{ selectedUser.is_available ? 'Disponible' : 'Indisponible' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Activité -->
              <div v-if="activeUserDetailsTab === 'activity'" class="user-details-section">
                <h3>Activité</h3>

                <div v-if="userActivity.length === 0" class="empty-state">
                  <font-awesome-icon icon="history" size="2x" />
                  <p>Aucune activité récente</p>
                </div>
                <div v-else class="activity-timeline">
                  <div v-for="activity in userActivity" :key="activity.id" class="activity-item">
                    <div class="activity-icon" :class="getActivityIconClass(activity.type)">
                      <font-awesome-icon :icon="getActivityIcon(activity.type)" />
                    </div>
                    <div class="activity-content">
                      <div class="activity-header">
                        <div class="activity-title">{{ activity.title }}</div>
                        <div class="activity-time">{{ formatDate(activity.timestamp) }}</div>
                      </div>
                      <div class="activity-description">{{ activity.description }}</div>
                      <div class="activity-meta" v-if="activity.meta">
                        <router-link
                          v-if="activity.meta.delivery_id"
                          :to="`/manager/deliveries/${activity.meta.delivery_id}`"
                        >
                          Livraison #{{ activity.meta.delivery_id }}
                        </router-link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Livraisons -->
              <div v-if="activeUserDetailsTab === 'deliveries'" class="user-details-section">
                <h3>Livraisons</h3>

                <div v-if="userDeliveries.length === 0" class="empty-state">
                  <font-awesome-icon icon="truck" size="2x" />
                  <p>Aucune livraison trouvée</p>
                </div>
                <div v-else class="deliveries-list">
                  <table class="deliveries-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Origine</th>
                        <th>Destination</th>
                        <th>Statut</th>
                        <th>Prix</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="delivery in userDeliveries" :key="delivery.id">
                        <td>#{{ delivery.id }}</td>
                        <td>{{ formatDate(delivery.created_at) }}</td>
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
                        <td>{{ formatPrice(delivery.price) }} FCFA</td>
                        <td>
                          <div class="table-actions">
                            <router-link
                              :to="`/manager/deliveries/${delivery.id}`"
                              class="btn-icon"
                              title="Voir les détails"
                            >
                              <font-awesome-icon icon="eye" />
                            </router-link>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Paiements -->
              <div v-if="activeUserDetailsTab === 'payments'" class="user-details-section">
                <h3>Paiements</h3>

                <div v-if="userPayments.length === 0" class="empty-state">
                  <font-awesome-icon icon="money-bill" size="2x" />
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
                      <tr v-for="payment in userPayments" :key="payment.id">
                        <td>#{{ payment.id }}</td>
                        <td>{{ formatDate(payment.date) }}</td>
                        <td>{{ payment.description }}</td>
                        <td>{{ formatPrice(payment.amount) }} FCFA</td>
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
              <div v-if="activeUserDetailsTab === 'kyc'" class="user-details-section">
                <h3>Vérification KYC</h3>

                <div v-if="!selectedUser.kyc" class="empty-state">
                  <font-awesome-icon icon="id-card" size="2x" />
                  <p>Aucun document KYC soumis</p>
                </div>
                <div v-else class="kyc-details">
                  <div class="kyc-status">
                    <div class="kyc-status-label">Statut de vérification :</div>
                    <span class="status-badge" :class="getKycStatusClass(selectedUser.kyc.status)">
                      {{ getKycStatusLabel(selectedUser.kyc.status) }}
                    </span>
                  </div>

                  <div class="kyc-documents">
                    <div v-if="selectedUser.role === 'courier'" class="kyc-document-section">
                      <h4>Documents du coursier</h4>

                      <div class="document-grid">
                        <div class="document-item">
                          <div class="document-header">
                            <div class="document-title">Pièce d'identité</div>
                            <div
                              class="document-status"
                              :class="selectedUser.kyc.id_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedUser.kyc.id_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedUser.kyc.id_document">
                            <img
                              v-if="isImageDocument(selectedUser.kyc.id_document)"
                              :src="selectedUser.kyc.id_document"
                              alt="Pièce d'identité"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" size="2x" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedUser.kyc.id_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedUser.kyc.id_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedUser.id, 'id')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedUser.kyc.id_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedUser.id, 'id')"
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
                              :class="selectedUser.kyc.license_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedUser.kyc.license_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedUser.kyc.license_document">
                            <img
                              v-if="isImageDocument(selectedUser.kyc.license_document)"
                              :src="selectedUser.kyc.license_document"
                              alt="Permis de conduire"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" size="2x" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedUser.kyc.license_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedUser.kyc.license_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedUser.id, 'license')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedUser.kyc.license_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedUser.id, 'license')"
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
                              :class="selectedUser.kyc.vehicle_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedUser.kyc.vehicle_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedUser.kyc.vehicle_document">
                            <img
                              v-if="isImageDocument(selectedUser.kyc.vehicle_document)"
                              :src="selectedUser.kyc.vehicle_document"
                              alt="Carte grise"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" size="2x" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedUser.kyc.vehicle_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedUser.kyc.vehicle_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedUser.id, 'vehicle')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedUser.kyc.vehicle_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedUser.id, 'vehicle')"
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

                    <div v-if="selectedUser.role === 'business'" class="kyc-document-section">
                      <h4>Documents de l'entreprise</h4>

                      <div class="document-grid">
                        <div class="document-item">
                          <div class="document-header">
                            <div class="document-title">SIRET/RCCM</div>
                            <div
                              class="document-status"
                              :class="selectedUser.kyc.siret_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedUser.kyc.siret_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedUser.kyc.siret_document">
                            <img
                              v-if="isImageDocument(selectedUser.kyc.siret_document)"
                              :src="selectedUser.kyc.siret_document"
                              alt="SIRET/RCCM"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" size="2x" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedUser.kyc.siret_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedUser.kyc.siret_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedUser.id, 'siret')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedUser.kyc.siret_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedUser.id, 'siret')"
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
                            <div class="document-title">Extrait KBIS</div>
                            <div
                              class="document-status"
                              :class="selectedUser.kyc.kbis_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedUser.kyc.kbis_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedUser.kyc.kbis_document">
                            <img
                              v-if="isImageDocument(selectedUser.kyc.kbis_document)"
                              :src="selectedUser.kyc.kbis_document"
                              alt="Extrait KBIS"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" size="2x" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedUser.kyc.kbis_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedUser.kyc.kbis_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedUser.id, 'kbis')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedUser.kyc.kbis_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedUser.id, 'kbis')"
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
                            <div class="document-title">Pièce d'identité du gérant</div>
                            <div
                              class="document-status"
                              :class="selectedUser.kyc.id_verified ? 'verified' : 'pending'"
                            >
                              {{ selectedUser.kyc.id_verified ? 'Vérifié' : 'En attente' }}
                            </div>
                          </div>
                          <div class="document-preview" v-if="selectedUser.kyc.id_document">
                            <img
                              v-if="isImageDocument(selectedUser.kyc.id_document)"
                              :src="selectedUser.kyc.id_document"
                              alt="Pièce d'identité du gérant"
                            />
                            <div v-else class="pdf-preview">
                              <font-awesome-icon icon="file-pdf" size="2x" />
                              <span>Document PDF</span>
                            </div>
                            <div class="document-actions">
                              <a
                                :href="selectedUser.kyc.id_document"
                                target="_blank"
                                class="btn-icon"
                                title="Voir"
                              >
                                <font-awesome-icon icon="eye" />
                              </a>
                              <button
                                v-if="!selectedUser.kyc.id_verified"
                                class="btn-icon"
                                @click="verifyDocument(selectedUser.id, 'id')"
                                title="Vérifier"
                              >
                                <font-awesome-icon icon="check" />
                              </button>
                              <button
                                v-if="!selectedUser.kyc.id_verified"
                                class="btn-icon"
                                @click="rejectDocument(selectedUser.id, 'id')"
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

                  <div class="kyc-actions" v-if="selectedUser.status === 'pending_verification'">
                    <button class="btn btn-success" @click="verifyUser(selectedUser)">
                      <font-awesome-icon icon="check-circle" class="mr-1" />
                      Approuver la vérification
                    </button>
                    <button class="btn btn-danger" @click="rejectVerification(selectedUser)">
                      <font-awesome-icon icon="times-circle" class="mr-1" />
                      Rejeter la vérification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'édition d'utilisateur -->
    <div class="modal" v-if="showEditUserModal">
      <div class="modal-backdrop" @click="showEditUserModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Modifier l'utilisateur</h3>
          <button class="modal-close" @click="showEditUserModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body" v-if="editingUser">
          <form @submit.prevent="updateUser">
            <div class="form-group">
              <label for="edit_user_name">Nom complet</label>
              <input
                type="text"
                id="edit_user_name"
                v-model="editingUser.name"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="edit_user_email">Email</label>
              <input
                type="email"
                id="edit_user_email"
                v-model="editingUser.email"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="edit_user_phone">Téléphone</label>
              <input
                type="tel"
                id="edit_user_phone"
                v-model="editingUser.phone"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="edit_user_status">Statut</label>
              <select
                id="edit_user_status"
                v-model="editingUser.status"
                class="form-control"
                required
              >
                <option value="active">Actif</option>
                <option value="pending_verification">En attente de vérification</option>
                <option value="suspended">Suspendu</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>

            <div class="form-group" v-if="editingUser.role === 'business'">
              <label for="edit_business_name">Nom de l'entreprise</label>
              <input
                type="text"
                id="edit_business_name"
                v-model="editingUser.business_name"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="edit_user_address">Adresse</label>
              <input
                type="text"
                id="edit_user_address"
                v-model="editingUser.address"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="edit_user_commune">Commune</label>
              <select id="edit_user_commune" v-model="editingUser.commune" class="form-control">
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showEditUserModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isUpdatingUser">
                <font-awesome-icon icon="spinner" spin v-if="isUpdatingUser" class="mr-1" />
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchUsers,
  addUser,
  updateUserStatus,
  updateUser as apiUpdateUser,
  fetchUserDetails,
  fetchUserActivity,
  fetchUserDeliveries,
  fetchUserPayments,
  verifyUserDocument,
  rejectUserDocument,
  verifyUserKyc,
  rejectUserKyc,
} from '@/api/manager'
import { formatDate, formatPrice, getInitials } from '@/utils/formatters'
import { COMMUNES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/config'

export default {
  name: 'UsersView',
  setup() {
    const router = useRouter()

    const loading = ref(true)
    const users = ref([])
    const currentPage = ref(1)
    const totalPages = ref(1)
    const pageSize = ref(DEFAULT_PAGE_SIZE)
    const sortColumn = ref('created_at')
    const sortDirection = ref('desc')
    const showAddUserModal = ref(false)
    const showUserDetailsModal = ref(false)
    const showEditUserModal = ref(false)
    const isAddingUser = ref(false)
    const isUpdatingUser = ref(false)
    const selectedUser = ref(null)
    const editingUser = ref(null)
    const userActivity = ref([])
    const userDeliveries = ref([])
    const userPayments = ref([])
    const activeUserDetailsTab = ref('personal')
    const showPassword = ref(false)

    const filters = reactive({
      role: '',
      status: '',
      search: '',
    })

    const newUser = reactive({
      name: '',
      email: '',
      phone: '',
      role: 'client',
      business_name: '',
      password: '',
      status: 'active',
    })

    const userDetailsTabs = [
      { id: 'personal', label: 'Informations', icon: 'user' },
      { id: 'activity', label: 'Activité', icon: 'history' },
      { id: 'deliveries', label: 'Livraisons', icon: 'truck' },
      { id: 'payments', label: 'Paiements', icon: 'money-bill' },
      { id: 'kyc', label: 'Vérification KYC', icon: 'id-card' },
    ]

    const paginationInfo = computed(() => {
      const from = users.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
      const to = Math.min(from + pageSize.value - 1, totalItems.value)

      return {
        from,
        to,
        total: totalItems.value,
      }
    })

    const totalItems = computed(() => {
      return currentPage.value < totalPages.value
        ? currentPage.value * pageSize.value + 1
        : (totalPages.value - 1) * pageSize.value + users.value.length
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

    // Charger les utilisateurs
    const loadUsers = async () => {
      try {
        loading.value = true

        // Préparer les paramètres de requête
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          sort: sortColumn.value,
          order: sortDirection.value,
          role: filters.role || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
        }

        const data = await fetchUsers(params)
        users.value = data.users
        totalPages.value = Math.ceil(data.total / pageSize.value)

        // Ajuster la page courante si elle dépasse le nombre total de pages
        if (currentPage.value > totalPages.value && totalPages.value > 0) {
          currentPage.value = totalPages.value
          await loadUsers()
        }
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        loading.value = false
      }
    }

    // Trier les utilisateurs
    const sortBy = column => {
      if (sortColumn.value === column) {
        // Inverser la direction de tri
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        // Changer la colonne de tri et réinitialiser la direction
        sortColumn.value = column
        sortDirection.value = 'asc'
      }

      // Recharger les utilisateurs
      loadUsers()
    }

    // Appliquer les filtres
    const applyFilters = () => {
      currentPage.value = 1
      loadUsers()
    }

    // Réinitialiser les filtres
    const resetFilters = () => {
      filters.role = ''
      filters.status = ''
      filters.search = ''

      currentPage.value = 1
      loadUsers()
    }

    // Changer de page
    const changePage = page => {
      if (page === '...') return

      currentPage.value = page
      loadUsers()
    }

    // Changer la taille de page
    const changePageSize = () => {
      currentPage.value = 1
      loadUsers()
    }

    // Rafraîchir les données
    const refreshData = () => {
      loadUsers()
    }

    // Voir les détails d'un utilisateur
    const viewUserDetails = async user => {
      try {
        // Charger les détails de l'utilisateur
        const details = await fetchUserDetails(user.id)
        selectedUser.value = details

        // Charger l'activité de l'utilisateur
        loadUserActivity(user.id)

        // Charger les livraisons de l'utilisateur
        loadUserDeliveries(user.id)

        // Charger les paiements de l'utilisateur
        loadUserPayments(user.id)

        // Afficher le modal
        showUserDetailsModal.value = true

        // Réinitialiser l'onglet actif
        activeUserDetailsTab.value = 'personal'
      } catch (error) {
        console.error('Error loading user details:', error)
        alert(`Erreur lors du chargement des détails de l'utilisateur: ${error.message}`)
      }
    }

    // Charger l'activité d'un utilisateur
    const loadUserActivity = async userId => {
      try {
        const activity = await fetchUserActivity(userId)
        userActivity.value = activity
      } catch (error) {
        console.error('Error loading user activity:', error)
        userActivity.value = []
      }
    }

    // Charger les livraisons d'un utilisateur
    const loadUserDeliveries = async userId => {
      try {
        const deliveries = await fetchUserDeliveries(userId)
        userDeliveries.value = deliveries
      } catch (error) {
        console.error('Error loading user deliveries:', error)
        userDeliveries.value = []
      }
    }

    // Charger les paiements d'un utilisateur
    const loadUserPayments = async userId => {
      try {
        const payments = await fetchUserPayments(userId)
        userPayments.value = payments
      } catch (error) {
        console.error('Error loading user payments:', error)
        userPayments.value = []
      }
    }

    // Modifier un utilisateur
    const editUser = user => {
      editingUser.value = { ...user }
      showEditUserModal.value = true
    }

    // Mettre à jour un utilisateur
    const updateUser = async () => {
      try {
        isUpdatingUser.value = true

        await apiUpdateUser(editingUser.value.id, editingUser.value)

        // Fermer le modal
        showEditUserModal.value = false

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === editingUser.value.id) {
          selectedUser.value = { ...selectedUser.value, ...editingUser.value }
        }

        // Recharger les utilisateurs
        loadUsers()

        // Afficher un message de succès
        alert('Utilisateur mis à jour avec succès')
      } catch (error) {
        console.error('Error updating user:', error)
        alert(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`)
      } finally {
        isUpdatingUser.value = false
      }
    }

    // Suspendre un utilisateur
    const suspendUser = async user => {
      if (!confirm(`Êtes-vous sûr de vouloir suspendre l'utilisateur ${user.name} ?`)) {
        return
      }

      try {
        await updateUserStatus(user.id, 'suspended')

        // Mettre à jour l'utilisateur dans la liste
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) {
          users.value[index].status = 'suspended'
        }

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === user.id) {
          selectedUser.value.status = 'suspended'
        }

        // Afficher un message de succès
        alert('Utilisateur suspendu avec succès')
      } catch (error) {
        console.error('Error suspending user:', error)
        alert(`Erreur lors de la suspension de l'utilisateur: ${error.message}`)
      }
    }

    // Activer un utilisateur
    const activateUser = async user => {
      try {
        await updateUserStatus(user.id, 'active')

        // Mettre à jour l'utilisateur dans la liste
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) {
          users.value[index].status = 'active'
        }

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === user.id) {
          selectedUser.value.status = 'active'
        }

        // Afficher un message de succès
        alert('Utilisateur activé avec succès')
      } catch (error) {
        console.error('Error activating user:', error)
        alert(`Erreur lors de l'activation de l'utilisateur: ${error.message}`)
      }
    }

    // Vérifier un utilisateur
    const verifyUser = async user => {
      try {
        await verifyUserKyc(user.id)

        // Mettre à jour l'utilisateur dans la liste
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) {
          users.value[index].status = 'active'
        }

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === user.id) {
          selectedUser.value.status = 'active'
          if (selectedUser.value.kyc) {
            selectedUser.value.kyc.status = 'verified'
          }
        }

        // Afficher un message de succès
        alert('Utilisateur vérifié avec succès')
      } catch (error) {
        console.error('Error verifying user:', error)
        alert(`Erreur lors de la vérification de l'utilisateur: ${error.message}`)
      }
    }

    // Rejeter la vérification d'un utilisateur
    const rejectVerification = async user => {
      if (
        !confirm(`Êtes-vous sûr de vouloir rejeter la vérification de l'utilisateur ${user.name} ?`)
      ) {
        return
      }

      try {
        await rejectUserKyc(user.id)

        // Mettre à jour l'utilisateur dans la liste
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) {
          users.value[index].status = 'inactive'
        }

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === user.id) {
          selectedUser.value.status = 'inactive'
          if (selectedUser.value.kyc) {
            selectedUser.value.kyc.status = 'rejected'
          }
        }

        // Afficher un message de succès
        alert('Vérification rejetée avec succès')
      } catch (error) {
        console.error('Error rejecting verification:', error)
        alert(`Erreur lors du rejet de la vérification: ${error.message}`)
      }
    }

    // Vérifier un document
    const verifyDocument = async (userId, documentType) => {
      try {
        await verifyUserDocument(userId, documentType)

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === userId && selectedUser.value.kyc) {
          selectedUser.value.kyc[`${documentType}_verified`] = true
        }

        // Afficher un message de succès
        alert('Document vérifié avec succès')
      } catch (error) {
        console.error('Error verifying document:', error)
        alert(`Erreur lors de la vérification du document: ${error.message}`)
      }
    }

    // Rejeter un document
    const rejectDocument = async (userId, documentType) => {
      if (!confirm('Êtes-vous sûr de vouloir rejeter ce document ?')) {
        return
      }

      try {
        await rejectUserDocument(userId, documentType)

        // Mettre à jour l'utilisateur sélectionné si nécessaire
        if (selectedUser.value && selectedUser.value.id === userId && selectedUser.value.kyc) {
          selectedUser.value.kyc[`${documentType}_verified`] = false
          selectedUser.value.kyc[`${documentType}_document`] = null
        }

        // Afficher un message de succès
        alert('Document rejeté avec succès')
      } catch (error) {
        console.error('Error rejecting document:', error)
        alert(`Erreur lors du rejet du document: ${error.message}`)
      }
    }

    // Vérifier si un document est une image
    const isImageDocument = url => {
      if (!url) return false

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext))
    }

    // Obtenir la classe CSS pour un rôle
    const getRoleClass = role => {
      const roleClasses = {
        client: 'role-client',
        courier: 'role-courier',
        business: 'role-business',
        manager: 'role-manager',
      }

      return roleClasses[role] || ''
    }

    // Obtenir le libellé pour un rôle
    const getRoleLabel = role => {
      const roleLabels = {
        client: 'Client',
        courier: 'Coursier',
        business: 'Entreprise',
        manager: 'Gestionnaire',
      }

      return roleLabels[role] || role
    }

    // Obtenir la classe CSS pour un statut
    const getStatusClass = status => {
      const statusClasses = {
        active: 'status-active',
        pending_verification: 'status-pending',
        suspended: 'status-suspended',
        inactive: 'status-inactive',
      }

      return statusClasses[status] || ''
    }

    // Obtenir le libellé pour un statut
    const getStatusLabel = status => {
      const statusLabels = {
        active: 'Actif',
        pending_verification: 'En attente de vérification',
        suspended: 'Suspendu',
        inactive: 'Inactif',
      }

      return statusLabels[status] || status
    }

    // Obtenir la classe CSS pour un statut de livraison
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

      return statusClasses[status] || ''
    }

    // Obtenir le libellé pour un statut de livraison
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

    // Obtenir l'icône pour une méthode de paiement
    const getPaymentMethodIcon = method => {
      const methodIcons = {
        cash: 'money-bill',
        orange_money: 'mobile-alt',
        mtn_money: 'mobile-alt',
        credit_card: 'credit-card',
        bank_transfer: 'university',
      }

      return methodIcons[method] || 'money-bill'
    }

    // Obtenir le libellé pour une méthode de paiement
    const getPaymentMethodLabel = method => {
      const methodLabels = {
        cash: 'Espèces',
        orange_money: 'Orange Money',
        mtn_money: 'MTN Money',
        credit_card: 'Carte bancaire',
        bank_transfer: 'Virement bancaire',
      }

      return methodLabels[method] || method
    }

    // Obtenir la classe CSS pour un statut de paiement
    const getPaymentStatusClass = status => {
      const statusClasses = {
        paid: 'status-paid',
        pending: 'status-pending',
        failed: 'status-failed',
      }

      return statusClasses[status] || ''
    }

    // Obtenir le libellé pour un statut de paiement
    const getPaymentStatusLabel = status => {
      const statusLabels = {
        paid: 'Payé',
        pending: 'En attente',
        failed: 'Échoué',
      }

      return statusLabels[status] || status
    }

    // Obtenir la classe CSS pour un statut KYC
    const getKycStatusClass = status => {
      const statusClasses = {
        verified: 'status-active',
        pending: 'status-pending',
        rejected: 'status-suspended',
      }

      return statusClasses[status] || ''
    }

    // Obtenir le libellé pour un statut KYC
    const getKycStatusLabel = status => {
      const statusLabels = {
        verified: 'Vérifié',
        pending: 'En attente',
        rejected: 'Rejeté',
      }

      return statusLabels[status] || status
    }

    // Obtenir le libellé pour un type d'entreprise
    const getBusinessTypeLabel = type => {
      const typeLabels = {
        restaurant: 'Restaurant',
        retail: 'Commerce de détail',
        grocery: 'Épicerie',
        pharmacy: 'Pharmacie',
        other: 'Autre',
      }

      return typeLabels[type] || type
    }

    // Obtenir le libellé pour un type de véhicule
    const getVehicleTypeLabel = type => {
      const typeLabels = {
        motorcycle: 'Moto',
        car: 'Voiture',
        bicycle: 'Vélo',
        truck: 'Camion',
        foot: 'À pied',
      }

      return typeLabels[type] || type
    }

    // Obtenir l'icône pour un type d'activité
    const getActivityIcon = type => {
      const activityIcons = {
        login: 'sign-in-alt',
        logout: 'sign-out-alt',
        delivery_created: 'plus',
        delivery_accepted: 'check',
        delivery_picked_up: 'truck-loading',
        delivery_in_transit: 'truck',
        delivery_delivered: 'check-circle',
        delivery_cancelled: 'times-circle',
        payment_made: 'money-bill',
        payment_received: 'money-bill',
        profile_updated: 'user-edit',
        document_uploaded: 'file-upload',
        verification_approved: 'check-circle',
        verification_rejected: 'times-circle',
        rating_given: 'star',
        rating_received: 'star',
        complaint_filed: 'exclamation-circle',
        complaint_resolved: 'check-circle',
      }

      return activityIcons[type] || 'history'
    }

    // Obtenir la classe CSS pour un type d'activité
    const getActivityIconClass = type => {
      const activityClasses = {
        login: 'activity-login',
        logout: 'activity-logout',
        delivery_created: 'activity-created',
        delivery_accepted: 'activity-accepted',
        delivery_picked_up: 'activity-picked-up',
        delivery_in_transit: 'activity-in-transit',
        delivery_delivered: 'activity-delivered',
        delivery_cancelled: 'activity-cancelled',
        payment_made: 'activity-payment-made',
        payment_received: 'activity-payment-received',
        profile_updated: 'activity-profile',
        document_uploaded: 'activity-document',
        verification_approved: 'activity-approved',
        verification_rejected: 'activity-rejected',
        rating_given: 'activity-rating',
        rating_received: 'activity-rating',
        complaint_filed: 'activity-complaint',
        complaint_resolved: 'activity-resolved',
      }

      return activityClasses[type] || 'activity-default'
    }

    // Surveiller les changements de filtres pour mettre à jour l'URL
    watch(
      [
        filters.role,
        filters.status,
        filters.search,
        sortColumn,
        sortDirection,
        currentPage,
        pageSize,
      ],
      () => {
        const query = {
          role: filters.role || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
          sort: sortColumn.value,
          order: sortDirection.value,
          page: currentPage.value,
          limit: pageSize.value,
        }

        // Mettre à jour l'URL sans recharger la page
        router.replace({ query })
      }
    )

    onMounted(() => {
      // Récupérer les paramètres de l'URL
      const query = router.currentRoute.value.query

      if (query.role) filters.role = query.role
      if (query.status) filters.status = query.status
      if (query.search) filters.search = query.search
      if (query.sort) sortColumn.value = query.sort
      if (query.order) sortDirection.value = query.order
      if (query.page) currentPage.value = parseInt(query.page)
      if (query.limit) pageSize.value = parseInt(query.limit)

      loadUsers()
    })

    return {
      loading,
      users,
      currentPage,
      totalPages,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
      newUser,
      showAddUserModal,
      showUserDetailsModal,
      showEditUserModal,
      isAddingUser,
      isUpdatingUser,
      selectedUser,
      editingUser,
      userActivity,
      userDeliveries,
      userPayments,
      activeUserDetailsTab,
      userDetailsTabs,
      showPassword,
      paginationInfo,
      displayedPages,
      communes: COMMUNES,
      PAGE_SIZE_OPTIONS,
      loadUsers,
      sortBy,
      applyFilters,
      resetFilters,
      changePage,
      changePageSize,
      refreshData,

      viewUserDetails,
      editUser,
      updateUser,
      suspendUser,
      activateUser,
      verifyUser,
      rejectVerification,
      verifyDocument,
      rejectDocument,
      isImageDocument,
      getRoleClass,
      getRoleLabel,
      getStatusClass,
      getStatusLabel,
      getDeliveryStatusClass,
      getDeliveryStatusLabel,
      getPaymentMethodIcon,
      getPaymentMethodLabel,
      getPaymentStatusClass,
      getPaymentStatusLabel,
      getKycStatusClass,
      getKycStatusLabel,
      getBusinessTypeLabel,
      getVehicleTypeLabel,
      getActivityIcon,
      getActivityIconClass,
      formatDate,
      formatPrice,
      getInitials,
    }
  },
}
</script>

<style scoped>
.users-view {
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

.search-clear {
  position: absolute;
  right: 1rem;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.loading-state svg {
  margin-bottom: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 1rem;
}

.users-table-container {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.users-table th {
  font-weight: 600;
  color: var(--text-color);
  background-color: var(--background-secondary);
}

.users-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.users-table th.sortable:hover {
  background-color: var(--border-color);
}

.users-table td {
  color: var(--text-color);
}

.user-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
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
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background-color: var(--primary-color);
}

.role-badge,
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-client {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-courier {
  background-color: #e8f5e9;
  color: #388e3c;
}

.role-business {
  background-color: #fff8e1;
  color: #ffa000;
}

.role-manager {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-pending {
  background-color: #fff8e1;
  color: #ffa000;
}

.status-suspended {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-inactive {
  background-color: #eceff1;
  color: #607d8b;
}

.status-accepted {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-picked-up {
  background-color: #e0f7fa;
  color: #00acc1;
}

.status-in-transit {
  background-color: #e0f2f1;
  color: #00897b;
}

.status-delivered {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-failed {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-paid {
  background-color: #e8f5e9;
  color: #388e3c;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
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

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-details-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.user-details-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--background-secondary);
  flex-shrink: 0;
}

.user-details-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details-info {
  flex: 1;
}

.user-details-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}

.user-details-meta {
  display: flex;
  gap: 0.5rem;
}

.user-details-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-details-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-color);
}

.tab-button:hover {
  background-color: var(--background-secondary);
}

.tab-button.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.tab-icon {
  margin-right: 0.75rem;
  width: 16px;
}

.user-details-content {
  padding-top: 1.5rem;
}

.user-details-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.user-details-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
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
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.details-value {
  font-weight: 500;
  color: var(--text-color);
}

.business-details,
.courier-details {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.activity-login {
  background-color: #1976d2;
}

.activity-logout {
  background-color: #607d8b;
}

.activity-created {
  background-color: #7b1fa2;
}

.activity-accepted {
  background-color: #00acc1;
}

.activity-picked-up {
  background-color: #00897b;
}

.activity-in-transit {
  background-color: #ffa000;
}

.activity-delivered {
  background-color: #388e3c;
}

.activity-cancelled {
  background-color: #d32f2f;
}

.activity-payment-made {
  background-color: #f44336;
}

.activity-payment-received {
  background-color: #4caf50;
}

.activity-profile {
  background-color: #9c27b0;
}

.activity-document {
  background-color: #ff5722;
}

.activity-approved {
  background-color: #4caf50;
}

.activity-rejected {
  background-color: #f44336;
}

.activity-rating {
  background-color: #ffc107;
}

.activity-complaint {
  background-color: #f44336;
}

.activity-resolved {
  background-color: #4caf50;
}

.activity-default {
  background-color: #9e9e9e;
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.activity-title {
  font-weight: 500;
  color: var(--text-color);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.activity-description {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.activity-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
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
  border-bottom: 1px solid var(--border-color);
}

.deliveries-table th,
.payments-table th {
  font-weight: 600;
  color: var(--text-color);
  background-color: var(--background-secondary);
}

.payment-method {
  display: flex;
  align-items: center;
}

.kyc-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.kyc-status-label {
  font-weight: 500;
  color: var(--text-color);
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
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--background-secondary);
  border-bottom: 1px solid var(--border-color);
}

.document-title {
  font-weight: 500;
  color: var(--text-color);
}

.document-status {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.document-status.verified {
  color: #388e3c;
}

.document-status.pending {
  color: #ffa000;
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
  color: var(--text-secondary);
}

.pdf-preview svg {
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
  color: var(--text-secondary);
  font-style: italic;
}

.kyc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-success {
  background-color: #4caf50;
  color: white;
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

  .user-details-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .user-details-actions {
    width: 100%;
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

  .users-table {
    display: block;
    overflow-x: auto;
  }

  .user-details-tabs {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: 1;
    min-width: 120px;
    padding: 0.75rem 1rem;
  }

  .tab-icon {
    margin-right: 0.5rem;
  }

  .document-grid {
    grid-template-columns: 1fr;
  }
}
</style>
