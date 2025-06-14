<template>
  <div class="policies-view">
    <div class="page-header">
      <h1 class="text-2xl font-bold">Gestion des politiques</h1>
      <div class="actions">
        <button class="btn btn-primary" @click="showPolicyTypeSelector = true">
          <i class="fas fa-plus mr-2"></i> Ajouter une politique
        </button>
      </div>
    </div>

    <!-- Tabs de navigation -->
    <div class="tabs-container mt-6">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <i :class="['mr-2', tab.icon]"></i>
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Contenu des tabs -->
    <div class="tab-content mt-4">
      <!-- Règles de modération -->
      <div v-if="activeTab === 'moderation'" class="tab-pane">
        <div class="filters mb-4 flex items-center">
          <div class="filter-group">
            <label class="mr-2">Statut:</label>
            <select v-model="moderationFilters.active" class="form-select">
              <option :value="null">Tous</option>
              <option :value="true">Actif</option>
              <option :value="false">Inactif</option>
            </select>
          </div>
          <div class="filter-group ml-4">
            <label class="mr-2">Sévérité:</label>
            <select v-model="moderationFilters.severity" class="form-select">
              <option value="">Toutes</option>
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée</option>
              <option value="critical">Critique</option>
            </select>
          </div>
          <div class="search-group ml-auto">
            <input
              type="text"
              v-model="moderationFilters.search"
              placeholder="Rechercher..."
              class="form-input"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="table-auto w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left">Titre</th>
                <th class="px-4 py-2 text-left">Sévérité</th>
                <th class="px-4 py-2 text-left">Action</th>
                <th class="px-4 py-2 text-left">Statut</th>
                <th class="px-4 py-2 text-left">S'applique à</th>
                <th class="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in filteredModerationRules" :key="rule.id" class="border-t">
                <td class="px-4 py-2">{{ rule.title }}</td>
                <td class="px-4 py-2">
                  <span :class="getSeverityClass(rule.severity)">
                    {{ getSeverityLabel(rule.severity) }}
                  </span>
                </td>
                <td class="px-4 py-2">{{ getActionLabel(rule.action) }}</td>
                <td class="px-4 py-2">
                  <span :class="rule.active ? 'badge-success' : 'badge-inactive'">
                    {{ rule.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span v-if="rule.applies_to.clients" class="badge-info">Clients</span>
                    <span v-if="rule.applies_to.couriers" class="badge-info">Coursiers</span>
                    <span v-if="rule.applies_to.businesses" class="badge-info">Entreprises</span>
                  </div>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="btn-icon btn-edit mr-2"
                    @click="editModerationRule(rule)"
                    title="Modifier"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    @click="confirmDeleteRule(rule)"
                    title="Supprimer"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredModerationRules.length === 0">
                <td colspan="6" class="px-4 py-4 text-center text-gray-500">
                  Aucune règle de modération trouvée
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Critères de remboursement -->
      <div v-if="activeTab === 'refund'" class="tab-pane">
        <div class="filters mb-4 flex items-center">
          <div class="filter-group">
            <label class="mr-2">Statut:</label>
            <select v-model="refundFilters.active" class="form-select">
              <option :value="null">Tous</option>
              <option :value="true">Actif</option>
              <option :value="false">Inactif</option>
            </select>
          </div>
          <div class="search-group ml-auto">
            <input
              type="text"
              v-model="refundFilters.search"
              placeholder="Rechercher..."
              class="form-input"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="table-auto w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left">Titre</th>
                <th class="px-4 py-2 text-left">Remboursement</th>
                <th class="px-4 py-2 text-left">Délai max.</th>
                <th class="px-4 py-2 text-left">Auto-approbation</th>
                <th class="px-4 py-2 text-left">Statut</th>
                <th class="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="criteria in filteredRefundCriteria" :key="criteria.id" class="border-t">
                <td class="px-4 py-2">{{ criteria.title }}</td>
                <td class="px-4 py-2">{{ criteria.refund_percentage }}%</td>
                <td class="px-4 py-2">{{ criteria.max_claim_time }} heures</td>
                <td class="px-4 py-2">
                  <span :class="criteria.auto_approve ? 'badge-success' : 'badge-inactive'">
                    {{ criteria.auto_approve ? 'Oui' : 'Non' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <span :class="criteria.active ? 'badge-success' : 'badge-inactive'">
                    {{ criteria.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="btn-icon btn-edit mr-2"
                    @click="editRefundCriteria(criteria)"
                    title="Modifier"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    @click="confirmDeleteCriteria(criteria)"
                    title="Supprimer"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredRefundCriteria.length === 0">
                <td colspan="6" class="px-4 py-4 text-center text-gray-500">
                  Aucun critère de remboursement trouvé
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paramètres de sanction -->
      <div v-if="activeTab === 'sanction'" class="tab-pane">
        <div class="filters mb-4 flex items-center">
          <div class="filter-group">
            <label class="mr-2">Statut:</label>
            <select v-model="sanctionFilters.active" class="form-select">
              <option :value="null">Tous</option>
              <option :value="true">Actif</option>
              <option :value="false">Inactif</option>
            </select>
          </div>
          <div class="filter-group ml-4">
            <label class="mr-2">Type d'infraction:</label>
            <select v-model="sanctionFilters.violationType" class="form-select">
              <option value="">Tous</option>
              <option value="late_delivery">Retard de livraison</option>
              <option value="cancellation">Annulation</option>
              <option value="bad_behavior">Mauvais comportement</option>
              <option value="fraud">Fraude</option>
              <option value="safety">Sécurité</option>
            </select>
          </div>
          <div class="search-group ml-auto">
            <input
              type="text"
              v-model="sanctionFilters.search"
              placeholder="Rechercher..."
              class="form-input"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="table-auto w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left">Titre</th>
                <th class="px-4 py-2 text-left">Type d'infraction</th>
                <th class="px-4 py-2 text-left">Seuil d'avertissement</th>
                <th class="px-4 py-2 text-left">Seuil de suspension</th>
                <th class="px-4 py-2 text-left">Statut</th>
                <th class="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="parameter in filteredSanctionParameters"
                :key="parameter.id"
                class="border-t"
              >
                <td class="px-4 py-2">{{ parameter.title }}</td>
                <td class="px-4 py-2">{{ getViolationTypeLabel(parameter.violation_type) }}</td>
                <td class="px-4 py-2">{{ parameter.warning_threshold }}</td>
                <td class="px-4 py-2">{{ parameter.suspension_threshold }}</td>
                <td class="px-4 py-2">
                  <span :class="parameter.active ? 'badge-success' : 'badge-inactive'">
                    {{ parameter.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="btn-icon btn-edit mr-2"
                    @click="editSanctionParameter(parameter)"
                    title="Modifier"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    @click="confirmDeleteParameter(parameter)"
                    title="Supprimer"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredSanctionParameters.length === 0">
                <td colspan="6" class="px-4 py-4 text-center text-gray-500">
                  Aucun paramètre de sanction trouvé
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modèles SMS -->
      <div v-if="activeTab === 'sms'" class="tab-pane">
        <div class="filters mb-4 flex items-center">
          <div class="filter-group">
            <label class="mr-2">Statut:</label>
            <select v-model="smsFilters.active" class="form-select">
              <option :value="null">Tous</option>
              <option :value="true">Actif</option>
              <option :value="false">Inactif</option>
            </select>
          </div>
          <div class="filter-group ml-4">
            <label class="mr-2">Type d'événement:</label>
            <select v-model="smsFilters.eventType" class="form-select">
              <option value="">Tous</option>
              <option value="delivery_created">Création de livraison</option>
              <option value="delivery_accepted">Acceptation de livraison</option>
              <option value="delivery_picked_up">Prise en charge</option>
              <option value="delivery_completed">Livraison terminée</option>
              <option value="delivery_delayed">Livraison retardée</option>
              <option value="payment_received">Paiement reçu</option>
              <option value="account_suspended">Compte suspendu</option>
              <option value="critical_alert">Alerte critique</option>
            </select>
          </div>
          <div class="search-group ml-auto">
            <input
              type="text"
              v-model="smsFilters.search"
              placeholder="Rechercher..."
              class="form-input"
            />
          </div>
        </div>

        <div class="table-container">
          <table class="table-auto w-full">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left">Nom</th>
                <th class="px-4 py-2 text-left">Type d'événement</th>
                <th class="px-4 py-2 text-left">Priorité</th>
                <th class="px-4 py-2 text-left">Statut</th>
                <th class="px-4 py-2 text-left">S'applique à</th>
                <th class="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="template in filteredSmsTemplates" :key="template.id" class="border-t">
                <td class="px-4 py-2">{{ template.name }}</td>
                <td class="px-4 py-2">{{ getEventTypeLabel(template.event_type) }}</td>
                <td class="px-4 py-2">
                  <span :class="getPriorityClass(template.priority)">
                    {{ getPriorityLabel(template.priority) }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <span :class="template.active ? 'badge-success' : 'badge-inactive'">
                    {{ template.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span v-if="template.applies_to.clients" class="badge-info">Clients</span>
                    <span v-if="template.applies_to.couriers" class="badge-info">Coursiers</span>
                    <span v-if="template.applies_to.businesses" class="badge-info"
                      >Entreprises</span
                    >
                  </div>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="btn-icon btn-test mr-2"
                    @click="testSmsTemplate(template)"
                    title="Tester"
                  >
                    <i class="fas fa-paper-plane"></i>
                  </button>
                  <button
                    class="btn-icon btn-edit mr-2"
                    @click="editSmsTemplate(template)"
                    title="Modifier"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    class="btn-icon btn-delete"
                    @click="confirmDeleteTemplate(template)"
                    title="Supprimer"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredSmsTemplates.length === 0">
                <td colspan="6" class="px-4 py-4 text-center text-gray-500">
                  Aucun modèle SMS trouvé
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Sélecteur de type de politique -->
    <modal
      v-if="showPolicyTypeSelector"
      @close="showPolicyTypeSelector = false"
      title="Ajouter une politique"
    >
      <div class="policy-type-selector">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="type in policyTypes"
            :key="type.id"
            class="policy-type-card p-4 border rounded cursor-pointer hover:bg-gray-50"
            @click="selectPolicyType(type.id)"
          >
            <div class="flex items-center">
              <div class="icon-container mr-3">
                <i :class="['text-2xl', type.icon]"></i>
              </div>
              <div class="content">
                <h3 class="font-semibold">{{ type.label }}</h3>
                <p class="text-sm text-gray-600">{{ type.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </modal>

    <!-- Formulaire de règle de modération -->
    <modal
      v-if="showModerationRuleForm"
      @close="showModerationRuleForm = false"
      :title="editingRule ? 'Modifier la règle de modération' : 'Nouvelle règle de modération'"
    >
      <moderation-rule-form
        :rule="currentRule"
        @save="saveModerationRule"
        @cancel="showModerationRuleForm = false"
      />
    </modal>

    <!-- Formulaire de critère de remboursement -->
    <modal
      v-if="showRefundCriteriaForm"
      @close="showRefundCriteriaForm = false"
      :title="
        editingCriteria
          ? 'Modifier le critère de remboursement'
          : 'Nouveau critère de remboursement'
      "
    >
      <refund-criteria-form
        :criteria="currentCriteria"
        @save="saveRefundCriteria"
        @cancel="showRefundCriteriaForm = false"
      />
    </modal>

    <!-- Formulaire de paramètre de sanction -->
    <modal
      v-if="showSanctionParameterForm"
      @close="showSanctionParameterForm = false"
      :title="
        editingParameter ? 'Modifier le paramètre de sanction' : 'Nouveau paramètre de sanction'
      "
    >
      <sanction-parameter-form
        :parameter="currentParameter"
        @save="saveSanctionParameter"
        @cancel="showSanctionParameterForm = false"
      />
    </modal>

    <!-- Formulaire de modèle SMS -->
    <modal
      v-if="showSmsTemplateForm"
      @close="showSmsTemplateForm = false"
      :title="editingTemplate ? 'Modifier le modèle SMS' : 'Nouveau modèle SMS'"
    >
      <sms-template-form
        :template="currentTemplate"
        @save="saveSmsTemplate"
        @cancel="showSmsTemplateForm = false"
      />
    </modal>

    <!-- Formulaire de test SMS -->
    <modal v-if="showSmsTestForm" @close="showSmsTestForm = false" title="Tester l'envoi de SMS">
      <sms-test-form
        :template="currentTemplate"
        @send="sendTestSms"
        @cancel="showSmsTestForm = false"
      />
    </modal>

    <!-- Modal de confirmation de suppression -->
    <confirm-dialog
      v-if="showDeleteConfirm"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import ModerationRuleForm from '@/components/forms/ModerationRuleForm.vue'
import RefundCriteriaForm from '@/components/forms/RefundCriteriaForm.vue'
import SanctionParameterForm from '@/components/forms/SanctionParameterForm.vue'
import SmsTemplateForm from '@/components/forms/SmsTemplateForm.vue'
import SmsTestForm from '@/components/forms/SmsTestForm.vue'
import { useToast } from '@/composables/useToast'
import * as policiesApi from '@/api/policies'

export default {
  name: 'PoliciesView',
  components: {
    Modal,
    ConfirmDialog,
    ModerationRuleForm,
    RefundCriteriaForm,
    SanctionParameterForm,
    SmsTemplateForm,
    SmsTestForm,
  },
  setup() {
    const { showToast } = useToast()

    // État des onglets
    const activeTab = ref('moderation')
    const tabs = [
      { id: 'moderation', label: 'Règles de modération', icon: 'fas fa-gavel' },
      { id: 'refund', label: 'Critères de remboursement', icon: 'fas fa-money-bill-wave' },
      { id: 'sanction', label: 'Paramètres de sanction', icon: 'fas fa-ban' },
      { id: 'sms', label: 'Modèles SMS', icon: 'fas fa-sms' },
    ]

    // Types de politiques pour le sélecteur
    const policyTypes = [
      {
        id: 'moderation',
        label: 'Règle de modération',
        icon: 'fas fa-gavel',
        description: 'Définir les règles pour modérer le comportement des utilisateurs',
      },
      {
        id: 'refund',
        label: 'Critère de remboursement',
        icon: 'fas fa-money-bill-wave',
        description: 'Définir les conditions de remboursement pour les clients',
      },
      {
        id: 'sanction',
        label: 'Paramètre de sanction',
        icon: 'fas fa-ban',
        description: 'Définir les seuils et durées des sanctions pour les infractions',
      },
      {
        id: 'sms',
        label: 'Modèle SMS',
        icon: 'fas fa-sms',
        description: 'Créer des modèles de messages SMS pour différents événements',
      },
    ]

    // État des données
    const moderationRules = ref([])
    const refundCriteria = ref([])
    const sanctionParameters = ref([])
    const smsTemplates = ref([])

    // État des filtres
    const moderationFilters = ref({
      active: null,
      severity: '',
      search: '',
    })

    const refundFilters = ref({
      active: null,
      search: '',
    })

    const sanctionFilters = ref({
      active: null,
      violationType: '',
      search: '',
    })

    const smsFilters = ref({
      active: null,
      eventType: '',
      search: '',
    })

    // État des modals
    const showPolicyTypeSelector = ref(false)
    const showModerationRuleForm = ref(false)
    const showRefundCriteriaForm = ref(false)
    const showSanctionParameterForm = ref(false)
    const showSmsTemplateForm = ref(false)
    const showSmsTestForm = ref(false)
    const showDeleteConfirm = ref(false)

    // État des éléments en cours d'édition
    const currentRule = ref(null)
    const currentCriteria = ref(null)
    const currentParameter = ref(null)
    const currentTemplate = ref(null)
    const editingRule = ref(false)
    const editingCriteria = ref(false)
    const editingParameter = ref(false)
    const editingTemplate = ref(false)

    // État de la confirmation de suppression
    const deleteType = ref('')
    const deleteId = ref(null)
    const deleteConfirmTitle = ref('')
    const deleteConfirmMessage = ref('')

    // Données filtrées
    const filteredModerationRules = computed(() => {
      let filtered = [...moderationRules.value]

      if (moderationFilters.value.active !== null) {
        filtered = filtered.filter(rule => rule.active === moderationFilters.value.active)
      }

      if (moderationFilters.value.severity) {
        filtered = filtered.filter(rule => rule.severity === moderationFilters.value.severity)
      }

      if (moderationFilters.value.search) {
        const search = moderationFilters.value.search.toLowerCase()
        filtered = filtered.filter(
          rule =>
            rule.title.toLowerCase().includes(search) ||
            (rule.description && rule.description.toLowerCase().includes(search))
        )
      }

      return filtered
    })

    const filteredRefundCriteria = computed(() => {
      let filtered = [...refundCriteria.value]

      if (refundFilters.value.active !== null) {
        filtered = filtered.filter(criteria => criteria.active === refundFilters.value.active)
      }

      if (refundFilters.value.search) {
        const search = refundFilters.value.search.toLowerCase()
        filtered = filtered.filter(
          criteria =>
            criteria.title.toLowerCase().includes(search) ||
            (criteria.description && criteria.description.toLowerCase().includes(search))
        )
      }

      return filtered
    })

    const filteredSanctionParameters = computed(() => {
      let filtered = [...sanctionParameters.value]

      if (sanctionFilters.value.active !== null) {
        filtered = filtered.filter(parameter => parameter.active === sanctionFilters.value.active)
      }

      if (sanctionFilters.value.violationType) {
        filtered = filtered.filter(
          parameter => parameter.violation_type === sanctionFilters.value.violationType
        )
      }

      if (sanctionFilters.value.search) {
        const search = sanctionFilters.value.search.toLowerCase()
        filtered = filtered.filter(
          parameter =>
            parameter.title.toLowerCase().includes(search) ||
            (parameter.description && parameter.description.toLowerCase().includes(search))
        )
      }

      return filtered
    })

    const filteredSmsTemplates = computed(() => {
      let filtered = [...smsTemplates.value]

      if (smsFilters.value.active !== null) {
        filtered = filtered.filter(template => template.active === smsFilters.value.active)
      }

      if (smsFilters.value.eventType) {
        filtered = filtered.filter(template => template.event_type === smsFilters.value.eventType)
      }

      if (smsFilters.value.search) {
        const search = smsFilters.value.search.toLowerCase()
        filtered = filtered.filter(
          template =>
            template.name.toLowerCase().includes(search) ||
            template.content.toLowerCase().includes(search)
        )
      }

      return filtered
    })

    // Chargement des données
    const loadData = async () => {
      try {
        const policies = await policiesApi.getAllPolicies()
        moderationRules.value = policies.moderation_rules || []
        refundCriteria.value = policies.refund_criteria || []
        sanctionParameters.value = policies.sanction_parameters || []
        smsTemplates.value = policies.sms_templates || []
      } catch (error) {
        console.error('Erreur lors du chargement des politiques:', error)
        showToast('Erreur lors du chargement des politiques', 'error')
      }
    }

    // Fonctions utilitaires
    const getSeverityClass = severity => {
      switch (severity) {
        case 'low':
          return 'badge-info'
        case 'medium':
          return 'badge-warning'
        case 'high':
          return 'badge-danger'
        case 'critical':
          return 'badge-critical'
        default:
          return 'badge-info'
      }
    }

    const getSeverityLabel = severity => {
      switch (severity) {
        case 'low':
          return 'Faible'
        case 'medium':
          return 'Moyenne'
        case 'high':
          return 'Élevée'
        case 'critical':
          return 'Critique'
        default:
          return severity
      }
    }

    const getActionLabel = action => {
      switch (action) {
        case 'warning':
          return 'Avertissement'
        case 'temporary_ban':
          return 'Suspension temporaire'
        case 'permanent_ban':
          return 'Bannissement permanent'
        case 'review':
          return 'Révision manuelle'
        default:
          return action
      }
    }

    const getViolationTypeLabel = type => {
      switch (type) {
        case 'late_delivery':
          return 'Retard de livraison'
        case 'cancellation':
          return 'Annulation'
        case 'bad_behavior':
          return 'Mauvais comportement'
        case 'fraud':
          return 'Fraude'
        case 'safety':
          return 'Sécurité'
        default:
          return type
      }
    }

    const getEventTypeLabel = type => {
      switch (type) {
        case 'delivery_created':
          return 'Création de livraison'
        case 'delivery_accepted':
          return 'Acceptation de livraison'
        case 'delivery_picked_up':
          return 'Prise en charge'
        case 'delivery_completed':
          return 'Livraison terminée'
        case 'delivery_delayed':
          return 'Livraison retardée'
        case 'payment_received':
          return 'Paiement reçu'
        case 'account_suspended':
          return 'Compte suspendu'
        case 'critical_alert':
          return 'Alerte critique'
        default:
          return type
      }
    }

    const getPriorityClass = priority => {
      switch (priority) {
        case 'low':
          return 'badge-info'
        case 'normal':
          return 'badge-success'
        case 'high':
          return 'badge-warning'
        case 'critical':
          return 'badge-critical'
        default:
          return 'badge-info'
      }
    }

    const getPriorityLabel = priority => {
      switch (priority) {
        case 'low':
          return 'Basse'
        case 'normal':
          return 'Normale'
        case 'high':
          return 'Haute'
        case 'critical':
          return 'Critique'
        default:
          return priority
      }
    }

    // Gestion des actions
    const selectPolicyType = type => {
      showPolicyTypeSelector.value = false

      switch (type) {
        case 'moderation':
          currentRule.value = {
            title: '',
            description: '',
            severity: 'medium',
            action: 'warning',
            ban_duration: 0,
            active: true,
            applies_to: {
              clients: true,
              couriers: true,
              businesses: true,
            },
          }
          editingRule.value = false
          showModerationRuleForm.value = true
          break
        case 'refund':
          currentCriteria.value = {
            title: '',
            description: '',
            refund_percentage: 100,
            max_claim_time: 24,
            auto_approve: false,
            active: true,
            required_proofs: {
              photo: true,
              receipt: false,
              description: true,
            },
          }
          editingCriteria.value = false
          showRefundCriteriaForm.value = true
          break
        case 'sanction':
          currentParameter.value = {
            title: '',
            description: '',
            violation_type: 'late_delivery',
            warning_threshold: 3,
            suspension_threshold: 5,
            suspension_duration: 7,
            expiration_period: 30,
            active: true,
            applies_to: {
              clients: false,
              couriers: true,
              businesses: false,
            },
          }
          editingParameter.value = false
          showSanctionParameterForm.value = true
          break
        case 'sms':
          currentTemplate.value = {
            name: '',
            event_type: 'delivery_created',
            content: '',
            active: true,
            priority: 'normal',
            applies_to: {
              clients: true,
              couriers: false,
              businesses: false,
            },
          }
          editingTemplate.value = false
          showSmsTemplateForm.value = true
          break
      }
    }

    // Gestion des règles de modération
    const editModerationRule = rule => {
      currentRule.value = { ...rule }
      editingRule.value = true
      showModerationRuleForm.value = true
    }

    const saveModerationRule = async rule => {
      try {
        if (editingRule.value) {
          await policiesApi.updateModerationRule(rule.id, rule)
          showToast('Règle de modération mise à jour avec succès', 'success')
        } else {
          await policiesApi.createModerationRule(rule)
          showToast('Règle de modération créée avec succès', 'success')
        }

        showModerationRuleForm.value = false
        loadData()
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de la règle de modération:", error)
        showToast("Erreur lors de l'enregistrement de la règle de modération", 'error')
      }
    }

    const confirmDeleteRule = rule => {
      deleteType.value = 'moderation'
      deleteId.value = rule.id
      deleteConfirmTitle.value = 'Supprimer la règle de modération'
      deleteConfirmMessage.value = `Êtes-vous sûr de vouloir supprimer la règle "${rule.title}" ? Cette action est irréversible.`
      showDeleteConfirm.value = true
    }

    // Gestion des critères de remboursement
    const editRefundCriteria = criteria => {
      currentCriteria.value = { ...criteria }
      editingCriteria.value = true
      showRefundCriteriaForm.value = true
    }

    const saveRefundCriteria = async criteria => {
      try {
        if (editingCriteria.value) {
          await policiesApi.updateRefundCriteria(criteria.id, criteria)
          showToast('Critère de remboursement mis à jour avec succès', 'success')
        } else {
          await policiesApi.createRefundCriteria(criteria)
          showToast('Critère de remboursement créé avec succès', 'success')
        }

        showRefundCriteriaForm.value = false
        loadData()
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du critère de remboursement:", error)
        showToast("Erreur lors de l'enregistrement du critère de remboursement", 'error')
      }
    }

    const confirmDeleteCriteria = criteria => {
      deleteType.value = 'refund'
      deleteId.value = criteria.id
      deleteConfirmTitle.value = 'Supprimer le critère de remboursement'
      deleteConfirmMessage.value = `Êtes-vous sûr de vouloir supprimer le critère "${criteria.title}" ? Cette action est irréversible.`
      showDeleteConfirm.value = true
    }

    // Gestion des paramètres de sanction
    const editSanctionParameter = parameter => {
      currentParameter.value = { ...parameter }
      editingParameter.value = true
      showSanctionParameterForm.value = true
    }

    const saveSanctionParameter = async parameter => {
      try {
        if (editingParameter.value) {
          await policiesApi.updateSanctionParameter(parameter.id, parameter)
          showToast('Paramètre de sanction mis à jour avec succès', 'success')
        } else {
          await policiesApi.createSanctionParameter(parameter)
          showToast('Paramètre de sanction créé avec succès', 'success')
        }

        showSanctionParameterForm.value = false
        loadData()
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du paramètre de sanction:", error)
        showToast("Erreur lors de l'enregistrement du paramètre de sanction", 'error')
      }
    }

    const confirmDeleteParameter = parameter => {
      deleteType.value = 'sanction'
      deleteId.value = parameter.id
      deleteConfirmTitle.value = 'Supprimer le paramètre de sanction'
      deleteConfirmMessage.value = `Êtes-vous sûr de vouloir supprimer le paramètre "${parameter.title}" ? Cette action est irréversible.`
      showDeleteConfirm.value = true
    }

    // Gestion des modèles SMS
    const editSmsTemplate = template => {
      currentTemplate.value = { ...template }
      editingTemplate.value = true
      showSmsTemplateForm.value = true
    }

    const saveSmsTemplate = async template => {
      try {
        if (editingTemplate.value) {
          await policiesApi.updateSmsTemplate(template.id, template)
          showToast('Modèle SMS mis à jour avec succès', 'success')
        } else {
          await policiesApi.createSmsTemplate(template)
          showToast('Modèle SMS créé avec succès', 'success')
        }

        showSmsTemplateForm.value = false
        loadData()
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du modèle SMS:", error)
        showToast("Erreur lors de l'enregistrement du modèle SMS", 'error')
      }
    }

    const testSmsTemplate = template => {
      currentTemplate.value = { ...template }
      showSmsTestForm.value = true
    }

    const sendTestSms = async testData => {
      try {
        await policiesApi.testSmsTemplate(testData)
        showToast('SMS de test envoyé avec succès', 'success')
        showSmsTestForm.value = false
      } catch (error) {
        console.error("Erreur lors de l'envoi du SMS de test:", error)
        showToast("Erreur lors de l'envoi du SMS de test", 'error')
      }
    }

    const confirmDeleteTemplate = template => {
      deleteType.value = 'sms'
      deleteId.value = template.id
      deleteConfirmTitle.value = 'Supprimer le modèle SMS'
      deleteConfirmMessage.value = `Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ? Cette action est irréversible.`
      showDeleteConfirm.value = true
    }

    // Confirmation de suppression
    const confirmDelete = async () => {
      try {
        switch (deleteType.value) {
          case 'moderation':
            await policiesApi.deleteModerationRule(deleteId.value)
            showToast('Règle de modération supprimée avec succès', 'success')
            break
          case 'refund':
            await policiesApi.deleteRefundCriteria(deleteId.value)
            showToast('Critère de remboursement supprimé avec succès', 'success')
            break
          case 'sanction':
            await policiesApi.deleteSanctionParameter(deleteId.value)
            showToast('Paramètre de sanction supprimé avec succès', 'success')
            break
          case 'sms':
            await policiesApi.deleteSmsTemplate(deleteId.value)
            showToast('Modèle SMS supprimé avec succès', 'success')
            break
        }

        showDeleteConfirm.value = false
        loadData()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        showToast('Erreur lors de la suppression', 'error')
      }
    }

    // Chargement initial des données
    onMounted(() => {
      loadData()
    })

    return {
      // État des onglets
      activeTab,
      tabs,

      // Types de politiques
      policyTypes,

      // Données
      moderationRules,
      refundCriteria,
      sanctionParameters,
      smsTemplates,

      // Filtres
      moderationFilters,
      refundFilters,
      sanctionFilters,
      smsFilters,

      // Données filtrées
      filteredModerationRules,
      filteredRefundCriteria,
      filteredSanctionParameters,
      filteredSmsTemplates,

      // Modals
      showPolicyTypeSelector,
      showModerationRuleForm,
      showRefundCriteriaForm,
      showSanctionParameterForm,
      showSmsTemplateForm,
      showSmsTestForm,
      showDeleteConfirm,

      // Éléments en cours d'édition
      currentRule,
      currentCriteria,
      currentParameter,
      currentTemplate,
      editingRule,
      editingCriteria,
      editingParameter,
      editingTemplate,

      // Confirmation de suppression
      deleteConfirmTitle,
      deleteConfirmMessage,

      // Fonctions utilitaires
      getSeverityClass,
      getSeverityLabel,
      getActionLabel,
      getViolationTypeLabel,
      getEventTypeLabel,
      getPriorityClass,
      getPriorityLabel,

      // Actions
      selectPolicyType,
      editModerationRule,
      saveModerationRule,
      confirmDeleteRule,
      editRefundCriteria,
      saveRefundCriteria,
      confirmDeleteCriteria,
      editSanctionParameter,
      saveSanctionParameter,
      confirmDeleteParameter,
      editSmsTemplate,
      saveSmsTemplate,
      testSmsTemplate,
      sendTestSms,
      confirmDeleteTemplate,
      confirmDelete,
    }
  },
}
</script>

<style scoped>
.policies-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tabs-container {
  border-bottom: 1px solid #e2e8f0;
}

.tabs {
  display: flex;
  overflow-x: auto;
}

.tab-button {
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}

.tab-button.active {
  border-bottom-color: #4f46e5;
  color: #4f46e5;
}

.tab-button:hover:not(.active) {
  border-bottom-color: #e2e8f0;
}

.tab-content {
  padding-top: 1rem;
}

.filters {
  background-color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.form-select,
.form-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.table-container {
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

.badge-success {
  background-color: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge-inactive {
  background-color: #9ca3af;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge-info {
  background-color: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge-warning {
  background-color: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge-danger {
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge-critical {
  background-color: #7f1d1d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.btn-icon {
  padding: 0.375rem;
  border-radius: 0.375rem;
  cursor: pointer;
}

.btn-edit {
  color: #3b82f6;
}

.btn-delete {
  color: #ef4444;
}

.btn-test {
  color: #10b981;
}

.policy-type-card {
  transition: all 0.2s ease;
}

.policy-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
