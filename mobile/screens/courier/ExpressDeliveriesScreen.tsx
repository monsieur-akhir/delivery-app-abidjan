import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { Text, Card, Chip, Button, IconButton, FAB } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useDelivery } from "../../hooks"
import type { Delivery } from "../../types/models"
import type { RootStackParamList } from "../../types/navigation"
import DeliveryStatusBadge from "../../components/DeliveryStatusBadge"
import EmptyState from "../../components/EmptyState"
import ErrorView from "../../components/ErrorView"
import { formatCurrency, formatDate, formatDistance } from "../../utils/formatters"
const ExpressDeliveriesScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { colors } = useTheme()

  const {
    deliveries,
    isLoading,
    error
  } = useDelivery()

  const loading = isLoading
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'in_progress'>('pending')

  const acceptDelivery = async (id: number) => {
    try {
      await DeliveryService.acceptDelivery(id.toString())
    } catch (error) {
      console.error('Error accepting delivery:', error)
    }
  }

  const startDelivery = async (id: number) => {
    try {
      await DeliveryService.startDelivery(id.toString())
    } catch (error) {
      console.error('Error starting delivery:', error)
    }
  }

  const loadExpressDeliveries = useCallback(async () => {
    try {
      // Load express deliveries logic would go here
    } catch (err) {
      console.error("Error loading express deliveries:", err)
    }
  }, [filter])

  useEffect(() => {
    loadExpressDeliveries()
  }, [filter, loadExpressDeliveries])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadExpressDeliveries()
    setRefreshing(false)
  }
  const handleAcceptDelivery = async (deliveryId: number) => {
    try {
      await acceptDelivery(deliveryId)
      Alert.alert(t("success"), t("delivery.acceptedSuccessfully"))
      await loadExpressDeliveries()
    } catch (err) {
      Alert.alert(t("error"), t("delivery.acceptError"))
    }
  }
  const handleStartDelivery = async (deliveryId: number) => {
    try {
      await startDelivery(deliveryId)
      Alert.alert(t("success"), t("delivery.startedSuccessfully"))
      navigation.navigate("CourierTrackDelivery", { deliveryId: deliveryId.toString() })
    } catch (err) {
      Alert.alert(t("error"), t("delivery.startError"))
    }
  }

  const getUrgencyLevel = (delivery: Delivery) => {
    const createdAt = new Date(delivery.created_at)
    const now = new Date()
    const timeDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60) // minutes

    if (timeDiff < 15) return { level: 'high', color: '#f44336', text: 'Très urgent' }
    if (timeDiff < 30) return { level: 'medium', color: '#FF9800', text: 'Urgent' }
    return { level: 'low', color: '#4CAF50', text: 'Normal' }
  }

  const getPriorityScore = (delivery: Delivery) => {
    const urgency = getUrgencyLevel(delivery)
    const priceScore = (delivery.proposed_price || 0) / 1000
    const distanceScore = Math.max(0, 10 - (delivery.estimated_distance || 0))

    return urgency.level === 'high' ? priceScore + distanceScore + 5 :
           urgency.level === 'medium' ? priceScore + distanceScore + 2 :
           priceScore + distanceScore
  }

  const sortedDeliveries = [...(deliveries || [])].sort((a, b) => {
    return getPriorityScore(b) - getPriorityScore(a)
  })
  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const urgency = getUrgencyLevel(item)
    const canAccept = filter === 'pending' && item.status === 'pending'
    const canStart = filter === 'accepted' && item.status === 'accepted'

    return (
      <Card style={[styles.deliveryCard, { backgroundColor: colors.card }]}>
        <Card.Content>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text style={[styles.deliveryId, { color: colors.text }]}>
                #{item.id}
              </Text>
              <Chip
                style={[styles.urgencyChip, { backgroundColor: urgency.color + '20' }]}
                textStyle={{ color: urgency.color, fontSize: 12 }}
              >
                {urgency.text}
              </Chip>
            </View>
            <Text style={[styles.deliveryPrice, { color: colors.primary }]}>
              {formatCurrency(item.proposed_price || 0)} FCFA
            </Text>
          </View>

          {/* Addresses */}
          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <Ionicons name="radio-button-on" size={12} color={colors.primary} />
              <View style={styles.addressText}>
                <Text style={[styles.addressLabel, { color: colors.text }]}>
                  {t("delivery.pickup")}
                </Text>
                <Text style={[styles.addressValue, { color: colors.text }]} numberOfLines={1}>
                  {item.pickup_address}
                </Text>
              </View>
            </View>

            <View style={styles.addressLine} />

            <View style={styles.addressRow}>
              <Ionicons name="location" size={12} color="#4CAF50" />
              <View style={styles.addressText}>
                <Text style={[styles.addressLabel, { color: colors.text }]}>
                  {t("delivery.delivery")}
                </Text>
                <Text style={[styles.addressValue, { color: colors.text }]} numberOfLines={1}>
                  {item.delivery_address}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>

            {item.estimated_distance && (
              <View style={styles.detailItem}>
                <Ionicons name="map" size={16} color={colors.text} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {formatDistance(item.estimated_distance)}
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <DeliveryStatusBadge status={item.status} />
            </View>
          </View>

          {/* Package Info */}
          {item.description && (
            <View style={styles.packageInfo}>
              <Text style={[styles.packageLabel, { color: colors.text }]}>
                {t("delivery.package")}:
              </Text>
              <Text style={[styles.packageText, { color: colors.text }]} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {canAccept && (
              <>                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: item.id.toString() })}
                  style={styles.actionButton}
                >
                  {t("delivery.viewDetails")}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleAcceptDelivery(Number(item.id))}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  {t("delivery.accept")}
                </Button>
              </>
            )}

            {canStart && (
              <>                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: item.id.toString() })}
                  style={styles.actionButton}
                >
                  {t("delivery.viewDetails")}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleStartDelivery(Number(item.id))}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                  {t("delivery.start")}
                </Button>
              </>
            )}

            {filter === 'in_progress' && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate("CourierTrackDelivery", { deliveryId: item.id.toString() })}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
              >
                {t("delivery.track")}
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadExpressDeliveries} />
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("express.title")}
        </Text>
        <View style={{ width: 24 }} />
      </View>      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <Chip
          selected={filter === 'pending'}
          onPress={() => setFilter('pending')}
          style={[styles.filterChip, filter === 'pending' && { backgroundColor: colors.primary + '20' }]}
          textStyle={filter === 'pending' ? { color: colors.primary } : { color: colors.text }}
        >
          {t("express.available")}
        </Chip>
        <Chip
          selected={filter === 'accepted'}
          onPress={() => setFilter('accepted')}
          style={[styles.filterChip, filter === 'accepted' && { backgroundColor: colors.primary + '20' }]}
          textStyle={filter === 'accepted' ? { color: colors.primary } : { color: colors.text }}
        >
          {t("express.accepted")}
        </Chip>
        <Chip
          selected={filter === 'in_progress'}
          onPress={() => setFilter('in_progress')}
          style={[styles.filterChip, filter === 'in_progress' && { backgroundColor: colors.primary + '20' }]}
          textStyle={filter === 'in_progress' ? { color: colors.primary } : { color: colors.text }}
        >
          {t("express.inProgress")}
        </Chip>
      </View>

      {/* Deliveries List */}
      {sortedDeliveries.length === 0 && !loading ? (
        <EmptyState
          icon="zap"
          title={t("express.noDeliveries")}
          message={t("express.noDeliveriesMessage")}
          buttonText={t("express.refresh")}
          onButtonPress={onRefresh}
        />
      ) : (
        <FlatList
          data={sortedDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB for Emergency Mode */}
      <FAB
        icon="flash"
        style={[styles.fab, { backgroundColor: '#f44336' }]}
        onPress={() => {
          Alert.alert(
            t("express.emergencyMode"),
            t("express.emergencyModeDescription"),
            [
              { text: t("common.cancel"), style: "cancel" },              { text: t("common.activate"), onPress: () => {
                // Activate emergency mode
                setFilter('pending')
                loadExpressDeliveries()
              }}
            ]
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: "bold",
  },
  urgencyChip: {
    height: 24,
  },
  deliveryPrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressLine: {
    width: 1,
    height: 20,
    backgroundColor: "#ddd",
    marginLeft: 6,
    marginVertical: 4,
  },
  addressText: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  addressValue: {
    fontSize: 14,
    marginTop: 2,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  packageInfo: {
    marginBottom: 12,
  },
  packageLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  packageText: {
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
})

export default ExpressDeliveriesScreen