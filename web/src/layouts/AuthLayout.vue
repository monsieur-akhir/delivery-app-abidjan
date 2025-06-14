<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-logo">
        <img src="@/assets/logo.png" alt="Livraison Abidjan" />
        <h1>Livraison Abidjan</h1>
      </div>
      <div class="auth-card">
        <router-view />
      </div>
      <div class="auth-footer">
        <p>&copy; {{ currentYear }} Livraison Abidjan. Tous droits réservés.</p>
        <div class="auth-links">
          <router-link to="/terms">Conditions d'utilisation</router-link>
          <span class="separator">|</span>
          <router-link to="/privacy">Politique de confidentialité</router-link>
        </div>
      </div>
    </div>
    <div class="auth-background">
      <div class="auth-overlay"></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AuthLayout',
  setup() {
    const currentYear = computed(() => new Date().getFullYear())

    return {
      currentYear,
    }
  },
}
</script>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.auth-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 2;
  max-width: 500px;
  margin: 0 auto;
}

.auth-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.auth-logo img {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.auth-logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
}

.auth-card {
  width: 100%;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  padding: 2rem;
  margin-bottom: 2rem;
}

.auth-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.auth-links {
  margin-top: 0.5rem;
}

.auth-links a {
  color: var(--text-secondary);
  text-decoration: none;
}

.auth-links a:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.separator {
  margin: 0 0.5rem;
}

.auth-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('@/assets/abidjan-background.jpg');
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.auth-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1;
}

@media (max-width: 768px) {
  .auth-container {
    padding: 1rem;
  }

  .auth-card {
    padding: 1.5rem;
  }
}
</style>
