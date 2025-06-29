"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput as RNTextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Image,
  StatusBar,
} from "react-native"
import { Text, Button, Snackbar, Card } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { verifyOTP, resendOTP } from "../../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { User } from "../../types/models"
import CustomErrorModal from '../../components/CustomErrorModal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';

type VerifyOTPScreenProps = {
  route: RouteProp<RootStackParamList, "VerifyOTP">
  navigation: NativeStackNavigationProp<RootStackParamList, "VerifyOTP">
}

interface AuthContextType {
  completeRegistration?: () => Promise<void>
  setAuthData?: (user: User, token: string) => void
}

// Helper pour formater le numéro au format +225 XX XX XX XXX
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('225')) p = '+' + p;
  if (p.startsWith('0')) p = '+225' + p.slice(1);
  if (!p.startsWith('+225')) p = '+225' + p;
  // Format +225 XX XX XX XXX
  return p.replace(/(\+225)(\d{2})(\d{2})(\d{2})(\d{3})/, '$1 $2 $3 $4 $5');
}

const VerifyOTPScreen: React.FC<VerifyOTPScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { phoneNumber, role } = route.params
  const { completeRegistration, setAuthData } = useAuth() as AuthContextType

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])  // 6-digit OTP
  const [loading, setLoading] = useState<boolean>(false)
  const [resendLoading, setResendLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(60)
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [errorModalTitle, setErrorModalTitle] = useState('Erreur');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [shake, setShake] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  const inputRefs = useRef<Array<RNTextInput | null>>([])

  // Countdown for resending code
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

  const focusFirstEmptyOtp = () => {
    const idx = otp.findIndex((d) => d === "");
    if (inputRefs.current[idx]) inputRefs.current[idx]?.focus();
  };

  useEffect(() => {
    focusFirstEmptyOtp();
  }, []);

  const handleOtpChange = (value: string, index: number): void => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>, 
    index: number
  ): void => {
    // Go back to previous field on delete
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (): Promise<void> => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorModalTitle('Erreur');
      setErrorModalMessage(t('verifyOTP.errorIncompleteOTP', 'Veuillez saisir le code complet.'));
      setShowErrorModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOTP(phoneNumber || route.params.phone || '', otpCode);
      if (result.success) {
        if (setAuthData && result.token && result.user) {
          setAuthData(result.user, result.token);
        } else if (completeRegistration) {
          await completeRegistration();
        }
        if (role === 'courier') {
          navigation.reset({ index: 0, routes: [{ name: 'KYCVerification' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'ClientMain' }] });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setErrorModalTitle('Erreur');
        setErrorModalMessage(result.message || t('verifyOTP.errorInvalidOTP', 'Code incorrect ou expiré.'));
        setShowErrorModal(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setShake(true);
      }
    } catch (error) {
      setErrorModalTitle('Erreur');
      setErrorModalMessage(error instanceof Error ? error.message : t('verifyOTP.errorInvalidOTP', 'Code incorrect ou expiré.'));
      setShowErrorModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShake(true);
    } finally {
      setLoading(false);
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleResend = async (): Promise<void> => {
    setResendLoading(true);
    setOtpSuccess('');
    try {
      const otpResponse = await resendOTP(route.params.phoneNumber || route.params.phone || '', 'login');
      setCountdown(60);
      setOtpSuccess(t('verifyOTP.otpResent', 'Code renvoyé avec succès.'));
      setShowSuccessModal(true);
      setSuccessModalMessage(t('verifyOTP.otpResent', 'Code renvoyé avec succès.'));
      // Log du code OTP si dispo (pour dev)
      if (otpResponse && otpResponse.dev_otp_code) {
        console.log('OTP envoyé (dev):', otpResponse.dev_otp_code);
      }
    } catch (error) {
      setErrorModalTitle('Erreur');
      setErrorModalMessage(error instanceof Error ? error.message : t('verifyOTP.errorResendOTP', "Erreur lors de l'envoi du code."));
      setShowErrorModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShake(true);
    } finally {
      setResendLoading(false);
      setTimeout(() => setShake(false), 600);
    }
  }

  // Animation de pulsation pour l'icône
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />
        <CustomErrorModal
          visible={showErrorModal}
          title={errorModalTitle}
          message={errorModalMessage}
          onDismiss={() => setShowErrorModal(false)}
        />
        {/* Popup succès OTP envoyé */}
        <CustomErrorModal
          visible={showSuccessModal}
          title={t('verifyOTP.otpSentTitle', 'Succès')}
          message={successModalMessage}
          onDismiss={() => setShowSuccessModal(false)}
        />
        {/* Logo en haut, centré, plus grand */}
        <View style={styles.logoWrapper}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.centeredContent}>
          <View style={styles.otpCard}>
            <Animated.View style={[styles.otpIconCircle, { transform: [{ scale: pulseAnim }] }]}> 
              <LinearGradient colors={["#FFD580", "#FFB347"]} style={styles.otpIconGradient}>
                <Ionicons name="shield-checkmark" size={44} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.otpTitle}>{t('verifyOTP.title', 'Entrez votre code')}</Text>
            <Text style={styles.otpSubtitle}>{t('verifyOTP.subtitle', 'Nous avons envoyé un code au')} <Text style={styles.otpPhone}>{formatPhoneNumber(route.params.phoneNumber || route.params.phone)}</Text></Text>
            <View style={styles.otpInputRow}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInputBox,
                    digit ? styles.otpInputBoxFilled : {},
                    errorModalMessage && showErrorModal ? styles.otpInputBoxError : {},
                    index === otp.findIndex((d, i) => i >= index && d === "") ? styles.otpInputBoxActive : {}
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  autoFocus={index === 0}
                  accessible
                  accessibilityLabel={`Chiffre ${index + 1}`}
                  returnKeyType="next"
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.otpButton}
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={loading || otp.join("").length !== 6}
              accessibilityLabel="Valider le code"
            >
              <LinearGradient colors={["#FFD580", "#FFB347"]} style={styles.otpButtonGradient} start={{x:0.2,y:0.2}} end={{x:0.8,y:0.8}}>
                <Text style={styles.otpButtonLabel}>{loading ? t('verifyOTP.loading', 'Vérification...') : t('verifyOTP.verify', 'Valider le code')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.otpTimerRow}>
              <Text style={styles.otpTimerText}>{t('verifyOTP.notReceived', 'Pas reçu ?')}</Text>
              <TouchableOpacity onPress={handleResend} disabled={resendLoading || countdown > 0} style={styles.otpResendLink} activeOpacity={0.7}>
                <Text style={[styles.otpResendText, resendLoading || countdown > 0 ? styles.otpResendDisabled : {}]}>
                  {countdown > 0 ? `${t('verifyOTP.resend', 'Renvoyer dans')} ${countdown}s` : t('verifyOTP.resend', 'Renvoyer')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Bouton changer de numéro juste sous la card */}
          <TouchableOpacity 
            style={styles.otpChangeNumberBtn} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FF6B00" style={{ marginRight: 6 }} />
            <Text style={styles.otpChangeNumberText}>{t("verifyOTP.changeNumber", "Changer de numéro")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  logoWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 18,
  },
  logo: {
    width: 180,
    height: 90,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  otpCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
    marginBottom: 18,
  },
  otpIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.10)',
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  otpIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 0,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  otpPhone: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 15,
  },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 0,
  },
  otpInputBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 5,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputBoxFilled: {
    backgroundColor: '#FFF6E5',
    borderColor: '#FFB347',
    elevation: 2,
  },
  otpInputBoxActive: {
    borderColor: '#FF6B00',
    borderWidth: 2,
    backgroundColor: '#FFF9F5',
    shadowOpacity: 0.10,
    elevation: 2,
  },
  otpInputBoxError: {
    borderColor: '#FF0000',
    borderWidth: 2,
    backgroundColor: '#FFE0E0',
  },
  otpButton: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginBottom: 10,
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  otpButtonGradient: {
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  otpButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: '#FFB347',
    textShadowRadius: 3,
    letterSpacing: 0.1,
  },
  otpTimerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  otpTimerText: {
    color: '#888',
    fontSize: 13,
    marginRight: 4,
  },
  otpResendLink: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 8,
  },
  otpResendText: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  otpResendDisabled: {
    color: '#CCCCCC',
    textDecorationLine: 'none',
  },
  otpChangeNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FFB347',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#fff',
    shadowColor: '#FFB347',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  otpChangeNumberText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
})

export default VerifyOTPScreen
