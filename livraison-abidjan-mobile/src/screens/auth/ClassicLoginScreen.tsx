"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { TextInput, Button, Text, Snackbar } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { useAlert } from '../../hooks/useAlert'
import { useLoader } from '../../contexts/LoaderContext'
import LoginIllustration from "../../assets/login-connexion.svg"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import i18n from "../../i18n"

type ClassicLoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ClassicLogin">
}

const ClassicLoginScreen: React.FC<ClassicLoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const { isConnected, isOfflineMode, toggleOfflineMode } = useNetwork()
  const { showErrorAlert, showSuccessAlert } = useAlert()
  const { showLoader, hideLoader } = useLoader()

  const [phone, setPhone] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [showOfflineWarning, setShowOfflineWarning] = useState<boolean>(false)
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized)

  // Charger les identifiants sauvegardés
  useEffect(() => {
    const loadSavedCredentials = async (): Promise<void> => {
      try {
        const savedPhone = await AsyncStorage.getItem("savedPhone")
        
        if (savedPhone) {
          setPhone(savedPhone)
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
      showErrorAlert('Erreur', t("login.errorRequiredFields"))
      return
    }

    setLoading(true)
    showLoader('Connexion en cours...')
    
    try {
      // Sauvegarder automatiquement le numéro de téléphone
      await AsyncStorage.setItem("savedPhone", phone)

      // Connexion
      await signIn(phone, password)
      
      hideLoader()
      showSuccessAlert('Connexion réussie', 'Bienvenue !')
    } catch (error) {
      console.error("Login error:", error)
      hideLoader()
      showErrorAlert('Erreur', error instanceof Error ? error.message : t("login.errorGeneric"))
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
        {/* Bouton retour */}
        <Animatable.View animation="fadeInLeft" duration={600} style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← {t("common.back")}</Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Image d'illustration de connexion */}
        <Animatable.View animation="fadeIn" duration={1000} style={styles.illustrationContainer}>
          <LoginIllustration width="100%" height={180} />
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} style={styles.formContainer}>
          {/* Titre de connexion */}          <Text style={styles.title}>{t("classicLogin.title")}</Text>
          <Text style={styles.subtitle}>{t("classicLogin.subtitle")}</Text>

          {showOfflineWarning && (
            <View style={styles.offlineWarning}>
              <Text style={styles.offlineText}>{t("login.offlineWarning")}</Text>
              <Button mode="contained" onPress={handleOfflineMode} style={styles.offlineButton}>
                {t("login.useOfflineMode")}
              </Button>
            </View>
          )}

          {/* Champ de numéro de téléphone */}
          <Animatable.View animation="fadeInLeft" duration={800} delay={300} style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t("login.phone")}</Text>
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

          {/* Champ de mot de passe */}
          <Animatable.View animation="fadeInRight" duration={800} delay={500} style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t("login.password")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                style={styles.input}
                left={<TextInput.Icon icon="lock" color={focused => focused ? "#FF6C37" : "#757575"} />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? "eye-off" : "eye"}
                    color={focused => focused ? "#FF6C37" : "#757575"}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
                mode="outlined"
                placeholder="••••••••"
                outlineColor="#E0E0E0"
                activeOutlineColor="#FF6C37"
                theme={{ roundness: 12 }}
              />
            </View>
          </Animatable.View>

          {/* Mot de passe oublié */}
          <Animatable.View animation="fadeIn" duration={800} delay={600} style={styles.forgotContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotPassword}>{t("login.forgotPassword")}</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Bouton de connexion */}
          <Animatable.View animation="bounceIn" duration={1000} delay={800}>
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading || (!isConnected && !isOfflineMode)}
            >
              {t("login.submit")}
            </Button>
          </Animatable.View>          {/* Recommandation OTP */}
          <Animatable.View animation="fadeIn" duration={800} delay={1000} style={styles.recommendationContainer}>
            <Text style={styles.recommendationText}>{t("classicLogin.otpRecommended")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("OTPLogin")}>
              <Text style={styles.recommendationLink}>{t("classicLogin.switchToOtp")}</Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Pas de compte */}
          <Animatable.View animation="fadeIn" duration={800} delay={1200} style={styles.registerContainer}>
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
  backContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    color: "#FF6C37",
    fontSize: 16,
    fontWeight: "500",
  },
  illustrationContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  illustration: {
    width: "100%",
    height: 180,
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
  forgotContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
  },
  forgotPassword: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "500",
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
  recommendationContainer: {
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  recommendationText: {
    fontSize: 13,
    color: "#2E7D32",
    marginBottom: 5,
  },
  recommendationLink: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  registerContainer: {
    alignItems: "center",
    marginTop: 20,
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

export default ClassicLoginScreen
