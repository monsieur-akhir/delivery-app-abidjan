import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApiUrl } from '../config/environment'
import type { 
  Vehicle, 
  VehicleDocument, 
  MaintenanceRecord, 
  TransportRule, 
  VehicleType,
  VehicleStatus,
  CourierVehicle,
  CourierVehicleCreateRequest,
  VehicleRecommendationRequest,
  VehicleUsageCreateRequest,
  VehicleRecommendation,
  VehicleUsage,
  VehicleUsageStats,
  VehiclePerformanceStats,
  VehicleEnvironmentalStats
} from "../types/models"

// Types pour les requêtes de transport spécifiques au service
export interface VehicleCreateRequest {
  brand: string
  model: string
  year: number
  license_plate: string
  vehicle_type: VehicleType
  color?: string
  is_electric?: boolean
  max_load_weight?: number
  max_load_volume?: number
  fuel_type?: string
  mileage?: number
  status?: VehicleStatus
  business_id?: number
}

export interface VehicleUpdateRequest {
  brand?: string
  model?: string
  year?: number
  license_plate?: string
  color?: string
  is_electric?: boolean
  max_load_weight?: number
  max_load_volume?: number
  fuel_type?: string
  mileage?: number
  status?: VehicleStatus
}

export interface MaintenanceRecordCreateRequest {
  vehicle_id: number
  maintenance_type: string
  description: string
  cost: number
  maintenance_date: string
  next_maintenance_date?: string
  mechanic_name?: string
  mechanic_contact?: string
  notes?: string
}

export interface TransportRuleCreateRequest {
  name: string
  description: string
  vehicle_type?: VehicleType
  max_weight?: number
  max_volume?: number
  min_experience_months?: number
  required_documents?: string[]
  restricted_areas?: string[]
  time_restrictions?: Record<string, string>
  is_active?: boolean
}

