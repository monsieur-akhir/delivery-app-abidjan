
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import CustomLoaderModal from './CustomLoaderModal';

interface MultiDestinationActionsProps {
  deliveryId: number;
  currentStatus: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onAccept?: () => void;
  onCounterOffer?: (price: number, message?: string) => void;
  canEdit?: boolean;
  canCancel?: boolean;
  canAccept?: boolean;
  canCounterOffer?: boolean;
  loading?: boolean;
}

const MultiDestinationActions: React.FC<MultiDestinationActionsProps> = ({
  deliveryId,
  currentStatus,
  onEdit,
  onCancel,
  onAccept,
  onCounterOffer,
  canEdit = false,
  canCancel = false,
  canAccept = false,
  canCounterOffer = false,
  loading = false,
}) => {
  const { colors } = useTheme();
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [counterOfferPrice, setCounterOfferPrice] = useState('');
  const [counterOfferMessage, setCounterOfferMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState('');

  const handleEdit = () => {
    if (onEdit) {
      setCurrentAction('Modification en cours...');
      setActionLoading(true);
      onEdit();
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler la livraison',
      'Êtes-vous sûr de vouloir annuler cette livraison ? Cette action est irréversible.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            if (onCancel) {
              setCurrentAction('Annulation en cours...');
              setActionLoading(true);
              onCancel();
            }
          },
        },
      ]
    );
  };

  const handleAccept = () => {
    Alert.alert(
      'Accepter la livraison',
      'Voulez-vous accepter cette livraison ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, accepter',
          onPress: () => {
            if (onAccept) {
              setCurrentAction('Acceptation en cours...');
              setActionLoading(true);
              onAccept();
            }
          },
        },
      ]
    );
  };

  const handleCounterOffer = () => {
    if (!counterOfferPrice.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un prix pour votre contre-offre');
      return;
    }

    const price = parseFloat(counterOfferPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un prix valide');
      return;
    }

    Alert.alert(
      'Confirmer la contre-offre',
      `Voulez-vous proposer ${price.toLocaleString()} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            if (onCounterOffer) {
              setCurrentAction('Envoi de la contre-offre...');
              setActionLoading(true);
              onCounterOffer(price, counterOfferMessage.trim() || undefined);
              setShowCounterOfferModal(false);
              setCounterOfferPrice('');
              setCounterOfferMessage('');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Actions disponibles</Text>

        <View style={styles.actionsContainer}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
              disabled={loading || actionLoading}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}

          {canAccept && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              disabled={loading || actionLoading}
            >
              <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Accepter</Text>
            </TouchableOpacity>
          )}

          {canCounterOffer && (
            <TouchableOpacity
              style={[styles.actionButton, styles.counterOfferButton]}
              onPress={() => setShowCounterOfferModal(true)}
              disabled={loading || actionLoading}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Contre-offre</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading || actionLoading}
            >
              <Ionicons name="close-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal de contre-offre */}
      <Modal
        visible={showCounterOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCounterOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Faire une contre-offre
              </Text>
              <TouchableOpacity
                onPress={() => setShowCounterOfferModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.label, { color: colors.text }]}>
                Prix proposé (FCFA) *
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Entrez votre prix"
                placeholderTextColor={colors.textSecondary}
                value={counterOfferPrice}
                onChangeText={setCounterOfferPrice}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: colors.text }]}>
                Message (optionnel)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.messageInput,
                  { borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Ajoutez un message pour expliquer votre offre"
                placeholderTextColor={colors.textSecondary}
                value={counterOfferMessage}
                onChangeText={setCounterOfferMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowCounterOfferModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleCounterOffer}
              >
                <Text style={styles.confirmModalButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loader personnalisé */}
      <CustomLoaderModal
        visible={actionLoading}
        title={currentAction}
        message="Veuillez patienter..."
        type="loading"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  counterOfferButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  messageInput: {
    height: 100,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmModalButton: {
    backgroundColor: '#2196F3',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmModalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MultiDestinationActions;
