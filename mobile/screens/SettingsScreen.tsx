"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from "react-native"
import { Text, Card, Divider, IconButton, List, RadioButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"
import { useAuth } from "../contexts/AuthContext"
import { useNetwork } from "../contexts/NetworkContext"
import { useTheme } from "../contexts/ThemeContext"
import { clearApiCache } from "../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Settings">
}

type LanguageCode = "fr" | "en"

interface DataUsage {
  wifi: number
  cellular: number
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const { isOfflineMode, toggleOfflineMode, pendingUploads, pendingDownloads, synchronizeData, clearPendingData } =
    useNetwork()
  const { theme, toggleTheme } = useTheme()

  const [language, setLanguage] = useState<LanguageCode>(i18n.language as LanguageCode)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true)
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true)
  const [dataUsage, setDataUsage] = useState<DataUsage | null>(null)
  const [cacheSize, setCacheSize] = useState<string | null>(null)
  const [showLanguageOptions, setShowLanguageOptions] = useState<boolean>(false)

  useEffect(() => {
    loadSettings()
    calculateCacheSize()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      // Charger les paramètres de notification
      const notificationsValue = await AsyncStorage.getItem("notificationsEnabled")
      setNotificationsEnabled(notificationsValue !== "false")

      // Charger les paramètres de localisation
      const locationValue = await AsyncStorage.getItem("locationEnabled")
      setLocationEnabled(locationValue !== "false")

      // Charger les statistiques d'utilisation des données
      const usageValue = await AsyncStorage.getItem("dataUsage")
      setDataUsage(usageValue ? JSON.parse(usageValue) : { wifi: 0, cellular: 0 })
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const calculateCacheSize = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith("api_cache_"))

      let totalSize = 0

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key)
        totalSize += value ? value.length : 0
      }

      // Convertir en KB ou MB
      if (totalSize > 1024 * 1024) {
        setCacheSize(`${(totalSize / (1024 * 1024)).toFixed(2)} MB`)
      } else {
        setCacheSize(`${(totalSize / 1024).toFixed(2)} KB`)
      }
    } catch (error) {
      console.error("Error calculating cache size:", error)
      setCacheSize("Unknown")
    }
  }

  const handleToggleNotifications = async (value: boolean): Promise<void> => {
    setNotificationsEnabled(value)
    await AsyncStorage.setItem("notificationsEnabled", value.toString())
  }

  const handleToggleLocation = async (value: boolean): Promise<void> => {
    setLocationEnabled(value)
    await AsyncStorage.setItem("locationEnabled", value.toString())
  }

  const handleChangeLanguage = async (value: LanguageCode): Promise<void> => {
    setLanguage(value)
    setShowLanguageOptions(false)

    // Changer la langue de l'application
    await i18n.changeLanguage(value)

    // Sauvegarder la préférence
    await AsyncStorage.setItem("language", value)
  }

  const handleClearCache = async (): Promise<void> => {
    Alert.alert(t("settings.clearCacheTitle"), t("settings.clearCacheMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: async () => {
          const success = await clearApiCache()

          if (success) {
            Alert.alert(t("settings.success"), t("settings.cacheCleared"))

            // Recalculer la taille du cache
            calculateCacheSize()
          } else {
            Alert.alert(t("settings.error"), t("settings.errorClearingCache"))
          }
        },
      },
    ])
  }

  const handleSyncData = async (): Promise<void> => {
    const success = await synchronizeData()

    if (success) {
      Alert.alert(t("settings.success"), t("settings.dataSynchronized"))
    } else {
      Alert.alert(t("settings.error"), t("settings.errorSynchronizingData"))
    }
  }

  const handleClearPendingData = async (): Promise<void> => {
    Alert.alert(t("settings.clearPendingDataTitle"), t("settings.clearPendingDataMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: async () => {
          const success = await clearPendingData()

          if (success) {
            Alert.alert(t("settings.success"), t("settings.pendingDataCleared"))
          } else {
            Alert.alert(t("settings.error"), t("settings.errorClearingPendingData"))
          }
        },
      },
    ])
  }

  const handleLogout = (): void => {
    Alert.alert(t("settings.logoutTitle"), t("settings.logoutMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: async () => {
          await logout()
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Paramètres généraux */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("settings.general")}</Text>

            <List.Item
              title={t("settings.language")}
              description={language === "fr" ? "Français" : language === "en" ? "English" : "Français"}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="chevron-down"
                  onPress={() => setShowLanguageOptions(!showLanguageOptions)}
                />
              )}
            />

            {showLanguageOptions && (
              <View style={styles.languageOptions}>
                <RadioButton.Group onValueChange={handleChangeLanguage} value={language}>
                  <RadioButton.Item label="Français" value="fr" />
                  <RadioButton.Item label="English" value="en" />
                </RadioButton.Group>
              </View>
            )}

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.darkMode")}
              description={t(theme === "dark" ? "settings.enabled" : "settings.disabled")}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={(props) => <Switch value={theme === "dark"} onValueChange={toggleTheme} />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.notifications")}
              description={t(notificationsEnabled ? "settings.enabled" : "settings.disabled")}
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.location")}
              description={t(locationEnabled ? "settings.enabled" : "settings.disabled")}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={(props) => <Switch value={locationEnabled} onValueChange={handleToggleLocation} />}
            />
          </Card.Content>
        </Card>

        {/* Paramètres hors ligne */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("settings.offlineMode")}</Text>

            <List.Item
              title={t("settings.enableOfflineMode")}
              description={t(isOfflineMode ? "settings.enabled" : "settings.disabled")}
              left={(props) => <List.Icon {...props} icon="wifi-off" />}
              right={(props) => <Switch value={isOfflineMode} onValueChange={toggleOfflineMode} />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.pendingUploads")}
              description={`${pendingUploads.length} ${t("settings.items")}`}
              left={(props) => <List.Icon {...props} icon="cloud-upload" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.pendingDownloads")}
              description={`${pendingDownloads.length} ${t("settings.items")}`}
              left={(props) => <List.Icon {...props} icon="cloud-download" />}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.syncButton]}
                onPress={handleSyncData}
                disabled={pendingUploads.length === 0 && pendingDownloads.length === 0}
              >
                <Text style={styles.buttonText}>{t("settings.syncNow")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClearPendingData}
                disabled={pendingUploads.length === 0 && pendingDownloads.length === 0}
              >
                <Text style={styles.buttonText}>{t("settings.clearPendingData")}</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Stockage et données */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("settings.storageAndData")}</Text>

            <List.Item
              title={t("settings.cacheSize")}
              description={cacheSize || "0 KB"}
              left={(props) => <List.Icon {...props} icon="database" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.dataUsage")}
              description={
                dataUsage
                  ? `${t("settings.wifi")}: ${(dataUsage.wifi / (1024 * 1024)).toFixed(2)} MB, ${t("settings.cellular")}: ${(dataUsage.cellular / (1024 * 1024)).toFixed(2)} MB`
                  : t("settings.noDataUsage")
              }
              left={(props) => <List.Icon {...props} icon="chart-bar" />}
            />

            <TouchableOpacity style={[styles.button, styles.clearCacheButton]} onPress={handleClearCache}>
              <Text style={styles.buttonText}>{t("settings.clearCache")}</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Compte */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("settings.account")}</Text>

            <List.Item
              title={t("settings.changePassword")}
              left={(props) => <List.Icon {...props} icon="lock" />}
              onPress={() => navigation.navigate("ChangePassword")}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.deleteAccount")}
              left={(props) => <List.Icon {...props} icon="account-remove" />}
              onPress={() => navigation.navigate("DeleteAccount")}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.logout")}
              left={(props) => <List.Icon {...props} icon="logout" color="#F44336" />}
              onPress={handleLogout}
            />
          </Card.Content>
        </Card>

        {/* À propos */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("settings.about")}</Text>

            <List.Item
              title={t("settings.version")}
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.termsOfService")}
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => navigation.navigate("TermsOfService")}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.privacyPolicy")}
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.contactSupport")}
              left={(props) => <List.Icon {...props} icon="headset" />}
              onPress={() => navigation.navigate("ContactSupport")}
            />
          </Card.Content>
        </Card>
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  divider: {
    marginVertical: 4,
  },
  languageOptions: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  syncButton: {
    backgroundColor: "#4CAF50",
    flex: 1,
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: "#F44336",
    flex: 1,
    marginLeft: 8,
  },
  clearCacheButton: {
    backgroundColor: "#FF6B00",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
})

export default SettingsScreen
