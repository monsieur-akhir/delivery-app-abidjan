"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { Text, Switch, Divider, Button, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import NotificationService, { type NotificationSettings } from "../services/NotificationService"

const NotificationSettingsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()

  const [settings, setSettings] = useState<NotificationSettings>({
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    delivery_updates: true,
    bid_notifications: true,
    promotional_offers: false,
    security_alerts: true,
    in_app_notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await NotificationService.getNotificationSettings()
      setSettings(data)
    } catch (err) {
      console.error("Error fetching notification settings:", err)
      setError(t("settings.errorFetchingSettings"))
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      await NotificationService.updateNotificationSettings(settings)
      navigation.goBack()
    } catch (err) {
      console.error("Error saving notification settings:", err)
      setError(t("settings.errorSavingSettings"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t("settings.notifications")}</Text>
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
        <Text style={styles.headerTitle}>{t("settings.notifications")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.notificationChannels")}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.pushNotifications")}</Text>
              <Text style={styles.settingDescription}>{t("settings.pushNotificationsDescription")}</Text>
            </View>
            <Switch value={settings.push_notifications} onValueChange={() => handleToggle("push_notifications")} color="#FF6B00" />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.smsNotifications")}</Text>
              <Text style={styles.settingDescription}>{t("settings.smsNotificationsDescription")}</Text>
            </View>
            <Switch value={settings.sms_notifications} onValueChange={() => handleToggle("sms_notifications")} color="#FF6B00" />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.whatsappNotifications")}</Text>
              <Text style={styles.settingDescription}>{t("settings.whatsappNotificationsDescription")}</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => handleToggle("whatsapp_enabled")}
              color="#FF6B00"
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.emailNotifications")}</Text>
              <Text style={styles.settingDescription}>{t("settings.emailNotificationsDescription")}</Text>
            </View>
            <Switch
              value={settings.email_notifications}
              onValueChange={() => handleToggle("email_notifications")}
              color="#FF6B00"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.notificationTypes")}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.deliveryUpdates")}</Text>
              <Text style={styles.settingDescription}>{t("settings.deliveryUpdatesDescription")}</Text>
            </View>
            <Switch
              value={settings.delivery_updates}
              onValueChange={() => handleToggle("delivery_updates")}
              color="#FF6B00"
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.marketingUpdates")}</Text>
              <Text style={styles.settingDescription}>{t("settings.marketingUpdatesDescription")}</Text>
            </View>
            <Switch 
              value={settings.promotional_offers} 
              onValueChange={() => handleToggle("promotional_offers")} 
              color="#FF6B00" 
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.systemUpdates")}</Text>
              <Text style={styles.settingDescription}>{t("settings.systemUpdatesDescription")}</Text>
            </View>
            <Switch 
              value={settings.security_alerts}
              onValueChange={() => handleToggle("security_alerts")}
              color="#FF6B00" 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.notificationPreferences")}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.soundEnabled")}</Text>
              <Text style={styles.settingDescription}>{t("settings.soundEnabledDescription")}</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => handleToggle("sound_enabled")}
              color="#FF6B00"
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>{t("settings.vibrationEnabled")}</Text>
              <Text style={styles.settingDescription}>{t("settings.vibrationEnabledDescription")}</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => handleToggle("vibration_enabled")}
              color="#FF6B00"
            />
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          mode="contained"
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
          onPress={saveSettings}
          loading={saving}
          disabled={saving}
        >
          {t("common.save")}
        </Button>
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
  divider: {
    backgroundColor: "#EEEEEE",
  },
  errorText: {
    color: "#F44336",
    marginBottom: 16,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
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
})

export default NotificationSettingsScreen