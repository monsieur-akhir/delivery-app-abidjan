<template>
  <div class="delivery-list">
    <div v-if="deliveries.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-box-open"></i>
      </div>
      <h3>Aucune livraison collaborative</h3>
      <p>Il n'y a actuellement aucune livraison collaborative disponible.</p>
      <button class="btn-primary" @click="$emit('create-delivery')">
        <i class="fas fa-plus"></i> Créer une livraison
      </button>
    </div>
    
    <div v-else class="table-responsive">
      <table class="deliveries-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Trajet</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Prix</th>
            <th>Collaborateurs</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="delivery in deliveries" :key="delivery.id" :class="getRowClass(delivery)">
            <td class="id-cell">
              <span class="delivery-id">{{ formatId(delivery.id) }}</span>
            </td>
            <td class="route-cell">
              <div class="route">
                <div class="commune">{{ delivery.pickupCommune }}</div>
                <div class="arrow">
                  <i class="fas fa-long-arrow-alt-right"></i>
                </div>
                <div class="commune">{{ delivery.deliveryCommune }}</div>
              </div>
              <div class="distance">{{ delivery.distance }} km</div>
            </td>
            <td class="date-cell">
              <div class="date">{{ formatDate(delivery.createdAt) }}</div>
              <div class="time">{{ formatTime(delivery.createdAt) }}</div>
            </td>
            <td class="status-cell">
              <span :class="['status-badge', getStatusClass(delivery.status)]">
                {{ formatStatus(delivery.status) }}
              </span>
            </td>
            <td class="price-cell">
              <div class="price">{{ formatCurrency(delivery.proposedPrice) }}</div>
              <div v-if="delivery.finalPrice && delivery.finalPrice !== delivery.proposedPrice" class="final-price">
                {{ formatCurrency(delivery.finalPrice) }}
              </div>
            </td>
            <td class="collaborators-cell">
              <div class="collaborators">
                <div class="collaborator-count">
                  <i class="fas fa-users"></i> {{ delivery.collaborators ? delivery.collaborators.length : 0 }}/{{ delivery.maxCollaborators || 3 }}
                </div>
                <div class="collaborator-avatars">
                  <div v-for="(collaborator, index) in limitedCollaborators(delivery)" :key="index" class="avatar-wrapper">
                    <img v-if="collaborator.avatar" :src="collaborator.avatar" :alt="collaborator.name" class="avatar" />
                    <div v-else class="avatar-fallback">
                      {{ getInitials(collaborator.name) }}
                    </div>
                    <div class="role-indicator" :class="getRoleClass(collaborator.role)"></div>
                  </div>
                  <div v-if="hasMoreCollaborators(delivery)" class="more-collaborators">
                    +{{ delivery.collaborators.length - 3 }}
                  </div>
                </div>
              </div>
            </td>
            <td class="actions-cell">
              <div class="actions">
                <button class="action-btn view-btn" @click="$emit('view-delivery', delivery)" title="Voir les détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  v-if="canEdit(delivery)" 
                  class="action-btn edit-btn" 
                  @click="$emit('edit-delivery', delivery)" 
                  title="Modifier"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="canJoin(delivery)" 
                  class="action-btn join-btn" 
                  @click="$emit('join-delivery', delivery)" 
                  title="Rejoindre"
                >
                  <i class="fas fa-sign-in-alt"></i>
                </button>
                <button 
                  v-if="canCancel(delivery)" 
                  class="action-btn cancel-btn" 
                  @click="$emit('cancel-delivery', delivery)" 
                  title="Annuler"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollaborativeDeliveryList',
  
  props: {
    deliveries: {
      type: Array,
      required: true
    },
    userRole: {
      type: String,
      default: 'manager'
    }
  },
  
  emits: ['view-delivery', 'edit-delivery', 'join-delivery', 'cancel-delivery', 'create-delivery'],
  
  methods: {
    formatId(id) {
      return id.substring(0, 8)
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    
    formatTime(dateString) {
      const date = new Date(dateString)
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    formatStatus(status) {
      switch (status) {
        case 'pending':
          return 'En attente'
        case 'accepted':
          return 'Acceptée'
        case 'in_progress':
          return 'En cours'
        case 'completed':
          return 'Terminée'
        case 'cancelled':
          return 'Annulée'
        default:
          return status
      }
    },
    
    getStatusClass(status) {
      switch (status) {
        case 'pending':
          return 'status-pending'
        case 'accepted':
          return 'status-accepted'
        case 'in_progress':
          return 'status-in-progress'
        case 'completed':
          return 'status-completed'
        case 'cancelled':
          return 'status-cancelled'
        default:
          return ''
      }
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount)
    },
    
    limitedCollaborators(delivery) {
      if (!delivery.collaborators || delivery.collaborators.length === 0) {
        return []
      }
      return delivery.collaborators.slice(0, 3)
    },
    
    hasMoreCollaborators(delivery) {
      return delivery.collaborators && delivery.collaborators.length > 3
    },
    
    getInitials(name) {
      if (!name) return '?'
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    },
    
    getRoleClass(role) {
      switch (role) {
        case 'primary':
          return 'role-primary'
        case 'secondary':
          return 'role-secondary'
        case 'support':
          return 'role-support'
        default:
          return ''
      }
    },
    
    getRowClass(delivery) {
      return {
        'cancelled-row': delivery.status === 'cancelled',
        'completed-row': delivery.status === 'completed',
        'in-progress-row': delivery.status === 'in_progress',
        'accepted-row': delivery.status === 'accepted'
      }
    },
    
    canEdit(delivery) {
      // Seuls les livraisons en attente ou acceptées peuvent être modifiées
      return ['pending', 'accepted'].includes(delivery.status)
    },
    
    canJoin(delivery) {
      // On peut rejoindre une livraison en attente ou acceptée si elle n'a pas atteint le nombre max de collaborateurs
      return ['pending', 'accepted'].includes(delivery.status) && 
             (!delivery.collaborators || delivery.collaborators.length < (delivery.maxCollaborators || 3))
    },
    
    canCancel(delivery) {
      // On peut annuler une livraison en attente, acceptée ou en cours
      return ['pending', 'accepted', 'in_progress'].includes(delivery.status)
    }
  }
}
</script>

