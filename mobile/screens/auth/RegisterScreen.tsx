"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from "react-native"
import { Text, TextInput, Button, HelperText, Snackbar } from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { validatePhone, validateEmail, validatePassword } from "../../utils/validators"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { UserRole, VehicleType } from "../../types/models"

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">
}

type LanguageCode = "fr" | "dioula" | "baoulé"

interface Language {
  code: LanguageCode
  name: string
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const { signUp } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()

  const [fullName, setFullName] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [role, setRole] = useState<UserRole>("client")
  const [commune, setCommune] = useState<string>("")
  const [language, setLanguage] = useState<LanguageCode>((i18n.language as LanguageCode) || "fr")
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [vehicleType, setVehicleType] = useState<VehicleType>("motorcycle" as VehicleType)
  const [licensePlate, setLicensePlate] = useState<string>("")

  const communes: string[] = [
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

  const languages: Language[] = [
    { code: "fr", name: "Français" },
    { code: "dioula", name: "Dioula" },
    { code: "baoulé", name: "Baoulé" },
  ]

  const handleRegister = async (): Promise<void> => {
    // Validate fields
    if (!fullName || !phone || !password || !confirmPassword) {
      setError(t("register.errorRequiredFields"))
      setVisible(true)
      return
    }

    // If user is a courier, check license plate
    if (role === "coursier" && !licensePlate) {
      setError(t("register.errorLicensePlateRequired"))
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
      const userData: any = {
        full_name: fullName,
        phone,
        email: email || undefined,
        password,
        role,
        commune: commune || undefined,
        language_preference: language,
      }

      // Add vehicle information for couriers
      if (role === "coursier") {
        userData.vehicle_type = vehicleType
        userData.license_plate = licensePlate
      }

      if (isConnected) {
        // Online registration
        await signUp(userData)
        navigation.navigate("VerifyOTP", { phone })
      } else {
        // Offline mode: store for later synchronization
        addPendingUpload({
          type: "register",
          data: userData,
        })
        setError(t("register.offlineRegistration"))
        setVisible(true)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError(error instanceof Error ? error.message : t("register.errorGeneric"))
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

          {/* Language selection */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>{t("register.language")}</Text>
            <Picker
              selectedValue={language}
              onValueChange={(itemValue: LanguageCode) => {
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
              onValueChange={(itemValue: UserRole) => setRole(itemValue)}
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
              onValueChange={(itemValue: string) => setCommune(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label={t("register.selectCommune")} value="" />
              {communes.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          {role === "coursier" && (
            <>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>{t("register.vehicleType")}</Text>
                <Picker
                  selectedValue={vehicleType}
                  onValueChange={(itemValue: VehicleType) => setVehicleType(itemValue)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label={t("vehicleTypes.scooter")} value="scooter" />
                  <Picker.Item label={t("vehicleTypes.bicycle")} value="bicycle" />
                  <Picker.Item label={t("vehicleTypes.motorcycle")} value="motorcycle" />
                  <Picker.Item label={t("vehicleTypes.van")} value="van" />
                  <Picker.Item label={t("vehicleTypes.pickup")} value="pickup" />
                  <Picker.Item label={t("vehicleTypes.kiaTruck")} value="kia_truck" />
                  <Picker.Item label={t("vehicleTypes.movingTruck")} value="moving_truck" />
                  <Picker.Item label={t("vehicleTypes.custom")} value="custom" />
                </Picker>
              </View>

              <TextInput
                label={t("register.licensePlate")}
                value={licensePlate}
                onChangeText={setLicensePlate}
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="car" />}
              />
              <HelperText type="info">{t("register.licensePlateHelp")}</HelperText>
            </>
          )}

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
