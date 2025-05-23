<template>
  <div class="participant-share-form">
    <div class="form-group">
      <label for="share-percentage" class="form-label">Pourcentage de partage <span class="required">*</span></label>
      <div class="input-group">
        <input 
          type="number" 
          id="share-percentage" 
          v-model.number="sharePercentage" 
          class="form-input" 
          min="0"
          max="100"
          step="1"
          required
        />
        <div class="input-group-append">
          <span class="input-group-text">%</span>
        </div>
      </div>
      <div class="form-hint">
        Pourcentage des gains attribués à ce participant
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Participant</label>
      <div class="participant-info">
        <div class="participant-avatar">
          <img v-if="participant.profile_picture" :src="participant.profile_picture" :alt="participant.name" />
          <div v-else class="avatar-placeholder">{{ getInitials(participant.name) }}</div>
        </div>
        <div class="participant-details">
          <div class="participant-name">{{ participant.name }}</div>
          <div class="participant-rating">
            <i class="fas fa-star star-icon"></i>
            {{ participant.rating }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Montant estimé</label>
      <div class="estimated-amount">
        {{ formatCurrency(estimatedAmount) }}
      </div>
      <div class="form-hint">
        Basé sur le prix total de la livraison et le pourcentage de partage
      </div>
    </div>
    
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" v-model="sendNotification" />
        <span>Envoyer une notification au participant</span>
      </label>
    </div>
    
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="cancel">Annuler</button>
      <button 
        type="button" 
        class="btn btn-primary" 
        @click="save" 
        :disabled="!isValid"
      >
        Enregistrer
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'ParticipantShareForm',
  props: {
    participant: {
      type: Object,
      required: true
    },
    currentShare: {
      type: Number,
      default: 0
    },
    deliveryPrice: {
      type: Number,
      required: true
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const sharePercentage = ref(props.currentShare);
    const sendNotification = ref(true);
    
    const getInitials = (name) => {
      if (!name) return '';
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();
    };
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
      }).format(amount);
    };
    
    const estimatedAmount = computed(() => {
      return (props.deliveryPrice * sharePercentage.value) / 100;
    });
    
    const isValid = computed(() => {
      return sharePercentage.value >= 0 && sharePercentage.value <= 100;
    });
    
    const save = () => {
      if (!isValid.value) return;
      
      emit('save', {
        participantId: props.participant.id,
        sharePercentage: sharePercentage.value,
        sendNotification: sendNotification.value
      });
    };
    
    const cancel = () => {
      emit('cancel');
    };
    
    return {
      sharePercentage,
      sendNotification,
      estimatedAmount,
      isValid,
      getInitials,
      formatCurrency,
      save,
      cancel
    };
  }
};
</script>

<style scoped>
.participant-share-form {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  flex: 1;
}

.input-group-append {
  display: flex;
  align-items: center;
}

.input-group-text {
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-left: none;
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.form-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
}

.participant-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-weight: 600;
}

.participant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  color: #6b7280;
  font-weight: 600;
}

.participant-details {
  flex: 1;
}

.participant-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.participant-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.star-icon {
  color: #f59e0b;
}

.estimated-amount {
  padding: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  font-size: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-primary:disabled {
  background-color: #6b7280;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>
