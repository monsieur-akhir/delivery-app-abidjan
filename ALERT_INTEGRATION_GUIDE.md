# Guide d'Intégration des Alertes Modernes

## 🎯 Vue d'ensemble

Ce guide explique comment remplacer les `Alert.alert()` basiques par le nouveau système d'alertes modernes et professionnelles dans toute l'application de livraison.

## 📦 Composants Créés

### 1. **CustomAlert** - Alertes Modales
- Design moderne avec gradients et animations
- Feedback haptique intelligent
- Types : succès, erreur, avertissement, information, confirmation
- Boutons personnalisables

### 2. **CustomToast** - Notifications Temporaires
- Positionnement intelligent en haut de l'écran
- Animations fluides d'entrée/sortie
- Support des actions avec boutons
- Auto-dismiss configurable

### 3. **useAlert Hook** - API Centralisée
- API simple et intuitive
- Méthodes utilitaires pour tous les cas d'usage
- Gestion d'état centralisée

## 🚀 Comment Intégrer

### Étape 1 : Importer les Composants

```typescript
import CustomAlert from '../components/CustomAlert'
import CustomToast from '../components/CustomToast'
import { useAlert } from '../hooks/useAlert'
```

### Étape 2 : Utiliser le Hook

```typescript
const {
  alertVisible,
  alertConfig,
  toastVisible,
  toastConfig,
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
  showInfoAlert,
  showConfirmationAlert,
  showDeleteConfirmationAlert,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  hideAlert,
  hideToast
} = useAlert()
```

### Étape 3 : Remplacer Alert.alert()

#### Avant (Ancien système)
```typescript
Alert.alert('Erreur', 'Une erreur s\'est produite')
Alert.alert('Succès', 'Opération réussie', [
  { text: 'OK', onPress: () => navigation.goBack() }
])
```

#### Après (Nouveau système)
```typescript
// Alerte d'erreur
showErrorAlert('Erreur', 'Une erreur s\'est produite')

// Alerte de succès avec navigation
showSuccessAlert('Succès', 'Opération réussie')
navigation.goBack()

// Confirmation de suppression
showDeleteConfirmationAlert(
  'Supprimer l\'élément',
  'Cette action est irréversible. Continuer ?',
  () => handleDelete(),
  () => console.log('Annulé')
)
```

### Étape 4 : Ajouter les Composants dans le JSX

```typescript
return (
  <SafeAreaView style={styles.container}>
    {/* Votre contenu existant */}
    
    {/* Composants d'alerte modernes */}
    <CustomAlert
      visible={alertVisible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      type={alertConfig.type}
      icon={alertConfig.icon}
      onDismiss={hideAlert}
      showCloseButton={alertConfig.showCloseButton}
      autoDismiss={alertConfig.autoDismiss}
      dismissAfter={alertConfig.dismissAfter}
    />

    <CustomToast
      visible={toastVisible}
      message={toastConfig.message}
      type={toastConfig.type}
      duration={toastConfig.duration}
      onDismiss={hideToast}
      action={toastConfig.action}
      icon={toastConfig.icon}
      title={toastConfig.title}
    />
  </SafeAreaView>
)
```

## 📋 Méthodes Disponibles

### Alertes Modales
```typescript
// Alertes simples
showSuccessAlert(title, message?)
showErrorAlert(title, message?)
showWarningAlert(title, message?)
showInfoAlert(title, message?)

// Alertes de confirmation
showConfirmationAlert(
  title,
  message,
  onConfirm,
  onCancel?,
  confirmText = 'Confirmer',
  cancelText = 'Annuler'
)

// Confirmation de suppression
showDeleteConfirmationAlert(
  title,
  message,
  onConfirm,
  onCancel?
)
```

### Toasts Notifications
```typescript
// Toasts simples
showSuccessToast(message, title?)
showErrorToast(message, title?)
showWarningToast(message, title?)
showInfoToast(message, title?)

// Toast avec action
showToast({
  message: 'Message',
  type: 'success',
  duration: 4000,
  action: {
    label: 'Action',
    onPress: () => handleAction()
  }
})
```

## 🔄 Migration par Écran

### Écrans Prioritaires à Migrer

1. **CreateDeliveryScreen** ✅ (Déjà migré)
2. **NotificationsScreen**
3. **SettingsScreen**
4. **SupportScreen**
5. **SecuritySettingsScreen**
6. **AddFundsScreen**
7. **BidsScreen**
8. **DeliveryDetailsScreen**
9. **AvailableDeliveriesScreen**
10. **BidScreen**

