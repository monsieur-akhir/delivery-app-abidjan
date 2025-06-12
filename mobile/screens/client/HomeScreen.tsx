
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions } from "react-native"
import { Text, Card, Button, FAB, Searchbar, Chip, ActivityIndicator, Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import MapView, { Marker } from "react-native-maps"
import * as Location from "expo-location"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../../contexts/AuthContext"
import { fetchActiveDeliveries, fetchNearbyMerchants } from "../../services/api"
import { formatPrice } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery, Merchant } from "../../types/models"

const { width } = Dimensions.get('window')

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth()

  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [nearbyMerchants, setNearbyMerchants] = useState<Merchant[]>([])
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null)

  const communes: string[] = ["Cocody", "Yopougon", "Plateau", "Treichville", "Adjamé", "Marcory", "Abobo"]

  const quickActions = [
    { id: 'food', title: 'Restaurant', icon: 'coffee', color: '#FF6B6B', screen: 'Marketplace' },
    { id: 'package', title: 'Colis', icon: 'package', color: '#4ECDC4', screen: 'CreateDelivery' },
    { id: 'grocery', title: 'Épicerie', icon: 'shopping-cart', color: '#45B7D1', screen: 'Marketplace' },
    { id: 'pharmacy', title: 'Pharmacie', icon: 'heart', color: '#96CEB4', screen: 'Marketplace' },
  ]

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const deliveriesData = await fetchActiveDeliveries()
      setActiveDeliveries(deliveriesData)
      const merchantsData = await fetchNearbyMerchants(selectedCommune || undefined)
      setNearbyMerchants(merchantsData as unknown as Merchant[])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedCommune])

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          throw new Error("Permission to access location was denied")
        }
        const location = await Location.getCurrentPositionAsync({})
        setLocation(location)
        await loadData()
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setLoading(false)
      }
    })()
  }, [loadData])

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const renderQuickAction = (action: typeof quickActions[0]) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionItem}
      onPress={() => navigation.navigate(action.screen as any)}
    >
      <LinearGradient
        colors={[action.color, `${action.color}DD`]}
        style={styles.quickActionGradient}
      >
        <Feather name={action.icon as any} size={24} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.quickActionText}>{action.title}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header moderne style Glovo */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View style={styles.locationContainer}>
            <Feather name="map-pin" size={16} color="#FF6B00" />
            <Text style={styles.locationText}>
              {location ? "Position actuelle" : "Localisation..."}
            </Text>
            <Feather name="chevron-down" size={16} color="#757575" />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Feather name="bell" size={20} color="#212121" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Text style={styles.profileInitial}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Barre de recherche intégrée */}
        <Searchbar
          placeholder="Restaurants, colis, épicerie..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#FF6B00"
          inputStyle={styles.searchInput}
        />
      </Surface>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        {/* Actions rapides style Glovo */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Que voulez-vous livrer ?</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Bannière promotionnelle */}
        <TouchableOpacity style={styles.promoBanner}>
          <LinearGradient
            colors={['#FF6B00', '#FF8F00']}
            style={styles.promoBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.promoBannerContent}>
              <View>
                <Text style={styles.promoBannerTitle}>Livraison gratuite</Text>
                <Text style={styles.promoBannerSubtitle}>Sur votre première commande</Text>
              </View>
              <Feather name="gift" size={32} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Filtres par commune */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Explorer par zone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {communes.map((commune) => (
              <Chip
                key={commune}
                selected={selectedCommune === commune}
                onPress={() => setSelectedCommune(selectedCommune === commune ? null : commune)}
                style={[
                  styles.communeChip,
                  selectedCommune === commune && styles.selectedChip
                ]}
                textStyle={selectedCommune === commune ? styles.selectedChipText : styles.chipText}
              >
                {commune}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Livraisons actives */}
        {activeDeliveries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vos livraisons en cours</Text>
              <TouchableOpacity onPress={() => navigation.navigate("DeliveryHistory")}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeDeliveries.map((delivery) => (
                <TouchableOpacity
                  key={delivery.id}
                  style={styles.deliveryCard}
                  onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: delivery.id.toString() })}
                >
                  <View style={styles.deliveryCardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                      <Text style={styles.statusText}>
                        {getStatusText(delivery.status)}
                      </Text>
                    </View>
                    <Text style={styles.deliveryPrice}>
                      {formatPrice(delivery.final_price || delivery.proposed_price)} F
                    </Text>
                  </View>
                  
                  <View style={styles.deliveryRoute}>
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {delivery.pickup_address}
                      </Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, { backgroundColor: '#FF6B00' }]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {delivery.delivery_address}
                      </Text>
                    </View>
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate("TrackDelivery", { deliveryId: delivery.id.toString() })}
                    style={styles.trackButton}
                    labelStyle={styles.trackButtonText}
                  >
                    Suivre
                  </Button>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Commerçants recommandés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commerçants populaires</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Marketplace")}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#FF6B00" style={styles.loader} />
          ) : nearbyMerchants.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {nearbyMerchants.slice(0, 5).map((merchant) => (
                <TouchableOpacity
                  key={merchant.id}
                  style={styles.merchantCard}
                  onPress={() => navigation.navigate("MerchantDetails", { merchantId: merchant.id.toString() })}
                >
                  <Image
                    source={{ uri: merchant.logo_url || "https://via.placeholder.com/120x80?text=Shop" }}
                    style={styles.merchantImage}
                  />
                  <View style={styles.merchantInfo}>
                    <Text style={styles.merchantName} numberOfLines={1}>
                      {merchant.business_name}
                    </Text>
                    <Text style={styles.merchantCategory}>
                      {merchant.category}
                    </Text>
                    <View style={styles.merchantFooter}>
                      <View style={styles.ratingContainer}>
                        <Feather name="star" size={12} color="#FFC107" />
                        <Text style={styles.ratingText}>
                          {merchant.rating?.toFixed(1) || "4.5"}
                        </Text>
                      </View>
                      <Text style={styles.deliveryTime}>
                        {merchant.delivery_time || "30"} min
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyMerchants}>
              <Feather name="shopping-bag" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>Aucun commerçant disponible</Text>
            </View>
          )}
        </View>

        {/* Carte des commerçants proches */}
        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commerçants près de vous</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="Votre position"
                  pinColor="#FF6B00"
                />
                {nearbyMerchants.map((merchant) =>
                  merchant.lat && merchant.lng ? (
                    <Marker
                      key={merchant.id}
                      coordinate={{
                        latitude: merchant.lat,
                        longitude: merchant.lng,
                      }}
                      title={merchant.business_name}
                      description={merchant.category}
                    />
                  ) : null,
                )}
              </MapView>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB style Glovo */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => navigation.navigate("CreateDelivery")}
        label="Nouvelle livraison"
      />
    </SafeAreaView>
  )
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "#FFC107"
    case "accepted": return "#2196F3"
    case "in_progress": return "#FF6B00"
    case "delivered": return "#4CAF50"
    default: return "#757575"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "pending": return "En attente"
    case "accepted": return "Acceptée"
    case "in_progress": return "En cours"
    case "delivered": return "Livrée"
    default: return "Inconnue"
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginLeft: 6,
    marginRight: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  searchbar: {
    backgroundColor: "#F5F5F5",
    elevation: 0,
    borderRadius: 25,
    height: 48,
  },
  searchInput: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  quickActionsContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  quickActionItem: {
    alignItems: "center",
    width: (width - 80) / 4,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#212121",
    textAlign: "center",
  },
  promoBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  promoBannerGradient: {
    padding: 20,
  },
  promoBannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoBannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  promoBannerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  filtersSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    marginBottom: 8,
  },
  filtersScroll: {
    paddingLeft: 16,
  },
  communeChip: {
    marginRight: 8,
    backgroundColor: "#F5F5F5",
    height: 32,
  },
  selectedChip: {
    backgroundColor: "#FF6B00",
  },
  chipText: {
    fontSize: 12,
    color: "#212121",
  },
  selectedChipText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  section: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "600",
  },
  deliveryCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  deliveryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  deliveryRoute: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: "#E0E0E0",
    marginLeft: 4,
    marginRight: 12,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: "#757575",
    flex: 1,
  },
  trackButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 8,
    height: 36,
  },
  trackButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  merchantCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginLeft: 16,
    marginRight: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  merchantImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F5F5",
  },
  merchantInfo: {
    padding: 12,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  merchantCategory: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 8,
  },
  merchantFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#212121",
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: "#757575",
  },
  emptyMerchants: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    marginTop: 8,
  },
  mapContainer: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 16,
    backgroundColor: "#FF6B00",
    borderRadius: 28,
  },
  loader: {
    padding: 20,
  },
  bottomSpacer: {
    height: 100,
  },
})

export default HomeScreen
