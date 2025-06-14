<template>
  <div class="map-wrapper">
    <div id="map" ref="mapContainer"></div>
    <div class="map-legend">
      <div class="legend-item">
        <div class="legend-color traffic"></div>
        <span>Zone de trafic</span>
      </div>
      <div class="legend-item">
        <div class="legend-color delivery"></div>
        <span>Zone de livraison</span>
      </div>
      <div class="legend-item">
        <div class="legend-color restricted"></div>
        <span>Zone restreinte</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon traffic-report"></div>
        <span>Rapport de trafic</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon weather-alert"></div>
        <span>Alerte météo</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon courier"></div>
        <span>Coursier actif</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default {
  name: 'ZoneMap',
  props: {
    zones: {
      type: Array,
      default: () => [],
    },
    trafficReports: {
      type: Array,
      default: () => [],
    },
    weatherAlerts: {
      type: Array,
      default: () => [],
    },
    couriers: {
      type: Array,
      default: () => [],
    },
    center: {
      type: Object,
      default: null,
    },
  },
  emits: ['zone-click', 'map-click'],
  setup(props, { emit }) {
    const mapContainer = ref(null)
    const map = ref(null)
    const zonesLayer = ref(null)
    const trafficLayer = ref(null)
    const weatherLayer = ref(null)
    const couriersLayer = ref(null)

    const initMap = () => {
      // Coordonnées du centre d'Abidjan
      const defaultCenter = [5.36, -4.0085]

      // Initialiser la carte
      map.value = L.map(mapContainer.value).setView(defaultCenter, 12)

      // Ajouter le fond de carte OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map.value)

      // Initialiser les couches
      zonesLayer.value = L.layerGroup().addTo(map.value)
      trafficLayer.value = L.layerGroup().addTo(map.value)
      weatherLayer.value = L.layerGroup().addTo(map.value)
      couriersLayer.value = L.layerGroup().addTo(map.value)

      // Ajouter l'événement de clic sur la carte
      map.value.on('click', e => {
        emit('map-click', e)
      })
    }

    const renderZones = () => {
      // Vider la couche des zones
      zonesLayer.value.clearLayers()

      // Ajouter chaque zone à la carte
      props.zones.forEach(zone => {
        // Convertir les coordonnées au format Leaflet
        const coordinates = zone.coordinates.map(coord => [coord.lat, coord.lng])

        // Définir le style en fonction du type de zone
        let fillColor, fillOpacity

        switch (zone.type) {
          case 'traffic':
            fillColor = '#F44336'
            fillOpacity = 0.3
            break
          case 'delivery':
            fillColor = '#4CAF50'
            fillOpacity = 0.3
            break
          case 'restricted':
            fillColor = '#FF9800'
            fillOpacity = 0.3
            break
          default:
            fillColor = '#2196F3'
            fillOpacity = 0.3
        }

        // Créer le polygone
        const polygon = L.polygon(coordinates, {
          color: fillColor,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          weight: 2,
        }).addTo(zonesLayer.value)

        // Ajouter un popup avec les informations de la zone
        polygon.bindPopup(`
          <div class="zone-popup">
            <h3>${zone.name}</h3>
            <p><strong>Type:</strong> ${zone.type}</p>
            <p><strong>Commune:</strong> ${zone.commune}</p>
            <p>${zone.description}</p>
          </div>
        `)

        // Ajouter l'événement de clic
        polygon.on('click', () => {
          emit('zone-click', zone)
        })
      })
    }

    const renderTrafficReports = () => {
      // Vider la couche des rapports de trafic
      trafficLayer.value.clearLayers()

      // Ajouter chaque rapport à la carte
      props.trafficReports.forEach(report => {
        // Définir l'icône en fonction de la sévérité
        let iconSize

        switch (report.severity) {
          case 'high':
            iconSize = [32, 32]
            break
          case 'medium':
            iconSize = [28, 28]
            break
          case 'low':
            iconSize = [24, 24]
            break
          default:
            iconSize = [28, 28]
        }

        // Créer l'icône
        const icon = L.divIcon({
          className: `traffic-icon severity-${report.severity}`,
          html: `<i class="fas fa-exclamation-triangle"></i>`,
          iconSize: iconSize,
        })

        // Créer le marqueur
        const marker = L.marker([report.lat, report.lng], { icon }).addTo(trafficLayer.value)

        // Ajouter un popup avec les informations du rapport
        marker.bindPopup(`
          <div class="traffic-popup">
            <h3>Rapport de trafic</h3>
            <p><strong>Sévérité:</strong> ${report.severity}</p>
            <p><strong>Commune:</strong> ${report.commune}</p>
            <p><strong>Description:</strong> ${report.description}</p>
            <p><strong>Date:</strong> ${new Date(report.created_at).toLocaleString()}</p>
          </div>
        `)
      })
    }

    const renderWeatherAlerts = () => {
      // Vider la couche des alertes météo
      weatherLayer.value.clearLayers()

      // Ajouter chaque alerte à la carte
      props.weatherAlerts.forEach(alert => {
        // Obtenir les coordonnées approximatives de la commune
        const communeCoordinates = getCommuneCoordinates(alert.commune)

        if (!communeCoordinates) return

        // Définir l'icône en fonction du type d'alerte
        let iconClass

        switch (alert.alert_type) {
          case 'rain':
            iconClass = 'fa-cloud-rain'
            break
          case 'flood':
            iconClass = 'fa-water'
            break
          case 'storm':
            iconClass = 'fa-bolt'
            break
          case 'wind':
            iconClass = 'fa-wind'
            break
          case 'fog':
            iconClass = 'fa-smog'
            break
          default:
            iconClass = 'fa-cloud'
        }

        // Créer l'icône
        const icon = L.divIcon({
          className: `weather-icon severity-${alert.severity}`,
          html: `<i class="fas ${iconClass}"></i>`,
          iconSize: [32, 32],
        })

        // Créer le marqueur
        const marker = L.marker([communeCoordinates.lat, communeCoordinates.lng], { icon }).addTo(
          weatherLayer.value
        )

        // Ajouter un popup avec les informations de l'alerte
        marker.bindPopup(`
          <div class="weather-popup">
            <h3>Alerte météo</h3>
            <p><strong>Type:</strong> ${alert.alert_type}</p>
            <p><strong>Sévérité:</strong> ${alert.severity}</p>
            <p><strong>Commune:</strong> ${alert.commune}</p>
            <p><strong>Description:</strong> ${alert.description}</p>
            <p><strong>Expire:</strong> ${new Date(alert.expires_at).toLocaleString()}</p>
          </div>
        `)
      })
    }

    const renderCouriers = () => {
      // Vider la couche des coursiers
      couriersLayer.value.clearLayers()

      // Ajouter chaque coursier à la carte
      props.couriers.forEach(courier => {
        // Créer l'icône
        const icon = L.divIcon({
          className: 'courier-icon',
          html: `<i class="fas fa-motorcycle"></i>`,
          iconSize: [24, 24],
        })

        // Créer le marqueur
        const marker = L.marker([courier.last_location_lat, courier.last_location_lng], {
          icon,
        }).addTo(couriersLayer.value)

        // Ajouter un popup avec les informations du coursier
        marker.bindPopup(`
          <div class="courier-popup">
            <h3>${courier.full_name}</h3>
            <p><strong>Téléphone:</strong> ${courier.phone}</p>
            <p><strong>Commune:</strong> ${courier.commune}</p>
            <p><strong>Dernière mise à jour:</strong> ${new Date(
              courier.last_location_updated
            ).toLocaleString()}</p>
          </div>
        `)
      })
    }

    const getCommuneCoordinates = commune => {
      // Coordonnées approximatives des communes d'Abidjan
      const communeCoordinates = {
        Abobo: { lat: 5.4414, lng: -4.0444 },
        Adjamé: { lat: 5.3667, lng: -4.0167 },
        Attécoubé: { lat: 5.3333, lng: -4.0333 },
        Cocody: { lat: 5.36, lng: -3.9678 },
        Koumassi: { lat: 5.3, lng: -3.95 },
        Marcory: { lat: 5.3, lng: -3.9833 },
        Plateau: { lat: 5.3167, lng: -4.0167 },
        'Port-Bouët': { lat: 5.25, lng: -3.9333 },
        Treichville: { lat: 5.2833, lng: -4.0 },
        Yopougon: { lat: 5.3167, lng: -4.0833 },
      }

      return communeCoordinates[commune]
    }

    onMounted(() => {
      initMap()
      renderZones()
      renderTrafficReports()
      renderWeatherAlerts()
      renderCouriers()
    })

    onUnmounted(() => {
      if (map.value) {
        map.value.remove()
      }
    })

    watch(
      () => props.zones,
      () => {
        renderZones()
      },
      { deep: true }
    )

    watch(
      () => props.trafficReports,
      () => {
        renderTrafficReports()
      },
      { deep: true }
    )

    watch(
      () => props.weatherAlerts,
      () => {
        renderWeatherAlerts()
      },
      { deep: true }
    )

    watch(
      () => props.couriers,
      () => {
        renderCouriers()
      },
      { deep: true }
    )

    watch(
      () => props.center,
      newCenter => {
        if (newCenter && map.value) {
          map.value.setView([newCenter.lat, newCenter.lng], 14)
        }
      }
    )

    return {
      mapContainer,
    }
  },
}
</script>

