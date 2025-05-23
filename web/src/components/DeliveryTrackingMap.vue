<template>
  <div class="delivery-tracking-map">
    <div class="map-container" ref="mapContainer"></div>
    <div class="map-controls" v-if="showControls">
      <button class="map-control-btn" @click="centerMap" title="Centrer la carte">
        <i class="fas fa-crosshairs"></i>
      </button>
      <button class="map-control-btn" @click="toggleTraffic" title="Afficher/masquer le trafic">
        <i class="fas fa-traffic-light"></i>
      </button>
      <button class="map-control-btn" @click="toggleSatellite" title="Vue satellite">
        <i class="fas fa-satellite"></i>
      </button>
    </div>
    <div class="delivery-info" v-if="showInfo && delivery">
      <div class="delivery-status">
        <div class="status-badge" :class="getStatusClass(delivery.status)">
          {{ getStatusLabel(delivery.status) }}
        </div>
        <div class="estimated-time" v-if="delivery.estimated_time">
          <i class="fas fa-clock mr-1"></i>
          {{ formatTime(delivery.estimated_time) }}
        </div>
      </div>
      <div class="delivery-progress">
        <div class="progress-bar">
          <div class="progress-value" :style="{ width: getProgressPercentage() + '%' }"></div>
        </div>
        <div class="progress-steps">
          <div 
            v-for="(step, index) in deliverySteps" 
            :key="index" 
            class="progress-step"
            :class="{ 'step-completed': isStepCompleted(step.status) }"
          >
            <div class="step-icon">
              <i :class="step.icon"></i>
            </div>
            <div class="step-label">{{ step.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { google } from 'google-maps';

export default {
  name: 'DeliveryTrackingMap',
  props: {
    delivery: {
      type: Object,
      required: true
    },
    showControls: {
      type: Boolean,
      default: true
    },
    showInfo: {
      type: Boolean,
      default: true
    },
    height: {
      type: String,
      default: '400px'
    }
  },
  setup(props) {
    const mapContainer = ref(null);
    let map = null;
    let directionsService = null;
    let directionsRenderer = null;
    let trafficLayer = null;
    let courierMarker = null;
    let pickupMarker = null;
    let deliveryMarker = null;
    let updateInterval = null;
    let isSatelliteView = false;
    
    // Étapes de livraison
    const deliverySteps = [
      { 
        label: 'Commande', 
        status: 'ordered', 
        icon: 'fas fa-shopping-cart' 
      },
      { 
        label: 'Préparation', 
        status: 'preparing', 
        icon: 'fas fa-box' 
      },
      { 
        label: 'Ramassage', 
        status: 'picked_up', 
        icon: 'fas fa-store' 
      },
      { 
        label: 'En route', 
        status: 'in_transit', 
        icon: 'fas fa-motorcycle' 
      },
      { 
        label: 'Livré', 
        status: 'delivered', 
        icon: 'fas fa-check-circle' 
      }
    ];
    
    // Initialiser la carte
    const initMap = () => {
      if (!mapContainer.value) return;
      
      // Vérifier si l'API Google Maps est chargée
      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        return;
      }
      
      // Coordonnées par défaut (Abidjan)
      const defaultCenter = { lat: 5.3599517, lng: -4.0082563 };
      
      // Options de la carte
      const mapOptions = {
        center: defaultCenter,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      };
      
      // Créer la carte
      map = new google.maps.Map(mapContainer.value, mapOptions);
      
      // Initialiser les services de directions
      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4f46e5',
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      
      // Initialiser la couche de trafic
      trafficLayer = new google.maps.TrafficLayer();
      
      // Créer les marqueurs
      createMarkers();
      
      // Calculer et afficher l'itinéraire
      calculateRoute();
      
      // Démarrer la mise à jour de la position du coursier
      startCourierTracking();
    };
    
    // Créer les marqueurs
    const createMarkers = () => {
      if (!map || !props.delivery) return;
      
      // Marqueur du point de ramassage
      if (props.delivery.pickup_location) {
        pickupMarker = new google.maps.Marker({
          position: props.delivery.pickup_location,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          title: 'Point de ramassage'
        });
        
        // Info-bulle pour le point de ramassage
        const pickupInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="info-window">
              <div class="info-title">Point de ramassage</div>
              <div class="info-address">${props.delivery.pickup_address}</div>
            </div>
          `
        });
        
        pickupMarker.addListener('click', () => {
          pickupInfoWindow.open(map, pickupMarker);
        });
      }
      
      // Marqueur du point de livraison
      if (props.delivery.delivery_location) {
        deliveryMarker = new google.maps.Marker({
          position: props.delivery.delivery_location,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          title: 'Point de livraison'
        });
        
        // Info-bulle pour le point de livraison
        const deliveryInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="info-window">
              <div class="info-title">Point de livraison</div>
              <div class="info-address">${props.delivery.delivery_address}</div>
            </div>
          `
        });
        
        deliveryMarker.addListener('click', () => {
          deliveryInfoWindow.open(map, deliveryMarker);
        });
      }
      
      // Marqueur du coursier
      if (props.delivery.courier_location) {
        courierMarker = new google.maps.Marker({
          position: props.delivery.courier_location,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          title: 'Coursier'
        });
        
        // Info-bulle pour le coursier
        const courierInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="info-window">
              <div class="info-title">Coursier</div>
              <div class="info-name">${props.delivery.courier ? props.delivery.courier.name : 'Coursier'}</div>
            </div>
          `
        });
        
        courierMarker.addListener('click', () => {
          courierInfoWindow.open(map, courierMarker);
        });
      }
    };
    
    // Calculer et afficher l'itinéraire
    const calculateRoute = () => {
      if (!directionsService || !directionsRenderer || !props.delivery) return;
      
      // Vérifier si les points de ramassage et de livraison sont définis
      if (!props.delivery.pickup_location || !props.delivery.delivery_location) return;
      
      const request = {
        origin: props.delivery.pickup_location,
        destination: props.delivery.delivery_location,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      };
      
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          
          // Ajuster la vue de la carte pour afficher l'itinéraire complet
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(props.delivery.pickup_location);
          bounds.extend(props.delivery.delivery_location);
          
          if (props.delivery.courier_location) {
            bounds.extend(props.delivery.courier_location);
          }
          
          map.fitBounds(bounds);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      });
    };
    
    // Démarrer la mise à jour de la position du coursier
    const startCourierTracking = () => {
      if (!props.delivery || !map) return;
      
      // Simuler la mise à jour de la position du coursier toutes les 5 secondes
      updateInterval = setInterval(() => {
        // Dans un environnement réel, cette fonction appellerait l'API pour obtenir la position actuelle du coursier
        // Pour la démonstration, nous simulons un déplacement aléatoire
        if (courierMarker && props.delivery.status === 'in_transit') {
          const currentPosition = courierMarker.getPosition();
          
          // Simuler un déplacement aléatoire
          const newLat = currentPosition.lat() + (Math.random() - 0.5) * 0.001;
          const newLng = currentPosition.lng() + (Math.random() - 0.5) * 0.001;
          
          // Mettre à jour la position du marqueur
          courierMarker.setPosition({ lat: newLat, lng: newLng });
        }
      }, 5000);
    };
    
    // Centrer la carte
    const centerMap = () => {
      if (!map) return;
      
      const bounds = new google.maps.LatLngBounds();
      
      if (pickupMarker) bounds.extend(pickupMarker.getPosition());
      if (deliveryMarker) bounds.extend(deliveryMarker.getPosition());
      if (courierMarker) bounds.extend(courierMarker.getPosition());
      
      map.fitBounds(bounds);
    };
    
    // Afficher/masquer la couche de trafic
    const toggleTraffic = () => {
      if (!trafficLayer || !map) return;
      
      if (trafficLayer.getMap()) {
        trafficLayer.setMap(null);
      } else {
        trafficLayer.setMap(map);
      }
    };
    
    // Basculer entre la vue satellite et la vue normale
    const toggleSatellite = () => {
      if (!map) return;
      
      isSatelliteView = !isSatelliteView;
      map.setMapTypeId(isSatelliteView ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP);
    };
    
    // Formater le temps estimé
    const formatTime = (minutes) => {
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} h ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`;
      }
    };
    
    // Obtenir la classe CSS pour un statut
    const getStatusClass = (status) => {
      switch (status) {
        case 'ordered': return 'status-ordered';
        case 'preparing': return 'status-preparing';
        case 'picked_up': return 'status-picked-up';
        case 'in_transit': return 'status-in-transit';
        case 'delivered': return 'status-delivered';
        case 'cancelled': return 'status-cancelled';
        default: return '';
      }
    };
    
    // Obtenir le libellé pour un statut
    const getStatusLabel = (status) => {
      switch (status) {
        case 'ordered': return 'Commandé';
        case 'preparing': return 'En préparation';
        case 'picked_up': return 'Ramassé';
        case 'in_transit': return 'En cours de livraison';
        case 'delivered': return 'Livré';
        case 'cancelled': return 'Annulé';
        default: return status;
      }
    };
    
    // Vérifier si une étape est complétée
    const isStepCompleted = (stepStatus) => {
      const statusOrder = ['ordered', 'preparing', 'picked_up', 'in_transit', 'delivered'];
      const currentStatusIndex = statusOrder.indexOf(props.delivery.status);
      const stepStatusIndex = statusOrder.indexOf(stepStatus);
      
      return stepStatusIndex <= currentStatusIndex;
    };
    
    // Obtenir le pourcentage de progression
    const getProgressPercentage = () => {
      const statusOrder = ['ordered', 'preparing', 'picked_up', 'in_transit', 'delivered'];
      const currentStatusIndex = statusOrder.indexOf(props.delivery.status);
      
      if (currentStatusIndex === -1) return 0;
      
      return (currentStatusIndex / (statusOrder.length - 1)) * 100;
    };
    
    // Surveiller les changements de livraison
    watch(() => props.delivery, (newDelivery, oldDelivery) => {
      if (!newDelivery) return;
      
      // Mettre à jour les marqueurs si nécessaire
      if (!oldDelivery || 
          JSON.stringify(newDelivery.pickup_location) !== JSON.stringify(oldDelivery.pickup_location) ||
          JSON.stringify(newDelivery.delivery_location) !== JSON.stringify(oldDelivery.delivery_location)) {
        
        // Supprimer les anciens marqueurs
        if (pickupMarker) pickupMarker.setMap(null);
        if (deliveryMarker) deliveryMarker.setMap(null);
        
        // Créer les nouveaux marqueurs
        createMarkers();
        
        // Recalculer l'itinéraire
        calculateRoute();
      }
      
      // Mettre à jour la position du coursier
      if (courierMarker && newDelivery.courier_location) {
        courierMarker.setPosition(newDelivery.courier_location);
      }
    }, { deep: true });
    
    // Initialiser la carte au montage du composant
    onMounted(() => {
      // Définir la hauteur du conteneur de carte
      if (mapContainer.value) {
        mapContainer.value.style.height = props.height;
      }
      
      // Initialiser la carte
      initMap();
    });
    
    // Nettoyer les ressources au démontage du composant
    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    });
    
    return {
      mapContainer,
      deliverySteps,
      centerMap,
      toggleTraffic,
      toggleSatellite,
      formatTime,
      getStatusClass,
      getStatusLabel,
      isStepCompleted,
      getProgressPercentage
    };
  }
};
</script>

