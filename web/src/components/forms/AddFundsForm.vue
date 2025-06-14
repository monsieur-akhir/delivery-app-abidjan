<template>
  <div class="add-funds-form">
    <div class="form-group">
      <label for="funds-amount" class="form-label"
        >Montant (FCFA) <span class="required">*</span></label
      >
      <input
        type="number"
        id="funds-amount"
        v-model.number="amount"
        class="form-input"
        min="1000"
        step="1000"
        required
      />
    </div>

    <div class="form-group">
      <label for="funds-source" class="form-label"
        >Source des fonds <span class="required">*</span></label
      >
      <select id="funds-source" v-model="source" class="form-select">
        <option value="company">Entreprise</option>
        <option value="donation">Don</option>
        <option value="government">Gouvernement</option>
        <option value="ngo">ONG</option>
        <option value="other">Autre</option>
      </select>
    </div>

    <div class="form-group" v-if="source === 'other'">
      <label for="custom-source" class="form-label"
        >Source personnalisée <span class="required">*</span></label
      >
      <input
        type="text"
        id="custom-source"
        v-model="customSource"
        class="form-input"
        placeholder="Précisez la source des fonds"
        required
      />
    </div>

    <div class="form-group">
      <label for="funds-description" class="form-label">Description</label>
      <textarea
        id="funds-description"
        v-model="description"
        class="form-textarea"
        placeholder="Description ou commentaire (optionnel)"
        rows="3"
      ></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button type="button" class="btn btn-primary" @click="save" :disabled="!isValid">
        Ajouter les fonds
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'AddFundsForm',
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const amount = ref(10000)
    const source = ref('company')
    const customSource = ref('')
    const description = ref('')

    const isValid = computed(() => {
      if (amount.value <= 0) return false
      if (source.value === 'other' && !customSource.value.trim()) return false
      return true
    })

    const save = () => {
      if (!isValid.value) return

      const finalSource = source.value === 'other' ? customSource.value : source.value

      emit('save', {
        amount: amount.value,
        source: finalSource,
        description: description.value,
      })
    }

    const cancel = () => {
      emit('cancel')
    }

    return {
      amount,
      source,
      customSource,
      description,
      isValid,
      save,
      cancel,
    }
  },
}
</script>

<style scoped>
.add-funds-form {
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
