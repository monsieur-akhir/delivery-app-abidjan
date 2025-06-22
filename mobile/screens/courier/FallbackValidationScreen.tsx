
import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image
} from 'react-native'
import { Button, IconButton, SegmentedButtons } from 'react-native-paper'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker'
import Signature, { SignatureViewRef } from 'react-native-signature-canvas'

import { RootStackParamList } from '../../types/navigation'
import DeliveryService from '../../services/DeliveryService'

type FallbackValidationScreenRouteProp = RouteProp<RootStackParamList, 'FallbackValidation'>
type FallbackValidationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FallbackValidation'>

interface Props {
  route: FallbackValidationScreenRouteProp
  navigation: FallbackValidationScreenNavigationProp
}

const { width, height } = Dimensions.get('window')

const FallbackValidationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { deliveryId, recipientPhone } = route.params

  const [validationType, setValidationType] = useState<'signature' | 'photo'>('signature')
  const [signatureData, setSignatureData] = useState<string>('')
  const [photoData, setPhotoData] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const signatureRef = useRef<SignatureViewRef>(null)

  const handleSignatureOK = (signature: string) => {
    setSignatureData(signature)
  }

  const handleSignatureClear = () => {
    setSignatureData('')
    signatureRef.current?.clearSignature()
  }

  const handleTakePhoto = () => {
    Alert.alert(
      'Prendre une photo',
      'Comment voulez-vous ajouter la photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Caméra', 
          onPress: () => launchCamera(
            { mediaType: 'photo', quality: 0.7 },
            handlePhotoResponse
          )
        },
        { 
          text: 'Galerie', 
          onPress: () => launchImageLibrary(
            { mediaType: 'photo', quality: 0.7 },
            handlePhotoResponse
          )
        }
      ]
    )
  }

  const handlePhotoResponse = (response: ImagePickerResponse) => {
    if (response.assets && response.assets[0]) {
      const asset = response.assets[0]
      if (asset.base64) {
        setPhotoData(`data:${asset.type};base64,${asset.base64}`)
      }
    }
  }

  const handleValidate = async () => {
    try {
      setLoading(true)

      let validationData = ''
      if (validationType === 'signature') {
        if (!signatureData) {
          Alert.alert('Erreur', 'Veuillez capturer une signature')
          return
        }
        validationData = signatureData
      } else {
        if (!photoData) {
          Alert.alert('Erreur', 'Veuillez prendre une photo')
          return
        }
        validationData = photoData
      }

      const result = await DeliveryService.saveFallbackValidation(deliveryId, {
        type: validationType,
        data: validationData
      })

      if (result.success) {
        Alert.alert(
          'Validation enregistrée',
          `La validation par ${validationType === 'signature' ? 'signature' : 'photo'} a été enregistrée avec succès.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('CourierHome')
            }
          ]
        )
      }
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error)
      Alert.alert('Erreur', error.message || 'Erreur lors de la validation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validation alternative</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info */}
        <View style={styles.infoCard}>
          <Icon name="info" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Le code OTP a échoué. Utilisez une méthode alternative pour valider la réception.
          </Text>
        </View>

        {/* Sélecteur de type */}
        <SegmentedButtons
          value={validationType}
          onValueChange={(value) => setValidationType(value as 'signature' | 'photo')}
          buttons={[
            {
              value: 'signature',
              label: 'Signature',
              icon: 'edit'
            },
            {
              value: 'photo',
              label: 'Photo',
              icon: 'camera-alt'
            }
          ]}
          style={styles.segmentedButtons}
        />

        {/* Zone de signature */}
        {validationType === 'signature' && (
          <View style={styles.signatureContainer}>
            <Text style={styles.sectionTitle}>Signature du destinataire</Text>
            <View style={styles.signatureCanvas}>
              <Signature
                ref={signatureRef}
                onOK={handleSignatureOK}
                onEmpty={() => setSignatureData('')}
                descriptionText="Signez ici"
                clearText="Effacer"
                confirmText="Valider"
                webStyle={`
                  .m-signature-pad--footer {
                    display: none;
                  }
                `}
              />
            </View>
            <View style={styles.signatureActions}>
              <Button
                mode="outlined"
                onPress={handleSignatureClear}
                icon="refresh"
                style={styles.clearButton}
              >
                Effacer
              </Button>
            </View>
          </View>
        )}

        {/* Zone de photo */}
        {validationType === 'photo' && (
          <View style={styles.photoContainer}>
            <Text style={styles.sectionTitle}>Photo de validation</Text>
            <Text style={styles.sectionSubtitle}>
              Prenez une photo du destinataire avec le colis ou de sa pièce d'identité
            </Text>
            
            {photoData ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photoData }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoData('')}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={handleTakePhoto}>
                <Icon name="add-a-photo" size={48} color="#9E9E9E" />
                <Text style={styles.photoPlaceholderText}>Appuyez pour ajouter une photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bouton de validation */}
        <Button
          mode="contained"
          onPress={handleValidate}
          loading={loading}
          disabled={loading || (!signatureData && validationType === 'signature') || (!photoData && validationType === 'photo')}
          style={styles.validateButton}
          contentStyle={styles.buttonContent}
        >
          Valider la livraison
        </Button>

        {/* Note importante */}
        <View style={styles.noteContainer}>
          <Icon name="warning" size={20} color="#FF9800" />
          <Text style={styles.noteText}>
            Cette validation sera enregistrée comme preuve de livraison et pourra être consultée par le client.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121'
  },
  content: {
    flex: 1,
    padding: 16
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20
  },
  segmentedButtons: {
    marginBottom: 24
  },
  signatureContainer: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#212121'
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20
  },
  signatureCanvas: {
    height: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12
  },
  clearButton: {
    borderColor: '#FF9800'
  },
  photoContainer: {
    marginBottom: 24
  },
  photoPlaceholder: {
    height: 200,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA'
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8
  },
  photoPreview: {
    position: 'relative',
    alignItems: 'center'
  },
  previewImage: {
    width: width - 32,
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  validateButton: {
    marginBottom: 16
  },
  buttonContent: {
    paddingVertical: 8
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16
  }
})

export default FallbackValidationScreen
