
<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container">
      <div class="modal-header">
        <h2>
          <i class="fas fa-route"></i>
          Nouvelle Livraison Multi-Destinataires
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="createDelivery">
          <!-- Étapes de progression -->
          <div class="progress-steps">
            <div 
              v-for="(step, index) in steps" 
              :key="index"
              :class="['step', { active: currentStep === index, completed: currentStep > index }]"
            >
              <div class="step-number">
                <i v-if="currentStep > index" class="fas fa-check"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          </div>

          <!-- Étape 1: Informations de ramassage -->
          <div v-if="currentStep === 0" class="step-content">
            <h3>Informations de Ramassage</h3>
            
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="pickup_address">Adresse de Ramassage *</label>
                <input
                  id="pickup_address"
                  v-model="form.pickup_address"
                  type="text"
                  placeholder="Entrez l'adresse complète"
                  required
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="pickup_commune">Commune *</label>
                <select 
                  id="pickup_commune"
                  v-model="form.pickup_commune" 
                  required
                  class="form-control"
                >
                  <option value="">Sélectionner une commune</option>
                  <option v-for="commune in communes" :key="commune" :value="commune">
                    {{ commune }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="pickup_contact_name">Contact de Ramassage</label>
                <input
                  id="pickup_contact_name"
                  v-model="form.pickup_contact_name"
                  type="text"
                  placeholder="Nom du contact"
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="pickup_contact_phone">Téléphone du Contact</label>
                <input
                  id="pickup_contact_phone"
                  v-model="form.pickup_contact_phone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  class="form-control"
                >
              </div>

              <div class="form-group full-width">
                <label for="pickup_instructions">Instructions de Ramassage</label>
                <textarea
                  id="pickup_instructions"
                  v-model="form.pickup_instructions"
                  rows="3"
                  placeholder="Instructions spéciales pour le ramassage..."
                  class="form-control"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Étape 2: Destinations -->
          <div v-if="currentStep === 1" class="step-content">
            <div class="destinations-header">
              <h3>Destinations ({{ form.destinations.length }})</h3>
              <button 
                type="button" 
                @click="addDestination"
                class="btn btn-secondary"
                :disabled="form.destinations.length >= 10"
              >
                <i class="fas fa-plus"></i>
                Ajouter une Destination
              </button>
            </div>

            <div class="destinations-list">
              <div 
                v-for="(destination, index) in form.destinations" 
                :key="index"
                class="destination-card"
              >
                <div class="destination-header">
                  <div class="destination-number">{{ index + 1 }}</div>
                  <h4>Destination {{ index + 1 }}</h4>
                  <button 
                    type="button" 
                    @click="removeDestination(index)"
                    class="remove-btn"
                    :disabled="form.destinations.length <= 2"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>

                <div class="form-grid">
                  <div class="form-group full-width">
                    <label>Adresse de Livraison *</label>
                    <input
                      v-model="destination.delivery_address"
                      type="text"
                      placeholder="Adresse complète"
                      required
                      class="form-control"
                    >
                  </div>

                  <div class="form-group">
                    <label>Commune *</label>
                    <select 
                      v-model="destination.delivery_commune" 
                      required
                      class="form-control"
                    >
                      <option value="">Sélectionner</option>
                      <option v-for="commune in communes" :key="commune" :value="commune">
                        {{ commune }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Destinataire *</label>
                    <input
                      v-model="destination.recipient_name"
                      type="text"
                      placeholder="Nom du destinataire"
                      required
                      class="form-control"
                    >
                  </div>

                  <div class="form-group">
                    <label>Téléphone Destinataire</label>
                    <input
                      v-model="destination.recipient_phone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      class="form-control"
                    >
                  </div>

                  <div class="form-group">
                    <label>Contact de Livraison</label>
                    <input
                      v-model="destination.delivery_contact_name"
                      type="text"
                      placeholder="Nom du contact"
                      class="form-control"
                    >
                  </div>

                  <div class="form-group">
                    <label>Téléphone Contact</label>
                    <input
                      v-model="destination.delivery_contact_phone"
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      class="form-control"
                    >
                  </div>

                  <div class="form-group">
                    <label>Description du Colis</label>
                    <input
                      v-model="destination.package_description"
                      type="text"
                      placeholder="Ex: Documents, Produits..."
                      class="form-control"
                    >
                  </div>

                  <div class="form-group">
                    <label>Taille du Colis</label>
                    <select 
                      v-model="destination.package_size"
                      class="form-control"
                    >
                      <option value="">Sélectionner</option>
                      <option value="small">Petit</option>
                      <option value="medium">Moyen</option>
                      <option value="large">Grand</option>
                      <option value="extra_large">Très Grand</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Poids (kg)</label>
                    <input
                      v-model.number="destination.package_weight"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0.0"
                      class="form-control"
                    >
                  </div>

                  <div class="form-group full-width">
                    <label>Instructions Spéciales</label>
                    <textarea
                      v-model="destination.special_instructions"
                      rows="2"
                      placeholder="Instructions pour cette livraison..."
                      class="form-control"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Étape 3: Options et Prix -->
          <div v-if="currentStep === 2" class="step-content">
            <h3>Options de Livraison</h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="vehicle_type">Type de Véhicule</label>
                <select 
                  id="vehicle_type"
                  v-model="form.vehicle_type_required"
                  class="form-control"
                >
                  <option value="">Automatique</option>
                  <option value="bicycle">Vélo</option>
                  <option value="motorcycle">Moto</option>
                  <option value="scooter">Scooter</option>
                  <option value="car">Voiture</option>
                  <option value="van">Camionnette</option>
                  <option value="truck">Camion</option>
                </select>
              </div>

              <div class="form-group">
                <label for="proposed_price">Prix Proposé (FCFA) *</label>
                <div class="price-input-group">
                  <input
                    id="proposed_price"
                    v-model.number="form.total_proposed_price"
                    type="number"
                    min="500"
                    required
                    class="form-control"
                    placeholder="0"
                  >
                  <button 
                    type="button" 
                    @click="calculateSuggestedPrice"
                    class="btn btn-outline"
                    :disabled="loadingPrice"
                  >
                    <i v-if="loadingPrice" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-calculator"></i>
                    Calculer
                  </button>
                </div>
                <small v-if="suggestedPrice" class="price-suggestion">
                  Prix suggéré: {{ formatCurrency(suggestedPrice) }}
                </small>
              </div>

              <div class="form-group full-width">
                <div class="checkbox-group">
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="form.is_urgent">
                    <span class="checkmark"></span>
                    Livraison Urgente (+50%)
                  </label>
                  <label class="checkbox-item">
                    <input type="checkbox" v-model="form.is_fragile">
                    <span class="checkmark"></span>
                    Colis Fragile (+20%)
                  </label>
                </div>
              </div>

              <div class="form-group full-width">
                <label for="special_instructions">Instructions Générales</label>
                <textarea
                  id="special_instructions"
                  v-model="form.special_instructions"
                  rows="3"
                  placeholder="Instructions générales pour toute la livraison..."
                  class="form-control"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Étape 4: Récapitulatif -->
          <div v-if="currentStep === 3" class="step-content">
            <h3>Récapitulatif</h3>
            
            <div class="summary-section">
              <!-- Ramassage -->
              <div class="summary-card">
                <h4>
                  <i class="fas fa-map-marker-alt pickup"></i>
                  Point de Ramassage
                </h4>
                <div class="summary-content">
                  <p><strong>{{ form.pickup_address }}</strong></p>
                  <p>{{ form.pickup_commune }}</p>
                  <p v-if="form.pickup_contact_name">
                    Contact: {{ form.pickup_contact_name }}
                    <span v-if="form.pickup_contact_phone">({{ form.pickup_contact_phone }})</span>
                  </p>
                </div>
              </div>

              <!-- Destinations -->
              <div class="summary-card">
                <h4>
                  <i class="fas fa-route"></i>
                  Destinations ({{ form.destinations.length }})
                </h4>
                <div class="summary-destinations">
                  <div 
                    v-for="(dest, index) in form.destinations" 
                    :key="index"
                    class="summary-destination"
                  >
                    <span class="dest-number">{{ index + 1 }}</span>
                    <div class="dest-info">
                      <strong>{{ dest.recipient_name }}</strong>
                      <span>{{ dest.delivery_address }}, {{ dest.delivery_commune }}</span>
                      <span v-if="dest.package_description" class="package-desc">
                        {{ dest.package_description }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Options -->
              <div class="summary-card">
                <h4>
                  <i class="fas fa-cog"></i>
                  Options
                </h4>
                <div class="summary-options">
                  <div class="option-item">
                    <span>Véhicule:</span>
                    <strong>{{ getVehicleLabel(form.vehicle_type_required) || 'Automatique' }}</strong>
                  </div>
                  <div class="option-item">
                    <span>Type:</span>
                    <div class="option-badges">
                      <span v-if="form.is_urgent" class="badge urgent">Urgent</span>
                      <span v-if="form.is_fragile" class="badge fragile">Fragile</span>
                      <span v-if="!form.is_urgent && !form.is_fragile" class="badge normal">Standard</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prix -->
              <div class="summary-card price-card">
                <h4>
                  <i class="fas fa-euro-sign"></i>
                  Prix Total
                </h4>
                <div class="price-breakdown">
                  <div class="price-line">
                    <span>Prix de base:</span>
                    <span>{{ formatCurrency(calculateBasePrice()) }}</span>
                  </div>
                  <div v-if="form.is_urgent" class="price-line surcharge">
                    <span>Majoration urgente (+50%):</span>
                    <span>{{ formatCurrency(calculateBasePrice() * 0.5) }}</span>
                  </div>
                  <div v-if="form.is_fragile" class="price-line surcharge">
                    <span>Majoration fragile (+20%):</span>
                    <span>{{ formatCurrency(calculateBasePrice() * 0.2) }}</span>
                  </div>
                  <div class="price-line total">
                    <span><strong>Total:</strong></span>
                    <span><strong>{{ formatCurrency(form.total_proposed_price) }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <div class="footer-buttons">
          <button 
            v-if="currentStep > 0"
            type="button" 
            @click="previousStep"
            class="btn btn-outline"
          >
            <i class="fas fa-chevron-left"></i>
            Précédent
          </button>
          
          <button 
            v-if="currentStep < steps.length - 1"
            type="button" 
            @click="nextStep"
            class="btn btn-primary"
            :disabled="!canGoNext"
          >
            Suivant
            <i class="fas fa-chevron-right"></i>
          </button>
          
          <button 
            v-if="currentStep === steps.length - 1"
            type="button" 
            @click="createDelivery"
            class="btn btn-success"
            :disabled="loading || !isFormValid"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-check"></i>
            {{ loading ? 'Création...' : 'Créer la Livraison' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import multiDestinationApi from '@/api/multi-destination-deliveries'

export default {
  name: 'CreateMultiDestinationModal',
  emits: ['close', 'created'],
  setup(props, { emit }) {
    const { showToast } = useToast()
    
    // État réactif
    const currentStep = ref(0)
    const loading = ref(false)
    const loadingPrice = ref(false)
    const suggestedPrice = ref(0)
    
    const steps = [
      { label: 'Ramassage' },
      { label: 'Destinations' },
      { label: 'Options' },
      { label: 'Récapitulatif' }
    ]
    
    const communes = [
      'Abobo', 'Adjamé', 'Attécoubé', 'Bingerville', 'Cocody', 
      'Koumassi', 'Marcory', 'Port-Bouët', 'Treichville', 'Yopougon',
      'Plateau', 'Deux-Plateaux', 'Riviera', 'Angré', 'Brofodoumé'
    ]
    
    const form = reactive({
      pickup_address: '',
      pickup_commune: '',
      pickup_lat: null,
      pickup_lng: null,
      pickup_contact_name: '',
      pickup_contact_phone: '',
      pickup_instructions: '',
      destinations: [
        createEmptyDestination(),
        createEmptyDestination()
      ],
      total_proposed_price: 0,
      special_instructions: '',
      vehicle_type_required: '',
      is_fragile: false,
      is_urgent: false
    })
    
    // Computed
    const canGoNext = computed(() => {
      switch (currentStep.value) {
        case 0:
          return form.pickup_address && form.pickup_commune
        case 1:
          return form.destinations.length >= 2 && 
                 form.destinations.every(d => d.delivery_address && d.delivery_commune && d.recipient_name)
        case 2:
          return form.total_proposed_price > 0
        default:
          return true
      }
    })
    
    const isFormValid = computed(() => {
      return canGoNext.value && form.total_proposed_price > 0
    })
    
    // Méthodes
    function createEmptyDestination() {
      return {
        delivery_address: '',
        delivery_commune: '',
        delivery_lat: null,
        delivery_lng: null,
        delivery_contact_name: '',
        delivery_contact_phone: '',
        package_description: '',
        package_size: '',
        package_weight: null,
        recipient_name: '',
        recipient_phone: '',
        special_instructions: ''
      }
    }
    
    const addDestination = () => {
      if (form.destinations.length < 10) {
        form.destinations.push(createEmptyDestination())
      }
    }
    
    const removeDestination = (index) => {
      if (form.destinations.length > 2) {
        form.destinations.splice(index, 1)
      }
    }
    
    const nextStep = () => {
      if (canGoNext.value && currentStep.value < steps.length - 1) {
        currentStep.value++
        
        // Auto-calculer le prix à l'étape 3
        if (currentStep.value === 2 && form.total_proposed_price === 0) {
          calculateSuggestedPrice()
        }
      }
    }
    
    const previousStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--
      }
    }
    
    const calculateSuggestedPrice = async () => {
      try {
        loadingPrice.value = true
        
        // Estimation basique pour l'instant
        const basePrice = 2000
        const pricePerDestination = 500
        const pricePerKm = 200
        
        // Estimation de distance (5km par destination en moyenne)
        const estimatedDistance = form.destinations.length * 5
        
        let price = basePrice + 
                   (form.destinations.length - 1) * pricePerDestination + 
                   estimatedDistance * pricePerKm
        
        if (form.is_urgent) price *= 1.5
        if (form.is_fragile) price *= 1.2
        
        suggestedPrice.value = Math.round(price)
        form.total_proposed_price = suggestedPrice.value
        
      } catch (error) {
        console.error('Erreur calcul prix:', error)
        showToast('Erreur lors du calcul du prix', 'error')
      } finally {
        loadingPrice.value = false
      }
    }
    
    const calculateBasePrice = () => {
      if (form.total_proposed_price === 0) return 0
      
      let base = form.total_proposed_price
      if (form.is_urgent) base /= 1.5
      if (form.is_fragile) base /= 1.2
      
      return Math.round(base)
    }
    
    const createDelivery = async () => {
      try {
        loading.value = true
        
        const deliveryData = {
          ...form,
          total_destinations: form.destinations.length
        }
        
        const result = await multiDestinationApi.createDelivery(deliveryData)
        
        showToast('Livraison créée avec succès', 'success')
        emit('created', result)
        
      } catch (error) {
        console.error('Erreur création livraison:', error)
        showToast(error.message || 'Erreur lors de la création de la livraison', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget) {
        emit('close')
      }
    }
    
    const getVehicleLabel = (type) => {
      const labels = {
        bicycle: 'Vélo',
        motorcycle: 'Moto',
        scooter: 'Scooter',
        car: 'Voiture',
        van: 'Camionnette',
        truck: 'Camion'
      }
      return labels[type]
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount)
    }
    
    return {
      currentStep,
      loading,
      loadingPrice,
      suggestedPrice,
      steps,
      communes,
      form,
      canGoNext,
      isFormValid,
      addDestination,
      removeDestination,
      nextStep,
      previousStep,
      calculateSuggestedPrice,
      calculateBasePrice,
      createDelivery,
      handleOverlayClick,
      getVehicleLabel,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h2 i {
  color: #3b82f6;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

/* Étapes de progression */
.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
}

.progress-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e5e7eb;
  z-index: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  background: white;
  padding: 0 16px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.step.completed .step-number {
  background: #059669;
  color: white;
  border-color: #059669;
}

.step-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.step.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

.step.completed .step-label {
  color: #059669;
}

/* Contenu des étapes */
.step-content {
  min-height: 400px;
}

.step-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

/* Formulaires */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Destinations */
.destinations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.destinations-list {
  space-y: 24px;
}

.destination-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  background: #f9fafb;
}

.destination-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.destination-number {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.destination-header h4 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  color: #111827;
}

.remove-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: #fecaca;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Prix */
.price-input-group {
  display: flex;
  gap: 12px;
}

.price-input-group .form-control {
  flex: 1;
}

.price-suggestion {
  display: block;
  margin-top: 8px;
  color: #059669;
  font-weight: 600;
}

/* Checkboxes */
.checkbox-group {
  display: flex;
  gap: 24px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
}

.checkbox-item input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox-item input:checked + .checkmark {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-item input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* Récapitulatif */
.summary-section {
  space-y: 24px;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  background: white;
  margin-bottom: 24px;
}

.summary-card h4 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 16px;
  color: #111827;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.summary-card h4 i {
  color: #3b82f6;
}

.summary-card h4 i.pickup {
  color: #059669;
}

.summary-content p {
  margin: 8px 0;
  color: #374151;
}

.summary-destinations {
  space-y: 12px;
}

.summary-destination {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.dest-number {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.dest-info {
  flex: 1;
}

.dest-info strong {
  display: block;
  color: #111827;
  margin-bottom: 4px;
}

.dest-info span {
  display: block;
  color: #6b7280;
  font-size: 14px;
}

.package-desc {
  font-style: italic;
  color: #9ca3af !important;
}

.summary-options {
  space-y: 12px;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.urgent {
  background: #fee2e2;
  color: #dc2626;
}

.badge.fragile {
  background: #fef3c7;
  color: #d97706;
}

.badge.normal {
  background: #f3f4f6;
  color: #6b7280;
}

.price-card {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.price-breakdown {
  space-y: 8px;
}

.price-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.price-line.surcharge {
  color: #d97706;
  font-size: 14px;
}

.price-line.total {
  border-top: 2px solid #e5e7eb;
  padding-top: 12px;
  font-size: 18px;
  color: #111827;
}

/* Footer */
.modal-footer {
  padding: 24px 32px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-success {
  background: #059669;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #047857;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .checkbox-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .footer-buttons {
    flex-direction: column;
  }
  
  .price-input-group {
    flex-direction: column;
  }
}
</style>
