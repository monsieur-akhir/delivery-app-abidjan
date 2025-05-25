"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native"
import { Text, Switch, Divider, Button, IconButton, TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import SecurityService, { type SecuritySettings } from "../services/SecurityService"
import * as Clipboard from "expo-clipboard"

// Define the navigation params type
type RootStackParamList = {
  ChangePassword: undefined;
  SecurityQuestions: undefined;
};

const SecuritySettingsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [settings, setSettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    biometric_enabled: false,
    pin_enabled: false,
    session_timeout: 30,
    last_password_change: "",
    security_questions_set: false,
  })

  const [loading, setLoading] = useState(true)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState("")
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [settingPin, setSettingPin] = useState(false)

  useEffect(() => {
    loadSecuritySettings()
    checkBiometricAvailability()
  }, [])

  const loadSecuritySettings = async () => {
    try {
      setLoading(true)
      const data = await SecurityService.getSecuritySettings()
      setSettings(data)
    } catch (error) {
      console.error("Error loading security settings:", error)
      Alert.alert(t("security.error"), t("security.errorLoadingSettings"))
    } finally {
      setLoading(false)
    }
  }

  const checkBiometricAvailability = async () => {
    const available = await SecurityService.isBiometricAvailable()
    setBiometricAvailable(available)
  }

  const handleToggleTwoFactor = async () => {
    if (settings.two_factor_enabled) {
      // Désactiver 2FA
      Alert.alert(t("security.disableTwoFactor"), t("security.disableTwoFactorConfirm"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          onPress: () => promptDisableTwoFactor(),
        },
      ])
    } else {
      // Activer 2FA
      try {
        const response = await SecurityService.enableTwoFactor()
        setTwoFactorSecret(response.secret)
        setTwoFactorQrCode(response.qrCodeUrl)
        setShowTwoFactorSetup(true)
      } catch (error) {
        console.error("Error enabling two-factor:", error)
        Alert.alert(t("security.error"), t("security.errorEnablingTwoFactor"))
      }
    }
  }

  const promptDisableTwoFactor = () => {
    Alert.prompt(
      t("security.enterTwoFactorCode"),
      t("security.enterTwoFactorCodeDescription"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          onPress: (code) => code ? disableTwoFactor(code) : Alert.alert(t("security.error"), t("security.invalidCode")),
        },
      ],
      "plain-text",
    )
  }

  const disableTwoFactor = async (code: string) => {
    try {
      const success = await SecurityService.disableTwoFactor(code)

      if (success) {
        setSettings((prev) => ({ ...prev, two_factor_enabled: false }))
        Alert.alert(t("security.success"), t("security.twoFactorDisabled"))
      } else {
        Alert.alert(t("security.error"), t("security.invalidCode"))
      }
    } catch (error) {
      console.error("Error disabling two-factor:", error)
      Alert.alert(t("security.error"), t("security.errorDisablingTwoFactor"))
    }
  }

  const verifyTwoFactorCode = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      Alert.alert(t("security.error"), t("security.invalidCodeFormat"))
      return
    }

    try {
      setVerifyingCode(true)
      const success = await SecurityService.verifyTwoFactorCode(twoFactorCode)

      if (success) {
        setSettings((prev) => ({ ...prev, two_factor_enabled: true }))
        setShowTwoFactorSetup(false)
        setTwoFactorCode("")
        Alert.alert(t("security.success"), t("security.twoFactorEnabled"))
      } else {
        Alert.alert(t("security.error"), t("security.invalidCode"))
      }
    } catch (error) {
      console.error("Error verifying two-factor code:", error)
      Alert.alert(t("security.error"), t("security.errorVerifyingCode"))
    } finally {
      setVerifyingCode(false)
    }
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(twoFactorSecret)
    Alert.alert(t("security.success"), t("security.secretCopied"))
  }

  const handleToggleBiometrics = async () => {
    if (!biometricAvailable) {
      Alert.alert(t("security.error"), t("security.biometricsNotAvailable"))
      return
    }

    try {
      if (settings.biometric_enabled) {
        // Désactiver la biométrie
        const success = await SecurityService.disableBiometrics()

        if (success) {
          setSettings((prev) => ({ ...prev, biometric_enabled: false }))
          Alert.alert(t("security.success"), t("security.biometricsDisabled"))
        }
      } else {
        // Activer la biométrie
        const authenticated = await SecurityService.authenticateWithBiometrics(t("security.authenticateToEnable"))

        if (authenticated) {
          const success = await SecurityService.enableBiometrics()

          if (success) {
            setSettings((prev) => ({ ...prev, biometric_enabled: true }))
            Alert.alert(t("security.success"), t("security.biometricsEnabled"))
          }
        }
      }
    } catch (error) {
      console.error("Error toggling biometrics:", error)
      Alert.alert(t("security.error"), t("security.errorTogglingBiometrics"))
    }
  }

  const handleTogglePin = () => {
    if (settings.pin_enabled) {
      // Désactiver le PIN
      Alert.alert(t("security.disablePin"), t("security.disablePinConfirm"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          onPress: async () => {
            try {
              const success = await SecurityService.removePin()

              if (success) {
                setSettings((prev) => ({ ...prev, pin_enabled: false }))
                Alert.alert(t("security.success"), t("security.pinDisabled"))
              }
            } catch (error) {
              console.error("Error removing PIN:", error)
              Alert.alert(t("security.error"), t("security.errorRemovingPin"))
            }
          },
        },
      ])
    } else {
      // Activer le PIN
      setShowPinSetup(true)
    }
  }

  const handleSetPin = async () => {
    if (pin.length < 4) {
      Alert.alert(t("security.error"), t("security.pinTooShort"))
      return
    }

    if (pin !== confirmPin) {
      Alert.alert(t("security.error"), t("security.pinMismatch"))
      return
    }

    try {
      setSettingPin(true)
      const success = await SecurityService.setPin(pin)

      if (success) {
        setSettings((prev) => ({ ...prev, pin_enabled: true }))
        setShowPinSetup(false)
        setPin("")
        setConfirmPin("")
        Alert.alert(t("security.success"), t("security.pinEnabled"))
      }
    } catch (error) {
      console.error("Error setting PIN:", error)
      Alert.alert(t("security.error"), t("security.errorSettingPin"))
    } finally {
      setSettingPin(false)
    }
  }

  const navigateToChangePassword = () => {
    navigation.navigate("ChangePassword")
  }

  const navigateToSecurityQuestions = () => {
    navigation.navigate("SecurityQuestions")
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t("security.title")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t("security.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {showTwoFactorSetup ? (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>{t("security.setupTwoFactor")}</Text>
            <Text style={styles.setupDescription}>{t("security.scanQrCode")}</Text>

            <View style={styles.qrCodeContainer}>
              {/* Ici, vous pouvez afficher le QR code avec une bibliothèque comme react-native-qrcode-svg */}
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.qrCodeText}>{t("security.qrCode")}</Text>
              </View>
            </View>

            <Text style={styles.secretLabel}>{t("security.manualEntry")}</Text>
            <View style={styles.secretContainer}>
              <Text style={styles.secretText}>{twoFactorSecret}</Text>
              <IconButton icon="content-copy" size={20} onPress={copyToClipboard} />
            </View>

            <Text style={styles.codeLabel}>{t("security.enterCode")}</Text>
            <TextInput
              style={styles.codeInput}
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
            />

            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setShowTwoFactorSetup(false)} style={styles.cancelButton}>
                {t("common.cancel")}
              </Button>
              <Button
                mode="contained"
                onPress={verifyTwoFactorCode}
                style={styles.verifyButton}
                loading={verifyingCode}
                disabled={verifyingCode || twoFactorCode.length !== 6}
              >
                {t("security.verify")}
              </Button>
            </View>
          </View>
        ) : showPinSetup ? (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>{t("security.setupPin")}</Text>
            <Text style={styles.setupDescription}>{t("security.pinDescription")}</Text>

            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder={t("security.enterPin")}
            />

            <TextInput
              style={styles.pinInput}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              placeholder={t("security.confirmPin")}
            />

            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setShowPinSetup(false)} style={styles.cancelButton}>
                {t("common.cancel")}
              </Button>
              <Button
                mode="contained"
                onPress={handleSetPin}
                style={styles.verifyButton}
                loading={settingPin}
                disabled={settingPin || pin.length < 4 || pin !== confirmPin}
              >
                {t("security.setPin")}
              </Button>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("security.authentication")}</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t("security.twoFactor")}</Text>
                  <Text style={styles.settingDescription}>{t("security.twoFactorDescription")}</Text>
                </View>
                <Switch value={settings.two_factor_enabled} onValueChange={handleToggleTwoFactor} color="#FF6B00" />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t("security.biometrics")}</Text>
                  <Text style={styles.settingDescription}>
                    {biometricAvailable ? t("security.biometricsDescription") : t("security.biometricsNotAvailable")}
                  </Text>
                </View>
                <Switch
                  value={settings.biometric_enabled}
                  onValueChange={handleToggleBiometrics}
                  color="#FF6B00"
                  disabled={!biometricAvailable}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t("security.pin")}</Text>
                  <Text style={styles.settingDescription}>{t("security.pinDescription")}</Text>
                </View>
                <Switch value={settings.pin_enabled} onValueChange={handleTogglePin} color="#FF6B00" />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("security.accountSecurity")}</Text>

              <TouchableOpacity style={styles.actionItem} onPress={navigateToChangePassword}>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>{t("security.changePassword")}</Text>
                  <Text style={styles.actionDescription}>
                    {settings.last_password_change
                      ? t("security.lastChanged", {
                          date: new Date(settings.last_password_change).toLocaleDateString(),
                        })
                      : t("security.passwordNeverChanged")}
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} iconColor="#757575" />
              </TouchableOpacity>

              <Divider style={styles.divider} />

              <TouchableOpacity style={styles.actionItem} onPress={navigateToSecurityQuestions}>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>{t("security.securityQuestions")}</Text>
                  <Text style={styles.actionDescription}>
                    {settings.security_questions_set
                      ? t("security.securityQuestionsSet")
                      : t("security.securityQuestionsNotSet")}
                  </Text>
                </View>
                <IconButton icon="chevron-right" size={24} iconColor="#757575" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("security.sessionSettings")}</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t("security.sessionTimeout")}</Text>
                  <Text style={styles.settingDescription}>
                    {t("security.sessionTimeoutDescription", { minutes: settings.session_timeout })}
                  </Text>
                </View>
                <IconButton icon="pencil" size={24} iconColor="#757575" onPress={() => {}} />
              </View>
            </View>

            <Button mode="outlined" icon="logout" style={styles.logoutButton} onPress={() => {}}>
              {t("security.logoutAllDevices")}
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: "#212121",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#757575",
  },
  actionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  actionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    color: "#212121",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: "#757575",
  },
  divider: {
    backgroundColor: "#EEEEEE",
  },
  logoutButton: {
    marginTop: 16,
    borderColor: "#F44336",
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  setupContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  setupDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  qrCodeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  qrCodeText: {
    fontSize: 16,
    color: "#757575",
  },
  secretLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  secretContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  secretText: {
    flex: 1,
    fontSize: 14,
    color: "#212121",
    fontFamily: "monospace",
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  verifyButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
  },
  pinInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
})

export default SecuritySettingsScreen
