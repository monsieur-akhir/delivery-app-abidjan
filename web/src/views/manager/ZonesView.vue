<template>
  <div class="zones-view">
    <h1 class="page-title">Gestion des zones</h1>
    
    <div class="controls">
      <div class="filters">
        <div class="filter-group">
          <label>Type de zone:</label>
          <select v-model="selectedZoneType">
            <option value="all">Toutes les zones</option>
            <option value="traffic">Zones de trafic</option>
            <option value="delivery">Zones de livraison</option>
            <option value="restricted">Zones restreintes</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Commune:</label>
          <select v-model="selectedCommune">
            <option value="">Toutes les communes</option>
            <option v-for="commune in communes" :key="commune" :value="commune">
              {{ commune }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn btn-primary" @click="showAddZoneModal = true">
          <font-awesome-icon icon="plus" /> Ajouter une zone
        </button>
        <button class="btn btn-secondary" @click="refreshZones">
          <font-awesome-icon icon="sync" /> Actualiser
        </button>
      </div>
    </div>
    
    <div class="map-container">
      <zone-map 
        :zones="filteredZones" 
        :traffic-reports="trafficReports"
        :weather-alerts="weatherAlerts"
        :couriers="activeCouriers"
        @zone-click="handleZoneClick"
        @map-click="handleMapClick"
      />
    </div>
    
    <div class="data-panels">
      <div class="panel traffic-panel">
        <h3>Rapports de trafic récents</h3>
        <div class="panel-content">
          <div v-if="trafficReports.length === 0" class="empty-state">
            Aucun rapport de trafic récent
          </div>
          <ul v-else class="report-list">
            <li v-for="report in trafficReports" :key="report.id" class="report-item" :class="'severity-' + report.severity">
              <div class="report-header">
                <span class="report-severity">{{ formatSeverity(report.severity) }}</span>
                <span class="report-time">{{ formatDateTime(report.created_at) }}</span>
              </div>
              <div class="report-location">{{ report.commune }} - {{ report.description }}</div>
              <div class="report-actions">
                <button class="btn btn-sm" @click="centerMapOn(report.lat, report.lng)">
                  <font-awesome-icon icon="map-marker-alt" /> Voir sur la carte
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteTrafficReport(report.id)">
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="panel weather-panel">
        <h3>Alertes météo</h3>
        <div class="panel-content">
          <div v-if="weatherAlerts.length === 0" class="empty-state">
            Aucune alerte météo active
          </div>
          <ul v-else class="alert-list">
            <li v-for="alert in weatherAlerts" :key="alert.id" class="alert-item" :class="'severity-' + alert.severity">
              <div class="alert-header">
                <span class="alert-type">{{ alert.alert_type }}</span>
                <span class="alert-severity">{{ formatSeverity(alert.severity) }}</span>
              </div>
              <div class="alert-location">{{ alert.commune }}</div>
              <div class="alert-description">{{ alert.description }}</div>
              <div class="alert-footer">
                <span class="alert-expiry">Expire: {{ formatDateTime(alert.expires_at) }}</span>
                <button class="btn btn-sm btn-danger" @click="deleteWeatherAlert(alert.id)">
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </li>
          </ul>
          <div class="panel-actions">
            <button class="btn btn-primary" @click="showAddWeatherAlertModal = true">
              <font-awesome-icon icon="plus" /> Ajouter une alerte
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal pour ajouter une zone -->
    <div v-if="showAddZoneModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ajouter une nouvelle zone</h3>
          <button class="close-btn" @click="showAddZoneModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addZone">
            <div class="form-group">
              <label for="zone-name">Nom de la zone</label>
              <input id="zone-name" v-model="newZone.name" type="text" required>
            </div>
            
            <div class="form-group">
              <label for="zone-type">Type de zone</label>
              <select id="zone-type" v-model="newZone.type" required>
                <option value="traffic">Zone de trafic</option>
                <option value="delivery">Zone de livraison</option>
                <option value="restricted">Zone restreinte</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="zone-commune">Commune</label>
              <select id="zone-commune" v-model="newZone.commune" required>
                <option value="">Sélectionner une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="zone-description">Description</label>
              <textarea id="zone-description" v-model="newZone.description" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label>Coordonnées</label>
              <p class="help-text">Cliquez sur la carte pour définir les coordonnées de la zone</p>
              <div class="coordinates-list">
                <div v-for="(point, index) in newZone.coordinates" :key="index" class="coordinate-item">
                  <span>Point {{ index + 1 }}: {{ point.lat.toFixed(6) }}, {{ point.lng.toFixed(6) }}</span>
                  <button type="button" class="btn btn-sm btn-danger" @click="removeCoordinate(index)">
                    <font-awesome-icon icon="trash" />
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-secondary" @click="clearCoordinates">
                Effacer les coordonnées
              </button>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="showAddZoneModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="newZone.coordinates.length < 3">
                Ajouter la zone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Modal pour ajouter une alerte météo -->
    <div v-if="showAddWeatherAlertModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ajouter une alerte météo</h3>
          <button class="close-btn" @click="showAddWeatherAlertModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addWeatherAlert">
            <div class="form-group">
              <label for="alert-type">Type d'alerte</label>
              <select id="alert-type" v-model="newWeatherAlert.alert_type" required>
                <option value="rain">Pluie</option>
                <option value="flood">Inondation</option>
                <option value="storm">Orage</option>
                <option value="wind">Vent fort</option>
                <option value="fog">Brouillard</option>
                <option value="other">Autre</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="alert-severity">Sévérité</label>
              <select id="alert-severity" v-model="newWeatherAlert.severity" required>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="alert-commune">Commune</label>
              <select id="alert-commune" v-model="newWeatherAlert.commune" required>
                <option value="">Sélectionner une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="alert-description">Description</label>
              <textarea id="alert-description" v-model="newWeatherAlert.description" rows="3" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="alert-expires">Expire le</label>
              <input id="alert-expires" v-model="newWeatherAlert.expires_at" type="datetime-local" required>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="showAddWeatherAlertModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary">
                Ajouter l'alerte
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import ZoneMap from '@/components/maps/ZoneMap.vue';
import { getZones, addZone, deleteZone, getTrafficReports, deleteTrafficReport, getWeatherAlerts, addWeatherAlert, deleteWeatherAlert, getActiveCouriers } from '@/api/manager';
import { formatDateTime, formatSeverity } from '@/utils/formatters';

export default {
  name: 'ZonesView',
  components: {
    ZoneMap
  },
  setup() {
    const zones = ref([]);
    const trafficReports = ref([]);
    const weatherAlerts = ref([]);
    const activeCouriers = ref([]);
    const selectedZoneType = ref('all');
    const selectedCommune = ref('');
    const showAddZoneModal = ref(false);
    const showAddWeatherAlertModal = ref(false);
    const mapCenter = ref(null);
    
    const communes = ref([
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
    ]);
    
    const newZone = ref({
      name: '',
      type: 'traffic',
      commune: '',
      description: '',
      coordinates: []
    });
    
    const newWeatherAlert = ref({
      alert_type: 'rain',
      severity: 'medium',
      commune: '',
      description: '',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      source: 'manual'
    });
    
    const filteredZones = computed(() => {
      let filtered = [...zones.value];
      
      if (selectedZoneType.value !== 'all') {
        filtered = filtered.filter(zone => zone.type === selectedZoneType.value);
      }
      
      if (selectedCommune.value) {
        filtered = filtered.filter(zone => zone.commune === selectedCommune.value);
      }
      
      return filtered;
    });
    
    const loadZones = async () => {
      try {
        const data = await getZones();
        zones.value = data;
      } catch (error) {
        console.error('Erreur lors du chargement des zones:', error);
      }
    };
    
    const loadTrafficReports = async () => {
      try {
        const data = await getTrafficReports({ active_only: true });
        trafficReports.value = data;
      } catch (error) {
        console.error('Erreur lors du chargement des rapports de trafic:', error);
      }
    };
    
    const loadWeatherAlerts = async () => {
      try {
        const data = await getWeatherAlerts({ active_only: true });
        weatherAlerts.value = data;
      } catch (error) {
        console.error('Erreur lors du chargement des alertes météo:', error);
      }
    };
    
    const loadActiveCouriers = async () => {
      try {
        const data = await getActiveCouriers();
        activeCouriers.value = data;
      } catch (error) {
        console.error('Erreur lors du chargement des coursiers actifs:', error);
      }
    };
    
    const refreshZones = () => {
      loadZones();
      loadTrafficReports();
      loadWeatherAlerts();
      loadActiveCouriers();
    };
    
    const handleMapClick = (event) => {
      if (showAddZoneModal.value) {
        newZone.value.coordinates.push({
          lat: event.latlng.lat,
          lng: event.latlng.lng
        });
      }
    };
    
    const handleZoneClick = (zone) => {
      // Afficher les détails de la zone
      console.log('Zone cliquée:', zone);
    };
    
    const removeCoordinate = (index) => {
      newZone.value.coordinates.splice(index, 1);
    };
    
    const clearCoordinates = () => {
      newZone.value.coordinates = [];
    };
    
    const addZone = async () => {
      try {
        await addZone(newZone.value);
        showAddZoneModal.value = false;
        
        // Réinitialiser le formulaire
        newZone.value = {
          name: '',
          type: 'traffic',
          commune: '',
          description: '',
          coordinates: []
        };
        
        // Recharger les zones
        loadZones();
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la zone:', error);
      }
    };
    
    const deleteTrafficReport = async (reportId) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport de trafic ?')) {
        try {
          await deleteTrafficReport(reportId);
          loadTrafficReports();
        } catch (error) {
          console.error('Erreur lors de la suppression du rapport de trafic:', error);
        }
      }
    };
    
    const addWeatherAlert = async () => {
      try {
        await addWeatherAlert(newWeatherAlert.value);
        showAddWeatherAlertModal.value = false;
        
        // Réinitialiser le formulaire
        newWeatherAlert.value = {
          alert_type: 'rain',
          severity: 'medium',
          commune: '',
          description: '',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          source: 'manual'
        };
        
        // Recharger les alertes
        loadWeatherAlerts();
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'alerte météo:', error);
      }
    };
    
    const deleteWeatherAlert = async (alertId) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette alerte météo ?')) {
        try {
          await deleteWeatherAlert(alertId);
          loadWeatherAlerts();
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'alerte météo:', error);
        }
      }
    };
    
    const centerMapOn = (lat, lng) => {
      mapCenter.value = { lat, lng };
    };
    
    onMounted(() => {
      loadZones();
      loadTrafficReports();
      loadWeatherAlerts();
      loadActiveCouriers();
      
      // Rafraîchir les données toutes les 30 secondes
      const interval = setInterval(refreshZones, 30000);
      
      // Nettoyer l'intervalle lors de la destruction du composant
      return () => clearInterval(interval);
    });
    
    return {
      zones,
      trafficReports,
      weatherAlerts,
      activeCouriers,
      selectedZoneType,
      selectedCommune,
      communes,
      filteredZones,
      showAddZoneModal,
      showAddWeatherAlertModal,
      newZone,
      newWeatherAlert,
      mapCenter,
      handleMapClick,
      handleZoneClick,
      removeCoordinate,
      clearCoordinates,
      addZone,
      deleteTrafficReport,
      addWeatherAlert,
      deleteWeatherAlert,
      refreshZones,
      centerMapOn,
      formatDateTime,
      formatSeverity
    };
  }
};
</script>

