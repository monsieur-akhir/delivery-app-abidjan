"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from "react-native"
import { Text, Card, Button, FAB, Searchbar, Chip, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import MapView, { Marker } from "react-native-maps"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { fetchActiveDeliveries, fetchNearbyMerchants } from "../../services/api"
import { formatPrice } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery, Merchant } from "../../types/models"

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  // const { isConnected } = useNetwork() // Removed unused variable

  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [nearbyMerchants, setNearbyMerchants] = useState<Merchant[]>([])
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null)

  const communes: string[] = ["Cocody", "Yopougon", "Plateau", "Treichville", "Adjamé", "Marcory", "Abobo"]

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      // Charger les livraisons actives
      const deliveriesData = await fetchActiveDeliveries()
      setActiveDeliveries(deliveriesData)

      // Charger les commerçants à proximité
      const merchantsData = await fetchNearbyMerchants(selectedCommune || undefined)
      setNearbyMerchants(merchantsData)
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

  const onSearch = (query: string): void => {
    setSearchQuery(query)
    // Implémenter la recherche
  }

  const filterByCommune = (commune: string): void => {
    if (selectedCommune === commune) {
      setSelectedCommune(null)
    } else {
      setSelectedCommune(commune)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.subGreeting}>Que souhaitez-vous livrer aujourd&rsquo;hui ?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <Feather name="bell" size={24} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      <Searchbar
        placeholder="Rechercher..."
        onChangeText={onSearch}
        value={searchQuery}
        style={styles.searchbar}
        iconColor="#FF6B00"
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        {/* Section des livraisons actives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos livraisons actives</Text>

          {loading ? (
            <ActivityIndicator color="#FF6B00" style={styles.loader} />
          ) : activeDeliveries.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeDeliveries.map((delivery) => (
                <Card
                  key={delivery.id}
                  style={styles.deliveryCard}
                  onPress={() => navigation.navigate("DeliveryDetails", { deliveryId: delivery.id.toString() })}
                >
                  <Card.Content>
                    <View style={styles.deliveryStatus}>
                      <Feather name="package" size={16} color="#FF6B00" />
                      <Text style={styles.statusText}>
                        {delivery.status === "accepted"
                          ? "Acceptée"
                          : delivery.status === "in_progress"
                            ? "En cours"
                            : delivery.status === "delivered"
                              ? "Livrée"
                              : "En attente"}
                      </Text>
                    </View>
                    <Text style={styles.deliveryAddress} numberOfLines={1}>
                      De: {delivery.pickup_address}
                    </Text>
                    <Text style={styles.deliveryAddress} numberOfLines={1}>
                      À: {delivery.delivery_address}
                    </Text>
                    <Text style={styles.deliveryPrice}>
                      {formatPrice(delivery.final_price || delivery.proposed_price)} FCFA
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      mode="text"
                      onPress={() => navigation.navigate("TrackDelivery", { deliveryId: delivery.id.toString() })}
                      color="#FF6B00"
                    >
                      Suivre
                    </Button>
                  </Card.Actions>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="package" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>Aucune livraison active</Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("CreateDelivery")}
                style={styles.createButton}
              >
                Créer une livraison
              </Button>
            </View>
          )}
        </View>

        {/* Filtres par commune */}
        <View style={styles.communeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {communes.map((commune) => (
              <Chip
                key={commune}
                selected={selectedCommune === commune}
                onPress={() => filterByCommune(commune)}
                style={[styles.communeChip, selectedCommune === commune && styles.selectedChip]}
                textStyle={selectedCommune === commune ? styles.selectedChipText : {}}
              >
                {commune}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Carte avec les commerçants à proximité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commerçants à proximité</Text>

          {location ? (
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
                      onPress={() => navigation.navigate("MerchantDetails", { merchantId: merchant.id.toString() })}
                    />
                  ) : null,
                )}
              </MapView>
            </View>
          ) : (
            <ActivityIndicator color="#FF6B00" style={styles.loader} />
          )}

          {/* Liste des commerçants */}
          {loading ? (
            <ActivityIndicator color="#FF6B00" style={styles.loader} />
          ) : nearbyMerchants.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.merchantsContainer}>
              {nearbyMerchants.map((merchant) => (
                <Card
                  key={merchant.id}
                  style={styles.merchantCard}
                  onPress={() => navigation.navigate("MerchantDetails", { merchantId: merchant.id.toString() })}
                >
                  {merchant.logo_url ? (
                    <Image source={{ uri: merchant.logo_url }} style={styles.merchantLogo} />
                  ) : (
                    <View style={styles.merchantLogoPlaceholder}>
                      <Feather name="shopping-bag" size={30} color="#FFFFFF" />
                    </View>
                  )}
                  <Card.Content>
                    <Text style={styles.merchantName} numberOfLines={1}>
                      {merchant.business_name}
                    </Text>
                    <Text style={styles.merchantCategory}>{merchant.category}</Text>
                    <View style={styles.merchantLocation}>
                      <Feather name="map-pin" size={12} color="#757575" />
                      <Text style={styles.merchantCommune}>{merchant.commune}</Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="shopping-bag" size={40} color="#CCCCCC" />
              <Text style={styles.emptyText}>Aucun commerçant trouvé</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <FAB style={styles.fab} icon="plus" color="#FFFFFF" onPress={() => navigation.navigate("CreateDelivery")} />
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
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  subGreeting: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  searchbar: {
    margin: 16,
    elevation: 2,
    backgroundColor: "#FFFFFF",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 12,
    color: "#212121",
  },
  deliveryCard: {
    width: 250,
    marginLeft: 16,
    marginRight: 8,
    marginBottom: 8,
    elevation: 2,
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "bold",
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 4,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
  communeFilters: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  communeChip: {
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedChip: {
    backgroundColor: "#FF6B00",
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  merchantsContainer: {
    paddingLeft: 16,
  },
  merchantCard: {
    width: 180,
    marginRight: 12,
    marginBottom: 8,
    elevation: 2,
  },
  merchantLogo: {
    height: 100,
    width: "100%",
    resizeMode: "cover",
  },
  merchantLogoPlaceholder: {
    height: 100,
    width: "100%",
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    color: "#212121",
  },
  merchantCategory: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  merchantLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  merchantCommune: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 12,
    marginBottom: 16,
    color: "#757575",
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#FF6B00",
  },
  loader: {
    padding: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#FF6B00",
  },
})

export default HomeScreen
