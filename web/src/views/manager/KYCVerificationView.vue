<template>
  <div class="kyc-verification-view">
    <div class="page-header">
      <h1>Vérification KYC</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <div class="filter-dropdown">
          <button class="btn btn-outline">
            <font-awesome-icon icon="filter" class="mr-1" />
            Filtrer
          </button>
          <div class="dropdown-content">
            <div class="filter-group">
              <label>Type d'utilisateur</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="filters.userType" value="all" @change="applyFilters" />
                  Tous
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.userType" value="courier" @change="applyFilters" />
                  Coursiers
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.userType" value="business" @change="applyFilters" />
                  Entreprises
                </label>
              </div>
            </div>
            <div class="filter-group">
              <label>Statut</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="filters.status" value="all" @change="applyFilters" />
                  Tous
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.status" value="pending" @change="applyFilters" />
                  En attente
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.status" value="verified" @change="applyFilters" />
                  Vérifiés
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="filters.status" value="rejected" @change="applyFilters" />
                  Rejetés
                </label>
              </div>
            </div>
            <div class="filter-group">
              <label>Commune</label>
              <select v-model="filters.commune" @change="applyFilters">
                <option value="">Toutes les communes</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="filter-actions">
              <button class="btn btn-secondary" @click="resetFilters">Réinitialiser</button>
              <button class="btn btn-primary" @click="applyFilters">Appliquer</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="kyc-stats">
      <div class="stat-card">
        <div class="stat-icon bg-primary">
          <font-awesome-icon icon="file-alt" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.pending }}</h3>
          <p class="stat-label">En attente</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-success">
          <font-awesome-icon icon="check-circle" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.verified }}</h3>
          <p class="stat-label">Vérifiés</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-danger">
          <font-awesome-icon icon="times-circle" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.rejected }}</h3>
          <p class="stat-label">Rejetés</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-info">
          <font-awesome-icon icon="clock" />
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.averageTime }}</h3>
          <p class="stat-label">Temps moyen de vérification</p>
        </div>
      </div>
    </div>

    <div class="kyc-tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        En attente <span class="badge">{{ pendingKYCRequests.length }}</span>
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'verified' }"
        @click="activeTab = 'verified'"
      >
        Vérifiés
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'rejected' }"
        @click="activeTab = 'rejected'"
      >
        Rejetés
      </button>
    </div>

    <div class="kyc-content">
      <!-- Affichage des demandes en attente -->
      <div v-if="activeTab === 'pending'" class="kyc-requests-grid">
        <div v-if="loading" class="loading-state">
          <font-awesome-icon icon="spinner" spin size="2x" />
          <p>Chargement des demandes KYC...</p>
        </div>
        <div v-else-if="pendingKYCRequests.length === 0" class="empty-state">
          <font-awesome-icon icon="check-circle" size="2x" />
          <p>Aucune demande KYC en attente</p>
        </div>
        <div v-else class="kyc-request-card" v-for="request in pendingKYCRequests" :key="request.id">
          <div class="kyc-request-header">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="request.user.profile_picture" :src="request.user.profile_picture" :alt="request.user.name" />
                <div v-else class="avatar-placeholder">{{ getInitials(request.user.name) }}</div>
              </div>
              <div class="user-details">
                <h3>{{ request.user.name }}</h3>
                <div class="user-meta">
                  <span class="user-role" :class="getRoleClass(request.user.role)">
                    {{ getRoleLabel(request.user.role) }}
                  </span>
                  <span class="user-commune" v-if="request.user.commune">
                    <font-awesome-icon icon="map-marker-alt" />
                    {{ request.user.commune }}
                  </span>
                </div>
              </div>
            </div>
            <div class="request-date">
              <font-awesome-icon icon="calendar-alt" />
              Soumis le {{ formatDate(request.submitted_at) }}
            </div>
          </div>
          
          <div class="kyc-documents">
            <h4>Documents à vérifier</h4>
            <div class="documents-grid">
              <div 
                class="document-item" 
                v-for="doc in request.documents" 
                :key="doc.id"
                @dragstart="startDrag($event, doc)"
                draggable="true"
              >
                <div class="document-preview">
                  <img v-if="isImageDocument(doc.url)" :src="doc.url" :alt="doc.type" />
                  <div v-else class="pdf-preview">
                    <font-awesome-icon icon="file-pdf" size="2x" />
                    <span>Document PDF</span>
                  </div>
                </div>
                <div class="document-info">
                  <div class="document-type">{{ getDocumentTypeLabel(doc.type) }}</div>
                  <div class="document-actions">
                    <button class="btn-icon" @click="previewDocument(doc)">
                      <font-awesome-icon icon="eye" />
                    </button>
                    <button class="btn-icon btn-success" @click="verifyDocument(request.id, doc.id)">
                      <font-awesome-icon icon="check" />
                    </button>
                    <button class="btn-icon btn-danger" @click="rejectDocument(request.id, doc.id)">
                      <font-awesome-icon icon="times" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="kyc-verification-zones">
            <div 
              class="verification-zone verification-approve"
              @dragover.prevent
              @drop="onDrop($event, 'approve', request.id)"
            >
              <div class="zone-icon">
                <font-awesome-icon icon="check-circle" size="2x" />
              </div>
              <div class="zone-label">Déposez ici pour approuver</div>
            </div>
            <div 
              class="verification-zone verification-reject"
              @dragover.prevent
              @drop="onDrop($event, 'reject', request.id)"
            >
              <div class="zone-icon">
                <font-awesome-icon icon="times-circle" size="2x" />
              </div>
              <div class="zone-label">Déposez ici pour rejeter</div>
            </div>
          </div>
          
          <div class="kyc-request-actions">
            <button class="btn btn-success" @click="approveAllDocuments(request.id)">
              <font-awesome-icon icon="check-circle" class="mr-1" />
              Tout approuver
            </button>
            <button class="btn btn-danger" @click="showRejectModal(request.id)">
              <font-awesome-icon icon="times-circle" class="mr-1" />
              Tout rejeter
            </button>
            <button class="btn btn-outline" @click="viewUserDetails(request.user.id)">
              <font-awesome-icon icon="user" class="mr-1" />
              Voir le profil
            </button>
          </div>
        </div>
      </div>

      <!-- Affichage des demandes vérifiées -->
      <div v-if="activeTab === 'verified'" class="kyc-requests-list">
        <div v-if="loading" class="loading-state">
          <font-awesome-icon icon="spinner" spin size="2x" />
          <p>Chargement des demandes KYC vérifiées...</p>
        </div>
        <div v-else-if="verifiedKYCRequests.length === 0" class="empty-state">
          <font-awesome-icon icon="info-circle" size="2x" />
          <p>Aucune demande KYC vérifiée</p>
        </div>
        <table v-else class="kyc-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Documents</th>
              <th>Vérifié le</th>
              <th>Vérifié par</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in verifiedKYCRequests" :key="request.id">
              <td>
                <div class="user-info-compact">
                  <div class="user-avatar-small">
                    <img v-if="request.user.profile_picture" :src="request.user.profile_picture" :alt="request.user.name" />
                    <div v-else class="avatar-placeholder-small">{{ getInitials(request.user.name) }}</div>
                  </div>
                  <div class="user-name">{{ request.user.name }}</div>
                </div>
              </td>
              <td>
                <span class="user-role" :class="getRoleClass(request.user.role)">
                  {{ getRoleLabel(request.user.role) }}
                </span>
              </td>
              <td>{{ request.documents.length }} documents</td>
              <td>{{ formatDate(request.verified_at) }}</td>
              <td>{{ request.verified_by }}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="viewKYCDetails(request.id)">
                    <font-awesome-icon icon="eye" />
                  </button>
                  <button class="btn-icon" @click="viewUserDetails(request.user.id)">
                    <font-awesome-icon icon="user" />
                  </button>
                  <button class="btn-icon btn-danger" @click="revokeVerification(request.id)">
                    <font-awesome-icon icon="undo" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Affichage des demandes rejetées -->
      <div v-if="activeTab === 'rejected'" class="kyc-requests-list">
        <div v-if="loading" class="loading-state">
          <font-awesome-icon icon="spinner" spin size="2x" />
          <p>Chargement des demandes KYC rejetées...</p>
        </div>
        <div v-else-if="rejectedKYCRequests.length === 0" class="empty-state">
          <font-awesome-icon icon="info-circle" size="2x" />
          <p>Aucune demande KYC rejetée</p>
        </div>
        <table v-else class="kyc-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Raison du rejet</th>
              <th>Rejeté le</th>
              <th>Rejeté par</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in rejectedKYCRequests" :key="request.id">
              <td>
                <div class="user-info-compact">
                  <div class="user-avatar-small">
                    <img v-if="request.user.profile_picture" :src="request.user.profile_picture" :alt="request.user.name" />
                    <div v-else class="avatar-placeholder-small">{{ getInitials(request.user.name) }}</div>
                  </div>
                  <div class="user-name">{{ request.user.name }}</div>
                </div>
              </td>
              <td>
                <span class="user-role" :class="getRoleClass(request.user.role)">
                  {{ getRoleLabel(request.user.role) }}
                </span>
              </td>
              <td>{{ request.rejection_reason }}</td>
              <td>{{ formatDate(request.rejected_at) }}</td>
              <td>{{ request.rejected_by }}</td>
              <td>
                <div class="table-actions">
                  <button class="btn-icon" @click="viewKYCDetails(request.id)">
                    <font-awesome-icon icon="eye" />
                  </button>
                  <button class="btn-icon" @click="viewUserDetails(request.user.id)">
                    <font-awesome-icon icon="user" />
                  </button>
                  <button class="btn-icon btn-success" @click="reconsiderRequest(request.id)">
                    <font-awesome-icon icon="redo" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de prévisualisation de document -->
    <div class="modal" v-if="showDocumentPreview">
      <div class="modal-backdrop" @click="closeDocumentPreview"></div>
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>{{ selectedDocument ? getDocumentTypeLabel(selectedDocument.type) : 'Document' }}</h3>
          <button class="modal-close" @click="closeDocumentPreview">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="document-preview-container">
            <img 
              v-if="selectedDocument && isImageDocument(selectedDocument.url)" 
              :src="selectedDocument.url" 
              :alt="selectedDocument.type" 
              class="document-preview-image"
            />
            <iframe 
              v-else-if="selectedDocument && isPdfDocument(selectedDocument.url)" 
              :src="selectedDocument.url" 
              class="document-preview-pdf"
            ></iframe>
            <div v-else class="document-preview-error">
              <font-awesome-icon icon="exclamation-triangle" size="2x" />
              <p>Impossible de prévisualiser ce document</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDocumentPreview">Fermer</button>
          <a 
            v-if="selectedDocument" 
            :href="selectedDocument.url" 
            target="_blank" 
            class="btn btn-primary"
          >
            <font-awesome-icon icon="external-link-alt" class="mr-1" />
            Ouvrir dans un nouvel onglet
          </a>
          <div v-if="selectedDocument" class="document-actions">
            <button class="btn btn-success" @click="verifyDocumentFromPreview">
              <font-awesome-icon icon="check" class="mr-1" />
              Approuver
            </button>
            <button class="btn btn-danger" @click="rejectDocumentFromPreview">
              <font-awesome-icon icon="times" class="mr-1" />
              Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de rejet -->
    <div class="modal" v-if="showRejectReasonModal">
      <div class="modal-backdrop" @click="closeRejectModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Motif de rejet</h3>
          <button class="modal-close" @click="closeRejectModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="rejection-reason">Raison du rejet</label>
            <select id="rejection-reason" v-model="rejectionReason" class="form-control">
              <option value="document_unclear">Document illisible</option>
              <option value="document_expired">Document expiré</option>
              <option value="document_invalid">Document invalide</option>
              <option value="information_mismatch">Informations incohérentes</option>
              <option value="suspected_fraud">Suspicion de fraude</option>
              <option value="other">Autre raison</option>
            </select>
          </div>
          <div class="form-group" v-if="rejectionReason === 'other'">
            <label for="custom-rejection-reason">Précisez la raison</label>
            <textarea 
              id="custom-rejection-reason" 
              v-model="customRejectionReason" 
              class="form-control" 
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="rejection-details">Détails supplémentaires (optionnel)</label>
            <textarea 
              id="rejection-details" 
              v-model="rejectionDetails" 
              class="form-control" 
              rows="3"
              placeholder="Fournissez des détails supplémentaires pour aider l'utilisateur à corriger sa demande..."
            ></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="sendRejectionNotification" />
              Envoyer une notification à l'utilisateur
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRejectModal">Annuler</button>
          <button class="btn btn-danger" @click="confirmReject" :disabled="!isValidRejectionReason">
            <font-awesome-icon icon="times-circle" class="mr-1" />
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate, getInitials } from '@/utils/formatters'
import { COMMUNES } from '@/config'

