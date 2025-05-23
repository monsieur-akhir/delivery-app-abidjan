"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"
import { Card, Button } from "react-native-elements"
import CollaborativeService from "../../services/CollaborativeService"
import type { CollaborativeDelivery, CollaboratorRole } from "../../types/models"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { formatCurrency } from "../../utils/formatters"
import ErrorView from "../../components/ErrorView"

const { width } = Dimensions.get("window")

type RouteParams = {
  deliveryId: string
}

const JoinCollaborativeDeliveryScreen: React.FC = () => {
  const [delivery, setDelivery] = useState<CollaborativeDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>("secondary")
  const [sharePercentage, setSharePercentage] = useState(25)
  const [notes, setNotes] = useState("")

  const route = useRoute()
  const { deliveryId } = route.params as RouteParams
  const navigation = useNavigation()
  const { user } = useAuth()
  const { colors } = useTheme()

  const roleOptions = [
    { label: "Principal", value: "primary" as CollaboratorRole },
    { label: "Secondaire", value: "secondary" as CollaboratorRole },
    { label: "Support", value: "support" as CollaboratorRole },
  ]

  const fetchDeliveryDetails = async () => {
    try {
      setError(null)
      setLoading(true)
      const data = await CollaborativeService.getCollaborativeDelivery(deliveryId)
      setDelivery(data)

      // Set default share percentage based on role
      updateDefaultShare(selectedRole, data)
    } catch (err) {
      console.error("Error fetching delivery details:", err)
      setError("Impossible de charger les détails de la livraison")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveryDetails()
  }, [deliveryId])

  const updateDefaultShare = (role: CollaboratorRole, deliveryData?: CollaborativeDelivery) => {
    const currentDelivery = deliveryData || delivery
    if (!currentDelivery) return

    // Calculate remaining percentage
    const usedPercentage = currentDelivery.collaborators.reduce((sum, c) => sum + c.sharePercentage, 0)
    const remainingPercentage = 100 - usedPercentage

    let defaultShare: number
    switch (role) {
      case "primary":
        defaultShare = Math.min(50, remainingPercentage)
        break
      case "secondary":
        defaultShare = Math.min(30, remainingPercentage)
        break
      case "support":
        defaultShare = Math.min(20, remainingPercentage)
        break
      default:
        defaultShare = Math.min(25, remainingPercentage)
    }

    setSharePercentage(Math.max(5, defaultShare))
  }

  const handleRoleChange = (role: CollaboratorRole) => {
    setSelectedRole(role)
    updateDefaultShare(role)
  }

  const calculateEstimatedEarnings = () => {
    if (!delivery) return 0
    const platformFee = delivery.proposedPrice * 0.1
    const distributableAmount = delivery.proposedPrice - platformFee
    return distributableAmount * (sharePercentage / 100)
  }

  const getRemainingPercentage = () => {
    if (!delivery) return 100
    const usedPercentage = delivery.collaborators.reduce((sum, c) => sum + c.sharePercentage, 0)
    return 100 - usedPercentage
  }

  const canJoinWithRole = (role: CollaboratorRole) => {
    if (!delivery) return false

    // Check if role is already taken
    const roleExists = delivery.collaborators.some((c) => c.role === role)
    if (role === "primary" && roleExists) {
      return false
    }

    return true
  }

  const getRoleDescription = (role: CollaboratorRole) => {
    switch (role) {
      case "primary":
        return "Responsable principal de la livraison. Coordonne l'équipe et gère la relation client."
      case "secondary":
        return "Aide le coursier principal dans l'exécution de la livraison."
      case "support":
        return "Fournit un support logistique ou technique selon les besoins."
      default:
        return ""
    }
  }

  const handleJoinDelivery = async () => {
    if (!delivery || !user) return

    if (sharePercentage <= 0 || sharePercentage > getRemainingPercentage()) {
      Alert.alert("Erreur", "Le pourcentage de partage n'est pas valide")
      return
    }

    try {
      setJoining(true)

      await CollaborativeService.joinCollaborativeDelivery(deliveryId, {
        role: selectedRole,
        sharePercentage,
        notes: notes.trim() || undefined,
      })

      Alert.alert("Succès", "Votre demande de participation a été envoyée avec succès", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (err) {
      console.error("Error joining delivery:", err)
      Alert.alert("Erreur", "Impossible de rejoindre cette livraison. Veuillez réessayer.")
    } finally {
      setJoining(false)
    }
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchDeliveryDetails} />
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement des détails...</Text>
      </View>
    )
  }

  if (!delivery) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={50} color="#e74c3c" />
        <Text style={[styles.errorText, { color: colors.text }]}>Livraison non trouvée</Text>
      </View>
    )
  }

  const remainingPercentage = getRemainingPercentage()
  const estimatedEarnings = calculateEstimatedEarnings()

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card containerStyle={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Title>Détails de la livraison</Card.Title>
        <Card.Divider />
        <View style={styles.deliveryInfo}>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.routeText, { color: colors.text }]}>{delivery.pickupCommune}</Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
            <View style={styles.routePoint}>
              <Ionicons name="location" size={20} color="#ef4444" />
              <Text style={[styles.routeText, { color: colors.text }]}>{delivery.deliveryCommune}</Text>
            </View>
          </View>

          <View style={styles.deliveryDetails}>
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>{formatCurrency(delivery.proposedPrice)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {delivery.collaborators.length} collaborateur{delivery.collaborators.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Title>Choisir votre rôle</Card.Title>
        <Card.Divider />
        <View style={styles.roleSelection}>
          {roleOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.roleOption,
                selectedRole === option.value && { backgroundColor: colors.primary + "20" },
                !canJoinWithRole(option.value) && styles.roleOptionDisabled,
              ]}
              onPress={() => canJoinWithRole(option.value) && handleRoleChange(option.value)}
              disabled={!canJoinWithRole(option.value)}
            >
              <View style={styles.roleHeader}>
                <Text
                  style={[
                    styles.roleTitle,
                    { color: selectedRole === option.value ? colors.primary : colors.text },
                    !canJoinWithRole(option.value) && { color: colors.muted },
                  ]}
                >
                  {option.label}
                </Text>
                {!canJoinWithRole(option.value) && (
                  <Text style={[styles.unavailableText, { color: colors.muted }]}>Non disponible</Text>
                )}
              </View>
              <Text
                style={[
                  styles.roleDescription,
                  { color: colors.muted },
                  !canJoinWithRole(option.value) && { opacity: 0.5 },
                ]}
              >
                {getRoleDescription(option.value)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card }]}>
        <Card.Title>Part des gains</Card.Title>
        <Card.Divider />
        <View style={styles.shareSection}>
          <View style={styles.shareHeader}>
            <Text style={[styles.shareLabel, { color: colors.text }]}>Pourcentage demandé</Text>
            <Text style={[styles.shareValue, { color: colors.primary }]}>{sharePercentage}%</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={remainingPercentage}
            value={sharePercentage}
            onValueChange={setSharePercentage}
            step={5}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbStyle={{ backgroundColor: colors.primary }}
          />

          <View style={styles.shareInfo}>
            <Text style={[styles.shareInfoText, { color: colors.muted }]}>
              Pourcentage disponible: {remainingPercentage}%
            </Text>
            <Text style={[styles.shareInfoText, { color: colors.muted }]}>
              Gains estimés: {formatCurrency(estimatedEarnings)}
            </Text>
          </View>

          <View style={styles.earningsBreakdown}>
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>Répartition des gains</Text>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Prix total</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {formatCurrency(delivery.proposedPrice)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Frais plateforme (10%)</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                -{formatCurrency(delivery.proposedPrice * 0.1)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Montant distribuable</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {formatCurrency(delivery.proposedPrice * 0.9)}
              </Text>
            </View>
            <View style={[styles.breakdownItem, styles.breakdownTotal]}>
              <Text style={[styles.breakdownLabel, { color: colors.primary, fontWeight: "bold" }]}>
                Vos gains ({sharePercentage}%)
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.primary, fontWeight: "bold" }]}>
                {formatCurrency(estimatedEarnings)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.actionContainer}>
        <Button
          title="Rejoindre la livraison"
          onPress={handleJoinDelivery}
          buttonStyle={[styles.joinButton, { backgroundColor: colors.primary }]}
          disabled={joining || remainingPercentage <= 0}
          loading={joining}
        />

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, { color: colors.muted }]}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
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
    marginTop: 12,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryInfo: {
    padding: 8,
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  routeLine: {
    width: 2,
    height: 16,
    marginLeft: 10,
  },
  routeText: {
    fontSize: 16,
    marginLeft: 8,
  },
  deliveryDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
  roleSelection: {
    padding: 8,
  },
  roleOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  roleOptionDisabled: {
    opacity: 0.5,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  unavailableText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  shareSection: {
    padding: 8,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shareLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  shareValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 16,
  },
  shareInfo: {
    marginBottom: 20,
  },
  shareInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  earningsBreakdown: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 8,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  joinButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
  },
})

export default JoinCollaborativeDeliveryScreen
