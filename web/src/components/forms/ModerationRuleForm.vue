<template>
  <div class="moderation-rule-form">
    <div class="form-group">
      <label for="title" class="form-label">Titre <span class="required">*</span></label>
      <input 
        type="text" 
        id="title" 
        v-model="formData.title" 
        class="form-input" 
        placeholder="Titre de la règle"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="description" class="form-label">Description</label>
      <textarea 
        id="description" 
        v-model="formData.description" 
        class="form-textarea" 
        placeholder="Description détaillée de la règle"
        rows="3"
      ></textarea>
    </div>
    
    <div class="form-row">
      <div class="form-group flex-1">
        <label for="severity" class="form-label">Niveau de sévérité <span class="required">*</span></label>
        <select id="severity" v-model="formData.severity" class="form-select">
          <option value="low">Faible</option>
          <option value="medium">Moyen</option>
          <option value="high">Élevé</option>
          <option value="critical">Critique</option>
        </select>
      </div>
      
      <div class="form-group flex-1">
        <label for="action" class="form-label">Action automatique <span class="required">*</span></label>
        <select id="action" v-model="formData.action" class="form-select">
          <option value="warning">Avertissement</option>
          <option value="temporary_ban">Suspension temporaire</option>
          <option value="permanent_ban">Suspension permanente</option>
          <option value="review">Examen manuel</option>
        </select>
      </div>
    </div>
    
    <div class="form-group" v-if="formData.action === 'temporary_ban'">
      <label for="ban-duration" class="form-label">Durée de suspension (jours) <span class="required">*</span></label>
      <input 
        type="number" 
        id="ban-duration" 
        v-model.number="formData.ban_duration" 
        class="form-input" 
        min="1"
        required
      />
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
        La règle doit s'appliquer à au moins un type d'utilisateur
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
  name: 'ModerationRuleForm',
  props: {
    rule: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      title: '',
      description: '',
      severity: 'medium',
      action: 'warning',
      ban_duration: 1,
      active: true,
      applies_to: {
        clients: true,
        couriers: true,
        businesses: true
      }
    });
    
    const isEditing = computed(() => !!props.rule?.id);
    
    const isAppliesValid = computed(() => {
      return formData.value.applies_to.clients || 
             formData.value.applies_to.couriers || 
             formData.value.applies_to.businesses;
    });
    
    const isFormValid = computed(() => {
      return formData.value.title.trim() !== '' && 
             isAppliesValid.value && 
             (formData.value.action !== 'temporary_ban' || formData.value.ban_duration > 0);
    });
    
    const initForm = () => {
      if (props.rule) {
        formData.value = { ...props.rule };
      }
    };
    
    const save = () => {
      if (!isFormValid.value) return;
      
      const ruleData = { ...formData.value };
      
      // Si l'action n'est pas une suspension temporaire, la durée n'est pas nécessaire
      if (ruleData.action !== 'temporary_ban') {
        ruleData.ban_duration = 0;
      }
      
      emit('save', ruleData);
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
.moderation-rule-form {
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
