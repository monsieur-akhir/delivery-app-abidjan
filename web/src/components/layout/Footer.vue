<template>
  <footer class="footer">
    <div class="footer-content">
      <p>&copy; {{ new Date().getFullYear() }} Delivery App. Tous droits réservés.</p>
      <nav class="footer-nav">
        <a href="#">À propos</a>
        <a href="#">Conditions d'utilisation</a>
        <a href="#">Politique de confidentialité</a>
        <a href="#">Contact</a>
      </nav>
    </div>
  </footer>
</template>

<script>
import { computed } from 'vue'
import { APP_VERSION } from '@/config'

export default {
  name: 'Footer',
  setup() {
    const currentYear = computed(() => new Date().getFullYear())
    const appVersion = computed(() => APP_VERSION)

    return {
      currentYear,
      appVersion,
    }
  },
}
</script>

<style scoped>
.footer {
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  padding: 1rem 1.5rem;
  text-align: center;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-nav {
  display: flex;
  gap: 1rem;
}

.footer-nav a {
  color: #495057;
  text-decoration: none;
  font-size: 0.875rem;
}
</style>
