# Guide de Migration - Système d'Alertes et Loaders Modernes

## 🎯 Objectif
Remplacer tous les `Alert.alert()` et systèmes d'alertes locaux par le nouveau système global `useAlert` et `useLoader`.

## ✅ Écrans déjà migrés
- ✅ `App.tsx` - Système global configuré
- ✅ `LoginScreen.tsx` - Authentification
- ✅ `OTPLoginScreen.tsx` - Authentification OTP
- ✅ `CreateDeliveryScreen.tsx` - Création de livraison
- ✅ `HomeScreen.tsx` - Tableau de bord coursier

## 🔄 Écrans à migrer

### Écrans d'Authentification
- [ ] `RegisterScreen.tsx`
- [ ] `ClassicLoginScreen.tsx`
- [ ] `ForgotPasswordScreen.tsx`

### Écrans Client
- [ ] `BidScreen.tsx`
- [ ] `MultiDestinationDeliveriesScreen.tsx`
- [ ] `CreateMultiDestinationDeliveryScreen.tsx`
- [ ] `MultiDestinationDeliveryDetailsScreen.tsx`

### Écrans Coursier
- [ ] `ExpressDeliveriesScreen.tsx`
- [ ] `DeliveryDetailsScreen.tsx`
- [ ] `CourierTrackDeliveryScreen.tsx`
- [ ] `CourierStatusScreen.tsx`
- [ ] `CourierScheduledDeliveriesScreen.tsx`
- [ ] `CourierMultiDestinationScreen.tsx`
- [ ] `CommunityWalletScreen.tsx`
- [ ] `CollaborativeDeliveryDetailsScreen.tsx`
- [ ] `JoinCollaborativeDeliveryScreen.tsx`
- [ ] `VehicleManagementScreen.tsx`

### Écrans de Configuration
- [ ] `SettingsScreen.tsx`
- [ ] `SecuritySettingsScreen.tsx`
- [ ] `ProfileScreen.tsx`
- [ ] `NotificationsScreen.tsx`
- [ ] `OfflineManagerScreen.tsx`
- [ ] `SupportScreen.tsx`
- [ ] `MultiLanguageSettingsScreen.tsx`

## 📋 Étapes de Migration

### 1. Imports à ajouter
```typescript
import { useAlert } from '../../hooks/useAlert'
import { useLoader } from '../../contexts/LoaderContext'
```

### 2. Imports à supprimer
```typescript
import { Alert } from 'react-native'
import CustomAlert from '../../components/CustomAlert'
```

### 3. Hooks à ajouter
```typescript
const { 
  showSuccessAlert, 
  showErrorAlert, 
  showWarningAlert, 
  showInfoAlert,
  showConfirmationAlert,
  showDeleteConfirmationAlert 
} = useAlert()

const { 
  showLoader, 
  hideLoader, 
  showSuccessLoader, 
  showErrorLoader 
} = useLoader()
```

### 4. États à supprimer
```typescript
// Supprimer ces états locaux
const [alertVisible, setAlertVisible] = useState(false)
const [alertConfig, setAlertConfig] = useState({})
```

### 5. Remplacer Alert.alert()
```typescript
// Avant
Alert.alert('Titre', 'Message')

// Après
showInfoAlert('Titre', 'Message')

// Avant
Alert.alert('Erreur', 'Message d\'erreur')

// Après
showErrorAlert('Erreur', 'Message d\'erreur')

// Avant
Alert.alert('Succès', 'Opération réussie')

// Après
showSuccessAlert('Succès', 'Opération réussie')

// Avant
Alert.alert('Confirmation', 'Êtes-vous sûr ?', [
  { text: 'Annuler', style: 'cancel' },
  { text: 'Confirmer', onPress: handleConfirm }
])

// Après
showConfirmationAlert(
  'Confirmation',
  'Êtes-vous sûr ?',
  handleConfirm,
  handleCancel
)
```

### 6. Ajouter les loaders
```typescript
// Dans les fonctions async
const handleSubmit = async () => {
  try {
    showLoader('Chargement en cours...')
    // ... logique
    hideLoader()
    showSuccessAlert('Succès', 'Opération réussie')
  } catch (error) {
    hideLoader()
    showErrorAlert('Erreur', error.message)
  }
}
```

### 7. Supprimer CustomAlert du JSX
```typescript
// Supprimer ce bloc
<CustomAlert
  visible={alertVisible}
  title={alertConfig.title}
  message={alertConfig.message}
  type={alertConfig.type}
  onDismiss={() => setAlertVisible(false)}
/>
```

## 🎨 Patterns recommandés

### Pour les opérations de chargement
```typescript
const loadData = async () => {
  try {
    showLoader('Chargement des données...')
    const data = await api.getData()
    hideLoader()
    setData(data)
  } catch (error) {
    hideLoader()
    showErrorAlert('Erreur', 'Impossible de charger les données')
  }
}
```

### Pour les opérations de création/modification
```typescript
const handleSubmit = async () => {
  try {
    showLoader('Enregistrement en cours...')
    await api.saveData(data)
    hideLoader()
    showSuccessLoader('Enregistré avec succès !', 2000)
    setTimeout(() => navigation.goBack(), 2000)
  } catch (error) {
    hideLoader()
    showErrorAlert('Erreur', error.message)
  }
}
```

### Pour les confirmations de suppression
```typescript
const handleDelete = () => {
  showDeleteConfirmationAlert(
    'Supprimer',
    'Êtes-vous sûr de vouloir supprimer cet élément ?',
    async () => {
      try {
        showLoader('Suppression en cours...')
        await api.deleteItem(id)
        hideLoader()
        showSuccessAlert('Supprimé', 'Élément supprimé avec succès')
      } catch (error) {
        hideLoader()
        showErrorAlert('Erreur', 'Impossible de supprimer')
      }
    }
  )
}
```

## 🧪 Tests après migration
1. ✅ Vérifier que les alertes s'affichent correctement
2. ✅ Vérifier que les loaders fonctionnent
3. ✅ Tester les cas d'erreur
4. ✅ Tester les confirmations
5. ✅ Vérifier la navigation après succès

## 📝 Notes importantes
- Les alertes sont maintenant globales et s'affichent au-dessus de tout
- Les loaders sont centraux et peuvent être utilisés partout
- Plus besoin de gérer l'état local des alertes
- Les animations et feedback haptique sont automatiques
- Support multilingue intégré 