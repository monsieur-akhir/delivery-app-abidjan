"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { Text, Card, Avatar, Button, Chip, ActivityIndicator, IconButton } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { getBidsForDelivery, acceptBid, getDeliveryDetails } from "../../services/api"
import { formatPrice, formatRelativeTime } from "../../utils/formatters"
import StarRating from "../../components/StarRating"

const BidsScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [delivery, setDelivery] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingBid, setAcceptingBid] = useState(false)
  const [sortBy, setSortBy] = useState("price") // 'price', 'rating', 'time'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Charger les détails de la livraison
      const deliveryData = await getDeliveryDetails(deliveryId)
      setDelivery(deliveryData)

      // Charger les enchères
      const bidsData = await getBidsForDelivery(deliveryId)
      setBids(bidsData)
    } catch (error) {
      console.error("Error loading bids:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleAcceptBid = (bid) => {
    if (!isConnected) {
      Alert.alert(t("bids.offlineTitle"), t("bids.offlineAcceptBid"))
      return
    }

    Alert.alert(t("bids.acceptBidTitle"), t("bids.acceptBidMessage", { price: formatPrice(bid.amount) }), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: () => confirmAcceptBid(bid.id),
      },
    ])
  }

  const confirmAcceptBid = async (bidId) => {
    try {
      setAcceptingBid(true)
      await acceptBid(deliveryId, bidId)

      // Rediriger vers les détails de la livraison
      navigation.replace("DeliveryDetails", { deliveryId })
    } catch (error) {
      console.error("Error accepting bid:", error)
      Alert.alert(t("bids.error"), error.message || t("bids.errorAcceptingBid"))
    } finally {
      setAcceptingBid(false)
    }
  }

  const sortBids = (bidsToSort) => {
    if (sortBy === "price") {
      return [...bidsToSort].sort((a, b) => a.amount - b.amount)
    } else if (sortBy === "rating") {
      return [...bidsToSort].sort((a, b) => (b.courier?.rating || 0) - (a.courier?.rating || 0))
    } else if (sortBy === "time") {
      return [...bidsToSort].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return bidsToSort
  }

  const renderBidItem = ({ item }) => {
    const courier = item.courier || {}

    return (
      <Card style={styles.bidCard}>
        <Card.Content>
          <View style={styles.bidHeader}>
            <View style={styles.courierInfo}>
              <Avatar.Image
                size={50}
                source={
                  courier.profile_picture
                    ? { uri: courier.profile_picture }
                    : require("../../assets/default-avatar.png")
                }
                style={styles.avatar}
              />
              <View style={styles.courierDetails}>
                <Text style={styles.courierName}>{courier.full_name}</Text>
                <View style={styles.ratingContainer}>
                  <StarRating rating={courier.rating || 0} size={16} />
                  <Text style={styles.ratingText}>{courier.rating ? courier.rating.toFixed(1) : "-"}</Text>
                </View>
                <Text style={styles.deliveriesCount}>
                  {t("bids.deliveriesCompleted", { count: courier.deliveries_completed || 0 })}
                </Text>
              </View>
            </View>
            <View style={styles.bidAmount}>
              <Text style={styles.bidPrice}>{formatPrice(item.amount)} FCFA</Text>
              <Text style={styles.bidTime}>{formatRelativeTime(item.created_at)}</Text>
            </View>
          </View>

          {item.note && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>{t("bids.courierNote")}</Text>
              <Text style={styles.noteText}>{item.note}</Text>
            </View>
          )}

          <View style={styles.bidFooter}>
            <View style={styles.courierAttributes}>
              {courier.vehicle_type && (
                <Chip style={styles.attributeChip} textStyle={styles.attributeText}>
                  {courier.vehicle_type}
                </Chip>
              )}
              {courier.commune && (
                <Chip style={styles.attributeChip} textStyle={styles.attributeText}>
                  {courier.commune}
                </Chip>
              )}
            </View>

            <Button
              mode="contained"
              onPress={() => handleAcceptBid(item)}
              style={styles.acceptButton}
              disabled={acceptingBid}
            >
              {t("bids.accept")}
            </Button>
          </View>
        </Card.Content>
      </Card>
    )
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="package-variant" size={50} color="#CCCCCC" />
      <Text style={styles.emptyText}>{t("bids.noBids")}</Text>
      <Text style={styles.emptySubtext}>{t("bids.waitingForBids")}</Text>
    </View>
  )

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>{t("bids.loading")}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("bids.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {delivery && (
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryTitle}>
            {t("bids.deliveryFrom")} {delivery.pickup_commune} {t("bids.deliveryTo")} {delivery.delivery_commune}
          </Text>
          <Text style={styles.deliveryPrice}>
            {t("bids.proposedPrice")}: {formatPrice(delivery.proposed_price)} FCFA
          </Text>
        </View>
      )}

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>{t("bids.sortBy")}</Text>
        <View style={styles.sortButtons}>
          <Chip
            selected={sortBy === "price"}
            onPress={() => setSortBy("price")}
            style={[styles.sortChip, sortBy === "price" && styles.selectedChip]}
            textStyle={sortBy === "price" ? styles.selectedChipText : {}}
          >
            {t("bids.price")}
          </Chip>
          <Chip
            selected={sortBy === "rating"}
            onPress={() => setSortBy("rating")}
            style={[styles.sortChip, sortBy === "rating" && styles.selectedChip]}
            textStyle={sortBy === "rating" ? styles.selectedChipText : {}}
          >
            {t("bids.rating")}
          </Chip>
          <Chip
            selected={sortBy === "time"}
            onPress={() => setSortBy("time")}
            style={[styles.sortChip, sortBy === "time" && styles.selectedChip]}
            textStyle={sortBy === "time" ? styles.selectedChipText : {}}
          >
            {t("bids.time")}
          </Chip>
        </View>
      </View>

      <FlatList
        data={sortBids(bids)}
        renderItem={renderBidItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {bids.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("bids.totalBids", { count: bids.length })}</Text>
        </View>
      )}
    </View>
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
  deliveryInfo: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  deliveryTitle: {
    fontSize: 16,
    color: "#212121",
    marginBottom: 4,
  },
  deliveryPrice: {
    fontSize: 14,
    color: "#757575",
  },
  sortContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sortLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: "row",
  },
  sortChip: {
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedChip: {
    backgroundColor: "#FF6B00",
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  bidCard: {
    marginBottom: 0,
    elevation: 2,
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  courierInfo: {
    flexDirection: "row",
    flex: 1,
  },
  avatar: {
    backgroundColor: "#E0E0E0",
  },
  courierDetails: {
    marginLeft: 12,
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  deliveriesCount: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  bidAmount: {
    alignItems: "flex-end",
  },
  bidPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  bidTime: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  noteContainer: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#757575",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: "#212121",
  },
  bidFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courierAttributes: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  attributeChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#EEEEEE",
    height: 24,
  },
  attributeText: {
    fontSize: 10,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    marginTop: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#757575",
  },
})

export default BidsScreen
