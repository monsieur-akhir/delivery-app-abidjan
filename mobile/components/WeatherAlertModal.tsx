import type React from "react"
import { View, StyleSheet, Modal, ScrollView } from "react-native"
import { Text, Card, Button, Chip, Divider } from "react-native-paper"
import { useTranslation } from "react-i18next"
import FeatherIcon from "./FeatherIcon"

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
}

const WeatherAlertModal: React.FC<WeatherAlertModalProps> = ({ visible, alert, onDismiss }) => {
  const { t } = useTranslation()

  if (!alert) return null

  const getSeverityColor = (severity: "low" | "medium" | "high"): string => {
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

  const getSeverityText = (severity: "low" | "medium" | "high"): string => {
    switch (severity) {
      case "high":
        return t("weather.alerts.severityHigh")
      case "medium":
        return t("weather.alerts.severityMedium")
      case "low":
        return t("weather.alerts.severityLow")
      default:
        return ""
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalContainer}>
        <Card style={styles.modalContent}>
          <Card.Content>
            <View style={styles.modalHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.modalTitle}>{alert.title}</Text>
                <Chip
                  style={[styles.severityChip, { backgroundColor: `${getSeverityColor(alert.severity)}20` }]}
                  textStyle={{ color: getSeverityColor(alert.severity) }}
                >
                  {getSeverityText(alert.severity)}
                </Chip>
              </View>
              <TouchableOpacity onPress={onDismiss}>
                <FeatherIcon name="x" size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            <Divider style={styles.divider} />

            <ScrollView style={styles.scrollContent}>
              <View style={styles.alertInfo}>
                <View style={styles.infoRow}>
                  <FeatherIcon name="alert-triangle" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>{t("weather.alerts.type")}:</Text>
                  <Text style={styles.infoValue}>{alert.type}</Text>
                </View>

                <View style={styles.infoRow}>
                  <FeatherIcon name="clock" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>{t("weather.alerts.validFrom")}:</Text>
                  <Text style={styles.infoValue}>{formatDate(alert.start_time)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <FeatherIcon name="clock" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>{t("weather.alerts.validUntil")}:</Text>
                  <Text style={styles.infoValue}>{formatDate(alert.end_time)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <FeatherIcon name="map-pin" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>{t("weather.alerts.affectedAreas")}:</Text>
                </View>

                <View style={styles.communesContainer}>
                  {alert.affected_communes.map((commune, index) => (
                    <Chip key={index} style={styles.communeChip}>
                      {commune}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>{t("weather.alerts.description")}</Text>
                <Text style={styles.descriptionText}>{alert.description}</Text>
              </View>

              {alert.precautions && alert.precautions.length > 0 && (
                <View style={styles.precautionsContainer}>
                  <Text style={styles.precautionsTitle}>{t("weather.alerts.precautions")}</Text>
                  {alert.precautions.map((precaution, index) => (
                    <View key={index} style={styles.precautionItem}>
                      <FeatherIcon name="check" size={16} color="#4CAF50" style={styles.precautionIcon} />
                      <Text style={styles.precautionText}>{precaution}</Text>
                    </View>
                  ))}
                </View>
              )}

              {alert.source && (
                <View style={styles.sourceContainer}>
                  <Text style={styles.sourceText}>
                    {t("weather.alerts.source")}: {alert.source}
                  </Text>
                </View>
              )}
            </ScrollView>

            <Divider style={styles.divider} />

            <Button mode="contained" onPress={onDismiss} style={styles.closeButton}>
              {t("common.close")}
            </Button>
          </Card.Content>
        </Card>
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
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  severityChip: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  scrollContent: {
    maxHeight: 400,
  },
  alertInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: "#757575",
    flex: 1,
  },
  communesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 26,
  },
  communeChip: {
    margin: 4,
  },
  descriptionContainer: {
    marginBottom: 16,
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
  },
  precautionsContainer: {
    marginBottom: 16,
  },
  precautionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  precautionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  precautionIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  precautionText: {
    fontSize: 14,
    color: "#212121",
    flex: 1,
    lineHeight: 20,
  },
  sourceContainer: {
    marginTop: 8,
  },
  sourceText: {
    fontSize: 12,
    color: "#757575",
    fontStyle: "italic",
  },
  closeButton: {
    marginTop: 8,
    backgroundColor: "#FF6B00",
  },
})

export default WeatherAlertModal
