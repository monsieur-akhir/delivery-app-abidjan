"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { Text, Card, Chip, Searchbar, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { fetchNearbyMerchants, type MerchantInfo } from "../../services/api"
import IconButton from "../../components/IconButton"
import { Feather } from "@expo/vector-icons"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { Merchant } from "../../types/models"

// Type adapter to transform API MerchantInfo to component Merchant interface
const adaptMerchantInfo = (merchantInfo: MerchantInfo): Merchant => ({
  id: parseInt(merchantInfo.id),
  name: merchantInfo.name,
  description: merchantInfo.description || '',
  address: merchantInfo.address,
  category: merchantInfo.category,
  categories: [merchantInfo.category],
  rating: merchantInfo.rating || 0,
  review_count: 0,
  is_open: merchantInfo.is_open,
  opening_hours: merchantInfo.opening_hours || '',
  phone: merchantInfo.phone || '',
  lat: merchantInfo.lat || 0,
  lng: merchantInfo.lng || 0,
  logo: '',
  logo_url: undefined,
  cover_image: '',
  created_at: '',
  updated_at: '',
  delivery_time: 30
})

type MarketplaceScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Marketplace">
}

interface CategoryItem {
  id: string
  name: string
  icon: React.ComponentProps<typeof Feather>["name"]
}

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()

  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCommune, setSelectedCommune] = useState<string | null>(null)

  const categories: CategoryItem[] = [
    { id: "food", name: t("marketplace.categories.food"), icon: "coffee" },
    { id: "clothing", name: t("marketplace.categories.clothing"), icon: "tag" },
    { id: "electronics", name: t("marketplace.categories.electronics"), icon: "smartphone" },
    { id: "groceries", name: t("marketplace.categories.groceries"), icon: "shopping-cart" },
    { id: "pharmacy", name: t("marketplace.categories.pharmacy"), icon: "heart" },
    { id: "other", name: t("marketplace.categories.other"), icon: "more-horizontal" },
  ]

  const communes: string[] = ["Cocody", "Yopougon", "Plateau", "Treichville", "Adjamé", "Marcory", "Abobo"]

  const loadMerchants = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchNearbyMerchants(selectedCommune || undefined, selectedCategory || undefined)
      const adaptedMerchants = data.map(adaptMerchantInfo)
      setMerchants(adaptedMerchants)
      setFilteredMerchants(adaptedMerchants)
    } catch (error) {
      console.error("Error loading merchants:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedCommune, selectedCategory])

  const filterMerchants = useCallback((): void => {
    let filtered = [...merchants]

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (merchant) => merchant.name.toLowerCase().includes(query) || merchant.category.toLowerCase().includes(query),
      )
    }

    // Filtrer par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((merchant) => merchant.category === selectedCategory)
    }

    // Filtrer par commune
    if (selectedCommune) {
      filtered = filtered.filter((merchant) => merchant.address?.includes(selectedCommune))
    }

    setFilteredMerchants(filtered)
  }, [searchQuery, selectedCategory, selectedCommune, merchants])

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadMerchants()
    setRefreshing(false)
  }

  useEffect(() => {
    loadMerchants()
  }, [loadMerchants])

  useEffect(() => {
    filterMerchants()
  }, [filterMerchants])

  const handleCategorySelect = (categoryId: string): void => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
  }

  const handleCommuneSelect = (commune: string): void => {
    setSelectedCommune(selectedCommune === commune ? null : commune)
  }

  const renderCategoryItem = ({ item }: { item: CategoryItem }): React.ReactElement => (
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

  const renderMerchantItem = ({ item }: { item: Merchant }): React.ReactElement => (
    <Card style={styles.merchantCard} onPress={() => navigation.navigate("MerchantDetails", { merchantId: item.id.toString() })}>
      <Card.Cover
        source={{ uri: item.cover_image || "https://via.placeholder.com/300x150?text=Boutique" }}
        style={styles.merchantImage}
      />

      <Card.Content>
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <IconButton icon="star" size={16} color="#FFC107" style={styles.ratingIcon} />
            <Text style={styles.ratingText}>{(item.rating || 0).toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.merchantDescription} numberOfLines={2}>
          {item.address}
        </Text>

        <View style={styles.merchantFooter}>
          <Chip style={styles.communeChip}>{item.address || 'Abidjan'}</Chip>

          <Text style={styles.deliveryTime}>
            <IconButton icon="clock" size={14} color="#757575" style={styles.timeIcon} />
            {item.delivery_time || 30} min
          </Text>
        </View>
      </Card.Content>
    </Card>
  )

  const renderEmptyList = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <IconButton icon="shopping-bag" size={50} color="#CCCCCC" />
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
```The primary goal is achieved by removing the `commune` property from the `adaptMerchantInfo` function.