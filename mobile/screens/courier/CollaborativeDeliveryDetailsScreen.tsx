"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native"
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { Avatar, Badge } from "react-native-paper"
import { Card, Divider, Button } from "react-native-paper"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import CollaborativeService from "../../services/CollaborativeService"
import { formatCurrency, formatDate, formatTime } from "../../utils/formatters"
import type { CollaborativeDelivery, Collaborator, CollaboratorRole } from "../../types/models"
import type { RootStackParamList } from "../../types/navigation"

type ParamList = {
  CollaborativeDeliveryDetails: {
    deliveryId: string
  }
}

const CollaborativeDeliveryDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, "CollaborativeDeliveryDetails">>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "CollaborativeDeliveryDetails">>()
  const { deliveryId } = route.params

  const [delivery, setDelivery] = useState<CollaborativeDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const loadDeliveryDetails = useCallback(async () => {
    try {
      setLoading(true)
      const data = await CollaborativeService.getDeliveryById(deliveryId)
      setDelivery(data)
      setError(null)
    } catch (err) {
      setError("Impossible de charger les détails de la livraison")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [deliveryId])

  useEffect(() => {
    loadDeliveryDetails()
  }, [loadDeliveryDetails])

  const handleJoinDelivery = () => {
    navigation.navigate("JoinCollaborativeDelivery", { deliveryId })
  }

  const handleStartDelivery = async () => {
    if (!delivery) return

    try {
      setJoining(true)
      await CollaborativeService.startDelivery(deliveryId)
      // Update local state
      setDelivery({
        ...delivery,
        status: "in_progress",
        pickupAt: new Date().toISOString(),
      })
      Alert.alert("Succès", "Vous avez commencé la livraison")
    } catch (err) {
      Alert.alert("Erreur", "Impossible de commencer la livraison")
      console.error(err)
    } finally {
      setJoining(false)
    }
  }

  const handleCompleteDelivery = async () => {
    if (!delivery) return

    try {
      setJoining(true)
      await CollaborativeService.completeDelivery(deliveryId)
      // Update local state
      setDelivery({
        ...delivery,
        status: "completed",
        deliveredAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      })
      Alert.alert("Succès", "Livraison terminée avec succès")
    } catch (err) {
      Alert.alert("Erreur", "Impossible de terminer la livraison")
      console.error(err)
    } finally {
      setJoining(false)
    }
  }

  const handleCancelDelivery = () => {
    Alert.alert("Annuler la livraison", "Êtes-vous sûr de vouloir annuler cette livraison ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        style: "destructive",
        onPress: async () => {
          if (!delivery) return

          try {
            setJoining(true)
            await CollaborativeService.cancelDelivery(deliveryId)
            // Update local state
            setDelivery({
              ...delivery,
              status: "cancelled",
              cancelledAt: new Date().toISOString(),
            })
            Alert.alert("Succès", "Livraison annulée")
          } catch (err) {
            Alert.alert("Erreur", "Impossible d'annuler la livraison")
            console.error(err)
          } finally {
            setJoining(false)
          }
        },
      },
    ])
  }

  const handleChatWithTeam = () => {
    navigation.navigate("CollaborativeChat", { deliveryId })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    )
  }

  if (error || !delivery) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error || "Une erreur est survenue"}</Text>
        <Button
          mode="contained"
          onPress={loadDeliveryDetails}
          style={styles.retryButton}
        >
          Réessayer
        </Button>
      </View>
    )
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "#f39c12"
      case "accepted":
        return "#3498db"
      case "in_progress":
        return "#2ecc71"
      case "completed":
        return "#27ae60"
      case "cancelled":
        return "#e74c3c"
      default:
        return "#95a5a6"
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "En attente"
      case "accepted":
        return "Acceptée"
      case "in_progress":
        return "En cours"
      case "completed":
        return "Terminée"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  const getRoleLabel = (role: CollaboratorRole): string => {
    switch (role) {
      case "primary":
        return "Principal"
      case "secondary":
        return "Secondaire"
      case "support":
        return "Support"
      default:
        return "Membre"
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Title title={`Livraison collaborative #${delivery.id.toString().substring(0, 8)}`} />
        <Divider />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.deliveryId}>ID: {delivery.id.toString().substring(0, 8)}</Text>
            <Badge
              style={{ backgroundColor: getStatusColor(delivery.status) }}
            >
              {getStatusLabel(delivery.status)}
            </Badge>
          </View>
          <Text style={styles.price}>{formatCurrency(delivery.proposedPrice || 0)}</Text>
        </View>
        <Text style={styles.date}>Créée le {formatDate(delivery.createdAt)}</Text>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Trajet" />
        <Divider />
        <View style={styles.locationContainer}>
          <View style={styles.locationItem}>
            <Ionicons name="location-outline" size={24} color="#3498db" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Ramassage</Text>
              <Text style={styles.locationText}>{delivery.pickupCommune}</Text>
              <Text style={styles.locationAddress}>{delivery.pickupAddress}</Text>
            </View>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.locationItem}>
            <Ionicons name="location" size={24} color="#e74c3c" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Livraison</Text>
              <Text style={styles.locationText}>{delivery.deliveryCommune}</Text>
              <Text style={styles.locationAddress}>{delivery.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: 5.36, // Abidjan latitude
              longitude: -4.0083, // Abidjan longitude
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{ latitude: 5.35, longitude: -4.01 }}
              title="Ramassage"
              description={delivery.pickupAddress || "Unknown Address"}
              pinColor="#3498db"
            />
            <Marker
              coordinate={{ latitude: 5.37, longitude: -4.0 }}
              title="Livraison"
              description={delivery.deliveryAddress || "Unknown Address"}
              pinColor="#e74c3c"
            />
          </MapView>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="directions-car" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>{delivery.estimatedDistance || "?"} km</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>{delivery.estimatedDuration || "?"} min</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Détails du colis" />
        <Divider />
        <View style={styles.packageDetails}>
          <Text style={styles.packageDescription}>{delivery.packageDescription}</Text>
          <View style={styles.packageRow}>
            <View style={styles.packageItem}>
              <FontAwesome5 name="weight" size={16} color="#7f8c8d" />
              <Text style={styles.packageItemText}>{delivery.packageWeight || "?"} kg</Text>
            </View>
            <View style={styles.packageItem}>
              <MaterialIcons name="straighten" size={16} color="#7f8c8d" />
              <Text style={styles.packageItemText}>{delivery.packageSize || "Standard"}</Text>
            </View>
            {delivery.is_fragile && (
              <View style={styles.packageItem}>
                <MaterialIcons name="warning" size={16} color="#f39c12" />
                <Text style={styles.packageItemText}>Fragile</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Équipe de livraison" />
        <Divider />
        {delivery.collaborators.length > 0 ? (
          delivery.collaborators.map((collaborator: Collaborator, index: number) => (
            <View key={collaborator.id}>
              <View style={styles.collaboratorItem}>
                <Avatar.Text 
                  size={40}
                  label={collaborator.courierName.charAt(0)}
                  style={{ backgroundColor: "#3498db" }}
                />
                <View style={styles.collaboratorInfo}>
                  <Text style={styles.collaboratorName}>{collaborator.courierName}</Text>
                  <View style={styles.collaboratorDetails}>
                    <Badge style={{ backgroundColor: "#3498db" }}>
                      {getRoleLabel(collaborator.role)}
                    </Badge>
                    <Text style={styles.collaboratorShare}>{collaborator.sharePercentage}%</Text>
                  </View>
                </View>
                <Badge style={{ backgroundColor: getStatusColor(collaborator.status) }}>
                  {getStatusLabel(collaborator.status)}
                </Badge>
              </View>
              {index < delivery.collaborators.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))
        ) : (
          <Text style={styles.noCollaborators}>Aucun collaborateur pour cette livraison</Text>
        )}

        <Button
          mode="contained"
          icon="chat"
          onPress={handleChatWithTeam}
          style={styles.chatButton}
        >
          Chat d{"'"}équipe
        </Button>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Chronologie" />
        <Divider />
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: "#3498db" }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Livraison créée</Text>
              <Text style={styles.timelineDate}>{formatTime(delivery.createdAt)}</Text>
            </View>
          </View>

          {delivery.acceptedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: "#3498db" }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Livraison acceptée</Text>
                <Text style={styles.timelineDate}>{formatTime(delivery.acceptedAt)}</Text>
              </View>
            </View>
          )}

          {delivery.pickupAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: "#3498db" }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Colis récupéré</Text>
                <Text style={styles.timelineDate}>{formatTime(delivery.pickupAt)}</Text>
              </View>
            </View>
          )}

          {delivery.deliveredAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: "#3498db" }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Colis livré</Text>
                <Text style={styles.timelineDate}>{formatTime(delivery.deliveredAt)}</Text>
              </View>
            </View>
          )}

          {delivery.completedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: "#27ae60" }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Livraison terminée</Text>
                <Text style={styles.timelineDate}>{formatTime(delivery.completedAt)}</Text>
              </View>
            </View>
          )}

          {delivery.cancelledAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: "#e74c3c" }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Livraison annulée</Text>
                <Text style={styles.timelineDate}>{formatTime(delivery.cancelledAt)}</Text>
              </View>
            </View>
          )}
        </View>
      </Card>

      <View style={styles.actionsContainer}>
        {delivery.status === "pending" && (
          <Button
            mode="contained"
            onPress={handleJoinDelivery}
            style={styles.joinButton}
            disabled={joining}
          >
            Rejoindre la livraison
          </Button>
        )}

        {delivery.status === "accepted" && (
          <Button
            mode="contained"
            onPress={handleStartDelivery}
            style={styles.startButton}
            disabled={joining}
          >
            Commencer la livraison
          </Button>
        )}

        {delivery.status === "in_progress" && (
          <Button
            mode="contained"
            onPress={handleCompleteDelivery}
            style={styles.completeButton}
            disabled={joining}
          >
            Terminer la livraison
          </Button>
        )}

        {["pending", "accepted", "in_progress"].includes(delivery.status) && (
          <Button
            mode="outlined"
            onPress={handleCancelDelivery}
            style={styles.cancelButton}
            disabled={joining}
          >
            Annuler
          </Button>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 30,
  },
  headerCard: {
    borderRadius: 10,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    marginTop: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ecc71",
  },
  date: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 5,
  },
  card: {
    borderRadius: 10,
    marginBottom: 10,
  },
  locationContainer: {
    marginBottom: 15,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  locationTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  locationAddress: {
    fontSize: 14,
    color: "#34495e",
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: "#bdc3c7",
    marginLeft: 12,
    marginBottom: 10,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#34495e",
  },
  packageDetails: {
    padding: 5,
  },
  packageDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  packageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  packageItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  packageItemText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#34495e",
  },
  collaboratorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  collaboratorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  collaboratorDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  collaboratorShare: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 5,
  },
  divider: {
    marginVertical: 5,
  },
  noCollaborators: {
    textAlign: "center",
    color: "#7f8c8d",
    padding: 10,
  },
  chatButton: {
    marginTop: 10,
    backgroundColor: "#3498db",
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 15,
    position: "relative",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    left: -6,
    top: 5,
  },
  timelineContent: {
    marginLeft: 10,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  timelineDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  actionsContainer: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  buttonContainer: {
    width: "48%",
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: "#3498db",
  },
  startButton: {
    backgroundColor: "#2ecc71",
  },
  completeButton: {
    backgroundColor: "#27ae60",
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
  },
})

export default CollaborativeDeliveryDetailsScreen
