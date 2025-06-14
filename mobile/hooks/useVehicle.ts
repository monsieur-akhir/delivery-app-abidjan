// Hook pour la gestion des véhicules
import { useState, useCallback } from 'react';
import VehicleService from '../services/VehicleService';
import type { 
  Vehicle,
  CourierVehicle,
  VehicleDocument,
  MaintenanceRecord,
  TransportRule,
  VehicleType,
  VehicleStatus,
  VehicleRecommendation,
  VehicleUsageStats,
  VehiclePerformanceStats,
  VehicleEnvironmentalStats,
  VehicleRecommendationRequest,
  VehicleUsageCreateRequest,
  CourierVehicleCreateRequest
} from '../types/models';
import type { 
  VehicleCreateRequest,
  VehicleUpdateRequest,
  MaintenanceRecordCreateRequest,
  TransportRuleCreateRequest
} from '../services/VehicleService';

interface VehicleState {
  vehicles: Vehicle[];
  courierVehicles: CourierVehicle[];
  currentVehicle: Vehicle | null;
  documents: VehicleDocument[];
  maintenanceRecords: MaintenanceRecord[];
  transportRules: TransportRule[];
  recommendation: VehicleRecommendation | null;
  usageStats: VehicleUsageStats | null;
  performanceStats: VehiclePerformanceStats | null;
  environmentalStats: VehicleEnvironmentalStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseVehicleReturn {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  loading: boolean
  refreshVehicles: () => Promise<void>
  addVehicle: (data: VehicleCreateRequest) => Promise<void>
  updateVehicle: (vehicleId: number, data: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (vehicleId: number) => Promise<void>
  setSelectedVehicle: (vehicle: Vehicle | null) => void
}

export const useVehicle = (): UseVehicleReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshVehicles = async () => {
    try {
      setLoading(true)
      const data = await VehicleService.getCourierVehicles()
      setVehicles(data)
    } catch (error) {
      console.error('Error refreshing vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const addVehicle = async (data: VehicleCreateRequest) => {
    try {
      setLoading(true)
      await VehicleService.addCourierVehicle(data)
      await refreshVehicles()
    } catch (error) {
      console.error('Error adding vehicle:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateVehicle = async (vehicleId: number, data: Partial<Vehicle>) => {
    try {
      setLoading(true)
      await VehicleService.updateVehicle(vehicleId, data)
      await refreshVehicles()
    } catch (error) {
      console.error('Error updating vehicle:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteVehicle = async (vehicleId: number) => {
    try {
      setLoading(true)
      await VehicleService.deleteVehicle(vehicleId)
      await refreshVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    vehicles,
    selectedVehicle,
    loading,
    refreshVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setSelectedVehicle,
  }
}