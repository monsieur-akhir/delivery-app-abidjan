
<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal kyc-review-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ $t('kyc.review') }} - {{ user.full_name }}</h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <!-- Informations utilisateur -->
        <div class="user-info-section">
          <div class="user-header">
            <img :src="user.profile_picture || '/default-avatar.png'" :alt="user.full_name" class="user-avatar">
            <div class="user-details">
              <h3>{{ user.full_name }}</h3>
              <p>{{ user.phone }} • {{ user.email || 'Pas d\'email' }}</p>
              <p>Rôle: {{ $t(`roles.${user.role}`) }} • Commune: {{ user.commune || 'Non spécifiée' }}</p>
            </div>
          </div>
        </div>

        <!-- Documents KYC -->
        <div class="documents-section">
          <h3>{{ $t('kyc.documents') }}</h3>
          
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            {{ $t('common.loading') }}
          </div>
          
          <div v-else-if="documents.length === 0" class="no-documents">
            <i class="fas fa-exclamation-triangle"></i>
            {{ $t('kyc.noDocuments') }}
          </div>
          
          <div v-else class="documents-grid">
            <div v-for="document in documents" :key="document.id" class="document-card">
              <div class="document-header">
                <h4>{{ $t(`kyc.documentTypes.${document.type}`) }}</h4>
                <span class="document-status" :class="`status-${document.status}`">
                  {{ $t(`kyc.documentStatus.${document.status}`) }}
                </span>
              </div>
              
              <div class="document-preview">
                <img :src="document.url" :alt="document.type" @click="openPreview(document)">
              </div>
              
              <div class="document-info">
                <p><strong>{{ $t('kyc.submittedAt') }}:</strong> {{ formatDate(document.submitted_at) }}</p>
                <p v-if="document.notes">
                  <strong>{{ $t('kyc.notes') }}:</strong> {{ document.notes }}
                </p>
              </div>
              
              <div class="document-actions">
                <button @click="approveDocument(document)" class="btn btn-success btn-sm">
                  <i class="fas fa-check"></i>
                  {{ $t('kyc.approve') }}
                </button>
                <button @click="rejectDocument(document)" class="btn btn-danger btn-sm">
                  <i class="fas fa-times"></i>
                  {{ $t('kyc.reject') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Historique des révisions -->
        <div class="history-section">
          <h3>{{ $t('kyc.history') }}</h3>
          <div class="history-timeline">
            <div v-for="entry in kycHistory" :key="entry.id" class="timeline-item">
              <div class="timeline-date">{{ formatDate(entry.created_at) }}</div>
              <div class="timeline-content">
                <strong>{{ entry.action }}</strong>
                <p v-if="entry.notes">{{ entry.notes }}</p>
                <small>Par: {{ entry.reviewer_name }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulaire de décision -->
        <div class="decision-section">
          <h3>{{ $t('kyc.decision') }}</h3>
          
          <div class="decision-form">
            <div class="form-group">
              <label>{{ $t('kyc.notes') }}</label>
              <textarea 
                v-model="reviewNotes" 
                :placeholder="$t('kyc.notesPlaceholder')"
                rows="4"
              ></textarea>
            </div>
            
            <div class="decision-actions">
              <button 
                @click="approveKyc" 
                class="btn btn-success"
                :disabled="processing"
              >
                <i class="fas fa-check"></i>
                {{ $t('kyc.approveAll') }}
              </button>
              
              <button 
                @click="rejectKyc" 
                class="btn btn-danger"
                :disabled="processing"
              >
                <i class="fas fa-times"></i>
                {{ $t('kyc.rejectAll') }}
              </button>
              
              <button 
                @click="requestMoreInfo" 
                class="btn btn-warning"
                :disabled="processing"
              >
                <i class="fas fa-info-circle"></i>
                {{ $t('kyc.requestMore') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de prévisualisation d'image -->
  <div v-if="previewDocument" class="preview-overlay" @click="closePreview">
    <div class="preview-modal" @click.stop>
      <div class="preview-header">
        <h3>{{ $t(`kyc.documentTypes.${previewDocument.type}`) }}</h3>
        <button @click="closePreview" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="preview-content">
        <img :src="previewDocument.url" :alt="previewDocument.type">
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import managerApi from '@/api/manager'

export default {
  name: 'KYCReviewModal',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'approve', 'reject'],
  setup(props, { emit }) {
    const { showToast } = useToast()
    
    const loading = ref(false)
    const processing = ref(false)
    const documents = ref([])
    const kycHistory = ref([])
    const reviewNotes = ref('')
    const previewDocument = ref(null)
    
    const loadKycData = async () => {
      try {
        loading.value = true
        
        // Charger les documents KYC
        const documentsResponse = await managerApi.getUserKycDocuments(props.user.id)
        documents.value = documentsResponse.data
        
        // Charger l'historique KYC
        const historyResponse = await managerApi.getKycHistory(props.user.id)
        kycHistory.value = historyResponse.data
        
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        loading.value = false
      }
    }
    
    const openPreview = (document) => {
      previewDocument.value = document
    }
    
    const closePreview = () => {
      previewDocument.value = null
    }
    
    const approveDocument = async (document) => {
      try {
        await managerApi.updateKycDocument(document.id, { 
          status: 'approved',
          notes: reviewNotes.value 
        })
        
        document.status = 'approved'
        showToast('Document approuvé', 'success')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const rejectDocument = async (document) => {
      if (!reviewNotes.value.trim()) {
        showToast('Veuillez ajouter une note pour le rejet', 'warning')
        return
      }
      
      try {
        await managerApi.updateKycDocument(document.id, { 
          status: 'rejected',
          notes: reviewNotes.value 
        })
        
        document.status = 'rejected'
        showToast('Document rejeté', 'success')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
    
    const approveKyc = async () => {
      try {
        processing.value = true
        
        await managerApi.updateKycStatus(props.user.id, {
          status: 'verified',
          notes: reviewNotes.value
        })
        
        showToast('KYC approuvé avec succès', 'success')
        emit('approve', props.user.id)
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        processing.value = false
      }
    }
    
    const rejectKyc = async () => {
      if (!reviewNotes.value.trim()) {
        showToast('Veuillez ajouter une raison pour le rejet', 'warning')
        return
      }
      
      try {
        processing.value = true
        
        await managerApi.updateKycStatus(props.user.id, {
          status: 'rejected',
          rejection_reason: reviewNotes.value
        })
        
        showToast('KYC rejeté', 'success')
        emit('reject', props.user.id, reviewNotes.value)
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        processing.value = false
      }
    }
    
    const requestMoreInfo = async () => {
      try {
        processing.value = true
        
        await managerApi.requestKycInfo(props.user.id, {
          message: reviewNotes.value
        })
        
        showToast('Demande d\'informations envoyée', 'success')
        emit('close')
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        processing.value = false
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
    
    onMounted(() => {
      loadKycData()
    })
    
    return {
      loading,
      processing,
      documents,
      kycHistory,
      reviewNotes,
      previewDocument,
      openPreview,
      closePreview,
      approveDocument,
      rejectDocument,
      approveKyc,
      rejectKyc,
      requestMoreInfo,
      formatDate
    }
  }
}
</script>

<style scoped>
.kyc-review-modal {
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
}

.modal-content {
  padding: 20px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.user-info-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.user-details p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.documents-section {
  margin-bottom: 30px;
}

.documents-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.loading,
.no-documents {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading i {
  margin-right: 10px;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.document-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.document-header {
  padding: 15px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-header h4 {
  margin: 0;
  color: #333;
}

.document-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending { background: #fff3e0; color: #ff9800; }
.status-approved { background: #e8f5e8; color: #4caf50; }
.status-rejected { background: #ffebee; color: #f44336; }

.document-preview {
  padding: 15px;
  text-align: center;
}

.document-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.document-preview img:hover {
  transform: scale(1.05);
}

.document-info {
  padding: 0 15px;
}

.document-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.document-actions {
  padding: 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.history-section {
  margin-bottom: 30px;
}

.history-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.history-timeline {
  border-left: 2px solid #e0e0e0;
  padding-left: 20px;
}

.timeline-item {
  margin-bottom: 20px;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2196F3;
}

.timeline-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.timeline-content {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

.timeline-content strong {
  color: #333;
}

.timeline-content small {
  color: #666;
  font-style: italic;
}

.decision-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.decision-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
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

.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.decision-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.preview-modal {
  background: white;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
}

.preview-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-content {
  padding: 20px;
  text-align: center;
}

.preview-content img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}
</style>
