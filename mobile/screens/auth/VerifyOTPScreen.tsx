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
} from "react-native"
import { Text, Button, Snackbar } from "react-native-paper"
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Animatable.View animation="fadeInUp" duration={800} style={styles.content}>
        <Text style={styles.title}>{t("verifyOTP.title")}</Text>
        <Text style={styles.subtitle}>
          {t("verifyOTP.subtitle")} {phone}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleVerify}
          style={styles.button}
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
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              <Text style={styles.resendLink}>{resendLoading ? t("verifyOTP.sending") : t("verifyOTP.resend")}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.changeNumberContainer} onPress={() => navigation.goBack()}>
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
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
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
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "#F5F5F5",
  },
  button: {
    marginBottom: 20,
    paddingVertical: 8,
    backgroundColor: "#FF6B00",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  resendText: {
    color: "#757575",
  },
  countdownText: {
    marginLeft: 5,
    color: "#FF6B00",
  },
  resendLink: {
    marginLeft: 5,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  changeNumberContainer: {
    alignItems: "center",
  },
  changeNumberText: {
    color: "#757575",
    textDecorationLine: "underline",
  },
})

export default VerifyOTPScreen
