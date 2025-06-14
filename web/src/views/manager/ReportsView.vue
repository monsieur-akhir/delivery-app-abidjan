<template>
  <div class="reports-view">
    <div class="page-header">
      <h1>Rapports</h1>
      <div class="actions">
        <button class="btn btn-outline" @click="refreshData">
          <i class="fas fa-sync-alt"></i> Actualiser
        </button>
        <button class="btn btn-primary" @click="showGenerateReportModal = true">
          <i class="fas fa-plus"></i> Générer un rapport
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="filters-row">
        <div class="filter-group">
          <label for="report-type">Type de rapport</label>
          <select id="report-type" v-model="filters.reportType" @change="applyFilters">
            <option value="">Tous les types</option>
            <option value="financial">Financier</option>
            <option value="delivery">Livraisons</option>
            <option value="user">Utilisateurs</option>
            <option value="business">Entreprises</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-range">Période</label>
          <div class="date-range-picker">
            <input type="date" v-model="filters.startDate" @change="applyFilters" />
            <span>à</span>
            <input type="date" v-model="filters.endDate" @change="applyFilters" />
          </div>
        </div>

        <div class="filter-group">
          <label for="search">Recherche</label>
          <div class="search-input">
            <input
              type="text"
              id="search"
              v-model="filters.search"
              placeholder="Nom, description..."
              @input="debounceSearch"
            />
            <i class="fas fa-search"></i>
          </div>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-secondary" @click="resetFilters">
          <i class="fas fa-times"></i> Réinitialiser les filtres
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <i class="fas fa-filter"></i> Appliquer les filtres
        </button>
      </div>
    </div>

    <!-- Tableau des rapports -->
    <div class="table-container" v-if="!loading && reports.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Période</th>
            <th>Format</th>
            <th>Créé le</th>
            <th>Créé par</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports" :key="report.id">
            <td>{{ report.id }}</td>
            <td>{{ report.name }}</td>
            <td>
              <span class="report-type" :class="getReportTypeClass(report.type)">
                {{ getReportTypeLabel(report.type) }}
              </span>
            </td>
            <td>{{ formatDateRange(report.start_date, report.end_date) }}</td>
            <td>
              <span class="report-format">
                <i :class="getFormatIcon(report.format)"></i>
                {{ getFormatLabel(report.format) }}
              </span>
            </td>
            <td>{{ formatDateTime(report.created_at) }}</td>
            <td>{{ report.created_by }}</td>
            <td>
              <div class="actions-cell">
                <a class="btn-icon" :href="report.download_url" download title="Télécharger">
                  <i class="fas fa-download"></i>
                </a>
                <button
                  class="btn-icon"
                  @click="viewReportDetails(report.id)"
                  title="Voir les détails"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" @click="regenerateReport(report.id)" title="Régénérer">
                  <i class="fas fa-redo"></i>
                </button>
                <button class="btn-icon" @click="deleteReport(report.id)" title="Supprimer">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button class="btn-page" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          <i class="fas fa-chevron-left"></i>
        </button>

        <button
          v-for="page in displayedPages"
          :key="page"
          class="btn-page"
          :class="{ active: currentPage === page }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>

        <button
          class="btn-page"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- État vide -->
    <div class="empty-state" v-else-if="!loading && reports.length === 0">
      <div class="empty-icon">
        <i class="fas fa-file-alt"></i>
      </div>
      <h3>Aucun rapport trouvé</h3>
      <p>
        Aucun rapport ne correspond à vos critères de recherche ou aucun rapport n'a été généré.
      </p>
      <button class="btn btn-primary" @click="showGenerateReportModal = true">
        Générer un rapport
      </button>
    </div>

    <!-- Chargement -->
    <div class="loading-container" v-if="loading">
      <div class="spinner"></div>
      <p>Chargement des rapports...</p>
    </div>

    <!-- Modal de génération de rapport -->
    <div class="modal" v-if="showGenerateReportModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Générer un nouveau rapport</h2>
          <button class="btn-close" @click="showGenerateReportModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="report-form">
            <div class="form-group">
              <label for="report-name">Nom du rapport</label>
              <input
                type="text"
                id="report-name"
                v-model="reportForm.name"
                placeholder="Entrez un nom pour ce rapport"
              />
            </div>

            <div class="form-group">
              <label for="report-type-select">Type de rapport</label>
              <select id="report-type-select" v-model="reportForm.type">
                <option value="financial">Rapport financier</option>
                <option value="delivery">Rapport de livraisons</option>
                <option value="user">Rapport d'utilisateurs</option>
                <option value="business">Rapport d'entreprises</option>
                <option value="performance">Rapport de performance</option>
              </select>
            </div>

            <div class="form-group">
              <label for="report-period">Période</label>
              <select id="report-period" v-model="reportForm.period" @change="handlePeriodChange">
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="this_week">Cette semaine</option>
                <option value="last_week">Semaine dernière</option>
                <option value="this_month">Ce mois</option>
                <option value="last_month">Mois dernier</option>
                <option value="this_year">Cette année</option>
                <option value="custom">Personnalisée</option>
              </select>
            </div>

            <div class="form-group date-range" v-if="reportForm.period === 'custom'">
              <label>Période personnalisée</label>
              <div class="date-range-picker">
                <input type="date" v-model="reportForm.startDate" />
                <span>à</span>
                <input type="date" v-model="reportForm.endDate" />
              </div>
            </div>

            <div class="form-group">
              <label for="report-format">Format</label>
              <select id="report-format" v-model="reportForm.format">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div class="form-group">
              <label for="report-description">Description (optionnelle)</label>
              <textarea
                id="report-description"
                v-model="reportForm.description"
                rows="3"
                placeholder="Ajoutez une description pour ce rapport"
              ></textarea>
            </div>

            <div class="form-group" v-if="reportForm.type === 'financial'">
              <label>Options financières</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeTransactions" />
                  Inclure les transactions détaillées
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeCharts" />
                  Inclure les graphiques
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeComparisons" />
                  Inclure les comparaisons avec les périodes précédentes
                </label>
              </div>
            </div>

            <div class="form-group" v-if="reportForm.type === 'delivery'">
              <label>Options de livraison</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeDeliveryDetails" />
                  Inclure les détails des livraisons
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includePerformanceMetrics" />
                  Inclure les métriques de performance
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeGeographicData" />
                  Inclure les données géographiques
                </label>
              </div>
            </div>

            <div
              class="form-group"
              v-if="reportForm.type === 'user' || reportForm.type === 'business'"
            >
              <label>Options d'utilisateurs/entreprises</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeActivityMetrics" />
                  Inclure les métriques d'activité
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeGrowthData" />
                  Inclure les données de croissance
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="reportForm.options.includeRetentionData" />
                  Inclure les données de rétention
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showGenerateReportModal = false">
            Annuler
          </button>
          <button
            class="btn btn-primary"
            @click="generateReport"
            :disabled="!isReportFormValid || generatingReport"
          >
            <i class="fas fa-spinner fa-spin" v-if="generatingReport"></i>
            {{ generatingReport ? 'Génération en cours...' : 'Générer le rapport' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de détails de rapport -->
    <div class="modal" v-if="showReportDetailsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails du rapport: {{ selectedReport?.name }}</h2>
          <button class="btn-close" @click="closeReportDetailsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedReport">
          <div class="report-details">
            <div class="detail-section">
              <h3>Informations générales</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">ID</span>
                  <span class="detail-value">{{ selectedReport.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nom</span>
                  <span class="detail-value">{{ selectedReport.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Type</span>
                  <span
                    class="detail-value report-type"
                    :class="getReportTypeClass(selectedReport.type)"
                  >
                    {{ getReportTypeLabel(selectedReport.type) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Format</span>
                  <span class="detail-value">
                    <i :class="getFormatIcon(selectedReport.format)"></i>
                    {{ getFormatLabel(selectedReport.format) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Taille du fichier</span>
                  <span class="detail-value">{{ formatFileSize(selectedReport.file_size) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Créé le</span>
                  <span class="detail-value">{{ formatDateTime(selectedReport.created_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Créé par</span>
                  <span class="detail-value">{{ selectedReport.created_by }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Dernière génération</span>
                  <span class="detail-value">{{
                    formatDateTime(selectedReport.last_generated_at)
                  }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Période du rapport</h3>
              <div class="date-range-info">
                <div class="date-range-item">
                  <span class="date-label">Date de début:</span>
                  <span class="date-value">{{ formatDate(selectedReport.start_date) }}</span>
                </div>
                <div class="date-range-item">
                  <span class="date-label">Date de fin:</span>
                  <span class="date-value">{{ formatDate(selectedReport.end_date) }}</span>
                </div>
                <div class="date-range-duration">
                  <i class="fas fa-calendar-alt"></i>
                  {{ formatDateRangeDuration(selectedReport.start_date, selectedReport.end_date) }}
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedReport.description">
              <h3>Description</h3>
              <p class="report-description">{{ selectedReport.description }}</p>
            </div>

            <div class="detail-section">
              <h3>Paramètres du rapport</h3>
              <div class="report-parameters">
                <div
                  class="parameter-item"
                  v-for="(value, key) in selectedReport.parameters"
                  :key="key"
                >
                  <span class="parameter-label">{{ formatParameterLabel(key) }}:</span>
                  <span class="parameter-value">{{ formatParameterValue(key, value) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>Aperçu</h3>
              <div class="report-preview">
                <div class="preview-placeholder" v-if="selectedReport.format === 'pdf'">
                  <i class="fas fa-file-pdf"></i>
                  <p>Aperçu PDF non disponible</p>
                </div>
                <div class="preview-placeholder" v-else-if="selectedReport.format === 'excel'">
                  <i class="fas fa-file-excel"></i>
                  <p>Aperçu Excel non disponible</p>
                </div>
                <div class="preview-placeholder" v-else-if="selectedReport.format === 'csv'">
                  <i class="fas fa-file-csv"></i>
                  <p>Aperçu CSV non disponible</p>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedReport.summary">
              <h3>Résumé</h3>
              <div class="report-summary">
                <div
                  class="summary-item"
                  v-for="(item, index) in selectedReport.summary"
                  :key="index"
                >
                  <div class="summary-label">{{ item.label }}</div>
                  <div class="summary-value">{{ item.value }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeReportDetailsModal">Fermer</button>
          <a class="btn btn-primary" :href="selectedReport?.download_url" download>
            <i class="fas fa-download"></i> Télécharger
          </a>
          <button class="btn btn-outline" @click="regenerateReport(selectedReport?.id)">
            <i class="fas fa-redo"></i> Régénérer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div class="modal" v-if="showDeleteConfirmModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button class="btn-close" @click="showDeleteConfirmModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirmModal = false">Annuler</button>
          <button class="btn btn-danger" @click="confirmDeleteReport">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  fetchReports,
  fetchReportDetails,
  generateReport as generateReportApi,
  deleteReport as deleteReportApi,
} from '@/api/manager'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'

export default {
  name: 'ReportsView',
  setup() {
    // État
    const reports = ref([])
    const selectedReport = ref(null)
    const reportToDelete = ref(null)
    const showGenerateReportModal = ref(false)
    const showReportDetailsModal = ref(false)
    const showDeleteConfirmModal = ref(false)
    const loading = ref(true)
    const generatingReport = ref(false)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)

    const filters = reactive({
      reportType: '',
      startDate: '',
      endDate: '',
      search: '',
    })

    const reportForm = reactive({
      name: '',
      type: 'financial',
      period: 'this_month',
      startDate: '',
      endDate: '',
      format: 'pdf',
      description: '',
      options: {
        includeTransactions: true,
        includeCharts: true,
        includeComparisons: false,
        includeDeliveryDetails: true,
        includePerformanceMetrics: true,
        includeGeographicData: false,
        includeActivityMetrics: true,
        includeGrowthData: true,
        includeRetentionData: false,
      },
    })

    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          type: filters.reportType,
          start_date: filters.startDate,
          end_date: filters.endDate,
          search: filters.search,
        }

        const response = await fetchReports(params)
        reports.value = response.items
        totalItems.value = response.total
        totalPages.value = response.pages
      } catch (error) {
        console.error('Erreur lors du chargement des rapports:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      fetchData()
    }

    const applyFilters = () => {
      currentPage.value = 1
      fetchData()
    }

    const resetFilters = () => {
      filters.reportType = ''
      filters.startDate = ''
      filters.endDate = ''
      filters.search = ''
      currentPage.value = 1
      fetchData()
    }

    const changePage = page => {
      currentPage.value = page
      fetchData()
    }

    const handlePeriodChange = () => {
      if (reportForm.period !== 'custom') {
        // Réinitialiser les dates personnalisées si une période prédéfinie est sélectionnée
        reportForm.startDate = ''
        reportForm.endDate = ''
      } else {
        // Définir des dates par défaut pour la période personnalisée
        const today = new Date()
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        reportForm.endDate = formatDateForInput(today)
        reportForm.startDate = formatDateForInput(lastMonth)
      }
    }

    const formatDateForInput = date => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const viewReportDetails = async reportId => {
      try {
        loading.value = true
        const response = await fetchReportDetails(reportId)
        selectedReport.value = response
        showReportDetailsModal.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails du rapport:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const closeReportDetailsModal = () => {
      showReportDetailsModal.value = false
      selectedReport.value = null
    }

    const generateReport = async () => {
      try {
        generatingReport.value = true

        const payload = {
          name: reportForm.name,
          type: reportForm.type,
          period: reportForm.period,
          format: reportForm.format,
          description: reportForm.description,
          options: reportForm.options,
        }

        if (reportForm.period === 'custom') {
          payload.start_date = reportForm.startDate
          payload.end_date = reportForm.endDate
        }

        await generateReportApi(payload)

        // Fermer le modal
        showGenerateReportModal.value = false

        // Réinitialiser le formulaire
        resetReportForm()

        // Rafraîchir les données
        fetchData()

        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        generatingReport.value = false
      }
    }

    const resetReportForm = () => {
      reportForm.name = ''
      reportForm.type = 'financial'
      reportForm.period = 'this_month'
      reportForm.startDate = ''
      reportForm.endDate = ''
      reportForm.format = 'pdf'
      reportForm.description = ''

      // Réinitialiser les options
      Object.keys(reportForm.options).forEach(key => {
        reportForm.options[key] = key.includes('include')
      })
    }

    const regenerateReport = async reportId => {
      try {
        loading.value = true

        // Récupérer les détails du rapport pour obtenir les paramètres originaux
        await fetchReportDetails(reportId)

        // Régénérer le rapport avec les mêmes paramètres
        await generateReportApi({
          regenerate_id: reportId,
        })

        // Fermer le modal de détails si ouvert
        if (
          showReportDetailsModal.value &&
          selectedReport.value &&
          selectedReport.value.id === reportId
        ) {
          closeReportDetailsModal()
        }

        // Rafraîchir les données
        fetchData()

        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la régénération du rapport:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        loading.value = false
      }
    }

    const deleteReport = reportId => {
      reportToDelete.value = reportId
      showDeleteConfirmModal.value = true
    }

    const confirmDeleteReport = async () => {
      try {
        if (!reportToDelete.value) return

        await deleteReportApi(reportToDelete.value)

        // Fermer le modal de confirmation
        showDeleteConfirmModal.value = false

        // Rafraîchir les données
        fetchData()

        // Afficher une notification de succès
      } catch (error) {
        console.error('Erreur lors de la suppression du rapport:', error)
        // Gérer l'erreur (afficher une notification, etc.)
      } finally {
        reportToDelete.value = null
      }
    }

    // Utilitaires
    const formatDateRange = (startDate, endDate) => {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }

    const formatDateRangeDuration = (startDate, endDate) => {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return 'Même jour'
      } else if (diffDays === 1) {
        return '1 jour'
      } else if (diffDays < 7) {
        return `${diffDays} jours`
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return weeks === 1 ? '1 semaine' : `${weeks} semaines`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return months === 1 ? '1 mois' : `${months} mois`
      } else {
        const years = Math.floor(diffDays / 365)
        return years === 1 ? '1 an' : `${years} ans`
      }
    }

    const getReportTypeClass = type => {
      const typeMap = {
        financial: 'type-financial',
        delivery: 'type-delivery',
        user: 'type-user',
        business: 'type-business',
        performance: 'type-performance',
      }
      return typeMap[type] || 'type-unknown'
    }

    const getReportTypeLabel = type => {
      const typeMap = {
        financial: 'Financier',
        delivery: 'Livraisons',
        user: 'Utilisateurs',
        business: 'Entreprises',
        performance: 'Performance',
      }
      return typeMap[type] || 'Inconnu'
    }

    const getFormatIcon = format => {
      const formatMap = {
        pdf: 'fas fa-file-pdf',
        excel: 'fas fa-file-excel',
        csv: 'fas fa-file-csv',
      }
      return formatMap[format] || 'fas fa-file'
    }

    const getFormatLabel = format => {
      const formatMap = {
        pdf: 'PDF',
        excel: 'Excel',
        csv: 'CSV',
      }
      return formatMap[format] || format.toUpperCase()
    }

    const formatFileSize = sizeInBytes => {
      if (!sizeInBytes) return '0 B'

      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let size = sizeInBytes
      let unitIndex = 0

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    const formatParameterLabel = key => {
      // Convertir camelCase en mots séparés avec première lettre majuscule
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }

    const formatParameterValue = (key, value) => {
      if (typeof value === 'boolean') {
        return value ? 'Oui' : 'Non'
      } else if (key.includes('date')) {
        return formatDate(value)
      } else if (typeof value === 'number') {
        return value.toString()
      } else {
        return value
      }
    }

    // Validation du formulaire
    const isReportFormValid = computed(() => {
      if (!reportForm.name.trim()) return false

      if (reportForm.period === 'custom') {
        if (!reportForm.startDate || !reportForm.endDate) return false

        // Vérifier que la date de début est antérieure à la date de fin
        const startDate = new Date(reportForm.startDate)
        const endDate = new Date(reportForm.endDate)
        if (startDate > endDate) return false
      }

      return true
    })

    // Pagination calculée
    const displayedPages = computed(() => {
      const pages = []
      const maxVisiblePages = 5

      if (totalPages.value <= maxVisiblePages) {
        // Afficher toutes les pages si le nombre total est inférieur ou égal au maximum visible
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        // Calculer les pages à afficher
        let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
        let endPage = startPage + maxVisiblePages - 1

        if (endPage > totalPages.value) {
          endPage = totalPages.value
          startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
      }

      return pages
    })

    // Debounce pour la recherche
    let searchTimeout = null
    const debounceSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        applyFilters()
      }, 500)
    }

    // Cycle de vie
    onMounted(() => {
      fetchData()
      handlePeriodChange() // Initialiser les dates pour le formulaire
    })

    // Surveiller les changements de page
    watch(currentPage, () => {
      fetchData()
    })

    return {
      reports,
      selectedReport,
      reportToDelete,
      showGenerateReportModal,
      showReportDetailsModal,
      showDeleteConfirmModal,
      loading,
      generatingReport,
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      filters,
      reportForm,
      isReportFormValid,
      displayedPages,

      fetchData,
      refreshData,
      applyFilters,
      resetFilters,
      changePage,
      handlePeriodChange,
      viewReportDetails,
      closeReportDetailsModal,
      generateReport,
      resetReportForm,
      regenerateReport,
      deleteReport,
      confirmDeleteReport,
      debounceSearch,

      formatDateRange,
      formatDateRangeDuration,
      getReportTypeClass,
      getReportTypeLabel,
      getFormatIcon,
      getFormatLabel,
      formatFileSize,
      formatParameterLabel,
      formatParameterValue,

      formatCurrency,
      formatDate,
      formatDateTime,
    }
  },
}
</script>

<style scoped>
.reports-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
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
  gap: 0.5rem;
}

.btn-primary {
  background-color: #0056b3;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #004494;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-outline {
  background-color: transparent;
  color: #0056b3;
  border: 1px solid #0056b3;
}

.btn-outline:hover {
  background-color: rgba(0, 86, 179, 0.1);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.filters-container {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: #495057;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.date-range-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range-picker input {
  flex: 1;
}

.search-input {
  position: relative;
}

.search-input input {
  padding-right: 2.5rem;
}

.search-input i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.table-container {
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background-color: #f8f9fa;
}

.report-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-financial {
  background-color: #d1ecf1;
  color: #0c5460;
}

.type-delivery {
  background-color: #d4edda;
  color: #155724;
}

.type-user {
  background-color: #cce5ff;
  color: #004085;
}

.type-business {
  background-color: #e2e3e5;
  color: #383d41;
}

.type-performance {
  background-color: #fff3cd;
  color: #856404;
}

.report-format {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-icon:hover {
  background-color: #f8f9fa;
}

.btn-icon i {
  font-size: 0.875rem;
  color: #6c757d;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 1rem;
  gap: 0.25rem;
}

.btn-page {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #495057;
}

.btn-page:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #ced4da;
}

.btn-page.active {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  background-color: white;
  border-radius: 0.5rem;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: #333;
}

.empty-state p {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 0.25rem solid rgba(0, 86, 179, 0.1);
  border-radius: 50%;
  border-top-color: #0056b3;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  font-size: 0.875rem;
  color: #6c757d;
}

.modal {
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

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content.modal-sm {
  max-width: 500px;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.btn-close {
  background-color: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #495057;
}

.form-group select,
.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.report-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 500;
  color: #333;
}

.date-range-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-range-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-label {
  font-weight: 500;
  color: #495057;
  width: 100px;
}

.date-value {
  color: #333;
}

.date-range-duration {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.report-description {
  font-size: 0.875rem;
  color: #495057;
  margin: 0;
}

.report-parameters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.parameter-item {
  display: flex;
  align-items: center;
}

.parameter-label {
  font-weight: 500;
  color: #495057;
  width: 200px;
}

.parameter-value {
  color: #333;
}

.report-preview {
  height: 200px;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  overflow: hidden;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #6c757d;
}

.preview-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.preview-placeholder p {
  margin: 0;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  text-align: center;
}

.summary-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    min-width: 100%;
  }

  .data-table {
    display: block;
    overflow-x: auto;
  }

  .modal-content {
    width: 95%;
  }

  .detail-grid,
  .report-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .filters-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-footer {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn {
    width: 100%;
  }
}
</style>
