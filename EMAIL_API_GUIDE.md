# 📧 Guide d'Utilisation de l'API Email - Livraison Abidjan

## 🚀 Vue d'ensemble

L'API Email de Livraison Abidjan permet d'envoyer des emails via différents canaux :
- **Brevo** (priorité) - Service d'email transactionnel
- **SMTP** (fallback) - Serveur SMTP classique
- **Simulation** (développement) - Pour les tests

## 📋 Endpoints Disponibles

### Base URL
```
http://localhost:8000/api/v1/email
```

### 1. 📊 Statut du Service
```http
GET /api/v1/email/status
```

**Réponse :**
```json
{
  "brevo_enabled": true,
  "smtp_configured": true,
  "email_enabled": true,
  "from_email": "noreply@livraison-abidjan.com",
  "from_name": "Livraison Abidjan"
}
```

### 2. 📧 Email Simple
```http
POST /api/v1/email/send
```

**Corps de la requête :**
```json
{
  "to_email": "destinataire@example.com",
  "subject": "Sujet de l'email",
  "text_content": "Contenu texte de l'email",
  "html_content": "<html><body>Contenu HTML</body></html>"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Email envoyé avec succès",
  "to_email": "destinataire@example.com",
  "subject": "Sujet de l'email",
  "sent_at": "2024-01-15T10:30:00Z"
}
```

### 3. 🔐 Email OTP
```http
POST /api/v1/email/send-otp
```

**Corps de la requête :**
```json
{
  "email": "destinataire@example.com",
  "code": "123456",
  "otp_type": "registration"
}
```

**Types d'OTP disponibles :**
- `registration` - Inscription
- `login` - Connexion
- `password_reset` - Réinitialisation mot de passe

### 4. 📋 Email avec Template
```http
POST /api/v1/email/send-template
```

**Corps de la requête :**
```json
{
  "to_email": "destinataire@example.com",
  "template_name": "welcome",
  "variables": {
    "name": "John Doe",
    "company": "Livraison Abidjan"
  }
}
```

### 5. 📬 Emails en Masse
```http
POST /api/v1/email/send-bulk
```

**Corps de la requête :**
```json
{
  "emails": [
    "email1@example.com",
    "email2@example.com",
    "email3@example.com"
  ],
  "subject": "Sujet de l'email",
  "text_content": "Contenu texte",
  "html_content": "<html><body>Contenu HTML</body></html>"
}
```

### 6. 📋 Templates Disponibles
```http
GET /api/v1/email/templates
```

**Réponse :**
```json
["welcome", "delivery_update", "payment_confirmation"]
```

## 🎨 Templates Disponibles

### 1. Welcome (Bienvenue)
**Variables requises :**
- `name` - Nom du destinataire
- `company` - Nom de l'entreprise

**Utilisation :**
```javascript
await emailApi.sendWelcomeEmail('user@example.com', 'John Doe')
```

### 2. Delivery Update (Mise à jour livraison)
**Variables requises :**
- `name` - Nom du destinataire
- `delivery_id` - ID de la livraison
- `status` - Statut de la livraison
- `address` - Adresse de livraison

**Utilisation :**
```javascript
await emailApi.sendDeliveryNotificationEmail(
  'user@example.com',
  'John Doe',
  '12345',
  'En cours de livraison',
  '123 Rue de la Paix, Abidjan'
)
```

### 3. Payment Confirmation (Confirmation paiement)
**Variables requises :**
- `name` - Nom du destinataire
- `amount` - Montant du paiement
- `transaction_id` - ID de la transaction
- `date` - Date du paiement

**Utilisation :**
```javascript
await emailApi.sendPaymentConfirmationEmail(
  'user@example.com',
  'John Doe',
  '5000 FCFA',
  'TXN123456'
)
```

## 🔧 Configuration

### Variables d'Environnement

```bash
# Service Email
EMAIL_ENABLED=true
EMAIL_PROVIDER=brevo

# Brevo Configuration
BREVO_ENABLED=true
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=noreply@livraison-abidjan.com
BREVO_FROM_NAME=Livraison Abidjan

# SMTP Fallback
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
```

## 💻 Exemples d'Utilisation

### JavaScript/TypeScript (Frontend)

```javascript
import emailApi from './api/email'

// Email simple
const sendSimpleEmail = async () => {
  try {
    const result = await emailApi.sendEmail({
      to_email: 'user@example.com',
      subject: 'Test Email',
      text_content: 'Contenu texte',
      html_content: '<h1>Contenu HTML</h1>'
    })
    console.log('Email envoyé:', result)
  } catch (error) {
    console.error('Erreur:', error)
  }
}

// Email OTP
const sendOTP = async () => {
  try {
    const result = await emailApi.sendOTPEmail({
      email: 'user@example.com',
      code: '123456',
      otp_type: 'registration'
    })
    console.log('OTP envoyé:', result)
  } catch (error) {
    console.error('Erreur:', error)
  }
}

// Email avec template
const sendWelcomeEmail = async () => {
  try {
    const result = await emailApi.sendWelcomeEmail('user@example.com', 'John Doe')
    console.log('Email de bienvenue envoyé:', result)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

### Python (Backend)

```python
import requests

