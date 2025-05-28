<template>
  <div class="complaints-container">
    <div class="page-header">
      <h1>Gestion des plaintes</h1>
      <div class="actions">
        <button class="btn btn-primary" @click="showNewComplaintModal = true">
          <i class="fas fa-plus"></i> Nouvelle plainte
        </button>
        <button class="btn btn-outline" @click="exportComplaints">
          <i class="fas fa-download"></i> Exporter
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="search-box">
        <input 
          type="text" 
          v-model="filters.search" 
          placeholder="Rechercher une plainte..." 
          @input="applyFilters"
        >
        <i class="fas fa-search"></i>
      </div>
      <div class="filter-group">
        <select v-model="filters.status" @change="applyFilters">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="rejected">Rejeté</option>
        </select>
        <select v-model="filters.type" @change="applyFilters">
          <option value="">Tous les types</option>
          <option value="delivery_issue">Problème de livraison</option>
          <option value="courier_behavior">Comportement du coursier</option>
          <option value="payment_issue">Problème de paiement</option>
          <option value="app_issue">Problème d'application</option>
          <option value="other">Autre</option>
        </select>
        <select v-model="filters.sortBy" @change="applyFilters">
          <option value="-created_at">Plus récent</option>
          <option value="created_at">Plus ancien</option>
          <option value="priority">Priorité (haute à basse)</option>
          <option value="-priority">Priorité (basse à haute)</option>
        </select>
      </div>
    </div>

    <!-- Liste des plaintes -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des plaintes...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchComplaints">Réessayer</button>
    </div>

    <div v-else-if="filteredComplaints.length === 0" class="empty-state">
      <img src="../../../assets/images/empty-complaints.svg" alt="Aucune plainte" />
      <h3>Aucune plainte trouvée</h3>
      <p>Vous n'avez pas encore soumis de plaintes ou aucune plainte ne correspond à vos filtres.</p>
      <button class="btn btn-primary" @click="showNewComplaintModal = true">
        Soumettre une plainte
      </button>
    </div>

    <div v-else class="complaints-list">
      <div v-for="complaint in paginatedComplaints" :key="complaint.id" class="complaint-card">
        <div class="complaint-header">
          <div class="complaint-id">#{{ complaint.id }}</div>
          <div class="complaint-status" :class="complaint.status">
            {{ getStatusLabel(complaint.status) }}
          </div>
        </div>
        <div class="complaint-body">
          <div class="complaint-info">
            <h3>{{ complaint.subject }}</h3>
            <div class="complaint-meta">
              <span class="complaint-type">{{ getTypeLabel(complaint.type) }}</span>
              <span class="complaint-date">{{ formatDate(complaint.created_at) }}</span>
            </div>
            <p class="complaint-description">{{ truncateText(complaint.description, 150) }}</p>
            
            <div v-if="complaint.delivery_id" class="complaint-delivery">
              <strong>Livraison concernée:</strong> #{{ complaint.delivery_id }}
            </div>
            
            <div v-if="complaint.courier_id" class="complaint-courier">
              <strong>Coursier concerné:</strong> {{ complaint.courier_name || `#${complaint.courier_id}` }}
            </div>
          </div>
          
          <div class="complaint-attachments" v-if="complaint.attachments && complaint.attachments.length > 0">
            <div class="attachment-preview" v-for="(attachment, index) in complaint.attachments" :key="index">
              <img 
                v-if="isImageFile(attachment.url)" 
                :src="attachment.url" 
                :alt="`Pièce jointe ${index + 1}`"
                @click="openAttachment(attachment.url)"
              >
              <div v-else class="file-preview" @click="openAttachment(attachment.url)">
                <i class="fas fa-file-alt"></i>
                <span>{{ getFileName(attachment.url) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="complaint-footer">
          <button class="btn btn-text" @click="viewComplaintDetails(complaint)">
            <i class="fas fa-eye"></i> Voir détails
          </button>
          <button 
            v-if="complaint.status === 'pending'" 
            class="btn btn-text btn-danger" 
            @click="confirmCancelComplaint(complaint)"
          >
            <i class="fas fa-times"></i> Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredComplaints.length > 0" class="pagination">
      <button 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)" 
        class="btn btn-icon"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Page {{ currentPage }} sur {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)" 
        class="btn btn-icon"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal de nouvelle plainte -->
    <div v-if="showNewComplaintModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Soumettre une nouvelle plainte</h2>
          <button class="btn-close" @click="showNewComplaintModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitComplaint">
            <div class="form-group">
              <label for="complaintSubject">Sujet*</label>
              <input 
                type="text" 
                id="complaintSubject" 
                v-model="complaintForm.subject" 
                required
                placeholder="Ex: Retard de livraison"
              >
            </div>
            <div class="form-group">
              <label for="complaintType">Type de plainte*</label>
              <select id="complaintType" v-model="complaintForm.type" required>
                <option value="" disabled>Sélectionnez un type</option>
                <option value="delivery_issue">Problème de livraison</option>
                <option value="courier_behavior">Comportement du coursier</option>
                <option value="payment_issue">Problème de paiement</option>
                <option value="app_issue">Problème d'application</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div class="form-group">
              <label for="complaintDescription">Description détaillée*</label>
              <textarea 
                id="complaintDescription" 
                v-model="complaintForm.description" 
                rows="5"
                required
                placeholder="Décrivez votre problème en détail..."
              ></textarea>
            </div>
            <div class="form-group">
              <label for="complaintDelivery">Livraison concernée</label>
              <select id="complaintDelivery" v-model="complaintForm.delivery_id">
                <option value="">Sélectionnez une livraison (optionnel)</option>
                <option v-for="delivery in recentDeliveries" :key="delivery.id" :value="delivery.id">
                  #{{ delivery.id }} - {{ formatDate(delivery.created_at) }} - {{ delivery.status }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="complaintCourier">Coursier concerné</label>
              <select id="complaintCourier" v-model="complaintForm.courier_id">
                <option value="">Sélectionnez un coursier (optionnel)</option>
                <option v-for="courier in recentCouriers" :key="courier.id" :value="courier.id">
                  {{ courier.name }} - {{ courier.phone }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Pièces jointes (photos, documents)</label>
              <div class="attachments-container">
                <div 
                  v-for="(attachment, index) in complaintForm.attachments" 
                  :key="index" 
                  class="attachment-item"
                >
                  <div class="attachment-preview">
                    <img 
                      v-if="attachment.preview" 
                      :src="attachment.preview" 
                      :alt="`Aperçu ${index + 1}`"
                    >
                    <div v-else class="file-preview">
                      <i class="fas fa-file"></i>
                      <span>{{ attachment.file.name }}</span>
                    </div>
                  </div>
                  <button type="button" class="btn-remove" @click="removeAttachment(index)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                
                <div class="attachment-upload" v-if="complaintForm.attachments.length < 3">
                  <input 
                    type="file" 
                    id="complaintAttachment" 
                    @change="handleAttachmentUpload" 
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                  >
                  <label for="complaintAttachment">
                    <i class="fas fa-plus"></i>
                    <span>Ajouter</span>
                  </label>
                </div>
              </div>
              <p class="help-text">Formats acceptés: JPG, PNG, PDF, DOC. Max 3 fichiers, 5MB chacun.</p>
            </div>
            <div class="form-group checkbox-group">
              <input 
                type="checkbox" 
                id="complaintPriority" 
                v-model="complaintForm.is_priority"
              >
              <label for="complaintPriority">Marquer comme prioritaire</label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showNewComplaintModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting">
                  <i class="fas fa-spinner fa-spin"></i> Envoi en cours...
                </span>
                <span v-else>
                  <i class="fas fa-paper-plane"></i> Soumettre
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de détails de plainte -->
    <div v-if="showDetailsModal" class="modal-overlay">
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <h2>Détails de la plainte #{{ selectedComplaint?.id }}</h2>
          <button class="btn-close" @click="showDetailsModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedComplaint" class="complaint-details">
            <div class="complaint-status-header">
              <div class="status-badge" :class="selectedComplaint.status">
                {{ getStatusLabel(selectedComplaint.status) }}
              </div>
              <div class="complaint-date">
                Soumis le {{ formatDateTime(selectedComplaint.created_at) }}
              </div>
            </div>
            
            <h3 class="complaint-subject">{{ selectedComplaint.subject }}</h3>
            <div class="complaint-type-badge">{{ getTypeLabel(selectedComplaint.type) }}</div>
            
            <div class="detail-section">
              <h4>Description</h4>
              <p>{{ selectedComplaint.description }}</p>
            </div>
            
            <div class="detail-section" v-if="selectedComplaint.delivery_id">
              <h4>Livraison concernée</h4>
              <div class="delivery-info">
                <p><strong>ID:</strong> #{{ selectedComplaint.delivery_id }}</p>
                <p v-if="selectedComplaint.delivery_details">
                  <strong>Statut:</strong> {{ selectedComplaint.delivery_details.status }}
                </p>
                <p v-if="selectedComplaint.delivery_details">
                  <strong>Date:</strong> {{ formatDate(selectedComplaint.delivery_details.created_at) }}
                </p>
                <button 
                  class="btn btn-sm btn-outline" 
                  @click="viewDeliveryDetails(selectedComplaint.delivery_id)"
                >
                  Voir la livraison
                </button>
              </div>
            </div>
            
            <div class="detail-section" v-if="selectedComplaint.courier_id">
              <h4>Coursier concerné</h4>
              <div class="courier-info">
                <p><strong>ID:</strong> #{{ selectedComplaint.courier_id }}</p>
                <p v-if="selectedComplaint.courier_details">
                  <strong>Nom:</strong> {{ selectedComplaint.courier_details.name }}
                </p>
                <p v-if="selectedComplaint.courier_details">
                  <strong>Téléphone:</strong> {{ selectedComplaint.courier_details.phone }}
                </p>
              </div>
            </div>
            
            <div class="detail-section" v-if="selectedComplaint.attachments && selectedComplaint.attachments.length > 0">
              <h4>Pièces jointes</h4>
              <div class="attachments-grid">
                <div 
                  v-for="(attachment, index) in selectedComplaint.attachments" 
                  :key="index" 
                  class="attachment-item"
                  @click="openAttachment(attachment.url)"
                >
                  <img 
                    v-if="isImageFile(attachment.url)" 
                    :src="attachment.url" 
                    :alt="`Pièce jointe ${index + 1}`"
                  >
                  <div v-else class="file-preview">
                    <i class="fas fa-file-alt"></i>
                    <span>{{ getFileName(attachment.url) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="detail-section" v-if="selectedComplaint.responses && selectedComplaint.responses.length > 0">
              <h4>Réponses</h4>
              <div class="responses-timeline">
                <div 
                  v-for="(response, index) in selectedComplaint.responses" 
                  :key="index" 
                  class="response-item"
                >
                  <div class="response-header">
                    <div class="response-author">
                      {{ response.author_name || 'Support' }}
                      <span class="author-role">{{ response.author_role || 'Agent' }}</span>
                    </div>
                    <div class="response-date">{{ formatDateTime(response.created_at) }}</div>
                  </div>
                  <div class="response-content">
                    <p>{{ response.content }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="detail-section" v-if="selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'rejected'">
              <h4>Ajouter une réponse</h4>
              <div class="response-form">
                <textarea 
                  v-model="responseForm.content" 
                  rows="3" 
                  placeholder="Votre message..."
                ></textarea>
                <button 
                  class="btn btn-primary" 
                  @click="submitResponse" 
                  :disabled="!responseForm.content || isSubmittingResponse"
                >
                  <span v-if="isSubmittingResponse">
                    <i class="fas fa-spinner fa-spin"></i> Envoi...
                  </span>
                  <span v-else>
                    <i class="fas fa-reply"></i> Répondre
                  </span>
                </button>
              </div>
            </div>
            
            <div class="detail-actions">
              <button 
                v-if="selectedComplaint.status === 'pending'" 
                class="btn btn-danger" 
                @click="confirmCancelComplaint(selectedComplaint)"
              >
                <i class="fas fa-times"></i> Annuler la plainte
              </button>
              <button class="btn btn-outline" @click="showDetailsModal = false">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation d'annulation -->
    <div v-if="showCancelModal" class="modal-overlay">
      <div class="modal-container modal-sm">
        <div class="modal-header">
          <h2>Confirmer l'annulation</h2>
          <button class="btn-close" @click="showCancelModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir annuler cette plainte ?</p>
          <p class="warning-text">Cette action est irréversible.</p>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="showCancelModal = false">Retour</button>
            <button type="button" class="btn btn-danger" @click="cancelComplaint" :disabled="isSubmitting">
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i> Annulation...
              </span>
              <span v-else>
                <i class="fas fa-times"></i> Confirmer l'annulation
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { formatDate, formatDateTime, truncateText } from '@/utils/formatters';
import { exportToCSV } from '@/utils/export-utils';
import { 
  getComplaints, 
  getComplaintDetails, 
  createComplaint, 
  cancelComplaint, 
  addComplaintResponse 
} from '@/api/complaints';
import { getRecentDeliveries } from '@/api/business';
import { getRecentCouriers } from '@/api/couriers';
import { uploadFile } from '@/api/storage';

export default {
  name: 'ComplaintsView',
  setup() {
    const router = useRouter();
    const { showToast } = useToast();
    
    // État
    const complaints = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = ref(10);
    const showNewComplaintModal = ref(false);
    const showDetailsModal = ref(false);
    const showCancelModal = ref(false);
    const isSubmitting = ref(false);
    const isSubmittingResponse = ref(false);
    const selectedComplaint = ref(null);
    const complaintToCancel = ref(null);
    const recentDeliveries = ref([]);
    const recentCouriers = ref([]);
    
    // Formulaires
    const complaintForm = reactive({
      subject: '',
      type: '',
      description: '',
      delivery_id: '',
      courier_id: '',
      attachments: [],
      is_priority: false
    });
    
    const responseForm = reactive({
      content: ''
    });
    
    // Filtres
    const filters = reactive({
      search: '',
      status: '',
      type: '',
      sortBy: '-created_at'
    });
    
    // Computed
    const filteredComplaints = computed(() => {
      let result = [...complaints.value];
      
      // Filtre par recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(complaint => 
          complaint.subject.toLowerCase().includes(searchLower) || 
          complaint.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Filtre par statut
      if (filters.status) {
        result = result.filter(complaint => complaint.status === filters.status);
      }
      
      // Filtre par type
      if (filters.type) {
        result = result.filter(complaint => complaint.type === filters.type);
      }
      
      // Tri
      const sortField = filters.sortBy.startsWith('-') 
        ? filters.sortBy.substring(1) 
        : filters.sortBy;
      const sortDirection = filters.sortBy.startsWith('-') ? -1 : 1;
      
      result.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortDirection;
        if (a[sortField] > b[sortField]) return 1 * sortDirection;
        return 0;
      });
      
      return result;
    });
    
    const paginatedComplaints = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filteredComplaints.value.slice(start, end);
    });
    
    const totalPages = computed(() => {
      return Math.ceil(filteredComplaints.value.length / itemsPerPage.value) || 1;
    });
    
    // Méthodes
    const fetchComplaints = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await getComplaints();
        complaints.value = response.data;
      } catch (err) {
        console.error('Erreur lors du chargement des plaintes:', err);
        error.value = 'Impossible de charger les plaintes. Veuillez réessayer.';
      } finally {
        loading.value = false;
      }
    };
    
    const fetchRecentData = async () => {
      try {
        // Charger les livraisons récentes
        const deliveriesResponse = await getRecentDeliveries();
        recentDeliveries.value = deliveriesResponse.data;
        
        // Charger les coursiers récents
        const couriersResponse = await getRecentCouriers();
        recentCouriers.value = couriersResponse.data;
      } catch (err) {
        console.error('Erreur lors du chargement des données récentes:', err);
        showToast('Erreur', 'Impossible de charger certaines données. Veuillez réessayer.', 'error');
      }
    };
    
    const applyFilters = () => {
      currentPage.value = 1; // Réinitialiser la pagination lors du filtrage
    };
    
    const changePage = (page) => {
      currentPage.value = page;
    };
    
    const resetComplaintForm = () => {
      complaintForm.subject = '';
      complaintForm.type = '';
      complaintForm.description = '';
      complaintForm.delivery_id = '';
      complaintForm.courier_id = '';
      complaintForm.attachments = [];
      complaintForm.is_priority = false;
    };
    
    const handleAttachmentUpload = (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      // Vérifier le nombre maximum de pièces jointes
      if (complaintForm.attachments.length + files.length > 3) {
        showToast('Erreur', 'Vous ne pouvez pas ajouter plus de 3 pièces jointes', 'error');
        return;
      }
      
      // Traiter chaque fichier
      Array.from(files).forEach(file => {
        // Vérifier la taille du fichier (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('Erreur', `Le fichier ${file.name} dépasse la taille maximale de 5MB`, 'error');
          return;
        }
        
        // Vérifier le type de fichier
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
          showToast('Erreur', `Le type de fichier ${file.type} n'est pas accepté`, 'error');
          return;
        }
        
        // Créer un aperçu pour les images
        let preview = null;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }
        
        // Ajouter à la liste des pièces jointes
        complaintForm.attachments.push({
          file,
          preview
        });
      });
      
      // Réinitialiser l'input file
      event.target.value = '';
    };
    
    const removeAttachment = (index) => {
      // Libérer l'URL de l'aperçu si elle existe
      if (complaintForm.attachments[index].preview) {
        URL.revokeObjectURL(complaintForm.attachments[index].preview);
      }
      
      // Supprimer la pièce jointe
      complaintForm.attachments.splice(index, 1);
    };
    
    const submitComplaint = async () => {
      isSubmitting.value = true;
      
      try {
        // Télécharger les pièces jointes
        const attachmentUrls = [];
        for (const attachment of complaintForm.attachments) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          const uploadResponse = await uploadFile(formData);
          attachmentUrls.push({
            url: uploadResponse.data.url,
            type: attachment.file.type
          });
        }
        
        // Créer la plainte
        const complaintData = {
          subject: complaintForm.subject,
          type: complaintForm.type,
          description: complaintForm.description,
          delivery_id: complaintForm.delivery_id || null,
          courier_id: complaintForm.courier_id || null,
          attachments: attachmentUrls,
          is_priority: complaintForm.is_priority
        };
        
        await createComplaint(complaintData);
        
        showToast('Succès', 'Votre plainte a été soumise avec succès', 'success');
        showNewComplaintModal.value = false;
        resetComplaintForm();
        fetchComplaints();
      } catch (err) {
        console.error('Erreur lors de la soumission de la plainte:', err);
        showToast('Erreur', 'Impossible de soumettre la plainte. Veuillez réessayer.', 'error');
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const viewComplaintDetails = async (complaint) => {
      try {
        const response = await getComplaintDetails(complaint.id);
        selectedComplaint.value = response.data;
        showDetailsModal.value = true;
        responseForm.content = '';
      } catch (err) {
        console.error('Erreur lors du chargement des détails de la plainte:', err);
        showToast('Erreur', 'Impossible de charger les détails de la plainte. Veuillez réessayer.', 'error');
      }
    };
    
    const confirmCancelComplaint = (complaint) => {
      complaintToCancel.value = complaint;
      showCancelModal.value = true;
    };
    
    const cancelComplaintRequest = async () => {
      if (!complaintToCancel.value) return;
      
      isSubmitting.value = true;
      
      try {
        await cancelComplaint(complaintToCancel.value.id);
        
        showToast('Succès', 'La plainte a été annulée avec succès', 'success');
        showCancelModal.value = false;
        showDetailsModal.value = false;
        complaintToCancel.value = null;
        fetchComplaints();
      } catch (err) {
        console.error('Erreur lors de l\'annulation de la plainte:', err);
        showToast('Erreur', 'Impossible d\'annuler la plainte. Veuillez réessayer.', 'error');
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const submitResponse = async () => {
      if (!selectedComplaint.value || !responseForm.content) return;
      
      isSubmittingResponse.value = true;
      
      try {
        await addComplaintResponse(selectedComplaint.value.id, {
          content: responseForm.content
        });
        
        // Recharger les détails de la plainte
        const response = await getComplaintDetails(selectedComplaint.value.id);
        selectedComplaint.value = response.data;
        
        responseForm.content = '';
        showToast('Succès', 'Votre réponse a été ajoutée avec succès', 'success');
      } catch (err) {
        console.error('Erreur lors de l\'ajout de la réponse:', err);
        showToast('Erreur', 'Impossible d\'ajouter votre réponse. Veuillez réessayer.', 'error');
      } finally {
        isSubmittingResponse.value = false;
      }
    };
    
    const viewDeliveryDetails = (deliveryId) => {
      router.push({ name: 'business-delivery-detail', params: { id: deliveryId } });
    };
    
    const exportComplaints = () => {
      const data = filteredComplaints.value.map(complaint => ({
        'ID': complaint.id,
        'Sujet': complaint.subject,
        'Type': getTypeLabel(complaint.type),
        'Statut': getStatusLabel(complaint.status),
        'Date de création': formatDate(complaint.created_at),
        'Livraison ID': complaint.delivery_id || 'N/A',
        'Coursier ID': complaint.courier_id || 'N/A',
        'Prioritaire': complaint.is_priority ? 'Oui' : 'Non'
      }));
      
      exportToCSV(data, 'plaintes');
    };
    
    const openAttachment = (url) => {
      window.open(url, '_blank');
    };
    
    const isImageFile = (url) => {
      return url && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png'));
    };
    
    const getFileName = (url) => {
      if (!url) return '';
      return url.split('/').pop();
    };
    
    const getStatusLabel = (status) => {
      const statusMap = {
        'pending': 'En attente',
        'in_progress': 'En cours',
        'resolved': 'Résolu',
        'rejected': 'Rejeté'
      };
      return statusMap[status] || status;
    };
    
    const getTypeLabel = (type) => {
      const typeMap = {
        'delivery_issue': 'Problème de livraison',
        'courier_behavior': 'Comportement du coursier',
        'payment_issue': 'Problème de paiement',
        'app_issue': 'Problème d\'application',
        'other': 'Autre'
      };
      return typeMap[type] || type;
    };
    
    // Cycle de vie
    onMounted(() => {
      fetchComplaints();
      fetchRecentData();
    });
    
    return {
      complaints,
      loading,
      error,
      currentPage,
      filteredComplaints,
      paginatedComplaints,
      totalPages,
      showNewComplaintModal,
      showDetailsModal,
      showCancelModal,
      isSubmitting,
      isSubmittingResponse,
      selectedComplaint,
      complaintToCancel,
      complaintForm,
      responseForm,
      filters,
      recentDeliveries,
      recentCouriers,
      
      fetchComplaints,
      applyFilters,
      changePage,
      resetComplaintForm,
      handleAttachmentUpload,
      removeAttachment,
      submitComplaint,
      viewComplaintDetails,
      confirmCancelComplaint,
      cancelComplaint: cancelComplaintRequest,
      submitResponse,
      viewDeliveryDetails,
      exportComplaints,
      openAttachment,
      isImageFile,
      getFileName,
      getStatusLabel,
      getTypeLabel,
      
      formatDate,
      formatDateTime,
      truncateText
    };
  }
};
</script>

<style scoped>
.complaints-container {
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
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.search-box i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: white;
}

.complaints-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.complaint-card {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.complaint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.complaint-id {
  font-weight: 600;
  color: #495057;
}

.complaint-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.complaint-status.pending {
  background-color: #ffc107;
  color: #212529;
}

.complaint-status.in_progress {
  background-color: #17a2b8;
  color: white;
}

.complaint-status.resolved {
  background-color: #28a745;
  color: white;
}

.complaint-status.rejected {
  background-color: #dc3545;
  color: white;
}

.complaint-body {
  display: flex;
  padding: 1rem;
}

.complaint-info {
  flex: 1;
}

.complaint-info h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.complaint-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

.complaint-type {
  color: #6c757d;
}

.complaint-date {
  color: #6c757d;
}

.complaint-description {
  margin: 0 0 0.75rem;
  line-height: 1.4;
  color: #212529;
}

.complaint-delivery,
.complaint-courier {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.complaint-attachments {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.attachment-preview {
  width: 80px;
  height: 80px;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.attachment-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  padding: 0.5rem;
}

.file-preview i {
  font-size: 1.5rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.file-preview span {
  font-size: 0.7rem;
  color: #495057;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.complaint-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e9ecef;
  gap: 0.5rem;
}

.btn-text {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-text.btn-danger {
  color: #dc3545;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-lg {
  max-width: 800px;
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input {
  width: auto;
}

.checkbox-group label {
  margin-bottom: 0;
}

.attachments-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.attachment-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.btn-remove {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #dc3545;
}

.attachment-upload {
  width: 100px;
  height: 100px;
  border: 2px dashed #ced4da;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-upload input {
  display: none;
}

.attachment-upload label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  color: #6c757d;
}

.attachment-upload label i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.help-text {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #007bff;
  border: 1px solid #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}

.btn-outline {
  background-color: white;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background-color: #f8f9fa;
}

.btn-danger {
  background-color: #dc3545;
  border: 1px solid #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.empty-state img {
  width: 150px;
  height: 150px;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 1.5rem;
  max-width: 500px;
}

/* Styles pour les détails de la plainte */
.complaint-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.complaint-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.status-badge.pending {
  background-color: #ffc107;
  color: #212529;
}

.status-badge.in_progress {
  background-color: #17a2b8;
  color: white;
}

.status-badge.resolved {
  background-color: #28a745;
  color: white;
}

.status-badge.rejected {
  background-color: #dc3545;
  color: white;
}

.complaint-subject {
  font-size: 1.5rem;
  margin: 0;
}

.complaint-type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  color: #495057;
  margin-top: 0.5rem;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-section h4 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.delivery-info,
.courier-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.25rem;
}

.delivery-info p,
.courier-info p {
  margin: 0 0 0.5rem;
}

.attachments-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.responses-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.response-item {
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  padding: 1rem;
}

.response-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.response-author {
  font-weight: 600;
}

.author-role {
  font-weight: normal;
  color: #6c757d;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.response-date {
  font-size: 0.85rem;
  color: #6c757d;
}

.response-content p {
  margin: 0;
  line-height: 1.5;
}

.response-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.response-form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  resize: vertical;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .actions {
    width: 100%;
  }
  
  .filters-container {
    flex-direction: column;
  }
  
  .complaint-body {
    flex-direction: column;
  }
  
  .complaint-attachments {
    margin-left: 0;
    margin-top: 1rem;
  }
  
  .modal-container {
    width: 95%;
  }
}
</style>
