import axios from 'axios'
import { API_URL } from '@/config'

const vehiclesApi = {
  /**
   * Get all vehicles with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.status] - Filter by status
   * @param {string} [params.type] - Filter by vehicle type
   * @param {boolean} [params.isElectric] - Filter by electric status
   * @param {string} [params.search] - Search term
   * @param {number} [params.skip] - Number of items to skip
   * @param {number} [params.limit] - Number of items to return
   * @returns {Promise} - Promise with response data
   */
  getVehicles(params = {}) {
    return axios.get(`${API_URL}/vehicles`, { params })
  },

  /**
   * Get a specific vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise} - Promise with response data
   */
  getVehicle(id) {
    return axios.get(`${API_URL}/vehicles/${id}`)
  },

  /**
   * Create a new vehicle
   * @param {Object} data - Vehicle data
   * @returns {Promise} - Promise with response data
   */
  createVehicle(data) {
    return axios.post(`${API_URL}/vehicles`, data)
  },

  /**
   * Update an existing vehicle
   * @param {string} id - Vehicle ID
   * @param {Object} data - Updated vehicle data
   * @returns {Promise} - Promise with response data
   */
  updateVehicle(id, data) {
    return axios.put(`${API_URL}/vehicles/${id}`, data)
  },

  /**
   * Delete a vehicle
   * @param {string} id - Vehicle ID
   * @returns {Promise} - Promise with response data
   */
  deleteVehicle(id) {
    return axios.delete(`${API_URL}/vehicles/${id}`)
  },

  /**
   * Get all documents for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} params - Query parameters
   * @param {number} [params.skip] - Number of items to skip
   * @param {number} [params.limit] - Number of items to return
   * @returns {Promise} - Promise with response data
   */
  getVehicleDocuments(vehicleId, params = {}) {
    return axios.get(`${API_URL}/vehicles/${vehicleId}/documents`, { params })
  },

  /**
   * Create a new document for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} data - Document data
   * @returns {Promise} - Promise with response data
   */
  createVehicleDocument(vehicleId, data) {
    return axios.post(`${API_URL}/vehicles/${vehicleId}/documents`, data)
  },

  /**
   * Update an existing document
   * @param {string} vehicleId - Vehicle ID
   * @param {string} documentId - Document ID
   * @param {Object} data - Updated document data
   * @returns {Promise} - Promise with response data
   */
  updateVehicleDocument(vehicleId, documentId, data) {
    return axios.put(`${API_URL}/vehicles/${vehicleId}/documents/${documentId}`, data)
  },

  /**
   * Delete a document
   * @param {string} vehicleId - Vehicle ID
   * @param {string} documentId - Document ID
   * @returns {Promise} - Promise with response data
   */
  deleteVehicleDocument(vehicleId, documentId) {
    return axios.delete(`${API_URL}/vehicles/${vehicleId}/documents/${documentId}`)
  },

  /**
   * Get all maintenance records for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} params - Query parameters
   * @param {number} [params.skip] - Number of items to skip
   * @param {number} [params.limit] - Number of items to return
   * @returns {Promise} - Promise with response data
   */
  getMaintenanceRecords(vehicleId, params = {}) {
    return axios.get(`${API_URL}/vehicles/${vehicleId}/maintenance`, { params })
  },

  /**
   * Create a new maintenance record for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} data - Maintenance record data
   * @returns {Promise} - Promise with response data
   */
  createMaintenanceRecord(vehicleId, data) {
    return axios.post(`${API_URL}/vehicles/${vehicleId}/maintenance`, data)
  },

  /**
   * Update an existing maintenance record
   * @param {string} vehicleId - Vehicle ID
   * @param {string} recordId - Maintenance record ID
   * @param {Object} data - Updated maintenance record data
   * @returns {Promise} - Promise with response data
   */
  updateMaintenanceRecord(vehicleId, recordId, data) {
    return axios.put(`${API_URL}/vehicles/${vehicleId}/maintenance/${recordId}`, data)
  },

  /**
   * Delete a maintenance record
   * @param {string} vehicleId - Vehicle ID
   * @param {string} recordId - Maintenance record ID
   * @returns {Promise} - Promise with response data
   */
  deleteMaintenanceRecord(vehicleId, recordId) {
    return axios.delete(`${API_URL}/vehicles/${vehicleId}/maintenance/${recordId}`)
  },

  /**
   * Get vehicle statistics
   * @returns {Promise} - Promise with response data
   */
  getVehicleStats() {
    return axios.get(`${API_URL}/vehicles/stats`)
  },
}

export default vehiclesApi
