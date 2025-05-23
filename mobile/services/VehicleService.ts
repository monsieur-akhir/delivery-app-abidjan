import api from "./api"
import type { Vehicle, VehicleDocument, MaintenanceRecord, TransportRule } from "../types/models"

class VehicleService {
  // Vehicle endpoints
  async getVehicles(params?: {
    status?: string
    type?: string
    isElectric?: boolean
    search?: string
    skip?: number
    limit?: number
  }): Promise<Vehicle[]> {
    try {
      const response = await api.get("/vehicles", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      throw error
    }
  }

  async getVehicle(id: string): Promise<Vehicle> {
    try {
      const response = await api.get(`/vehicles/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error)
      throw error
    }
  }

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await api.post("/vehicles", vehicleData)
      return response.data
    } catch (error) {
      console.error("Error creating vehicle:", error)
      throw error
    }
  }

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData)
      return response.data
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error)
      throw error
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    try {
      await api.delete(`/vehicles/${id}`)
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error)
      throw error
    }
  }

  // Vehicle Document endpoints
  async getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/documents`)
      return response.data
    } catch (error) {
      console.error(`Error fetching documents for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  async createVehicleDocument(vehicleId: string, documentData: Partial<VehicleDocument>): Promise<VehicleDocument> {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/documents`, documentData)
      return response.data
    } catch (error) {
      console.error(`Error creating document for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  async updateVehicleDocument(
    vehicleId: string,
    documentId: string,
    documentData: Partial<VehicleDocument>,
  ): Promise<VehicleDocument> {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/documents/${documentId}`, documentData)
      return response.data
    } catch (error) {
      console.error(`Error updating document ${documentId} for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  async deleteVehicleDocument(vehicleId: string, documentId: string): Promise<void> {
    try {
      await api.delete(`/vehicles/${vehicleId}/documents/${documentId}`)
    } catch (error) {
      console.error(`Error deleting document ${documentId} for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  // Maintenance Record endpoints
  async getMaintenanceRecords(vehicleId: string): Promise<MaintenanceRecord[]> {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/maintenance`)
      return response.data
    } catch (error) {
      console.error(`Error fetching maintenance records for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  async createMaintenanceRecord(vehicleId: string, recordData: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/maintenance`, recordData)
      return response.data
    } catch (error) {
      console.error(`Error creating maintenance record for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  async updateMaintenanceRecord(
    vehicleId: string,
    recordId: string,
    recordData: Partial<MaintenanceRecord>,
  ): Promise<MaintenanceRecord> {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/maintenance/${recordId}`, recordData)
      return response.data
    } catch (error) {
      console.error(`Error updating maintenance record ${recordId} for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  async deleteMaintenanceRecord(vehicleId: string, recordId: string): Promise<void> {
    try {
      await api.delete(`/vehicles/${vehicleId}/maintenance/${recordId}`)
    } catch (error) {
      console.error(`Error deleting maintenance record ${recordId} for vehicle ${vehicleId}:`, error)
      throw error
    }
  }

  // Transport Rule endpoints
  async getTransportRules(params?: {
    vehicleId?: string
    isActive?: boolean
    skip?: number
    limit?: number
  }): Promise<TransportRule[]> {
    try {
      const response = await api.get("/transport-rules", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching transport rules:", error)
      throw error
    }
  }

  async getTransportRule(id: string): Promise<TransportRule> {
    try {
      const response = await api.get(`/transport-rules/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching transport rule ${id}:`, error)
      throw error
    }
  }

  async createTransportRule(ruleData: Partial<TransportRule>): Promise<TransportRule> {
    try {
      const response = await api.post("/transport-rules", ruleData)
      return response.data
    } catch (error) {
      console.error("Error creating transport rule:", error)
      throw error
    }
  }

  async updateTransportRule(id: string, ruleData: Partial<TransportRule>): Promise<TransportRule> {
    try {
      const response = await api.put(`/transport-rules/${id}`, ruleData)
      return response.data
    } catch (error) {
      console.error(`Error updating transport rule ${id}:`, error)
      throw error
    }
  }

  async deleteTransportRule(id: string): Promise<void> {
    try {
      await api.delete(`/transport-rules/${id}`)
    } catch (error) {
      console.error(`Error deleting transport rule ${id}:`, error)
      throw error
    }
  }
}

export default new VehicleService()
