<template>
  <div class="refund-criteria-form">
    <div class="form-group">
      <label for="title" class="form-label">Titre <span class="required">*</span></label>
      <input 
        type="text" 
        id="title" 
        v-model="formData.title" 
        class="form-input" 
        placeholder="Titre du critère"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="description" class="form-label">Description</label>
      <textarea 
        id="description" 
        v-model="formData.description" 
        class="form-textarea" 
        placeholder="Description détaillée du critère"
        rows="3"
      ></textarea>
    </div>
    
    <div class="form-row">
      <div class="form-group flex-1">
        <label for="refund-percentage" class="form-label">Pourcentage de remboursement <span class="required">*</span></label>
        <div class="input-group">
          <input 
            type="number" 
            id="refund-percentage" 
            v-model.number="formData.refund_percentage" 
            class="form-input" 
            min="0"
            max="100"
            step="5"
            required
          />
          <div class="input-group-append">
            <span class="input-group-text">%</span>
          </div>
        </div>
      </div>
      
      <div class="form-group flex-1">
        <label for="max-claim-time" class="form-label">Délai maximum de réclamation <span class="required">*</span></label>
        <div class="input-group">
          <input 
            type="number" 
            id="max-claim-time" 
            v-model.number="formData.max_claim_time" 
            class="form-input" 
            min="1"
            required
          />
          <div class="input-group-append">
            <span class="input-group-text">heures</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Preuves requises</label>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.required_proofs.photo" />
          <span>Photo</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.required_proofs.receipt" />
          <span>Reçu</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.required_proofs.description" />
          <span>Description détaillée</span>
        </label>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Approbation automatique</label>
      <div class="toggle-switch">
        <input type="checkbox" id="auto-approve-toggle" v-model="formData.auto_approve" />
        <label for="auto-approve-toggle"></label>
        <span class="toggle-label">{{ formData.auto_approve ? 'Activée' : 'Désactivée' }}</span>
      </div>
      <div class="form-hint" v-if="formData.auto_approve">
        Les demandes de remboursement qui répondent à ce critère seront automatiquement approuvées si toutes les preuves requises sont fournies.
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
  name: 'RefundCriteriaForm',
  props: {
    criteria: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      title: '',
      description: '',
      refund_percentage: 100,
      max_claim_time: 24,
      auto_approve: false,
      active: true,
      required_proofs: {
        photo: true,
        receipt: false,
        description: true
      }
    });
    
    const isEditing = computed(() => !!props.criteria?.id);
    
    const isFormValid = computed(() => {
      return formData.value.title.trim() !== '' && 
             formData.value.refund_percentage >= 0 && 
             formData.value.refund_percentage <= 100 && 
             formData.value.max_claim_time > 0;
    });
    
    const initForm = () => {
      if (props.criteria) {
        formData.value = { ...props.criteria };
      }
    };
    
    const save = () => {
      if (!isFormValid.value) return;
      
      const criteriaData = { ...formData.value };
      emit('save', criteriaData);
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
      isFormValid,
      save,
      cancel
    };
  }
};
</script>

<style scoped>
.refund-criteria-form {
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
