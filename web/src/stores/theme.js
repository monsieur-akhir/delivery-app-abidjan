import { defineStore } from "pinia"
import { ref, computed, watch } from "vue"

export const useThemeStore = defineStore("theme", () => {
  // État
  const theme = ref(localStorage.getItem("theme") || "light") // light, dark, system

  // Getters
  const isDarkMode = computed(() => {
    if (theme.value === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return theme.value === "dark"
  })

  // Actions
  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem("theme", newTheme)
    applyTheme()
  }

  function toggleTheme() {
    const newTheme = isDarkMode.value ? "light" : "dark"
    setTheme(newTheme)
  }

  function applyTheme() {
    if (isDarkMode.value) {
      document.documentElement.classList.add("dark-mode")
    } else {
      document.documentElement.classList.remove("dark-mode")
    }
  }

  // Initialiser le thème
  function initTheme() {
    applyTheme()

    // Écouter les changements de préférence système
    if (theme.value === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", applyTheme)
    }
  }

  // Surveiller les changements de thème
  watch(isDarkMode, () => {
    applyTheme()
  })

  // Initialiser le thème au démarrage
  initTheme()

  return {
    theme,
    isDarkMode,
    setTheme,
    toggleTheme,
  }
})
