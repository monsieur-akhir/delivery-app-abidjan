// Définition des types
interface WeatherCurrent {
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  pressure: number
  visibility: number
  uv_index: number
  feels_like: number
  icon: string
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
  icon: string
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

class CommuneWeatherService {
  private static API_URL = "https://api.example.com/weather"
  private static communes = [
    "Plateau",
    "Cocody",
    "Yopougon",
    "Abobo",
    "Adjamé",
    "Koumassi",
    "Marcory",
    "Port-Bouët",
    "Treichville",
    "Attécoubé",
  ]

  // Récupérer la liste des communes disponibles
  static getAvailableCommunes(): string[] {
    return this.communes
  }

  // Récupérer les données météo pour une commune spécifique
  static async getWeatherForCommune(commune: string): Promise<WeatherData> {
    try {
      // Dans un environnement réel, nous ferions un appel API ici
      // Pour l'instant, nous simulons une réponse
      return this.getMockWeatherData(commune)
    } catch (error) {
      console.error(`Error fetching weather data for ${commune}:`, error)
      throw new Error(`Failed to fetch weather data for ${commune}`)
    }
  }

  // Données météo simulées pour le développement
  private static getMockWeatherData(commune: string): WeatherData {
    // Générer des données aléatoires basées sur la commune
    const temperature = 25 + Math.floor(Math.random() * 10)
    const humidity = 50 + Math.floor(Math.random() * 40)
    const windSpeed = 5 + Math.floor(Math.random() * 20)
    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain", "Thunderstorm"]
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]

    // Générer des prévisions pour les 5 prochains jours
    const forecast: WeatherForecastDay[] = []
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = new Date()

    for (let i = 0; i < 5; i++) {
      const forecastDate = new Date()
      forecastDate.setDate(today.getDate() + i)
      const dayName = days[forecastDate.getDay()]

      forecast.push({
        day: dayName,
        date: forecastDate.toISOString().split("T")[0],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        max_temp: temperature + Math.floor(Math.random() * 5),
        min_temp: temperature - Math.floor(Math.random() * 5),
        humidity: humidity + Math.floor(Math.random() * 10) - 5,
        wind_speed: windSpeed + Math.floor(Math.random() * 5) - 2,
        chance_of_rain: Math.floor(Math.random() * 100),
        icon: "cloud",
      })
    }

    // Générer des alertes aléatoires (1 chance sur 3 d'avoir une alerte)
    const alerts: WeatherAlert[] = []
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert-${Date.now()}`,
        type: "Weather Warning",
        severity: Math.random() > 0.7 ? "high" : Math.random() > 0.5 ? "medium" : "low",
        title: "Heavy Rain Warning",
        description:
          "Heavy rainfall expected in the area. Possible flooding in low-lying areas. Take necessary precautions.",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        affected_communes: [commune, ...this.communes.filter((c) => c !== commune).slice(0, 3)],
        precautions: [
          "Avoid unnecessary travel",
          "Stay away from flood-prone areas",
          "Keep emergency supplies ready",
          "Follow local authority instructions",
        ],
        source: "National Weather Service",
      })
    }

    return {
      location: "Abidjan",
      commune: commune,
      current: {
        temperature: temperature,
        condition: randomCondition,
        humidity: humidity,
        wind_speed: windSpeed,
        pressure: 1010 + Math.floor(Math.random() * 10),
        visibility: 8 + Math.floor(Math.random() * 4),
        uv_index: Math.floor(Math.random() * 11),
        feels_like: temperature + Math.floor(Math.random() * 3) - 1,
        icon: "sun",
      },
      forecast: forecast,
      alerts: alerts,
    }
  }
}

export default CommuneWeatherService
