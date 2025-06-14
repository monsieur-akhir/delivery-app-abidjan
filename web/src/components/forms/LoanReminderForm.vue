<template>
  <div class="loan-reminder-form">
    <div class="form-group">
      <label for="reminder-message" class="form-label"
        >Message de rappel <span class="required">*</span></label
      >
      <textarea
        id="reminder-message"
        v-model="reminderMessage"
        class="form-textarea"
        placeholder="Saisissez votre message de rappel ici..."
        rows="5"
        required
      ></textarea>
      <div class="form-hint">Laissez vide pour utiliser le message par défaut</div>
    </div>

    <div class="form-group">
      <label class="form-label">Message par défaut</label>
      <div class="default-message">
        {{ defaultMessage }}
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button type="button" class="btn btn-primary" @click="save">Envoyer le rappel</button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'LoanReminderForm',
  props: {
    loan: {
      type: Object,
      required: true,
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const reminderMessage = ref('')

    const defaultMessage = computed(() => {
      const dueDate = new Date(props.loan.repayment_deadline)
      const today = new Date()
      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 0) {
        return `Rappel: Votre prêt de ${
          props.loan.amount
        } FCFA doit être remboursé dans ${diffDays} jours (échéance le ${dueDate.toLocaleDateString(
          'fr-FR'
        )}).`
      } else if (diffDays === 0) {
        return `Rappel important: Votre prêt de ${props.loan.amount} FCFA doit être remboursé aujourd'hui.`
      } else {
        return `Rappel urgent: Votre prêt de ${
          props.loan.amount
        } FCFA est en retard de remboursement de ${Math.abs(diffDays)} jours.`
      }
    })

    const save = () => {
      emit('save', reminderMessage.value || null)
    }

    const cancel = () => {
      emit('cancel')
    }

    return {
      reminderMessage,
      defaultMessage,
      save,
      cancel,
    }
  },
}
</script>

<style scoped>
.loan-reminder-form {
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

.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  resize: vertical;
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.default-message {
  padding: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  font-style: italic;
  color: #4b5563;
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

.btn-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>
