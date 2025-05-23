"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native"
import { Text, IconButton, Divider } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from "../i18n"

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

interface LanguageSwitcherProps {
  compact?: boolean
  style?: any
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

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false, style }) => {
  const { t, i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage())
  const [modalVisible, setModalVisible] = useState(false)
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])

  useEffect(() => {
    const langs = getAvailableLanguages()
    setAvailableLanguages(langs)
  }, [])

  const handleLanguageChange = async (langCode: string) => {
    const success = await changeLanguage(langCode)
    if (success) {
      setCurrentLang(langCode)
    }
    setModalVisible(false)
  }

  const renderLanguageItem = ({ item }: { item: string }) => {
    const language = LANGUAGES[item] || { code: item, name: item, nativeName: item, flag: "🌐" }
    const isSelected = currentLang === item

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageChange(item)}
      >
        <Text style={styles.languageFlag}>{language.flag}</Text>
        <View style={styles.languageTextContainer}>
          <Text style={[styles.languageName, isSelected && styles.selectedLanguageText]}>{language.nativeName}</Text>
          {!compact && <Text style={styles.languageNameEnglish}>{language.name}</Text>}
        </View>
        {isSelected && <IconButton icon="check" size={20} color="#FF6B00" style={styles.checkIcon} />}
      </TouchableOpacity>
    )
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <TouchableOpacity style={styles.compactButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.compactFlag}>{LANGUAGES[currentLang]?.flag || "🌐"}</Text>
          <Text style={styles.compactCode}>{currentLang.toUpperCase()}</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t("languageSettings.selectLanguage")}</Text>
                <IconButton icon="close" size={24} onPress={() => setModalVisible(false)} />
              </View>
              <FlatList
                data={availableLanguages}
                renderItem={renderLanguageItem}
                keyExtractor={(item) => item}
                ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                style={styles.languageList}
              />
            </View>
          </View>
        </Modal>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{t("languageSettings.selectLanguage")}</Text>
      <View style={styles.languagesContainer}>
        {availableLanguages.map((langCode) => {
          const language = LANGUAGES[langCode] || { code: langCode, name: langCode, nativeName: langCode, flag: "🌐" }
          const isSelected = currentLang === langCode

          return (
            <TouchableOpacity
              key={langCode}
              style={[styles.languageButton, isSelected && styles.selectedLanguageButton]}
              onPress={() => handleLanguageChange(langCode)}
            >
              <Text style={styles.languageButtonFlag}>{language.flag}</Text>
              <Text style={[styles.languageButtonText, isSelected && styles.selectedLanguageButtonText]}>
                {language.nativeName}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "48%",
  },
  selectedLanguageButton: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF6B00",
    borderWidth: 1,
  },
  languageButtonFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageButtonText: {
    fontSize: 14,
    color: "#212121",
  },
  selectedLanguageButtonText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  compactContainer: {
    alignItems: "center",
  },
  compactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  compactCode: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#212121",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  languageList: {
    padding: 8,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  selectedLanguageItem: {
    backgroundColor: "#FFF3E0",
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
  selectedLanguageText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  languageNameEnglish: {
    fontSize: 12,
    color: "#757575",
  },
  checkIcon: {
    margin: 0,
  },
  divider: {
    backgroundColor: "#EEEEEE",
  },
})

export default LanguageSwitcher
