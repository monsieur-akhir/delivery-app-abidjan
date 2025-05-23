"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from "react-native"
import { Text, TextInput, Button, HelperText, Snackbar } from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { validatePhone, validateEmail, validatePassword } from "../../utils/validators"

const RegisterScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const { signUp } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("client")
  const [commune, setCommune] = useState("")
  const [language, setLanguage] = useState(i18n.language || "fr")
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)

  const communes = [
    "Abobo",
    "Adjamé",
    "Attécoubé",
    "Cocody",
    "Koumassi",
    "Marcory",
    "Plateau",
    "Port-Bouët",
    "Treichville",
    "Yopougon",
  ]

  const languages = [
    { code: "fr", name: "Français" },
    { code: "dioula", name: "Dioula" },
    { code: "baoulé", name: "Baoulé" },
  ]

  const handleRegister = async () => {
    // Validation des champs
    if (!fullName || !phone || !password || !confirmPassword) {
      setError(t("register.errorRequiredFields"))
      setVisible(true)
      return
    }

    if (!validatePhone(phone)) {
      setError(t("register.errorInvalidPhone"))
      setVisible(true)
      return
    }

    if (email && !validateEmail(email)) {
      setError(t("register.errorInvalidEmail"))
      setVisible(true)
      return
    }

    if (!validatePassword(password)) {
      setError(t("register.errorWeakPassword"))
      setVisible(true)
      return
    }

    if (password !== confirmPassword) {
      setError(t("register.errorPasswordMismatch"))
      setVisible(true)
      return
    }

    setLoading(true)

    try {
      const userData = {
        full_name: fullName,
        phone,
        email: email || undefined,
        password,
        role,
        commune: commune || undefined,
        language_preference: language,
      }

      if (isConnected) {
        // Enregistrement en ligne
        await signUp(userData)
        navigation.navigate("VerifyOTP", { phone })
      } else {
        // Mode hors ligne: stocker pour synchronisation ultérieure
        addPendingUpload({
          type: "register",
          data: userData,
          timestamp: new Date().toISOString(),
        })
        setError(t("register.offlineRegistration"))
        setVisible(true)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError(error.message || t("register.errorGeneric"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.formContainer}>
          <Text style={styles.title}>{t("register.title")}</Text>
          <Text style={styles.subtitle}>{t("register.subtitle")}</Text>

          {/* Sélection de la langue */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>{t("register.language")}</Text>
            <Picker
              selectedValue={language}
              onValueChange={(itemValue) => {
                setLanguage(itemValue)
                i18n.changeLanguage(itemValue)
              }}
              style={styles.picker}
              mode="dropdown"
            >
              {languages.map((lang) => (
                <Picker.Item key={lang.code} label={lang.name} value={lang.code} />
              ))}
            </Picker>
          </View>

          <TextInput
            label={t("register.fullName")}
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label={t("register.phone")}
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Icon icon="phone" />}
          />
          <HelperText type="info">{t("register.phoneHelp")}</HelperText>

          <TextInput
            label={t("register.email")}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="info">{t("register.emailOptional")}</HelperText>

          <TextInput
            label={t("register.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye-off" : "eye"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <TextInput
            label={t("register.confirmPassword")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock-check" />}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>{t("register.role")}</Text>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label={t("roles.client")} value="client" />
              <Picker.Item label={t("roles.courier")} value="courier" />
              <Picker.Item label={t("roles.business")} value="business" />
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>{t("register.commune")}</Text>
            <Picker
              selectedValue={commune}
              onValueChange={(itemValue) => setCommune(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label={t("register.selectCommune")} value="" />
              {communes.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <Button mode="contained" onPress={handleRegister} style={styles.button} loading={loading} disabled={loading}>
            {t("register.submit")}
          </Button>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t("register.alreadyHaveAccount")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>{t("register.login")}</Text>
            </TouchableOpacity>
          </View>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#FF6B00",
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  picker: {
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: "#FF6B00",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  loginText: {
    color: "#757575",
  },
  loginLink: {
    color: "#FF6B00",
    fontWeight: "bold",
    marginLeft: 5,
  },
})

export default RegisterScreen
