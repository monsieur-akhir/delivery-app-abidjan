import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView
} from 'react-native'
import EmailService, { EmailServiceStatus } from '../../services/EmailService'

interface EmailTestScreenProps {
  navigation: any
}

const EmailTestScreen: React.FC<EmailTestScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<EmailServiceStatus | null>(null)
  const [results, setResults] = useState<string[]>([])

  // Form states
  const [simpleEmail, setSimpleEmail] = useState({
    to_email: '',
    subject: '',
    text_content: '',
    html_content: ''
  })

  const [otpEmail, setOtpEmail] = useState({
    email: '',
    code: '',
    otp_type: 'registration' as 'registration' | 'login' | 'password_reset'
  })

  const [templateEmail, setTemplateEmail] = useState({
    to_email: '',
    template_name: 'welcome',
    variables: {
      name: '',
      company: 'Livraison Abidjan'
    }
  })

  useEffect(() => {
    loadServiceStatus()
  }, [])

  const loadServiceStatus = async () => {
    try {
      const status = await EmailService.getEmailServiceStatus()
      setServiceStatus(status)
      addResult('✅ Statut du service email chargé')
    } catch (error) {
      addResult('❌ Erreur lors du chargement du statut')
    }
  }

  const addResult = (message: string) => {
    setResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)])
  }

  const sendSimpleEmail = async () => {
    if (!simpleEmail.to_email || !simpleEmail.subject || !simpleEmail.text_content) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const result = await EmailService.sendEmail(simpleEmail)
      addResult(`✅ Email simple envoyé: ${result.message}`)
      setSimpleEmail({ to_email: '', subject: '', text_content: '', html_content: '' })
    } catch (error: any) {
      addResult(`❌ Erreur email simple: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendOTPEmail = async () => {
    if (!otpEmail.email || !otpEmail.code) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const result = await EmailService.sendOTPEmail(otpEmail)
      addResult(`✅ Email OTP envoyé: ${result.message}`)
      setOtpEmail({ email: '', code: '', otp_type: 'registration' })
    } catch (error: any) {
      addResult(`❌ Erreur email OTP: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendTemplateEmail = async () => {
    if (!templateEmail.to_email || !templateEmail.variables.name) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const result = await EmailService.sendTemplateEmail(templateEmail)
      addResult(`✅ Email template envoyé: ${result.message}`)
      setTemplateEmail({
        to_email: '',
        template_name: 'welcome',
        variables: { name: '', company: 'Livraison Abidjan' }
      })
    } catch (error: any) {
      addResult(`❌ Erreur email template: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!simpleEmail.to_email) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email')
      return
    }

    setLoading(true)
    try {
      const result = await EmailService.sendTestEmail(simpleEmail.to_email)
      addResult(`✅ Email de test envoyé: ${result.message}`)
    } catch (error: any) {
      addResult(`❌ Erreur email de test: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendWelcomeEmail = async () => {
    if (!templateEmail.to_email || !templateEmail.variables.name) {
      Alert.alert('Erreur', 'Veuillez entrer email et nom')
      return
    }

    setLoading(true)
    try {
      const result = await EmailService.sendWelcomeEmail(
        templateEmail.to_email,
        templateEmail.variables.name
      )
      addResult(`✅ Email de bienvenue envoyé: ${result.message}`)
    } catch (error: any) {
      addResult(`❌ Erreur email de bienvenue: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>📧 Test API Email</Text>
          <Text style={styles.subtitle}>Testez les fonctionnalités email</Text>
        </View>

        {/* Statut du service */}
        {serviceStatus && (
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>Statut du Service</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Brevo:</Text>
              <Text style={[styles.statusValue, serviceStatus.brevo_enabled ? styles.success : styles.error]}>
                {serviceStatus.brevo_enabled ? '✅ Activé' : '❌ Désactivé'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>SMTP:</Text>
              <Text style={[styles.statusValue, serviceStatus.smtp_configured ? styles.success : styles.error]}>
                {serviceStatus.smtp_configured ? '✅ Configuré' : '❌ Non configuré'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Service:</Text>
              <Text style={[styles.statusValue, serviceStatus.email_enabled ? styles.success : styles.error]}>
                {serviceStatus.email_enabled ? '✅ Activé' : '❌ Désactivé'}
              </Text>
            </View>
          </View>
        )}

        {/* Email simple */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📧 Email Simple</Text>
          <TextInput
            style={styles.input}
            placeholder="Destinataire (email)"
            value={simpleEmail.to_email}
            onChangeText={(text) => setSimpleEmail(prev => ({ ...prev, to_email: text }))}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Sujet"
            value={simpleEmail.subject}
            onChangeText={(text) => setSimpleEmail(prev => ({ ...prev, subject: text }))}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contenu texte"
            value={simpleEmail.text_content}
            onChangeText={(text) => setSimpleEmail(prev => ({ ...prev, text_content: text }))}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={sendSimpleEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Envoyer Email Simple</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Email OTP */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔐 Email OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Destinataire (email)"
            value={otpEmail.email}
            onChangeText={(text) => setOtpEmail(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Code OTP"
            value={otpEmail.code}
            onChangeText={(text) => setOtpEmail(prev => ({ ...prev, code: text }))}
            maxLength={10}
          />
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Type d'OTP:</Text>
            <View style={styles.pickerButtons}>
              {(['registration', 'login', 'password_reset'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerButton,
                    otpEmail.otp_type === type && styles.pickerButtonActive
                  ]}
                  onPress={() => setOtpEmail(prev => ({ ...prev, otp_type: type }))}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    otpEmail.otp_type === type && styles.pickerButtonTextActive
                  ]}>
                    {type === 'registration' ? 'Inscription' : 
                     type === 'login' ? 'Connexion' : 'Reset'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={sendOTPEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Envoyer Email OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Email template */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Email Template</Text>
          <TextInput
            style={styles.input}
            placeholder="Destinataire (email)"
            value={templateEmail.to_email}
            onChangeText={(text) => setTemplateEmail(prev => ({ ...prev, to_email: text }))}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Nom du destinataire"
            value={templateEmail.variables.name}
            onChangeText={(text) => setTemplateEmail(prev => ({
              ...prev,
              variables: { ...prev.variables, name: text }
            }))}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={sendWelcomeEmail}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Email Bienvenue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={sendTemplateEmail}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Email Template</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Actions Rapides</Text>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={sendTestEmail}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Email de Test</Text>
          </TouchableOpacity>
        </View>

        {/* Résultats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Résultats</Text>
          <ScrollView style={styles.resultsContainer}>
            {results.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
            {results.length === 0 && (
              <Text style={styles.noResults}>Aucun résultat pour le moment</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  success: {
    color: '#27ae60'
  },
  error: {
    color: '#e74c3c'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    marginBottom: 12
  },
  pickerLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 8
  },
  pickerButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center'
  },
  pickerButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db'
  },
  pickerButtonText: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  pickerButtonTextActive: {
    color: 'white'
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  primaryButton: {
    backgroundColor: '#3498db'
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3498db'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8
  },
  resultsContainer: {
    maxHeight: 200
  },
  resultText: {
    fontSize: 12,
    color: '#2c3e50',
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  noResults: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center'
  }
})

export default EmailTestScreen 