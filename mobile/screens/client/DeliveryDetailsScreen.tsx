"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Text, Card, Button, Chip, Divider, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, cancelDelivery } from "../../services/api"
import { formatPrice, formatDate } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery, DeliveryStatus } from "../../types/models"

type DeliveryDetailsScreenProps = {
  route: RouteProp<RootStackParamList, "DeliveryDetails">
  navigation: NativeStackNavigationProp<RootStackParamList, "DeliveryDetails">
}

interface StatusStep {
  status: DeliveryStatus
  label: string
  description: string
  icon: string
  color: string
  completed: boolean
  current: boolean
}

const DeliveryDetailsScreen: React.FC<DeliveryDetailsScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected } = useNetwork()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [cancelling, setCancelling] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    loadDeliveryDetails()
  }, [deliveryId])

  const loadDeliveryDetails = async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError(t("deliveryDetails.errorLoadingDelivery"))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelivery = (): void => {
    Alert.alert(t("deliveryDetails.cancelDelivery"), t("deliveryDetails.cancelDeliveryConfirmation"), [
      {
        text: t("common.no"),
        style: "cancel",
      },
      {
        text: t("common.yes"),
        onPress: confirmCancelDelivery,
      },
    ])
  }

  const confirmCancelDelivery = async (): Promise<void> => {
    if (!isConnected) {
      Alert.alert(t("common.offlineTitle"), t("deliveryDetails.offlineCancelDelivery"))
      return
    }

    try {
      setCancelling(true)
      await cancelDelivery(deliveryId)

      // Mettre à jour les détails de la livraison
      await loadDeliveryDetails()

      Alert.alert(t("deliveryDetails.deliveryCancelled"), t("deliveryDetails.deliveryCancelledMessage"))
    } catch (error) {
      console.error("Error cancelling delivery:", error)
      setError(error instanceof Error ? error.message : t("deliveryDetails.errorCancellingDelivery"))
    } finally {
      setCancelling(false)
    }
  }

  const viewBids = (): void => {
    navigation.navigate("Bids", { deliveryId })
  }

  const trackDelivery = (): void => {
    navigation.navigate("TrackDelivery", { deliveryId })
  }

  const makePayment = (): void => {
    if (delivery) {
      navigation.navigate("Payment", {
        deliveryId,
        amount: delivery.final_price || delivery.proposed_price,
      })
    }
  }

  const rateDelivery = (): void => {
    navigation.navigate("RateDelivery", { deliveryId })
  }

  const getStatusSteps = (status: DeliveryStatus): StatusStep[] => {
    const steps: StatusStep[] = [
      {
        status: "pending",
        label: t("deliveryStatus.pending"),
        description: t("deliveryStatus.pendingDescription"),
        icon: "clock-outline",
        color: "#FFC107",
        completed: ["pending", "accepted", "picked_up", "in_progress", "delivered"].includes(status),
        current: status === "pending",
      },
      {
        status: "accepted",
        label: t("deliveryStatus.accepted"),
        description: t("deliveryStatus.acceptedDescription"),
        icon: "check-circle-outline",
        color: "#2196F3",
        completed: ["accepted", "picked_up", "in_progress", "delivered"].includes(status),
        current: status === "accepted",
      },
      {
        status: "picked_up",
        label: t("deliveryStatus.pickedUp"),
        description: t("deliveryStatus.pickedUpDescription"),
        icon: "package-up",
        color: "#FF9800",
        completed: ["picked_up", "in_progress", "delivered"].includes(status),
        current: status === "picked_up",
      },
      {
        status: "in_progress",
        label: t("deliveryStatus.inProgress"),
        description: t("deliveryStatus.inProgressDescription"),
        icon: "motorbike",
        color: "#FF6B00",
        completed: ["in_progress", "delivered"].includes(status),
        current: status === "in_progress",
      },
      {
        status: "delivered",
        label: t("deliveryStatus.delivered"),
        description: t("deliveryStatus.deliveredDescription"),
        icon: "check-circle",
        color: "#4CAF50",
        completed: ["delivered"].includes(status),
        current: status === "delivered",
      },
    ]

    return steps
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("deliveryDetails.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("deliveryDetails.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("deliveryDetails.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle-outline" size={50} color="#F44336" />
          <Text style={styles.errorText}>{error || t("deliveryDetails.deliveryNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.back")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const statusSteps = getStatusSteps(delivery.status)
  const isCancellable = ["pending", "accepted"].includes(delivery.status)
  const showBidsButton = delivery.status === "pending"
  const showTrackButton = ["accepted", "picked_up", "in_progress"].includes(delivery.status)
  const showPayButton = delivery.status === "delivered" && !delivery.is_paid
  const showRateButton = delivery.status === "delivered" && !delivery.rating

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("deliveryDetails.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.deliveryCard}>
          <Card.Content>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryId}>#{deliveryId}</Text>
              <Chip
                icon={delivery.status === "cancelled" ? "close-circle" : undefined}
                style={[styles.statusChip, delivery.status === "cancelled" && styles.cancelledChip]}
              >
                {delivery.status === "pending"
                  ? t("deliveryStatus.pending")
                  : delivery.status === "accepted"
                    ? t("deliveryStatus.accepted")
                    : delivery.status === "picked_up"
                      ? t("deliveryStatus.pickedUp")
                      : delivery.status === "in_progress"
                        ? t("deliveryStatus.inProgress")
                        : delivery.status === "delivered"
                          ? t("deliveryStatus.delivered")
                          : t("deliveryStatus.cancelled")}
              </Chip>
            </View>

            <Text style={styles.createdAt}>{formatDate(delivery.created_at)}</Text>

            {delivery.status !== "cancelled" && (
              <View style={styles.statusStepsContainer}>
                {statusSteps.map((step, index) => (
                  <View key={step.status} style={styles.statusStep}>
                    <View
                      style={[
                        styles.statusIcon,
                        step.completed && styles.completedIcon,
                        step.current && styles.currentIcon,
                        { backgroundColor: step.completed || step.current ? step.color : "#E0E0E0" },
                      ]}
                    >
                      <IconButton icon={step.icon} size={16} color="#FFFFFF" style={styles.icon} />
                    </View>

                    {index < statusSteps.length - 1 && (
                      <View style={[styles.statusLine, step.completed && styles.completedLine]} />
                    )}

                    <Text style={[styles.statusLabel, step.current && { color: step.color, fontWeight: "bold" }]}>
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("deliveryDetails.details")}</Text>

            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <IconButton icon="map-marker" size={20} color="#FF6B00" style={styles.addressIcon} />
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("deliveryDetails.from")}</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                  <Text style={styles.communeText}>{delivery.pickup_commune}</Text>
                </View>
              </View>

              <View style={styles.addressDivider}>
                <View style={styles.addressDividerLine} />
              </View>

              <View style={styles.addressItem}>
                <IconButton icon="map-marker" size={20} color="#4CAF50" style={styles.addressIcon} />
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("deliveryDetails.to")}</Text>
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                  <Text style={styles.communeText}>{delivery.delivery_commune}</Text>
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.packageDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("deliveryDetails.packageSize")}</Text>
                <Chip icon="package-variant" style={styles.detailChip}>
                  {delivery.package_size === "small"
                    ? t("deliveryDetails.small")
                    : delivery.package_size === "medium"
                      ? t("deliveryDetails.medium")
                      : t("deliveryDetails.large")}
                </Chip>
              </View>

              {delivery.package_type && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t("deliveryDetails.packageType")}</Text>
                  <Chip icon="tag" style={styles.detailChip}>
                    {delivery.package_type}
                  </Chip>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("deliveryDetails.fragile")}</Text>
                <Chip icon={delivery.is_fragile ? "check" : "close"} style={styles.detailChip}>
                  {delivery.is_fragile ? t("common.yes") : t("common.no")}
                </Chip>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t("deliveryDetails.urgent")}</Text>
                <Chip icon={delivery.is_urgent ? "check" : "close"} style={styles.detailChip}>
                  {delivery.is_urgent ? t("common.yes") : t("common.no")}
                </Chip>
              </View>
            </View>

            {delivery.description && (
              <>
                <Divider style={styles.divider} />

                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>{t("deliveryDetails.description")}</Text>
                  <Text style={styles.descriptionText}>{delivery.description}</Text>
                </View>
              </>
            )}

            {delivery.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>{t("deliveryDetails.notes")}</Text>
                <Text style={styles.notesText}>{delivery.notes}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.priceCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("deliveryDetails.pricing")}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t("deliveryDetails.proposedPrice")}</Text>
              <Text style={styles.priceValue}>{formatPrice(delivery.proposed_price)} FCFA</Text>
            </View>

            {delivery.final_price && delivery.final_price !== delivery.proposed_price && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t("deliveryDetails.finalPrice")}</Text>
                <Text style={styles.priceValue}>{formatPrice(delivery.final_price)} FCFA</Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t("deliveryDetails.paymentStatus")}</Text>
              <Chip
                icon={delivery.is_paid ? "check-circle" : "clock-outline"}
                style={[styles.paymentChip, delivery.is_paid ? styles.paidChip : styles.unpaidChip]}
              >
                {delivery.is_paid ? t("deliveryDetails.paid") : t("deliveryDetails.unpaid")}
              </Chip>
            </View>

            {delivery.payment_method && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t("deliveryDetails.paymentMethod")}</Text>
                <Text style={styles.priceValue}>{delivery.payment_method}</Text>
              </View>
            )}

            {delivery.distance && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t("deliveryDetails.distance")}</Text>
                <Text style={styles.priceValue}>{delivery.distance} km</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {delivery.courier && (
          <Card style={styles.courierCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t("deliveryDetails.courier")}</Text>

              <View style={styles.courierInfo}>
                <IconButton icon="account" size={40} color="#FF6B00" style={styles.courierIcon} />
                <View style={styles.courierDetails}>
                  <Text style={styles.courierName}>{delivery.courier.full_name}</Text>
                  <View style={styles.courierMeta}>
                    <IconButton icon="star" size={16} color="#FFC107" style={styles.ratingIcon} />
                    <Text style={styles.ratingText}>{delivery.courier.rating.toFixed(1)}</Text>
                    <Chip icon="motorbike" style={styles.vehicleChip}>
                      {delivery.courier.vehicle_type}
                    </Chip>
                  </View>
                </View>
              </View>

              {delivery.courier.phone && (
                <Button
                  mode="outlined"
                  icon="phone"
                  onPress={() => {
                    /* Implémenter l'appel */
                  }}
                  style={styles.callButton}
                >
                  {t("deliveryDetails.callCourier")}
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {delivery.rating && (
          <Card style={styles.ratingCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t("deliveryDetails.yourRating")}</Text>

              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <IconButton
                      key={star}
                      icon="star"
                      size={24}
                      color={star <= delivery.rating.rating ? "#FFC107" : "#E0E0E0"}
                      style={styles.starIcon}
                    />
                  ))}
                </View>

                <Text style={styles.ratingValue}>{delivery.rating.rating.toFixed(1)}</Text>
              </View>

              {delivery.rating.comment && (
                <View style={styles.commentContainer}>
                  <Text style={styles.commentLabel}>{t("deliveryDetails.yourComment")}</Text>
                  <Text style={styles.commentText}>{delivery.rating.comment}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        <View style={styles.actionsContainer}>
          {isCancellable && (
            <Button
              mode="outlined"
              icon="close-circle"
              onPress={handleCancelDelivery}
              style={styles.cancelButton}
              loading={cancelling}
              disabled={cancelling}
            >
              {t("deliveryDetails.cancelDelivery")}
            </Button>
          )}

          {showBidsButton && (
            <Button mode="contained" icon="gavel" onPress={viewBids} style={styles.actionButton}>
              {t("deliveryDetails.viewBids")}
            </Button>
          )}

          {showTrackButton && (
            <Button mode="contained" icon="map-marker-path" onPress={trackDelivery} style={styles.actionButton}>
              {t("deliveryDetails.trackDelivery")}
            </Button>
          )}

          {showPayButton && (
            <Button mode="contained" icon="cash" onPress={makePayment} style={styles.actionButton}>
              {t("deliveryDetails.makePayment")}
            </Button>
          )}

          {showRateButton && (
            <Button mode="contained" icon="star" onPress={rateDelivery} style={styles.actionButton}>
              {t("deliveryDetails.rateDelivery")}
            </Button>
          )}
        </View>
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
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  statusChip: {
    backgroundColor: "#F5F5F5",
  },
  cancelledChip: {
    backgroundColor: "#FFEBEE",
  },
  createdAt: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  statusStepsContainer: {
    marginTop: 8,
  },
  statusStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
  },
  completedIcon: {
    backgroundColor: "#4CAF50",
  },
  currentIcon: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 2,
  },
  icon: {
    margin: 0,
    padding: 0,
  },
  statusLine: {
    width: 20,
    height: 2,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  completedLine: {
    backgroundColor: "#4CAF50",
  },
  statusLabel: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 16,
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
    fontWeight: "bold",
    color: "#212121",
    marginTop: 2,
  },
  communeText: {
    fontSize: 12,
    color: "#757575",
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
  divider: {
    marginVertical: 16,
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
  },
  detailChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: "#212121",
    lineHeight: 20,
  },
  notesContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#212121",
    lineHeight: 20,
  },
  priceCard: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: "#757575",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  paymentChip: {
    height: 28,
  },
  paidChip: {
    backgroundColor: "#E8F5E9",
  },
  unpaidChip: {
    backgroundColor: "#FFF8E1",
  },
  courierCard: {
    marginBottom: 16,
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  courierIcon: {
    margin: 0,
    backgroundColor: "#FFF3E0",
    borderRadius: 20,
  },
  courierDetails: {
    marginLeft: 16,
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  courierMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingIcon: {
    margin: 0,
    padding: 0,
  },
  ratingText: {
    fontSize: 14,
    color: "#212121",
    marginRight: 8,
  },
  vehicleChip: {
    backgroundColor: "#F5F5F5",
    height: 24,
  },
  callButton: {
    borderColor: "#4CAF50",
  },
  ratingCard: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
  },
  starIcon: {
    margin: 0,
    padding: 0,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginLeft: 8,
  },
  commentContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: "#212121",
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  cancelButton: {
    marginBottom: 12,
    borderColor: "#F44336",
  },
  actionButton: {
    marginBottom: 12,
    backgroundColor: "#FF6B00",
  },
})

export default DeliveryDetailsScreen
