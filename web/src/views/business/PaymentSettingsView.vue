<template>
  <div class="payment-settings-container">
    <div class="page-header">
      <h1>Configuration des paiements</h1>
      <button class="btn btn-primary" @click="saveSettings" :disabled="isSaving">
        <span v-if="isSaving"> <i class="fas fa-spinner fa-spin"></i> Enregistrement... </span>
        <span v-else> <i class="fas fa-save"></i> Enregistrer </span>
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des paramètres de paiement...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchPaymentSettings">Réessayer</button>
    </div>

    <div v-else class="settings-content">
      <!-- Méthodes de paiement -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Méthodes de paiement acceptées</h2>
          <p class="help-text">
            Sélectionnez les méthodes de paiement que vous souhaitez accepter pour vos livraisons.
          </p>
        </div>
        <div class="card-body">
          <div class="payment-methods">
            <div
              v-for="method in paymentMethods"
              :key="method.id"
              class="payment-method-item"
              :class="{ active: isMethodActive(method.id) }"
              @click="togglePaymentMethod(method.id)"
            >
              <div class="payment-method-icon">
                <img :src="method.icon" :alt="method.name" />
              </div>
              <div class="payment-method-info">
                <h3>{{ method.name }}</h3>
                <p>{{ method.description }}</p>
              </div>
              <div class="payment-method-toggle">
                <div class="toggle-switch">
                  <input
                    type="checkbox"
                    :id="`method-${method.id}`"
                    :checked="isMethodActive(method.id)"
                    @change="togglePaymentMethod(method.id)"
                  />
                  <label :for="`method-${method.id}`"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration CinetPay -->
      <div class="settings-card" v-if="isMethodActive('cinetpay')">
        <div class="card-header">
          <h2>Configuration CinetPay</h2>
          <p class="help-text">
            Configurez vos identifiants CinetPay pour accepter les paiements mobiles.
          </p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="cinetpay-site-id">Site ID</label>
            <input
              type="text"
              id="cinetpay-site-id"
              v-model="paymentSettings.cinetpay.site_id"
              placeholder="Votre Site ID CinetPay"
            />
          </div>
          <div class="form-group">
            <label for="cinetpay-api-key">Clé API</label>
            <input
              type="text"
              id="cinetpay-api-key"
              v-model="paymentSettings.cinetpay.api_key"
              placeholder="Votre clé API CinetPay"
            />
          </div>
          <div class="form-group">
            <label for="cinetpay-secret-key">Clé secrète</label>
            <div class="password-input">
              <input
                :type="showSecretKey ? 'text' : 'password'"
                id="cinetpay-secret-key"
                v-model="paymentSettings.cinetpay.secret_key"
                placeholder="Votre clé secrète CinetPay"
              />
              <button type="button" class="toggle-password" @click="showSecretKey = !showSecretKey">
                <i :class="showSecretKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="cinetpay-mode">Mode</label>
            <select id="cinetpay-mode" v-model="paymentSettings.cinetpay.mode">
              <option value="test">Test</option>
              <option value="live">Production</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" @click="testCinetPayConnection">
              <i class="fas fa-vial"></i> Tester la connexion
            </button>
          </div>
        </div>
      </div>

      <!-- Configuration Orange Money -->
      <div class="settings-card" v-if="isMethodActive('orange_money')">
        <div class="card-header">
          <h2>Configuration Orange Money</h2>
          <p class="help-text">
            Configurez vos identifiants Orange Money pour accepter les paiements mobiles.
          </p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="orange-merchant-id">ID Marchand</label>
            <input
              type="text"
              id="orange-merchant-id"
              v-model="paymentSettings.orange_money.merchant_id"
              placeholder="Votre ID Marchand Orange Money"
            />
          </div>
          <div class="form-group">
            <label for="orange-merchant-key">Clé Marchand</label>
            <div class="password-input">
              <input
                :type="showOrangeMerchantKey ? 'text' : 'password'"
                id="orange-merchant-key"
                v-model="paymentSettings.orange_money.merchant_key"
                placeholder="Votre clé Marchand Orange Money"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showOrangeMerchantKey = !showOrangeMerchantKey"
              >
                <i :class="showOrangeMerchantKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="orange-phone">Numéro de téléphone marchand</label>
            <input
              type="text"
              id="orange-phone"
              v-model="paymentSettings.orange_money.phone"
              placeholder="Ex: 07XXXXXXXX"
            />
            <p class="input-help">
              Numéro de téléphone Orange Money associé à votre compte marchand.
            </p>
          </div>
          <div class="form-group">
            <label for="orange-mode">Mode</label>
            <select id="orange-mode" v-model="paymentSettings.orange_money.mode">
              <option value="test">Test</option>
              <option value="live">Production</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" @click="testOrangeMoneyConnection">
              <i class="fas fa-vial"></i> Tester la connexion
            </button>
          </div>
        </div>
      </div>

      <!-- Configuration MTN Mobile Money -->
      <div class="settings-card" v-if="isMethodActive('mtn_money')">
        <div class="card-header">
          <h2>Configuration MTN Mobile Money</h2>
          <p class="help-text">
            Configurez vos identifiants MTN Mobile Money pour accepter les paiements mobiles.
          </p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="mtn-api-user">Utilisateur API</label>
            <input
              type="text"
              id="mtn-api-user"
              v-model="paymentSettings.mtn_money.api_user"
              placeholder="Votre utilisateur API MTN"
            />
          </div>
          <div class="form-group">
            <label for="mtn-api-key">Clé API</label>
            <div class="password-input">
              <input
                :type="showMtnApiKey ? 'text' : 'password'"
                id="mtn-api-key"
                v-model="paymentSettings.mtn_money.api_key"
                placeholder="Votre clé API MTN"
              />
              <button type="button" class="toggle-password" @click="showMtnApiKey = !showMtnApiKey">
                <i :class="showMtnApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="mtn-phone">Numéro de téléphone marchand</label>
            <input
              type="text"
              id="mtn-phone"
              v-model="paymentSettings.mtn_money.phone"
              placeholder="Ex: 05XXXXXXXX"
            />
            <p class="input-help">
              Numéro de téléphone MTN Mobile Money associé à votre compte marchand.
            </p>
          </div>
          <div class="form-group">
            <label for="mtn-mode">Mode</label>
            <select id="mtn-mode" v-model="paymentSettings.mtn_money.mode">
              <option value="test">Test</option>
              <option value="live">Production</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" @click="testMtnMoneyConnection">
              <i class="fas fa-vial"></i> Tester la connexion
            </button>
          </div>
        </div>
      </div>

      <!-- Paramètres de paiement -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Paramètres de paiement</h2>
          <p class="help-text">
            Configurez les options générales de paiement pour votre entreprise.
          </p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="payment-currency">Devise</label>
            <select id="payment-currency" v-model="paymentSettings.general.currency">
              <option value="XOF">Franc CFA (XOF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar américain (USD)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="payment-delay">Délai de paiement (jours)</label>
            <input
              type="number"
              id="payment-delay"
              v-model.number="paymentSettings.general.payment_delay"
              min="0"
              max="30"
            />
            <p class="input-help">
              Nombre de jours avant que le paiement ne soit considéré comme en retard.
            </p>
          </div>
          <div class="form-group checkbox-group">
            <input
              type="checkbox"
              id="auto-invoice"
              v-model="paymentSettings.general.auto_invoice"
            />
            <label for="auto-invoice">Générer automatiquement les factures</label>
          </div>
          <div class="form-group checkbox-group">
            <input
              type="checkbox"
              id="payment-reminder"
              v-model="paymentSettings.general.payment_reminder"
            />
            <label for="payment-reminder">Envoyer des rappels de paiement</label>
          </div>
        </div>
      </div>

      <!-- Informations de facturation -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Informations de facturation</h2>
          <p class="help-text">Ces informations apparaîtront sur vos factures.</p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="billing-name">Nom de l'entreprise</label>
            <input
              type="text"
              id="billing-name"
              v-model="paymentSettings.billing.company_name"
              placeholder="Nom de votre entreprise"
            />
          </div>
          <div class="form-group">
            <label for="billing-address">Adresse</label>
            <textarea
              id="billing-address"
              v-model="paymentSettings.billing.address"
              rows="3"
              placeholder="Adresse complète de votre entreprise"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="billing-phone">Téléphone</label>
            <input
              type="text"
              id="billing-phone"
              v-model="paymentSettings.billing.phone"
              placeholder="Numéro de téléphone"
            />
          </div>
          <div class="form-group">
            <label for="billing-email">Email</label>
            <input
              type="email"
              id="billing-email"
              v-model="paymentSettings.billing.email"
              placeholder="Adresse email"
            />
          </div>
          <div class="form-group">
            <label for="billing-tax-id">Numéro d'identification fiscale</label>
            <input
              type="text"
              id="billing-tax-id"
              v-model="paymentSettings.billing.tax_id"
              placeholder="Numéro d'identification fiscale"
            />
          </div>
          <div class="form-group">
            <label for="billing-logo">Logo de l'entreprise</label>
            <div class="logo-upload">
              <div v-if="paymentSettings.billing.logo_url" class="logo-preview">
                <img :src="paymentSettings.billing.logo_url" alt="Logo de l'entreprise" />
                <button type="button" class="btn-remove-logo" @click="removeLogo">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <input type="file" id="billing-logo" @change="handleLogoUpload" accept="image/*" />
              <label for="billing-logo" class="upload-label">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>Choisir un logo</span>
              </label>
              <p class="help-text">Format JPG ou PNG, max 1MB. Taille recommandée: 300x100px</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { getPaymentSettings, updatePaymentSettings, testPaymentConnection } from '@/api/payments'
import { uploadImage } from '@/api/storage'

export default {
  name: 'PaymentSettingsView',
  setup() {
    const { showToast } = useToast()

    // État
    const loading = ref(true)
    const error = ref(null)
    const isSaving = ref(false)
    const showSecretKey = ref(false)
    const showOrangeMerchantKey = ref(false)
    const showMtnApiKey = ref(false)

    // Méthodes de paiement disponibles
    const paymentMethods = [
      {
        id: 'cash',
        name: 'Paiement en espèces',
        description: 'Le client paie en espèces à la livraison',
        icon: '/images/payment/cash.png',
      },
      {
        id: 'cinetpay',
        name: 'CinetPay',
        description: 'Intégration avec CinetPay pour les paiements mobiles et cartes',
        icon: '/images/payment/cinetpay.png',
      },
      {
        id: 'orange_money',
        name: 'Orange Money',
        description: 'Paiements via Orange Money',
        icon: '/images/payment/orange-money.png',
      },
      {
        id: 'mtn_money',
        name: 'MTN Mobile Money',
        description: 'Paiements via MTN Mobile Money',
        icon: '/images/payment/mtn-money.png',
      },
      {
        id: 'moov_money',
        name: 'Moov Money',
        description: 'Paiements via Moov Money',
        icon: '/images/payment/moov-money.png',
      },
      {
        id: 'bank_transfer',
        name: 'Virement bancaire',
        description: 'Paiement par virement bancaire',
        icon: '/images/payment/bank-transfer.png',
      },
    ]

    // Paramètres de paiement
    const paymentSettings = reactive({
      active_methods: ['cash'],
      cinetpay: {
        site_id: '',
        api_key: '',
        secret_key: '',
        mode: 'test',
      },
      orange_money: {
        merchant_id: '',
        merchant_key: '',
        phone: '',
        mode: 'test',
      },
      mtn_money: {
        api_user: '',
        api_key: '',
        phone: '',
        mode: 'test',
      },
      general: {
        currency: 'XOF',
        payment_delay: 7,
        auto_invoice: true,
        payment_reminder: true,
      },
      billing: {
        company_name: '',
        address: '',
        phone: '',
        email: '',
        tax_id: '',
        logo_url: '',
      },
    })

    // Méthodes
    const fetchPaymentSettings = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await getPaymentSettings()

        // Mettre à jour les paramètres avec les données reçues
        if (response.data.active_methods) {
          paymentSettings.active_methods = response.data.active_methods
        }

        if (response.data.cinetpay) {
          Object.assign(paymentSettings.cinetpay, response.data.cinetpay)
        }

        if (response.data.orange_money) {
          Object.assign(paymentSettings.orange_money, response.data.orange_money)
        }

        if (response.data.mtn_money) {
          Object.assign(paymentSettings.mtn_money, response.data.mtn_money)
        }

        if (response.data.general) {
          Object.assign(paymentSettings.general, response.data.general)
        }

        if (response.data.billing) {
          Object.assign(paymentSettings.billing, response.data.billing)
        }
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres de paiement:', err)
        error.value = 'Impossible de charger les paramètres de paiement. Veuillez réessayer.'
      } finally {
        loading.value = false
      }
    }

    const saveSettings = async () => {
      isSaving.value = true

      try {
        await updatePaymentSettings(paymentSettings)
        showToast('Succès', 'Les paramètres de paiement ont été enregistrés avec succès', 'success')
      } catch (err) {
        console.error("Erreur lors de l'enregistrement des paramètres de paiement:", err)
        showToast(
          'Erreur',
          "Impossible d'enregistrer les paramètres de paiement. Veuillez réessayer.",
          'error'
        )
      } finally {
        isSaving.value = false
      }
    }

    const isMethodActive = methodId => {
      return paymentSettings.active_methods.includes(methodId)
    }

    const togglePaymentMethod = methodId => {
      if (isMethodActive(methodId)) {
        // Retirer la méthode
        paymentSettings.active_methods = paymentSettings.active_methods.filter(
          id => id !== methodId
        )
      } else {
        // Ajouter la méthode
        paymentSettings.active_methods.push(methodId)
      }
    }

    const testCinetPayConnection = async () => {
      try {
        const response = await testPaymentConnection('cinetpay', paymentSettings.cinetpay)

        if (response.data.success) {
          showToast('Succès', 'Connexion à CinetPay établie avec succès', 'success')
        } else {
          showToast('Erreur', `Échec de la connexion à CinetPay: ${response.data.message}`, 'error')
        }
      } catch (err) {
        console.error('Erreur lors du test de connexion CinetPay:', err)
        showToast(
          'Erreur',
          'Impossible de tester la connexion à CinetPay. Veuillez vérifier vos identifiants.',
          'error'
        )
      }
    }

    const testOrangeMoneyConnection = async () => {
      try {
        const response = await testPaymentConnection('orange_money', paymentSettings.orange_money)

        if (response.data.success) {
          showToast('Succès', 'Connexion à Orange Money établie avec succès', 'success')
        } else {
          showToast(
            'Erreur',
            `Échec de la connexion à Orange Money: ${response.data.message}`,
            'error'
          )
        }
      } catch (err) {
        console.error('Erreur lors du test de connexion Orange Money:', err)
        showToast(
          'Erreur',
          'Impossible de tester la connexion à Orange Money. Veuillez vérifier vos identifiants.',
          'error'
        )
      }
    }

    const testMtnMoneyConnection = async () => {
      try {
        const response = await testPaymentConnection('mtn_money', paymentSettings.mtn_money)

        if (response.data.success) {
          showToast('Succès', 'Connexion à MTN Mobile Money établie avec succès', 'success')
        } else {
          showToast(
            'Erreur',
            `Échec de la connexion à MTN Mobile Money: ${response.data.message}`,
            'error'
          )
        }
      } catch (err) {
        console.error('Erreur lors du test de connexion MTN Mobile Money:', err)
        showToast(
          'Erreur',
          'Impossible de tester la connexion à MTN Mobile Money. Veuillez vérifier vos identifiants.',
          'error'
        )
      }
    }

    const handleLogoUpload = async event => {
      const file = event.target.files[0]
      if (!file) return

      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        showToast('Erreur', 'Veuillez sélectionner une image (JPG, PNG)', 'error')
        return
      }

      // Vérifier la taille du fichier (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        showToast('Erreur', "L'image ne doit pas dépasser 1MB", 'error')
        return
      }

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await uploadImage(formData)
        paymentSettings.billing.logo_url = response.data.url

        showToast('Succès', 'Logo téléchargé avec succès', 'success')
      } catch (err) {
        console.error('Erreur lors du téléchargement du logo:', err)
        showToast('Erreur', 'Impossible de télécharger le logo. Veuillez réessayer.', 'error')
      }
    }

    const removeLogo = () => {
      paymentSettings.billing.logo_url = ''
    }

    // Cycle de vie
    onMounted(() => {
      fetchPaymentSettings()
    })

    return {
      loading,
      error,
      isSaving,
      showSecretKey,
      showOrangeMerchantKey,
      showMtnApiKey,
      paymentMethods,
      paymentSettings,

      fetchPaymentSettings,
      saveSettings,
      isMethodActive,
      togglePaymentMethod,
      testCinetPayConnection,
      testOrangeMoneyConnection,
      testMtnMoneyConnection,
      handleLogoUpload,
      removeLogo,
    }
  },
}
</script>

