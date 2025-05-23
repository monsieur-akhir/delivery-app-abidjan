<template>
  <div class="delivery-details">
    <div class="delivery-header">
      <div class="delivery-info">
        <h3>Livraison #{{ delivery.id }}</h3>
        <span :class="['status-badge', getStatusClass(delivery.status)]">
          {{ getStatusLabel(delivery.status) }}
        </span>
      </div>
      <div class="delivery-price">
        {{ formatPrice(delivery.final_price) }} FCFA
      </div>
    </div>

    <div class="delivery-content">
      <!-- Carte de l'itinéraire -->
      <div class="map-section">
        <h4>Itinéraire</h4>
        <div class="map-container">
          <div id="delivery-map" class="map"></div>
        </div>
      </div>

      <!-- Informations de livraison -->
      <div class="route-section">
        <h4>Détails de la livraison</h4>
        <div class="route-details">
          <div class="route-point">
            <div class="point-icon pickup">
              <i class="fas fa-circle"></i>
            </div>
            <div class="point-info">
              <div class="point-label">Point de ramassage</div>
              <div class="point-address">{{ delivery.pickup_address }}</div>
              <div class="point-commune">{{ delivery.pickup_commune }}</div>
            </div>
          </div>
          
          <div class="route-line"></div>
          
          <div class="route-point">
            <div class="point-icon delivery">
              <i class="fas fa-circle"></i>
            </div>
            <div class="point-info">
              <div class="point-label">Point de livraison</div>
              <div class="point-address">{{ delivery.delivery_address }}</div>
              <div class="point-commune">{{ delivery.delivery_commune }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Équipe collaborative -->
      <div class="team-section">
        <h4>Équipe collaborative</h4>
        <div class="team-members">
          <div 
            v-for="collaborator in delivery.collaborators" 
            :key="collaborator.courier_id"
            class="team-member"
          >
            <div class="member-avatar">
              <img 
                :src="collaborator.profile_picture || '/default-avatar.png'" 
                :alt="collaborator.courier_name"
              >
              <div :class="['role-badge', getRoleClass(collaborator.role)]">
                {{ getRoleLabel(collaborator.role) }}
              </div>
            </div>
            <div class="member-info">
              <div class="member-name">{{ collaborator.courier_name }}</div>
              <div class="member-share">{{ collaborator.share_percentage }}% des gains</div>
              <div :class="['member-status', getCollaboratorStatusClass(collaborator.status)]">
                {{ getCollaboratorStatusLabel(collaborator.status) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chronologie -->
      <div class="timeline-section">
        <h4>Chronologie</h4>
        <div class="timeline">
          <div class="timeline-item completed">
            <div class="timeline-icon">
              <i class="fas fa-plus"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">Livraison créée</div>
              <div class="timeline-time">{{ formatDateTime(delivery.created_at) }}</div>
            </div>
          </div>
          
          <div v-if="delivery.accepted_at" class="timeline-item completed">
            <div class="timeline-icon">
              <i class="fas fa-handshake"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">Équipe formée</div>
              <div class="timeline-time">{{ formatDateTime(delivery.accepted_at) }}</div>
            </div>
          </div>
          
          <div v-if="delivery.pickup_at" class="timeline-item completed">
            <div class="timeline-icon">
              <i class="fas fa-box"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">Colis ramassé</div>
              <div class="timeline-time">{{ formatDateTime(delivery.pickup_at) }}</div>
            </div>
          </div>
          
          <div v-if="delivery.delivered_at" class="timeline-item completed">
            <div class="timeline-icon">
              <i class="fas fa-check"></i>
            </div>
            <div class="timeline-content">
              <div class="timeline-title">Colis livré</div>
              <div class="timeline-time">{{ formatDateTime(delivery.delivered_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import L from 'leaflet'

export default {
  name: 'DeliveryDetailsComponent',
  props: {
    delivery: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    let map = null
    
    const initMap = () => {
      if (!props.delivery.pickup_lat || !props.delivery.delivery_lat) return
      
      // Initialiser la carte
      map = L.map('delivery-map').setView([
        (props.delivery.pickup_lat + props.delivery.delivery_lat) / 2,
        (props.delivery.pickup_lng + props.delivery.delivery_lng) / 2
      ], 13)
      
      // Ajouter les tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      
      // Marqueur de ramassage
      const pickupIcon = L.divIcon({
        html: '<i class="fas fa-circle" style="color: #007bff;"></i>',
        iconSize: [20, 20],
        className: 'custom-div-icon'
      })
      
      L.marker([props.delivery.pickup_lat, props.delivery.pickup_lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>Ramassage</b><br>${props.delivery.pickup_address}`)
      
      // Marqueur de livraison
      const deliveryIcon = L.divIcon({
        html: '<i class="fas fa-circle" style="color: #28a745;"></i>',
        iconSize: [20, 20],
        className: 'custom-div-icon'
      })
      
      L.marker([props.delivery.delivery_lat, props.delivery.delivery_lng], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`<b>Livraison</b><br>${props.delivery.delivery_address}`)
      
      // Ligne entre les points
      const latlngs = [
        [props.delivery.pickup_lat, props.delivery.pickup_lng],
        [props.delivery.delivery_lat, props.delivery.delivery_lng]
      ]
      
      L.polyline(latlngs, { color: '#007bff', weight: 3 }).addTo(map)
      
      // Ajuster la vue
      const group = new L.featureGroup([
        L.marker([props.delivery.pickup_lat, props.delivery.pickup_lng]),
        L.marker([props.delivery.delivery_lat, props.delivery.delivery_lng])
      ])
      map.fitBounds(group.getBounds().pad(0.1))
    }
    
    const getStatusClass = (status) => {
      const classes = {
        pending: 'status-pending',
        in_progress: 'status-progress',
        completed: 'status-completed',
        cancelled: 'status-cancelled'
      }
      return classes[status] || 'status-default'
    }
    
    const getStatusLabel = (status) => {
      const labels = {
        pending: 'En attente',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée'
      }
      return labels[status] || status
    }
    
    const getRoleClass = (role) => {
      const classes = {
        primary: 'role-primary',
        secondary: 'role-secondary',
        support: 'role-support'
      }
      return classes[role] || 'role-default'
    }
    
    const getRoleLabel = (role) => {
      const labels = {
        primary: 'Principal',
        secondary: 'Secondaire',
        support: 'Support'
      }
      return labels[role] || role
    }
    
    const getCollaboratorStatusClass = (status) => {
      const classes = {
        pending: 'collab-pending',
        accepted: 'collab-accepted',
        completed: 'collab-completed'
      }
      return classes[status] || 'collab-default'
    }
    
    const getCollaboratorStatusLabel = (status) => {
      const labels = {
        pending: 'En attente',
        accepted: 'Accepté',
        completed: 'Terminé'
      }
      return labels[status] || status
    }
    
    onMounted(() => {
      setTimeout(initMap, 100) // Délai pour s'assurer que le DOM est prêt
    })
    
    onUnmounted(() => {
      if (map) {
        map.remove()
      }
    })
    
    return {
      formatPrice,
      formatDateTime,
      getStatusClass,
      getStatusLabel,
      getRoleClass,
      getRoleLabel,
      getCollaboratorStatusClass,
      getCollaboratorStatusLabel
    }
  }
}
</script>

<style scoped>
.delivery-details {
  padding: 20px;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.delivery-info h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.delivery-price {
  font-size: 20px;
  font-weight: bold;
  color: #007bff;
}

.delivery-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.map-section,
.route-section,
.team-section,
.timeline-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.map-section {
  grid-column: 1 / -1;
}

.map-container {
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 100%;
}

.route-details {
  margin-top: 15px;
}

.route-point {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.point-icon {
  margin-right: 15px;
  margin-top: 5px;
}

.point-icon.pickup i {
  color: #007bff;
  font-size: 12px;
}

.point-icon.delivery i {
  color: #28a745;
  font-size: 12px;
}

.route-line {
  width: 2px;
  height: 20px;
  background: #ddd;
  margin-left: 5px;
  margin-bottom: 15px;
}

.point-label {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.point-address {
  color: #666;
  margin-bottom: 3px;
}

.point-commune {
  color: #999;
  font-size: 14px;
}

.team-members {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.team-member {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-avatar {
  position: relative;
  margin-right: 15px;
}

.member-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.role-primary {
  background: #28a745;
}

.role-secondary {
  background: #007bff;
}

.role-support {
  background: #ffc107;
  color: #333;
}

.member-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.member-share {
  color: #666;
  font-size: 14px;
  margin-bottom: 3px;
}

.member-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.collab-pending {
  background: #fff3cd;
  color: #856404;
}

.collab-accepted {
  background: #d1ecf1;
  color: #0c5460;
}

.collab-completed {
  background: #d4edda;
  color: #155724;
}

.timeline {
  margin-top: 15px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 15px;
  top: 30px;
  width: 2px;
  height: 20px;
  background: #ddd;
}

.timeline-item.completed::after {
  background: #28a745;
}

.timeline-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: white;
}

.timeline-item.completed .timeline-icon {
  background: #28a745;
}

.timeline-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.timeline-time {
  color: #666;
  font-size: 14px;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-progress {
  background: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

@media (max-width: 768px) {
  .delivery-content {
    grid-template-columns: 1fr;
  }
  
  .delivery-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
