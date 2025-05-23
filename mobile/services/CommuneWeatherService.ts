import api from "./api"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface WeatherCondition {
  code: number
  condition: string
  severity?: "low" | "medium" | "high"
}

interface WeatherCurrent {
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  pressure: number
  visibility: number
  uv_index: number
  feels_like: number
}

interface WeatherForecastDay {
  day: string
  date: string
  condition: string
  max_temp: number
  min_temp: number
  humidity: number
  wind_speed: number
  chance_of_rain: number
  sunrise: string
  sunset: string
}

interface WeatherAlert {
  id: string
  type: string
  severity: "low" | "medium" | "high"
  title: string
  description: string
  start_time: string
  end_time: string
  affected_communes: string[]
  precautions?: string[]
  source?: string
}

interface WeatherData {
  location: string
  commune: string
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
  alerts: WeatherAlert[]
}

interface CommuneCoordinates {
  commune: string
  latitude: number
  longitude: number
}

// Liste des communes d'Abidjan avec leurs coordonnées approximatives
const COMMUNE_COORDINATES: CommuneCoordinates[] = [
  { commune: "Abobo", latitude: 5.4308, longitude: -4.0209 },
  { commune: "Adjamé", latitude: 5.3599, longitude: -4.0209 },
  { commune: "Attécoubé", latitude: 5.3599, longitude: -4.0409 },
  { commune: "Cocody", latitude: 5.3599, longitude: -3.9909 },
  { commune: "Koumassi", latitude: 5.3099, longitude: -3.9909 },
  { commune: "Marcory", latitude: 5.3099, longitude: -4.0109 },
  { commune: "Plateau", latitude: 5.3399, longitude: -4.0209 },
  { commune: "Port-Bouët", latitude: 5.2599, longitude: -3.9909 },
  { commune: "Treichville", latitude: 5.3099, longitude: -4.0209 },
  { commune: "Yopougon", latitude: 5.3599, longitude: -4.0609 },
  { commune: "Bingerville", latitude: 5.3599, longitude: -3.9109 },
  { commune: "Songon", latitude: 5.3099, longitude: -4.1409 },
]

// Durée de mise en cache en millisecondes (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000

class CommuneWeatherService {
  /**
   * Récupère les données météo pour une commune spécifique
   */
  async getWeatherForCommune(commune: string): Promise<WeatherData | null> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedData = await this.getCachedWeatherData(commune)
      if (cachedData) {
        return cachedData
      }

      // Récupérer les coordonnées de la commune
      const coordinates = this.getCommuneCoordinates(commune)
      if (!coordinates) {
        console.error(`Coordinates not found for commune: ${commune}`)
        return null
      }

      // Récupérer les données météo depuis l'API
      const response = await api.get(
        `/weather?lat=${coordinates.latitude}&lng=${coordinates.longitude}&commune=${encodeURIComponent(commune)}`,
      )
      const weatherData = response.data

      // Mettre en cache les données
      await this.cacheWeatherData(commune, weatherData)

      return weatherData
    } catch (error) {
      console.error(`Error fetching weather data for commune ${commune}:`, error)
      return null
    }
  }

  /**
   * Récupère les alertes météo pour une commune spécifique
   */
  async getAlertsForCommune(commune: string): Promise<WeatherAlert[]> {
    try {
      // Vérifier si les données sont en cache et valides
      const cachedAlerts = await this.getCachedAlerts(commune)
      if (cachedAlerts) {
        return cachedAlerts
      }

      // Récupérer les coordonnées de la commune
      const coordinates = this.getCommuneCoordinates(commune)
      if (!coordinates) {
        console.error(`Coordinates not found for commune: ${commune}`)
        return []
      }

      // Récupérer les alertes depuis l'API
      const response = await api.get(
        `/weather/alerts?lat=${coordinates.latitude}&lng=${coordinates.longitude}&commune=${encodeURIComponent(
          commune,
        )}`,
      )
      const alerts = response.data

      // Mettre en cache les alertes
      await this.cacheAlerts(commune, alerts)

      return alerts
    } catch (error) {
      console.error(`Error fetching weather alerts for commune ${commune}:`, error)
      return []
    }
  }

  /**
   * Récupère les données météo pour toutes les communes
   */
  async getAllCommunesWeather(): Promise<Record<string, WeatherData>> {
    const result: Record<string, WeatherData> = {}

    for (const { commune } of COMMUNE_COORDINATES) {
      const weatherData = await this.getWeatherForCommune(commune)
      if (weatherData) {
        result[commune] = weatherData
      }
    }

    return result
  }

  /**
   * Récupère les alertes météo pour toutes les communes
   */
  async getAllCommunesAlerts(): Promise<Record<string, WeatherAlert[]>> {
    const result: Record<string, WeatherAlert[]> = {}

    for (const { commune } of COMMUNE_COORDINATES) {
      const alerts = await this.getAlertsForCommune(commune)
      if (alerts && alerts.length > 0) {
        result[commune] = alerts
      }
    }

    return result
  }

  /**
   * Récupère la liste des communes disponibles
   */
  getAvailableCommunes(): string[] {
    return COMMUNE_COORDINATES.map((item) => item.commune)
  }

  /**
   * Récupère les coordonnées d'une commune
   */
  private getCommuneCoordinates(commune: string): CommuneCoordinates | null {
    const coordinates = COMMUNE_COORDINATES.find((item) => item.commune === commune)
    return coordinates || null
  }

  /**
   * Récupère les données météo en cache pour une commune
   */
  private async getCachedWeatherData(commune: string): Promise<WeatherData | null> {
    try {
      const cacheKey = `weather_cache_${commune}`
      const cachedData = await AsyncStorage.getItem(cacheKey)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached weather data:", error)
      return null
    }
  }

  /**
   * Met en cache les données météo pour une commune
   */
  private async cacheWeatherData(commune: string, data: WeatherData): Promise<void> {
    try {
      const cacheKey = `weather_cache_${commune}`
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching weather data:", error)
    }
  }

  /**
   * Récupère les alertes en cache pour une commune
   */
  private async getCachedAlerts(commune: string): Promise<WeatherAlert[] | null> {
    try {
      const cacheKey = `weather_alerts_cache_${commune}`
      const cachedData = await AsyncStorage.getItem(cacheKey)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const now = Date.now()

        // Vérifier si les données sont encore valides
        if (now - timestamp < CACHE_DURATION) {
          return data
        }
      }

      return null
    } catch (error) {
      console.error("Error getting cached weather alerts:", error)
      return null
    }
  }

  /**
   * Met en cache les alertes pour une commune
   */
  private async cacheAlerts(commune: string, alerts: WeatherAlert[]): Promise<void> {
    try {
      const cacheKey = `weather_alerts_cache_${commune}`
      const cacheData = {
        data: alerts,
        timestamp: Date.now(),
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error("Error caching weather alerts:", error)
    }
  }

  /**
   * Vide le cache météo
   */
  async clearWeatherCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const weatherCacheKeys = keys.filter(
        (key) => key.startsWith("weather_cache_") || key.startsWith("weather_alerts_cache_"),
      )

      if (weatherCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(weatherCacheKeys)
      }
    } catch (error) {
      console.error("Error clearing weather cache:", error)
    }
  }
}

export default new CommuneWeatherService()
