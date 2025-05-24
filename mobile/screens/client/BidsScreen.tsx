import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { Text, Card, Button, Avatar, Chip, Divider, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryBids, acceptBid, rejectBid } from "../../services/api"
import { formatPrice, formatDate } from "../../utils/formatters"
import StarRating from "../../components/StarRating"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Bid, Courier } from "../../types/models"

type BidsScreenProps = {
  route: RouteProp<RootStackParamList, "Bids">
  navigation: NativeStackNavigationProp<RootStackParamList, "Bids">
}

const BidsScreen: React.FC<BidsScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [processingBidId, setProcessingBidId] = useState<string | null>(null)

  const loadBids = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchDeliveryBids(deliveryId)
      setBids(data)
    } catch (error) {
      console.error("Error loading bids:", error)
      Alert.alert(t("bids.errorTitle"), t("bids.errorLoadingBids"))
    } finally {
      setLoading(false)
    }
  }, [deliveryId, t])

  useEffect(() => {
    loadBids()
  }, [loadBids])

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadBids()
    setRefreshing(false)
  }

  const handleAcceptBid = (bid: Bid): void => {
    Alert.alert(
      t("bids.acceptBidTitle"),
      t("bids.acceptBidMessage", { price: formatPrice(bid.amount), courierName: bid.courier?.name || t("bids.unknownCourier") }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.accept"),
          onPress: () => confirmAcceptBid(bid.id),
        },
      ],
    )
  }

  const confirmAcceptBid = async (bidId: string): Promise<void> => {
    if (!isConnected) {
      Alert.alert(t("common.offlineTitle"), t("bids.offlineAcceptBid"))
      return
    }

    try {
      setProcessingBidId(bidId)
      await acceptBid(bidId, deliveryId)

      const updatedBids = bids.map((bid) => {
        if (bid.id === bidId) {
          return { ...bid, status: "accepted" as const }
        } else {
          return { ...bid, status: "rejected" as const }
        }
      })

      setBids(updatedBids)

      Alert.alert(t("bids.bidAcceptedTitle"), t("bids.bidAcceptedMessage"), [
        {
          text: "OK",
          onPress: () => navigation.navigate("DeliveryDetails", { deliveryId }),
        },
      ])
    } catch (error) {
      console.error("Error accepting bid:", error)
      Alert.alert(t("bids.errorTitle"), t("bids.errorAcceptingBid"))
    } finally {
      setProcessingBidId(null)
    }
  }

  const handleRejectBid = (bid: Bid): void => {
    Alert.alert(
      t("bids.rejectBidTitle"), 
      t("bids.rejectBidMessage", { courierName: bid.courier?.name || t("bids.unknownCourier") }), 
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.reject"),
          onPress: () => confirmRejectBid(bid.id),
          style: "destructive",
        },
      ]
    )
  }

  const confirmRejectBid = async (bidId: string): Promise<void> => {
    if (!isConnected) {
      Alert.alert(t("common.offlineTitle"), t("bids.offlineRejectBid"))
      return
    }

    try {
      setProcessingBidId(bidId)
      await rejectBid(bidId, deliveryId)

      const updatedBids = bids.map((bid) => {
        if (bid.id === bidId) {
          return { ...bid, status: "rejected" as const }
        }
        return bid
      })

      setBids(updatedBids)
    } catch (error) {
      console.error("Error rejecting bid:", error)
      Alert.alert(t("bids.errorTitle"), t("bids.errorRejectingBid"))
    } finally {
      setProcessingBidId(null)
    }
  }

  const viewCourierProfile = (courierId: string): void => {
    navigation.navigate("CourierProfile", { courierId })
  }

  const renderBidItem = ({ item }: { item: Bid }): React.ReactElement => (
    <Card style={styles.bidCard}>
      <Card.Content>
        <View style={styles.bidHeader}>
          <TouchableOpacity 
            style={styles.courierInfo} 
            onPress={() => viewCourierProfile(item.courier_id)}
          >
            <Avatar.Image
              size={50}
              source={{ uri: item.courier?.photo_url || "https://via.placeholder.com/50" }}
            />
            <View style={styles.courierDetails}>
              <Text style={styles.courierName}>
                {item.courier?.name || `${t("bids.courier")} ${item.courier_id.substring(0, 4)}`}
              </Text>
              <View style={styles.ratingContainer}>
                <StarRating rating={item.courier?.rating || 0} size={16} />
                <Text style={styles.ratingText}>({item.courier?.rating_count || 0})</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.bidPriceContainer}>
            <Text style={styles.bidPriceLabel}>{t("bids.bidPrice")}</Text>
            <Text style={styles.bidPrice}>{formatPrice(item.amount)} FCFA</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.bidDetails}>
          <View style={styles.bidDetail}>
            <Text style={styles.bidDetailLabel}>{t("bids.vehicleType")}</Text>
            <Chip icon="motorbike" style={styles.bidDetailChip}>
              {item.courier?.vehicle_type || t("bids.unknownVehicle")}
            </Chip>
          </View>

          <View style={styles.bidDetail}>
            <Text style={styles.bidDetailLabel}>{t("bids.estimatedTime")}</Text>
            <Chip icon="clock-outline" style={styles.bidDetailChip}>
              {item.estimated_time} {t("common.minutes")}
            </Chip>
          </View>
        </View>

        {item.note && (
          <View style={styles.bidNote}>
            <Text style={styles.bidNoteLabel}>{t("bids.courierNote")}</Text>
            <Text style={styles.bidNoteText}>{item.note}</Text>
          </View>
        )}

        <Text style={styles.bidTimestamp}>{formatDate(item.created_at)}</Text>

        {item.status === "pending" ? (
          <View style={styles.bidActions}>
            <Button
              mode="outlined"
              onPress={() => handleRejectBid(item)}
              style={styles.rejectButton}
              loading={processingBidId === item.id}
              disabled={processingBidId !== null}
            >
              {t("bids.reject")}
            </Button>

            <Button
              mode="contained"
              onPress={() => handleAcceptBid(item)}
              style={styles.acceptButton}
              loading={processingBidId === item.id}
              disabled={processingBidId !== null}
            >
              {t("bids.accept")}
            </Button>
          </View>
        ) : (
          <Chip
            icon={item.status === "accepted" ? "check-circle" : "close-circle"}
            style={[
              styles.statusChip, 
              item.status === "accepted" ? styles.acceptedChip : styles.rejectedChip
            ]}
          >
            {item.status === "accepted" ? t("bids.accepted") : t("bids.rejected")}
          </Chip>
        )}
      </Card.Content>
    </Card>
  )

  const renderEmptyList = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <IconButton icon="gavel" size={50} iconColor="#CCCCCC" />
      <Text style={styles.emptyText}>{t("bids.noBids")}</Text>
      <Text style={styles.emptySubtext}>{t("bids.waitingForBids")}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("bids.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={styles.deliveryId}>
          {t("bids.deliveryId")}: #{deliveryId}
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("bids.loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.bidsList}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={["#FF6B00"]} 
            />
          }
        />
      )}
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
  deliveryInfo: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  deliveryId: {
    fontSize: 14,
    color: "#757575",
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
  bidsList: {
    padding: 16,
  },
  bidCard: {
    marginBottom: 16,
    elevation: 2,
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  courierDetails: {
    marginLeft: 12,
  },
  courierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  bidPriceContainer: {
    alignItems: "flex-end",
  },
  bidPriceLabel: {
    fontSize: 12,
    color: "#757575",
  },
  bidPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  divider: {
    marginVertical: 12,
  },
  bidDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bidDetail: {
    flex: 1,
  },
  bidDetailLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  bidDetailChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  bidNote: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bidNoteLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  bidNoteText: {
    fontSize: 14,
    color: "#212121",
  },
  bidTimestamp: {
    fontSize: 12,
    color: "#9E9E9E",
    marginBottom: 12,
    textAlign: "right",
  },
  bidActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rejectButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#F44336",
  },
  acceptButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#4CAF50",
  },
  statusChip: {
    alignSelf: "flex-end",
  },
  acceptedChip: {
    backgroundColor: "#E8F5E9",
  },
  rejectedChip: {
    backgroundColor: "#FFEBEE",
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
})

export default BidsScreen
