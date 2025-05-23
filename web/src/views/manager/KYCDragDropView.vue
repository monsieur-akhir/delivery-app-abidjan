<template>
  <div class="kyc-drag-drop-view">
    <div class="page-header">
      <h1>Validation KYC par Drag-and-Drop</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
      </div>
    </div>

    <div class="kyc-stats">
      <div class="stat-card bg-primary">
        <div class="stat-icon">
          <font-awesome-icon icon="user-clock" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingVerifications }}</div>
          <div class="stat-label">En attente</div>
        </div>
      </div>
      <div class="stat-card bg-success">
        <div class="stat-icon">
          <font-awesome-icon icon="user-check" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.verifiedToday }}</div>
          <div class="stat-label">Vérifiés aujourd'hui</div>
        </div>
      </div>
      <div class="stat-card bg-warning">
        <div class="stat-icon">
          <font-awesome-icon icon="user-times" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.rejectedToday }}</div>
          <div class="stat-label">Rejetés aujourd'hui</div>
        </div>
      </div>
      <div class="stat-card bg-info">
        <div class="stat-icon">
          <font-awesome-icon icon="chart-line" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.averageVerificationTime }}min</div>
          <div class="stat-label">Temps moyen</div>
        </div>
      </div>
    </div>

    <div class="kyc-container">
      <div class="kyc-pending-container">
        <div class="kyc-section-header">
          <h2>Documents en attente</h2>
          <div class="kyc-filters">
            <select v-model="filters.documentType" @change="applyFilters">
              <option value="">Tous les types</option>
              <option value="id_card">Carte d'identité</option>
              <option value="passport">Passeport</option>
              <option value="driving_license">Permis de conduire</option>
              <option value="business_registration">Registre de commerce</option>
            </select>
            <select v-model="filters.userType" @change="applyFilters">
              <option value="">Tous les utilisateurs</option>
              <option value="courier">Coursiers</option>
              <option value="client">Clients</option>
              <option value="business">Entreprises</option>
            </select>
            <div class="search-input">
              <input 
                type="text" 
                v-model="filters.search" 
                placeholder="Rechercher..." 
                @input="debounceSearch"
              />
              <font-awesome-icon icon="search" />
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <font-awesome-icon icon="spinner" spin size="2x" />
          <p>Chargement des documents...</p>
        </div>
        <div v-else-if="pendingDocuments.length === 0" class="empty-state">
          <font-awesome-icon icon="check-circle" size="2x" />
          <p>Aucun document en attente de vérification</p>
        </div>
        <div v-else class="kyc-documents-grid">
          <div 
            v-for="document in pendingDocuments" 
            :key="document.id"
            class="kyc-document-card"
            draggable="true"
            @dragstart="startDrag($event, document)"
          >
            <div class="document-header">
              <div class="document-type" :class="getDocumentTypeClass(document.type)">
                {{ getDocumentTypeLabel(document.type) }}
              </div>
              <div class="document-date">{{ formatDate(document.submitted_at) }}</div>
            </div>
            <div class="document-preview">
              <img :src="document.preview_url" :alt="document.type" />
            </div>
            <div class="document-info">
              <div class="user-info">
                <div class="user-avatar">
                  <img v-if="document.user.profile_picture" :src="document.user.profile_picture" :alt="document.user.name" />
                  <div v-else class="avatar-placeholder">{{ getInitials(document.user.name) }}</div>
                </div>
                <div class="user-details">
                  <div class="user-name">{{ document.user.name }}</div>
                  <div class="user-role" :class="getRoleClass(document.user.role)">
                    {{ getRoleLabel(document.user.role) }}
                  </div>
                </div>
              </div>
              <div class="document-actions">
                <button class="btn btn-sm btn-primary" @click="viewDocument(document.id)">
                  <font-awesome-icon icon="eye" class="mr-1" />
                  Voir
                </button>
                <button class="btn btn-sm btn-success" @click="approveDocument(document.id)">
                  <font-awesome-icon icon="check" class="mr-1" />
                  Approuver
                </button>
                <button class="btn btn-sm btn-danger" @click="showRejectModal(document.id)">
                  <font-awesome-icon icon="times" class="mr-1" />
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="kyc-drop-zones">
        <div 
          class="kyc-drop-zone approve-zone"
          @dragover.prevent
          @drop="onDrop($event, 'approve')"
        >
          <div class="drop-zone-icon">
            <font-awesome-icon icon="check-circle" size="2x" />
          </div>
          <div class="drop-zone-label">Déposer pour approuver</div>
          <div class="drop-zone-counter">{{ stats.verifiedToday }} aujourd'hui</div>
        </div>
        
        <div 
          class="kyc-drop-zone reject-zone"
          @dragover.prevent
          @drop="onDrop($event, 'reject')"
        >
          <div class="drop-zone-icon">
            <font-awesome-icon icon="times-circle" size="2x" />
          </div>
          <div class="drop-zone-label">Déposer pour rejeter</div>
          <div class="drop-zone-counter">{{ stats.rejectedToday }} aujourd'hui</div>
        </div>
        
        <div 
          class="kyc-drop-zone review-zone"
          @dragover.prevent
          @drop="onDrop($event, 'review')"
        >
          <div class="drop-zone-icon">
            <font-awesome-icon icon="search-plus" size="2x" />
          </div>
          <div class="drop-zone-label">Déposer pour examiner</div>
        </div>
      </div>
    </div>

    <!-- Modal de rejet de document -->
    <div class="modal" v-if="showRejectDocumentModal">
      <div class="modal-backdrop" @click="closeRejectModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Rejeter le document</h3>
          <button class="modal-close" @click="closeRejectModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="rejection-reason">Raison du rejet</label>
            <select id="rejection-reason" v-model="rejectionReason" class="form-control">
              <option value="blurry_image">Image floue</option>
              <option value="incomplete_document">Document incomplet</option>
              <option value="expired_document">Document expiré</option>
              <option value="wrong_document">Mauvais document</option>
              <option value="suspicious_document">Document suspect</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="form-group" v-if="rejectionReason === 'other'">
            <label for="custom-rejection-reason">Raison personnalisée</label>
            <input id="custom-rejection-reason" v-model="customRejectionReason" class="form-control" />
          </div>
          <div class="form-group">
            <label for="rejection-details">Détails</label>
            <textarea id="rejection-details" v-model="rejectionDetails" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="sendRejectionNotification" />
              Envoyer une notification
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="allowResubmission" />
              Autoriser une nouvelle soumission
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRejectModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmReject" :disabled="!isValidRejectionReason">
            <font-awesome-icon icon="save" class="mr-1" />
            Confirmer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de visualisation de document -->
    <div class="modal" v-if="showDocumentViewModal">
      <div class="modal-backdrop" @click="closeDocumentViewModal"></div>
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>{{ selectedDocument ? getDocumentTypeLabel(selectedDocument.type) : 'Document' }}</h3>
          <button class="modal-close" @click="closeDocumentViewModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="!selectedDocument" class="loading-state">
            <font-awesome-icon icon="spinner" spin size="2x" />
            <p>Chargement du document...</p>
          </div>
          <div v-else class="document-view">
            <div class="document-view-header">
              <div class="user-info">
                <div class="user-avatar">
                  <img v-if="selectedDocument.user.profile_picture" :src="selectedDocument.user.profile_picture" :alt="selectedDocument.user.name" />
                  <div v-else class="avatar-placeholder">{{ getInitials(selectedDocument.user.name) }}</div>
                </div>
                <div class="user-details">
                  <div class="user-name">{{ selectedDocument.user.name }}</div>
                  <div class="user-meta">
                    <span class="user-role" :class="getRoleClass(selectedDocument.user.role)">
                      {{ getRoleLabel(selectedDocument.user.role) }}
                    </span>
                    <span class="user-id">ID: {{ selectedDocument.user.id }}</span>
                  </div>
                </div>
              </div>
              <div class="document-meta">
                <div class="meta-item">
                  <div class="meta-label">Soumis le</div>
                  <div class="meta-value">{{ formatDate(selectedDocument.submitted_at) }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Type</div>
                  <div class="meta-value">{{ getDocumentTypeLabel(selectedDocument.type) }}</div>
                </div>
              </div>
            </div>
            
            <div class="document-image-container">
              <img 
                :src="selectedDocument.full_url" 
                :alt="selectedDocument.type" 
                class="document-image" 
                :style="{ transform: `scale(${zoomLevel})` }"
              />
              
              <div class="document-zoom-controls">
                <button class="btn btn-sm btn-outline" @click="zoomOut">
                  <font-awesome-icon icon="search-minus" />
                </button>
                <button class="btn btn-sm btn-outline" @click="resetZoom">
                  <font-awesome-icon icon="sync" />
                </button>
                <button class="btn btn-sm btn-outline" @click="zoomIn">
                  <font-awesome-icon icon="search-plus" />
                </button>
              </div>
            </div>
            
            <div class="document-verification-tools">
              <div class="verification-section">
                <h4>Vérification d'identité</h4>
                <div class="verification-fields">
                  <div class="verification-field">
                    <label>Nom complet</label>
                    <input type="text" v-model="verificationData.fullName" class="form-control" />
                  </div>
                  <div class="verification-field">
                    <label>Numéro de document</label>
                    <input type="text" v-model="verificationData.documentNumber" class="form-control" />
                  </div>
                  <div class="verification-field">
                    <label>Date d'expiration</label>
                    <input type="date" v-model="verificationData.expiryDate" class="form-control" />
                  </div>
                </div>
              </div>
              
              <div class="verification-section">
                <h4>Notes de vérification</h4>
                <textarea 
                  v-model="verificationData.notes" 
                  class="form-control" 
                  rows="3"
                  placeholder="Ajouter des notes sur la vérification..."
                ></textarea>
              </div>
              
              <div class="verification-actions">
                <button class="btn btn-success" @click="approveDocument(selectedDocument.id)">
                  <font-awesome-icon icon="check" class="mr-1" />
                  Approuver
                </button>
                <button class="btn btn-danger" @click="showRejectModal(selectedDocument.id)">
                  <font-awesome-icon icon="times" class="mr-1" />
                  Rejeter
                </button>
                <button class="btn btn-info" @click="saveVerificationData">
                  <font-awesome-icon icon="save" class="mr-1" />
                  Enregistrer les données
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { formatDate, getInitials } from '@/utils/formatters'

export default {
  name: 'KYCDragDropView',
  setup() {
    // État
    const loading = ref(true)
    const pendingDocuments = ref([])
    const showRejectDocumentModal = ref(false)
    const showDocumentViewModal = ref(false)
    const selectedDocumentId = ref(null)
    const selectedDocument = ref(null)
    const rejectionReason = ref('blurry_image')
    const customRejectionReason = ref('')
    const rejectionDetails = ref('')
    const sendRejectionNotification = ref(true)
    const allowResubmission = ref(true)
    const zoomLevel = ref(1)
    
    const verificationData = reactive({
      fullName: '',
      documentNumber: '',
      expiryDate: '',
      notes: ''
    })
    
    const stats = reactive({
      pendingVerifications: 15,
      verifiedToday: 8,
      rejectedToday: 3,
      averageVerificationTime: 4
    })
    
    const filters = reactive({
      documentType: '',
      userType: '',
      search: ''
    })
    
    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        // Simuler l'appel API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Données fictives pour la démonstration
        pendingDocuments.value = [
          {
            id: 1,
            type: 'id_card',
            submitted_at: new Date(2023, 4, 15),
            preview_url: '/placeholder.svg?height=200&width=320&query=ID%20Card',
            full_url: '/placeholder.svg?height=800&width=1200&query=ID%20Card%20Full%20Size',
            user: {
              id: 101,
              name: 'Amadou Koné',
              role: 'courier',
              profile_picture: null
            }
          },
          {
            id: 2,
            type: 'driving_license',
            submitted_at: new Date(2023, 4, 16),
            preview_url: '/placeholder.svg?height=200&width=320&query=Driving%20License',
            full_url: '/placeholder.svg?height=800&width=1200&query=Driving%20License%20Full%20Size',
            user: {
              id: 102,
              name: 'Marie Kouassi',
              role: 'courier',
              profile_picture: null
            }
          },
          {
            id: 3,
            type: 'passport',
            submitted_at: new Date(2023, 4, 14),
            preview_url: '/placeholder.svg?height=200&width=320&query=Passport',
            full_url: '/placeholder.svg?height=800&width=1200&query=Passport%20Full%20Size',
            user: {
              id: 103,
              name: 'Ibrahim Diallo',
              role: 'client',
              profile_picture: null
            }
          },
          {
            id: 4,
            type: 'business_registration',
            submitted_at: new Date(2023, 4, 13),
            preview_url: '/placeholder.svg?height=200&width=320&query=Business%20Registration',
            full_url: '/placeholder.svg?height=800&width=1200&query=Business%20Registration%20Full%20Size',
            user: {
              id: 104,
              name: 'Café Abidjan',
              role: 'business',
              profile_picture: null
            }
          }
        ]
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error)
      } finally {
        loading.value = false
      }
    }
    
    const refreshData = () => {
      fetchData()
    }
    
    const applyFilters = () => {
      console.log('Filtres appliqués:', filters)
      
      // Simuler le chargement des données filtrées
      loading.value = true
      setTimeout(() => {
        loading.value = false
      }, 500)
    }
    
    const debounceSearch = () => {
      // Implémenter un debounce pour la recherche
      clearTimeout(window.searchTimeout)
      window.searchTimeout = setTimeout(() => {
        applyFilters()
      }, 300)
    }
    
    const startDrag = (event, document) => {
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('documentId', document.id.toString())
    }
    
    const onDrop = async (event, action) => {
      const documentId = parseInt(event.dataTransfer.getData('documentId'))
      console.log(`Document ${documentId} déposé dans la zone ${action}`)
      
      if (action === 'approve') {
        await approveDocument(documentId)
      } else if (action === 'reject') {
        showRejectModal(documentId)
      } else if (action === 'review') {
        viewDocument(documentId)
      }
    }
    
    const viewDocument = async (documentId) => {
      selectedDocumentId.value = documentId
      selectedDocument.value = null
      showDocumentViewModal.value = true
      
      // Réinitialiser le zoom
      zoomLevel.value = 1
      
      // Simuler le chargement du document
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Trouver le document
      const document = pendingDocuments.value.find(doc => doc.id === documentId)
      if (document) {
        selectedDocument.value = document
        
        // Pré-remplir les données de vérification (simulé)
        verificationData.fullName = document.user.name
        verificationData.documentNumber = `DOC-${Math.floor(Math.random() * 1000000)}`
        verificationData.expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0]
        verificationData.notes = ''
      }
    }
    
    const closeDocumentViewModal = () => {
      showDocumentViewModal.value = false
      selectedDocument.value = null
      selectedDocumentId.value = null
    }
    
    const zoomIn = () => {
      zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3)
    }
    
    const zoomOut = () => {
      zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.5)
    }
    
    const resetZoom = () => {
      zoomLevel.value = 1
    }
    
    const saveVerificationData = async () => {
      console.log('Enregistrement des données de vérification:', verificationData)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Afficher une notification de succès
      alert('Données de vérification enregistrées avec succès')
    }
    
    const approveDocument = async (documentId) => {
      console.log(`Approbation du document ${documentId}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      pendingDocuments.value = pendingDocuments.value.filter(doc => doc.id !== documentId)
      stats.pendingVerifications--
      stats.verifiedToday++
      
      // Fermer le modal de visualisation si ouvert
      if (showDocumentViewModal.value) {
        closeDocumentViewModal()
      }
      
      // Afficher une notification de succès
      alert(`Document #${documentId} approuvé avec succès`)
    }
    
    const showRejectModal = (documentId) => {
      selectedDocumentId.value = documentId
      rejectionReason.value = 'blurry_image'
      customRejectionReason.value = ''
      rejectionDetails.value = ''
      sendRejectionNotification.value = true
      allowResubmission.value = true
      showRejectDocumentModal.value = true
    }
    
    const closeRejectModal = () => {
      showRejectDocumentModal.value = false
    }
    
    const confirmReject = async () => {
      const reason = rejectionReason.value === 'other' ? customRejectionReason.value : rejectionReason.value
      console.log(`Rejet du document ${selectedDocumentId.value} pour la raison: ${reason}`)
      console.log(`Détails: ${rejectionDetails.value}`)
      console.log(`Envoyer notification: ${sendRejectionNotification.value}`)
      console.log(`Autoriser nouvelle soumission: ${allowResubmission.value}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      pendingDocuments.value = pendingDocuments.value.filter(doc => doc.id !== selectedDocumentId.value)
      stats.pendingVerifications--
      stats.rejectedToday++
      
      closeRejectModal()
      
      // Fermer le modal de visualisation si ouvert
      if (showDocumentViewModal.value) {
        closeDocumentViewModal()
      }
      
      // Afficher une notification de succès
      alert(`Document #${selectedDocumentId.value} rejeté avec succès`)
    }
    
    const getDocumentTypeClass = (type) => {
      const typeClasses = {
        'id_card': 'type-id-card',
        'passport': 'type-passport',
        'driving_license': 'type-driving-license',
        'business_registration': 'type-business'
      }
      return typeClasses[type] || ''
    }
    
    const getDocumentTypeLabel = (type) => {
      const typeLabels = {
        'id_card': 'Carte d\'identité',
        'passport': 'Passeport',
        'driving_license': 'Permis de conduire',
        'business_registration': 'Registre de commerce'
      }
      return typeLabels[type] || type
    }
    
    const getRoleClass = (role) => {
      const roleClasses = {
        'client': 'role-client',
        'courier': 'role-courier',
        'business': 'role-business',
        'manager': 'role-manager'
      }
      return roleClasses[role] || ''
    }
    
    const getRoleLabel = (role) => {
      const roleLabels = {
        'client': 'Client',
        'courier': 'Coursier',
        'business': 'Entreprise',
        'manager': 'Gestionnaire'
      }
      return roleLabels[role] || role
    }
    
    // Propriétés calculées
    const isValidRejectionReason = computed(() => {
      if (rejectionReason.value === 'other') {
        return customRejectionReason.value.trim().length > 0
      }
      return true
    })
    
    // Cycle de vie
    onMounted(() => {
      fetchData()
    })
    
    return {
      loading,
      pendingDocuments,
      showRejectDocumentModal,
      showDocumentViewModal,
      selectedDocumentId,
      selectedDocument,
      rejectionReason,
      customRejectionReason,
      rejectionDetails,
      sendRejectionNotification,
      allowResubmission,
      zoomLevel,
      verificationData,
      stats,
      filters,
      
      fetchData,
      refreshData,
      applyFilters,
      debounceSearch,
      startDrag,
      onDrop,
      viewDocument,
      closeDocumentViewModal,
      zoomIn,
      zoomOut,
      resetZoom,
      saveVerificationData,
      approveDocument,
      showRejectModal,
      closeRejectModal,
      confirmReject,
      getDocumentTypeClass,
      getDocumentTypeLabel,
      getRoleClass,
      getRoleLabel,
      isValidRejectionReason,
      
      formatDate,
      getInitials
    }
  }
}
</script>

