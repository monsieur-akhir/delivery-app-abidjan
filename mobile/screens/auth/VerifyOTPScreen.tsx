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
  Dimensions,
} from "react-native"
import { Text, Button, Snackbar, Card } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { verifyOTP, resendOTP } from "../../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"

type VerifyOTPScreenRouteParams = {
  phone: string
  isReset?: boolean
}

type VerifyOTPScreenProps = {
  route: RouteProp<RootStackParamList, "VerifyOTP">
  navigation: NativeStackNavigationProp<RootStackParamList, "VerifyOTP">
}

interface AuthContextType {
  completeRegistration?: () => Promise<void>
  // Ajoutez ici les autres propriétés de votre contexte si nécessaire
}

const VerifyOTPScreen: React.FC<VerifyOTPScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { phone } = route.params
  const { completeRegistration } = useAuth() as AuthContextType

  const [otp, setOtp] = useState<string[]>(["", "", "", ""])
  const [loading, setLoading] = useState<boolean>(false)
  const [resendLoading, setResendLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(60)

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

  const handleOtpChange = (value: string, index: number): void => {
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Automatically move to next field
    if (value && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

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
    const otpCode = otp.join("")
    if (otpCode.length !== 4) {
      setError(t("verifyOTP.errorIncompleteOTP"))
      setVisible(true)
      return
    }

    setLoading(true)
    try {
      await verifyOTP(phone, otpCode)
      if (completeRegistration) {
        await completeRegistration()
      }

      // Navigate to appropriate screen
      navigation.reset({
        index: 0,
        routes: [{ name: "ClientTabs" }],
      })
    } catch (error) {
      console.error("OTP verification error:", error)
      setError(error instanceof Error ? error.message : t("verifyOTP.errorInvalidOTP"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (): Promise<void> => {
    setResendLoading(true)
    try {
      await resendOTP(phone)
      setCountdown(60)
      setError(t("verifyOTP.otpResent"))
      setVisible(true)
    } catch (error) {
      console.error("Resend OTP error:", error)
      setError(error instanceof Error ? error.message : t("verifyOTP.errorResendOTP"))
      setVisible(true)
    } finally {
      setResendLoading(false)
    }
  }

  const { width: screenWidth } = Dimensions.get('window')

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />
      
      {/* Header Background */}
      <View style={styles.headerBackground}>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </Animatable.View>
      </View>
      
      <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.content}>
        <Card style={styles.card} elevation={5}>
          <View style={styles.cardContent}>
            <Animatable.View animation="zoomIn" duration={600} delay={600}>
              <View style={styles.iconContainer}>
                <Image 
                  source={require("../../assets/notification-icon.png")}
                  style={styles.notificationIcon}
                  resizeMode="contain"
                />
              </View>
            </Animatable.View>
            
            <Text style={styles.title}>{t("verifyOTP.title")}</Text>
            <Text style={styles.subtitle}>
              {t("verifyOTP.subtitle")} <Text style={styles.phoneText}>{phone}</Text>
            </Text>

            <Animatable.View animation="fadeIn" duration={800} delay={800} style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : {},
                    index === otp.findIndex((d, i) => i >= index && d === "") ? styles.otpInputActive : {}
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </Animatable.View>

            <Animatable.View animation="fadeIn" duration={800} delay={1000}>
              <Button
                mode="contained"
                onPress={handleVerify}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                loading={loading}
                disabled={loading || otp.join("").length !== 4}
              >
                {t("verifyOTP.verify")}
              </Button>
              
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>{t("verifyOTP.didntReceive")}</Text>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    {t("verifyOTP.resendIn")} {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={resendLoading} activeOpacity={0.7}>
                    <Text style={styles.resendLink}>
                      {resendLoading ? t("verifyOTP.sending") : t("verifyOTP.resend")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animatable.View>
          </View>
        </Card>
        
        <TouchableOpacity 
          style={styles.changeNumberContainer} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.changeNumberText}>{t("verifyOTP.changeNumber")}</Text>
        </TouchableOpacity>
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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  headerBackground: {
    backgroundColor: "#FF6B00",
    height: 120,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 140,
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF9F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE0CC",
    elevation: 2,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    tintColor: "#FF6B00",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FF6B00",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  phoneText: {
    fontWeight: "bold",
    color: "#444444",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 30,
  },
  otpInput: {
    width: 65,
    height: 65,
    borderWidth: 1.5,
    borderColor: "#CCCCCC",
    borderRadius: 12,
    fontSize: 26,
    fontWeight: "bold",
    backgroundColor: "#F5F5F5",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  otpInputFilled: {
    backgroundColor: "#FFF9F5",
    borderColor: "#FF6B00",
    elevation: 2,
  },
  otpInputActive: {
    borderColor: "#FF6B00",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  button: {
    width: "100%",
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#FF6B00",
    elevation: 6,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 5,
    paddingVertical: 10,
  },
  resendText: {
    color: "#757575",
    fontSize: 15,
  },
  countdownText: {
    marginLeft: 5,
    color: "#FF6B00",
    fontSize: 15,
  },
  resendLink: {
    marginLeft: 5,
    color: "#FF6B00",
    fontWeight: "bold",
    fontSize: 15,
  },
  changeNumberContainer: {
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  changeNumberText: {
    color: "#757575",
    fontSize: 15,
    textDecorationLine: "underline",
  },
})

export default VerifyOTPScreen
