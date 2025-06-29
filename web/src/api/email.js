import axios from 'axios'
import { API_URL } from '../config'

/**
 * Service API pour les emails
 */
export const emailApi = {
  /**
   * Envoyer un email personnalisé
   * @param {Object} emailData - Données de l'email
   * @param {string} emailData.to_email - Adresse email du destinataire
   * @param {string} emailData.subject - Sujet de l'email
   * @param {string} emailData.text_content - Contenu texte
   * @param {string} emailData.html_content - Contenu HTML (optionnel)
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendEmail(emailData) {
    try {
      const response = await axios.post(`${API_URL}/email/send`, emailData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email:', error)
      throw error
    }
  },

  /**
   * Envoyer un email OTP
   * @param {Object} otpData - Données OTP
   * @param {string} otpData.email - Adresse email du destinataire
   * @param {string} otpData.code - Code OTP
   * @param {string} otpData.otp_type - Type d'OTP (registration, login, password_reset)
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendOTPEmail(otpData) {
    try {
      const response = await axios.post(`${API_URL}/email/send-otp`, otpData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email OTP:', error)
      throw error
    }
  },

  /**
   * Envoyer un email avec template
   * @param {Object} templateData - Données du template
   * @param {string} templateData.to_email - Adresse email du destinataire
   * @param {string} templateData.template_name - Nom du template
   * @param {Object} templateData.variables - Variables à injecter
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendTemplateEmail(templateData) {
    try {
      const response = await axios.post(`${API_URL}/email/send-template`, templateData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email template:', error)
      throw error
    }
  },

  /**
   * Envoyer des emails en masse
   * @param {Object} bulkData - Données pour l'envoi en masse
   * @param {Array<string>} bulkData.emails - Liste des adresses email
   * @param {string} bulkData.subject - Sujet de l'email
   * @param {string} bulkData.text_content - Contenu texte
   * @param {string} bulkData.html_content - Contenu HTML (optionnel)
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendBulkEmails(bulkData) {
    try {
      const response = await axios.post(`${API_URL}/email/send-bulk`, bulkData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'emails en masse:', error)
      throw error
    }
  },

  /**
   * Obtenir la liste des templates disponibles
   * @returns {Promise<Array<string>>} - Liste des templates
   */
  async getTemplates() {
    try {
      const response = await axios.get(`${API_URL}/email/templates`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error)
      throw error
    }
  },

  /**
   * Obtenir le statut du service email
   * @returns {Promise<Object>} - Statut du service
   */
  async getEmailServiceStatus() {
    try {
      const response = await axios.get(`${API_URL}/email/status`)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      throw error
    }
  },

  /**
   * Envoyer un email de bienvenue
   * @param {string} email - Adresse email du destinataire
   * @param {string} name - Nom du destinataire
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendWelcomeEmail(email, name) {
    return this.sendTemplateEmail({
      to_email: email,
      template_name: 'welcome',
      variables: {
        name: name,
        company: 'Livraison Abidjan'
      }
    })
  },

  /**
   * Envoyer un email de notification de livraison
   * @param {string} email - Adresse email du destinataire
   * @param {string} name - Nom du destinataire
   * @param {string} deliveryId - ID de la livraison
   * @param {string} status - Statut de la livraison
   * @param {string} address - Adresse de livraison
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendDeliveryNotificationEmail(email, name, deliveryId, status, address) {
    return this.sendTemplateEmail({
      to_email: email,
      template_name: 'delivery_update',
      variables: {
        name: name,
        delivery_id: deliveryId,
        status: status,
        address: address
      }
    })
  },

  /**
   * Envoyer un email de confirmation de paiement
   * @param {string} email - Adresse email du destinataire
   * @param {string} name - Nom du destinataire
   * @param {string} amount - Montant du paiement
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - Résultat de l'envoi
   */
  async sendPaymentConfirmationEmail(email, name, amount, transactionId) {
    return this.sendTemplateEmail({
      to_email: email,
      template_name: 'payment_confirmation',
      variables: {
        name: name,
        amount: amount,
        transaction_id: transactionId,
        date: new Date().toLocaleDateString('fr-FR')
      }
    })
  }
}

export default emailApi 