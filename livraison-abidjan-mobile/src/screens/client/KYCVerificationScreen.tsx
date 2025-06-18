/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, Image } from "react-native"
import { Text, Card, Button, TextInput, Chip, ActivityIndicator, ProgressBar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useUser } from "../../hooks"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { KYCDocument, KYCStatus } from "../../types/models"

// Removed unused type: KYCStatusUI

// Document types mapping between UI and backend
type UIDocumentType = 'identity' | 'proof_of_address' | 'selfie';
type BackendDocumentType = 'id_card' | 'driving_license' | 'vehicle_registration' | 'insurance' | 'business_license';

// Map UI document types to backend types
const mapDocumentType = (uiType: UIDocumentType): BackendDocumentType => {
  const mapping: Record<UIDocumentType, BackendDocumentType> = {
    'identity': 'id_card',
    'proof_of_address': 'business_license',
    'selfie': 'driving_license'
  };
  return mapping[uiType];
};

// Removed unused function: getUIStatusFromBackend

type KYCVerificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile' | 'Settings'>
}

const KYCVerificationScreen: React.FC<KYCVerificationScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { getKYCStatus, submitKYCForVerification: submitKYCDocuments, uploadKYCDocument } = useUser()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kycStatus, setKycStatus] = useState<{status: KYCStatus, documents: KYCDocument[]} | null>(null)
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  // Removing unused state
  // const [currentStep, setCurrentStep] = useState(0)

  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    phoneNumber: '',
  })

  const loadKYCStatus = async () => {
    try {
      setLoading(true)
      await getKYCStatus()
      // Use the current state from useUser hook
      const { kycStatus: currentStatus } = useUser();
      
      if (currentStatus) {
        setKycStatus(currentStatus);
        if (currentStatus.documents) {
          setDocuments(currentStatus.documents)
        }
      }
      
      // Set personal info from user data
      if (user) {
        setPersonalInfo({
          fullName: user.full_name || '',
          dateOfBirth: user.date_of_birth ? user.date_of_birth : '',
          nationality: user.nationality ? user.nationality : '',
          address: user.address || '',
          phoneNumber: user.phone || '',
        })
      }
    } catch (error) {
      console.error('Error loading KYC status:', error)
      Alert.alert(t('common.error'), t('kyc.loadError'))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadKYCStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const getStatusColor = (status: KYCStatus | string) => {
    const statusStr = typeof status === 'object' ? status.status : status;
    switch (statusStr) {
      case 'verified': return '#4CAF50'
      case 'pending': return '#FF9800'
      case 'rejected': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  const getStatusIcon = (status: KYCStatus | string) => {
    const statusStr = typeof status === 'object' ? status.status : status;
    switch (statusStr) {
      case 'verified': return 'check-circle'
      case 'pending': return 'clock'
      case 'rejected': return 'x-circle'
      default: return 'help-circle'
    }
  }
  const pickDocument = async (type: UIDocumentType) => {
    try {
      let result;

      if (type === 'selfie') {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
          Alert.alert(t('kyc.permissionRequired'), t('kyc.cameraPermissionRequired'))
          return
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        })
      }

      if ('canceled' in result && result.canceled) return;

      // Handle result based on different file picker formats
      let fileUri = '';
      if ('assets' in result && result.assets && result.assets[0]) {
        fileUri = result.assets[0].uri;
      } else if ('uri' in result && result.uri) {
        fileUri = result.uri;
      } else {
        console.error('Unsupported file result format');
        return;
      }
      
      if (!fileUri) return;      try {
        setSubmitting(true)
        // Convert UI document type to backend type before uploading
        const backendType = mapDocumentType(type);
        
        // Upload the document - this returns void, not the document itself
        await uploadKYCDocument(backendType, fileUri);
        
        // Since uploadKYCDocument calls getKYCStatus internally, we need to refresh our local state
        await loadKYCStatus();

        Alert.alert(t('kyc.success'), t('kyc.documentUploaded'))
      } catch (error) {
        console.error('Error uploading document:', error)
        Alert.alert(t('common.error'), t('kyc.uploadError'))
      } finally {
        setSubmitting(false)
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert(t('common.error'), t('kyc.pickError'))
    }
  }
  const submitVerification = async () => {
    if (documents.length < 3) {
      Alert.alert(t('kyc.incomplete'), t('kyc.allDocumentsRequired'))
      return
    }

    try {
      setSubmitting(true)
      // Call submitKYCForVerification without arguments as the backend already has the documents
      await submitKYCDocuments()
      
      Alert.alert(
        t('kyc.submitted'),
        t('kyc.submittedMessage'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      console.error('Error submitting KYC:', error)
      Alert.alert(t('common.error'), t('kyc.submitError'))
    } finally {
      setSubmitting(false)
    }
  }
  const renderDocumentStatus = (type: UIDocumentType, title: string, description: string) => {
    // Convert UI document type to backend type for finding in the documents array
    const backendType = mapDocumentType(type);
    const doc = documents.find(d => d.type === backendType);
    const isUploaded = !!doc;
    
    return (
      <Card style={styles.documentCard}>
        <Card.Content>
          <View style={styles.documentHeader}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>{title}</Text>
              <Text style={styles.documentDescription}>{description}</Text>
            </View>
            <Chip
              icon={isUploaded ? getStatusIcon(doc?.status || 'not_uploaded') : 'upload'}
              style={[
                styles.statusChip,
                { backgroundColor: isUploaded ? getStatusColor(doc?.status || 'not_uploaded') : '#E0E0E0' }
              ]}
              textStyle={{ color: 'white' }}
            >
              {isUploaded ? t(`kyc.status.${typeof doc?.status === 'object' ? doc?.status.status : doc?.status}`) : t('kyc.notUploaded')}
            </Chip>
          </View>
          
          {doc?.url && (
            <Image source={{ uri: doc.url }} style={styles.documentPreview} />
          )}
          
          <Button
            mode="outlined"
            onPress={() => pickDocument(type)}
            style={styles.uploadButton}
            disabled={submitting}
            icon={isUploaded ? 'refresh' : 'upload'}
          >
            {isUploaded ? t('kyc.replace') : t('kyc.upload')}
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            icon={() => <Feather name="arrow-left" size={24} color="#212121" />}
          >
            {t('common.back')}
          </Button>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('kyc.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon={() => <Feather name="arrow-left" size={24} color="#212121" />}
        >
          {t('common.back')}
        </Button>
        <Text style={styles.headerTitle}>{t('kyc.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Overview */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>{t('kyc.verificationStatus')}</Text>
              <Chip                icon={getStatusIcon(kycStatus?.status || 'not_started')}
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(kycStatus?.status || 'not_started') }
                ]}
                textStyle={{ color: 'white' }}
              >
                {t(`kyc.status.${typeof kycStatus?.status === 'object' ? kycStatus?.status.status : kycStatus?.status || 'not_started'}`)}
              </Chip>
            </View>
            
            <ProgressBar
              progress={documents.length / 3}
              color="#2196F3"
              style={styles.progressBar}
            />
            
            <Text style={styles.progressText}>
              {t('kyc.progress', { current: documents.length, total: 3 })}
            </Text>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('kyc.personalInfo')}</Text>
              <TextInput
              label={t('kyc.fullName')}
              value={personalInfo.fullName}
              onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, fullName: text }))}
              style={styles.input}
              disabled={typeof kycStatus?.status === 'object' ? kycStatus?.status.status === 'verified' : kycStatus?.status === 'verified'}
            />
              <TextInput
              label={t('kyc.phoneNumber')}
              value={personalInfo.phoneNumber}
              onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phoneNumber: text }))}
              style={styles.input}
              disabled={typeof kycStatus?.status === 'object' ? kycStatus?.status.status === 'verified' : kycStatus?.status === 'verified'}
            />
              <TextInput
              label={t('kyc.address')}
              value={personalInfo.address}
              onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, address: text }))}
              style={styles.input}
              multiline
              numberOfLines={3}
              disabled={typeof kycStatus?.status === 'object' ? kycStatus?.status.status === 'verified' : kycStatus?.status === 'verified'}
            />
          </Card.Content>
        </Card>

        {/* Documents */}
        <Text style={styles.sectionTitle}>{t('kyc.documents')}</Text>
        
        {renderDocumentStatus(
          'identity',
          t('kyc.identityDocument'),
          t('kyc.identityDocumentDesc')
        )}
        
        {renderDocumentStatus(
          'proof_of_address',
          t('kyc.proofOfAddress'),
          t('kyc.proofOfAddressDesc')
        )}
        
        {renderDocumentStatus(
          'selfie',
          t('kyc.selfie'),
          t('kyc.selfieDesc')
        )}

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={submitVerification}
          style={styles.submitButton}
          disabled={submitting || documents.length < 3 || (typeof kycStatus?.status === 'object' ? kycStatus?.status.status === 'verified' : kycStatus?.status === 'verified')}
          loading={submitting}
        >          {(typeof kycStatus?.status === 'object' ? kycStatus?.status.status === 'verified' : kycStatus?.status === 'verified')
            ? t('kyc.alreadyVerified')
            : t('kyc.submitVerification')
          }
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#212121',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusChip: {
    borderRadius: 16,
  },
  progressBar: {
    marginBottom: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
    color: '#212121',
  },
  input: {
    marginBottom: 16,
  },
  documentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
  },
  documentPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  uploadButton: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 8,
  },
})

export default KYCVerificationScreen