class VehicleService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiUrl()}`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  // === GESTION DES VÉHICULES ===

  /**
   * Récupération de la liste des véhicules
   */
  async getVehicles(params?: {
    status?: VehicleStatus
    vehicle_type?: VehicleType
    business_id?: number
    is_electric?: boolean
    search?: string
    skip?: number
    limit?: number
  }): Promise<Vehicle[]> {
    try {
      const response = await this.api.get("/transport/vehicles", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération d'un véhicule par ID
   */
  async getVehicle(vehicleId: number): Promise<Vehicle> {
    try {
      const response = await this.api.get(`/transport/vehicles/${vehicleId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Création d'un nouveau véhicule
   */
  async createVehicle(vehicleData: VehicleCreateRequest): Promise<Vehicle> {
    try {
      const response = await this.api.post("/transport/vehicles", vehicleData)
      return response.data
    } catch (error) {
      console.error("Error creating vehicle:", error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour d'un véhicule
   */
  async updateVehicle(vehicleId: number, vehicleData: VehicleUpdateRequest): Promise<Vehicle> {
    try {
      const response = await this.api.put(`/transport/vehicles/${vehicleId}`, vehicleData)
      return response.data
    } catch (error) {
      console.error(`Error updating vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'un véhicule
   */
  async deleteVehicle(vehicleId: number): Promise<void> {
    try {
      await this.api.delete(`/transport/vehicles/${vehicleId}`)
    } catch (error) {
      console.error(`Error deleting vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  // === GESTION DES VÉHICULES COURSIER ===

  /**
   * Récupération des véhicules d'un coursier
   */
  async getCourierVehicles(courierId: number): Promise<CourierVehicle[]> {
    try {
      const response = await this.api.get(`/transport/courier/${courierId}/vehicles`)
      return response.data
    } catch (error) {
      console.error(`Error fetching courier vehicles for ${courierId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Attribution d'un véhicule à un coursier
   */
  async assignVehicleToCourier(courierId: number, vehicleData: CourierVehicleCreateRequest): Promise<CourierVehicle> {
    try {
      const response = await this.api.post(`/transport/courier/${courierId}/vehicles`, vehicleData)
      return response.data
    } catch (error) {
      console.error(`Error assigning vehicle to courier ${courierId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour d'un véhicule coursier
   */
  async updateCourierVehicle(courierVehicleId: number, vehicleData: Partial<CourierVehicleCreateRequest>): Promise<CourierVehicle> {
    try {
      const response = await this.api.put(`/transport/courier/vehicles/${courierVehicleId}`, vehicleData)
      return response.data
    } catch (error) {
      console.error(`Error updating courier vehicle ${courierVehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'un véhicule coursier
   */
  async removeCourierVehicle(courierVehicleId: number): Promise<void> {
    try {
      await this.api.delete(`/transport/courier/vehicles/${courierVehicleId}`)
    } catch (error) {
      console.error(`Error removing courier vehicle ${courierVehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Définition d'un véhicule principal pour un coursier
   */
  async setPrimaryVehicle(courierVehicleId: number): Promise<CourierVehicle> {
    try {
      const response = await this.api.put(`/transport/courier/vehicles/${courierVehicleId}/primary`)
      return response.data
    } catch (error) {
      console.error(`Error setting primary vehicle ${courierVehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  // === GESTION DES DOCUMENTS VÉHICULE ===

  /**
   * Récupération des documents d'un véhicule
   */
  async getVehicleDocuments(vehicleId: number): Promise<VehicleDocument[]> {
    try {
      const response = await this.api.get(`/transport/vehicles/${vehicleId}/documents`)
      return response.data
    } catch (error) {
      console.error(`Error fetching documents for vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Upload d'un document pour un véhicule
   */
  async uploadVehicleDocument(vehicleId: number, documentType: string, fileUri: string): Promise<VehicleDocument> {
    try {
      const formData = new FormData()
      const filename = fileUri.split('/').pop()
      const match = /\.(\w+)$/.exec(filename || '')
      const type = match ? `image/${match[1]}` : 'image'

      // Pour React Native, FormData accepte un objet avec ces propriétés
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type,
      } as unknown as Blob)
      formData.append('document_type', documentType)

      const response = await this.api.post(`/transport/vehicles/${vehicleId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error(`Error uploading document for vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'un document de véhicule
   */
  async deleteVehicleDocument(vehicleId: number, documentId: number): Promise<void> {
    try {
      await this.api.delete(`/transport/vehicles/${vehicleId}/documents/${documentId}`)
    } catch (error) {
      console.error(`Error deleting document ${documentId} for vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  // === GESTION DE LA MAINTENANCE ===

  /**
   * Récupération des enregistrements de maintenance d'un véhicule
   */
  async getMaintenanceRecords(vehicleId: number): Promise<MaintenanceRecord[]> {
    try {
      const response = await this.api.get(`/transport/vehicles/${vehicleId}/maintenance`)
      return response.data
    } catch (error) {
      console.error(`Error fetching maintenance records for vehicle ${vehicleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Création d'un enregistrement de maintenance
   */
  async createMaintenanceRecord(maintenanceData: MaintenanceRecordCreateRequest): Promise<MaintenanceRecord> {
    try {
      const response = await this.api.post('/transport/maintenance', maintenanceData)
      return response.data
    } catch (error) {
      console.error('Error creating maintenance record:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour d'un enregistrement de maintenance
   */
  async updateMaintenanceRecord(recordId: number, maintenanceData: Partial<MaintenanceRecordCreateRequest>): Promise<MaintenanceRecord> {
    try {
      const response = await this.api.put(`/transport/maintenance/${recordId}`, maintenanceData)
      return response.data
    } catch (error) {
      console.error(`Error updating maintenance record ${recordId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'un enregistrement de maintenance
   */
  async deleteMaintenanceRecord(recordId: number): Promise<void> {
    try {
      await this.api.delete(`/transport/maintenance/${recordId}`)
    } catch (error) {
      console.error(`Error deleting maintenance record ${recordId}:`, error)
      throw this.handleError(error)
    }
  }

  // === RÈGLES DE TRANSPORT ===

  /**
   * Récupération des règles de transport
   */
  async getTransportRules(params?: {
    vehicle_type?: VehicleType
    is_active?: boolean
    skip?: number
    limit?: number
  }): Promise<TransportRule[]> {
    try {
      const response = await this.api.get('/transport/rules', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching transport rules:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération d'une règle de transport par ID
   */
  async getTransportRule(ruleId: number): Promise<TransportRule> {
    try {
      const response = await this.api.get(`/transport/rules/${ruleId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching transport rule ${ruleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Création d'une règle de transport
   */
  async createTransportRule(ruleData: TransportRuleCreateRequest): Promise<TransportRule> {
    try {
      const response = await this.api.post('/transport/rules', ruleData)
      return response.data
    } catch (error) {
      console.error('Error creating transport rule:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour d'une règle de transport
   */
  async updateTransportRule(ruleId: number, ruleData: Partial<TransportRuleCreateRequest>): Promise<TransportRule> {
    try {
      const response = await this.api.put(`/transport/rules/${ruleId}`, ruleData)
      return response.data
    } catch (error) {
      console.error(`Error updating transport rule ${ruleId}:`, error)
      throw this.handleError(error)
    }
  }

  /**
   * Suppression d'une règle de transport
   */
  async deleteTransportRule(ruleId: number): Promise<void> {
    try {
      await this.api.delete(`/transport/rules/${ruleId}`)
    } catch (error) {
      console.error(`Error deleting transport rule ${ruleId}:`, error)
      throw this.handleError(error)
    }
  }

  // === RECOMMANDATIONS DE VÉHICULES ===

  /**
   * Obtention de recommandations de véhicules
   */
  async getVehicleRecommendation(request: VehicleRecommendationRequest): Promise<VehicleRecommendation> {
    try {
      const response = await this.api.post('/transport/recommend', request)
      return response.data
    } catch (error) {
      console.error('Error getting vehicle recommendation:', error)
      throw this.handleError(error)
    }
  }

  // === UTILISATION DES VÉHICULES ===

  /**
   * Création d'un enregistrement d'utilisation de véhicule
   */
  async createVehicleUsage(usageData: VehicleUsageCreateRequest): Promise<VehicleUsage> {
    try {
      const response = await this.api.post('/transport/usage', usageData)
      return response.data
    } catch (error) {
      console.error('Error creating vehicle usage:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Mise à jour d'un enregistrement d'utilisation de véhicule
   */
  async updateVehicleUsage(usageId: number, usageData: Partial<VehicleUsageCreateRequest>): Promise<VehicleUsage> {
    try {
      const response = await this.api.put(`/transport/usage/${usageId}`, usageData)
      return response.data
    } catch (error) {
      console.error(`Error updating vehicle usage ${usageId}:`, error)
      throw this.handleError(error)
    }
  }

  // === STATISTIQUES ===

  /**
   * Récupération des statistiques d'utilisation des véhicules
   */
  async getVehicleUsageStats(params?: {
    start_date?: string
    end_date?: string
    vehicle_type?: VehicleType
  }): Promise<VehicleUsageStats> {
    try {
      const response = await this.api.get('/transport/stats/usage', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching vehicle usage stats:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des statistiques de performance des véhicules
   */
  async getVehiclePerformanceStats(params?: {
    start_date?: string
    end_date?: string
    vehicle_type?: VehicleType
  }): Promise<VehiclePerformanceStats> {
    try {
      const response = await this.api.get('/transport/stats/performance', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching vehicle performance stats:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des statistiques environnementales des véhicules
   */
  async getVehicleEnvironmentalStats(params?: {
    start_date?: string
    end_date?: string
    vehicle_type?: VehicleType
  }): Promise<VehicleEnvironmentalStats> {
    try {
      const response = await this.api.get('/transport/stats/environmental', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching vehicle environmental stats:', error)
      throw this.handleError(error)
    }
  }

  // === TYPES ET CATÉGORIES ===

  /**
   * Récupération des types de véhicules disponibles
   */
  async getVehicleTypes(): Promise<VehicleType[]> {
    try {
      const response = await this.api.get('/transport/vehicle-types')
      return response.data
    } catch (error) {
      console.error('Error fetching vehicle types:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Récupération des catégories de cargo
   */
  async getCargoCategories(): Promise<string[]> {
    try {
      const response = await this.api.get('/transport/cargo-categories')
      return response.data
    } catch (error) {
      console.error('Error fetching cargo categories:', error)
      throw this.handleError(error)
    }
  }

  // === MÉTHODES UTILITAIRES ===

  /**
   * Gestion des erreurs
   */
  private handleError(error: unknown): Error {
    let message = 'Une erreur est survenue'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { detail?: string; message?: string } } }
      if (axiosError.response?.data?.detail) {
        message = axiosError.response.data.detail
      } else if (axiosError.response?.data?.message) {
        message = axiosError.response.data.message
      }
    } else if (error instanceof Error && error.message) {
      message = error.message
    }

    return new Error(message)
  }
}

export default new VehicleService()