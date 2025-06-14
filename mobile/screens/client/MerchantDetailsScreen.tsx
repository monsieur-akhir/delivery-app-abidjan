"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl } from "react-native"
import { Text, Card, Button, Chip, Divider, ActivityIndicator, IconButton, Badge } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchMerchantDetails, fetchMerchantProducts, type MerchantInfo, type Product as APIProduct } from "../../services/api" // Adjustez si nécessaire
import fetchCart from "../../services/api"
import addToCart from "../../services/api"
import { formatPrice } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Merchant } from "../../types/models"

// Type adapters to transform API responses to match component interfaces
const adaptMerchantInfo = (merchantInfo: MerchantInfo): Merchant => ({
  id: parseInt(merchantInfo.id),
  name: merchantInfo.name,
  business_name: merchantInfo.name,
  description: merchantInfo.description || '',
  address: merchantInfo.address,
  commune: merchantInfo.commune,
  category: merchantInfo.category,
  categories: [merchantInfo.category],
  rating: merchantInfo.rating || 0,
  review_count: 0,
  is_open: merchantInfo.is_open,
  opening_hours: merchantInfo.opening_hours || '',
  phone: merchantInfo.phone,
  lat: merchantInfo.lat || 0,
  lng: merchantInfo.lng || 0,
  logo: '',
  logo_url: undefined,
  cover_image: '',
  created_at: '',
  updated_at: '',
  delivery_time: '30'
})

const adaptProduct = (apiProduct: APIProduct): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  description: apiProduct.description || '',
  price: apiProduct.price,
  category: apiProduct.category,
  image_url: apiProduct.image_url,
  is_popular: false
})

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_popular?: boolean
}

interface CartItem {
  id: string
  product_id: string
  quantity: number
  price: number
}

type MerchantDetailsScreenProps = {
  route: RouteProp<RootStackParamList, "MerchantDetails">
  navigation: NativeStackNavigationProp<RootStackParamList, "MerchantDetails">
}

interface Category {
  id: string
  name: string
}

