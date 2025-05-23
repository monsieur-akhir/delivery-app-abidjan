<template>
  <div class="loan-extension-form">
    <div class="form-group">
      <label for="extension-days" class="form-label">Nombre de jours supplémentaires <span class="required">*</span></label>
      <input 
        type="number" 
        id="extension-days" 
        v-model.number="extensionDays" 
        class="form-input" 
        min="1"
        max="90"
        required
      />
      <div class="form-hint">
        Nombre de jours à ajouter à la date d'échéance actuelle
      </div>
    </div>
    
    <div class="form-group">
      <label for="extension-reason" class="form-label">Raison de la prolongation <span class="required">*</span></label>
      <textarea 
        id="extension-reason" 
        v-model="extensionReason" 
        class="form-textarea" 
        placeholder="Raison de la prolongation..."
        rows="3"
        required
      ></textarea>
    </div>
    
    <div class="form-group">
      <label class="form-label">Nouvelle date d'échéance</label>
      <div class="new-deadline">
        {{ formattedNewDeadline }}
      </div>
    </div>
    
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" v-model="sendNotification" />
        <span>Envoyer une notification à l'emprunteur</span>
      </label>
    </div>
    
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button 
        type="button" 
        class="btn btn-primary" 
        @click="save" 
        :disabled="!isValid"
      >
        Prolonger
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'LoanExtensionForm',
  props: {
    currentDeadline: {
      type: Date,
      required: true
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const extensionDays = ref(7);
    const extensionReason = ref('');
    const sendNotification = ref(true);
    
    const formattedNewDeadline = computed(() => {
      const newDeadline = new Date(props.currentDeadline);
      newDeadline.setDate(newDeadline.getDate() + extensionDays.value);
      
      return newDeadline.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    });
    
    const isValid = computed(() => {
      return extensionDays.value > 0 && extensionReason.value.trim() !== '';
    });
    
    const save = () => {
      if (!isValid.value) return;
      
      emit('save', {
        extensionDays: extensionDays.value,
        extensionReason: extensionReason.value,
        sendNotification: sendNotification.value
      });
    };
    
    const cancel = () => {
      emit('cancel');
    };
    
    return {
      extensionDays,
      extensionReason,
      sendNotification,
      formattedNewDeadline,
      isValid,
      save,
      cancel
    };
  }
};
</script>

<style scoped>
.loan-extension-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
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

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.new-deadline {
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  font-weight: 500;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
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
