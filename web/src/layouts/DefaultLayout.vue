<template>
  <div class="default-layout">
    <Header />
    <div class="content">
      <Sidebar 
        :is-collapsed="isSidebarCollapsed" 
        @toggle-sidebar="toggleSidebar" 
      />
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <Footer />
  </div>
</template>

<script>
import { ref } from 'vue'
import Header from "@/components/layout/Header.vue"
import Sidebar from "@/components/layout/Sidebar.vue"
import Footer from "@/components/layout/Footer.vue"

export default {
  components: {
    Header,
    Sidebar,
    Footer,
  },
  setup() {
    const isSidebarCollapsed = ref(false)
    
    // Vérifier si l'écran est petit au chargement
    if (window.innerWidth < 768) {
      isSidebarCollapsed.value = true
    }
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        isSidebarCollapsed.value = true
      }
    })
    
    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
    }
    
    return {
      isSidebarCollapsed,
      toggleSidebar
    }
  }
}
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: var(--background-secondary);
  overflow-y: auto;
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
  }
}
