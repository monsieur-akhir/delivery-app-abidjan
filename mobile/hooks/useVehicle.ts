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

interface UseVehicleReturn extends VehicleState {
  // Gestion des véhicules
  getVehicles: (params?: {
    status?: VehicleStatus;
    vehicle_type?: VehicleType;
    business_id?: number;
    is_electric?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }) => Promise<void>;
  getVehicle: (id: number) => Promise<void>;
  createVehicle: (data: VehicleCreateRequest) => Promise<Vehicle>;
  updateVehicle: (id: number, data: VehicleUpdateRequest) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
    // Gestion des véhicules coursier
  getCourierVehicles: (courierId: number) => Promise<void>;
  assignVehicleToCourier: (courierId: number, vehicleData: CourierVehicleCreateRequest) => Promise<void>;
  updateCourierVehicle: (courierVehicleId: number, data: Partial<CourierVehicleCreateRequest>) => Promise<void>;
  removeCourierVehicle: (courierVehicleId: number) => Promise<void>;
  setPrimaryVehicle: (courierVehicleId: number) => Promise<void>;
  
  // Gestion des documents
  getVehicleDocuments: (vehicleId: number) => Promise<void>;
  uploadVehicleDocument: (vehicleId: number, documentType: string, fileUri: string) => Promise<void>;
  deleteVehicleDocument: (vehicleId: number, documentId: number) => Promise<void>;
  
  // Gestion de la maintenance
  getMaintenanceRecords: (vehicleId: number) => Promise<void>;
  createMaintenanceRecord: (data: MaintenanceRecordCreateRequest) => Promise<void>;
  updateMaintenanceRecord: (recordId: number, data: Partial<MaintenanceRecordCreateRequest>) => Promise<void>;
  deleteMaintenanceRecord: (recordId: number) => Promise<void>;
  
