<template>
  <div class="email-management">
    <div class="page-header">
      <h1>📧 Gestion des Emails</h1>
      <p>Envoyez des emails via l'API de Livraison Abidjan</p>
    </div>

    <!-- Statut du service -->
    <div class="status-card" v-if="serviceStatus">
      <h3>Statut du Service Email</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">Brevo:</span>
          <span :class="['status', serviceStatus.brevo_enabled ? 'success' : 'error']">
            {{ serviceStatus.brevo_enabled ? '✅ Activé' : '❌ Désactivé' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">SMTP:</span>
          <span :class="['status', serviceStatus.smtp_configured ? 'success' : 'error']">
            {{ serviceStatus.smtp_configured ? '✅ Configuré' : '❌ Non configuré' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">Service:</span>
          <span :class="['status', serviceStatus.email_enabled ? 'success' : 'error']">
            {{ serviceStatus.email_enabled ? '✅ Activé' : '❌ Désactivé' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">Expéditeur:</span>
          <span class="value">{{ serviceStatus.from_email }}</span>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Email simple -->
    <div v-if="activeTab === 'simple'" class="tab-content">
      <div class="form-card">
        <h3>📧 Envoyer un Email Simple</h3>
        <form @submit.prevent="sendSimpleEmail">
          <div class="form-group">
            <label for="to-email">Destinataire *</label>
            <input 
              id="to-email"
              v-model="simpleEmail.to_email"
              type="email"
              required
              placeholder="destinataire@example.com"
            />
          </div>
          
          <div class="form-group">
            <label for="subject">Sujet *</label>
            <input 
              id="subject"
              v-model="simpleEmail.subject"
              type="text"
              required
              placeholder="Sujet de l'email"
            />
          </div>
          
          <div class="form-group">
            <label for="text-content">Contenu Texte *</label>
            <textarea 
              id="text-content"
              v-model="simpleEmail.text_content"
              required
              rows="4"
              placeholder="Contenu texte de l'email"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="html-content">Contenu HTML (optionnel)</label>
            <textarea 
              id="html-content"
              v-model="simpleEmail.html_content"
              rows="6"
              placeholder="<html><body>Contenu HTML...</body></html>"
            ></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Envoi en cours...' : 'Envoyer l\'email' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Email OTP -->
    <div v-if="activeTab === 'otp'" class="tab-content">
      <div class="form-card">
        <h3>🔐 Envoyer un Email OTP</h3>
        <form @submit.prevent="sendOTPEmail">
          <div class="form-group">
            <label for="otp-email">Destinataire *</label>
            <input 
              id="otp-email"
              v-model="otpEmail.email"
              type="email"
              required
              placeholder="destinataire@example.com"
            />
          </div>
          
          <div class="form-group">
            <label for="otp-code">Code OTP *</label>
            <input 
              id="otp-code"
              v-model="otpEmail.code"
              type="text"
              required
              placeholder="123456"
              maxlength="10"
            />
          </div>
          
          <div class="form-group">
            <label for="otp-type">Type d'OTP *</label>
            <select id="otp-type" v-model="otpEmail.otp_type" required>
              <option value="">Sélectionner un type</option>
              <option value="registration">Inscription</option>
              <option value="login">Connexion</option>
              <option value="password_reset">Réinitialisation mot de passe</option>
            </select>
          </div>
          
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Envoi en cours...' : 'Envoyer l\'OTP' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Email avec template -->
    <div v-if="activeTab === 'template'" class="tab-content">
      <div class="form-card">
        <h3>📋 Envoyer un Email avec Template</h3>
        <form @submit.prevent="sendTemplateEmail">
          <div class="form-group">
            <label for="template-email">Destinataire *</label>
            <input 
              id="template-email"
              v-model="templateEmail.to_email"
              type="email"
              required
              placeholder="destinataire@example.com"
            />
          </div>
          
          <div class="form-group">
            <label for="template-name">Template *</label>
            <select id="template-name" v-model="templateEmail.template_name" required @change="updateTemplateVariables">
              <option value="">Sélectionner un template</option>
              <option v-for="template in availableTemplates" :key="template" :value="template">
                {{ getTemplateLabel(template) }}
              </option>
            </select>
          </div>
          
          <div class="form-group" v-if="templateEmail.template_name">
            <label>Variables du Template</label>
            <div class="variables-grid">
              <div v-for="(value, key) in templateEmail.variables" :key="key" class="variable-item">
                <label :for="`var-${key}`">{{ key }}:</label>
                <input 
                  :id="`var-${key}`"
                  v-model="templateEmail.variables[key]"
                  type="text"
                  :placeholder="`Valeur pour ${key}`"
                />
              </div>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Envoi en cours...' : 'Envoyer avec template' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Emails en masse -->
    <div v-if="activeTab === 'bulk'" class="tab-content">
      <div class="form-card">
        <h3>📬 Envoyer des Emails en Masse</h3>
        <form @submit.prevent="sendBulkEmails">
          <div class="form-group">
            <label for="bulk-emails">Destinataires *</label>
            <textarea 
              id="bulk-emails"
              v-model="bulkEmails.emails_text"
              required
              rows="4"
              placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
            ></textarea>
            <small>Un email par ligne (max 100 destinataires)</small>
          </div>
          
          <div class="form-group">
            <label for="bulk-subject">Sujet *</label>
            <input 
              id="bulk-subject"
              v-model="bulkEmails.subject"
              type="text"
              required
              placeholder="Sujet de l'email"
            />
          </div>
          
          <div class="form-group">
            <label for="bulk-text">Contenu Texte *</label>
            <textarea 
              id="bulk-text"
              v-model="bulkEmails.text_content"
              required
              rows="4"
              placeholder="Contenu texte de l'email"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="bulk-html">Contenu HTML (optionnel)</label>
            <textarea 
              id="bulk-html"
              v-model="bulkEmails.html_content"
              rows="6"
              placeholder="<html><body>Contenu HTML...</body></html>"
            ></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Envoi en cours...' : 'Envoyer en masse' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Résultats -->
    <div v-if="results.length > 0" class="results-section">
      <h3>📊 Résultats</h3>
      <div class="results-list">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          :class="['result-item', result.success ? 'success' : 'error']"
        >
          <div class="result-header">
            <span class="result-icon">{{ result.success ? '✅' : '❌' }}</span>
            <span class="result-title">{{ result.title }}</span>
            <span class="result-time">{{ formatTime(result.timestamp) }}</span>
          </div>
          <div class="result-message">{{ result.message }}</div>
          <div v-if="result.details" class="result-details">
            <pre>{{ JSON.stringify(result.details, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import emailApi from '@/api/email'

export default {
  name: 'EmailManagementView',
  data() {
    return {
      activeTab: 'simple',
      loading: false,
      serviceStatus: null,
      availableTemplates: [],
      
      tabs: [
        { id: 'simple', label: '📧 Email Simple' },
        { id: 'otp', label: '🔐 Email OTP' },
        { id: 'template', label: '📋 Email Template' },
        { id: 'bulk', label: '📬 Emails en Masse' }
      ],
      
      simpleEmail: {
        to_email: '',
        subject: '',
        text_content: '',
        html_content: ''
      },
      
      otpEmail: {
        email: '',
        code: '',
        otp_type: ''
      },
      
      templateEmail: {
        to_email: '',
        template_name: '',
        variables: {}
      },
      
      bulkEmails: {
        emails_text: '',
        subject: '',
        text_content: '',
        html_content: ''
      },
      
      results: []
    }
  },
  
  async mounted() {
    await this.loadServiceStatus()
    await this.loadTemplates()
  },
  
  methods: {
    async loadServiceStatus() {
      try {
        this.serviceStatus = await emailApi.getEmailServiceStatus()
      } catch (error) {
        console.error('Erreur lors du chargement du statut:', error)
      }
    },
    
    async loadTemplates() {
      try {
        this.availableTemplates = await emailApi.getTemplates()
      } catch (error) {
        console.error('Erreur lors du chargement des templates:', error)
      }
    },
    
    getTemplateLabel(template) {
      const labels = {
        'welcome': 'Bienvenue',
        'delivery_update': 'Mise à jour livraison',
        'payment_confirmation': 'Confirmation paiement'
      }
      return labels[template] || template
    },
    
    updateTemplateVariables() {
      const template = this.templateEmail.template_name
      const defaultVariables = {
        'welcome': { name: '', company: 'Livraison Abidjan' },
        'delivery_update': { name: '', delivery_id: '', status: '', address: '' },
        'payment_confirmation': { name: '', amount: '', transaction_id: '', date: '' }
      }
      
      this.templateEmail.variables = { ...defaultVariables[template] } || {}
    },
    
    async sendSimpleEmail() {
      this.loading = true
      try {
        const result = await emailApi.sendEmail(this.simpleEmail)
        this.addResult('Email Simple', true, 'Email envoyé avec succès', result)
        this.resetSimpleEmail()
      } catch (error) {
        this.addResult('Email Simple', false, 'Erreur lors de l\'envoi', error.response?.data)
      } finally {
        this.loading = false
      }
    },
    
    async sendOTPEmail() {
      this.loading = true
      try {
        const result = await emailApi.sendOTPEmail(this.otpEmail)
        this.addResult('Email OTP', true, 'OTP envoyé avec succès', result)
        this.resetOTPEmail()
      } catch (error) {
        this.addResult('Email OTP', false, 'Erreur lors de l\'envoi', error.response?.data)
      } finally {
        this.loading = false
      }
    },
    
    async sendTemplateEmail() {
      this.loading = true
      try {
        const result = await emailApi.sendTemplateEmail(this.templateEmail)
        this.addResult('Email Template', true, 'Email template envoyé avec succès', result)
        this.resetTemplateEmail()
      } catch (error) {
        this.addResult('Email Template', false, 'Erreur lors de l\'envoi', error.response?.data)
      } finally {
        this.loading = false
      }
    },
    
    async sendBulkEmails() {
      this.loading = true
      try {
        const emails = this.bulkEmails.emails_text
          .split('\n')
          .map(email => email.trim())
          .filter(email => email && email.includes('@'))
        
        if (emails.length === 0) {
          throw new Error('Aucun email valide fourni')
        }
        
        if (emails.length > 100) {
          throw new Error('Maximum 100 destinataires autorisés')
        }
        
        const bulkData = {
          emails: emails,
          subject: this.bulkEmails.subject,
          text_content: this.bulkEmails.text_content,
          html_content: this.bulkEmails.html_content
        }
        
        const result = await emailApi.sendBulkEmails(bulkData)
        this.addResult('Emails en Masse', true, `Envoi terminé: ${result.success_count}/${result.total_sent} succès`, result)
        this.resetBulkEmails()
      } catch (error) {
        this.addResult('Emails en Masse', false, 'Erreur lors de l\'envoi', error.response?.data || error.message)
      } finally {
        this.loading = false
      }
    },
    
    addResult(title, success, message, details = null) {
      this.results.unshift({
        title,
        success,
        message,
        details,
        timestamp: new Date()
      })
      
      // Garder seulement les 10 derniers résultats
      if (this.results.length > 10) {
        this.results = this.results.slice(0, 10)
      }
    },
    
    formatTime(date) {
      return new Date(date).toLocaleTimeString('fr-FR')
    },
    
    resetSimpleEmail() {
      this.simpleEmail = {
        to_email: '',
        subject: '',
        text_content: '',
        html_content: ''
      }
    },
    
    resetOTPEmail() {
      this.otpEmail = {
        email: '',
        code: '',
        otp_type: ''
      }
    },
    
    resetTemplateEmail() {
      this.templateEmail = {
        to_email: '',
        template_name: '',
        variables: {}
      }
    },
    
    resetBulkEmails() {
      this.bulkEmails = {
        emails_text: '',
        subject: '',
        text_content: '',
        html_content: ''
      }
    }
  }
}
</script>

<style scoped>
.email-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.status-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
}

.status.success {
  color: #28a745;
  font-weight: bold;
}

.status.error {
  color: #dc3545;
  font-weight: bold;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 10px;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s;
}

.tab-button:hover {
  background: #f8f9fa;
}

.tab-button.active {
  background: #007bff;
  color: white;
}

.form-card {
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-card h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #495057;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group small {
  color: #6c757d;
  font-size: 12px;
}

.variables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.variable-item {
  display: flex;
  flex-direction: column;
}

.variable-item label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #495057;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.results-section {
  margin-top: 40px;
}

.results-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-item {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-left: 4px solid;
}

.result-item.success {
  border-left-color: #28a745;
}

.result-item.error {
  border-left-color: #dc3545;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.result-icon {
  font-size: 18px;
}

.result-title {
  font-weight: bold;
  color: #2c3e50;
}

.result-time {
  margin-left: auto;
  color: #6c757d;
  font-size: 12px;
}

.result-message {
  color: #495057;
  margin-bottom: 10px;
}

.result-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
}

.result-details pre {
  margin: 0;
  white-space: pre-wrap;
}
</style> 