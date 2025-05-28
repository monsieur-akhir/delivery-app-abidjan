<template>
  <div class="delivery-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-sections">
        <!-- Section Informations de base -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-info-circle"></i>
            Informations de base
          </h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pickup-commune" class="required">Commune de ramassage</label>
              <select 
                id="pickup-commune" 
                v-model="form.pickupCommune" 
                class="form-control"
                :class="{ 'error': errors.pickupCommune }"
                required
              >
                <option value="">Sélectionner une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
              <span v-if="errors.pickupCommune" class="error-message">{{ errors.pickupCommune }}</span>
            </div>
            
            <div class="form-group">
              <label for="delivery-commune" class="required">Commune de livraison</label>
              <select 
                id="delivery-commune" 
                v-model="form.deliveryCommune" 
                class="form-control"
                :class="{ 'error': errors.deliveryCommune }"
                required
              >
                <option value="">Sélectionner une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
              <span v-if="errors.deliveryCommune" class="error-message">{{ errors.deliveryCommune }}</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pickup-address" class="required">Adresse de ramassage</label>
              <textarea 
                id="pickup-address"
                v-model="form.pickupAddress" 
                class="form-control"
                :class="{ 'error': errors.pickupAddress }"
                placeholder="Adresse complète de ramassage"
                rows="2"
                required
              ></textarea>
              <span v-if="errors.pickupAddress" class="error-message">{{ errors.pickupAddress }}</span>
            </div>
            
            <div class="form-group">
              <label for="delivery-address" class="required">Adresse de livraison</label>
              <textarea 
                id="delivery-address"
                v-model="form.deliveryAddress" 
                class="form-control"
                :class="{ 'error': errors.deliveryAddress }"
                placeholder="Adresse complète de livraison"
                rows="2"
                required
              ></textarea>
              <span v-if="errors.deliveryAddress" class="error-message">{{ errors.deliveryAddress }}</span>
            </div>
          </div>
        </div>

        <!-- Section Colis -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-box"></i>
            Détails du colis
          </h3>
          
          <div class="form-group">
            <label for="package-description" class="required">Description du colis</label>
            <textarea 
              id="package-description"
              v-model="form.packageDescription" 
              class="form-control"
              :class="{ 'error': errors.packageDescription }"
              placeholder="Décrivez le contenu du colis"
              rows="3"
              required
            ></textarea>
            <span v-if="errors.packageDescription" class="error-message">{{ errors.packageDescription }}</span>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="package-weight">Poids estimé (kg)</label>
              <input 
                id="package-weight"
                type="number" 
                v-model.number="form.packageWeight" 
                class="form-control"
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
            
            <div class="form-group">
              <label for="package-size">Taille du colis</label>
              <select id="package-size" v-model="form.packageSize" class="form-control">
                <option value="small">Petit (&lt; 30cm)</option>
                <option value="medium">Moyen (30-60cm)</option>
                <option value="large">Grand (60-100cm)</option>
                <option value="extra-large">Très grand (> 100cm)</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isFragile" />
                <span class="checkmark"></span>
                Colis fragile
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.requiresRefrigeration" />
                <span class="checkmark"></span>
                Nécessite réfrigération
              </label>
            </div>
          </div>
        </div>

        <!-- Section Prix et collaboration -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-users"></i>
            Collaboration et prix
          </h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="proposed-price" class="required">Prix proposé (FCFA)</label>
              <input 
                id="proposed-price"
                type="number" 
                v-model.number="form.proposedPrice" 
                class="form-control"
                :class="{ 'error': errors.proposedPrice }"
                placeholder="0"
                min="0"
                required
              />
              <span v-if="errors.proposedPrice" class="error-message">{{ errors.proposedPrice }}</span>
            </div>
            
            <div class="form-group">
              <label for="max-collaborators">Nombre max de collaborateurs</label>
              <select id="max-collaborators" v-model.number="form.maxCollaborators" class="form-control">
                <option :value="2">2 collaborateurs</option>
                <option :value="3">3 collaborateurs</option>
                <option :value="4">4 collaborateurs</option>
                <option :value="5">5 collaborateurs</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="collaboration-notes">Instructions pour les collaborateurs</label>
            <textarea 
              id="collaboration-notes"
              v-model="form.collaborationNotes" 
              class="form-control"
              placeholder="Instructions spéciales, points de rendez-vous, etc."
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- Section Options avancées -->
        <div class="form-section">
          <h3 class="section-title">
            <i class="fas fa-cog"></i>
            Options avancées
          </h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="delivery-deadline">Date limite de livraison</label>
              <input 
                id="delivery-deadline"
                type="datetime-local" 
                v-model="form.deliveryDeadline" 
                class="form-control"
                :min="minDateTime"
              />
            </div>
            
            <div class="form-group">
              <label for="priority">Priorité</label>
              <select id="priority" v-model="form.priority" class="form-control">
                <option value="normal">Normale</option>
                <option value="high">Élevée</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.requiresInsurance" />
                <span class="checkmark"></span>
                Assurance requise
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.allowsPartialDelivery" />
                <span class="checkmark"></span>
                Livraison partielle autorisée
              </label>
            </div>
          </div>
          
          <div class="form-group" v-if="form.requiresInsurance">
            <label for="insurance-value">Valeur assurée (FCFA)</label>
            <input 
              id="insurance-value"
              type="number" 
              v-model.number="form.insuranceValue" 
              class="form-control"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- Résumé et actions -->
      <div class="form-summary">
        <div class="summary-card">
          <h4>Résumé de la livraison</h4>
          <div class="summary-item">
            <span class="label">Trajet:</span>
            <span class="value">{{ form.pickupCommune || '?' }} → {{ form.deliveryCommune || '?' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Prix proposé:</span>
            <span class="value">{{ formatCurrency(form.proposedPrice || 0) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Collaborateurs max:</span>
            <span class="value">{{ form.maxCollaborators }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Frais plateforme (10%):</span>
            <span class="value">{{ formatCurrency((form.proposedPrice || 0) * 0.1) }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">Montant distribuable:</span>
            <span class="value">{{ formatCurrency((form.proposedPrice || 0) * 0.9) }}</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn-outline">
          Annuler
        </button>
        <button type="submit" :disabled="!isFormValid || submitting" class="btn-primary">
          <span v-if="submitting" class="spinner"></span>
          {{ isEditing ? 'Mettre à jour' : 'Créer la livraison' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'CollaborativeDeliveryForm',
  
  props: {
    delivery: {
      type: Object,
      default: null
    }
  },
  
  emits: ['submit', 'cancel'],
  
  setup(props, { emit }) {
    const form = ref({
      pickupCommune: '',
      deliveryCommune: '',
      pickupAddress: '',
      deliveryAddress: '',
      packageDescription: '',
      packageWeight: null,
      packageSize: 'medium',
      isFragile: false,
      requiresRefrigeration: false,
      proposedPrice: null,
      maxCollaborators: 3,
      collaborationNotes: '',
      deliveryDeadline: '',
      priority: 'normal',
      requiresInsurance: false,
      allowsPartialDelivery: false,
      insuranceValue: null
    })
    
    const errors = ref({})
    const submitting = ref(false)
    
    const communes = [
      'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
      'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon'
    ]
    
    const isEditing = computed(() => !!props.delivery)
    
    const minDateTime = computed(() => {
      const now = new Date()
      now.setHours(now.getHours() + 1) // Au moins 1 heure dans le futur
      return now.toISOString().slice(0, 16)
    })
    
    const isFormValid = computed(() => {
      return form.value.pickupCommune &&
             form.value.deliveryCommune &&
             form.value.pickupAddress &&
             form.value.deliveryAddress &&
             form.value.packageDescription &&
             form.value.proposedPrice > 0 &&
             Object.keys(errors.value).length === 0
    })
    
    // Initialiser le formulaire si on édite une livraison existante
    const initializeForm = () => {
      if (props.delivery) {
        Object.keys(form.value).forEach(key => {
          if (props.delivery[key] !== undefined) {
            form.value[key] = props.delivery[key]
          }
        })
      }
    }
    
    // Validation en temps réel
    const validateField = (field, value) => {
      switch (field) {
        case 'pickupCommune':
        case 'deliveryCommune':
          if (!value) {
            errors.value[field] = 'Ce champ est requis'
          } else {
            delete errors.value[field]
          }
          break
          
        case 'pickupAddress':
        case 'deliveryAddress':
          if (!value || value.trim().length < 10) {
            errors.value[field] = 'L\'adresse doit contenir au moins 10 caractères'
          } else {
            delete errors.value[field]
          }
          break
          
        case 'packageDescription':
          if (!value || value.trim().length < 5) {
            errors.value[field] = 'La description doit contenir au moins 5 caractères'
          } else {
            delete errors.value[field]
          }
          break
          
        case 'proposedPrice':
          if (!value || value <= 0) {
            errors.value[field] = 'Le prix doit être supérieur à 0'
          } else if (value < 500) {
            errors.value[field] = 'Le prix minimum est de 500 FCFA'
          } else {
            delete errors.value[field]
          }
          break
      }
    }
    
    // Watchers pour la validation
    watch(() => form.value.pickupCommune, (value) => validateField('pickupCommune', value))
    watch(() => form.value.deliveryCommune, (value) => validateField('deliveryCommune', value))
    watch(() => form.value.pickupAddress, (value) => validateField('pickupAddress', value))
    watch(() => form.value.deliveryAddress, (value) => validateField('deliveryAddress', value))
    watch(() => form.value.packageDescription, (value) => validateField('packageDescription', value))
    watch(() => form.value.proposedPrice, (value) => validateField('proposedPrice', value))
    
    // Validation spéciale pour éviter les trajets identiques
    watch([() => form.value.pickupCommune, () => form.value.deliveryCommune], ([pickup, delivery]) => {
      if (pickup && delivery && pickup === delivery) {
        errors.value.deliveryCommune = 'La commune de livraison doit être différente de celle de ramassage'
      } else if (pickup && delivery && pickup !== delivery) {
        delete errors.value.deliveryCommune
        validateField('deliveryCommune', delivery)
      }
    })
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount)
    }
    
    const handleSubmit = async () => {
      // Validation finale
      Object.keys(form.value).forEach(key => {
        if (['pickupCommune', 'deliveryCommune', 'pickupAddress', 'deliveryAddress', 'packageDescription', 'proposedPrice'].includes(key)) {
          validateField(key, form.value[key])
        }
      })
      
      if (!isFormValid.value) {
        return
      }
      
      try {
        submitting.value = true
        
        // Préparer les données à envoyer
        const deliveryData = {
          ...form.value,
          deliveryType: 'collaborative'
        }
        
        // Nettoyer les valeurs nulles ou vides
        Object.keys(deliveryData).forEach(key => {
          if (deliveryData[key] === null || deliveryData[key] === '') {
            delete deliveryData[key]
          }
        })
        
        emit('submit', deliveryData)
      } catch (error) {
        console.error('Erreur lors de la soumission:', error)
      } finally {
        submitting.value = false
      }
    }
    
    onMounted(() => {
      initializeForm()
    })
    
    return {
      form,
      errors,
      submitting,
      communes,
      isEditing,
      minDateTime,
      isFormValid,
      formatCurrency,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.delivery-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-sections {
  margin-bottom: 32px;
}

.form-section {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.section-title i {
  margin-right: 8px;
  color: #3b82f6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.form-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control.error {
  border-color: #ef4444;
}

.error-message {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  margin: 0;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
}

.checkmark {
  margin-left: 4px;
}

.form-summary {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-item .label {
  color: #6b7280;
}

.summary-item .value {
  font-weight: 500;
  color: #374151;
}

.summary-item.total {
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
  margin-top: 8px;
  font-weight: 600;
}

.summary-item.total .value {
  color: #059669;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-outline {
  padding: 10px 20px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  padding: 10px 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .delivery-form {
    padding: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-outline,
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
