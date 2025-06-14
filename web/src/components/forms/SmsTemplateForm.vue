<template>
  <div class="sms-template-form">
    <div class="form-group">
      <label for="name" class="form-label">Nom <span class="required">*</span></label>
      <input
        type="text"
        id="name"
        v-model="formData.name"
        class="form-input"
        placeholder="Nom du modèle"
        required
      />
    </div>

    <div class="form-group">
      <label for="event-type" class="form-label"
        >Type d'événement <span class="required">*</span></label
      >
      <select id="event-type" v-model="formData.event_type" class="form-select">
        <option value="delivery_created">Création de livraison</option>
        <option value="delivery_accepted">Acceptation de livraison</option>
        <option value="delivery_picked_up">Prise en charge</option>
        <option value="delivery_completed">Livraison terminée</option>
        <option value="delivery_delayed">Livraison retardée</option>
        <option value="payment_received">Paiement reçu</option>
        <option value="account_suspended">Compte suspendu</option>
        <option value="critical_alert">Alerte critique</option>
      </select>
    </div>

    <div class="form-group">
      <label for="content" class="form-label"
        >Contenu du message <span class="required">*</span></label
      >
      <textarea
        id="content"
        v-model="formData.content"
        class="form-textarea"
        placeholder="Contenu du message SMS"
        rows="5"
        required
      ></textarea>
      <div class="form-hint">
        Utilisez {variable} pour les variables dynamiques. Ex: {user_name}, {delivery_id}
      </div>
      <div class="character-count" :class="{ 'text-danger': contentLength > 160 }">
        {{ contentLength }}/160 caractères
      </div>
    </div>

    <div class="form-group">
      <label for="priority" class="form-label">Priorité <span class="required">*</span></label>
      <select id="priority" v-model="formData.priority" class="form-select">
        <option value="low">Basse</option>
        <option value="normal">Normale</option>
        <option value="high">Haute</option>
        <option value="critical">Critique</option>
      </select>
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
        Le modèle doit s'appliquer à au moins un type d'utilisateur
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

    <div class="preview-section">
      <h3 class="preview-title">Aperçu du message</h3>
      <div class="sms-preview">
        <div class="sms-bubble">
          {{ formData.content }}
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button type="button" class="btn btn-primary" @click="save" :disabled="!isFormValid">
        {{ isEditing ? 'Mettre à jour' : 'Créer' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'SmsTemplateForm',
  props: {
    template: {
      type: Object,
      default: null,
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      name: '',
      event_type: 'delivery_created',
      content: '',
      priority: 'normal',
      active: true,
      applies_to: {
        clients: true,
        couriers: false,
        businesses: false,
      },
    })

    const isEditing = computed(() => !!props.template?.id)

    const contentLength = computed(() => {
      return formData.value.content.length
    })

    const isAppliesValid = computed(() => {
      return (
        formData.value.applies_to.clients ||
        formData.value.applies_to.couriers ||
        formData.value.applies_to.businesses
      )
    })

    const isFormValid = computed(() => {
      return (
        formData.value.name.trim() !== '' &&
        formData.value.content.trim() !== '' &&
        isAppliesValid.value
      )
    })

    const initForm = () => {
      if (props.template) {
        formData.value = { ...props.template }
      }
    }

    const save = () => {
      if (!isFormValid.value) return

      const templateData = { ...formData.value }
      emit('save', templateData)
    }

    const cancel = () => {
      emit('cancel')
    }

    onMounted(() => {
      initForm()
    })

    return {
      formData,
      isEditing,
      contentLength,
      isAppliesValid,
      isFormValid,
      save,
      cancel,
    }
  },
}
</script>

<style scoped>
.sms-template-form {
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

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.character-count {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
  text-align: right;
}

.text-danger {
  color: #ef4444;
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

.preview-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.sms-preview {
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  padding: 1rem;
}

.sms-bubble {
  background-color: #10b981;
  color: white;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  max-width: 80%;
  margin-left: auto;
  word-break: break-word;
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
