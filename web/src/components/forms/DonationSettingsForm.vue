<template>
  <div class="donation-settings-form">
    <div class="form-group">
      <label for="default-donation" class="form-label"
        >Pourcentage de don par défaut <span class="required">*</span></label
      >
      <div class="input-group">
        <input
          type="number"
          id="default-donation"
          v-model.number="formData.defaultDonationPercentage"
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
      <div class="form-hint">
        Pourcentage du supplément express reversé à des œuvres caritatives par défaut
      </div>
    </div>

    <div class="form-group">
      <label for="donation-options" class="form-label">Options de pourcentage de don</label>
      <div class="donation-options">
        <div
          v-for="(option, index) in formData.donationOptions"
          :key="index"
          class="donation-option"
        >
          <div class="input-group">
            <input
              type="number"
              v-model.number="formData.donationOptions[index]"
              class="form-input"
              min="0"
              max="100"
              step="5"
            />
            <div class="input-group-append">
              <span class="input-group-text">%</span>
            </div>
          </div>
          <button
            v-if="formData.donationOptions.length > 1"
            class="btn-icon"
            @click="removeDonationOption(index)"
            title="Supprimer"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn btn-sm btn-outline" @click="addDonationOption">
          <i class="fas fa-plus mr-1"></i>
          Ajouter une option
        </button>
      </div>
      <div class="form-hint">Options de pourcentage de don proposées aux clients</div>
    </div>

    <div class="form-group">
      <label for="charity-organizations" class="form-label">Organisations caritatives</label>
      <div class="charity-organizations">
        <div
          v-for="(org, index) in formData.charityOrganizations"
          :key="index"
          class="charity-organization"
        >
          <div class="charity-inputs">
            <input
              type="text"
              v-model="formData.charityOrganizations[index].name"
              class="form-input"
              placeholder="Nom de l'organisation"
            />
            <input
              type="text"
              v-model="formData.charityOrganizations[index].category"
              class="form-input"
              placeholder="Catégorie"
            />
          </div>
          <button
            v-if="formData.charityOrganizations.length > 1"
            class="btn-icon"
            @click="removeCharityOrganization(index)"
            title="Supprimer"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="btn btn-sm btn-outline" @click="addCharityOrganization">
          <i class="fas fa-plus mr-1"></i>
          Ajouter une organisation
        </button>
      </div>
      <div class="form-hint">Organisations caritatives bénéficiaires des dons</div>
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
  name: 'DonationSettingsForm',
  props: {
    settings: {
      type: Object,
      default: () => ({
        defaultDonationPercentage: 20,
        donationOptions: [10, 20, 30, 50, 100],
        charityOrganizations: [
          { name: 'Éducation Pour Tous', category: 'Éducation' },
          { name: 'Santé Communautaire', category: 'Santé' },
          { name: 'Planète Verte', category: 'Environnement' },
        ],
      }),
    },
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      defaultDonationPercentage: props.settings.defaultDonationPercentage,
      donationOptions: [...props.settings.donationOptions],
      charityOrganizations: props.settings.charityOrganizations.map(org => ({ ...org })),
    })

    const isValid = computed(() => {
      if (
        formData.value.defaultDonationPercentage < 0 ||
        formData.value.defaultDonationPercentage > 100
      ) {
        return false
      }

      if (formData.value.donationOptions.some(option => option < 0 || option > 100)) {
        return false
      }

      if (
        formData.value.charityOrganizations.some(org => !org.name.trim() || !org.category.trim())
      ) {
        return false
      }

      return true
    })

    const addDonationOption = () => {
      formData.value.donationOptions.push(0)
    }

    const removeDonationOption = index => {
      formData.value.donationOptions.splice(index, 1)
    }

    const addCharityOrganization = () => {
      formData.value.charityOrganizations.push({ name: '', category: '' })
    }

    const removeCharityOrganization = index => {
      formData.value.charityOrganizations.splice(index, 1)
    }

    const save = () => {
      if (!isValid.value) return

      emit('save', {
        defaultDonationPercentage: formData.value.defaultDonationPercentage,
        donationOptions: [...formData.value.donationOptions],
        charityOrganizations: formData.value.charityOrganizations.map(org => ({ ...org })),
      })
    }

    const cancel = () => {
      emit('cancel')
    }

    return {
      formData,
      isValid,
      addDonationOption,
      removeDonationOption,
      addCharityOrganization,
      removeCharityOrganization,
      save,
      cancel,
    }
  },
}
</script>

<style scoped>
.donation-settings-form {
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

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
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

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.donation-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.donation-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.charity-organizations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.charity-organization {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.charity-inputs {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
}

.btn-icon:hover {
  background-color: #f3f4f6;
  color: #ef4444;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #1f2937;
}

.btn-outline:hover {
  background-color: #f3f4f6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
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

.mr-1 {
  margin-right: 0.25rem;
}
</style>