export default {
  name: 'KYCVerificationView',
  setup() {
    const router = useRouter()
    
    // État
    const loading = ref(true)
    const activeTab = ref('pending')
    const pendingKYCRequests = ref([])
    const verifiedKYCRequests = ref([])
    const rejectedKYCRequests = ref([])
    const showDocumentPreview = ref(false)
    const selectedDocument = ref(null)
    const selectedRequestId = ref(null)
    const showRejectReasonModal = ref(false)
    const rejectionReason = ref('document_unclear')
    const customRejectionReason = ref('')
    const rejectionDetails = ref('')
    const sendRejectionNotification = ref(true)
    const currentDocumentId = ref(null)
    
    const stats = reactive({
      pending: 0,
      verified: 0,
      rejected: 0,
      averageTime: '2h 15min'
    })
    
    const filters = reactive({
      userType: 'all',
      status: 'all',
      commune: ''
    })
    
    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        // Simuler l'appel API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Données fictives pour la démonstration
        pendingKYCRequests.value = [
          {
            id: 1,
            user: {
              id: 101,
              name: 'Amadou Koné',
              role: 'courier',
              profile_picture: null,
              commune: 'Abobo'
            },
            submitted_at: new Date(2023, 4, 15),
            documents: [
              { id: 1, type: 'id_card', url: 'https://example.com/id_card.jpg' },
              { id: 2, type: 'driving_license', url: 'https://example.com/driving_license.pdf' },
              { id: 3, type: 'vehicle_registration', url: 'https://example.com/vehicle_registration.jpg' }
            ]
          },
          {
            id: 2,
            user: {
              id: 102,
              name: 'Marie Kouassi',
              role: 'business',
              profile_picture: null,
              commune: 'Cocody'
            },
            submitted_at: new Date(2023, 4, 16),
            documents: [
              { id: 4, type: 'business_registration', url: 'https://example.com/business_registration.pdf' },
              { id: 5, type: 'tax_certificate', url: 'https://example.com/tax_certificate.jpg' },
              { id: 6, type: 'owner_id', url: 'https://example.com/owner_id.jpg' }
            ]
          }
        ]
        
        verifiedKYCRequests.value = [
          {
            id: 3,
            user: {
              id: 103,
              name: 'Ibrahim Diallo',
              role: 'courier',
              profile_picture: null
            },
            verified_at: new Date(2023, 4, 10),
            verified_by: 'Admin Système',
            documents: [
              { id: 7, type: 'id_card', url: 'https://example.com/id_card2.jpg' },
              { id: 8, type: 'driving_license', url: 'https://example.com/driving_license2.pdf' }
            ]
          }
        ]
        
        rejectedKYCRequests.value = [
          {
            id: 4,
            user: {
              id: 104,
              name: 'Sophie Mensah',
              role: 'business',
              profile_picture: null
            },
            rejected_at: new Date(2023, 4, 12),
            rejected_by: 'Admin Système',
            rejection_reason: 'Document illisible',
            documents: [
              { id: 9, type: 'business_registration', url: 'https://example.com/business_registration2.pdf' },
              { id: 10, type: 'tax_certificate', url: 'https://example.com/tax_certificate2.jpg' }
            ]
          }
        ]
        
        // Mettre à jour les statistiques
        stats.pending = pendingKYCRequests.value.length
        stats.verified = verifiedKYCRequests.value.length
        stats.rejected = rejectedKYCRequests.value.length
      } catch (error) {
        console.error('Erreur lors du chargement des données KYC:', error)
      } finally {
        loading.value = false
      }
    }
    
    const refreshData = () => {
      fetchData()
    }
    
    const applyFilters = () => {
      // Implémenter le filtrage des données
      console.log('Filtres appliqués:', filters)
      fetchData()
    }
    
    const resetFilters = () => {
      filters.userType = 'all'
      filters.status = 'all'
      filters.commune = ''
      applyFilters()
    }
    
    const isImageDocument = (url) => {
      if (!url) return false
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      return imageExtensions.some(ext => url.toLowerCase().endsWith(ext))
    }
    
    const isPdfDocument = (url) => {
      if (!url) return false
      return url.toLowerCase().endsWith('.pdf')
    }
    
    const getDocumentTypeLabel = (type) => {
      const typeLabels = {
        'id_card': 'Carte d\'identité',
        'driving_license': 'Permis de conduire',
        'vehicle_registration': 'Carte grise',
        'business_registration': 'Registre du commerce',
        'tax_certificate': 'Attestation fiscale',
        'owner_id': 'Pièce d\'identité du propriétaire',
        'insurance': 'Assurance',
        'profile_photo': 'Photo de profil'
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
    
    const previewDocument = (doc) => {
      selectedDocument.value = doc
      showDocumentPreview.value = true
    }
    
    const closeDocumentPreview = () => {
      showDocumentPreview.value = false
      selectedDocument.value = null
    }
    
    const verifyDocument = (requestId, documentId) => {
      console.log(`Vérification du document ${documentId} pour la demande ${requestId}`)
      // Implémenter la vérification du document
    }
    
    const rejectDocument = (requestId, documentId) => {
      selectedRequestId.value = requestId
      currentDocumentId.value = documentId
      showRejectReasonModal.value = true
    }
    
    const verifyDocumentFromPreview = () => {
      if (selectedDocument.value) {
        verifyDocument(selectedRequestId.value, selectedDocument.value.id)
        closeDocumentPreview()
      }
    }
    
    const rejectDocumentFromPreview = () => {
      if (selectedDocument.value) {
        rejectDocument(selectedRequestId.value, selectedDocument.value.id)
        closeDocumentPreview()
      }
    }
    
    const approveAllDocuments = (requestId) => {
      console.log(`Approbation de tous les documents pour la demande ${requestId}`)
      // Implémenter l'approbation de tous les documents
    }
    
    const showRejectModal = (requestId) => {
      selectedRequestId.value = requestId
      currentDocumentId.value = null
      showRejectReasonModal.value = true
    }
    
    const closeRejectModal = () => {
      showRejectReasonModal.value = false
      rejectionReason.value = 'document_unclear'
      customRejectionReason.value = ''
      rejectionDetails.value = ''
      selectedRequestId.value = null
      currentDocumentId.value = null
    }
    
    const confirmReject = () => {
      const reason = rejectionReason.value === 'other' ? customRejectionReason.value : rejectionReason.value
      console.log(`Rejet de la demande ${selectedRequestId.value} pour la raison: ${reason}`)
      console.log(`Détails: ${rejectionDetails.value}`)
      console.log(`Envoyer notification: ${sendRejectionNotification.value}`)
      
      if (currentDocumentId.value) {
        console.log(`Document spécifique rejeté: ${currentDocumentId.value}`)
      } else {
        console.log('Tous les documents rejetés')
      }
      
      closeRejectModal()
      // Implémenter le rejet de la demande
    }
    
    const viewUserDetails = (userId) => {
      router.push(`/manager/users/${userId}`)
    }
    
    const viewKYCDetails = (requestId) => {
      console.log(`Affichage des détails de la demande KYC ${requestId}`)
      // Implémenter l'affichage des détails de la demande
    }
    
    const revokeVerification = (requestId) => {
      console.log(`Révocation de la vérification pour la demande ${requestId}`)
      // Implémenter la révocation de la vérification
    }
    
    const reconsiderRequest = (requestId) => {
      console.log(`Reconsidération de la demande ${requestId}`)
      // Implémenter la reconsidération de la demande
    }
    
    // Drag and drop
    const startDrag = (event, doc) => {
      event.dataTransfer.setData('document', JSON.stringify(doc))
    }
    
    const onDrop = (event, action, requestId) => {
      const doc = JSON.parse(event.dataTransfer.getData('document'))
      console.log(`Action ${action} pour le document ${doc.id} de la demande ${requestId}`)
      
      if (action === 'approve') {
        verifyDocument(requestId, doc.id)
      } else if (action === 'reject') {
        rejectDocument(requestId, doc.id)
      }
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
      activeTab,
      pendingKYCRequests,
      verifiedKYCRequests,
      rejectedKYCRequests,
      stats,
      filters,
      communes: COMMUNES,
      showDocumentPreview,
      selectedDocument,
      selectedRequestId,
      showRejectReasonModal,
      rejectionReason,
      customRejectionReason,
      rejectionDetails,
      sendRejectionNotification,
      currentDocumentId,
      isValidRejectionReason,
      
      refreshData,
      applyFilters,
      resetFilters,
      isImageDocument,
      isPdfDocument,
      getDocumentTypeLabel,
      getRoleClass,
      getRoleLabel,
      previewDocument,
      closeDocumentPreview,
      verifyDocument,
      rejectDocument,
      verifyDocumentFromPreview,
      rejectDocumentFromPreview,
      approveAllDocuments,
      showRejectModal,
      closeRejectModal,
      confirmReject,
      viewUserDetails,
      viewKYCDetails,
      revokeVerification,
      reconsiderRequest,
      startDrag,
      onDrop,
      
      formatDate,
      getInitials
    }
  }
}
</script>

