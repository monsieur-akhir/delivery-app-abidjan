<template>
  <div class="reset-password-view">
    <h1 class="auth-title">Réinitialiser le mot de passe</h1>
    <p class="auth-subtitle">Créez un nouveau mot de passe pour votre compte</p>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="success" class="alert alert-success">
      {{ success }}
      <div class="mt-3">
        <router-link to="/login" class="btn btn-primary btn-block">
          Retour à la connexion
        </router-link>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form" v-if="!success">
      <div class="form-group">
        <label for="password">Nouveau mot de passe</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="lock" class="input-icon" />
          <input
            :type="showPassword ? 'text' : 'password'"
            id="password"
            v-model="formData.password"
            class="form-control"
            placeholder="Votre nouveau mot de passe"
            required
          />
          <button type="button" class="password-toggle" @click="showPassword = !showPassword">
            <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
          </button>
        </div>
        <div class="password-strength" v-if="formData.password">
          <div class="strength-bar">
            <div
              class="strength-progress"
              :style="{ width: passwordStrength.score * 25 + '%' }"
              :class="passwordStrengthClass"
            ></div>
          </div>
          <div class="strength-text" :class="passwordStrengthClass">
            {{ passwordStrength.message }}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="confirm_password">Confirmer le mot de passe</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="lock" class="input-icon" />
          <input
            :type="showPassword ? 'text' : 'password'"
            id="confirm_password"
            v-model="formData.confirm_password"
            class="form-control"
            placeholder="Confirmez votre nouveau mot de passe"
            required
          />
        </div>
        <div class="password-match" v-if="formData.password && formData.confirm_password">
          <font-awesome-icon
            :icon="passwordsMatch ? 'check' : 'times'"
            :class="passwordsMatch ? 'text-success' : 'text-danger'"
          />
          <span :class="passwordsMatch ? 'text-success' : 'text-danger'">
            {{
              passwordsMatch
                ? 'Les mots de passe correspondent'
                : 'Les mots de passe ne correspondent pas'
            }}
          </span>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !canSubmit">
        <font-awesome-icon icon="spinner" spin v-if="loading" class="mr-1" />
        Réinitialiser le mot de passe
      </button>
    </form>

    <div class="auth-footer" v-if="!success">
      <router-link to="/login" class="btn btn-outline btn-block">
        Retour à la connexion
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { resetPassword } from '@/api/auth'

export default {
  name: 'ResetPasswordView',
  setup() {
    const route = useRoute()
    const token = route.params.token

    const loading = ref(false)
    const error = ref(null)
    const success = ref(null)
    const showPassword = ref(false)

    const formData = reactive({
      password: '',
      confirm_password: '',
    })

    const passwordsMatch = computed(() => {
      return formData.password === formData.confirm_password
    })

    const passwordStrength = computed(() => {
      if (!formData.password) {
        return { score: 0, message: '' }
      }

      let score = 0
      let message = 'Très faible'

      // Longueur minimale
      if (formData.password.length >= 8) score++

      // Contient des chiffres
      if (/\d/.test(formData.password)) score++

      // Contient des lettres minuscules et majuscules
      if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) score++

      // Contient des caractères spéciaux
      if (/[^a-zA-Z0-9]/.test(formData.password)) score++

      if (score === 1) message = 'Faible'
      else if (score === 2) message = 'Moyen'
      else if (score === 3) message = 'Fort'
      else if (score === 4) message = 'Très fort'

      return { score, message }
    })

    const passwordStrengthClass = computed(() => {
      const score = passwordStrength.value.score
      if (score <= 1) return 'strength-weak'
      if (score === 2) return 'strength-medium'
      if (score === 3) return 'strength-good'
      return 'strength-strong'
    })

    const canSubmit = computed(() => {
      return (
        formData.password &&
        formData.confirm_password &&
        passwordsMatch.value &&
        passwordStrength.value.score >= 2
      )
    })

    const handleSubmit = async () => {
      if (!canSubmit.value) return

      try {
        loading.value = true
        error.value = null

        // Appeler l'API pour réinitialiser le mot de passe
        await resetPassword({
          token,
          password: formData.password,
        })

        // Afficher un message de succès
        success.value =
          'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'

        // Réinitialiser le formulaire
        formData.password = ''
        formData.confirm_password = ''
      } catch (err) {
        error.value = err.message || "Une erreur s'est produite. Veuillez réessayer."
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      loading,
      error,
      success,
      showPassword,
      passwordsMatch,
      passwordStrength,
      passwordStrengthClass,
      canSubmit,
      handleSubmit,
    }
  },
}
</script>

<style scoped>
.reset-password-view {
  max-width: 400px;
  margin: 0 auto;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  text-align: center;
}

.auth-subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  text-align: center;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
  background-clip: padding-box;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(255, 107, 0, 0.25);
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  background-color: var(--background-secondary);
  border-radius: 2px;
  margin-bottom: 0.25rem;
}

.strength-progress {
  height: 100%;
  border-radius: 2px;
}

.strength-text {
  font-size: 0.75rem;
}

.strength-weak {
  background-color: #f44336;
  color: #f44336;
}

.strength-medium {
  background-color: #ffc107;
  color: #ffc107;
}

.strength-good {
  background-color: #4caf50;
  color: #4caf50;
}

.strength-strong {
  background-color: #2196f3;
  color: #2196f3;
}

.password-match {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-block {
  display: block;
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}
</style>
