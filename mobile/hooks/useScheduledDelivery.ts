
import { useState, useCallback } from 'react';
import ScheduledDeliveryService, {
  ScheduledDelivery,
  ScheduledDeliveryCreate,
  ScheduledDeliveryUpdate,
  CalendarEvent,
  ScheduledDeliveryStats
} from '../services/ScheduledDeliveryService';

interface UseScheduledDeliveryReturn {
  // État
  schedules: ScheduledDelivery[];
  currentSchedule: ScheduledDelivery | null;
  calendarEvents: CalendarEvent[];
  stats: ScheduledDeliveryStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions de base
  createScheduledDelivery: (data: ScheduledDeliveryCreate) => Promise<ScheduledDelivery>;
  updateScheduledDelivery: (id: number, data: ScheduledDeliveryUpdate) => Promise<ScheduledDelivery>;
  deleteScheduledDelivery: (id: number) => Promise<void>;

  // Récupération de données
  getScheduledDeliveries: (status?: string, skip?: number, limit?: number) => Promise<void>;
  getScheduledDelivery: (id: number) => Promise<ScheduledDelivery>;
  getCalendarEvents: (startDate: string, endDate: string) => Promise<void>;
  getStats: () => Promise<void>;

  // Actions de contrôle
  pauseScheduledDelivery: (id: number) => Promise<ScheduledDelivery>;
  resumeScheduledDelivery: (id: number) => Promise<ScheduledDelivery>;
  executeScheduledDelivery: (id: number) => Promise<{ delivery_id: number; message: string }>;

  // Actions groupées
  bulkCreateScheduledDeliveries: (data: any) => Promise<any>;
  sendScheduledNotifications: () => Promise<void>;
  autoExecuteScheduledDeliveries: () => Promise<void>;
}

