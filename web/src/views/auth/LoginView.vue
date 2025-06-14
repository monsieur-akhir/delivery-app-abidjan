<template>
  <div class="login-view">
    <h1 class="auth-title">Connexion</h1>
    <p class="auth-subtitle">Connectez-vous à votre compte pour accéder à votre espace</p>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <form @submit.prevent="handleLogin" class="auth-form">
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
      </div>

      <div class="form-options">
        <div class="remember-me">
          <input type="checkbox" id="remember" v-model="formData.remember" />
          <label for="remember">Se souvenir de moi</label>
        </div>
        <router-link to="/forgot-password" class="forgot-password">
          Mot de passe oublié ?
        </router-link>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        <font-awesome-icon icon="spinner" spin v-if="loading" class="mr-1" />
        Se connecter
      </button>
    </form>

    <div class="auth-footer">
      <p>Vous n'avez pas de compte ?</p>
      <router-link to="/register" class="btn btn-outline btn-block"> Créer un compte </router-link>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const loading = ref(false)
    const error = ref(null)
    const showPassword = ref(false)

    const formData = reactive({
      phone: '',
      password: '',
      remember: false,
    })

    const handleLogin = async () => {
      try {
        loading.value = true
        error.value = null

        const result = await authStore.loginUser(formData)

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
                redirect: route.query.redirect,
              },
            })
          } else {
            // Rediriger vers la page demandée ou le tableau de bord approprié
            const redirectPath = route.query.redirect || getDefaultRedirect()
            router.push(redirectPath)
          }
        } else {
          error.value = result.error || 'Échec de la connexion. Veuillez vérifier vos identifiants.'
        }
      } catch (err) {
        error.value = err.message || "Une erreur s'est produite lors de la connexion."
      } finally {
        loading.value = false
      }
    }

    const getDefaultRedirect = () => {
      const userRole = authStore.userRole

      if (userRole === 'business') {
        return '/business'
      } else if (userRole === 'manager') {
        return '/manager'
      } else {
        return '/'
      }
    }

    return {
      formData,
      loading,
      error,
      showPassword,
      handleLogin,
    }
  },
}
</script>

<style scoped>
.login-view {
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  margin-right: 0.5rem;
}

.forgot-password {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.875rem;
}

.forgot-password:hover {
  text-decoration: underline;
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
