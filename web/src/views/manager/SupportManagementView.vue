<template>
  <div class="support-management">
    <!-- En-tête avec statistiques -->
    <div class="dashboard-header">
      <h1>Gestion du Support Client</h1>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.overview.open_tickets }}</div>
          <div class="stat-label">Tickets Ouverts</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.overview.tickets_today }}</div>
          <div class="stat-label">Aujourd'hui</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">
            {{ Math.round(dashboard.overview.avg_resolution_time_hours) }}h
          </div>
          <div class="stat-label">Temps Moyen</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ dashboard.overview.avg_satisfaction_score.toFixed(1) }}</div>
          <div class="stat-label">Satisfaction</div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="count-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Contenu des onglets -->
    <div class="tab-content">
      <!-- Liste des tickets -->
      <div v-if="activeTab === 'tickets'" class="tickets-section">
        <!-- Filtres -->
        <div class="filters">
          <select v-model="filters.status" @change="loadTickets">
            <option value="">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="waiting_customer">En attente client</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>

          <select v-model="filters.priority" @change="loadTickets">
            <option value="">Toutes priorités</option>
            <option value="critical">Critique</option>
            <option value="urgent">Urgent</option>
            <option value="high">Élevée</option>
            <option value="normal">Normale</option>
            <option value="low">Basse</option>
          </select>

          <select v-model="filters.category" @change="loadTickets">
            <option value="">Toutes catégories</option>
            <option value="delivery_issue">Problème livraison</option>
            <option value="payment_issue">Problème paiement</option>
            <option value="technical_issue">Problème technique</option>
            <option value="account_issue">Problème compte</option>
            <option value="refund_request">Demande remboursement</option>
            <option value="general_inquiry">Question générale</option>
            <option value="complaint">Plainte</option>
          </select>

          <button @click="toggleAssignedToMe" :class="{ active: filters.assignedToMe }">
            Mes tickets
          </button>
        </div>

        <!-- Liste des tickets -->
        <div class="tickets-list">
          <div
            v-for="ticket in tickets"
            :key="ticket.id"
            :class="['ticket-item', `priority-${ticket.priority}`]"
            @click="selectTicket(ticket)"
          >
            <div class="ticket-header">
              <span class="ticket-number">#{{ ticket.ticket_number }}</span>
              <span :class="['status-badge', ticket.status]">{{
                getStatusLabel(ticket.status)
              }}</span>
              <span :class="['priority-badge', ticket.priority]">{{
                getPriorityLabel(ticket.priority)
              }}</span>
            </div>

            <h3 class="ticket-title">{{ ticket.title }}</h3>
            <p class="ticket-description">{{ ticket.description.substring(0, 100) }}...</p>

            <div class="ticket-meta">
              <span class="user">{{ ticket.user.full_name }}</span>
              <span class="date">{{ formatDate(ticket.created_at) }}</span>
              <span v-if="ticket.assigned_agent" class="agent">
                Assigné à: {{ ticket.assigned_agent.full_name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button
            v-for="page in totalPages"
            :key="page"
            :class="{ active: currentPage === page }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </div>
      </div>

      <!-- Détails du ticket -->
      <div v-if="activeTab === 'ticket-details' && selectedTicket" class="ticket-details">
        <div class="ticket-header-detail">
          <h2>Ticket #{{ selectedTicket.ticket_number }}</h2>
          <div class="ticket-actions">
            <select v-model="selectedTicket.status" @change="updateTicketStatus">
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="waiting_customer">En attente client</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>

            <select v-model="selectedTicket.assigned_agent_id" @change="assignTicket">
              <option value="">Non assigné</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.full_name }}
              </option>
            </select>
          </div>
        </div>

        <div class="ticket-content">
          <div class="ticket-info">
            <h3>{{ selectedTicket.title }}</h3>
            <p>{{ selectedTicket.description }}</p>

            <div class="meta-info">
              <div><strong>Utilisateur:</strong> {{ selectedTicket.user.full_name }}</div>
              <div><strong>Catégorie:</strong> {{ getCategoryLabel(selectedTicket.category) }}</div>
              <div><strong>Priorité:</strong> {{ getPriorityLabel(selectedTicket.priority) }}</div>
              <div><strong>Créé le:</strong> {{ formatDate(selectedTicket.created_at) }}</div>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-section">
            <h4>Conversation</h4>
            <div class="messages">
              <div
                v-for="message in ticketMessages"
                :key="message.id"
                :class="[
                  'message',
                  { internal: message.is_internal, automated: message.is_automated },
                ]"
              >
                <div class="message-header">
                  <span class="sender">{{ message.sender.full_name }}</span>
                  <span class="time">{{ formatDateTime(message.created_at) }}</span>
                  <span v-if="message.is_internal" class="internal-tag">Interne</span>
                </div>
                <div class="message-content">{{ message.message }}</div>
              </div>
            </div>

            <!-- Répondre -->
            <div class="reply-section">
              <textarea
                v-model="replyMessage"
                placeholder="Tapez votre réponse..."
                rows="4"
              ></textarea>
              <div class="reply-actions">
                <label>
                  <input type="checkbox" v-model="isInternalMessage" />
                  Message interne
                </label>
                <button @click="sendReply" :disabled="!replyMessage.trim()">Envoyer</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Base de connaissances -->
      <div v-if="activeTab === 'knowledge-base'" class="knowledge-base">
        <div class="kb-header">
          <h3>Base de Connaissances</h3>
          <button @click="showCreateArticle = true" class="btn-primary">Nouvel Article</button>
        </div>

        <div class="kb-search">
          <input
            type="text"
            v-model="searchQuery"
            @input="searchArticles"
            placeholder="Rechercher dans la base de connaissances..."
          />
        </div>

        <div class="articles-list">
          <div
            v-for="article in knowledgeBase"
            :key="article.id"
            class="article-item"
            @click="selectArticle(article)"
          >
            <h4>{{ article.title }}</h4>
            <p>{{ article.content.substring(0, 150) }}...</p>
            <div class="article-meta">
              <span class="category">{{ article.category }}</span>
              <span class="views">{{ article.view_count }} vues</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Analyses -->
      <div v-if="activeTab === 'analytics'" class="analytics">
        <div class="charts-grid">
          <div class="chart-container">
            <h4>Tickets par Catégorie</h4>
            <PieChart :data="ticketsByCategoryChart" />
          </div>

          <div class="chart-container">
            <h4>Performance des Agents</h4>
            <HorizontalBarChart :data="ticketsByAgentChart" />
          </div>

          <div class="chart-container">
            <h4>Évolution des Tickets</h4>
            <LineChart :data="ticketsEvolutionChart" />
          </div>

          <div class="chart-container">
            <h4>Temps de Résolution</h4>
            <AreaChart :data="resolutionTimeChart" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal création article -->
    <Modal v-if="showCreateArticle" @close="showCreateArticle = false">
      <div class="create-article-form">
        <h3>Créer un Article</h3>
        <form @submit.prevent="createArticle">
          <div class="form-group">
            <label>Titre</label>
            <input type="text" v-model="newArticle.title" required />
          </div>

          <div class="form-group">
            <label>Catégorie</label>
            <select v-model="newArticle.category" required>
              <option value="faq">FAQ</option>
              <option value="guide">Guide</option>
              <option value="troubleshooting">Dépannage</option>
              <option value="policy">Politique</option>
            </select>
          </div>

          <div class="form-group">
            <label>Contenu</label>
            <textarea v-model="newArticle.content" rows="10" required></textarea>
          </div>

          <div class="form-group">
            <label>Tags (séparés par des virgules)</label>
            <input type="text" v-model="newArticle.tags" />
          </div>

          <div class="form-actions">
            <button type="button" @click="showCreateArticle = false">Annuler</button>
            <button type="submit">Créer</button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { supportAPI } from '../../api/support'
