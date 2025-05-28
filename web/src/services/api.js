import axios from 'axios';
import { API } from '@/utils/constants';

// Configuration de l'instance axios
const apiClient = axios.create({
  baseURL: API.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fonctions d'API pour le profil d'entreprise
export const getBusinessProfile = async () => {
  return apiClient.get('/businesses/profile');
};

export const updateBusinessProfile = async (profileData) => {
  return apiClient.put('/businesses/profile', profileData);
};

export const uploadBusinessLogo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/businesses/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadBusinessDocument = async (documentType, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  return apiClient.post('/businesses/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Fonctions d'API pour les commandes
export const getBusinessOrders = async (params) => {
  return apiClient.get('/businesses/orders', { params });
};

export const updateOrderStatus = async (orderId, status) => {
  return apiClient.patch(`/businesses/orders/${orderId}/status`, { status });
};

// Fonctions d'API pour les produits
export const getBusinessProducts = async (params) => {
  return apiClient.get('/businesses/products', { params });
};

export const createProduct = async (productData) => {
  return apiClient.post('/businesses/products', productData);
};

export const updateProduct = async (productId, productData) => {
  return apiClient.put(`/businesses/products/${productId}`, productData);
};

export const deleteProduct = async (productId) => {
  return apiClient.delete(`/businesses/products/${productId}`);
};

export const uploadProductImage = async (productId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/businesses/products/${productId}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Fonctions d'API pour les analyses
export const getBusinessAnalytics = async (params) => {
  return apiClient.get('/businesses/analytics', { params });
};

// Fonctions d'API pour les avis clients
export const getBusinessReviews = async (params) => {
  return apiClient.get('/businesses/reviews', { params });
};

export const respondToReview = async (reviewId, response) => {
  return apiClient.post(`/businesses/reviews/${reviewId}/response`, { response });
};

// Export de l'instance apiClient pour utilisation directe
export default apiClient;
