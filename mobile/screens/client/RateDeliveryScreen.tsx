"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Text, Card, Button, TextInput, Divider, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, submitRating } from "../../services/api"
import StarRating from "../../components/StarRating"
import { Feather } from "@expo/vector-icons"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery } from "../../types/models"
import { StyleSheet } from "react-native"
import { API_URL } from "../../config/environment"

type RateDeliveryScreenProps = {
  route: RouteProp<RootStackParamList, "RateDelivery">
  navigation: NativeStackNavigationProp<RootStackParamList, "RateDelivery">
}

const RateDeliveryScreen: React.FC<RateDeliveryScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { isConnected, addPendingUpload } = useNetwork()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const loadDeliveryDetails = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)

      // Vérifier si la livraison a déjà été évaluée
      if (typeof data.rating === "number") {
        setRating(data.rating)
        // Note: Comment is not stored in Delivery.rating; it’s part of the Rating interface
        // If comments are fetched separately, update this logic
        setComment("") // Default to empty since comment isn’t in Delivery
        Alert.alert(t("rateDelivery.alreadyRated"), t("rateDelivery.alreadyRatedMessage"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("DeliveryDetails", { deliveryId }),
          },
        ])
      }
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError(t("rateDelivery.errorLoadingDelivery"))
    } finally {
      setLoading(false)
    }
  }, [deliveryId, navigation, t])

  useEffect(() => {
    loadDeliveryDetails()
  }, [loadDeliveryDetails])

  const handleRatingChange = (value: number) => {
    setRating(value)
  }

  const handleSubmit = async () => {
    if (!delivery || !delivery.courier) {
      setError(t("rateDelivery.errorDeliveryNotFound"))
      return
    }

    try {
      setSubmitting(true)

      const ratingData = {
        delivery_id: deliveryId,
        courier_id: delivery.courier.id,
        rating,
        comment,
      }

      if (isConnected) {
        await submitRating(ratingData)

        Alert.alert(t("rateDelivery.thankYou"), t("rateDelivery.ratingSubmitted"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home"),
          },
        ])
      } else {
        addPendingUpload({
          id: Date.now().toString(),
          type: "submit_rating",
          data: ratingData,
          delivery_id: deliveryId, // Added to match PendingOperation
          timestamp: Date.now().toString(),
        } as any)

        Alert.alert(t("rateDelivery.thankYou"), t("rateDelivery.offlineRatingSubmitted"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home"),
          },
        ])
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      setError(error instanceof Error ? error.message : t("rateDelivery.errorSubmittingRating"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    Alert.alert(t("rateDelivery.skipRating"), t("rateDelivery.skipRatingMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.skip"),
        onPress: () => navigation.navigate("Home"),
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("rateDelivery.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery || !delivery.courier) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={50} color="#F44336" />
          <Text style={styles.errorText}>{error || t("rateDelivery.deliveryNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.back")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.deliveryCard}>
          <Card.Content>
            <Text style={styles.deliveryTitle}>{t("rateDelivery.deliveryCompleted")}</Text>
            <Text style={styles.deliverySubtitle}>
              {t("rateDelivery.deliveryId")}: #{deliveryId}
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.courierInfo}>
              <View style={styles.courierIcon}>
                <Feather name="user" size={40} color="#FF6B00" />
              </View>
              <View style={styles.courierDetails}>
                <Text style={styles.courierName}>{delivery.courier.name}</Text>
                <Text style={styles.courierVehicle}>{delivery.courier.vehicle_type}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <View style={styles.addressIcon}>
                  <Feather name="map-pin" size={20} color="#FF6B00" />
                </View>
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("rateDelivery.from")}</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                </View>
              </View>

              <View style={styles.addressDivider}>
                <View style={styles.addressDividerLine} />
              </View>

              <View style={styles.addressItem}>
                <View style={styles.addressIcon}>
                  <Feather name="map-pin" size={20} color="#4CAF50" />
                </View>
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("rateDelivery.to")}</Text>
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.ratingCard}>
          <Card.Content>
            <Text style={styles.ratingTitle}>{t("rateDelivery.rateExperience")}</Text>
            <Text style={styles.ratingSubtitle}>{t("rateDelivery.rateExperienceDescription")}</Text>

            <View style={styles.starsContainer}>
              <StarRating rating={rating} onRatingChange={handleRatingChange} size={40} editable />
              <Text style={styles.ratingText}>
                {rating === 1
                  ? t("rateDelivery.terrible")
                  : rating === 2
                    ? t("rateDelivery.bad")
                    : rating === 3
                      ? t("rateDelivery.okay")
                      : rating === 4
                        ? t("rateDelivery.good")
                        : t("rateDelivery.excellent")}
              </Text>
            </View>

            <TextInput
              label={t("rateDelivery.comment")}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              style={styles.commentInput}
              placeholder={t("rateDelivery.commentPlaceholder")}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              <Button mode="outlined" onPress={handleSkip} style={styles.skipButton} disabled={submitting}>
                {t("rateDelivery.skip")}
              </Button>

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={submitting}
                disabled={submitting}
              >
                {t("rateDelivery.submit")}
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginVertical: 16,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#FF6B00",
  },
  scrollContainer: {
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  deliverySubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  divider: {
    marginVertical: 16,
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  courierIcon: {
    backgroundColor: "#FFF3E0",
    borderRadius: 20,
    padding: 8,
    marginRight: 16,
  },
  courierDetails: {
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  courierVehicle: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: "#757575",
  },
  addressText: {
    fontSize: 14,
    color: "#212121",
    marginTop: 2,
  },
  addressDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 28,
    marginVertical: 4,
  },
  addressDividerLine: {
    flex: 1,
    height: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    marginLeft: 10,
  },
  ratingCard: {
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  starsContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skipButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#757575",
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
  },
})

export default RateDeliveryScreen
