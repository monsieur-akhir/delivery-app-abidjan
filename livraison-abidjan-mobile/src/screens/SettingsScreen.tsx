"use client"

import type React from "react"
import { useState } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from "react-native"
import { Text, Card, Divider, Button, List, Avatar, IconButton } from "react-native-paper"
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Feather name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: 'bold', color: '#222', marginLeft: 12 }}>{t("settings.title")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Profil */}
        <TouchableOpacity 
          onPress={goToProfile}
          style={{ 
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
            elevation: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}
        >
          <Avatar.Image
            size={56}
            source={user?.profile_picture ? { uri: user.profile_picture } : require("../assets/images/default-avatar.png")}
            style={{ backgroundColor: '#f0f0f0' }}
          />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 16, color: '#666', marginBottom: 2 }}>{user?.phone}</Text>
          </View>
          <Feather name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Paramètres de l'application */}
        <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, elevation: 1 }}>
          <Text style={{ fontSize: 16, color: '#666', padding: 16, paddingBottom: 8 }}>{t("settings.appSettings")}</Text>
          
          {/* Langue */}
          <TouchableOpacity 
            onPress={() => navigation.navigate("LanguageSettings")}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
          >
            <Feather name="globe" size={22} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{t("settings.language")}</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>Français</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: '#f5f5f5' }} />

          {/* Mode sombre */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Feather name="moon" size={22} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{t("settings.darkMode")}</Text>
            </View>
            <Switch
              value={theme === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: "#ddd", true: "#FF9800" }}
              thumbColor="#fff"
            />
          </View>

          <View style={{ height: 1, backgroundColor: '#f5f5f5' }} />

          {/* Mode hors ligne */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Feather name="wifi-off" size={22} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{t("settings.offlineMode")}</Text>
            </View>
            <Switch
              value={isOfflineMode}
              onValueChange={toggleOfflineMode}
              trackColor={{ false: "#ddd", true: "#FF9800" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, elevation: 1 }}>
          <Text style={{ fontSize: 16, color: '#666', padding: 16 }}>{t("settings.notifications")}</Text>
          
          <TouchableOpacity 
            onPress={goToNotificationSettings}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
          >
            <Feather name="bell" size={22} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{t("settings.pushNotifications")}</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{t("settings.pushNotificationsDescription")}</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={{ backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, elevation: 1 }}>
          <Text style={{ fontSize: 16, color: '#666', padding: 16 }}>Support</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate("Support")}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
          >
            <Feather name="help-circle" size={22} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{t("settings.helpCenter")}</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{t("settings.helpCenterDescription")}</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: '#f5f5f5' }} />

          <TouchableOpacity 
            onPress={() => {/* Handle contact us */}}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
          >
            <Feather name="mail" size={22} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 16, color: '#222' }}>{t("settings.contactUs")}</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{t("settings.contactUsDescription")}</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#999" />
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    color: "#212121",
  },
  headerRight: {
    width: 48, // Même largeur que le bouton de retour pour centrer le titre
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