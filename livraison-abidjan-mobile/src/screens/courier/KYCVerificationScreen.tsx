import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, Button, ProgressBar, ActivityIndicator, Surface, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../hooks/useUser';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, requestCameraPermission } from '../../utils/cameraPermissions';
import { useNetwork } from '../../contexts/NetworkContext';
import CustomAlert from '../../components/CustomAlert';
import { useAlert } from '../../hooks/useAlert';
import * as ImagePicker from 'expo-image-picker';

// Types
import type { KYCDocument, KYCStatus } from '../../types/models';

const { width } = Dimensions.get('window');

// Documents requis pour les coursiers avec design amélioré
const REQUIRED_DOCS: Array<{
  key: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  gradient: readonly [string, string];
}> = [
  {
    key: 'id_card',
    label: 'Carte d\'identité',
    icon: 'credit-card',
    description: 'Photo ou scan de la CNI (recto/verso)',
    color: '#4CAF50',
    gradient: ['#4CAF50', '#45A049'],
  },
  {
    key: 'driving_license',
    label: 'Permis de conduire',
    icon: 'truck',
    description: 'Permis de conduire en cours de validité',
    color: '#2196F3',
    gradient: ['#2196F3', '#1976D2'],
  },
  {
    key: 'vehicle_registration',
    label: 'Carte grise',
    icon: 'file-text',
    description: 'Carte grise du véhicule utilisé',
    color: '#FF9800',
    gradient: ['#FF9800', '#F57C00'],
  },
  {
    key: 'insurance',
    label: 'Assurance',
    icon: 'shield',
    description: 'Attestation d\'assurance du véhicule',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#7B1FA2'],
  },
  {
    key: 'selfie',
    label: 'Photo de profil',
    icon: 'user',
    description: 'Photo récente et nette du visage',
    color: '#E91E63',
    gradient: ['#E91E63', '#C2185B'],
  },
];

const KYCVerificationScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { kycStatus, getKYCStatus, submitKYCForVerification, uploadKYCDocument } = useUser();
  const navigation = useNavigation();
  const { isConnected } = useNetwork();
  const { showErrorAlert, alertVisible, alertConfig, hideAlert } = useAlert();
  const { isKYCVerified } = useUser();

  const [documents, setDocuments] = useState<{ [key: string]: KYCDocument | null }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showSelfieModal, setShowSelfieModal] = useState(false);

  // Charger le statut KYC et les documents déjà uploadés
  useEffect(() => {
    const fetchKYC = async () => {
      setLoading(true);
      try {
        await getKYCStatus();
        // TODO: Adapter selon le hook useUser
        // setKycStatus(...)
        // setDocuments(...)
      } catch (e: any) {
        const message = e?.response?.data?.detail || e?.message || "Impossible de charger le statut KYC";
        showErrorAlert('Erreur', message);
      } finally {
        setLoading(false);
      }
    };
    fetchKYC();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      showErrorAlert('Erreur de connexion', 'Connexion internet perdue. Certaines fonctionnalités peuvent être indisponibles.');
    }
  }, [isConnected]);

  useEffect(() => {
    console.log('[SCREEN] kycStatus (KYCVerificationScreen):', kycStatus);
  }, [kycStatus]);

  useEffect(() => {
    if (isKYCVerified()) {
      navigation.navigate('Home'); // ou l'écran principal souhaité
    }
  }, [isKYCVerified, navigation]);

  // Upload d'un document avec UX améliorée
  const handleUpload = async (docKey: string) => {
    try {
      setSelectedDoc(docKey);
      let result;

      if (docKey === 'selfie') {
        setShowSelfieModal(true);
        return;
      }
      // Pour les autres documents : PNG, JPEG, PDF, max 5 Mo
      result = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if ('canceled' in result && result.canceled) return;

      let fileUri = '';
      let fileType = '';
      let fileSize = 0;
      if ('assets' in result && result.assets && result.assets[0]) {
        fileUri = result.assets[0].uri;
        fileType = result.assets[0].mimeType || '';
        fileSize = result.assets[0].size || 0;
      } else if ('uri' in result && result.uri) {
        fileUri = result.uri;
        // Impossible de vérifier le type/taille ici, mais on tente
      }

      // Vérification du type
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      if (fileType && !allowedTypes.includes(fileType)) {
        showErrorAlert('Type de fichier non autorisé', 'Seuls les fichiers PNG, JPEG ou PDF sont acceptés.');
        return;
      }
      // Vérification de la taille (5 Mo max)
      if (fileSize && fileSize > 5 * 1024 * 1024) {
        showErrorAlert('Fichier trop volumineux', 'La taille maximale autorisée est de 5 Mo.');
        return;
      }
      if (!fileUri) return;
      await processUpload(docKey, fileUri);
    } catch (e: any) {
      const message = e?.response?.data?.detail || e?.message || "Échec de l'upload du document.";
      showErrorAlert('Erreur', message);
    } finally {
      setSelectedDoc(null);
    }
  };

  const processUpload = async (docKey: string, fileUri: string) => {
    try {
      setSubmitting(true);
      await uploadKYCDocument(docKey, fileUri);
      
      // Rafraîchir l'état local
      setDocuments(prev => ({
        ...prev,
        [docKey]: {
          id: Date.now(),
          user_id: user?.id ?? 0,
          type: docKey as any,
          document_type: docKey as any,
          document_url: fileUri,
          url: fileUri,
          status: {
            status: 'pending',
            documents_required: [],
            documents_submitted: [],
            verification_level: 'basic',
          },
          submitted_at: new Date().toISOString(),
        }
      }));
      
      showErrorAlert('Succès', 'Document envoyé ou remplacé avec succès.');
    } catch (e: any) {
      let message = "Échec de l'upload du document.";
      if (e?.response?.data?.detail) {
        message = e.response.data.detail;
      } else if (e?.message) {
        message = e.message;
      }
      showErrorAlert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Soumission finale
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitKYCForVerification();
      showErrorAlert('Demande envoyée', 'Vos documents sont en cours de vérification.');
      if (navigation && 'reset' in navigation && typeof navigation.reset === 'function') {
        navigation.reset({ index: 0, routes: [{ name: 'CourierMain' }] });
      }
    } catch (e) {
      showErrorAlert('Erreur', "Impossible de soumettre la demande KYC.");
    } finally {
      setSubmitting(false);
    }
  };

  // Progression
  const completedCount = REQUIRED_DOCS.filter(doc => documents[doc.key]).length;
  const progress = completedCount / REQUIRED_DOCS.length;

  useEffect(() => {
    getKYCStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal d'alerte customisé */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        icon={alertConfig.icon}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
        showCloseButton={alertConfig.showCloseButton}
        autoDismiss={alertConfig.autoDismiss}
        dismissAfter={alertConfig.dismissAfter}
      />

      {/* Header avec bouton retour */}
      <LinearGradient colors={['#FF6B00', '#FF8533']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Vérification d'identité</Text>
            <Text style={styles.headerSubtitle}>Activation compte coursier</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section de progression */}
        <Surface style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression</Text>
            <Text style={styles.progressCount}>{completedCount}/{REQUIRED_DOCS.length}</Text>
          </View>
          <ProgressBar 
            progress={progress} 
            color="#FF6B00" 
            style={styles.progressBar} 
          />
          <Text style={styles.progressText}>
            {completedCount === REQUIRED_DOCS.length 
              ? 'Tous les documents sont prêts !' 
              : `${REQUIRED_DOCS.length - completedCount} document(s) restant(s)`
            }
          </Text>
        </Surface>

        {/* Liste des documents */}
        <View style={styles.documentsContainer}>
          <Text style={styles.sectionTitle}>Documents requis</Text>
          {REQUIRED_DOCS.map((doc, index) => (
            <TouchableOpacity
              key={doc.key}
              style={[
                styles.documentCard,
                documents[doc.key] && styles.documentCardCompleted
              ]}
              onPress={() => handleUpload(doc.key)}
              disabled={submitting}
            >
              <LinearGradient 
                colors={documents[doc.key] ? ['#4CAF50', '#45A049'] : doc.gradient}
                style={styles.documentIcon}
              >
                <Feather name={doc.icon as any} size={24} color="#FFF" />
              </LinearGradient>
              
              <View style={styles.documentContent}>
                <Text style={styles.documentLabel}>{doc.label}</Text>
                <Text style={styles.documentDesc}>{doc.description}</Text>
                
                {documents[doc.key] ? (
                  <View style={styles.statusContainer}>
                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.statusText}>Document ajouté</Text>
                  </View>
                ) : (
                  <View style={styles.uploadContainer}>
                    <Text style={styles.uploadText}>Toucher pour ajouter</Text>
                    <Feather name="upload" size={16} color="#FF6B00" />
                  </View>
                )}
              </View>

              {selectedDoc === doc.key && submitting && (
                <ActivityIndicator size="small" color="#FF6B00" style={styles.uploadingIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton de soumission */}
        <Surface style={styles.submitCard}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={completedCount < REQUIRED_DOCS.length || submitting}
            loading={submitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
          >
            {completedCount < REQUIRED_DOCS.length 
              ? `Ajouter ${REQUIRED_DOCS.length - completedCount} document(s) restant(s)`
              : 'Soumettre pour vérification'
            }
          </Button>
          
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert('Aide', 'Pour toute question, contactez le support via le chat ou le numéro affiché sur la page d\'accueil.')}
          >
            <Feather name="help-circle" size={20} color="#666" />
            <Text style={styles.helpText}>Besoin d'aide ?</Text>
          </TouchableOpacity>
        </Surface>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      )}

      {/* Modal customisé pour le choix du selfie */}
      <Modal
        visible={showSelfieModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSelfieModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: '#FF6B00' }}>Ajouter une photo de profil</Text>
            <Text style={{ color: '#757575', marginBottom: 18, textAlign: 'center' }}>
              Pour renforcer la sécurité, nous avons besoin d'une photo nette de votre visage. Elle sera vérifiée par notre équipe.
            </Text>
            <Button
              icon="camera"
              mode="contained"
              style={{ marginBottom: 12, width: '100%', backgroundColor: '#FF6B00' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              onPress={async () => {
                setShowSelfieModal(false);
                const hasPermission = await requestCameraPermission();
                if (!hasPermission) {
                  showErrorAlert('Autorisation requise', 'L\'application a besoin d\'accéder à la caméra pour prendre une photo. Veuillez autoriser l\'accès dans les paramètres.');
                  return;
                }
                const cameraResult = await ImagePicker.launchCameraAsync({
                  aspect: [1, 1],
                  quality: 0.8,
                  allowsEditing: true,
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                });
                if (!cameraResult.canceled && cameraResult.assets && cameraResult.assets[0]) {
                  await processUpload('selfie', cameraResult.assets[0].uri);
                }
              }}
            >
              Prendre une photo
            </Button>
            <Button
              icon="image"
              mode="outlined"
              style={{ marginBottom: 12, width: '100%', borderColor: '#FF6B00' }}
              labelStyle={{ color: '#FF6B00', fontWeight: 'bold' }}
              onPress={async () => {
                setShowSelfieModal(false);
                const galleryResult = await ImagePicker.launchImageLibraryAsync({
                  aspect: [1, 1],
                  quality: 0.8,
                  allowsEditing: true,
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                });
                if (!galleryResult.canceled && galleryResult.assets && galleryResult.assets[0]) {
                  await processUpload('selfie', galleryResult.assets[0].uri);
                }
              }}
            >
              Choisir dans la galerie
            </Button>
            <Button
              onPress={() => setShowSelfieModal(false)}
              style={{ marginTop: 8 }}
              labelStyle={{ color: '#757575' }}
            >
              Annuler
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  documentsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  documentCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
  },
  documentCardCompleted: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  documentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentContent: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  documentDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#4CAF50',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  uploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '500',
  },
  uploadingIndicator: {
    marginLeft: 12,
  },
  submitCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  helpText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default KYCVerificationScreen; 