<style scoped>
.payment-settings-container {
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
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.help-text {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.card-body {
  padding: 1.5rem;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-method-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method-item:hover {
  background-color: #f8f9fa;
}

.payment-method-item.active {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

.payment-method-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.payment-method-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.payment-method-info {
  flex: 1;
}

.payment-method-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.payment-method-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.payment-method-toggle {
  margin-left: 1rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
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
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.toggle-switch label:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: #007bff;
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
}

.input-help {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input {
  width: auto;
}

.checkbox-group label {
  margin-bottom: 0;
}

.logo-upload {
  border: 2px dashed #ced4da;
  border-radius: 0.25rem;
  padding: 1rem;
  text-align: center;
}

.logo-preview {
  position: relative;
  margin-bottom: 1rem;
}

.logo-preview img {
  max-width: 100%;
  max-height: 100px;
  border-radius: 0.25rem;
}

.btn-remove-logo {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #dc3545;
}

input[type='file'] {
  display: none;
}

.upload-label {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.upload-label i {
  margin-right: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  border: 1px solid #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}

.btn-outline {
  background-color: white;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background-color: #f8f9fa;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header button {
    width: 100%;
  }

  .payment-method-item {
    flex-direction: column;
    text-align: center;
  }

  .payment-method-icon {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .payment-method-toggle {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>