<template>
  <div class="delivery-detail-view">
    <div class="page-header">
      <div class="header-title">
        <router-link to="/business/deliveries" class="back-button">
          <font-awesome-icon icon="arrow-left" />
        </router-link>
        <h1>Détails de la livraison #{{ deliveryId }}</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshData">
          <font-awesome-icon icon="sync" :spin="loading" class="mr-1" />
          Actualiser
        </button>
        <button class="btn btn-outline" @click="printDeliveryDetails">
          <font-awesome-icon icon="print" class="mr-1" />
          Imprimer
        </button>
        <button class="btn btn-primary" @click="openEditDeliveryModal" v-if="canEditDelivery">
          <font-awesome-icon icon="edit" class="mr-1" />
          Modifier
        </button>
        <button class="btn btn-danger" @click="cancelDelivery" v-if="canCancelDelivery">
          <font-awesome-icon icon="times" class="mr-1" />
          Annuler
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <font-awesome-icon icon="spinner" spin size="2x" />
      <p>Chargement des détails de la livraison...</p>
    </div>

    <div v-else-if="!delivery" class="empty-state">
      <font-awesome-icon icon="exclamation-circle" size="2x" />
      <p>Impossible de charger les détails de la livraison</p>
      <router-link to="/business/deliveries" class="btn btn-primary">
        Retour à la liste
      </router-link>
    </div>

    <div v-else class="delivery-content" ref="printableContent">
      <!-- Barre de statut -->
      <div class="delivery-status-bar">
        <div class="status-info">
          <span class="status-badge-large" :class="getStatusClass(delivery.status)">
            {{ getStatusLabel(delivery.status) }}
          </span>
        </div>
        <div class="delivery-price">
          <div class="info-label">Prix total</div>
          <div class="info-value price-value">
            {{ formatPrice(delivery.final_price || delivery.proposed_price) }} FCFA
          </div>
        </div>
      </div>

      <!-- Grille d'informations -->
      <div class="delivery-grid">
        <!-- Informations sur le client -->
        <div class="delivery-info-card">
          <h2>Client</h2>
          <div v-if="delivery.client" class="client-info">
            <div class="user-avatar large">
              <img
                v-if="delivery.client.profile_picture"
                :src="delivery.client.profile_picture"
                :alt="delivery.client.full_name"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitials(delivery.client.full_name) }}
              </div>
            </div>
            <div class="client-details">
              <h3>{{ delivery.client.full_name }}</h3>
              <div class="client-contact">
                <div class="contact-item" v-if="delivery.client.phone">
                  <font-awesome-icon icon="phone" />
                  {{ delivery.client.phone }}
                </div>
                <div class="contact-item" v-if="delivery.client.email">
                  <font-awesome-icon icon="envelope" />
                  {{ delivery.client.email }}
                </div>
              </div>
              <div class="client-rating" v-if="delivery.client.rating">
                <div class="stars">
                  <font-awesome-icon
                    icon="star"
                    v-for="i in Math.floor(delivery.client.rating)"
                    :key="'star-' + i"
                  />
                  <font-awesome-icon
                    icon="star-half-alt"
                    v-if="delivery.client.rating % 1 >= 0.5"
                  />
                  <font-awesome-icon
                    icon="star"
                    class="star-empty"
                    v-for="i in Math.floor(5 - delivery.client.rating)"
                    :key="'empty-' + i"
                  />
                </div>
                <span>{{ delivery.client.rating.toFixed(1) }}/5</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-client">
            <font-awesome-icon icon="user" size="2x" />
            <p>Informations client non disponibles</p>
          </div>
        </div>

        <!-- Informations sur le coursier -->
        <div class="delivery-info-card">
          <h2>Coursier</h2>
          <div v-if="delivery.courier" class="courier-info">
            <div class="user-avatar large">
              <img
                v-if="delivery.courier.profile_picture"
                :src="delivery.courier.profile_picture"
                :alt="delivery.courier.full_name"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitials(delivery.courier.full_name) }}
              </div>
            </div>
            <div class="courier-details">
              <h3>{{ delivery.courier.full_name }}</h3>
              <div class="courier-contact">
                <div class="contact-item" v-if="delivery.courier.phone">
                  <font-awesome-icon icon="phone" />
                  {{ delivery.courier.phone }}
                </div>
                <div class="contact-item" v-if="delivery.courier.email">
                  <font-awesome-icon icon="envelope" />
                  {{ delivery.courier.email }}
                </div>
              </div>
              <div class="courier-rating" v-if="delivery.courier.rating">
                <div class="stars">
                  <font-awesome-icon
                    icon="star"
                    v-for="i in Math.floor(delivery.courier.rating)"
                    :key="'star-' + i"
                  />
                  <font-awesome-icon
                    icon="star-half-alt"
                    v-if="delivery.courier.rating % 1 >= 0.5"
                  />
                  <font-awesome-icon
                    icon="star"
                    class="star-empty"
                    v-for="i in Math.floor(5 - delivery.courier.rating)"
                    :key="'empty-' + i"
                  />
                </div>
                <span>{{ delivery.courier.rating.toFixed(1) }}/5</span>
              </div>
              <div class="courier-vehicle" v-if="delivery.courier.vehicle_type">
                <font-awesome-icon :icon="getVehicleIcon(delivery.courier.vehicle_type)" />
                {{ getVehicleLabel(delivery.courier.vehicle_type) }}
              </div>
            </div>
          </div>
          <div v-else class="empty-courier">
            <font-awesome-icon icon="user" size="2x" />
            <p>Aucun coursier assigné</p>
          </div>
        </div>

        <!-- Adresses -->
        <div class="delivery-info-card">
          <h2>Adresses</h2>
          <div class="address-container">
            <div class="address-card">
              <div class="address-icon pickup">
                <font-awesome-icon icon="map-marker-alt" />
              </div>
              <div class="address-details">
                <h3>Adresse de ramassage</h3>
                <p class="address-text">{{ delivery.pickup_address }}</p>
                <p class="address-commune">{{ delivery.pickup_commune }}</p>
              </div>
            </div>
            <div class="address-divider">
              <div class="divider-line"></div>
              <div class="divider-icon">
                <font-awesome-icon icon="arrow-down" />
              </div>
              <div class="divider-line"></div>
            </div>
            <div class="address-card">
              <div class="address-icon delivery">
                <font-awesome-icon icon="flag-checkered" />
              </div>
              <div class="address-details">
                <h3>Adresse de livraison</h3>
                <p class="address-text">{{ delivery.delivery_address }}</p>
                <p class="address-commune">{{ delivery.delivery_commune }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Détails du colis -->
        <div class="delivery-info-card">
          <h2>Détails du colis</h2>
          <div class="package-details">
            <p>{{ delivery.package_description }}</p>
            <div class="package-meta">
              <div class="meta-item">
                <font-awesome-icon icon="box" />
                {{ getPackageSizeLabel(delivery.package_size) }}
              </div>
              <div class="meta-item" v-if="delivery.package_weight">
                <font-awesome-icon icon="weight" />
                {{ delivery.package_weight }} kg
              </div>
              <div class="meta-item" v-if="delivery.is_fragile">
                <font-awesome-icon icon="wine-glass" />
                Fragile
              </div>
            </div>
            <div class="notes-section" v-if="delivery.notes">
              <h4>Notes supplémentaires</h4>
              <p>{{ delivery.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Timeline de suivi -->
        <div class="delivery-info-card">
          <h2>Suivi de la livraison</h2>
          <div class="tracking-timeline">
            <div
              v-for="(event, index) in deliveryTimeline"
              :key="index"
              class="timeline-event"
              :class="{ completed: event.completed }"
            >
              <div class="event-icon">
                <font-awesome-icon :icon="event.icon" />
              </div>
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-time" v-if="event.time">{{ formatDate(event.time) }}</div>
                <div class="event-time" v-else>En attente</div>
                <div class="event-description" v-if="event.description">
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Offres des coursiers (si en attente) -->
        <div
          class="delivery-info-card"
          v-if="delivery.status === 'pending' && delivery.bids && delivery.bids.length > 0"
        >
          <h2>Offres des coursiers</h2>
          <div class="bids-list">
            <div v-for="bid in delivery.bids" :key="bid.id" class="bid-item">
              <div class="bid-header">
                <div class="user-info">
                  <div class="user-avatar">
                    <img
                      v-if="bid.courier.profile_picture"
                      :src="bid.courier.profile_picture"
                      :alt="bid.courier.full_name"
                    />
                    <div v-else class="avatar-placeholder">
                      {{ getInitials(bid.courier.full_name) }}
                    </div>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ bid.courier.full_name }}</div>
                    <div class="user-rating">
                      <div class="stars small">
                        <font-awesome-icon
                          icon="star"
                          v-for="i in Math.floor(bid.courier.rating)"
                          :key="'star-' + i"
                        />
                        <font-awesome-icon
                          icon="star-half-alt"
                          v-if="bid.courier.rating % 1 >= 0.5"
                        />
                        <font-awesome-icon
                          icon="star"
                          class="star-empty"
                          v-for="i in Math.floor(5 - bid.courier.rating)"
                          :key="'empty-' + i"
                        />
                      </div>
                      <span>{{ bid.courier.rating.toFixed(1) }}</span>
                    </div>
                  </div>
                </div>
                <div class="bid-price">{{ formatPrice(bid.price) }} FCFA</div>
              </div>
              <div class="bid-content">
                <p class="bid-message" v-if="bid.message">{{ bid.message }}</p>
                <div class="bid-meta">
                  <div class="bid-time">
                    <font-awesome-icon icon="clock" />
                    {{ formatDate(bid.created_at) }}
                  </div>
                  <div class="bid-vehicle" v-if="bid.courier.vehicle_type">
                    <font-awesome-icon :icon="getVehicleIcon(bid.courier.vehicle_type)" />
                    {{ getVehicleLabel(bid.courier.vehicle_type) }}
                  </div>
                </div>
              </div>
              <div class="bid-actions">
                <button class="btn btn-primary" @click="acceptBid(bid.id)">
                  <font-awesome-icon icon="check" class="mr-1" />
                  Accepter cette offre
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Évaluation (si terminée) -->
        <div class="delivery-info-card" v-if="delivery.status === 'completed' && delivery.rating">
          <h2>Évaluation</h2>
          <div class="rating-container">
            <div class="rating-header">
              <div class="rating-stars">
                <font-awesome-icon
                  icon="star"
                  v-for="i in delivery.rating.score"
                  :key="'star-' + i"
                />
                <font-awesome-icon
                  icon="star"
                  class="star-empty"
                  v-for="i in 5 - delivery.rating.score"
                  :key="'empty-' + i"
                />
              </div>
              <div class="rating-score">{{ delivery.rating.score }}/5</div>
            </div>
            <div class="rating-comment" v-if="delivery.rating.comment">
              {{ delivery.rating.comment }}
            </div>
            <div class="rating-meta">
              <div class="rating-author">
                Par {{ delivery.rating.author_type === 'client' ? 'le client' : 'le coursier' }}
              </div>
              <div class="rating-date">{{ formatDate(delivery.rating.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de modification de livraison -->
    <div class="modal" v-if="showEditModal">
      <div class="modal-backdrop" @click="showEditModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Modifier la livraison #{{ deliveryId }}</h3>
          <button class="modal-close" @click="showEditModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateDelivery">
            <div class="form-group">
              <label for="edit_pickup_address">Adresse de ramassage</label>
              <input
                type="text"
                id="edit_pickup_address"
                v-model="editDeliveryForm.pickup_address"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit_pickup_commune">Commune de ramassage</label>
              <select
                id="edit_pickup_commune"
                v-model="editDeliveryForm.pickup_commune"
                class="form-control"
                required
              >
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_delivery_address">Adresse de livraison</label>
              <input
                type="text"
                id="edit_delivery_address"
                v-model="editDeliveryForm.delivery_address"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit_delivery_commune">Commune de livraison</label>
              <select
                id="edit_delivery_commune"
                v-model="editDeliveryForm.delivery_commune"
                class="form-control"
                required
              >
                <option value="">Sélectionnez une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_package_description">Description du colis</label>
              <textarea
                id="edit_package_description"
                v-model="editDeliveryForm.package_description"
                class="form-control"
                rows="3"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label for="edit_package_size">Taille du colis</label>
              <select
                id="edit_package_size"
                v-model="editDeliveryForm.package_size"
                class="form-control"
                required
              >
                <option value="small">Petit (< 5kg)</option>
                <option value="medium">Moyen (5-10kg)</option>
                <option value="large">Grand (> 10kg)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_proposed_price">Prix proposé (FCFA)</label>
              <input
                type="number"
                id="edit_proposed_price"
                v-model="editDeliveryForm.proposed_price"
                class="form-control"
                min="500"
                required
              />
            </div>
            <div class="form-group">
              <label for="edit_notes">Notes supplémentaires</label>
              <textarea
                id="edit_notes"
                v-model="editDeliveryForm.notes"
                class="form-control"
                rows="2"
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showEditModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <font-awesome-icon icon="spinner" spin v-if="isSubmitting" class="mr-1" />
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchBusinessDeliveryDetails,
  updateBusinessDelivery,
  cancelBusinessDelivery,
  acceptBusinessDeliveryBid,
} from '@/api/business'
import { printElement } from '@/utils/export-utils'
import { formatDate, formatPrice, getInitials } from '@/utils/formatters'
import { DELIVERY_STATUSES, PACKAGE_SIZES, VEHICLE_TYPES, COMMUNES } from '@/config'

export default {
  name: 'BusinessDeliveryDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const deliveryId = route.params.id

    const loading = ref(true)
    const isSubmitting = ref(false)
    const delivery = ref(null)
    const showEditModal = ref(false)
    const communes = ref(COMMUNES)
    const printableContent = ref(null)

    const editDeliveryForm = reactive({
      pickup_address: '',
      pickup_commune: '',
      delivery_address: '',
      delivery_commune: '',
      package_description: '',
      package_size: 'small',
      proposed_price: 1000,
      notes: '',
    })

    const canEditDelivery = computed(() => {
      if (!delivery.value) return false
      return ['pending'].includes(delivery.value.status)
    })

    const canCancelDelivery = computed(() => {
      if (!delivery.value) return false
      return ['pending', 'accepted'].includes(delivery.value.status)
    })

    const deliveryTimeline = computed(() => {
      if (!delivery.value) return []

      const timeline = [
        {
          title: 'Livraison créée',
          icon: 'plus-circle',
          time: delivery.value.created_at,
          completed: true,
        },
        {
          title: 'Coursier assigné',
          icon: 'user',
          time: delivery.value.courier_assigned_at,
          completed: !!delivery.value.courier,
        },
        {
          title: 'Ramassage en cours',
          icon: 'box',
          time: delivery.value.pickup_started_at,
          completed: !!delivery.value.pickup_started_at,
        },
        {
          title: 'Colis ramassé',
          icon: 'check-circle',
          time: delivery.value.pickup_completed_at,
          completed: !!delivery.value.pickup_completed_at,
        },
        {
          title: 'Livraison en cours',
          icon: 'truck',
          time: delivery.value.delivery_started_at,
          completed: !!delivery.value.delivery_started_at,
        },
        {
          title: 'Colis livré',
          icon: 'flag-checkered',
          time: delivery.value.delivered_at,
          completed: !!delivery.value.delivered_at,
        },
        {
          title: 'Livraison terminée',
          icon: 'check-double',
          time: delivery.value.completed_at,
          completed: !!delivery.value.completed_at,
        },
      ]

      // Ajouter l'événement d'annulation si la livraison est annulée
      if (delivery.value.status === 'cancelled') {
        timeline.push({
          title: 'Livraison annulée',
          icon: 'times-circle',
          time: delivery.value.cancelled_at,
          description: delivery.value.cancellation_reason,
          completed: true,
        })
      }

      return timeline
    })

    // Charger les détails de la livraison
    const loadDeliveryDetails = async () => {
      try {
        loading.value = true

        const data = await fetchBusinessDeliveryDetails(deliveryId)
        delivery.value = data
      } catch (error) {
        console.error('Error loading delivery details:', error)
      } finally {
        loading.value = false
      }
    }

    // Rafraîchir les données
    const refreshData = () => {
      loadDeliveryDetails()
    }

    // Imprimer les détails de la livraison
    const printDeliveryDetails = () => {
      if (printableContent.value) {
        printElement(printableContent.value)
      } else {
        alert("Impossible d'imprimer les détails de la livraison")
      }
    }

    // Ouvrir le modal de modification
    const openEditDeliveryModal = () => {
      if (!delivery.value) return

      // Copier les données de la livraison dans le formulaire
      editDeliveryForm.pickup_address = delivery.value.pickup_address
      editDeliveryForm.pickup_commune = delivery.value.pickup_commune
      editDeliveryForm.delivery_address = delivery.value.delivery_address
      editDeliveryForm.delivery_commune = delivery.value.delivery_commune
      editDeliveryForm.package_description = delivery.value.package_description
      editDeliveryForm.package_size = delivery.value.package_size
      editDeliveryForm.proposed_price = delivery.value.proposed_price
      editDeliveryForm.notes = delivery.value.notes || ''

      showEditModal.value = true
    }

    // Mettre à jour la livraison
    const updateDelivery = async () => {
      try {
        isSubmitting.value = true

        await updateBusinessDelivery(deliveryId, editDeliveryForm)

        showEditModal.value = false
        await loadDeliveryDetails()

        // Afficher un message de succès
        alert('Livraison mise à jour avec succès')
      } catch (error) {
        console.error('Error updating delivery:', error)
        alert(`Erreur lors de la mise à jour de la livraison: ${error.message}`)
      } finally {
        isSubmitting.value = false
      }
    }

    // Annuler la livraison
    const cancelDelivery = async () => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette livraison ?')) {
        return
      }

      try {
        await cancelBusinessDelivery(deliveryId)

        await loadDeliveryDetails()

        // Afficher un message de succès
        alert('Livraison annulée avec succès')
      } catch (error) {
        console.error('Error cancelling delivery:', error)
        alert(`Erreur lors de l'annulation de la livraison: ${error.message}`)
      }
    }

    // Accepter une offre de coursier
    const acceptBid = async bidId => {
      if (!confirm('Êtes-vous sûr de vouloir accepter cette offre ?')) {
        return
      }

      try {
        await acceptBusinessDeliveryBid(deliveryId, bidId)

        await loadDeliveryDetails()

        // Afficher un message de succès
        alert('Offre acceptée avec succès')
      } catch (error) {
        console.error('Error accepting bid:', error)
        alert(`Erreur lors de l'acceptation de l'offre: ${error.message}`)
      }
    }

    // Obtenir le libellé d'un statut
    const getStatusLabel = status => {
      return DELIVERY_STATUSES[status]?.label || status
    }

    // Obtenir la classe CSS pour un statut
    const getStatusClass = status => {
      return `status-${status}`
    }

    // Obtenir le libellé d'une taille de colis
    const getPackageSizeLabel = size => {
      return PACKAGE_SIZES[size]?.label || size
    }

    // Obtenir l'icône pour un type de véhicule
    const getVehicleIcon = type => {
      return VEHICLE_TYPES[type]?.icon || 'car'
    }

    // Obtenir le libellé d'un type de véhicule
    const getVehicleLabel = type => {
      return VEHICLE_TYPES[type]?.label || type
    }

    onMounted(() => {
      loadDeliveryDetails()
    })

    return {
      deliveryId,
      loading,
      isSubmitting,
      delivery,
      showEditModal,
      editDeliveryForm,
      communes,
      canEditDelivery,
      canCancelDelivery,
      deliveryTimeline,
      printableContent,
      refreshData,
      printDeliveryDetails,
      openEditDeliveryModal,
      updateDelivery,
      cancelDelivery,
      acceptBid,
      getStatusLabel,
      getStatusClass,
      getPackageSizeLabel,
      getVehicleIcon,
      getVehicleLabel,
      formatDate,
      formatPrice,
      getInitials,
    }
  },
}
</script>

