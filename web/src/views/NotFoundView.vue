<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <div class="not-found-image">
        <img src="@/assets/404.png" alt="Page non trouvée" />
      </div>
      <h1>404</h1>
      <h2>Page non trouvée</h2>
      <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
      <div class="not-found-actions">
        <router-link to="/" class="btn btn-primary">
          <font-awesome-icon icon="home" class="mr-1" />
          Retour à l'accueil
        </router-link>
        <button class="btn btn-outline" @click="goBack">
          <font-awesome-icon icon="arrow-left" class="mr-1" />
          Retour en arrière
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
  methods: {
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.not-found-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding: 2rem;
}

.not-found-content {
  max-width: 500px;
  text-align: center;
}

.not-found-image {
  max-width: 300px;
  margin: 0 auto 2rem;
}

.not-found-image img {
  width: 100%;
  height: auto;
}

h1 {
  font-size: 6rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 576px) {
  .not-found-actions {
    flex-direction: column;
  }
}
</style>