interface ScheduledDeliveryState {
  schedules: ScheduledDelivery[];
  currentSchedule: ScheduledDelivery | null;
  calendarEvents: CalendarEvent[];
  stats: ScheduledDeliveryStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ScheduledDeliveryState = {
  schedules: [],
  currentSchedule: null,
  calendarEvents: [],
  stats: null,
  isLoading: false,
  error: null,
};

export const useScheduledDelivery = (): UseScheduledDeliveryReturn => {
  const [state, setState] = useState<ScheduledDeliveryState>(initialState);

  // Helper pour gérer les erreurs
  const handleError = useCallback((error: any, defaultMessage: string) => {
    const errorMessage = error?.message || defaultMessage;
    setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    throw new Error(errorMessage);
  }, []);

  // Actions de base
  const createScheduledDelivery = useCallback(async (data: ScheduledDeliveryCreate): Promise<ScheduledDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const schedule = await ScheduledDeliveryService.createScheduledDelivery(data);
      setState(prev => ({
        ...prev,
        schedules: [...prev.schedules, schedule],
        isLoading: false,
      }));
      return schedule;
    } catch (error) {
      return handleError(error, 'Erreur lors de la création de la planification');
    }
  }, [handleError]);

  const updateScheduledDelivery = useCallback(async (
    id: number,
    data: ScheduledDeliveryUpdate
  ): Promise<ScheduledDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.updateScheduledDelivery(id, data);
      const updatedSchedule = response.schedule;
      
      setState(prev => ({
        ...prev,
        schedules: prev.schedules.map(s => s.id === id ? updatedSchedule : s),
        currentSchedule: prev.currentSchedule?.id === id ? updatedSchedule : prev.currentSchedule,
        isLoading: false,
      }));
      return updatedSchedule;
    } catch (error) {
      return handleError(error, 'Erreur lors de la mise à jour de la planification');
    }
  }, [handleError]);

  const deleteScheduledDelivery = useCallback(async (id: number): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await ScheduledDeliveryService.deleteScheduledDelivery(id);
      setState(prev => ({
        ...prev,
        schedules: prev.schedules.filter(s => s.id !== id),
        currentSchedule: prev.currentSchedule?.id === id ? null : prev.currentSchedule,
        isLoading: false,
      }));
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression de la planification');
    }
  }, [handleError]);

  // Récupération de données
  const getScheduledDeliveries = useCallback(async (
    status?: string,
    skip: number = 0,
    limit: number = 20
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.getScheduledDeliveries(status, skip, limit);
      setState(prev => ({
        ...prev,
        schedules: response.schedules,
        isLoading: false,
      }));
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération des planifications');
    }
  }, [handleError]);

  const getScheduledDelivery = useCallback(async (id: number): Promise<ScheduledDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.getScheduledDelivery(id);
      setState(prev => ({
        ...prev,
        currentSchedule: response.schedule,
        isLoading: false,
      }));
      return response.schedule;
    } catch (error) {
      return handleError(error, 'Erreur lors de la récupération de la planification');
    }
  }, [handleError]);

  const getCalendarEvents = useCallback(async (startDate: string, endDate: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.getCalendarEvents(startDate, endDate);
      setState(prev => ({
        ...prev,
        calendarEvents: response.events,
        isLoading: false,
      }));
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération des événements du calendrier');
    }
  }, [handleError]);

  const getStats = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.getScheduledDeliveryStats();
      setState(prev => ({
        ...prev,
        stats: response.stats,
        isLoading: false,
      }));
    } catch (error) {
      handleError(error, 'Erreur lors de la récupération des statistiques');
    }
  }, [handleError]);

  // Actions de contrôle
  const pauseScheduledDelivery = useCallback(async (id: number): Promise<ScheduledDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.pauseScheduledDelivery(id);
      const updatedSchedule = response.schedule;
      
      setState(prev => ({
        ...prev,
        schedules: prev.schedules.map(s => s.id === id ? updatedSchedule : s),
        currentSchedule: prev.currentSchedule?.id === id ? updatedSchedule : prev.currentSchedule,
        isLoading: false,
      }));
      return updatedSchedule;
    } catch (error) {
      return handleError(error, 'Erreur lors de la mise en pause de la planification');
    }
  }, [handleError]);

  const resumeScheduledDelivery = useCallback(async (id: number): Promise<ScheduledDelivery> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.resumeScheduledDelivery(id);
      const updatedSchedule = response.schedule;
      
      setState(prev => ({
        ...prev,
        schedules: prev.schedules.map(s => s.id === id ? updatedSchedule : s),
        currentSchedule: prev.currentSchedule?.id === id ? updatedSchedule : prev.currentSchedule,
        isLoading: false,
      }));
      return updatedSchedule;
    } catch (error) {
      return handleError(error, 'Erreur lors de la reprise de la planification');
    }
  }, [handleError]);

  const executeScheduledDelivery = useCallback(async (
    id: number
  ): Promise<{ delivery_id: number; message: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.executeScheduledDelivery(id);
      setState(prev => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      return handleError(error, 'Erreur lors de l\'exécution de la planification');
    }
  }, [handleError]);

  // Actions groupées
  const bulkCreateScheduledDeliveries = useCallback(async (data: any): Promise<any> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ScheduledDeliveryService.bulkCreateScheduledDeliveries(data);
      setState(prev => ({
        ...prev,
        schedules: [...prev.schedules, ...response.schedules],
        isLoading: false,
      }));
      return response;
    } catch (error) {
      return handleError(error, 'Erreur lors de la création en lot des planifications');
    }
  }, [handleError]);

  const sendScheduledNotifications = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await ScheduledDeliveryService.sendScheduledNotifications();
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      handleError(error, 'Erreur lors de l\'envoi des notifications planifiées');
    }
  }, [handleError]);

  const autoExecuteScheduledDeliveries = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await ScheduledDeliveryService.autoExecuteScheduledDeliveries();
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      handleError(error, 'Erreur lors de l\'auto-exécution des planifications');
    }
  }, [handleError]);

  return {
    // État
    schedules: state.schedules,
    currentSchedule: state.currentSchedule,
    calendarEvents: state.calendarEvents,
    stats: state.stats,
    isLoading: state.isLoading,
    error: state.error,

    // Actions de base
    createScheduledDelivery,
    updateScheduledDelivery,
    deleteScheduledDelivery,

    // Récupération de données
    getScheduledDeliveries,
    getScheduledDelivery,
    getCalendarEvents,
    getStats,

    // Actions de contrôle
    pauseScheduledDelivery,
    resumeScheduledDelivery,
    executeScheduledDelivery,

    // Actions groupées
    bulkCreateScheduledDeliveries,
    sendScheduledNotifications,
    autoExecuteScheduledDeliveries,
  };
};

export default useScheduledDelivery;
