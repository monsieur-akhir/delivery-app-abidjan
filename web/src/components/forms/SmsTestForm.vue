<template>
  <div class="sms-test-form">
    <div class="form-group">
      <label for="phone-number" class="form-label"
        >Numéro de téléphone <span class="required">*</span></label
      >
      <input
        type="text"
        id="phone-number"
        v-model="formData.phone_number"
        class="form-input"
        placeholder="+225XXXXXXXX"
        required
      />
      <div class="form-hint">
        Entrez un numéro de téléphone au format international (ex: +225XXXXXXXX)
      </div>
    </div>

    <div class="form-group">
      <label for="variables" class="form-label">Variables (JSON)</label>
      <textarea
        id="variables"
        v-model="variablesJson"
        class="form-textarea"
        placeholder='{"user_name": "John Doe", "delivery_id": "12345"}'
        rows="4"
      ></textarea>
      <div class="form-hint">
        Entrez les variables au format JSON pour remplacer les placeholders dans le modèle
      </div>
      <div class="form-error" v-if="jsonError">
        {{ jsonError }}
      </div>
    </div>

    <div class="preview-section">
      <h3 class="preview-title">Aperçu du message</h3>
      <div class="sms-preview">
        <div class="sms-bubble">
          {{ previewContent }}
        </div>
      </div>
      <div class="character-count" :class="{ 'text-danger': contentLength > 160 }">
        {{ contentLength }}/160 caractères
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button type="button" class="btn btn-primary" @click="send" :disabled="!isFormValid">
        Envoyer le SMS
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'SmsTestForm',
  props: {
    template: {
      type: Object,
      default: null,
    },
  },
  emits: ['send', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      template_id: null,
      phone_number: '',
      variables: {},
      message: '',
    })

    const variablesJson = ref('{}')
    const jsonError = ref('')

    // Surveiller les changements dans le JSON des variables
    watch(variablesJson, newValue => {
      try {
        formData.value.variables = JSON.parse(newValue)
        jsonError.value = ''
      } catch (error) {
        jsonError.value = 'Format JSON invalide'
      }
    })

    const previewContent = computed(() => {
      if (!props.template) return ''

      let content = props.template.content

      try {
        const variables = JSON.parse(variablesJson.value)

        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{${key}}`, 'g')
          content = content.replace(regex, value)
        }

        // Remplacer les variables non définies par des placeholders
        content = content.replace(/{([^}]+)}/g, '[Variable $1]')

        return content
      } catch (error) {
        return content
      }
    })

    const contentLength = computed(() => {
      return previewContent.value.length
    })

    const isFormValid = computed(() => {
      return formData.value.phone_number.trim() !== '' && !jsonError.value
    })

    const initForm = () => {
      if (props.template) {
        formData.value.template_id = props.template.id
        formData.value.message = props.template.content
      }
    }

    const send = () => {
      if (!isFormValid.value) return

      const testData = { ...formData.value }
      emit('send', testData)
    }

    const cancel = () => {
      emit('cancel')
    }

    onMounted(() => {
      initForm()
    })

    return {
      formData,
      variablesJson,
      jsonError,
      previewContent,
      contentLength,
      isFormValid,
      send,
      cancel,
    }
  },
}
</script>

<style scoped>
.sms-test-form {
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
  font-family: monospace;
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
  margin-bottom: 0.5rem;
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

.character-count {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: right;
}

.text-danger {
  color: #ef4444;
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
