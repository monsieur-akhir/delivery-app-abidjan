<template>
  <div class="marketplace-container">
    <div class="page-header">
      <h1>Gestion du marché</h1>
      <div class="actions">
        <button class="btn btn-primary" @click="showAddProductModal = true">
          <i class="fas fa-plus"></i> Ajouter un produit
        </button>
        <button class="btn btn-outline" @click="exportProducts">
          <i class="fas fa-download"></i> Exporter
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-container">
      <div class="search-box">
        <input
          type="text"
          v-model="filters.search"
          placeholder="Rechercher un produit..."
          @input="applyFilters"
        />
        <i class="fas fa-search"></i>
      </div>
      <div class="filter-group">
        <select v-model="filters.category" @change="applyFilters">
          <option value="">Toutes les catégories</option>
          <option v-for="category in categories" :key="category.value" :value="category.value">
            {{ category.label }}
          </option>
        </select>
        <select v-model="filters.availability" @change="applyFilters">
          <option value="">Disponibilité</option>
          <option value="true">Disponible</option>
          <option value="false">Non disponible</option>
        </select>
        <select v-model="filters.sortBy" @change="applyFilters">
          <option value="name">Nom (A-Z)</option>
          <option value="-name">Nom (Z-A)</option>
          <option value="price">Prix (croissant)</option>
          <option value="-price">Prix (décroissant)</option>
          <option value="created_at">Plus récent</option>
          <option value="-created_at">Plus ancien</option>
        </select>
      </div>
    </div>

    <!-- Liste des produits -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des produits...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchProducts">Réessayer</button>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <img src="../../../assets/images/empty-products.svg" alt="Aucun produit" />
      <h3>Aucun produit trouvé</h3>
      <p>Ajoutez des produits à votre catalogue pour les rendre disponibles à la livraison.</p>
      <button class="btn btn-primary" @click="showAddProductModal = true">
        Ajouter un produit
      </button>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <div class="product-image">
          <img :src="product.image_url || '/images/default-product.png'" :alt="product.name" />
          <span class="availability-badge" :class="{ available: product.is_available }">
            {{ product.is_available ? 'Disponible' : 'Non disponible' }}
          </span>
        </div>
        <div class="product-details">
          <h3>{{ product.name }}</h3>
          <p class="product-category">{{ getCategoryLabel(product.category) }}</p>
          <p class="product-price">{{ formatPrice(product.price) }} FCFA</p>
          <p class="product-description">{{ truncateText(product.description, 100) }}</p>
        </div>
        <div class="product-actions">
          <button class="btn btn-icon" @click="editProduct(product)">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-icon" @click="toggleAvailability(product)">
            <i :class="product.is_available ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
          <button class="btn btn-icon btn-danger" @click="confirmDeleteProduct(product)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredProducts.length > 0" class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
        class="btn btn-icon"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Page {{ currentPage }} sur {{ totalPages }}</span>
      <button
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
        class="btn btn-icon"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal d'ajout/modification de produit -->
    <div v-if="showAddProductModal || showEditProductModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ showEditProductModal ? 'Modifier le produit' : 'Ajouter un produit' }}</h2>
          <button class="btn-close" @click="closeModals">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="showEditProductModal ? updateProduct() : createProduct()">
            <div class="form-group">
              <label for="productName">Nom du produit*</label>
              <input
                type="text"
                id="productName"
                v-model="productForm.name"
                required
                placeholder="Ex: Poulet braisé"
              />
            </div>
            <div class="form-group">
              <label for="productCategory">Catégorie*</label>
              <select id="productCategory" v-model="productForm.category" required>
                <option value="" disabled>Sélectionnez une catégorie</option>
                <option
                  v-for="category in categories"
                  :key="category.value"
                  :value="category.value"
                >
                  {{ category.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="productPrice">Prix (FCFA)*</label>
              <input
                type="number"
                id="productPrice"
                v-model="productForm.price"
                required
                min="0"
                step="50"
                placeholder="Ex: 2500"
              />
            </div>
            <div class="form-group">
              <label for="productDescription">Description</label>
              <textarea
                id="productDescription"
                v-model="productForm.description"
                rows="3"
                placeholder="Décrivez votre produit..."
              ></textarea>
            </div>
            <div class="form-group">
              <label for="productImage">Image du produit</label>
              <div class="image-upload">
                <div v-if="productForm.image_preview" class="image-preview">
                  <img :src="productForm.image_preview" alt="Aperçu de l'image" />
                  <button type="button" class="btn-remove-image" @click="removeImage">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <input type="file" id="productImage" @change="handleImageUpload" accept="image/*" />
                <label for="productImage" class="upload-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>Choisir une image</span>
                </label>
                <p class="help-text">Format JPG ou PNG, max 2MB. Taille recommandée: 500x500px</p>
              </div>
            </div>
            <div class="form-group checkbox-group">
              <input type="checkbox" id="productAvailability" v-model="productForm.is_available" />
              <label for="productAvailability">Produit disponible</label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="closeModals">Annuler</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting">
                  <i class="fas fa-spinner fa-spin"></i> Traitement...
                </span>
                <span v-else>
                  {{ showEditProductModal ? 'Mettre à jour' : 'Ajouter' }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-container modal-sm">
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button class="btn-close" @click="showDeleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Êtes-vous sûr de vouloir supprimer le produit
            <strong>{{ productToDelete?.name }}</strong> ?
          </p>
          <p class="warning-text">Cette action est irréversible.</p>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="showDeleteModal = false">
              Annuler
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteProduct"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin"></i> Suppression...
              </span>
              <span v-else> <i class="fas fa-trash"></i> Supprimer </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { formatPrice, truncateText } from '@/utils/formatters'
import { exportToCSV, exportToExcel } from '@/utils/export-utils'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/market'
import { uploadImage } from '@/api/storage'
import { categories } from '@/config'

export default {
  name: 'MarketplaceView',
  setup() {
    const { showToast } = useToast()

    // État
    const products = ref([])
    const loading = ref(true)
    const error = ref(null)
    const currentPage = ref(1)
    const itemsPerPage = ref(12)
    const showAddProductModal = ref(false)
    const showEditProductModal = ref(false)
    const showDeleteModal = ref(false)
    const isSubmitting = ref(false)
    const productToDelete = ref(null)

    // Formulaire
    const productForm = reactive({
      id: null,
      name: '',
      category: '',
      price: '',
      description: '',
      image_file: null,
      image_url: '',
      image_preview: '',
      is_available: true,
    })

    // Filtres
    const filters = reactive({
      search: '',
      category: '',
      availability: '',
      sortBy: 'name',
    })

    // Computed
    const filteredProducts = computed(() => {
      let result = [...products.value]

      // Filtre par recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        result = result.filter(
          product =>
            product.name.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower))
        )
      }

      // Filtre par catégorie
      if (filters.category) {
        result = result.filter(product => product.category === filters.category)
      }

      // Filtre par disponibilité
      if (filters.availability !== '') {
        const isAvailable = filters.availability === 'true'
        result = result.filter(product => product.is_available === isAvailable)
      }

      // Tri
      const sortField = filters.sortBy.startsWith('-')
        ? filters.sortBy.substring(1)
        : filters.sortBy
      const sortDirection = filters.sortBy.startsWith('-') ? -1 : 1

      result.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortDirection
        if (a[sortField] > b[sortField]) return 1 * sortDirection
        return 0
      })

      return result
    })

    const paginatedProducts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredProducts.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredProducts.value.length / itemsPerPage.value) || 1
    })

    // Méthodes
    const fetchProducts = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await getProducts()
        products.value = response.data
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err)
        error.value = 'Impossible de charger les produits. Veuillez réessayer.'
      } finally {
        loading.value = false
      }
    }

    const applyFilters = () => {
      currentPage.value = 1 // Réinitialiser la pagination lors du filtrage
    }

    const changePage = page => {
      currentPage.value = page
    }

    const resetForm = () => {
      productForm.id = null
      productForm.name = ''
      productForm.category = ''
      productForm.price = ''
      productForm.description = ''
      productForm.image_file = null
      productForm.image_url = ''
      productForm.image_preview = ''
      productForm.is_available = true
    }

    const closeModals = () => {
      showAddProductModal.value = false
      showEditProductModal.value = false
      showDeleteModal.value = false
      resetForm()
    }

    const handleImageUpload = event => {
      const file = event.target.files[0]
      if (!file) return

      // Vérifier le type de fichier
      if (!file.type.match('image.*')) {
        showToast('Erreur', 'Veuillez sélectionner une image (JPG, PNG)', 'error')
        return
      }

      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast('Erreur', "L'image ne doit pas dépasser 2MB", 'error')
        return
      }

      productForm.image_file = file

      // Créer un aperçu de l'image
      const reader = new FileReader()
      reader.onload = e => {
        productForm.image_preview = e.target.result
      }
      reader.readAsDataURL(file)
    }

    const removeImage = () => {
      productForm.image_file = null
      productForm.image_preview = ''
      productForm.image_url = ''

      // Réinitialiser l'input file
      const fileInput = document.getElementById('productImage')
      if (fileInput) fileInput.value = ''
    }

    const editProduct = product => {
      productForm.id = product.id
      productForm.name = product.name
      productForm.category = product.category
      productForm.price = product.price
      productForm.description = product.description || ''
      productForm.image_url = product.image_url || ''
      productForm.image_preview = product.image_url || ''
      productForm.is_available = product.is_available

      showEditProductModal.value = true
    }

    const updateProductData = async () => {
      isSubmitting.value = true

      try {
        // Télécharger la nouvelle image si présente
        let imageUrl = productForm.image_url
        if (productForm.image_file) {
          const formData = new FormData()
          formData.append('file', productForm.image_file)
          const uploadResponse = await uploadImage(formData)
          imageUrl = uploadResponse.data.url
        }

        // Mettre à jour le produit
        const productData = {
          name: productForm.name,
          category: productForm.category,
          price: parseFloat(productForm.price),
          description: productForm.description,
          image_url: imageUrl,
          is_available: productForm.is_available,
        }

        await updateProduct(productForm.id, productData)

        showToast('Succès', 'Produit mis à jour avec succès', 'success')
        closeModals()
        fetchProducts()
      } catch (err) {
        console.error('Erreur lors de la mise à jour du produit:', err)
        showToast('Erreur', 'Impossible de mettre à jour le produit. Veuillez réessayer.', 'error')
      } finally {
        isSubmitting.value = false
      }
    }

    const toggleAvailability = async product => {
      try {
        await updateProduct(product.id, {
          is_available: !product.is_available,
        })

        // Mettre à jour localement
        const index = products.value.findIndex(p => p.id === product.id)
        if (index !== -1) {
          products.value[index].is_available = !product.is_available
        }

        showToast(
          'Succès',
          `Produit marqué comme ${!product.is_available ? 'disponible' : 'non disponible'}`,
          'success'
        )
      } catch (err) {
        console.error('Erreur lors de la mise à jour de la disponibilité:', err)
        showToast(
          'Erreur',
          'Impossible de mettre à jour la disponibilité. Veuillez réessayer.',
          'error'
        )
      }
    }

    const confirmDeleteProduct = product => {
      productToDelete.value = product
      showDeleteModal.value = true
    }

    const deleteProductData = async () => {
      if (!productToDelete.value) return

      isSubmitting.value = true

      try {
        await deleteProduct(productToDelete.value.id)

        showToast('Succès', 'Produit supprimé avec succès', 'success')
        showDeleteModal.value = false
        productToDelete.value = null
        fetchProducts()
      } catch (err) {
        console.error('Erreur lors de la suppression du produit:', err)
        showToast('Erreur', 'Impossible de supprimer le produit. Veuillez réessayer.', 'error')
      } finally {
        isSubmitting.value = false
      }
    }

    const exportProducts = () => {
      const data = filteredProducts.value.map(product => ({
        Nom: product.name,
        Catégorie: getCategoryLabel(product.category),
        'Prix (FCFA)': product.price,
        Description: product.description || '',
        Disponible: product.is_available ? 'Oui' : 'Non',
        'Date de création': new Date(product.created_at).toLocaleDateString(),
      }))

      exportToCSV(data, 'produits')
    }

    const getCategoryLabel = value => {
      const category = categories.find(cat => cat.value === value)
      return category ? category.label : value
    }

    // Cycle de vie
    onMounted(() => {
      fetchProducts()
    })

    return {
      products,
      loading,
      error,
      currentPage,
      filteredProducts,
      totalPages,
      showAddProductModal,
      showEditProductModal,
      showDeleteModal,
      isSubmitting,
      productForm,
      productToDelete,
      filters,
      categories,

      fetchProducts,
      applyFilters,
      changePage,
      closeModals,
      handleImageUpload,
      removeImage,
      editProduct,
      updateProduct: updateProductData,
      toggleAvailability,
      confirmDeleteProduct,
      deleteProduct: deleteProductData,
      exportProducts,
      getCategoryLabel,

      formatPrice,
      truncateText,
    }
  },
}
</script>