<style scoped>
.delivery-list {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-primary i {
  margin-right: 8px;
}

.table-responsive {
  overflow-x: auto;
}

.deliveries-table {
  width: 100%;
  border-collapse: collapse;
}

.deliveries-table th,
.deliveries-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.deliveries-table th {
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
}

.id-cell {
  font-family: monospace;
  font-weight: 600;
}

.route-cell {
  min-width: 200px;
}

.route {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.commune {
  font-weight: 500;
}

.arrow {
  margin: 0 8px;
  color: #6b7280;
}

.distance {
  font-size: 12px;
  color: #6b7280;
}

.date-cell {
  min-width: 120px;
}

.date {
  font-weight: 500;
  margin-bottom: 4px;
}

.time {
  font-size: 12px;
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-accepted {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-in-progress {
  background-color: #e0f2fe;
  color: #0284c7;
}

.status-completed {
  background-color: #d1fae5;
  color: #059669;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #dc2626;
}

.price-cell {
  min-width: 100px;
}

.price {
  font-weight: 500;
}

.final-price {
  font-size: 12px;
  color: #059669;
  margin-top: 4px;
}

.collaborators-cell {
  min-width: 150px;
}

.collaborator-count {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.collaborator-avatars {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-right: -8px;
}

.avatar,
.avatar-fallback {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid white;
}

.avatar-fallback {
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.role-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid white;
}

.role-primary {
  background-color: #3b82f6;
}

.role-secondary {
  background-color: #10b981;
}

.role-support {
  background-color: #f59e0b;
}

.more-collaborators {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid white;
}

.actions-cell {
  min-width: 120px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.view-btn {
  background-color: #6b7280;
}

.edit-btn {
  background-color: #3b82f6;
}

.join-btn {
  background-color: #10b981;
}

.cancel-btn {
  background-color: #ef4444;
}

.cancelled-row {
  background-color: #fef2f2;
}

.completed-row {
  background-color: #f0fdf4;
}

.in-progress-row {
  background-color: #f0f9ff;
}

.accepted-row {
  background-color: #eff6ff;
}
</style>