  // Règles de transport
  getTransportRules: (params?: {
    vehicle_type?: VehicleType;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => Promise<void>;
  createTransportRule: (data: TransportRuleCreateRequest) => Promise<void>;
  updateTransportRule: (ruleId: number, data: Partial<TransportRuleCreateRequest>) => Promise<void>;
  deleteTransportRule: (ruleId: number) => Promise<void>;
  
  // Recommandations et utilisation
  getVehicleRecommendation: (request: VehicleRecommendationRequest) => Promise<void>;
  createVehicleUsage: (data: VehicleUsageCreateRequest) => Promise<void>;
  updateVehicleUsage: (usageId: number, data: Partial<VehicleUsageCreateRequest>) => Promise<void>;
  
  // Statistiques
  getUsageStats: (params?: {
    start_date?: string;
    end_date?: string;
    vehicle_type?: VehicleType;
  }) => Promise<void>;
  getPerformanceStats: (params?: {
    start_date?: string;
    end_date?: string;
    vehicle_type?: VehicleType;
  }) => Promise<void>;
  getEnvironmentalStats: (params?: {
    start_date?: string;
    end_date?: string;
    vehicle_type?: VehicleType;
  }) => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  clearCurrentVehicle: () => void;
  refreshVehicles: () => Promise<void>;
}

export const useVehicle = (): UseVehicleReturn => {
  const [state, setState] = useState<VehicleState>({
    vehicles: [],
    courierVehicles: [],
    currentVehicle: null,
    documents: [],
    maintenanceRecords: [],
    transportRules: [],
    recommendation: null,
    usageStats: null,
    performanceStats: null,
    environmentalStats: null,
    isLoading: false,
    error: null,
  });

  // Récupération des véhicules
  const getVehicles = useCallback(async (params?: {
    status?: VehicleStatus;
    vehicle_type?: VehicleType;
    business_id?: number;
    is_electric?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const vehicles = await VehicleService.getVehicles(params);
      
      setState(prev => ({
        ...prev,
        vehicles: params?.skip ? [...prev.vehicles, ...vehicles] : vehicles,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vehicles';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  // Récupération d'un véhicule spécifique
  const getVehicle = useCallback(async (id: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const vehicle = await VehicleService.getVehicle(id);
      
      setState(prev => ({
        ...prev,
        currentVehicle: vehicle,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vehicle';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  // Création d'un véhicule
  const createVehicle = useCallback(async (data: VehicleCreateRequest): Promise<Vehicle> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const vehicle = await VehicleService.createVehicle(data);
      
      setState(prev => ({
        ...prev,
        vehicles: [vehicle, ...prev.vehicles],
        currentVehicle: vehicle,
        isLoading: false,
      }));
      
      return vehicle;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  // Mise à jour d'un véhicule
  const updateVehicle = useCallback(async (id: number, data: VehicleUpdateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedVehicle = await VehicleService.updateVehicle(id, data);
      
      setState(prev => ({
        ...prev,
        vehicles: prev.vehicles.map(v => v.id === id ? updatedVehicle : v),
        currentVehicle: prev.currentVehicle?.id === id ? updatedVehicle : prev.currentVehicle,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Suppression d'un véhicule
  const deleteVehicle = useCallback(async (id: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await VehicleService.deleteVehicle(id);
      
      setState(prev => ({
        ...prev,
        vehicles: prev.vehicles.filter(v => v.id !== id),
        currentVehicle: prev.currentVehicle?.id === id ? null : prev.currentVehicle,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des véhicules coursier
  const getCourierVehicles = useCallback(async (courierId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const courierVehicles = await VehicleService.getCourierVehicles(courierId);
      
      setState(prev => ({ ...prev, courierVehicles }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courier vehicles';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);
  // Attribution d'un véhicule à un coursier
  const assignVehicleToCourier = useCallback(async (courierId: number, vehicleData: CourierVehicleCreateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const courierVehicle = await VehicleService.assignVehicleToCourier(courierId, vehicleData);
      
      setState(prev => ({
        ...prev,
        courierVehicles: [...prev.courierVehicles, courierVehicle],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign vehicle to courier';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);
  // Mise à jour d'un véhicule coursier
  const updateCourierVehicle = useCallback(async (courierVehicleId: number, data: Partial<CourierVehicleCreateRequest>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedCourierVehicle = await VehicleService.updateCourierVehicle(courierVehicleId, data);
      
      setState(prev => ({
        ...prev,
        courierVehicles: prev.courierVehicles.map(cv => 
          cv.id === courierVehicleId ? updatedCourierVehicle : cv
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update courier vehicle';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Suppression d'un véhicule coursier
  const removeCourierVehicle = useCallback(async (courierVehicleId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await VehicleService.removeCourierVehicle(courierVehicleId);
      
      setState(prev => ({
        ...prev,
        courierVehicles: prev.courierVehicles.filter(cv => cv.id !== courierVehicleId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove courier vehicle';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);
  // Définition d'un véhicule principal
  const setPrimaryVehicle = useCallback(async (courierVehicleId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await VehicleService.setPrimaryVehicle(courierVehicleId);
      
      setState(prev => ({
        ...prev,
        courierVehicles: prev.courierVehicles.map(cv => ({
          ...cv,
          is_primary: cv.id === courierVehicleId,
        })),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set primary vehicle';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des documents d'un véhicule
  const getVehicleDocuments = useCallback(async (vehicleId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const documents = await VehicleService.getVehicleDocuments(vehicleId);
      
      setState(prev => ({ ...prev, documents }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vehicle documents';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Upload d'un document véhicule
  const uploadVehicleDocument = useCallback(async (vehicleId: number, documentType: string, fileUri: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const document = await VehicleService.uploadVehicleDocument(vehicleId, documentType, fileUri);
      
      setState(prev => ({
        ...prev,
        documents: [...prev.documents, document],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload vehicle document';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Suppression d'un document véhicule
  const deleteVehicleDocument = useCallback(async (vehicleId: number, documentId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await VehicleService.deleteVehicleDocument(vehicleId, documentId);
      
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== documentId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete vehicle document';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des enregistrements de maintenance
  const getMaintenanceRecords = useCallback(async (vehicleId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const records = await VehicleService.getMaintenanceRecords(vehicleId);
      
      setState(prev => ({ ...prev, maintenanceRecords: records }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch maintenance records';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Création d'un enregistrement de maintenance
  const createMaintenanceRecord = useCallback(async (data: MaintenanceRecordCreateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const record = await VehicleService.createMaintenanceRecord(data);
      
      setState(prev => ({
        ...prev,
        maintenanceRecords: [record, ...prev.maintenanceRecords],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create maintenance record';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Mise à jour d'un enregistrement de maintenance
  const updateMaintenanceRecord = useCallback(async (recordId: number, data: Partial<MaintenanceRecordCreateRequest>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedRecord = await VehicleService.updateMaintenanceRecord(recordId, data);
      
      setState(prev => ({
        ...prev,
        maintenanceRecords: prev.maintenanceRecords.map(r => 
          r.id === recordId ? updatedRecord : r
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update maintenance record';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Suppression d'un enregistrement de maintenance
  const deleteMaintenanceRecord = useCallback(async (recordId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await VehicleService.deleteMaintenanceRecord(recordId);
      
      setState(prev => ({
        ...prev,
        maintenanceRecords: prev.maintenanceRecords.filter(r => r.id !== recordId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete maintenance record';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Récupération des règles de transport
  const getTransportRules = useCallback(async (params?: {
    vehicle_type?: VehicleType;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const rules = await VehicleService.getTransportRules(params);
      
      setState(prev => ({ ...prev, transportRules: rules }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transport rules';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Création d'une règle de transport
  const createTransportRule = useCallback(async (data: TransportRuleCreateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const rule = await VehicleService.createTransportRule(data);
      
      setState(prev => ({
        ...prev,
        transportRules: [rule, ...prev.transportRules],
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transport rule';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Mise à jour d'une règle de transport
  const updateTransportRule = useCallback(async (ruleId: number, data: Partial<TransportRuleCreateRequest>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const updatedRule = await VehicleService.updateTransportRule(ruleId, data);
      
      setState(prev => ({
        ...prev,
        transportRules: prev.transportRules.map(r => 
          r.id === ruleId ? updatedRule : r
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transport rule';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Suppression d'une règle de transport
  const deleteTransportRule = useCallback(async (ruleId: number) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      await VehicleService.deleteTransportRule(ruleId);
      
      setState(prev => ({
        ...prev,
        transportRules: prev.transportRules.filter(r => r.id !== ruleId),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete transport rule';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Obtention de recommandations de véhicules
  const getVehicleRecommendation = useCallback(async (request: VehicleRecommendationRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const recommendation = await VehicleService.getVehicleRecommendation(request);
      
      setState(prev => ({ ...prev, recommendation }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get vehicle recommendation';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Création d'un enregistrement d'utilisation
  const createVehicleUsage = useCallback(async (data: VehicleUsageCreateRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await VehicleService.createVehicleUsage(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle usage';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Mise à jour d'un enregistrement d'utilisation
  const updateVehicleUsage = useCallback(async (usageId: number, data: Partial<VehicleUsageCreateRequest>) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await VehicleService.updateVehicleUsage(usageId, data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vehicle usage';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Statistiques d'utilisation
  const getUsageStats = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    vehicle_type?: VehicleType;
  }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stats = await VehicleService.getVehicleUsageStats(params);
      
      setState(prev => ({ ...prev, usageStats: stats }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch usage stats';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Statistiques de performance
  const getPerformanceStats = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    vehicle_type?: VehicleType;
  }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stats = await VehicleService.getVehiclePerformanceStats(params);
      
      setState(prev => ({ ...prev, performanceStats: stats }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch performance stats';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Statistiques environnementales
  const getEnvironmentalStats = useCallback(async (params?: {
    start_date?: string;
    end_date?: string;
    vehicle_type?: VehicleType;
  }) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stats = await VehicleService.getVehicleEnvironmentalStats(params);
      
      setState(prev => ({ ...prev, environmentalStats: stats }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch environmental stats';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Actualisation des véhicules
  const refreshVehicles = useCallback(async () => {
    await getVehicles();
  }, [getVehicles]);

  // Effacement des erreurs
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Effacement du véhicule actuel
  const clearCurrentVehicle = useCallback(() => {
    setState(prev => ({ ...prev, currentVehicle: null }));
  }, []);

  return {
    ...state,
    getVehicles,
    getVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getCourierVehicles,
    assignVehicleToCourier,
    updateCourierVehicle,
    removeCourierVehicle,
    setPrimaryVehicle,
    getVehicleDocuments,
    uploadVehicleDocument,
    deleteVehicleDocument,
    getMaintenanceRecords,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    getTransportRules,
    createTransportRule,
    updateTransportRule,
    deleteTransportRule,
    getVehicleRecommendation,
    createVehicleUsage,
    updateVehicleUsage,
    getUsageStats,
    getPerformanceStats,
    getEnvironmentalStats,
    clearError,
    clearCurrentVehicle,
    refreshVehicles,
  };
};

export default useVehicle;
