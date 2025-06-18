"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { Text, Card, ActivityIndicator, Button, Divider, Chip } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../contexts/NetworkContext"
import WeatherAlertModal from "./WeatherAlertModal"
import CommuneWeatherService from "../services/CommuneWeatherService"
import FeatherIcon from "./FeatherIcon"
  // Import FeatherIconName type
  import type { FeatherIconName } from "./FeatherIcon"

// Types pour les données météo
interface WeatherCondition {
  code: number
  condition: string
  icon: string
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

import { ViewStyle } from "react-native"

interface EnhancedWeatherInfoProps {
  commune?: string
  onSelectCommune?: (commune: string) => void
  showDeliveryTips?: boolean
  compact?: boolean
  style?: ViewStyle
}

interface CustomModalProps {
  visible: boolean
  transparent?: boolean
  animationType?: "none" | "slide" | "fade"
  onRequestClose?: () => void
  children: React.ReactNode
}

const { width } = Dimensions.get("window")

const EnhancedWeatherInfo: React.FC<EnhancedWeatherInfoProps> = ({
  commune,
  onSelectCommune,
  showDeliveryTips = true,
  compact = false,
  style,
}) => {
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null)
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false)
  const [availableCommunes, setAvailableCommunes] = useState<string[]>([])
  const [communeSelectVisible, setCommuneSelectVisible] = useState<boolean>(false)

  useEffect(() => {
    loadWeatherData()
    setAvailableCommunes(CommuneWeatherService.getAvailableCommunes())
  }, [commune, isConnected])

  const loadWeatherData = async () => {
    if (!isConnected) {
      setError(t("weather.offlineError"))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await CommuneWeatherService.getWeatherForCommune(commune || "Plateau")
      setWeatherData(data)
    } catch (error) {
      console.error("Error loading weather data:", error)
      setError(t("weather.loadingError"))
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadWeatherData()
  }

  const handleAlertPress = (alert: WeatherAlert) => {
    setSelectedAlert(alert)
    setAlertModalVisible(true)
  }

  const handleCommuneSelect = (selectedCommune: string) => {
    setCommuneSelectVisible(false)
    if (onSelectCommune) {
      onSelectCommune(selectedCommune)
    }
  }



  const getWeatherIcon = (condition: string): FeatherIconName => {
    // Mapping des conditions météo aux icônes
    const iconMap: Record<string, FeatherIconName> = {
      clear: "sun",
      sunny: "sun",
      partly_cloudy: "cloud",
      cloudy: "cloud",
      overcast: "cloud",
      mist: "cloud-drizzle",
      fog: "cloud-drizzle",
      rain: "cloud-rain",
      light_rain: "cloud-drizzle",
      heavy_rain: "cloud-rain",
      showers: "cloud-rain",
      thunderstorm: "cloud-lightning",
      storm: "cloud-lightning",
      snow: "cloud-snow",
      sleet: "cloud-snow",
      hail: "cloud-snow",
      windy: "wind",
    }

    const conditionKey = condition.toLowerCase().replace(/\s+/g, "_")
    return (iconMap[conditionKey] || "cloud") as FeatherIconName
  }

  const getWeatherTip = (condition: string): string => {
    // Conseils basés sur les conditions météo
    if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("shower")) {
      return t("weather.tips.rain")
    } else if (condition.toLowerCase().includes("storm") || condition.toLowerCase().includes("thunder")) {
      return t("weather.tips.storm")
    } else if (condition.toLowerCase().includes("wind")) {
      return t("weather.tips.wind")
    } else if (
      condition.toLowerCase().includes("fog") ||
      condition.toLowerCase().includes("mist") ||
      condition.toLowerCase().includes("haze")
    ) {
      return t("weather.tips.visibility")
    } else if (condition.toLowerCase().includes("hot") || condition.toLowerCase().includes("sunny")) {
      return t("weather.tips.heat")
    }
    return ""
  }

  const renderAlertChip = (alert: WeatherAlert) => {
    const severityColor = {
      high: "#F44336",
      medium: "#FF9800",
      low: "#FFC107",
    }[alert.severity]

    return (
      <TouchableOpacity key={alert.id} onPress={() => handleAlertPress(alert)}>
        <Chip
          style={[styles.alertChip, { backgroundColor: `${severityColor}20` }]}
          textStyle={{ color: severityColor }}
          icon={() => <FeatherIcon name="alert-circle" size={16} color={severityColor} style={styles.chipIcon} />}
        >
          {alert.title}
        </Chip>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <Card style={[styles.container, style]}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("weather.loading")}</Text>
        </Card.Content>
      </Card>
    )
  }

  if (error) {
    return (
      <Card style={[styles.container, style]}>
        <Card.Content style={styles.errorContainer}>
          <FeatherIcon name="cloud-off" size={40} color="#757575" />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="outlined" onPress={handleRefresh} style={styles.retryButton}>
            {t("common.retry")}
          </Button>
        </Card.Content>
      </Card>
    )
  }

  if (!weatherData) {
    return null
  }

  // Version compacte pour les widgets
  if (compact) {
    return (
      <Card style={[styles.compactContainer, style]}>
        <Card.Content style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <View style={styles.compactLocationContainer}>
              <FeatherIcon name="map-pin" size={16} color="#FF6B00" style={styles.compactLocationIcon} />
              <Text style={styles.compactLocation}>{weatherData.commune || weatherData.location}</Text>
            </View>
            <TouchableOpacity onPress={handleRefresh}>
              <FeatherIcon name="refresh-cw" size={16} color="#757575" />
            </TouchableOpacity>
          </View>

          <View style={styles.compactWeatherInfo}>
            <FeatherIcon
              name={String(getWeatherIcon(weatherData.current.condition))}
              size={32}
              color="#FF6B00"
              style={styles.compactWeatherIcon}
            />
            <View style={styles.compactTemperatureContainer}>
              <Text style={styles.compactTemperature}>{Math.round(weatherData.current.temperature)}°C</Text>
              <Text style={styles.compactCondition}>{weatherData.current.condition}</Text>
            </View>
          </View>

          {weatherData.alerts && weatherData.alerts.length > 0 && (
            <View style={styles.compactAlertsContainer}>
              {weatherData.alerts.slice(0, 1).map((alert) => renderAlertChip(alert))}
              {weatherData.alerts.length > 1 && (
                <TouchableOpacity onPress={() => setAlertModalVisible(true)}>
                  <Text style={styles.moreAlertsText}>
                    {t("weather.showMoreAlerts", { count: weatherData.alerts.length - 1 })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    )
  }

  // Version complète
  return (
    <Card style={[styles.container, style]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <FeatherIcon name="map-pin" size={20} color="#FF6B00" style={styles.locationIcon} />
          <TouchableOpacity onPress={() => setCommuneSelectVisible(true)}>
              <View style={styles.communeSelector}>
                <Text style={styles.location}>{weatherData.commune || weatherData.location}</Text>
                <FeatherIcon name="chevron-down" size={16} color="#757575" style={styles.selectorIcon} />
              </View>
          </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleRefresh}>
            <FeatherIcon name="refresh-cw" size={20} color="#757575" />
          </TouchableOpacity>
        </View>

        <View style={styles.currentWeather}>
          <View style={styles.temperatureContainer}>
            <FeatherIcon
              name={String(getWeatherIcon(weatherData.current.condition))}
              size={48}
              color="#FF6B00"
              style={styles.weatherIcon}
            />
            <Text style={styles.temperature}>{Math.round(weatherData.current.temperature)}°C</Text>
          </View>
          <Text style={styles.condition}>{weatherData.current.condition}</Text>
          <Text style={styles.feelsLike}>
            {t("weather.feelsLike")}: {Math.round(weatherData.current.feels_like)}°C
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <FeatherIcon name="droplet" size={20} color="#03A9F4" style={styles.detailIcon} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("weather.humidity")}</Text>
              <Text style={styles.detailValue}>{weatherData.current.humidity}%</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <FeatherIcon name="wind" size={20} color="#607D8B" style={styles.detailIcon} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("weather.wind")}</Text>
              <Text style={styles.detailValue}>{weatherData.current.wind_speed} km/h</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <FeatherIcon name="eye" size={20} color="#9C27B0" style={styles.detailIcon} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("weather.visibility")}</Text>
              <Text style={styles.detailValue}>{weatherData.current.visibility} km</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <FeatherIcon name="sun" size={20} color="#FF9800" style={styles.detailIcon} />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>{t("weather.uvIndex")}</Text>
              <Text style={styles.detailValue}>{weatherData.current.uv_index}</Text>
            </View>
          </View>
        </View>

        {weatherData.alerts && weatherData.alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.alertsTitle}>{t("weather.alerts.title")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertsScroll}>
              {weatherData.alerts.map((alert) => renderAlertChip(alert))}
            </ScrollView>
          </View>
        )}

        <Divider style={styles.divider} />

        <Text style={styles.forecastTitle}>{t("weather.forecast")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {weatherData.forecast.map((day, index) => (
            <Card key={index} style={styles.forecastCard}>
              <Card.Content style={styles.forecastCardContent}>
                <Text style={styles.forecastDay}>{day.day}</Text>
                <FeatherIcon
                  name={String(getWeatherIcon(day.condition))}
                  size={32}
                  color="#FF6B00"
                  style={styles.forecastIcon}
                />
                <Text style={styles.forecastCondition}>{day.condition}</Text>
                <View style={styles.forecastTemperature}>
                  <Text style={styles.forecastMaxTemp}>{Math.round(day.max_temp)}°</Text>
                  <Text style={styles.forecastMinTemp}>{Math.round(day.min_temp)}°</Text>
                </View>
                <View style={styles.forecastDetail}>
                  <FeatherIcon name="droplet" size={16} color="#03A9F4" style={styles.forecastDetailIcon} />
                  <Text style={styles.forecastDetailText}>{day.humidity}%</Text>
                </View>
                <View style={styles.forecastDetail}>
                  <FeatherIcon name="cloud-rain" size={16} color="#4CAF50" style={styles.forecastDetailIcon} />
                  <Text style={styles.forecastDetailText}>{day.chance_of_rain}%</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        {showDeliveryTips && getWeatherTip(weatherData.current.condition) && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>{t("weather.deliveryTips")}</Text>
            <Text style={styles.tipsText}>{getWeatherTip(weatherData.current.condition)}</Text>
          </View>
        )}
      </Card.Content>

      {/* Modal pour les alertes météo */}
      <WeatherAlertModal
        visible={alertModalVisible}
        alert={selectedAlert}
        onDismiss={() => setAlertModalVisible(false)}
      />

      {/* Modal pour la sélection de commune */}
      <CustomModal visible={communeSelectVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("weather.communeWeather.selectCommune")}</Text>
              <TouchableOpacity onPress={() => setCommuneSelectVisible(false)}>
                <FeatherIcon name="x" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.communeList}>
              {availableCommunes.map((communeName) => (
                <TouchableOpacity
                  key={communeName}
                  style={[styles.communeItem, communeName === (commune || "Plateau") && styles.selectedCommuneItem]}
                  onPress={() => handleCommuneSelect(communeName)}
                >
                  <Text
                    style={[
                      styles.communeItemText,
                      communeName === (commune || "Plateau") && styles.selectedCommuneItemText,
                    ]}
                  >
                    {communeName}
                  </Text>
                  {communeName === (commune || "Plateau") && (
                    <FeatherIcon name="check" size={20} color="#FF6B00" style={styles.selectedIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </CustomModal>
    </Card>
  )
}

// Composant Modal pour la sélection de commune
const CustomModal: React.FC<CustomModalProps> = ({ visible, transparent, children }) => {
  if (!visible) return null

  return (
    <View style={[styles.modalOverlay, transparent && styles.transparentModal]}>
      <View style={styles.modalInner}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    elevation: 2,
  },
  compactContainer: {
    marginVertical: 4,
    elevation: 1,
  },
  compactContent: {
    padding: 8,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  compactLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactLocationIcon: {
    margin: 0,
    padding: 0,
  },
  compactLocation: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  compactWeatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  compactWeatherIcon: {
    margin: 0,
  },
  compactTemperatureContainer: {
    marginLeft: 8,
  },
  compactTemperature: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  compactCondition: {
    fontSize: 12,
    color: "#757575",
  },
  compactAlertsContainer: {
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    margin: 0,
  },
  communeSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  selectorIcon: {
    margin: 0,
    padding: 0,
  },
  currentWeather: {
    alignItems: "center",
    marginBottom: 16,
  },
  temperatureContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherIcon: {
    margin: 0,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#212121",
  },
  condition: {
    fontSize: 18,
    color: "#212121",
    marginTop: 4,
  },
  feelsLike: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  detailIcon: {
    margin: 0,
  },
  detailTextContainer: {
    marginLeft: 4,
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
  alertsContainer: {
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  alertsScroll: {
    flexDirection: "row",
  },
  alertChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  chipIcon: {
    margin: 0,
    padding: 0,
  },
  divider: {
    marginVertical: 16,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  forecastScroll: {
    marginBottom: 16,
  },
  forecastCard: {
    width: width / 4,
    marginRight: 8,
    elevation: 1,
  },
  forecastCardContent: {
    padding: 8,
    alignItems: "center",
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  forecastIcon: {
    margin: 0,
  },
  forecastCondition: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    marginBottom: 4,
  },
  forecastTemperature: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  forecastMaxTemp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginRight: 8,
  },
  forecastMinTemp: {
    fontSize: 14,
    color: "#757575",
  },
  forecastDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  forecastDetailIcon: {
    margin: 0,
    padding: 0,
  },
  forecastDetailText: {
    fontSize: 12,
    color: "#757575",
  },
  tipsContainer: {
    backgroundColor: "#FFF9C4",
    padding: 12,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: "#212121",
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#757575",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
  },
  moreAlertsText: {
    fontSize: 12,
    color: "#FF6B00",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  transparentModal: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalInner: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  communeList: {
    padding: 16,
  },
  communeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  selectedCommuneItem: {
    backgroundColor: "#FFF3E0",
  },
  communeItemText: {
    fontSize: 16,
    color: "#212121",
  },
  selectedCommuneItemText: {
    color: "#FF6B00",
    fontWeight: "bold",
  },
  selectedIcon: {
    margin: 0,
  },
})

export default EnhancedWeatherInfo