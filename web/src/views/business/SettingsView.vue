<template>
  <div class="settings-view">
    <div class="page-header">
      <h1>Paramètres</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="resetSettings">
          <font-awesome-icon icon="undo" class="mr-1" />
          Réinitialiser
        </button>
        <button class="btn btn-primary" @click="saveAllSettings" :disabled="isSaving">
          <font-awesome-icon icon="save" class="mr-1" />
          Enregistrer
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <font-awesome-icon icon="spinner" spin size="2x" />
      <p>Chargement des paramètres...</p>
    </div>

    <div v-else class="settings-content">
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          class="tab-button" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <font-awesome-icon :icon="tab.icon" class="tab-icon" />
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <div class="settings-panel">
        <!-- Paramètres généraux -->
        <div v-if="activeTab === 'general'" class="settings-section">
          <h2>Paramètres généraux</h2>
          
          <div class="form-group">
            <label for="business_name">Nom de l'entreprise</label>
            <input type="text" id="business_name" v-model="settings.general.business_name" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="business_description">Description de l'entreprise</label>
            <textarea id="business_description" v-model="settings.general.business_description" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="business_address">Adresse</label>
            <input type="text" id="business_address" v-model="settings.general.business_address" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="business_commune">Commune</label>
            <select id="business_commune" v-model="settings.general.business_commune" class="form-control">
              <option value="">Sélectionnez une commune</option>
              <option v-for="commune in communes" :key="commune" :value="commune">
                {{ commune }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="business_phone">Téléphone</label>
            <input type="tel" id="business_phone" v-model="settings.general.business_phone" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="business_email">Email</label>
            <input type="email" id="business_email" v-model="settings.general.business_email" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="business_website">Site web</label>
            <input type="url" id="business_website" v-model="settings.general.business_website" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="business_logo">Logo de l'entreprise</label>
            <div class="logo-upload">
              <div class="logo-preview" v-if="settings.general.business_logo">
                <img :src="settings.general.business_logo" alt="Logo" />
                <button class="remove-logo" @click="removeLogo">
                  <font-awesome-icon icon="times" />
                </button>
              </div>
              <div class="upload-button" v-else>
                <input type="file" id="business_logo" @change="handleLogoUpload" accept="image/*" class="file-input" />
                <label for="business_logo" class="btn btn-outline">
                  <font-awesome-icon icon="upload" class="mr-1" />
                  Télécharger un logo
                </label>
              </div>
              <p class="upload-help">Format recommandé: PNG ou JPG, max 1MB</p>
            </div>
          </div>
          
          <div class="form-group">
            <label for="business_hours">Heures d'ouverture</label>
            <div class="business-hours">
              <div v-for="(day, index) in businessHours" :key="day.day" class="business-day">
                <div class="day-name">
                  <input type="checkbox" :id="`day_${index}`" v-model="day.open" />
                  <label :for="`day_${index}`">{{ day.day }}</label>
                </div>
                <div class="day-hours" v-if="day.open">
                  <div class="time-input">
                    <input type="time" v-model="day.start" class="form-control" />
                    <span>à</span>
                    <input type="time" v-model="day.end" class="form-control" />
                  </div>
                </div>
                <div class="day-closed" v-else>
                  Fermé
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveGeneralSettings" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
              Enregistrer les paramètres généraux
            </button>
          </div>
        </div>
        
        <!-- Paramètres de livraison -->
        <div v-if="activeTab === 'delivery'" class="settings-section">
          <h2>Paramètres de livraison</h2>
          
          <div class="form-group">
            <label for="default_price">Prix par défaut (FCFA)</label>
            <input type="number" id="default_price" v-model="settings.delivery.default_price" class="form-control" min="0" />
            <p class="form-help">Prix proposé par défaut pour les nouvelles livraisons</p>
          </div>
          
          <div class="form-group">
            <label for="min_price">Prix minimum (FCFA)</label>
            <input type="number" id="min_price" v-model="settings.delivery.min_price" class="form-control" min="0" />
            <p class="form-help">Prix minimum accepté pour une livraison</p>
          </div>
          
          <div class="form-group">
            <label for="max_distance">Distance maximale (km)</label>
            <input type="number" id="max_distance" v-model="settings.delivery.max_distance" class="form-control" min="0" />
            <p class="form-help">Distance maximale pour les livraisons (0 = illimité)</p>
          </div>
          
          <div class="form-group">
            <label>Communes desservies</label>
            <div class="communes-grid">
              <div v-for="commune in communes" :key="commune" class="commune-checkbox">
                <input type="checkbox" :id="`commune_${commune}`" v-model="settings.delivery.service_areas" :value="commune" />
                <label :for="`commune_${commune}`">{{ commune }}</label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Types de colis acceptés</label>
            <div class="package-types">
              <div v-for="(type, key) in packageTypes" :key="key" class="package-type-checkbox">
                <input type="checkbox" :id="`package_${key}`" v-model="settings.delivery.accepted_package_types" :value="key" />
                <label :for="`package_${key}`">{{ type.label }}</label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="auto_accept_bids">Acceptation automatique des offres</label>
            <div class="toggle-switch">
              <input type="checkbox" id="auto_accept_bids" v-model="settings.delivery.auto_accept_bids" />
              <label for="auto_accept_bids"></label>
            </div>
            <p class="form-help">Accepter automatiquement l'offre la plus basse après un délai</p>
          </div>
          
          <div class="form-group" v-if="settings.delivery.auto_accept_bids">
            <label for="auto_accept_delay">Délai d'acceptation automatique (minutes)</label>
            <input type="number" id="auto_accept_delay" v-model="settings.delivery.auto_accept_delay" class="form-control" min="1" />
          </div>
          
          <div class="form-group">
            <label for="allow_express_delivery">Autoriser les livraisons express</label>
            <div class="toggle-switch">
              <input type="checkbox" id="allow_express_delivery" v-model="settings.delivery.allow_express_delivery" />
              <label for="allow_express_delivery"></label>
            </div>
            <p class="form-help">Les livraisons express sont plus rapides mais plus coûteuses</p>
          </div>
          
          <div class="form-group" v-if="settings.delivery.allow_express_delivery">
            <label for="express_price_multiplier">Multiplicateur de prix pour livraison express</label>
            <input type="number" id="express_price_multiplier" v-model="settings.delivery.express_price_multiplier" class="form-control" min="1" step="0.1" />
            <p class="form-help">Ex: 1.5 = prix 50% plus élevé pour les livraisons express</p>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveDeliverySettings" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
              Enregistrer les paramètres de livraison
            </button>
          </div>
        </div>
        
        <!-- Paramètres de paiement -->
        <div v-if="activeTab === 'payment'" class="settings-section">
          <h2>Paramètres de paiement</h2>
          
          <div class="form-group">
            <label>Méthodes de paiement acceptées</label>
            <div class="payment-methods">
              <div v-for="(method, key) in paymentMethods" :key="key" class="payment-method-checkbox">
                <input type="checkbox" :id="`payment_${key}`" v-model="settings.payment.accepted_methods" :value="key" />
                <label :for="`payment_${key}`">
                  <font-awesome-icon :icon="method.icon" class="mr-1" />
                  {{ method.label }}
                </label>
              </div>
            </div>
          </div>
          
          <div v-if="settings.payment.accepted_methods.includes('orange_money')" class="form-group">
            <label for="orange_money_number">Numéro Orange Money</label>
            <input type="tel" id="orange_money_number" v-model="settings.payment.orange_money_number" class="form-control" />
          </div>
          
          <div v-if="settings.payment.accepted_methods.includes('mtn_money')" class="form-group">
            <label for="mtn_money_number">Numéro MTN Money</label>
            <input type="tel" id="mtn_money_number" v-model="settings.payment.mtn_money_number" class="form-control" />
          </div>
          
          <div v-if="settings.payment.accepted_methods.includes('bank_transfer')" class="form-group">
            <label for="bank_account_name">Nom du compte bancaire</label>
            <input type="text" id="bank_account_name" v-model="settings.payment.bank_account_name" class="form-control" />
          </div>
          
          <div v-if="settings.payment.accepted_methods.includes('bank_transfer')" class="form-group">
            <label for="bank_account_number">Numéro de compte bancaire</label>
            <input type="text" id="bank_account_number" v-model="settings.payment.bank_account_number" class="form-control" />
          </div>
          
          <div v-if="settings.payment.accepted_methods.includes('bank_transfer')" class="form-group">
            <label for="bank_name">Nom de la banque</label>
            <input type="text" id="bank_name" v-model="settings.payment.bank_name" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="auto_generate_invoice">Générer automatiquement les factures</label>
            <div class="toggle-switch">
              <input type="checkbox" id="auto_generate_invoice" v-model="settings.payment.auto_generate_invoice" />
              <label for="auto_generate_invoice"></label>
            </div>
            <p class="form-help">Générer automatiquement une facture après chaque livraison</p>
          </div>
          
          <div class="form-group">
            <label for="invoice_prefix">Préfixe des factures</label>
            <input type="text" id="invoice_prefix" v-model="settings.payment.invoice_prefix" class="form-control" />
            <p class="form-help">Ex: FACT-2025-</p>
          </div>
          
          <div class="form-group">
            <label for="invoice_footer">Pied de page des factures</label>
            <textarea id="invoice_footer" v-model="settings.payment.invoice_footer" class="form-control" rows="3"></textarea>
            <p class="form-help">Texte à afficher en bas de chaque facture</p>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" @click="savePaymentSettings" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
              Enregistrer les paramètres de paiement
            </button>
          </div>
        </div>
        
        <!-- Paramètres de notification -->
        <div v-if="activeTab === 'notification'" class="settings-section">
          <h2>Paramètres de notification</h2>
          
          <div class="form-group">
            <label>Canaux de notification</label>
            <div class="notification-channels">
              <div v-for="(channel, key) in notificationChannels" :key="key" class="notification-channel-checkbox">
                <input type="checkbox" :id="`channel_${key}`" v-model="settings.notification.channels" :value="key" />
                <label :for="`channel_${key}`">
                  <font-awesome-icon :icon="channel.icon" class="mr-1" />
                  {{ channel.label }}
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Événements à notifier</label>
            <div class="notification-events">
              <div v-for="(event, key) in notificationEvents" :key="key" class="notification-event-checkbox">
                <input type="checkbox" :id="`event_${key}`" v-model="settings.notification.events" :value="key" />
                <label :for="`event_${key}`">{{ event.label }}</label>
              </div>
            </div>
          </div>
          
          <div v-if="settings.notification.channels.includes('email')" class="form-group">
            <label for="notification_email">Email de notification</label>
            <input type="email" id="notification_email" v-model="settings.notification.email" class="form-control" />
          </div>
          
          <div v-if="settings.notification.channels.includes('sms')" class="form-group">
            <label for="notification_phone">Téléphone de notification</label>
            <input type="tel" id="notification_phone" v-model="settings.notification.phone" class="form-control" />
          </div>
          
          <div class="form-group">
            <label for="notification_sound">Son de notification</label>
            <div class="toggle-switch">
              <input type="checkbox" id="notification_sound" v-model="settings.notification.sound_enabled" />
              <label for="notification_sound"></label>
            </div>
            <p class="form-help">Activer le son pour les notifications dans le navigateur</p>
          </div>
          
          <div class="form-group">
            <label for="notification_desktop">Notifications de bureau</label>
            <div class="toggle-switch">
              <input type="checkbox" id="notification_desktop" v-model="settings.notification.desktop_enabled" />
              <label for="notification_desktop"></label>
            </div>
            <p class="form-help">Afficher les notifications même lorsque le navigateur est en arrière-plan</p>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveNotificationSettings" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
              Enregistrer les paramètres de notification
            </button>
          </div>
        </div>
        
        <!-- Paramètres d'apparence -->
        <div v-if="activeTab === 'appearance'" class="settings-section">
          <h2>Paramètres d'apparence</h2>
          
          <div class="form-group">
            <label for="theme">Thème</label>
            <select id="theme" v-model="settings.appearance.theme" class="form-control">
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="system">Système (auto)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="primary_color">Couleur principale</label>
            <div class="color-picker">
              <input type="color" id="primary_color" v-model="settings.appearance.primary_color" class="color-input" />
              <input type="text" v-model="settings.appearance.primary_color" class="form-control" />
            </div>
          </div>
          
          <div class="form-group">
            <label for="language">Langue</label>
            <select id="language" v-model="settings.appearance.language" class="form-control">
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
              <option value="dioula">Dioula</option>
              <option value="baoule">Baoulé</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="date_format">Format de date</label>
            <select id="date_format" v-model="settings.appearance.date_format" class="form-control">
              <option value="dd/MM/yyyy">JJ/MM/AAAA (31/12/2025)</option>
              <option value="MM/dd/yyyy">MM/JJ/AAAA (12/31/2025)</option>
              <option value="yyyy-MM-dd">AAAA-MM-JJ (2025-12-31)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="time_format">Format d'heure</label>
            <select id="time_format" v-model="settings.appearance.time_format" class="form-control">
              <option value="HH:mm">24h (14:30)</option>
              <option value="hh:mm a">12h (02:30 PM)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="items_per_page">Éléments par page</label>
            <select id="items_per_page" v-model="settings.appearance.items_per_page" class="form-control">
              <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
                {{ size }} éléments
              </option>
            </select>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveAppearanceSettings" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
              Enregistrer les paramètres d'apparence
            </button>
          </div>
        </div>
        
        <!-- Paramètres de sécurité -->
        <div v-if="activeTab === 'security'" class="settings-section">
          <h2>Paramètres de sécurité</h2>
          
          <div class="form-group">
            <label for="session_timeout">Délai d'expiration de session (minutes)</label>
            <input type="number" id="session_timeout" v-model="settings.security.session_timeout" class="form-control" min="5" />
            <p class="form-help">Durée d'inactivité avant déconnexion automatique (0 = jamais)</p>
          </div>
          
          <div class="form-group">
            <label for="two_factor_auth">Authentification à deux facteurs</label>
            <div class="toggle-switch">
              <input type="checkbox" id="two_factor_auth" v-model="settings.security.two_factor_auth" />
              <label for="two_factor_auth"></label>
            </div>
            <p class="form-help">Exiger un code SMS en plus du mot de passe lors de la connexion</p>
          </div>
          
          <div class="form-group">
            <label for="ip_restriction">Restriction d'adresse IP</label>
            <div class="toggle-switch">
              <input type="checkbox" id="ip_restriction" v-model="settings.security.ip_restriction" />
              <label for="ip_restriction"></label>
            </div>
            <p class="form-help">Limiter l'accès à certaines adresses IP</p>
          </div>
          
          <div class="form-group" v-if="settings.security.ip_restriction">
            <label for="allowed_ips">Adresses IP autorisées</label>
            <textarea id="allowed_ips" v-model="settings.security.allowed_ips" class="form-control" rows="3" placeholder="Une adresse IP par ligne"></textarea>
            <p class="form-help">Laissez vide pour autoriser toutes les adresses IP</p>
          </div>
          
          <div class="form-group">
            <label for="password_change">Changer le mot de passe</label>
            <button class="btn btn-outline" @click="showChangePasswordModal = true">
              <font-awesome-icon icon="key" class="mr-1" />
              Changer le mot de passe
            </button>
          </div>
          
          <div class="form-actions">
            <button class="btn btn-primary" @click="saveSecuritySettings" :disabled="isSaving">
              <font-awesome-icon icon="spinner" spin v-if="isSaving" class="mr-1" />
              Enregistrer les paramètres de sécurité
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de changement de mot de passe -->
    <div class="modal" v-if="showChangePasswordModal">
      <div class="modal-backdrop" @click="showChangePasswordModal = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Changer le mot de passe</h3>
          <button class="modal-close" @click="showChangePasswordModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label for="current_password">Mot de passe actuel</label>
              <div class="password-input">
                <input 
                  :type="showCurrentPassword ? 'text' : 'password'" 
                  id="current_password" 
                  v-model="passwordForm.current_password" 
                  class="form-control" 
                  required 
                />
                <button 
                  type="button" 
                  class="password-toggle" 
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <font-awesome-icon :icon="showCurrentPassword ? 'eye-slash' : 'eye'" />
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label for="new_password">Nouveau mot de passe</label>
              <div class="password-input">
                <input 
                  :type="showNewPassword ? 'text' : 'password'" 
                  id="new_password" 
                  v-model="passwordForm.new_password" 
                  class="form-control" 
                  required 
                />
                <button 
                  type="button" 
                  class="password-toggle" 
                  @click="showNewPassword = !showNewPassword"
                >
                  <font-awesome-icon :icon="showNewPassword ? 'eye-slash' : 'eye'" />
                </button>
              </div>
              <div class="password-strength" v-if="passwordForm.new_password">
                <div class="strength-bar">
                  <div 
                    class="strength-progress" 
                    :style="{ width: passwordStrength.score * 25 + '%' }"
                    :class="passwordStrengthClass"
                  ></div>
                </div>
                <div class="strength-text" :class="passwordStrengthClass">
                  {{ passwordStrength.message }}
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="confirm_password">Confirmer le nouveau mot de passe</label>
              <div class="password-input">
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  id="confirm_password" 
                  v-model="passwordForm.confirm_password" 
                  class="form-control" 
                  required 
                />
                <button 
                  type="button" 
                  class="password-toggle" 
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <font-awesome-icon :icon="showConfirmPassword ? 'eye-slash' : 'eye'" />
                </button>
              </div>
              <div class="password-match" v-if="passwordForm.new_password && passwordForm.confirm_password">
                <font-awesome-icon 
                  :icon="passwordsMatch ? 'check' : 'times'" 
                  :class="passwordsMatch ? 'text-success' : 'text-danger'" 
                />
                <span :class="passwordsMatch ? 'text-success' : 'text-danger'">
                  {{ passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas' }}
                </span>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showChangePasswordModal = false">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isChangingPassword || !canChangePassword">
                <font-awesome-icon icon="spinner" spin v-if="isChangingPassword" class="mr-1" />
                Changer le mot de passe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
// import { useAuthStore } from '@/stores/auth'
import { fetchBusinessSettings, updateBusinessSettings, changeBusinessPassword } from '@/api/business'
import { COMMUNES, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/config'

export default {
  name: 'BusinessSettingsView',
  setup() {
    const themeStore = useThemeStore()
    // const authStore = useAuthStore()
    
    const loading = ref(true)
    const isSaving = ref(false)
    const isChangingPassword = ref(false)
    const activeTab = ref('general')
    const showChangePasswordModal = ref(false)
    const showCurrentPassword = ref(false)
    const showNewPassword = ref(false)
    const showConfirmPassword = ref(false)
    
    const tabs = [
      { id: 'general', label: 'Général', icon: 'cog' },
      { id: 'delivery', label: 'Livraison', icon: 'truck' },
      { id: 'payment', label: 'Paiement', icon: 'money-bill' },
      { id: 'notification', label: 'Notifications', icon: 'bell' },
      { id: 'appearance', label: 'Apparence', icon: 'paint-brush' },
      { id: 'security', label: 'Sécurité', icon: 'shield-alt' }
    ]
    
    const settings = reactive({
      general: {
        business_name: '',
        business_description: '',
        business_address: '',
        business_commune: '',
        business_phone: '',
        business_email: '',
        business_website: '',
        business_logo: null
      },
      delivery: {
        default_price: 1000,
        min_price: 500,
        max_distance: 0,
        service_areas: [],
        accepted_package_types: ['small', 'medium', 'large'],
        auto_accept_bids: false,
        auto_accept_delay: 30,
        allow_express_delivery: true,
        express_price_multiplier: 1.5
      },
      payment: {
        accepted_methods: ['cash', 'orange_money', 'mtn_money'],
        orange_money_number: '',
        mtn_money_number: '',
        bank_account_name: '',
        bank_account_number: '',
        bank_name: '',
        auto_generate_invoice: true,
        invoice_prefix: 'FACT-',
        invoice_footer: ''
      },
      notification: {
        channels: ['app', 'email', 'sms'],
        events: ['new_bid', 'bid_accepted', 'delivery_started', 'delivery_completed'],
        email: '',
        phone: '',
        sound_enabled: true,
        desktop_enabled: true
      },
      appearance: {
        theme: 'system',
        primary_color: '#FF6B00',
        language: 'fr',
        date_format: 'dd/MM/yyyy',
        time_format: 'HH:mm',
        items_per_page: DEFAULT_PAGE_SIZE
      },
      security: {
        session_timeout: 30,
        two_factor_auth: false,
        ip_restriction: false,
        allowed_ips: ''
      }
    })
    
    const businessHours = reactive([
      { day: 'Lundi', open: true, start: '08:00', end: '18:00' },
      { day: 'Mardi', open: true, start: '08:00', end: '18:00' },
      { day: 'Mercredi', open: true, start: '08:00', end: '18:00' },
      { day: 'Jeudi', open: true, start: '08:00', end: '18:00' },
      { day: 'Vendredi', open: true, start: '08:00', end: '18:00' },
      { day: 'Samedi', open: true, start: '09:00', end: '16:00' },
      { day: 'Dimanche', open: false, start: '09:00', end: '16:00' }
    ])
    
    const packageTypes = {
      small: { label: 'Petit (< 5kg)', icon: 'box' },
      medium: { label: 'Moyen (5-10kg)', icon: 'box' },
      large: { label: 'Grand (> 10kg)', icon: 'box' },
      fragile: { label: 'Fragile', icon: 'wine-glass' },
      perishable: { label: 'Périssable', icon: 'snowflake' },
      document: { label: 'Document', icon: 'file' }
    }
    
    const paymentMethods = {
      cash: { label: 'Espèces', icon: 'money-bill' },
      orange_money: { label: 'Orange Money', icon: 'mobile-alt' },
      mtn_money: { label: 'MTN Money', icon: 'mobile-alt' },
      credit_card: { label: 'Carte bancaire', icon: 'credit-card' },
      bank_transfer: { label: 'Virement bancaire', icon: 'university' }
    }
    
    const notificationChannels = {
      app: { label: 'Application', icon: 'bell' },
      email: { label: 'Email', icon: 'envelope' },
      sms: { label: 'SMS', icon: 'sms' },
      push: { label: 'Notifications push', icon: 'mobile-alt' }
    }
    
    const notificationEvents = {
      new_bid: { label: 'Nouvelle offre de coursier' },
      bid_accepted: { label: 'Offre acceptée' },
      delivery_started: { label: 'Livraison commencée' },
      delivery_completed: { label: 'Livraison terminée' },
      payment_received: { label: 'Paiement reçu' },
      new_rating: { label: 'Nouvelle évaluation' },
      complaint: { label: 'Nouvelle plainte' }
    }
    
    const passwordForm = reactive({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    
    const passwordsMatch = computed(() => {
      return passwordForm.new_password === passwordForm.confirm_password
    })
    
    const passwordStrength = computed(() => {
      if (!passwordForm.new_password) {
        return { score: 0, message: '' }
      }
      
      let score = 0
      let message = 'Très faible'
      
      // Longueur minimale
      if (passwordForm.new_password.length >= 8) score++
      
      // Contient des chiffres
      if (/\d/.test(passwordForm.new_password)) score++
      
      // Contient des lettres minuscules et majuscules
      if (/[a-z]/.test(passwordForm.new_password) && /[A-Z]/.test(passwordForm.new_password)) score++
      
      // Contient des caractères spéciaux
      if (/[^a-zA-Z0-9]/.test(passwordForm.new_password)) score++
      
      if (score === 1) message = 'Faible'
      else if (score === 2) message = 'Moyen'
      else if (score === 3) message = 'Fort'
      else if (score === 4) message = 'Très fort'
      
      return { score, message }
    })
    
    const passwordStrengthClass = computed(() => {
      const score = passwordStrength.value.score
      if (score <= 1) return 'strength-weak'
      if (score === 2) return 'strength-medium'
      if (score === 3) return 'strength-good'
      return 'strength-strong'
    })
    
    const canChangePassword = computed(() => {
      return (
        passwordForm.current_password &&
        passwordForm.new_password &&
        passwordForm.confirm_password &&
        passwordsMatch.value &&
        passwordStrength.value.score >= 2
      )
    })
    
    // Charger les paramètres
    const loadSettings = async () => {
      try {
        loading.value = true
        
        const data = await fetchBusinessSettings()
        
        // Mettre à jour les paramètres
        Object.keys(data).forEach(section => {
          if (settings[section]) {
            Object.keys(data[section]).forEach(key => {
              if (settings[section][key] !== undefined) {
                settings[section][key] = data[section][key]
              }
            })
          }
        })
        
        // Mettre à jour les heures d'ouverture
        if (data.general && data.general.business_hours) {
          data.general.business_hours.forEach((hours, index) => {
            if (index < businessHours.length) {
              businessHours[index].open = hours.open
              businessHours[index].start = hours.start
              businessHours[index].end = hours.end
            }
          })
        }
        
        // Mettre à jour le thème
        if (settings.appearance.theme !== 'system') {
          themeStore.setTheme(settings.appearance.theme)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Enregistrer tous les paramètres
    const saveAllSettings = async () => {
      try {
        isSaving.value = true
        
        // Préparer les données à envoyer
        const settingsData = { ...settings }
        
        // Ajouter les heures d'ouverture
        settingsData.general.business_hours = businessHours
        
        await updateBusinessSettings(settingsData)
        
        // Mettre à jour le thème
        if (settings.appearance.theme !== 'system') {
          themeStore.setTheme(settings.appearance.theme)
        }
        
        // Afficher un message de succès
        alert('Paramètres enregistrés avec succès')
      } catch (error) {
        console.error('Error saving settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Enregistrer les paramètres généraux
    const saveGeneralSettings = async () => {
      try {
        isSaving.value = true
        
        // Préparer les données à envoyer
        const generalSettings = { ...settings.general }
        
        // Ajouter les heures d'ouverture
        generalSettings.business_hours = businessHours
        
        await updateBusinessSettings({ general: generalSettings })
        
        // Afficher un message de succès
        alert('Paramètres généraux enregistrés avec succès')
      } catch (error) {
        console.error('Error saving general settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres généraux: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Enregistrer les paramètres de livraison
    const saveDeliverySettings = async () => {
      try {
        isSaving.value = true
        
        await updateBusinessSettings({ delivery: settings.delivery })
        
        // Afficher un message de succès
        alert('Paramètres de livraison enregistrés avec succès')
      } catch (error) {
        console.error('Error saving delivery settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres de livraison: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Enregistrer les paramètres de paiement
    const savePaymentSettings = async () => {
      try {
        isSaving.value = true
        
        await updateBusinessSettings({ payment: settings.payment })
        
        // Afficher un message de succès
        alert('Paramètres de paiement enregistrés avec succès')
      } catch (error) {
        console.error('Error saving payment settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres de paiement: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Enregistrer les paramètres de notification
    const saveNotificationSettings = async () => {
      try {
        isSaving.value = true
        
        await updateBusinessSettings({ notification: settings.notification })
        
        // Afficher un message de succès
        alert('Paramètres de notification enregistrés avec succès')
      } catch (error) {
        console.error('Error saving notification settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres de notification: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Enregistrer les paramètres d'apparence
    const saveAppearanceSettings = async () => {
      try {
        isSaving.value = true
        
        await updateBusinessSettings({ appearance: settings.appearance })
        
        // Mettre à jour le thème
        if (settings.appearance.theme !== 'system') {
          themeStore.setTheme(settings.appearance.theme)
        }
        
        // Afficher un message de succès
        alert('Paramètres d\'apparence enregistrés avec succès')
      } catch (error) {
        console.error('Error saving appearance settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres d'apparence: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Enregistrer les paramètres de sécurité
    const saveSecuritySettings = async () => {
      try {
        isSaving.value = true
        
        await updateBusinessSettings({ security: settings.security })
        
        // Afficher un message de succès
        alert('Paramètres de sécurité enregistrés avec succès')
      } catch (error) {
        console.error('Error saving security settings:', error)
        alert(`Erreur lors de l'enregistrement des paramètres de sécurité: ${error.message}`)
      } finally {
        isSaving.value = false
      }
    }
    
    // Réinitialiser les paramètres
    const resetSettings = () => {
      if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
        return
      }
      
      loadSettings()
    }
    
    // Gérer l'upload du logo
    const handleLogoUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image')
        return
      }
      
      // Vérifier la taille du fichier (max 1MB)
      if (file.size > 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 1MB')
        return
      }
      
      // Lire le fichier
      const reader = new FileReader()
      reader.onload = (e) => {
        settings.general.business_logo = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    // Supprimer le logo
    const removeLogo = () => {
      settings.general.business_logo = null
    }
    
    // Changer le mot de passe
    const changePassword = async () => {
      if (!canChangePassword.value) return
      
      try {
        isChangingPassword.value = true
        
        await changeBusinessPassword(passwordForm)
        
        // Réinitialiser le formulaire
        passwordForm.current_password = ''
        passwordForm.new_password = ''
        passwordForm.confirm_password = ''
        
        // Fermer le modal
        showChangePasswordModal.value = false
        
        // Afficher un message de succès
        alert('Mot de passe changé avec succès')
      } catch (error) {
        console.error('Error changing password:', error)
        alert(`Erreur lors du changement de mot de passe: ${error.message}`)
      } finally {
        isChangingPassword.value = false
      }
    }
    
    onMounted(() => {
      loadSettings()
    })
    
    return {
      loading,
      isSaving,
      isChangingPassword,
      activeTab,
      tabs,
      settings,
      businessHours,
      packageTypes,
      paymentMethods,
      notificationChannels,
      notificationEvents,
      communes: COMMUNES,
      PAGE_SIZE_OPTIONS,
      showChangePasswordModal,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      passwordForm,
      passwordsMatch,
      passwordStrength,
      passwordStrengthClass,
      canChangePassword,
      loadSettings,
      saveAllSettings,
      saveGeneralSettings,
      saveDeliverySettings,
      savePaymentSettings,
      saveNotificationSettings,
      saveAppearanceSettings,
      saveSecuritySettings,
      resetSettings,
      handleLogoUpload,
      removeLogo,
      changePassword
    }
  }
}
</script>

<style scoped>
.settings-view {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  color: var(--text-secondary);
}

.loading-state svg {
  margin-bottom: 1rem;
}

.settings-content {
  display: flex;
  gap: 1.5rem;
}

.settings-tabs {
  width: 250px;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
  flex-shrink: 0;
}

.tab-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem 1.5rem;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-color);
}

.tab-button:hover {
  background-color: var(--background-secondary);
}

.tab-button.active {
  background-color: var(--primary-color);
  color: white;
}

.tab-icon {
  margin-right: 0.75rem;
  width: 16px;
}

.tab-label {
  font-weight: 500;
}

.settings-panel {
  flex: 1;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 1.5rem;
}

.settings-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 1.5rem;
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
  padding: 0.75rem 1rem;
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

.form-help {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.logo-upload {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logo-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-logo {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-button {
  position: relative;
  width: 150px;
}

.file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.upload-help {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.business-hours {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.business-day {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.day-name {
  width: 100px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.day-hours {
  flex: 1;
  display: flex;
  align-items: center;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.day-closed {
  color: var(--text-secondary);
  font-style: italic;
}

.communes-grid,
.package-types,
.payment-methods,
.notification-channels,
.notification-events {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.commune-checkbox,
.package-type-checkbox,
.payment-method-checkbox,
.notification-channel-checkbox,
.notification-event-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-secondary);
  transition: .4s;
  border-radius: 34px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: var(--primary-color);
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-input {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background-color: var(--card-background);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--shadow-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.password-input {
  position: relative;
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

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  background-color: var(--background-secondary);
  border-radius: 2px;
  margin-bottom: 0.25rem;
}

.strength-progress {
  height: 100%;
  border-radius: 2px;
}

.strength-text {
  font-size: 0.75rem;
}

.strength-weak {
  background-color: #F44336;
  color: #F44336;
}

.strength-medium {
  background-color: #FFC107;
  color: #FFC107;
}

.strength-good {
  background-color: #4CAF50;
  color: #4CAF50;
}

.strength-strong {
  background-color: #2196F3;
  color: #2196F3;
}

.password-match {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.text-success {
  color: #4CAF50;
}

.text-danger {
  color: #F44336;
}

@media (max-width: 992px) {
  .settings-content {
    flex-direction: column;
  }
  
  .settings-tabs {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1;
    min-width: 120px;
    border-bottom: none;
    border-right: 1px solid var(--border-color);
    padding: 0.75rem 1rem;
    justify-content: center;
  }
  
  .tab-icon {
    margin-right: 0.5rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions .btn {
    flex: 1;
  }
  
  .tab-button {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .tab-icon {
    margin-right: 0;
  }
  
  .business-day {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .day-name {
    width: 100%;
  }
  
  .time-input {
    width: 100%;
  }
  
  .communes-grid,
  .package-types,
  .payment-methods,
  .notification-channels,
  .notification-events {
    grid-template-columns: 1fr;
  }
}
</style>
