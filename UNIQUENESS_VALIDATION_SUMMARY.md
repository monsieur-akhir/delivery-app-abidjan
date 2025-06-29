# Validation d'Unicité - Numéro de Téléphone et Email

## 🎯 Objectif
Assurer que chaque numéro de téléphone et chaque adresse email soient uniques dans le système d'inscription.

## ✅ Améliorations Apportées

### 1. **Validation Backend (Services)**
- **Fichier**: `backend/app/services/auth.py`
- **Fonctions améliorées**: `register_user()` et `register_user_admin()`

#### Validations ajoutées :
- ✅ **Nettoyage du numéro de téléphone** : Suppression des espaces, tirets, points
- ✅ **Format ivoirien** : Validation des formats `+225`, `225`, ou `0`
- ✅ **Longueur du numéro** : Entre 10 et 15 chiffres
- ✅ **Unicité du numéro** : Vérification en base de données
- ✅ **Nettoyage de l'email** : Conversion en minuscules, suppression des espaces
- ✅ **Format email** : Validation basique (`@` et `.`)
- ✅ **Unicité de l'email** : Vérification en base de données

### 2. **Validation API (Endpoints)**
- **Fichier**: `backend/app/api/auth.py`
- **Endpoints améliorés**: `/register` et `/register-with-otp`

#### Gestion d'erreur robuste :
- ✅ **Validation préliminaire** : Vérification avant appel au service
- ✅ **Gestion ConflictError** : Erreurs 409 pour les conflits d'unicité
- ✅ **Gestion ValueError** : Erreurs 400 pour les validations
- ✅ **Nettoyage automatique** : Suppression de l'utilisateur en cas d'erreur
- ✅ **Logging détaillé** : Traçabilité des erreurs

### 3. **Validation Schémas (Pydantic)**
- **Fichiers**: `backend/app/schemas/user.py` et `backend/app/schemas/otp.py`
- **Schémas améliorés**: `UserBase`, `UserCreate`, `RegisterWithOTPRequest`

#### Validateurs ajoutés :
- ✅ **@validator('phone')** : Validation complète du numéro
- ✅ **@validator('email')** : Validation et nettoyage de l'email
- ✅ **@validator('full_name')** : Validation du nom complet
- ✅ **@validator('password')** : Validation du mot de passe

### 4. **Contraintes Base de Données**
- **Fichier**: `backend/app/models/user.py`
- **Contraintes existantes** :
  ```python
  phone = Column(String, unique=True, index=True)
  email = Column(String, unique=True, index=True, nullable=True)
  ```

### 5. **Script de Test**
- **Fichier**: `backend/test_uniqueness.py`
- **Tests inclus** :
  - ✅ Test d'unicité du numéro de téléphone
  - ✅ Test d'unicité de l'email
  - ✅ Test de validation du format du numéro
  - ✅ Nettoyage automatique des données de test

## 🔧 Fonctionnalités

### Validation du Numéro de Téléphone
```python
# Formats acceptés :
"0701234567"      # → "+2250701234567"
"+2250701234567"  # → "+2250701234567"
"2250701234567"   # → "+2250701234567"

# Formats rejetés :
""                # Numéro vide
"123"             # Trop court
"+12345678901234567890"  # Trop long
"1234567890"      # Format non ivoirien
```

### Validation de l'Email
```python
# Formats acceptés :
"user@example.com"     # → "user@example.com"
"USER@EXAMPLE.COM"     # → "user@example.com"
" user@example.com "   # → "user@example.com"

# Formats rejetés :
""                     # Email vide
"invalid-email"        # Pas de @
"user@"               # Pas de domaine
"@example.com"        # Pas de nom d'utilisateur
```

## 🚀 Utilisation

### Test des Validations
```bash
cd backend
python test_uniqueness.py
```

### Messages d'Erreur
- **Conflit téléphone** : "Un utilisateur avec ce numéro de téléphone existe déjà"
- **Conflit email** : "Un utilisateur avec cette adresse email existe déjà"
- **Format téléphone** : "Le numéro de téléphone doit être au format ivoirien (+225, 225, ou 0)"
- **Format email** : "Format d'email invalide"

## 🛡️ Sécurité

### Protection contre les Doublons
1. **Validation côté schéma** : Pydantic valide avant traitement
2. **Validation côté service** : Vérification en base de données
3. **Contraintes base de données** : Index unique sur `phone` et `email`
4. **Gestion d'erreur** : Messages clairs et rollback automatique

### Nettoyage des Données
- Suppression automatique des espaces
- Normalisation des formats
- Conversion en minuscules pour les emails
- Validation de la longueur et du format

## 📊 Résultat

Le système garantit maintenant que :
- ✅ Aucun numéro de téléphone ne peut être utilisé deux fois
- ✅ Aucun email ne peut être utilisé deux fois
- ✅ Les formats sont validés et normalisés
- ✅ Les erreurs sont clairement communiquées
- ✅ La base de données reste cohérente 