import Modal from '../../components/ui/Modal.vue'
import PieChart from '../../components/charts/PieChart.vue'
import HorizontalBarChart from '../../components/charts/HorizontalBarChart.vue'
import LineChart from '../../components/charts/LineChart.vue'
import AreaChart from '../../components/charts/AreaChart.vue'

export default {
  name: 'SupportManagementView',
  components: {
    Modal,
    PieChart,
    HorizontalBarChart,
    LineChart,
    AreaChart,
  },
  setup() {
    const activeTab = ref('tickets')
    const tickets = ref([])
    const selectedTicket = ref(null)
    const ticketMessages = ref([])
    const knowledgeBase = ref([])
    const dashboard = ref({
      overview: {
        total_tickets: 0,
        open_tickets: 0,
        tickets_today: 0,
        avg_resolution_time_hours: 0,
        avg_satisfaction_score: 0,
      },
      tickets_by_category: [],
      tickets_by_agent: [],
    })

    const filters = reactive({
      status: '',
      priority: '',
      category: '',
      assignedToMe: false,
    })

    const currentPage = ref(1)
    const totalPages = ref(1)
    const searchQuery = ref('')
    const replyMessage = ref('')
    const isInternalMessage = ref(false)
    const showCreateArticle = ref(false)
    const agents = ref([])

    const newArticle = reactive({
      title: '',
      category: '',
      content: '',
      tags: '',
    })

    const tabs = computed(() => [
      { id: 'tickets', label: 'Tickets', count: dashboard.value.overview.open_tickets },
      { id: 'ticket-details', label: 'Détails', count: null },
      { id: 'knowledge-base', label: 'Base de Connaissances', count: null },
      { id: 'analytics', label: 'Analyses', count: null },
    ])

    const ticketsByCategoryChart = computed(() => ({
      labels: dashboard.value.tickets_by_category.map(item => item.category),
      datasets: [
        {
          data: dashboard.value.tickets_by_category.map(item => item.count),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    }))

    const ticketsByAgentChart = computed(() => ({
      labels: dashboard.value.tickets_by_agent.map(item => item.agent),
      datasets: [
        {
          label: 'Tickets assignés',
          data: dashboard.value.tickets_by_agent.map(item => item.count),
          backgroundColor: '#36A2EB',
        },
      ],
    }))

    const loadDashboard = async () => {
      try {
        const response = await supportAPI.getDashboard()
        dashboard.value = response.data
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error)
      }
    }

    const loadTickets = async () => {
      try {
        const params = {
          page: currentPage.value,
          ...filters,
          assigned_to_me: filters.assignedToMe,
        }
        const response = await supportAPI.getTickets(params)
        tickets.value = response.data.tickets
        totalPages.value = response.data.total_pages
      } catch (error) {
        console.error('Erreur lors du chargement des tickets:', error)
      }
    }

    const selectTicket = async ticket => {
      selectedTicket.value = ticket
      activeTab.value = 'ticket-details'

      try {
        const response = await supportAPI.getTicketMessages(ticket.id)
        ticketMessages.value = response.data.messages
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
      }
    }

    const updateTicketStatus = async () => {
      try {
        await supportAPI.updateTicket(selectedTicket.value.id, {
          status: selectedTicket.value.status,
        })
        loadTickets()
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error)
      }
    }

    const assignTicket = async () => {
      try {
        await supportAPI.updateTicket(selectedTicket.value.id, {
          assigned_agent_id: selectedTicket.value.assigned_agent_id,
        })
        loadTickets()
      } catch (error) {
        console.error("Erreur lors de l'assignation:", error)
      }
    }

    const sendReply = async () => {
      try {
        await supportAPI.addMessage(selectedTicket.value.id, {
          message: replyMessage.value,
          is_internal: isInternalMessage.value,
        })

        replyMessage.value = ''
        isInternalMessage.value = false

        // Recharger les messages
        const response = await supportAPI.getTicketMessages(selectedTicket.value.id)
        ticketMessages.value = response.data.messages
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error)
      }
    }

    const loadKnowledgeBase = async () => {
      try {
        const response = await supportAPI.getKnowledgeBase({ search: searchQuery.value })
        knowledgeBase.value = response.data.articles
      } catch (error) {
        console.error('Erreur lors du chargement de la base de connaissances:', error)
      }
    }

    const createArticle = async () => {
      try {
        await supportAPI.createKnowledgeArticle(newArticle)
        showCreateArticle.value = false
        loadKnowledgeBase()

        // Reset form
        Object.keys(newArticle).forEach(key => {
          newArticle[key] = ''
        })
      } catch (error) {
        console.error("Erreur lors de la création de l'article:", error)
      }
    }

    const getStatusLabel = status => {
      const labels = {
        open: 'Ouvert',
        in_progress: 'En cours',
        waiting_customer: 'En attente',
        resolved: 'Résolu',
        closed: 'Fermé',
      }
      return labels[status] || status
    }

    const getPriorityLabel = priority => {
      const labels = {
        critical: 'Critique',
        urgent: 'Urgent',
        high: 'Élevée',
        normal: 'Normale',
        low: 'Basse',
      }
      return labels[priority] || priority
    }

    const getCategoryLabel = category => {
      const labels = {
        delivery_issue: 'Problème livraison',
        payment_issue: 'Problème paiement',
        technical_issue: 'Problème technique',
        account_issue: 'Problème compte',
        refund_request: 'Demande remboursement',
        general_inquiry: 'Question générale',
        complaint: 'Plainte',
      }
      return labels[category] || category
    }

    const formatDate = date => {
      return new Date(date).toLocaleDateString('fr-FR')
    }

    const formatDateTime = date => {
      return new Date(date).toLocaleString('fr-FR')
    }

    const toggleAssignedToMe = () => {
      filters.assignedToMe = !filters.assignedToMe
      loadTickets()
    }

    const changePage = page => {
      currentPage.value = page
      loadTickets()
    }

    const searchArticles = () => {
      loadKnowledgeBase()
    }

    onMounted(() => {
      loadDashboard()
      loadTickets()
      loadKnowledgeBase()
    })

    return {
      activeTab,
      tickets,
      selectedTicket,
      ticketMessages,
      knowledgeBase,
      dashboard,
      filters,
      currentPage,
      totalPages,
      searchQuery,
      replyMessage,
      isInternalMessage,
      showCreateArticle,
      agents,
      newArticle,
      tabs,
      ticketsByCategoryChart,
      ticketsByAgentChart,
      loadTickets,
      selectTicket,
      updateTicketStatus,
      assignTicket,
      sendReply,
      createArticle,
      getStatusLabel,
      getPriorityLabel,
      getCategoryLabel,
      formatDate,
      formatDateTime,
      toggleAssignedToMe,
      changePage,
      searchArticles,
    }
  },
}
</script>

