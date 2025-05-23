<template>
  <div class="donations-view">
    <div class="page-header">
      <h1 class="page-title">Gestion des Dons</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="exportData">
          <i class="fas fa-file-export mr-2"></i>
          Exporter
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus mr-2"></i>
          Nouveau don
        </button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-hand-holding-heart"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.totalDonations) }}</div>
          <div class="stat-label">Total des dons</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-building"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.organizationsCount }}</div>
          <div class="stat-label">Organisations</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-bolt"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.expressDeliveriesCount }}</div>
          <div class="stat-label">Livraisons express</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.averageDonationPercentage }}%</div>
          <div class="stat-label">Pourcentage moyen</div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'donations' }"
        @click="activeTab = 'donations'"
      >
        <i class="fas fa-hand-holding-heart mr-2"></i>
        Dons
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'organizations' }"
        @click="activeTab = 'organizations'"
      >
        <i class="fas fa-building mr-2"></i>
        Organisations
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'analytics' }"
        @click="activeTab = 'analytics'"
      >
        <i class="fas fa-chart-pie mr-2"></i>
        Analyses
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <i class="fas fa-cog mr-2"></i>
        Paramètres
      </button>
    </div>

    <div class="tab-content">
      <!-- Onglet Dons -->
      <div v-if="activeTab === 'donations'" class="donations-tab">
        <div class="filter-section">
          <div class="filter-row">
            <div class="filter-group">
              <label for="organization-filter">Organisation</label>
              <select id="organization-filter" v-model="filters.organization" @change="loadDonations">
                <option value="">Toutes les organisations</option>
                <option 
                  v-for="org in organizations" 
                  :key="org.id" 
                  :value="org.id"
                >
                  {{ org.name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label for="status-filter">Statut</label>
              <select id="status-filter" v-model="filters.status" @change="loadDonations">
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="completed">Complété</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="date-range">Période</label>
              <select id="date-range" v-model="filters.dateRange" @change="handleDateRangeChange">
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="last_week">7 derniers jours</option>
                <option value="last_month">30 derniers jours</option>
                <option value="custom">Personnalisée</option>
              </select>
            </div>
            <div class="filter-group" v-if="filters.dateRange === 'custom'">
              <label for="start-date">Date de début</label>
              <input type="date" id="start-date" v-model="filters.startDate" @change="loadDonations" />
            </div>
            <div class="filter-group" v-if="filters.dateRange === 'custom'">
              <label for="end-date">Date de fin</label>
              <input type="date" id="end-date" v-model="filters.endDate" @change="loadDonations" />
            </div>
            <div class="filter-group search-group">
              <label for="search">Recherche</label>
              <div class="search-input">
                <input 
                  type="text" 
                  id="search" 
                  v-model="filters.search" 
                  placeholder="ID, livraison, organisation..." 
                  @input="debounceSearch"
                />
                <i class="fas fa-search"></i>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Chargement des dons...</p>
        </div>
        <div v-else-if="donations.length === 0" class="empty-state">
          <i class="fas fa-hand-holding-heart fa-2x"></i>
          <p>Aucun don trouvé</p>
          <button class="btn btn-primary" @click="openCreateModal">
            Créer un don
          </button>
        </div>
        <div v-else class="donations-table-container">
          <table class="donations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Organisation</th>
                <th>Livraison</th>
                <th>Donateur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="donation in donations" :key="donation.id">
                <td>#{{ donation.id }}</td>
                <td>{{ formatDate(donation.created_at) }}</td>
                <td>{{ formatCurrency(donation.amount) }}</td>
                <td>{{ donation.organization.name }}</td>
                <td>
                  <a 
                    v-if="donation.delivery_id" 
                    href="#" 
                    @click.prevent="viewDelivery(donation.delivery_id)"
                  >
                    #{{ donation.delivery_id }}
                  </a>
                  <span v-else>-</span>
                </td>
                <td>{{ donation.donor ? donation.donor.name : 'Anonyme' }}</td>
                <td>
                  <span :class="getStatusClass(donation.status)">
                    {{ getStatusLabel(donation.status) }}
                  </span>
                </td>
                <td>
                  <div class="table-actions">
                    <button 
                      class="btn-icon" 
                      @click="viewDonationDetails(donation.id)" 
                      title="Voir les détails"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      @click="editDonation(donation.id)" 
                      title="Modifier"
                      v-if="donation.status === 'pending'"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      @click="completeDonation(donation.id)" 
                      title="Marquer comme complété"
                      v-if="donation.status === 'pending'"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      @click="cancelDonation(donation.id)" 
                      title="Annuler"
                      v-if="donation.status === 'pending'"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="donations.length > 0 && totalPages > 1">
          <button 
            class="pagination-button" 
            :disabled="currentPage === 1" 
            @click="changePage(currentPage - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="pagination-info">Page {{ currentPage }} sur {{ totalPages }}</span>
          <button 
            class="pagination-button" 
            :disabled="currentPage === totalPages" 
            @click="changePage(currentPage + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Onglet Organisations -->
      <div v-if="activeTab === 'organizations'" class="organizations-tab">
        <div class="organizations-header">
          <div class="search-input">
            <input 
              type="text" 
              v-model="organizationSearch" 
              placeholder="Rechercher une organisation..." 
              @input="debounceOrganizationSearch"
            />
            <i class="fas fa-search"></i>
          </div>
          <button class="btn btn-primary" @click="openCreateOrganizationModal">
            <i class="fas fa-plus mr-2"></i>
            Nouvelle organisation
          </button>
        </div>

        <div v-if="loadingOrganizations" class="loading-state">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Chargement des organisations...</p>
        </div>
        <div v-else-if="organizations.length === 0" class="empty-state">
          <i class="fas fa-building fa-2x"></i>
          <p>Aucune organisation trouvée</p>
          <button class="btn btn-primary" @click="openCreateOrganizationModal">
            Créer une organisation
          </button>
        </div>
        <div v-else class="organizations-grid">
          <div 
            v-for="org in organizations" 
            :key="org.id" 
            class="organization-card"
          >
            <div class="organization-header">
              <div class="organization-logo">
                <img v-if="org.logo" :src="org.logo" :alt="org.name" />
                <div v-else class="logo-placeholder">
                  {{ getInitials(org.name) }}
                </div>
              </div>
              <div class="organization-actions">
                <button 
                  class="btn-icon" 
                  @click="editOrganization(org.id)" 
                  title="Modifier"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="btn-icon" 
                  @click="deleteOrganization(org.id)" 
                  title="Supprimer"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="organization-content">
              <h3 class="organization-name">{{ org.name }}</h3>
              <div class="organization-category">
                <span class="category-badge">{{ org.category }}</span>
              </div>
              <p class="organization-description">{{ org.description }}</p>
            </div>
            <div class="organization-footer">
              <div class="organization-stats">
                <div class="stat">
                  <span class="stat-value">{{ org.donations_count }}</span>
                  <span class="stat-label">Dons</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ formatCurrency(org.total_amount) }}</span>
                  <span class="stat-label">Total</span>
                </div>
              </div>
              <button 
                class="btn btn-sm btn-outline" 
                @click="viewOrganizationDetails(org.id)"
              >
                Voir détails
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Analyses -->
      <div v-if="activeTab === 'analytics'" class="analytics-tab">
        <div class="analytics-filters">
          <div class="filter-group">
            <label for="analytics-period">Période</label>
            <select id="analytics-period" v-model="analyticsFilters.period" @change="loadAnalytics">
              <option value="last_week">7 derniers jours</option>
              <option value="last_month">30 derniers jours</option>
              <option value="last_quarter">3 derniers mois</option>
              <option value="last_year">12 derniers mois</option>
              <option value="all_time">Tout le temps</option>
            </select>
          </div>
        </div>

        <div class="analytics-grid">
          <div class="analytics-card">
            <h3 class="analytics-title">Dons par organisation</h3>
            <div class="chart-container">
              <canvas ref="organizationsChart"></canvas>
            </div>
          </div>
          <div class="analytics-card">
            <h3 class="analytics-title">Évolution des dons</h3>
            <div class="chart-container">
              <canvas ref="donationsTimeChart"></canvas>
            </div>
          </div>
          <div class="analytics-card">
            <h3 class="analytics-title">Répartition par catégorie</h3>
            <div class="chart-container">
              <canvas ref="categoriesChart"></canvas>
            </div>
          </div>
          <div class="analytics-card">
            <h3 class="analytics-title">Top 5 des organisations</h3>
            <div class="top-organizations">
              <div 
                v-for="(org, index) in topOrganizations" 
                :key="org.id" 
                class="top-organization-item"
              >
                <div class="top-organization-rank">{{ index + 1 }}</div>
                <div class="top-organization-logo">
                  <img v-if="org.logo" :src="org.logo" :alt="org.name" />
                  <div v-else class="logo-placeholder small">
                    {{ getInitials(org.name) }}
                  </div>
                </div>
                <div class="top-organization-info">
                  <div class="top-organization-name">{{ org.name }}</div>
                  <div class="top-organization-category">{{ org.category }}</div>
                </div>
                <div class="top-organization-amount">
                  {{ formatCurrency(org.total_amount) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-summary">
          <div class="summary-card">
            <h3 class="summary-title">Résumé des dons</h3>
            <div class="summary-content">
              <div class="summary-item">
                <div class="summary-label">Total des dons</div>
                <div class="summary-value">{{ formatCurrency(analytics.totalAmount) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Nombre de dons</div>
                <div class="summary-value">{{ analytics.donationsCount }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Don moyen</div>
                <div class="summary-value">{{ formatCurrency(analytics.averageDonation) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Pourcentage moyen</div>
                <div class="summary-value">{{ analytics.averagePercentage }}%</div>
              </div>
            </div>
          </div>
          <div class="summary-card">
            <h3 class="summary-title">Impact estimé</h3>
            <div class="summary-content">
              <div class="summary-item">
                <div class="summary-label">Éducation</div>
                <div class="summary-value">{{ formatCurrency(analytics.impactEducation) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Santé</div>
                <div class="summary-value">{{ formatCurrency(analytics.impactHealth) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Environnement</div>
                <div class="summary-value">{{ formatCurrency(analytics.impactEnvironment) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Autres</div>
                <div class="summary-value">{{ formatCurrency(analytics.impactOther) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="analytics-actions">
          <button class="btn btn-primary" @click="exportAnalytics">
            <i class="fas fa-file-export mr-2"></i>
            Exporter les analyses
          </button>
          <button class="btn btn-outline" @click="generateReport">
            <i class="fas fa-file-pdf mr-2"></i>
            Générer un rapport
          </button>
        </div>
      </div>

      <!-- Onglet Paramètres -->
      <div v-if="activeTab === 'settings'" class="settings-tab">
        <div class="settings-card">
          <h3 class="settings-title">Paramètres des dons</h3>
          <div class="settings-content">
            <div class="form-group">
              <label for="default-percentage">Pourcentage de don par défaut</label>
              <div class="input-group">
                <input 
                  type="number" 
                  id="default-percentage" 
                  v-model.number="settings.defaultPercentage" 
                  min="0"
                  max="100"
                  step="5"
                />
                <div class="input-group-append">
                  <span class="input-group-text">%</span>
                </div>
              </div>
              <div class="form-hint">
                Pourcentage du supplément express reversé à des œuvres caritatives par défaut
              </div>
            </div>
            
            <div class="form-group">
              <label for="donation-options">Options de pourcentage de don</label>
              <div class="donation-options">
                <div 
                  v-for="(option, index) in settings.donationOptions" 
                  :key="index" 
                  class="donation-option"
                >
                  <div class="input-group">
                    <input 
                      type="number" 
                      v-model.number="settings.donationOptions[index]" 
                      min="0"
                      max="100"
                      step="5"
                    />
                    <div class="input-group-append">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                  <button 
                    v-if="settings.donationOptions.length > 1" 
                    class="btn-icon" 
                    @click="removeDonationOption(index)"
                    title="Supprimer"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <button class="btn btn-sm btn-outline" @click="addDonationOption">
                  <i class="fas fa-plus mr-1"></i>
                  Ajouter une option
                </button>
              </div>
              <div class="form-hint">
                Options de pourcentage de don proposées aux clients
              </div>
            </div>
            
            <div class="form-group">
              <label class="toggle-label">
                <span>Afficher les dons sur les factures</span>
                <div class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.showDonationsOnInvoices"
                  />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>
            
            <div class="form-group">
              <label class="toggle-label">
                <span>Permettre les dons anonymes</span>
                <div class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.allowAnonymousDonations"
                  />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-card">
          <h3 class="settings-title">Notifications</h3>
          <div class="settings-content">
            <div class="form-group">
              <label class="toggle-label">
                <span>Notifications par e-mail pour les nouveaux dons</span>
                <div class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.emailNotifications"
                  />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>
            
            <div class="form-group">
              <label for="notification-emails">E-mails de notification</label>
              <input 
                type="text" 
                id="notification-emails" 
                v-model="settings.notificationEmails" 
                placeholder="email1@example.com, email2@example.com"
              />
              <div class="form-hint">
                Séparez les adresses e-mail par des virgules
              </div>
            </div>
            
            <div class="form-group">
              <label class="toggle-label">
                <span>Envoyer des reçus aux donateurs</span>
                <div class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.sendReceipts"
                  />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-card">
          <h3 class="settings-title">Rapports</h3>
          <div class="settings-content">
            <div class="form-group">
              <label class="toggle-label">
                <span>Générer des rapports mensuels</span>
                <div class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="settings.generateMonthlyReports"
                  />
                  <span class="toggle-slider"></span>
                </div>
              </label>
            </div>
            
            <div class="form-group">
              <label for="report-recipients">Destinataires des rapports</label>
              <input 
                type="text" 
                id="report-recipients" 
                v-model="settings.reportRecipients" 
                placeholder="email1@example.com, email2@example.com"
              />
              <div class="form-hint">
                Séparez les adresses e-mail par des virgules
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="btn btn-secondary" @click="resetSettings">
            <i class="fas fa-undo mr-2"></i>
            Réinitialiser
          </button>
          <button class="btn btn-primary" @click="saveSettings">
            <i class="fas fa-save mr-2"></i>
            Enregistrer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails d'un don -->
    <Modal v-if="showDonationModal" @close="showDonationModal = false" title="Détails du don">
      <div v-if="selectedDonation" class="donation-details">
        <div class="detail-section">
          <h3>Informations générales</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID</span>
              <span class="detail-value">#{{ selectedDonation.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date</span>
              <span class="detail-value">{{ formatDateTime(selectedDonation.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Montant</span>
              <span class="detail-value">{{ formatCurrency(selectedDonation.amount) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut</span>
              <span class="detail-value" :class="getStatusClass(selectedDonation.status)">
                {{ getStatusLabel(selectedDonation.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Organisation</h3>
          <div class="organization-detail">
            <div class="organization-logo">
              <img v-if="selectedDonation.organization.logo" :src="selectedDonation.organization.logo" :alt="selectedDonation.organization.name" />
              <div v-else class="logo-placeholder">
                {{ getInitials(selectedDonation.organization.name) }}
              </div>
            </div>
            <div class="organization-info">
              <div class="organization-name">{{ selectedDonation.organization.name }}</div>
              <div class="organization-category">{{ selectedDonation.organization.category }}</div>
              <div class="organization-description">{{ selectedDonation.organization.description }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="selectedDonation.delivery_id">
          <h3>Livraison associée</h3>
          <div class="delivery-detail">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">ID de livraison</span>
                <span class="detail-value">#{{ selectedDonation.delivery_id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">Express</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Pourcentage du don</span>
                <span class="detail-value">{{ selectedDonation.percentage }}%</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Client</span>
                <span class="detail-value">{{ selectedDonation.delivery.client ? selectedDonation.delivery.client.name : 'N/A' }}</span>
              </div>
            </div>
            <button class="btn btn-outline mt-3" @click="viewDelivery(selectedDonation.delivery_id)">
              <i class="fas fa-eye mr-2"></i>
              Voir la livraison
            </button>
          </div>
        </div>

        <div class="detail-section" v-if="selectedDonation.donor">
          <h3>Donateur</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Nom</span>
              <span class="detail-value">{{ selectedDonation.donor.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ selectedDonation.donor.email }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Téléphone</span>
              <span class="detail-value">{{ selectedDonation.donor.phone }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value">{{ selectedDonation.donor.type === 'individual' ? 'Particulier' : 'Entreprise' }}</span>
            </div>
          </div>
        </div>
        <div class="detail-section" v-else>
          <h3>Donateur</h3>
          <div class="anonymous-donor">
            <i class="fas fa-user-secret mr-2"></i>
            Don anonyme
          </div>
        </div>

        <div class="detail-section" v-if="selectedDonation.notes">
          <h3>Notes</h3>
          <div class="donation-notes">
            {{ selectedDonation.notes }}
          </div>
        </div>

        <div class="modal-actions">
          <button 
            class="btn btn-success" 
            @click="completeDonation(selectedDonation.id)"
            v-if="selectedDonation.status === 'pending'"
          >
            <i class="fas fa-check mr-2"></i>
            Marquer comme complété
          </button>
          <button 
            class="btn btn-danger" 
            @click="cancelDonation(selectedDonation.id)"
            v-if="selectedDonation.status === 'pending'"
          >
            <i class="fas fa-times mr-2"></i>
            Annuler
          </button>
          <button class="btn btn-secondary" @click="showDonationModal = false">Fermer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour créer/modifier un don -->
    <Modal 
      v-if="showCreateDonationModal" 
      @close="showCreateDonationModal = false" 
      :title="editingDonation ? 'Modifier le don' : 'Nouveau don'"
    >
      <div class="donation-form">
        <div class="form-group">
          <label for="donation-amount">Montant (FCFA) <span class="required">*</span></label>
          <input 
            type="number" 
            id="donation-amount" 
            v-model.number="newDonation.amount" 
            min="0"
            step="100"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="donation-organization">Organisation <span class="required">*</span></label>
          <select id="donation-organization" v-model="newDonation.organizationId" required>
            <option value="">Sélectionner une organisation</option>
            <option 
              v-for="org in organizations" 
              :key="org.id" 
              :value="org.id"
            >
              {{ org.name }} ({{ org.category }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="donation-delivery">Livraison associée</label>
          <select id="donation-delivery" v-model="newDonation.deliveryId">
            <option value="">Aucune livraison</option>
            <option 
              v-for="delivery in expressDeliveries" 
              :key="delivery.id" 
              :value="delivery.id"
            >
              #{{ delivery.id }} - {{ formatDate(delivery.created_at) }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="donation-percentage" v-if="newDonation.deliveryId">Pourcentage du supplément</label>
          <div class="input-group" v-if="newDonation.deliveryId">
            <input 
              type="number" 
              id="donation-percentage" 
              v-model.number="newDonation.percentage" 
              min="0"
              max="100"
              step="5"
            />
            <div class="input-group-append">
              <span class="input-group-text">%</span>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="newDonation.isAnonymous" />
            <span>Don anonyme</span>
          </label>
        </div>
        
        <div v-if="!newDonation.isAnonymous">
          <div class="form-group">
            <label for="donor-type">Type de donateur</label>
            <select id="donor-type" v-model="newDonation.donorType">
              <option value="individual">Particulier</option>
              <option value="company">Entreprise</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="donor-name">Nom du donateur <span class="required">*</span></label>
            <input 
              type="text" 
              id="donor-name" 
              v-model="newDonation.donorName" 
              :required="!newDonation.isAnonymous"
            />
          </div>
          
          <div class="form-group">
            <label for="donor-email">Email du donateur</label>
            <input 
              type="email" 
              id="donor-email" 
              v-model="newDonation.donorEmail" 
            />
          </div>
          
          <div class="form-group">
            <label for="donor-phone">Téléphone du donateur</label>
            <input 
              type="tel" 
              id="donor-phone" 
              v-model="newDonation.donorPhone" 
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="donation-notes">Notes</label>
          <textarea 
            id="donation-notes" 
            v-model="newDonation.notes" 
            rows="3"
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateDonationModal = false">Annuler</button>
          <button 
            class="btn btn-primary" 
            @click="saveDonation"
            :disabled="!isValidDonation"
          >
            {{ editingDonation ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour créer/modifier une organisation -->
    <Modal 
      v-if="showOrganizationModal" 
      @close="showOrganizationModal = false" 
      :title="editingOrganization ? 'Modifier l\'organisation' : 'Nouvelle organisation'"
    >
      <div class="organization-form">
        <div class="form-group">
          <label for="organization-name">Nom <span class="required">*</span></label>
          <input 
            type="text" 
            id="organization-name" 
            v-model="newOrganization.name" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="organization-category">Catégorie <span class="required">*</span></label>
          <select id="organization-category" v-model="newOrganization.category" required>
            <option value="">Sélectionner une catégorie</option>
            <option value="Éducation">Éducation</option>
            <option value="Santé">Santé</option>
            <option value="Environnement">Environnement</option>
            <option value="Enfance">Enfance</option>
            <option value="Personnes âgées">Personnes âgées</option>
            <option value="Handicap">Handicap</option>
            <option value="Pauvreté">Pauvreté</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="organization-description">Description <span class="required">*</span></label>
          <textarea 
            id="organization-description" 
            v-model="newOrganization.description" 
            rows="3"
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="organization-website">Site web</label>
          <input 
            type="url" 
            id="organization-website" 
            v-model="newOrganization.website" 
            placeholder="https://example.com"
          />
        </div>
        
        <div class="form-group">
          <label for="organization-email">Email de contact</label>
          <input 
            type="email" 
            id="organization-email" 
            v-model="newOrganization.email" 
          />
        </div>
        
        <div class="form-group">
          <label for="organization-phone">Téléphone</label>
          <input 
            type="tel" 
            id="organization-phone" 
            v-model="newOrganization.phone" 
          />
        </div>
        
        <div class="form-group">
          <label for="organization-address">Adresse</label>
          <textarea 
            id="organization-address" 
            v-model="newOrganization.address" 
            rows="2"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="organization-logo">Logo</label>
          <div class="file-input">
            <input 
              type="file" 
              id="organization-logo" 
              @change="handleLogoUpload" 
              accept="image/*"
            />
            <div class="file-preview" v-if="newOrganization.logo">
              <img :src="newOrganization.logo" alt="Logo preview" />
              <button class="btn-icon" @click="removeLogo" title="Supprimer">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showOrganizationModal = false">Annuler</button>
          <button 
            class="btn btn-primary" 
            @click="saveOrganization"
            :disabled="!isValidOrganization"
          >
            {{ editingOrganization ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal de confirmation pour la suppression -->
    <Modal 
      v-if="showDeleteModal" 
      @close="showDeleteModal = false" 
      title="Confirmation de suppression"
    >
      <div class="delete-confirmation">
        <div class="confirmation-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="confirmation-message">
          <p>Êtes-vous sûr de vouloir supprimer cette organisation ?</p>
          <p class="warning">Cette action est irréversible et supprimera également toutes les données associées.</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmDelete">
            <i class="fas fa-trash mr-2"></i>
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import Modal from '@/components/ui/Modal.vue';
import { useToast } from '@/composables/useToast';
import { useRouter } from 'vue-router';

export default {
  name: 'DonationsView',
  components: {
    Modal
  },
  setup() {
    const { showToast } = useToast();
    const router = useRouter();
    
    // État des onglets
    const activeTab = ref('donations');
    
    // État des données
    const donations = ref([]);
    const organizations = ref([]);
    const expressDeliveries = ref([]);
    const loading = ref(true);
    const loadingOrganizations = ref(true);
    
    // État des statistiques
    const stats = ref({
      totalDonations: 0,
      organizationsCount: 0,
      expressDeliveriesCount: 0,
      averageDonationPercentage: 0
    });
    
    // État des analyses
    const analytics = ref({
      totalAmount: 0,
      donationsCount: 0,
      averageDonation: 0,
      averagePercentage: 0,
      impactEducation: 0,
      impactHealth: 0,
      impactEnvironment: 0,
      impactOther: 0
    });
    
    // Top organisations
    const topOrganizations = ref([]);
    
    // État de la pagination
    const currentPage = ref(1);
    const totalItems = ref(0);
    const itemsPerPage = ref(10);
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
    
    // État des filtres
    const filters = ref({
      organization: '',
      status: '',
      dateRange: 'all',
      startDate: null,
      endDate: null,
      search: ''
    });
    
    // État des filtres d'analyse
    const analyticsFilters = ref({
      period: 'last_month'
    });
    
    // État de la recherche d'organisations
    const organizationSearch = ref('');
    
    // État des modals
    const showDonationModal = ref(false);
    const showCreateDonationModal = ref(false);
    const showOrganizationModal = ref(false);
    const showDeleteModal = ref(false);
    
    // État des éléments sélectionnés
    const selectedDonation = ref(null);
    const selectedOrganizationId = ref(null);
    
    // État d'édition
    const editingDonation = ref(false);
    const editingOrganization = ref(false);
    
    // État pour la création/modification d'un don
    const newDonation = ref({
      amount: 0,
      organizationId: '',
      deliveryId: '',
      percentage: 20,
      isAnonymous: false,
      donorType: 'individual',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      notes: ''
    });
    
    // État pour la création/modification d'une organisation
    const newOrganization = ref({
      name: '',
      category: '',
      description: '',
      website: '',
      email: '',
      phone: '',
      address: '',
      logo: null
    });
    
    // État des paramètres
    const settings = ref({
      defaultPercentage: 20,
      donationOptions: [10, 20, 30, 50, 100],
      showDonationsOnInvoices: true,
      allowAnonymousDonations: true,
      emailNotifications: true,
      notificationEmails: '',
      sendReceipts: true,
      generateMonthlyReports: true,
      reportRecipients: ''
    });
    
    // Références pour les graphiques
    const organizationsChart = ref(null);
    const donationsTimeChart = ref(null);
    const categoriesChart = ref(null);
    let charts = {
      organizations: null,
      donationsTime: null,
      categories: null
    };
    
    // Validation du nouveau don
    const isValidDonation = computed(() => {
      const donation = newDonation.value;
      
      if (donation.amount <= 0) return false;
      if (!donation.organizationId) return false;
      
      if (!donation.isAnonymous && !donation.donorName) return false;
      
      return true;
    });
    
    // Validation de la nouvelle organisation
    const isValidOrganization = computed(() => {
      const organization = newOrganization.value;
      
      if (!organization.name.trim()) return false;
      if (!organization.category) return false;
      if (!organization.description.trim()) return false;
      
      return true;
    });
    
    // Chargement des dons
    const loadDonations = async () => {
      try {
        loading.value = true;
        
        // Préparer les dates si nécessaire
        let startDate = null;
        let endDate = null;
        
        if (filters.value.dateRange === 'custom') {
          startDate = filters.value.startDate ? new Date(filters.value.startDate) : null;
          endDate = filters.value.endDate ? new Date(filters.value.endDate) : null;
        } else if (filters.value.dateRange === 'today') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
        } else if (filters.value.dateRange === 'yesterday') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
        } else if (filters.value.dateRange === 'last_week') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date();
        } else if (filters.value.dateRange === 'last_month') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          endDate = new Date();
        }
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des dons
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        donations.value = [
          {
            id: 1,
            created_at: new Date(2023, 4, 15),
            amount: 1500,
            organization: {
              id: 1,
              name: 'Éducation Pour Tous',
              category: 'Éducation',
              logo: null
            },
            delivery_id: 101,
            donor: {
              name: 'Ibrahim Koné',
              email: 'ibrahim.kone@example.com',
              phone: '77 987 65 43',
              type: 'individual'
            },
            status: 'completed',
            percentage: 20,
            notes: 'Don effectué lors d\'une livraison express'
          },
          {
            id: 2,
            created_at: new Date(2023, 4, 16),
            amount: 2000,
            organization: {
              id: 2,
              name: 'Santé Communautaire',
              category: 'Santé',
              logo: null
            },
            delivery_id: 102,
            donor: null,
            status: 'completed',
            percentage: 30,
            notes: 'Don anonyme'
          },
          {
            id: 3,
            created_at: new Date(2023, 4, 17),
            amount: 1000,
            organization: {
              id: 3,
              name: 'Planète Verte',
              category: 'Environnement',
              logo: null
            },
            delivery_id: null,
            donor: {
              name: 'Entreprise XYZ',
              email: 'contact@xyz.com',
              phone: '20 123 45 67',
              type: 'company'
            },
            status: 'pending',
            percentage: null,
            notes: 'Don direct d\'une entreprise'
          }
        ];
        
        totalItems.value = 3;
        
        // Mise à jour des statistiques
        updateStats();
      } catch (error) {
        console.error('Erreur lors du chargement des dons:', error);
        showToast('Erreur lors du chargement des dons', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Chargement des organisations
    const loadOrganizations = async () => {
      try {
        loadingOrganizations.value = true;
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des organisations
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        organizations.value = [
          {
            id: 1,
            name: 'Éducation Pour Tous',
            category: 'Éducation',
            description: 'Organisation dédiée à l\'accès à l\'éducation pour tous les enfants.',
            website: 'https://education-pour-tous.org',
            email: 'contact@education-pour-tous.org',
            phone: '20 123 45 67',
            address: 'Abidjan, Cocody',
            logo: null,
            donations_count: 15,
            total_amount: 25000
          },
          {
            id: 2,
            name: 'Santé Communautaire',
            category: 'Santé',
            description: 'Organisation œuvrant pour l\'amélioration de la santé dans les communautés défavorisées.',
            website: 'https://sante-communautaire.org',
            email: 'contact@sante-communautaire.org',
            phone: '20 234 56 78',
            address: 'Abidjan, Plateau',
            logo: null,
            donations_count: 12,
            total_amount: 30000
          },
          {
            id: 3,
            name: 'Planète Verte',
            category: 'Environnement',
            description: 'Organisation dédiée à la protection de l\'environnement et à la sensibilisation écologique.',
            website: 'https://planete-verte.org',
            email: 'contact@planete-verte.org',
            phone: '20 345 67 89',
            address: 'Abidjan, Marcory',
            logo: null,
            donations_count: 8,
            total_amount: 15000
          },
          {
            id: 4,
            name: 'Enfants d\'Abord',
            category: 'Enfance',
            description: 'Organisation dédiée au bien-être et à la protection des enfants vulnérables.',
            website: 'https://enfants-dabord.org',
            email: 'contact@enfants-dabord.org',
            phone: '20 456 78 90',
            address: 'Abidjan, Treichville',
            logo: null,
            donations_count: 10,
            total_amount: 20000
          },
          {
            id: 5,
            name: 'Solidarité Aînés',
            category: 'Personnes âgées',
            description: 'Organisation dédiée au soutien et à l\'accompagnement des personnes âgées.',
            website: 'https://solidarite-aines.org',
            email: 'contact@solidarite-aines.org',
            phone: '20 567 89 01',
            address: 'Abidjan, Yopougon',
            logo: null,
            donations_count: 6,
            total_amount: 12000
          }
        ];
      } catch (error) {
        console.error('Erreur lors du chargement des organisations:', error);
        showToast('Erreur lors du chargement des organisations', 'error');
      } finally {
        loadingOrganizations.value = false;
      }
    };
    
    // Chargement des livraisons express
    const loadExpressDeliveries = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des livraisons express
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        expressDeliveries.value = [
          {
            id: 101,
            created_at: new Date(2023, 4, 15)
          },
          {
            id: 102,
            created_at: new Date(2023, 4, 16)
          },
          {
            id: 103,
            created_at: new Date(2023, 4, 17)
          }
        ];
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons express:', error);
      }
    };
    
    // Chargement des analyses
    const loadAnalytics = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des analyses
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        analytics.value = {
          totalAmount: 102000,
          donationsCount: 51,
          averageDonation: 2000,
          averagePercentage: 25,
          impactEducation: 45000,
          impactHealth: 30000,
          impactEnvironment: 15000,
          impactOther: 12000
        };
        
        // Top organisations
        topOrganizations.value = [
          {
            id: 1,
            name: 'Éducation Pour Tous',
            category: 'Éducation',
            logo: null,
            total_amount: 45000
          },
          {
            id: 2,
            name: 'Santé Communautaire',
            category: 'Santé',
            logo: null,
            total_amount: 30000
          },
          {
            id: 3,
            name: 'Planète Verte',
            category: 'Environnement',
            logo: null,
            total_amount: 15000
          },
          {
            id: 4,
            name: 'Enfants d\'Abord',
            category: 'Enfance',
            logo: null,
            total_amount: 20000
          },
          {
            id: 5,
            name: 'Solidarité Aînés',
            category: 'Personnes âgées',
            logo: null,
            total_amount: 12000
          }
        ];
        
        // Créer les graphiques
        createCharts();
      } catch (error) {
        console.error('Erreur lors du chargement des analyses:', error);
        showToast('Erreur lors du chargement des analyses', 'error');
      }
    };
    
    // Mise à jour des statistiques
    const updateStats = () => {
      // Dans un environnement réel, ces données viendraient de l'API
      stats.value = {
        totalDonations: 102000,
        organizationsCount: 5,
        expressDeliveriesCount: 67,
        averageDonationPercentage: 25
      };
    };
    
    // Création des graphiques
    const createCharts = () => {
      // Graphique des organisations
      if (organizationsChart.value) {
        const ctx = organizationsChart.value.getContext('2d');
        
        // Détruire le graphique existant s'il y en a un
        if (charts.organizations) {
          charts.organizations.destroy();
        }
        
        // Données pour le graphique
        const data = {
          labels: topOrganizations.value.map(org => org.name),
          datasets: [{
            label: 'Montant des dons',
            data: topOrganizations.value.map(org => org.total_amount),
            backgroundColor: [
              '#4e73df',
              '#1cc88a',
              '#36b9cc',
              '#f6c23e',
              '#e74a3b'
            ],
            hoverBackgroundColor: [
              '#2e59d9',
              '#17a673',
              '#2c9faf',
              '#dda20a',
              '#be2617'
            ],
            borderWidth: 1
          }]
        };
        
        // Options du graphique
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed !== undefined) {
                    label += new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(context.parsed);
                  }
                  return label;
                }
              }
            }
          }
        };
        
        // Créer le graphique
        charts.organizations = new Chart(ctx, {
          type: 'pie',
          data: data,
          options: options
        });
      }
      
      // Graphique de l'évolution des dons
      if (donationsTimeChart.value) {
        const ctx = donationsTimeChart.value.getContext('2d');
        
        // Détruire le graphique existant s'il y en a un
        if (charts.donationsTime) {
          charts.donationsTime.destroy();
        }
        
        // Données fictives pour l'évolution des dons
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const donationsData = [5000, 7000, 10000, 8000, 12000, 15000, 13000, 18000, 20000, 17000, 22000, 25000];
        
        // Données pour le graphique
        const data = {
          labels: months,
          datasets: [{
            label: 'Montant des dons',
            data: donationsData,
            backgroundColor: 'rgba(78, 115, 223, 0.2)',
            borderColor: '#4e73df',
            borderWidth: 2,
            pointBackgroundColor: '#4e73df',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#4e73df',
            tension: 0.3
          }]
        };
        
        // Options du graphique
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0
                  }).format(value);
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        };
        
        // Créer le graphique
        charts.donationsTime = new Chart(ctx, {
          type: 'line',
          data: data,
          options: options
        });
      }
      
      // Graphique des catégories
      if (categoriesChart.value) {
        const ctx = categoriesChart.value.getContext('2d');
        
        // Détruire le graphique existant s'il y en a un
        if (charts.categories) {
          charts.categories.destroy();
        }
        
        // Données pour le graphique
        const data = {
          labels: ['Éducation', 'Santé', 'Environnement', 'Enfance', 'Personnes âgées'],
          datasets: [{
            label: 'Montant des dons par catégorie',
            data: [45000, 30000, 15000, 20000, 12000],
            backgroundColor: [
              '#4e73df',
              '#1cc88a',
              '#36b9cc',
              '#f6c23e',
              '#e74a3b'
            ],
            borderWidth: 1
          }]
        };
        
        // Options du graphique
        const options = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                    minimumFractionDigits: 0
                  }).format(value);
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        };
        
        // Créer le graphique
        charts.categories = new Chart(ctx, {
          type: 'bar',
          data: data,
          options: options
        });
      }
    };
    
    // Gestion des changements de page
    const changePage = (page) => {
      currentPage.value = page;
      loadDonations();
    };
    
    // Gestion du changement de plage de dates
    const handleDateRangeChange = () => {
      if (filters.value.dateRange !== 'custom') {
        filters.value.startDate = null;
        filters.value.endDate = null;
      }
      loadDonations();
    };
    
    // Recherche avec debounce
    const debounceSearch = () => {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        loadDonations();
      }, 300);
    };
    
    // Recherche d'organisations avec debounce
    const debounceOrganizationSearch = () => {
      clearTimeout(window.organizationSearchTimeout);
      window.organizationSearchTimeout = setTimeout(() => {
        // Dans un environnement réel, cette fonction appellerait l'API pour rechercher des organisations
        console.log('Recherche d\'organisations:', organizationSearch.value);
      }, 300);
    };
    
    // Formatage de la date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    // Formatage de la date et de l'heure
    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Formatage de la devise
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount);
    };
    
    // Obtenir la classe CSS pour un statut
    const getStatusClass = (status) => {
      switch (status) {
        case 'pending': return 'status-pending';
        case 'completed': return 'status-completed';
        case 'cancelled': return 'status-cancelled';
        default: return '';
      }
    };
    
    // Obtenir le libellé pour un statut
    const getStatusLabel = (status) => {
      switch (status) {
        case 'pending': return 'En attente';
        case 'completed': return 'Complété';
        case 'cancelled': return 'Annulé';
        default: return status;
      }
    };
    
    // Obtenir les initiales d'un nom
    const getInitials = (name) => {
      if (!name) return '';
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();
    };
    
    // Voir les détails d'un don
    const viewDonationDetails = async (donationId) => {
      try {
        loading.value = true;
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des détails du don
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver le don dans la liste
        const donation = donations.value.find(d => d.id === donationId);
        
        if (donation) {
          selectedDonation.value = donation;
          showDonationModal.value = true;
        } else {
          showToast('Don non trouvé', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du don:', error);
        showToast('Erreur lors du chargement des détails du don', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Voir les détails d'une livraison
    const viewDelivery = (deliveryId) => {
      router.push(`/manager/deliveries/${deliveryId}`);
    };
    
    // Voir les détails d'une organisation
    const viewOrganizationDetails = (organizationId) => {
      // Dans un environnement réel, cette fonction redirigerait vers la page de détails de l'organisation
      console.log('Voir les détails de l\'organisation:', organizationId);
    };
    
    // Ouvrir le modal de création d'un don
    const openCreateModal = () => {
      editingDonation.value = false;
      newDonation.value = {
        amount: 0,
        organizationId: '',
        deliveryId: '',
        percentage: 20,
        isAnonymous: false,
        donorType: 'individual',
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        notes: ''
      };
      showCreateDonationModal.value = true;
    };
    
    // Éditer un don
    const editDonation = async (donationId) => {
      try {
        loading.value = true;
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des détails du don
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver le don dans la liste
        const donation = donations.value.find(d => d.id === donationId);
        
        if (donation) {
          editingDonation.value = true;
          newDonation.value = {
            amount: donation.amount,
            organizationId: donation.organization.id,
            deliveryId: donation.delivery_id || '',
            percentage: donation.percentage || 20,
            isAnonymous: !donation.donor,
            donorType: donation.donor ? donation.donor.type : 'individual',
            donorName: donation.donor ? donation.donor.name : '',
            donorEmail: donation.donor ? donation.donor.email : '',
            donorPhone: donation.donor ? donation.donor.phone : '',
            notes: donation.notes || ''
          };
          showCreateDonationModal.value = true;
        } else {
          showToast('Don non trouvé', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du don:', error);
        showToast('Erreur lors du chargement des détails du don', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Sauvegarder un don
    const saveDonation = async () => {
      try {
        if (!isValidDonation.value) return;
        
        // Dans un environnement réel, cette fonction appellerait l'API pour créer ou mettre à jour un don
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast(
          editingDonation.value ? 'Don mis à jour avec succès' : 'Don créé avec succès',
          'success'
        );
        showCreateDonationModal.value = false;
        
        // Recharger les dons
        loadDonations();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du don:', error);
        showToast('Erreur lors de la sauvegarde du don', 'error');
      }
    };
    
    // Marquer un don comme complété
    const completeDonation = async (donationId) => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour marquer un don comme complété
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mettre à jour le don dans la liste
        const donationIndex = donations.value.findIndex(d => d.id === donationId);
        if (donationIndex !== -1) {
          donations.value[donationIndex].status = 'completed';
        }
        
        // Fermer le modal si ouvert
        if (showDonationModal.value) {
          showDonationModal.value = false;
        }
        
        showToast('Don marqué comme complété avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors du marquage du don comme complété:', error);
        showToast('Erreur lors du marquage du don comme complété', 'error');
      }
    };
    
    // Annuler un don
    const cancelDonation = async (donationId) => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour annuler un don
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mettre à jour le don dans la liste
        const donationIndex = donations.value.findIndex(d => d.id === donationId);
        if (donationIndex !== -1) {
          donations.value[donationIndex].status = 'cancelled';
        }
        
        // Fermer le modal si ouvert
        if (showDonationModal.value) {
          showDonationModal.value = false;
        }
        
        showToast('Don annulé avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de l\'annulation du don:', error);
        showToast('Erreur lors de l\'annulation du don', 'error');
      }
    };
    
    // Ouvrir le modal de création d'une organisation
    const openCreateOrganizationModal = () => {
      editingOrganization.value = false;
      newOrganization.value = {
        name: '',
        category: '',
        description: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        logo: null
      };
      showOrganizationModal.value = true;
    };
    
    // Éditer une organisation
    const editOrganization = async (organizationId) => {
      try {
        loadingOrganizations.value = true;
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des détails de l'organisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver l'organisation dans la liste
        const organization = organizations.value.find(o => o.id === organizationId);
        
        if (organization) {
          editingOrganization.value = true;
          newOrganization.value = {
            name: organization.name,
            category: organization.category,
            description: organization.description,
            website: organization.website || '',
            email: organization.email || '',
            phone: organization.phone || '',
            address: organization.address || '',
            logo: organization.logo
          };
          showOrganizationModal.value = true;
        } else {
          showToast('Organisation non trouvée', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'organisation:', error);
        showToast('Erreur lors du chargement des détails de l\'organisation', 'error');
      } finally {
        loadingOrganizations.value = false;
      }
    };
    
    // Sauvegarder une organisation
    const saveOrganization = async () => {
      try {
        if (!isValidOrganization.value) return;
        
        // Dans un environnement réel, cette fonction appellerait l'API pour créer ou mettre à jour une organisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast(
          editingOrganization.value ? 'Organisation mise à jour avec succès' : 'Organisation créée avec succès',
          'success'
        );
        showOrganizationModal.value = false;
        
        // Recharger les organisations
        loadOrganizations();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'organisation:', error);
        showToast('Erreur lors de la sauvegarde de l\'organisation', 'error');
      }
    };
    
    // Supprimer une organisation
    const deleteOrganization = (organizationId) => {
      selectedOrganizationId.value = organizationId;
      showDeleteModal.value = true;
    };
    
    // Confirmer la suppression d'une organisation
    const confirmDelete = async () => {
      try {
        if (!selectedOrganizationId.value) return;
        
        // Dans un environnement réel, cette fonction appellerait l'API pour supprimer une organisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Supprimer l'organisation de la liste
        organizations.value = organizations.value.filter(o => o.id !== selectedOrganizationId.value);
        
        showToast('Organisation supprimée avec succès', 'success');
        showDeleteModal.value = false;
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'organisation:', error);
        showToast('Erreur lors de la suppression de l\'organisation', 'error');
      }
    };
    
    // Gérer l'upload du logo
    const handleLogoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newOrganization.value.logo = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    
    // Supprimer le logo
    const removeLogo = () => {
      newOrganization.value.logo = null;
    };
    
    // Ajouter une option de don
    const addDonationOption = () => {
      settings.value.donationOptions.push(0);
    };
    
    // Supprimer une option de don
    const removeDonationOption = (index) => {
      settings.value.donationOptions.splice(index, 1);
    };
    
    // Sauvegarder les paramètres
    const saveSettings = async () => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour sauvegarder les paramètres
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast('Paramètres enregistrés avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
        showToast('Erreur lors de la sauvegarde des paramètres', 'error');
      }
    };
    
    // Réinitialiser les paramètres
    const resetSettings = () => {
      settings.value = {
        defaultPercentage: 20,
        donationOptions: [10, 20, 30, 50, 100],
        showDonationsOnInvoices: true,
        allowAnonymousDonations: true,
        emailNotifications: true,
        notificationEmails: '',
        sendReceipts: true,
        generateMonthlyReports: true,
        reportRecipients: ''
      };
    };
    
    // Exporter les données
    const exportData = async () => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour exporter les données
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast('Données exportées avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de l\'export des données:', error);
        showToast('Erreur lors de l\'export des données', 'error');
      }
    };
    
    // Exporter les analyses
    const exportAnalytics = async () => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour exporter les analyses
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast('Analyses exportées avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de l\'export des analyses:', error);
        showToast('Erreur lors de l\'export des analyses', 'error');
      }
    };
    
    // Générer un rapport
    const generateReport = async () => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour générer un rapport
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast('Rapport généré avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        showToast('Erreur lors de la génération du rapport', 'error');
      }
    };
    
    // Charger les données au montage du composant
    onMounted(() => {
      loadDonations();
      loadOrganizations();
      loadExpressDeliveries();
    });
    
    // Surveiller les changements d'onglet
    watch(activeTab, (newTab) => {
      if (newTab === 'analytics') {
        loadAnalytics();
      }
    });
    
    return {
      activeTab,
      donations,
      organizations,
      expressDeliveries,
      loading,
      loadingOrganizations,
      stats,
      analytics,
      topOrganizations,
      currentPage,
      totalItems,
      itemsPerPage,
      totalPages,
      filters,
      analyticsFilters,
      organizationSearch,
      showDonationModal,
      showCreateDonationModal,
      showOrganizationModal,
      showDeleteModal,
      selectedDonation,
      selectedOrganizationId,
      editingDonation,
      editingOrganization,
      newDonation,
      newOrganization,
      settings,
      organizationsChart,
      donationsTimeChart,
      categoriesChart,
      isValidDonation,
      isValidOrganization,
      loadDonations,
      loadOrganizations,
      loadAnalytics,
      changePage,
      handleDateRangeChange,
      debounceSearch,
      debounceOrganizationSearch,
      formatDate,
      formatDateTime,
      formatCurrency,
      getStatusClass,
      getStatusLabel,
      getInitials,
      viewDonationDetails,
      viewDelivery,
      viewOrganizationDetails,
      openCreateModal,
      editDonation,
      saveDonation,
      completeDonation,
      cancelDonation,
      openCreateOrganizationModal,
      editOrganization,
      saveOrganization,
      deleteOrganization,
      confirmDelete,
      handleLogoUpload,
      removeLogo,
      addDonationOption,
      removeDonationOption,
      saveSettings,
      resetSettings,
      exportData,
      exportAnalytics,
      generateReport
    };
  }
};
</script>

<style scoped>
.donations-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-outline {
  background-color: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #eef2ff;
  color: #4f46e5;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.tabs {
  display: flex;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab-button {
  padding: 1rem 1.5rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
}

.tab-button:hover {
  color: #4f46e5;
}

.tab-button.active {
  color: #4f46e5;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #4f46e5;
}

.tab-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.filter-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.search-group {
  flex: 2;
}

.search-input {
  position: relative;
}

.search-input input {
  width: 100%;
  padding: 0.5rem;
  padding-right: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.search-input i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-state i,
.empty-state i {
  margin-bottom: 1rem;
  color: #6b7280;
}

.loading-state p,
.empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.donations-table-container {
  overflow-x: auto;
}

.donations-table {
  width: 100%;
  border-collapse: collapse;
}

.donations-table th,
.donations-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.donations-table th {
  font-weight: 600;
  color: #374151;
}

.donations-table tr:last-child td {
  border-bottom: none;
}

.status-pending {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #fef3c7;
  color: #d97706;
}

.status-completed {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #d1fae5;
  color: #059669;
}

.status-cancelled {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #fee2e2;
  color: #dc2626;
}

.table-actions {
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
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
}

.btn-icon:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #4f46e5;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-button {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.organizations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.organizations-header .search-input {
  width: 300px;
}

.organizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.organization-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.organization-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e5e7eb;
}

.organization-logo {
  width: 4rem;
  height: 4rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.organization-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #6b7280;
}

.logo-placeholder.small {
  font-size: 1rem;
}

.organization-actions {
  display: flex;
  gap: 0.5rem;
}

.organization-content {
  padding: 1rem;
  flex: 1;
}

.organization-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.organization-category {
  margin-bottom: 0.75rem;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #4b5563;
}

.organization-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.organization-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.organization-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.analytics-filters {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.analytics-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.analytics-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.chart-container {
  height: 300px;
  position: relative;
}

.top-organizations {
  margin-top: 1.5rem;
}

.top-organization-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.top-organization-item:last-child {
  border-bottom: none;
}

.top-organization-rank {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4b5563;
  margin-right: 0.75rem;
}

.top-organization-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  overflow: hidden;
  background-color: #f3f4f6;
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-organization-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.top-organization-info {
  flex: 1;
}

.top-organization-name {
  font-weight: 500;
  color: #1f2937;
}

.top-organization-category {
  font-size: 0.875rem;
  color: #6b7280;
}

.top-organization-amount {
  font-weight: 600;
  color: #1f2937;
}

.analytics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-weight: 600;
  color: #1f2937;
}

.analytics-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.settings-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.settings-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.settings-content {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="number"],
.form-group input[type="url"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.form-hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  flex: 1;
}

.input-group-append {
  display: flex;
  align-items: center;
}

.input-group-text {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-left: none;
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.toggle-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 3rem;
  height: 1.5rem;
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
  background-color: #d1d5db;
  border-radius: 1.5rem;
  transition: 0.4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 1.25rem;
  width: 1.25rem;
  left: 0.125rem;
  bottom: 0.125rem;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}

input:checked + .toggle-slider {
  background-color: #4f46e5;
}

input:checked + .toggle-slider:before {
  transform: translateX(1.5rem);
}

.donation-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.donation-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.donation-details {
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #1f2937;
}

.organization-detail {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.organization-info {
  flex: 1;
}

.organization-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.organization-category {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.organization-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.delivery-detail {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.anonymous-donor {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donation-notes {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  color: #6b7280;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.donation-form,
.organization-form {
  padding: 1rem;
}

.required {
  color: #ef4444;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.file-input {
  margin-top: 0.5rem;
}

.file-preview {
  margin-top: 1rem;
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 0.5rem;
  overflow: hidden;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-preview .btn-icon {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background-color: rgba(255, 255, 255, 0.8);
}

.delete-confirmation {
  padding: 1rem;
  text-align: center;
}

.confirmation-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.confirmation-message {
  margin-bottom: 1.5rem;
}

.confirmation-message p {
  margin-bottom: 0.5rem;
}

.confirmation-message .warning {
  color: #ef4444;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-cards,
  .analytics-grid,
  .analytics-summary,
  .summary-content {
    grid-template-columns: 1fr;
  }
  
  .organizations-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .organization-detail {
    flex-direction: column;
  }
  
  .organization-logo {
    margin-bottom: 1rem;
  }
}
</style>
