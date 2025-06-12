
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { TextInput, Button } from 'react-native-paper'
import { PaymentService } from '../../services/PaymentService'

interface PaymentMethod {
  id: string
  type: 'mobile_money' | 'card' | 'bank_account'
  provider: string
  masked_number: string
  is_default: boolean
  is_active: boolean
  expires_at?: string
}

interface PaymentMethodsScreenProps {
  navigation: any
}

const PaymentMethodsScreen = ({ navigation }: PaymentMethodsScreenProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMethodType, setNewMethodType] = useState<'mobile_money' | 'card'>('mobile_money')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [provider, setProvider] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      // const methods = await PaymentService.getPaymentMethods()
      // setPaymentMethods(methods)
      
      // Données de démonstration
      setPaymentMethods([
        {
          id: '1',
          type: 'mobile_money',
          provider: 'Orange Money',
          masked_number: '****4567',
          is_default: true,
          is_active: true
        },
        {
          id: '2',
          type: 'mobile_money',
          provider: 'MTN MoMo',
          masked_number: '****8901',
          is_default: false,
          is_active: true
        }
      ])
    } catch (error) {
      console.error('Erreur lors du chargement des méthodes de paiement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    if (!phoneNumber || !provider) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    setAdding(true)
    try {
      const newMethod = {
        type: newMethodType,
        provider,
        phone_number: phoneNumber
      }

      // await PaymentService.addPaymentMethod(newMethod)
      
      Alert.alert('Succès', 'Méthode de paiement ajoutée avec succès')
      setShowAddForm(false)
      setPhoneNumber('')
      setProvider('')
      loadPaymentMethods()
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la méthode de paiement')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleDefault = async (methodId: string) => {
    try {
      // await PaymentService.setDefaultPaymentMethod(methodId)
      loadPaymentMethods()
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier la méthode par défaut')
    }
  }

  const handleDeleteMethod = async (methodId: string) => {
    Alert.alert(
      'Supprimer la méthode de paiement',
      'Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // await PaymentService.deletePaymentMethod(methodId)
              loadPaymentMethods()
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la méthode de paiement')
            }
          }
        }
      ]
    )
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'orange money':
        return 'phone-portrait'
      case 'mtn momo':
        return 'phone-portrait'
      case 'visa':
        return 'card'
      case 'mastercard':
        return 'card'
      default:
        return 'wallet'
    }
  }

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={styles.methodInfo}>
          <View style={styles.methodIcon}>
            <Ionicons name={getProviderIcon(item.provider)} size={24} color="#007AFF" />
          </View>
          <View style={styles.methodDetails}>
            <Text style={styles.methodProvider}>{item.provider}</Text>
            <Text style={styles.methodNumber}>{item.masked_number}</Text>
            {item.is_default && (
              <Text style={styles.defaultBadge}>Par défaut</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMethod(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.methodActions}>
        <View style={styles.defaultToggle}>
          <Text style={styles.toggleLabel}>Méthode par défaut</Text>
          <Switch
            value={item.is_default}
            onValueChange={() => handleToggleDefault(item.id)}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={item.is_default ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  )

  const providers = [
    { label: 'Orange Money', value: 'Orange Money' },
    { label: 'MTN Mobile Money', value: 'MTN MoMo' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Méthodes de paiement</Text>
        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Ajouter une méthode de paiement</Text>
              
              <View style={styles.providerButtons}>
                {providers.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.providerButton,
                      provider === p.value && styles.selectedProvider
                    ]}
                    onPress={() => setProvider(p.value)}
                  >
                    <Text style={[
                      styles.providerButtonText,
                      provider === p.value && styles.selectedProviderText
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                label="Numéro de téléphone"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder="01 02 03 04 05"
              />

              <View style={styles.formActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddForm(false)}
                  style={styles.cancelButton}
                >
                  Annuler
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddPaymentMethod}
                  loading={adding}
                  disabled={adding}
                  style={styles.addButton}
                >
                  Ajouter
                </Button>
              </View>
            </View>
          )}

          <FlatList
            data={paymentMethods}
            renderItem={renderPaymentMethod}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  providerButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  selectedProvider: {
    backgroundColor: '#007AFF',
  },
  providerButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedProviderText: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#007AFF',
  },
  listContainer: {
    padding: 16,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodDetails: {
    flex: 1,
  },
  methodProvider: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  methodActions: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  defaultToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
  },
})

export default PaymentMethodsScreen
