<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <span class="app-name">Delivery App</span>
    </div>

    <nav class="nav-links">
      <router-link
        v-for="link in navLinks"
        :key="link.name"
        :to="link.path"
        class="nav-link"
        active-class="active"
      >
        <font-awesome-icon :icon="link.icon" class="nav-icon" />
        <span>{{ link.label }}</span>
      </router-link>
      <!-- Ajouter ces éléments de menu dans la section du manager -->
      <li v-if="userRole === 'manager'" class="nav-item">
        <router-link to="/manager/vehicles" class="nav-link" active-class="active">
          <i class="fas fa-truck"></i>
          <span>Gestion des véhicules</span>
        </router-link>
      </li>
      <li v-if="userRole === 'manager'" class="nav-item">
        <router-link to="/manager/transport-rules" class="nav-link" active-class="active">
          <i class="fas fa-cogs"></i>
          <span>Règles de transport</span>
        </router-link>
      </li>
    </nav>
  </aside>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'Sidebar',
  setup() {
    const store = useStore()

    const userRole = computed(() => store.getters['auth/currentRole'])

    const navLinks = computed(() => {
      if (userRole.value === 'manager') {
        return [
          {
            name: 'manager-dashboard',
            path: '/manager/dashboard',
            label: 'Tableau de bord',
            icon: 'chart-line',
          },
          { name: 'manager-users', path: '/manager/users', label: 'Utilisateurs', icon: 'users' },
          {
            name: 'manager-couriers',
            path: '/manager/couriers',
            label: 'Coursiers',
            icon: 'truck',
          },
          {
            name: 'manager-businesses',
            path: '/manager/businesses',
            label: 'Entreprises',
            icon: 'store',
          },
          {
            name: 'manager-deliveries',
            path: '/manager/deliveries',
            label: 'Livraisons',
            icon: 'shipping-fast',
          },
          {
            name: 'manager-finances',
            path: '/manager/finances',
            label: 'Finances',
            icon: 'money-bill',
          },
          {
            name: 'manager-reports',
            path: '/manager/reports',
            label: 'Rapports',
            icon: 'file-alt',
          },
          {
            name: 'manager-promotions',
            path: '/manager/promotions',
            label: 'Promotions',
            icon: 'tags',
          },
          {
            name: 'manager-notifications',
            path: '/manager/notifications',
            label: 'Notifications',
            icon: 'bell',
          },
          {
            name: 'manager-analytics',
            path: '/manager/analytics',
            label: 'Analytique',
            icon: 'chart-pie',
          },
          { name: 'manager-settings', path: '/manager/settings', label: 'Paramètres', icon: 'cog' },
          { name: 'manager-zones', path: '/manager/zones', label: 'Zones', icon: 'map-marked-alt' },
          {
            name: 'manager-vehicles',
            path: '/manager/vehicles',
            label: 'Gestion des véhicules',
            icon: 'truck',
          },
          {
            name: 'manager-transport-rules',
            path: '/manager/transport-rules',
            label: 'Règles de transport',
            icon: 'cogs',
          },
        ]
      } else if (userRole.value === 'business') {
        return [
          {
            name: 'business-dashboard',
            path: '/business/dashboard',
            label: 'Tableau de bord',
            icon: 'chart-line',
          },
          {
            name: 'business-deliveries',
            path: '/business/deliveries',
            label: 'Livraisons',
            icon: 'shipping-fast',
          },
          {
            name: 'business-couriers',
            path: '/business/couriers',
            label: 'Coursiers',
            icon: 'truck',
          },
          {
            name: 'business-finances',
            path: '/business/finances',
            label: 'Finances',
            icon: 'money-bill',
          },
          {
            name: 'business-marketplace',
            path: '/business/marketplace',
            label: 'Marketplace',
            icon: 'store',
          },
          {
            name: 'business-complaints',
            path: '/business/complaints',
            label: 'Plaintes',
            icon: 'exclamation-triangle',
          },
          {
            name: 'business-settings',
            path: '/business/settings',
            label: 'Paramètres',
            icon: 'cog',
          },
          { name: 'business-profile', path: '/business/profile', label: 'Profil', icon: 'user' },
        ]
      } else {
        return []
      }
    })

    return {
      navLinks,
      userRole,
    }
  },
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.logo {
  width: 40px;
  margin-right: 1rem;
}

.app-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #495057;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: #e9ecef;
  color: #0056b3;
}

.nav-link.active {
  background-color: #0056b3;
  color: white;
}

.nav-icon {
  margin-right: 0.75rem;
  width: 16px;
}

.nav-item {
  list-style-type: none;
}
</style>
