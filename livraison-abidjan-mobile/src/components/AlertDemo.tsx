import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from './CustomAlert';
import CustomToast from './CustomToast';
import { useAlert } from '../hooks/useAlert';

const AlertDemo: React.FC = () => {
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
    hideToast,
  } = useAlert();

  const demoButtons = [
    {
      title: 'Succès',
      subtitle: 'Afficher une alerte de succès',
      icon: 'checkmark-circle',
      color: '#4CAF50',
      onPress: () => showSuccessAlert('Opération réussie', 'Votre action a été effectuée avec succès !'),
    },
    {
      title: 'Erreur',
      subtitle: 'Afficher une alerte d\'erreur',
      icon: 'close-circle',
      color: '#F44336',
      onPress: () => showErrorAlert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.'),
    },
    {
      title: 'Avertissement',
      subtitle: 'Afficher une alerte d\'avertissement',
      icon: 'warning',
      color: '#FF9800',
      onPress: () => showWarningAlert('Attention', 'Cette action peut avoir des conséquences importantes.'),
    },
    {
      title: 'Information',
      subtitle: 'Afficher une alerte d\'information',
      icon: 'information-circle',
      color: '#2196F3',
      onPress: () => showInfoAlert('Information', 'Voici une information importante pour vous.'),
    },
    {
      title: 'Confirmation',
      subtitle: 'Afficher une alerte de confirmation',
      icon: 'help-circle',
      color: '#9C27B0',
      onPress: () => showConfirmationAlert(
        'Confirmer l\'action',
        'Êtes-vous sûr de vouloir effectuer cette action ?',
        () => showSuccessToast('Action confirmée !'),
        () => showInfoToast('Action annulée')
      ),
    },
    {
      title: 'Suppression',
      subtitle: 'Afficher une confirmation de suppression',
      icon: 'trash',
      color: '#F44336',
      onPress: () => showDeleteConfirmationAlert(
        'Supprimer l\'élément',
        'Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?',
        () => showSuccessToast('Élément supprimé !'),
        () => showInfoToast('Suppression annulée')
      ),
    },
  ];

  const toastButtons = [
    {
      title: 'Toast Succès',
      subtitle: 'Afficher un toast de succès',
      icon: 'checkmark-circle',
      color: '#4CAF50',
      onPress: () => showSuccessToast('Opération réussie !', 'Succès'),
    },
    {
      title: 'Toast Erreur',
      subtitle: 'Afficher un toast d\'erreur',
      icon: 'close-circle',
      color: '#F44336',
      onPress: () => showErrorToast('Une erreur s\'est produite', 'Erreur'),
    },
    {
      title: 'Toast Avertissement',
      subtitle: 'Afficher un toast d\'avertissement',
      icon: 'warning',
      color: '#FF9800',
      onPress: () => showWarningToast('Attention requise', 'Avertissement'),
    },
    {
      title: 'Toast Information',
      subtitle: 'Afficher un toast d\'information',
      icon: 'information-circle',
      color: '#2196F3',
      onPress: () => showInfoToast('Nouvelle information disponible', 'Information'),
    },
    {
      title: 'Toast avec Action',
      subtitle: 'Afficher un toast avec bouton d\'action',
      icon: 'ellipsis-horizontal',
      color: '#607D8B',
      onPress: () => {
        // Utiliser showToast directement pour une action personnalisée
        // Cette fonctionnalité peut être ajoutée au hook si nécessaire
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="notifications" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Démonstration des Alertes</Text>
          <Text style={styles.headerSubtitle}>Composants modernes et professionnels</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes Modales</Text>
          <Text style={styles.sectionDescription}>
            Alertes avec design moderne, animations fluides et feedback haptique
          </Text>
          
          <View style={styles.buttonGrid}>
            {demoButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={styles.demoButton}
                onPress={button.onPress}
              >
                <View style={[styles.buttonIcon, { backgroundColor: button.color }]}>
                  <Ionicons name={button.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonTitle}>{button.title}</Text>
                  <Text style={styles.buttonSubtitle}>{button.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toasts Notifications</Text>
          <Text style={styles.sectionDescription}>
            Notifications temporaires avec animations et actions
          </Text>
          
          <View style={styles.buttonGrid}>
            {toastButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={styles.demoButton}
                onPress={button.onPress}
              >
                <View style={[styles.buttonIcon, { backgroundColor: button.color }]}>
                  <Ionicons name={button.icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonTitle}>{button.title}</Text>
                  <Text style={styles.buttonSubtitle}>{button.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.infoTitle}>Fonctionnalités Avancées</Text>
            <Text style={styles.infoText}>
              • Animations fluides avec spring physics{'\n'}
              • Feedback haptique intelligent{'\n'}
              • Design responsive et moderne{'\n'}
              • Support des thèmes et couleurs{'\n'}
              • API simple et intuitive{'\n'}
              • Compatible iOS et Android
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Composants d'alerte et toast */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonGrid: {
    gap: 12,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoSection: {
    marginBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default AlertDemo; 