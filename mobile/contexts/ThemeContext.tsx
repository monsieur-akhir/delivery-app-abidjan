"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { ThemeColors } from "../types/theme"

type ThemeType = "light" | "dark" | "system"
type CurrentThemeType = "light" | "dark"

interface ThemeContextType {
  theme: ThemeType
  currentTheme: CurrentThemeType
  colors: ThemeColors
  changeTheme: (newTheme: ThemeType) => Promise<void>
  toggleTheme: () => Promise<void>
}

interface ThemeProviderProps {
  children: ReactNode
}

const defaultColors: ThemeColors = {
  primary: "#FF6B00",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#212121",
  border: "#E0E0E0",
  notification: "#FF6B00",
  muted: "#757575",
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  currentTheme: "light",
  colors: defaultColors,
  changeTheme: async () => {},
  toggleTheme: async () => {},
})

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext)
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = (useColorScheme() as CurrentThemeType) || "light"
  const [theme, setTheme] = useState<ThemeType>("light")
  const [currentTheme, setCurrentTheme] = useState<CurrentThemeType>("light")

  // Charger le thème sauvegardé
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setTheme(savedTheme as ThemeType)
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
      setCurrentTheme(systemColorScheme)
    } else {
      setCurrentTheme(theme as CurrentThemeType)
    }
  }, [theme, systemColorScheme])

  // Changer le thème
  const changeTheme = async (newTheme: ThemeType): Promise<void> => {
    try {
      await AsyncStorage.setItem("theme", newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  // Basculer entre les thèmes clair et sombre
  const toggleTheme = async (): Promise<void> => {
    const newTheme = currentTheme === "light" ? "dark" : "light"
    await changeTheme(newTheme)
  }

  // Couleurs pour le thème actuel
  const colors: Record<CurrentThemeType, ThemeColors> = {
    light: {
      primary: "#FF6B00",
      secondary: "#FFB74D",
      background: "#FFFFFF",
      surface: "#F5F5F5",
      error: "#B00020",
      text: "#212121",
      muted: "#757575",
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
      muted: "#B0B0B0",
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