<style scoped>
.delivery-tracking-map {
  position: relative;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 400px;
}

.map-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1;
}

.map-control-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: white;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.map-control-btn:hover {
  background-color: #f3f4f6;
  color: #4f46e5;
}

.delivery-info {
  background-color: white;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.delivery-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-ordered {
  background-color: #e5e7eb;
  color: #4b5563;
}

.status-preparing {
  background-color: #fef3c7;
  color: #d97706;
}

.status-picked-up {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.status-in-transit {
  background-color: #c7d2fe;
  color: #4338ca;
}

.status-delivered {
  background-color: #d1fae5;
  color: #059669;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #dc2626;
}

.estimated-time {
  font-size: 0.875rem;
  color: #4b5563;
}

.delivery-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-value {
  height: 100%;
  background-color: #4f46e5;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20%;
}

.step-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.step-completed .step-icon {
  background-color: #4f46e5;
  color: white;
}

.step-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.step-completed .step-label {
  color: #4f46e5;
  font-weight: 500;
}

.mr-1 {
  margin-right: 0.25rem;
}

/* Styles pour les info-bulles de Google Maps */
:deep(.info-window) {
  padding: 0.5rem;
}

:deep(.info-title) {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

:deep(.info-address),
:deep(.info-name) {
  font-size: 0.875rem;
  color: #4b5563;
}

@media (max-width: 768px) {
  .progress-steps {
    display: none;
  }
}
</style>
