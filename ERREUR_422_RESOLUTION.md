# 🔧 RESOLUTION DE L'ERREUR 422 - ENDPOINT `/api/auth/send-otp`

## 📋 **PROBLÈME IDENTIFIÉ**

L'erreur **422 Unprocessable Entity** se produisait lors des appels à l'endpoint `/api/auth/send-otp` à cause d'une **structure de données incorrecte** dans les requêtes.

### ❌ **Cause racine :**
Le fichier `mobile/services/api.ts` contenait une fonction `login` qui :
1. Appelait incorrectement l'endpoint `/api/auth/send-otp` au lieu d'un endpoint de login
2. Utilisait une structure de données incorrecte avec les champs `username` et `password` au lieu de `phone` et `otp_type`

## 🔍 **ANALYSE TECHNIQUE**

### **Schéma attendu par l'API (backend/app/schemas/otp.py) :**
```python
class OTPRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    email: Optional[str] = Field(None, description="Email address (optional)")
    otp_type: OTPType = Field(..., description="Type of OTP")

class OTPType(str, enum.Enum):
    REGISTRATION = "registration"
    LOGIN = "login"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR = "two_factor"
```

### **Structure de requête correcte :**
```json
{
  "phone": "+22507123456",
  "otp_type": "registration",
  "email": "user@example.com"  // optionnel
}
```

### **Structure incorrecte qui causait l'erreur 422 :**
```json
{
  "username": "+22507123456",  // ❌ Champ incorrect
  "password": "test123"        // ❌ Champ non attendu
}
```

## ✅ **CORRECTIONS APPORTÉES**

### 1. **Fichier : `mobile/services/api.ts`**

#### **Avant (ligne 241) :**
```typescript
export const login = async (phone: string, password: string) => {
  const response = await api.post("/api/auth/send-otp", { 
    username: phone,  // ❌ ERREUR
    password: password // ❌ ERREUR
  })
}
```

#### **Après :**
```typescript
export const login = async (phone: string, password: string) => {
  const response = await api.post("/api/auth/login", { 
    phone: phone,      // ✅ CORRECT
    password: password 
  })
}
```

#### **Ajout d'une fonction sendOTP correcte :**
```typescript
export const sendOTP = async (phone: string, otpType: 'registration' | 'login' | 'password_reset' = 'login') => {
  const response = await api.post("/api/auth/send-otp", { 
    phone: phone,     // ✅ CORRECT
    otp_type: otpType // ✅ CORRECT
  })
}
```

### 2. **Fichier : `web/src/api/auth.js`**

#### **Ajout d'une fonction sendOTP pour le frontend web :**
```javascript
export const sendOTP = async data => {
  const response = await axios.post(`${API_URL}/auth/send-otp`, data)
  return response.data
}
```

## 🧪 **TESTS DE VALIDATION**

### **Test 1 - Requête correcte (Status: 200) :**
```bash
curl -X POST http://localhost:8000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+22507123456",
    "otp_type": "registration"
  }'
```

**Résultat :** ✅ `{"success": true, "message": "Code OTP envoyé avec succès"}`

### **Test 2 - Requête incorrecte (Status: 422) :**
```bash
curl -X POST http://localhost:8000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "username": "+22507123456",
    "password": "test123"
  }'
```

**Résultat :** ❌ `{"detail": [{"type": "missing", "loc": ["body", "phone"], "msg": "Field required"}]}`

## 📋 **CHECKLIST DE VÉRIFICATION**

- [x] ✅ Correction de la fonction `login` dans `mobile/services/api.ts`
- [x] ✅ Ajout de la fonction `sendOTP` correcte dans `mobile/services/api.ts`
- [x] ✅ Ajout de la fonction `sendOTP` dans `web/src/api/auth.js`
- [x] ✅ Validation que `mobile/services/AuthService.ts` utilise déjà la bonne structure
- [x] ✅ Tests confirment que l'erreur 422 est résolue pour les bonnes données
- [x] ✅ Tests confirment que l'erreur 422 est toujours déclenchée pour les mauvaises données

## 🔄 **INTÉGRATION DES NOTIFICATIONS**

L'architecture des notifications est maintenant cohérente :

### **Email (Brevo + SMTP fallback) :**
- Service : `backend/app/services/email_service.py`
- Configuration : Variables d'environnement Brevo

### **SMS (Twilio, Africa's Talking, Orange) :**
- Service : `backend/app/services/sms_notification.py`
- Configuration : Variables d'environnement par provider

### **Push Notifications (Firebase FCM + OneSignal) :**
- Service : `backend/app/services/notification.py`
- Worker : `backend/worker.py`

## 🚀 **PROCHAINES ÉTAPES RECOMMANDÉES**

1. **Tester l'intégration complète** avec les vraies configurations Brevo/Firebase
2. **Vérifier les variables d'environnement** de production
3. **Mettre à jour la documentation API** pour clarifier les schémas
4. **Ajouter des tests unitaires** pour prévenir les régressions
5. **Implémenter une validation côté frontend** pour une meilleure UX

## 📞 **DEBUGGING FUTUR**

Si des erreurs 422 se reproduisent :

1. **Vérifier la structure de la requête** avec les outils de développement
2. **Comparer avec le schéma Pydantic** dans `backend/app/schemas/otp.py`
3. **Utiliser le script de test** `test_otp_error.py` pour reproduire le problème
4. **Consulter les logs FastAPI** pour les détails de validation

---

**Date de résolution :** 01 juin 2025  
**Statut :** ✅ RÉSOLU  
**Impact :** 🔧 Critique - Authentification OTP fonctionnelle