const MerchantDetailsScreen: React.FC<MerchantDetailsScreenProps> = ({ route, navigation }) => {
  const { merchantId } = route.params
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState<number>(0)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const loadMerchantDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const merchantData = await fetchMerchantDetails(merchantId)
      setMerchant(adaptMerchantInfo(merchantData))
      const productsData = await fetchMerchantProducts(merchantId)
      const adaptedProducts = productsData.map(adaptProduct)
      setProducts(adaptedProducts)
      setFilteredProducts(adaptedProducts)
      const uniqueCategories = Array.from(new Set(adaptedProducts.map((product) => product.category))).map((category) => ({
        id: category,
        name: category,
      }))
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error loading merchant details:", error)
    } finally {
      setLoading(false)
    }
  }, [merchantId])

  const loadCart = useCallback(async (): Promise<void> => {
    try {
      const cartData = await fetchCart({})
      setCartItems(cartData.data.items)
      setCartCount(cartData.data.items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0))
    } catch (error) {
      console.error("Error loading cart:", error)
    }
  }, [])

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await Promise.all([loadMerchantDetails(), loadCart()])
    setRefreshing(false)
  }

  const filterProducts = useCallback((): void => {
    if (!selectedCategory) {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter((product) => product.category === selectedCategory))
    }
  }, [selectedCategory, products])

  useEffect(() => {
    loadMerchantDetails()
    loadCart()
  }, [merchantId, loadMerchantDetails, loadCart])

  useEffect(() => {
    filterProducts()
  }, [selectedCategory, products, filterProducts])

  const handleCategorySelect = (categoryId: string): void => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
  }

  const handleAddToCart = async (product: Product): Promise<void> => {
    if (!isConnected) {
      return
    }

    try {
      setAddingToCart(product.id)
      await addToCart(
        "/cart/items",
        {
          data: {
            product_id: product.id,
            merchant_id: merchantId,
            quantity: 1,
          },
        }
      )
      await loadCart()
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setAddingToCart(null)
    }
  }

  const viewCart = (): void => {
    navigation.navigate("Cart", { merchantId })
  }

  const renderCategoryItem = ({ item }: { item: Category }): React.ReactElement => (
    <Chip
      selected={selectedCategory === item.id}
      onPress={() => handleCategorySelect(item.id)}
      style={[styles.categoryChip, selectedCategory === item.id && styles.selectedCategoryChip]}
      textStyle={selectedCategory === item.id ? styles.selectedChipText : {}}
    >
      {item.name}
    </Chip>
  )

  const renderProductItem = ({ item }: { item: Product }): React.ReactElement => {
    const isInCart = cartItems.some((cartItem) => cartItem.product_id === item.id)
    const cartItem = cartItems.find((cartItem) => cartItem.product_id === item.id)

    return (
      <Card style={styles.productCard}>
        <Image source={{ uri: item.image_url || "https://via.placeholder.com/100" }} style={styles.productImage} />
        <Card.Content style={styles.productContent}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            {item.is_popular && (
              <Chip style={styles.popularChip} textStyle={styles.popularChipText}>
                {t("merchant.popular")}
              </Chip>
            )}
          </View>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{formatPrice(item.price)} FCFA</Text>
            {isInCart ? (
              <View style={styles.quantityContainer}>
                <IconButton
                  icon="minus"
                  size={16}
                  iconColor="#FF6B00"
                  style={styles.quantityButton}
                  onPress={() => {
                    /* Implémenter la diminution de quantité */
                  }}
                />
                <Text style={styles.quantityText}>{cartItem?.quantity || 0}</Text>
                <IconButton
                  icon="plus"
                  size={16}
                  iconColor="#FF6B00"
                  style={styles.quantityButton}
                  onPress={() => handleAddToCart(item)}
                />
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleAddToCart(item)}
                style={styles.addButton}
                loading={addingToCart === item.id}
                disabled={addingToCart !== null}
              >
                {t("merchant.add")}
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} iconColor="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("merchant.loading")}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("merchant.loadingDetails")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!merchant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} iconColor="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("merchant.error")}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.errorContainer}>
          <IconButton icon="store-off" size={50} iconColor="#CCCCCC" />
          <Text style={styles.errorText}>{t("merchant.merchantNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.back")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} iconColor="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {merchant.name}
        </Text>
        <TouchableOpacity onPress={viewCart}>
          <View>
            <IconButton icon="cart" size={24} iconColor="#212121" />
            {cartCount > 0 && <Badge style={styles.cartBadge}>{cartCount}</Badge>}
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        <Image
          source={{ uri: merchant.cover_image || "https://via.placeholder.com/500x200?text=Boutique" }}
          style={styles.coverImage}
        />
        <View style={styles.merchantInfoContainer}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              <View style={styles.ratingContainer}>
                <IconButton icon="star" size={16} iconColor="#FFC107" style={styles.ratingIcon} />
                <Text style={styles.ratingText}>{merchant.rating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.ratingCount}>({merchant.review_count})</Text>
              </View>
            </View>
            <View style={styles.merchantMeta}>
              <Chip icon="map-marker" style={styles.communeChip}>
                {merchant.address || 'Location not specified'}
              </Chip>
              {merchant.delivery_time && (
                <View style={styles.deliveryTimeContainer}>
                  <IconButton icon="clock-outline" size={16} iconColor="#757575" style={styles.timeIcon} />
                  <Text style={styles.deliveryTime}>{merchant.delivery_time} min</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.merchantDescription}>{merchant.description}</Text>
          <View style={styles.merchantDetails}>
            <View style={styles.detailItem}>
              <IconButton icon="clock-outline" size={20} iconColor="#FF6B00" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>{t("merchant.openingHours")}</Text>
                <Text style={styles.detailValue}>{merchant.opening_hours}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <IconButton icon="phone" size={20} iconColor="#FF6B00" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>{t("merchant.phone")}</Text>
                <Text style={styles.detailValue}>{merchant.phone}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <IconButton icon="map-marker" size={20} iconColor="#FF6B00" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>{t("merchant.address")}</Text>
                <Text style={styles.detailValue}>{merchant.address}</Text>
              </View>
            </View>
          </View>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>{t("merchant.products")}</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => <View key={product.id}>{renderProductItem({ item: product })}</View>)
          ) : (
            <View style={styles.emptyProductsContainer}>
              <IconButton icon="package-variant" size={50} iconColor="#CCCCCC" />
              <Text style={styles.emptyText}>{t("merchant.noProducts")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {cartCount > 0 && (
        <View style={styles.cartPreview}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>
              {cartCount} {cartCount === 1 ? t("merchant.item") : t("merchant.items")}
            </Text>
            <Text style={styles.cartTotal}>
              {formatPrice(cartItems.reduce((total, item) => total + item.price * item.quantity, 0))} FCFA
            </Text>
          </View>
          <Button mode="contained" onPress={viewCart} style={styles.viewCartButton}>
            {t("merchant.viewCart")}
          </Button>
        </View>
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
    flex: 1,
    textAlign: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginVertical: 16,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#FF6B00",
  },
  coverImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  merchantInfoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  merchantHeader: {
    marginBottom: 12,
  },
  merchantInfo: {
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
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
  ratingCount: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
  },
  merchantMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  communeChip: {
    backgroundColor: "#F5F5F5",
    height: 28,
  },
  deliveryTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    margin: 0,
    padding: 0,
  },
  deliveryTime: {
    fontSize: 14,
    color: "#757575",
  },
  merchantDescription: {
    fontSize: 14,
    color: "#212121",
    lineHeight: 20,
    marginBottom: 16,
  },
  merchantDetails: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    margin: 0,
    padding: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: "#757575",
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
  },
  divider: {
    marginVertical: 16,
  },
  productsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  categoriesList: {
    paddingBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedCategoryChip: {
    backgroundColor: "#FF6B00",
  },
  selectedChipText: {
    color: "#FFFFFF",
  },
  productCard: {
    marginBottom: 16,
    flexDirection: "row",
    overflow: "hidden",
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productContent: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
  },
  popularChip: {
    backgroundColor: "#FFF3E0",
    height: 24,
  },
  popularChipText: {
    color: "#FF6B00",
    fontSize: 10,
  },
  productDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  quantityButton: {
    margin: 0,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    minWidth: 24,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#FF6B00",
  },
  emptyProductsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 16,
  },
  cartPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  cartInfo: {
    flex: 1,
  },
  cartCount: {
    fontSize: 14,
    color: "#757575",
  },
  cartTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  viewCartButton: {
    backgroundColor: "#FF6B00",
  },
})

export default MerchantDetailsScreen