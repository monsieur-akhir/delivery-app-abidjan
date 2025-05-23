<template>
  <div class="sanction-parameter-form">
    <div class="form-group">
      <label for="title" class="form-label">Titre <span class="required">*</span></label>
      <input 
        type="text" 
        id="title" 
        v-model="formData.title" 
        class="form-input" 
        placeholder="Titre du paramètre"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="description" class="form-label">Description</label>
      <textarea 
        id="description" 
        v-model="formData.description" 
        class="form-textarea" 
        placeholder="Description détaillée du paramètre"
        rows="3"
      ></textarea>
    </div>
    
    <div class="form-group">
      <label for="violation-type" class="form-label">Type d'infraction <span class="required">*</span></label>
      <select id="violation-type" v-model="formData.violation_type" class="form-select">
        <option value="late_delivery">Retard de livraison</option>
        <option value="cancellation">Annulation</option>
        <option value="bad_behavior">Mauvais comportement</option>
        <option value="fraud">Fraude</option>
        <option value="safety">Sécurité</option>
      </select>
    </div>
    
    <div class="form-row">
      <div class="form-group flex-1">
        <label for="warning-threshold" class="form-label">Seuil d'avertissement <span class="required">*</span></label>
        <input 
          type="number" 
          id="warning-threshold" 
          v-model.number="formData.warning_threshold" 
          class="form-input" 
          min="1"
          required
        />
        <div class="form-hint">
          Nombre d'infractions avant l'envoi d'un avertissement
        </div>
      </div>
      
      <div class="form-group flex-1">
        <label for="suspension-threshold" class="form-label">Seuil de suspension <span class="required">*</span></label>
        <input 
          type="number" 
          id="suspension-threshold" 
          v-model.number="formData.suspension_threshold" 
          class="form-input" 
          min="1"
          required
        />
        <div class="form-hint">
          Nombre d'infractions avant la suspension du compte
        </div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group flex-1">
        <label for="suspension-duration" class="form-label">Durée de suspension <span class="required">*</span></label>
        <div class="input-group">
          <input 
            type="number" 
            id="suspension-duration" 
            v-model.number="formData.suspension_duration" 
            class="form-input" 
            min="1"
            required
          />
          <div class="input-group-append">
            <span class="input-group-text">jours</span>
          </div>
        </div>
      </div>
      
      <div class="form-group flex-1">
        <label for="expiration-period" class="form-label">Période d'expiration <span class="required">*</span></label>
        <div class="input-group">
          <input 
            type="number" 
            id="expiration-period" 
            v-model.number="formData.expiration_period" 
            class="form-input" 
            min="1"
            required
          />
          <div class="input-group-append">
            <span class="input-group-text">jours</span>
          </div>
        </div>
        <div class="form-hint">
          Nombre de jours après lesquels les infractions sont effacées
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">S'applique à <span class="required">*</span></label>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.applies_to.clients" />
          <span>Clients</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.applies_to.couriers" />
          <span>Coursiers</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.applies_to.businesses" />
          <span>Entreprises</span>
        </label>
      </div>
      <div class="form-error" v-if="!isAppliesValid">
        Le paramètre doit s'appliquer à au moins un type d'utilisateur
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Statut</label>
      <div class="toggle-switch">
        <input type="checkbox" id="active-toggle" v-model="formData.active" />
        <label for="active-toggle"></label>
        <span class="toggle-label">{{ formData.active ? 'Actif' : 'Inactif' }}</span>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button 
        type="button" 
        class="btn btn-primary" 
        @click="save" 
        :disabled="!isFormValid"
      >
        {{ isEditing ? 'Mettre à jour' : 'Créer' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'SanctionParameterForm',
  props: {
    parameter: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      title: '',
      description: '',
      violation_type: 'late_delivery',
      warning_threshold: 3,
      suspension_threshold: 5,
      suspension_duration: 7,
      expiration_period: 30,
      active: true,
      applies_to: {
        clients: false,
        couriers: true,
        businesses: false
      }
    });
    
    const isEditing = computed(() => !!props.parameter?.id);
    
    const isAppliesValid = computed(() => {
      return formData.value.applies_to.clients || 
             formData.value.applies_to.couriers || 
             formData.value.applies_to.businesses;
    });
    
    const isFormValid = computed(() => {
      return formData.value.title.trim() !== '' && 
             isAppliesValid.value && 
             formData.value.warning_threshold > 0 && 
             formData.value.suspension_threshold > 0 && 
             formData.value.suspension_duration > 0 && 
             formData.value.expiration_period > 0;
    });
    
    const initForm = () => {
      if (props.parameter) {
        formData.value = { ...props.parameter };
      }
    };
    
    const save = () => {
      if (!isFormValid.value) return;
      
      const parameterData = { ...formData.value };
      emit('save', parameterData);
    };
    
    const cancel = () => {
      emit('cancel');
    };
    
    onMounted(() => {
      initForm();
    });
    
    return {
      formData,
      isEditing,
      isAppliesValid,
      isFormValid,
      save,
      cancel
    };
  }
};
</script>

<style scoped>
.sanction-parameter-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.form-textarea {
  resize: vertical;
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  flex: 1;
}

.input-group-append {
  display: flex;
  align-items: center;
}

.input-group-text {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-left: none;
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-switch {
  display: flex;
  align-items: center;
}

.toggle-switch input {
  display: none;
}

.toggle-switch label {
  position: relative;
  display: inline-block;
  width: 3rem;
  height: 1.5rem;
  background-color: #9ca3af;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-switch label::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch input:checked + label {
  background-color: #10b981;
}

.toggle-switch input:checked + label::after {
  transform: translateX(1.5rem);
}

.toggle-label {
  margin-left: 0.5rem;
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.form-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-primary:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>
