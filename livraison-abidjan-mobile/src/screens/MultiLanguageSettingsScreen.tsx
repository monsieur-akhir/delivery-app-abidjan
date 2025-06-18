"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native"
import { Text, Card, Button, IconButton, RadioButton, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from "../i18n"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const LANGUAGES: Record<string, Language> = {
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
  },
  wo: {
    code: "wo",
    name: "Wolof",
    nativeName: "Wolof",
    flag: "🇸🇳",
  },
}

const MultiLanguageSettingsScreen = () => {
  const { t, i18n } = useTranslation()
  const navigation = useNavigation()

  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage())
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [changing, setChanging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const langs = getAvailableLanguages()
    setAvailableLanguages(langs)
  }, [])

  const handleLanguageChange = async (langCode: string) => {
    try {
      setChanging(true)
      setError(null)

      const success = await changeLanguage(langCode)
      if (success) {
        setSelectedLanguage(langCode)

        // Sauvegarder la préférence de langue sur le serveur
        await updateLanguagePreference(langCode)

        Alert.alert(t("languageSettings.changed"), t("languageSettings.changedMessage"))
      } else {
        throw new Error(t("languageSettings.errorChanging"))
      }
    } catch (err) {
      console.error("Error changing language:", err)
      setError(t("languageSettings.errorChanging"))
    } finally {
      setChanging(false)
    }
  }

  const updateLanguagePreference = async (langCode: string) => {
    try {
      const token = await AsyncStorage.getItem("token")
      // Cette fonction simule une mise à jour de la préférence de langue sur le serveur
      // Dans une implémentation réelle, vous feriez un appel API ici
      console.log(`Updating language preference to ${langCode} on server`)
      return true
    } catch (error) {
      console.error("Error updating language preference:", error)
      return false
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t("languageSettings.title")}</Text>
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
        <Text style={styles.headerTitle}>{t("languageSettings.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.languageCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("languageSettings.selectLanguage")}</Text>
            <Text style={styles.cardDescription}>{t("languageSettings.selectLanguageDescription")}</Text>

            <RadioButton.Group onValueChange={(value) => setSelectedLanguage(value)} value={selectedLanguage}>
              {availableLanguages.map((langCode) => {
                const language = LANGUAGES[langCode] || {
                  code: langCode,
                  name: langCode,
                  nativeName: langCode,
                  flag: "🌐",
                }

                return (
                  <View key={langCode}>
                    <View style={styles.languageOption}>
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageFlag}>{language.flag}</Text>
                        <View style={styles.languageTextContainer}>
                          <Text style={styles.languageName}>{language.nativeName}</Text>
                          <Text style={styles.languageNameEnglish}>{language.name}</Text>
                        </View>
                      </View>
                      <RadioButton value={langCode} disabled={changing} />
                    </View>
                    <Divider style={styles.divider} />
                  </View>
                )
              })}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>{t("languageSettings.currentLanguage")}</Text>
            <View style={styles.currentLanguageContainer}>
              <Text style={styles.currentLanguageFlag}>{LANGUAGES[selectedLanguage]?.flag || "🌐"}</Text>
              <Text style={styles.currentLanguageName}>
                {LANGUAGES[selectedLanguage]?.nativeName || selectedLanguage}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          style={styles.applyButton}
          labelStyle={styles.applyButtonLabel}
          onPress={() => handleLanguageChange(selectedLanguage)}
          loading={changing}
          disabled={changing || selectedLanguage === getCurrentLanguage()}
        >
          {t("common.apply")}
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
  languageCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: "#212121",
  },
  languageNameEnglish: {
    fontSize: 12,
    color: "#757575",
  },
  divider: {
    backgroundColor: "#EEEEEE",
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: "#E8F5E9",
  },
  infoTitle: {
    fontSize: 14,
    color: "#2E7D32",
    marginBottom: 8,
  },
  currentLanguageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentLanguageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currentLanguageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: "#FFEBEE",
  },
  errorText: {
    color: "#C62828",
  },
  applyButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
  },
  applyButtonLabel: {
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

export default MultiLanguageSettingsScreen
