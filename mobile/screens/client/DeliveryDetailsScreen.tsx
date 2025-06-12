` tags. I will pay close attention to indentation, structure, and completeness, and I will avoid all forbidden words.

```
<replit_final_file>
import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, Card, Button, Chip, ActivityIndicator, Divider, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useRoute, useNavigation } from "@react-navigation/native"
import MapView, { Marker } from "react-native-maps"
import DeliveryService from "../../services/DeliveryService"
import { formatPrice, formatDate, formatDistance } from "../../utils/formatters"
import type { Delivery, Bid } from "../../types/models"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"

type DeliveryDetailsRouteProp = RouteProp<RootStackParamList, "DeliveryDetails">

const DeliveryDetailsScreen: React.FC = () => {
  const route = useRoute<DeliveryDetailsRouteProp>()
  const navigation = useNavigation()
  const { deliveryId } = route.params

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  useEffect(() => {
    loadDeliveryDetails()
  }, [deliveryId])

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true)
      const [deliveryData, bidsData] = await Promise.all([
        DeliveryService.getDelivery(parseInt(deliveryId)),
        DeliveryService.getDeliveryBids(parseInt(deliveryId))
      ])
      setDelivery(deliveryData)
      setBids(bidsData)
    } catch (error) {
      console.error("Error loading delivery details:", error)
      Alert.alert("Erreur", "Impossible de charger les détails de la livraison")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelivery = () => {
    Alert.alert(
      "Annuler la livraison",
      "Êtes-vous sûr de vouloir annuler cette livraison ?",
      [
        { text: "Non", style: "cancel" },
        { text: "Oui", onPress: cancelDelivery }
      ]
    )
  }

  const cancelDelivery = async () => {
    try {
      setActionLoading(true)
      await DeliveryService.cancelDelivery(parseInt(deliveryId), "Annulée par le client")
      Alert.alert("Succès", "Livraison annulée avec succès", [
        { text: "OK", onPress: () => navigation.goBack() }
      ])
    } catch (error) {
      console.error("Error cancelling delivery:", error)
      Alert.alert("Erreur", "Impossible d'annuler la livraison")
    } finally {
      setActionLoading(false)
    }
  }

  const acceptBid = async (bidId: number) => {
    try {
      setActionLoading(true)
      await DeliveryService.acceptBid(parseInt(deliveryId), bidId)
      await loadDeliveryDetails()
      Alert.alert("Succès", "Enchère acceptée avec succès")
    } catch (error) {
      console.error("Error accepting bid:", error)
      Alert.alert("Erreur", "Impossible d'accepter l'enchère")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending": return "#FF9800"
      case "accepted": return "#2196F3"
      case "in_progress": return "#FF6B00"
      case "delivered": return "#4CAF50"
      case "cancelled": return "#F44336"
      default: return "#757575"
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending": return "En attente"
      case "accepted": return "Acceptée"
      case "in_progress": return "En cours"
      case "delivered": return "Livrée"
      case "cancelled": return "Annulée"
      default: return status
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>Livraison introuvable</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Retour
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Livraison #{delivery.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Statut */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusContainer}>
              <Text style={styles.sectionTitle}>Statut</Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(delivery.status) }]}
                textStyle={styles.statusText}
              >
                {getStatusLabel(delivery.status)}
              </Chip>
            </View>
            <Text style={styles.dateText}>Créée le {formatDate(delivery.created_at)}</Text>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{delivery.description}</Text>

            <Divider style={styles.divider} />

            <View style={styles.packageInfo}>
              <View style={styles.packageRow}>
                <Text style={styles.packageLabel}>Taille:</Text>
                <Text style={styles.packageValue}>{delivery.package_size}</Text>
              </View>
              {delivery.package_type && (
                <View style={styles.packageRow}>
                  <Text style={styles.packageLabel}>Type:</Text>
                  <Text style={styles.packageValue}>{delivery.package_type}</Text>
                </View>
              )}
              <View style={styles.packageRow}>
                <Text style={styles.packageLabel}>Fragile:</Text>
                <Text style={styles.packageValue}>{delivery.is_fragile ? "Oui" : "Non"}</Text>
              </View>
              <View style={styles.packageRow}>
                <Text style={styles.packageLabel}>Urgent:</Text>
                <Text style={styles.packageValue}>{delivery.is_urgent ? "Oui" : "Non"}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Adresses */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Itinéraire</Text>

            <View style={styles.addressContainer}>
              <View style={styles.addressRow}>
                <View style={styles.addressDot} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Ramassage</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                  <Text style={styles.communeText}>{delivery.pickup_commune}</Text>
                </View>
              </View>

              <View style={styles.addressLine} />

              <View style={styles.addressRow}>
                <View style={[styles.addressDot, styles.destinationDot]} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Livraison</Text>
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                  <Text style={styles.communeText}>{delivery.delivery_commune}</Text>
                </View>
              </View>
            </View>

            {delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: (delivery.pickup_lat + delivery.delivery_lat) / 2,
                    longitude: (delivery.pickup_lng + delivery.delivery_lng) / 2,
                    latitudeDelta: Math.abs(delivery.pickup_lat - delivery.delivery_lat) * 1.5 || 0.01,
                    longitudeDelta: Math.abs(delivery.pickup_lng - delivery.delivery_lng) * 1.5 || 0.01,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: delivery.pickup_lat, longitude: delivery.pickup_lng }}
                    title="Ramassage"
                    pinColor="#FF6B00"
                  />
                  <Marker
                    coordinate={{ latitude: delivery.delivery_lat, longitude: delivery.delivery_lng }}
                    title="Livraison"
                    pinColor="#4CAF50"
                  />
                </MapView>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Prix */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Tarification</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Prix proposé:</Text>
              <Text style={styles.priceValue}>{formatPrice(delivery.proposed_price)} FCFA</Text>
            </View>
            {delivery.final_price && delivery.final_price !== delivery.proposed_price && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Prix final:</Text>
                <Text style={styles.finalPriceValue}>{formatPrice(delivery.final_price)} FCFA</Text>
              </View>
            )}
            {delivery.distance && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Distance:</Text>
                <Text style={styles.priceValue}>{formatDistance(delivery.distance)}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Enchères */}
        {bids.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Enchères ({bids.length})</Text>
              {bids.map((bid) => (
                <View key={bid.id} style={styles.bidContainer}>
                  <View style={styles.bidHeader}>
                    <Text style={styles.courierName}>Coursier #{bid.courier_id}</Text>
                    <Text style={styles.bidPrice}>{formatPrice(bid.proposed_price)} FCFA</Text>
                  </View>
                  {bid.message && (
                    <Text style={styles.bidMessage}>{bid.message}</Text>
                  )}
                  <View style={styles.bidFooter}>
                    <Text style={styles.bidDate}>{formatDate(bid.created_at)}</Text>
                    {delivery.status === "pending" && bid.status === "pending" && (
                      <Button
                        mode="contained"
                        size="small"
                        onPress={() => acceptBid(bid.id)}
                        loading={actionLoading}
                        style={styles.acceptButton}
                      >
                        Accepter
                      </Button>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.actionsContainer}>
              {delivery.status === "pending" && (
                <Button
                  mode="outlined"
                  onPress={handleCancelDelivery}
                  loading={actionLoading}
                  style={styles.cancelButton}
                  textColor="#F44336"
                >
                  Annuler
                </Button>
              )}

              {delivery.status === "in_progress" && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("TrackDelivery", { deliveryId: deliveryId })}
                  style={styles.trackButton}
                >
                  Suivre la livraison
                </Button>
              )}

              {delivery.status === "delivered" && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("RateDelivery", { deliveryId: deliveryId })}
                  style={styles.rateButton}
                >
                  Noter la livraison
                </Button>
              )}
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  content: {
    flex: 1,
    padding: 16,
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
    fontSize: 18,
    color: "#757575",
    marginTop: 16,
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 12,
    color: "#757575",
  },
  description: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
  },
  divider: {
    marginVertical: 16,
  },
  packageInfo: {
    marginTop: 8,
  },
  packageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  packageLabel: {
    fontSize: 14,
    color: "#757575",
  },
  packageValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B00",
    marginTop: 4,
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: "#4CAF50",
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginLeft: 5,
    marginBottom: 8,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: "#212121",
  },
  communeText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 16,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#757575",
  },
  priceValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  finalPriceValue: {
    fontSize: 16,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  bidContainer: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  courierName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  bidPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  bidMessage: {
    fontSize: 13,
    color: "#424242",
    marginBottom: 8,
  },
  bidFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bidDate: {
    fontSize: 12,
    color: "#757575",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  actionsContainer: {
    gap: 12,
  },
  cancelButton: {
    borderColor: "#F44336",
  },
  trackButton: {
    backgroundColor: "#FF6B00",
  },
  rateButton: {
    backgroundColor: "#4CAF50",
  },
})

export default DeliveryDetailsScreen