<style scoped>
.zones-view {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.actions {
  display: flex;
  gap: 10px;
}

.map-container {
  height: 500px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.data-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
}

.panel-content {
  max-height: 300px;
  overflow-y: auto;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
}

.report-list, .alert-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.report-item, .alert-item {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}

.report-item.severity-high, .alert-item.severity-high {
  border-left: 4px solid #F44336;
}

.report-item.severity-medium, .alert-item.severity-medium {
  border-left: 4px solid #FF9800;
}

.report-item.severity-low, .alert-item.severity-low {
  border-left: 4px solid #4CAF50;
}

.report-header, .alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.report-severity, .alert-severity {
  font-weight: 600;
}

.report-time, .alert-expiry {
  font-size: 12px;
  color: #666;
}

.report-location, .alert-location {
  margin-bottom: 10px;
  font-weight: 500;
}

.alert-description {
  margin-bottom: 10px;
  font-size: 14px;
}

.report-actions, .alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-actions {
  margin-top: 15px;
  text-align: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}

.btn-primary:hover {
  background-color: #3a56d4;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #d0d0d0;
}

.btn-danger {
  background-color: #F44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.coordinates-list {
  margin: 10px 0;
  max-height: 150px;
  overflow-y: auto;
}

.coordinate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .filters {
    flex-direction: column;
    gap: 10px;
  }
  
  .data-panels {
    grid-template-columns: 1fr;
  }
}
</style>
