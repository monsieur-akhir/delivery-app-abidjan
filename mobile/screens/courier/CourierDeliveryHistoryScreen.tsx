"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, ActivityIndicator, ScrollView } from "react-native"
import { Text, Card, Chip, Divider, Button, IconButton, Searchbar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import type { Delivery } from "../../types/models"
import api from "../../services/api"
import DeliveryStatusBadge from "../../components/DeliveryStatusBadge"
import EmptyState from "../../components/EmptyState"
import ErrorView from "../../components/ErrorView"
import { formatDate, formatPrice } from "../../utils/formatters"

const CourierDeliveryHistoryScreen: React.FC = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { isConnected } = useNetwork()

  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  useEffect(() => {
    loadDeliveryHistory()
  }, [])

  const loadDeliveryHistory = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const { data } = await api.get(`/couriers/${user.id}/deliveries`)
      setDeliveries(data)
      setFilteredDeliveries(data)
    } catch (err) {
      setError(t("errors.failedToLoadDeliveries"))
      console.error("Failed to load delivery history:", err)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = () => {
    loadDeliveryHistory()
  }

  const onSearch = (query: string) => {
    setSearchQuery(query)
    filterDeliveries(query, filterStatus)
  }

  const onFilterByStatus = (status: string | null) => {
    setFilterStatus(status)
    filterDeliveries(searchQuery, status)
  }

  const filterDeliveries = (query: string, status: string | null) => {
    let filtered = deliveries

    if (query) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.pickup_address.toLowerCase().includes(query.toLowerCase()) ||
          delivery.delivery_address.toLowerCase().includes(query.toLowerCase()) ||
          delivery.id.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (status) {
      filtered = filtered.filter((delivery) => delivery.status === status)
    }

    setFilteredDeliveries(filtered)
  }

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <Card style={styles.deliveryCard} onPress={() => navigation.navigate("CourierTrackDelivery", { deliveryId: item.id })}>
      <Card.Content>
        <View style={styles.deliveryHeader}>
          <Text style={styles.deliveryId}>#{item.id.slice(-6)}</Text>
          <DeliveryStatusBadge status={item.status} />
        </View>

        <Text style={styles.deliveryDate}>{formatDate(item.created_at)}</Text>

        <Divider style={styles.divider} />

        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <View style={styles.addressDot} />
            <Text style={styles.addressText}>{item.pickup_address}</Text>
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, { backgroundColor: "#F44336" }]} />
            <Text style={styles.addressText}>{item.delivery_address}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.deliveryFooter}>
          <Text style={styles.deliveryPrice}>{formatPrice(item.actual_price || item.proposed_price)} FCFA</Text>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate("CourierTrackDelivery", { deliveryId: item.id })}
            style={styles.detailsButton}
          >
            {t("delivery.details")}
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      )
    }

    if (error) {
      return (
        <ErrorView
          message={error}
          onRetry={loadDeliveryHistory}
          icon="package"
          isConnected={isConnected}
        />
      )
    }

    if (filteredDeliveries.length === 0) {
      return (
        <EmptyState
          title={t("courier.noDeliveriesYet")}
          message={t("courier.deliveryHistoryEmpty")}
          icon="truck"
          buttonText={t("common.refresh")}
          onButtonPress={onRefresh}
        />
      )
    }

    return (
      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={loading}
      />
    )
  }

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
        <Chip
          selected={filterStatus === null}
          onPress={() => onFilterByStatus(null)}
          style={styles.filterChip}
        >
          {t("common.all")}
        </Chip>
        <Chip
          selected={filterStatus === "completed"}
          onPress={() => onFilterByStatus("completed")}
          style={styles.filterChip}
        >
          {t("deliveryStatus.completed")}
        </Chip>
        <Chip
          selected={filterStatus === "in_progress"}
          onPress={() => onFilterByStatus("in_progress")}
          style={styles.filterChip}
        >
          {t("deliveryStatus.inProgress")}
        </Chip>
        <Chip
          selected={filterStatus === "picked_up"}
          onPress={() => onFilterByStatus("picked_up")}
          style={styles.filterChip}
        >
          {t("deliveryStatus.pickedUp")}
        </Chip>
        <Chip
          selected={filterStatus === "cancelled"}
          onPress={() => onFilterByStatus("cancelled")}
          style={styles.filterChip}
        >
          {t("deliveryStatus.cancelled")}
        </Chip>
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("courier.deliveryHistory")}</Text>
      </View>

      <Searchbar
        placeholder={t("common.search")}
        onChangeText={onSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#757575"
      />

      {renderFilterChips()}
      {renderContent()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterChips: {
    paddingBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  deliveryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  deliveryDate: {
    fontSize: 12,
    color: "#757575",
  },
  divider: {
    marginVertical: 12,
  },
  addressContainer: {
    marginVertical: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: "#E0E0E0",
    marginLeft: 5,
  },
  addressText: {
    fontSize: 14,
    color: "#424242",
    flex: 1,
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  detailsButton: {
    borderColor: "#FF6B00",
  },
})

export default CourierDeliveryHistoryScreen
