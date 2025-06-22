
<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container">
      <div class="modal-header">
        <h2>
          <i class="fas fa-route"></i>
          Livraison Multi-Destinataires #MD{{ delivery?.id }}
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Chargement des détails...</p>
        </div>

        <div v-else-if="delivery" class="delivery-details">
          <!-- En-tête avec statut -->
          <div class="status-header">
            <div class="status-info">
              <span :class="['status-badge', delivery.status]">
                {{ getStatusLabel(delivery.status) }}
              </span>
              <div class="creation-date">
                Créée le {{ formatDate(delivery.created_at) }}
              </div>
            </div>
            <div class="delivery-actions">
              <button 
                v-if="delivery.status === 'pending'"
                @click="showBidsModal = true"
                class="btn btn-primary"
              >
                <i class="fas fa-gavel"></i>
                Voir les Enchères ({{ bids.length }})
              </button>
              <button 
                v-if="['pending', 'accepted'].includes(delivery.status)"
                @click="cancelDelivery"
                class="btn btn-danger"
              >
                <i class="fas fa-times"></i>
                Annuler
              </button>
            </div>
          </div>

          <!-- Informations principales -->
          <div class="main-info">
            <!-- Ramassage -->
            <div class="info-card">
              <h3>
                <i class="fas fa-map-marker-alt pickup"></i>
                Point de Ramassage
              </h3>
              <div class="address-info">
                <div class="address-line">
                  <strong>{{ delivery.pickup_address }}</strong>
                </div>
                <div class="commune">{{ delivery.pickup_commune }}</div>
                <div v-if="delivery.pickup_contact_name" class="contact-info">
                  <strong>Contact:</strong> {{ delivery.pickup_contact_name }}
                  <span v-if="delivery.pickup_contact_phone">
                    - {{ delivery.pickup_contact_phone }}
                  </span>
                </div>
                <div v-if="delivery.pickup_instructions" class="instructions">
                  <strong>Instructions:</strong> {{ delivery.pickup_instructions }}
                </div>
              </div>
            </div>

            <!-- Coursier -->
            <div v-if="delivery.courier" class="info-card">
              <h3>
                <i class="fas fa-user"></i>
                Coursier Assigné
              </h3>
              <div class="courier-details">
                <div class="courier-avatar">
                  <img 
                    :src="delivery.courier.profile_picture || '/src/assets/default-avatar.png'" 
                    :alt="delivery.courier.full_name"
                  >
                </div>
                <div class="courier-info">
                  <h4>{{ delivery.courier.full_name }}</h4>
                  <p>{{ delivery.courier.phone }}</p>
                  <div class="courier-rating">
                    <i class="fas fa-star"></i>
                    <span>{{ delivery.courier.rating?.toFixed(1) || 'N/A' }}</span>
                    <span class="rating-count">({{ delivery.courier.total_ratings || 0 }} avis)</span>
                  </div>
                </div>
                <div class="courier-actions">
                  <button class="btn btn-sm btn-outline" @click="callCourier">
                    <i class="fas fa-phone"></i>
                    Appeler
                  </button>
                </div>
              </div>
            </div>

            <!-- Informations de livraison -->
            <div class="info-card">
              <h3>
                <i class="fas fa-info-circle"></i>
                Informations
              </h3>
              <div class="delivery-info-grid">
                <div class="info-item">
                  <label>Destinations:</label>
                  <span>{{ delivery.total_destinations }}</span>
                </div>
                <div class="info-item">
                  <label>Distance totale:</label>
                  <span>{{ delivery.estimated_total_distance?.toFixed(1) || 'N/A' }} km</span>
                </div>
                <div class="info-item">
                  <label>Durée estimée:</label>
                  <span>{{ delivery.estimated_total_duration || 'N/A' }} min</span>
                </div>
                <div class="info-item">
                  <label>Véhicule requis:</label>
                  <span>{{ getVehicleLabel(delivery.vehicle_type_required) || 'Automatique' }}</span>
                </div>
                <div class="info-item">
                  <label>Options:</label>
                  <div class="options-badges">
                    <span v-if="delivery.is_urgent" class="option-badge urgent">Urgent</span>
                    <span v-if="delivery.is_fragile" class="option-badge fragile">Fragile</span>
                    <span v-if="!delivery.is_urgent && !delivery.is_fragile" class="option-badge normal">Standard</span>
                  </div>
                </div>
                <div class="info-item">
                  <label>Prix:</label>
                  <span class="price">
                    {{ formatCurrency(delivery.total_final_price || delivery.total_proposed_price) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste des destinations -->
          <div class="destinations-section">
            <h3>
              <i class="fas fa-route"></i>
              Itinéraire ({{ delivery.destinations?.length || 0 }} arrêts)
            </h3>
            
            <div class="destinations-timeline">
              <div 
                v-for="(destination, index) in sortedDestinations" 
                :key="destination.id"
                :class="['destination-item', destination.status]"
              >
                <div class="destination-marker">
                  <span class="marker-number">{{ index + 1 }}</span>
                  <div class="marker-line"></div>
                </div>
                
                <div class="destination-content">
                  <div class="destination-header">
                    <h4>{{ destination.recipient_name }}</h4>
                    <span :class="['destination-status', destination.status]">
                      <i :class="getDestinationIcon(destination.status)"></i>
                      {{ getDestinationStatusLabel(destination.status) }}
                    </span>
                  </div>
                  
                  <div class="destination-details">
                    <div class="address">
                      <i class="fas fa-map-marker-alt"></i>
                      {{ destination.delivery_address }}, {{ destination.delivery_commune }}
                    </div>
                    
                    <div v-if="destination.delivery_contact_name" class="contact">
                      <i class="fas fa-user"></i>
                      {{ destination.delivery_contact_name }}
                      <span v-if="destination.delivery_contact_phone">
                        - {{ destination.delivery_contact_phone }}
                      </span>
                    </div>
                    
                    <div v-if="destination.package_description" class="package">
                      <i class="fas fa-box"></i>
                      {{ destination.package_description }}
                      <span v-if="destination.package_size">
                        ({{ getPackageSizeLabel(destination.package_size) }})
                      </span>
                      <span v-if="destination.package_weight">
                        - {{ destination.package_weight }}kg
                      </span>
                    </div>
                    
                    <div v-if="destination.special_instructions" class="instructions">
                      <i class="fas fa-exclamation-circle"></i>
                      {{ destination.special_instructions }}
                    </div>
                    
                    <!-- Informations de livraison -->
                    <div v-if="destination.status !== 'pending'" class="delivery-status-info">
                      <div v-if="destination.estimated_arrival_time" class="timing-info">
                        <i class="fas fa-clock"></i>
                        ETA: {{ formatTime(destination.estimated_arrival_time) }}
                      </div>
                      
                      <div v-if="destination.actual_arrival_time" class="timing-info">
                        <i class="fas fa-map-marker-alt"></i>
                        Arrivé: {{ formatTime(destination.actual_arrival_time) }}
                      </div>
                      
                      <div v-if="destination.delivered_at" class="timing-info">
                        <i class="fas fa-check-circle"></i>
                        Livré: {{ formatTime(destination.delivered_at) }}
                      </div>
                      
                      <div v-if="destination.delivery_notes" class="notes">
                        <i class="fas fa-sticky-note"></i>
                        {{ destination.delivery_notes }}
                      </div>
                      
                      <div v-if="destination.proof_of_delivery_url" class="proof">
                        <button @click="viewProof(destination.proof_of_delivery_url)" class="btn btn-sm btn-outline">
                          <i class="fas fa-image"></i>
                          Voir la preuve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Instructions générales -->
          <div v-if="delivery.special_instructions" class="instructions-section">
            <h3>
              <i class="fas fa-clipboard-list"></i>
              Instructions Générales
            </h3>
            <div class="instructions-content">
              {{ delivery.special_instructions }}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal des enchères -->
      <BidsModal 
        v-if="showBidsModal"
        :delivery-id="deliveryId"
        :bids="bids"
        @close="showBidsModal = false"
        @bid-accepted="onBidAccepted"
      />
      
      <!-- Modal de visualisation de preuve -->
      <ProofModal 
        v-if="showProofModal"
        :proof-url="selectedProofUrl"
        @close="showProofModal = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import multiDestinationApi from '@/api/multi-destination-deliveries'
import BidsModal from './BidsModal.vue'
import ProofModal from './ProofModal.vue'

export default {
  name: 'MultiDestinationDetailsModal',
  components: {
    BidsModal,
    ProofModal
  },
  props: {
    deliveryId: {
      type: Number,
      required: true
    }
  },
  emits: ['close', 'updated'],
  setup(props, { emit }) {
    const { showToast } = useToast()
    
    // État réactif
    const loading = ref(true)
    const delivery = ref(null)
    const bids = ref([])
    const showBidsModal = ref(false)
    const showProofModal = ref(false)
    const selectedProofUrl = ref('')
    
    // Computed
    const sortedDestinations = computed(() => {
      if (!delivery.value?.destinations) return []
      
      return [...delivery.value.destinations].sort((a, b) => {
        const orderA = a.optimized_order || a.original_order || 0
        const orderB = b.optimized_order || b.original_order || 0
        return orderA - orderB
      })
    })
    
    // Méthodes
    const loadDelivery = async () => {
      try {
        loading.value = true
        const data = await multiDestinationApi.getDelivery(props.deliveryId)
        delivery.value = data
        
        // Charger les enchères si la livraison est en attente
        if (data.status === 'pending') {
          await loadBids()
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement de la livraison:', error)
        showToast('Erreur lors du chargement des détails', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const loadBids = async () => {
      try {
        const data = await multiDestinationApi.getDeliveryBids(props.deliveryId)
        bids.value = data
      } catch (error) {
        console.error('Erreur lors du chargement des enchères:', error)
      }
    }
    
    const cancelDelivery = async () => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) return
      
      try {
        await multiDestinationApi.cancelDelivery(props.deliveryId)
        showToast('Livraison annulée avec succès', 'success')
        emit('updated')
        emit('close')
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error)
        showToast('Erreur lors de l\'annulation de la livraison', 'error')
      }
    }
    
    const callCourier = () => {
      if (delivery.value?.courier?.phone) {
        window.open(`tel:${delivery.value.courier.phone}`)
      }
    }
    
    const viewProof = (proofUrl) => {
      selectedProofUrl.value = proofUrl
      showProofModal.value = true
    }
    
    const onBidAccepted = () => {
      showBidsModal.value = false
      loadDelivery()
      emit('updated')
    }
    
    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget) {
        emit('close')
      }
    }
    
    // Utilitaires
    const getStatusLabel = (status) => {
      const labels = {
        pending: 'En attente',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée'
      }
      return labels[status] || status
    }
    
    const getDestinationStatusLabel = (status) => {
      const labels = {
        pending: 'En attente',
        arrived: 'Arrivé',
        delivered: 'Livré',
        failed: 'Échec'
      }
      return labels[status] || 'En attente'
    }
    
    const getDestinationIcon = (status) => {
      const icons = {
        pending: 'fas fa-clock',
        arrived: 'fas fa-map-marker-alt',
        delivered: 'fas fa-check-circle',
        failed: 'fas fa-times-circle'
      }
      return icons[status] || 'fas fa-clock'
    }
    
    const getVehicleLabel = (type) => {
      const labels = {
        bicycle: 'Vélo',
        motorcycle: 'Moto',
        scooter: 'Scooter',
        car: 'Voiture',
        van: 'Camionnette',
        truck: 'Camion'
      }
      return labels[type]
    }
    
    const getPackageSizeLabel = (size) => {
      const labels = {
        small: 'Petit',
        medium: 'Moyen',
        large: 'Grand',
        extra_large: 'Très Grand'
      }
      return labels[size]
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount)
    }
    
    // Lifecycle
    onMounted(() => {
      loadDelivery()
    })
    
    return {
      loading,
      delivery,
      bids,
      showBidsModal,
      showProofModal,
      selectedProofUrl,
      sortedDestinations,
      loadDelivery,
      cancelDelivery,
      callCourier,
      viewProof,
      onBidAccepted,
      handleOverlayClick,
      getStatusLabel,
      getDestinationStatusLabel,
      getDestinationIcon,
      getVehicleLabel,
      getPackageSizeLabel,
      formatDate,
      formatTime,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h2 i {
  color: #3b82f6;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
}

.loading-state i {
  font-size: 48px;
  color: #3b82f6;
  margin-bottom: 16px;
}

/* En-tête de statut */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #3b82f6;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.accepted {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.in_progress {
  background: #ecfdf5;
  color: #059669;
}

.status-badge.completed {
  background: #d1fae5;
  color: #047857;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.creation-date {
  color: #6b7280;
  font-size: 14px;
  margin-top: 8px;
}

.delivery-actions {
  display: flex;
  gap: 12px;
}

/* Informations principales */
.main-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.info-card h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 18px;
  color: #111827;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.info-card h3 i {
  color: #3b82f6;
}

.info-card h3 i.pickup {
  color: #059669;
}

/* Informations d'adresse */
.address-info .address-line {
  font-size: 16px;
  margin-bottom: 8px;
}

.address-info .commune {
  color: #6b7280;
  margin-bottom: 12px;
}

.address-info .contact-info,
.address-info .instructions {
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

/* Détails coursier */
.courier-details {
  display: flex;
  align-items: center;
  gap: 16px;
}

.courier-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.courier-info {
  flex: 1;
}

.courier-info h4 {
  margin: 0 0 4px 0;
  color: #111827;
}

.courier-info p {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.courier-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-weight: 600;
}

.rating-count {
  color: #6b7280;
  font-weight: normal;
  font-size: 12px;
}

/* Grille d'informations */
.delivery-info-grid {
  display: grid;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f9fafb;
}

.info-item label {
  font-weight: 600;
  color: #374151;
}

.info-item .price {
  font-size: 18px;
  font-weight: 700;
  color: #059669;
}

.options-badges {
  display: flex;
  gap: 8px;
}

.option-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.option-badge.urgent {
  background: #fee2e2;
  color: #dc2626;
}

.option-badge.fragile {
  background: #fef3c7;
  color: #d97706;
}

.option-badge.normal {
  background: #f3f4f6;
  color: #6b7280;
}

/* Section destinations */
.destinations-section {
  margin-bottom: 32px;
}

.destinations-section h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 20px;
  color: #111827;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.destinations-section h3 i {
  color: #3b82f6;
}

.destinations-timeline {
  position: relative;
}

.destination-item {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
  position: relative;
}

.destination-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-number {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  position: relative;
  z-index: 2;
}

.destination-item.delivered .marker-number {
  background: #059669;
}

.destination-item.arrived .marker-number {
  background: #2563eb;
}

.destination-item.failed .marker-number {
  background: #dc2626;
}

.marker-line {
  width: 2px;
  background: #e5e7eb;
  flex: 1;
  min-height: 40px;
  margin-top: 8px;
}

.destination-item:last-child .marker-line {
  display: none;
}

.destination-content {
  flex: 1;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.destination-item.delivered .destination-content {
  border-color: #059669;
  background: #f0fdf4;
}

.destination-item.arrived .destination-content {
  border-color: #2563eb;
  background: #eff6ff;
}

.destination-item.failed .destination-content {
  border-color: #dc2626;
  background: #fef2f2;
}

.destination-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.destination-header h4 {
  margin: 0;
  color: #111827;
  font-size: 16px;
}

.destination-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.destination-status.pending {
  color: #d97706;
}

.destination-status.arrived {
  color: #2563eb;
}

.destination-status.delivered {
  color: #059669;
}

.destination-status.failed {
  color: #dc2626;
}

.destination-details {
  space-y: 12px;
}

.destination-details > div {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #374151;
  font-size: 14px;
  margin-bottom: 8px;
}

.destination-details i {
  color: #6b7280;
  margin-top: 2px;
  flex-shrink: 0;
}

.delivery-status-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.timing-info {
  color: #6b7280;
  font-size: 13px;
}

.notes {
  font-style: italic;
  color: #6b7280;
}

/* Instructions générales */
.instructions-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.instructions-section h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 18px;
  color: #111827;
}

.instructions-section h3 i {
  color: #3b82f6;
}

.instructions-content {
  color: #374151;
  line-height: 1.6;
}

/* Boutons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .status-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .main-info {
    grid-template-columns: 1fr;
  }
  
  .delivery-actions {
    justify-content: center;
  }
  
  .destination-item {
    gap: 12px;
  }
  
  .courier-details {
    flex-direction: column;
    text-align: center;
  }
}
</style>
