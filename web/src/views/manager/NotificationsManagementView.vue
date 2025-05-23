<template>
  <div class="notifications-management-view">
    <div class="page-header">
      <h1 class="page-title">Gestion des Notifications</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshNotifications">
          <i class="fas fa-sync" :class="{ 'fa-spin': loading }" class="mr-2"></i>
          Actualiser
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus mr-2"></i>
          Nouvelle notification
        </button>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        <i class="fas fa-bell mr-2"></i>
        Toutes
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'clients' }"
        @click="activeTab = 'clients'"
      >
        <i class="fas fa-user mr-2"></i>
        Clients
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'couriers' }"
        @click="activeTab = 'couriers'"
      >
        <i class="fas fa-motorcycle mr-2"></i>
        Coursiers
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'system' }"
        @click="activeTab = 'system'"
      >
        <i class="fas fa-cog mr-2"></i>
        Système
      </button>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'templates' }"
        @click="activeTab = 'templates'"
      >
        <i class="fas fa-file-alt mr-2"></i>
        Modèles
      </button>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label for="type-filter">Type</label>
          <select id="type-filter" v-model="filters.type" @change="applyFilters">
            <option value="">Tous les types</option>
            <option value="info">Information</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="status-filter">Statut</label>
          <select id="status-filter" v-model="filters.status" @change="applyFilters">
            <option value="">Tous les statuts</option>
            <option value="sent">Envoyé</option>
            <option value="read">Lu</option>
            <option value="pending">En attente</option>
            <option value="failed">Échec</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="date-range">Période</label>
          <select id="date-range" v-model="filters.dateRange" @change="handleDateRangeChange">
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="last_week">7 derniers jours</option>
            <option value="last_month">30 derniers jours</option>
            <option value="custom">Personnalisée</option>
          </select>
        </div>
        <div class="filter-group" v-if="filters.dateRange === 'custom'">
          <label for="start-date">Date de début</label>
          <input type="date" id="start-date" v-model="filters.startDate" @change="applyFilters" />
        </div>
        <div class="filter-group" v-if="filters.dateRange === 'custom'">
          <label for="end-date">Date de fin</label>
          <input type="date" id="end-date" v-model="filters.endDate" @change="applyFilters" />
        </div>
        <div class="filter-group search-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input 
              type="text" 
              id="search" 
              v-model="filters.search" 
              placeholder="Titre, contenu, destinataire..." 
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Chargement des notifications...</p>
      </div>
      <div v-else-if="filteredNotifications.length === 0" class="empty-state">
        <i class="fas fa-bell-slash fa-2x"></i>
        <p>Aucune notification trouvée</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Créer une notification
        </button>
      </div>
      <div v-else>
        <!-- Onglet Toutes les notifications -->
        <div v-if="activeTab === 'all' || activeTab === 'clients' || activeTab === 'couriers' || activeTab === 'system'">
          <div class="notifications-list">
            <div 
              v-for="notification in filteredNotifications" 
              :key="notification.id" 
              class="notification-card"
              :class="{ 'notification-read': notification.status === 'read' }"
            >
              <div class="notification-icon" :class="getTypeClass(notification.type)">
                <i :class="getTypeIcon(notification.type)"></i>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <h3 class="notification-title">{{ notification.title }}</h3>
                  <div class="notification-meta">
                    <span class="notification-date">{{ formatDate(notification.created_at) }}</span>
                    <span class="notification-status" :class="getStatusClass(notification.status)">
                      {{ getStatusLabel(notification.status) }}
                    </span>
                  </div>
                </div>
                <div class="notification-body">
                  <p>{{ notification.content }}</p>
                </div>
                <div class="notification-footer">
                  <div class="notification-recipient">
                    <i class="fas fa-user mr-1"></i>
                    {{ getRecipientLabel(notification) }}
                  </div>
                  <div class="notification-actions">
                    <button 
                      class="btn-icon" 
                      @click="viewNotificationDetails(notification.id)" 
                      title="Voir les détails"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      @click="resendNotification(notification.id)" 
                      title="Renvoyer"
                      v-if="notification.status === 'failed'"
                    >
                      <i class="fas fa-redo"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      @click="markAsRead(notification.id)" 
                      title="Marquer comme lu"
                      v-if="notification.status === 'sent'"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      class="btn-icon" 
                      @click="deleteNotification(notification.id)" 
                      title="Supprimer"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pagination" v-if="filteredNotifications.length > 0 && totalPages > 1">
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
        
        <!-- Onglet Modèles -->
        <div v-if="activeTab === 'templates'">
          <div class="templates-header">
            <div class="search-input">
              <input 
                type="text" 
                v-model="templateSearch" 
                placeholder="Rechercher un modèle..." 
                @input="debounceTemplateSearch"
              />
              <i class="fas fa-search"></i>
            </div>
            <button class="btn btn-primary" @click="openCreateTemplateModal">
              <i class="fas fa-plus mr-2"></i>
              Nouveau modèle
            </button>
          </div>
          
          <div class="templates-grid">
            <div 
              v-for="template in filteredTemplates" 
              :key="template.id" 
              class="template-card"
            >
              <div class="template-header">
                <h3 class="template-name">{{ template.name }}</h3>
                <div class="template-actions">
                  <button 
                    class="btn-icon" 
                    @click="editTemplate(template.id)" 
                    title="Modifier"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn-icon" 
                    @click="deleteTemplate(template.id)" 
                    title="Supprimer"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="template-content">
                <div class="template-preview">
                  <div class="template-title">{{ template.title }}</div>
                  <div class="template-body">{{ template.content }}</div>
                </div>
              </div>
              <div class="template-footer">
                <div class="template-meta">
                  <span class="template-type" :class="getTypeClass(template.type)">
                    {{ getTypeLabel(template.type) }}
                  </span>
                  <span class="template-target">{{ getTargetLabel(template.target) }}</span>
                </div>
                <button 
                  class="btn btn-sm btn-outline" 
                  @click="useTemplate(template.id)"
                >
                  Utiliser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails d'une notification -->
    <Modal v-if="showNotificationModal" @close="showNotificationModal = false" title="Détails de la notification">
      <div v-if="selectedNotification" class="notification-details">
        <div class="detail-section">
          <h3>Informations générales</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID</span>
              <span class="detail-value">#{{ selectedNotification.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de création</span>
              <span class="detail-value">{{ formatDateTime(selectedNotification.created_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value" :class="getTypeClass(selectedNotification.type)">
                {{ getTypeLabel(selectedNotification.type) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Statut</span>
              <span class="detail-value" :class="getStatusClass(selectedNotification.status)">
                {{ getStatusLabel(selectedNotification.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Contenu</h3>
          <div class="notification-content-preview">
            <div class="notification-title-preview">{{ selectedNotification.title }}</div>
            <div class="notification-body-preview">{{ selectedNotification.content }}</div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Destinataire</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value">{{ getRecipientTypeLabel(selectedNotification) }}</span>
            </div>
            <div class="detail-item" v-if="selectedNotification.recipient">
              <span class="detail-label">Nom</span>
              <span class="detail-value">{{ selectedNotification.recipient.name }}</span>
            </div>
            <div class="detail-item" v-if="selectedNotification.recipient">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ selectedNotification.recipient.email || 'N/A' }}</span>
            </div>
            <div class="detail-item" v-if="selectedNotification.recipient">
              <span class="detail-label">Téléphone</span>
              <span class="detail-value">{{ selectedNotification.recipient.phone || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="selectedNotification.delivery_id">
          <h3>Livraison associée</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID de livraison</span>
              <span class="detail-value">#{{ selectedNotification.delivery_id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value">{{ selectedNotification.delivery_type || 'Standard' }}</span>
            </div>
          </div>
          <button class="btn btn-outline mt-3" @click="viewDelivery(selectedNotification.delivery_id)">
            <i class="fas fa-eye mr-2"></i>
            Voir la livraison
          </button>
        </div>

        <div class="detail-section" v-if="selectedNotification.status === 'failed'">
          <h3>Erreur</h3>
          <div class="error-details">
            <div class="error-message">{{ selectedNotification.error_message || 'Erreur inconnue' }}</div>
            <div class="error-time">{{ formatDateTime(selectedNotification.error_time) }}</div>
          </div>
        </div>

        <div class="modal-actions">
          <button 
            class="btn btn-success" 
            @click="resendNotification(selectedNotification.id)"
            v-if="selectedNotification.status === 'failed'"
          >
            <i class="fas fa-redo mr-2"></i>
            Renvoyer
          </button>
          <button 
            class="btn btn-primary" 
            @click="markAsRead(selectedNotification.id)"
            v-if="selectedNotification.status === 'sent'"
          >
            <i class="fas fa-check mr-2"></i>
            Marquer comme lu
          </button>
          <button class="btn btn-secondary" @click="showNotificationModal = false">Fermer</button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour créer/modifier une notification -->
    <Modal 
      v-if="showCreateModal" 
      @close="showCreateModal = false" 
      :title="editingNotification ? 'Modifier la notification' : 'Nouvelle notification'"
    >
      <div class="notification-form">
        <div class="form-group">
          <label for="notification-title">Titre <span class="required">*</span></label>
          <input 
            type="text" 
            id="notification-title" 
            v-model="newNotification.title" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="notification-content">Contenu <span class="required">*</span></label>
          <textarea 
            id="notification-content" 
            v-model="newNotification.content" 
            rows="4"
            required
          ></textarea>
          <div class="character-count" :class="{ 'limit-reached': newNotification.content.length > 500 }">
            {{ newNotification.content.length }}/500
          </div>
        </div>
        
        <div class="form-group">
          <label for="notification-type">Type <span class="required">*</span></label>
          <select id="notification-type" v-model="newNotification.type" required>
            <option value="info">Information</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="notification-target">Cible <span class="required">*</span></label>
          <select id="notification-target" v-model="newNotification.target" required>
            <option value="all">Tous les utilisateurs</option>
            <option value="clients">Clients</option>
            <option value="couriers">Coursiers</option>
            <option value="specific">Utilisateur spécifique</option>
          </select>
        </div>
        
        <div class="form-group" v-if="newNotification.target === 'specific'">
          <label for="notification-recipient">Destinataire <span class="required">*</span></label>
          <select id="notification-recipient" v-model="newNotification.recipientId" required>
            <option value="">Sélectionner un destinataire</option>
            <option 
              v-for="user in users" 
              :key="user.id" 
              :value="user.id"
            >
              {{ user.name }} ({{ user.role }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="notification-channel">Canal <span class="required">*</span></label>
          <select id="notification-channel" v-model="newNotification.channel" required>
            <option value="in_app">Application</option>
            <option value="push">Push</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="notification-delivery">Livraison associée</label>
          <select id="notification-delivery" v-model="newNotification.deliveryId">
            <option value="">Aucune livraison</option>
            <option 
              v-for="delivery in deliveries" 
              :key="delivery.id" 
              :value="delivery.id"
            >
              #{{ delivery.id }} - {{ formatDate(delivery.created_at) }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="newNotification.sendNow" />
            <span>Envoyer immédiatement</span>
          </label>
        </div>
        
        <div class="form-group" v-if="!newNotification.sendNow">
          <label for="notification-schedule">Programmer pour</label>
          <div class="schedule-datetime">
            <div class="schedule-date">
              <input 
                type="date" 
                id="notification-schedule-date" 
                v-model="newNotification.scheduleDate" 
              />
            </div>
            <div class="schedule-time">
              <input 
                type="time" 
                id="notification-schedule-time" 
                v-model="newNotification.scheduleTime" 
              />
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateModal = false">Annuler</button>
          <button 
            class="btn btn-primary" 
            @click="saveNotification"
            :disabled="!isValidNotification"
          >
            {{ editingNotification ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal pour créer/modifier un modèle -->
    <Modal 
      v-if="showTemplateModal" 
      @close="showTemplateModal = false" 
      :title="editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'"
    >
      <div class="template-form">
        <div class="form-group">
          <label for="template-name">Nom <span class="required">*</span></label>
          <input 
            type="text" 
            id="template-name" 
            v-model="newTemplate.name" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="template-title">Titre <span class="required">*</span></label>
          <input 
            type="text" 
            id="template-title" 
            v-model="newTemplate.title" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="template-content">Contenu <span class="required">*</span></label>
          <textarea 
            id="template-content" 
            v-model="newTemplate.content" 
            rows="4"
            required
          ></textarea>
          <div class="character-count" :class="{ 'limit-reached': newTemplate.content.length > 500 }">
            {{ newTemplate.content.length }}/500
          </div>
        </div>
        
        <div class="form-group">
          <label for="template-type">Type <span class="required">*</span></label>
          <select id="template-type" v-model="newTemplate.type" required>
            <option value="info">Information</option>
            <option value="success">Succès</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="template-target">Cible <span class="required">*</span></label>
          <select id="template-target" v-model="newTemplate.target" required>
            <option value="all">Tous les utilisateurs</option>
            <option value="clients">Clients</option>
            <option value="couriers">Coursiers</option>
            <option value="specific">Utilisateur spécifique</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="template-channel">Canal par défaut <span class="required">*</span></label>
          <select id="template-channel" v-model="newTemplate.channel" required>
            <option value="in_app">Application</option>
            <option value="push">Push</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="template-variables">Variables disponibles</label>
          <div class="variables-list">
            <div class="variable-item" v-for="variable in availableVariables" :key="variable.name">
              <div class="variable-name">{{ variable.name }}</div>
              <div class="variable-description">{{ variable.description }}</div>
              <button 
                class="btn btn-sm btn-outline" 
                @click="insertVariable(variable.name)"
              >
                Insérer
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showTemplateModal = false">Annuler</button>
          <button 
            class="btn btn-primary" 
            @click="saveTemplate"
            :disabled="!isValidTemplate"
          >
            {{ editingTemplate ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Modal de confirmation pour la suppression -->
    <Modal 
      v-if="showDeleteModal" 
      @close="showDeleteModal = false" 
      title="Confirmation de suppression"
    >
      <div class="delete-confirmation">
        <div class="confirmation-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="confirmation-message">
          <p>Êtes-vous sûr de vouloir supprimer {{ deleteType === 'notification' ? 'cette notification' : 'ce modèle' }} ?</p>
          <p class="warning">Cette action est irréversible.</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmDelete">
            <i class="fas fa-trash mr-2"></i>
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import Modal from '@/components/ui/Modal.vue';
import { useToast } from '@/composables/useToast';
import { useRouter } from 'vue-router';

export default {
  name: 'NotificationsManagementView',
  components: {
    Modal
  },
  setup() {
    const { showToast } = useToast();
    const router = useRouter();
    
    // État des onglets
    const activeTab = ref('all');
    
    // État des données
    const notifications = ref([]);
    const templates = ref([]);
    const users = ref([]);
    const deliveries = ref([]);
    const loading = ref(true);
    
    // État des filtres
    const filters = ref({
      type: '',
      status: '',
      dateRange: 'all',
      startDate: null,
      endDate: null,
      search: ''
    });
    
    // État de la recherche de modèles
    const templateSearch = ref('');
    
    // État de la pagination
    const currentPage = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
    
    // État des modals
    const showNotificationModal = ref(false);
    const showCreateModal = ref(false);
    const showTemplateModal = ref(false);
    const showDeleteModal = ref(false);
    
    // État des éléments sélectionnés
    const selectedNotification = ref(null);
    const selectedItemId = ref(null);
    const deleteType = ref('notification');
    
    // État d'édition
    const editingNotification = ref(false);
    const editingTemplate = ref(false);
    
    // État pour la création/modification d'une notification
    const newNotification = ref({
      title: '',
      content: '',
      type: 'info',
      target: 'all',
      recipientId: '',
      channel: 'in_app',
      deliveryId: '',
      sendNow: true,
      scheduleDate: '',
      scheduleTime: ''
    });
    
    // État pour la création/modification d'un modèle
    const newTemplate = ref({
      name: '',
      title: '',
      content: '',
      type: 'info',
      target: 'all',
      channel: 'in_app'
    });
    
    // Variables disponibles pour les modèles
    const availableVariables = [
      { name: '{{user_name}}', description: 'Nom de l\'utilisateur' },
      { name: '{{delivery_id}}', description: 'ID de la livraison' },
      { name: '{{delivery_status}}', description: 'Statut de la livraison' },
      { name: '{{courier_name}}', description: 'Nom du coursier' },
      { name: '{{pickup_address}}', description: 'Adresse de ramassage' },
      { name: '{{delivery_address}}', description: 'Adresse de livraison' },
      { name: '{{estimated_time}}', description: 'Temps estimé' },
      { name: '{{order_amount}}', description: 'Montant de la commande' }
    ];
    
    // Notifications filtrées en fonction de l'onglet actif et des filtres
    const filteredNotifications = computed(() => {
      let filtered = [...notifications.value];
      
      // Filtrer par onglet
      if (activeTab.value === 'clients') {
        filtered = filtered.filter(n => n.target === 'clients' || (n.recipient && n.recipient.role === 'client'));
      } else if (activeTab.value === 'couriers') {
        filtered = filtered.filter(n => n.target === 'couriers' || (n.recipient && n.recipient.role === 'courier'));
      } else if (activeTab.value === 'system') {
        filtered = filtered.filter(n => n.target === 'system');
      }
      
      // Appliquer les filtres
      if (filters.value.type) {
        filtered = filtered.filter(n => n.type === filters.value.type);
      }
      
      if (filters.value.status) {
        filtered = filtered.filter(n => n.status === filters.value.status);
      }
      
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(search) || 
          n.content.toLowerCase().includes(search) || 
          (n.recipient && n.recipient.name.toLowerCase().includes(search))
        );
      }
      
      // Filtrer par date
      if (filters.value.dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(n => new Date(n.created_at) >= today);
      } else if (filters.value.dateRange === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(n => new Date(n.created_at) >= yesterday && new Date(n.created_at) < today);
      } else if (filters.value.dateRange === 'last_week') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        filtered = filtered.filter(n => new Date(n.created_at) >= lastWeek);
      } else if (filters.value.dateRange === 'last_month') {
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        filtered = filtered.filter(n => new Date(n.created_at) >= lastMonth);
      } else if (filters.value.dateRange === 'custom') {
        if (filters.value.startDate) {
          const startDate = new Date(filters.value.startDate);
          startDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(n => new Date(n.created_at) >= startDate);
        }
        
        if (filters.value.endDate) {
          const endDate = new Date(filters.value.endDate);
          endDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(n => new Date(n.created_at) <= endDate);
        }
      }
      
      return filtered;
    });
    
    // Modèles filtrés en fonction de la recherche
    const filteredTemplates = computed(() => {
      if (!templateSearch.value) return templates.value;
      
      const search = templateSearch.value.toLowerCase();
      return templates.value.filter(t => 
        t.name.toLowerCase().includes(search) || 
        t.title.toLowerCase().includes(search) || 
        t.content.toLowerCase().includes(search)
      );
    });
    
    // Validation de la nouvelle notification
    const isValidNotification = computed(() => {
      const notification = newNotification.value;
      
      if (!notification.title.trim()) return false;
      if (!notification.content.trim()) return false;
      if (notification.content.length > 500) return false;
      if (!notification.type) return false;
      if (!notification.target) return false;
      if (notification.target === 'specific' && !notification.recipientId) return false;
      if (!notification.channel) return false;
      
      if (!notification.sendNow) {
        if (!notification.scheduleDate) return false;
        if (!notification.scheduleTime) return false;
        
        // Vérifier que la date programmée est dans le futur
        const scheduledDateTime = new Date(`${notification.scheduleDate}T${notification.scheduleTime}`);
        const now = new Date();
        
        if (scheduledDateTime <= now) return false;
      }
      
      return true;
    });
    
    // Validation du nouveau modèle
    const isValidTemplate = computed(() => {
      const template = newTemplate.value;
      
      if (!template.name.trim()) return false;
      if (!template.title.trim()) return false;
      if (!template.content.trim()) return false;
      if (template.content.length > 500) return false;
      if (!template.type) return false;
      if (!template.target) return false;
      if (!template.channel) return false;
      
      return true;
    });
    
    // Chargement des notifications
    const loadNotifications = async () => {
      try {
        loading.value = true;
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des notifications
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        notifications.value = [
          {
            id: 1,
            title: 'Nouvelle livraison disponible',
            content: 'Une nouvelle livraison est disponible dans votre zone. Consultez l\'application pour plus de détails.',
            type: 'info',
            status: 'sent',
            created_at: new Date(2023, 4, 15, 10, 30),
            target: 'couriers',
            recipient: null,
            channel: 'push',
            delivery_id: null
          },
          {
            id: 2,
            title: 'Livraison #123 en cours',
            content: 'Votre livraison #123 est en cours. Le coursier est en route vers votre adresse.',
            type: 'success',
            status: 'read',
            created_at: new Date(2023, 4, 15, 11, 45),
            target: 'specific',
            recipient: {
              id: 1,
              name: 'Jean Dupont',
              email: 'jean.dupont@example.com',
              phone: '77 123 45 67',
              role: 'client'
            },
            channel: 'in_app',
            delivery_id: 123
          },
          {
            id: 3,
            title: 'Problème de paiement',
            content: 'Nous avons rencontré un problème avec votre dernier paiement. Veuillez vérifier vos informations de paiement.',
            type: 'error',
            status: 'sent',
            created_at: new Date(2023, 4, 16, 9, 15),
            target: 'specific',
            recipient: {
              id: 2,
              name: 'Marie Martin',
              email: 'marie.martin@example.com',
              phone: '77 234 56 78',
              role: 'client'
            },
            channel: 'email',
            delivery_id: null
          },
          {
            id: 4,
            title: 'Maintenance système prévue',
            content: 'Une maintenance système est prévue le 20 mai de 2h à 4h du matin. L\'application pourrait être indisponible pendant cette période.',
            type: 'warning',
            status: 'sent',
            created_at: new Date(2023, 4, 17, 14, 0),
            target: 'all',
            recipient: null,
            channel: 'in_app',
            delivery_id: null
          },
          {
            id: 5,
            title: 'Échec d\'envoi de SMS',
            content: 'L\'envoi du SMS de confirmation a échoué. Veuillez vérifier le numéro de téléphone du destinataire.',
            type: 'error',
            status: 'failed',
            created_at: new Date(2023, 4, 17, 15, 30),
            target: 'system',
            recipient: null,
            channel: 'sms',
            delivery_id: null,
            error_message: 'Numéro de téléphone invalide',
            error_time: new Date(2023, 4, 17, 15, 30)
          }
        ];
        
        totalItems.value = 5;
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        showToast('Erreur lors du chargement des notifications', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Chargement des modèles
    const loadTemplates = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des modèles
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        templates.value = [
          {
            id: 1,
            name: 'Nouvelle livraison',
            title: 'Nouvelle livraison disponible',
            content: 'Une nouvelle livraison est disponible dans votre zone. Consultez l\'application pour plus de détails.',
            type: 'info',
            target: 'couriers',
            channel: 'push'
          },
          {
            id: 2,
            name: 'Livraison en cours',
            title: 'Livraison #{{delivery_id}} en cours',
            content: 'Votre livraison #{{delivery_id}} est en cours. Le coursier {{courier_name}} est en route vers votre adresse.',
            type: 'success',
            target: 'clients',
            channel: 'in_app'
          },
          {
            id: 3,
            name: 'Problème de paiement',
            title: 'Problème de paiement',
            content: 'Nous avons rencontré un problème avec votre dernier paiement. Veuillez vérifier vos informations de paiement.',
            type: 'error',
            target: 'clients',
            channel: 'email'
          },
          {
            id: 4,
            name: 'Maintenance système',
            title: 'Maintenance système prévue',
            content: 'Une maintenance système est prévue le {{date}} de {{start_time}} à {{end_time}}. L\'application pourrait être indisponible pendant cette période.',
            type: 'warning',
            target: 'all',
            channel: 'in_app'
          }
        ];
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
        showToast('Erreur lors du chargement des modèles', 'error');
      }
    };
    
    // Chargement des utilisateurs
    const loadUsers = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des utilisateurs
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        users.value = [
          {
            id: 1,
            name: 'Jean Dupont',
            email: 'jean.dupont@example.com',
            phone: '77 123 45 67',
            role: 'client'
          },
          {
            id: 2,
            name: 'Marie Martin',
            email: 'marie.martin@example.com',
            phone: '77 234 56 78',
            role: 'client'
          },
          {
            id: 3,
            name: 'Pierre Durand',
            email: 'pierre.durand@example.com',
            phone: '77 345 67 89',
            role: 'courier'
          },
          {
            id: 4,
            name: 'Sophie Petit',
            email: 'sophie.petit@example.com',
            phone: '77 456 78 90',
            role: 'courier'
          }
        ];
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    };
    
    // Chargement des livraisons
    const loadDeliveries = async () => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des livraisons
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données fictives pour la démonstration
        deliveries.value = [
          {
            id: 123,
            created_at: new Date(2023, 4, 15, 10, 0)
          },
          {
            id: 124,
            created_at: new Date(2023, 4, 16, 11, 0)
          },
          {
            id: 125,
            created_at: new Date(2023, 4, 17, 12, 0)
          }
        ];
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons:', error);
      }
    };
    
    // Actualiser les notifications
    const refreshNotifications = () => {
      loadNotifications();
    };
    
    // Appliquer les filtres
    const applyFilters = () => {
      // Dans un environnement réel, cette fonction appellerait l'API avec les filtres
      console.log('Filtres appliqués:', filters.value);
    };
    
    // Gestion du changement de plage de dates
    const handleDateRangeChange = () => {
      if (filters.value.dateRange !== 'custom') {
        filters.value.startDate = null;
        filters.value.endDate = null;
      }
      applyFilters();
    };
    
    // Recherche avec debounce
    const debounceSearch = () => {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        applyFilters();
      }, 300);
    };
    
    // Recherche de modèles avec debounce
    const debounceTemplateSearch = () => {
      clearTimeout(window.templateSearchTimeout);
      window.templateSearchTimeout = setTimeout(() => {
        // Dans un environnement réel, cette fonction appellerait l'API pour rechercher des modèles
        console.log('Recherche de modèles:', templateSearch.value);
      }, 300);
    };
    
    // Gestion des changements de page
    const changePage = (page) => {
      currentPage.value = page;
      // Dans un environnement réel, cette fonction appellerait l'API avec la nouvelle page
      console.log('Page changée:', page);
    };
    
    // Formatage de la date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    // Formatage de la date et de l'heure
    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Obtenir la classe CSS pour un type
    const getTypeClass = (type) => {
      switch (type) {
        case 'info': return 'type-info';
        case 'success': return 'type-success';
        case 'warning': return 'type-warning';
        case 'error': return 'type-error';
        default: return '';
      }
    };
    
    // Obtenir l'icône pour un type
    const getTypeIcon = (type) => {
      switch (type) {
        case 'info': return 'fas fa-info-circle';
        case 'success': return 'fas fa-check-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'error': return 'fas fa-times-circle';
        default: return 'fas fa-bell';
      }
    };
    
    // Obtenir le libellé pour un type
    const getTypeLabel = (type) => {
      switch (type) {
        case 'info': return 'Information';
        case 'success': return 'Succès';
        case 'warning': return 'Avertissement';
        case 'error': return 'Erreur';
        default: return type;
      }
    };
    
    // Obtenir la classe CSS pour un statut
    const getStatusClass = (status) => {
      switch (status) {
        case 'sent': return 'status-sent';
        case 'read': return 'status-read';
        case 'pending': return 'status-pending';
        case 'failed': return 'status-failed';
        default: return '';
      }
    };
    
    // Obtenir le libellé pour un statut
    const getStatusLabel = (status) => {
      switch (status) {
        case 'sent': return 'Envoyé';
        case 'read': return 'Lu';
        case 'pending': return 'En attente';
        case 'failed': return 'Échec';
        default: return status;
      }
    };
    
    // Obtenir le libellé pour un destinataire
    const getRecipientLabel = (notification) => {
      if (notification.target === 'all') {
        return 'Tous les utilisateurs';
      } else if (notification.target === 'clients') {
        return 'Tous les clients';
      } else if (notification.target === 'couriers') {
        return 'Tous les coursiers';
      } else if (notification.target === 'system') {
        return 'Système';
      } else if (notification.recipient) {
        return notification.recipient.name;
      } else {
        return 'Inconnu';
      }
    };
    
    // Obtenir le libellé pour un type de destinataire
    const getRecipientTypeLabel = (notification) => {
      if (notification.target === 'all') {
        return 'Tous les utilisateurs';
      } else if (notification.target === 'clients') {
        return 'Tous les clients';
      } else if (notification.target === 'couriers') {
        return 'Tous les coursiers';
      } else if (notification.target === 'system') {
        return 'Système';
      } else if (notification.recipient) {
        return notification.recipient.role === 'client' ? 'Client' : 'Coursier';
      } else {
        return 'Inconnu';
      }
    };
    
    // Obtenir le libellé pour une cible
    const getTargetLabel = (target) => {
      switch (target) {
        case 'all': return 'Tous';
        case 'clients': return 'Clients';
        case 'couriers': return 'Coursiers';
        case 'specific': return 'Spécifique';
        case 'system': return 'Système';
        default: return target;
      }
    };
    
    // Voir les détails d'une notification
    const viewNotificationDetails = async (notificationId) => {
      try {
        loading.value = true;
        
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des détails de la notification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver la notification dans la liste
        const notification = notifications.value.find(n => n.id === notificationId);
        
        if (notification) {
          selectedNotification.value = notification;
          showNotificationModal.value = true;
        } else {
          showToast('Notification non trouvée', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails de la notification:', error);
        showToast('Erreur lors du chargement des détails de la notification', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Voir les détails d'une livraison
    const viewDelivery = (deliveryId) => {
      router.push(`/manager/deliveries/${deliveryId}`);
    };
    
    // Ouvrir le modal de création d'une notification
    const openCreateModal = () => {
      editingNotification.value = false;
      
      // Initialiser avec la date et l'heure actuelles
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      newNotification.value = {
        title: '',
        content: '',
        type: 'info',
        target: 'all',
        recipientId: '',
        channel: 'in_app',
        deliveryId: '',
        sendNow: true,
        scheduleDate: dateStr,
        scheduleTime: timeStr
      };
      
      showCreateModal.value = true;
    };
    
    // Ouvrir le modal de création d'un modèle
    const openCreateTemplateModal = () => {
      editingTemplate.value = false;
      newTemplate.value = {
        name: '',
        title: '',
        content: '',
        type: 'info',
        target: 'all',
        channel: 'in_app'
      };
      showTemplateModal.value = true;
    };
    
    // Éditer un modèle
    const editTemplate = async (templateId) => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des détails du modèle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver le modèle dans la liste
        const template = templates.value.find(t => t.id === templateId);
        
        if (template) {
          editingTemplate.value = true;
          newTemplate.value = { ...template };
          showTemplateModal.value = true;
        } else {
          showToast('Modèle non trouvé', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du modèle:', error);
        showToast('Erreur lors du chargement des détails du modèle', 'error');
      }
    };
    
    // Utiliser un modèle
    const useTemplate = async (templateId) => {
      try {
        // Dans un environnement réel, ces données viendraient de l'API
        // Simuler le chargement des détails du modèle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Trouver le modèle dans la liste
        const template = templates.value.find(t => t.id === templateId);
        
        if (template) {
          editingNotification.value = false;
          
          // Initialiser avec la date et l'heure actuelles
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          newNotification.value = {
            title: template.title,
            content: template.content,
            type: template.type,
            target: template.target,
            recipientId: '',
            channel: template.channel,
            deliveryId: '',
            sendNow: true,
            scheduleDate: dateStr,
            scheduleTime: timeStr
          };
          
          showCreateModal.value = true;
        } else {
          showToast('Modèle non trouvé', 'error');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des détails du modèle:', error);
        showToast('Erreur lors du chargement des détails du modèle', 'error');
      }
    };
    
    // Sauvegarder une notification
    const saveNotification = async () => {
      try {
        if (!isValidNotification.value) return;
        
        // Dans un environnement réel, cette fonction appellerait l'API pour créer ou mettre à jour une notification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast(
          editingNotification.value ? 'Notification mise à jour avec succès' : 'Notification créée avec succès',
          'success'
        );
        showCreateModal.value = false;
        
        // Recharger les notifications
        loadNotifications();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la notification:', error);
        showToast('Erreur lors de la sauvegarde de la notification', 'error');
      }
    };
    
    // Sauvegarder un modèle
    const saveTemplate = async () => {
      try {
        if (!isValidTemplate.value) return;
        
        // Dans un environnement réel, cette fonction appellerait l'API pour créer ou mettre à jour un modèle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast(
          editingTemplate.value ? 'Modèle mis à jour avec succès' : 'Modèle créé avec succès',
          'success'
        );
        showTemplateModal.value = false;
        
        // Recharger les modèles
        loadTemplates();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du modèle:', error);
        showToast('Erreur lors de la sauvegarde du modèle', 'error');
      }
    };
    
    // Marquer une notification comme lue
    const markAsRead = async (notificationId) => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour marquer une notification comme lue
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mettre à jour la notification dans la liste
        const notificationIndex = notifications.value.findIndex(n => n.id === notificationId);
        if (notificationIndex !== -1) {
          notifications.value[notificationIndex].status = 'read';
        }
        
        // Mettre à jour la notification sélectionnée si nécessaire
        if (selectedNotification.value && selectedNotification.value.id === notificationId) {
          selectedNotification.value.status = 'read';
        }
        
        showToast('Notification marquée comme lue', 'success');
      } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue:', error);
        showToast('Erreur lors du marquage de la notification comme lue', 'error');
      }
    };
    
    // Renvoyer une notification
    const resendNotification = async (notificationId) => {
      try {
        // Dans un environnement réel, cette fonction appellerait l'API pour renvoyer une notification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mettre à jour la notification dans la liste
        const notificationIndex = notifications.value.findIndex(n => n.id === notificationId);
        if (notificationIndex !== -1) {
          notifications.value[notificationIndex].status = 'sent';
        }
        
        // Mettre à jour la notification sélectionnée si nécessaire
        if (selectedNotification.value && selectedNotification.value.id === notificationId) {
          selectedNotification.value.status = 'sent';
        }
        
        showToast('Notification renvoyée avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors du renvoi de la notification:', error);
        showToast('Erreur lors du renvoi de la notification', 'error');
      }
    };
    
    // Supprimer une notification
    const deleteNotification = (notificationId) => {
      selectedItemId.value = notificationId;
      deleteType.value = 'notification';
      showDeleteModal.value = true;
    };
    
    // Supprimer un modèle
    const deleteTemplate = (templateId) => {
      selectedItemId.value = templateId;
      deleteType.value = 'template';
      showDeleteModal.value = true;
    };
    
    // Confirmer la suppression
    const confirmDelete = async () => {
      try {
        if (!selectedItemId.value) return;
        
        // Dans un environnement réel, cette fonction appellerait l'API pour supprimer une notification ou un modèle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (deleteType.value === 'notification') {
          // Supprimer la notification de la liste
          notifications.value = notifications.value.filter(n => n.id !== selectedItemId.value);
          showToast('Notification supprimée avec succès', 'success');
        } else {
          // Supprimer le modèle de la liste
          templates.value = templates.value.filter(t => t.id !== selectedItemId.value);
          showToast('Modèle supprimé avec succès', 'success');
        }
        
        showDeleteModal.value = false;
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showToast('Erreur lors de la suppression', 'error');
      }
    };
    
    // Insérer une variable dans le contenu du modèle
    const insertVariable = (variable) => {
      const textarea = document.getElementById('template-content');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = newTemplate.value.content;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        newTemplate.value.content = before + variable + after;
        
        // Placer le curseur après la variable insérée
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start + variable.length;
          textarea.selectionEnd = start + variable.length;
        }, 0);
      } else {
        newTemplate.value.content += variable;
      }
    };
    
    // Charger les données au montage du composant
    onMounted(() => {
      loadNotifications();
      loadTemplates();
      loadUsers();
      loadDeliveries();
    });
    
    // Surveiller les changements d'onglet
    watch(activeTab, (newTab) => {
      if (newTab === 'templates') {
        loadTemplates();
      }
    });
    
    return {
      activeTab,
      notifications,
      templates,
      users,
      deliveries,
      loading,
      filters,
      templateSearch,
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      showNotificationModal,
      showCreateModal,
      showTemplateModal,
      showDeleteModal,
      selectedNotification,
      selectedItemId,
      deleteType,
      editingNotification,
      editingTemplate,
      newNotification,
      newTemplate,
      availableVariables,
      filteredNotifications,
      filteredTemplates,
      isValidNotification,
      isValidTemplate,
      refreshNotifications,
      applyFilters,
      handleDateRangeChange,
      debounceSearch,
      debounceTemplateSearch,
      changePage,
      formatDate,
      formatDateTime,
      getTypeClass,
      getTypeIcon,
      getTypeLabel,
      getStatusClass,
      getStatusLabel,
      getRecipientLabel,
      getRecipientTypeLabel,
      getTargetLabel,
      viewNotificationDetails,
      viewDelivery,
      openCreateModal,
      openCreateTemplateModal,
      editTemplate,
      useTemplate,
      saveNotification,
      saveTemplate,
      markAsRead,
      resendNotification,
      deleteNotification,
      deleteTemplate,
      confirmDelete,
      insertVariable
    };
  }
};
</script>

<style scoped>
.notifications-management-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.tabs {
  display: flex;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow-x: auto;
}

.tab-button {
  padding: 1rem 1.5rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
}

.tab-button:hover {
  color: #4f46e5;
}

.tab-button.active {
  color: #4f46e5;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #4f46e5;
}

.filter-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
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

.search-group {
  flex: 2;
}

.search-input {
  position: relative;
}

.search-input input {
  width: 100%;
  padding: 0.5rem;
  padding-right: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.search-input i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.content-section {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-state i,
.empty-state i {
  margin-bottom: 1rem;
  color: #6b7280;
}

.loading-state p,
.empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-card {
  display: flex;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.notification-read {
  opacity: 0.7;
}

.notification-icon {
  width: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.type-info {
  background-color: #3b82f6;
}

.type-success {
  background-color: #10b981;
}

.type-warning {
  background-color: #f59e0b;
}

.type-error {
  background-color: #ef4444;
}

.notification-content {
  flex: 1;
  padding: 1rem;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notification-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.notification-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.notification-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.notification-status {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-sent {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.status-read {
  background-color: #d1fae5;
  color: #059669;
}

.status-pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-failed {
  background-color: #fee2e2;
  color: #dc2626;
}

.notification-body {
  margin-bottom: 0.5rem;
}

.notification-body p {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-recipient {
  font-size: 0.875rem;
  color: #6b7280;
}

.notification-actions {
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
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-outline {
  background-color: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
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

.pagination {
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

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.templates-header .search-input {
  width: 300px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.template-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.template-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.template-content {
  padding: 1rem;
  flex: 1;
}

.template-preview {
  background-color: #f9fafb;
  border-radius: 0.375rem;
  padding: 1rem;
}

.template-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.template-body {
  color: #4b5563;
  line-height: 1.5;
}

.template-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-meta {
  display: flex;
  gap: 0.5rem;
}

.template-type,
.template-target {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.notification-details {
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #1f2937;
}

.notification-content-preview {
  background-color: #f9fafb;
  border-radius: 0.375rem;
  padding: 1rem;
}

.notification-title-preview {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.notification-body-preview {
  color: #4b5563;
  line-height: 1.5;
}

.error-details {
  background-color: #fee2e2;
  border-radius: 0.375rem;
  padding: 1rem;
}

.error-message {
  color: #b91c1c;
  margin-bottom: 0.5rem;
}

.error-time {
  font-size: 0.875rem;
  color: #ef4444;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.notification-form,
.template-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.character-count {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: right;
}

.character-count.limit-reached {
  color: #ef4444;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.schedule-datetime {
  display: flex;
  gap: 1rem;
}

.schedule-date,
.schedule-time {
  flex: 1;
}

.variables-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variable-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

.variable-name {
  font-weight: 500;
  color: #1f2937;
  margin-right: 0.5rem;
}

.variable-description {
  flex: 1;
  font-size: 0.875rem;
  color: #6b7280;
}

.delete-confirmation {
  padding: 1rem;
  text-align: center;
}

.confirmation-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.confirmation-message {
  margin-bottom: 1.5rem;
}

.confirmation-message p {
  margin-bottom: 0.5rem;
}

.confirmation-message .warning {
  color: #ef4444;
  font-weight: 500;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .schedule-datetime {
    flex-direction: column;
  }
}
</style>
