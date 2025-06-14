<template>
  <div class="audit-logs-view">
    <div class="page-header">
      <h1>Logs d'audit</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="exportData">
          <font-awesome-icon icon="file-export" class="mr-1" />
          Exporter
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="user-filter">Utilisateur</label>
          <select id="user-filter" v-model="filters.userId" class="form-control">
            <option value="">Tous les utilisateurs</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }} ({{ user.email }})
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="action-filter">Action</label>
          <select id="action-filter" v-model="filters.action" class="form-control">
            <option value="">Toutes les actions</option>
            <option value="create">Création</option>
            <option value="update">Mise à jour</option>
            <option value="delete">Suppression</option>
            <option value="login">Connexion</option>
            <option value="logout">Déconnexion</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-range">Période</label>
          <div class="date-range-picker">
            <input type="date" v-model="filters.startDate" class="form-control" />
            <span>à</span>
            <input type="date" v-model="filters.endDate" class="form-control" />
          </div>
        </div>

        <div class="filter-group">
          <label for="search-filter">Recherche</label>
          <div class="search-input">
            <input
              type="text"
              id="search-filter"
              v-model="filters.search"
              class="form-control"
              placeholder="Description..."
              @input="debounceSearch"
            />
            <font-awesome-icon icon="search" />
          </div>
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

    <!-- Tableau des logs d'audit -->
    <div class="table-container" v-if="!loading && auditLogs.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Description</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditLogs" :key="log.id">
            <td>#{{ log.id }}</td>
            <td>
              <div class="user-info">
                <div class="user-avatar">
                  <img
                    v-if="log.user.profile_picture"
                    :src="log.user.profile_picture"
                    :alt="log.user.name"
                  />
                  <div v-else class="avatar-placeholder">{{ getInitials(log.user.name) }}</div>
                </div>
                <span>{{ log.user.name }}</span>
              </div>
            </td>
            <td>
              <span class="action-badge" :class="getActionClass(log.action)">
                {{ getActionLabel(log.action) }}
              </span>
            </td>
            <td>{{ log.description }}</td>
            <td>{{ formatDateTime(log.created_at) }}</td>
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
    <div class="empty-state" v-else-if="!loading && auditLogs.length === 0">
      <div class="empty-icon">
        <font-awesome-icon icon="file-alt" />
      </div>
      <h3>Aucun log d'audit trouvé</h3>
      <p>Aucun log d'audit ne correspond à vos critères de recherche.</p>
      <button class="btn btn-primary" @click="resetFilters">Réinitialiser les filtres</button>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des logs d'audit...</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'

import { fetchAuditLogs, fetchUsers } from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'

export default {
  name: 'AuditLogsView',
  setup() {
    // État
    const auditLogs = ref([])
    const users = ref([])
    const loading = ref(true)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)

    const filters = reactive({
      userId: '',
      action: '',
      startDate: '',
      endDate: '',
      search: '',
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          user_id: filters.userId,
          action: filters.action,
          start_date: filters.startDate,
          end_date: filters.endDate,
          search: filters.search,
        }

        const response = await fetchAuditLogs(params)
        auditLogs.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages
      } catch (error) {
        console.error("Erreur lors du chargement des logs d'audit:", error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const fetchAllUsers = async () => {
      try {
        const response = await fetchUsers()
        users.value = response.users
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
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
      filters.userId = ''
      filters.action = ''
      filters.startDate = ''
      filters.endDate = ''
      filters.search = ''
      currentPage.value = 1
      fetchData()
    }

    const changePage = page => {
      currentPage.value = page
      fetchData()
    }

    const exportData = () => {
      // Implémenter l'exportation des données (CSV, Excel, etc.)
      console.log('Exporter les données')
    }

    // Utilitaires
    const getInitials = name => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }

    const getActionClass = action => {
      const actionMap = {
        create: 'action-create',
        update: 'action-update',
        delete: 'action-delete',
        login: 'action-login',
        logout: 'action-logout',
      }
      return actionMap[action] || 'action-unknown'
    }

    const getActionLabel = action => {
      const actionMap = {
        create: 'Création',
        update: 'Mise à jour',
        delete: 'Suppression',
        login: 'Connexion',
        logout: 'Déconnexion',
      }
      return actionMap[action] || 'Inconnu'
    }

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
      fetchAllUsers()
    })

    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })

    return {
      auditLogs,
      users,
      loading,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      filters,
      displayedPages,

      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      exportData,

      getInitials,
      getActionClass,
      getActionLabel,

      formatCurrency,
      formatDate,
      formatDateTime,
      debounceSearch,
    }
  },
}
</script>

<style scoped>
.audit-logs-view {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f8f9fa;
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
  background-color: #0056b3;
}

.action-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-create {
  background-color: #d4edda;
  color: #155724;
}

.action-update {
  background-color: #cce5ff;
  color: #004085;
}

.action-delete {
  background-color: #f8d7da;
  color: #721c24;
}

.action-login {
  background-color: #fff3cd;
  color: #856404;
}

.action-logout {
  background-color: #e9ecef;
  color: #495057;
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

/* Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    min-width: 100%;
  }
}
</style>