<style scoped>
.support-management {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #2563eb;
}

.stat-label {
  color: #6b7280;
  margin-top: 5px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.tab-button {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  position: relative;
}

.tab-button.active {
  border-bottom-color: #2563eb;
  color: #2563eb;
}

.count-badge {
  background: #ef4444;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8em;
  margin-left: 8px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.filters select,
.filters button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.filters button.active {
  background: #2563eb;
  color: white;
}

.tickets-list {
  space-y: 10px;
}

.ticket-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.ticket-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.ticket-item.priority-critical {
  border-left-color: #dc2626;
}

.ticket-item.priority-urgent {
  border-left-color: #ea580c;
}

.ticket-item.priority-high {
  border-left-color: #f59e0b;
}

.ticket-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.ticket-number {
  font-weight: bold;
  color: #374151;
}

.status-badge,
.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-badge.open {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.in_progress {
  background: #fef3c7;
  color: #d97706;
}
.status-badge.resolved {
  background: #d1fae5;
  color: #065f46;
}

.priority-badge.critical {
  background: #fee2e2;
  color: #dc2626;
}
.priority-badge.urgent {
  background: #fed7aa;
  color: #ea580c;
}
.priority-badge.high {
  background: #fef3c7;
  color: #d97706;
}

.ticket-title {
  font-size: 1.1em;
  margin-bottom: 8px;
  color: #111827;
}

.ticket-description {
  color: #6b7280;
  margin-bottom: 15px;
}

.ticket-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9em;
  color: #6b7280;
}

.ticket-details {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.ticket-header-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.ticket-actions {
  display: flex;
  gap: 10px;
}

.messages-section {
  margin-top: 30px;
}

.messages {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.message {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.message.internal {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.sender {
  font-weight: bold;
}

.internal-tag {
  background: #f59e0b;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}

.reply-section textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.knowledge-base {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.kb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.kb-search input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-bottom: 20px;
}

.article-item {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
}

.article-item:hover {
  background: #f3f4f6;
}

.article-meta {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  font-size: 0.9em;
  color: #6b7280;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-article-form {
  width: 600px;
  max-width: 90vw;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
}

.pagination button.active {
  background: #2563eb;
  color: white;
}
</style>
