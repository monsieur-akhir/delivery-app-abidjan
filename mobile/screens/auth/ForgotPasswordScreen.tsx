"use client"

import type React from "react"
import { useState, useRef } from "react"
import { 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  View, 
  Image, 
  StatusBar, 
  Animated
} from "react-native"
import { Text, TextInput, Button, Snackbar, Card, HelperText, IconButton } from "react-native-paper"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { resetPassword } from "../../services/api"
import { validatePhone } from "../../utils/validators"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import { LinearGradient } from 'expo-linear-gradient'

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
  
  const pulseAnim = useRef(new Animated.Value(1)).current
  const shakeAnim = useRef(new Animated.Value(0)).current

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
      startPulseAnimation()
      // Redirect to OTP verification screen after a short delay
      setTimeout(() => {
        navigation.navigate("VerifyOTP", { phone: phone })
      }, 2000)
    } catch (error) {
      console.error("Password reset error:", error)
      setError(error instanceof Error ? error.message : t("forgotPassword.errorGeneric"))
      setVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation for successful reset
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Animation for error
  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#FF8124', '#FF6B00', '#FF5000']}
        style={styles.headerBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Animatable.View animation="fadeIn" duration={1000} style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </Animatable.View>
        
        <View style={{ position: 'absolute', top: 20, left: 10 }}>
          <IconButton
            icon="arrow-left"
            iconColor="#FFF"
            size={24}
            onPress={() => navigation.goBack()}
          />
        </View>
      </LinearGradient>
      
      <Animatable.View animation="fadeInUp" duration={800} delay={300} style={styles.content}>
        <Card style={styles.card} elevation={5}>
          <Animatable.View animation="fadeIn" style={styles.cardContent}>
            <Animatable.View animation="zoomIn" duration={600} delay={600}>
              <Animated.View style={[
                styles.iconContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <Image 
                  source={require("../../assets/notification-icon.png")}
                  style={styles.lockIcon}
                  resizeMode="contain"
                />
              </Animated.View>
            </Animatable.View>
            
            <Animatable.View animation="fadeInDown" duration={800} delay={400}>
              <Text style={styles.title}>{t("forgotPassword.title")}</Text>
              <Text style={styles.subtitle}>{t("forgotPassword.subtitle")}</Text>
            </Animatable.View>

            <Animatable.View animation="fadeIn" duration={800} delay={800} style={styles.inputContainer}>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <TextInput
                  label={t("forgotPassword.phone")}
                  value={phone}
                  onChangeText={setPhone}
                  style={[styles.input, focusedField === 'phone' && styles.focusedInput]}
                  keyboardType="phone-pad"
                  mode="outlined"
                  outlineColor={focusedField === 'phone' ? "#FF6B00" : '#CCCCCC'}
                  activeOutlineColor="#FF6B00"
                  left={<TextInput.Icon icon="phone" color={focusedField === 'phone' ? "#FF6B00" : "#999"} />}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
                <HelperText type="info" style={styles.helperText}>
                  {t("forgotPassword.phoneHelp") || "Entrez votre numéro de téléphone pour recevoir le code"}
                </HelperText>
              </Animated.View>
            </Animatable.View>

            <Animatable.View animation="fadeIn" duration={800} delay={1000} style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => {
                  if (!phone || !validatePhone(phone)) {
                    startShakeAnimation();
                  }
                  handleResetPassword();
                }}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                loading={loading}
                disabled={loading}
                icon="key-variant"
              >
                {t("forgotPassword.reset")}
              </Button>
            </Animatable.View>
          </Animatable.View>
        </Card>
        
        <TouchableOpacity 
          style={styles.backContainer} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
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
    paddingHorizontal: 10,
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
  lockIcon: {
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
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  focusedInput: {
    backgroundColor: "#FFF9F5",
  },
  helperText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 15,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
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
  backContainer: {
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  backText: {
    color: "#757575",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  successSnackbar: {
    backgroundColor: "#4CAF50",
  },
})

export default ForgotPasswordScreen
