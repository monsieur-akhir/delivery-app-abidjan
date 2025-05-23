<template>
  <div class="earnings-container">
    <div class="earnings-header">
      <h3>Distribution des gains</h3>
      <div class="delivery-info" v-if="delivery">
        <span>Livraison #{{ deliveryIdShort }}</span>
        <span>{{ delivery.pickupCommune }} → {{ delivery.deliveryCommune }}</span>
      </div>
    </div>

    <div class="earnings-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-button">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
      
      <template v-else>
        <div class="earnings-summary">
          <div class="summary-card">
            <div class="summary-title">Montant total</div>
            <div class="summary-value">{{ formatCurrency(earnings.totalAmount) }}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-title">Frais de service</div>
            <div class="summary-value">{{ formatCurrency(earnings.serviceFee) }}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-title">Montant distribué</div>
            <div class="summary-value">{{ formatCurrency(earnings.distributedAmount) }}</div>
          </div>
        </div>
        
        <div class="earnings-chart">
          <canvas ref="chartCanvas"></canvas>
        </div>
        
        <div class="earnings-table">
          <table>
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Rôle</th>
                <th>Contribution</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="collaborator in earnings.collaborators" :key="collaborator.id">
                <td class="collaborator-cell">
                  <div class="collaborator-avatar">
                    <img v-if="collaborator.avatar" :src="collaborator.avatar" alt="Avatar" />
                    <div v-else class="avatar-fallback">
                      {{ collaborator.name.charAt(0) }}
                    </div>
                  </div>
                  <span>{{ collaborator.name }}</span>
                </td>
                <td>{{ formatRole(collaborator.role) }}</td>
                <td>{{ collaborator.contributionPercentage }}%</td>
                <td>{{ formatCurrency(collaborator.amount) }}</td>
                <td>
                  <span :class="['status-badge', getStatusClass(collaborator.paymentStatus)]">
                    {{ formatStatus(collaborator.paymentStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import collaborativeApi from '@/api/collaborative'

export default {
  name: 'EarningsDistributionComponent',
  
  props: {
    deliveryId: {
      type: String,
      required: true
    }
  },
  
  setup(props) {
    const earnings = ref({
      totalAmount: 0,
      serviceFee: 0,
      distributedAmount: 0,
      collaborators: []
    })
    const delivery = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const chartCanvas = ref(null)
    let chart = null
    
    const deliveryIdShort = computed(() => {
      return props.deliveryId.substring(0, 8)
    })
    
    const fetchData = async () => {
      try {
        loading.value = true
        error.value = null
        
        // Récupérer les détails de la livraison
        const deliveryData = await collaborativeApi.getCollaborativeDelivery(props.deliveryId)
        delivery.value = deliveryData
        
        // Récupérer la distribution des gains
        const earningsData = await collaborativeApi.getEarningsDistribution(props.deliveryId)
        earnings.value = earningsData
        
        // Initialiser le graphique après avoir récupéré les données
        initChart()
      } catch (err) {
        console.error('Erreur lors du chargement des données de distribution des gains:', err)
        error.value = 'Impossible de charger les données de distribution des gains. Veuillez réessayer.'
      } finally {
        loading.value = false
      }
    }
    
    const initChart = () => {
      if (chartCanvas.value) {
        // Détruire le graphique existant s'il y en a un
        if (chart) {
          chart.destroy()
        }
        
        // Préparer les données pour le graphique
        const labels = earnings.value.collaborators.map(c => c.name)
        const data = earnings.value.collaborators.map(c => c.amount)
        const backgroundColors = generateColors(earnings.value.collaborators.length)
        
        // Créer le nouveau graphique
        chart = new Chart(chartCanvas.value, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: data,
              backgroundColor: backgroundColors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  font: {
                    size: 12
                  },
                  padding: 20
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const percentage = ((value / earnings.value.distributedAmount) * 100).toFixed(1);
                    return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                  }
                }
              }
            }
          }
        })
      }
    }
    
    const generateColors = (count) => {
      const baseColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
      ]
      
      // Si nous avons besoin de plus de couleurs que dans notre palette de base
      if (count > baseColors.length) {
        const extraColors = []
        for (let i = 0; i < count - baseColors.length; i++) {
          const hue = Math.floor(Math.random() * 360)
          extraColors.push(`hsl(${hue}, 70%, 60%)`)
        }
        return [...baseColors, ...extraColors]
      }
      
      return baseColors.slice(0, count)
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount)
    }
    
    const formatRole = (role) => {
      switch (role) {
        case 'primary':
          return 'Principal'
        case 'secondary':
          return 'Secondaire'
        case 'support':
          return 'Support'
        default:
          return role
      }
    }
    
    const formatStatus = (status) => {
      switch (status) {
        case 'pending':
          return 'En attente'
        case 'processing':
          return 'En cours'
        case 'completed':
          return 'Payé'
        case 'failed':
          return 'Échec'
        default:
          return status
      }
    }
    
    const getStatusClass = (status) => {
      switch (status) {
        case 'pending':
          return 'status-pending'
        case 'processing':
          return 'status-processing'
        case 'completed':
          return 'status-completed'
        case 'failed':
          return 'status-failed'
        default:
          return ''
      }
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      earnings,
      delivery,
      loading,
      error,
      chartCanvas,
      deliveryIdShort,
      fetchData,
      formatCurrency,
      formatRole,
      formatStatus,
      getStatusClass
    }
  }
}
</script>

<style scoped>
.earnings-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.earnings-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.earnings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.delivery-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.earnings-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 32px;
  color: #ef4444;
  margin-bottom: 16px;
}

.retry-button {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.retry-button i {
  margin-right: 8px;
}

.earnings-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.summary-card {
  flex: 1;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  text-align: center;
  margin: 0 8px;
}

.summary-card:first-child {
  margin-left: 0;
}

.summary-card:last-child {
  margin-right: 0;
}

.summary-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
}

.earnings-chart {
  height: 300px;
  margin-bottom: 24px;
}

.earnings-table {
  margin-top: 24px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
}

.collaborator-cell {
  display: flex;
  align-items: center;
}

.collaborator-avatar {
  margin-right: 12px;
}

.collaborator-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-processing {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-completed {
  background-color: #d1fae5;
  color: #059669;
}

.status-failed {
  background-color: #fee2e2;
  color: #dc2626;
}
</style>
