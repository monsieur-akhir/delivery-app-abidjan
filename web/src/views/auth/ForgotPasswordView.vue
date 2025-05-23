<template>
  <div class="forgot-password-view">
    <h1 class="auth-title">Mot de passe oublié</h1>
    <p class="auth-subtitle">Entrez votre numéro de téléphone pour réinitialiser votre mot de passe</p>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="success" class="alert alert-success">
      {{ success }}
    </div>

    <form @submit.prevent="handleSubmit" class="auth-form" v-if="!success">
      <div class="form-group">
        <label for="phone">Numéro de téléphone</label>
        <div class="input-with-icon">
          <font-awesome-icon icon="phone" class="input-icon" />
          <input 
            type="tel" 
            id="phone" 
            v-model="phone" 
            class="form-control" 
            placeholder="+225 XX XX XX XX XX" 
            required
          />
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        <font-awesome-icon icon="spinner" spin v-if="loading" class="mr-1" />
        Réinitialiser le mot de passe
      </button>
    </form>

    <div class="auth-footer">
      <p>Vous vous souvenez de votre mot de passe ?</p>
      <router-link to="/login" class="btn btn-outline btn-block">
        Retour à la connexion
      </router-link>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { forgotPassword } from '@/api/auth'

export default {
  name: 'ForgotPasswordView',
  setup() {
    const phone = ref('')
    const loading = ref(false)
    const error = ref(null)
    const success = ref(null)
    
    const handleSubmit = async () => {
      try {
        loading.value = true
        error.value = null
        success.value = null
        
        // Appeler l'API pour demander la réinitialisation du mot de passe
        await forgotPassword(phone.value)
        
        // Afficher un message de succès
        success.value = "Un SMS avec les instructions de réinitialisation a été envoyé à votre numéro de téléphone."
        
        // Réinitialiser le formulaire
        phone.value = ''
      } catch (err) {
        error.value = err.message || "Une erreur s'est produite. Veuillez réessayer."
      } finally {
        loading.value = false
      }
    }
    
    return {
      phone,
      loading,
      error,
      success,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.forgot-password-view {
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