<style scoped>
.marketplace-container {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.search-box i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  background-color: white;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.product-card {
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.availability-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #dc3545;
  color: white;
}

.availability-badge.available {
  background-color: #28a745;
}

.product-details {
  padding: 1rem;
}

.product-details h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.product-category {
  color: #6c757d;
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
}

.product-price {
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
  color: #212529;
}

.product-description {
  font-size: 0.9rem;
  color: #495057;
  margin: 0;
  line-height: 1.4;
}

.product-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem;
  border-top: 1px solid #e9ecef;
  gap: 0.5rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #ced4da;
  background-color: white;
  color: #495057;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.btn-icon:hover {
  background-color: #f8f9fa;
}

.btn-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.btn-danger:hover {
  background-color: #dc3545;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input {
  width: auto;
}

.checkbox-group label {
  margin-bottom: 0;
}

.image-upload {
  border: 2px dashed #ced4da;
  border-radius: 0.25rem;
  padding: 1rem;
  text-align: center;
}

.image-preview {
  position: relative;
  margin-bottom: 1rem;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 0.25rem;
}

.btn-remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #dc3545;
}

input[type='file'] {
  display: none;
}

.upload-label {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.upload-label i {
  margin-right: 0.5rem;
}

.help-text {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  border: 1px solid #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}

.btn-outline {
  background-color: white;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background-color: #f8f9fa;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.empty-state img {
  width: 150px;
  height: 150px;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 1.5rem;
  max-width: 500px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .actions {
    width: 100%;
  }

  .filters-container {
    flex-direction: column;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
