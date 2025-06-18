import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { TextInput } from 'react-native-paper'
import { PaymentService } from '../../services/PaymentService'
import DeliveryService from '../../services/DeliveryService'

interface PaymentMethod {
  id: string
  name: string
  type: 'mobile_money' | 'card' | 'wallet'
  icon: string
  description: string
}

interface PaymentScreenProps {
  route: {
    params: {
      deliveryId: number
      amount: number
      description?: string
    }
  }
  navigation: any
}

const PaymentScreen = ({ route, navigation }: PaymentScreenProps) => {
  const { deliveryId, amount, description } = route.params
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number>(0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price)
  }

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'orange_money',
      name: 'Orange Money',
      type: 'mobile_money',
      icon: 'phone-portrait',
      description: 'Paiement via Orange Money'
    },
    {
      id: 'mtn_momo',
      name: 'MTN Mobile Money',
      type: 'mobile_money',
      icon: 'phone-portrait',
      description: 'Paiement via MTN MoMo'
    },
    {
      id: 'wallet',
      name: 'Mon Portefeuille',
      type: 'wallet',
      icon: 'wallet',
      description: `Solde disponible: ${formatPrice(walletBalance)} FCFA`
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      type: 'card',
      icon: 'card',
      description: 'Visa, Mastercard'
    }
  ]

  useEffect(() => {
    loadWalletBalance()
  }, [])

  const loadWalletBalance = async () => {
    try {
      // Charger le solde du portefeuille
      // const balance = await PaymentService.getWalletBalance()
      // setWalletBalance(balance)
      setWalletBalance(15000) // Valeur par défaut pour la démo
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error)
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement')
      return
    }

    if ((selectedMethod === 'orange_money' || selectedMethod === 'mtn_momo') && !phoneNumber) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone')
      return
    }

    if (selectedMethod === 'wallet' && walletBalance < amount) {
      Alert.alert('Solde insuffisant', 'Votre solde est insuffisant pour effectuer ce paiement')
      return
    }

    setProcessing(true)

    try {
      const paymentData = {
        delivery_id: deliveryId,
        amount,
        payment_method: selectedMethod,
        phone_number: phoneNumber || undefined,
        description: description || `Paiement pour livraison #${deliveryId}`
      }

      // Simulation du paiement
      await new Promise(resolve => setTimeout(resolve, 3000))

      // const result = await PaymentService.processPayment(paymentData)

      Alert.alert(
        'Paiement réussi',
        'Votre paiement a été traité avec succès!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PaymentSuccess', { 
              deliveryId,
              amount,
              paymentMethod: selectedMethod
            })
          }
        ]
      )
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
      Alert.alert('Erreur de paiement', 'Une erreur est survenue lors du traitement du paiement')
    } finally {
      setProcessing(false)
    }
  }

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        selectedMethod === method.id && styles.selectedPaymentMethod
      ]}
      onPress={() => setSelectedMethod(method.id)}
    >
      <View style={styles.paymentMethodContent}>
        <View style={styles.paymentMethodLeft}>
          <View style={[
            styles.paymentMethodIcon,
            selectedMethod === method.id && styles.selectedPaymentMethodIcon
          ]}>
            <Ionicons 
              name={method.icon as any} 
              size={24} 
              color={selectedMethod === method.id ? '#ffffff' : '#007AFF'} 
            />
          </View>
          <View style={styles.paymentMethodDetails}>
            <Text style={styles.paymentMethodName}>{method.name}</Text>
            <Text style={styles.paymentMethodDescription}>{method.description}</Text>
          </View>
        </View>

        {selectedMethod === method.id && (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant à payer</Text>
          <Text style={styles.amountValue}>{formatPrice(amount)} FCFA</Text>
          {description && (
            <Text style={styles.amountDescription}>{description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        {(selectedMethod === 'orange_money' || selectedMethod === 'mtn_momo') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
            <TextInput
              label="Numéro de téléphone"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="01 02 03 04 05"
              left={<TextInput.Icon icon="phone" />}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison #</Text>
              <Text style={styles.summaryValue}>{deliveryId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montant</Text>
              <Text style={styles.summaryValue}>{formatPrice(amount)} FCFA</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabelTotal}>Total</Text>
              <Text style={styles.summaryValueTotal}>{formatPrice(amount)} FCFA</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing || !selectedMethod}
        >
          {processing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="#ffffff" />
              <Text style={styles.payButtonText}>
                Payer {formatPrice(amount)} FCFA
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  amountDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPaymentMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedPaymentMethodIcon: {
    backgroundColor: '#007AFF',
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  payButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
})

export default PaymentScreen