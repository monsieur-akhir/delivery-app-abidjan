"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Text, Card, Button, TextInput, Divider, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, submitRating } from "../../services/api"
import StarRating from "../../components/StarRating"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery } from "../../types/models"

type RateDeliveryScreenProps = {
  route: RouteProp<RootStackParamList, "RateDelivery">
  navigation: NativeStackNavigationProp<RootStackParamList, "RateDelivery">
}

const RateDeliveryScreen: React.FC<RateDeliveryScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    loadDeliveryDetails()
  }, [deliveryId])

  const loadDeliveryDetails = async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)

      // Vérifier si la livraison a déjà été évaluée
      if (data.rating) {
        setRating(data.rating.rating)
        setComment(data.rating.comment || "")
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
  }

  const handleRatingChange = (value: number): void => {
    setRating(value)
  }

  const handleSubmit = async (): Promise<void> => {
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
        // Stocker l'évaluation pour synchronisation ultérieure
        addPendingUpload({
          type: "submit_rating",
          data: ratingData,
          timestamp: new Date().toISOString(),
        })

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

  const handleSkip = (): void => {
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
            <IconButton icon="arrow-left" size={24} color="#212121" />
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
            <IconButton icon="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle-outline" size={50} color="#F44336" />
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
          <IconButton icon="arrow-left" size={24} color="#212121" />
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
              <IconButton icon="account" size={40} color="#FF6B00" style={styles.courierIcon} />
              <View style={styles.courierDetails}>
                <Text style={styles.courierName}>{delivery.courier.full_name}</Text>
                <Text style={styles.courierVehicle}>{delivery.courier.vehicle_type}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <IconButton icon="map-marker" size={20} color="#FF6B00" style={styles.addressIcon} />
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("rateDelivery.from")}</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                </View>
              </View>

              <View style={styles.addressDivider}>
                <View style={styles.addressDividerLine} />
              </View>

              <View style={styles.addressItem}>
                <IconButton icon="map-marker" size={20} color="#4CAF50" style={styles.addressIcon} />
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
    margin: 0,
    backgroundColor: "#FFF3E0",
    borderRadius: 20,
  },
  courierDetails: {
    marginLeft: 16,
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
    margin: 0,
    padding: 0,
  },
  addressContent: {
    flex: 1,
    marginLeft: 8,
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
