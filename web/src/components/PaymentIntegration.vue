<template>
  <div class="payment-integration">
    <div v-if="loading" class="payment-loading">
      <div class="spinner"></div>
      <p>Chargement du système de paiement...</p>
    </div>
    <div v-else-if="error" class="payment-error">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="initPayment">Réessayer</button>
    </div>
    <div v-else>
      <div class="payment-methods" v-if="!selectedMethod">
        <h3 class="payment-title">Choisissez un moyen de paiement</h3>
        <div class="methods-grid">
          <div 
            v-for="method in availableMethods" 
            :key="method.id" 
            class="payment-method-card"
            @click="selectPaymentMethod(method)"
          >
            <div class="method-icon">
              <img v-if="method.icon" :src="method.icon" :alt="method.name" />
              <i v-else :class="method.iconClass"></i>
            </div>
            <div class="method-info">
              <div class="method-name">{{ method.name }}</div>
              <div class="method-description">{{ method.description }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="payment-form" v-else>
        <div class="payment-header">
          <button class="btn-back" @click="selectedMethod = null">
            <i class="fas fa-arrow-left"></i>
            Retour
          </button>
          <h3 class="payment-title">{{ selectedMethod.name }}</h3>
        </div>
        
        <!-- Formulaire de carte de crédit -->
        <div v-if="selectedMethod.id === 'card'" class="card-form">
          <div class="form-group">
            <label for="card-number">Numéro de carte</label>
            <div class="card-number-input">
              <input 
                type="text" 
                id="card-number" 
                v-model="cardForm.number" 
                placeholder="1234 5678 9012 3456" 
                maxlength="19"
                @input="formatCardNumber"
              />
              <div class="card-type">
                <i :class="getCardTypeIcon()"></i>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="card-expiry">Date d'expiration</label>
              <input 
                type="text" 
                id="card-expiry" 
                v-model="cardForm.expiry" 
                placeholder="MM/AA" 
                maxlength="5"
                @input="formatCardExpiry"
              />
            </div>
            <div class="form-group">
              <label for="card-cvv">CVV</label>
              <input 
                type="text" 
                id="card-cvv" 
                v-model="cardForm.cvv" 
                placeholder="123" 
                maxlength="4"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="card-name">Nom sur la carte</label>
            <input 
              type="text" 
              id="card-name" 
              v-model="cardForm.name" 
              placeholder="JEAN DUPONT"
            />
          </div>
        </div>
        
        <!-- Formulaire de mobile money -->
        <div v-if="selectedMethod.id === 'mobile_money'" class="mobile-money-form">
          <div class="form-group">
            <label for="mobile-operator">Opérateur</label>
            <select id="mobile-operator" v-model="mobileMoneyForm.operator">
              <option value="">Sélectionner un opérateur</option>
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN Mobile Money</option>
              <option value="moov">Moov Money</option>
              <option value="wave">Wave</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="mobile-number">Numéro de téléphone</label>
            <input 
              type="tel" 
              id="mobile-number" 
              v-model="mobileMoneyForm.number" 
              placeholder="07 XX XX XX XX"
            />
          </div>
        </div>
        
        <!-- Formulaire de paiement à la livraison -->
        <div v-if="selectedMethod.id === 'cash'" class="cash-form">
          <div class="cash-notice">
            <i class="fas fa-info-circle"></i>
            <p>Vous paierez le montant total au coursier lors de la livraison.</p>
          </div>
          
          <div class="form-group">
            <label for="cash-amount">Montant à préparer</label>
            <div class="amount-display">{{ formatCurrency(amount) }}</div>
          </div>
        </div>
        
        <div class="payment-summary">
          <div class="summary-row">
            <div class="summary-label">Sous-total</div>
            <div class="summary-value">{{ formatCurrency(subtotal) }}</div>
          </div>
          <div class="summary-row" v-if="fees > 0">
            <div class="summary-label">Frais</div>
            <div class="summary-value">{{ formatCurrency(fees) }}</div>
          </div>
          <div class="summary-row total">
            <div class="summary-label">Total</div>
            <div class="summary-value">{{ formatCurrency(amount) }}</div>
          </div>
        </div>
        
        <div class="payment-actions">
          <button 
            class="btn btn-primary btn-pay" 
            @click="processPayment"
            :disabled="!isPaymentFormValid || processing"
          >
            <i class="fas fa-spinner fa-spin" v-if="processing"></i>
            <span v-else>Payer {{ formatCurrency(amount) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'PaymentIntegration',
  props: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'XOF'
    },
    orderId: {
      type: String,
      default: null
    },
    customerEmail: {
      type: String,
      default: null
    },
    customerPhone: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: 'Paiement de livraison'
    }
  },
  emits: ['payment-success', 'payment-error', 'payment-cancel'],
  setup(props, { emit }) {
    const loading = ref(true);
    const error = ref(null);
    const processing = ref(false);
    const selectedMethod = ref(null);
    
    // Formulaire de carte de crédit
    const cardForm = ref({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    });
    
    // Formulaire de mobile money
    const mobileMoneyForm = ref({
      operator: '',
      number: ''
    });
    
    // Méthodes de paiement disponibles
    const availableMethods = ref([
      {
        id: 'card',
        name: 'Carte de crédit / débit',
        description: 'Visa, Mastercard, etc.',
        iconClass: 'fas fa-credit-card',
        fees: 0
      },
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        description: 'Orange Money, MTN Mobile Money, etc.',
        iconClass: 'fas fa-mobile-alt',
        fees: 100
      },
      {
        id: 'cash',
        name: 'Paiement à la livraison',
        description: 'Payez en espèces à la réception',
        iconClass: 'fas fa-money-bill-wave',
        fees: 0
      }
    ]);
    
    // Sous-total (montant sans frais)
    const subtotal = computed(() => {
      return props.amount;
    });
    
    // Frais de paiement
    const fees = computed(() => {
      if (!selectedMethod.value) return 0;
      return selectedMethod.value.fees || 0;
    });
    
    // Validation du formulaire de paiement
    const isPaymentFormValid = computed(() => {
      if (!selectedMethod.value) return false;
      
      if (selectedMethod.value.id === 'card') {
        return (
          cardForm.value.number.replace(/\s/g, '').length === 16 &&
          cardForm.value.expiry.length === 5 &&
          cardForm.value.cvv.length >= 3 &&
          cardForm.value.name.trim().length > 0
        );
      } else if (selectedMethod.value.id === 'mobile_money') {
        return (
          mobileMoneyForm.value.operator &&
          mobileMoneyForm.value.number.replace(/\s/g, '').length >= 10
        );
      } else if (selectedMethod.value.id === 'cash') {
        return true;
      }
      
      return false;
    });
    
    // Initialiser le système de paiement
    const initPayment = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // Dans un environnement réel, cette fonction initialiserait le système de paiement
        // Pour la démonstration, nous simulons un délai
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        loading.value = false;
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du paiement:', err);
        error.value = 'Impossible d\'initialiser le système de paiement. Veuillez réessayer.';
        loading.value = false;
      }
    };
    
    // Sélectionner une méthode de paiement
    const selectPaymentMethod = (method) => {
      selectedMethod.value = method;
    };
    
    // Formater le numéro de carte
    const formatCardNumber = () => {
      let value = cardForm.value.number.replace(/\s/g, '');
      
      // Limiter à 16 chiffres
      value = value.replace(/[^0-9]/g, '').substring(0, 16);
      
      // Ajouter des espaces tous les 4 chiffres
      const parts = [];
      for (let i = 0; i < value.length; i += 4) {
        parts.push(value.substring(i, i + 4));
      }
      
      cardForm.value.number = parts.join(' ');
    };
    
    // Formater la date d'expiration
    const formatCardExpiry = () => {
      let value = cardForm.value.expiry.replace(/[^0-9]/g, '');
      
      if (value.length > 2) {
        cardForm.value.expiry = value.substring(0, 2) + '/' + value.substring(2, 4);
      } else {
        cardForm.value.expiry = value;
      }
    };
    
    // Obtenir l'icône du type de carte
    const getCardTypeIcon = () => {
      const number = cardForm.value.number.replace(/\s/g, '');
      
      if (number.startsWith('4')) {
        return 'fab fa-cc-visa';
      } else if (number.startsWith('5')) {
        return 'fab fa-cc-mastercard';
      } else if (number.startsWith('3')) {
        return 'fab fa-cc-amex';
      } else {
        return 'fas fa-credit-card';
      }
    };
    
    // Formater la devise
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: props.currency,
        minimumFractionDigits: 0
      }).format(amount);
    };
    
    // Traiter le paiement
    const processPayment = async () => {
      if (!isPaymentFormValid.value) return;
      
      processing.value = true;
      
      try {
        // Dans un environnement réel, cette fonction appellerait l'API de paiement
        // Pour la démonstration, nous simulons un délai et un résultat aléatoire
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simuler un résultat aléatoire (80% de succès, 20% d'échec)
        const success = Math.random() < 0.8;
        
        if (success) {
          // Créer un objet de résultat de paiement
          const paymentResult = {
            id: 'pay_' + Date.now(),
            amount: props.amount + fees.value,
            currency: props.currency,
            method: selectedMethod.value.id,
            status: 'success',
            date: new Date(),
            orderId: props.orderId,
            transactionId: 'txn_' + Math.random().toString(36).substring(2, 15)
          };
          
          // Émettre l'événement de succès
          emit('payment-success', paymentResult);
        } else {
          // Simuler une erreur
          throw new Error('Transaction refusée par l\'émetteur de la carte');
        }
      } catch (err) {
        console.error('Erreur lors du traitement du paiement:', err);
        error.value = err.message || 'Une erreur est survenue lors du traitement du paiement';
        emit('payment-error', { error: error.value });
      } finally {
        processing.value = false;
      }
    };
    
    // Annuler le paiement
    const cancelPayment = () => {
      emit('payment-cancel');
    };
    
    // Initialiser au montage du composant
    onMounted(() => {
      initPayment();
    });
    
    return {
      loading,
      error,
      processing,
      selectedMethod,
      cardForm,
      mobileMoneyForm,
      availableMethods,
      subtotal,
      fees,
      isPaymentFormValid,
      initPayment,
      selectPaymentMethod,
      formatCardNumber,
      formatCardExpiry,
      getCardTypeIcon,
      formatCurrency,
      processPayment,
      cancelPayment
    };
  }
};
</script>

<style scoped>
.payment-integration {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.payment-loading,
.payment-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.payment-methods {
  padding: 1.5rem;
}

.payment-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.payment-method-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-method-card:hover {
  border-color: #4f46e5;
  background-color: #f3f4f6;
}

.method-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 50%;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.method-icon img {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
}

.method-info {
  flex: 1;
}

.method-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.method-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.payment-form {
  padding: 1.5rem;
}

.payment-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-back {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  margin-right: 1rem;
}

.btn-back i {
  margin-right: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #4f46e5;
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.card-number-input {
  position: relative;
}

.card-type {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.cash-notice {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
}

.cash-notice i {
  margin-right: 0.75rem;
  color: #4f46e5;
  margin-top: 0.25rem;
}

.cash-notice p {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.amount-display {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  text-align: center;
}

.payment-summary {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-label {
  color: #6b7280;
}

.summary-value {
  font-weight: 500;
  color: #1f2937;
}

.summary-row.total {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.summary-row.total .summary-label,
.summary-row.total .summary-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.125rem;
}

.payment-actions {
  margin-top: 2rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-pay {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
