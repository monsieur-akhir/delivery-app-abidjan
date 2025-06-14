<template>
  <div class="register-view">
    <h1 class="auth-title">Créer un compte</h1>
    <p class="auth-subtitle">Rejoignez notre plateforme de livraison</p>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-group">
        <label for="full_name">Nom complet</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="user" class="input-icon" />
          <input
            type="text"
            id="full_name"
            v-model="formData.full_name"
            class="form-control"
            placeholder="Votre nom complet"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="phone">Numéro de téléphone</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="phone" class="input-icon" />
          <input
            type="tel"
            id="phone"
            v-model="formData.phone"
            class="form-control"
            placeholder="+225 XX XX XX XX XX"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email (optionnel)</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="envelope" class="input-icon" />
          <input
            type="email"
            id="email"
            v-model="formData.email"
            class="form-control"
            placeholder="Votre adresse email"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="role">Type de compte</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="user-tag" class="input-icon" />
          <select id="role" v-model="formData.role" class="form-control" required>
            <option value="">Sélectionnez un type de compte</option>
            <option value="business">Entreprise</option>
            <option value="courier">Coursier</option>
            <option value="client">Client</option>
          </select>
        </div>
      </div>

      <div class="form-group" v-if="formData.role === 'business'">
        <label for="business_name">Nom de l'entreprise</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="building" class="input-icon" />
          <input
            type="text"
            id="business_name"
            v-model="formData.business_name"
            class="form-control"
            placeholder="Nom de votre entreprise"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="commune">Commune</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="map-marker-alt" class="input-icon" />
          <select id="commune" v-model="formData.commune" class="form-control" required>
            <option value="">Sélectionnez votre commune</option>
            <option v-for="commune in communes" :key="commune" :value="commune">
              {{ commune }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="password">Mot de passe</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="lock" class="input-icon" />
          <input
            :type="showPassword ? 'text' : 'password'"
            id="password"
            v-model="formData.password"
            class="form-control"
            placeholder="Votre mot de passe"
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
            placeholder="Confirmez votre mot de passe"
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

      <div class="form-group terms-checkbox">
        <input type="checkbox" id="terms" v-model="formData.terms" required />
        <label for="terms">
          J'accepte les
          <router-link to="/terms" target="_blank">conditions d'utilisation</router-link> et la
          <router-link to="/privacy" target="_blank">politique de confidentialité</router-link>
        </label>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !canSubmit">
        <font-awesome-icon icon="spinner" spin v-if="loading" class="mr-1" />
        Créer mon compte
      </button>
    </form>

    <div class="auth-footer">
      <p>Vous avez déjà un compte ?</p>
      <router-link to="/login" class="btn btn-outline btn-block"> Se connecter </router-link>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { COMMUNES } from '@/config'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const loading = ref(false)
    const error = ref(null)
    const showPassword = ref(false)
    const communes = ref(COMMUNES)

    const formData = reactive({
      full_name: '',
      phone: '',
      email: '',
      role: '',
      business_name: '',
      commune: '',
      password: '',
      confirm_password: '',
      terms: false,
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
        formData.full_name &&
        formData.phone &&
        formData.role &&
        formData.commune &&
        formData.password &&
        formData.confirm_password &&
        passwordsMatch.value &&
        passwordStrength.value.score >= 2 &&
        formData.terms &&
        (formData.role !== 'business' || formData.business_name)
      )
    })

    // Réinitialiser le nom de l'entreprise si le rôle change
    watch(
      () => formData.role,
      newRole => {
        if (newRole !== 'business') {
          formData.business_name = ''
        }
      }
    )

    const handleRegister = async () => {
      if (!canSubmit.value) return

      try {
        loading.value = true
        error.value = null

        // Préparer les données d'inscription
        const userData = { ...formData }
        delete userData.confirm_password
        delete userData.terms

        const result = await authStore.registerUser(userData)

        if (result.success) {
          if (result.require_otp) {
            // Rediriger vers la page de vérification OTP
            router.push({
              name: 'otp-verification',
              params: {
                phone: result.phone,
                userId: result.user_id,
              },
              query: {
                redirect: '/login?registered=true',
              },
            })
          } else {
            // Rediriger vers la page de connexion avec un message de succès
            router.push({
              path: '/login',
              query: { registered: 'true' },
            })
          }
        } else {
          error.value = result.error || "Échec de l'inscription. Veuillez réessayer."
        }
      } catch (err) {
        error.value = err.message || "Une erreur s'est produite lors de l'inscription."
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      loading,
      error,
      showPassword,
      communes,
      passwordsMatch,
      passwordStrength,
      passwordStrengthClass,
      canSubmit,
      handleRegister,
    }
  },
}
</script>

<style scoped>
.register-view {
  max-width: 500px;
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

.terms-checkbox {
  display: flex;
  align-items: flex-start;
}

.terms-checkbox input {
  margin-right: 0.5rem;
  margin-top: 0.25rem;
}

.terms-checkbox label {
  font-size: 0.875rem;
  margin-bottom: 0;
}

.terms-checkbox a {
  color: var(--primary-color);
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

.auth-footer p {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}
</style>
