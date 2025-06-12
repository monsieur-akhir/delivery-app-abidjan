` tags, ensuring indentation and structure are preserved. I will avoid any forbidden words or placeholders.

```
<replit_final_file>
<template>
  <div class="settings-view">
    <div class="header">
      <h1>{{ $t('settings.title') }}</h1>
      <div class="header-actions">
        <button @click="saveSettings" class="btn btn-primary" :disabled="saving">
          <i class="fas fa-save" :class="{ 'fa-spin': saving }"></i>
          {{ $t('settings.save') }}
        </button>
        <button @click="resetSettings" class="btn btn-outline">
          <i class="fas fa-undo"></i>
          {{ $t('settings.reset') }}
        </button>
      </div>
    </div>

    <!-- Navigation des onglets -->
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
      >
        <i :class="tab.icon"></i>
        {{ $t(tab.label) }}
      </button>
    </div>

    <div class="settings-content">
      <!-- Onglet Général -->
      <div v-if="activeTab === 'general'" class="settings-section">
        <h2>{{ $t('settings.general.title') }}</h2>

        <div class="settings-grid">
          <div class="setting-group">
            <h3>{{ $t('settings.general.platform') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.general.platformName') }}</label>
              <input v-model="settings.platform_name" type="text" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.general.platformDescription') }}</label>
              <textarea v-model="settings.platform_description" class="form-textarea"></textarea>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.general.supportEmail') }}</label>
              <input v-model="settings.support_email" type="email" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.general.supportPhone') }}</label>
              <input v-model="settings.support_phone" type="tel" class="form-input" />
            </div>
          </div>

          <div class="setting-group">
            <h3>{{ $t('settings.general.features') }}</h3>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_real_time_tracking" 
                type="checkbox" 
                id="real-time-tracking"
              />
              <label for="real-time-tracking">{{ $t('settings.general.enableRealTimeTracking') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_sms_notifications" 
                type="checkbox" 
                id="sms-notifications"
              />
              <label for="sms-notifications">{{ $t('settings.general.enableSmsNotifications') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_auto_assignment" 
                type="checkbox" 
                id="auto-assignment"
              />
              <label for="auto-assignment">{{ $t('settings.general.enableAutoAssignment') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_express_delivery" 
                type="checkbox" 
                id="express-delivery"
              />
              <label for="express-delivery">{{ $t('settings.general.enableExpressDelivery') }}</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Livraisons -->
      <div v-if="activeTab === 'delivery'" class="settings-section">
        <h2>{{ $t('settings.delivery.title') }}</h2>

        <div class="settings-grid">
          <div class="setting-group">
            <h3>{{ $t('settings.delivery.pricing') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.basePricePerKm') }}</label>
              <div class="input-group">
                <input v-model="settings.base_price_per_km" type="number" step="0.01" class="form-input" />
                <span class="input-suffix">XOF/km</span>
              </div>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.minimumPrice') }}</label>
              <div class="input-group">
                <input v-model="settings.minimum_price" type="number" class="form-input" />
                <span class="input-suffix">XOF</span>
              </div>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.expressSurcharge') }}</label>
              <div class="input-group">
                <input v-model="settings.express_surcharge" type="number" class="form-input" />
                <span class="input-suffix">XOF</span>
              </div>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.platformCommission') }}</label>
              <div class="input-group">
                <input v-model="settings.platform_commission" type="number" step="0.01" max="100" class="form-input" />
                <span class="input-suffix">%</span>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h3>{{ $t('settings.delivery.timeouts') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.maxAssignmentRadius') }}</label>
              <div class="input-group">
                <input v-model="settings.max_assignment_radius" type="number" class="form-input" />
                <span class="input-suffix">km</span>
              </div>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.assignmentTimeout') }}</label>
              <div class="input-group">
                <input v-model="settings.assignment_timeout" type="number" class="form-input" />
                <span class="input-suffix">min</span>
              </div>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.delivery.deliveryTimeout') }}</label>
              <div class="input-group">
                <input v-model="settings.delivery_timeout" type="number" class="form-input" />
                <span class="input-suffix">heures</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Paiements -->
      <div v-if="activeTab === 'payment'" class="settings-section">
        <h2>{{ $t('settings.payment.title') }}</h2>

        <div class="settings-grid">
          <div class="setting-group">
            <h3>{{ $t('settings.payment.methods') }}</h3>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_cash_payment" 
                type="checkbox" 
                id="cash-payment"
              />
              <label for="cash-payment">{{ $t('settings.payment.enableCash') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_mobile_money" 
                type="checkbox" 
                id="mobile-money"
              />
              <label for="mobile-money">{{ $t('settings.payment.enableMobileMoney') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_card_payment" 
                type="checkbox" 
                id="card-payment"
              />
              <label for="card-payment">{{ $t('settings.payment.enableCard') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_wallet_payment" 
                type="checkbox" 
                id="wallet-payment"
              />
              <label for="wallet-payment">{{ $t('settings.payment.enableWallet') }}</label>
            </div>
          </div>

          <div class="setting-group">
            <h3>{{ $t('settings.payment.configuration') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.payment.stripePublicKey') }}</label>
              <input v-model="settings.stripe_public_key" type="text" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.payment.stripeSecretKey') }}</label>
              <input v-model="settings.stripe_secret_key" type="password" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.payment.orangeMoneyApiKey') }}</label>
              <input v-model="settings.orange_money_api_key" type="password" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.payment.mtnMomoApiKey') }}</label>
              <input v-model="settings.mtn_momo_api_key" type="password" class="form-input" />
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Notifications -->
      <div v-if="activeTab === 'notification'" class="settings-section">
        <h2>{{ $t('settings.notification.title') }}</h2>

        <div class="settings-grid">
          <div class="setting-group">
            <h3>{{ $t('settings.notification.email') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smtpHost') }}</label>
              <input v-model="settings.smtp_host" type="text" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smtpPort') }}</label>
              <input v-model="settings.smtp_port" type="number" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smtpUsername') }}</label>
              <input v-model="settings.smtp_username" type="text" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smtpPassword') }}</label>
              <input v-model="settings.smtp_password" type="password" class="form-input" />
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.smtp_use_tls" 
                type="checkbox" 
                id="smtp-tls"
              />
              <label for="smtp-tls">{{ $t('settings.notification.smtpUseTls') }}</label>
            </div>
          </div>

          <div class="setting-group">
            <h3>{{ $t('settings.notification.sms') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smsProvider') }}</label>
              <select v-model="settings.sms_provider" class="form-select">
                <option value="twilio">Twilio</option>
                <option value="orange">Orange SMS</option>
                <option value="mtn">MTN SMS</option>
              </select>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smsApiKey') }}</label>
              <input v-model="settings.sms_api_key" type="password" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smsApiSecret') }}</label>
              <input v-model="settings.sms_api_secret" type="password" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.notification.smsSender') }}</label>
              <input v-model="settings.sms_sender_id" type="text" class="form-input" />
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Sécurité -->
      <div v-if="activeTab === 'security'" class="settings-section">
        <h2>{{ $t('settings.security.title') }}</h2>

        <div class="settings-grid">
          <div class="setting-group">
            <h3>{{ $t('settings.security.authentication') }}</h3>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.require_phone_verification" 
                type="checkbox" 
                id="phone-verification"
              />
              <label for="phone-verification">{{ $t('settings.security.requirePhoneVerification') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.require_email_verification" 
                type="checkbox" 
                id="email-verification"
              />
              <label for="email-verification">{{ $t('settings.security.requireEmailVerification') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_two_factor_auth" 
                type="checkbox" 
                id="two-factor-auth"
              />
              <label for="two-factor-auth">{{ $t('settings.security.enableTwoFactorAuth') }}</label>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.security.sessionTimeout') }}</label>
              <div class="input-group">
                <input v-model="settings.session_timeout" type="number" class="form-input" />
                <span class="input-suffix">minutes</span>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h3>{{ $t('settings.security.kyc') }}</h3>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.require_courier_kyc" 
                type="checkbox" 
                id="courier-kyc"
              />
              <label for="courier-kyc">{{ $t('settings.security.requireCourierKyc') }}</label>
            </div>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.require_business_kyc" 
                type="checkbox" 
                id="business-kyc"
              />
              <label for="business-kyc">{{ $t('settings.security.requireBusinessKyc') }}</label>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.security.maxLoginAttempts') }}</label>
              <input v-model="settings.max_login_attempts" type="number" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.security.lockoutDuration') }}</label>
              <div class="input-group">
                <input v-model="settings.lockout_duration" type="number" class="form-input" />
                <span class="input-suffix">minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Avancé -->
      <div v-if="activeTab === 'advanced'" class="settings-section">
        <h2>{{ $t('settings.advanced.title') }}</h2>

        <div class="settings-grid">
          <div class="setting-group">
            <h3>{{ $t('settings.advanced.api') }}</h3>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.googleMapsApiKey') }}</label>
              <input v-model="settings.google_maps_api_key" type="password" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.firebaseApiKey') }}</label>
              <input v-model="settings.firebase_api_key" type="password" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.redisUrl') }}</label>
              <input v-model="settings.redis_url" type="text" class="form-input" />
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.databaseBackupFrequency') }}</label>
              <select v-model="settings.backup_frequency" class="form-select">
                <option value="daily">{{ $t('settings.advanced.daily') }}</option>
                <option value="weekly">{{ $t('settings.advanced.weekly') }}</option>
                <option value="monthly">{{ $t('settings.advanced.monthly') }}</option>
              </select>
            </div>
          </div>

          <div class="setting-group">
            <h3>{{ $t('settings.advanced.maintenance') }}</h3>

            <div class="setting-item checkbox">
              <input 
                v-model="settings.enable_maintenance_mode" 
                type="checkbox" 
                id="maintenance-mode"
              />
              <label for="maintenance-mode">{{ $t('settings.advanced.enableMaintenanceMode') }}</label>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.maintenanceMessage') }}</label>
              <textarea v-model="settings.maintenance_message" class="form-textarea"></textarea>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.logLevel') }}</label>
              <select v-model="settings.log_level" class="form-select">
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div class="setting-item">
              <label>{{ $t('settings.advanced.maxLogSize') }}</label>
              <div class="input-group">
                <input v-model="settings.max_log_size" type="number" class="form-input" />
                <span class="input-suffix">MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historique des modifications -->
    <div class="settings-history">
      <h3>{{ $t('settings.history.title') }}</h3>
      <div class="history-list">
        <div v-for="change in settingsHistory" :key="change.id" class="history-item">
          <div class="history-info">
            <div class="history-user">
              <img :src="change.user.profile_picture || '/default-avatar.png'" class="avatar-sm" />
              <span>{{ change.user.full_name }}</span>
            </div>
            <div class="history-details">
              <div class="history-action">{{ change.action }}</div>
              <div class="history-time">{{ formatDate(change.created_at) }}</div>
            </div>
          </div>
          <div class="history-changes">
            <span v-for="key in change.changed_fields" :key="key" class="changed-field">
              {{ $t(`settings.fields.${key}`) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import settingsApi from '@/api/settings'

export default {
  name: 'SettingsView',
  setup() {
    const { showToast } = useToast()

    const saving = ref(false)
    const activeTab = ref('general')
    const settings = reactive({})
    const settingsHistory = ref([])

    const tabs = [
      { id: 'general', label: 'settings.general.title', icon: 'fas fa-cog' },
      { id: 'delivery', label: 'settings.delivery.title', icon: 'fas fa-shipping-fast' },
      { id: 'payment', label: 'settings.payment.title', icon: 'fas fa-credit-card' },
      { id: 'notification', label: 'settings.notification.title', icon: 'fas fa-bell' },
      { id: 'security', label: 'settings.security.title', icon: 'fas fa-shield-alt' },
      { id: 'advanced', label: 'settings.advanced.title', icon: 'fas fa-tools' }
    ]

    // Méthodes
    const loadSettings = async () => {
      try {
        const response = await settingsApi.getSettings()
        Object.assign(settings, response.data)
      } catch (error) {
        showToast(error.message, 'error')
      }
    }

    const loadSettingsHistory = async () => {
      try {
        const response = await settingsApi.getSettingsHistory()
        settingsHistory.value = response.data
      } catch (error) {
        console.error('Error loading settings history:', error)
      }
    }

    const saveSettings = async () => {
      try {
        saving.value = true
        await settingsApi.updateSettings(settings)
        showToast('Paramètres sauvegardés avec succès', 'success')
        await loadSettingsHistory()
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        saving.value = false
      }
    }

    const resetSettings = async () => {
      if (!confirm('Êtes-vous sûr de vouloir restaurer les paramètres par défaut ?')) return

      try {
        await settingsApi.resetSettings()
        await loadSettings()
        showToast('Paramètres restaurés aux valeurs par défaut', 'success')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(() => {
      loadSettings()
      loadSettingsHistory()
    })

    return {
      saving,
      activeTab,
      settings,
      settingsHistory,
      tabs,
      loadSettings,
      saveSettings,
      resetSettings,
      formatDate
    }
  }
}
</script>

<style scoped>
.settings-view {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.settings-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
  overflow-x: auto;
}

.tab-button {
  padding: 15px 20px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  background: #f8f9fa;
}

.tab-button.active {
  color: #2196F3;
  background: #e3f2fd;
  border-bottom: 2px solid #2196F3;
}

.settings-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 30px;
  margin-bottom: 30px;
}

.settings-section h2 {
  margin: 0 0 30px 0;
  color: #333;
  font-size: 1.5rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 40px;
}

.setting-group {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.setting-group h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.input-suffix {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-left: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: #666;
}

.setting-item.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-item.checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.setting-item.checkbox label {
  margin: 0;
  cursor: pointer;
}

.settings-history {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 30px;
}

.settings-history h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.history-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.history-action {
  font-weight: 500;
  color: #333;
}

.history-time {
  font-size: 12px;
  color: #666;
}

.history-changes {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.changed-field {
  background: #e3f2fd;
  color: #2196F3;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  border-color: #2196F3;
  color: white;
}

.btn-primary:hover {
  background: #1976D2;
}

.btn-outline {
  background: transparent;
}
</style>