### Exemple de Migration Complète

#### Avant
```typescript
import { Alert } from 'react-native'

const handleSubmit = async () => {
  try {
    const result = await createDelivery(data)
    Alert.alert('Succès', 'Livraison créée avec succès!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  } catch (error) {
    Alert.alert('Erreur', 'Impossible de créer la livraison')
  }
}

const handleDelete = () => {
  Alert.alert(
    'Confirmer la suppression',
    'Êtes-vous sûr de vouloir supprimer cet élément ?',
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: deleteItem }
    ]
  )
}
```

#### Après
```typescript
import { useAlert } from '../hooks/useAlert'

const {
  showSuccessAlert,
  showErrorAlert,
  showDeleteConfirmationAlert
} = useAlert()

const handleSubmit = async () => {
  try {
    const result = await createDelivery(data)
    showSuccessAlert('Succès', 'Livraison créée avec succès!')
    navigation.goBack()
  } catch (error) {
    showErrorAlert('Erreur', 'Impossible de créer la livraison')
  }
}

const handleDelete = () => {
  showDeleteConfirmationAlert(
    'Confirmer la suppression',
    'Êtes-vous sûr de vouloir supprimer cet élément ?',
    deleteItem
  )
}
```

## 🎨 Personnalisation

### Types d'Alerte Disponibles
- `success` - Vert avec icône de validation
- `error` - Rouge avec icône d'erreur
- `warning` - Orange avec icône d'avertissement
- `info` - Bleu avec icône d'information
- `confirmation` - Bleu avec icône d'aide

### Personnalisation Avancée
```typescript
// Alerte personnalisée
showAlert({
  title: 'Titre personnalisé',
  message: 'Message personnalisé',
  type: 'success',
  icon: 'star',
  buttons: [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Confirmer', style: 'default', isPrimary: true }
  ],
  autoDismiss: false,
  showCloseButton: true
})

// Toast personnalisé
showToast({
  message: 'Message personnalisé',
  type: 'success',
  duration: 5000,
  action: {
    label: 'Voir détails',
    onPress: () => navigation.navigate('Details')
  }
})
```

## 🧪 Test et Démonstration

### Composant de Démonstration
Un composant `AlertDemo` a été créé pour tester toutes les fonctionnalités :

```typescript
// Navigation vers la démo
navigation.navigate('AlertDemo')
```

### Tests Recommandés
1. ✅ Alertes de succès
2. ✅ Alertes d'erreur
3. ✅ Alertes d'avertissement
4. ✅ Alertes d'information
5. ✅ Confirmations
6. ✅ Confirmations de suppression
7. ✅ Toasts de succès
8. ✅ Toasts d'erreur
9. ✅ Toasts avec actions
10. ✅ Feedback haptique

## 🔧 Dépannage

### Problèmes Courants

1. **Erreur : "Property 'showAlert' does not exist"**
   - Solution : Utiliser les bonnes méthodes du hook (showSuccessAlert, showErrorAlert, etc.)

2. **Alertes ne s'affichent pas**
   - Vérifier que les composants CustomAlert et CustomToast sont bien ajoutés dans le JSX
   - Vérifier que le hook useAlert est bien importé et utilisé

3. **Animations saccadées**
   - Vérifier que les animations natives sont activées
   - Vérifier la performance sur l'appareil

### Debug
```typescript
// Ajouter des logs pour débugger
const { showSuccessAlert } = useAlert()

const handleAction = () => {
  console.log('Affichage de l\'alerte...')
  showSuccessAlert('Test', 'Alerte de test')
}
```

## 📱 Compatibilité

- ✅ iOS 12+
- ✅ Android 8+
- ✅ React Native 0.70+
- ✅ Expo SDK 48+

## 🎯 Prochaines Étapes

1. **Migration Systématique** : Remplacer tous les `Alert.alert()` par le nouveau système
2. **Tests Utilisateurs** : Valider l'expérience utilisateur avec les nouvelles alertes
3. **Optimisation** : Ajuster les animations et le feedback haptique selon les retours
4. **Documentation** : Mettre à jour la documentation technique
5. **Formation** : Former l'équipe de développement à utiliser le nouveau système

## 📞 Support

Pour toute question ou problème lors de l'intégration :
1. Consulter ce guide
2. Tester avec le composant AlertDemo
3. Vérifier les exemples dans les écrans déjà migrés
4. Contacter l'équipe de développement

---

**Note** : Ce système d'alertes modernes améliore significativement l'expérience utilisateur en offrant des interactions plus fluides, un design professionnel et une meilleure accessibilité. 