# Email simple
def send_simple_email():
    url = "http://localhost:8000/api/v1/email/send"
    data = {
        "to_email": "user@example.com",
        "subject": "Test Email",
        "text_content": "Contenu texte",
        "html_content": "<h1>Contenu HTML</h1>"
    }
    
    response = requests.post(url, json=data)
    return response.json()

# Email OTP
def send_otp_email():
    url = "http://localhost:8000/api/v1/email/send-otp"
    data = {
        "email": "user@example.com",
        "code": "123456",
        "otp_type": "registration"
    }
    
    response = requests.post(url, json=data)
    return response.json()

# Email avec template
def send_template_email():
    url = "http://localhost:8000/api/v1/email/send-template"
    data = {
        "to_email": "user@example.com",
        "template_name": "welcome",
        "variables": {
            "name": "John Doe",
            "company": "Livraison Abidjan"
        }
    }
    
    response = requests.post(url, json=data)
    return response.json()
```

### cURL

```bash
# Email simple
curl -X POST "http://localhost:8000/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "user@example.com",
    "subject": "Test Email",
    "text_content": "Contenu texte",
    "html_content": "<h1>Contenu HTML</h1>"
  }'

# Email OTP
curl -X POST "http://localhost:8000/api/v1/email/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "otp_type": "registration"
  }'

# Statut du service
curl -X GET "http://localhost:8000/api/v1/email/status"
```

## 🛡️ Sécurité et Permissions

### Authentification
Tous les endpoints nécessitent une authentification JWT.

### Permissions
- **Admin** et **Manager** : Accès complet à tous les endpoints
- **Autres rôles** : Accès limité ou refusé

### Rate Limiting
- **Emails simples** : 10 par minute par utilisateur
- **Emails OTP** : 5 par minute par utilisateur
- **Emails en masse** : 1 par minute par utilisateur

## 🐛 Gestion des Erreurs

### Codes d'Erreur Communs

```json
{
  "400": "Données invalides",
  "401": "Non authentifié",
  "403": "Permissions insuffisantes",
  "404": "Template non trouvé",
  "429": "Rate limit dépassé",
  "500": "Erreur serveur"
}
```

### Exemple de Gestion d'Erreur

```javascript
try {
  const result = await emailApi.sendEmail(emailData)
  console.log('Succès:', result)
} catch (error) {
  if (error.response?.status === 403) {
    console.error('Permissions insuffisantes')
  } else if (error.response?.status === 429) {
    console.error('Trop de requêtes, veuillez attendre')
  } else {
    console.error('Erreur:', error.message)
  }
}
```

## 🧪 Tests

### Script de Test Python

```bash
# Exécuter le script de test
cd backend
python test_email_api.py
```

### Tests Manuels

1. **Vérifier le statut :**
   ```bash
   curl http://localhost:8000/api/v1/email/status
   ```

2. **Tester un email simple :**
   ```bash
   curl -X POST http://localhost:8000/api/v1/email/send \
     -H "Content-Type: application/json" \
     -d '{"to_email":"test@example.com","subject":"Test","text_content":"Test"}'
   ```

3. **Tester un email OTP :**
   ```bash
   curl -X POST http://localhost:8000/api/v1/email/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","code":"123456","otp_type":"registration"}'
   ```

## 📱 Intégration Mobile

### React Native

```typescript
import EmailService from '../services/EmailService'

// Vérifier la disponibilité
const isAvailable = await EmailService.isEmailServiceAvailable()

// Envoyer un email de test
const result = await EmailService.sendTestEmail('user@example.com')

// Envoyer un email de bienvenue
const welcomeResult = await EmailService.sendWelcomeEmail('user@example.com', 'John Doe')
```

## 🌐 Intégration Web

### Vue.js

```javascript
import emailApi from '@/api/email'

// Dans un composant Vue
export default {
  methods: {
    async sendEmail() {
      try {
        const result = await emailApi.sendEmail({
          to_email: this.email,
          subject: this.subject,
          text_content: this.content
        })
        this.$toast.success('Email envoyé avec succès')
      } catch (error) {
        this.$toast.error('Erreur lors de l\'envoi')
      }
    }
  }
}
```

## 📊 Monitoring et Logs

### Logs Disponibles

```bash
# Logs d'envoi
✅ Email Brevo envoyé avec succès à user@example.com
❌ Erreur Brevo 400: Invalid API key

# Logs de statut
📧 EmailService initialisé - Brevo: ✅, SMTP: ✅
⚠️ Brevo a échoué, tentative SMTP...
```

### Métriques

- **Taux de succès** : % d'emails envoyés avec succès
- **Temps de réponse** : Temps moyen d'envoi
- **Erreurs par fournisseur** : Répartition des erreurs Brevo/SMTP

## 🔄 Workflow Recommandé

1. **Vérifier le statut** du service email
2. **Choisir le type** d'email approprié
3. **Préparer les données** selon le format requis
4. **Envoyer l'email** avec gestion d'erreur
5. **Vérifier le résultat** et logger si nécessaire

## 📞 Support

Pour toute question ou problème :
- **Documentation API** : http://localhost:8000/docs
- **Logs serveur** : Vérifier les logs du backend
- **Tests** : Utiliser le script `test_email_api.py`

---

**Version** : 1.0  
**Dernière mise à jour** : Janvier 2024  
**Auteur** : Équipe Livraison Abidjan 