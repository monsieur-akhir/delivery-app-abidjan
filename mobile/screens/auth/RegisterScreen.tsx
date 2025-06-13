"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Dimensions, StatusBar } from "react-native"
import { Text, TextInput, Button, HelperText, Snackbar, Card, IconButton, useTheme } from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import * as Animatable from "react-native-animatable"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { validatePhone, validateEmail, validatePassword } from "../../utils/validators"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { UserRole, VehicleType } from "../../types/models"
import i18n from "../../i18n"

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
  const theme = useTheme()
  // Get screen dimensions for responsive layouts
  const { width: screenWidth } = Dimensions.get('window')

  // Animation refs
  const formRef = useRef(null)
  const courierSectionRef = useRef(null)
  const scrollViewRef = useRef<ScrollView>(null)

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
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized)
  const [currentStep, setCurrentStep] = useState<number>(0)

  // Focus state for input fields
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Étapes d'inscription
  const steps = [
    "profile", // Choix de profil (client ou coursier)
    "personal", // Informations personnelles
    "security", // Informations de sécurité
    "location", // Commune
    "vehicle", // Véhicule (uniquement pour les coursiers)
  ]

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on("initialized", () => setIsI18nReady(true))
    }
  }, [i18n])

  // Navigation entre les slides
  const goToNextStep = () => {
    // Si l'utilisateur est un client et on passe à l'étape "vehicle", on saute cette étape
    if (role === "client" && steps[currentStep + 1] === "vehicle") {
      handleRegister()
      return
    }

    // Validation par étape
    if (!validateCurrentStep()) {
      return
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      scrollViewRef.current?.scrollTo({ x: screenWidth * nextStep, animated: true })
    } else {
      handleRegister()
    }
  }

  const goToPreviousStep = () => {
    // Si l'utilisateur est un client et on revient de l'étape après "vehicle", on saute cette étape
    if (role === "client" && steps[currentStep - 1] === "vehicle") {
      setCurrentStep(currentStep - 2)
      scrollViewRef.current?.scrollTo({ x: screenWidth * (currentStep - 2), animated: true })
      return
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      scrollViewRef.current?.scrollTo({ x: screenWidth * prevStep, animated: true })
    }
  }

  // Validation par étape
  const validateCurrentStep = (): boolean => {
    const currentStepName = steps[currentStep]

    switch (currentStepName) {
      case "profile":
        // Aucune validation nécessaire, le choix est déjà fait
        return true
      case "personal":
        if (!fullName || !phone) {
          setError(t("register.errorRequiredFields"))
          setVisible(true)
          return false
        }
        if (!validatePhone(phone)) {
          setError(t("register.errorInvalidPhone"))
          setVisible(true)
          return false
        }
        if (email && !validateEmail(email)) {
          setError(t("register.errorInvalidEmail"))
          setVisible(true)
          return false
        }
        return true
      case "security":
        if (!password || !confirmPassword) {
          setError(t("register.errorRequiredFields"))
          setVisible(true)
          return false
        }
        if (!validatePassword(password)) {
          setError(t("register.errorWeakPassword"))
          setVisible(true)
          return false
        }
        if (password !== confirmPassword) {
          setError(t("register.errorPasswordMismatch"))
          setVisible(true)
          return false
        }
        return true
      case "vehicle":
        if (role === UserRole.COURIER && !licensePlate) {
          setError(t("register.errorLicensePlateRequired"))
          setVisible(true)
          return false
        }
        return true
      default:
        return true
    }
  }

  // Gestion du swipe entre les slides
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const newStep = Math.round(offsetX / screenWidth)
    if (newStep !== currentStep) {
      setCurrentStep(newStep)
    }
  }

  if (!isI18nReady) {
    return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Chargement...</Text></View>;
  }

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
    if (role === UserRole.COURIER && !licensePlate) {
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
      const userData: {
        full_name: string;
        phone: string;
        email?: string;
        password: string;
        role: UserRole;
        commune?: string;
        language_preference: LanguageCode;
        vehicle_type?: VehicleType;
        license_plate?: string;
      } = {
        full_name: fullName,
        phone,
        email: email || undefined,
        password,
        role,
        commune: commune || undefined,
        language_preference: language,
      }

      // Add vehicle information for couriers
      if (role === UserRole.COURIER) {
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
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />

      {/* Header Background */}
      <View style={styles.headerBackground}>
        <Animatable.View animation="fadeIn" duration={1000} style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </Animatable.View>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          // Skip vehicle step for client
          if (role === "client" && step === "vehicle") {
            return null
          }
          return (
            <View key={index} style={styles.progressStepContainer}>
              <View 
                style={[
                  styles.progressStep,
                  currentStep >= index ? styles.activeStep : styles.inactiveStep
                ]}
              />
              {index < steps.length - 1 && (
                <View 
                  style={[
                    styles.progressLine,
                    currentStep > index ? styles.activeStep : styles.inactiveStep
                  ]}
                />
              )}
            </View>
          )
        })}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        pagingEnabled 
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.slidesContainer}
      >
        {/* Étape 1 : Choix du profil */}
        <View style={[styles.slide, { width: screenWidth }]}>
          <Card style={styles.card} elevation={5}>
            <Animatable.View 
              animation="fadeInUp" 
              duration={800} 
              style={styles.formContainer}
              ref={formRef}
            >
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{t("register.title")}</Text>
                <Text style={styles.subtitle}>{t("register.subtitle")}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("register.profileInfo")}</Text>
                <Text style={styles.sectionSubtitle}>{t("register.role")}</Text>

                <View style={styles.roleButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === "client" && styles.roleButtonActive
                    ]}
                    onPress={() => setRole("client")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleIconContainer}>
                      <IconButton 
                        icon="account" 
                        size={30} 
                        iconColor={role === "client" ? "#FFFFFF" : "#FF6B00"}
                      />
                    </View>
                    <Text style={[
                      styles.roleButtonText,
                      role === "client" && styles.roleButtonTextActive
                    ]}>
                      {t("roles.client")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === UserRole.COURIER && styles.roleButtonActive
                    ]}
                    onPress={() => setRole(UserRole.COURIER)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleIconContainer}>
                      <IconButton 
                        icon="truck-delivery" 
                        size={30}
                        iconColor={role === UserRole.COURIER ? "#FFFFFF" : "#FF6B00"}
                      />
                    </View>
                    <Text style={[
                      styles.roleButtonText,
                      role === UserRole.COURIER && styles.roleButtonTextActive
                    ]}>
                      {t("roles.courier")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animatable.View>
          </Card>
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={goToNextStep}
              style={styles.button} 
              labelStyle={styles.buttonLabel}
            >
              {t("common.next") || "Suivant"}
            </Button>
          </View>
        </View>

        {/* Étape 2 : Informations personnelles */}
        <View style={[styles.slide, { width: screenWidth }]}>
          <Card style={styles.card} elevation={5}>
            <Animatable.View animation="fadeIn" style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{t("register.personalInfo")}</Text>
              </View>

              <View style={styles.section}>
                <Animatable.View animation={focusedField === 'fullName' ? 'pulse' : undefined}>
                  <TextInput
                    label={t("register.fullName")}
                    value={fullName}
                    onChangeText={setFullName}
                    style={[styles.input, focusedField === 'fullName' && styles.focusedInput]}
                    mode="outlined"
                    outlineColor={focusedField === 'fullName' ? theme.colors.primary : '#CCCCCC'}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="account" />}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </Animatable.View>

                <Animatable.View animation={focusedField === 'phone' ? 'pulse' : undefined}>
                  <TextInput
                    label={t("register.phone")}
                    value={phone}
                    onChangeText={setPhone}
                    style={[styles.input, focusedField === 'phone' && styles.focusedInput]}
                    keyboardType="phone-pad"
                    mode="outlined"
                    outlineColor={focusedField === 'phone' ? theme.colors.primary : '#CCCCCC'}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="phone" />}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <HelperText type="info">{t("register.phoneHelp")}</HelperText>
                </Animatable.View>

                <Animatable.View animation={focusedField === 'email' ? 'pulse' : undefined}>
                  <TextInput
                    label={t("register.email")}
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.input, focusedField === 'email' && styles.focusedInput]}
                    keyboardType="email-address"
                    mode="outlined"
                    outlineColor={focusedField === 'email' ? theme.colors.primary : '#CCCCCC'}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="email" />}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <HelperText type="info">{t("register.emailOptional")}</HelperText>
                </Animatable.View>
              </View>
            </Animatable.View>
          </Card>

          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={goToPreviousStep}
              style={styles.buttonBack} 
              labelStyle={styles.buttonBackLabel}
            >
              {t("common.back") || "Retour"}
            </Button>

            <Button 
              mode="contained" 
              onPress={goToNextStep}
              style={styles.button} 
              labelStyle={styles.buttonLabel}
            >
              {t("common.next") || "Suivant"}
            </Button>
          </View>
        </View>

        {/* Étape 3 : Sécurité */}
        <View style={[styles.slide, { width: screenWidth }]}>
          <Card style={styles.card} elevation={5}>
            <Animatable.View animation="fadeIn" style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{t("register.security")}</Text>
              </View>

              <View style={styles.section}>
                <Animatable.View animation={focusedField === 'password' ? 'pulse' : undefined}>
                  <TextInput
                    label={t("register.password")}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureTextEntry}
                    style={[styles.input, focusedField === 'password' && styles.focusedInput]}
                    mode="outlined"
                    outlineColor={focusedField === 'password' ? theme.colors.primary : '#CCCCCC'}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={secureTextEntry ? "eye-off" : "eye"}
                        onPress={() => setSecureTextEntry(!secureTextEntry)}
                      />
                    }
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                </Animatable.View>

                <Animatable.View animation={focusedField === 'confirmPassword' ? 'pulse' : undefined}>
                  <TextInput
                    label={t("register.confirmPassword")}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={secureTextEntry}
                    style={[styles.input, focusedField === 'confirmPassword' && styles.focusedInput]}
                    mode="outlined"
                    outlineColor={focusedField === 'confirmPassword' ? theme.colors.primary : '#CCCCCC'}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="lock-check" />}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                </Animatable.View>
              </View>
            </Animatable.View>
          </Card>

          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={goToPreviousStep}
              style={styles.buttonBack} 
              labelStyle={styles.buttonBackLabel}
            >
              {t("common.back") || "Retour"}
            </Button>

            <Button 
              mode="contained" 
              onPress={goToNextStep}
              style={styles.button} 
              labelStyle={styles.buttonLabel}
            >
              {t("common.next") || "Suivant"}
            </Button>
          </View>
        </View>

        {/* Étape 4 : Commune */}
        <View style={[styles.slide, { width: screenWidth }]}>
          <Card style={styles.card} elevation={5}>
            <Animatable.View animation="fadeIn" style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>{t("register.commune")}</Text>
              </View>

              <View style={styles.communeSelectionContainer}>
                {communes.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.communeButton,
                      commune === item && styles.communeButtonActive
                    ]}
                    onPress={() => setCommune(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.communeButtonText,
                      commune === item && styles.communeButtonTextActive
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animatable.View>
          </Card>

          <View style={styles.buttonContainer}>
            <Button 
              mode="outlined" 
              onPress={goToPreviousStep}
              style={styles.buttonBack} 
              labelStyle={styles.buttonBackLabel}
            >
              {t("common.back") || "Retour"}
            </Button>

            <Button 
              mode="contained" 
              onPress={goToNextStep}
              style={styles.button} 
              labelStyle={styles.buttonLabel}
            >
              {role === "client" ? (t("register.submit") || "S'inscrire") : (t("common.next") || "Suivant")}
            </Button>
          </View>
        </View>

        {/* Étape 5 : Véhicule (uniquement pour les coursiers) */}
        {role === UserRole.COURIER && (
          <View style={[styles.slide, { width: screenWidth }]}>
            <Card style={styles.card} elevation={5}>
              <Animatable.View 
                animation="fadeIn"
                style={styles.formContainer}
                ref={courierSectionRef}
              >
                <View style={styles.headerContainer}>
                  <Text style={styles.title}>{t("register.vehicleType")}</Text>
                </View>

                <View style={styles.vehicleContainer}>
                  <View style={styles.vehicleTypeContainer}>
                    {[
                      { value: "bicycle", icon: "bike" },
                      { value: "motorcycle", icon: "motorcycle" },
                      { value: "scooter", icon: "scooter" },
                      { value: "van", icon: "truck-delivery" },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.vehicleButton,
                          vehicleType === item.value && styles.vehicleButtonActive
                        ]}
                        onPress={() => setVehicleType(item.value as VehicleType)}
                        activeOpacity={0.7}
                      >
                        <IconButton
                          icon={item.icon}
                          size={30}
                          iconColor={vehicleType === item.value ? "#FFFFFF" : "#666666"}
                        />
                        <Text style={[
                          styles.vehicleButtonText,
                          vehicleType === item.value && styles.vehicleButtonTextActive
                        ]}>
                          {t(`vehicleTypes.${item.value}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Animatable.View animation={focusedField === 'licensePlate' ? 'pulse' : undefined}>
                    <TextInput
                      label={t("register.licensePlate")}
                      value={licensePlate}
                      onChangeText={setLicensePlate}
                      style={[styles.input, focusedField === 'licensePlate' && styles.focusedInput]}
                      mode="outlined"
                      outlineColor={focusedField === 'licensePlate' ? theme.colors.primary : '#CCCCCC'}
                      activeOutlineColor={theme.colors.primary}
                      left={<TextInput.Icon icon="car" />}
                      onFocus={() => setFocusedField('licensePlate')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <HelperText type="info">{t("register.licensePlateHelp")}</HelperText>
                  </Animatable.View>
                </View>
              </Animatable.View>
            </Card>

            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={goToPreviousStep}
                style={styles.buttonBack} 
                labelStyle={styles.buttonBackLabel}
              >
                {t("common.back") || "Retour"}
              </Button>

              <Button 
                mode="contained" 
                onPress={handleRegister}
                style={styles.button} 
                labelStyle={styles.buttonLabel}
                loading={loading}
                disabled={loading}
              >
                {t("register.submit") || "S'inscrire"}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      <Animatable.View animation="fadeIn" delay={700} style={styles.loginContainer}>
        <Text style={styles.loginText}>{t("register.alreadyHaveAccount")}</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.7}
        >
          <Text style={styles.loginLink}>{t("register.login")}</Text>
        </TouchableOpacity>
      </Animatable.View>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={styles.snackbar}
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 130,
    paddingHorizontal: 20,
    zIndex: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 5,
  },
  progressLine: {
    height: 2,
    width: 15,
    backgroundColor: '#CCCCCC',
  },
  activeStep: {
    backgroundColor: '#FF6B00',
  },
  inactiveStep: {
    backgroundColor: '#CCCCCC',
  },
  slidesContainer: {
    flexGrow: 1,
  },
  slide: {
    paddingTop: 160,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    marginBottom: 20,
    paddingVertical: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B00",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  focusedInput: {
    backgroundColor: "#FFF9F5",
  },
  roleButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  roleButton: {
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    width: '45%',
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roleButtonActive: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
  },
  roleIconContainer: {
    marginBottom: 8,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginTop: 8,
  },
  roleButtonTextActive: {
    color: "#FFFFFF",
  },
  communeSelectionContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  communeButton: {
    borderRadius: 12,
    padding: 14,
    margin: 6,
    width: "45%",
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 1,
  },
  communeButtonActive: {
    backgroundColor: "#FFF9F5",
    borderColor: "#FF6B00",
    elevation: 2,
  },
  communeButtonText: {
    fontSize: 14,
    color: "#333333",
  },
  communeButtonTextActive: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  vehicleContainer: {
    marginVertical: 16,
  },
  vehicleTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  vehicleButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 10,
    margin: 5,
    width: "45%",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 1,
    marginBottom: 12,
  },
  vehicleButtonActive: {
    backgroundColor: "#FF6B00",
    borderColor: "#FF6B00",
  },
  vehicleButtonText: {
    fontSize: 14,
    color: "#333333",
    marginTop: 4,
  },
  vehicleButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: "#FF6B00",
    elevation: 6,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  buttonBack: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center,
    borderRadius: 12,
    borderColor: "#FF6B00",
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
  },
  buttonBackLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF6B00",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  loginText: {
    color: "#757575",
    fontSize: 15,
  },
  loginLink: {
    color: "#FF6B00",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 15,
  },
  snackbar: {
    marginBottom: 16,
  }
})

export default RegisterScreen