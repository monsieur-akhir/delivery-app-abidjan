<template>
  <div class="earnings-view">
    <div class="page-header">
      <h1>Mes gains</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-primary" @click="showWithdrawModal = true" :disabled="!canWithdraw">
          <font-awesome-icon icon="money-bill" class="mr-1" />
          Retirer les fonds
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <font-awesome-icon icon="circle-notch" spin size="2x" />
      <p>Chargement des données...</p>
    </div>

    <div v-else>
      <!-- Résumé des gains -->
      <div class="earnings-summary">
        <div class="summary-card available-balance">
          <div class="card-content">
            <h2>Solde disponible</h2>
            <div class="balance-amount">{{ formatPrice(earningsSummary.available_balance) }} FCFA</div>
            <p class="balance-info">Montant disponible pour retrait</p>
          </div>
        </div>
        
        <div class="summary-card pending-balance">
          <div class="card-content">
            <h2>En attente</h2>
            <div class="balance-amount">{{ formatPrice(earningsSummary.pending_balance) }} FCFA</div>
            <p class="balance-info">Sera disponible dans 24-48h</p>
          </div>
        </div>
        
        <div class="summary-card total-earnings">
          <div class="card-content">
            <h2>Gains totaux</h2>
            <div class="balance-amount">{{ formatPrice(earningsSummary.total_earnings) }} FCFA</div>
            <p class="balance-info">Depuis le début</p>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon icon="truck" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ earningsSummary.total_deliveries }}</div>
            <div class="stat-label">Livraisons</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon icon="route" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ earningsSummary.total_distance.toFixed(1) }} km</div>
            <div class="stat-label">Distance totale</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon icon="star" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ earningsSummary.average_rating.toFixed(1) }}</div>
            <div class="stat-label">Note moyenne</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <font-awesome-icon icon="trophy" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ earningsSummary.ranking || 'N/A' }}</div>
            <div class="stat-label">Classement</div>
          </div>
        </div>
      </div>

      <!-- Graphique des gains -->
      <div class="earnings-chart-container">
        <div class="chart-header">
          <h2>Évolution des gains</h2>
          <div class="period-selector">
            <button 
              class="period-btn" 
              :class="{ active: selectedPeriod === 'week' }"
              @click="changePeriod('week')"
            >
              7 jours
            </button>
            <button 
              class="period-btn" 
              :class="{ active: selectedPeriod === 'month' }"
              @click="changePeriod('month')"
            >
              30 jours
            </button>
            <button 
              class="period-btn" 
              :class="{ active: selectedPeriod === 'year' }"
              @click="changePeriod('year')"
            >
              12 mois
            </button>
          </div>
        </div>
        
        <div class="chart-container">
          <canvas ref="earningsChart"></canvas>
        </div>
      </div>

      <!-- Transactions récentes -->
      <div class="transactions-container">
        <div class="section-header">
          <h2>Transactions récentes</h2>
          <router-link to="/courier/transactions" class="view-all-link">
            Voir tout
            <font-awesome-icon icon="chevron-right" />
          </router-link>
        </div>
        
        <div class="transactions-table-container">
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td>{{ formatDate(transaction.created_at) }}</td>
                <td>{{ transaction.description }}</td>
                <td>
                  <span class="transaction-type" :class="getTransactionTypeClass(transaction.type)">
                    {{ getTransactionTypeLabel(transaction.type) }}
                  </span>
                </td>
                <td :class="getAmountClass(transaction)">
                  {{ getAmountPrefix(transaction) }}{{ formatPrice(transaction.amount) }} FCFA
                </td>
                <td>
                  <span class="transaction-status" :class="getStatusClass(transaction.status)">
                    {{ getStatusLabel(transaction.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="transactions.length === 0">
                <td colspan="5" class="empty-transactions">
                  <font-awesome-icon icon="receipt" size="2x" />
                  <p>Aucune transaction récente</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Récompenses -->
      <div class="rewards-container">
        <div class="section-header">
          <h2>Récompenses</h2>
          <router-link to="/courier/rewards" class="view-all-link">
            Voir tout
            <font-awesome-icon icon="chevron-right" />
          </router-link>
        </div>
        
        <div class="rewards-content">
          <div class="rewards-summary">
            <div class="points-card">
              <div class="points-icon">
                <font-awesome-icon icon="medal" />
              </div>
              <div class="points-content">
                <div class="points-value">{{ earningsSummary.points || 0 }}</div>
                <div class="points-label">Points</div>
              </div>
            </div>
            
            <div class="level-card">
              <div class="level-progress">
                <div class="level-number">{{ earningsSummary.level || 1 }}</div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getLevelProgressPercentage() + '%' }"
                  ></div>
                </div>
                <div class="level-next">Niveau {{ (earningsSummary.level || 1) + 1 }}</div>
              </div>
              <div class="level-info">
                <div class="level-points">{{ earningsSummary.points_to_next_level || 100 }} points pour le prochain niveau</div>
                <div class="level-benefits">Débloquez de nouvelles récompenses</div>
              </div>
            </div>
          </div>
          
          <div class="rewards-list">
            <div v-for="reward in availableRewards" :key="reward.id" class="reward-card">
              <div class="reward-icon" :class="getRewardTypeClass(reward.type)">
                <font-awesome-icon :icon="getRewardTypeIcon(reward.type)" />
              </div>
              <div class="reward-content">
                <h3 class="reward-title">{{ reward.title }}</h3>
                <p class="reward-description">{{ reward.description }}</p>
                <div class="reward-footer">
                  <div class="reward-points">
                    <font-awesome-icon icon="medal" />
                    {{ reward.points_required }} points
                  </div>
                  <button 
                    class="btn btn-sm" 
                    :class="canRedeemReward(reward) ? 'btn-primary' : 'btn-disabled'"
                    :disabled="!canRedeemReward(reward)"
                    @click="redeemReward(reward)"
                  >
                    Échanger
                  </button>
                </div>
              </div>
            </div>
            <div v-if="availableRewards.length === 0" class="empty-rewards">
              <font-awesome-icon icon="gift" size="2x" />
              <p>Aucune récompense disponible pour le moment</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de retrait -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click="showWithdrawModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Retirer des fonds</h2>
          <button class="close-btn" @click="showWithdrawModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="balance-info">
            <p>Solde disponible</p>
            <div class="balance-amount">{{ formatPrice(earningsSummary.available_balance) }} FCFA</div>
          </div>
          
          <div class="form-group">
            <label for="withdrawAmount">Montant à retirer</label>
            <input 
              type="number" 
              id="withdrawAmount" 
              v-model="withdrawAmount" 
              class="form-control" 
              :max="earningsSummary.available_balance"
              min="1000"
              step="500"
            />
            <div class="amount-hint">Minimum: 1000 FCFA</div>
          </div>
          
          <div class="form-group">
            <label for="withdrawMethod">Méthode de retrait</label>
            <select id="withdrawMethod" v-model="withdrawMethod" class="form-control">
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="cash">Espèces</option>
            </select>
          </div>
          
          <div v-if="withdrawMethod === 'mobile_money'" class="form-group">
            <label for="phoneNumber">Numéro de téléphone</label>
            <input type="tel" id="phoneNumber" v-model="phoneNumber" class="form-control" placeholder="Ex: 0701234567" />
          </div>
          
          <div v-if="withdrawMethod === 'bank_transfer'" class="form-group">
            <label for="bankAccount">Numéro de compte bancaire</label>
            <input type="text" id="bankAccount" v-model="bankAccount" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="withdrawNote">Note (optionnel)</label>
            <textarea id="withdrawNote" v-model="withdrawNote" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="withdraw-summary">
            <div class="summary-row">
              <span>Montant du retrait:</span>
              <span>{{ formatPrice(withdrawAmount) }} FCFA</span>
            </div>
            <div class="summary-row">
              <span>Frais:</span>
              <span>{{ formatPrice(getWithdrawFees()) }} FCFA</span>
            </div>
            <div class="summary-row total">
              <span>Total à recevoir:</span>
              <span>{{ formatPrice(withdrawAmount - getWithdrawFees()) }} FCFA</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showWithdrawModal = false">Annuler</button>
          <button 
            class="btn btn-primary" 
            @click="processWithdrawal" 
            :disabled="!isWithdrawFormValid || withdrawLoading"
          >
            <font-awesome-icon v-if="withdrawLoading" icon="circle-notch" spin class="mr-1" />
            <span v-else>Confirmer le retrait</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import { fetchCourierEarnings, fetchTransactions, fetchAvailableRewards, redeemReward as apiRedeemReward, withdrawFunds } from '@/api/courier'
import { formatDate, formatPrice } from '@/utils/formatters'

export default {
  name: 'EarningsView',
  setup() {
    const loading = ref(true)
    const earningsSummary = ref({
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_deliveries: 0,
      total_distance: 0,
      average_rating: 0,
      ranking: null,
      points: 0,
      level: 1,
      points_to_next_level: 100
    })
    const transactions = ref([])
    const availableRewards = ref([])
    const earningsHistory = ref([])
    const selectedPeriod = ref('week')
    const earningsChart = ref(null)
    let chartInstance = null
    
    // Variables pour le retrait
    const showWithdrawModal = ref(false)
    const withdrawAmount = ref(1000)
    const withdrawMethod = ref('mobile_money')
    const phoneNumber = ref('')
    const bankAccount = ref('')
    const withdrawNote = ref('')
    const withdrawLoading = ref(false)
    
    // Charger les données
    const loadData = async () => {
      try {
        loading.value = true
        
        const data = await fetchCourierEarnings(selectedPeriod.value)
        earningsSummary.value = data.summary
        earningsHistory.value = data.history
        transactions.value = data.transactions
        
        // Charger les récompenses disponibles
        const rewardsData = await fetchAvailableRewards()
        availableRewards.value = rewardsData
        
        renderChart()
      } catch (error) {
        console.error('Error loading earnings data:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Actualiser les données
    const refreshData = () => {
      loadData()
    }
    
    // Changer la période
    const changePeriod = (period) => {
      selectedPeriod.value = period
    }
    
    // Surveiller les changements de période
    watch(selectedPeriod, () => {
      loadData()
    })
    
    // Rendre le graphique
    const renderChart = () => {
      if (!earningsHistory.value || earningsHistory.value.length === 0) return
      
      const ctx = earningsChart.value.getContext('2d')
      
      // Détruire le graphique existant s'il existe
      if (chartInstance) {
        chartInstance.destroy()
      }
      
      // Préparer les données
      const labels = earningsHistory.value.map(item => {
        const date = new Date(item.date)
        if (selectedPeriod.value === 'week') {
          return date.toLocaleDateString('fr-FR', { weekday: 'short' })
        } else if (selectedPeriod.value === 'month') {
          return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        } else {
          return date.toLocaleDateString('fr-FR', { month: 'short' })
        }
      })
      
      const earningsData = earningsHistory.value.map(item => item.amount)
      const deliveriesData = earningsHistory.value.map(item => item.deliveries)
      
      // Créer le graphique
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Gains (FCFA)',
              data: earningsData,
              backgroundColor: 'rgba(255, 107, 0, 0.7)',
              borderColor: '#FF6B00',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Livraisons',
              data: deliveriesData,
              type: 'line',
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              borderWidth: 2,
              pointBackgroundColor: '#2196F3',
              pointRadius: 4,
              fill: true,
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || ''
                  const value = context.raw
                  
                  if (context.datasetIndex === 0) {
                    return `${label}: ${formatPrice(value)} FCFA`
                  } else {
                    return `${label}: ${value}`
                  }
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Gains (FCFA)'
              },
              ticks: {
                callback: function(value) {
                  return formatPrice(value) + ' FCFA'
                }
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Livraisons'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      })
    }
    
    // Obtenir la classe CSS pour un type de transaction
    const getTransactionTypeClass = (type) => {
      switch (type) {
        case 'earning':
          return 'type-earning'
        case 'withdrawal':
          return 'type-withdrawal'
        case 'bonus':
          return 'type-bonus'
        case 'fee':
          return 'type-fee'
        default:
          return ''
      }
    }
    
    // Obtenir le libellé pour un type de transaction
    const getTransactionTypeLabel = (type) => {
      switch (type) {
        case 'earning':
          return 'Gain'
        case 'withdrawal':
          return 'Retrait'
        case 'bonus':
          return 'Bonus'
        case 'fee':
          return 'Frais'
        default:
          return type
      }
    }
    
    // Obtenir la classe CSS pour un montant
    const getAmountClass = (transaction) => {
      if (transaction.type === 'earning' || transaction.type === 'bonus') {
        return 'amount-positive'
      } else {
        return 'amount-negative'
      }
    }
    
    // Obtenir le préfixe pour un montant
    const getAmountPrefix = (transaction) => {
      if (transaction.type === 'earning' || transaction.type === 'bonus') {
        return '+'
      } else {
        return '-'
      }
    }
    
    // Obtenir la classe CSS pour un statut
    const getStatusClass = (status) => {
      switch (status) {
        case 'completed':
          return 'status-completed'
        case 'pending':
          return 'status-pending'
        case 'failed':
          return 'status-failed'
        default:
          return ''
      }
    }
    
    // Obtenir le libellé pour un statut
    const getStatusLabel = (status) => {
      switch (status) {
        case 'completed':
          return 'Terminé'
        case 'pending':
          return 'En attente'
        case 'failed':
          return 'Échoué'
        default:
          return status
      }
    }
    
    // Obtenir le pourcentage de progression du niveau
    const getLevelProgressPercentage = () => {
      if (!earningsSummary.value.points_to_next_level) return 0
      
      const currentLevelPoints = earningsSummary.value.level * 100
      const nextLevelPoints = (earningsSummary.value.level + 1) * 100
      const pointsRange = nextLevelPoints - currentLevelPoints
      const pointsProgress = earningsSummary.value.points - currentLevelPoints
      
      return Math.min(100, Math.max(0, (pointsProgress / pointsRange) * 100))
    }
    
    // Obtenir la classe CSS pour un type de récompense
    const getRewardTypeClass = (type) => {
      switch (type) {
        case 'credit':
          return 'reward-credit'
        case 'discount':
          return 'reward-discount'
        case 'cash':
          return 'reward-cash'
        case 'gift':
          return 'reward-gift'
        default:
          return ''
      }
    }
    
    // Obtenir l'icône pour un type de récompense
    const getRewardTypeIcon = (type) => {
      switch (type) {
        case 'credit':
          return 'mobile-alt'
        case 'discount':
          return 'percent'
        case 'cash':
          return 'money-bill'
        case 'gift':
          return 'gift'
        default:
          return 'award'
      }
    }
    
    // Vérifier si l'utilisateur peut échanger une récompense
    const canRedeemReward = (reward) => {
      return earningsSummary.value.points >= reward.points_required
    }
    
    // Échanger une récompense
    const redeemReward = async (reward) => {
      if (!canRedeemReward(reward)) return
      
      if (confirm(`Êtes-vous sûr de vouloir échanger ${reward.points_required} points contre cette récompense ?`)) {
        try {
          await apiRedeemReward(reward.id)
          
          // Actualiser les données
          loadData()
          
          alert('Récompense échangée avec succès !')
        } catch (error) {
          console.error('Error redeeming reward:', error)
          alert(`Erreur lors de l'échange de la récompense: ${error.message}`)
        }
      }
    }
    
    // Vérifier si l'utilisateur peut retirer des fonds
    const canWithdraw = computed(() => {
      return earningsSummary.value.available_balance >= 1000
    })
    
    // Vérifier si le formulaire de retrait est valide
    const isWithdrawFormValid = computed(() => {
      if (withdrawAmount.value < 1000 || withdrawAmount.value > earningsSummary.value.available_balance) {
        return false
      }
      
      if (withdrawMethod.value === 'mobile_money' && !phoneNumber.value) {
        return false
      }
      
      if (withdrawMethod.value === 'bank_transfer' && !bankAccount.value) {
        return false
      }
      
      return true
    })
    
    // Calculer les frais de retrait
    const getWithdrawFees = () => {
      if (withdrawMethod.value === 'mobile_money') {
        return Math.ceil(withdrawAmount.value * 0.01) // 1% de frais
      } else if (withdrawMethod.value === 'bank_transfer') {
        return 500 // Frais fixe
      } else {
        return 0 // Pas de frais pour le retrait en espèces
      }
    }
    
    // Traiter le retrait
    const processWithdrawal = async () => {
      if (!isWithdrawFormValid.value) return
      
      try {
        withdrawLoading.value = true
        
        await withdrawFunds({
          amount: withdrawAmount.value,
          method: withdrawMethod.value,
          phone_number: phoneNumber.value,
          bank_account: bankAccount.value,
          note: withdrawNote.value
        })
        
        // Fermer le modal
        showWithdrawModal.value = false
        
        // Actualiser les données
        loadData()
        
        // Réinitialiser le formulaire
        withdrawAmount.value = 1000
        withdrawNote.value = ''
        
        alert('Retrait effectué avec succès ! Vous recevrez votre argent sous peu.')
      } catch (error) {
        console.error('Error processing withdrawal:', error)
        alert(`Erreur lors du retrait: ${error.message}`)
      } finally {
        withdrawLoading.value = false
      }
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      loading,
      earningsSummary,
      transactions,
      availableRewards,
      earningsHistory,
      selectedPeriod,
      earningsChart,
      showWithdrawModal,
      withdrawAmount,
      withdrawMethod,
      phoneNumber,
      bankAccount,
      withdrawNote,
      withdrawLoading,
      canWithdraw,
      isWithdrawFormValid,
      loadData,
      refreshData,
      changePeriod,
      getTransactionTypeClass,
      getTransactionTypeLabel,
      getAmountClass,
      getAmountPrefix,
      getStatusClass,
      getStatusLabel,
      getLevelProgressPercentage,
      getRewardTypeClass,
      getRewardTypeIcon,
      canRedeemReward,
      redeemReward,
      getWithdrawFees,
      processWithdrawal,
      formatDate,
      formatPrice
    }
  }
}
</script>

<style scoped>
.earnings-view {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.loading-state svg {
  margin-bottom: 1rem;
}

.earnings-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.available-balance::before {
  background-color: #4CAF50;
}

.pending-balance::before {
  background-color: #FFC107;
}

.total-earnings::before {
  background-color: #2196F3;
}

.card-content {
  position: relative;
  z-index: 1;
}

.summary-card h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.5rem;
}

.balance-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.balance-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1rem;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 107, 0, 0.1);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.earnings-chart-container {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
}

.period-btn {
  background-color: var(--background-secondary);
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  background-color: var(--border-color);
}

.period-btn.active {
  background-color: var(--primary-color);
  color: white;
}

.chart-container {
  height: 300px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.view-all-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.view-all-link:hover {
  text-decoration: underline;
}

.transactions-container {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.transactions-table-container {
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.transactions-table th {
  font-weight: 600;
  color: var(--text-color);
  background-color: var(--background-secondary);
}

.transactions-table tr:last-child td {
  border-bottom: none;
}

.transaction-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-earning {
  background-color: #E8F5E9;
  color: #388E3C;
}

.type-withdrawal {
  background-color: #E3F2FD;
  color: #1976D2;
}

.type-bonus {
  background-color: #FFF8E1;
  color: #FFA000;
}

.type-fee {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.amount-positive {
  color: #388E3C;
  font-weight: 600;
}

.amount-negative {
  color: #D32F2F;
  font-weight: 600;
}

.transaction-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-completed {
  background-color: #E8F5E9;
  color: #388E3C;
}

.status-pending {
  background-color: #FFF8E1;
  color: #FFA000;
}

.status-failed {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.empty-transactions {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-transactions svg {
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.rewards-container {
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
}

.rewards-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rewards-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.points-card {
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
}

.points-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
}

.points-content {
  flex: 1;
}

.points-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.points-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.level-card {
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.level-progress {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.level-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-right: 0.75rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 4px;
}

.level-next {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.level-points {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.level-benefits {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.rewards-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.reward-card {
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
}

.reward-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 1rem;
  flex-shrink: 0;
}

.reward-credit {
  background-color: #2196F3;
}

.reward-discount {
  background-color: #9C27B0;
}

.reward-cash {
  background-color: #4CAF50;
}

.reward-gift {
  background-color: #FF9800;
}

.reward-content {
  flex: 1;
}

.reward-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.25rem;
}

.reward-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

.reward-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reward-points {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.empty-rewards {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  grid-column: 1 / -1;
}

.empty-rewards svg {
  margin-bottom: 0.5rem;
  opacity: 0.5;
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
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--background-secondary);
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
}

.balance-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.balance-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem;
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
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
}

.amount-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.withdraw-summary {
  background-color: var(--background-secondary);
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color);
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row.total {
  font-weight: 600;
  font-size: 1rem;
  border-top: 1px solid var(--border-color);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .btn {
    flex: 1;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .transactions-table th:nth-child(2),
  .transactions-table td:nth-child(2) {
    display: none;
  }
}
</style>
