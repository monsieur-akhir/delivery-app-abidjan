
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScheduledDeliveryService from '../services/ScheduledDeliveryService';

interface NegotiationModalProps {
  visible: boolean;
  onClose: () => void;
  scheduleId: number;
  currentPrice: number;
  onSuccess: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  visible,
  onClose,
  scheduleId,
  currentPrice,
  onSuccess
}) => {
  const [proposedPrice, setProposedPrice] = useState(currentPrice.toString());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNegotiate = async () => {
    const price = parseFloat(proposedPrice);
    
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un prix valide');
      return;
    }

    setLoading(true);
    try {
      await ScheduledDeliveryService.negotiateScheduledDelivery(
        scheduleId,
        price,
        message
      );
      
      Alert.alert(
        'Succès', 
        'Votre proposition a été envoyée au client',
        [{ text: 'OK', onPress: onSuccess }]
      );
      
      onClose();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await ScheduledDeliveryService.acceptScheduledDelivery(scheduleId);
      
      Alert.alert(
        'Succès', 
        'Livraison acceptée avec succès',
        [{ text: 'OK', onPress: onSuccess }]
      );
      
      onClose();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Refuser la livraison',
      'Voulez-vous vraiment refuser cette livraison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await ScheduledDeliveryService.rejectScheduledDelivery(
                scheduleId,
                'Prix non acceptable'
              );
              
              Alert.alert(
                'Succès', 
                'Livraison refusée',
                [{ text: 'OK', onPress: onSuccess }]
              );
              
              onClose();
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Négociation</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.currentPrice}>
              Prix actuel: {currentPrice}€
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Votre proposition (€)</Text>
              <TextInput
                style={styles.input}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                placeholder="Prix proposé"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Expliquez votre proposition..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={handleAccept}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Accepter</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.negotiateButton]}
                onPress={handleNegotiate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Négocier</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Refuser</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    gap: 20,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  negotiateButton: {
    backgroundColor: '#007AFF',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NegotiationModal;
