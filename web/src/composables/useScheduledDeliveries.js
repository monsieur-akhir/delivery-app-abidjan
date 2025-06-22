
import { ref, computed } from 'vue'
import scheduledDeliveryService from '../api/scheduled-deliveries'
import { useToast } from './useToast'

export function useScheduledDeliveries() {
  const { toast } = useToast()
  
  const schedules = ref([])
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Charger les planifications
  const loadSchedules = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await scheduledDeliveryService.getScheduledDeliveries(filters)
      
      if (response.success) {
        schedules.value = response.schedules || []
        return response
      } else {
        schedules.value = []
        throw new Error('Erreur lors du chargement')
      }
    } catch (err) {
      error.value = err.message
      schedules.value = []
      toast.error(`Erreur lors du chargement: ${err.message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await scheduledDeliveryService.getScheduledDeliveryStats()
      if (response.success) {
        stats.value = response.stats
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err)
    }
  }

  // Créer une planification
  const createSchedule = async (data) => {
    loading.value = true
    error.value = null
    
    try {
      // Validation
      const errors = scheduledDeliveryService.validateScheduleData(data)
      if (errors.length > 0) {
        throw new Error(errors.join('\n'))
      }

      const apiData = scheduledDeliveryService.formatScheduleDataForAPI(data)
      const response = await scheduledDeliveryService.createScheduledDelivery(apiData)
      
      if (response) {
        toast.success('Planification créée avec succès')
        return response
      }
    } catch (err) {
      error.value = err.message
      toast.error(`Erreur lors de la création: ${err.message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mettre à jour une planification
  const updateSchedule = async (scheduleId, data) => {
    loading.value = true
    error.value = null
    
    try {
      const errors = scheduledDeliveryService.validateScheduleData(data)
      if (errors.length > 0) {
        throw new Error(errors.join('\n'))
      }

      const apiData = scheduledDeliveryService.formatScheduleDataForAPI(data)
      const response = await scheduledDeliveryService.updateScheduledDelivery(scheduleId, apiData)
      
      if (response.success) {
        toast.success('Planification mise à jour avec succès')
        return response
      }
    } catch (err) {
      error.value = err.message
      toast.error(`Erreur lors de la mise à jour: ${err.message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Supprimer une planification
  const deleteSchedule = async (scheduleId) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await scheduledDeliveryService.deleteScheduledDelivery(scheduleId)
      
      if (response.success) {
        toast.success('Planification supprimée avec succès')
        // Retirer de la liste locale
        schedules.value = schedules.value.filter(s => s.id !== scheduleId)
        return response
      }
    } catch (err) {
      error.value = err.message
      toast.error(`Erreur lors de la suppression: ${err.message}`)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mettre en pause
  const pauseSchedule = async (scheduleId) => {
    try {
      const response = await scheduledDeliveryService.pauseScheduledDelivery(scheduleId)
      
      if (response.success) {
        toast.success('Planification mise en pause')
        // Mettre à jour localement
        const schedule = schedules.value.find(s => s.id === scheduleId)
        if (schedule) {
          schedule.status = 'paused'
        }
        return response
      }
    } catch (err) {
      toast.error(`Erreur lors de la mise en pause: ${err.message}`)
      throw err
    }
  }

  // Reprendre
  const resumeSchedule = async (scheduleId) => {
    try {
      const response = await scheduledDeliveryService.resumeScheduledDelivery(scheduleId)
      
      if (response.success) {
        toast.success('Planification reprise')
        // Mettre à jour localement
        const schedule = schedules.value.find(s => s.id === scheduleId)
        if (schedule) {
          schedule.status = 'active'
        }
        return response
      }
    } catch (err) {
      toast.error(`Erreur lors de la reprise: ${err.message}`)
      throw err
    }
  }

  // Exécuter maintenant
  const executeSchedule = async (scheduleId) => {
    try {
      const response = await scheduledDeliveryService.executeScheduledDelivery(scheduleId)
      
      if (response.success) {
        toast.success(`Livraison créée avec succès (ID: ${response.delivery_id})`)
        // Mettre à jour le nombre d'exécutions
        const schedule = schedules.value.find(s => s.id === scheduleId)
        if (schedule) {
          schedule.total_executions = (schedule.total_executions || 0) + 1
          schedule.last_executed_at = new Date().toISOString()
        }
        return response
      }
    } catch (err) {
      toast.error(`Erreur lors de l'exécution: ${err.message}`)
      throw err
    }
  }

  // Statistiques calculées
  const computedStats = computed(() => {
    if (!stats.value) return null
    
    return {
      ...stats.value,
      successRateFormatted: `${(stats.value.success_rate || 0).toFixed(1)}%`,
      averageExecutionsPerSchedule: stats.value.total_scheduled > 0 
        ? (stats.value.total_executions_this_month / stats.value.total_scheduled).toFixed(1)
        : '0'
    }
  })

  // Grouper les planifications par statut
  const schedulesByStatus = computed(() => {
    return schedules.value.reduce((acc, schedule) => {
      const status = schedule.status || 'unknown'
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(schedule)
      return acc
    }, {})
  })

  // Planifications actives uniquement
  const activeSchedules = computed(() => {
    return schedules.value.filter(s => s.status === 'active')
  })

  // Prochaines exécutions (dans les 7 prochains jours)
  const upcomingExecutions = computed(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return schedules.value
      .filter(s => s.next_execution_at && s.status === 'active')
      .filter(s => {
        const execDate = new Date(s.next_execution_at)
        return execDate >= now && execDate <= nextWeek
      })
      .sort((a, b) => new Date(a.next_execution_at) - new Date(b.next_execution_at))
  })

  return {
    // État
    schedules,
    stats,
    loading,
    error,
    
    // Actions
    loadSchedules,
    loadStats,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    pauseSchedule,
    resumeSchedule,
    executeSchedule,
    
    // Computed
    computedStats,
    schedulesByStatus,
    activeSchedules,
    upcomingExecutions
  }
}
