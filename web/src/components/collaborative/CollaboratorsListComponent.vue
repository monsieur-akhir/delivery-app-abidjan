<template>
  <div class="collaborators-list">
    <div class="header">
      <h3>Collaborateurs ({{ collaborators.length }}/{{ maxCollaborators }})</h3>
      <div class="actions">
        <button v-if="canInvite" class="btn-outline" @click="showInviteModal = true">
          <i class="fas fa-user-plus"></i> Inviter
        </button>
        <button class="btn-outline" @click="refreshList">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des collaborateurs...</p>
    </div>

    <div v-else-if="collaborators.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-users"></i>
      </div>
      <h4>Aucun collaborateur</h4>
      <p>Cette livraison n'a pas encore de collaborateurs.</p>
      <button v-if="canInvite" class="btn-primary" @click="showInviteModal = true">
        <i class="fas fa-user-plus"></i> Inviter le premier collaborateur
      </button>
    </div>

    <div v-else class="collaborators-grid">
      <div
            v-for="(collaborator, index) in collaborators"
            :key="index"
            class="collaborator-card"
          >
        <div class="collaborator-header">
          <div class="avatar-section">
            <img
              v-if="collaborator.avatar"
              :src="collaborator.avatar"
              :alt="collaborator.name"
              class="avatar"
            />
            <div v-else class="avatar-fallback">
              {{ getInitials(collaborator.name) }}
            </div>
            <div class="role-badge" :class="getRoleClass(collaborator.role)">
              {{ formatRole(collaborator.role) }}
            </div>
          </div>
          <div class="collaborator-info">
            <h4 class="name">{{ collaborator.name }}</h4>
            <div class="details">
              <span class="rating">
                <i class="fas fa-star"></i> {{ collaborator.rating || 'N/A' }}
              </span>
              <span class="deliveries"> {{ collaborator.totalDeliveries || 0 }} livraisons </span>
            </div>
          </div>
          <div class="status-section">
            <span class="status-badge" :class="getStatusClass(collaborator.status)">
              {{ formatStatus(collaborator.status) }}
            </span>
          </div>
        </div>

        <div class="collaborator-body">
          <div class="share-section">
            <label>Part des gains</label>
            <div class="share-input-group">
              <input
                v-model.number="collaborator.sharePercentage"
                type="number"
                min="0"
                max="100"
                :disabled="!canEditShare(collaborator)"
                @change="updateShare(collaborator)"
                class="share-input"
              />
              <span class="share-unit">%</span>
            </div>
            <div class="estimated-earnings">
              Gains estimés: {{ formatCurrency(calculateEarnings(collaborator)) }}
            </div>
          </div>

          <div class="timeline-section">
            <div class="timeline-item" v-if="collaborator.joinedAt">
              <i class="fas fa-clock"></i>
              <span>Rejoint le {{ formatDateTime(collaborator.joinedAt) }}</span>
            </div>
            <div class="timeline-item" v-if="collaborator.acceptedAt">
              <i class="fas fa-check"></i>
              <span>Accepté le {{ formatDateTime(collaborator.acceptedAt) }}</span>
            </div>
            <div class="timeline-item" v-if="collaborator.startedAt">
              <i class="fas fa-play"></i>
              <span>Commencé le {{ formatDateTime(collaborator.startedAt) }}</span>
            </div>
            <div class="timeline-item" v-if="collaborator.completedAt">
              <i class="fas fa-flag-checkered"></i>
              <span>Terminé le {{ formatDateTime(collaborator.completedAt) }}</span>
            </div>
          </div>

          <div v-if="collaborator.notes" class="notes-section">
            <label>Notes</label>
            <p class="notes">{{ collaborator.notes }}</p>
          </div>
        </div>

        <div class="collaborator-actions">
          <button
            v-if="canApprove(collaborator)"
            class="action-btn approve-btn"
            @click="approveCollaborator(collaborator)"
            :disabled="processing"
          >
            <i class="fas fa-check"></i> Approuver
          </button>

          <button
            v-if="canReject(collaborator)"
            class="action-btn reject-btn"
            @click="rejectCollaborator(collaborator)"
            :disabled="processing"
          >
            <i class="fas fa-times"></i> Rejeter
          </button>

          <button
            v-if="canRemove(collaborator)"
            class="action-btn remove-btn"
            @click="removeCollaborator(collaborator)"
            :disabled="processing"
          >
            <i class="fas fa-user-minus"></i> Retirer
          </button>

          <button class="action-btn message-btn" @click="messageCollaborator(collaborator)">
            <i class="fas fa-comment"></i> Message
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'invitation -->
    <Modal v-if="showInviteModal" @close="showInviteModal = false" title="Inviter un collaborateur">
      <div class="invite-form">
        <div class="form-group">
          <label for="invite-email">Email du coursier</label>
          <input
            id="invite-email"
            v-model="inviteForm.email"
            type="email"
            placeholder="email@exemple.com"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="invite-role">Rôle proposé</label>
          <select id="invite-role" v-model="inviteForm.role" class="form-control">
            <option value="secondary">Secondaire</option>
            <option value="support">Support</option>
            <option value="primary" v-if="!hasPrimaryCollaborator">Principal</option>
          </select>
        </div>

        <div class="form-group">
          <label for="invite-share">Part proposée (%)</label>
          <input
            id="invite-share"
            v-model.number="inviteForm.sharePercentage"
            type="number"
            min="0"
            max="100"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="invite-message">Message (optionnel)</label>
          <textarea
            id="invite-message"
            v-model="inviteForm.message"
            placeholder="Message d'invitation..."
            class="form-control"
            rows="3"
          ></textarea>
        </div>

        <div class="form-actions">
          <button @click="sendInvitation" :disabled="!canSendInvite" class="btn-primary">
            <i class="fas fa-paper-plane"></i> Envoyer l'invitation
          </button>
          <button @click="showInviteModal = false" class="btn-outline">Annuler</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import collaborativeApi from '@/api/collaborative'
