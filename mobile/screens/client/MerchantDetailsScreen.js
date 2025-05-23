"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from "react-native"
import { Text, Card, Button, Chip, Divider, ActivityIndicator, IconButton, Badge } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchMerchantDetails, fetchMerchantProducts } from "../../services/api"
import { formatPrice } from "../../utils/formatters"

const MerchantDetailsScreen = ({ route, navigation }) => {
  const { merchantId } = route.params
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [merchant, setMerchant] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [cart, setCart] = useState([])

  useEffect(() => {
    loadMerchantData()
  }, [merchantId])

  const loadMerchantData = async () => {
    try {
      setLoading(true)

      // Charger les détails du commerçant
      const merchantData = await fetchMerchantDetails(merchantId)
      setMerchant(merchantData)

      // Charger les produits du commerçant
      const productsData = await fetchMerchantProducts(merchantId)
      setProducts(productsData)

      // Définir la première catégorie comme sélectionnée par défaut
      if (merchantData.categories && merchantData.categories.length > 0) {
        setSelectedCategory(merchantData.categories[0])
      }
    } catch (error) {
      console.error("Error loading merchant data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
  }

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      // Mettre à jour la quantité si le produit est déjà dans le panier
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      // Ajouter le produit au panier
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    const existingItem = cart.find((item) => item.id === productId)

    if (existingItem && existingItem.quantity > 1) {
      // Réduire la quantité si plus d'un article
      setCart(cart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item)))
    } else {
      // Supprimer l'article du panier
      setCart(cart.filter((item) => item.id !== productId))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const handleCheckout = () => {
    // Préparer les données pour la création d'une livraison
    const deliveryData = {
      merchant: merchant,
      items: cart,
      total: getCartTotal(),
    }

    // Naviguer vers l'écran de création de livraison avec les données du panier
    navigation.navigate("CreateDelivery", {
      merchantOrder: deliveryData,
      pickupAddress: merchant.address,
      pickupCommune: merchant.commune,
    })
  }

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products

  const renderCategoryItem = ({ item }) => (
    <Chip
      selected={selectedCategory === item}
      onPress={() => handleCategorySelect(item)}
      style={[styles.categoryChip, selectedCategory === item && styles.selectedCategoryChip]}
      textStyle={selectedCategory === item ? styles.selectedChipText : {}}
    >
      {item}
    </Chip>
  )

  const renderProductItem = ({ item }) => (
    <Card style={styles.productCard}>
      <Card.Cover
        source={{ uri: item.image_url || "https://via.placeholder.com/300x200?text=Produit" }}
        style={styles.productImage}
      />

      <Card.Content>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)} FCFA</Text>
      </Card.Content>

      <Card.Actions style={styles.productActions}>
        {cart.find((cartItem) => cartItem.id === item.id) ? (
          <View style={styles.quantityControl}>
            <IconButton icon="minus" size={20} onPress={() => removeFromCart(item.id)} style={styles.quantityButton} />
            <Text style={styles.quantityText}>{cart.find((cartItem) => cartItem.id === item.id).quantity}</Text>
            <IconButton icon="plus" size={20} onPress={() => addToCart(item)} style={styles.quantityButton} />
          </View>
        ) : (
          <Button mode="contained" onPress={() => addToCart(item)} style={styles.addButton} icon="cart-plus">
            {t("merchantDetails.addToCart")}
          </Button>
        )}
      </Card.Actions>
    </Card>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("merchantDetails.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!merchant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={50} color="#F44336" />
          <Text style={styles.errorText}>{t("merchantDetails.merchantNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.goBack")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{merchant.name}</Text>
        <TouchableOpacity onPress={() => {}}>
          <View>
            <IconButton icon="share-variant" size={24} color="#212121" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image
          source={{ uri: merchant.banner_url || "https://via.placeholder.com/800x300?text=Boutique" }}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        <View style={styles.merchantInfoContainer}>
          <View style={styles.merchantHeader}>
            <View>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              <View style={styles.ratingContainer}>
                <IconButton icon="star" size={16} color="#FFC107" style={styles.ratingIcon} />
                <Text style={styles.ratingText}>{merchant.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>
                  ({merchant.reviews_count} {t("merchantDetails.reviews")})
                </Text>
              </View>
            </View>

            <Chip style={styles.deliveryTimeChip}>
              <IconButton icon="clock-outline" size={14} color="#757575" style={styles.timeIcon} />
              {merchant.delivery_time} min
            </Chip>
          </View>

          <Text style={styles.merchantDescription}>{merchant.description}</Text>

          <View style={styles.merchantDetails}>
            <View style={styles.detailItem}>
              <IconButton icon="map-marker" size={20} color="#FF6B00" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {merchant.address}, {merchant.commune}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <IconButton icon="phone" size={20} color="#FF6B00" style={styles.detailIcon} />
              <Text style={styles.detailText}>{merchant.phone}</Text>
            </View>

            <View style={styles.detailItem}>
              <IconButton icon="clock" size={20} color="#FF6B00" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {merchant.opening_hours} - {merchant.closing_hours}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>{t("merchantDetails.products")}</Text>

          <FlatList
            data={merchant.categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />

          <View style={styles.productsList}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <View key={product.id} style={styles.productWrapper}>
                  {renderProductItem({ item: product })}
                </View>
              ))
            ) : (
              <View style={styles.emptyProductsContainer}>
                <IconButton icon="package-variant" size={40} color="#CCCCCC" />
                <Text style={styles.emptyProductsText}>{t("merchantDetails.noProducts")}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.cartContainer}>
          <View style={styles.cartInfo}>
            <View style={styles.cartCountContainer}>
              <IconButton icon="cart" size={24} color="#FFFFFF" style={styles.cartIcon} />
              <Badge style={styles.cartBadge}>{getCartItemCount()}</Badge>
            </View>
            <Text style={styles.cartTotal}>{formatPrice(getCartTotal())} FCFA</Text>
          </View>

          <Button mode="contained" onPress={handleCheckout} style={styles.checkoutButton} icon="check-circle">
            {t("merchantDetails.checkout")}
          </Button>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: "#FF6B00",
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  bannerImage: {
    width: "100%",
    height: 200,
  },
  merchantInfoContainer: {
    padding: 16,
  },
  merchantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  reviewCount: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  deliveryTimeChip: {
    backgroundColor: "#F5F5F5",
    height: 30,
  },
  timeIcon: {
    margin: 0,
    padding: 0,
  },
  merchantDescription: {
    fontSize: 14,
    color: "#757575",
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
  detailText: {
    fontSize: 14,
    color: "#212121",
    flex: 1,
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
    marginBottom: 16,
  },
  categoriesList: {
    paddingBottom: 16,
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
  productsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
  },
  productImage: {
    height: 120,
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
  productDescription: {
    fontSize: 12,
    color: "#757575",
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  productActions: {
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#FF6B00",
    height: 36,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButton: {
    margin: 0,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    width: 30,
    textAlign: "center",
  },
  emptyProductsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    width: "100%",
  },
  emptyProductsText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 16,
    textAlign: "center",
  },
  cartContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF6B00",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cartInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartCountContainer: {
    position: "relative",
    marginRight: 8,
  },
  cartIcon: {
    margin: 0,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    color: "#FF6B00",
  },
  cartTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  checkoutButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
})

export default MerchantDetailsScreen
