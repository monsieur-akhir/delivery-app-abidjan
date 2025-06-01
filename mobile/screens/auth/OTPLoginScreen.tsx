"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { TextInput, Button, Text, Snackbar } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNetwork } from "../../contexts/NetworkContext"
import { sendOTP, loginWithOTP } from "../../services/api"
import LoginIllustration from "../../assets/login-connexion.svg"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import i18n from "../../i18n"

type OTPLoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "OTPLogin">
}

const OTPLoginScreen: React.FC<OTPLoginScreenProps> = ({ navigation }) => {  const { t } = useTranslation()
  const { isConnected, isOfflineMode, toggleOfflineMode } = useNetwork()

  const [phone, setPhone] = useState<string>("")
  const [otp, setOTP] = useState<string>("")
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [showOfflineWarning, setShowOfflineWarning] = useState<boolean>(false)
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized)
  const [countdown, setCountdown] = useState<number>(0)

  // Charger le téléphone sauvegardé
  useEffect(() => {
    const loadSavedPhone = async (): Promise<void> => {
      try {
        const savedPhone = await AsyncStorage.getItem("savedPhone")
        if (savedPhone) {
          setPhone(savedPhone)
        }
      } catch (error) {
        console.error("Error loading saved phone:", error)
      }
    }
    loadSavedPhone()
  }, [])

  // Vérifier la connectivité
  useEffect(() => {
    if (!isConnected && !isOfflineMode) {
      setShowOfflineWarning(true)
    } else {
      setShowOfflineWarning(false)
    }
  }, [isConnected, isOfflineMode])

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on("initialized", () => setIsI18nReady(true))
    }
  }, [])

  // Gérer le compte à rebours pour renvoyer l'OTP
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [countdown])

  if (!isI18nReady) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Chargement...</Text></View>;
  }
  const handleSendOTP = async (): Promise<void> => {
    if (phone.trim() === "") {
      setError(t("otpLogin.errorPhoneRequired"))
      setVisible(true)
      return
    }    // Validation basique du numéro de téléphone
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phone.replace(/[\s\-()]/g, ''))) {
      setError(t("otpLogin.errorPhoneInvalid"))
      setVisible(true)
      return
    }    setLoading(true)
    try {
      // Sauvegarder automatiquement le numéro de téléphone
      await AsyncStorage.setItem("savedPhone", phone)
        // Envoyer l'OTP
      const response = await sendOTP(phone, 'login')
      
      // Ne passer à l'étape OTP que si la requête a réussi
      if (response.success) {
        setStep('otp')
        setCountdown(60) // 60 secondes avant de pouvoir renvoyer
        setError("")
        // Afficher le message de succès
        setError(response.message || t("otpLogin.otpSent"))
        setVisible(true)
        setTimeout(() => setVisible(false), 2000) // Masquer après 2 secondes
      } else {
        setError(response.message || t("otpLogin.errorSendingOtp"))
        setVisible(true)
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      setError(error instanceof Error ? error.message : t("otpLogin.errorSendingOtp"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (): Promise<void> => {
    if (otp.trim() === "") {
      setError(t("otpLogin.errorOtpRequired"))
      setVisible(true)
      return
    }

    if (otp.length !== 6) {
      setError(t("otpLogin.errorOtpInvalid"))
      setVisible(true)
      return
    }    setLoading(true)
    try {
      // Connexion avec OTP
      const result = await loginWithOTP(phone, otp)
      
      // Sauvegarder les informations d'authentification
      await AsyncStorage.setItem("token", result.token)
      await AsyncStorage.setItem("user", JSON.stringify(result.user))
      
      // Mettre à jour le contexte d'authentification
      // signIn sera appelé automatiquement par le contexte en détectant les données dans AsyncStorage
      // Mais nous devons forcer la mise à jour du contexte
        // Redirection basée sur le rôle utilisateur
      if (result.user.role === 'courier') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'CourierMain' }],
        })
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ClientMain' }],
        })
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("OTP Login error:", error)
      setError(error instanceof Error ? error.message : t("otpLogin.errorVerifyingOtp"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async (): Promise<void> => {
    if (countdown > 0) return
    
    setLoading(true)
    try {
      await sendOTP(phone, 'login')
      setCountdown(60)
      setError("")
    } catch (error) {
      console.error("Resend OTP error:", error)
      setError(error instanceof Error ? error.message : t("otpLogin.errorSendingOtp"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = (): void => {
    setStep('phone')
    setOTP("")
    setCountdown(0)
  }

  const handleOfflineMode = (): void => {
    toggleOfflineMode(true)
    setShowOfflineWarning(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Image d'illustration de connexion */}
        <Animatable.View animation="fadeIn" duration={1000} style={styles.illustrationContainer}>
          <LoginIllustration width="100%" height={220} />
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} style={styles.formContainer}>          {/* Titre de connexion */}
          <Text style={styles.title}>
            {step === 'phone' ? t("otpLogin.title") : t("otpLogin.enterOtp")}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone' 
              ? t("otpLogin.subtitle") 
              : t("otpLogin.otpSubtitle")
            }
          </Text>

          {showOfflineWarning && (
            <View style={styles.offlineWarning}>
              <Text style={styles.offlineText}>{t("login.offlineWarning")}</Text>
              <Button mode="contained" onPress={handleOfflineMode} style={styles.offlineButton}>
                {t("login.useOfflineMode")}
              </Button>
            </View>
          )}

          {step === 'phone' ? (
            // Étape 1: Saisie du numéro de téléphone
            <>              <Animatable.View animation="fadeInLeft" duration={800} delay={300} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t("otpLogin.phone")}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    keyboardType="phone-pad"
                    left={<TextInput.Icon icon="phone" color={focused => focused ? "#FF6C37" : "#757575"} />}
                    mode="outlined"
                    placeholder={t("login.phonePlaceholder")}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#FF6C37"
                    theme={{ roundness: 12 }}
                  />
                </View>
              </Animatable.View>

              {/* Bouton d'envoi OTP */}
              <Animatable.View animation="bounceIn" duration={1000} delay={500}>
                <Button
                  mode="contained"
                  onPress={handleSendOTP}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  loading={loading}
                  disabled={loading || (!isConnected && !isOfflineMode)}
                >
                  {t("otpLogin.sendOtp")}
                </Button>
              </Animatable.View>
            </>
          ) : (
            // Étape 2: Vérification de l'OTP
            <>              <Animatable.View animation="fadeInRight" duration={800} delay={300} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t("otpLogin.otpCode")}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={otp}
                    onChangeText={setOTP}
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={6}
                    left={<TextInput.Icon icon="shield-key" color={focused => focused ? "#FF6C37" : "#757575"} />}
                    mode="outlined"
                    placeholder="123456"
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#FF6C37"
                    theme={{ roundness: 12 }}
                  />
                </View>
              </Animatable.View>

              {/* Boutons de vérification et renvoi */}
              <Animatable.View animation="bounceIn" duration={1000} delay={500}>
                <Button
                  mode="contained"
                  onPress={handleVerifyOTP}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  loading={loading}
                  disabled={loading}
                >
                  {t("otpLogin.verify")}
                </Button>
              </Animatable.View>

              {/* Bouton de renvoi d'OTP */}
              <Animatable.View animation="fadeIn" duration={800} delay={700} style={styles.resendContainer}>
                <TouchableOpacity 
                  onPress={handleResendOTP} 
                  disabled={countdown > 0 || loading}
                  style={[styles.resendButton, (countdown > 0 || loading) && styles.resendButtonDisabled]}
                >                  <Text style={[styles.resendText, (countdown > 0 || loading) && styles.resendTextDisabled]}>
                    {countdown > 0 
                      ? t("otpLogin.resendIn") + " " + countdown + " " + t("otpLogin.seconds")
                      : t("otpLogin.resendCode")
                    }
                  </Text>
                </TouchableOpacity>
              </Animatable.View>

              {/* Bouton retour */}
              <Animatable.View animation="fadeIn" duration={800} delay={900} style={styles.backContainer}>
                <TouchableOpacity onPress={handleBackToPhone}>
                  <Text style={styles.backText}>{t("otpLogin.backToPhone")}</Text>
                </TouchableOpacity>
              </Animatable.View>
            </>
          )}

          {/* Pas de compte */}
          <Animatable.View animation="fadeIn" duration={800} delay={1400} style={styles.registerContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>{t("login.noAccount")}</Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>

        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={3000}
          action={{
            label: "OK",
            onPress: () => setVisible(false),
          }}
        >
          {error}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  illustrationContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  illustration: {
    width: "100%",
    height: 220,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000000",
  },
  subtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 25,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333333",
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    backgroundColor: "#F5F5F5",
    height: 50,
  },
  button: {
    backgroundColor: "#FF6C37",
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: "#FF6C37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: "#FF6C37",
    fontSize: 14,
    fontWeight: "500",
  },
  resendTextDisabled: {
    color: "#757575",
  },
  backContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  backText: {
    color: "#757575",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  registerContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  registerLink: {
    color: "#FF6C37",
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  offlineWarning: {
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  offlineText: {
    color: "#E65100",
    marginBottom: 8,
  },
  offlineButton: {
    backgroundColor: "#FF9800",
  },
})

export default OTPLoginScreen
