import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { Text, TextInput, Button, Card, RadioButton, Surface, IconButton } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { formatPrice } from '../../utils/formatters'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'
import CustomAlert from '../../components/CustomAlert'
import CustomToast from '../../components/CustomToast'
import { useAlert } from '../../hooks/useAlert'

type AddFundsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddFunds'>
}

interface PaymentMethod {
  id: string
  type: 'mobile_money' | 'card' | 'bank_transfer'
  name: string
  icon: string
  fee_percentage: number
  min_amount: number
  max_amount: number
}

const AddFundsScreen: React.FC<AddFundsScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { showErrorAlert, showConfirmationAlert } = useAlert()
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)

  const quickAmounts = [1000, 2500, 5000, 10000, 20000, 50000]

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payments/methods`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setPaymentMethods(data)
      if (data.length > 0) {
        setSelectedMethod(data[0].id)
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
    }
  }

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showErrorAlert('Erreur', 'Veuillez saisir un montant valide')
      return
    }

    if (!selectedMethod) {
      showErrorAlert('Erreur', 'Veuillez sélectionner une méthode de paiement')
      return
    }

    const selectedMethodObj = paymentMethods.find(m => m.id === selectedMethod)
    if (!selectedMethodObj) return

    const amountValue = parseFloat(amount)
    if (amountValue < selectedMethodObj.min_amount) {
      Alert.alert('Erreur', `Le montant minimum est de ${formatPrice(selectedMethodObj.min_amount)} F`)
      return
    }

    if (amountValue > selectedMethodObj.max_amount) {
      Alert.alert('Erreur', `Le montant maximum est de ${formatPrice(selectedMethodObj.max_amount)} F`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payments/add-funds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountValue,
          payment_method_id: selectedMethod
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.payment_url) {
          // Redirect to payment page
          navigation.navigate('WebPayment', {
            paymentUrl: data.payment_url,
            transactionId: data.transaction_id,
            onComplete: (success: boolean) => {
              if (success) {
                showConfirmationAlert(
                  'Succès', 
                  'Fonds ajoutés avec succès',
                  () => navigation.goBack()
                )
              } else {
                showErrorAlert('Erreur', 'Le paiement a échoué')
              }
            }
          })
        } else {
          showConfirmationAlert(
            'Succès', 
            'Fonds ajoutés avec succès',
            () => navigation.goBack()
          )
        }
      } else {
        throw new Error('Erreur lors de l\'ajout de fonds')
      }
    } catch (error) {
      console.error('Error adding funds:', error)
      Alert.alert('Erreur', 'Impossible d\'ajouter les fonds')
    } finally {
      setLoading(false)
    }
  }

  const calculateFee = (amount: number, method: PaymentMethod) => {
    return (amount * method.fee_percentage) / 100
  }

  const selectedMethodObj = paymentMethods.find(m => m.id === selectedMethod)
  const amountValue = parseFloat(amount) || 0
  const fee = selectedMethodObj ? calculateFee(amountValue, selectedMethodObj) : 0
  const total = amountValue + fee

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" iconColor="#212121" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter des fonds</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Amount Input */}
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Montant à ajouter</Text>
          <TextInput
            label="Montant (FCFA)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            right={<TextInput.Affix text="F" />}
          />

          {/* Quick Amount Buttons */}
          <Text style={styles.quickAmountsLabel}>Montants rapides</Text>
          <View style={styles.quickAmountsGrid}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.selectedQuickAmount
                ]}
                onPress={() => setAmount(quickAmount.toString())}
              >
                <Text style={[
                  styles.quickAmountText,
                  amount === quickAmount.toString() && styles.selectedQuickAmountText
                ]}>
                  {formatPrice(quickAmount)} F
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        {/* Payment Methods */}
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>
          <RadioButton.Group
            onValueChange={setSelectedMethod}
            value={selectedMethod}
          >
            {paymentMethods.map((method) => (
              <Card key={method.id} style={styles.paymentMethodCard}>
                <TouchableOpacity
                  style={styles.paymentMethodContent}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.paymentMethodLeft}>
                    <Feather name={method.icon as any} size={24} color="#FF6B00" />
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      <Text style={styles.paymentMethodFee}>
                        Frais: {method.fee_percentage}% • Min: {formatPrice(method.min_amount)} F
                      </Text>
                    </View>
                  </View>
                  <RadioButton value={method.id} />
                </TouchableOpacity>
              </Card>
            ))}
          </RadioButton.Group>
        </Surface>

        {/* Summary */}
        {amountValue > 0 && selectedMethodObj && (
          <Surface style={styles.section}>
            <Text style={styles.sectionTitle}>Récapitulatif</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Montant</Text>
              <Text style={styles.summaryValue}>{formatPrice(amountValue)} F</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de transaction</Text>
              <Text style={styles.summaryValue}>{formatPrice(fee)} F</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalValue}>{formatPrice(total)} F</Text>
            </View>
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleAddFunds}
          loading={loading}
          disabled={loading || !amount || !selectedMethod}
          style={styles.addButton}
        >
          Ajouter les fonds
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedQuickAmount: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF3E0',
  },
  quickAmountText: {
    fontSize: 14,
    color: '#212121',
  },
  selectedQuickAmountText: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  paymentMethodCard: {
    marginBottom: 8,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  paymentMethodFee: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 14,
    color: '#212121',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  addButton: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#FF6B00',
  },
})

export default AddFundsScreen
