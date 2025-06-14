<template>
  <div class="loan-note-form">
    <div class="form-group">
      <label for="note-content" class="form-label"
        >Contenu de la note <span class="required">*</span></label
      >
      <textarea
        id="note-content"
        v-model="noteContent"
        class="form-textarea"
        placeholder="Saisissez votre note ici..."
        rows="5"
        required
      ></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button type="button" class="btn btn-primary" @click="save" :disabled="!isValid">
        Enregistrer
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'LoanNoteForm',
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const noteContent = ref('')

    const isValid = computed(() => {
      return noteContent.value.trim() !== ''
    })

    const save = () => {
      if (!isValid.value) return

      emit('save', noteContent.value)
    }

    const cancel = () => {
      emit('cancel')
    }

    return {
      noteContent,
      isValid,
      save,
      cancel,
    }
  },
}
</script>

<style scoped>
.loan-note-form {
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
