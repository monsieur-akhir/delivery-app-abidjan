
import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native'
import { Button, IconButton, ActivityIndicator, Card } from 'react-native-paper'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTranslation } from 'react-i18next'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { RootStackParamList } from '../../types/navigation'
import DeliveryService from '../../services/DeliveryService'
import { useAuth } from '../../contexts/AuthContext'

type OTPValidationScreenRouteProp = RouteProp<RootStackParamList, 'OTPValidation'>
type OTPValidationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTPValidation'>

interface Props {
  route: OTPValidationScreenRouteProp
  navigation: OTPValidationScreenNavigationProp
}

const { width } = Dimensions.get('window')

const OTPValidationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { deliveryId, recipientPhone } = route.params

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [remainingAttempts, setRemainingAttempts] = useState(3)
  const [showFallback, setShowFallback] = useState(false)

  const inputRefs = useRef<Array<TextInput | null>>([])

  // Countdown pour le renvoi
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [countdown])

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Passer automatiquement au champ suivant
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }

    // Valider automatiquement si les 6 chiffres sont saisis
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''))
    }
  }

  const handleVerifyOTP = async (otpCode?: string) => {
    try {
      setLoading(true)
      setError('')

      const code = otpCode || otp.join('')
      if (code.length !== 6) {
        setError('Veuillez saisir les 6 chiffres du code')
        return
      }

      const result = await DeliveryService.verifyDeliveryOTP(deliveryId, { otp_code: code })

      if (result.success) {
        Alert.alert(
          'Succès',
          'Code OTP vérifié avec succès ! Vous pouvez maintenant finaliser la livraison.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        )
      } else {
        if (result.fallback_required) {
          setShowFallback(true)
          setError('Utilisation du mode alternatif requis')
        } else {
          setError(result.error || 'Code incorrect')
          setRemainingAttempts(result.remaining_attempts || 0)
          
          // Réinitialiser les champs
          setOtp(['', '', '', '', '', ''])
          inputRefs.current[0]?.focus()
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification OTP:', error)
      setError(error.message || 'Erreur lors de la vérification')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      setResendLoading(true)
      setError('')

      await DeliveryService.resendDeliveryOTP(deliveryId)
      
      Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé au destinataire')
      setCountdown(120) // 2 minutes
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      console.error('Erreur lors du renvoi:', error)
      setError(error.message || 'Erreur lors du renvoi')
    } finally {
      setResendLoading(false)
    }
  }

  const handleFallbackValidation = () => {
    navigation.navigate('FallbackValidation', { 
      deliveryId,
      recipientPhone 
    })
  }

  const maskPhoneNumber = (phone: string) => {
    if (phone.length < 4) return phone
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <IconButton icon="arrow-left" size={24} iconColor="#212121" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Validation OTP</Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Contenu principal */}
          <View style={styles.content}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.iconContainer}>
                  <Icon name="security" size={48} color="#2196F3" />
                </View>

                <Text style={styles.title}>Code de sécurité</Text>
                <Text style={styles.subtitle}>
                  Un code à 6 chiffres a été envoyé au destinataire au {maskPhoneNumber(recipientPhone)}
                </Text>

                {/* Champs OTP */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[
                        styles.otpInput,
                        digit ? styles.otpInputFilled : {},
                        error ? styles.otpInputError : {}
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                          inputRefs.current[index - 1]?.focus()
                        }
                      }}
                    />
                  ))}
                </View>

                {/* Message d'erreur */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Tentatives restantes */}
                {remainingAttempts < 3 && remainingAttempts > 0 && (
                  <Text style={styles.attemptsText}>
                    {remainingAttempts} tentative{remainingAttempts > 1 ? 's' : ''} restante{remainingAttempts > 1 ? 's' : ''}
                  </Text>
                )}

                {/* Bouton de vérification */}
                <Button
                  mode="contained"
                  onPress={() => handleVerifyOTP()}
                  loading={loading}
                  disabled={loading || otp.some(digit => !digit)}
                  style={styles.verifyButton}
                  contentStyle={styles.buttonContent}
                >
                  {loading ? 'Vérification...' : 'Vérifier le code'}
                </Button>

                {/* Bouton de renvoi */}
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={countdown > 0 || resendLoading}
                  style={styles.resendButton}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <Text style={[
                      styles.resendText,
                      countdown > 0 ? styles.resendTextDisabled : {}
                    ]}>
                      {countdown > 0 
                        ? `Renvoyer dans ${countdown}s` 
                        : 'Renvoyer le code'
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              </Card.Content>
            </Card>

            {/* Mode alternatif */}
            {showFallback && (
              <Card style={[styles.card, styles.fallbackCard]}>
                <Card.Content>
                  <View style={styles.fallbackHeader}>
                    <Icon name="warning" size={24} color="#FF9800" />
                    <Text style={styles.fallbackTitle}>Mode alternatif</Text>
                  </View>
                  
                  <Text style={styles.fallbackText}>
                    Le code OTP a échoué. Vous pouvez utiliser une validation alternative :
                  </Text>

                  <Button
                    mode="outlined"
                    onPress={handleFallbackValidation}
                    style={styles.fallbackButton}
                    icon="edit"
                  >
                    Signature ou Photo
                  </Button>
                </Card.Content>
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContent: {
    flexGrow: 1
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
  card: {
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#212121'
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 20
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#fff'
  },
  otpInputFilled: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD'
  },
  otpInputError: {
    borderColor: '#F44336'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4
  },
  errorText: {
    color: '#F44336',
    fontSize: 14
  },
  attemptsText: {
    textAlign: 'center',
    color: '#FF9800',
    fontSize: 12,
    marginBottom: 16
  },
  verifyButton: {
    marginBottom: 16
  },
  buttonContent: {
    paddingVertical: 8
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8
  },
  resendText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500'
  },
  resendTextDisabled: {
    color: '#9E9E9E'
  },
  fallbackCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800'
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20
  },
  fallbackButton: {
    borderColor: '#FF9800'
  }
})

export default OTPValidationScreen