<style scoped>
.map-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

#map {
  height: 100%;
  width: 100%;
}

.map-legend {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-color {
  width: 20px;
  height: 10px;
  margin-right: 8px;
  border-radius: 2px;
}

.legend-color.traffic {
  background-color: rgba(244, 67, 54, 0.3);
  border: 1px solid #f44336;
}

.legend-color.delivery {
  background-color: rgba(76, 175, 80, 0.3);
  border: 1px solid #4caf50;
}

.legend-color.restricted {
  background-color: rgba(255, 152, 0, 0.3);
  border: 1px solid #ff9800;
}

.legend-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.legend-icon.traffic-report::before {
  content: '!';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
}

.legend-icon.weather-alert::before {
  content: '☂';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: #2196f3;
  color: white;
  border-radius: 50%;
}

.legend-icon.courier::before {
  content: '🛵';
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: #9c27b0;
  color: white;
  border-radius: 50%;
}
</style>

<style>
/* Styles pour les icônes sur la carte */
.traffic-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 50%;
  text-align: center;
}

.traffic-icon.severity-high {
  background-color: #f44336;
}

.traffic-icon.severity-medium {
  background-color: #ff9800;
}

.traffic-icon.severity-low {
  background-color: #4caf50;
}

.weather-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 50%;
  text-align: center;
}

.weather-icon.severity-high {
  background-color: #f44336;
}

.weather-icon.severity-medium {
  background-color: #ff9800;
}

.weather-icon.severity-low {
  background-color: #4caf50;
}

.courier-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: #9c27b0;
  border-radius: 50%;
  text-align: center;
}

/* Styles pour les popups */
.leaflet-popup-content-wrapper {
  border-radius: 4px;
}

.leaflet-popup-content {
  margin: 10px 12px;
}

.zone-popup h3,
.traffic-popup h3,
.weather-popup h3,
.courier-popup h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.zone-popup p,
.traffic-popup p,
.weather-popup p,
.courier-popup p {
  margin: 5px 0;
  font-size: 14px;
}
</style>
