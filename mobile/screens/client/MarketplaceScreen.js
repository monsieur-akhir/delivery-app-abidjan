"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Text, Card, Chip, Searchbar, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchNearbyMerchants } from "../../services/api"

const MarketplaceScreen = ({ navigation }) => {
  const { t } = useTranslation()
  const { isConnected, isOfflineMode } = useNetwork()

  const [merchants, setMerchants] = useState([])
  const [filteredMerchants, setFilteredMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedCommune, setSelectedCommune] = useState(null)

  const categories = [
    { id: "food", name: t("marketplace.categories.food"), icon: "food" },
    { id: "clothing", name: t("marketplace.categories.clothing"), icon: "tshirt-crew" },
    { id: "electronics", name: t("marketplace.categories.electronics"), icon: "cellphone" },
    { id: "groceries", name: t("marketplace.categories.groceries"), icon: "cart" },
    { id: "pharmacy", name: t("marketplace.categories.pharmacy"), icon: "pill" },
    { id: "other", name: t("marketplace.categories.other"), icon: "dots-horizontal" },
  ]

  const communes = ["Cocody", "Yopougon", "Plateau", "Treichville", "Adjamé", "Marcory", "Abobo"]

  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    try {
      setLoading(true)
      const data = await fetchNearbyMerchants(selectedCommune, selectedCategory)
      setMerchants(data)
      setFilteredMerchants(data)
    } catch (error) {
      console.error("Error loading merchants:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMerchants()
    setRefreshing(false)
  }

  useEffect(() => {
    filterMerchants()
  }, [searchQuery, selectedCategory, selectedCommune, merchants])

  const filterMerchants = () => {
    let filtered = [...merchants]

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (merchant) => merchant.name.toLowerCase().includes(query) || merchant.description.toLowerCase().includes(query),
      )
    }

    // Filtrer par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((merchant) => merchant.categories.includes(selectedCategory))
    }

    // Filtrer par commune
    if (selectedCommune) {
      filtered = filtered.filter((merchant) => merchant.commune === selectedCommune)
    }

    setFilteredMerchants(filtered)
  }

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
  }

  const handleCommuneSelect = (commune) => {
    setSelectedCommune(selectedCommune === commune ? null : commune)
  }

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item.id && styles.selectedCategoryItem]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <IconButton icon={item.icon} size={24} color={selectedCategory === item.id ? "#FFFFFF" : "#FF6B00"} />
      <Text style={[styles.categoryName, selectedCategory === item.id && styles.selectedCategoryName]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  )

  const renderMerchantItem = ({ item }) => (
    <Card style={styles.merchantCard} onPress={() => navigation.navigate("MerchantDetails", { merchantId: item.id })}>
      <Card.Cover
        source={{ uri: item.image_url || "https://via.placeholder.com/300x150?text=Boutique" }}
        style={styles.merchantImage}
      />

      <Card.Content>
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <IconButton icon="star" size={16} color="#FFC107" style={styles.ratingIcon} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.merchantDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.merchantFooter}>
          <Chip style={styles.communeChip}>{item.commune}</Chip>

          <Text style={styles.deliveryTime}>
            <IconButton icon="clock-outline" size={14} color="#757575" style={styles.timeIcon} />
            {item.delivery_time} min
          </Text>
        </View>
      </Card.Content>
    </Card>
  )

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="store-off" size={50} color="#CCCCCC" />
      <Text style={styles.emptyText}>{t("marketplace.noMerchants")}</Text>
      <Text style={styles.emptySubtext}>{t("marketplace.tryDifferentFilters")}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("marketplace.title")}</Text>
      </View>

      <Searchbar
        placeholder={t("marketplace.search")}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#FF6B00"
      />

      <View style={styles.filtersContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />

        <FlatList
          data={communes}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCommune === item}
              onPress={() => handleCommuneSelect(item)}
              style={[styles.communeFilterChip, selectedCommune === item && styles.selectedCommuneChip]}
              textStyle={selectedCommune === item ? styles.selectedChipText : {}}
            >
              {item}
            </Chip>
          )}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.communesList}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("marketplace.loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMerchants}
          renderItem={renderMerchantItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.merchantsList}
          ListEmptyComponent={renderEmptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
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
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  selectedCategoryItem: {
    backgroundColor: "#FF6B00",
  },
  categoryName: {
    fontSize: 12,
    color: "#212121",
    marginTop: 4,
    textAlign: "center",
  },
  selectedCategoryName: {
    color: "#FFFFFF",
  },
  communesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  communeFilterChip: {
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedCommuneChip: {
    backgroundColor: "#FF6B00",
  },
  selectedChipText: {
    color: "#FFFFFF",
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
  merchantsList: {
    padding: 16,
  },
  merchantCard: {
    marginBottom: 16,
    elevation: 2,
  },
  merchantImage: {
    height: 150,
  },
  merchantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingIcon: {
    margin: 0,
    padding: 0,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  merchantDescription: {
    fontSize: 14,
    color: "#757575",
    marginVertical: 8,
  },
  merchantFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  communeChip: {
    backgroundColor: "#F5F5F5",
    height: 24,
  },
  deliveryTime: {
    fontSize: 12,
    color: "#757575",
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    margin: 0,
    padding: 0,
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

export default MarketplaceScreen
