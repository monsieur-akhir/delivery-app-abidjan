"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native"
import { Text, Card, Button, Divider, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import RecommendationService, { type DeliveryRecommendation } from "../../services/RecommendationService"
import EmptyState from "../../components/EmptyState"
import ErrorView from "../../components/ErrorView"
import { formatCurrency, formatDistance } from "../../utils/formatters"

const RecommendedDeliveriesScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()

  const [recommendations, setRecommendations] = useState<DeliveryRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async (refresh = false) => {
    try {
      if (refresh) {
        setPage(1)
        setRefreshing(true)
      } else if (!refresh && !hasMore) {
        return
      }

      const currentPage = refresh ? 1 : page
      const data = await RecommendationService.getRecommendedDeliveries(currentPage)

      if (data.length === 0) {
        setHasMore(false)
      }

      if (refresh || currentPage === 1) {
        setRecommendations(data)
      } else {
        setRecommendations((prev) => [...prev, ...data])
      }

      setPage(currentPage + 1)
      setError(null)
    } catch (err) {
      setError(t("errors.failedToLoadRecommendations"))
      console.error("Error fetching recommendations:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchRecommendations(true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchRecommendations()
    }
  }

  const handleDeliveryPress = (delivery: DeliveryRecommendation) => {
    // Enregistrer le feedback que l'utilisateur a vu cette recommandation
    RecommendationService.provideFeedback("delivery", delivery.id, "viewed")

    // Naviguer vers les détails de la livraison
    navigation.navigate("DeliveryDetails", { deliveryId: delivery.id })
  }

  const handleAcceptDelivery = (delivery: DeliveryRecommendation) => {
    // Enregistrer le feedback que l'utilisateur a accepté cette recommandation
    RecommendationService.provideFeedback("delivery", delivery.id, "accepted")

    // Naviguer vers l'écran d'enchère
    navigation.navigate("BidScreen", { deliveryId: delivery.id })
  }

  const handleRejectDelivery = (deliveryId: number) => {
    // Enregistrer le feedback que l'utilisateur a rejeté cette recommandation
    RecommendationService.provideFeedback("delivery", deliveryId, "rejected")

    // Supprimer de la liste locale
    setRecommendations((prev) => prev.filter((item) => item.id !== deliveryId))
  }

  const renderDeliveryItem = ({ item }: { item: DeliveryRecommendation }) => (
    <Card style={styles.card} onPress={() => handleDeliveryPress(item)}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.matchScoreContainer}>
            <Text style={styles.matchScoreText}>{item.match_score}%</Text>
            <Text style={styles.matchLabel}>{t("recommendations.match")}</Text>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>{t("delivery.pickup")}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_address}
            </Text>
            <View style={styles.addressDivider} />
            <Text style={styles.addressLabel}>{t("delivery.destination")}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("delivery.price")}</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.proposed_price)} FCFA</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("delivery.earnings")}</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.estimated_earnings)} FCFA</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t("delivery.distance")}</Text>
            <Text style={styles.detailValue}>{formatDistance(item.distance)}</Text>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>{t("recommendations.whyRecommended")}</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button mode="outlined" onPress={() => handleRejectDelivery(item.id)} style={styles.rejectButton}>
          {t("common.skip")}
        </Button>
        <Button mode="contained" onPress={() => handleAcceptDelivery(item)} style={styles.acceptButton}>
          {t("delivery.bid")}
        </Button>
      </Card.Actions>
    </Card>
  )

  if (loading && !refreshing && recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("recommendations.deliveries")}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error && recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("recommendations.deliveries")}</Text>
        </View>
        <ErrorView message={error} onRetry={handleRefresh} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("recommendations.deliveries")}</Text>
        <IconButton icon="refresh" size={24} onPress={handleRefresh} disabled={refreshing} />
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title={t("recommendations.noDeliveries")}
            message={t("recommendations.checkBackLater")}
          />
        }
        ListFooterComponent={
          loading && recommendations.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF6B00" />
            </View>
          ) : null
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  matchScoreContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    width: 70,
    height: 70,
  },
  matchScoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
  },
  matchLabel: {
    fontSize: 12,
    color: "#1976D2",
  },
  addressContainer: {
    flex: 1,
    justifyContent: "center",
  },
  addressLabel: {
    fontSize: 12,
    color: "#757575",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
  },
  addressDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
  },
  reasonContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FF8F00",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#212121",
  },
  cardActions: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rejectButton: {
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: "#FF6B00",
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
})

export default RecommendedDeliveriesScreen
