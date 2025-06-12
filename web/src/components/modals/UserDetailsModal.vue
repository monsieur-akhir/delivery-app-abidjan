
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal user-details-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ $t('users.details') }} - {{ user.full_name }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <!-- Informations de base -->
        <div class="user-profile-section">
          <div class="profile-header">
            <img :src="user.profile_picture || '/default-avatar.png'" :alt="user.full_name" class="profile-avatar">
            <div class="profile-info">
              <h3>{{ user.full_name }}</h3>
              <p class="user-role">{{ $t(`roles.${user.role}`) }}</p>
              <div class="status-badges">
                <span class="status-badge" :class="`status-${user.status}`">
                  {{ $t(`status.${user.status}`) }}
                </span>
                <span class="kyc-badge" :class="`kyc-${user.kyc_status}`">
                  {{ $t(`kyc.${user.kyc_status}`) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="contact-info">
            <div class="info-item">
              <i class="fas fa-phone"></i>
              <span>{{ user.phone }}</span>
            </div>
            <div class="info-item" v-if="user.email">
              <i class="fas fa-envelope"></i>
              <span>{{ user.email }}</span>
            </div>
            <div class="info-item" v-if="user.commune">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ user.commune }}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar"></i>
              <span>{{ $t('users.memberSince') }}: {{ formatDate(user.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Statistiques utilisateur -->
        <div class="stats-section">
          <h3>{{ $t('users.statistics') }}</h3>
          
          <div v-if="loadingStats" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            {{ $t('common.loading') }}
          </div>
          
          <div v-else class="stats-grid">
            <!-- Statistiques communes -->
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-box"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ userStats.total_deliveries || 0 }}</div>
                <div class="stat-label">{{ $t('stats.totalDeliveries') }}</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-star"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ userStats.average_rating || 0 }}/5</div>
                <div class="stat-label">{{ $t('stats.averageRating') }}</div>
              </div>
            </div>
            
            <!-- Statistiques spécifiques aux coursiers -->
            <div v-if="user.role === 'courier'" class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-money-bill-wave"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatCurrency(userStats.total_earnings || 0) }}</div>
                <div class="stat-label">{{ $t('stats.totalEarnings') }}</div>
              </div>
            </div>
            
            <div v-if="user.role === 'courier'" class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-route"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ userStats.distance_covered || 0 }} km</div>
                <div class="stat-label">{{ $t('stats.distanceCovered') }}</div>
              </div>
            </div>
            
            <!-- Statistiques spécifiques aux clients -->
            <div v-if="user.role === 'client'" class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-credit-card"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatCurrency(userStats.total_spent || 0) }}</div>
                <div class="stat-label">{{ $t('stats.totalSpent') }}</div>
              </div>
            </div>
            
            <!-- Statistiques spécifiques aux entreprises -->
            <div v-if="user.role === 'business'" class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatCurrency(userStats.revenue || 0) }}</div>
                <div class="stat-label">{{ $t('stats.revenue') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activité récente -->
        <div class="activity-section">
          <h3>{{ $t('users.recentActivity') }}</h3>
          
          <div v-if="loadingActivity" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            {{ $t('common.loading') }}
          </div>
          
          <div v-else-if="recentActivity.length === 0" class="no-activity">
            <i class="fas fa-history"></i>
            {{ $t('users.noRecentActivity') }}
          </div>
          
          <div v-else class="activity-list">
            <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon">
                <i :class="getActivityIcon(activity.type)"></i>
              </div>
              <div class="activity-content">
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-date">{{ formatDate(activity.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Profil spécifique au rôle -->
        <div v-if="user.role === 'courier'" class="courier-profile-section">
          <h3>{{ $t('courier.profile') }}</h3>
          
          <div v-if="courierProfile" class="courier-info">
            <div class="info-grid">
              <div class="info-item">
                <label>{{ $t('courier.vehicleType') }}</label>
                <span>{{ $t(`vehicles.${courierProfile.vehicle_type}`) }}</span>
              </div>
              <div class="info-item" v-if="courierProfile.license_plate">
                <label>{{ $t('courier.licensePlate') }}</label>
                <span>{{ courierProfile.license_plate }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('courier.availability') }}</label>
                <span :class="courierProfile.is_online ? 'text-success' : 'text-danger'">
                  {{ courierProfile.is_online ? $t('courier.online') : $t('courier.offline') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="user.role === 'business'" class="business-profile-section">
          <h3>{{ $t('business.profile') }}</h3>
          
          <div v-if="businessProfile" class="business-info">
            <div class="info-grid">
              <div class="info-item">
                <label>{{ $t('business.name') }}</label>
                <span>{{ businessProfile.business_name }}</span>
              </div>
              <div class="info-item">
                <label>{{ $t('business.type') }}</label>
                <span>{{ businessProfile.business_type }}</span>
              </div>
              <div class="info-item" v-if="businessProfile.business_description">
                <label>{{ $t('business.description') }}</label>
                <span>{{ businessProfile.business_description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <button @click="$emit('edit', user)" class="btn btn-primary">
            <i class="fas fa-edit"></i>
            {{ $t('common.edit') }}
          </button>
          
          <button v-if="user.kyc_status === 'pending'" @click="reviewKyc" class="btn btn-warning">
            <i class="fas fa-check-circle"></i>
            {{ $t('kyc.review') }}
          </button>
          
          <button @click="sendMessage" class="btn btn-info">
            <i class="fas fa-envelope"></i>
            {{ $t('users.sendMessage') }}
          </button>
          
          <button 
            @click="toggleUserStatus" 
            :class="user.status === 'suspended' ? 'btn-success' : 'btn-danger'"
            class="btn"
          >
            <i :class="user.status === 'suspended' ? 'fas fa-check' : 'fas fa-ban'"></i>
            {{ user.status === 'suspended' ? $t('users.activate') : $t('users.suspend') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import managerApi from '@/api/manager'

export default {
  name: 'UserDetailsModal',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'edit'],
  setup(props, { emit }) {
    const { showToast } = useToast()
    
    const loadingStats = ref(false)
    const loadingActivity = ref(false)
    const userStats = reactive({})
    const recentActivity = ref([])
    const courierProfile = ref(null)
    const businessProfile = ref(null)
    
    const loadUserStats = async () => {
      try {
        loadingStats.value = true
        const response = await managerApi.getUserStats(props.user.id)
        Object.assign(userStats, response.data)
      } catch (error) {
        console.error('Error loading user stats:', error)
      } finally {
        loadingStats.value = false
      }
    }
    
    const loadRecentActivity = async () => {
      try {
        loadingActivity.value = true
        const response = await managerApi.getUserActivity(props.user.id)
        recentActivity.value = response.data
      } catch (error) {
        console.error('Error loading user activity:', error)
      } finally {
        loadingActivity.value = false
      }
    }
    
    const loadRoleSpecificData = async () => {
      try {
        if (props.user.role === 'courier') {
          const response = await managerApi.getCourierProfile(props.user.id)
          courierProfile.value = response.data
        } else if (props.user.role === 'business') {
          const response = await managerApi.getBusinessProfile(props.user.id)
          businessProfile.value = response.data
        }
      } catch (error) {
        console.error('Error loading role-specific data:', error)
      }
    }
    
    const getActivityIcon = (type) => {
      const icons = {
        delivery_created: 'fas fa-plus-circle',
        delivery_completed: 'fas fa-check-circle',
        payment_made: 'fas fa-credit-card',
        kyc_submitted: 'fas fa-id-card',
        profile_updated: 'fas fa-user-edit',
        login: 'fas fa-sign-in-alt'
      }
      return icons[type] || 'fas fa-circle'
    }
    
    const reviewKyc = () => {
      // Ouvrir le modal de révision KYC
      // Cette fonctionnalité sera gérée par le composant parent
      showToast('Fonctionnalité de révision KYC à implémenter', 'info')
    }
    
    const sendMessage = () => {
      // Ouvrir le modal d'envoi de message
      showToast('Fonctionnalité d\'envoi de message à implémenter', 'info')
    }
    
    const toggleUserStatus = async () => {
      const newStatus = props.user.status === 'suspended' ? 'active' : 'suspended'
      const action = newStatus === 'suspended' ? 'suspendre' : 'activer'
      
      if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
        return
      }
      
      try {
        await managerApi.updateUserStatus(props.user.id, { status: newStatus })
        props.user.status = newStatus
        showToast(`Utilisateur ${action === 'suspendre' ? 'suspendu' : 'activé'} avec succès`, 'success')
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
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
      }).format(amount)
    }
    
    onMounted(() => {
      loadUserStats()
      loadRecentActivity()
      loadRoleSpecificData()
    })
    
    return {
      loadingStats,
      loadingActivity,
      userStats,
      recentActivity,
      courierProfile,
      businessProfile,
      getActivityIcon,
      reviewKyc,
      sendMessage,
      toggleUserStatus,
      formatDate,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.user-details-modal {
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
}

.modal-content {
  padding: 20px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.user-profile-section {
  margin-bottom: 30px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.user-role {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.status-badges {
  display: flex;
  gap: 10px;
}

.status-badge,
.kyc-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.contact-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 14px;
}

.info-item i {
  width: 16px;
  color: #2196F3;
}

.stats-section,
.activity-section,
.courier-profile-section,
.business-profile-section {
  margin-bottom: 30px;
}

.stats-section h3,
.activity-section h3,
.courier-profile-section h3,
.business-profile-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.loading,
.no-activity {
  text-align: center;
  padding: 20px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2196F3;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2196F3;
  font-size: 14px;
}

.activity-content {
  flex: 1;
}

.activity-description {
  color: #333;
  font-size: 14px;
  margin-bottom: 5px;
}

.activity-date {
  color: #666;
  font-size: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-grid .info-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.info-grid .info-item label {
  font-weight: 500;
  color: #333;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.info-grid .info-item span {
  color: #666;
  font-size: 14px;
}

.text-success {
  color: #4caf50 !important;
}

.text-danger {
  color: #f44336 !important;
}

.actions-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-info {
  background: #00bcd4;
  color: white;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}
</style>
