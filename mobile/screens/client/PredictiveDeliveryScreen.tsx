"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { Text, Card, Button, Chip, Divider, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation, useRoute } from "@react-navigation/native"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"
import PredictiveAnalyticsService, {
  type DeliveryPrediction,
  type OptimalTimeSlot,
} from "../../services/PredictiveAnalyticsService"
import { formatDate, formatTime, formatDuration } from "../../utils/formatters"
import Ionicons from "react-native-vector-icons/Ionicons" // Import Ionicons

interface PredictiveDeliveryScreenProps {
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  deliveryLat: number
  deliveryLng: number
  deliveryAddress: string
}

const PredictiveDeliveryScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  const params = route.params as PredictiveDeliveryScreenProps

  const [prediction, setPrediction] = useState<DeliveryPrediction | null>(null)
  const [timeSlots, setTimeSlots] = useState<OptimalTimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickupLat = params?.pickupLat || 0
  const pickupLng = params?.pickupLng || 0
  const pickupAddress = params?.pickupAddress || ""
  const deliveryLat = params?.deliveryLat || 0
  const deliveryLng = params?.deliveryLng || 0
  const deliveryAddress = params?.deliveryAddress || ""

  useEffect(() => {
    fetchPrediction()
    fetchTimeSlots()
  }, [])

  const fetchPrediction = async () => {
    try {
      setLoading(true)
      const data = await PredictiveAnalyticsService.predictDeliveryTime(pickupLat, pickupLng, deliveryLat, deliveryLng)
      setPrediction(data)
    } catch (err) {
      console.error("Error fetching prediction:", err)
      setError(t("predictive.errorFetchingPrediction"))
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeSlots = async () => {
    try {
      setLoadingSlots(true)
      const data = await PredictiveAnalyticsService.suggestOptimalTimeSlots(
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
        selectedDate,
      )
      setTimeSlots(data)
    } catch (err) {
      console.error("Error fetching time slots:", err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    fetchTimeSlots()
  }

  const handleContinue = () => {
    // Naviguer vers l'écran de création de livraison avec les données prédictives
    navigation.navigate("CreateDelivery", {
      pickupLat,
      pickupLng,
      pickupAddress,
      deliveryLat,
      deliveryLng,
      deliveryAddress,
      estimatedDuration: prediction?.estimated_duration,
      estimatedArrivalTime: prediction?.estimated_arrival_time,
    })
  }

  const getTrafficLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "#4CAF50"
      case "medium":
        return "#FFC107"
      case "high":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t("predictive.title")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("predictive.analyzing")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t("predictive.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Carte avec itinéraire */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (pickupLat + deliveryLat) / 2,
              longitude: (pickupLng + deliveryLng) / 2,
              latitudeDelta: Math.abs(pickupLat - deliveryLat) * 1.5 + 0.02,
              longitudeDelta: Math.abs(pickupLng - deliveryLng) * 1.5 + 0.02,
            }}
          >
            <Marker
              coordinate={{ latitude: pickupLat, longitude: pickupLng }}
              title={t("delivery.pickup")}
              description={pickupAddress}
              pinColor="#4CAF50"
            />
            <Marker
              coordinate={{ latitude: deliveryLat, longitude: deliveryLng }}
              title={t("delivery.destination")}
              description={deliveryAddress}
              pinColor="#F44336"
            />
            <Polyline
              coordinates={[
                { latitude: pickupLat, longitude: pickupLng },
                { latitude: deliveryLat, longitude: deliveryLng },
              ]}
              strokeWidth={3}
              strokeColor="#FF6B00"
            />
          </MapView>
        </View>

        {/* Prédiction de livraison */}
        {prediction && (
          <Card style={styles.predictionCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>{t("predictive.deliveryPrediction")}</Text>

              <View style={styles.predictionRow}>
                <View style={styles.predictionItem}>
                  <Text style={styles.predictionLabel}>{t("predictive.estimatedDuration")}</Text>
                  <Text style={styles.predictionValue}>{formatDuration(prediction.estimated_duration)}</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={styles.predictionLabel}>{t("predictive.estimatedArrival")}</Text>
                  <Text style={styles.predictionValue}>{formatTime(prediction.estimated_arrival_time)}</Text>
                </View>
              </View>

              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>
                  {t("predictive.confidenceLevel")}: {Math.round(prediction.confidence_level * 100)}%
                </Text>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${prediction.confidence_level * 100}%` }]} />
                </View>
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.factorsTitle}>{t("predictive.impactingFactors")}</Text>

              <View style={styles.factorsContainer}>
                <View style={styles.factorItem}>
                  <View style={[styles.factorIcon, { backgroundColor: "#E3F2FD" }]}>
                    <Ionicons name="car" size={20} color="#1976D2" />
                  </View>
                  <Text style={styles.factorLabel}>{t("predictive.traffic")}</Text>
                  <Text style={styles.factorValue}>{Math.round(prediction.factors.traffic * 100)}%</Text>
                </View>

                <View style={styles.factorItem}>
                  <View style={[styles.factorIcon, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="rainy" size={20} color="#388E3C" />
                  </View>
                  <Text style={styles.factorLabel}>{t("predictive.weather")}</Text>
                  <Text style={styles.factorValue}>{Math.round(prediction.factors.weather * 100)}%</Text>
                </View>

                <View style={styles.factorItem}>
                  <View style={[styles.factorIcon, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="time" size={20} color="#E64A19" />
                  </View>
                  <Text style={styles.factorLabel}>{t("predictive.timeOfDay")}</Text>
                  <Text style={styles.factorValue}>{Math.round(prediction.factors.time_of_day * 100)}%</Text>
                </View>

                <View style={styles.factorItem}>
                  <View style={[styles.factorIcon, { backgroundColor: "#F3E5F5" }]}>
                    <Ionicons name="map" size={20} color="#7B1FA2" />
                  </View>
                  <Text style={styles.factorLabel}>{t("predictive.distance")}</Text>
                  <Text style={styles.factorValue}>{prediction.factors.distance} km</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Créneaux horaires optimaux */}
        <Card style={styles.timeSlotsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("predictive.optimalTimeSlots")}</Text>

            <View style={styles.dateSelector}>
              {[0, 1, 2].map((offset) => {
                const date = new Date()
                date.setDate(date.getDate() + offset)
                const dateString = date.toISOString().split("T")[0]
                const isSelected = dateString === selectedDate

                return (
                  <TouchableOpacity
                    key={dateString}
                    style={[styles.dateOption, isSelected && styles.selectedDateOption]}
                    onPress={() => handleDateChange(dateString)}
                    disabled={loadingSlots}
                  >
                    <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
                      {offset === 0 ? t("common.today") : offset === 1 ? t("common.tomorrow") : formatDate(dateString)}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {loadingSlots ? (
              <View style={styles.slotsLoadingContainer}>
                <ActivityIndicator size="small" color="#FF6B00" />
                <Text style={styles.slotsLoadingText}>{t("predictive.loadingTimeSlots")}</Text>
              </View>
            ) : timeSlots.length > 0 ? (
              <View style={styles.timeSlotsContainer}>
                {timeSlots.map((slot, index) => (
                  <View key={index} style={styles.timeSlotItem}>
                    <View style={styles.timeSlotHeader}>
                      <Text style={styles.timeSlotTime}>
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </Text>
                      <Chip style={[styles.trafficChip, { backgroundColor: getTrafficLevelColor(slot.traffic_level) }]}>
                        {t(`predictive.traffic_${slot.traffic_level}`)}
                      </Chip>
                    </View>

                    <View style={styles.timeSlotDetails}>
                      <Text style={styles.timeSlotDuration}>
                        {t("predictive.estimatedDuration")}: {formatDuration(slot.estimated_duration)}
                      </Text>
                      <Text style={styles.timeSlotConfidence}>
                        {t("predictive.confidence")}: {Math.round(slot.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noSlotsText}>{t("predictive.noTimeSlotsAvailable")}</Text>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          style={styles.continueButton}
          labelStyle={styles.continueButtonLabel}
          onPress={handleContinue}
        >
          {t("common.continue")}
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  predictionCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  predictionItem: {
    flex: 1,
    alignItems: "center",
  },
  predictionLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  confidenceContainer: {
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 4,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  divider: {
    marginVertical: 12,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 12,
  },
  factorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  factorItem: {
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
  },
  factorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  factorLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
  },
  timeSlotsCard: {
    marginBottom: 16,
  },
  dateSelector: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginHorizontal: 4,
    borderRadius: 4,
  },
  selectedDateOption: {
    borderColor: "#FF6B00",
    backgroundColor: "#FFF3E0",
  },
  dateText: {
    fontSize: 14,
    color: "#757575",
  },
  selectedDateText: {
    color: "#FF6B00",
    fontWeight: "500",
  },
  slotsLoadingContainer: {
    alignItems: "center",
    padding: 16,
  },
  slotsLoadingText: {
    marginTop: 8,
    color: "#757575",
  },
  timeSlotsContainer: {
    gap: 12,
  },
  timeSlotItem: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  trafficChip: {
    height: 24,
  },
  timeSlotDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeSlotDuration: {
    fontSize: 12,
    color: "#757575",
  },
  timeSlotConfidence: {
    fontSize: 12,
    color: "#757575",
  },
  noSlotsText: {
    textAlign: "center",
    padding: 16,
    color: "#757575",
  },
  continueButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
  },
  continueButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
})

export default PredictiveDeliveryScreen