<style scoped>
.kyc-drag-drop-view {
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

.actions {
  display: flex;
  gap: 0.5rem;
}

.kyc-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: var(--card-background);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
}

.bg-primary {
  background-color: #4e73df;
}

.bg-success {
  background-color: #1cc88a;
}

.bg-warning {
  background-color: #f6c23e;
}

.bg-danger {
  background-color: #e74a3b;
}

.bg-info {
  background-color: #36b9cc;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.kyc-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
}

.kyc-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.kyc-section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.kyc-filters {
  display: flex;
  gap: 0.5rem;
}

.kyc-filters select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.search-input {
  position: relative;
}

.search-input input {
  padding: 0.5rem;
  padding-right: 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.search-input svg {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state svg,
.empty-state svg {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.loading-state p,
.empty-state p {
  color: var(--text-secondary);
  margin: 0;
}

.kyc-documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.kyc-document-card {
  background-color: var(--card-background);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kyc-document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.kyc-document-card:active {
  cursor: grabbing;
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--background-secondary);
}

.document-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-id-card {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-passport {
  background-color: #e8f5e9;
  color: #388e3c;
}

.type-driving-license {
  background-color: #fff8e1;
  color: #ffa000;
}

.type-business {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.document-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.document-preview {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: var(--background-color);
}

.document-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.document-info {
  padding: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
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
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.user-role {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
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

.document-actions {
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
  transition: all 0.2s ease;
  border: none;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-secondary {
  background-color: var(--text-secondary);
  color: white;
}

.btn-success {
  background-color: #1cc88a;
  color: white;
}

.btn-danger {
  background-color: #e74a3b;
  color: white;
}

.btn-warning {
  background-color: #f6c23e;
  color: white;
}

.btn-info {
  background-color: #36b9cc;
  color: white;
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.mr-1 {
  margin-right: 0.25rem;
}

.kyc-drop-zones {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.kyc-drop-zone {
  background-color: var(--card-background);
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px dashed var(--border-color);
  transition: all 0.2s ease;
  height: 180px;
}

.kyc-drop-zone:hover {
  border-color: var(--primary-color);
}

.approve-zone {
  border-color: #1cc88a;
}

.approve-zone .drop-zone-icon {
  color: #1cc88a;
}

.reject-zone {
  border-color: #e74a3b;
}

.reject-zone .drop-zone-icon {
  color: #e74a3b;
}

.review-zone {
  border-color: #4e73df;
}

.review-zone .drop-zone-icon {
  color: #4e73df;
}

.drop-zone-icon {
  margin-bottom: 0.75rem;
}

.drop-zone-label {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.drop-zone-counter {
  font-size: 0.875rem;
  color: var(--text-secondary);
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
  background-color: var(--card-background);
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  overflow: hidden;
}

.modal-content.modal-lg {
  max-width: 800px;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.document-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.document-view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.document-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.meta-value {
  font-weight: 600;
  color: var(--text-color);
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.user-id {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.document-image-container {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: auto;
  background-color: var(--background-secondary);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-image {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.2s ease;
  transform-origin: center;
}

.document-zoom-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.document-verification-tools {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.verification-section {
  background-color: var(--background-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
}

.verification-section h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--text-color);
}

.verification-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.verification-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.verification-field label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.verification-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .kyc-container {
    grid-template-columns: 1fr;
  }
  
  .kyc-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .kyc-filters {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .document-view-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .document-meta {
    width: 100%;
  }
  
  .verification-actions {
    flex-direction: column;
  }
  
  .verification-actions .btn {
    width: 100%;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer .btn {
    width: 100%;
  }
}
</style>
