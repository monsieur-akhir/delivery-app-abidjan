<template>
  <div class="otp-verification-view">
    <h1 class="auth-title">Vérification OTP</h1>
    <p class="auth-subtitle">
      Veuillez entrer le code à 6 chiffres envoyé à votre téléphone
      <span class="phone-number">{{ hidePhoneNumber(phone) }}</span>
    </p>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <form @submit.prevent="verifyOTP" class="auth-form">
      <div class="otp-container">
        <div v-for="(digit, index) in otpDigits" :key="index" class="otp-input-container">
          <input
            ref="otpInputs"
            type="text"
            maxlength="1"
            class="otp-input"
            v-model="otpDigits[index]"
            :class="{ 'otp-input-filled': otpDigits[index] }"
            @input="handleInput(index)"
            @keydown="handleKeyDown($event, index)"
            @paste="handlePaste"
          />
        </div>
      </div>

      <div class="resend-container">
        <p v-if="countdown > 0">
          Renvoyer le code dans <span class="countdown">{{ countdown }}</span> secondes
        </p>
        <button
          v-else
          @click.prevent="resendOTP"
          type="button"
          class="btn-link"
          :disabled="loading"
        >
          Renvoyer le code
        </button>
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading || !isOtpComplete">
        <font-awesome-icon icon="spinner" spin v-if="loading" class="mr-1" />
        Vérifier
      </button>
    </form>

    <div class="auth-footer">
      <button @click="goBack" class="btn btn-outline btn-block">
        <font-awesome-icon icon="arrow-left" />
        Retour
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { verifyOTP as verifyOTPApi } from '@/api/auth'

export default {
  name: 'OTPVerificationView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const phone = ref(route.params.phone || '')
    const userId = ref(route.params.userId || '')
    const redirectPath = ref(route.query.redirect || '')
    const otpDigits = ref(['', '', '', '', '', ''])
    const otpInputs = ref([])
    const loading = ref(false)
    const error = ref(null)
    const countdown = ref(60)
    const timer = ref(null)

    const isOtpComplete = computed(() => {
      return otpDigits.value.every(digit => digit !== '')
    })

    const startCountdown = () => {
      clearInterval(timer.value)
      countdown.value = 60
      timer.value = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value -= 1
        } else {
          clearInterval(timer.value)
        }
      }, 1000)
    }

    const handleInput = index => {
      // Force les entrées à être uniquement des chiffres
      otpDigits.value[index] = otpDigits.value[index].replace(/[^0-9]/g, '')

      // Auto-avance au champ suivant quand un chiffre est entré
      if (otpDigits.value[index] && index < 5) {
        otpInputs.value[index + 1].focus()
      }
    }

    const handleKeyDown = (event, index) => {
      // Retour au champ précédent lors de l'appui sur Backspace avec un champ vide
      if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
        otpInputs.value[index - 1].focus()
      }
    }

    const handlePaste = event => {
      event.preventDefault()
      const pastedData = event.clipboardData.getData('text')
      const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6)

      digits.forEach((digit, index) => {
        if (index < 6) {
          otpDigits.value[index] = digit
        }
      })

      // Focus on the next empty input or the last input
      const nextEmptyIndex = otpDigits.value.findIndex(digit => !digit)
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        otpInputs.value[nextEmptyIndex].focus()
      } else if (otpDigits.value[5]) {
        otpInputs.value[5].focus()
      }
    }

    const hidePhoneNumber = phoneNumber => {
      if (!phoneNumber) return ''
      // Format: +XXX XX XXX XX XX -> +XXX XX XXX ** **
      const parts = phoneNumber.split(' ')
      if (parts.length >= 3) {
        const lastTwoParts = parts.slice(-2).map(() => '**')
        return [...parts.slice(0, -2), ...lastTwoParts].join(' ')
      }
      return phoneNumber.substring(0, phoneNumber.length - 4) + '****'
    }

    const verifyOTP = async () => {
      if (!isOtpComplete.value) return

      try {
        loading.value = true
        error.value = null

        const otpCode = otpDigits.value.join('')
        const response = await verifyOTPApi({
          phone: phone.value,
          otp: otpCode,
          user_id: userId.value,
        })

        if (response && response.access_token) {
          // Stockage du token et redirection
          localStorage.setItem('token', response.access_token)

          // Initialisation de l'authentification avec le nouveau token
          await authStore.initAuth()

          // Redirection en fonction du rôle ou de la redirection spécifiée
          const targetPath = redirectPath.value || getDefaultRedirect()
          router.push(targetPath)
        } else {
          error.value = 'La vérification a échoué. Veuillez réessayer.'
        }
      } catch (err) {
        error.value = err.message || "Une erreur s'est produite lors de la vérification du code."
      } finally {
        loading.value = false
      }
    }

    const resendOTP = async () => {
      try {
        loading.value = true
        error.value = null

        // Implémenter l'appel API pour renvoyer le code OTP
        // await resendOTPCode({ phone: phone.value });

        startCountdown()
        error.value = 'Un nouveau code a été envoyé à votre numéro.'
      } catch (err) {
        error.value = err.message || "Une erreur s'est produite lors de l'envoi du code."
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.back()
    }

    const getDefaultRedirect = () => {
      const userRole = authStore.userRole

      if (userRole === 'business') {
        return '/business'
      } else if (userRole === 'manager') {
        return '/manager'
      } else if (userRole === 'courier') {
        return '/courier'
      } else {
        return '/'
      }
    }

    onMounted(() => {
      if (!phone.value) {
        router.replace('/login')
        return
      }

      startCountdown()

      // Focus sur le premier input au chargement
      setTimeout(() => {
        if (otpInputs.value[0]) {
          otpInputs.value[0].focus()
        }
      }, 100)
    })

    onBeforeUnmount(() => {
      if (timer.value) {
        clearInterval(timer.value)
      }
    })

    return {
      phone,
      otpDigits,
      otpInputs,
      loading,
      error,
      countdown,
      isOtpComplete,
      handleInput,
      handleKeyDown,
      handlePaste,
      verifyOTP,
      resendOTP,
      goBack,
      hidePhoneNumber,
    }
  },
}
</script>

<style scoped>
.otp-verification-view {
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
  line-height: 1.6;
}

.phone-number {
  font-weight: 600;
  color: var(--primary-color);
}

.otp-container {
  display: flex;
  justify-content: space-between;
  margin: 2rem 0;
}

.otp-input-container {
  width: 50px;
  height: 60px;
}

.otp-input {
  width: 100%;
  height: 100%;
  font-size: 1.5rem;
  text-align: center;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
  transition: all 0.2s ease;
}

.otp-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
  outline: none;
}

.otp-input-filled {
  border-color: var(--primary-color);
  background-color: rgba(var(--primary-color-rgb), 0.05);
}

.resend-container {
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--text-secondary);
}

.countdown {
  font-weight: 600;
  color: var(--primary-color);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  text-decoration: underline;
}

.btn-link:hover {
  color: var(--primary-dark);
}

.btn-link:disabled {
  color: var(--text-secondary);
  cursor: not-allowed;
  text-decoration: none;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-block;
  font-weight: 500;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 4px;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  cursor: pointer;
}

.btn-primary {
  color: #fff;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-outline {
  color: var(--primary-color);
  background-color: transparent;
  border-color: var(--primary-color);
}

.btn-outline:hover {
  color: #fff;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-block {
  display: block;
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 2rem;
}

.auth-footer p {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.alert {
  position: relative;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 4px;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.mr-1 {
  margin-right: 0.25rem;
}
</style>
