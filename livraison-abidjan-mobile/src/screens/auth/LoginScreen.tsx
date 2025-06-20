"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Button, Text, Snackbar } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { Feather } from "@expo/vector-icons"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import i18n from "../../i18n"
import { useAuth } from '../../contexts/AuthContext'

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { isConnected, isOfflineMode, toggleOfflineMode } = useNetwork()
  const { sessionExpired, setSessionExpired } = useAuth()
  const [showSessionExpired, setShowSessionExpired] = useState(sessionExpired)

  const [error] = useState<string>("")
  const [visible, setVisible] = useState<boolean>(false)
  const [showOfflineWarning, setShowOfflineWarning] = useState<boolean>(false)
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized)

  // No need for saved credentials in transition screen

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

  useEffect(() => {
    if (sessionExpired) {
      setShowSessionExpired(true)
      setSessionExpired(false)
    }
  }, [sessionExpired])

  const handleDismissSessionExpired = () => setShowSessionExpired(false)

  if (!isI18nReady) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Chargement...</Text></View>;
  }

  const handleOfflineMode = (): void => {
    toggleOfflineMode(true)
    setShowOfflineWarning(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Snackbar
          visible={showSessionExpired}
          onDismiss={handleDismissSessionExpired}
          duration={4000}
          style={{ backgroundColor: '#FF6B00', borderRadius: 8, marginBottom: 16 }}
          action={{ label: 'OK', onPress: handleDismissSessionExpired, textColor: '#fff' }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Votre session a expiré, veuillez vous reconnecter.</Text>
        </Snackbar>
        {/* Image d'illustration de connexion */}
        <Animatable.View animation="fadeIn" duration={1000} style={styles.illustrationContainer}>
          <View style={styles.illustrationPlaceholder}>
            <Feather name="smartphone" size={80} color="#FF6B00" />
            <Text style={styles.illustrationText}>Livraison Abidjan</Text>
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={800} style={styles.formContainer}>
          {/* Titre de connexion */}
          <Text style={styles.title}>{t("authTransition.title")}</Text>
          <Text style={styles.subtitle}>{t("authTransition.subtitle")}</Text>

          {showOfflineWarning && (
            <View style={styles.offlineWarning}>
              <Text style={styles.offlineText}>{t("login.offlineWarning")}</Text>
              <Button mode="contained" onPress={handleOfflineMode} style={styles.offlineButton}>
                {t("login.useOfflineMode")}
              </Button>
            </View>
          )}

          {/* Message de transition vers OTP */}
          <Animatable.View animation="fadeIn" duration={800} delay={300} style={styles.transitionContainer}>
            <Text style={styles.transitionTitle}>{t("authTransition.securityBenefit")}</Text>
            <Text style={styles.transitionText}>{t("authTransition.nomoreForgotten")}</Text>
            <Text style={styles.transitionText}>{t("authTransition.instant")}</Text>
          </Animatable.View>

          {/* Bouton de connexion avec OTP */}
          <Animatable.View animation="bounceIn" duration={1000} delay={500}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("OTPLogin")}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="shield-key"
            >
              {t("authTransition.continueWithOtp")}
            </Button>
          </Animatable.View>

          {/* Ou utilisez l'ancienne méthode */}
          <Animatable.View animation="fadeIn" duration={800} delay={700} style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t("login.or")}</Text>
            <View style={styles.orLine} />
          </Animatable.View>

          {/* Bouton connexion classique */}
          <Animatable.View animation="fadeIn" duration={800} delay={900}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("ClassicLogin")}
              style={styles.classicButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.classicButtonLabel}
              icon="lock"
            >
              {t("authTransition.useClassicLogin")}
            </Button>
          </Animatable.View>

          {/* Ou utilisez*/}
          <Animatable.View animation="fadeIn" duration={800} delay={1000} style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t("login.or")}</Text>
            <View style={styles.orLine} />
          </Animatable.View>

          {/* Connexion avec réseaux sociaux */}
          <Animatable.View animation="fadeInUp" duration={800} delay={1200} style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={require("../../assets/google.png")} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={require("../../assets/facebook.png")} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image source={require("../../assets/apple.png")} style={styles.socialIcon} />
            </TouchableOpacity>
          </Animatable.View>

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
  illustrationPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    width: "100%",
  },
  illustrationText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B00",
    marginTop: 16,
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
  transitionContainer: {
    backgroundColor: "#F0F8FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6C37",
  },
  transitionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6C37",
    marginBottom: 8,
  },
  transitionText: {
    fontSize: 14,
    color: "#333333",
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
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FF6C37",
    shadowColor: "#FF6C37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    height: 54,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  orText: {
    marginHorizontal: 10,
    color: "#757575",
    fontSize: 12,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  socialButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  registerLink: {
    color: "#000000",
    fontSize: 14,
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
  classicButton: {
    borderColor: "#FF6C37",
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  classicButtonLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF6C37",
  },
})

export default LoginScreen
