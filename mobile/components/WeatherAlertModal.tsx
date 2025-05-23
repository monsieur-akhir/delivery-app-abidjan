"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, Modal, ScrollView, Linking } from "react-native"
import { Text, Card, Button, IconButton, Divider, Chip } from "react-native-paper"
import { useTranslation } from "react-i18next"

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

interface WeatherAlertModalProps {
  visible: boolean
  alert: WeatherAlert | null
  onDismiss: () => void
  onViewMore?: () => void
}

const WeatherAlertModal: React.FC<WeatherAlertModalProps> = ({ visible, alert, onDismiss, onViewMore }) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<boolean>(false)

  useEffect(() => {
    if (visible) {
      setExpanded(false)
    }
  }, [visible])

  if (!alert) return null

  const getAlertSeverityColor = (severity: string): string => {
    switch (severity) {
      case "high":
        return "#F44336"
      case "medium":
        return "#FF9800"
      case "low":
        return "#FFC107"
      default:
        return "#757575"
    }
  }

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case "flood":
        return "water"
      case "storm":
        return "weather-lightning"
      case "wind":
        return "weather-windy"
      case "heat":
        return "thermometer"
      case "rain":
        return "weather-pouring"
      default:
        return "alert-circle"
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleViewWeatherWebsite = (): void => {
    Linking.openURL("https://www.weather.com")
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <IconButton
              icon={getAlertIcon(alert.type)}
              size={24}
              color={getAlertSeverityColor(alert.severity)}
              style={styles.headerIcon}
            />
            <Text style={[styles.headerTitle, { color: getAlertSeverityColor(alert.severity) }]}>{alert.title}</Text>
            <IconButton icon="close" size={24} color="#757575" onPress={onDismiss} />
          </View>

          <ScrollView style={styles.scrollContent}>
            <Card style={styles.alertCard}>
              <Card.Content>
                <View style={styles.alertInfo}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t("weather.alerts.severity")}</Text>
                    <Chip
                      style={[styles.severityChip, { backgroundColor: getAlertSeverityColor(alert.severity) + "20" }]}
                      textStyle={{ color: getAlertSeverityColor(alert.severity) }}
                    >
                      {t(`weather.alerts.${alert.severity}`)}
                    </Chip>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t("weather.alerts.startTime")}</Text>
                    <Text style={styles.infoValue}>{formatDate(alert.start_time)}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>{t("weather.alerts.endTime")}</Text>
                    <Text style={styles.infoValue}>{formatDate(alert.end_time)}</Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <Text style={styles.descriptionTitle}>{t("weather.alerts.description")}</Text>
                <Text style={styles.descriptionText}>{alert.description}</Text>

                {alert.affected_communes && alert.affected_communes.length > 0 && (
                  <>
                    <Text style={styles.affectedAreasTitle}>{t("weather.alerts.affectedAreas")}</Text>
                    <View style={styles.communesContainer}>
                      {alert.affected_communes.map((commune, index) => (
                        <Chip key={index} style={styles.communeChip}>
                          {commune}
                        </Chip>
                      ))}
                    </View>
                  </>
                )}

                {alert.precautions && alert.precautions.length > 0 && (
                  <>
                    <Text style={styles.precautionsTitle}>{t("weather.alerts.precautions")}</Text>
                    <View style={styles.precautionsList}>
                      {alert.precautions.map((precaution, index) => (
                        <View key={index} style={styles.precautionItem}>
                          <IconButton icon="check-circle" size={16} color="#4CAF50" style={styles.precautionIcon} />
                          <Text style={styles.precautionText}>{precaution}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {alert.source && (
                  <View style={styles.sourceContainer}>
                    <Text style={styles.sourceLabel}>{t("weather.alerts.source")}: </Text>
                    <Text style={styles.sourceText}>{alert.source}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            <View style={styles.actionsContainer}>
              <Button mode="outlined" onPress={handleViewWeatherWebsite} style={styles.actionButton} icon="web">
                Voir le site météo
              </Button>

              {onViewMore && (
                <Button
                  mode="contained"
                  onPress={onViewMore}
                  style={[styles.actionButton, styles.primaryButton]}
                  icon="alert-circle"
                >
                  Voir toutes les alertes
                </Button>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerIcon: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
  },
  alertCard: {
    marginBottom: 16,
  },
  alertInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#757575",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  severityChip: {
    height: 28,
  },
  divider: {
    marginVertical: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#212121",
    lineHeight: 20,
    marginBottom: 16,
  },
  affectedAreasTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  communesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  communeChip: {
    margin: 4,
  },
  precautionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  precautionsList: {
    marginBottom: 16,
  },
  precautionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  precautionIcon: {
    margin: 0,
    padding: 0,
  },
  precautionText: {
    flex: 1,
    fontSize: 14,
    color: "#212121",
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sourceLabel: {
    fontSize: 12,
    color: "#757575",
  },
  sourceText: {
    fontSize: 12,
    color: "#212121",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: "#FF6B00",
  },
})

export default WeatherAlertModal
