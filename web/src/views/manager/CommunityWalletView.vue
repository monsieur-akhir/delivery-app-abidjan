<template>
  <div class="community-wallet-view">
    <div class="page-header">
      <h1>Portefeuille Communautaire</h1>
      <div class="actions">
        <button class="btn btn-primary" @click="openAddFundsModal">
          <font-awesome-icon icon="plus" class="mr-1" />
          Ajouter des fonds
        </button>
        <button class="btn btn-outline" @click="exportAnalytics">
          <font-awesome-icon icon="file-export" class="mr-1" />
          Exporter les données d'analyse
        </button>
      </div>
    </div>

    <div class="wallet-stats">
      <div class="stat-card bg-primary">
        <div class="stat-icon">
          <font-awesome-icon icon="wallet" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.totalBalance) }}</div>
          <div class="stat-label">Solde total</div>
        </div>
      </div>
      <div class="stat-card bg-success">
        <div class="stat-icon">
          <font-awesome-icon icon="money-bill-wave" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.totalLoaned) }}</div>
          <div class="stat-label">Total prêté</div>
        </div>
      </div>
      <div class="stat-card bg-warning">
        <div class="stat-icon">
          <font-awesome-icon icon="hourglass-half" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.pendingRepayments) }}</div>
          <div class="stat-label">Remboursements en attente</div>
        </div>
      </div>
      <div class="stat-card bg-danger">
        <div class="stat-icon">
          <font-awesome-icon icon="exclamation-triangle" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.activeLoans }}</div>
          <div class="stat-label">Prêts actifs</div>
        </div>
      </div>
    </div>

    <div class="wallet-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <font-awesome-icon :icon="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <div class="wallet-content">
      <div v-if="loading" class="loading-state">
        <font-awesome-icon icon="spinner" spin size="2x" />
        <p>Chargement en cours...</p>
      </div>
      <div v-else-if="activeTab === 'pending'" class="loan-cards">
        <div
          v-for="loan in pendingLoans"
          :key="loan.id"
          class="loan-card"
          @click="viewLoanDetails(loan.id)"
        >
          <div class="loan-header">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="loan.user.profile_picture" :src="loan.user.profile_picture" :alt="loan.user.name" />
                <div v-else class="avatar-placeholder">{{ getInitials(loan.user.name) }}</div>
              </div>
              <div class="user-details">
                <h3>{{ loan.user.name }}</h3>
                <div class="user-meta">
                  <span class="user-role" :class="getRoleClass(loan.user.role)">
                    {{ getRoleLabel(loan.user.role) }}
                  </span>
                  <span class="user-rating">
                    <font-awesome-icon icon="star" class="star-icon" />
                    {{ loan.user.rating }}
                  </span>
                </div>
              </div>
            </div>
            <div class="loan-amount">
              <div class="amount-value">{{ formatCurrency(loan.amount) }}</div>
              <div class="amount-label">Montant demandé</div>
            </div>
          </div>
          <div class="loan-details">
            <div class="detail-item">
              <div class="detail-label">Date de demande</div>
              <div class="detail-value">{{ formatDate(loan.requested_at) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Durée</div>
              <div class="detail-value">{{ loan.duration }} jours</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Motif</div>
              <div class="detail-value">{{ loan.reason }}</div>
            </div>
          </div>
          <div class="loan-actions">
            <button class="btn btn-success" @click.stop="approveLoan(loan.id)">
              <font-awesome-icon icon="check-circle" class="mr-1" />
              Approuver
            </button>
            <button class="btn btn-danger" @click.stop="openRejectModal(loan.id)">
              <font-awesome-icon icon="times-circle" class="mr-1" />
              Rejeter
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="activeTab === 'active'" class="loan-cards">
        <div
          v-for="loan in activeLoans"
          :key="loan.id"
          class="loan-card"
          @click="viewLoanDetails(loan.id)"
        >
          <div class="loan-header">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="loan.user.profile_picture" :src="loan.user.profile_picture" :alt="loan.user.name" />
                <div v-else class="avatar-placeholder">{{ getInitials(loan.user.name) }}</div>
              </div>
              <div class="user-details">
                <h3>{{ loan.user.name }}</h3>
                <div class="user-meta">
                  <span class="user-role" :class="getRoleClass(loan.user.role)">
                    {{ getRoleLabel(loan.user.role) }}
                  </span>
                  <span class="user-rating">
                    <font-awesome-icon icon="star" class="star-icon" />
                    {{ loan.user.rating }}
                  </span>
                </div>
              </div>
            </div>
            <div class="loan-amount">
              <div class="amount-value">{{ formatCurrency(loan.amount) }}</div>
              <div class="amount-label">Montant prêté</div>
            </div>
          </div>
          <div class="loan-details">
            <div class="detail-item">
              <div class="detail-label">Date d'approbation</div>
              <div class="detail-value">{{ formatDate(loan.approved_at) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Date d'échéance</div>
              <div class="detail-value">
                <span :class="{ 'text-danger': isOverdue(loan.due_date) }">
                  {{ formatDate(loan.due_date) }}
                  <span v-if="isOverdue(loan.due_date)" class="overdue-badge">En retard</span>
                </span>
              </div>
            </div>
          </div>
          <div class="loan-actions">
            <button class="btn btn-success" @click.stop="markAsRepaid(loan.id)">
              <font-awesome-icon icon="check-circle" class="mr-1" />
              Marquer comme remboursé
            </button>
            <button class="btn btn-warning" @click.stop="extendLoan(loan.id)">
              <font-awesome-icon icon="calendar-plus" class="mr-1" />
              Prolonger
            </button>
            <button class="btn btn-danger" @click.stop="writeOffLoan(loan.id)">
              <font-awesome-icon icon="trash-alt" class="mr-1" />
              Passer en perte
            </button>
            <button class="btn btn-info" @click.stop="sendReminder(loan.id)">
              <font-awesome-icon icon="bell" class="mr-1" />
              Envoyer un rappel
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="activeTab === 'history'" class="loan-cards">
        <div
          v-for="loan in loanHistory"
          :key="loan.id"
          class="loan-card"
          @click="viewLoanDetails(loan.id)"
        >
          <div class="loan-header">
            <div class="user-info">
              <div class="user-avatar">
                <img v-if="loan.user.profile_picture" :src="loan.user.profile_picture" :alt="loan.user.name" />
                <div v-else class="avatar-placeholder">{{ getInitials(loan.user.name) }}</div>
              </div>
              <div class="user-details">
                <h3>{{ loan.user.name }}</h3>
                <div class="user-meta">
                  <span class="user-role" :class="getRoleClass(loan.user.role)">
                    {{ getRoleLabel(loan.user.role) }}
                  </span>
                  <span class="user-rating">
                    <font-awesome-icon icon="star" class="star-icon" />
                    {{ loan.user.rating }}
                  </span>
                </div>
              </div>
            </div>
            <div class="loan-amount">
              <div class="amount-value">{{ formatCurrency(loan.amount) }}</div>
              <div class="amount-label">Montant prêté</div>
            </div>
          </div>
          <div class="loan-details">
            <div class="detail-item">
              <div class="detail-label">Statut</div>
              <div class="detail-value">
                <span class="status-badge" :class="getLoanStatusClass(loan.status)">
                  {{ getLoanStatusLabel(loan.status) }}
                </span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Date de remboursement</div>
              <div class="detail-value">{{ loan.repaid_at ? formatDate(loan.repaid_at) : '-' }}</div>
            </div>
          </div>
          <div class="loan-actions">
            <button class="btn btn-info" @click.stop="exportLoanDetails(loan.id)">
              <font-awesome-icon icon="file-export" class="mr-1" />
              Exporter
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="activeTab === 'analytics'" class="analytics-cards">
        <div class="analytics-card">
          <h3>Taux de remboursement</h3>
          <div class="progress-circle" :style="{ '--progress': `${analytics.repaymentRate}%` }">
            <div class="progress-circle-inner">
              <div class="progress-value">{{ analytics.repaymentRate }}%</div>
            </div>
          </div>
          <div class="analytics-details">
            <div class="analytics-detail-item">
              <div class="detail-label">Prêts remboursés</div>
              <div class="detail-value">{{ analytics.loansRepaid }}</div>
            </div>
            <div class="analytics-detail-item">
              <div class="detail-label">Prêts en perte</div>
              <div class="detail-value">{{ analytics.loansDefaulted }}</div>
            </div>
          </div>
        </div>
        <div class="analytics-card">
          <h3>Montant moyen des prêts</h3>
          <div class="chart-placeholder">
            <div class="pie-chart-placeholder">
              <div class="pie-segment" style="--color: #4e73df; --percentage: 50%;"></div>
              <div class="pie-segment" style="--color: #e74a3b; --percentage: 50%;"></div>
            </div>
            <div class="chart-value">{{ formatCurrency(analytics.averageLoanAmount) }}</div>
          </div>
          <div class="analytics-details">
            <div class="analytics-detail-item">
              <div class="detail-label">Minimum</div>
              <div class="detail-value">{{ formatCurrency(analytics.minLoanAmount) }}</div>
            </div>
            <div class="analytics-detail-item">
              <div class="detail-label">Maximum</div>
              <div class="detail-value">{{ formatCurrency(analytics.maxLoanAmount) }}</div>
            </div>
          </div>
          <div class="analytics-legend">
            <div class="legend-item">
              <div class="legend-color" style="background-color: #4e73df;"></div>
              <div class="legend-label">Prêts remboursés</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #e74a3b;"></div>
              <div class="legend-label">Prêts en perte</div>
            </div>
          </div>
        </div>
        <div class="analytics-card">
          <h3>Durée moyenne des prêts</h3>
          <div class="chart-placeholder">
            <div class="pie-chart-placeholder">
              <div class="pie-segment" style="--color: #1cc88a; --percentage: 50%;"></div>
              <div class="pie-segment" style="--color: #f6c23e; --percentage: 50%;"></div>
            </div>
            <div class="chart-value">{{ analytics.averageLoanDuration }} jours</div>
          </div>
          <div class="analytics-details">
            <div class="analytics-detail-item">
              <div class="detail-label">Minimum</div>
              <div class="detail-value">{{ analytics.minLoanDuration }} jours</div>
            </div>
            <div class="analytics-detail-item">
              <div class="detail-label">Maximum</div>
              <div class="detail-value">{{ analytics.maxLoanDuration }} jours</div>
            </div>
          </div>
          <div class="analytics-legend">
            <div class="legend-item">
              <div class="legend-color" style="background-color: #1cc88a;"></div>
              <div class="legend-label">Durée courte</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #f6c23e;"></div>
              <div class="legend-label">Durée longue</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de rejet de prêt -->
    <div class="modal" v-if="showRejectLoanModal">
      <div class="modal-backdrop" @click="closeRejectModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Rejeter le prêt</h3>
          <button class="modal-close" @click="closeRejectModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="rejection-reason">Raison du rejet</label>
            <select id="rejection-reason" v-model="rejectionReason" class="form-control">
              <option value="insufficient_funds">Fonds insuffisants</option>
              <option value="high_risk">Risque élevé</option>
              <option value="incomplete_information">Informations incomplètes</option>
              <option value="previous_defaults">Défauts de paiement antérieurs</option>
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
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRejectModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmReject" :disabled="!isValidRejectionReason">
            <font-awesome-icon icon="save" class="mr-1" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout de fonds -->
    <div class="modal" v-if="showAddFundsModal">
      <div class="modal-backdrop" @click="closeAddFundsModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ajouter des fonds</h3>
          <button class="modal-close" @click="closeAddFundsModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="funds-amount">Montant (FCFA)</label>
            <input 
              type="number" 
              id="funds-amount" 
              v-model.number="fundsAmount" 
              min="1000"
              step="1000"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="funds-source">Source des fonds</label>
            <select id="funds-source" v-model="fundsSource" class="form-control">
              <option value="company">Entreprise</option>
              <option value="donation">Don</option>
              <option value="government">Gouvernement</option>
              <option value="ngo">ONG</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div class="form-group" v-if="fundsSource === 'other'">
            <label for="custom-funds-source">Source personnalisée</label>
            <input id="custom-funds-source" v-model="customFundsSource" class="form-control" />
          </div>
          <div class="form-group">
            <label for="funds-description">Description</label>
            <textarea id="funds-description" v-model="fundsDescription" class="form-control" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddFundsModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmAddFunds" :disabled="!isValidFundsAmount">
            <font-awesome-icon icon="plus-circle" class="mr-1" />
            Ajouter
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de détails du prêt -->
    <div class="modal" v-if="showLoanDetailsModal">
      <div class="modal-backdrop" @click="closeLoanDetailsModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Détails du prêt</h3>
          <button class="modal-close" @click="closeLoanDetailsModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="!selectedLoan" class="loading-state">
            <font-awesome-icon icon="spinner" spin size="2x" />
            <p>Chargement des détails du prêt...</p>
          </div>
          <div v-else class="loan-details-content">
            <div class="loan-details-section">
              <h4>Informations générales</h4>
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-label">Statut</div>
                  <div class="detail-value">
                    <span class="status-badge" :class="getLoanStatusClass(selectedLoan.status)">
                      {{ getLoanStatusLabel(selectedLoan.status) }}
                    </span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Montant</div>
                  <div class="detail-value">{{ formatCurrency(selectedLoan.amount) }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Date de demande</div>
                  <div class="detail-value">{{ formatDate(selectedLoan.requested_at) }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Date d'approbation</div>
                  <div class="detail-value">{{ selectedLoan.approved_at ? formatDate(selectedLoan.approved_at) : '-' }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Date d'échéance</div>
                  <div class="detail-value">
                    <span :class="{ 'text-danger': isOverdue(selectedLoan.due_date) }">
                      {{ selectedLoan.due_date ? formatDate(selectedLoan.due_date) : '-' }}
                      <span v-if="isOverdue(selectedLoan.due_date)" class="overdue-badge">En retard</span>
                    </span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Date de remboursement</div>
                  <div class="detail-value">{{ selectedLoan.repaid_at ? formatDate(selectedLoan.repaid_at) : '-' }}</div>
                </div>
              </div>
            </div>
            
            <div class="loan-details-section">
              <h4>Informations sur l'emprunteur</h4>
              <div class="borrower-info">
                <div class="user-info">
                  <div class="user-avatar">
                    <img v-if="selectedLoan.user.profile_picture" :src="selectedLoan.user.profile_picture" :alt="selectedLoan.user.name" />
                    <div v-else class="avatar-placeholder">{{ getInitials(selectedLoan.user.name) }}</div>
                  </div>
                  <div class="user-details">
                    <h3>{{ selectedLoan.user.name }}</h3>
                    <div class="user-meta">
                      <span class="user-role" :class="getRoleClass(selectedLoan.user.role)">
                        {{ getRoleLabel(selectedLoan.user.role) }}
                      </span>
                      <span class="user-rating">
                        <font-awesome-icon icon="star" class="star-icon" />
                        {{ selectedLoan.user.rating }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="borrower-stats">
                  <div class="borrower-stat">
                    <div class="stat-label">Livraisons complétées</div>
                    <div class="stat-value">{{ selectedLoan.user.deliveries_completed }}</div>
                  </div>
                  <div class="borrower-stat">
                    <div class="stat-label">Prêts remboursés</div>
                    <div class="stat-value">{{ selectedLoan.user.loans_repaid }} / {{ selectedLoan.user.loans_total }}</div>
                  </div>
                  <div class="borrower-stat">
                    <div class="stat-label">Taux de remboursement</div>
                    <div class="stat-value">{{ calculateRepaymentRate(selectedLoan.user.loans_repaid, selectedLoan.user.loans_total) }}%</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="loan-details-section">
              <h4>Motif de la demande</h4>
              <div class="loan-reason-box">
                <p>{{ selectedLoan.reason }}</p>
              </div>
            </div>
            
            <div class="loan-details-section" v-if="selectedLoan.status === 'approved' || selectedLoan.status === 'repaid'">
              <h4>Historique des paiements</h4>
              <div v-if="selectedLoan.payments && selectedLoan.payments.length > 0">
                <table class="payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Type</th>
                      <th>Méthode</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="payment in selectedLoan.payments" :key="payment.id">
                      <td>{{ formatDate(payment.date) }}</td>
                      <td>{{ formatCurrency(payment.amount) }}</td>
                      <td>{{ payment.type }}</td>
                      <td>{{ payment.method }}</td>
                      <td>
                        <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                          {{ payment.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="empty-payments">
                <p>Aucun paiement enregistré pour ce prêt.</p>
              </div>
            </div>
            
            <div class="loan-details-section" v-if="selectedLoan.notes && selectedLoan.notes.length > 0">
              <h4>Notes</h4>
              <div class="notes-list">
                <div class="note-item" v-for="note in selectedLoan.notes" :key="note.id">
                  <div class="note-header">
                    <div class="note-author">{{ note.author }}</div>
                    <div class="note-date">{{ formatDate(note.date) }}</div>
                  </div>
                  <div class="note-content">{{ note.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeLoanDetailsModal">Fermer</button>
          <div v-if="selectedLoan && selectedLoan.status === 'approved'" class="action-buttons">
            <button class="btn btn-success" @click="markAsRepaid(selectedLoan.id)">
              <font-awesome-icon icon="check-circle" class="mr-1" />
              Marquer comme remboursé
            </button>
            <button class="btn btn-warning" @click="extendLoan(selectedLoan.id)">
              <font-awesome-icon icon="calendar-plus" class="mr-1" />
              Prolonger
            </button>
            <button class="btn btn-danger" @click="writeOffLoan(selectedLoan.id)">
              <font-awesome-icon icon="trash-alt" class="mr-1" />
              Passer en perte
            </button>
          </div>
          <button class="btn btn-primary" @click="addNote(selectedLoan?.id)">
            <font-awesome-icon icon="sticky-note" class="mr-1" />
            Ajouter une note
          </button>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout de note -->
    <div class="modal" v-if="showAddNoteModal">
      <div class="modal-backdrop" @click="closeAddNoteModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ajouter une note</h3>
          <button class="modal-close" @click="closeAddNoteModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="note-content">Contenu de la note</label>
            <textarea 
              id="note-content" 
              v-model="noteContent" 
              class="form-control" 
              rows="5"
              placeholder="Saisissez votre note ici..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddNoteModal">Annuler</button>
          <button class="btn btn-primary" @click="saveNote" :disabled="!noteContent.trim()">
            <font-awesome-icon icon="save" class="mr-1" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de prolongation de prêt -->
    <div class="modal" v-if="showExtendModal">
      <div class="modal-backdrop" @click="closeExtendModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Prolonger le prêt</h3>
          <button class="modal-close" @click="closeExtendModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="extension-days">Nombre de jours supplémentaires</label>
            <input 
              type="number" 
              id="extension-days" 
              v-model.number="extensionDays" 
              min="1"
              max="30"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="extension-reason">Raison de la prolongation</label>
            <textarea 
              id="extension-reason" 
              v-model="extensionReason" 
              class="form-control" 
              rows="3"
              placeholder="Raison de la prolongation..."
            ></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="sendExtensionNotification" />
              Envoyer une notification
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeExtendModal">Annuler</button>
          <button class="btn btn-primary" @click="confirmExtension" :disabled="!isValidExtension">
            <font-awesome-icon icon="save" class="mr-1" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate, formatCurrency, getInitials } from '@/utils/formatters'

export default {
  name: 'CommunityWalletView',
  setup() {
    const router = useRouter()
    
    // État
    const loading = ref(true)
    const activeTab = ref('pending')
    const pendingLoans = ref([])
    const activeLoans = ref([])
    const loanHistory = ref([])
    const selectedLoan = ref(null)
    const showRejectLoanModal = ref(false)
    const showAddFundsModal = ref(false)
    const showLoanDetailsModal = ref(false)
    const showAddNoteModal = ref(false)
    const showExtendModal = ref(false)
    const selectedLoanId = ref(null)
    const rejectionReason = ref('insufficient_funds')
    const customRejectionReason = ref('')
    const rejectionDetails = ref('')
    const sendRejectionNotification = ref(true)
    const fundsAmount = ref(10000)
    const fundsSource = ref('company')
    const customFundsSource = ref('')
    const fundsDescription = ref('')
    const noteContent = ref('')
    const extensionDays = ref(7)
    const extensionReason = ref('')
    const sendExtensionNotification = ref(true)
    
    const stats = reactive({
      totalBalance: 1250000,
      totalLoaned: 750000,
      pendingRepayments: 500000,
      activeLoans: 12
    })
    
    const analytics = reactive({
      repaymentRate: 85,
      loansRepaid: 170,
      loansDefaulted: 30,
      averageLoanAmount: 62500,
      minLoanAmount: 10000,
      maxLoanAmount: 150000,
      averageLoanDuration: 14,
      minLoanDuration: 7,
      maxLoanDuration: 30
    })
    
    const historyFilters = reactive({
      status: '',
      dateRange: 'all',
      search: ''
    })
    
    const tabs = [
      { id: 'pending', label: 'En attente', icon: 'hourglass-half' },
      { id: 'active', label: 'Prêts actifs', icon: 'money-bill-wave' },
      { id: 'history', label: 'Historique', icon: 'history' },
      { id: 'analytics', label: 'Analyse', icon: 'chart-bar' }
    ]
    
    // Méthodes
    const fetchData = async () => {
      loading.value = true
      try {
        // Simuler l'appel API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Données fictives pour la démonstration
        pendingLoans.value = [
          {
            id: 1,
            user: {
              id: 101,
              name: 'Amadou Koné',
              role: 'courier',
              profile_picture: null,
              rating: 4.8,
              deliveries_completed: 156,
              loans_repaid: 3,
              loans_total: 3
            },
            amount: 25000,
            requested_at: new Date(2023, 4, 15),
            duration: 14,
            reason: 'Réparation de ma moto suite à une panne du système de freinage. Besoin urgent pour continuer à effectuer mes livraisons.'
          },
          {
            id: 2,
            user: {
              id: 102,
              name: 'Marie Kouassi',
              role: 'courier',
              profile_picture: null,
              rating: 4.5,
              deliveries_completed: 87,
              loans_repaid: 1,
              loans_total: 1
            },
            amount: 15000,
            requested_at: new Date(2023, 4, 16),
            duration: 7,
            reason: 'Achat de carburant pour la semaine et entretien de routine de mon véhicule.'
          }
        ]
        
        activeLoans.value = [
          {
            id: 3,
            user: {
              id: 103,
              name: 'Ibrahim Diallo',
              role: 'courier',
              profile_picture: null,
              rating: 4.2,
              deliveries_completed: 120,
              loans_repaid: 2,
              loans_total: 2
            },
            amount: 50000,
            approved_at: new Date(2023, 4, 10),
            due_date: new Date(2023, 4, 24),
            status: 'approved'
          },
          {
            id: 4,
            user: {
              id: 104,
              name: 'Sophie Mensah',
              role: 'courier',
              profile_picture: null,
              rating: 4.7,
              deliveries_completed: 95,
              loans_repaid: 1,
              loans_total: 1
            },
            amount: 30000,
            approved_at: new Date(2023, 4, 5),
            due_date: new Date(2023, 4, 12),
            status: 'approved'
          }
        ]
        
        loanHistory.value = [
          {
            id: 5,
            user: {
              id: 105,
              name: 'Jean Kouamé',
              role: 'courier',
              profile_picture: null,
              rating: 4.6,
              deliveries_completed: 110,
              loans_repaid: 2,
              loans_total: 2
            },
            amount: 40000,
            requested_at: new Date(2023, 3, 15),
            status: 'repaid',
            repaid_at: new Date(2023, 3, 29)
          },
          {
            id: 6,
            user: {
              id: 106,
              name: 'Fatou Bamba',
              role: 'courier',
              profile_picture: null,
              rating: 3.9,
              deliveries_completed: 65,
              loans_repaid: 1,
              loans_total: 2
            },
            amount: 20000,
            requested_at: new Date(2023, 3, 10),
            status: 'written_off',
            repaid_at: null
          }
        ]
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        loading.value = false
      }
    }
    
    const refreshData = () => {
      fetchData()
    }
    
    const refreshAnalytics = () => {
      // Simuler le chargement des données d'analyse
      loading.value = true
      setTimeout(() => {
        loading.value = false
      }, 1000)
    }
    
    const approveLoan = async (loanId) => {
      console.log(`Approbation du prêt ${loanId}`)
      // Implémenter l'approbation du prêt
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      const loanIndex = pendingLoans.value.findIndex(loan => loan.id === loanId)
      if (loanIndex !== -1) {
        const loan = pendingLoans.value[loanIndex]
        pendingLoans.value.splice(loanIndex, 1)
        
        // Calculer la date d'échéance
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + loan.duration)
        
        activeLoans.value.push({
          ...loan,
          approved_at: new Date(),
          due_date: dueDate,
          status: 'approved'
        })
        
        stats.activeLoans++
        stats.totalLoaned += loan.amount
        stats.totalBalance -= loan.amount
        stats.pendingRepayments += loan.amount
      }
      
      // Afficher une notification de succès
      alert(`Prêt #${loanId} approuvé avec succès`)
    }
    
    const openRejectModal = (loanId) => {
      selectedLoanId.value = loanId
      rejectionReason.value = 'insufficient_funds'
      customRejectionReason.value = ''
      rejectionDetails.value = ''
      sendRejectionNotification.value = true
      showRejectLoanModal.value = true
    }
    
    const closeRejectModal = () => {
      showRejectLoanModal.value = false
      selectedLoanId.value = null
    }
    
    const confirmReject = async () => {
      const reason = rejectionReason.value === 'other' ? customRejectionReason.value : rejectionReason.value
      console.log(`Rejet du prêt ${selectedLoanId.value} pour la raison: ${reason}`)
      console.log(`Détails: ${rejectionDetails.value}`)
      console.log(`Envoyer notification: ${sendRejectionNotification.value}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      const loanIndex = pendingLoans.value.findIndex(loan => loan.id === selectedLoanId.value)
      if (loanIndex !== -1) {
        const loan = pendingLoans.value[loanIndex]
        pendingLoans.value.splice(loanIndex, 1)
        
        loanHistory.value.unshift({
          ...loan,
          status: 'rejected',
          rejected_at: new Date(),
          rejection_reason: reason,
          rejection_details: rejectionDetails.value
        })
      }
      
      closeRejectModal()
      
      // Afficher une notification de succès
      alert(`Prêt #${selectedLoanId.value} rejeté avec succès`)
    }
    
    const viewUserDetails = (userId) => {
      router.push(`/manager/users/${userId}`)
    }
    
    const viewLoanDetails = async (loanId) => {
      showLoanDetailsModal.value = true
      
      // Simuler le chargement des détails du prêt
      selectedLoan.value = null
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Trouver le prêt dans les différentes listes
      let loan = pendingLoans.value.find(l => l.id === loanId) ||
                activeLoans.value.find(l => l.id === loanId) ||
                loanHistory.value.find(l => l.id === loanId)
      
      if (loan) {
        // Ajouter des données supplémentaires pour la démonstration
        selectedLoan.value = {
          ...loan,
          payments: loan.status === 'repaid' ? [
            {
              id: 1,
              date: new Date(2023, 3, 29),
              amount: loan.amount,
              type: 'Remboursement',
              method: 'Portefeuille électronique',
              status: 'completed'
            }
          ] : [],
          notes: [
            {
              id: 1,
              author: 'Admin Système',
              date: new Date(2023, 3, 15),
              content: 'Prêt approuvé après vérification de l\'historique de livraison.'
            }
          ]
        }
      }
    }
    
    const closeLoanDetailsModal = () => {
      showLoanDetailsModal.value = false
      selectedLoan.value = null
    }
    
    const markAsRepaid = async (loanId) => {
      console.log(`Marquer le prêt ${loanId} comme remboursé`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      const loanIndex = activeLoans.value.findIndex(loan => loan.id === loanId)
      if (loanIndex !== -1) {
        const loan = activeLoans.value[loanIndex]
        activeLoans.value.splice(loanIndex, 1)
        loanHistory.value.unshift({
          ...loan,
          status: 'repaid',
          repaid_at: new Date()
        })
        stats.activeLoans--
        stats.pendingRepayments -= loan.amount
        stats.totalBalance += loan.amount
        
        // Mettre à jour les statistiques de l'utilisateur
        if (loan.user) {
          loan.user.loans_repaid++
        }
      }
      
      // Si le modal de détails est ouvert, le fermer
      if (showLoanDetailsModal.value) {
        closeLoanDetailsModal()
      }
      
      // Afficher une notification de succès
      alert(`Prêt #${loanId} marqué comme remboursé avec succès`)
    }
    
    const sendReminder = async (loanId) => {
      console.log(`Envoyer un rappel pour le prêt ${loanId}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Afficher une notification de succès
      alert(`Rappel envoyé avec succès pour le prêt #${loanId}`)
    }
    
    const extendLoan = (loanId) => {
      selectedLoanId.value = loanId
      extensionDays.value = 7
      extensionReason.value = ''
      sendExtensionNotification.value = true
      showExtendModal.value = true
    }
    
    const closeExtendModal = () => {
      showExtendModal.value = false
      selectedLoanId.value = null
    }
    
    const confirmExtension = async () => {
      console.log(`Prolongation du prêt ${selectedLoanId.value} de ${extensionDays.value} jours`)
      console.log(`Raison: ${extensionReason.value}`)
      console.log(`Envoyer notification: ${sendExtensionNotification.value}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      const loanIndex = activeLoans.value.findIndex(loan => loan.id === selectedLoanId.value)
      if (loanIndex !== -1) {
        const loan = activeLoans.value[loanIndex]
        const newDueDate = new Date(loan.due_date)
        newDueDate.setDate(newDueDate.getDate() + extensionDays.value)
        activeLoans.value[loanIndex].due_date = newDueDate
        
        // Ajouter une note
        if (!activeLoans.value[loanIndex].notes) {
          activeLoans.value[loanIndex].notes = []
        }
        
        activeLoans.value[loanIndex].notes.push({
          id: Date.now(),
          author: 'Admin Système',
          date: new Date(),
          content: `Prêt prolongé de ${extensionDays.value} jours. Raison: ${extensionReason.value}`
        })
      }
      
      closeExtendModal()
      
      // Si le modal de détails est ouvert, le mettre à jour
      if (showLoanDetailsModal.value && selectedLoan.value && selectedLoan.value.id === selectedLoanId.value) {
        viewLoanDetails(selectedLoanId.value)
      }
      
      // Afficher une notification de succès
      alert(`Prêt #${selectedLoanId.value} prolongé avec succès`)
    }
    
    const writeOffLoan = async (loanId) => {
      console.log(`Passer en perte le prêt ${loanId}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données
      const loanIndex = activeLoans.value.findIndex(loan => loan.id === loanId)
      if (loanIndex !== -1) {
        const loan = activeLoans.value[loanIndex]
        activeLoans.value.splice(loanIndex, 1)
        loanHistory.value.unshift({
          ...loan,
          status: 'written_off',
          written_off_at: new Date()
        })
        stats.activeLoans--
        stats.pendingRepayments -= loan.amount
      }
      
      // Fermer le modal de détails
      closeLoanDetailsModal()
      
      // Afficher une notification de succès
      alert(`Prêt #${loanId} passé en perte avec succès`)
    }
    
    const addNote = (loanId) => {
      selectedLoanId.value = loanId
      noteContent.value = ''
      showAddNoteModal.value = true
    }
    
    const closeAddNoteModal = () => {
      showAddNoteModal.value = false
      noteContent.value = ''
    }
    
    const saveNote = async () => {
      console.log(`Ajouter une note au prêt ${selectedLoanId.value}: ${noteContent.value}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les données si le prêt est sélectionné
      if (selectedLoan.value && selectedLoan.value.id === selectedLoanId.value) {
        if (!selectedLoan.value.notes) {
          selectedLoan.value.notes = []
        }
        
        selectedLoan.value.notes.push({
          id: Date.now(),
          author: 'Admin Système',
          date: new Date(),
          content: noteContent.value
        })
      }
      
      closeAddNoteModal()
      
      // Afficher une notification de succès
      alert('Note ajoutée avec succès')
    }
    
    const openAddFundsModal = () => {
      fundsAmount.value = 10000
      fundsSource.value = 'company'
      customFundsSource.value = ''
      fundsDescription.value = ''
      showAddFundsModal.value = true
    }
    
    const closeAddFundsModal = () => {
      showAddFundsModal.value = false
    }
    
    const confirmAddFunds = async () => {
      const source = fundsSource.value === 'other' ? customFundsSource.value : fundsSource.value
      console.log(`Ajouter ${fundsAmount.value} FCFA au portefeuille depuis la source: ${source}`)
      console.log(`Description: ${fundsDescription.value}`)
      
      // Simuler l'appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mettre à jour les statistiques
      stats.totalBalance += fundsAmount.value
      
      closeAddFundsModal()
      
      // Afficher une notification de succès
      alert(`${fundsAmount.value} FCFA ajoutés avec succès au portefeuille communautaire`)
    }
    
    const applyHistoryFilters = () => {
      console.log('Filtres appliqués:', historyFilters)
      
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
        applyHistoryFilters()
      }, 300)
    }
    
    const exportLoanDetails = (loanId) => {
      console.log(`Exporter les détails du prêt ${loanId}`)
      // Implémenter l'exportation des détails du prêt
      
      // Simuler le téléchargement
      setTimeout(() => {
        alert(`Détails du prêt #${loanId} exportés avec succès`)
      }, 500)
    }
    
    const exportAnalytics = () => {
      console.log('Exporter les données d\'analyse')
      // Implémenter l'exportation des données d'analyse
      
      // Simuler le téléchargement
      setTimeout(() => {
        alert('Données d\'analyse exportées avec succès')
      }, 500)
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
    
    const getLoanStatusClass = (status) => {
      const statusClasses = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'repaid': 'status-repaid',
        'written_off': 'status-written-off',
        'rejected': 'status-rejected'
      }
      return statusClasses[status] || ''
    }
    
    const getLoanStatusLabel = (status) => {
      const statusLabels = {
        'pending': 'En attente',
        'approved': 'Approuvé',
        'repaid': 'Remboursé',
        'written_off': 'Passé en perte',
        'rejected': 'Rejeté'
      }
      return statusLabels[status] || status
    }
    
    const getPaymentStatusClass = (status) => {
      const statusClasses = {
        'pending': 'status-pending',
        'completed': 'status-repaid',
        'failed': 'status-written-off'
      }
      return statusClasses[status] || ''
    }
    
    const isOverdue = (date) => {
      if (!date) return false
      return new Date(date) < new Date()
    }
    
    const calculateRepaymentRate = (repaid, total) => {
      if (total === 0) return 100
      return Math.round((repaid / total) * 100)
    }
    
    // Propriétés calculées
    const isValidRejectionReason = computed(() => {
      if (rejectionReason.value === 'other') {
        return customRejectionReason.value.trim().length > 0
      }
      return true
    })
    
    const isValidFundsAmount = computed(() => {
      return fundsAmount.value > 0
    })
    
    const isValidExtension = computed(() => {
      return extensionDays.value > 0 && extensionReason.value.trim().length > 0
    })
    
    // Cycle de vie
    onMounted(() => {
      fetchData()
    })
    
    return {
      loading,
      activeTab,
      pendingLoans,
      activeLoans,
      loanHistory,
      stats,
      analytics,
      historyFilters,
      tabs,
      selectedLoan,
      showRejectLoanModal,
      showAddFundsModal,
      showLoanDetailsModal,
      showAddNoteModal,
      showExtendModal,
      selectedLoanId,
      rejectionReason,
      customRejectionReason,
      rejectionDetails,
      sendRejectionNotification,
      fundsAmount,
      fundsSource,
      customFundsSource,
      fundsDescription,
      noteContent,
      extensionDays,
      extensionReason,
      sendExtensionNotification,
      isValidRejectionReason,
      isValidFundsAmount,
      isValidExtension,
      
      fetchData,
      refreshData,
      refreshAnalytics,
      approveLoan,
      openRejectModal,
      closeRejectModal,
      confirmReject,
      viewUserDetails,
      viewLoanDetails,
      closeLoanDetailsModal,
      markAsRepaid,
      sendReminder,
      extendLoan,
      closeExtendModal,
      confirmExtension,
      writeOffLoan,
      addNote,
      closeAddNoteModal,
      saveNote,
      openAddFundsModal,
      closeAddFundsModal,
      confirmAddFunds,
      applyHistoryFilters,
      debounceSearch,
      exportLoanDetails,
      exportAnalytics,
      getRoleClass,
      getRoleLabel,
      getLoanStatusClass,
      getLoanStatusLabel,
      getPaymentStatusClass,
      isOverdue,
      calculateRepaymentRate,
      
      formatDate,
      formatCurrency,
      getInitials
    }
  }
}
</script>

<style scoped>
.community-wallet-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-
