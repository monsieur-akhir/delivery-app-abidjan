"use client"

import type React from "react"
import { useState } from "react"
import { StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native"
import { Text, TextInput, Button, Snackbar } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { resetPassword } from "../../services/api"
import { validatePhone } from "../../utils/validators"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ForgotPassword">
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()

  const [phone, setPhone] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)

  const handleResetPassword = async (): Promise<void> => {
    if (!phone || !validatePhone(phone)) {
      setError(t("forgotPassword.errorInvalidPhone"))
      setVisible(true)
      return
    }

    setLoading(true)
    try {
      await resetPassword(phone)
      setSuccess(t("forgotPassword.resetSent"))
      setVisible(true)
      // Rediriger vers l'écran de vérification OTP après un court délai
      setTimeout(() => {
        navigation.navigate("VerifyOTP", { phone, isReset: true })
      }, 2000)
    } catch (error) {
      console.error("Password reset error:", error)
      setError(error instanceof Error ? error.message : t("forgotPassword.errorGeneric"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Animatable.View animation="fadeInUp" duration={800} style={styles.content}>
        <Text style={styles.title}>{t("forgotPassword.title")}</Text>
        <Text style={styles.subtitle}>{t("forgotPassword.subtitle")}</Text>

        <TextInput
          label={t("forgotPassword.phone")}
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
          mode="outlined"
          left={<TextInput.Icon icon="phone" />}
        />

        <Button
          mode="contained"
          onPress={handleResetPassword}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          {t("forgotPassword.reset")}
        </Button>

        <TouchableOpacity style={styles.backContainer} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("forgotPassword.backToLogin")}</Text>
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
        style={success ? styles.successSnackbar : {}}
      >
        {success || error}
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
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 30,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  button: {
    marginBottom: 20,
    paddingVertical: 8,
    backgroundColor: "#FF6B00",
  },
  backContainer: {
    alignItems: "center",
  },
  backText: {
    color: "#757575",
    textDecorationLine: "underline",
  },
  successSnackbar: {
    backgroundColor: "#4CAF50",
  },
})

export default ForgotPasswordScreen
