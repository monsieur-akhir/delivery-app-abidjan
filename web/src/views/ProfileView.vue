<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>Mon profil</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="isEditing = !isEditing">
          <font-awesome-icon :icon="isEditing ? 'times' : 'edit'" class="mr-1" />
          {{ isEditing ? 'Annuler' : 'Modifier' }}
        </button>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-sidebar">
        <div class="profile-avatar">
          <img v-if="user.profile_picture" :src="user.profile_picture" :alt="user.full_name" />
          <div v-else class="avatar-placeholder">{{ userInitials }}</div>
          <div class="avatar-overlay" v-if="isEditing">
            <label for="avatar-upload" class="avatar-upload-label">
              <font-awesome-icon icon="camera" />
              <span>Changer</span>
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              @change="handleAvatarChange"
              class="avatar-upload-input"
            />
          </div>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{{ user.full_name }}</h2>
          <div class="profile-role">{{ getUserRoleLabel(user.role) }}</div>
          <div class="profile-status" :class="getStatusClass(user.status)">
            {{ getUserStatusLabel(user.status) }}
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-value">{{ userStats.deliveries || 0 }}</div>
            <div class="stat-label">Livraisons</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ userStats.rating || '0.0' }}</div>
            <div class="stat-label">Note moyenne</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatDate(user.created_at) }}</div>
            <div class="stat-label">Membre depuis</div>
          </div>
        </div>
      </div>

      <div class="profile-details">
        <div v-if="!isEditing" class="profile-section">
          <h3 class="section-title">Informations personnelles</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nom complet</div>
              <div class="info-value">{{ user.full_name }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Téléphone</div>
              <div class="info-value">{{ formatPhoneNumber(user.phone) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">{{ user.email || 'Non renseigné' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Commune</div>
              <div class="info-value">{{ user.commune || 'Non renseignée' }}</div>
            </div>
          </div>
        </div>

        <form v-else class="profile-form" @submit.prevent="saveProfile">
          <h3 class="section-title">Modifier mes informations</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="full_name">Nom complet</label>
              <input
                type="text"
                id="full_name"
                v-model="formData.full_name"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label for="phone">Téléphone</label>
              <input type="tel" id="phone" v-model="formData.phone" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="formData.email" class="form-control" />
            </div>
            <div class="form-group">
              <label for="commune">Commune</label>
              <select id="commune" v-model="formData.commune" class="form-control">
                <option value="">Sélectionner une commune</option>
                <option v-for="commune in communes" :key="commune" :value="commune">
                  {{ commune }}
                </option>
              </select>
            </div>
          </div>

          <h3 class="section-title">Changer mon mot de passe</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="current_password">Mot de passe actuel</label>
              <input
                type="password"
                id="current_password"
                v-model="passwordData.current_password"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="new_password">Nouveau mot de passe</label>
              <input
                type="password"
                id="new_password"
                v-model="passwordData.new_password"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="confirm_password">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirm_password"
                v-model="passwordData.confirm_password"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="isEditing = false">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <font-awesome-icon icon="spinner" spin v-if="isSubmitting" class="mr-1" />
              Enregistrer
            </button>
          </div>
        </form>

        <div class="profile-section">
          <h3 class="section-title">Activité récente</h3>
          <div class="activity-list">
            <div v-if="userActivity.length === 0" class="empty-activity">
              <font-awesome-icon icon="history" size="2x" />
              <p>Aucune activité récente</p>
            </div>
            <div v-else v-for="activity in userActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="getActivityIconClass(activity.type)">
                <font-awesome-icon :icon="getActivityIcon(activity.type)" />
              </div>
              <div class="activity-content">
                <div class="activity-message">{{ activity.message }}</div>
                <div class="activity-time">{{ formatRelativeTime(activity.date) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { updateProfile, changePassword } from '@/api/auth'
import { formatDate, formatPhoneNumber, formatRelativeTime } from '@/utils/formatters'
import { USER_ROLES, USER_STATUSES, COMMUNES } from '@/config'

export default {
  name: 'ProfileView',
  setup() {
    const authStore = useAuthStore()

    const isEditing = ref(false)
    const isSubmitting = ref(false)

    const user = computed(() => authStore.user || {})
    const userInitials = computed(() => authStore.userInitials)

    // Données de formulaire
    const formData = reactive({
      full_name: user.value?.full_name || '',
      phone: user.value?.phone || '',
      email: user.value?.email || '',
      commune: user.value?.commune || '',
    })

    const passwordData = reactive({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })

    // Statistiques utilisateur (simulées)
    const userStats = reactive({
      deliveries: 24,
      rating: 4.8,
    })

    // Activité récente (simulée)
    const userActivity = ref([
      {
        id: 1,
        type: 'delivery',
        message: 'Livraison #123 terminée avec succès',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: 2,
        type: 'payment',
        message: 'Paiement de 5000 FCFA reçu',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        id: 3,
        type: 'rating',
        message: 'Vous avez reçu une évaluation 5 étoiles',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      },
    ])

    // Liste des communes
    const communes = ref(COMMUNES)

    // Gérer le changement d'avatar
    const handleAvatarChange = event => {
      const file = event.target.files[0]
      if (!file) return

      // Simuler le téléchargement
      const reader = new FileReader()
      reader.onload = e => {
        // Dans une application réelle, vous téléchargeriez le fichier sur le serveur
        console.log('Avatar changed:', file.name)
      }
      reader.readAsDataURL(file)
    }

    // Enregistrer le profil
    const saveProfile = async () => {
      if (isSubmitting.value) return

      // Valider le formulaire
      if (!formData.full_name || !formData.phone) {
        alert('Veuillez remplir tous les champs obligatoires')
        return
      }

      // Valider le mot de passe si modifié
      if (
        passwordData.current_password ||
        passwordData.new_password ||
        passwordData.confirm_password
      ) {
        if (!passwordData.current_password) {
          alert('Veuillez saisir votre mot de passe actuel')
          return
        }

        if (!passwordData.new_password) {
          alert('Veuillez saisir un nouveau mot de passe')
          return
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
          alert('Les mots de passe ne correspondent pas')
          return
        }
      }

      isSubmitting.value = true

      try {
        // Mettre à jour le profil
        await updateProfile(formData)

        // Mettre à jour le mot de passe si nécessaire
        if (passwordData.current_password && passwordData.new_password) {
          await changePassword({
            current_password: passwordData.current_password,
            new_password: passwordData.new_password,
          })

          // Réinitialiser les champs de mot de passe
          passwordData.current_password = ''
          passwordData.new_password = ''
          passwordData.confirm_password = ''
        }

        // Mettre à jour les données utilisateur dans le store
        await authStore.fetchUserProfile()

        // Désactiver le mode édition
        isEditing.value = false

        alert('Profil mis à jour avec succès')
      } catch (error) {
        alert(`Erreur lors de la mise à jour du profil: ${error.message}`)
      } finally {
        isSubmitting.value = false
      }
    }

    // Obtenir le libellé du rôle utilisateur
    const getUserRoleLabel = role => {
      return USER_ROLES[role]?.label || role
    }

    // Obtenir le libellé du statut utilisateur
    const getUserStatusLabel = status => {
      return USER_STATUSES[status]?.label || status
    }

    // Obtenir la classe CSS pour le statut
    const getStatusClass = status => {
      return `status-${status}`
    }

    // Obtenir l'icône pour le type d'activité
    const getActivityIcon = type => {
      const icons = {
        delivery: 'truck',
        payment: 'money-bill',
        rating: 'star',
        system: 'info-circle',
        user: 'user',
        default: 'history',
      }

      return icons[type] || icons.default
    }

    // Obtenir la classe CSS pour l'icône d'activité
    const getActivityIconClass = type => {
      const classes = {
        delivery: 'icon-delivery',
        payment: 'icon-payment',
        rating: 'icon-rating',
        system: 'icon-system',
        user: 'icon-user',
        default: '',
      }

      return classes[type] || classes.default
    }

    return {
      user,
      userInitials,
      userStats,
      userActivity,
      isEditing,
      isSubmitting,
      formData,
      passwordData,
      communes,
      handleAvatarChange,
      saveProfile,
      getUserRoleLabel,
      getUserStatusLabel,
      getStatusClass,
      getActivityIcon,
      getActivityIconClass,
      formatDate,
      formatPhoneNumber,
      formatRelativeTime,
    }
  },
}
</script>

<style scoped>
.profile-page {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.profile-sidebar {
  background-color: var(--card-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.profile-avatar {
  width: 100%;
  height: 200px;
  position: relative;
  background-color: var(--background-secondary);
}

.profile-avatar img {
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
  background-color: var(--primary-color);
  color: white;
  font-size: 4rem;
  font-weight: 600;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  cursor: pointer;
}

.avatar-upload-label svg {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.avatar-upload-input {
  display: none;
}

.profile-info {
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}

.profile-role {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.profile-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-active {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.status-inactive {
  background-color: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.status-suspended {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--danger-color);
}

.status-pending_verification {
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--warning-color);
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 1rem;
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-section {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  padding: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: var(--text-color);
}

.profile-form {
  background-color: var(--card-background);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-activity {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-activity svg {
  margin-bottom: 0.5rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: var(--background-secondary);
  border-radius: 8px;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.icon-delivery {
  background-color: rgba(255, 107, 0, 0.1);
  color: var(--primary-color);
}

.icon-payment {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.icon-rating {
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--warning-color);
}

.icon-system {
  background-color: rgba(33, 150, 243, 0.1);
  color: var(--info-color);
}

.icon-user {
  background-color: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}

.activity-content {
  flex: 1;
}

.activity-message {
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

@media (max-width: 992px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .info-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>