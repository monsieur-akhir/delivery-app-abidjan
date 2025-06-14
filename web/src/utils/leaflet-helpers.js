import L from 'leaflet'
import 'leaflet-draw'

/**
 * Initialise une carte Leaflet dans l'élément DOM spécifié
 * @param {string} elementId - ID de l'élément DOM où initialiser la carte
 * @param {Array} center - Coordonnées du centre de la carte [latitude, longitude]
 * @param {number} zoom - Niveau de zoom initial
 * @returns {Object} L'objet carte Leaflet
 */
export const initMap = (elementId, center = [5.36, -4.0083], zoom = 12) => {
  const map = L.map(elementId).setView(center, zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  return map
}

/**
 * Initialise une carte Leaflet avec des outils de dessin
 * @param {string} elementId - ID de l'élément DOM où initialiser la carte
 * @param {Array} center - Coordonnées du centre de la carte [latitude, longitude]
 * @param {number} zoom - Niveau de zoom initial
 * @param {Function} onDrawCreated - Fonction appelée lorsqu'un dessin est créé
 * @param {Function} onDrawEdited - Fonction appelée lorsqu'un dessin est modifié
 * @param {Function} onDrawDeleted - Fonction appelée lorsqu'un dessin est supprimé
 * @returns {Object} Un objet contenant la carte et le contrôle de dessin
 */
export const initDrawMap = (
  elementId,
  center = [5.36, -4.0083],
  zoom = 12,
  onDrawCreated = null,
  onDrawEdited = null,
  onDrawDeleted = null
) => {
  const map = initMap(elementId, center, zoom)

  // Initialiser les couches de dessin
  const drawnItems = new L.FeatureGroup()
  map.addLayer(drawnItems)

  // Initialiser les contrôles de dessin
  const drawControl = new L.Control.Draw({
    draw: {
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: {
        shapeOptions: {
          color: '#0056b3',
          weight: 2,
        },
      },
      polygon: {
        allowIntersection: false,
        drawError: {
          color: '#e1e100',
          message: "<strong>Erreur:</strong> Les polygones ne peuvent pas s'intersecter!",
        },
        shapeOptions: {
          color: '#0056b3',
          weight: 2,
        },
      },
    },
    edit: {
      featureGroup: drawnItems,
      poly: {
        allowIntersection: false,
      },
    },
  })

  map.addControl(drawControl)

  // Gérer les événements de dessin
  if (onDrawCreated) {
    map.on(L.Draw.Event.CREATED, event => {
      const layer = event.layer
      drawnItems.addLayer(layer)
      onDrawCreated(layer)
    })
  }

  if (onDrawEdited) {
    map.on(L.Draw.Event.EDITED, event => {
      const layers = event.layers
      onDrawEdited(layers)
    })
  }

  if (onDrawDeleted) {
    map.on(L.Draw.Event.DELETED, event => {
      const layers = event.layers
      onDrawDeleted(layers)
    })
  }

  return { map, drawControl, drawnItems }
}

/**
 * Crée un marqueur personnalisé pour un coursier
 * @param {Object} courier - Objet contenant les informations du coursier
 * @param {Function} onClick - Fonction appelée lorsque le marqueur est cliqué
 * @returns {Object} Le marqueur Leaflet
 */
export const createCourierMarker = (courier, onClick = null) => {
  if (!courier.latitude || !courier.longitude) return null

  // Déterminer la classe CSS en fonction de la disponibilité
  let markerClass = 'courier-marker'
  if (courier.availability === 'available') {
    markerClass += ' courier-available'
  } else if (courier.availability === 'on_delivery') {
    markerClass += ' courier-on-delivery'
  } else {
    markerClass += ' courier-unavailable'
  }

  // Créer l'icône personnalisée
  const markerIcon = L.divIcon({
    className: markerClass,
    html: `<div class="marker-content">${getInitials(courier.name)}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  })

  // Créer le marqueur
  const marker = L.marker([courier.latitude, courier.longitude], { icon: markerIcon })

  // Ajouter le popup
  marker.bindPopup(`
    <div class="marker-popup">
      <div class="popup-header">${courier.name}</div>
      <div class="popup-content">
        <div><strong>Téléphone:</strong> ${courier.phone}</div>
        <div><strong>Véhicule:</strong> ${getVehicleTypeLabel(courier.vehicle_type)}</div>
        <div><strong>Disponibilité:</strong> ${getAvailabilityLabel(courier.availability)}</div>
        <div><strong>Note:</strong> ${courier.rating.toFixed(1)} ★</div>
      </div>
      <div class="popup-actions">
        <button class="popup-btn" onclick="window.viewCourierDetails(${
          courier.id
        })">Voir détails</button>
      </div>
    </div>
  `)

  // Ajouter l'événement de clic
  if (onClick) {
    marker.on('click', () => onClick(courier))
  }

  return marker
}

/**
 * Crée un marqueur personnalisé pour une livraison
 * @param {Object} delivery - Objet contenant les informations de la livraison
 * @param {Function} onClick - Fonction appelée lorsque le marqueur est cliqué
 * @returns {Object} Le marqueur Leaflet
 */
export const createDeliveryMarker = (delivery, onClick = null) => {
  if (!delivery.latitude || !delivery.longitude) return null

  // Déterminer la classe CSS en fonction du statut
  let markerClass = 'delivery-marker'
  if (delivery.status === 'pending' || delivery.status === 'bidding') {
    markerClass += ' delivery-pending'
  } else if (
    delivery.status === 'accepted' ||
    delivery.status === 'picked_up' ||
    delivery.status === 'in_transit'
  ) {
    markerClass += ' delivery-in-progress'
  } else if (delivery.status === 'delivered' || delivery.status === 'completed') {
    markerClass += ' delivery-completed'
  } else {
    markerClass += ' delivery-cancelled'
  }

  // Créer l'icône personnalisée
  const markerIcon = L.divIcon({
    className: markerClass,
    html: `<div class="marker-content"><i class="fas fa-box"></i></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  })

  // Créer le marqueur
  const marker = L.marker([delivery.latitude, delivery.longitude], { icon: markerIcon })

  // Ajouter le popup
  marker.bindPopup(`
    <div class="marker-popup">
      <div class="popup-header">Livraison #${delivery.id}</div>
      <div class="popup-content">
        <div><strong>Client:</strong> ${delivery.client_name}</div>
        <div><strong>Adresse:</strong> ${delivery.delivery_address}</div>
        <div><strong>Statut:</strong> ${getDeliveryStatusLabel(delivery.status)}</div>
        <div><strong>Prix:</strong> ${formatCurrency(delivery.price)} FCFA</div>
      </div>
      <div class="popup-actions">
        <button class="popup-btn" onclick="window.viewDeliveryDetails(${
          delivery.id
        })">Voir détails</button>
      </div>
    </div>
  `)

  // Ajouter l'événement de clic
  if (onClick) {
    marker.on('click', () => onClick(delivery))
  }

  return marker
}

