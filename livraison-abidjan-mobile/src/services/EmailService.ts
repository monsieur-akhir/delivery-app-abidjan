import api from './api'

export interface EmailRequest {
  to_email: string
  subject: string
  text_content: string
  html_content?: string
}

export interface OTPEmailRequest {
  email: string
  code: string
  otp_type: 'registration' | 'login' | 'password_reset'
}

export interface TemplateEmailRequest {
  to_email: string
  template_name: string
  variables: Record<string, any>
}

export interface BulkEmailRequest {
  emails: string[]
  subject: string
  text_content: string
  html_content?: string
}

export interface EmailResponse {
  success: boolean
  message: string
  to_email: string
  subject: string
  sent_at?: string
}

export interface OTPEmailResponse {
  success: boolean
  message: string
  email: string
  otp_type: string
  sent_at?: string
}

export interface BulkEmailResponse {
  success: boolean
  message: string
  total_sent: number
  success_count: number
  failure_count: number
  results: Array<{
    email: string
    status: string
    error?: string
  }>
}

export interface EmailServiceStatus {
  brevo_enabled: boolean
  smtp_configured: boolean
  email_enabled: boolean
  from_email: string
  from_name: string
}

class EmailService {
  /**
   * Envoyer un email personnalisé
   */
  static async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    try {
      const response = await api.post('/email/send', emailData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email:', error)
      throw error
    }
  }

  /**
   * Envoyer un email OTP
   */
  static async sendOTPEmail(otpData: OTPEmailRequest): Promise<OTPEmailResponse> {
    try {
      const response = await api.post('/email/send-otp', otpData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email OTP:', error)
      throw error
    }
  }

  /**
   * Envoyer un email avec template
   */
  static async sendTemplateEmail(templateData: TemplateEmailRequest): Promise<EmailResponse> {
    try {
      const response = await api.post('/email/send-template', templateData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email template:', error)
      throw error
    }
  }

  /**
   * Envoyer des emails en masse
   */
  static async sendBulkEmails(bulkData: BulkEmailRequest): Promise<BulkEmailResponse> {
    try {
      const response = await api.post('/email/send-bulk', bulkData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'emails en masse:', error)
      throw error
    }
  }

  /**
   * Obtenir la liste des templates disponibles
   */
  static async getTemplates(): Promise<string[]> {
    try {
      const response = await api.get('/email/templates')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error)
      throw error
    }
  }

  /**
   * Obtenir le statut du service email
   */
  static async getEmailServiceStatus(): Promise<EmailServiceStatus> {
    try {
      const response = await api.get('/email/status')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      throw error
    }
  }

  /**
   * Envoyer un email de bienvenue
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<EmailResponse> {
    return this.sendTemplateEmail({
      to_email: email,
      template_name: 'welcome',
      variables: {
        name: name,
        company: 'Livraison Abidjan'
      }
    })
  }

  /**
   * Envoyer un email de notification de livraison
   */
  static async sendDeliveryNotificationEmail(
    email: string, 
    name: string, 
    deliveryId: string, 
    status: string, 
    address: string
  ): Promise<EmailResponse> {
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
  }

  /**
   * Envoyer un email de confirmation de paiement
   */
  static async sendPaymentConfirmationEmail(
    email: string, 
    name: string, 
    amount: string, 
    transactionId: string
  ): Promise<EmailResponse> {
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

  /**
   * Envoyer un email OTP d'inscription
   */
  static async sendRegistrationOTP(email: string, code: string): Promise<OTPEmailResponse> {
    return this.sendOTPEmail({
      email: email,
      code: code,
      otp_type: 'registration'
    })
  }

  /**
   * Envoyer un email OTP de connexion
   */
  static async sendLoginOTP(email: string, code: string): Promise<OTPEmailResponse> {
    return this.sendOTPEmail({
      email: email,
      code: code,
      otp_type: 'login'
    })
  }

  /**
   * Envoyer un email OTP de réinitialisation de mot de passe
   */
  static async sendPasswordResetOTP(email: string, code: string): Promise<OTPEmailResponse> {
    return this.sendOTPEmail({
      email: email,
      code: code,
      otp_type: 'password_reset'
    })
  }

  /**
   * Vérifier si le service email est disponible
   */
  static async isEmailServiceAvailable(): Promise<boolean> {
    try {
      const status = await this.getEmailServiceStatus()
      return status.email_enabled && (status.brevo_enabled || status.smtp_configured)
    } catch (error) {
      console.error('Erreur lors de la vérification du service email:', error)
      return false
    }
  }

  /**
   * Envoyer un email de test
   */
  static async sendTestEmail(email: string): Promise<EmailResponse> {
    return this.sendEmail({
      to_email: email,
      subject: 'Test API Email - Livraison Abidjan Mobile',
      text_content: 'Ceci est un test de l\'API email depuis l\'application mobile Livraison Abidjan.',
      html_content: `
        <html>
        <body>
          <h2>Test API Email - Livraison Abidjan Mobile</h2>
          <p>Ceci est un test de l'API email depuis l'application mobile Livraison Abidjan.</p>
          <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
        </body>
        </html>
      `
    })
  }
}

export default EmailService 