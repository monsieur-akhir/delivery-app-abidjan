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
  isLoading: boolean
  error: string | null
  refreshVehicles: () => Promise<void>
  addVehicle: (data: any) => Promise<void>
  updateVehicle: (vehicleId: number, data: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (vehicleId: number) => Promise<void>
  setSelectedVehicle: (vehicle: Vehicle | null) => void
}

export const useVehicle = (): UseVehicleReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshVehicles = async (courierId?: number) => {
    try {
      setLoading(true)
      // Get courier ID from auth context or use parameter
      const id = courierId || 1 // Default fallback - should be from auth context
      const courierVehicles = await VehicleService.getCourierVehicles(id)

      // Convert CourierVehicle[] to Vehicle[]
      const vehicles: Vehicle[] = courierVehicles.map(cv => ({
        id: cv.vehicle.id,
        user_id: cv.courier_id,
        type: cv.vehicle.type,
        license_plate: cv.vehicle.license_plate,
        is_available: cv.vehicle.is_available || false,
        brand: cv.vehicle.brand || '',
        model: cv.vehicle.model || '',
        year: cv.vehicle.year || new Date().getFullYear(),
        color: cv.vehicle.color || '',
        capacity: cv.vehicle.capacity || 0,
        status: cv.vehicle.status,
        created_at: cv.vehicle.created_at,
        updated_at: cv.vehicle.updated_at
      }))

      setVehicles(vehicles)
    } catch (error) {
      console.error('Error refreshing vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const addVehicle = async (vehicleData: any) => {
    try {
      setLoading(true)
      await VehicleService.createVehicle(vehicleData)
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
      // Convert Vehicle data to VehicleUpdateRequest format
      const updateData: any = { ...data }
      if (data.status && typeof data.status === 'string') {
        updateData.status = data.status as any
      }
      await VehicleService.updateVehicle(vehicleId, updateData)
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
    isLoading: loading,
    error,
    refreshVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setSelectedVehicle,
  }
}