/**
 * Crée un itinéraire entre deux points
 * @param {Object} map - L'objet carte Leaflet
 * @param {Array} startPoint - Coordonnées du point de départ [latitude, longitude]
 * @param {Array} endPoint - Coordonnées du point d'arrivée [latitude, longitude]
 * @param {Object} options - Options de l'itinéraire
 * @returns {Object} L'objet polyline Leaflet
 */
export const createRoute = (map, startPoint, endPoint, options = {}) => {
  const defaultOptions = {
    color: '#0056b3',
    weight: 5,
    opacity: 0.7,
    dashArray: null,
  }

  const routeOptions = { ...defaultOptions, ...options }

  // Créer la polyline
  const route = L.polyline([startPoint, endPoint], routeOptions).addTo(map)

  // Ajuster la vue pour inclure l'itinéraire
  map.fitBounds(route.getBounds(), { padding: [50, 50] })

  return route
}

/**
 * Convertit un GeoJSON en couche Leaflet et l'ajoute à la carte
 * @param {Object} map - L'objet carte Leaflet
 * @param {Object} geojson - L'objet GeoJSON
 * @param {Object} options - Options de style pour la couche
 * @returns {Object} La couche Leaflet créée
 */
export const addGeoJsonToMap = (map, geojson, options = {}) => {
  const defaultOptions = {
    style: {
      color: '#0056b3',
      weight: 2,
      opacity: 0.7,
      fillColor: '#0056b3',
      fillOpacity: 0.2,
    },
    onEachFeature: null,
  }

  const layerOptions = { ...defaultOptions, ...options }

  // Créer la couche GeoJSON
  const layer = L.geoJSON(geojson, layerOptions).addTo(map)

  // Ajuster la vue pour inclure la couche
  map.fitBounds(layer.getBounds(), { padding: [50, 50] })

  return layer
}

/**
 * Convertit une couche Leaflet en GeoJSON
 * @param {Object} layer - La couche Leaflet
 * @returns {Object} L'objet GeoJSON
 */
export const layerToGeoJson = layer => {
  return layer.toGeoJSON()
}

/**
 * Obtient les initiales à partir d'un nom
 * @param {string} name - Le nom complet
 * @returns {string} Les initiales (max 2 caractères)
 */
export const getInitials = name => {
  if (!name) return ''

  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Obtient le libellé du type de véhicule
 * @param {string} vehicleType - Le type de véhicule
 * @returns {string} Le libellé du type de véhicule
 */
export const getVehicleTypeLabel = vehicleType => {
  const vehicleLabels = {
    motorcycle: 'Moto',
    car: 'Voiture',
    bicycle: 'Vélo',
    foot: 'À pied',
    truck: 'Camion',
  }

  return vehicleLabels[vehicleType] || vehicleType
}

/**
 * Obtient le libellé de disponibilité
 * @param {string} availability - La disponibilité
 * @returns {string} Le libellé de disponibilité
 */
export const getAvailabilityLabel = availability => {
  const availabilityLabels = {
    available: 'Disponible',
    unavailable: 'Indisponible',
    on_delivery: 'En livraison',
  }

  return availabilityLabels[availability] || availability
}

/**
 * Obtient le libellé du statut de livraison
 * @param {string} status - Le statut de livraison
 * @returns {string} Le libellé du statut de livraison
 */
export const getDeliveryStatusLabel = status => {
  const statusLabels = {
    pending: 'En attente',
    bidding: 'Enchères',
    accepted: 'Acceptée',
    picked_up: 'Récupérée',
    in_transit: 'En transit',
    delivered: 'Livrée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    failed: 'Échouée',
  }

  return statusLabels[status] || status
}

/**
 * Formate un montant en devise
 * @param {number} amount - Le montant à formater
 * @returns {string} Le montant formaté
 */
export const formatCurrency = amount => {
  return new Intl.NumberFormat('fr-FR').format(amount)
}
