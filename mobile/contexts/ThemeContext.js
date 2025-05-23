"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [theme, setTheme] = useState("light") // light, dark, system
  const [currentTheme, setCurrentTheme] = useState("light") // Le thème actuellement appliqué

  // Charger le thème sauvegardé
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setTheme(savedTheme)
        }
      } catch (error) {
        console.error("Error loading theme:", error)
      }
    }

    loadTheme()
  }, [])

  // Mettre à jour le thème actuel en fonction du thème choisi et du thème système
  useEffect(() => {
    if (theme === "system") {
      setCurrentTheme(systemColorScheme || "light")
    } else {
      setCurrentTheme(theme)
    }
  }, [theme, systemColorScheme])

  // Changer le thème
  const changeTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem("theme", newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  // Basculer entre les thèmes clair et sombre
  const toggleTheme = async () => {
    const newTheme = currentTheme === "light" ? "dark" : "light"
    await changeTheme(newTheme)
  }

  // Couleurs pour le thème actuel
  const colors = {
    light: {
      primary: "#FF6B00",
      secondary: "#FFB74D",
      background: "#FFFFFF",
      surface: "#F5F5F5",
      error: "#B00020",
      text: "#212121",
      subtext: "#757575",
      placeholder: "#9E9E9E",
      border: "#E0E0E0",
      card: "#FFFFFF",
      notification: "#FF6B00",
    },
    dark: {
      primary: "#FF6B00",
      secondary: "#FFB74D",
      background: "#121212",
      surface: "#1E1E1E",
      error: "#CF6679",
      text: "#FFFFFF",
      subtext: "#B0B0B0",
      placeholder: "#6C6C6C",
      border: "#2C2C2C",
      card: "#1E1E1E",
      notification: "#FF6B00",
    },
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentTheme,
        colors: colors[currentTheme],
        changeTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
