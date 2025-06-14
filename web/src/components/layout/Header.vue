<template>
  <header class="header">
    <div class="header-left">
      <button class="menu-toggle" @click="toggleSidebar">
        <font-awesome-icon icon="bars" />
      </button>
      <div class="breadcrumb">
        <router-link to="/" class="breadcrumb-item">
          <font-awesome-icon icon="home" />
        </router-link>
        <span class="breadcrumb-separator" v-if="currentRoute.meta.breadcrumb">
          <font-awesome-icon icon="chevron-right" />
        </span>
        <span class="breadcrumb-item active" v-if="currentRoute.meta.breadcrumb">
          {{ currentRoute.meta.breadcrumb }}
        </span>
      </div>
    </div>
    <div class="header-right">
      <NotificationBell />
      <div class="user-dropdown">
        <button class="user-button" @click="toggleDropdown">
          <div class="user-avatar">
            <img
              v-if="currentUser && currentUser.profile_picture"
              :src="currentUser.profile_picture"
              :alt="currentUser.name"
            />
            <div v-else class="avatar-placeholder">{{ getInitials(currentUser?.name) }}</div>
          </div>
          <span class="user-name">{{ currentUser?.name }}</span>
          <font-awesome-icon icon="caret-down" />
        </button>
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <router-link to="/profile" class="dropdown-item">
            <font-awesome-icon icon="user" class="mr-1" />
            Profil
          </router-link>
          <button class="dropdown-item" @click="logout">
            <font-awesome-icon icon="sign-out-alt" class="mr-1" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import { formatRelativeTime } from '@/utils/formatters'
import { USER_ROLES } from '@/config'

export default {
  name: 'AppHeader',
  components: {
    NotificationBell,
  },
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['toggle-sidebar'],
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const isDropdownOpen = ref(false)

    const currentRoute = computed(() => route)
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const isDarkMode = computed(() => store.getters['theme/isDarkMode'])
    const notifications = computed(() => store.getters['notification/notifications'])
    const unreadNotifications = computed(() => store.getters['notification/unreadCount'])

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value
    }

    const logout = async () => {
      try {
        await store.dispatch('auth/logout')
        router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const toggleSidebar = () => {
      // Implémenter la logique pour afficher/masquer la barre latérale
      console.log('Toggle sidebar')
    }

    const getInitials = name => {
      if (!name) return ''

      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }

    const handleClickOutside = event => {
      if (isDropdownOpen.value && !event.target.closest('.user-dropdown')) {
        isDropdownOpen.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    watch(route, () => {
      isDropdownOpen.value = false
    })

    return {
      currentRoute,
      currentUser,
      isDarkMode,
      notifications,
      unreadNotifications,
      isDropdownOpen,
      toggleDropdown,
      logout,
      toggleSidebar,
      getInitials,
    }
  },
}
</script>

<style scoped>
.header {
  background-color: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-toggle {
  background: none;
  border: none;
  color: #495057;
  cursor: pointer;
  font-size: 1.25rem;
  margin-right: 1rem;
  transition: background-color 0.2s;
}

.menu-toggle:hover {
  background-color: #f8f9fa;
}

.breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  color: #495057;
  text-decoration: none;
}

.breadcrumb-item:hover {
  color: #0056b3;
}

.breadcrumb-item.active {
  color: #6c757d;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: #6c757d;
  font-size: 0.75rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-dropdown {
  position: relative;
}

.user-button {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #495057;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f8f9fa;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  background-color: #0056b3;
}

.user-name {
  font-weight: 500;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1.5rem;
  color: #495057;
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #0056b3;
}

@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
  }
}
</style>