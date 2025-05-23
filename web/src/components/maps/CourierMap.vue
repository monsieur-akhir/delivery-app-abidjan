<template>
  <div class="map-wrapper">
    <div id="courier-map" ref="mapContainer"></div>
    <div class="map-controls">
      <button class="btn btn-primary" @click="centerOnCourier">
        <font-awesome-icon icon="location-arrow" /> Centrer
      </button>
      <button class="btn btn-secondary" @click="refreshCouriers">
        <font-awesome-icon icon="sync" /> Actualiser
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getActiveCouriers } from '@/api/manager';

export default {
  name: 'CourierMap',
  props: {
    selectedCourierId: {
      type: Number,
      default: null
    },
    deliveryRoute: {
      type: Array,
      default: () => []
    },
    showAllCouriers: {
      type: Boolean,
      default: true
    }
  },
  emits: ['courier-click'],
  setup(props, { emit }) {
    const mapContainer = ref(null);
    const map = ref(null);
    const couriersLayer = ref(null);
    const routeLayer = ref(null);
    const couriers = ref([]);
    const courierMarkers = ref({});
    
    const initMap = () => {
      // Coordonnées du centre d'Abidjan
      const defaultCenter = [5.3600, -4.0085];
      
      // Initialiser la carte
      map.value = L.map(mapContainer.value).setView(defaultCenter, 12);
      
      // Ajouter le fond de carte OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.value);
      
      // Initialiser les couches
      couriersLayer.value = L.layerGroup().addTo(map.value);
      routeLayer.value = L.layerGroup().addTo(map.value);
    };
    
    const loadCouriers = async () => {
      try {
        const data = await getActiveCouriers();
        couriers.value = data;
        renderCouriers();
      } catch (error) {
        console.error('Erreur lors du chargement des coursiers:', error);
      }
    };
    
    const renderCouriers = () => {
      // Vider la couche des coursiers
      couriersLayer.value.clearLayers();
      courierMarkers.value = {};
      
      // Filtrer les coursiers si nécessaire
      const couriersToRender = props.showAllCouriers 
        ? couriers.value 
        : couriers.value.filter(c => c.id === props.selectedCourierId);
      
      // Ajouter chaque coursier à la carte
      couriersToRender.forEach(courier => {
        // Vérifier si les coordonnées sont valides
        if (!courier.last_location_lat || !courier.last_location_lng) return;
        
        // Créer l'icône
        const isSelected = courier.id === props.selectedCourierId;
        
        const icon = L.divIcon({
          className: `courier-icon ${isSelected ? 'selected' : ''}`,
          html: `<i class="fas fa-motorcycle"></i>`,
          iconSize: isSelected ? [32, 32] : [24, 24]
        });
        
        // Créer le marqueur
        const marker = L.marker([courier.last_location_lat, courier.last_location_lng], { icon })
          .addTo(couriersLayer.value);
        
        // Ajouter un popup avec les informations du coursier
        marker.bindPopup(`
          <div class="courier-popup">
            <h3>${courier.full_name}</h3>
            <p><strong>Téléphone:</strong> ${courier.phone}</p>
            <p><strong>Commune:</strong> ${courier.commune || 'Non spécifiée'}</p>
            <p><strong>Dernière mise à jour:</strong> ${new Date(courier.last_location_updated).toLocaleString()}</p>
          </div>
        `);
        
        // Ajouter l'événement de clic
        marker.on('click', () => {
          emit('courier-click', courier);
        });
        
        // Stocker le marqueur pour référence future
        courierMarkers.value[courier.id] = marker;
      });
    };
    
    const renderRoute = () => {
      // Vider la couche de l'itinéraire
      routeLayer.value.clearLayers();
      
      // Vérifier si un itinéraire est fourni
      if (!props.deliveryRoute || props.deliveryRoute.length < 2) return;
      
      // Convertir les coordonnées au format Leaflet
      const routePoints = props.deliveryRoute.map(point => [point.lat, point.lng]);
      
      // Créer la ligne de l'itinéraire
      const routeLine = L.polyline(routePoints, {
        color: '#4361ee',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineCap: 'round'
      }).addTo(routeLayer.value);
      
      // Ajouter des marqueurs pour le départ et l'arrivée
      const startIcon = L.divIcon({
        className: 'route-icon start',
        html: '<i class="fas fa-map-marker-alt"></i>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      
      const endIcon = L.divIcon({
        className: 'route-icon end',
        html: '<i class="fas fa-flag-checkered"></i>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      
      // Ajouter les marqueurs
      L.marker(routePoints[0], { icon: startIcon })
        .addTo(routeLayer.value)
        .bindPopup('<div class="route-popup"><h3>Point de départ</h3></div>');
      
      L.marker(routePoints[routePoints.length - 1], { icon: endIcon })
        .addTo(routeLayer.value)
        .bindPopup('<div class="route-popup"><h3>Point d\'arrivée</h3></div>');
      
      // Ajuster la vue pour inclure tout l'itinéraire
      map.value.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    };
    
    const centerOnCourier = () => {
      if (props.selectedCourierId && courierMarkers.value[props.selectedCourierId]) {
        const marker = courierMarkers.value[props.selectedCourierId];
        const position = marker.getLatLng();
        map.value.setView(position, 15);
      }
    };
    
    const refreshCouriers = () => {
      loadCouriers();
    };
    
    onMounted(() => {
      initMap();
      loadCouriers();
      
      // Rafraîchir les données toutes les 30 secondes
      const interval = setInterval(refreshCouriers, 30000);
      
      // Nettoyer l'intervalle lors de la destruction du composant
      return () => clearInterval(interval);
    });
    
    onUnmounted(() => {
      if (map.value) {
        map.value.remove();
      }
    });
    
    watch(() => props.selectedCourierId, () => {
      renderCouriers();
      centerOnCourier();
    });
    
    watch(() => props.deliveryRoute, () => {
      renderRoute();
    }, { deep: true });
    
    watch(() => props.showAllCouriers, () => {
      renderCouriers();
    });
    
    return {
      mapContainer,
      centerOnCourier,
      refreshCouriers
    };
  }
};
</script>

<style scoped>
.map-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

#courier-map {
  height: 100%;
  width: 100%;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.btn {
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}

.btn-secondary {
  background-color: white;
  color: #333;
}
</style>

<style>
/* Styles pour les icônes sur la carte */
.courier-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: #9C27B0;
  border-radius: 50%;
  text-align: center;
}

.courier-icon.selected {
  background-color: #4361ee;
  box-shadow: 0 0 0 3px white, 0 0 0 5px #4361ee;
  z-index: 1000 !important;
}

.route-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4361ee;
  text-align: center;
}

.route-icon.start {
  color: #4CAF50;
}

.route-icon.end {
  color: #F44336;
}

/* Styles pour les popups */
.courier-popup h3, .route-popup h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.courier-popup p, .route-popup p {
  margin: 5px 0;
  font-size: 14px;
}
</style>
