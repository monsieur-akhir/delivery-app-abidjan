"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Image, TouchableOpacity } from "react-native"
import { Text, Card, ActivityIndicator, IconButton } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../contexts/NetworkContext"
import { fetchWeatherForecast } from "../services/api"

const WeatherInfo = ({ location, onPress }) => {
  const { t } = useTranslation()
  const { isConnected, isOfflineMode } = useNetwork()

  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (location && location.latitude && location.longitude) {
      loadWeatherData(location.latitude, location.longitude)
    } else {
      // Coordonnées par défaut pour Abidjan
      loadWeatherData(5.3599517, -4.0082563)
    }
  }, [location])

  const loadWeatherData = async (latitude, longitude) => {
    if (!isConnected && !isOfflineMode) {
      setLoading(false)
      setError(t("weather.offlineError"))
      return
    }

    try {
      setLoading(true)
      const data = await fetchWeatherForecast(latitude, longitude)
      setWeather(data)
      setError(null)
    } catch (error) {
      console.error("Error loading weather data:", error)
      setError(t("weather.loadingError"))
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const getWeatherIcon = (condition) => {
    const icons = {
      clear: require("../assets/weather/clear.png"),
      cloudy: require("../assets/weather/cloudy.png"),
      rain: require("../assets/weather/rain.png"),
      storm: require("../assets/weather/storm.png"),
      fog: require("../assets/weather/fog.png"),
      default: require("../assets/weather/default.png"),
    }

    return icons[condition] || icons.default
  }

  const getWeatherColor = (condition) => {
    const colors = {
      clear: "#FFC107",
      cloudy: "#78909C",
      rain: "#42A5F5",
      storm: "#5C6BC0",
      fog: "#B0BEC5",
      default: "#9E9E9E",
    }

    return colors[condition] || colors.default
  }

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("weather.loading")}</Text>
        </Card.Content>
      </Card>
    )
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.errorContainer}>
          <IconButton icon="weather-cloudy-alert" size={24} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </Card.Content>
      </Card>
    )
  }

  if (!weather) {
    return null
  }

  return (
    <Card style={styles.card} onPress={onPress || toggleExpanded}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.currentWeather}>
            <Image source={getWeatherIcon(weather.current.condition)} style={styles.weatherIcon} />
            <View style={styles.temperatureContainer}>
              <Text style={styles.temperature}>{weather.current.temperature}°C</Text>
              <Text style={styles.condition}>{t(`weather.conditions.${weather.current.condition}`)}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <IconButton icon="map-marker" size={16} color="#FF6B00" style={styles.locationIcon} />
            <Text style={styles.location}>{weather.location}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <IconButton icon="water-percent" size={20} color="#42A5F5" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>{t("weather.humidity")}</Text>
                  <Text style={styles.detailValue}>{weather.current.humidity}%</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <IconButton icon="weather-windy" size={20} color="#78909C" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>{t("weather.wind")}</Text>
                  <Text style={styles.detailValue}>{weather.current.wind_speed} km/h</Text>
                </View>
              </View>
            </View>

            <View style={styles.forecastContainer}>
              <Text style={styles.forecastTitle}>{t("weather.forecast")}</Text>
              <View style={styles.forecastList}>
                {weather.forecast.map((day, index) => (
                  <View key={index} style={styles.forecastItem}>
                    <Text style={styles.forecastDay}>{index === 0 ? t("weather.today") : day.day}</Text>
                    <Image source={getWeatherIcon(day.condition)} style={styles.forecastIcon} />
                    <Text style={styles.forecastTemp}>
                      {day.max_temp}° / {day.min_temp}°
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {weather.alert && (
              <View
                style={[styles.alertContainer, { backgroundColor: getWeatherColor(weather.current.condition) + "20" }]}
              >
                <IconButton
                  icon="alert"
                  size={20}
                  color={getWeatherColor(weather.current.condition)}
                  style={styles.alertIcon}
                />
                <Text style={[styles.alertText, { color: getWeatherColor(weather.current.condition) }]}>
                  {weather.alert}
                </Text>
              </View>
            )}
          </View>
        )}

        {expanded && (
          <TouchableOpacity style={styles.collapseButton} onPress={toggleExpanded}>
            <IconButton icon="chevron-up" size={24} color="#757575" />
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: "#757575",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  errorText: {
    flex: 1,
    color: "#F44336",
    marginLeft: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentWeather: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherIcon: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  temperatureContainer: {
    justifyContent: "center",
  },
  temperature: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  condition: {
    fontSize: 14,
    color: "#757575",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    margin: 0,
    padding: 0,
  },
  location: {
    fontSize: 14,
    color: "#757575",
  },
  details: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    margin: 0,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#757575",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  forecastContainer: {
    marginTop: 8,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  forecastList: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forecastItem: {
    alignItems: "center",
    flex: 1,
  },
  forecastDay: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  forecastIcon: {
    width: 30,
    height: 30,
    marginVertical: 4,
  },
  forecastTemp: {
    fontSize: 12,
    color: "#212121",
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  alertIcon: {
    margin: 0,
    marginRight: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
  },
  collapseButton: {
    alignItems: "center",
    marginTop: 8,
  },
})

export default WeatherInfo