import Modal from '@/components/ui/Modal.vue'

export default {
  name: 'CollaboratorsListComponent',

  components: {
    Modal,
  },

  props: {
    deliveryId: {
      type: String,
      required: true,
    },
    deliveryPrice: {
      type: Number,
      required: true,
    },
    maxCollaborators: {
      type: Number,
      default: 3,
    },
    canManage: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['collaborator-updated', 'collaborator-removed'],

  setup(props, { emit }) {
    const { showToast } = useToast()

    const collaborators = ref([])
    const loading = ref(true)
    const processing = ref(false)
    const showInviteModal = ref(false)

    const inviteForm = ref({
      email: '',
      role: 'secondary',
      sharePercentage: 20,
      message: '',
    })

    const canInvite = computed(() => {
      return props.canManage && collaborators.value.length < props.maxCollaborators
    })

    const hasPrimaryCollaborator = computed(() => {
      return collaborators.value.some(c => c.role === 'primary')
    })

    const canSendInvite = computed(() => {
      return (
        inviteForm.value.email &&
        inviteForm.value.role &&
        inviteForm.value.sharePercentage > 0 &&
        inviteForm.value.sharePercentage <= 100
      )
    })

    const fetchCollaborators = async () => {
      try {
        loading.value = true
        const response = await collaborativeApi.getCollaborators(props.deliveryId)
        collaborators.value = response
      } catch (error) {
        console.error('Erreur lors du chargement des collaborateurs:', error)
        showToast('Erreur lors du chargement des collaborateurs', 'error')
      } finally {
        loading.value = false
      }
    }

    const refreshList = () => {
      fetchCollaborators()
    }

    const getInitials = name => {
      if (!name) return '?'
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }

    const formatRole = role => {
      switch (role) {
        case 'primary':
          return 'Principal'
        case 'secondary':
          return 'Secondaire'
        case 'support':
          return 'Support'
        default:
          return role
      }
    }

    const getRoleClass = role => {
      return `role-${role}`
    }

    const formatStatus = status => {
      switch (status) {
        case 'pending':
          return 'En attente'
        case 'accepted':
          return 'Accepté'
        case 'rejected':
          return 'Rejeté'
        case 'in_progress':
          return 'En cours'
        case 'completed':
          return 'Terminé'
        case 'cancelled':
          return 'Annulé'
        default:
          return status
      }
    }

    const getStatusClass = status => {
      return `status-${status}`
    }

    const formatDateTime = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const formatCurrency = amount => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    const calculateEarnings = collaborator => {
      const platformFee = props.deliveryPrice * 0.1
      const distributableAmount = props.deliveryPrice - platformFee
      return distributableAmount * (collaborator.sharePercentage / 100)
    }

    const canEditShare = collaborator => {
      return props.canManage && ['pending', 'accepted'].includes(collaborator.status)
    }

    const canApprove = collaborator => {
      return props.canManage && collaborator.status === 'pending'
    }

    const canReject = collaborator => {
      return props.canManage && collaborator.status === 'pending'
    }

    const canRemove = collaborator => {
      return props.canManage && ['pending', 'accepted'].includes(collaborator.status)
    }

    const updateShare = async collaborator => {
      try {
        processing.value = true
        await collaborativeApi.updateCollaboratorShare(
          props.deliveryId,
          collaborator.id,
          collaborator.sharePercentage
        )
        showToast('Part mise à jour avec succès', 'success')
        emit('collaborator-updated', collaborator)
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la part:', error)
        showToast('Erreur lors de la mise à jour de la part', 'error')
        await fetchCollaborators() // Recharger pour annuler les changements
      } finally {
        processing.value = false
      }
    }

    const approveCollaborator = async collaborator => {
      try {
        processing.value = true
        await collaborativeApi.updateCollaboratorStatus(
          props.deliveryId,
          collaborator.id,
          'accepted'
        )
        showToast('Collaborateur approuvé avec succès', 'success')
        await fetchCollaborators()
        emit('collaborator-updated', collaborator)
      } catch (error) {
        console.error("Erreur lors de l'approbation:", error)
        showToast("Erreur lors de l'approbation du collaborateur", 'error')
      } finally {
        processing.value = false
      }
    }

    const rejectCollaborator = async collaborator => {
      try {
        processing.value = true
        await collaborativeApi.updateCollaboratorStatus(
          props.deliveryId,
          collaborator.id,
          'rejected'
        )
        showToast('Collaborateur rejeté', 'success')
        await fetchCollaborators()
        emit('collaborator-updated', collaborator)
      } catch (error) {
        console.error('Erreur lors du rejet:', error)
        showToast('Erreur lors du rejet du collaborateur', 'error')
      } finally {
        processing.value = false
      }
    }

    const removeCollaborator = async collaborator => {
      if (!confirm('Êtes-vous sûr de vouloir retirer ce collaborateur ?')) {
        return
      }

      try {
        processing.value = true
        await collaborativeApi.removeCollaborator(props.deliveryId, collaborator.id)
        showToast('Collaborateur retiré avec succès', 'success')
        await fetchCollaborators()
        emit('collaborator-removed', collaborator)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        showToast('Erreur lors de la suppression du collaborateur', 'error')
      } finally {
        processing.value = false
      }
    }

    const messageCollaborator = collaborator => {
      // Ouvrir le chat ou rediriger vers la messagerie
      showToast('Fonctionnalité de messagerie à implémenter', 'info')
    }

    const sendInvitation = async () => {
      try {
        processing.value = true
        await collaborativeApi.inviteCollaborator(props.deliveryId, inviteForm.value)
        showToast('Invitation envoyée avec succès', 'success')
        showInviteModal.value = false

        // Réinitialiser le formulaire
        inviteForm.value = {
          email: '',
          role: 'secondary',
          sharePercentage: 20,
          message: '',
        }

        await fetchCollaborators()
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'invitation:", error)
        showToast("Erreur lors de l'envoi de l'invitation", 'error')
      } finally {
        processing.value = false
      }
    }

    onMounted(() => {
      fetchCollaborators()
    })

    return {
      collaborators,
      loading,
      processing,
      showInviteModal,
      inviteForm,
      canInvite,
      hasPrimaryCollaborator,
      canSendInvite,
      refreshList,
      getInitials,
      formatRole,
      getRoleClass,
      formatStatus,
      getStatusClass,
      formatDateTime,
      formatCurrency,
      calculateEarnings,
      canEditShare,
      canApprove,
      canReject,
      canRemove,
      updateShare,
      approveCollaborator,
      rejectCollaborator,
      removeCollaborator,
      messageCollaborator,
      sendInvitation,
    }
  },
}
</script>

<style scoped>
.collaborators-list {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-outline {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-outline i {
  margin-right: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
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

.collaborators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.collaborator-card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.collaborator-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.avatar-section {
  position: relative;
  margin-right: 12px;
}

.avatar,
.avatar-fallback {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.avatar-fallback {
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.role-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  color: white;
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

.collaborator-info {
  flex: 1;
}

.name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.rating {
  display: flex;
  align-items: center;
}

.rating i {
  color: #f59e0b;
  margin-right: 2px;
}

.status-section {
  margin-left: 12px;
}

.status-badge {
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
  background-color: #d1fae5;
  color: #059669;
}

.status-rejected {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-in_progress {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-completed {
  background-color: #d1fae5;
  color: #059669;
}

.collaborator-body {
  margin-bottom: 16px;
}

.share-section {
  margin-bottom: 16px;
}

.share-section label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.share-input-group {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.share-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.share-unit {
  margin-left: 4px;
  font-size: 14px;
  color: #6b7280;
}

.estimated-earnings {
  font-size: 12px;
  color: #059669;
  font-weight: 500;
}

.timeline-section {
  margin-bottom: 16px;
}

.timeline-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.timeline-item i {
  width: 12px;
  margin-right: 8px;
}

.notes-section label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.notes {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  padding: 8px;
  background-color: #f9fafb;
  border-radius: 4px;
}

.collaborator-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: white;
}

.action-btn i {
  margin-right: 4px;
}

.approve-btn {
  background-color: #10b981;
}

.reject-btn {
  background-color: #ef4444;
}

.remove-btn {
  background-color: #f59e0b;
}

.message-btn {
  background-color: #6b7280;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.invite-form {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>