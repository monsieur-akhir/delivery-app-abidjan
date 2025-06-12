
<template>
  <div class="users-management">
    <div class="header">
      <h1>{{ $t('users.management') }}</h1>
      <div class="header-actions">
        <button @click="exportUsers" class="btn btn-outline">
          <i class="fas fa-download"></i>
          {{ $t('common.export') }}
        </button>
        <button @click="showCreateUser = true" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          {{ $t('users.create') }}
        </button>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-bar">
        <input
          v-model="filters.search"
          type="text"
          :placeholder="$t('users.search')"
          class="search-input"
        />
        <i class="fas fa-search"></i>
      </div>
      
      <div class="filters">
        <select v-model="filters.role" class="filter-select">
          <option value="">{{ $t('users.allRoles') }}</option>
          <option value="client">{{ $t('roles.client') }}</option>
          <option value="courier">{{ $t('roles.courier') }}</option>
          <option value="business">{{ $t('roles.business') }}</option>
          <option value="manager">{{ $t('roles.manager') }}</option>
        </select>
        
        <select v-model="filters.status" class="filter-select">
          <option value="">{{ $t('users.allStatuses') }}</option>
          <option value="active">{{ $t('status.active') }}</option>
          <option value="inactive">{{ $t('status.inactive') }}</option>
          <option value="suspended">{{ $t('status.suspended') }}</option>
          <option value="pending_verification">{{ $t('status.pendingVerification') }}</option>
        </select>
        
        <select v-model="filters.kycStatus" class="filter-select">
          <option value="">{{ $t('kyc.allStatuses') }}</option>
          <option value="pending">{{ $t('kyc.pending') }}</option>
          <option value="verified">{{ $t('kyc.verified') }}</option>
          <option value="rejected">{{ $t('kyc.rejected') }}</option>
        </select>
        
        <button @click="clearFilters" class="btn btn-outline">
          {{ $t('common.clear') }}
        </button>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <div class="stat-label">{{ $t('users.total') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.activeUsers }}</div>
        <div class="stat-label">{{ $t('users.active') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.pendingKyc }}</div>
        <div class="stat-label">{{ $t('kyc.pending') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.newToday }}</div>
        <div class="stat-label">{{ $t('users.newToday') }}</div>
      </div>
    </div>

    <!-- Table des utilisateurs -->
    <div class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th @click="sortBy('id')" class="sortable">
              ID
              <i class="fas fa-sort" :class="getSortIcon('id')"></i>
            </th>
            <th @click="sortBy('full_name')" class="sortable">
              {{ $t('users.name') }}
              <i class="fas fa-sort" :class="getSortIcon('full_name')"></i>
            </th>
            <th>{{ $t('users.phone') }}</th>
            <th>{{ $t('users.email') }}</th>
            <th @click="sortBy('role')" class="sortable">
              {{ $t('users.role') }}
              <i class="fas fa-sort" :class="getSortIcon('role')"></i>
            </th>
            <th>{{ $t('users.status') }}</th>
            <th>{{ $t('users.kycStatus') }}</th>
            <th @click="sortBy('created_at')" class="sortable">
              {{ $t('users.createdAt') }}
              <i class="fas fa-sort" :class="getSortIcon('created_at')"></i>
            </th>
            <th>{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <div class="user-info">
                <img :src="user.profile_picture || '/default-avatar.png'" :alt="user.full_name" class="user-avatar">
                {{ user.full_name }}
              </div>
            </td>
            <td>{{ user.phone }}</td>
            <td>{{ user.email || '-' }}</td>
            <td>
              <span class="role-badge" :class="`role-${user.role}`">
                {{ $t(`roles.${user.role}`) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="`status-${user.status}`">
                {{ $t(`status.${user.status}`) }}
              </span>
            </td>
            <td>
              <span class="kyc-badge" :class="`kyc-${user.kyc_status}`">
                {{ $t(`kyc.${user.kyc_status}`) }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="actions">
                <button @click="viewUser(user)" class="action-btn view">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="editUser(user)" class="action-btn edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="user.kyc_status === 'pending'" 
                  @click="reviewKyc(user)" 
                  class="action-btn kyc"
                >
                  <i class="fas fa-check-circle"></i>
                </button>
                <button @click="suspendUser(user)" class="action-btn suspend">
                  <i class="fas fa-ban"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        {{ $t('common.previous') }}
      </button>
      
      <span class="pagination-info">
        {{ $t('pagination.info', { 
          current: currentPage, 
          total: totalPages,
          showing: paginatedUsers.length,
          total_items: filteredUsers.length
        }) }}
      </span>
      
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        {{ $t('common.next') }}
      </button>
    </div>

    <!-- Modal de création/édition d'utilisateur -->
    <div v-if="showCreateUser || editingUser" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ editingUser ? $t('users.edit') : $t('users.create') }}</h2>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-group">
            <label>{{ $t('users.fullName') }} *</label>
            <input v-model="userForm.full_name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>{{ $t('users.phone') }} *</label>
            <input v-model="userForm.phone" type="tel" required>
          </div>
          
          <div class="form-group">
            <label>{{ $t('users.email') }}</label>
            <input v-model="userForm.email" type="email">
          </div>
          
          <div class="form-group">
            <label>{{ $t('users.role') }} *</label>
            <select v-model="userForm.role" required>
              <option value="client">{{ $t('roles.client') }}</option>
              <option value="courier">{{ $t('roles.courier') }}</option>
              <option value="business">{{ $t('roles.business') }}</option>
              <option value="manager">{{ $t('roles.manager') }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>{{ $t('users.commune') }}</label>
            <input v-model="userForm.commune" type="text">
          </div>
          
          <div v-if="!editingUser" class="form-group">
            <label>{{ $t('users.password') }} *</label>
            <input v-model="userForm.password" type="password" required>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              {{ $t('common.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? $t('common.saving') : $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de révision KYC -->
    <KYCReviewModal
      v-if="kycReviewUser"
      :user="kycReviewUser"
      @close="kycReviewUser = null"
      @approve="approveKyc"
      @reject="rejectKyc"
    />

    <!-- Modal de détails utilisateur -->
    <UserDetailsModal
      v-if="viewingUser"
      :user="viewingUser"
      @close="viewingUser = null"
      @edit="editUser"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import managerApi from '@/api/manager'
import KYCReviewModal from '@/components/modals/KYCReviewModal.vue'
import UserDetailsModal from '@/components/modals/UserDetailsModal.vue'

export default {
  name: 'UsersManagementView',
  components: {
    KYCReviewModal,
    UserDetailsModal
  },
  setup() {
    const { showToast } = useToast()
    
    // État réactif
    const users = ref([])
    const loading = ref(false)
    const saving = ref(false)
    const showCreateUser = ref(false)
    const editingUser = ref(null)
    const viewingUser = ref(null)
    const kycReviewUser = ref(null)
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    
    // Filtres
    const filters = reactive({
      search: '',
      role: '',
      status: '',
      kycStatus: ''
    })
    
    // Tri
    const sortField = ref('created_at')
    const sortDirection = ref('desc')
    
    // Formulaire utilisateur
    const userForm = reactive({
      full_name: '',
      phone: '',
      email: '',
      role: 'client',
      commune: '',
      password: ''
    })
    
    // Statistiques
    const stats = reactive({
      totalUsers: 0,
      activeUsers: 0,
      pendingKyc: 0,
      newToday: 0
    })
    
    // Computed
    const filteredUsers = computed(() => {
      let result = users.value
      
      if (filters.search) {
        const search = filters.search.toLowerCase()
        result = result.filter(user => 
          user.full_name.toLowerCase().includes(search) ||
          user.phone.includes(search) ||
          (user.email && user.email.toLowerCase().includes(search))
        )
      }
      
      if (filters.role) {
        result = result.filter(user => user.role === filters.role)
      }
      
      if (filters.status) {
        result = result.filter(user => user.status === filters.status)
      }
      
      if (filters.kycStatus) {
        result = result.filter(user => user.kyc_status === filters.kycStatus)
      }
      
      // Tri
      result.sort((a, b) => {
        let aVal = a[sortField.value]
        let bVal = b[sortField.value]
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }
        
        if (sortDirection.value === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
      
      return result
    })
    
    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredUsers.value.slice(start, end)
    })
    
    const totalPages = computed(() => {
      return Math.ceil(filteredUsers.value.length / itemsPerPage.value)
    })
    
    // Méthodes
    const fetchUsers = async () => {
      try {
        loading.value = true
        const response = await managerApi.getUsers()
        users.value = response.data
        updateStats()
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        loading.value = false
      }
    }
    
    const updateStats = () => {
      stats.totalUsers = users.value.length
      stats.activeUsers = users.value.filter(u => u.status === 'active').length
      stats.pendingKyc = users.value.filter(u => u.kyc_status === 'pending').length
      
      const today = new Date().toDateString()
      stats.newToday = users.value.filter(u => 
        new Date(u.created_at).toDateString() === today
      ).length
    }
    
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortDirection.value = 'asc'
      }
    }
    
    const getSortIcon = (field) => {
      if (sortField.value !== field) return ''
      return sortDirection.value === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
    }
    
    const clearFilters = () => {
      filters.search = ''
      filters.role = ''
      filters.status = ''
      filters.kycStatus = ''
      currentPage.value = 1
    }
    
    const viewUser = (user) => {
      viewingUser.value = user
    }
    
    const editUser = (user) => {
      editingUser.value = user
      Object.assign(userForm, {
        full_name: user.full_name,
        phone: user.phone,
        email: user.email || '',
        role: user.role,
        commune: user.commune || '',
        password: ''
      })
    }
    
    const closeModal = () => {
      showCreateUser.value = false
      editingUser.value = null
      viewingUser.value = null
      resetForm()
    }
    
    const resetForm = () => {
      Object.assign(userForm, {
        full_name: '',
        phone: '',
        email: '',
        role: 'client',
        commune: '',
        password: ''
      })
    }
    
    const saveUser = async () => {
      try {
        saving.value = true
        
        if (editingUser.value) {
          await managerApi.updateUser(editingUser.value.id, userForm)
          showToast('Utilisateur mis à jour avec succès', 'success')
        } else {
          await managerApi.createUser(userForm)
          showToast('Utilisateur créé avec succès', 'success')
        }
        
        await fetchUsers()
        closeModal()
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        saving.value = false
      }
    }
    
    const reviewKyc = (user) => {
      kycReviewUser.value = user
    }
    
    const approveKyc = async (userId) => {
      try {
        await managerApi.updateKycStatus(userId, { status: 'verified' })
        showToast('KYC approuvé avec succès', 'success')
        await fetchUsers()
        kycReviewUser.value = null
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const rejectKyc = async (userId, reason) => {
      try {
        await managerApi.updateKycStatus(userId, { 
          status: 'rejected', 
          rejection_reason: reason 
        })
        showToast('KYC rejeté', 'success')
        await fetchUsers()
        kycReviewUser.value = null
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const suspendUser = async (user) => {
      if (!confirm(`Êtes-vous sûr de vouloir suspendre ${user.full_name} ?`)) {
        return
      }
      
      try {
        const newStatus = user.status === 'suspended' ? 'active' : 'suspended'
        await managerApi.updateUserStatus(user.id, { status: newStatus })
        showToast(
          newStatus === 'suspended' ? 'Utilisateur suspendu' : 'Utilisateur réactivé', 
          'success'
        )
        await fetchUsers()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const exportUsers = async () => {
      try {
        const response = await managerApi.exportUsers()
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        showToast('Export terminé', 'success')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Watchers
    watch(filters, () => {
      currentPage.value = 1
    }, { deep: true })
    
    // Lifecycle
    onMounted(() => {
      fetchUsers()
    })
    
    return {
      users,
      loading,
      saving,
      showCreateUser,
      editingUser,
      viewingUser,
      kycReviewUser,
      currentPage,
      totalPages,
      filters,
      userForm,
      stats,
      filteredUsers,
      paginatedUsers,
      fetchUsers,
      sortBy,
      getSortIcon,
      clearFilters,
      viewUser,
      editUser,
      closeModal,
      saveUser,
      reviewKyc,
      approveKyc,
      rejectKyc,
      suspendUser,
      exportUsers,
      formatDate
    }
  }
}
</script>

<style scoped>
.users-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-bar {
  position: relative;
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-bar i {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2196F3;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background: #e9ecef;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge,
.status-badge,
.kyc-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-client { background: #e3f2fd; color: #1976d2; }
.role-courier { background: #f3e5f5; color: #7b1fa2; }
.role-business { background: #e8f5e8; color: #388e3c; }
.role-manager { background: #fff3e0; color: #f57c00; }

.status-active { background: #e8f5e8; color: #4caf50; }
.status-inactive { background: #f5f5f5; color: #757575; }
.status-suspended { background: #ffebee; color: #f44336; }
.status-pending_verification { background: #fff3e0; color: #ff9800; }

.kyc-verified { background: #e8f5e8; color: #4caf50; }
.kyc-pending { background: #fff3e0; color: #ff9800; }
.kyc-rejected { background: #ffebee; color: #f44336; }

.actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn.view { background: #e3f2fd; color: #1976d2; }
.action-btn.edit { background: #f3e5f5; color: #7b1fa2; }
.action-btn.kyc { background: #e8f5e8; color: #4caf50; }
.action-btn.suspend { background: #ffebee; color: #f44336; }

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}

.user-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-outline {
  background: transparent;
  color: #2196F3;
  border: 1px solid #2196F3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