<style scoped>
.delivery-detail-view {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title {
  display: flex;
  align-items: center;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-secondary);
  color: var(--text-color);
  margin-right: 1rem;
  transition: all 0.2s;
}

.back-button:hover {
  background-color: var(--primary-color);
  color: white;
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

.loading-state,
.empty-state {
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

.loading-state svg,
.empty-state svg {
  margin-bottom: 1rem;
}

.delivery-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.delivery-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.status-badge-large {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background-color: #fff8e1;
  color: #ffa000;
}

.status-accepted {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-in_progress {
  background-color: #fff0e8;
  color: #ff6b00;
}

.status-delivered {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-completed {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
}

.delivery-actions {
  display: flex;
  gap: 0.5rem;
}

.delivery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.delivery-info-card {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.delivery-info-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  margin-bottom: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.client-info,
.courier-info {
  display: flex;
  align-items: flex-start;
}

.user-avatar.large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  background-color: var(--background-secondary);
}

.user-avatar.large img {
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
  font-size: 1.5rem;
}

.client-details,
.courier-details {
  flex: 1;
}

.client-details h3,
.courier-details h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.client-contact,
.courier-contact {
  margin-bottom: 0.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
}

.contact-item svg {
  margin-right: 0.5rem;
  width: 16px;
}

.client-rating,
.courier-rating {
  display: flex;
  align-items: center;
}

.stars {
  display: flex;
  margin-right: 0.5rem;
  color: #ffc107;
}

.stars.small {
  font-size: 0.875rem;
}

.star-filled {
  color: #ffc107;
}

.star-empty {
  color: #e0e0e0;
}

.courier-vehicle {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  color: var(--text-secondary);
}

.courier-vehicle svg {
  margin-right: 0.5rem;
}

.empty-client,
.empty-courier {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-client svg,
.empty-courier svg {
  margin-bottom: 0.5rem;
}

.address-container {
  display: flex;
  flex-direction: column;
}

.address-card {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.address-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.address-icon.pickup {
  background-color: rgba(255, 107, 0, 0.1);
  color: var(--primary-color);
}

.address-icon.delivery {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.address-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.address-text {
  margin: 0 0 0.25rem;
  color: var(--text-color);
}

.address-commune {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.address-divider {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: var(--border-color);
}

.divider-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.5rem;
  color: var(--text-secondary);
}

.package-details {
  color: var(--text-color);
}

.package-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
}

.meta-item svg {
  margin-right: 0.5rem;
}

.notes-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.tracking-timeline {
  display: flex;
  flex-direction: column;
}

.timeline-event {
  display: flex;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-event:last-child {
  margin-bottom: 0;
}

.timeline-event:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 40px;
  left: 20px;
  width: 1px;
  height: calc(100% - 20px);
  background-color: var(--border-color);
}

.timeline-event.completed .event-icon {
  background-color: var(--success-color);
  color: white;
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--background-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.event-content {
  flex: 1;
}

.event-title {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.event-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.event-description {
  color: var(--text-color);
}

.bids-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bid-item {
  background-color: var(--background-secondary);
  border-radius: 8px;
  padding: 1rem;
}

.bid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  background-color: var(--background-secondary);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: var(--text-color);
}

.user-rating {
  display: flex;
  align-items: center;
}

.bid-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.bid-content {
  margin-bottom: 1rem;
}

.bid-message {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.bid-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.bid-time,
.bid-vehicle {
  display: flex;
  align-items: center;
}

.bid-time svg,
.bid-vehicle svg {
  margin-right: 0.5rem;
}

.bid-actions {
  display: flex;
  justify-content: flex-end;
}

.rating-container {
  padding: 1rem;
  background-color: var(--background-secondary);
  border-radius: 8px;
}

.rating-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.rating-stars {
  display: flex;
  margin-right: 1rem;
  font-size: 1.25rem;
  color: #ffc107;
}

.rating-score {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.rating-comment {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.rating-meta {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 0.875rem;
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
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
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
  border-radius: 4px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-color-dark);
  border-color: var(--primary-color-dark);
}

.btn-outline {
  background-color: transparent;
  color: var(--text-color);
  border-color: var(--border-color);
}

.btn-outline:hover {
  background-color: var(--background-secondary);
}

.btn-danger {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
  border-color: #d32f2f;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.mr-1 {
  margin-right: 0.25rem;
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

  .delivery-status-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .delivery-actions {
    width: 100%;
  }

  .delivery-actions .btn {
    flex: 1;
  }

  .client-info,
  .courier-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-avatar.large {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .contact-item,
  .client-rating,
  .courier-rating,
  .courier-vehicle {
    justify-content: center;
  }
}

@media print {
  .page-header,
  .delivery-actions,
  .bid-actions,
  .modal {
    display: none !important;
  }

  .delivery-detail-view {
    padding: 0;
  }

  .delivery-content {
    gap: 1rem;
  }

  .delivery-info-card {
    box-shadow: none;
    border: 1px solid #ddd;
    page-break-inside: avoid;
  }
}
</style>
