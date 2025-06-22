
import { ref, reactive } from 'vue'
import { multiDestinationDeliveriesAPI } from '@/api/multi-destination-deliveries'

const state = reactive({
  deliveries: [],
  isLoading: false,
  error: null
})

export function useMultiDestinationDeliveries() {
  const createDelivery = async (deliveryData) => {
    state.isLoading = true
    state.error = null
    
    try {
      const response = await multiDestinationDeliveriesAPI.create(deliveryData)
      state.deliveries.unshift(response.data)
      return response.data
    } catch (error) {
      state.error = error.response?.data?.detail || 'Erreur lors de la création'
      throw error
    } finally {
      state.isLoading = false
    }
  }

  const fetchDeliveries = async (filters = {}) => {
    state.isLoading = true
    state.error = null
    
    try {
      const response = await multiDestinationDeliveriesAPI.getAll(filters)
      state.deliveries = response.data
      return response.data
    } catch (error) {
      state.error = error.response?.data?.detail || 'Erreur lors du chargement'
      throw error
    } finally {
      state.isLoading = false
    }
  }

  const updateDeliveryStatus = async (id, status) => {
    try {
      const response = await multiDestinationDeliveriesAPI.updateStatus(id, status)
      const index = state.deliveries.findIndex(d => d.id === id)
      if (index !== -1) {
        state.deliveries[index] = response.data
      }
      return response.data
    } catch (error) {
      state.error = error.response?.data?.detail || 'Erreur lors de la mise à jour'
      throw error
    }
  }

  const deleteDelivery = async (id) => {
    try {
      await multiDestinationDeliveriesAPI.delete(id)
      state.deliveries = state.deliveries.filter(d => d.id !== id)
    } catch (error) {
      state.error = error.response?.data?.detail || 'Erreur lors de la suppression'
      throw error
    }
  }

  return {
    // État
    deliveries: state.deliveries,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    createDelivery,
    fetchDeliveries,
    updateDeliveryStatus,
    deleteDelivery
  }
}
