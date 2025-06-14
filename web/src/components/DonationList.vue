<template>
  <div class="donation-list">
    <div class="donation-filters" v-if="showFilters">
      <div class="filter-group">
        <label for="organization-filter">Organisation</label>
        <select id="organization-filter" v-model="filters.organization" @change="applyFilters">
          <option value="">Toutes les organisations</option>
          <option v-for="org in organizations" :key="org.name" :value="org.name">
            {{ org.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label for="date-range">Période</label>
        <select id="date-range" v-model="filters.dateRange" @change="applyFilters">
          <option value="all">Toutes les dates</option>
          <option value="last_week">7 derniers jours</option>
          <option value="last_month">30 derniers jours</option>
          <option value="last_quarter">3 derniers mois</option>
          <option value="last_year">12 derniers mois</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="search">Recherche</label>
        <div class="search-input">
          <input
            type="text"
            id="search"
            v-model="filters.search"
            placeholder="ID, livraison..."
            @input="debounceSearch"
          />
          <i class="fas fa-search"></i>
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
            <th>Statut</th>
            <th v-if="showActions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="donation in donations" :key="donation.id">
            <td>#{{ donation.id }}</td>
            <td>{{ formatDate(donation.created_at) }}</td>
            <td>{{ formatCurrency(donation.amount) }}</td>
            <td>{{ donation.organization }}</td>
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
            <td>
              <span :class="getStatusClass(donation.status)">
                {{ getStatusLabel(donation.status) }}
              </span>
            </td>
            <td v-if="showActions">
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
                  @click="exportDonationDetails(donation.id)"
                  title="Exporter"
                >
                  <i class="fas fa-file-export"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="donation-pagination" v-if="donations.length > 0 && totalPages > 1">
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
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'DonationList',
  props: {
    donations: {
      type: Array,
      default: () => [],
    },
    organizations: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    showFilters: {
      type: Boolean,
      default: true,
    },
    showActions: {
      type: Boolean,
      default: true,
    },
    totalItems: {
      type: Number,
      default: 0,
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
  },
  emits: ['filter', 'view-details', 'view-delivery', 'export', 'page-change'],
  setup(props, { emit }) {
    const filters = ref({
      organization: '',
      dateRange: 'all',
      search: '',
    })

    const currentPage = ref(1)

    const totalPages = computed(() => {
      return Math.ceil(props.totalItems / props.itemsPerPage)
    })

    const formatDate = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    const getStatusClass = status => {
      switch (status) {
        case 'pending':
          return 'status-pending'
        case 'completed':
          return 'status-completed'
        case 'cancelled':
          return 'status-cancelled'
        default:
          return ''
      }
    }

    const getStatusLabel = status => {
      switch (status) {
        case 'pending':
          return 'En attente'
        case 'completed':
          return 'Complété'
        case 'cancelled':
          return 'Annulé'
        default:
          return status
      }
    }

    const applyFilters = () => {
      currentPage.value = 1
      emit('filter', { ...filters.value, page: currentPage.value })
    }

    const debounceSearch = () => {
      clearTimeout(window.searchTimeout)
      window.searchTimeout = setTimeout(() => {
        applyFilters()
      }, 300)
    }

    const changePage = page => {
      currentPage.value = page
      emit('page-change', { ...filters.value, page })
    }

    const viewDonationDetails = donationId => {
      emit('view-details', donationId)
    }

    const viewDelivery = deliveryId => {
      emit('view-delivery', deliveryId)
    }

    const exportDonationDetails = donationId => {
      emit('export', donationId)
    }

    onMounted(() => {
      applyFilters()
    })

    watch(
      () => props.donations,
      () => {
        if (currentPage.value > totalPages.value && totalPages.value > 0) {
          changePage(totalPages.value)
        }
      }
    )

    return {
      filters,
      currentPage,
      totalPages,
      formatDate,
      formatCurrency,
      getStatusClass,
      getStatusLabel,
      applyFilters,
      debounceSearch,
      changePage,
      viewDonationDetails,
      viewDelivery,
      exportDonationDetails,
    }
  },
}
</script>

<style scoped>
.donation-list {
  width: 100%;
}

.donation-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
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
  color: #6b7280;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state i,
.empty-state i {
  margin-bottom: 1rem;
  color: #6b7280;
}

.loading-state p,
.empty-state p {
  color: #6b7280;
  margin: 0;
}

.donations-table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  background-color: #f9fafb;
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

.btn-icon:hover {
  background-color: #f3f4f6;
  color: #4f46e5;
}

.donation-pagination {
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
</style>
