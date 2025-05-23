import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Localization from "expo-localization"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { translations } from "./translations"

// Fonction pour détecter la langue par défaut
const detectUserLanguage = async () => {
  try {
    // Vérifier si une langue a déjà été sélectionnée
    const savedLanguage = await AsyncStorage.getItem("userLanguage")
    if (savedLanguage) {
      return savedLanguage
    }

    // Sinon, utiliser la langue du système
    const deviceLocale = Localization.locale.split("-")[0] // Obtenir juste le code de langue (ex: 'fr' de 'fr-FR')

    // Vérifier si la langue du système est prise en charge
    const supportedLanguages = Object.keys(translations)
    if (supportedLanguages.includes(deviceLocale)) {
      return deviceLocale
    }

    // Par défaut, utiliser le français
    return "fr"
  } catch (error) {
    console.error("Error detecting user language:", error)
    return "fr" // Langue par défaut en cas d'erreur
  }
}

// Initialiser i18next
const initI18n = async () => {
  const userLanguage = await detectUserLanguage()

  i18n.use(initReactI18next).init({
    resources: translations,
    lng: userLanguage,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false, // React gère déjà l'échappement
    },
    react: {
      useSuspense: false, // Désactiver Suspense pour éviter les problèmes avec React Native
    },
  })

  // Sauvegarder la langue détectée
  await AsyncStorage.setItem("userLanguage", userLanguage)
}

// Fonction pour changer la langue
export const changeLanguage = async (language: string) => {
  try {
    await i18n.changeLanguage(language)
    await AsyncStorage.setItem("userLanguage", language)
    return true
  } catch (error) {
    console.error("Error changing language:", error)
    return false
  }
}

// Fonction pour obtenir la langue actuelle
export const getCurrentLanguage = () => {
  return i18n.language
}

// Fonction pour obtenir les langues disponibles
export const getAvailableLanguages = () => {
  return Object.keys(translations)
}

// Initialiser i18n
initI18n()

export default i18n
