"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native"
import { Text, Card, Divider, Button, List, Avatar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useAuth } from "../contexts/AuthContext"
import { useNetwork } from "../contexts/NetworkContext"
import { useTheme } from "../contexts/ThemeContext"
import { Feather } from "@expo/vector-icons"
import type { SettingsScreenNavigationProp } from "../types/navigation"
type LanguageCodeType = "en" | "fr" | "es"

type SettingsScreenProps = {
  navigation: SettingsScreenNavigationProp
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const { isOfflineMode } = useNetwork()
  const { theme, toggleTheme, colors } = useTheme()
  const [language] = useState<LanguageCodeType>(i18n.language as LanguageCodeType)

  const handleLogout = () => {
    Alert.alert(t("settings.logoutConfirmTitle"), t("settings.logoutConfirmMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.logout"),
        onPress: () => {
          signOut()
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        },
      },
    ])
  }

  const toggleOfflineMode = async () => {
    // TODO: Implement offline mode toggle
  }

  const goToProfile = () => {
    navigation.navigate({
      name: "Profile",
      params: undefined,
    })
  }

  const goToNotificationSettings = () => {
    navigation.navigate({
      name: "NotificationSettings",
      params: undefined,
    })
  }

  const goToSecuritySettings = () => {
    navigation.navigate({
      name: "SecuritySettings",
      params: undefined,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* User Profile Card */}
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.card }]} onPress={goToProfile}>
          <View style={styles.profileContent}>
            <Avatar.Image
              size={80}
              source={
                user?.avatar ? { uri: user.avatar } : require("../assets/images/default-avatar.png")
              }
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.first_name || user?.username}</Text>
              <Text style={[styles.profilePhone, { color: colors.text }]}>{user?.phone}</Text>
              <Button
                mode="outlined"
                onPress={goToProfile}
                style={[styles.profileButton, { borderColor: colors.primary }]}
                compact
              >
                {t("settings.editProfile")}
              </Button>
            </View>
          </View>
        </TouchableOpacity>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <Card.Title title={t("settings.appSettings")} />
          <Card.Content>
            <List.Item
              title={t("settings.language")}
              description={t("settings.languageDescription")}
              left={() => <Feather name="globe" size={24} color="#212121" style={styles.icon} />}
              right={() => (
                <Button mode="text" onPress={() => navigation.navigate("LanguageSettings")} style={styles.actionButton}>
                  {language === "fr" ? "Français" : language === "en" ? "English" : "Español"}
                </Button>
              )}
            />

            <Divider style={styles.divider} />

            <View style={[styles.sectionHeader, { backgroundColor: colors.card }]}>
              <Feather name="moon" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("settings.darkMode")}</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingText, { color: colors.text }]}>{t("settings.enableDarkMode")}</Text>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: "#767577", true: "#FF6B00" }}
                thumbColor={theme === "dark" ? "#f5dd4b" : "#f4f3f4"}
                style={styles.switch}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={[styles.sectionHeader, { backgroundColor: colors.card }]}>
              <Feather name="wifi-off" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("settings.offlineMode")}</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingText, { color: colors.text }]}>{t("settings.enableOfflineMode")}</Text>
              <Switch
                value={isOfflineMode}
                onValueChange={toggleOfflineMode}
                trackColor={{ false: "#767577", true: "#FF6B00" }}
                thumbColor={isOfflineMode ? "#f5dd4b" : "#f4f3f4"}
                style={styles.switch}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={styles.settingsCard}>
          <Card.Title title={t("settings.notifications")} />
          <Card.Content>
            <List.Item
              title={t("settings.pushNotifications")}
              description={t("settings.pushNotificationsDescription")}
              left={() => <Feather name="bell" size={24} color="#212121" style={styles.icon} />}
              right={() => (
                <Button mode="text" onPress={goToNotificationSettings} style={styles.actionButton}>
                  {t("settings.manage")}
                </Button>
              )}
            />
          </Card.Content>
        </Card>

        {/* Support */}
        <Card style={styles.settingsCard}>
          <Card.Title title={t("settings.support")} />
          <Card.Content>
            <List.Item
              title={t("settings.helpCenter")}
              description={t("settings.helpCenterDescription")}
              left={() => <Feather name="help-circle" size={24} color="#212121" style={styles.icon} />}
              onPress={() => navigation.navigate("Support")}
              right={() => <Feather name="chevron-right" size={24} color="#757575" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.contactUs")}
              description={t("settings.contactUsDescription")}
              left={() => <Feather name="mail" size={24} color="#212121" style={styles.icon} />}
              onPress={() => {
                /* Handle contact us */
              }}
              right={() => <Feather name="chevron-right" size={24} color="#757575" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.about")}
              description={t("settings.aboutDescription")}
              left={() => <Feather name="info" size={24} color="#212121" style={styles.icon} />}
              onPress={() => {
                /* Handle about */
              }}
              right={() => <Feather name="chevron-right" size={24} color="#757575" />}
            />
          </Card.Content>
        </Card>

        {/* Account */}
        <Card style={styles.settingsCard}>
          <Card.Title title={t("settings.account")} />
          <Card.Content>
            <List.Item
              title={t("settings.security")}
              description={t("settings.securityDescription")}
              left={() => <Feather name="lock" size={24} color="#212121" style={styles.icon} />}
              onPress={goToSecuritySettings}
              right={() => <Feather name="chevron-right" size={24} color="#757575" />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("settings.logout")}
              description={t("settings.logoutDescription")}
              left={() => <Feather name="log-out" size={24} style={[styles.icon, { color: "#F44336" }]} />}
              onPress={handleLogout}
              titleStyle={{ color: "#F44336" }}
            />
          </Card.Content>
        </Card>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t("settings.version")} 1.0.0 (Build 100)</Text>
        </View>
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
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  profilePhone: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  profileButton: {
    alignSelf: "flex-start",
    borderColor: "#FF6B00",
  },
  settingsCard: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  icon: {
    margin: 0,
  },
  switch: {
    margin: 0,
  },
  actionButton: {
    margin: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingText: {
    fontSize: 14,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 12,
    color: "#9E9E9E",
  },
})

export default SettingsScreen
