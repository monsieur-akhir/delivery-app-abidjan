"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { TextInput, Button, Text, Snackbar, Checkbox } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import i18n from "../../i18n"

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const { isConnected, isOfflineMode, toggleOfflineMode } = useNetwork()

  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true)
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [showOfflineWarning, setShowOfflineWarning] = useState<boolean>(false)
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized)

  // Charger les identifiants sauvegardés
  useEffect(() => {
    const loadSavedCredentials = async (): Promise<void> => {
      try {
        const savedPhone = await AsyncStorage.getItem("savedPhone")
        const savedRememberMe = await AsyncStorage.getItem("rememberMe")

        if (savedPhone && savedRememberMe === "true") {
          setPhone(savedPhone)
          setRememberMe(true)
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error)
      }
    }

    loadSavedCredentials()
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

  if (!isI18nReady) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Chargement...</Text></View>;
  }

  const handleLogin = async (): Promise<void> => {
    if (phone.trim() === "" || password.trim() === "") {
      setError(t("login.errorRequiredFields"))
      setVisible(true)
      return
    }

    setLoading(true)
    try {
      // Sauvegarder les identifiants si "Se souvenir de moi" est coché
      if (rememberMe) {
        await AsyncStorage.setItem("savedPhone", phone)
        await AsyncStorage.setItem("rememberMe", "true")
      } else {
        await AsyncStorage.removeItem("savedPhone")
        await AsyncStorage.removeItem("rememberMe")
      }

      // Connexion
      await signIn(phone, password)
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : t("login.errorGeneric"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const handleOfflineMode = (): void => {
    toggleOfflineMode(true)
    setShowOfflineWarning(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.formContainer}>
          <Text style={styles.title}>{t("login.welcome")}</Text>
          <Text style={styles.subtitle}>{t("login.subtitle")}</Text>

          {showOfflineWarning && (
            <View style={styles.offlineWarning}>
              <Text style={styles.offlineText}>{t("login.offlineWarning")}</Text>
              <Button mode="contained" onPress={handleOfflineMode} style={styles.offlineButton}>
                {t("login.useOfflineMode")}
              </Button>
            </View>
          )}

          <TextInput
            label={t("login.phone")}
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
            mode="outlined"
          />

          <TextInput
            label={t("login.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye-off" : "eye"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
            mode="outlined"
          />

          <View style={styles.rememberContainer}>
            <Checkbox.Item
              label={t("login.rememberMe")}
              status={rememberMe ? "checked" : "unchecked"}
              onPress={() => setRememberMe(!rememberMe)}
              labelStyle={styles.checkboxLabel}
              position="leading"
              style={styles.checkbox}
            />
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotPassword}>{t("login.forgotPassword")}</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
            disabled={loading || (!isConnected && !isOfflineMode)}
          >
            {t("login.submit")}
          </Button>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>{t("login.noAccount")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>{t("login.register")}</Text>
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
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 28,
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
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  rememberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    padding: 0,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#757575",
  },
  forgotPassword: {
    color: "#FF6B00",
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: "#FF6B00",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#757575",
  },
  registerLink: {
    color: "#FF6B00",
    fontWeight: "bold",
    marginLeft: 5,
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

export default LoginScreen