<style scoped>
.kyc-verification-view {
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

.filter-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: absolute;
  right: 0;
  background-color: var(--card-background);
  min-width: 250px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border-radius: 0.5rem;
  padding: 1rem;
}

.filter-dropdown:hover .dropdown-content {
  display: block;
}

.filter-group {
  margin-bottom: 1rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.filter-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.kyc-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.kyc-tabs {
  display: flex;
  background-color: var(--card-background);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-button {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
  position: relative;
}

.tab-button:hover {
  background-color: var(--background-secondary);
}

.tab-button.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--primary-color);
}

.badge {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.kyc-content {
  margin-bottom: 1.5rem;
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

.kyc-requests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: 1.5rem;
}

.kyc-request-card {
  background-color: var(--card-background);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kyc-request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
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

.user-details h3 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  color: var(--text-color);
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-role {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
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

.user-commune {
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.request-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kyc-documents {
  margin-bottom: 1.5rem;
}

.kyc-documents h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: var(--text-color);
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.document-item {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: grab;
}

.document-preview {
  height: 150px;
  overflow: hidden;
  background-color: var(--background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pdf-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.pdf-preview svg {
  margin-bottom: 0.5rem;
}

.document-info {
  padding: 0.75rem;
}

.document-type {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.document-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
}

.btn-icon:hover {
  background-color: var(--background-secondary);
}

.btn-icon.btn-success {
  color: #1cc88a;
}

.btn-icon.btn-success:hover {
  background-color: rgba(28, 200, 138, 0.1);
}

.btn-icon.btn-danger {
  color: #e74a3b;
}

.btn-icon.btn-danger:hover {
  background-color: rgba(231, 74, 59, 0.1);
}

.kyc-verification-zones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.verification-zone {
  height: 100px;
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.verification-approve {
  border-color: rgba(28, 200, 138, 0.3);
  background-color: rgba(28, 200, 138, 0.05);
}

.verification-approve .zone-icon {
  color: #1cc88a;
}

.verification-reject {
  border-color: rgba(231, 74, 59, 0.3);
  background-color: rgba(231, 74, 59, 0.05);
}

.verification-reject .zone-icon {
  color: #e74a3b;
}

.zone-icon {
  margin-bottom: 0.5rem;
}

.zone-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.kyc-request-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
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

.btn-outline {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.mr-1 {
  margin-right: 0.25rem;
}

.kyc-requests-list {
  background-color: var(--card-background);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kyc-table {
  width: 100%;
  border-collapse: collapse;
}

.kyc-table th,
.kyc-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.kyc-table th {
  background-color: var(--background-secondary);
  font-weight: 600;
  color: var(--text-color);
}

.user-info-compact {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-small {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--background-secondary);
}

.avatar-placeholder-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
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
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.document-preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background-color: var(--background-secondary);
  border-radius: 0.25rem;
  overflow: hidden;
}

.document-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.document-preview-pdf {
  width: 100%;
  height: 500px;
  border: none;
}

.document-preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  padding: 2rem;
}

.document-preview-error svg {
  margin-bottom: 1rem;
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
  border-radius: 0.25rem;
  background-color: var(--background-color);
  color: var(--text-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .kyc-requests-grid {
    grid-template-columns: 1fr;
  }
  
  .kyc-verification-zones {
    grid-template-columns: 1fr;
  }
  
  .documents-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .kyc-request-actions {
    flex-direction: column;
  }
  
  .kyc-request-actions .btn {
    width: 100%;
  }
}
</style>
